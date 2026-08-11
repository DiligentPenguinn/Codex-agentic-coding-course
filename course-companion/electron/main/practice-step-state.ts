import { createHash } from 'node:crypto'
import type {
  PlanningArtifactPath,
  PlanningPracticeActionRequest,
  PracticeAdapterEvidenceState,
  PracticeChecklistStep,
  PracticeEvidenceInvalidation,
  PracticeLearnerApproval,
  PracticeReviewStatus
} from '../../shared/contracts'

export const planningPracticeStepIds = [
  'write-prd-prompt',
  'complete-interview',
  'approve-prd',
  'draft-plan',
  'reconcile-alignment',
  'approve-plan',
  'explain-scope-and-review',
  'return-to-course'
] as const

const PRD_PATH = 'artifacts/PRD.md' as const
const PLAN_PATH = 'artifacts/implementation-plan.md' as const
const DIGEST = /^[a-f0-9]{64}$/

type PlanningDecisions = Record<string, string>
type PlanningApprovals = Record<string, PracticeLearnerApproval>

export type PlanningStepStateInput = {
  checklist: PracticeChecklistStep[]
  previousEvidence: PracticeAdapterEvidenceState | null
  evidence: PracticeAdapterEvidenceState
  learnerDecisions: PlanningDecisions
  learnerApprovals: PlanningApprovals
  priorInvalidations?: PracticeEvidenceInvalidation[]
  reviewStatus: PracticeReviewStatus
  hasCompletion: boolean
}

export type PlanningStepStateResult = {
  checklist: PracticeChecklistStep[]
  learnerDecisions: PlanningDecisions
  learnerApprovals: PlanningApprovals
  invalidations: PracticeEvidenceInvalidation[]
}

