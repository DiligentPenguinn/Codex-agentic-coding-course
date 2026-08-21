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
import type { PracticeEvidenceAdapterRegistry } from './practice-evidence-adapter-registry'
import { reconcilePlanningStepState } from './practice-step-state'

const configurationChecks = [
  {
    field: 'model',
    criterionId: 'model-matches',
    label: 'Model',
    expected: 'gpt-5.6-sol',
    expectedLabel: '5.6 Sol',
    action: 'Trong task Codex, mở bộ chọn Model và chọn 5.6 Sol.'
  },
  {
    field: 'reasoningEffort',
    criterionId: 'effort-matches',
    label: 'Effort',
    expected: 'high',
    expectedLabel: 'High',
    action: 'Trong task Codex, mở Effort và chọn High.'
  },
  {
    field: 'serviceTier',
    criterionId: 'speed-matches',
    label: 'Speed',
    expected: 'standard',
    expectedLabel: 'Standard',
    action: 'Trong task Codex, mở Speed và chọn Standard.'
  },
  {
    field: 'approvalPolicy',
    criterionId: 'approval-matches',
    label: 'Approval',
    expected: 'on-request',
    expectedLabel: 'Approve for me',
    action: 'Trong task Codex, mở Approval và chọn Approve for me.'
  },
  {
    field: 'fullAccess',
    criterionId: 'full-access-off',
    label: 'Full access',
    expected: 'off',
    expectedLabel: 'Off',
    action: 'Trong task Codex, tắt Full access.'
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

function planningGuidance(
  envelope: PracticeReviewEnvelope,
  result: PracticeReviewResult
): string[] {
  const labels = new Map(envelope.definition.criteria.map((criterion) => [
    criterion.id,
    criterion.description
  ]))
  const passed = result.criteria
    .filter((criterion) => criterion.status === 'satisfied')
    .map((criterion) => labels.get(criterion.criterionId) ?? criterion.criterionId)
  const problems = result.criteria.filter((criterion) => criterion.status !== 'satisfied')
  const prd = envelope.planning?.artifacts.find((artifact) =>
    artifact.path === 'artifacts/PRD.md')
  const plan = envelope.planning?.artifacts.find((artifact) =>
    artifact.path === 'artifacts/implementation-plan.md')
  const nextByCriterion: Record<string, string> = {
    'prd-quality': 'Sửa PRD theo vấn đề đầu tiên được nêu rồi phê duyệt lại PRD.',
    'plan-quality': 'Sửa implementation plan theo vấn đề đầu tiên được nêu rồi kiểm tra lại từng bước.',
    'artifact-alignment': 'Đối chiếu lại bốn điểm alignment và xác nhận lại trên đúng hai artifact hiện tại.',
    'scope-control': 'Khôi phục thay đổi ngoài phạm vi hoặc loại bỏ implementation code khỏi planning package.',
    'learner-ownership': 'Hoàn tất phê duyệt hoặc viết lời giải thích quyết định phạm vi bằng lời của bạn.',
    'evidence-freshness': 'Làm mới bằng chứng và phê duyệt lại trên đúng digest hiện tại.'
  }
  const firstProblem = problems[0]
  return [
    'Kết luận: ' + (result.verdict === 'passed' ? 'Đạt.' : 'Cần chỉnh sửa.'),
    'Bằng chứng đã duyệt: '
      + (prd ? 'PRD ' + prd.digest.slice(0, 12) : 'thiếu PRD')
      + '; '
      + (plan ? 'implementation plan ' + plan.digest.slice(0, 12) : 'thiếu implementation plan')
      + '; phê duyệt, alignment, quyết định phạm vi và provenance của run hiện tại.',
    'Đã đạt: ' + (passed.length > 0 ? passed.join(' ') : 'Chưa có tiêu chí nào được xác nhận.'),
    ...(problems.length > 0
      ? ['Cần sửa: ' + problems.map((criterion) => criterion.explanation).join(' ')]
      : []),
    'Thao tác tiếp theo: ' + (firstProblem
      ? nextByCriterion[firstProblem.criterionId]
        ?? 'Sửa vấn đề đầu tiên rồi yêu cầu Triết duyệt lại.'
      : 'Quay lại khóa học để tiếp tục phần kiểm tra cuối Module 2.')
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
    private readonly createId: () => string = randomUUID,
    private readonly evidenceAdapters?: PracticeEvidenceAdapterRegistry
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
    let reviewRun = active
    let activity = definition.evidenceProfile === 'planning-package'
      ? await this.activity.bind(active.binding)
      : null
    if (definition.evidenceProfile === 'codex-task-configuration') {
      activity = await this.activity.bind(active.binding)
      const refreshed = await this.runs.saveConfiguration({
        runId: active.runId,
        generation: active.generation,
        practiceId: active.practiceId,
        practiceVersion: active.practiceVersion,
        configuration: activity.configuration,
        updatedAt: activity.configuration?.observedAt ?? reviewedAt
      })
      if (!refreshed.activeRun
        || refreshed.activeRun.runId !== active.runId
        || refreshed.activeRun.generation !== active.generation) {
        throw new Error('Practice đã thay đổi trước khi Triết thu thập cấu hình task.')
      }
      if (active.completion && !refreshed.activeRun.completion) {
        await this.progress.revokePracticeCompletion(active.completion)
      }
      reviewRun = refreshed.activeRun
    }
    if (definition.evidenceProfile === 'planning-package' || definition.evidenceProfile === 'portfolio-build') {
      if (!this.evidenceAdapters) throw new Error('Practice evidence adapter is unavailable.')
      const evidence = await this.evidenceAdapters.resolve(definition.evidenceProfile).collect({
        definition,
        runId: active.runId,
        generation: active.generation,
        workspaceRoot: active.binding.workspaceRoot,
        task: {
          threadId: active.binding.threadId,
          workspaceRoot: active.binding.workspaceRoot
        }
      })
      const refreshed = await this.runs.saveEvidence({
        runId: active.runId,
        generation: active.generation,
        practiceId: active.practiceId,
        practiceVersion: active.practiceVersion,
        evidence,
        checklist: active.checklist,
        invalidations: evidence.invalidations,
        updatedAt: evidence.observedAt
      })
      if (!refreshed.activeRun
        || refreshed.activeRun.runId !== active.runId
        || refreshed.activeRun.generation !== active.generation) {
        throw new Error('Practice đã thay đổi trước khi Triết thu thập bằng chứng.')
      }
      reviewRun = refreshed.activeRun
    }
    const reviewing = await this.runs.beginReview({
      runId: reviewRun.runId,
      generation: reviewRun.generation,
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      updatedAt: reviewedAt
    })
    if (reviewing.activeRun?.runId !== reviewRun.runId
      || reviewing.activeRun.generation !== reviewRun.generation
      || reviewing.activeRun.reviewStatus !== 'reviewing') {
      throw new Error('Practice đã thay đổi trước khi Triết bắt đầu duyệt.')
    }

    try {
      const progressResult = await this.progress.load()
      const learnerProgress = progressResult.status === 'returning' || progressResult.status === 'recovered'
        ? progressResult.progress
        : null
      if (!learnerProgress) throw new Error('Kh\u00f4ng th\u1ec3 t\u1ea3i ti\u1ebfn tr\u00ecnh kh\u00f3a h\u1ecdc \u0111\u1ec3 duy\u1ec7t Practice.')

      activity ??= await this.activity.bind(reviewRun.binding)
      const frozenRun = reviewing.activeRun
      const envelope = buildPracticeReviewEnvelope({
        definition,
        run: frozenRun,
        activity,
        decisions: definition.evidenceProfile === 'planning-package'
          ? frozenRun.learnerDecisions
          : learnerProgress.decisions,
        generatedAt: reviewedAt
      })
      const result = definition.evidenceProfile === 'codex-task-configuration'
        ? evaluateConfiguration(envelope, definition, active.runId, reviewedAt)
        : parsePracticeReviewResult({
            text: await this.evaluator.evaluate(envelope),
            definition,
            runId: active.runId,
            evidence: envelope.evidence,
            reviewedAt,
            planningEvidenceDigest: envelope.planning?.evidenceDigest
          })
      if (definition.evidenceProfile === 'planning-package' || definition.evidenceProfile === 'portfolio-build') {
        const latestActivity = await this.activity.bind(reviewRun.binding)
        activity = latestActivity
        const latestEvidence = await this.evidenceAdapters!.resolve(definition.evidenceProfile).collect({
          definition,
          runId: reviewRun.runId,
          generation: reviewRun.generation,
          workspaceRoot: reviewRun.binding.workspaceRoot,
          task: {
            threadId: reviewRun.binding.threadId,
            workspaceRoot: reviewRun.binding.workspaceRoot
          }
        })
        const latestWorkspace = await this.runs.saveEvidence({
          runId: reviewRun.runId,
          generation: reviewRun.generation,
          practiceId: reviewRun.practiceId,
          practiceVersion: reviewRun.practiceVersion,
          evidence: latestEvidence,
          checklist: frozenRun.checklist,
          invalidations: latestEvidence.invalidations,
          updatedAt: latestEvidence.observedAt
        })
        const latestRun = latestWorkspace.activeRun
        if (!latestRun
          || latestRun.runId !== reviewRun.runId
          || latestRun.generation !== reviewRun.generation) {
          throw new Error('Practice đã thay đổi trong khi Triết đang duyệt.')
        }
        if (frozenRun.completion && !latestRun.completion) {
          await this.progress.revokePracticeCompletion(frozenRun.completion)
        }
        const latestEnvelope = buildPracticeReviewEnvelope({
          definition,
          run: latestRun,
          activity: latestActivity,
          decisions: latestRun.learnerDecisions,
          generatedAt: reviewedAt
        })
        const evidenceChanged = definition.evidenceProfile === 'planning-package'
          ? !envelope.planning
            || !latestEnvelope.planning
            || latestEnvelope.planning.evidenceDigest !== envelope.planning.evidenceDigest
          : !envelope.portfolioBuild
            || !latestEnvelope.portfolioBuild
            || latestRun.evidence?.sourceDigest !== frozenRun.evidence?.sourceDigest
        if (evidenceChanged) {
          throw new Error('Artifact hoặc quyết định của Practice đã thay đổi trong khi Triết đang duyệt. Kết quả cũ không được lưu.')
        }
        reviewRun = latestRun
      }
      const checklist = definition.evidenceProfile === 'planning-package'
        ? reconcilePlanningStepState({
            checklist: reviewRun.checklist,
            previousEvidence: reviewRun.evidence,
            evidence: reviewRun.evidence!,
            learnerDecisions: reviewRun.learnerDecisions,
            learnerApprovals: reviewRun.learnerApprovals,
            priorInvalidations: reviewRun.invalidations,
            reviewStatus: result.verdict,
            hasCompletion: false
          }).checklist
        : derivePracticeChecklist(definition, result, active.checklist)
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
            masterySummary: definition.evidenceProfile === 'planning-package'
              ? 'Triết đã duyệt semantic PRD, implementation plan, alignment, phạm vi và quyền sở hữu của người học trên đúng hai digest hiện tại.'
              : 'Triết đã xác minh đủ năm thiết lập Codex bắt buộc từ metadata hiệu lực của đúng task.',
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
        runId: reviewRun.runId,
        generation: reviewRun.generation,
        practiceId: definition.practiceId,
        practiceVersion: definition.version,
        result,
        checklist,
        completion,
        updatedAt: reviewedAt
      })
      if (saved.activeRun?.runId !== reviewRun.runId
        || saved.activeRun.generation !== reviewRun.generation
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
      const content = definition.evidenceProfile === 'planning-package'
        ? [result.summary, ...planningGuidance(envelope, result)].join('\n\n')
        : [
        result.summary,
        ...(definition.evidenceProfile === 'codex-task-configuration'
          ? configurationGuidance(envelope.configuration, result)
          : []),
        ...details,
        ...(reported
          ? ['L\u01b0u \u00fd: k\u1ebft qu\u1ea3 ki\u1ec3m ch\u1ee9ng n\u00e0y do Codex b\u00e1o c\u00e1o; Course Companion ch\u01b0a t\u1ef1 ch\u1ea1y l\u1ea1i c\u00e1c ki\u1ec3m tra.']
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
      const workspace = await this.coordinator.loadWorkspace({
          practiceId: active.practiceId,
          practiceVersion: active.practiceVersion
        })
      return {
        workspace: envelope.configuration
          ? { ...workspace, configuration: structuredClone(envelope.configuration) }
          : workspace,
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
