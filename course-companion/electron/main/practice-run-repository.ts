import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PracticeChecklistStep, PracticePanel } from '../../shared/contracts'
import type {
  PracticeCompletionReceipt,
  PracticeReviewResult
} from '../../shared/contracts'

export type ExecutorChatBinding = {
  runId: string
  threadId: string
  name: string
  workspaceRoot: string
  createdAt: string
}

export type PracticeRunRecord = {
  runId: string
  generation: number
  status: 'active'
  binding: ExecutorChatBinding
  startedAt: string
  updatedAt: string
  checklist: PracticeChecklistStep[]
  practiceId?: string
  practiceVersion?: string
  reviewStatus?: 'not-reviewed' | 'reviewing' | 'needs-work' | 'passed'
  reviewResult?: PracticeReviewResult
  completion?: PracticeCompletionReceipt
}

export type ArchivedPracticeReceipt = {
  runId: string
  generation: number
  threadId: string
  name: string
  archivedAt: string
}

export type PracticeTransitionRecord = {
  transitionId: string
  sourceRunId: string | null
  targetRunId: string
  stage: 'creating-target' | 'target-created'
  targetBinding?: ExecutorChatBinding
  startedAt: string
}

export type PracticeWorkspaceRecord = {
  schemaVersion: 1
  activeRun: PracticeRunRecord | null
  archivedRuns: ArchivedPracticeReceipt[]
  pendingTransition: PracticeTransitionRecord | null
  presentation: {
    fullPanel: PracticePanel
    compactPanel: PracticePanel
  }
}

const ID = /^[A-Za-z0-9_-]{1,160}$/
const THREAD_ID = /^[A-Za-z0-9_-]{1,160}$/
const STEP_STATUSES = new Set(['completed', 'current', 'upcoming'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIso(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    return new Date(value).toISOString() === value
  } catch {
    return false
  }
}

function isPanel(value: unknown): value is PracticePanel {
  return value === 'teacher' || value === 'progress'
}

function isBinding(value: unknown): value is ExecutorChatBinding {
  if (!isRecord(value)) return false
  return (
    ID.test(String(value.runId)) &&
    THREAD_ID.test(String(value.threadId)) &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    value.name.length <= 500 &&
    typeof value.workspaceRoot === 'string' &&
    value.workspaceRoot.length > 0 &&
    isIso(value.createdAt)
  )
}

function isChecklist(value: unknown): value is PracticeChecklistStep[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > 20) return false
  let current = 0
  const ids = new Set<string>()
  for (const step of value) {
    if (!isRecord(step) || !ID.test(String(step.id)) || ids.has(String(step.id))) return false
    if (typeof step.title !== 'string' || step.title.length < 1 || step.title.length > 300) return false
    if (!STEP_STATUSES.has(String(step.status))) return false
    if (step.status === 'current') current += 1
    ids.add(String(step.id))
  }
  return current <= 1
}
function isReviewResult(value: unknown): value is PracticeReviewResult {
  if (!isRecord(value)) return false
  return value.schemaVersion === 1
    && ID.test(String(value.practiceId))
    && typeof value.practiceVersion === 'string'
    && ID.test(String(value.runId))
    && (value.verdict === 'needs-work' || value.verdict === 'passed')
    && Array.isArray(value.criteria)
    && typeof value.summary === 'string'
    && value.summary.length <= 1500
    && isIso(value.reviewedAt)
    && /^[a-f0-9]{64}$/.test(String(value.sourceDigest))
}

function isCompletion(value: unknown): value is PracticeCompletionReceipt {
  if (!isRecord(value)) return false
  const destination = isRecord(value.destination) ? value.destination : null
  return value.schemaVersion === 1
    && ID.test(String(value.courseRunId))
    && ID.test(String(value.practiceId))
    && typeof value.practiceVersion === 'string'
    && ID.test(String(value.runId))
    && typeof value.checkpointId === 'string'
    && value.status === 'completed'
    && isIso(value.completedAt)
    && typeof value.evidenceSummary === 'string'
    && typeof value.masterySummary === 'string'
    && Boolean(destination)
}

