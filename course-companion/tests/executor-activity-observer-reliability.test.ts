import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type {
  CodexConnectionState,
  CodexNotification
} from '../electron/main/codex-app-server-client'
import { ExecutorActivityObserver } from '../electron/main/executor-activity-observer'
import { ExecutorActivityRepository } from '../electron/main/executor-activity-repository'
import type { ExecutorChatBinding } from '../electron/main/practice-run-repository'

const directories: string[] = []

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

class ObservationGateway {
  private notification: ((value: CodexNotification) => void) | null = null
  private connection: ((value: CodexConnectionState) => void) | null = null
  readonly methods: string[] = []

  onNotification(listener: (value: CodexNotification) => void): () => void {
    this.notification = listener
    return () => { this.notification = null }
  }

  onConnectionState(listener: (value: CodexConnectionState) => void): () => void {
    this.connection = listener
    return () => { this.connection = null }
  }

  async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    this.methods.push(method)
    if (method === 'thread/resume') {
      return {
        thread: { id: params.threadId },
        cwd: 'D:\\course',
        model: 'gpt-5.6-sol',
        reasoningEffort: 'high',
        serviceTier: null,
        approvalPolicy: 'on-request',
        sandbox: { type: 'workspaceWrite', writableRoots: ['D:\\course'] }
      }
    }
    if (method === 'thread/read') {
      return { thread: { id: params.threadId, turns: [] } }
    }
    return {}
  }

  emit(notification: CodexNotification): void {
    this.notification?.(notification)
  }

  setConnection(state: CodexConnectionState): void {
    this.connection?.(state)
  }
}

describe('ExecutorActivityObserver reliability', () => {
  it('serializes burst notifications, recovers after reconnect, and clears in-memory state on reset', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'executor-observer-'))
    directories.push(directory)
    const gateway = new ObservationGateway()
    const observer = new ExecutorActivityObserver(
      gateway,
      new ExecutorActivityRepository(directory),
      () => new Date('2026-08-09T00:00:00.000Z'),
      {
        capture: async (_workspaceRoot, capturedAt) => ({
          schemaVersion: 1, capturedAt, gitAvailable: true, head: null, entries: {}
        }),
        reconcile: async () => ({
          changedSinceBaseline: [],
          committedReportedFilesSinceRunStart: [],
          currentlyDirtyReportedFiles: []
        })
      }
    )
    const binding: ExecutorChatBinding = {
      runId: 'run-current',
      threadId: 'thread-current',
      name: 'Practice',
      workspaceRoot: 'D:\\course',
      createdAt: '2026-08-09T00:00:00.000Z'
    }

    await observer.bind(binding)
    expect(gateway.methods).toContain('thread/resume')
    expect(gateway.methods).toContain('thread/read')
    gateway.emit({
      method: 'item/completed',
      params: {
        threadId: binding.threadId,
        turnId: 'turn-1',
        item: { id: 'answer-1', type: 'agentMessage', phase: 'final_answer', text: 'Verified answer' }
      }
    })
    gateway.emit({
      method: 'turn/completed',
      params: { threadId: binding.threadId, turn: { id: 'turn-1', status: 'completed', items: [] } }
    })

    expect((await observer.current())?.executorResponses).toEqual(['Verified answer'])
    gateway.setConnection('disconnected')
    expect((await observer.current())?.status).toBe('disconnected')
    expect((await observer.current())?.configuration?.freshness).toBe('stale')
    gateway.setConnection('connected')
    expect((await observer.current())?.status).toBe('ready')
    expect((await observer.current())?.configuration).toMatchObject({
      freshness: 'fresh', connection: 'connected', threadId: binding.threadId
    })

    await observer.reset()
    expect(await observer.current()).toBeNull()
    observer.dispose()
  })
})
