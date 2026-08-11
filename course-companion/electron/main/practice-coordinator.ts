import { randomUUID } from 'node:crypto'
import type {
  PracticeDefinition,
  PracticeChecklistStep,
  PracticeIdentity,
  PracticePanelUpdate,
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

export class PracticeCoordinator implements PracticeWorkspaceAdapter {
  private busy: Promise<PracticeWorkspaceView> | null = null
  private lastError = ''

  constructor(
    private readonly repository: PracticeRunRepository,
    private readonly definitions: PracticeDefinitionRepository,
    private readonly executor: Pick<ExecutorChatCoordinator, 'createTarget' | 'prepareTarget' | 'openTarget'>,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID,
    private readonly prepareExecutor?: (binding: PracticeRunRecord['binding'], captureBaseline: boolean) => Promise<void>
  ) {}

  async loadWorkspace(identity?: PracticeIdentity): Promise<PracticeWorkspaceView> {
    const record = await this.repository.load()
    if (record.pendingTransition && !this.lastError) {
      this.lastError = 'Lần chuyển trước bị gián đoạn. Bạn có thể thử lại hoặc hủy.'
    }
    return this.toView(record, identity)
  }

  startNew(request: PracticeStartRequest): Promise<PracticeWorkspaceView> {
    if (request.transfer) return Promise.reject(selectiveTransferUnavailable())
    return this.runExclusive(async () => {
      this.lastError = ''
      const record = await this.repository.load()
      if (record.pendingTransition) throw new Error('A Practice switch is already pending')
      await this.definitions.load(request.practiceId, request.practiceVersion)
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
        targetBinding = await this.executor.createTarget(transition.targetRunId)
        const targetCreated = await this.repository.save({
          ...pending,
          pendingTransition: { ...transition, stage: 'target-created', targetBinding }
        })
        await this.executor.prepareTarget(targetBinding)
        committed = await this.commitTarget(targetCreated)
      } catch (error) {
        this.lastError = safeCreationError(error)
        throw new Error(this.lastError, { cause: error })
      }
      await this.openTarget(targetBinding, true)
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
      if (transition.stage === 'target-created' && transition.targetBinding) {
        let committed
        try {
          await this.executor.prepareTarget(transition.targetBinding)
          committed = await this.commitTarget(record)
        } catch (error) {
          this.lastError = safeCreationError(error)
          throw new Error(this.lastError, { cause: error })
        }
        await this.openTarget(transition.targetBinding, true)
        return this.toView(committed)
      }
      let targetBinding
      try {
        targetBinding = await this.executor.createTarget(transition.targetRunId)
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
        await this.executor.prepareTarget(targetBinding)
        committed = await this.commitTarget(targetCreated)
      } catch (error) {
        this.lastError = safeCreationError(error)
        throw new Error(this.lastError, { cause: error })
      }
      await this.openTarget(targetBinding, true)
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

  reset(): Promise<void> {
    this.lastError = ''
    return this.repository.reset()
  }

  private runExclusive(operation: () => Promise<PracticeWorkspaceView>): Promise<PracticeWorkspaceView> {
    if (this.busy) return this.busy
    const running = operation().finally(() => {
      if (this.busy === running) this.busy = null
    })
    this.busy = running
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
    const identity = record.activeRun
      ?? transition
      ?? requestedIdentity
    const definition = identity
      ? await this.definitions.load(identity.practiceId, identity.practiceVersion)
      : null
    return {
      schemaVersion: 1,
      phase: transition ? 'switching' : record.activeRun ? 'active' : this.lastError ? 'error' : 'brief',
      objective: definition?.objective ?? '',
      expectedOutcome: definition?.expectedOutcome ?? '',
      checklist: structuredClone(
        record.activeRun?.checklist ?? (definition ? initialChecklist(definition) : [])
      ),
      review: {
        status: record.activeRun?.reviewStatus ?? 'not-reviewed',
        canReview: Boolean(record.activeRun && !transition),
        canReturn: Boolean(record.activeRun?.reviewStatus === 'passed' && record.activeRun.completion),
        ...(record.activeRun?.reviewResult
          ? { result: structuredClone(record.activeRun.reviewResult) }
          : {})
      },
      ...(record.activeRun?.completion ? { completion: structuredClone(record.activeRun.completion) } : {}),
      ...(record.activeRun
        ? {
            activePractice: {
              runId: record.activeRun.runId,
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
        canResume: Boolean(record.activeRun && !transition),
        selectiveTransferAvailable: selectiveTransferCapability.available,
        selectiveTransferReason: selectiveTransferCapability.reason
      },
      ...(this.lastError ? { error: this.lastError } : {})
    }
  }
}
