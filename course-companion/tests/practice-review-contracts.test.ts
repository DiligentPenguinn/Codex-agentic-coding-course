import { describe, expect, it } from 'vitest'
import type {
  PracticeDefinition,
  PracticeEvidenceReference
} from '../shared/contracts'
import {
  derivePracticeChecklist,
  parsePracticeReviewResult
} from '../electron/main/practice-review-contracts'

const definition: PracticeDefinition = {
  schemaVersion: 2,
  practiceId: 'generic-practice',
  version: '1.0.0',
  checkpointId: 'm1-setup-checklist',
  objective: 'Produce the requested artifact.',
  expectedOutcome: 'The artifact satisfies its task-defined criterion.',
  checklist: [
    { id: 'produce', title: 'Produce artifact', dependsOn: [] },
    { id: 'review', title: 'Review evidence', dependsOn: ['produce'] }
  ],
  criteria: [
    {
      id: 'artifact-exists',
      description: 'Artifact exists',
      required: true,
      checklistStepId: 'produce',
      acceptedEvidence: ['artifact'],
      assertion: 'The artifact exists.',
      freshness: 'any'
    },
    {
      id: 'teacher-reviewed',
      description: 'Teacher reviewed evidence',
      required: true,
      checklistStepId: 'review',
      acceptedEvidence: ['teacher-assessment'],
      assertion: 'The review is complete.',
      freshness: 'fresh'
    }
  ],
  workspaceKind: 'pilot-workspace',
  taskPolicy: 'inherit-configuration-only',
  evidenceProfile: 'codex-task-configuration',
  completionDestination: {
    lessonId: 'module-1',
    checkpointId: 'm1-mastery',
    sceneId: 'module-1-mastery'
  }
}

const evidence: PracticeEvidenceReference[] = [
  { id: 'artifact:1', kind: 'artifact', text: 'artifact.md', freshness: 'fresh' },
  { id: 'teacher-assessment:1', kind: 'teacher-assessment', text: 'review', freshness: 'fresh' }
]

function proposal(secondStatus: 'satisfied' | 'unsatisfied' = 'satisfied') {
  return JSON.stringify({
    schemaVersion: 1,
    practiceId: definition.practiceId,
    practiceVersion: definition.version,
    runId: 'run-1',
    verdict: secondStatus === 'satisfied' ? 'passed' : 'needs-work',
    criteria: [
      {
        criterionId: 'artifact-exists',
        status: 'satisfied',
        evidenceRefs: ['artifact:1'],
        explanation: 'Artifact evidence is present.'
      },
      {
        criterionId: 'teacher-reviewed',
        status: secondStatus,
        evidenceRefs: secondStatus === 'satisfied' ? ['teacher-assessment:1'] : [],
        explanation: secondStatus === 'satisfied' ? 'Review complete.' : 'Review incomplete.'
      }
    ],
    summary: secondStatus === 'satisfied' ? 'Passed.' : 'Needs work.'
  })
}

describe('Practice review contracts', () => {
  it('validates a generic pass and derives a fully completed checklist', () => {
    const result = parsePracticeReviewResult({
      text: proposal(),
      definition,
      runId: 'run-1',
      evidence,
      reviewedAt: '2026-08-09T00:00:00.000Z'
    })

    expect(result.verdict).toBe('passed')
    expect(result.sourceDigest).toMatch(/^[a-f0-9]{64}$/)
    expect(derivePracticeChecklist(definition, result).map((step) => step.status)).toEqual([
      'completed',
      'completed'
    ])
  })

  it('keeps the earliest unmet task-defined step current', () => {
    const result = parsePracticeReviewResult({
      text: proposal('unsatisfied'),
      definition,
      runId: 'run-1',
      evidence,
      reviewedAt: '2026-08-09T00:00:00.000Z'
    })

    expect(derivePracticeChecklist(definition, result).map((step) => step.status)).toEqual([
      'completed',
      'current'
    ])
  })

  it('rejects conversational or contradictory pass output', () => {
    expect(() => parsePracticeReviewResult({
      text: 'You passed!',
      definition,
      runId: 'run-1',
      evidence,
      reviewedAt: '2026-08-09T00:00:00.000Z'
    })).toThrow()

    const contradictory = JSON.parse(proposal('unsatisfied'))
    contradictory.verdict = 'passed'
    expect(() => parsePracticeReviewResult({
      text: JSON.stringify(contradictory),
      definition,
      runId: 'run-1',
      evidence,
      reviewedAt: '2026-08-09T00:00:00.000Z'
    })).toThrow('verdict contradicts')
  })
  it('rejects evidence whose provenance is not accepted by the criterion', () => {
    const wrongEvidence = JSON.parse(proposal())
    wrongEvidence.criteria[0].evidenceRefs = ['teacher-assessment:1']

    expect(() => parsePracticeReviewResult({
      text: JSON.stringify(wrongEvidence),
      definition,
      runId: 'run-1',
      evidence,
      reviewedAt: '2026-08-09T00:00:00.000Z'
    })).toThrow('unacceptable evidence')
  })
})
