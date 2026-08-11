import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type {
  CodexTaskConfigurationSnapshot,
  ExecutorActivitySnapshot
} from '../shared/contracts'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { buildPracticeReviewEnvelope } from '../electron/main/practice-review-context'
import type { PracticeRunRecord } from '../electron/main/practice-run-repository'

const timestamp = '2026-08-10T00:00:00.000Z'
const definitions = new PracticeDefinitionRepository(join(process.cwd(), 'content', 'practices'))

const run: PracticeRunRecord = {
  runId: 'run-1',
  generation: 1,
  status: 'active',
  practiceId: 'm1-codex-safe-setup',
  practiceVersion: '2.0.0',
  workspaceKind: 'pilot-workspace',
  taskPolicy: 'inherit-configuration-only',
  evidenceProfile: 'codex-task-configuration',
  binding: {
    runId: 'run-1',
    threadId: 'thread-1',
    name: 'Practice · Module 1',
    workspaceRoot: 'D:\\course',
    createdAt: timestamp
  },
  startedAt: timestamp,
  updatedAt: timestamp,
  checklist: [{ id: 'set-model', title: 'Chọn Model', status: 'current' }],
  learnerDecisions: {},
  learnerApprovals: {},
  evidence: null,
  invalidations: [],
  reviewStatus: 'not-reviewed'
}

function configuration(
  overrides: Partial<CodexTaskConfigurationSnapshot> = {}
): CodexTaskConfigurationSnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-1',
    threadId: 'thread-1',
    source: 'thread-resume',
    eventTimestampMs: 1,
    observedAt: timestamp,
    freshness: 'fresh',
    connection: 'connected',
    model: { protocolValue: 'gpt-5.6-sol', label: '5.6 Sol' },
    reasoningEffort: { protocolValue: 'high', label: 'High' },
    serviceTier: { protocolValue: 'standard', label: 'Standard' },
    approvalPolicy: { protocolValue: 'on-request', label: 'Approve for me' },
    fullAccess: { protocolValue: 'off', label: 'Off' },
    sandboxType: 'workspaceWrite',
    activePermissionProfile: null,
    ...overrides
  }
}

function activity(config: CodexTaskConfigurationSnapshot | null): ExecutorActivitySnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-1',
    threadId: 'thread-1',
    status: 'response-ready',
    cursor: 'turn:item',
    learnerPrompts: ['raw learner transcript TOKEN=secret-value'],
    executorResponses: ['raw executor transcript Bearer abc.def.ghi'],
    approvalEvents: [],
    changedFiles: ['should-not-be-reviewed.ts'],
    verificationEvidence: [],
    reportedChangedFiles: [],
    reportedVerificationEvidence: ['untrusted report'],
    workspaceConfirmedChangedFiles: ['should-not-be-reviewed.ts'],
    workspaceCommittedReportedFilesSinceRunStart: [],
    workspaceCurrentlyDirtyReportedFiles: [],
    observedAt: timestamp,
    workspaceBaseline: null,
    configuration: config
  }
}

describe('Module 1 Practice review context', () => {
  it('uses only five fresh effective configuration values from the bound task', async () => {
    const definition = await definitions.load('m1-codex-safe-setup', '2.0.0')
    const envelope = buildPracticeReviewEnvelope({
      definition,
      run,
      activity: activity(configuration()),
      decisions: { secret: 'Bearer private-value' },
      generatedAt: timestamp
    })

    expect(envelope.evidence).toHaveLength(5)
    expect(new Set(envelope.evidence.map((item) => item.kind))).toEqual(
      new Set(['codex-task-configuration'])
    )
    expect(envelope.evidence.every((item) => item.freshness === 'fresh')).toBe(true)
    const text = JSON.stringify(envelope)
    expect(text).not.toContain('raw learner')
    expect(text).not.toContain('untrusted report')
    expect(text).not.toContain('should-not-be-reviewed')
    expect(text).not.toContain('private-value')
  })

  it('rejects configuration metadata from the wrong task identity', async () => {
    const definition = await definitions.load('m1-codex-safe-setup', '2.0.0')
    const envelope = buildPracticeReviewEnvelope({
      definition,
      run,
      activity: activity(configuration({ threadId: 'thread-other' })),
      generatedAt: timestamp
    })

    expect(envelope.configuration).toBeUndefined()
    expect(envelope.evidence).toEqual([])
  })

  it('marks disconnected or stale configuration evidence stale', async () => {
    const definition = await definitions.load('m1-codex-safe-setup', '2.0.0')
    const envelope = buildPracticeReviewEnvelope({
      definition,
      run,
      activity: activity(configuration({
        freshness: 'stale',
        connection: 'disconnected'
      })),
      generatedAt: timestamp
    })

    expect(envelope.evidence.every((item) => item.freshness === 'stale')).toBe(true)
  })
})
