import { describe, expect, it } from 'vitest'
import type {
  PlanningPracticeActionRequest,
  PracticeAdapterEvidenceState,
  PracticeChecklistStep,
  PracticeLearnerApproval,
  PracticeReviewStatus
} from '../shared/contracts'
import {
  applyPlanningPracticeAction,
  planningPracticeStepIds,
  reconcilePlanningStepState,
  type PlanningStepStateResult
} from '../electron/main/practice-step-state'

const observedAt = '2026-08-11T00:00:00.000Z'
const prdA = 'a'.repeat(64)
const prdB = 'b'.repeat(64)
const planA = 'c'.repeat(64)
const planB = 'd'.repeat(64)

function checklist(): PracticeChecklistStep[] {
  return planningPracticeStepIds.map((id, index) => ({
    id,
    title: 'Bước ' + String(index + 1),
    status: index === 0 ? 'current' : 'pending',
    dependencyInputs: {}
  }))
}

function evidence(options: {
  prd?: string
  plan?: string
  cursor?: string
  learnerTurnCount?: number
  executorTurnCount?: number
} = {}): PracticeAdapterEvidenceState {
  const planningArtifacts: NonNullable<PracticeAdapterEvidenceState['planningArtifacts']> = []
  if (options.prd) {
    planningArtifacts.push({
      schemaVersion: 1,
      path: 'artifacts/PRD.md',
      content: '# PRD',
      digest: options.prd,
      byteLength: 5,
      modifiedAt: observedAt,
      observedAt
    })
  }
  if (options.plan) {
    planningArtifacts.push({
      schemaVersion: 1,
      path: 'artifacts/implementation-plan.md',
      content: '# Plan',
      digest: options.plan,
      byteLength: 6,
      modifiedAt: observedAt,
      observedAt
    })
  }
  return {
    schemaVersion: 1,
    practiceId: 'm2-planning-package',
    practiceVersion: '2.0.0',
    runId: 'run-2',
    evidenceProfile: 'planning-package',
    observedAt,
    freshness: planningArtifacts.length === 2 ? 'fresh' : 'unverifiable',
    sourceDigest: 'e'.repeat(64),
    evidence: [],
    steps: [],
    invalidations: [],
    planningArtifacts,
    artifactIssues: [],
    unexpectedChangedPaths: [],
    planningActivity: {
      schemaVersion: 1,
      cursor: options.cursor ?? 'cursor-1',
      observedAt,
      learnerTurnCount: options.learnerTurnCount ?? 2,
      executorTurnCount: options.executorTurnCount ?? 1,
      prdPrompt: {
        text: 'Hãy phỏng vấn tôi từng câu để tạo PRD cho ContentPilot.',
        digest: 'f'.repeat(64)
      }
    }
  }
}

type Harness = {
  evidence: PracticeAdapterEvidenceState
  previousEvidence: PracticeAdapterEvidenceState | null
  result: PlanningStepStateResult
  reviewStatus: PracticeReviewStatus
  hasCompletion: boolean
}

function createHarness(): Harness {
  const currentEvidence = evidence()
  return {
    evidence: currentEvidence,
    previousEvidence: null,
    result: reconcilePlanningStepState({
      checklist: checklist(),
      previousEvidence: null,
      evidence: currentEvidence,
      learnerDecisions: {},
      learnerApprovals: {},
      reviewStatus: 'not-reviewed',
      hasCompletion: false
    }),
    reviewStatus: 'not-reviewed',
    hasCompletion: false
  }
}

function act(harness: Harness, action: PlanningPracticeActionRequest['action']): void {
  harness.result = applyPlanningPracticeAction({
    state: {
      checklist: harness.result.checklist,
      previousEvidence: harness.evidence,
      evidence: harness.evidence,
      learnerDecisions: harness.result.learnerDecisions,
      learnerApprovals: harness.result.learnerApprovals,
      priorInvalidations: harness.result.invalidations,
      reviewStatus: harness.reviewStatus,
      hasCompletion: harness.hasCompletion
    },
    action,
    recordedAt: observedAt
  })
}

