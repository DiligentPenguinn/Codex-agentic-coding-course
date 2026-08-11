import { describe, expect, it } from 'vitest'
import type { ExecutorActivitySnapshot, PracticeDefinition } from '../shared/contracts'
import { buildPracticeReviewEnvelope } from '../electron/main/practice-review-context'
import type { PracticeRunRecord } from '../electron/main/practice-run-repository'

const timestamp = '2026-08-10T00:00:00.000Z'
const run = {
  runId: 'run-1',
  generation: 1,
  status: 'active',
  binding: {
    runId: 'run-1',
    threadId: 'thread-1',
    name: 'Practice 1',
    workspaceRoot: 'D:\\course',
    createdAt: timestamp
  },
  startedAt: timestamp,
  updatedAt: timestamp,
  checklist: [{ id: 'step-1', title: 'Step 1', status: 'current' }]
} satisfies PracticeRunRecord

const definition = {
  schemaVersion: 1,
  practiceId: 'practice-1',
  version: '1.0.0',
  checkpointId: 'm1-plan-approval',
  objective: 'Objective',
  expectedOutcome: 'Outcome',
  checklist: [],
  criteria: [],
  completionDestination: {
    lessonId: 'module-1',
    checkpointId: 'm1-plan-approval',
    sceneId: 'module-1-reflection'
  }
} satisfies PracticeDefinition

function activity(overrides: Partial<ExecutorActivitySnapshot> = {}): ExecutorActivitySnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-1',
    threadId: 'thread-1',
    status: 'response-ready',
    cursor: 'turn:item',
    learnerPrompts: ['raw learner transcript TOKEN=secret-value'],
    executorResponses: ['raw executor transcript Bearer abc.def.ghi'],
    approvalEvents: [],
    changedFiles: [],
    verificationEvidence: [],
    reportedChangedFiles: [],
    reportedVerificationEvidence: ['390px verified password=hunter2'],
    workspaceConfirmedChangedFiles: ['starters/contentpilot/app/globals.css'],
    workspaceCommittedReportedFilesSinceRunStart: [],
    workspaceCurrentlyDirtyReportedFiles: [],
    observedAt: '2026-08-10T00:01:00.000Z',
    workspaceBaseline: null,
    configuration: null,
    ...overrides
  }
}

describe('Practice review context', () => {
  it('uses structured bound-thread metadata without raw conversation text', () => {
    const envelope = buildPracticeReviewEnvelope({
      definition,
      run,
      activity: activity(),
      generatedAt: '2026-08-10T00:02:00.000Z'
    })
    const text = JSON.stringify(envelope)
    expect(text).toContain('learnerPrompts=1')
    expect(text).toContain('executorResponses=1')
    expect(text).not.toContain('raw learner transcript')
    expect(text).not.toContain('raw executor transcript')
  })

  it('isolates the exact bound thread', () => {
    const envelope = buildPracticeReviewEnvelope({
      definition,
      run,
      activity: activity({ threadId: 'thread-other' }),
      generatedAt: '2026-08-10T00:02:00.000Z'
    })
    expect(envelope.evidence.map((item) => item.kind)).toEqual(['teacher-assessment'])
  })

  it('bounds each evidence kind and redacts credential-shaped values', () => {
    const envelope = buildPracticeReviewEnvelope({
      definition,
      run,
      activity: activity({
        reportedVerificationEvidence: Array.from({ length: 20 }, (_, index) =>
          `check-${index} api_key=value-${index}`)
      }),
      decisions: { credential: 'Bearer secret-token' },
      generatedAt: '2026-08-10T00:02:00.000Z'
    })
    const reported = envelope.evidence.filter((item) => item.kind === 'executor-reported-verification')
    expect(reported).toHaveLength(12)
    expect(JSON.stringify(envelope)).not.toContain('value-0')
    expect(JSON.stringify(envelope)).not.toContain('secret-token')
    expect(JSON.stringify(envelope)).toContain('[REDACTED]')
    expect(envelope.evidence.every((item) => [...item.text].length <= 1000)).toBe(true)
  })

  it('marks only activity-derived evidence stale', () => {
    const envelope = buildPracticeReviewEnvelope({
      definition,
      run,
      activity: activity({ status: 'stale' }),
      decisions: { scope: 'approved' },
      generatedAt: '2026-08-10T00:02:00.000Z'
    })
    expect(envelope.evidence
      .filter((item) => ['bound-thread-activity', 'workspace-confirmed-change', 'executor-reported-verification'].includes(item.kind))
      .every((item) => item.freshness === 'stale')).toBe(true)
    expect(envelope.evidence
      .filter((item) => ['learner-decision', 'teacher-assessment'].includes(item.kind))
      .every((item) => item.freshness === 'fresh')).toBe(true)
  })
})
