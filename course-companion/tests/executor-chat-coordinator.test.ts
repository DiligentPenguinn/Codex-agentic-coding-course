import { describe, expect, it } from 'vitest'
import {
  ExecutorChatCoordinator,
  type CodexRequestClient
} from '../electron/main/executor-chat-coordinator'
import type { ExecutorChatBinding } from '../electron/main/practice-run-repository'

function binding(): ExecutorChatBinding {
  return {
    runId: 'run-123456',
    threadId: 'thread-target',
    name: 'Practice · Module 1 · Verifiable brief · 123456',
    workspaceRoot: 'D:\\course',
    createdAt: '2026-08-10T00:00:00.000Z'
  }
}

describe('ExecutorChatCoordinator', () => {
  it('creates and names one blank durable task, then closes bootstrap before returning', async () => {
    const events: string[] = []
    const calls: Array<[string, Record<string, unknown>]> = []
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        if (method === 'thread/start') return { thread: { id: 'thread-target', cwd: 'D:\\course' } }
        return {}
      },
      async close() { events.push('close') }
    }
    const coordinator = new ExecutorChatCoordinator(
      client,
      'D:\\course',
      async (url) => { events.push(`open:${url}`) },
      () => new Date('2026-08-10T00:00:00.000Z')
    )

    const target = await coordinator.createTarget('run-123456')

    expect(target).toEqual(binding())
    expect(calls).toEqual([
      ['thread/start', {
        cwd: 'D:\\course',
        ephemeral: false,
        sandbox: 'workspace-write',
        approvalPolicy: 'on-request',
        serviceName: 'content_builder_academy_practice'
      }],
      ['thread/name/set', {
        threadId: 'thread-target',
        name: 'Practice · Module 1 · Verifiable brief · 123456'
      }]
    ])
    expect(events).toEqual(['close'])
  })

  it('closes bootstrap when creation fails after thread/start', async () => {
    let closes = 0
    const client: CodexRequestClient = {
      async request(method) {
        if (method === 'thread/start') return { thread: { id: 'thread-target', cwd: 'D:\\course' } }
        if (method === 'thread/name/set') throw new Error('name failed')
        return {}
      },
      async close() { closes += 1 }
    }
    const coordinator = new ExecutorChatCoordinator(client, 'D:\\course', async () => undefined)

    await expect(coordinator.createTarget('run-1')).rejects.toThrow('name failed')
    expect(closes).toBe(1)
  })

  it('prepares by read-only discovery only and closes bootstrap before Desktop opens', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const events: string[] = []
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        if (method === 'thread/read') {
          return { thread: { id: 'thread-target', cwd: 'D:\\course', turns: [] } }
        }
        throw new Error(`Unexpected mutating request: ${method}`)
      },
      async close() { events.push('close') }
    }
    const coordinator = new ExecutorChatCoordinator(
      client,
      'D:\\course',
      async (url) => { events.push(`open:${url}`) }
    )

    await coordinator.prepareTarget(binding())
    await coordinator.openTarget(binding())

    expect(calls).toEqual([['thread/read', {
      threadId: 'thread-target',
      includeTurns: false
    }]])
    expect(calls.map(([method]) => method)).not.toEqual(expect.arrayContaining([
      'thread/resume',
      'thread/list',
      'turn/start'
    ]))
    expect(events).toEqual(['close', 'open:codex://threads/thread-target'])
  })

  it('waits until the exact task can be read instead of accepting substituted data', async () => {
    let reads = 0
    const waits: number[] = []
    const client: CodexRequestClient = {
      async request(method) {
        expect(method).toBe('thread/read')
        reads += 1
        return reads === 1
          ? { thread: { id: 'thread-decoy', cwd: 'D:\\course' } }
          : { thread: { id: 'thread-target', cwd: 'D:\\course', turns: [] } }
      },
      async close() {}
    }
    const coordinator = new ExecutorChatCoordinator(
      client,
      'D:\\course',
      async () => undefined,
      undefined,
      { attempts: 2, intervalMs: 25, wait: async (milliseconds) => { waits.push(milliseconds) } }
    )

    await coordinator.prepareTarget(binding())

    expect(reads).toBe(2)
    expect(waits).toEqual([25])
  })

  it('keeps Desktop closed and releases bootstrap when exact reads time out', async () => {
    const events: string[] = []
    const client: CodexRequestClient = {
      async request(method) {
        expect(method).toBe('thread/read')
        return { thread: { id: 'thread-decoy', cwd: 'D:\\course' } }
      },
      async close() { events.push('close') }
    }
    const coordinator = new ExecutorChatCoordinator(
      client,
      'D:\\course',
      async () => { events.push('open') },
      undefined,
      { attempts: 2, intervalMs: 0, wait: async () => undefined }
    )

    await expect(coordinator.prepareTarget(binding())).rejects.toThrow(
      'Codex could not read the Executor chat after creation'
    )
    expect(events).toEqual(['close'])
  })

  it('does not open Desktop when confirmed bootstrap shutdown fails', async () => {
    const events: string[] = []
    const client: CodexRequestClient = {
      async request() {
        return { thread: { id: 'thread-target', cwd: 'D:\\course', turns: [] } }
      },
      async close() {
        events.push('close')
        throw new Error('process still owns task')
      }
    }
    const coordinator = new ExecutorChatCoordinator(
      client,
      'D:\\course',
      async () => { events.push('open') }
    )

    await expect(coordinator.prepareTarget(binding())).rejects.toThrow(
      'Codex Executor bootstrap did not close'
    )
    expect(events).toEqual(['close'])
  })
})