function replaceEvidence(harness: Harness, next: PracticeAdapterEvidenceState): void {
  const previous = harness.evidence
  harness.previousEvidence = previous
  harness.evidence = next
  harness.result = reconcilePlanningStepState({
    checklist: harness.result.checklist,
    previousEvidence: previous,
    evidence: next,
    learnerDecisions: harness.result.learnerDecisions,
    learnerApprovals: harness.result.learnerApprovals,
    priorInvalidations: harness.result.invalidations,
    reviewStatus: harness.reviewStatus,
    hasCompletion: harness.hasCompletion
  })
}

function completeThroughScope(harness: Harness): void {
  act(harness, { type: 'capture-prd-prompt', expectedActivityCursor: 'cursor-1' })
  act(harness, { type: 'complete-interview', expectedActivityCursor: 'cursor-1' })
  replaceEvidence(harness, evidence({ prd: prdA }))
  act(harness, { type: 'approve-prd', expectedPrdDigest: prdA })
  replaceEvidence(harness, evidence({ prd: prdA, plan: planA }))
  act(harness, {
    type: 'confirm-alignment',
    expectedPrdDigest: prdA,
    expectedPlanDigest: planA
  })
  act(harness, {
    type: 'approve-plan',
    expectedPrdDigest: prdA,
    expectedPlanDigest: planA
  })
  act(harness, {
    type: 'record-scope-decision',
    value: 'Tôi giữ xuất bản thủ công trong phạm vi để tránh thêm hệ thống lịch.',
    expectedPrdDigest: prdA,
    expectedPlanDigest: planA
  })
}

