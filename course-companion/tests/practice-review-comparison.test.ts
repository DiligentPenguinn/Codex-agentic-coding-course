import { describe, expect, it } from 'vitest'
import { derivePracticeReviewComparison } from '../electron/main/practice-review-comparison'
import type {
  PracticeChecklistStep,
  PracticeDefinition,
  PracticeReviewResult
} from '../shared/contracts'

const definition: PracticeDefinition = {
  schemaVersion: 2,
  practiceId: 'practice-1',
  title: 'Bài thực hành',
  version: '1.0.0',
  checkpointId: 'm1-setup-checklist',
  objective: 'Objective',
  expectedOutcome: 'Outcome',
  checklist: [
    { id: 'model', title: 'Chọn model', dependsOn: [] },
    { id: 'effort', title: 'Chọn effort', dependsOn: ['model'] }
  ],
  criteria: [
    {
      id: 'model-matches', description: 'Model', required: true,
      checklistStepId: 'model', acceptedEvidence: ['executor-reported-verification'],
      assertion: 'Model matches.', freshness: 'fresh'
    },
    {
      id: 'effort-matches', description: 'Effort', required: true,
      checklistStepId: 'effort', acceptedEvidence: ['executor-reported-verification'],
      assertion: 'Effort matches.', freshness: 'fresh'
    }
  ],
  workspaceKind: 'pilot-workspace',
  taskPolicy: 'inherit-configuration-only',
  evidenceProfile: 'codex-task-configuration',
  completionDestination: {
    lessonId: 'module-1', checkpointId: 'm1-mastery', sceneId: 'module-1-mastery',
    label: 'Tiếp tục'
  }
}

function review(
  reviewedAt: string,
  model: 'satisfied' | 'unsatisfied' = 'satisfied',
  effort: 'satisfied' | 'unsatisfied' = 'satisfied'
): PracticeReviewResult {
  return {
    schemaVersion: 1,
    practiceId: definition.practiceId,
    practiceVersion: definition.version,
    runId: 'run-1',
    verdict: model === 'satisfied' && effort === 'satisfied' ? 'passed' : 'needs-work',
    criteria: [
      {
        criterionId: 'model-matches', status: model,
        evidenceRefs: model === 'satisfied' ? ['configuration-model'] : [],
        explanation: model === 'satisfied' ? 'Model khớp.' : 'Model đã thay đổi.'
      },
      {
        criterionId: 'effort-matches', status: effort,
        evidenceRefs: effort === 'satisfied' ? ['configuration-effort'] : [],
        explanation: effort === 'satisfied' ? 'Effort khớp.' : 'Effort đã thay đổi.'
      }
    ],
    summary: 'Kết quả',
    reviewedAt,
    sourceDigest: (model + effort + reviewedAt).padEnd(64, 'a').slice(0, 64)
  }
}

const passedChecklist: PracticeChecklistStep[] = [
  { id: 'model', title: 'Chọn model', status: 'completed' },
  { id: 'effort', title: 'Chọn effort', status: 'completed' }
]

describe('Practice review comparison', () => {
  it('describes the first successful review without inventing a previous result', () => {
    expect(derivePracticeReviewComparison({
      definition,
      previous: null,
      current: review('2026-08-23T00:00:00.000Z'),
      checklist: passedChecklist
    })).toMatchObject({
      kind: 'first-review',
      previousReviewedAt: null,
      currentCompletedCount: 2,
      newlyVerified: [],
      needsReverification: []
    })
  })

  it('reports no changed steps for a repeated successful review', () => {
    expect(derivePracticeReviewComparison({
      definition,
      previous: review('2026-08-23T00:00:00.000Z'),
      current: review('2026-08-23T00:01:00.000Z'),
      checklist: passedChecklist
    })).toMatchObject({
      kind: 'unchanged',
      previousCompletedCount: 2,
      currentCompletedCount: 2,
      newlyVerified: [],
      needsReverification: []
    })
  })

  it('identifies only the previously verified step that regressed', () => {
    expect(derivePracticeReviewComparison({
      definition,
      previous: review('2026-08-23T00:00:00.000Z'),
      current: review('2026-08-23T00:01:00.000Z', 'satisfied', 'unsatisfied'),
      checklist: [
        { id: 'model', title: 'Chọn model', status: 'completed' },
        { id: 'effort', title: 'Chọn effort', status: 'stale', reason: 'Effort đã thay đổi.' }
      ]
    })).toMatchObject({
      kind: 'changed',
      previousCompletedCount: 2,
      currentCompletedCount: 1,
      newlyVerified: [],
      needsReverification: [{
        stepId: 'effort', title: 'Chọn effort', reason: 'Effort đã thay đổi.'
      }]
    })
  })

  it('identifies a recovered step as newly verified', () => {
    expect(derivePracticeReviewComparison({
      definition,
      previous: review('2026-08-23T00:00:00.000Z', 'satisfied', 'unsatisfied'),
      current: review('2026-08-23T00:01:00.000Z'),
      checklist: passedChecklist
    })).toMatchObject({
      kind: 'changed',
      previousCompletedCount: 1,
      currentCompletedCount: 2,
      newlyVerified: [{ stepId: 'effort', title: 'Chọn effort' }],
      needsReverification: []
    })
  })
})
