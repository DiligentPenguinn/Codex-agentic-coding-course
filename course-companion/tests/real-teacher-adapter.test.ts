import { describe, expect, it } from 'vitest'
import type { CodexNotification } from '../electron/main/codex-app-server-client'
import {
  parseRunSummaryProposal,
  RealTeacherAdapter
} from '../electron/main/real-teacher-adapter'

class InferenceClient {
  readonly calls: Array<[string, Record<string, unknown>]> = []
  private listener: ((notification: CodexNotification) => void) | null = null
  private sequence = 0

  constructor(
    private readonly forbidden = false,
    private readonly answer = 'Grounded answer'
  ) {}

  onNotification(listener: (notification: CodexNotification) => void): () => void {
    this.listener = listener
    return () => { this.listener = null }
  }

  async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    this.calls.push([method, params])
    if (method === 'model/list') {
      return {
        data: [
          { id: 'mock-teacher-model', model: 'mock-teacher-model', hidden: false, isDefault: true }
        ],
        nextCursor: null
      }
    }
    if (method === 'thread/start') {
      return {
        thread: {
          id: `teacher-thread-${++this.sequence}`,
          cwd: params.cwd,
          ephemeral: true
        },
        approvalPolicy: 'never',
        sandbox: { type: 'readOnly' }
      }
    }
    if (method === 'turn/start') {
      const turnId = `teacher-turn-${++this.sequence}`
      const threadId = String(params.threadId)
      queueMicrotask(() => {
        if (this.forbidden) {
          this.listener?.({
            method: 'item/started',
            params: { threadId, turnId, item: { id: 'command-1', type: 'commandExecution' } }
          })
          return
        }
        const item = {
          id: 'answer-1',
          type: 'agentMessage',
          phase: null,
          text: this.answer
        }
        this.listener?.({ method: 'item/completed', params: { threadId, turnId, item } })
        this.listener?.({
          method: 'turn/completed',
          params: { threadId, turn: { id: turnId, status: 'completed', items: [item] } }
        })
      })
      return { turn: { id: turnId } }
    }
    return {}
  }
}

describe('RealTeacherAdapter', () => {
  it('creates an ephemeral read-only no-approval Teacher thread and accepts only its final answer', async () => {
    const client = new InferenceClient()
    const adapter = new RealTeacherAdapter(client, 'D:\\course', 1_000)

    await expect(adapter.respond('bounded context')).resolves.toBe('Grounded answer')

    expect(client.calls[0]).toEqual(['model/list', {}])
    expect(client.calls[1]).toEqual([
      'thread/start',
      expect.objectContaining({
        cwd: 'D:\\course',
        ephemeral: true,
        sandbox: 'read-only',
        approvalPolicy: 'never',
        serviceName: 'content_builder_academy_teacher',
        model: 'mock-teacher-model',
      })
    ])
    expect(client.calls[2]).toEqual([
      'turn/start',
      expect.objectContaining({ input: [{ type: 'text', text: 'bounded context', text_elements: [] }] })
    ])
    await adapter.dispose()
  })

  it('preserves structured final answers longer than 2,000 characters', async () => {
    const answer = JSON.stringify({ summary: 'x'.repeat(3_000) })
    const client = new InferenceClient(false, answer)
    const adapter = new RealTeacherAdapter(client, 'D:\\course', 1_000)

    await expect(adapter.respond('return structured JSON')).resolves.toBe(answer)
    await adapter.dispose()
  })
  it('interrupts and rejects a Teacher turn that tries to use a tool', async () => {
    const client = new InferenceClient(true)
    const adapter = new RealTeacherAdapter(client, 'D:\\course', 1_000)

    await expect(adapter.respond('bounded context')).rejects.toThrow('no-tools boundary')
    expect(client.calls.some(([method]) => method === 'turn/interrupt')).toBe(true)
    await adapter.dispose()
  })
})

describe('parseRunSummaryProposal', () => {
  it('accepts strict grounded summary JSON and rejects missing fields', () => {
    const valid = JSON.stringify({
      approach: 'Reviewed scope.',
      learnerDecisions: [],
      strengths: [],
      mistakes: [],
      approvals: [],
      changedFiles: [],
      verificationEvidence: [],
      unresolvedIssues: [],
      nextAttemptGuidance: []
    })

    expect(parseRunSummaryProposal(valid).approach).toBe('Reviewed scope.')
    expect(() => parseRunSummaryProposal('{"approach":"Only"}')).toThrow('Invalid Teacher summary')
  })
})
