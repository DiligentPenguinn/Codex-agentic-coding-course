import { randomUUID } from 'node:crypto'
import type {
  PracticeCompletionReceipt,
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
  parsePracticeReviewResult
} from './practice-review-contracts'
import { buildPracticeReviewEnvelope } from './practice-review-context'
import type { PracticeReviewEvaluator } from './practice-review-evaluator'
import { PracticeRunRepository, type PracticeRunRecord } from './practice-run-repository'

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
    const definition = await this.definitions.load(active.practiceId ?? 'm1-verifiable-brief')
    if (active.practiceVersion && active.practiceVersion !== definition.version) {
      throw new Error('N\u1ed9i dung Practice \u0111\u00e3 thay \u0111\u1ed5i. H\u00e3y b\u1eaft \u0111\u1ea7u m\u1ed9t l\u01b0\u1ee3t Practice m\u1edbi.')
    }
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
      throw new Error('Practice \u0111\u00e3 thay \u0111\u1ed5i tr\u01b0\u1edbc khi H\u01b0\u01a1ng b\u1eaft \u0111\u1ea7u duy\u1ec7t.')
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
      const result = parsePracticeReviewResult({
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
            masterySummary: '\u0110\u00e3 \u0111\u00e1p \u1ee9ng t\u1ea5t c\u1ea3 ti\u00eau ch\u00ed b\u1eaft bu\u1ed9c c\u1ee7a Practice.',
            destination: structuredClone(definition.completionDestination)
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
        throw new Error('Practice \u0111\u00e3 thay \u0111\u1ed5i trong khi H\u01b0\u01a1ng \u0111ang duy\u1ec7t. K\u1ebft qu\u1ea3 c\u0169 kh\u00f4ng \u0111\u01b0\u1ee3c l\u01b0u.')
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
        ...details,
        ...(reported
          ? ['L\u01b0u \u00fd: k\u1ebft qu\u1ea3 ki\u1ec3m ch\u1ee9ng n\u00e0y do Executor b\u00e1o c\u00e1o; Course Companion ch\u01b0a t\u1ef1 ch\u1ea1y l\u1ea1i c\u00e1c ki\u1ec3m tra.']
          : []),
        ...(result.verdict === 'passed'
          ? ['B\u1ea1n \u0111\u00e3 v\u01b0\u1ee3t qua Practice. D\u00f9ng bi\u1ec3u t\u01b0\u1ee3ng quay l\u1ea1i kh\u00f3a h\u1ecdc \u0111\u1ec3 ho\u00e0n th\u00e0nh ph\u1ea7n ph\u1ea3n t\u01b0.']
          : ['H\u00e3y b\u1ed5 sung ph\u1ea7n c\u00f2n thi\u1ebfu r\u1ed3i y\u00eau c\u1ea7u H\u01b0\u01a1ng duy\u1ec7t l\u1ea1i.'])
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
        workspace: await this.coordinator.loadWorkspace(),
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
      throw new Error('Practice ch\u01b0a \u0111\u01b0\u1ee3c H\u01b0\u01a1ng x\u00e1c nh\u1eadn l\u00e0 \u0111\u00e3 \u0111\u1ea1t.')
    }
    return structuredClone(active.completion)
  }

  async returnPassedPractice(): Promise<PracticeCompletionReceipt> {
    const receipt = await this.passedCompletion()
    await this.progress.returnFromPractice(receipt)
    return receipt
  }
}
