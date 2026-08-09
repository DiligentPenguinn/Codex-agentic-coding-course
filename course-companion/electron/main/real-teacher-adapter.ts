import type { CodexNotification } from './codex-app-server-client'

const SAFE_ID = /^[A-Za-z0-9_-]{1,500}$/
const MODEL_ID = /^[A-Za-z0-9._-]{1,160}$/
const FORBIDDEN_ITEMS = new Set([
  'commandExecution',
  'fileChange',
  'mcpToolCall',
  'dynamicToolCall',
  'collabAgentToolCall',
  'webSearch',
  'imageView',
  'imageGeneration'
])

const FORBIDDEN_SERVER_REQUESTS = new Set([
  'item/commandExecution/requestApproval',
  'item/fileChange/requestApproval',
  'item/permissions/requestApproval',
  'item/tool/requestUserInput',
  'item/tool/call',
  'mcpServer/elicitation/request'
])
const TEACHER_INSTRUCTIONS = [
  'You are Hương, the Content Builder Academy Practice Teacher.',
  'Use only the supplied course, learner-memory, Practice, bound-Executor, and Teacher-chat context.',
  'You have no tools. Never inspect files, control tasks, invent evidence, or claim fresh awareness when context is stale or disconnected.',
  'Be concise, supportive, and specific. Reply in the learner\'s language.'
].join(' ')

const SUMMARY_INSTRUCTIONS = [
  'You are Hương performing hidden Practice-memory consolidation.',
  'Use only the supplied frozen run. Return strict JSON and no markdown.',
  'Do not invent files, approvals, evidence, or outcomes.',
  'Strengths, mistakes, unresolved issues, and guidance must be grounded in the supplied facts.',
  'You have no tools.'
].join(' ')

export type TeacherInferenceClient = {
  request: (method: string, params?: Record<string, unknown>) => Promise<unknown>
  onNotification: (listener: (notification: CodexNotification) => void) => () => void
}

export type RunSummaryProposal = {
  approach: string
  learnerDecisions: string[]
  strengths: string[]
  mistakes: string[]
  approvals: string[]
  changedFiles: string[]
  verificationEvidence: string[]
  unresolvedIssues: string[]
  nextAttemptGuidance: string[]
}

type PendingTurn = {
  threadId: string
  turnId: string
  answer: string
  resolve: (answer: string) => void
  reject: (error: Error) => void
  timeout: ReturnType<typeof setTimeout>
}

