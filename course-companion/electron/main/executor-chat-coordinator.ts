import { resolve } from 'node:path'
import type { ExecutorChatBinding } from './practice-run-repository'

export type CodexRequestClient = {
  request: (method: string, params?: Record<string, unknown>) => Promise<unknown>
  close?: () => Promise<void>
}

type OpenExternal = (url: string) => Promise<void>
type DiscoveryOptions = {
  attempts?: number
  intervalMs?: number
  wait?: (milliseconds: number) => Promise<void>
}

const THREAD_ID = /^[A-Za-z0-9_-]{1,160}$/
const defaultWait = (milliseconds: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, milliseconds)
})

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
    private readonly now: () => Date = () => new Date(),
    private readonly discovery: DiscoveryOptions = {}
  ) {}

  async createTarget(runId: string): Promise<ExecutorChatBinding> {
    return this.withBootstrap(async () => {
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
      return {
        runId,
        threadId: String(threadId),
        name,
        workspaceRoot: this.workspaceRoot,
        createdAt: this.now().toISOString()
      }
    })
  }

  async prepareTarget(binding: ExecutorChatBinding): Promise<void> {
    if (!THREAD_ID.test(binding.threadId) || !samePath(binding.workspaceRoot, this.workspaceRoot)) {
      throw new Error('Invalid Executor chat binding')
    }
    await this.withBootstrap(async () => {
      await this.waitUntilReadable(binding.threadId)
    })
  }

  private async waitUntilReadable(threadId: string): Promise<void> {
    const attempts = Math.max(1, this.discovery.attempts ?? 30)
    const intervalMs = Math.max(0, this.discovery.intervalMs ?? 100)
    const wait = this.discovery.wait ?? defaultWait
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const read = await this.client.request('thread/read', {
          threadId,
          includeTurns: false
        })
        if (isRecord(read) && isRecord(read.thread) && read.thread.id === threadId &&
          samePath(read.thread.cwd, this.workspaceRoot)) return
      } catch {
        // State persistence can briefly lag process startup; retry the exact read only.
      }
      if (attempt + 1 < attempts) await wait(intervalMs)
    }
    throw new Error('Codex could not read the Executor chat after creation')
  }

  async openTarget(binding: ExecutorChatBinding): Promise<void> {
    if (!THREAD_ID.test(binding.threadId)) throw new Error('Invalid Executor chat ID')
    await this.openExternal(`codex://threads/${encodeURIComponent(binding.threadId)}`)
  }

  private async withBootstrap<T>(operation: () => Promise<T>): Promise<T> {
    let result: T | undefined
    let operationFailed = false
    let operationError: unknown
    try {
      result = await operation()
    } catch (error) {
      operationFailed = true
      operationError = error
    }
    let closeError: unknown
    try {
      await this.client.close?.()
    } catch (error) {
      closeError = error
    }
    if (operationFailed) throw operationError
    if (closeError !== undefined) {
      throw new Error('Codex Executor bootstrap did not close', { cause: closeError })
    }
    return result as T
  }
}
