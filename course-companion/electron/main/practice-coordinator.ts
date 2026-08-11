import { randomUUID } from 'node:crypto'
import type {
  ApprovedCodexConfiguration,
  PracticeAdapterEvidenceState,
  PracticeCompletionReceipt,
  PracticeDefinition,
  PracticeChecklistStep,
  PracticeIdentity,
  PracticePanelUpdate,
  PlanningPracticeActionRequest,
  PracticeStartRequest,
  PracticeWorkspaceAdapter,
  PracticeWorkspaceView
} from '../../shared/contracts'
import type { ExecutorChatCoordinator } from './executor-chat-coordinator'
import { PracticeDefinitionRepository } from './practice-definition-repository'
import {
  type PracticeRunRecord,
  type PracticeTransitionRecord,
  type PracticeWorkspaceRecord,
  PracticeRunRepository
} from './practice-run-repository'
import {
  selectiveTransferCapability,
  selectiveTransferUnavailable
} from './selective-handoff'
import type { PracticeEvidenceAdapterRegistry } from './practice-evidence-adapter-registry'

function initialChecklist(definition: PracticeDefinition): PracticeChecklistStep[] {
  return definition.checklist.map((step, index) => ({
    id: step.id,
    title: step.title,
    status: index === 0 ? 'current' : 'pending',
    dependencyInputs: {}
  }))
}

function transitionLabel(stage: PracticeTransitionRecord['stage']): string {
  return stage === 'creating-target'
    ? 'Đang tạo Executor chat mới…'
    : 'Đang xác nhận Executor chat mới…'
}

function safeCreationError(error: unknown): string {
  const message = error instanceof Error ? error.message : ''
  if (message === 'Approved Module 1 configuration is required') {
    return 'Bạn cần hoàn thành Practice thiết lập Codex ở Module 1 trước khi bắt đầu Practice này.'
  }
  if (message === 'Codex created an Executor task with incompatible safety settings' ||
      message === 'Codex returned incomplete effective task settings') {
    return 'Codex chưa áp dụng đúng cấu hình an toàn đã duyệt ở Module 1. Không có chỉ dẫn nào được gửi vào task.'
  }
  if (message === 'Codex created the Executor task in an unexpected workspace') {
    return 'Executor task không nằm trong Pilot workspace đã được Course Companion xác nhận. Không có chỉ dẫn nào được gửi.'
  }
  if (message === 'Codex could not read the Executor chat after creation') {
    return 'Executor chat đã được tạo nhưng Codex chưa đọc lại được dữ liệu đã lưu. Hãy thử lại.'
  }
  if (message === 'Invalid Executor chat binding') {
    return 'Executor chat đã lưu không còn hợp lệ. Hãy hủy lần chuyển này và bắt đầu lại.'
  }
  if (message === 'Codex Executor bootstrap did not close') {
    return 'Course Companion chưa bàn giao được Executor chat cho Codex desktop. Hãy thử lại.'
  }
  if (message === 'Codex did not create the Executor chat' ||
      message === 'Codex created an invalid Executor chat') {
    return 'Codex App Server không trả về một Executor chat hợp lệ. Hãy thử lại.'
  }
  return 'Không thể tạo Executor chat mới. Practice cũ vẫn được giữ nguyên.'
}

