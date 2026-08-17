import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type {
  CompanionState,
  PracticeScenario,
  PlanningPracticeActionRequest,
  PracticeState,
  PracticeWorkspaceView,
  PracticeGuideUpdateRequest,
  PracticeGuideView,
  TeacherContext,
  TeacherMessage,
  TeacherRuntimeView,
  TeacherSendRequest,
  TeacherSendResult
} from '../../../../shared/contracts'
import teacherImage from '../assets/teacher-triet.png'
import { PracticeProgress } from './PracticeProgress'
import { PracticeGuide } from './PracticeGuide'
import { practiceGuideAnchor } from './practice-guide-anchors'

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
      content: 'Đây là phản hồi luyện tập. Khi bạn dùng Course Companion, câu hỏi và phản hồi sẽ được lưu trên máy để bạn có thể quay lại.',
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
  missionId: 'm2-planning-package',
  status: 'idle'
}

const practiceLabels: Record<PracticeState['status'], { eyebrow: string; title: string }> = {
  idle: { eyebrow: 'CHƯA BẮT ĐẦU', title: 'Chờ một lượt thực hành' },
  active: { eyebrow: 'ĐANG THỰC HIỆN', title: 'Bài luyện tập đang diễn ra' },
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
  const [practiceGuide, setPracticeGuide] = useState<PracticeGuideView | null>(null)
  const [practiceBusy, setPracticeBusy] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [returnBusy, setReturnBusy] = useState(false)
  const [planningActionBusy, setPlanningActionBusy] = useState(false)
  const [testFixturesEnabled, setTestFixturesEnabled] = useState(false)
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
        const runtime = await window.courseCompanion?.getRuntimeInfo()
        setMessages(state.conversation.messages)
        setRecovered(state.conversation.recovered)
        setTeacherRuntime(state.teacher)
        setWorkspace(loadedWorkspace ?? null)
        setTestFixturesEnabled(runtime?.testFixturesEnabled === true)
        if (loadedWorkspace) {
          setActiveTab(embedded ? loadedWorkspace.presentation.fullPanel : loadedWorkspace.presentation.compactPanel)
        }
        if (loadedWorkspace && embedded && window.courseCompanion) {
          const initialTab = loadedWorkspace.presentation.fullPanel
          setPracticeGuide(await window.courseCompanion.loadPracticeGuide({
            surface: 'full',
            activeTab: initialTab
          }))
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
    const frame = requestAnimationFrame(() => composerRef.current?.focus({ preventScroll: true }))
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



  const updatePracticeGuide = async (request: PracticeGuideUpdateRequest) => {
    if (!window.courseCompanion || !embedded) return
    try {
      setPracticeGuide(await window.courseCompanion.updatePracticeGuide(request, {
        surface: 'full',
        activeTab
      }))
    } catch {
      // Guidance is optional and must never interrupt Practice.
    }
  }
  const selectTab = async (next: 'teacher' | 'progress') => {
    setActiveTab(next)
    if (!window.courseCompanion) return
    try {
      setWorkspace(await window.courseCompanion.selectPracticePanel({
        surface: embedded ? 'full' : 'compact',
        panel: next
      }))
      if (embedded && practiceGuide) {
        const type = next === 'teacher' ? 'teacher-tab-selected' : 'progress-tab-selected'
        const expectedStageId = next === 'teacher' ? 'ask-teacher' : 'inspect-progress'
        setPracticeGuide(await window.courseCompanion.updatePracticeGuide(
          { type, expectedStageId },
          { surface: 'full', activeTab: next }
        ))
      }
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
      setError('Không thể lưu tình huống luyện tập. Hãy mở bài học trước khi thử lại.')
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
      if (embedded) {
        const request = practiceGuide?.currentStageId === 'request-review'
          ? { type: 'review-requested' as const, expectedStageId: 'request-review' }
          : { type: 'start' as const }
        setPracticeGuide(await window.courseCompanion.updatePracticeGuide(
          request, { surface: 'full', activeTab: 'progress' }
        ))
      }
    } catch {
      setError('Kh\u00f4ng th\u1ec3 duy\u1ec7t ti\u1ebfn \u0111\u1ed9 Practice. H\u00e3y th\u1eed l\u1ea1i.')
    } finally {
      setReviewBusy(false)
    }
  }

  const refreshPracticeWorkspace = async () => {
    if (planningActionBusy || !window.courseCompanion) return
    setPlanningActionBusy(true)
    setError('')
    try {
      setWorkspace(await window.courseCompanion.loadPracticeWorkspace())
    } catch {
      setError('Không thể làm mới bằng chứng Practice. Hãy thử lại.')
    } finally {
      setPlanningActionBusy(false)
    }
  }

  const recordPlanningAction = async (action: PlanningPracticeActionRequest['action']) => {
    const active = workspace?.activePractice
    if (!active || planningActionBusy || !window.courseCompanion) return
    setPlanningActionBusy(true)
    setError('')
    try {
      setWorkspace(await window.courseCompanion.recordPlanningAction({
        practiceId: active.practiceId,
        practiceVersion: active.practiceVersion,
        runId: active.runId,
        generation: active.generation,
        action
      }))
    } catch {
      setError('Bằng chứng đã thay đổi hoặc chưa đủ cho xác nhận này. Hãy làm mới tiến độ rồi thử lại.')
    } finally {
      setPlanningActionBusy(false)
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

  const minimizeToBubble = async () => {
    if (practiceGuide?.currentStageId && practiceGuide.presentation) {
      await updatePracticeGuide({ type: 'pause', expectedStageId: practiceGuide.currentStageId })
    }
    onMinimizeToBubble?.()
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
        setError('Không thể kết nối Triết. Tin nhắn đã được lưu để bạn thử lại.')
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
      label: 'TEACHER · ĐANG KẾT NỐI',
      strong: 'ĐANG KẾT NỐI TRIẾT',
      detail: 'Đang khôi phục ngữ cảnh Practice.'
    },
    ready: {
      label: 'TEACHER · SẴN SÀNG',
      strong: 'TRIẾT ĐÃ SẴN SÀNG',
      detail: 'Đã kết nối. Triết sẽ nhận ngữ cảnh Practice khi bạn gửi tin nhắn.'
    },
    live: {
      label: 'TEACHER · LIVE',
      strong: 'TRIẾT ĐANG TRỰC TUYẾN',
      detail: 'Triết đang dùng ngữ cảnh Practice và hoạt động Codex hiện tại.'
    },
    stale: {
      label: 'TEACHER \u00b7 NG\u1eee C\u1ea2NH C\u0168',
      strong: 'NG\u1eee C\u1ea2NH CODEX \u0110\u00c3 C\u0168',
      detail: 'Triết vẫn có thể trả lời, nhưng hoạt động Codex mới nhất chưa được xác nhận.'
    },
    offline: {
      label: 'TEACHER \u00b7 NGO\u1ea0I TUY\u1ebeN',
      strong: 'KHÔNG THỂ KẾT NỐI TRIẾT',
      detail: 'Tin nh\u1eafn s\u1ebd \u0111\u01b0\u1ee3c l\u01b0u c\u1ee5c b\u1ed9 \u0111\u1ec3 b\u1ea1n th\u1eed l\u1ea1i.'
    }
  }
  const currentTeacherStatus = teacherStatus[teacherRuntime.connection]
  const contextFreshnessNote = teacherRuntime.contextFreshness === 'stale'
    ? 'Ngữ cảnh Codex đã cũ.'
    : teacherRuntime.contextFreshness === 'disconnected'
      ? 'Mất kết nối với ngữ cảnh Codex; Triết vẫn có thể trả lời từ dữ liệu đã lưu.'
      : ''
  const teacherStatusDetail = teacherRuntime.error ?? [
    currentTeacherStatus.detail,
    contextFreshnessNote,
    teacherRuntime.memory === 'pending' ? 'Trí nhớ lượt trước đang chờ tinh chỉnh.' : ''
  ].filter(Boolean).join(' · ')

  return (
    <section className={`pixel-teacher-panel${embedded ? ' is-embedded' : ''}`} aria-label="Triết, giáo viên đồng hành">
      <header>
        <div className="pixel-teacher-identity">
          <span className="pixel-teacher-portrait-frame" aria-hidden="true">
            <img src={teacherImage} alt="" />
          </span>
          <div>
            <small>{currentTeacherStatus.label}</small>
            <strong>Triết</strong>
          </div>
        </div>
        <div className="pixel-panel-controls">
          {workspace?.activePractice && workspace.review?.canReview ? (
            <button
              {...practiceGuideAnchor('review-progress')}
              className={'pixel-panel-control pixel-panel-control--review' + (reviewBusy ? ' is-busy' : '')}
              type="button"
              aria-label="Yêu cầu Triết duyệt tiến độ"
              title="Yêu cầu Triết duyệt tiến độ"
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
              {...practiceGuideAnchor('return-to-course')}
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
              aria-label="Mở Triết toàn màn hình"
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
              aria-label="Thu nhỏ Triết thành bong bóng"
              title="Thu nhỏ thành bong bóng"
              onClick={() => void minimizeToBubble()}
            >
              <span aria-hidden="true">—</span>
            </button>
          ) : null}
          <button
            className="pixel-panel-control"
            type="button"
            aria-label={embedded ? 'Đóng Triết' : 'Thu nhỏ Triết'}
            title={embedded ? 'Đóng Triết' : 'Thu nhỏ thành bong bóng'}
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
        <span>BƯỚC HỌC HIỆN TẠI</span>
        <strong>
          {workspace?.activePractice
            ? workspace.title
            : context ? 'Bước hiện tại trong khóa học' : 'Chưa bắt đầu bài học'}
        </strong>
      </div>

      <div className="pixel-companion-tabs" role="tablist" aria-label="Chế độ của Triết">
        <button {...practiceGuideAnchor('teacher-tab')} aria-selected={activeTab === 'teacher'} className={activeTab === 'teacher' ? 'is-active' : ''} onClick={() => void selectTab('teacher')} role="tab" type="button">
          HỎI TRIẾT
        </button>
        <button {...practiceGuideAnchor('progress-tab')} aria-selected={activeTab === 'progress'} className={activeTab === 'progress' ? 'is-active' : ''} onClick={() => void selectTab('progress')} role="tab" type="button">
          TIẾN ĐỘ
        </button>
      </div>

      {activeTab === 'teacher' ? (
        <>
          {workspace?.planning?.invalidations[0] ? (
            <aside className="pixel-teacher-invalidation" role="status" aria-live="polite">
              <small>TRIẾT · BẰNG CHỨNG VỪA THAY ĐỔI</small>
              <strong>{workspace.planning.invalidations[0].changedInput}</strong>
              <p>{workspace.planning.invalidations[0].reason}</p>
              <span>
                Bước cần xem lại: {workspace.planning.invalidations[0].affectedStepIds.map((stepId) =>
                  workspace.checklist.find((step) => step.id === stepId)?.title ?? 'Bước cần xem lại'
                ).join(', ')}
              </span>
              <b>Tiếp theo: {workspace.planning.invalidations[0].nextAction}</b>
            </aside>
          ) : null}
          <div className="pixel-chat-log" role="log" aria-live="polite" aria-label="Lịch sử trò chuyện với Triết">
            {messages.length === 0 ? (
              <div className="pixel-chat-empty">
                <strong>Chưa có tin nhắn</strong>
                <span>Hỏi Triết điều bạn cần làm rõ ở bước học này.</span>
              </div>
            ) : (
              messages.map((message) => (
                <article className={`pixel-chat-message is-${message.role}`} key={message.id}>
                  <header>
                    <strong>{message.role === 'teacher' ? 'Triết' : 'Bạn'}</strong>
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
              autoComplete="off"
              disabled={busy}
              ref={composerRef}
              aria-label="Nhắn cho Triết"
              maxLength={2000}
              name="teacherMessage"
              placeholder="Hỏi Triết về bước hiện tại…"
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
              actionBusy={planningActionBusy}
              onPlanningAction={(action) => void recordPlanningAction(action)}
              onRefresh={() => void refreshPracticeWorkspace()}
              onReturn={() => void returnToCourse()}
            />
          ) : (
            <div className="pixel-practice-status"><strong>Đang đọc tiến độ Practice…</strong></div>
          )}

          {testFixturesEnabled ? <details className="pixel-practice-fixture-evidence">
            <summary>DEV · BẰNG CHỨNG MÔ PHỎNG</summary>
            <div className={`pixel-practice-status is-${practice.status}`}>
              <span>{practiceLabels[practice.status].eyebrow} · MÔ PHỎNG</span>
              <strong>{practiceLabels[practice.status].title}</strong>
            </div>
            <p>{practice.latestEvent?.summary ?? 'Mở điều khiển dành cho nhà phát triển để phát một sự kiện cục bộ.'}</p>
            {practice.latestEvent ? <small>FIXTURE · {formatTime(practice.latestEvent.timestamp)} · {practice.latestEvent.correlationId}</small> : null}

            {practice.latestEvent?.evidence ? (
              <div className="pixel-practice-evidence">
                <div><span>PRD</span><strong>{practice.latestEvent.evidence.prdArtifact}</strong></div>
                <div><span>IMPLEMENTATION PLAN</span><strong>{practice.latestEvent.evidence.implementationPlanArtifact}</strong></div>
                <div><span>ALIGNMENT</span><strong>{practice.latestEvent.evidence.alignment}</strong></div>
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
          </details> : null}
        </section>
      )}

      {error ? <div className="pixel-chat-error" role="alert">{error}</div> : null}
      {embedded
        && workspace?.activePractice?.practiceId === 'm1-codex-safe-setup'
        && practiceGuide
        && !practiceGuide.replay
        && (practiceGuide.status === 'skipped' || practiceGuide.status === 'completed') ? (
        <button className="practice-guide-replay" type="button" onClick={() => void updatePracticeGuide({ type: 'replay' })}>
          Xem lại hướng dẫn Practice
        </button>
      ) : null}
      <PracticeGuide view={practiceGuide} onUpdate={(request) => void updatePracticeGuide(request)} />

      {!embedded ? <footer>
        <button className="pixel-panel-quit" type="button" onClick={() => void window.courseCompanion?.quitApp()}>Thoát ứng dụng</button>
      </footer> : null}
    </section>
  )
}
