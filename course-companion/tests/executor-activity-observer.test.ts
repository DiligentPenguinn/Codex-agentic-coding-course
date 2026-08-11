import { describe, expect, it } from 'vitest'
import {
  initialActivity,
  reduceExecutorActivity
} from '../electron/main/executor-activity-observer'
import type { ExecutorChatBinding } from '../electron/main/practice-run-repository'
import { normalizeCodexTaskConfiguration } from '../electron/main/codex-configuration-normalizer'

const binding: ExecutorChatBinding = {
  runId: 'run-1',
  threadId: 'thread-bound',
  name: 'Practice · Module 1',
  workspaceRoot: 'D:\\course',
  createdAt: '2026-08-08T00:00:00.000Z'
}

const now = () => new Date('2026-08-08T00:00:01.000Z')

describe('Executor activity projection', () => {
  it('captures every row under a 390px viewport audit heading as structured evidence', () => {
    const report = [
      '### 390px viewport audit',
      '| Route | innerWidth | scrollWidth | overflowingElements |',
      '| --- | ---: | ---: | ---: |',
      '| / | 390 | 390 | 0 |',
      '| /setup | 390 | 390 | 0 |',
      '| /workflow | 390 | 390 | 0 |',
      '| /review | 390 | 390 | 0 |'
    ].join('\n')

    const result = reduceExecutorActivity(
      initialActivity(binding, now),
      {
        method: 'item/completed',
        params: {
          threadId: binding.threadId,
          turnId: 'turn-audit',
          item: { type: 'agentMessage', phase: 'final_answer', text: report }
        }
      },
      binding,
      now
    )

    expect(result.reportedVerificationEvidence).toEqual(expect.arrayContaining([
      '| / | 390 | 390 | 0 |',
      '| /setup | 390 | 390 | 0 |',
      '| /workflow | 390 | 390 | 0 |',
      '| /review | 390 | 390 | 0 |'
    ]))
  })

  it('ignores events from every thread except the bound Practice thread', () => {
    const snapshot = initialActivity(binding, now)
    const result = reduceExecutorActivity(
      snapshot,
      {
        method: 'item/completed',
        params: {
          threadId: 'thread-decoy',
          turnId: 'turn-1',
          item: { type: 'agentMessage', phase: 'final_answer', text: 'Decoy response' }
        }
      },
      binding,
      now
    )

    expect(result).toBe(snapshot)
    expect(result.executorResponses).toEqual([])
  })

  it('keeps bounded evidence and rejects changed paths outside the workspace', () => {
    let snapshot = initialActivity(binding, now)
    snapshot = reduceExecutorActivity(
      snapshot,
      {
        method: 'item/completed',
        params: {
          threadId: binding.threadId,
          turnId: 'turn-1',
          item: {
            id: 'files-1',
            type: 'fileChange',
            changes: [
              { path: 'src/lesson.tsx' },
              { path: 'README.md' },
              { path: 'Dockerfile' },
              { path: 'D:\\outside\\secret.txt' },
              { path: '..\\escape.txt' }
            ]
          }
        }
      },
      binding,
      now
    )
    snapshot = reduceExecutorActivity(
      snapshot,
      {
        method: 'thread/status/changed',
        params: {
          threadId: binding.threadId,
          status: { type: 'active', activeFlags: ['waitingOnApproval'] }
        }
      },
      binding,
      now
    )

    expect(snapshot.changedFiles).toEqual(['src/lesson.tsx', 'README.md', 'Dockerfile'])
    expect(snapshot.status).toBe('waiting-for-learner')
    expect(snapshot.approvalEvents).toHaveLength(1)
  })

  it('updates only the bound task configuration and ignores duplicate or older events', () => {
    const configuredBinding: ExecutorChatBinding = {
      ...binding,
      configuration: normalizeCodexTaskConfiguration({
        runId: binding.runId, threadId: binding.threadId, source: 'thread-start',
        payload: {
          model: 'gpt-5.6-sol', reasoningEffort: 'high', serviceTier: null,
          approvalPolicy: 'on-request', sandbox: { type: 'workspaceWrite' }
        },
        observedAt: '2026-08-08T00:00:00.000Z',
        eventTimestampMs: 10
      })
    }
    const settings = (model: string, emittedAtMs: number, threadId = binding.threadId) => ({
      method: 'thread/settings/updated',
      emittedAtMs,
      params: {
        threadId,
        threadSettings: {
          model, effort: 'high', serviceTier: null, approvalPolicy: 'on-request',
          sandboxPolicy: { type: 'workspaceWrite' }, activePermissionProfile: null
        }
      }
    })
    let snapshot = reduceExecutorActivity(
      initialActivity(configuredBinding, now),
      settings('gpt-5.6-terra', 20),
      configuredBinding,
      now
    )
    expect(snapshot.configuration?.model.protocolValue).toBe('gpt-5.6-terra')

    snapshot = reduceExecutorActivity(snapshot, settings('gpt-5.6-sol', 15), configuredBinding, now)
    expect(snapshot.configuration?.model.protocolValue).toBe('gpt-5.6-terra')
    const same = reduceExecutorActivity(snapshot, settings('gpt-5.6-sol', 30, 'thread-other'), configuredBinding, now)
    expect(same).toBe(snapshot)

    snapshot = reduceExecutorActivity(snapshot, {
      method: 'thread/closed', params: { threadId: binding.threadId }
    }, configuredBinding, now)
    expect(snapshot.configuration).toMatchObject({ freshness: 'stale', connection: 'disconnected' })
  })
})