describe('Module 2 Practice step state', () => {
  it('advances the eight ordered steps only from bounded evidence and course actions', () => {
    const harness = createHarness()
    expect(harness.result.checklist.map((step) => step.status)).toEqual([
      'current', 'pending', 'pending', 'pending',
      'pending', 'pending', 'pending', 'pending'
    ])

    completeThroughScope(harness)
    expect(harness.result.checklist.map((step) => step.status)).toEqual([
      'completed', 'completed', 'completed', 'completed',
      'completed', 'completed', 'current', 'pending'
    ])

    harness.reviewStatus = 'passed'
    harness.result = reconcilePlanningStepState({
      checklist: harness.result.checklist,
      previousEvidence: harness.evidence,
      evidence: harness.evidence,
      learnerDecisions: harness.result.learnerDecisions,
      learnerApprovals: harness.result.learnerApprovals,
      priorInvalidations: harness.result.invalidations,
      reviewStatus: harness.reviewStatus,
      hasCompletion: false
    })
    expect(harness.result.checklist.at(-2)?.status).toBe('completed')
    expect(harness.result.checklist.at(-1)?.status).toBe('current')
  })

  it('invalidates PRD approval and every downstream dependency after a PRD change', () => {
    const harness = createHarness()
    completeThroughScope(harness)
    harness.reviewStatus = 'passed'
    harness.result = reconcilePlanningStepState({
      checklist: harness.result.checklist,
      previousEvidence: harness.evidence,
      evidence: harness.evidence,
      learnerDecisions: harness.result.learnerDecisions,
      learnerApprovals: harness.result.learnerApprovals,
      reviewStatus: 'passed',
      hasCompletion: false
    })

    replaceEvidence(harness, evidence({ prd: prdB, plan: planA }))

    expect(harness.result.learnerApprovals['prd-approval']).toBeUndefined()
    expect(harness.result.learnerApprovals['plan-approval']).toBeUndefined()
    expect(harness.result.learnerDecisions['alignment-confirmed']).toBeUndefined()
    expect(harness.result.checklist[2]?.status).toBe('current')
    expect(harness.result.checklist.slice(3, 7).map((step) => step.status))
      .toEqual(['stale', 'stale', 'stale', 'stale'])
    expect(harness.result.invalidations).toEqual([
      expect.objectContaining({ changedInput: 'artifacts/PRD.md' })
    ])

    act(harness, { type: 'approve-prd', expectedPrdDigest: prdB })
    expect(harness.result.checklist[2]?.status).toBe('completed')
    expect(harness.result.checklist[3]?.status).toBe('current')
    expect(harness.result.invalidations).toHaveLength(1)
  })

  it('preserves PRD approval but invalidates alignment, package approval, and review after plan-only change', () => {
    const harness = createHarness()
    completeThroughScope(harness)
    harness.reviewStatus = 'passed'
    harness.result = reconcilePlanningStepState({
      checklist: harness.result.checklist,
      previousEvidence: harness.evidence,
      evidence: harness.evidence,
      learnerDecisions: harness.result.learnerDecisions,
      learnerApprovals: harness.result.learnerApprovals,
      reviewStatus: 'passed',
      hasCompletion: false
    })

    replaceEvidence(harness, evidence({ prd: prdA, plan: planB }))

    expect(harness.result.learnerApprovals['prd-approval']?.decision).toBe('approved')
    expect(harness.result.learnerApprovals['plan-approval']).toBeUndefined()
    expect(harness.result.checklist[2]?.status).toBe('completed')
    expect(harness.result.checklist[3]?.status).toBe('completed')
    expect(harness.result.checklist[4]?.status).toBe('current')
    expect(harness.result.checklist.slice(5, 7).map((step) => step.status))
      .toEqual(['stale', 'stale'])
    expect(harness.result.invalidations).toEqual([
      expect.objectContaining({ changedInput: 'artifacts/implementation-plan.md' })
    ])
  })

  it('rejects out-of-order actions and stale activity or artifact digests', () => {
    const harness = createHarness()
    replaceEvidence(harness, evidence({ prd: prdA, plan: planA }))

    expect(() => act(harness, {
      type: 'approve-plan',
      expectedPrdDigest: prdA,
      expectedPlanDigest: planA
    })).toThrow('out of order')
    expect(() => act(harness, {
      type: 'capture-prd-prompt',
      expectedActivityCursor: 'stale-cursor'
    })).toThrow('not current')

    act(harness, { type: 'capture-prd-prompt', expectedActivityCursor: 'cursor-1' })
    act(harness, { type: 'complete-interview', expectedActivityCursor: 'cursor-1' })
    expect(() => act(harness, {
      type: 'approve-prd',
      expectedPrdDigest: prdB
    })).toThrow('changed before')
  })

  it('requires bounded interview activity and a learner-owned scope explanation', () => {
    const harness = createHarness()
    replaceEvidence(harness, evidence({ learnerTurnCount: 1, executorTurnCount: 0 }))
    act(harness, { type: 'capture-prd-prompt', expectedActivityCursor: 'cursor-1' })
    expect(() => act(harness, {
      type: 'complete-interview',
      expectedActivityCursor: 'cursor-1'
    })).toThrow('completion evidence')

    const approvals: Record<string, PracticeLearnerApproval> = {
      'prd-approval': {
        decision: 'approved',
        recordedAt: observedAt,
        artifactDigests: { 'artifacts/PRD.md': prdA }
      },
      'plan-approval': {
        decision: 'approved',
        recordedAt: observedAt,
        artifactDigests: {
          'artifacts/PRD.md': prdA,
          'artifacts/implementation-plan.md': planA
        }
      }
    }
    const ready = evidence({ prd: prdA, plan: planA })
    const state = reconcilePlanningStepState({
      checklist: checklist(),
      previousEvidence: ready,
      evidence: ready,
      learnerDecisions: {
        'prd-prompt': 'prompt',
        'interview-completion': 'complete',
        'alignment-confirmed': prdA + ':' + planA
      },
      learnerApprovals: approvals,
      reviewStatus: 'not-reviewed',
      hasCompletion: false
    })
    expect(() => applyPlanningPracticeAction({
      state: {
        checklist: state.checklist,
        previousEvidence: ready,
        evidence: ready,
        learnerDecisions: state.learnerDecisions,
        learnerApprovals: state.learnerApprovals,
        reviewStatus: 'not-reviewed',
        hasCompletion: false
      },
      action: {
        type: 'record-scope-decision',
        value: 'quá ngắn',
        expectedPrdDigest: prdA,
        expectedPlanDigest: planA
      },
      recordedAt: observedAt
    })).toThrow('too short')
  })
})
