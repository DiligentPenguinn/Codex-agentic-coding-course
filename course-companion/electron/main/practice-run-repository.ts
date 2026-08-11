import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type {
  PracticeAdapterEvidenceState,
  PracticeChecklistStep,
  PracticeCompletionReceipt,
  PracticeEvidenceInvalidation,
  PracticeEvidenceProfile,
  PracticePanel,
  PracticeReviewResult,
  PracticeTaskPolicy,
  PracticeWorkspaceKind
} from '../../shared/contracts'
import { isApprovedCodexConfiguration } from './practice-task-policy'

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
  practiceId: string
  practiceVersion: string
  workspaceKind: PracticeWorkspaceKind
  taskPolicy: PracticeTaskPolicy
  evidenceProfile: PracticeEvidenceProfile
  binding: ExecutorChatBinding
  startedAt: string
  updatedAt: string
  checklist: PracticeChecklistStep[]
  learnerDecisions: Record<string, string>
  learnerApprovals: Record<string, { decision: 'approved' | 'revision-requested'; recordedAt: string }>
  evidence: PracticeAdapterEvidenceState | null
  invalidations: PracticeEvidenceInvalidation[]
  reviewStatus: 'not-reviewed' | 'reviewing' | 'needs-work' | 'passed'
  reviewResult?: PracticeReviewResult
  completion?: PracticeCompletionReceipt
}

export type ArchivedPracticeReceipt = {
  runId: string
  generation: number
  practiceId: string
  practiceVersion: string
  threadId: string
  name: string
  outcome: 'replaced' | 'historical'
  archivedAt: string
}

export type PracticeTransitionRecord = {
  transitionId: string
  sourceRunId: string | null
  targetRunId: string
  practiceId: string
  practiceVersion: string
  stage: 'creating-target' | 'target-created'
  targetBinding?: ExecutorChatBinding
  startedAt: string
}

export type PracticeWorkspaceRecord = {
  schemaVersion: 2
  activeRun: PracticeRunRecord | null
  archivedRuns: ArchivedPracticeReceipt[]
  pendingTransition: PracticeTransitionRecord | null
  presentation: {
    fullPanel: PracticePanel
    compactPanel: PracticePanel
  }
}

const ID = /^[A-Za-z0-9_-]{1,160}$/
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/
const THREAD_ID = /^[A-Za-z0-9_-]{1,160}$/
const STEP_STATUSES = new Set(['completed', 'current', 'pending', 'stale'])

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
    if (step.reason !== undefined && (typeof step.reason !== 'string' || step.reason.length > 1000)) return false
    if (step.dependencyInputs !== undefined && !isStringRecord(step.dependencyInputs, 20, 500)) return false
    ids.add(String(step.id))
  }
  return current <= 1
}

function isStringRecord(value: unknown, maximumEntries: number, maximumText: number): value is Record<string, string> {
  return isRecord(value)
    && Object.keys(value).length <= maximumEntries
    && Object.entries(value).every(([key, item]) => (
      ID.test(key) && typeof item === 'string' && item.length <= maximumText
    ))
}

function isApprovals(value: unknown): boolean {
  return isRecord(value)
    && Object.keys(value).length <= 20
    && Object.entries(value).every(([key, approval]) => (
      ID.test(key)
      && isRecord(approval)
      && (approval.decision === 'approved' || approval.decision === 'revision-requested')
      && isIso(approval.recordedAt)
    ))
}

function isEvidence(value: unknown): value is PracticeAdapterEvidenceState {
  return isRecord(value)
    && value.schemaVersion === 1
    && ID.test(String(value.practiceId))
    && VERSION.test(String(value.practiceVersion))
    && ID.test(String(value.runId))
    && (value.evidenceProfile === 'codex-task-configuration' || value.evidenceProfile === 'planning-package')
    && isIso(value.observedAt)
    && ['fresh', 'stale', 'unverifiable'].includes(String(value.freshness))
    && (value.sourceDigest === null || /^[a-f0-9]{64}$/.test(String(value.sourceDigest)))
    && Array.isArray(value.evidence)
    && Array.isArray(value.steps)
    && Array.isArray(value.invalidations)
}

