import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type {
  PracticeGuideStateIdentity,
  PracticeGuideStateRecord,
  PracticeGuideStatus
} from '../../shared/contracts'

type StateDocument = { schemaVersion: 1; records: PracticeGuideStateRecord[] }

const ID = /^[A-Za-z0-9_-]{1,160}$/
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/
const statuses = new Set<PracticeGuideStatus>([
  'not-started', 'in-progress', 'paused', 'skipped', 'completed'
])

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function iso(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function validIdentity(value: PracticeGuideStateIdentity): boolean {
  return ID.test(value.guideId) && VERSION.test(value.guideVersion)
    && ID.test(value.courseRunId) && ID.test(value.practiceId) && ID.test(value.practiceRunId)
}

function validRecord(value: unknown): value is PracticeGuideStateRecord {
  const item = record(value)
  return Boolean(item && item.schemaVersion === 1
    && ID.test(String(item.guideId)) && VERSION.test(String(item.guideVersion))
    && ID.test(String(item.courseRunId)) && ID.test(String(item.practiceId))
    && ID.test(String(item.practiceRunId)) && statuses.has(item.status as PracticeGuideStatus)
    && ID.test(String(item.lastStageId))
    && (item.masteryConfirmation === null || item.masteryConfirmation === 'pending' || item.masteryConfirmation === 'dismissed')
    && iso(item.createdAt) && iso(item.updatedAt))
}

function empty(): StateDocument {
  return { schemaVersion: 1, records: [] }
}

export class PracticeGuideStateRepository {
  private readonly statePath: string
  private readonly temporaryPath: string
  private readonly corruptPath: string
  private queue: Promise<void> = Promise.resolve()

  constructor(private readonly directory: string, private readonly now: () => Date = () => new Date()) {
    this.statePath = join(directory, 'practice-guide-state.json')
    this.temporaryPath = join(directory, 'practice-guide-state.tmp.json')
    this.corruptPath = join(directory, 'practice-guide-state.corrupt.json')
  }

  private async document(): Promise<StateDocument> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.statePath, 'utf8'))
      const input = record(parsed)
      if (!input || input.schemaVersion !== 1 || !Array.isArray(input.records)
        || input.records.length > 100 || !input.records.every(validRecord)) throw new Error('invalid')
      return structuredClone(parsed as StateDocument)
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return empty()
      await rm(this.corruptPath, { force: true }).catch(() => undefined)
      await rename(this.statePath, this.corruptPath).catch(() => undefined)
      return empty()
    }
  }

  private async save(document: StateDocument): Promise<void> {
    await mkdir(this.directory, { recursive: true })
    await writeFile(this.temporaryPath, JSON.stringify(document, null, 2) + '\n', 'utf8')
    await rename(this.temporaryPath, this.statePath)
  }

  private operation<T>(work: () => Promise<T>): Promise<T> {
    const result = this.queue.then(work, work)
    this.queue = result.then(() => undefined, () => undefined)
    return result
  }

  async load(courseRunId: string, guideId: string): Promise<PracticeGuideStateRecord | null> {
    await this.queue
    const current = (await this.document()).records.find((item) =>
      item.courseRunId === courseRunId && item.guideId === guideId)
    return current ? structuredClone(current) : null
  }

  async start(identity: PracticeGuideStateIdentity, stageId: string): Promise<PracticeGuideStateRecord> {
    return this.operation(async () => {
      if (!validIdentity(identity) || !ID.test(stageId)) throw new Error('Invalid Practice guide identity')
      const document = await this.document()
      const existing = document.records.find((item) =>
        item.courseRunId === identity.courseRunId && item.guideId === identity.guideId)
      if (existing) return structuredClone(existing)
      const timestamp = this.now().toISOString()
      const created: PracticeGuideStateRecord = {
        schemaVersion: 1, ...identity, status: 'in-progress', lastStageId: stageId,
        masteryConfirmation: null, createdAt: timestamp, updatedAt: timestamp
      }
      document.records.push(created)
      await this.save(document)
      return structuredClone(created)
    })
  }

  private async transition(
    identity: PracticeGuideStateIdentity,
    expectedStageId: string | null,
    update: (current: PracticeGuideStateRecord) => PracticeGuideStateRecord
  ): Promise<PracticeGuideStateRecord> {
    return this.operation(async () => {
      const document = await this.document()
      const index = document.records.findIndex((item) =>
        item.courseRunId === identity.courseRunId && item.guideId === identity.guideId)
      const current = document.records[index]
      if (!current || current.practiceRunId !== identity.practiceRunId
        || current.practiceId !== identity.practiceId) throw new Error('Practice guide identity mismatch')
      if (expectedStageId !== null && current.lastStageId !== expectedStageId) return structuredClone(current)
      const next = update(current)
      document.records[index] = next
      await this.save(document)
      return structuredClone(next)
    })
  }

  advance(identity: PracticeGuideStateIdentity, expected: string, next: string): Promise<PracticeGuideStateRecord> {
    if (!ID.test(next)) return Promise.reject(new Error('Invalid Practice guide stage'))
    return this.transition(identity, expected, (current) => ({
      ...current, status: 'in-progress', lastStageId: next, updatedAt: this.now().toISOString()
    }))
  }

  pause(identity: PracticeGuideStateIdentity, expected: string): Promise<PracticeGuideStateRecord> {
    return this.transition(identity, expected, (current) => ({
      ...current, status: 'paused', updatedAt: this.now().toISOString()
    }))
  }

  resume(identity: PracticeGuideStateIdentity): Promise<PracticeGuideStateRecord> {
    return this.transition(identity, null, (current) => ({
      ...current, status: current.status === 'paused' ? 'in-progress' : current.status,
      updatedAt: this.now().toISOString()
    }))
  }

  skip(identity: PracticeGuideStateIdentity, expected: string): Promise<PracticeGuideStateRecord> {
    return this.transition(identity, expected, (current) => ({
      ...current, status: 'skipped', updatedAt: this.now().toISOString()
    }))
  }

  complete(identity: PracticeGuideStateIdentity, expected: string): Promise<PracticeGuideStateRecord> {
    return this.transition(identity, expected, (current) => ({
      ...current, status: 'completed', masteryConfirmation: 'pending',
      updatedAt: this.now().toISOString()
    }))
  }

  dismissConfirmation(identity: PracticeGuideStateIdentity): Promise<PracticeGuideStateRecord> {
    return this.transition(identity, null, (current) => ({
      ...current, masteryConfirmation: current.status === 'completed' ? 'dismissed' : current.masteryConfirmation,
      updatedAt: this.now().toISOString()
    }))
  }

  async reset(): Promise<void> {
    await this.operation(async () => {
      await Promise.all([
        rm(this.statePath, { force: true }), rm(this.temporaryPath, { force: true }), rm(this.corruptPath, { force: true })
      ])
    })
  }
}