function planningWorkspaceView(active: PracticeRunRecord): NonNullable<PracticeWorkspaceView['planning']> {
  const evidence = active.evidence
  const snapshots = new Map(evidence?.planningArtifacts?.map((artifact) => [artifact.path, artifact]))
  const issues = new Map(evidence?.artifactIssues?.map((issue) => [issue.path, issue]))
  const prdDigest = snapshots.get('artifacts/PRD.md')?.digest
  const planDigest = snapshots.get('artifacts/implementation-plan.md')?.digest
  const invalidatedSteps = new Set(active.invalidations.flatMap((item) => item.affectedStepIds))

  const approval = (
    key: 'prd-approval' | 'plan-approval',
    required: Array<'artifacts/PRD.md' | 'artifacts/implementation-plan.md'>
  ): 'approved' | 'pending' | 'revision-requested' | 'stale' => {
    const decision = active.learnerApprovals[key]
    if (!decision) return 'pending'
    if (decision.decision === 'revision-requested') return 'revision-requested'
    return required.every((path) =>
      decision.artifactDigests[path] === snapshots.get(path)?.digest)
      ? 'approved'
      : 'stale'
  }

  const artifact = (path: 'artifacts/PRD.md' | 'artifacts/implementation-plan.md') => {
    const issue = issues.get(path)
    const snapshot = snapshots.get(path)
    const approvalKey = path === 'artifacts/PRD.md' ? 'prd-approval' : 'plan-approval'
    const required = path === 'artifacts/PRD.md'
      ? ['artifacts/PRD.md'] as const
      : ['artifacts/PRD.md', 'artifacts/implementation-plan.md'] as const
    const availability = !snapshot
      ? 'missing' as const
      : issue && issue.code !== 'unchanged'
        ? 'invalid' as const
        : 'available' as const
    const freshness = issue?.code === 'unchanged'
      ? 'stale' as const
      : evidence?.freshness ?? 'unverifiable' as const
    return {
      path,
      availability,
      approval: approval(approvalKey, [...required]),
      freshness,
      ...(issue ? { issue: issue.code } : {})
    }
  }

  const alignmentKey = prdDigest && planDigest ? `${prdDigest}:${planDigest}` : null
  const alignment = invalidatedSteps.has('reconcile-alignment')
    ? 'stale' as const
    : alignmentKey && active.learnerDecisions['alignment-confirmed'] === alignmentKey
      ? 'confirmed' as const
      : 'pending' as const

  return {
    freshness: evidence?.freshness ?? 'unverifiable',
    ...(evidence?.observedAt ? { observedAt: evidence.observedAt } : {}),
    artifacts: [artifact('artifacts/PRD.md'), artifact('artifacts/implementation-plan.md')],
    alignment,
    unexpectedChangedPaths: structuredClone(evidence?.unexpectedChangedPaths ?? []),
    invalidations: structuredClone(active.invalidations),
    actionContext: {
      generation: active.generation,
      ...(evidence?.planningActivity?.cursor
        ? { activityCursor: evidence.planningActivity.cursor }
        : {}),
      ...(prdDigest ? { prdDigest } : {}),
      ...(planDigest ? { planDigest } : {})
    }
  }
}

export class PracticeCoordinator implements PracticeWorkspaceAdapter {
  private operationTail: Promise<void> = Promise.resolve()
  private lastError = ''

  constructor(
    private readonly repository: PracticeRunRepository,
    private readonly definitions: PracticeDefinitionRepository,
    private readonly executor: Pick<ExecutorChatCoordinator, 'createTarget' | 'prepareTarget' | 'openTarget'>,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
    private readonly prepareExecutor?: (binding: PracticeRunRecord['binding'], captureBaseline: boolean) => Promise<void>,
    private readonly loadApprovedConfiguration?: () => Promise<ApprovedCodexConfiguration | null>,
    private readonly evidenceAdapters?: PracticeEvidenceAdapterRegistry,
    private readonly revokeCompletion?: (receipt: PracticeCompletionReceipt) => Promise<unknown>
  ) {}

