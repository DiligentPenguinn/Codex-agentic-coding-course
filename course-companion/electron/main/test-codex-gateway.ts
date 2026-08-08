import type { CodexRequestClient } from './executor-chat-coordinator'

type TestThread = {
  id: string
  cwd: string
  name?: string
}

export class TestCodexGateway implements CodexRequestClient {
  private readonly threads = new Map<string, TestThread>()
  private sequence = 0

  constructor(private readonly workspaceRoot: string) {}

  async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    if (method === 'thread/start') {
      const id = `course-companion-smoke-${++this.sequence}`
      const thread = { id, cwd: this.workspaceRoot }
      this.threads.set(id, thread)
      return { thread }
    }

    const threadId = typeof params.threadId === 'string' ? params.threadId : ''
    const thread = this.threads.get(threadId)
    if (!thread) throw new Error(`Unknown smoke-test thread: ${threadId}`)

    if (method === 'thread/name/set') {
      thread.name = typeof params.name === 'string' ? params.name : undefined
      return {}
    }
    if (method === 'thread/read') return { thread }

    throw new Error(`Unsupported smoke-test Codex method: ${method}`)
  }
}