function isRun(value: unknown): value is PracticeRunRecord {
  if (!isRecord(value)) return false
  return (
    ID.test(String(value.runId)) &&
    Number.isSafeInteger(value.generation) &&
    Number(value.generation) > 0 &&
    value.status === 'active' &&
    isBinding(value.binding) &&
    value.binding.runId === value.runId &&
    isIso(value.startedAt) &&
    isIso(value.updatedAt) &&
    (value.practiceId === undefined || ID.test(String(value.practiceId))) &&
    (value.practiceVersion === undefined
      || (typeof value.practiceVersion === 'string' && value.practiceVersion.length <= 40)) &&
    (value.reviewStatus === undefined
      || ['not-reviewed', 'reviewing', 'needs-work', 'passed'].includes(String(value.reviewStatus))) &&
    (value.reviewResult === undefined || isReviewResult(value.reviewResult)) &&
    (value.completion === undefined || isCompletion(value.completion)) &&
    (value.reviewResult === undefined || (
      value.practiceId === value.reviewResult.practiceId
      && value.practiceVersion === value.reviewResult.practiceVersion
      && value.runId === value.reviewResult.runId
    )) &&
    (value.completion === undefined || (
      value.practiceId === value.completion.practiceId
      && value.practiceVersion === value.completion.practiceVersion
      && value.runId === value.completion.runId
    )) &&
    isChecklist(value.checklist)
  )
}

function isArchive(value: unknown): value is ArchivedPracticeReceipt {
  if (!isRecord(value)) return false
  return (
    ID.test(String(value.runId)) &&
    Number.isSafeInteger(value.generation) &&
    Number(value.generation) > 0 &&
    THREAD_ID.test(String(value.threadId)) &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    value.name.length <= 500 &&
    isIso(value.archivedAt)
  )
}

function isTransition(value: unknown): value is PracticeTransitionRecord {
  if (!isRecord(value)) return false
  if (!ID.test(String(value.transitionId)) || !ID.test(String(value.targetRunId))) return false
  if (value.sourceRunId !== null && !ID.test(String(value.sourceRunId))) return false
  if (!['creating-target', 'target-created'].includes(String(value.stage))) return false
  if (!isIso(value.startedAt)) return false
  return value.stage === 'target-created'
    ? isBinding(value.targetBinding) && value.targetBinding.runId === value.targetRunId
    : value.targetBinding === undefined
}

export function defaultPracticeWorkspaceRecord(): PracticeWorkspaceRecord {
  return {
    schemaVersion: 1,
    activeRun: null,
    archivedRuns: [],
    pendingTransition: null,
    presentation: { fullPanel: 'teacher', compactPanel: 'teacher' }
  }
}

function normalizeWorkspaceRecord(record: PracticeWorkspaceRecord, recoverInterruptedReview: boolean): PracticeWorkspaceRecord {
  if (!record.activeRun) return record
  const active = record.activeRun
  const reviewStatus = recoverInterruptedReview && active.reviewStatus === 'reviewing'
    ? active.reviewResult?.verdict ?? 'not-reviewed'
    : active.reviewStatus ?? active.reviewResult?.verdict ?? 'not-reviewed'
  return {
    ...record,
    activeRun: {
      ...active,
      practiceId: active.practiceId ?? 'm1-verifiable-brief',
      practiceVersion: active.practiceVersion ?? '1.0.0',
      reviewStatus
    }
  }
}

export function isPracticeWorkspaceRecord(value: unknown): value is PracticeWorkspaceRecord {
  if (!isRecord(value) || value.schemaVersion !== 1) return false
  if (value.activeRun !== null && !isRun(value.activeRun)) return false
  if (!Array.isArray(value.archivedRuns) || !value.archivedRuns.every(isArchive)) return false
  if (value.archivedRuns.length > 100) return false
  if (value.pendingTransition !== null && !isTransition(value.pendingTransition)) return false
  if (!isRecord(value.presentation)) return false
  if (!isPanel(value.presentation.fullPanel) || !isPanel(value.presentation.compactPanel)) return false
  if (
    value.pendingTransition &&
    value.pendingTransition.sourceRunId !== (value.activeRun?.runId ?? null)
  ) {
    return false
  }
  return true
}

export class PracticeRunRepository {
  private readonly statePath: string
  private readonly temporaryPath: string
  private readonly corruptPath: string
  private queue: Promise<void> = Promise.resolve()
  private initialized = false

  constructor(private readonly dataDirectory: string) {
    this.statePath = join(dataDirectory, 'practice-runs.json')
    this.temporaryPath = join(dataDirectory, 'practice-runs.json.tmp')
    this.corruptPath = join(dataDirectory, 'practice-runs.corrupt.json')
  }

