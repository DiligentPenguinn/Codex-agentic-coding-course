import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type {
  CompanionState,
  PracticeScenario,
  PracticeState,
  PracticeWorkspaceView,
  TeacherContext,
  TeacherMessage,
  TeacherRuntimeView,
  TeacherSendRequest,
  TeacherSendResult
} from '../../../../shared/contracts'
import teacherImage from '../../../../../prototypes/mvp-3-course-experience-companion/assets/teacher.png'
import { PracticeProgress } from './PracticeProgress'

type TeacherWorkspaceProps = {
  embedded?: boolean
  fullScreen?: boolean
  onClose: () => void
  onExpand?: () => void
  onMinimizeToBubble?: () => void
}

function previewReply(request: TeacherSendRequest): TeacherSendResult {
  const timestamp = new Date().toISOString()
  const suffix = `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return {
    learnerMessage: {
      id: `preview-learner-${suffix}`,
      role: 'learner',
      source: 'learner',
      content: request.content.trim(),
      timestamp,
      checkpointId: request.context?.checkpointId
    },
    teacherMessage: {
      id: `preview-teacher-${suffix}`,
      role: 'teacher',
      source: 'fixture',
      content: 'Đây là bản xem trước. Trong ứng dụng Electron, câu hỏi và phản hồi mô phỏng sẽ được lưu cục bộ.',
      timestamp,
      checkpointId: request.context?.checkpointId
    }
  }
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const emptyPractice: PracticeState = {
  missionId: 'm1-verifiable-brief',
  status: 'idle'
}

const practiceLabels: Record<PracticeState['status'], { eyebrow: string; title: string }> = {
  idle: { eyebrow: 'CHƯA BẮT ĐẦU', title: 'Chờ một lượt thực hành' },
  active: { eyebrow: 'ĐANG THỰC HIỆN', title: 'Codex mô phỏng đang làm việc' },
  approval_required: { eyebrow: 'CẦN PHÊ DUYỆT', title: 'Kế hoạch đang chờ bạn' },
  completed: { eyebrow: 'ĐÃ HOÀN THÀNH', title: 'Có bằng chứng mới để duyệt' },
  stale: { eyebrow: 'BẰNG CHỨNG CŨ', title: 'Chưa đủ để kết luận' },
  offline: { eyebrow: 'MẤT KẾT NỐI', title: 'Không có sự kiện mới' },
  error: { eyebrow: 'LƯỢT CHẠY LỖI', title: 'Chưa tạo được bằng chứng' }
}

const scenarioControls: Array<{ scenario: PracticeScenario; label: string }> = [
  { scenario: 'started', label: 'Bắt đầu' },
  { scenario: 'approval_required', label: 'Cần phê duyệt' },
  { scenario: 'success', label: 'Hoàn thành' },
  { scenario: 'stale', label: 'Bằng chứng cũ' },
  { scenario: 'offline', label: 'Mất kết nối' },
  { scenario: 'error', label: 'Lỗi' }
]

const TEACHER_DRAFT_KEY = 'course-companion:teacher-draft'

function loadTeacherDraft(): string {
  try {
    return window.localStorage.getItem(TEACHER_DRAFT_KEY) ?? ''
  } catch {
    return ''
  }
}

export function TeacherWorkspace({
  embedded = false,
  fullScreen = false,
  onClose,
  onExpand,
  onMinimizeToBubble
}: TeacherWorkspaceProps) {
  const [messages, setMessages] = useState<TeacherMessage[]>([])
  const [teacherRuntime, setTeacherRuntime] = useState<TeacherRuntimeView>({
    connection: window.courseCompanion ? 'connecting' : 'simulated',
    memory: 'ready',
    contextFreshness: 'unavailable'
  })
  const [context, setContext] = useState<TeacherContext | undefined>()
  const [draft, setDraft] = useState(loadTeacherDraft)
  const [busy, setBusy] = useState(false)
  const [recovered, setRecovered] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'teacher' | 'progress'>('teacher')
  const [practice, setPractice] = useState<PracticeState>(emptyPractice)
  const [workspace, setWorkspace] = useState<PracticeWorkspaceView | null>(null)
  const [practiceBusy, setPracticeBusy] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [returnBusy, setReturnBusy] = useState(false)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const practiceRef = useRef<HTMLElement>(null)

  const refreshContext = useCallback(async () => {
    const progressResult = await window.courseCompanion?.loadProgress()
    if (progressResult?.status === 'returning' || progressResult?.status === 'recovered') {
      setContext({
        lessonId: progressResult.progress.currentLessonId,
        checkpointId: progressResult.progress.checkpointId,
        sceneId: progressResult.progress.sceneId
      })
    } else {
      setContext(undefined)
    }
  }, [])

  useEffect(() => {
    const load = async () => {
      try {
        const state: CompanionState = window.courseCompanion
          ? await window.courseCompanion.loadCompanionState()
          : { mode: 'compact', conversation: { messages: [], recovered: false }, teacher: { connection: 'simulated', memory: 'ready' } }
        const loadedWorkspace = await window.courseCompanion?.loadPracticeWorkspace()
        setMessages(state.conversation.messages)
        setRecovered(state.conversation.recovered)
        setTeacherRuntime(state.teacher)
        setWorkspace(loadedWorkspace ?? null)
        if (loadedWorkspace) {
          setActiveTab(embedded ? loadedWorkspace.presentation.fullPanel : loadedWorkspace.presentation.compactPanel)
        }
        setPractice(
          window.courseCompanion
            ? await window.courseCompanion.loadPracticeState()
            : emptyPractice
        )
        await refreshContext()
      } catch {
        setError('Không thể tải lịch sử trò chuyện.')
      }
    }

    void load()
  }, [embedded, refreshContext])

  useEffect(() => {
    if (activeTab !== 'teacher' || busy) return
    const frame = requestAnimationFrame(() => composerRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [activeTab, busy])

  useEffect(() => {
    try {
      window.localStorage.setItem(TEACHER_DRAFT_KEY, draft)
    } catch {
      // Draft persistence is best-effort; the in-memory draft remains available.
    }
  }, [draft])
  useEffect(() => {
    const syncDraft = (event: StorageEvent) => {
      if (event.key === TEACHER_DRAFT_KEY) setDraft(event.newValue ?? '')
    }
    window.addEventListener('storage', syncDraft)
    return () => window.removeEventListener('storage', syncDraft)
  }, [])


  const selectTab = async (next: 'teacher' | 'progress') => {
    setActiveTab(next)
    if (!window.courseCompanion) return
    try {
      setWorkspace(await window.courseCompanion.selectPracticePanel({
        surface: embedded ? 'full' : 'compact',
        panel: next
      }))
    } catch {
      setError('Không thể lưu tab Practice hiện tại.')
    }
  }
  useEffect(() => {
    if (activeTab !== 'teacher') return

    const frame = requestAnimationFrame(() => {
      const chatLog = messageEndRef.current?.parentElement
      if (chatLog) chatLog.scrollTop = chatLog.scrollHeight
    })

    return () => cancelAnimationFrame(frame)
  }, [activeTab, messages])

  const emitPracticeFixture = async (scenario: PracticeScenario) => {
    if (practiceBusy) return
    setPracticeBusy(true)
    setError('')
    try {
      const next = window.courseCompanion
        ? await window.courseCompanion.emitPracticeFixture({ scenario })
        : emptyPractice
      setPractice(next)
      requestAnimationFrame(() => practiceRef.current?.scrollTo({ top: 0 }))
    } catch {
      setError('Không thể lưu tình huống mô phỏng. Hãy mở bài học trước khi thử lại.')
    } finally {
      setPracticeBusy(false)
    }
  }

  const reviewProgress = async () => {
    if (reviewBusy || !window.courseCompanion) return
    setReviewBusy(true)
    setError('')
    try {
      const reviewed = await window.courseCompanion.reviewPractice()
      setMessages((current) => current.some((message) => message.id === reviewed.teacherMessage.id)
        ? current
        : [...current, reviewed.teacherMessage])
      setWorkspace(reviewed.workspace)
      setActiveTab('progress')
      try {
        const selected = await window.courseCompanion.selectPracticePanel({
          surface: embedded ? 'full' : 'compact',
          panel: 'progress'
        })
        setWorkspace(selected)
      } catch {
        // The review result is authoritative even if persisting the selected tab fails.
      }
    } catch {
      setError('Kh\u00f4ng th\u1ec3 duy\u1ec7t ti\u1ebfn \u0111\u1ed9 Practice. H\u00e3y th\u1eed l\u1ea1i.')
    } finally {
      setReviewBusy(false)
    }
  }

  const returnToCourse = async () => {
    if (returnBusy || !window.courseCompanion) return
    setReturnBusy(true)
    setError('')
    try {
      await window.courseCompanion.returnPassedPractice()
    } catch {
      setError('Kh\u00f4ng th\u1ec3 quay l\u1ea1i kh\u00f3a h\u1ecdc. K\u1ebft qu\u1ea3 \u0111\u1ea1t v\u1eabn \u0111\u01b0\u1ee3c l\u01b0u; h\u00e3y th\u1eed l\u1ea1i.')
      setReturnBusy(false)
    }
  }
  const sendMessage = async (contentOverride?: string) => {
    const content = (contentOverride ?? draft).trim()
    if (!content || busy) return

    setBusy(true)
    setError('')
    try {
      const request: TeacherSendRequest = { content, context }
      if (window.courseCompanion) {
        await window.courseCompanion.sendTeacherMessage(request)
        const state = await window.courseCompanion.loadCompanionState()
        setMessages(state.conversation.messages)
        setRecovered(state.conversation.recovered)
        setTeacherRuntime(state.teacher)
      } else {
        const result = previewReply(request)
        setMessages((current) => [...current, result.learnerMessage, result.teacherMessage])
      }
      setDraft((current) => current.trim() === content ? '' : current)
    } catch {
      let runtimeError = ''
      if (window.courseCompanion) {
        try {
          const state = await window.courseCompanion.loadCompanionState()
          setMessages(state.conversation.messages)
          setRecovered(state.conversation.recovered)
          setTeacherRuntime(state.teacher)
          runtimeError = state.teacher.error ?? ''
        } catch {
          // Keep the existing view if the local state cannot be reloaded.
        }
      }
      if (!runtimeError) {
        setError('Kh\u00f4ng th\u1ec3 k\u1ebft n\u1ed1i H\u01b0\u01a1ng. Tin nh\u1eafn \u0111\u00e3 \u0111\u01b0\u1ee3c l\u01b0u \u0111\u1ec3 b\u1ea1n th\u1eed l\u1ea1i.')
      }
    } finally {
      setBusy(false)
    }
  }

  const submit = (event: FormEvent) => {
    event.preventDefault()
    void sendMessage()
  }

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault()
      void sendMessage()
    }
  }

  const teacherStatus: Record<TeacherRuntimeView['connection'], { label: string; strong: string; detail: string }> = {
    simulated: {
      label: 'TEACHER \u00b7 M\u00d4 PH\u1eceNG',
      strong: 'TEACHER M\u00d4 PH\u1eceNG',
      detail: 'Ph\u1ea3n h\u1ed3i hi\u1ec7n t\u1ea1i d\u00f9ng k\u1ecbch b\u1ea3n c\u1ee5c b\u1ed9.'
    },
    connecting: {
      label: 'TEACHER \u00b7 \u0110ANG K\u1ebeT N\u1ed0I',
      strong: '\u0110ANG K\u1ebeT N\u1ed0I H\u01af\u01a0NG',
      detail: '\u0110ang kh\u00f4i ph\u1ee5c ng\u1eef c\u1ea3nh Practice.'
    },
    ready: {
      label: 'TEACHER · SẴN SÀNG',
      strong: 'HƯƠNG ĐÃ SẴN SÀNG',
      detail: 'Đã kết nối. Hương sẽ nhận ngữ cảnh Practice khi bạn gửi tin nhắn.'
    },
    live: {
      label: 'TEACHER \u00b7 LIVE',
      strong: 'H\u01af\u01a0NG \u0110ANG TR\u1ef0C TUY\u1ebeN',
      detail: 'H\u01b0\u01a1ng \u0111ang d\u00f9ng ng\u1eef c\u1ea3nh Practice v\u00e0 ho\u1ea1t \u0111\u1ed9ng Executor hi\u1ec7n t\u1ea1i.'
    },
    stale: {
      label: 'TEACHER \u00b7 NG\u1eee C\u1ea2NH C\u0168',
      strong: 'NG\u1eee C\u1ea2NH EXECUTOR \u0110\u00c3 C\u0168',
      detail: 'H\u01b0\u01a1ng v\u1eabn c\u00f3 th\u1ec3 tr\u1ea3 l\u1eddi, nh\u01b0ng s\u1ef1 ki\u1ec7n Executor m\u1edbi nh\u1ea5t ch\u01b0a \u0111\u01b0\u1ee3c x\u00e1c nh\u1eadn.'
    },
    offline: {
      label: 'TEACHER \u00b7 NGO\u1ea0I TUY\u1ebeN',
      strong: 'KH\u00d4NG TH\u1ec2 K\u1ebeT N\u1ed0I H\u01af\u01a0NG',
      detail: 'Tin nh\u1eafn s\u1ebd \u0111\u01b0\u1ee3c l\u01b0u c\u1ee5c b\u1ed9 \u0111\u1ec3 b\u1ea1n th\u1eed l\u1ea1i.'
    }
  }
  const currentTeacherStatus = teacherStatus[teacherRuntime.connection]
  const contextFreshnessNote = teacherRuntime.contextFreshness === 'stale'
    ? 'Ngữ cảnh Executor đã cũ.'
    : teacherRuntime.contextFreshness === 'disconnected'
      ? 'Mất kết nối với ngữ cảnh Executor; Hương vẫn có thể trả lời từ dữ liệu đã lưu.'
      : ''
  const teacherStatusDetail = teacherRuntime.error ?? [
    currentTeacherStatus.detail,
    contextFreshnessNote,
    teacherRuntime.memory === 'pending' ? 'Trí nhớ lượt trước đang chờ tinh chỉnh.' : ''
  ].filter(Boolean).join(' · ')

  return (
    <section className={`pixel-teacher-panel${embedded ? ' is-embedded' : ''}`} aria-label="Hương, giáo viên đồng hành">
      <header>
        <div className="pixel-teacher-identity">
          <img src={teacherImage} alt="" />
          <div>
            <small>{currentTeacherStatus.label}</small>
            <strong>Hương</strong>
          </div>
        </div>
        <div className="pixel-panel-controls">
          {workspace?.activePractice && workspace.review?.canReview ? (
            <button
              className={'pixel-panel-control pixel-panel-control--review' + (reviewBusy ? ' is-busy' : '')}
              type="button"
              aria-label="Yêu cầu Hương duyệt tiến độ"
              title="Yêu cầu Hương duyệt tiến độ"
              aria-busy={reviewBusy}
              disabled={reviewBusy}
              onClick={() => void reviewProgress()}
            >
              <span className="pixel-review-control-visual" aria-hidden="true">
                <svg className="pixel-review-control-icon" viewBox="0 0 24 24">
                  <path d="M9 5h6M9 3h6v4H9zM7 5H5v16h14V5h-2M8 13l2.5 2.5L16 10" />
                </svg>
                {reviewBusy ? <span className="pixel-review-spinner" /> : null}
              </span>
            </button>
          ) : null}
          {workspace?.review?.canReturn ? (
            <button
              className="pixel-panel-control pixel-panel-control--return"
              type="button"
              aria-label="Quay lại khóa học nhanh"
              title="Quay lại khóa học nhanh"
              aria-busy={returnBusy}
              disabled={returnBusy}
              onClick={() => void returnToCourse()}
            >
              {returnBusy ? <span className="pixel-control-spinner" aria-hidden="true" /> : (
                <svg aria-hidden="true" viewBox="0 0 24 24">
                  <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21.5zM17 10h4m-2-2 2 2-2 2" />
                </svg>
              )}
            </button>
          ) : null}
          {!embedded && onExpand ? (
            <button
              className="pixel-panel-control"
              type="button"
              aria-label="Mở Hương toàn màn hình"
              title="Mở toàn màn hình"
              onClick={onExpand}
            >
              <span aria-hidden="true">⛶</span>
            </button>
          ) : null}
          {fullScreen && onMinimizeToBubble ? (
            <button
              className="pixel-panel-control"
              type="button"
              aria-label="Thu nhỏ Hương thành bong bóng"
              title="Thu nhỏ thành bong bóng"
              onClick={onMinimizeToBubble}
            >
              <span aria-hidden="true">—</span>
            </button>
          ) : null}
          <button
            className="pixel-panel-control"
            type="button"
            aria-label={embedded ? 'Đóng Hương' : 'Thu nhỏ Hương'}
            title={embedded ? 'Đóng Hương' : 'Thu nhỏ thành bong bóng'}
            onClick={onClose}
          >
            {embedded ? '×' : '—'}
          </button>
        </div>
      </header>

      <div className={`pixel-fixture-notice is-${teacherRuntime.connection}`} role={teacherRuntime.error ? 'alert' : 'status'} aria-live="polite">
        <strong>{currentTeacherStatus.strong}</strong>
        <span>{teacherStatusDetail}</span>
      </div>

      <div className="pixel-chat-context">
        <span>CHECKPOINT HIỆN TẠI</span>
        <strong>{context?.checkpointId ?? 'Chưa bắt đầu bài học'}</strong>
      </div>

      <div className="pixel-companion-tabs" role="tablist" aria-label="Chế độ của Hương">
        <button aria-selected={activeTab === 'teacher'} className={activeTab === 'teacher' ? 'is-active' : ''} onClick={() => void selectTab('teacher')} role="tab" type="button">
          TEACHER
        </button>
        <button aria-selected={activeTab === 'progress'} className={activeTab === 'progress' ? 'is-active' : ''} onClick={() => void selectTab('progress')} role="tab" type="button">
          TIẾN ĐỘ
        </button>
      </div>

      {activeTab === 'teacher' ? (
        <>
          <div className="pixel-chat-log" role="log" aria-live="polite" aria-label="Lịch sử trò chuyện với Hương">
            {messages.length === 0 ? (
              <div className="pixel-chat-empty">
                <strong>Chưa có tin nhắn</strong>
                <span>Hỏi Hương điều bạn cần kiểm tra ở checkpoint này.</span>
              </div>
            ) : (
              messages.map((message) => (
                <article className={`pixel-chat-message is-${message.role}`} key={message.id}>
                  <header>
                    <strong>{message.role === 'teacher' ? 'Hương' : 'Bạn'}</strong>
                    {message.source === 'fixture' ? <span>MÔ PHỎNG</span> : null}
                    {message.source === 'live' ? <span>LIVE</span> : null}
                    {message.deliveryStatus === 'failed' ? <span>CHƯA GỬI</span> : null}
                    <time dateTime={message.timestamp}>{formatTime(message.timestamp)}</time>
                  </header>
                  {message.deliveryStatus === 'failed' ? (
                    <button className="pixel-chat-retry" disabled={busy} onClick={() => void sendMessage(message.content)} type="button">
                      Thử lại
                    </button>
                  ) : null}
                  <p>{message.content}</p>
                </article>
              ))
            )}
            <div ref={messageEndRef} />
          </div>

          {recovered ? <div className="pixel-chat-warning">Một dòng lịch sử hỏng đã được bỏ qua.</div> : null}

          <form className="pixel-chat-composer" onSubmit={submit}>
            <textarea
              disabled={busy}
              ref={composerRef}
              aria-label="Nhắn cho Hương"
              maxLength={2000}
              placeholder="Hỏi Hương về bước hiện tại…"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleComposerKeyDown}
            />
            <div>
              <small>Enter để gửi · Shift+Enter xuống dòng</small>
              <button type="submit" disabled={busy || draft.trim().length === 0}>
                {busy ? 'ĐANG GỬI…' : 'GỬI'}
              </button>
            </div>
          </form>
        </>
      ) : (
        <section className="pixel-practice" aria-live="polite" ref={practiceRef}>
          {workspace ? (
            <PracticeProgress
              workspace={workspace}
              compact={!embedded}
              returnBusy={returnBusy}
              onReturn={() => void returnToCourse()}
            />
          ) : (
            <div className="pixel-practice-status"><strong>Đang đọc tiến độ Practice…</strong></div>
          )}

          <details className="pixel-practice-fixture-evidence">
            <summary>DEV · BẰNG CHỨNG MÔ PHỎNG</summary>
            <div className={`pixel-practice-status is-${practice.status}`}>
              <span>{practiceLabels[practice.status].eyebrow} · MÔ PHỎNG</span>
              <strong>{practiceLabels[practice.status].title}</strong>
            </div>
            <p>{practice.latestEvent?.summary ?? 'Mở điều khiển dành cho nhà phát triển để phát một sự kiện cục bộ.'}</p>
            {practice.latestEvent ? <small>FIXTURE · {formatTime(practice.latestEvent.timestamp)} · {practice.latestEvent.correlationId}</small> : null}

            {practice.latestEvent?.evidence ? (
              <div className="pixel-practice-evidence">
                <div><span>VIEWPORT</span><strong>{practice.latestEvent.evidence.viewport}</strong></div>
                <div><span>PHẠM VI</span><strong>{practice.latestEvent.evidence.changedScope}</strong></div>
                <div><span>TRÀN NGANG</span><strong>{practice.latestEvent.evidence.horizontalOverflow}</strong></div>
                <small>{practice.latestEvent.evidence.freshness === 'current' ? 'BẰNG CHỨNG MỚI' : 'BẰNG CHỨNG ĐÃ CŨ'} · MÔ PHỎNG</small>
              </div>
            ) : null}

            <p>Các nút dưới đây tạo sự kiện cục bộ; không quan sát Codex thật.</p>
            <div className="pixel-practice-dev-controls">
              {scenarioControls.map((control) => (
                <button disabled={practiceBusy} key={control.scenario} onClick={() => void emitPracticeFixture(control.scenario)} type="button">
                  {control.label}
                </button>
              ))}
            </div>
          </details>
        </section>
      )}

      {error ? <div className="pixel-chat-error" role="alert">{error}</div> : null}

      {!embedded ? <footer>
        <button className="pixel-panel-quit" type="button" onClick={() => void window.courseCompanion?.quitApp()}>Thoát ứng dụng</button>
      </footer> : null}
    </section>
  )
}