function isInvalidations(value: unknown): value is PracticeEvidenceInvalidation[] {
  return Array.isArray(value)
    && value.length <= 40
    && value.every((item) => (
      isRecord(item)
      && typeof item.changedInput === 'string'
      && item.changedInput.length <= 300
      && Array.isArray(item.affectedStepIds)
      && item.affectedStepIds.every((stepId) => ID.test(String(stepId)))
      && typeof item.reason === 'string'
      && item.reason.length <= 1000
      && typeof item.nextAction === 'string'
      && item.nextAction.length <= 1000
    ))
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
    && (value.approvedConfiguration === undefined ||
      isApprovedCodexConfiguration(value.approvedConfiguration))
}

function isRun(value: unknown): value is PracticeRunRecord {
  if (!isRecord(value)) return false
  return (
    ID.test(String(value.runId)) &&
    Number.isSafeInteger(value.generation) &&
    Number(value.generation) > 0 &&
    value.status === 'active' &&
    ID.test(String(value.practiceId)) &&
    VERSION.test(String(value.practiceVersion)) &&
    value.workspaceKind === 'pilot-workspace' &&
    (value.taskPolicy === 'inherit-configuration-only' || value.taskPolicy === 'safe-workspace-write') &&
    (value.evidenceProfile === 'codex-task-configuration' || value.evidenceProfile === 'planning-package') &&
    ((value.evidenceProfile === 'codex-task-configuration' && value.taskPolicy === 'inherit-configuration-only')
      || (value.evidenceProfile === 'planning-package' && value.taskPolicy === 'safe-workspace-write')) &&
    isBinding(value.binding) &&
    value.binding.runId === value.runId &&
    isIso(value.startedAt) &&
    isIso(value.updatedAt) &&
    isStringRecord(value.learnerDecisions, 40, 2000) &&
    isApprovals(value.learnerApprovals) &&
    (value.evidence === null || (isEvidence(value.evidence)
      && value.evidence.practiceId === value.practiceId
      && value.evidence.practiceVersion === value.practiceVersion
      && value.evidence.runId === value.runId
      && value.evidence.evidenceProfile === value.evidenceProfile)) &&
    isInvalidations(value.invalidations) &&
    ['not-reviewed', 'reviewing', 'needs-work', 'passed'].includes(String(value.reviewStatus)) &&
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
    ID.test(String(value.practiceId)) &&
    VERSION.test(String(value.practiceVersion)) &&
    THREAD_ID.test(String(value.threadId)) &&
    typeof value.name === 'string' &&
    value.name.length > 0 &&
    value.name.length <= 500 &&
    (value.outcome === 'replaced' || value.outcome === 'historical') &&
    isIso(value.archivedAt)
  )
}

function isTransition(value: unknown): value is PracticeTransitionRecord {
  if (!isRecord(value)) return false
  if (!ID.test(String(value.transitionId)) || !ID.test(String(value.targetRunId))) return false
  if (value.sourceRunId !== null && !ID.test(String(value.sourceRunId))) return false
  if (!ID.test(String(value.practiceId)) || !VERSION.test(String(value.practiceVersion))) return false
  if (!['creating-target', 'target-created'].includes(String(value.stage))) return false
  if (!isIso(value.startedAt)) return false
  return value.stage === 'target-created'
    ? isBinding(value.targetBinding) && value.targetBinding.runId === value.targetRunId
    : value.targetBinding === undefined
}

