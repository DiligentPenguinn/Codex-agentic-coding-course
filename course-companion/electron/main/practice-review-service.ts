import { randomUUID } from 'node:crypto'
import type {
  CodexTaskConfigurationSnapshot,
  PracticeCompletionReceipt,
  PracticeDefinition,
  PracticeReviewResult,
  PracticeReviewResponse,
  TeacherMessage
} from '../../shared/contracts'
import type { ExecutorActivityObserver } from './executor-activity-observer'
import type { PracticeCoordinator } from './practice-coordinator'
import type { ProgressRepository } from './progress-repository'
import type { TeacherChatRepository } from './teacher-fixture'
import { PracticeDefinitionRepository } from './practice-definition-repository'
import {
  derivePracticeChecklist,
  parsePracticeReviewResult,
  reviewSourceDigest
} from './practice-review-contracts'
import {
  buildPracticeReviewEnvelope,
  type PracticeReviewEnvelope
} from './practice-review-context'
import type { PracticeReviewEvaluator } from './practice-review-evaluator'
import { PracticeRunRepository, type PracticeRunRecord } from './practice-run-repository'

const configurationChecks = [
  {
    field: 'model',
    criterionId: 'model-matches',
    label: 'Model',
    expected: 'gpt-5.6-sol',
    expectedLabel: '5.6 Sol',
    action: 'Trong task Executor, mở bộ chọn Model và chọn 5.6 Sol.'
  },
  {
    field: 'reasoningEffort',
    criterionId: 'effort-matches',
    label: 'Effort',
    expected: 'high',
    expectedLabel: 'High',
    action: 'Trong task Executor, mở Effort và chọn High.'
  },
  {
    field: 'serviceTier',
    criterionId: 'speed-matches',
    label: 'Speed',
    expected: 'standard',
    expectedLabel: 'Standard',
    action: 'Trong task Executor, mở Speed và chọn Standard.'
  },
  {
    field: 'approvalPolicy',
    criterionId: 'approval-matches',
    label: 'Approval',
    expected: 'on-request',
    expectedLabel: 'Approve for me',
    action: 'Trong task Executor, mở Approval và chọn Approve for me.'
  },
  {
    field: 'fullAccess',
    criterionId: 'full-access-off',
    label: 'Full access',
    expected: 'off',
    expectedLabel: 'Off',
    action: 'Trong task Executor, tắt Full access.'
  }
] as const

function evaluateConfiguration(
  envelope: PracticeReviewEnvelope,
  definition: PracticeDefinition,
  runId: string,
  reviewedAt: string
): PracticeReviewResult {
  const configuration = envelope.configuration
  const fresh = configuration?.freshness === 'fresh' && configuration.connection === 'connected'
  const criteria = configurationChecks.map((check) => {
    const value = configuration?.[check.field]
    const status = !fresh || !value || value.protocolValue === null
      ? 'unverifiable' as const
      : value.protocolValue === check.expected
        ? 'satisfied' as const
        : 'unsatisfied' as const
    return {
      criterionId: check.criterionId,
      status,
      evidenceRefs: value ? ['configuration-' + check.field] : [],
      explanation: status === 'satisfied'
        ? check.label + ' đang khớp: ' + check.expectedLabel + '.'
        : status === 'unsatisfied'
          ? check.label + ' hiện là ' + (value?.label ?? value?.protocolValue ?? 'không rõ')
            + '; cần ' + check.expectedLabel + '.'
          : check.label + ' chưa có metadata mới và xác minh được.'
    }
  })
  const passed = criteria.every((criterion) => criterion.status === 'satisfied')
  return {
    schemaVersion: 1,
    practiceId: definition.practiceId,
    practiceVersion: definition.version,
    runId,
    verdict: passed ? 'passed' : 'needs-work',
    criteria,
    summary: passed
      ? 'Triết đã xác minh trực tiếp: cả năm thiết lập của task đều khớp cấu hình khuyến nghị.'
      : 'Triết chưa thể xác nhận cấu hình an toàn vì còn giá trị chưa khớp hoặc chưa xác minh được.',
    reviewedAt,
    sourceDigest: reviewSourceDigest({
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      runId,
      configuration: configuration ?? null,
      criteria
    })
  }
}

