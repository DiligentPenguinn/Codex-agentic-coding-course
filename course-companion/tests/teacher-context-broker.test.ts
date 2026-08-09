import { describe, expect, it } from 'vitest'
import { buildTeacherEnvelope } from '../electron/main/teacher-context-broker'
import { emptyTeacherMemory } from '../electron/main/teacher-memory-repository'
import {
  COURSE_VERSION,
  LEARNER_STATE_SCHEMA_VERSION,
  type ExecutorActivitySnapshot,
  type LearnerProgress,
  type PracticeRunSummary
} from '../shared/contracts'
import type { PracticeRunRecord } from '../electron/main/practice-run-repository'

const timestamp = '2026-08-08T00:00:00.000Z'

const progress: LearnerProgress = {
  schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
  courseVersion: COURSE_VERSION,
  currentLessonId: 'module-1',
  checkpointId: 'm1-plan-approval',
  sceneId: 'module-1-brief-choice',
  completedCheckpointIds: ['m1-orient'],
  decisions: { evidence: 'viewport-and-typecheck' },
  practice: { missionId: 'm1-verifiable-brief', status: 'active' },
  startedAt: timestamp,
  updatedAt: timestamp
}

const activeRun: PracticeRunRecord = {
  runId: 'run-current',
  generation: 2,
  status: 'active',
  binding: {
    runId: 'run-current',
    threadId: 'thread-current',
    name: 'Practice · Module 1',
    workspaceRoot: 'D:\\course',
    createdAt: timestamp
  },
  startedAt: timestamp,
  updatedAt: timestamp,
  checklist: [{ id: 'plan', title: 'Review plan', status: 'current' }]
}

const activity: ExecutorActivitySnapshot = {
  schemaVersion: 1,
  runId: 'run-current',
  threadId: 'thread-current',
  status: 'response-ready',
  cursor: 'turn-1:item-1',
  learnerPrompts: ['Inspect the current Practice.'],
  executorResponses: ['The scoped change is ready for review.'],
  approvalEvents: ['The learner approved the plan.'],
  changedFiles: ['src/lesson.tsx'],
  verificationEvidence: ['Typecheck passed.'],
  reportedChangedFiles: [],
  reportedVerificationEvidence: [],
  workspaceConfirmedChangedFiles: [],
  observedAt: timestamp,
  workspaceBaseline: null
}

function previousSummary(runId: string): PracticeRunSummary {
  return {
    schemaVersion: 1,
    practiceId: 'm1-verifiable-brief',
    runId,
    attempt: 1,
    outcome: 'replaced',
    objective: 'Build a verifiable brief.',
    approach: 'Reviewed scope.',
    learnerDecisions: [],
    approvals: [],
    changedFiles: [],
    verificationEvidence: [],
    learningSignals: [],
    unresolvedIssues: [],
    nextAttemptGuidance: [],
    startedAt: timestamp,
    endedAt: timestamp,
    summarizedAt: timestamp,
    sourceDigest: `digest-${runId}`,
    model: 'Hương',
    freshness: 'current',
    quality: 'live'
  }
}

describe('Teacher context broker', () => {
  it('keeps the current Practice full and older attempts summary-only', () => {
    const memory = emptyTeacherMemory(() => new Date(timestamp))
    memory.practiceSummaries['m1-verifiable-brief'] = [
      previousSummary('run-old'),
      previousSummary('run-current')
    ]

    const result = buildTeacherEnvelope({
      progress,
      activeRun,
      activity,
      memory,
      conversation: { messages: [], recovered: false },
      now: () => new Date(timestamp)
    })

    expect(result.envelope.practice.activeRun?.runId).toBe('run-current')
    expect(result.envelope.practice.activity?.executorResponses).toEqual(activity.executorResponses)
    expect(result.envelope.practice.previousRuns.map((run) => run.runId)).toEqual(['run-old'])
    expect(result.envelope.privacy).toEqual({ scope: 'bound-thread-only', redactionsApplied: true })
    expect(result.envelope.freshness).toBe('fresh')
  })

  it('discloses missing or disconnected Executor observations', () => {
    const memory = emptyTeacherMemory(() => new Date(timestamp))
    const stale = buildTeacherEnvelope({
      progress,
      activeRun,
      activity: null,
      memory,
      conversation: { messages: [], recovered: false }
    })
    const disconnected = buildTeacherEnvelope({
      progress,
      activeRun,
      activity: { ...activity, status: 'disconnected' },
      memory,
      conversation: { messages: [], recovered: false }
    })

    expect(stale.envelope.freshness).toBe('stale')
    expect(disconnected.envelope.freshness).toBe('disconnected')
  })

  it('keeps the serialized Teacher context under its hard size cap', () => {
    const oversized = 'x'.repeat(4_000)
    const memory = emptyTeacherMemory(() => new Date(timestamp))
    memory.learningSignals = Array.from({ length: 30 }, (_, index) => ({
      text: `${index}-${oversized}`,
      basis: 'observed' as const,
      sourceRunId: `run-${index}`
    }))
    const result = buildTeacherEnvelope({
      progress,
      activeRun,
      activity: {
        ...activity,
        learnerPrompts: Array.from({ length: 50 }, () => oversized),
        executorResponses: Array.from({ length: 50 }, () => oversized),
        approvalEvents: Array.from({ length: 50 }, () => oversized),
        changedFiles: Array.from({ length: 100 }, (_, index) => `src/${index}-${oversized}`),
        verificationEvidence: Array.from({ length: 100 }, () => oversized)
      },
      memory,
      conversation: {
        recovered: false,
        messages: Array.from({ length: 50 }, (_, index) => ({
          schemaVersion: 1 as const,
          id: `message-${index}`,
          role: 'teacher' as const,
          source: 'live' as const,
          content: oversized,
          timestamp
        }))
      }
    })

    expect(JSON.stringify(result).length).toBeLessThanOrEqual(24_000)
    expect(result.envelope.compaction.applied).toBe(true)
    expect(result.envelope.practice.activity?.learnerPrompts.length).toBeLessThanOrEqual(4)
  })

  it('keeps raw chat scoped to the current run and excludes the pending learner message', () => {
    const memory = emptyTeacherMemory(() => new Date(timestamp))
    const result = buildTeacherEnvelope({
      progress,
      activeRun,
      activity,
      memory,
      excludeMessageId: 'message-current',
      conversation: {
        recovered: false,
        messages: [
          {
            schemaVersion: 1,
            id: 'message-old',
            role: 'teacher',
            source: 'live',
            content: 'Raw old-run detail must not leak.',
            timestamp,
            practiceRunId: 'run-old'
          },
          {
            schemaVersion: 1,
            id: 'message-current',
            role: 'learner',
            source: 'learner',
            content: 'Current question',
            timestamp,
            practiceRunId: 'run-current',
            deliveryStatus: 'pending'
          },
          {
            schemaVersion: 1,
            id: 'message-current-teacher',
            role: 'teacher',
            source: 'live',
            content: 'Current-run answer',
            timestamp,
            practiceRunId: 'run-current'
          }
        ]
      }
    })

    expect(result.recentChat.map((message) => message.id)).toEqual(['message-current-teacher'])
    expect(JSON.stringify(result)).not.toContain('Raw old-run detail must not leak.')
    expect(JSON.stringify(result)).not.toContain('Current question')
  })
})
