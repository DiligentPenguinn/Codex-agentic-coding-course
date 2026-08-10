import { createHash } from 'node:crypto'
import type {
  PracticeChecklistStep,
  PracticeDefinition,
  PracticeEvidenceReference,
  PracticeReviewResult
} from '../../shared/contracts'

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function bounded(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum
}

function jsonText(text: string): string {
  const trimmed = text.trim()
  if (!trimmed.startsWith('```')) return trimmed
  return trimmed.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
}

export function reviewSourceDigest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

export function parsePracticeReviewResult(input: {
  text: string
  definition: PracticeDefinition
  runId: string
  evidence: PracticeEvidenceReference[]
  reviewedAt: string
}): PracticeReviewResult {
  const parsed = record(JSON.parse(jsonText(input.text)))
  if (!parsed) throw new Error('Practice review must be an object')
  if (parsed.schemaVersion !== 1
    || parsed.practiceId !== input.definition.practiceId
    || parsed.practiceVersion !== input.definition.version
    || parsed.runId !== input.runId
    || (parsed.verdict !== 'needs-work' && parsed.verdict !== 'passed')
    || !bounded(parsed.summary, 1500)
    || !Array.isArray(parsed.criteria)) {
    throw new Error('Invalid Practice review identity or shape')
  }
  const evidenceIds = new Set(input.evidence.map((item) => item.id))
  const definitionIds = new Set(input.definition.criteria.map((criterion) => criterion.id))
  const seen = new Set<string>()
  const criteria = parsed.criteria.map((value) => {
    const item = record(value)
    if (!item || !bounded(item.criterionId, 160) || !definitionIds.has(item.criterionId)
      || seen.has(item.criterionId)
      || !['satisfied', 'unsatisfied', 'unverifiable'].includes(String(item.status))
      || !Array.isArray(item.evidenceRefs)
      || !item.evidenceRefs.every((reference) => typeof reference === 'string' && evidenceIds.has(reference))
      || !bounded(item.explanation, 1000)) {
      throw new Error('Invalid Practice criterion review')
    }
    const criterionDefinition = input.definition.criteria.find((criterion) =>
      criterion.id === item.criterionId)
    const referencedEvidence = (item.evidenceRefs as string[]).map((reference) =>
      input.evidence.find((evidence) => evidence.id === reference)!)
    if (!criterionDefinition
      || referencedEvidence.some((evidence) =>
        !criterionDefinition.acceptedEvidence.includes(evidence.kind))
      || (item.status === 'satisfied' && referencedEvidence.length === 0)
      || (item.status === 'satisfied'
        && criterionDefinition.freshness === 'fresh'
        && referencedEvidence.some((evidence) => evidence.freshness !== 'fresh'))) {
      throw new Error('Practice criterion used unacceptable evidence')
    }
    seen.add(item.criterionId)
    return {
      criterionId: item.criterionId,
      status: item.status as 'satisfied' | 'unsatisfied' | 'unverifiable',
      evidenceRefs: [...new Set(item.evidenceRefs as string[])],
      explanation: item.explanation
    }
  })
  const required = input.definition.criteria.filter((criterion) => criterion.required)
  if (!required.every((criterion) => seen.has(criterion.id))) {
    throw new Error('Practice review omitted a required criterion')
  }
  const byId = new Map(criteria.map((criterion) => [criterion.criterionId, criterion]))
  const allRequiredSatisfied = required.every((criterion) => byId.get(criterion.id)?.status === 'satisfied')
  if ((parsed.verdict === 'passed') !== allRequiredSatisfied) {
    throw new Error('Practice review verdict contradicts required criteria')
  }
  return {
    schemaVersion: 1,
    practiceId: input.definition.practiceId,
    practiceVersion: input.definition.version,
    runId: input.runId,
    verdict: parsed.verdict,
    criteria,
    summary: parsed.summary,
    reviewedAt: input.reviewedAt,
    sourceDigest: reviewSourceDigest({
      practiceId: input.definition.practiceId,
      practiceVersion: input.definition.version,
      runId: input.runId,
      evidence: input.evidence,
      criteria
    })
  }
}

export function derivePracticeChecklist(
  definition: PracticeDefinition,
  result: PracticeReviewResult,
  previous: PracticeChecklistStep[] = []
): PracticeChecklistStep[] {
  const results = new Map(result.criteria.map((criterion) => [criterion.criterionId, criterion.status]))
  const previouslyCompleted = new Set(previous
    .filter((step) => step.status === 'completed')
    .map((step) => step.id))
  const completed = new Set<string>()

  for (const step of definition.checklist) {
    const required = definition.criteria.filter((criterion) =>
      criterion.required && criterion.checklistStepId === step.id)
    const allSatisfied = required.every((criterion) => results.get(criterion.id) === 'satisfied')
    const hasFreshRegression = required.some((criterion) =>
      criterion.freshness === 'fresh' && results.get(criterion.id) !== 'satisfied')
    if (result.verdict === 'passed'
      || allSatisfied
      || (previouslyCompleted.has(step.id) && !hasFreshRegression)) {
      completed.add(step.id)
    }
  }

  const firstUnmet = definition.checklist.findIndex((step) => !completed.has(step.id))
  return definition.checklist.map((step, index) => ({
    id: step.id,
    title: step.title,
    status: completed.has(step.id)
      ? 'completed'
      : index === firstUnmet ? 'current' : 'upcoming'
  }))
}