function hash(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function artifactDigest(
  evidence: PracticeAdapterEvidenceState | null,
  path: PlanningArtifactPath
): string | null {
  return evidence?.planningArtifacts?.find((artifact) => artifact.path === path)?.digest ?? null
}

function artifactDigests(evidence: PracticeAdapterEvidenceState): {
  prdDigest: string | null
  planDigest: string | null
} {
  return {
    prdDigest: artifactDigest(evidence, PRD_PATH),
    planDigest: artifactDigest(evidence, PLAN_PATH)
  }
}

function alignmentKey(prdDigest: string, planDigest: string): string {
  return prdDigest + ':' + planDigest
}

function approvalMatches(
  approval: PracticeLearnerApproval | undefined,
  expected: Partial<Record<PlanningArtifactPath, string>>
): boolean {
  return Boolean(
    approval?.decision === 'approved'
    && Object.entries(expected).every(([path, digest]) =>
      approval.artifactDigests[path as PlanningArtifactPath] === digest)
  )
}

function assertCanonicalChecklist(checklist: PracticeChecklistStep[]): void {
  if (checklist.length !== planningPracticeStepIds.length
    || checklist.some((step, index) => step.id !== planningPracticeStepIds[index])) {
    throw new Error('Invalid Module 2 Practice step order')
  }
}

function invalidation(
  changedInput: PlanningArtifactPath,
  affectedStepIds: string[],
  reason: string,
  nextAction: string
): PracticeEvidenceInvalidation {
  return { changedInput, affectedStepIds, reason, nextAction }
}

export function reconcilePlanningStepState(
  input: Readonly<PlanningStepStateInput>
): PlanningStepStateResult {
  assertCanonicalChecklist(input.checklist)
  const { prdDigest, planDigest } = artifactDigests(input.evidence)
  const previousPrdDigest = artifactDigest(input.previousEvidence, PRD_PATH)
  const previousPlanDigest = artifactDigest(input.previousEvidence, PLAN_PATH)
  const prdChanged = Boolean(previousPrdDigest && previousPrdDigest !== prdDigest)
  const planChanged = !prdChanged && Boolean(previousPlanDigest && previousPlanDigest !== planDigest)
  const learnerDecisions = structuredClone(input.learnerDecisions)
  const learnerApprovals = structuredClone(input.learnerApprovals)
  let invalidations: PracticeEvidenceInvalidation[] = []

  if (prdChanged) {
    delete learnerApprovals['prd-approval']
    delete learnerApprovals['plan-approval']
    delete learnerDecisions['alignment-confirmed']
    invalidations.push(invalidation(
      PRD_PATH,
      [
        'approve-prd',
        'draft-plan',
        'reconcile-alignment',
        'approve-plan',
        'explain-scope-and-review'
      ],
      'PRD vừa thay đổi nên các quyết định phụ thuộc không còn khớp với bản hiện tại.',
      'Hãy duyệt lại PRD, cập nhật plan theo PRD rồi kiểm tra lại alignment.'
    ))
  } else if (planChanged) {
    delete learnerApprovals['plan-approval']
    delete learnerDecisions['alignment-confirmed']
    invalidations.push(invalidation(
      PLAN_PATH,
      ['reconcile-alignment', 'approve-plan', 'explain-scope-and-review'],
      'Implementation plan vừa thay đổi nên alignment, phê duyệt package và kết quả review không còn mới.',
      'Hãy kiểm tra lại bốn điểm alignment rồi duyệt lại implementation plan.'
    ))
  } else {
    invalidations = structuredClone(input.priorInvalidations ?? [])
  }

  if (learnerApprovals['prd-approval'] && (!prdDigest || !approvalMatches(
    learnerApprovals['prd-approval'],
    { [PRD_PATH]: prdDigest }
  ))) {
    delete learnerApprovals['prd-approval']
  }
  if (learnerApprovals['plan-approval'] && (!prdDigest || !planDigest || !approvalMatches(
    learnerApprovals['plan-approval'],
    { [PRD_PATH]: prdDigest, [PLAN_PATH]: planDigest }
  ))) {
    delete learnerApprovals['plan-approval']
  }

  const prompt = learnerDecisions['prd-prompt']?.trim() ?? ''
  const interview = learnerDecisions['interview-completion']?.trim() ?? ''
  const scopeDecision = learnerDecisions['scope-decision']?.trim() ?? ''
  const prdApproved = Boolean(prdDigest && approvalMatches(
    learnerApprovals['prd-approval'],
    { [PRD_PATH]: prdDigest }
  ))
  const planRequiresPrdRefresh = invalidations.some((item) =>
    item.changedInput === PRD_PATH && item.affectedStepIds.includes('draft-plan'))
  const planCurrentForPrd = Boolean(
    prdDigest
    && planDigest
    && !planRequiresPrdRefresh
    && (!prdChanged || previousPlanDigest !== planDigest)
  )
  const aligned = Boolean(
    prdDigest
    && planDigest
    && learnerDecisions['alignment-confirmed'] === alignmentKey(prdDigest, planDigest)
  )
  const planApproved = Boolean(
    prdDigest
    && planDigest
    && approvalMatches(learnerApprovals['plan-approval'], {
      [PRD_PATH]: prdDigest,
      [PLAN_PATH]: planDigest
    })
  )
  const fulfilled = [
    prompt.length > 0,
    interview.length > 0,
    prdApproved,
    prdApproved && planCurrentForPrd,
    prdApproved && planCurrentForPrd && aligned,
    prdApproved && planCurrentForPrd && aligned && planApproved,
    prdApproved
      && planCurrentForPrd
      && aligned
      && planApproved
      && scopeDecision.length > 0
      && input.reviewStatus === 'passed',
    input.hasCompletion
  ]
  const dependencyInputs: Array<Record<string, string>> = [
    prompt ? { prompt: hash(prompt) } : {},
    interview ? { interview: hash(interview) } : {},
    prdDigest ? { prdDigest } : {},
    prdDigest && planDigest ? { prdDigest, planDigest } : {},
    prdDigest && planDigest ? { prdDigest, planDigest } : {},
    prdDigest && planDigest ? { prdDigest, planDigest } : {},
    {
      ...(prdDigest ? { prdDigest } : {}),
      ...(planDigest ? { planDigest } : {}),
      ...(scopeDecision ? { scopeDecision: hash(scopeDecision) } : {})
    },
    {}
  ]
  const firstUnmet = fulfilled.findIndex((value) => !value)
  const affected = new Set(invalidations.flatMap((item) => item.affectedStepIds))
  const reason = invalidations[0]?.reason
  const checklist = input.checklist.map((step, index): PracticeChecklistStep => {
    const wasCompleted = step.status === 'completed'
    const status = fulfilled[index]
      ? 'completed'
      : index === firstUnmet
        ? 'current'
        : affected.has(step.id) && wasCompleted
          ? 'stale'
          : 'pending'
    return {
      id: step.id,
      title: step.title,
      status,
      ...(affected.has(step.id) && status !== 'completed' && reason ? { reason } : {}),
      dependencyInputs: dependencyInputs[index]
    }
  })

  invalidations = invalidations.filter((item) =>
    item.affectedStepIds.some((stepId) =>
      checklist.find((step) => step.id === stepId)?.status !== 'completed'))

  return { checklist, learnerDecisions, learnerApprovals, invalidations }
}

export function applyPlanningPracticeAction(input: Readonly<{
  state: PlanningStepStateInput
  action: PlanningPracticeActionRequest['action']
  recordedAt: string
}>): PlanningStepStateResult {
  const before = reconcilePlanningStepState(input.state)
  const evidence = input.state.evidence
  const { prdDigest, planDigest } = artifactDigests(evidence)
  const activity = evidence.planningActivity
  const decisions = structuredClone(before.learnerDecisions)
  const approvals = structuredClone(before.learnerApprovals)
  const status = (stepId: string) => before.checklist.find((step) => step.id === stepId)?.status
  const requireCurrentDigest = (actual: string | null, expected: string, label: string): string => {
    if (!DIGEST.test(expected) || actual !== expected) {
      throw new Error(label + ' changed before the course action was recorded')
    }
    return actual
  }

  switch (input.action.type) {
    case 'capture-prd-prompt': {
      if (!activity?.prdPrompt || activity.cursor !== input.action.expectedActivityCursor) {
        throw new Error('The learner-owned PRD prompt is not current')
      }
      decisions['prd-prompt'] = activity.prdPrompt.text
      decisions['prd-prompt-digest'] = activity.prdPrompt.digest
      break
    }
    case 'complete-interview': {
      if (!activity
        || activity.cursor !== input.action.expectedActivityCursor
        || activity.learnerTurnCount < 2
        || activity.executorTurnCount < 1
        || status('complete-interview') !== 'current') {
        throw new Error('The Executor interview does not have current completion evidence')
      }
      decisions['interview-completion'] = JSON.stringify({
        cursor: activity.cursor,
        learnerTurnCount: activity.learnerTurnCount,
        executorTurnCount: activity.executorTurnCount
      })
      break
    }
    case 'approve-prd':
    case 'request-prd-revision': {
      const currentPrd = requireCurrentDigest(
        prdDigest,
        input.action.expectedPrdDigest,
        'PRD'
      )
      if (input.action.type === 'approve-prd' && status('approve-prd') !== 'current') {
        throw new Error('PRD approval is out of order')
      }
      approvals['prd-approval'] = {
        decision: input.action.type === 'approve-prd' ? 'approved' : 'revision-requested',
        recordedAt: input.recordedAt,
        artifactDigests: { [PRD_PATH]: currentPrd }
      }
      break
    }
    case 'confirm-alignment':
    case 'approve-plan':
    case 'request-plan-revision':
    case 'record-scope-decision': {
      const currentPrd = requireCurrentDigest(
        prdDigest,
        input.action.expectedPrdDigest,
        'PRD'
      )
      const currentPlan = requireCurrentDigest(
        planDigest,
        input.action.expectedPlanDigest,
        'Implementation plan'
      )
      if (input.action.type === 'confirm-alignment') {
        if (status('reconcile-alignment') !== 'current') {
          throw new Error('Alignment confirmation is out of order')
        }
        decisions['alignment-confirmed'] = alignmentKey(currentPrd, currentPlan)
      } else if (input.action.type === 'approve-plan') {
        if (status('approve-plan') !== 'current') {
          throw new Error('Implementation plan approval is out of order')
        }
        approvals['plan-approval'] = {
          decision: 'approved',
          recordedAt: input.recordedAt,
          artifactDigests: {
            [PRD_PATH]: currentPrd,
            [PLAN_PATH]: currentPlan
          }
        }
      } else if (input.action.type === 'request-plan-revision') {
        approvals['plan-approval'] = {
          decision: 'revision-requested',
          recordedAt: input.recordedAt,
          artifactDigests: {
            [PRD_PATH]: currentPrd,
            [PLAN_PATH]: currentPlan
          }
        }
      } else {
        if (!('value' in input.action)) {
          throw new Error('Unsupported planning course action')
        }
        const value = input.action.value.trim()
        if (status('explain-scope-and-review') !== 'current'
          || value.length < 20
          || value.length > 2_000) {
          throw new Error('Scope decision is missing, too short, or out of order')
        }
        decisions['scope-decision'] = value
      }
      break
    }
  }

  return reconcilePlanningStepState({
    ...input.state,
    learnerDecisions: decisions,
    learnerApprovals: approvals
  })
}
