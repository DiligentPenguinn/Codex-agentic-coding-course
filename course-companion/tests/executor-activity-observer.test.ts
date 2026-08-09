import { describe, expect, it } from 'vitest'
import {
  initialActivity,
  reduceExecutorActivity
} from '../electron/main/executor-activity-observer'
import type { ExecutorChatBinding } from '../electron/main/practice-run-repository'

const binding: ExecutorChatBinding = {
  runId: 'run-1',
  threadId: 'thread-bound',
  name: 'Practice · Module 1',
  workspaceRoot: 'D:\\course',
  createdAt: '2026-08-08T00:00:00.000Z'
}

const now = () => new Date('2026-08-08T00:00:01.000Z')

describe('Executor activity projection', () => {
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
})
