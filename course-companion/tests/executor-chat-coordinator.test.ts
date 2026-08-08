import { describe, expect, it } from 'vitest'
import { ExecutorChatCoordinator } from '../electron/main/executor-chat-coordinator'

describe('ExecutorChatCoordinator', () => {
  it('creates, names, verifies, and opens only the exact persistent repository task', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const client = {
      async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
        calls.push([method, params])
        if (method === 'thread/start') {
          return { thread: { id: 'thread-1', cwd: 'D:\\course' } }
        }
        if (method === 'thread/read') {
          return { thread: { id: 'thread-1', cwd: 'D:\\course' } }
        }
        return {}
      }
    }
    const opened: string[] = []
    const coordinator = new ExecutorChatCoordinator(
      client,
      'D:\\course',
      async (url) => { opened.push(url) },
      () => new Date('2026-08-08T00:00:00.000Z')
    )

    const binding = await coordinator.createTarget('run-123456')
    await coordinator.openTarget(binding)

    expect(binding).toMatchObject({
      runId: 'run-123456',
      threadId: 'thread-1',
      name: 'Practice · Module 1 · Verifiable brief · 123456'
    })
    expect(calls).toEqual([
      ['thread/start', {
        cwd: 'D:\\course',
        ephemeral: false,
        sandbox: 'workspace-write',
        approvalPolicy: 'on-request',
        serviceName: 'content_builder_academy_practice'
      }],
      ['thread/name/set', {
        threadId: 'thread-1',
        name: 'Practice · Module 1 · Verifiable brief · 123456'
      }],
      ['thread/read', { threadId: 'thread-1', includeTurns: false }]
    ])
    expect(opened).toEqual(['codex://threads/thread-1'])
  })

  it('rejects a substituted verification result', async () => {
    const client = {
      async request(method: string): Promise<unknown> {
        if (method === 'thread/start') return { thread: { id: 'thread-1', cwd: 'D:\\course' } }
        if (method === 'thread/read') return { thread: { id: 'thread-decoy', cwd: 'D:\\course' } }
        return {}
      }
    }
    const coordinator = new ExecutorChatCoordinator(client, 'D:\\course', async () => undefined)
    await expect(coordinator.createTarget('run-1')).rejects.toThrow(
      'Codex verified a different Executor chat'
    )
  })
})
