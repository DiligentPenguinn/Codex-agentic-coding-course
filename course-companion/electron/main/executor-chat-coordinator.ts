import { resolve } from 'node:path'
import type { ExecutorChatBinding } from './practice-run-repository'

export type CodexRequestClient = {
  request: (method: string, params?: Record<string, unknown>) => Promise<unknown>
}

type OpenExternal = (url: string) => Promise<void>

const THREAD_ID = /^[A-Za-z0-9_-]{1,160}$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function samePath(left: unknown, right: string): boolean {
  if (typeof left !== 'string') return false
  return resolve(left).replaceAll('/', '\\').toLocaleLowerCase('en-US') ===
    resolve(right).replaceAll('/', '\\').toLocaleLowerCase('en-US')
}

export class ExecutorChatCoordinator {
  constructor(
    private readonly client: CodexRequestClient,
    private readonly workspaceRoot: string,
    private readonly openExternal: OpenExternal,
    private readonly now: () => Date = () => new Date()
  ) {}

  async createTarget(runId: string): Promise<ExecutorChatBinding> {
    const started = await this.client.request('thread/start', {
      cwd: this.workspaceRoot,
      ephemeral: false,
      sandbox: 'workspace-write',
      approvalPolicy: 'on-request',
      serviceName: 'content_builder_academy_practice'
    })
    if (!isRecord(started) || !isRecord(started.thread)) {
      throw new Error('Codex did not create the Executor chat')
    }
    const threadId = started.thread.id
    if (!THREAD_ID.test(String(threadId)) || !samePath(started.thread.cwd, this.workspaceRoot)) {
      throw new Error('Codex created an invalid Executor chat')
    }
    const name = `Practice · Module 1 · Verifiable brief · ${runId.slice(-6)}`
    await this.client.request('thread/name/set', { threadId, name })
    const read = await this.client.request('thread/read', { threadId, includeTurns: false })
    if (!isRecord(read) || !isRecord(read.thread)) {
      throw new Error('Codex could not verify the Executor chat')
    }
    if (read.thread.id !== threadId || !samePath(read.thread.cwd, this.workspaceRoot)) {
      throw new Error('Codex verified a different Executor chat')
    }
    return {
      runId,
      threadId: String(threadId),
      name,
      workspaceRoot: this.workspaceRoot,
      createdAt: this.now().toISOString()
    }
  }

  async openTarget(binding: ExecutorChatBinding): Promise<void> {
    if (!THREAD_ID.test(binding.threadId)) throw new Error('Invalid Executor chat ID')
    await this.openExternal(`codex://threads/${encodeURIComponent(binding.threadId)}`)
  }
}
