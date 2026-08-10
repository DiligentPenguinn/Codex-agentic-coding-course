import type { PracticeCriterionReview } from '../../shared/contracts'
import type { PracticeReviewEnvelope } from './practice-review-context'
import { buildPracticeReviewPrompt } from './practice-review-context'

export type PracticeReviewEvaluator = {
  evaluate: (envelope: PracticeReviewEnvelope) => Promise<string>
}

export type TeacherResponder = {
  respond: (input: string) => Promise<string>
}

export class LivePracticeReviewEvaluator implements PracticeReviewEvaluator {
  constructor(private readonly responder: TeacherResponder) {}

  evaluate(envelope: PracticeReviewEnvelope): Promise<string> {
    return this.responder.respond(buildPracticeReviewPrompt(envelope))
  }
}

export class DeterministicPracticeReviewEvaluator implements PracticeReviewEvaluator {
  async evaluate(envelope: PracticeReviewEnvelope): Promise<string> {
    const nonTeacher = envelope.definition.criteria.filter((criterion) =>
      !criterion.acceptedEvidence.includes('teacher-assessment'))
    const initial = nonTeacher.map((criterion): PracticeCriterionReview => {
      const candidates = envelope.evidence.filter((evidence) =>
        criterion.acceptedEvidence.includes(evidence.kind))
      const usable = candidates.filter((evidence) =>
        criterion.freshness === 'any' || evidence.freshness === 'fresh')
      return {
        criterionId: criterion.id,
        status: usable.length > 0
          ? 'satisfied'
          : candidates.length > 0 ? 'unverifiable' : 'unsatisfied',
        evidenceRefs: usable.map((evidence) => evidence.id),
        explanation: usable.length > 0
          ? 'C\u00f3 b\u1eb1ng ch\u1ee9ng ph\u00f9 h\u1ee3p v\u1edbi ti\u00eau ch\u00ed.'
          : candidates.length > 0
            ? 'B\u1eb1ng ch\u1ee9ng hi\u1ec7n c\u00f3 ch\u01b0a \u0111\u1ee7 m\u1edbi \u0111\u1ec3 ki\u1ec3m ch\u1ee9ng.'
            : 'Ch\u01b0a c\u00f3 b\u1eb1ng ch\u1ee9ng ph\u00f9 h\u1ee3p v\u1edbi ti\u00eau ch\u00ed.'
      }
    })
    const allRequiredInputsSatisfied = nonTeacher
      .filter((criterion) => criterion.required)
      .every((criterion) => initial.find((result) => result.criterionId === criterion.id)?.status === 'satisfied')
    const teacherCriteria = envelope.definition.criteria
      .filter((criterion) => criterion.acceptedEvidence.includes('teacher-assessment'))
      .map((criterion): PracticeCriterionReview => ({
        criterionId: criterion.id,
        status: allRequiredInputsSatisfied ? 'satisfied' : 'unsatisfied',
        evidenceRefs: allRequiredInputsSatisfied ? ['teacher-assessment:1'] : [],
        explanation: allRequiredInputsSatisfied
          ? 'H\u01b0\u01a1ng \u0111\u00e3 \u0111\u1ed1i chi\u1ebfu to\u00e0n b\u1ed9 ti\u00eau ch\u00ed b\u1eaft bu\u1ed9c.'
          : 'C\u1ea7n b\u1ed5 sung b\u1eb1ng ch\u1ee9ng b\u1eaft bu\u1ed9c tr\u01b0\u1edbc khi H\u01b0\u01a1ng c\u00f3 th\u1ec3 k\u1ebft lu\u1eadn.'
      }))
    const criteria = [...initial, ...teacherCriteria]
    const byId = new Map(criteria.map((criterion) => [criterion.criterionId, criterion.status]))
    const passed = envelope.definition.criteria
      .filter((criterion) => criterion.required)
      .every((criterion) => byId.get(criterion.id) === 'satisfied')
    return JSON.stringify({
      schemaVersion: 1,
      practiceId: envelope.definition.practiceId,
      practiceVersion: envelope.definition.version,
      runId: envelope.run.runId,
      verdict: passed ? 'passed' : 'needs-work',
      criteria,
      summary: passed
        ? 'B\u1ea1n \u0111\u00e3 \u0111\u00e1p \u1ee9ng to\u00e0n b\u1ed9 ti\u00eau ch\u00ed b\u1eaft bu\u1ed9c c\u1ee7a Practice.'
        : 'Practice ch\u01b0a \u0111\u1ee7 b\u1eb1ng ch\u1ee9ng \u0111\u1ec3 ho\u00e0n th\u00e0nh.'
    })
  }
}
