import { randomUUID } from 'node:crypto'
import type {
  PracticeChecklistStep,
  PracticePanelUpdate,
  PracticeStartRequest,
  PracticeWorkspaceAdapter,
  PracticeWorkspaceView
} from '../../shared/contracts'
import type { ExecutorChatCoordinator } from './executor-chat-coordinator'
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

const objective = 'Tạo một brief kiểm chứng được trước khi cho Codex thay đổi giao diện.'
const expectedOutcome =
  'Một thay đổi CSS đúng phạm vi, có bằng chứng ở viewport 390px và không gây tràn ngang.'

function initialChecklist(): PracticeChecklistStep[] {
  return [
    { id: 'review-objective', title: 'Xem mục tiêu và dấu hiệu hoàn thành', status: 'completed' },
    { id: 'open-executor', title: 'Mở Executor chat riêng cho Practice', status: 'current' },
    { id: 'build-and-verify', title: 'Thực hiện thay đổi trong phạm vi đã duyệt', status: 'upcoming' },
    { id: 'review-evidence', title: 'Duyệt bằng chứng trước khi kết luận', status: 'upcoming' }
  ]
}

function transitionLabel(stage: PracticeTransitionRecord['stage']): string {
  return stage === 'creating-target'
    ? 'Đang tạo Executor chat mới…'
    : 'Đang xác nhận Executor chat mới…'
}

export class PracticeCoordinator implements PracticeWorkspaceAdapter {
  private busy: Promise<PracticeWorkspaceView> | null = null
  private lastError = ''

  constructor(
    private readonly repository: PracticeRunRepository,
    private readonly executor: Pick<ExecutorChatCoordinator, 'createTarget' | 'openTarget'>,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID
  ) {}

  async loadWorkspace(): Promise<PracticeWorkspaceView> {
    const record = await this.repository.load()
    if (record.pendingTransition?.stage === 'target-created') {
      return this.toView(await this.commitTarget(record))
    }
    if (record.pendingTransition) {
      this.lastError = 'Lần chuyển trước bị gián đoạn. Bạn có thể thử lại hoặc hủy.'
    }
    return this.toView(record)
  }

  startNew(request: PracticeStartRequest): Promise<PracticeWorkspaceView> {
    if (request.transfer) return Promise.reject(selectiveTransferUnavailable())
    return this.runExclusive(async () => {
      this.lastError = ''
      const record = await this.repository.load()
      if (record.pendingTransition) throw new Error('A Practice switch is already pending')
      const startedAt = this.now().toISOString()
      const transition: PracticeTransitionRecord = {
        transitionId: this.createId(),
        sourceRunId: record.activeRun?.runId ?? null,
        targetRunId: this.createId(),
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
        committed = await this.commitTarget(targetCreated)
      } catch {
        this.lastError = 'Không thể tạo Executor chat mới. Practice cũ vẫn được giữ nguyên.'
        throw new Error(this.lastError)
      }
      await this.openTarget(targetBinding)
      return this.toView(committed)
    })
  }

  resume(): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const record = await this.repository.load()
      if (!record.activeRun || record.pendingTransition) {
        throw new Error('Không có Practice đang hoạt động để tiếp tục.')
      }
      await this.openTarget(record.activeRun.binding)
      return this.toView(record)
    })
  }

  retry(): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const record = await this.repository.load()
      const transition = record.pendingTransition
      if (!transition) throw new Error('Không có lần chuyển nào để thử lại.')
      if (transition.stage === 'target-created' && transition.targetBinding) {
        const committed = await this.commitTarget(record)
        await this.openTarget(transition.targetBinding)
        return this.toView(committed)
      }
      const targetBinding = await this.executor.createTarget(transition.targetRunId)
      const targetCreated = await this.repository.save({
        ...record,
        pendingTransition: { ...transition, stage: 'target-created', targetBinding }
      })
      const committed = await this.commitTarget(targetCreated)
      await this.openTarget(targetBinding)
      return this.toView(committed)
    })
  }

  cancel(): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const record = await this.repository.load()
      if (record.pendingTransition?.stage !== 'creating-target') {
        throw new Error('Không thể hủy ở giai đoạn này.')
      }
      this.lastError = ''
      return this.toView(await this.repository.save({ ...record, pendingTransition: null }))
    })
  }

  selectPanel(update: PracticePanelUpdate): Promise<PracticeWorkspaceView> {
    return this.runExclusive(async () => {
      const record = await this.repository.load()
      const presentation = update.surface === 'full'
        ? { ...record.presentation, fullPanel: update.panel }
        : { ...record.presentation, compactPanel: update.panel }
      return this.toView(await this.repository.save({ ...record, presentation }))
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

  private async openTarget(binding: PracticeRunRecord['binding']): Promise<void> {
    try {
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
    const timestamp = this.now().toISOString()
    const generation = (record.activeRun?.generation ?? 0) + 1
    const activeRun: PracticeRunRecord = {
      runId: transition.targetRunId,
      generation,
      status: 'active',
      binding: transition.targetBinding,
      startedAt: transition.startedAt,
      updatedAt: timestamp,
      checklist: initialChecklist()
    }
    const archivedRuns = record.activeRun
      ? [
          ...record.archivedRuns,
          {
            runId: record.activeRun.runId,
            generation: record.activeRun.generation,
            threadId: record.activeRun.binding.threadId,
            name: record.activeRun.binding.name,
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

  private toView(record: PracticeWorkspaceRecord): PracticeWorkspaceView {
    const transition = record.pendingTransition
    return {
      schemaVersion: 1,
      phase: transition ? 'switching' : record.activeRun ? 'active' : this.lastError ? 'error' : 'brief',
      objective,
      expectedOutcome,
      checklist: structuredClone(record.activeRun?.checklist ?? initialChecklist()),
      ...(record.activeRun
        ? {
            activePractice: {
              runId: record.activeRun.runId,
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
              canCancel: transition.stage === 'creating-target',
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