type Fact = {
  threadId: string
  turnId: string
  kind: 'answer' | 'completed' | 'forbidden' | 'failure'
  answer?: string
  completed?: boolean
  code?: string
  message?: string
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function bounded(value: string, maximum = 2_000): string {
  const points = [...value.trim()]
  return points.length <= maximum ? points.join('') : `${points.slice(0, maximum - 1).join('')}…`
}

function safeFailureMessage(value: unknown): string {
  const item = record(value)
  const raw = typeof item?.message === 'string' ? item.message : 'Teacher turn failed'
  return bounded(raw
    .replace(/[A-Za-z]:[\\/][^\s"']+/g, '<path>')
    .replace(/(?:bearer|token|api[_-]?key)\s*[:=]?\s*[^\s,;]+/gi, '<credential>')
    .replaceAll(/\s+/g, ' '), 500)
}

function finalAnswer(item: Record<string, unknown> | null): string {
  if (!item || item.type !== 'agentMessage' || (item.phase !== undefined && item.phase !== null && item.phase !== 'final_answer')) return ''
  return typeof item.text === 'string' ? bounded(item.text) : ''
}

function factFromNotification(notification: CodexNotification): Fact | null {
  const params = record(notification.params)
  if (!params || typeof params.threadId !== 'string' || typeof params.turnId !== 'string' && notification.method !== 'turn/completed') return null
  if (FORBIDDEN_SERVER_REQUESTS.has(notification.method)) {
    return { threadId: params.threadId, turnId: String(params.turnId), kind: 'forbidden' }
  }
  if (notification.method === 'error') {
    const error = record(params.error)
    const info = error?.codexErrorInfo
    const code = typeof info === 'string'
      ? `CODEX_${info.replaceAll(/[^A-Za-z0-9]+/g, '_').toUpperCase()}`
      : 'TEACHER_TURN_ERROR'
    return { threadId: params.threadId, turnId: String(params.turnId), kind: 'failure', code, message: safeFailureMessage(error) }
  }
  if (notification.method === 'item/started' || notification.method === 'item/completed') {
    const item = record(params.item)
    if (item && FORBIDDEN_ITEMS.has(String(item.type))) {
      return { threadId: params.threadId, turnId: String(params.turnId), kind: 'forbidden' }
    }
    const answer = notification.method === 'item/completed' ? finalAnswer(item) : ''
    return answer ? { threadId: params.threadId, turnId: String(params.turnId), kind: 'answer', answer } : null
  }
  if (notification.method === 'turn/completed') {
    const turn = record(params.turn)
    if (!turn || typeof turn.id !== 'string') return null
    const items = Array.isArray(turn.items) ? turn.items.map(record).filter(Boolean) : []
    if (items.some((item) => item && FORBIDDEN_ITEMS.has(String(item.type)))) {
      return { threadId: params.threadId, turnId: turn.id, kind: 'forbidden' }
    }
    const answer = items.reduce((latest, item) => finalAnswer(item) || latest, '')
    return { threadId: params.threadId, turnId: turn.id, kind: 'completed', completed: turn.status === 'completed', answer }
  }
  return null
}

function verifyThread(value: unknown, cwd: string): string {
  const response = record(value)
  const thread = record(response?.thread)
  const sandbox = record(response?.sandbox)
  if (!thread || typeof thread.id !== 'string' || !SAFE_ID.test(thread.id) || thread.cwd !== cwd || thread.ephemeral !== true
    || response?.approvalPolicy !== 'never' || sandbox?.type !== 'readOnly') {
    throw new Error('Teacher thread verification failed')
  }
  return thread.id
}

function verifyTurn(value: unknown): string {
  const turn = record(record(value)?.turn)
  if (!turn || typeof turn.id !== 'string' || !SAFE_ID.test(turn.id)) throw new Error('Teacher turn verification failed')
  return turn.id
}

function stringArray(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length > 50 || !value.every((item) => typeof item === 'string' && item.length <= 2_000)) return null
  return value
}

export function parseRunSummaryProposal(text: string): RunSummaryProposal {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  const value = record(JSON.parse(cleaned))
  if (!value || typeof value.approach !== 'string' || value.approach.length > 4_000) throw new Error('Invalid Teacher summary')
  const fields = [
    'learnerDecisions', 'strengths', 'mistakes', 'approvals', 'changedFiles',
    'verificationEvidence', 'unresolvedIssues', 'nextAttemptGuidance'
  ] as const
  const parsed: Partial<RunSummaryProposal> = { approach: value.approach }
  for (const field of fields) {
    const items = stringArray(value[field])
    if (!items) throw new Error('Invalid Teacher summary')
    parsed[field] = items
  }
  return parsed as RunSummaryProposal
}

export type TeacherFailureStage =
  | 'thread-start'
  | 'thread-verify'
  | 'turn-start'
  | 'turn-wait'
  | 'turn-protocol'
  | 'adapter'

export class TeacherInferenceError extends Error {
  constructor(
    readonly stage: TeacherFailureStage,
    readonly code: string,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'TeacherInferenceError'
  }
}

function inferenceError(stage: TeacherFailureStage, error: unknown): TeacherInferenceError {
  if (error instanceof TeacherInferenceError) return error
  const item = record(error)
  const code = typeof item?.code === 'string' ? item.code : 'TEACHER_INFERENCE_FAILED'
  const message = error instanceof Error ? error.message : 'Teacher inference failed'
  return new TeacherInferenceError(stage, code, bounded(message, 500), { cause: error })
}
export class RealTeacherAdapter {
  private responseThreadId: string | null = null
  private summaryThreadId: string | null = null
  private pending: PendingTurn | null = null
  private earlyFacts: Fact[] = []
  private disposed = false
  private busy = false
  private readonly removeNotification: () => void
  private selectedModel: string | null = null

  constructor(
    private readonly client: TeacherInferenceClient,
    private readonly teacherCwd: string,
    private readonly timeoutMs = 60_000
  ) {
    this.removeNotification = client.onNotification((notification) => this.consume(notification))
  }

  respond(input: string): Promise<string> {
    return this.run('response', input)
  }
  async resetTransport(cleanup = false): Promise<void> {
    const pending = this.pending
    const threadIds = [this.responseThreadId, this.summaryThreadId].filter((value): value is string => Boolean(value))
    this.responseThreadId = null
    this.summaryThreadId = null
    this.selectedModel = null
    this.earlyFacts = []
    if (pending) {
      this.finish(new TeacherInferenceError(
        'turn-protocol',
        'APP_SERVER_DISCONNECTED',
        'Codex App Server disconnected during Teacher inference'
      ))
    }
    if (!cleanup) return
    if (pending) {
      await this.safeRequest('turn/interrupt', { threadId: pending.threadId, turnId: pending.turnId })
    }
    await Promise.all(threadIds.map((threadId) => this.safeRequest('thread/unsubscribe', { threadId })))
  }

  async summarize(input: string): Promise<RunSummaryProposal> {
    return parseRunSummaryProposal(await this.run('summary', input))
  }

  async dispose(): Promise<void> {
    if (this.disposed) return
    this.disposed = true
    this.removeNotification()
    if (this.pending) {
      const pending = this.pending
      this.finish(new Error('Teacher adapter stopped'))
      await this.safeRequest('turn/interrupt', { threadId: pending.threadId, turnId: pending.turnId })
    }
    for (const threadId of [this.responseThreadId, this.summaryThreadId]) {
      if (threadId) await this.safeRequest('thread/unsubscribe', { threadId })
    }
  }

  private async run(kind: 'response' | 'summary', input: string): Promise<string> {
    if (this.disposed) throw new TeacherInferenceError('adapter', 'TEACHER_STOPPED', 'Teacher adapter stopped')
    if (this.busy) throw new TeacherInferenceError('adapter', 'TEACHER_BUSY', 'Teacher is already responding')
    this.busy = true
    try {
      const threadId = await this.ensureThread(kind)
      let started: unknown
      try {
        started = await this.request('turn-start', 'turn/start', {
          threadId,
          input: [{ type: 'text', text: input, text_elements: [] }]
        })
      } catch (error) {
        throw inferenceError('turn-start', error)
      }
      let turnId: string
      try {
        turnId = verifyTurn(started)
      } catch (error) {
        throw inferenceError('turn-start', error)
      }
      return await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          if (!this.pending || this.pending.turnId !== turnId) return
          this.finish(new TeacherInferenceError('turn-wait', 'TEACHER_TIMEOUT', 'Teacher response timed out'))
          void this.safeRequest('turn/interrupt', { threadId, turnId })
        }, this.timeoutMs)
        this.pending = { threadId, turnId, answer: '', resolve, reject, timeout }
        const early = this.earlyFacts
        this.earlyFacts = []
        for (const fact of early) this.processFact(fact)
      })
    } finally {
      this.busy = false
    }
  }

  private async selectModel(): Promise<string> {
    if (this.selectedModel) return this.selectedModel
    let result: unknown
    try {
      result = await this.request('thread-start', 'model/list', {})
    } catch (error) {
      throw inferenceError('thread-start', error)
    }
    const data = record(result)?.data
    if (!Array.isArray(data)) throw new TeacherInferenceError('thread-start', 'TEACHER_MODEL_LIST_INVALID', 'Codex returned an invalid model list')
    const candidates = data
      .map(record)
      .filter((item): item is Record<string, unknown> => item !== null)
      .filter((item) => item.hidden !== true)
    const selected = candidates.find((item) => item.isDefault === true) ?? candidates[0]
    const model = typeof selected?.model === 'string'
      ? selected.model
      : typeof selected?.id === 'string'
        ? selected.id
        : ''
    if (!MODEL_ID.test(model)) throw new TeacherInferenceError('thread-start', 'TEACHER_MODEL_UNAVAILABLE', 'Codex did not advertise a compatible Teacher model')
    this.selectedModel = model
    return model
  }

  private async ensureThread(kind: 'response' | 'summary'): Promise<string> {
    const current = kind === 'response' ? this.responseThreadId : this.summaryThreadId
    if (current) return current
    const model = await this.selectModel()
    let result: unknown
    try {
      result = await this.request('thread-start', 'thread/start', {
        cwd: this.teacherCwd,
        model,
        ephemeral: true,
        sandbox: 'read-only',
        approvalPolicy: 'never',
        serviceName: kind === 'response' ? 'content_builder_academy_teacher' : 'content_builder_academy_teacher_memory',
        developerInstructions: kind === 'response' ? TEACHER_INSTRUCTIONS : SUMMARY_INSTRUCTIONS
      })
    } catch (error) {
      throw inferenceError('thread-start', error)
    }
    let threadId: string
    try {
      threadId = verifyThread(result, this.teacherCwd)
    } catch (error) {
      throw inferenceError('thread-verify', error)
    }
    if (kind === 'response') this.responseThreadId = threadId
    else this.summaryThreadId = threadId
    return threadId
  }

  private consume(notification: CodexNotification): void {
    const fact = factFromNotification(notification)
    if (!fact) return
    if (this.pending) this.processFact(fact)
    else {
      this.earlyFacts.push(fact)
      this.earlyFacts = this.earlyFacts.slice(-64)
    }
  }

  private processFact(fact: Fact): void {
    if (!this.pending || fact.threadId !== this.pending.threadId || fact.turnId !== this.pending.turnId) return
    if (fact.kind === 'forbidden') {
      const pending = this.pending
      this.finish(new TeacherInferenceError('turn-protocol', 'TEACHER_TOOL_VIOLATION', 'Teacher inference violated the no-tools boundary'))
      void this.safeRequest('turn/interrupt', { threadId: pending.threadId, turnId: pending.turnId })
      return
    }
    if (fact.kind === 'failure') {
      this.finish(new TeacherInferenceError('turn-protocol', fact.code ?? 'TEACHER_TURN_ERROR', fact.message ?? 'Teacher turn failed'))
      return
    }
    if (fact.answer) this.pending.answer = fact.answer
    if (fact.kind === 'completed') {
      if (fact.completed && this.pending.answer) this.finish(null, this.pending.answer)
      else this.finish(new TeacherInferenceError('turn-protocol', 'TEACHER_INCOMPLETE', 'Teacher inference did not complete'))
    }
  }

  private finish(error: Error | null, answer = ''): void {
    if (!this.pending) return
    const pending = this.pending
    this.pending = null
    clearTimeout(pending.timeout)
    if (error) pending.reject(error)
    else pending.resolve(answer)
  }

  private request(stage: TeacherFailureStage, method: string, params: Record<string, unknown>): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new TeacherInferenceError(stage, 'TEACHER_TIMEOUT', `Teacher request timed out during ${method}`))
      }, this.timeoutMs)
      this.client.request(method, params).then(
        (value) => {
          clearTimeout(timeout)
          resolve(value)
        },
        (error: unknown) => {
          clearTimeout(timeout)
          reject(inferenceError(stage, error))
        }
      )
    })
  }

  private async safeRequest(method: string, params: Record<string, unknown>): Promise<void> {
    try {
      await this.client.request(method, params)
    } catch {
      // Cleanup is best-effort and never exposes raw protocol errors.
    }
  }
}