function configurationGuidance(
  configuration: CodexTaskConfigurationSnapshot | undefined,
  result: PracticeReviewResult
): string[] {
  const byId = new Map(result.criteria.map((criterion) => [criterion.criterionId, criterion.status]))
  const matches = configurationChecks
    .filter((check) => byId.get(check.criterionId) === 'satisfied')
    .map((check) => check.label + ' ' + check.expectedLabel)
  const mismatches = configurationChecks
    .filter((check) => byId.get(check.criterionId) !== 'satisfied')
    .map((check) => {
      const current = configuration?.[check.field]
      return check.label + ': ' + (current?.label ?? 'chưa xác minh được')
        + ' → cần ' + check.expectedLabel
    })
  const next = configurationChecks.find((check) => byId.get(check.criterionId) !== 'satisfied')
  return [
    'Đang khớp: ' + (matches.length > 0 ? matches.join(', ') : 'chưa có giá trị nào được xác minh.'),
    ...(mismatches.length > 0 ? ['Chưa khớp hoặc chưa xác minh: ' + mismatches.join('; ') + '.'] : []),
    ...(next ? ['Thao tác cài đặt tiếp theo: ' + next.action] : [])
  ]
}

export class PracticeReviewService {
  private readonly pending = new Map<string, Promise<PracticeReviewResponse>>()

  constructor(
    private readonly definitions: PracticeDefinitionRepository,
    private readonly runs: PracticeRunRepository,
    private readonly coordinator: PracticeCoordinator,
    private readonly progress: ProgressRepository,
    private readonly activity: ExecutorActivityObserver,
    private readonly evaluator: PracticeReviewEvaluator,
    private readonly chat: TeacherChatRepository,
    private readonly simulated: boolean,
    private readonly now: () => Date = () => new Date(),
    private readonly createId: () => string = randomUUID
  ) {}

  review(): Promise<PracticeReviewResponse> {
    return this.reviewCurrentRun()
  }

  private async reviewCurrentRun(): Promise<PracticeReviewResponse> {
    const active = (await this.runs.load()).activeRun
    if (!active) throw new Error('Kh\u00f4ng c\u00f3 Practice \u0111ang ho\u1ea1t \u0111\u1ed9ng \u0111\u1ec3 duy\u1ec7t.')
    const key = [active.runId, active.generation, active.practiceId, active.practiceVersion].join(':')
    const pending = this.pending.get(key)
    if (pending) return pending
    const operation = this.reviewDirect(active).finally(() => {
      if (this.pending.get(key) === operation) this.pending.delete(key)
    })
    this.pending.set(key, operation)
    return operation
  }

