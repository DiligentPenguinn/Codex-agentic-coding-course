import type {
  PracticeChecklistStep,
  PracticeDefinition,
  PracticeReviewChangedStep,
  PracticeReviewComparisonView,
  PracticeReviewResult
} from '../../shared/contracts'

function verifiedSteps(
  definition: PracticeDefinition,
  result: PracticeReviewResult
): Set<string> {
  const criteria = new Map(result.criteria.map((criterion) => [criterion.criterionId, criterion]))
  return new Set(definition.checklist
    .filter((step) => {
      const required = definition.criteria.filter((criterion) =>
        criterion.required && criterion.checklistStepId === step.id)
      return required.every((criterion) => criteria.get(criterion.id)?.status === 'satisfied')
    })
    .map((step) => step.id))
}

function changedStep(
  definition: PracticeDefinition,
  result: PracticeReviewResult,
  checklist: PracticeChecklistStep[],
  stepId: string,
  includeReason: boolean
): PracticeReviewChangedStep {
  const step = definition.checklist.find((candidate) => candidate.id === stepId)!
  const checklistReason = checklist.find((candidate) => candidate.id === stepId)?.reason
  const criterionReason = definition.criteria
    .filter((criterion) => criterion.required && criterion.checklistStepId === stepId)
    .map((criterion) => result.criteria.find((review) => review.criterionId === criterion.id))
    .find((review) => review?.status !== 'satisfied')?.explanation
  return {
    stepId,
    title: step.title,
    ...(includeReason && (checklistReason || criterionReason)
      ? { reason: checklistReason || criterionReason }
      : {})
  }
}

export function derivePracticeReviewComparison(input: {
  definition: PracticeDefinition
  previous: PracticeReviewResult | null
  current: PracticeReviewResult
  checklist: PracticeChecklistStep[]
}): PracticeReviewComparisonView {
  const current = verifiedSteps(input.definition, input.current)
  const previous = input.previous ? verifiedSteps(input.definition, input.previous) : null
  const newlyVerifiedIds = previous
    ? [...current].filter((stepId) => !previous.has(stepId))
    : []
  const needsReverificationIds = previous
    ? [...previous].filter((stepId) => !current.has(stepId))
    : []
  return {
    kind: previous === null
      ? 'first-review'
      : newlyVerifiedIds.length || needsReverificationIds.length ? 'changed' : 'unchanged',
    previousReviewedAt: input.previous?.reviewedAt ?? null,
    currentReviewedAt: input.current.reviewedAt,
    previousCompletedCount: previous?.size ?? null,
    currentCompletedCount: current.size,
    totalStepCount: input.definition.checklist.length,
    newlyVerified: newlyVerifiedIds.map((stepId) =>
      changedStep(input.definition, input.current, input.checklist, stepId, false)),
    needsReverification: needsReverificationIds.map((stepId) =>
      changedStep(input.definition, input.current, input.checklist, stepId, true))
  }
}
