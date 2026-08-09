import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { PracticeChecklistStep, PracticePanel } from '../../shared/contracts'

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
      const parsed: unknown = JSON.parse(await readFile(this.statePath, 'utf8'))
      if (isPracticeWorkspaceRecord(parsed)) return structuredClone(parsed)
      await this.quarantine()
    } catch (error) {
      if (isRecord(error) && error.code !== 'ENOENT') await this.quarantine()
    }
    return defaultPracticeWorkspaceRecord()
  }

  private async saveDirect(record: PracticeWorkspaceRecord): Promise<PracticeWorkspaceRecord> {
    if (!isPracticeWorkspaceRecord(record)) throw new Error('Invalid Practice workspace record')
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