  private async reviewDirect(active: PracticeRunRecord): Promise<PracticeReviewResponse> {
    const definition = await this.definitions.load(active.practiceId, active.practiceVersion)
    const reviewedAt = this.now().toISOString()
    const reviewing = await this.runs.beginReview({
      runId: active.runId,
      generation: active.generation,
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      updatedAt: reviewedAt
    })
    if (reviewing.activeRun?.runId !== active.runId
      || reviewing.activeRun.generation !== active.generation
      || reviewing.activeRun.reviewStatus !== 'reviewing') {
      throw new Error('Practice đã thay đổi trước khi Triết bắt đầu duyệt.')
    }

    try {
      const progressResult = await this.progress.load()
      const learnerProgress = progressResult.status === 'returning' || progressResult.status === 'recovered'
        ? progressResult.progress
        : null
      if (!learnerProgress) throw new Error('Kh\u00f4ng th\u1ec3 t\u1ea3i ti\u1ebfn tr\u00ecnh kh\u00f3a h\u1ecdc \u0111\u1ec3 duy\u1ec7t Practice.')

      const activity = await this.activity.bind(active.binding)
      const envelope = buildPracticeReviewEnvelope({
        definition,
        run: active,
        activity,
        decisions: learnerProgress.decisions,
        generatedAt: reviewedAt
      })
      const result = definition.evidenceProfile === 'codex-task-configuration'
        ? evaluateConfiguration(envelope, definition, active.runId, reviewedAt)
        : parsePracticeReviewResult({
            text: await this.evaluator.evaluate(envelope),
            definition,
            runId: active.runId,
            evidence: envelope.evidence,
            reviewedAt
          })
      const checklist = derivePracticeChecklist(definition, result, active.checklist)
      const completion: PracticeCompletionReceipt | undefined = result.verdict === 'passed'
        ? {
            schemaVersion: 1,
            courseRunId: learnerProgress.courseRunId,
            practiceId: definition.practiceId,
            practiceVersion: definition.version,
            runId: active.runId,
            checkpointId: definition.checkpointId,
            status: 'completed',
            completedAt: reviewedAt,
            evidenceSummary: result.summary,
            masterySummary: 'Triết đã xác minh đủ năm thiết lập Codex bắt buộc từ metadata hiệu lực của đúng task.',
            destination: structuredClone(definition.completionDestination),
            ...(definition.practiceId === 'm1-codex-safe-setup' && envelope.configuration
              ? {
                  approvedConfiguration: {
                    schemaVersion: 1 as const,
                    sourcePracticeId: 'm1-codex-safe-setup' as const,
                    sourcePracticeVersion: definition.version,
                    model: 'gpt-5.6-sol' as const,
                    reasoningEffort: 'high' as const,
                    serviceTier: 'standard' as const,
                    approvedAt: reviewedAt
                  }
                }
              : {})
          }
        : undefined
      const saved = await this.runs.saveReview({
        runId: active.runId,
        generation: active.generation,
        practiceId: definition.practiceId,
        practiceVersion: definition.version,
        result,
        checklist,
        completion,
        updatedAt: reviewedAt
      })
      if (saved.activeRun?.runId !== active.runId
        || saved.activeRun.generation !== active.generation
        || saved.activeRun.reviewResult?.sourceDigest !== result.sourceDigest) {
        throw new Error('Practice đã thay đổi trong khi Triết đang duyệt. Kết quả cũ không được lưu.')
      }
      if (saved.activeRun.completion) {
        await this.progress.recordPracticeCompletion(saved.activeRun.completion)
      }

      const reported = envelope.evidence.some((item) =>
        item.kind === 'executor-reported-verification' && result.criteria.some((criterion) =>
          criterion.evidenceRefs.includes(item.id)))
      const details = result.criteria
        .filter((criterion) => criterion.status !== 'satisfied')
        .map((criterion) => criterion.explanation)
        .slice(0, 3)
      const content = [
        result.summary,
        ...(definition.evidenceProfile === 'codex-task-configuration'
          ? configurationGuidance(envelope.configuration, result)
          : []),
        ...details,
        ...(reported
          ? ['L\u01b0u \u00fd: k\u1ebft qu\u1ea3 ki\u1ec3m ch\u1ee9ng n\u00e0y do Executor b\u00e1o c\u00e1o; Course Companion ch\u01b0a t\u1ef1 ch\u1ea1y l\u1ea1i c\u00e1c ki\u1ec3m tra.']
          : []),
        ...(result.verdict === 'passed'
          ? ['Bạn đã vượt qua Practice. Dùng biểu tượng quay lại khóa học để tiếp tục phần mastery.']
          : ['Hãy bổ sung phần còn thiếu rồi yêu cầu Triết duyệt lại.'])
      ].join('\n\n')
      const teacherMessage: TeacherMessage = {
        schemaVersion: 1,
        id: this.createId(),
        role: 'teacher',
        source: this.simulated ? 'fixture' : 'live',
        content,
        timestamp: this.now().toISOString(),
        checkpointId: completion?.checkpointId,
        practiceRunId: active.runId,
        deliveryStatus: 'delivered'
      }
      await this.chat.append([teacherMessage])
      return {
        workspace: await this.coordinator.loadWorkspace({
          practiceId: active.practiceId,
          practiceVersion: active.practiceVersion
        }),
        teacherMessage
      }
    } catch (error) {
      await this.runs.clearReviewing({
        runId: active.runId,
        generation: active.generation,
        practiceId: definition.practiceId,
        practiceVersion: definition.version,
        updatedAt: this.now().toISOString()
      }).catch(() => undefined)
      throw error
    }
  }

  async passedCompletion(): Promise<PracticeCompletionReceipt> {
    const active = (await this.runs.load()).activeRun
    if (!active || active.reviewStatus !== 'passed' || !active.completion) {
      throw new Error('Practice chưa được Triết xác nhận là đã đạt.')
    }
    return structuredClone(active.completion)
  }

  async returnPassedPractice(): Promise<PracticeCompletionReceipt> {
    const receipt = await this.passedCompletion()
    await this.progress.returnFromPractice(receipt)
    return receipt
  }
}
