import type {
  CodexConnectionListener,
  CodexNotification,
  CodexNotificationListener
} from './codex-app-server-client'
import type { CodexRequestClient } from './executor-chat-coordinator'

type TestThread = {
  id: string
  cwd: string
  name?: string
  ephemeral?: boolean
  serviceName?: string
  turns: Array<{ id: string; status: string; items: unknown[] }>
}

export class TestCodexGateway implements CodexRequestClient {
  private readonly threads = new Map<string, TestThread>()
  private readonly notificationListeners = new Set<CodexNotificationListener>()
  private failTeacherTurn = process.env.COURSE_COMPANION_FAKE_TEACHER_FAIL_ONCE === '1'
  private readonly connectionListeners = new Set<CodexConnectionListener>()
  private sequence = 0
  private readonly silentExecutorResult = process.env.COURSE_COMPANION_FAKE_EXECUTOR_SILENT_RESULT === '1'
  private readonly threadReads = new Map<string, number>()

  constructor(private readonly workspaceRoot: string) {}

  onNotification(listener: CodexNotificationListener): () => void {
    this.notificationListeners.add(listener)
    return () => this.notificationListeners.delete(listener)
  }

  onConnectionState(listener: CodexConnectionListener): () => void {
    this.connectionListeners.add(listener)
    listener('connected')
    return () => this.connectionListeners.delete(listener)
  }

  async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    if (method === 'model/list') {
      return {
        data: [
          { id: 'mock-teacher-model', model: 'mock-teacher-model', hidden: false, isDefault: true }
        ],
        nextCursor: null
      }
    }
    if (method === 'thread/start') {
      const id = `course-companion-smoke-${++this.sequence}`
      const thread: TestThread = {
        id,
        cwd: typeof params.cwd === 'string' ? params.cwd : this.workspaceRoot,
        ephemeral: params.ephemeral === true,
        serviceName: typeof params.serviceName === 'string' ? params.serviceName : undefined,
        turns: []
      }
      this.threads.set(id, thread)
      return {
        thread,
        approvalPolicy: params.approvalPolicy,
        sandbox: { type: params.sandbox === 'read-only' ? 'readOnly' : 'workspaceWrite' }
      }
    }

    if (method === 'thread/list') {
      return { data: [...this.threads.values()] }
    }

    const threadId = typeof params.threadId === 'string' ? params.threadId : ''
    const thread = this.threads.get(threadId)
    if (!thread) throw new Error(`Unknown smoke-test thread: ${threadId}`)

    if (method === 'thread/name/set') {
      thread.name = typeof params.name === 'string' ? params.name : undefined
      return {}
    }
    if (method === 'thread/read') {
      const reads = (this.threadReads.get(threadId) ?? 0) + 1
      this.threadReads.set(threadId, reads)
      if (this.silentExecutorResult && !thread.ephemeral && reads >= 2 &&
        !thread.turns.some((turn) => turn.id === 'executor-turn-silent-desktop')) {
        thread.turns.push(silentExecutorTurn())
      }
      return { thread }
    }
    if (method === 'thread/resume') return { thread }
    if (method === 'thread/unsubscribe' || method === 'turn/interrupt') return {}
    if (method === 'turn/start') {
      const turnId = `turn-${++this.sequence}`
      if (thread.serviceName === 'content_builder_academy_teacher' && this.failTeacherTurn) {
        this.failTeacherTurn = false
        queueMicrotask(() => {
          this.emit({
            method: 'error',
            params: {
              threadId,
              turnId,
              error: { message: 'Injected transient Teacher failure', codexErrorInfo: 'internalServerError' }
            }
          })
        })
        return { turn: { id: turnId } }
      }
      const input = Array.isArray(params.input) ? params.input : []
      const text = input.map((item) => typeof item === 'object' && item && 'text' in item ? String(item.text) : '').join('\n')
      const answer = thread.serviceName === 'content_builder_academy_practice'
        ? 'Sẵn sàng nhận brief từ người học.'
        : thread.serviceName === 'content_builder_academy_teacher_memory'
          ? summaryAnswer(text) || JSON.stringify({
            approach: '\u0110\u00e3 th\u1ef1c hi\u1ec7n m\u1ed9t l\u01b0\u1ee3t Practice c\u00f3 ph\u1ea1m vi.',
            learnerDecisions: [],
            strengths: ['\u0110\u00e3 y\u00eau c\u1ea7u b\u1eb1ng ch\u1ee9ng tr\u01b0\u1edbc khi k\u1ebft lu\u1eadn.'],
            mistakes: [],
            approvals: [],
            changedFiles: [],
            verificationEvidence: [],
            unresolvedIssues: [],
            nextAttemptGuidance: ['Ti\u1ebfp t\u1ee5c ki\u1ec3m tra ph\u1ea1m vi v\u00e0 b\u1eb1ng ch\u1ee9ng.']
            })
          : teacherAnswer(text)
      const userItem = {
        id: `user-${turnId}`,
        type: 'userMessage',
        content: [{ type: 'text', text }]
      }
      const item = { id: `message-${turnId}`, type: 'agentMessage', phase: 'final_answer', text: answer }
      const turn = { id: turnId, status: 'completed', items: [userItem, item] }
      thread.turns.push(turn)
      queueMicrotask(() => {
        this.emit({ method: 'item/completed', params: { threadId, turnId, item } })
        this.emit({ method: 'turn/completed', params: { threadId, turn } })
      })
      return { turn: { id: turnId } }
    }

