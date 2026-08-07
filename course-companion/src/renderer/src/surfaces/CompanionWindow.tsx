import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type {
  CompanionMode,
  CompanionState,
  PracticeScenario,
  PracticeState,
  TeacherContext,
  TeacherMessage,
  TeacherSendRequest,
  TeacherSendResult
} from '../../../../shared/contracts'
import teacherImage from '../../../../../prototypes/mvp-3-course-experience-companion/assets/teacher.png'

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

export function CompanionWindow() {
  const [mode, setMode] = useState<CompanionMode | null>(null)
  const [messages, setMessages] = useState<TeacherMessage[]>([])
  const [context, setContext] = useState<TeacherContext | undefined>()
  const [draft, setDraft] = useState('')
  const [busy, setBusy] = useState(false)
  const [recovered, setRecovered] = useState(false)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<'chat' | 'practice'>('chat')
  const [practice, setPractice] = useState<PracticeState>(emptyPractice)
  const [practiceBusy, setPracticeBusy] = useState(false)
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
          : { mode: 'compact', conversation: { messages: [], recovered: false } }
        setMode(state.mode)
        setMessages(state.conversation.messages)
        setRecovered(state.conversation.recovered)
        setPractice(
          window.courseCompanion
            ? await window.courseCompanion.loadPracticeState()
            : emptyPractice
        )
        await refreshContext()
      } catch {
        setMode('compact')
        setError('Không thể tải lịch sử trò chuyện.')
      }
    }

    void load()
  }, [refreshContext])

  useEffect(() => {
    if (mode === 'expanded' && activeTab === 'chat') composerRef.current?.focus()
  }, [activeTab, mode])

  useEffect(() => {
    messageEndRef.current?.scrollIntoView({ block: 'end' })
  }, [messages, mode])

  const changeMode = async (nextMode: CompanionMode) => {
    setError('')
    try {
      await window.courseCompanion?.setCompanionMode(nextMode)
      if (nextMode === 'expanded') await refreshContext()
      setMode(nextMode)
    } catch {
      setError('Không thể thay đổi kích thước Hương.')
    }
  }

  const restoreLearningWindow = async () => {
    await changeMode('compact')
    await window.courseCompanion?.showLearningWindow()
  }

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

  const sendMessage = async () => {
    const content = draft.trim()
    if (!content || busy) return

    setBusy(true)
    setError('')
    try {
      const request: TeacherSendRequest = { content, context }
      const result = window.courseCompanion
        ? await window.courseCompanion.sendTeacherMessage(request)
        : previewReply(request)
      setMessages((current) => [...current, result.learnerMessage, result.teacherMessage])
      setDraft('')
    } catch {
      setError('Tin nhắn chưa được lưu. Hãy thử gửi lại.')
    } finally {
      setBusy(false)
      composerRef.current?.focus()
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

  if (mode === null) {
    return <main className="pixel-companion-surface" aria-label="Đang tải Hương" />
  }

  if (mode === 'compact') {
    return (
      <main className="pixel-companion-surface pixel-companion-surface--compact">
        <button
          className="pixel-teacher-launcher"
          type="button"
          aria-label="Mở Hương, giáo viên đồng hành"
          onClick={() => void changeMode('expanded')}
        >
          <img src={teacherImage} alt="" />
          <span>HƯƠNG</span>
        </button>
      </main>
    )
  }

  return (
    <main className="pixel-companion-surface pixel-companion-surface--expanded">
      <section className="pixel-teacher-panel" aria-label="Hương, giáo viên đồng hành">
        <header>
          <div className="pixel-teacher-identity">
            <img src={teacherImage} alt="" />
            <div>
              <small>TEACHER · MÔ PHỎNG</small>
              <strong>Hương</strong>
            </div>
          </div>
          <button
            className="pixel-panel-minimize"
            type="button"
            aria-label="Thu nhỏ Hương"
            onClick={() => void changeMode('compact')}
          >
            —
          </button>
        </header>

        <div className="pixel-fixture-notice">
          <strong>CHƯA KẾT NỐI TEACHER LIVE</strong>
          <span>Phản hồi hiện tại dùng kịch bản cục bộ.</span>
        </div>

        <div className="pixel-chat-context">
          <span>CHECKPOINT HIỆN TẠI</span>
          <strong>{context?.checkpointId ?? 'Chưa bắt đầu bài học'}</strong>
        </div>

        <div className="pixel-companion-tabs" role="tablist" aria-label="Chế độ của Hương">
          <button
            aria-selected={activeTab === 'chat'}
            className={activeTab === 'chat' ? 'is-active' : ''}
            onClick={() => setActiveTab('chat')}
            role="tab"
            type="button"
          >
            HỎI HƯƠNG
          </button>
          <button
            aria-selected={activeTab === 'practice'}
            className={activeTab === 'practice' ? 'is-active' : ''}
            onClick={() => setActiveTab('practice')}
            role="tab"
            type="button"
          >
            THỰC HÀNH
          </button>
        </div>

        {activeTab === 'chat' ? (
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
                      <time dateTime={message.timestamp}>{formatTime(message.timestamp)}</time>
                    </header>
                    <p>{message.content}</p>
                  </article>
                ))
              )}
              <div ref={messageEndRef} />
            </div>

            {recovered ? <div className="pixel-chat-warning">Một dòng lịch sử hỏng đã được bỏ qua.</div> : null}

            <form className="pixel-chat-composer" onSubmit={submit}>
              <textarea
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
            <div className={`pixel-practice-status is-${practice.status}`}>
              <span>{practiceLabels[practice.status].eyebrow} · MÔ PHỎNG</span>
              <strong>{practiceLabels[practice.status].title}</strong>
              <p>{practice.latestEvent?.summary ?? 'Mở điều khiển dành cho nhà phát triển để phát một sự kiện cục bộ.'}</p>
              {practice.latestEvent ? (
                <small>
                  FIXTURE · {formatTime(practice.latestEvent.timestamp)} · {practice.latestEvent.correlationId}
                </small>
              ) : null}
            </div>

            {practice.latestEvent?.evidence ? (
              <div className="pixel-practice-evidence">
                <div><span>VIEWPORT</span><strong>{practice.latestEvent.evidence.viewport}</strong></div>
                <div><span>PHẠM VI</span><strong>{practice.latestEvent.evidence.changedScope}</strong></div>
                <div><span>TRÀN NGANG</span><strong>{practice.latestEvent.evidence.horizontalOverflow}</strong></div>
                <small>
                  {practice.latestEvent.evidence.freshness === 'current' ? 'BẰNG CHỨNG MỚI' : 'BẰNG CHỨNG ĐÃ CŨ'} · MÔ PHỎNG
                </small>
              </div>
            ) : null}

            <details className="pixel-practice-dev">
              <summary>DEV · TÌNH HUỐNG MÔ PHỎNG</summary>
              <p>Các nút này tạo sự kiện cục bộ; không quan sát Codex thật.</p>
              <div>
                {scenarioControls.map((control) => (
                  <button
                    disabled={practiceBusy}
                    key={control.scenario}
                    onClick={() => void emitPracticeFixture(control.scenario)}
                    type="button"
                  >
                    {control.label}
                  </button>
                ))}
              </div>
            </details>
          </section>
        )}

        {error ? <div className="pixel-chat-error" role="alert">{error}</div> : null}

        <footer>
          <button className="pixel-panel-quit" type="button" onClick={() => void window.courseCompanion?.quitApp()}>
            Thoát ứng dụng
          </button>
          <button className="pixel-panel-primary" type="button" onClick={() => void restoreLearningWindow()}>
            Mở lại bài học
          </button>
        </footer>
      </section>
    </main>
  )
}