  load(): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(() => this.loadDirect())
  }

  save(record: PracticeWorkspaceRecord): Promise<PracticeWorkspaceRecord> {
    if (!isPracticeWorkspaceRecord(record)) {
      return Promise.reject(new Error('Invalid Practice workspace record'))
    }
    return this.runExclusive(() => this.saveDirect(record))
  }

  selectPanel(surface: 'full' | 'compact', panel: PracticePanel): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const presentation = surface === 'full'
        ? { ...record.presentation, fullPanel: panel }
        : { ...record.presentation, compactPanel: panel }
      return this.saveDirect({
        ...record,
        presentation
      })
    })
  }

  advanceChecklist(
    runId: string,
    currentStepId: 'build-and-verify' | 'review-evidence',
    updatedAt: string
  ): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      if (!record.activeRun || record.activeRun.runId !== runId) return record
      const targetIndex = record.activeRun.checklist.findIndex((step) => step.id === currentStepId)
      const currentIndex = record.activeRun.checklist.findIndex((step) => step.status === 'current')
      if (targetIndex < 0 || currentIndex < 0 || currentIndex >= targetIndex) return record
      const checklist = record.activeRun.checklist.map((step, index) => ({
        ...step,
        status: index < targetIndex ? 'completed' as const : index === targetIndex ? 'current' as const : 'upcoming' as const
      }))
      return this.saveDirect({
        ...record,
        activeRun: { ...record.activeRun, checklist, updatedAt }
      })
    })
  }

  beginReview(input: {
    runId: string
    generation: number
    practiceId: string
    practiceVersion: string
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const active = record.activeRun
      if (!active
        || active.runId !== input.runId
        || active.generation !== input.generation
        || active.practiceId !== input.practiceId
        || active.practiceVersion !== input.practiceVersion) return record
      return this.saveDirect({
        ...record,
        activeRun: {
          ...active,
          reviewStatus: 'reviewing',
          updatedAt: input.updatedAt
        }
      })
    })
  }

  clearReviewing(input: {
    runId: string
    generation: number
    practiceId: string
    practiceVersion: string
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const active = record.activeRun
      if (!active
        || active.runId !== input.runId
        || active.generation !== input.generation
        || active.practiceId !== input.practiceId
        || active.practiceVersion !== input.practiceVersion
        || active.reviewStatus !== 'reviewing') return record
      return this.saveDirect({
        ...record,
        activeRun: {
          ...active,
          reviewStatus: active.reviewResult?.verdict ?? 'not-reviewed',
          updatedAt: input.updatedAt
        }
      })
    })
  }

  saveReview(input: {
    runId: string
    generation: number
    practiceId: string
    practiceVersion: string
    result: PracticeReviewResult
    checklist: PracticeChecklistStep[]
    completion?: PracticeCompletionReceipt
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      const active = record.activeRun
      if (!active
        || active.runId !== input.runId
        || active.generation !== input.generation
        || (active.practiceId !== undefined && active.practiceId !== input.practiceId)
        || (active.practiceVersion !== undefined && active.practiceVersion !== input.practiceVersion)) {
        return record
      }
      return this.saveDirect({
        ...record,
        activeRun: {
          ...active,
          practiceId: input.practiceId,
          practiceVersion: input.practiceVersion,
          reviewStatus: input.result.verdict,
          reviewResult: structuredClone(input.result),
          checklist: structuredClone(input.checklist),
          ...((active.completion ?? input.completion)
            ? { completion: structuredClone(active.completion ?? input.completion!) } : {}),
          updatedAt: input.updatedAt
        }
      })
    })
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

  private async loadDirect(): Promise<PracticeWorkspaceRecord> {
    try {
      const recoverInterruptedReview = !this.initialized
      this.initialized = true
      const parsed: unknown = JSON.parse(await readFile(this.statePath, 'utf8'))
      if (isPracticeWorkspaceRecord(parsed)) {
        const normalized = normalizeWorkspaceRecord(parsed, recoverInterruptedReview)
        if (JSON.stringify(normalized) !== JSON.stringify(parsed)) {
          return this.saveDirect(normalized)
        }
        return structuredClone(normalized)
      }
      await this.quarantine()
    } catch (error) {
      if (isRecord(error) && error.code !== 'ENOENT') await this.quarantine()
    }
    return defaultPracticeWorkspaceRecord()
  }

  private async saveDirect(record: PracticeWorkspaceRecord): Promise<PracticeWorkspaceRecord> {
    if (!isPracticeWorkspaceRecord(record)) throw new Error('Invalid Practice workspace record')
    this.initialized = true
    await mkdir(this.dataDirectory, { recursive: true })
    await writeFile(this.temporaryPath, JSON.stringify(record, null, 2) + '\n', 'utf8')
    await rename(this.temporaryPath, this.statePath)
    return structuredClone(record)
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation, operation)
    this.queue = result.then(
      () => undefined,
      () => undefined
    )
    return result
  }

  private async quarantine(): Promise<void> {
    await mkdir(this.dataDirectory, { recursive: true })
    await rm(this.corruptPath, { force: true })
    await rename(this.statePath, this.corruptPath).catch(() => undefined)
  }
}