    throw new Error(`Unsupported smoke-test Codex method: ${method}`)
  }

  emitExecutorActivity(threadId: string, item: Record<string, unknown>): void {
    const turnId = `executor-turn-${++this.sequence}`
    this.emit({ method: 'item/completed', params: { threadId, turnId, item } })
  }

  private emit(notification: CodexNotification): void {
    for (const listener of this.notificationListeners) listener(notification)
  }
}

function silentExecutorTurn(): TestThread['turns'][number] {
  return {
    id: 'executor-turn-silent-desktop',
    status: 'completed',
    items: [
      { id: 'executor-user', type: 'userMessage', content: [{ type: 'text', text: 'resume' }] },
      { id: 'executor-reasoning', type: 'reasoning' },
      {
        id: 'executor-final',
        type: 'agentMessage',
        phase: 'final_answer',
        text: [
          '**Changed**',
          '- Updated starters/contentpilot/app/globals.css:138.',
          '',
          '**Verification**',
          '- npm run lint — passed.',
          '- At 390px, scrollWidth: 390, innerWidth: 390, hasHorizontalOverflow: false.'
        ].join('\n')
      }
    ]
  }
}

function summaryAnswer(input: string): string {
  const marker = 'FROZEN_PRACTICE_RUN\n'
  const end = '\nReturn JSON'
  const startIndex = input.indexOf(marker)
  const endIndex = input.indexOf(end)
  let activity: Record<string, unknown> = {}
  let learnerDecisions: string[] = []
  if (startIndex >= 0 && endIndex > startIndex) {
    try {
      const frozen = JSON.parse(input.slice(startIndex + marker.length, endIndex)) as {
        activity?: Record<string, unknown> | null
        teacherChat?: Array<{ role?: string; content?: string }>
      }
      activity = frozen.activity ?? {}
      learnerDecisions = (frozen.teacherChat ?? [])
        .filter((message) => message.role === 'learner' && typeof message.content === 'string')
        .slice(-2)
        .map((message) => String(message.content))
    } catch {
      // The deterministic fallback below remains valid when frozen test input is malformed.
    }
  }
  const strings = (value: unknown): string[] => Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
  return JSON.stringify({
    approach: strings(activity.learnerPrompts).at(-1) ?? 'Đã thực hiện một lượt Practice có phạm vi.',
    learnerDecisions,
    strengths: ['Đã yêu cầu bằng chứng trước khi kết luận.'],
    mistakes: [],
    approvals: strings(activity.approvalEvents),
    changedFiles: strings(activity.changedFiles),
    verificationEvidence: strings(activity.verificationEvidence),
    unresolvedIssues: [],
    nextAttemptGuidance: ['Tiếp tục kiểm tra phạm vi và bằng chứng.']
  })
}
function teacherAnswer(input: string): string {
  const marker = 'TEACHER_CONTEXT_ENVELOPE\n'
  const end = '\nRECENT_TEACHER_CHAT'
  const startIndex = input.indexOf(marker)
  const endIndex = input.indexOf(end)
  if (startIndex >= 0 && endIndex > startIndex) {
    try {
      const envelope = JSON.parse(input.slice(startIndex + marker.length, endIndex)) as {
        freshness?: 'fresh' | 'stale' | 'disconnected'
        practice?: { activity?: { executorResponses?: string[]; changedFiles?: string[]; reportedChangedFiles?: string[]; reportedVerificationEvidence?: string[]; workspaceConfirmedChangedFiles?: string[] } }
      }
      const latest = envelope.practice?.activity?.executorResponses?.at(-1)
      const changed = envelope.practice?.activity?.changedFiles?.length ?? 0
      const reportedFiles = envelope.practice?.activity?.reportedChangedFiles ?? []
      const reportedEvidence = envelope.practice?.activity?.reportedVerificationEvidence ?? []
      const confirmedFiles = envelope.practice?.activity?.workspaceConfirmedChangedFiles ?? []
      if (reportedFiles.length > 0) {
        const confirmation = confirmedFiles.length > 0
          ? 'Workspace xác nhận tệp đang thay đổi: ' + confirmedFiles.join(', ') + '.'
          : 'Course Companion chưa xác nhận độc lập thay đổi tệp trong workspace.'
        return 'Executor báo đã thay đổi: ' + reportedFiles.join(', ') + '. ' + confirmation
          + ' Bằng chứng kiểm tra do Executor báo cáo, chưa được Course Companion chạy lại: '
          + reportedEvidence.join(' ')
      }
      if (envelope.freshness !== 'fresh') {
        const disclosure = envelope.freshness === 'disconnected'
          ? 'Ngữ cảnh Executor hiện bị mất kết nối.'
          : 'Ngữ cảnh Executor hiện đã cũ.'
        return latest
          ? `${disclosure} Bản ghi gần nhất: ${latest} Số tệp thay đổi: ${changed}.`
          : `${disclosure} Tôi chưa thể xác nhận trạng thái mới nhất.`
      }
      if (latest) return `Tôi đang theo dõi đúng Practice hiện tại. Executor báo: ${latest} Số tệp thay đổi: ${changed}.`
    } catch {
      // The fake response remains bounded and deterministic if its test envelope is malformed.
    }
  }
  return 'B\u1ea1n \u0111ang \u1edf b\u01b0\u1edbc duy\u1ec7t k\u1ebf ho\u1ea1ch. H\u00e3y ki\u1ec3m tra b\u1ed1n \u0111i\u1ec3m: t\u1ec7p s\u1ebd \u0111\u1ed5i, thay \u0111\u1ed5i d\u1ef1 ki\u1ebfn, r\u1ee7i ro v\u00e0 c\u00e1ch ki\u1ec3m ch\u1ee9ng tr\u01b0\u1edbc khi ch\u1ea5p thu\u1eadn.'
}
