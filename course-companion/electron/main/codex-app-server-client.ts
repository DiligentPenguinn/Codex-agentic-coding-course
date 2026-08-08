import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process'
import readline from 'node:readline'

type PendingRequest = {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
}

type JsonRpcMessage = {
  id?: number
  result?: unknown
  error?: unknown
}

function typedError(code: string, message: string): Error & { code: string } {
  return Object.assign(new Error(message), { code })
}

export class CodexAppServerClient {
  private process: ChildProcessWithoutNullStreams | null = null
  private lines: readline.Interface | null = null
  private initialized = false
  private nextId = 1
  private pending = new Map<number, PendingRequest>()

  async start(): Promise<void> {
    if (this.process) throw typedError('APP_SERVER_ALREADY_STARTED', 'Codex App Server is already running')
    const child = spawn('codex', ['app-server'], {
      stdio: ['pipe', 'pipe', 'pipe'],
      windowsHide: true
    })
    this.process = child
    child.stderr.resume()
    this.lines = readline.createInterface({ input: child.stdout })
    this.lines.on('line', (line) => this.handleLine(line))
    child.once('exit', () => this.handleExit(child))
    child.once('error', () => this.handleExit(child))
    try {
      await this.rawRequest('initialize', {
        clientInfo: {
          name: 'content_builder_academy_course_companion',
          title: 'Content Builder Academy Course Companion',
          version: '0.1.0'
        }
      })
      this.write({ method: 'initialized', params: {} })
      this.initialized = true
    } catch (error) {
      await this.stop()
      throw error
    }
  }

  request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    if (!this.initialized) {
      return Promise.reject(
        typedError('APP_SERVER_NOT_INITIALIZED', 'Codex App Server is not initialized')
      )
    }
    return this.rawRequest(method, params)
  }

  async stop(): Promise<void> {
    const child = this.process
    this.initialized = false
    this.process = null
    this.lines?.close()
    this.lines = null
    this.rejectPending(typedError('APP_SERVER_STOPPED', 'Codex App Server stopped'))
    if (child) {
      child.stdin.end()
      if (child.exitCode === null) child.kill()
    }
  }

  private rawRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    const id = this.nextId++
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject })
      try {
        this.write({ id, method, params })
      } catch {
        this.pending.delete(id)
        reject(typedError('APP_SERVER_WRITE_FAILED', `Could not send App Server request: ${method}`))
      }
    })
  }

  private write(message: Record<string, unknown>): void {
    if (!this.process?.stdin.writable) {
      throw typedError('APP_SERVER_DISCONNECTED', 'Codex App Server is disconnected')
    }
    this.process.stdin.write(`${JSON.stringify(message)}\n`)
  }

  private handleLine(line: string): void {
    let message: JsonRpcMessage
    try {
      message = JSON.parse(line) as JsonRpcMessage
    } catch {
      return
    }
    if (!Number.isSafeInteger(message.id)) return
    const id = Number(message.id)
    const pending = this.pending.get(id)
    if (!pending) return
    this.pending.delete(id)
    if (message.error !== undefined) {
      pending.reject(typedError('APP_SERVER_REQUEST_FAILED', 'Codex App Server request failed'))
    } else {
      pending.resolve(message.result)
    }
  }

  private handleExit(child: ChildProcessWithoutNullStreams): void {
    if (child !== this.process) return
    this.process = null
    this.initialized = false
    this.lines?.close()
    this.lines = null
    this.rejectPending(typedError('APP_SERVER_EXITED', 'Codex App Server exited unexpectedly'))
  }

  private rejectPending(error: Error): void {
    for (const request of this.pending.values()) request.reject(error)
    this.pending.clear()
  }
}