export function defaultPracticeWorkspaceRecord(): PracticeWorkspaceRecord {
  return {
    schemaVersion: 2,
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
    : active.reviewStatus
  return {
    ...record,
    activeRun: {
      ...active,
      reviewStatus
    }
  }
}

function migrateHistoricalWorkspace(value: unknown, archivedAt: string): PracticeWorkspaceRecord | null {
  if (!isRecord(value) || value.schemaVersion !== 1) return null
  const migrated = defaultPracticeWorkspaceRecord()
  if (isRecord(value.presentation)
    && isPanel(value.presentation.fullPanel)
    && isPanel(value.presentation.compactPanel)) {
    migrated.presentation = {
      fullPanel: value.presentation.fullPanel,
      compactPanel: value.presentation.compactPanel
    }
  }
  const receipts: ArchivedPracticeReceipt[] = []
  if (Array.isArray(value.archivedRuns)) {
    for (const item of value.archivedRuns) {
      if (!isRecord(item)
        || !ID.test(String(item.runId))
        || !Number.isSafeInteger(item.generation)
        || Number(item.generation) < 1
        || !THREAD_ID.test(String(item.threadId))
        || typeof item.name !== 'string'
        || !isIso(item.archivedAt)) continue
      receipts.push({
        runId: String(item.runId),
        generation: Number(item.generation),
        practiceId: 'historical-unknown',
        practiceVersion: '1.0.0',
        threadId: String(item.threadId),
        name: item.name,
        outcome: 'historical',
        archivedAt: item.archivedAt
      })
    }
  }
  const active = isRecord(value.activeRun) ? value.activeRun : null
  const binding = active && isBinding(active.binding) ? active.binding : null
  if (active
    && binding
    && ID.test(String(active.runId))
    && Number.isSafeInteger(active.generation)
    && Number(active.generation) > 0) {
    receipts.push({
      runId: String(active.runId),
      generation: Number(active.generation),
      practiceId: ID.test(String(active.practiceId)) ? String(active.practiceId) : 'historical-unknown',
      practiceVersion: VERSION.test(String(active.practiceVersion)) ? String(active.practiceVersion) : '1.0.0',
      threadId: binding.threadId,
      name: binding.name,
      outcome: 'historical',
      archivedAt
    })
  }
  migrated.archivedRuns = receipts.slice(-100)
  return migrated
}

export function isPracticeWorkspaceRecord(value: unknown): value is PracticeWorkspaceRecord {
  if (!isRecord(value) || value.schemaVersion !== 2) return false
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

type RunIdentity = {
  runId: string
  generation: number
  practiceId: string
  practiceVersion: string
}

function matchesRun(active: PracticeRunRecord | null, identity: RunIdentity): active is PracticeRunRecord {
  return Boolean(active
    && active.runId === identity.runId
    && active.generation === identity.generation
    && active.practiceId === identity.practiceId
    && active.practiceVersion === identity.practiceVersion)
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

  advanceChecklist(input: RunIdentity & {
    currentStepId: string
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      if (!matchesRun(record.activeRun, input)) return record
      const targetIndex = record.activeRun.checklist.findIndex((step) => step.id === input.currentStepId)
      const currentIndex = record.activeRun.checklist.findIndex((step) => step.status === 'current')
      if (targetIndex < 0 || currentIndex < 0 || currentIndex >= targetIndex) return record
      const checklist = record.activeRun.checklist.map((step, index) => ({
        ...step,
        status: index < targetIndex ? 'completed' as const : index === targetIndex ? 'current' as const : 'pending' as const
      }))
      return this.saveDirect({
        ...record,
        activeRun: { ...record.activeRun, checklist, updatedAt: input.updatedAt }
      })
    })
  }

  saveEvidence(input: RunIdentity & {
    evidence: PracticeAdapterEvidenceState
    checklist: PracticeChecklistStep[]
    invalidations: PracticeEvidenceInvalidation[]
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      if (!matchesRun(record.activeRun, input)) return record
      const invalidated = input.invalidations.length > 0
      return this.saveDirect({
        ...record,
        activeRun: {
          ...record.activeRun,
          evidence: structuredClone(input.evidence),
          checklist: structuredClone(input.checklist),
          invalidations: structuredClone(input.invalidations),
          reviewStatus: invalidated ? 'not-reviewed' : record.activeRun.reviewStatus,
          reviewResult: invalidated ? undefined : record.activeRun.reviewResult,
          completion: invalidated ? undefined : record.activeRun.completion,
          updatedAt: input.updatedAt
        }
      })
    })
  }

  saveLearnerDecision(input: RunIdentity & {
    key: string
    value: string
    approval?: { decision: 'approved' | 'revision-requested'; recordedAt: string }
    updatedAt: string
  }): Promise<PracticeWorkspaceRecord> {
    return this.runExclusive(async () => {
      const record = await this.loadDirect()
      if (!matchesRun(record.activeRun, input)
        || !ID.test(input.key)
        || input.value.length > 2000
        || (input.approval && !isIso(input.approval.recordedAt))) return record
      return this.saveDirect({
        ...record,
        activeRun: {
          ...record.activeRun,
          learnerDecisions: {
            ...record.activeRun.learnerDecisions,
            [input.key]: input.value
          },
          learnerApprovals: input.approval
            ? {
                ...record.activeRun.learnerApprovals,
                [input.key]: structuredClone(input.approval)
              }
            : record.activeRun.learnerApprovals,
          updatedAt: input.updatedAt
        }
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
      if (!matchesRun(active, input)) return record
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
      if (!matchesRun(active, input)
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
      if (!matchesRun(active, input)) {
        return record
      }
      return this.saveDirect({
        ...record,
        activeRun: {
          ...active,
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
      const migrated = migrateHistoricalWorkspace(parsed, new Date().toISOString())
      if (migrated) return this.saveDirect(migrated)
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