  async loadWorkspace(identity?: PracticeIdentity): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const refreshError = 'Chưa thể làm mới bằng chứng từ Executor. Trạng thái đã lưu vẫn được giữ để bạn kết nối lại.'
      let record = await this.repository.load()
      if (record.pendingTransition && !this.lastError) {
        this.lastError = 'Lần chuyển trước bị gián đoạn. Bạn có thể thử lại hoặc hủy.'
      }
      try {
        record = await this.refreshPlanningEvidence(record)
        if (this.lastError === refreshError) this.lastError = ''
      } catch {
        this.lastError = refreshError
      }
      return this.toView(record, identity)
    })
  }

  startNew(request: PracticeStartRequest): Promise<PracticeWorkspaceView> {
    if (request.transfer) return Promise.reject(selectiveTransferUnavailable())
    return this.runExclusive(async () => {
      this.lastError = ''
      const record = await this.repository.load()
      if (record.pendingTransition) throw new Error('A Practice switch is already pending')
      const definition = await this.definitions.load(request.practiceId, request.practiceVersion)
      const approvedConfiguration = definition.taskPolicy === 'safe-workspace-write'
        ? await this.loadApprovedConfiguration?.() ?? undefined
        : undefined
      const startedAt = this.now().toISOString()
      const transition: PracticeTransitionRecord = {
        transitionId: this.createId(),
        sourceRunId: record.activeRun?.runId ?? null,
        targetRunId: this.createId(),
        practiceId: request.practiceId,
        practiceVersion: request.practiceVersion,
        stage: 'creating-target',
        startedAt
      }
      const pending = await this.repository.save({ ...record, pendingTransition: transition })
      let targetBinding
      let committed
      try {
        targetBinding = await this.executor.createTarget({
          runId: transition.targetRunId,
          definition,
          approvedConfiguration
        })
        const targetCreated = await this.repository.save({
          ...pending,
          pendingTransition: { ...transition, stage: 'target-created', targetBinding }
        })
        if (definition.evidenceProfile === 'planning-package') {
          await this.prepareExecutor?.(targetBinding, true)
        }
        await this.executor.prepareTarget(targetBinding, definition)
        committed = await this.commitTarget(targetCreated)
      } catch (error) {
        this.lastError = safeCreationError(error)
        throw new Error(this.lastError, { cause: error })
      }
      await this.openTarget(targetBinding, false)
      return this.toView(committed)
    })
  }

  resume(identity?: PracticeIdentity): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const record = await this.repository.load()
      if (!record.activeRun || record.pendingTransition) {
        throw new Error('Không có Practice đang hoạt động để tiếp tục.')
      }
      if (identity
        && (record.activeRun.practiceId !== identity.practiceId
          || record.activeRun.practiceVersion !== identity.practiceVersion)) {
        throw new Error('Practice đang hoạt động không khớp nội dung được yêu cầu.')
      }
      await this.openTarget(record.activeRun.binding, false)
      return this.toView(record)
    })
  }

  retry(): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const record = await this.repository.load()
      const transition = record.pendingTransition
      if (!transition) throw new Error('Không có lần chuyển nào để thử lại.')
      const definition = await this.definitions.load(
        transition.practiceId,
        transition.practiceVersion
      )
      const approvedConfiguration = definition.taskPolicy === 'safe-workspace-write'
        ? await this.loadApprovedConfiguration?.() ?? undefined
        : undefined
      if (transition.stage === 'target-created' && transition.targetBinding) {
        let committed
        try {
          if (definition.evidenceProfile === 'planning-package') {
            await this.prepareExecutor?.(transition.targetBinding, true)
          }
          await this.executor.prepareTarget(transition.targetBinding, definition)
          committed = await this.commitTarget(record)
        } catch (error) {
          this.lastError = safeCreationError(error)
          throw new Error(this.lastError, { cause: error })
        }
        await this.openTarget(transition.targetBinding, false)
        return this.toView(committed)
      }
      let targetBinding
      try {
        targetBinding = await this.executor.createTarget({
          runId: transition.targetRunId,
          definition,
          approvedConfiguration
        })
      } catch (error) {
        this.lastError = safeCreationError(error)
        throw new Error(this.lastError, { cause: error })
      }
      const targetCreated = await this.repository.save({
        ...record,
        pendingTransition: { ...transition, stage: 'target-created', targetBinding }
      })
      let committed
      try {
        if (definition.evidenceProfile === 'planning-package') {
          await this.prepareExecutor?.(targetBinding, true)
        }
        await this.executor.prepareTarget(targetBinding, definition)
        committed = await this.commitTarget(targetCreated)
      } catch (error) {
        this.lastError = safeCreationError(error)
        throw new Error(this.lastError, { cause: error })
      }
      await this.openTarget(targetBinding, false)
      return this.toView(committed)
    })
  }

  cancel(): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const record = await this.repository.load()
      if (!record.pendingTransition) throw new Error('Không có lần chuyển nào để hủy.')
      this.lastError = ''
      return this.toView(await this.repository.save({ ...record, pendingTransition: null }))
    })
  }

  selectPanel(update: PracticePanelUpdate): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      return this.toView(await this.repository.selectPanel(update.surface, update.panel))
    })
  }

  recordPlanningAction(request: PlanningPracticeActionRequest): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const record = await this.repository.load()
      const active = record.activeRun
      if (!active
        || active.runId !== request.runId
        || active.generation !== request.generation
        || active.practiceId !== request.practiceId
        || active.practiceVersion !== request.practiceVersion) {
        throw new Error('Practice action does not belong to the active run')
      }
      if (active.evidenceProfile !== 'planning-package' || !this.evidenceAdapters) {
        throw new Error('Module 2 Practice actions are unavailable')
      }
      const definition = await this.definitions.load(active.practiceId, active.practiceVersion)
      await this.prepareExecutor?.(active.binding, false)
      const evidence = await this.evidenceAdapters.resolve(active.evidenceProfile).collect({
        definition,
        runId: active.runId,
        generation: active.generation,
        workspaceRoot: active.binding.workspaceRoot,
        task: {
          threadId: active.binding.threadId,
          workspaceRoot: active.binding.workspaceRoot
        }
      })
      const refreshed = await this.saveEvidence(active, evidence)
      if (!refreshed.activeRun
        || refreshed.activeRun.runId !== active.runId
        || refreshed.activeRun.generation !== active.generation) {
        throw new Error('Practice changed while evidence was refreshed')
      }
      const saved = await this.repository.applyPlanningAction({
        runId: active.runId,
        generation: active.generation,
        practiceId: active.practiceId,
        practiceVersion: active.practiceVersion,
        action: request.action,
        updatedAt: this.now().toISOString()
      })
      return this.toView(saved)
    })
  }

  reset(): Promise<void> {
    this.lastError = ''
    return this.repository.reset()
  }

  private runExclusive(operation: () => Promise<PracticeWorkspaceView>): Promise<PracticeWorkspaceView> {
    const running = this.operationTail.then(operation)
    this.operationTail = running.then(() => undefined, () => undefined)
    return running
  }

  private async openTarget(binding: PracticeRunRecord['binding'], captureBaseline: boolean): Promise<void> {
    try {
      await this.prepareExecutor?.(binding, captureBaseline)
      await this.executor.openTarget(binding)
      this.lastError = ''
    } catch {
      this.lastError =
        'Executor chat đã được tạo nhưng Codex chưa mở được. Hãy dùng Tiếp tục Practice để thử lại.'
      throw new Error(this.lastError)
    }
  }

  private async refreshPlanningEvidence(record: PracticeWorkspaceRecord): Promise<PracticeWorkspaceRecord> {
    const active = record.activeRun
    if (!active || record.pendingTransition || active.evidenceProfile !== 'planning-package' || !this.evidenceAdapters) {
      return record
    }
    const definition = await this.definitions.load(active.practiceId, active.practiceVersion)
    await this.prepareExecutor?.(active.binding, false)
    const evidence = await this.evidenceAdapters.resolve('planning-package').collect({
      definition,
      runId: active.runId,
      generation: active.generation,
      workspaceRoot: active.binding.workspaceRoot,
      task: {
        threadId: active.binding.threadId,
        workspaceRoot: active.binding.workspaceRoot
      }
    })
    return this.saveEvidence(active, evidence)
  }

  private async saveEvidence(
    active: PracticeRunRecord,
    evidence: PracticeAdapterEvidenceState
  ): Promise<PracticeWorkspaceRecord> {
    const saved = await this.repository.saveEvidence({
      runId: active.runId,
      generation: active.generation,
      practiceId: active.practiceId,
      practiceVersion: active.practiceVersion,
      evidence,
      checklist: active.checklist,
      invalidations: evidence.invalidations,
      updatedAt: evidence.observedAt
    })
    if (active.completion && !saved.activeRun?.completion) {
      await this.revokeCompletion?.(active.completion)
    }
    return saved
  }

  private async commitTarget(record: PracticeWorkspaceRecord): Promise<PracticeWorkspaceRecord> {
    const transition = record.pendingTransition
    if (transition?.stage !== 'target-created' || !transition.targetBinding) {
      throw new Error('Practice target is not ready')
    }
    const definition = await this.definitions.load(
      transition.practiceId,
      transition.practiceVersion
    )
    const timestamp = this.now().toISOString()
    const generation = (record.activeRun?.generation ?? 0) + 1
    const activeRun: PracticeRunRecord = {
      runId: transition.targetRunId,
      generation,
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      workspaceKind: definition.workspaceKind,
      taskPolicy: definition.taskPolicy,
      evidenceProfile: definition.evidenceProfile,
      reviewStatus: 'not-reviewed',
      status: 'active',
      binding: transition.targetBinding,
      startedAt: transition.startedAt,
      updatedAt: timestamp,
      checklist: initialChecklist(definition),
      learnerDecisions: {},
      learnerApprovals: {},
      evidence: null,
      invalidations: []
    }
    const archivedRuns = record.activeRun
      ? [
          ...record.archivedRuns,
          {
            runId: record.activeRun.runId,
            generation: record.activeRun.generation,
            practiceId: record.activeRun.practiceId,
            practiceVersion: record.activeRun.practiceVersion,
            threadId: record.activeRun.binding.threadId,
            name: record.activeRun.binding.name,
            outcome: 'replaced' as const,
            archivedAt: timestamp
          }
        ].slice(-100)
      : record.archivedRuns
    return this.repository.save({
      ...record,
      activeRun,
      archivedRuns,
      pendingTransition: null,
      presentation: { fullPanel: 'teacher', compactPanel: 'teacher' }
    })
  }

  private async toView(
    record: PracticeWorkspaceRecord,
    requestedIdentity?: PracticeIdentity
  ): Promise<PracticeWorkspaceView> {
    const transition = record.pendingTransition
    const requestedMatchesActive = !requestedIdentity || Boolean(record.activeRun
      && record.activeRun.practiceId === requestedIdentity.practiceId
      && record.activeRun.practiceVersion === requestedIdentity.practiceVersion)
    const displayedRun = !transition && requestedMatchesActive ? record.activeRun : null
    const identity = transition
      ?? requestedIdentity
      ?? record.activeRun
    const definition = identity
      ? await this.definitions.load(identity.practiceId, identity.practiceVersion)
      : null
    const planningReviewStep = displayedRun?.checklist.find((step) =>
      step.id === 'explain-scope-and-review')
    const canReview = Boolean(displayedRun && (
      displayedRun.evidenceProfile !== 'planning-package'
      || (displayedRun.learnerDecisions['scope-decision']
        && (planningReviewStep?.status === 'current' || planningReviewStep?.status === 'completed'))
    ))
    return {
      schemaVersion: 1,
      phase: transition ? 'switching' : displayedRun ? 'active' : this.lastError ? 'error' : 'brief',
      title: definition?.title ?? 'Bài thực hành',
      objective: definition?.objective ?? '',
      expectedOutcome: definition?.expectedOutcome ?? '',
      checklist: structuredClone(
        displayedRun?.checklist ?? (definition ? initialChecklist(definition) : [])
      ),
      ...(definition
        ? {
            completionDestination: {
              ...structuredClone(definition.completionDestination),
              label: definition.completionDestination.label || 'Bước tiếp theo trong khóa học'
            }
          }
        : {}),
      review: {
        status: displayedRun?.reviewStatus ?? 'not-reviewed',
        canReview,
        canReturn: Boolean(displayedRun?.reviewStatus === 'passed' && displayedRun.completion),
        ...(displayedRun?.reviewResult
          ? { result: structuredClone(displayedRun.reviewResult) }
          : {})
      },
      ...(displayedRun?.completion ? { completion: structuredClone(displayedRun.completion) } : {}),
      ...(displayedRun?.binding.configuration
        ? { configuration: structuredClone(displayedRun.binding.configuration) }
        : {}),
      ...(displayedRun?.evidenceProfile === 'planning-package'
        ? { planning: planningWorkspaceView(displayedRun) }
        : {}),
      ...(record.activeRun
        ? {
            activePractice: {
              runId: record.activeRun.runId,
              generation: record.activeRun.generation,
              practiceId: record.activeRun.practiceId,
              practiceVersion: record.activeRun.practiceVersion,
              executorChatName: record.activeRun.binding.name,
              startedAt: record.activeRun.startedAt
            }
          }
        : {}),
      ...(transition
        ? {
            transition: {
              stage: transition.stage,
              label: transitionLabel(transition.stage),
              canCancel: true,
              canRetry: true
            }
          }
        : {}),
      presentation: structuredClone(record.presentation),
      capabilities: {
        canStartNew: !transition,
        canResume: Boolean(displayedRun),
        selectiveTransferAvailable: selectiveTransferCapability.available,
        selectiveTransferReason: selectiveTransferCapability.reason
      },
      ...(this.lastError ? { error: this.lastError } : {})
    }
  }
}
