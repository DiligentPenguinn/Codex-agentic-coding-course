import { describe, expect, it } from 'vitest'
import { derivePracticeChecklist } from '../electron/main/practice-review-contracts'
import type { PracticeDefinition, PracticeReviewResult } from '../shared/contracts'

const definition: PracticeDefinition = {
  schemaVersion: 2,
  practiceId: 'practice-1',
  title: 'Bài thực hành',
  version: '1.0.0',
  checkpointId: 'm1-setup-checklist',
  objective: 'Objective',
  expectedOutcome: 'Outcome',
  checklist: [
    { id: 'durable', title: 'Durable step', dependsOn: [] },
    { id: 'fresh', title: 'Fresh step', dependsOn: ['durable'] }
  ],
  criteria: [
    {
      id: 'durable-criterion',
      description: 'Durable criterion',
      required: true,
      checklistStepId: 'durable',
      acceptedEvidence: ['learner-decision'],
      assertion: 'A durable decision exists.',
      freshness: 'any'
    },
    {
      id: 'fresh-criterion',
      description: 'Fresh criterion',
      required: true,
      checklistStepId: 'fresh',
      acceptedEvidence: ['executor-reported-verification'],
      assertion: 'Fresh verification exists.',
      freshness: 'fresh'
    }
  ],
  workspaceKind: 'pilot-workspace',
  taskPolicy: 'inherit-configuration-only',
  evidenceProfile: 'codex-task-configuration',
  completionDestination: {
    lessonId: 'module-1',
    checkpointId: 'm1-mastery',
    sceneId: 'module-1-mastery',
    label: 'Bước tiếp theo trong khóa học'
  }
}

const needsWork: PracticeReviewResult = {
  schemaVersion: 1,
  practiceId: 'practice-1',
  practiceVersion: '1.0.0',
  runId: 'run-1',
  verdict: 'needs-work',
  criteria: [
    {
      criterionId: 'durable-criterion',
      status: 'unverifiable',
      evidenceRefs: [],
      explanation: 'The durable evidence is not present in this review.'
    },
    {
      criterionId: 'fresh-criterion',
      status: 'unverifiable',
      evidenceRefs: [],
      explanation: 'Fresh verification is missing.'
    }
  ],
  summary: 'More evidence is required.',
  reviewedAt: '2026-08-10T00:00:00.000Z',
  sourceDigest: 'a'.repeat(64)
}

describe('Practice checklist regression policy', () => {
  it('preserves durable completion while regressing steps that require fresh evidence', () => {
    expect(derivePracticeChecklist(definition, needsWork, [
      { id: 'durable', title: 'Durable step', status: 'completed' },
      { id: 'fresh', title: 'Fresh step', status: 'completed' }
    ])).toEqual([
      { id: 'durable', title: 'Durable step', status: 'completed' },
      { id: 'fresh', title: 'Fresh step', status: 'current' }
    ])
  })
})
