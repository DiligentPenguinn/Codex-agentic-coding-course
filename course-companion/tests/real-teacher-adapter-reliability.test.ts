import { describe, expect, it } from 'vitest'
import type { CodexNotification } from '../electron/main/codex-app-server-client'
import { RealTeacherAdapter } from '../electron/main/real-teacher-adapter'

type Handler = (notification: CodexNotification) => void

function modelList(): unknown {
  return {
    data: [{ id: 'compatible', model: 'compatible', hidden: false, isDefault: true }],
    nextCursor: null
  }
}

describe('RealTeacherAdapter reliability boundaries', () => {
  it('times out a model-list request that never resolves', async () => {
    const client = {
      onNotification: () => () => undefined,
      request: () => new Promise<unknown>(() => undefined)
    }
    const adapter = new RealTeacherAdapter(client, 'D:\\isolated-teacher', 15)

    await expect(adapter.respond('context')).rejects.toMatchObject({
      name: 'TeacherInferenceError',
      stage: 'thread-start',
      code: 'TEACHER_TIMEOUT'
    })
    await adapter.dispose()
  })

  it('rejects a thread when returned sandbox metadata is not read-only', async () => {
    const client = {
      onNotification: () => () => undefined,
      request: async (method: string): Promise<unknown> => {
        if (method === 'model/list') return modelList()
        if (method === 'thread/start') {
          return {
            thread: { id: 'teacher-thread', cwd: 'D:\\isolated-teacher', ephemeral: true },
            approvalPolicy: 'never',
            sandbox: { type: 'workspaceWrite' }
          }
        }
        return {}
      }
    }
    const adapter = new RealTeacherAdapter(client, 'D:\\isolated-teacher', 100)

    await expect(adapter.respond('context')).rejects.toMatchObject({
      name: 'TeacherInferenceError',
      stage: 'thread-verify'
    })
    await adapter.dispose()
  })

  it('surfaces a safe failed-turn notification instead of waiting for a timeout', async () => {
    let handler: Handler | null = null
    const client = {
      onNotification: (listener: Handler) => {
        handler = listener
        return () => { handler = null }
      },
      request: async (method: string): Promise<unknown> => {
        if (method === 'model/list') return modelList()
        if (method === 'thread/start') {
          return {
            thread: { id: 'teacher-thread', cwd: 'D:\\isolated-teacher', ephemeral: true },
            approvalPolicy: 'never',
            sandbox: { type: 'readOnly' }
          }
        }
        if (method === 'turn/start') {
          queueMicrotask(() => handler?.({
            method: 'error',
            params: {
              threadId: 'teacher-thread',
              turnId: 'teacher-turn',
              error: { message: 'Model rejected the request', codexErrorInfo: 'badRequest' }
            }
          }))
          return { turn: { id: 'teacher-turn' } }
        }
        return {}
      }
    }
    const adapter = new RealTeacherAdapter(client, 'D:\\isolated-teacher', 1_000)

    await expect(adapter.respond('context')).rejects.toEqual(expect.objectContaining({
      name: 'TeacherInferenceError',
      stage: 'turn-protocol',
      code: 'CODEX_BADREQUEST'
    }))
    await adapter.dispose()
  })
  it('creates a fresh model and thread after the App Server transport restarts', async () => {
    let handler: Handler | null = null
    let threadSequence = 0
    let turnSequence = 0
    let modelLists = 0
    const client = {
      onNotification: (listener: Handler) => {
        handler = listener
        return () => { handler = null }
      },
      request: async (method: string, params: Record<string, unknown> = {}): Promise<unknown> => {
        if (method === 'model/list') {
          modelLists += 1
          return modelList()
        }
        if (method === 'thread/start') {
          return {
            thread: {
              id: `teacher-thread-${++threadSequence}`,
              cwd: params.cwd,
              ephemeral: true
            },
            approvalPolicy: 'never',
            sandbox: { type: 'readOnly' }
          }
        }
        if (method === 'turn/start') {
          const threadId = String(params.threadId)
          const turnId = `teacher-turn-${++turnSequence}`
          queueMicrotask(() => {
            const item = { id: `answer-${turnId}`, type: 'agentMessage', phase: 'final_answer', text: threadId }
            handler?.({ method: 'item/completed', params: { threadId, turnId, item } })
            handler?.({
              method: 'turn/completed',
              params: { threadId, turn: { id: turnId, status: 'completed', items: [item] } }
            })
          })
          return { turn: { id: turnId } }
        }
        return {}
      }
    }
    const adapter = new RealTeacherAdapter(client, 'D:\\isolated-teacher', 1_000)

    await expect(adapter.respond('first')).resolves.toBe('teacher-thread-1')
    adapter.resetTransport()
    await expect(adapter.respond('second')).resolves.toBe('teacher-thread-2')
    expect(modelLists).toBe(2)
    await adapter.dispose()
  })

})
