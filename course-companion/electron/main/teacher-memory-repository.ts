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

const currentPracticeIds = new Set(['m1-codex-safe-setup', 'm2-planning-package'])

export function practiceSummaryKey(practiceId: string, practiceVersion: string): string {
  return `${practiceId}@${practiceVersion}`
}

function inferredPracticeVersion(practiceId: string): string {
  return currentPracticeIds.has(practiceId) ? '2.0.0' : 'historical'
}

function normalizeSummary(value: unknown): PracticeRunSummary | null {
  const item = record(value)
  if (!item || typeof item.practiceId !== 'string') return null
  const normalized = {
    ...item,
    practiceVersion: typeof item.practiceVersion === 'string'
      ? item.practiceVersion
      : inferredPracticeVersion(item.practiceId)
  }
  return isPracticeRunSummary(normalized) ? normalized : null
}

export function isPracticeRunSummary(value: unknown): value is PracticeRunSummary {
  const item = record(value)
  if (!item || item.schemaVersion !== 1) return false
  if (typeof item.practiceId !== 'string' || typeof item.practiceVersion !== 'string' || typeof item.runId !== 'string') return false
  if (item.practiceVersion.length < 1 || item.practiceVersion.length > 40) return false
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
    archivedPracticeSummaries: {},
    updatedAt: now().toISOString()
  }
}

function normalizeMemory(value: unknown): TeacherMemoryDocument | null {
  const item = record(value)
  if (!item || item.schemaVersion !== 1 || !strings(item.learnerDecisions)) return null
  if (!Array.isArray(item.learningSignals) || !item.learningSignals.every(isSignal)) return null
  if (!Array.isArray(item.unresolvedNeeds) || !item.unresolvedNeeds.every(isSignal)) return null
  if (typeof item.updatedAt !== 'string' || Number.isNaN(Date.parse(item.updatedAt))) return null
  const summaries = record(item.practiceSummaries)
  const archived = item.archivedPracticeSummaries === undefined
    ? {}
    : record(item.archivedPracticeSummaries)
  if (!summaries || !archived) return null
  const practiceSummaries: Record<string, PracticeRunSummary[]> = {}
  const archivedPracticeSummaries: Record<string, PracticeRunSummary[]> = {}
  for (const entries of [...Object.values(summaries), ...Object.values(archived)]) {
    if (!Array.isArray(entries) || entries.length > 50) return null
    for (const value of entries) {
      const summary = normalizeSummary(value)
      if (!summary) return null
      const target = currentPracticeIds.has(summary.practiceId)
        ? practiceSummaries
        : archivedPracticeSummaries
      const key = practiceSummaryKey(summary.practiceId, summary.practiceVersion)
      const current = target[key] ?? []
      target[key] = [...current.filter((entry) => entry.runId !== summary.runId), summary].slice(-50)
    }
  }
  const archivedEntries = Object.values(archivedPracticeSummaries).flat()
  const archivedRunIds = new Set(archivedEntries.map((summary) => summary.runId))
  const archivedDecisions = new Set(archivedEntries.flatMap((summary) => summary.learnerDecisions))
  return {
    schemaVersion: 1,
    learnerDecisions: item.learnerDecisions.filter((decision) => !archivedDecisions.has(decision)),
    learningSignals: structuredClone(item.learningSignals.filter((signal) => !archivedRunIds.has(signal.sourceRunId))),
    unresolvedNeeds: structuredClone(item.unresolvedNeeds.filter((signal) => !archivedRunIds.has(signal.sourceRunId))),
    practiceSummaries,
    archivedPracticeSummaries,
    updatedAt: item.updatedAt
  }
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
      const key = practiceSummaryKey(summary.practiceId, summary.practiceVersion)
      const target = currentPracticeIds.has(summary.practiceId)
        ? memory.practiceSummaries
        : memory.archivedPracticeSummaries
      const current = target[key] ?? []
      const summaries = [...current.filter((entry) => entry.runId !== summary.runId), structuredClone(summary)].slice(-50)
      target[key] = summaries
      if (currentPracticeIds.has(summary.practiceId)) {
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
      }
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
      const normalized = normalizeMemory(parsed)
      if (normalized) {
        if (JSON.stringify(parsed) !== JSON.stringify(normalized)) await this.write(normalized)
        return structuredClone(normalized)
      }
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
