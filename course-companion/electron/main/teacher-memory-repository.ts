import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type {
  PracticeLearningSignal,
  PracticeRunSummary,
  TeacherMemoryDocument
} from '../../shared/contracts'

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function strings(value: unknown, maximum = 100): value is string[] {
  return Array.isArray(value) && value.length <= maximum && value.every((item) => typeof item === 'string' && item.length <= 4_000)
}

function isSignal(value: unknown): value is PracticeLearningSignal {
  const item = record(value)
  return Boolean(item && typeof item.text === 'string' && item.text.length <= 2_000 && (item.basis === 'observed' || item.basis === 'inferred') && typeof item.sourceRunId === 'string')
}

export function isPracticeRunSummary(value: unknown): value is PracticeRunSummary {
  const item = record(value)
  if (!item || item.schemaVersion !== 1) return false
  if (typeof item.practiceId !== 'string' || typeof item.runId !== 'string') return false
  if (!Number.isSafeInteger(item.attempt) || Number(item.attempt) < 1) return false
  if (!['completed', 'replaced', 'abandoned', 'error'].includes(String(item.outcome))) return false
  if (typeof item.objective !== 'string' || typeof item.approach !== 'string') return false
  if (!strings(item.learnerDecisions) || !strings(item.approvals) || !strings(item.changedFiles)) return false
  if (!strings(item.verificationEvidence) || !strings(item.unresolvedIssues) || !strings(item.nextAttemptGuidance)) return false
  if (!Array.isArray(item.learningSignals) || !item.learningSignals.every(isSignal)) return false
  if (![item.startedAt, item.endedAt, item.summarizedAt].every((date) => typeof date === 'string' && !Number.isNaN(Date.parse(date)))) return false
  if (typeof item.sourceDigest !== 'string' || typeof item.model !== 'string') return false
  if (item.freshness !== 'current' && item.freshness !== 'stale') return false
  return item.quality === 'live' || item.quality === 'pending-refinement'
}

export function emptyTeacherMemory(now = () => new Date()): TeacherMemoryDocument {
  return {
    schemaVersion: 1,
    learnerDecisions: [],
    learningSignals: [],
    unresolvedNeeds: [],
    practiceSummaries: {},
    updatedAt: now().toISOString()
  }
}

function isMemory(value: unknown): value is TeacherMemoryDocument {
  const item = record(value)
  if (!item || item.schemaVersion !== 1 || !strings(item.learnerDecisions)) return false
  if (!Array.isArray(item.learningSignals) || !item.learningSignals.every(isSignal)) return false
  if (!Array.isArray(item.unresolvedNeeds) || !item.unresolvedNeeds.every(isSignal)) return false
  const summaries = record(item.practiceSummaries)
  if (!summaries || !Object.values(summaries).every((entries) => Array.isArray(entries) && entries.length <= 50 && entries.every(isPracticeRunSummary))) return false
  return typeof item.updatedAt === 'string' && !Number.isNaN(Date.parse(item.updatedAt))
}

export class TeacherMemoryRepository {
  private readonly statePath: string
  private readonly temporaryPath: string
  private readonly corruptPath: string
  private queue: Promise<void> = Promise.resolve()

  constructor(private readonly dataDirectory: string, private readonly now: () => Date = () => new Date()) {
    this.statePath = join(dataDirectory, 'teacher-memory.json')
    this.temporaryPath = join(dataDirectory, 'teacher-memory.json.tmp')
    this.corruptPath = join(dataDirectory, 'teacher-memory.corrupt.json')
  }

  load(): Promise<TeacherMemoryDocument> {
    return this.runExclusive(() => this.loadDirect())
  }

  upsertSummary(summary: PracticeRunSummary): Promise<TeacherMemoryDocument> {
    if (!isPracticeRunSummary(summary)) return Promise.reject(new Error('Invalid Practice run summary'))
    return this.runExclusive(async () => {
      const memory = await this.loadDirect()
      const current = memory.practiceSummaries[summary.practiceId] ?? []
      const summaries = [...current.filter((entry) => entry.runId !== summary.runId), structuredClone(summary)].slice(-50)
      memory.practiceSummaries[summary.practiceId] = summaries
      memory.learnerDecisions = [...new Set([...memory.learnerDecisions, ...summary.learnerDecisions])].slice(-100)
      memory.learningSignals = mergeSignals(
        memory.learningSignals.filter((signal) => signal.sourceRunId !== summary.runId),
        summary.learningSignals
      )
      const unresolved = summary.unresolvedIssues.map((text) => ({ text, basis: 'observed' as const, sourceRunId: summary.runId }))
      memory.unresolvedNeeds = mergeSignals(
        memory.unresolvedNeeds.filter((signal) => signal.sourceRunId !== summary.runId),
        unresolved
      )
      memory.updatedAt = this.now().toISOString()
      await this.write(memory)
      return structuredClone(memory)
    })
  }

  hasPending(memory: TeacherMemoryDocument): boolean {
    return Object.values(memory.practiceSummaries).flat().some((summary) => summary.quality === 'pending-refinement')
  }

  reset(): Promise<void> {
    return this.runExclusive(async () => {
      await Promise.all([
        rm(this.statePath, { force: true }),
        rm(this.temporaryPath, { force: true }),
        rm(this.corruptPath, { force: true })
      ])
    })
  }

  private async loadDirect(): Promise<TeacherMemoryDocument> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.statePath, 'utf8'))
      if (isMemory(parsed)) return structuredClone(parsed)
      await this.quarantine()
    } catch (error) {
      if (record(error)?.code !== 'ENOENT') await this.quarantine()
    }
    return emptyTeacherMemory(this.now)
  }

  private async write(memory: TeacherMemoryDocument): Promise<void> {
    await mkdir(this.dataDirectory, { recursive: true })
    await writeFile(this.temporaryPath, `${JSON.stringify(memory, null, 2)}\n`, 'utf8')
    await rename(this.temporaryPath, this.statePath)
  }

  private async quarantine(): Promise<void> {
    await mkdir(this.dataDirectory, { recursive: true })
    await rm(this.corruptPath, { force: true })
    await rename(this.statePath, this.corruptPath).catch(() => undefined)
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation, operation)
    this.queue = result.then(() => undefined, () => undefined)
    return result
  }
}

function mergeSignals(current: PracticeLearningSignal[], additions: PracticeLearningSignal[]): PracticeLearningSignal[] {
  const keyed = new Map(current.map((signal) => [`${signal.sourceRunId}:${signal.text}`, signal]))
  for (const signal of additions) keyed.set(`${signal.sourceRunId}:${signal.text}`, structuredClone(signal))
  return [...keyed.values()].slice(-100)
}
