import { useCallback, useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import type {
  CompanionState,
  PracticeScenario,
  PracticeHint,
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
import { PracticeReturnAction } from './PracticeReturnAction'

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
  const [workspaceLoaded, setWorkspaceLoaded] = useState(false)
  const [workspaceUnavailable, setWorkspaceUnavailable] = useState(false)
  const [practiceGuide, setPracticeGuide] = useState<PracticeGuideView | null>(null)
  const [practiceBusy, setPracticeBusy] = useState(false)
  const [reviewBusy, setReviewBusy] = useState(false)
  const [hintBusy, setHintBusy] = useState(false)
  const [hint, setHint] = useState<PracticeHint | null>(null)
  const [hintError, setHintError] = useState('')
  const [returnBusy, setReturnBusy] = useState(false)
  const [planningActionBusy, setPlanningActionBusy] = useState(false)
  const [testFixturesEnabled, setTestFixturesEnabled] = useState(false)
  const composerRef = useRef<HTMLTextAreaElement>(null)
  const messageEndRef = useRef<HTMLDivElement>(null)
  const practiceRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (hint && practiceRef.current) practiceRef.current.scrollTop = 0
  }, [hint])

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
        setWorkspaceUnavailable(false)
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
        setWorkspaceLoaded(true)
      } catch {
        setWorkspaceUnavailable(true)
        setWorkspaceLoaded(true)
        setError('Không thể xác minh trạng thái Practice. Triết tạm khóa tương tác để tránh dùng sai chế độ.')
      }
    }

    void load()
  }, [embedded, refreshContext])

  useEffect(() => {
    if (!window.courseCompanion) return
    return window.courseCompanion.onPracticeWorkspaceChanged(() => {
      void (async () => {
        try {
          const next = await window.courseCompanion?.loadPracticeWorkspace()
          if (next) {
            setWorkspace(next)
            setWorkspaceUnavailable(false)
          }
        } catch {
          setError('Không thể đồng bộ tiến độ Practice mới nhất. Kết quả đã lưu vẫn được giữ nguyên.')
        }
      })()
    })
  }, [])

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
    if (reviewBusy || hintBusy || !window.courseCompanion) return
    setReviewBusy(true)
    setError('')
    try {
      const reviewed = await window.courseCompanion.reviewPractice()
      if ('error' in reviewed) {
        setError(reviewed.error.message)
        return
      }
      setWorkspace(reviewed.workspace)
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

  const requestHint = async () => {
    const active = workspace?.activePractice
    if (!active || hintBusy || reviewBusy || returnBusy || !window.courseCompanion) return
    setHintBusy(true)
    setHint(null)
    setHintError('')
    try {
      const response = await window.courseCompanion.requestPracticeHint({ runId: active.runId, generation: active.generation })
      if ('error' in response) setHintError(response.error.message)
      else setHint(response.hint)
    } catch {
      setHintError('Triết tạm thời chưa thể đưa gợi ý. Hãy thử lại.')
    } finally {
      setHintBusy(false)
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
    if (returnBusy || reviewBusy || hintBusy || !window.courseCompanion) return
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
      const request: TeacherSendRequest = { content }
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
  const practiceMode = Boolean(workspace?.activePractice)
  const compactPractice = practiceMode && !embedded
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
    <section className={`pixel-teacher-panel${embedded ? ' is-embedded' : ''}${practiceMode ? ' is-practice-review' : ''}`} aria-label={practiceMode ? 'Duyệt Practice với Triết' : 'Triết, giáo viên đồng hành'}>
      <header>
        <div className="pixel-teacher-identity">
          <span className="pixel-teacher-portrait-frame" aria-hidden="true">
            <img src={teacherImage} alt="" />
          </span>
          <div>
            <small>{practiceMode ? 'TRIẾT · DUYỆT PRACTICE' : currentTeacherStatus.label}</small>
            <strong>{practiceMode ? 'Duyệt Practice' : 'Triết'}</strong>
          </div>
        </div>
        <div className="pixel-panel-controls">
          {workspace?.review?.canReturn ? (
            <PracticeReturnAction
              busy={returnBusy || reviewBusy || hintBusy}
              quick
              onReturn={() => void returnToCourse()}
            />
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

      {workspaceLoaded && !workspaceUnavailable && !practiceMode ? <div className={`pixel-fixture-notice is-${teacherRuntime.connection}`} role={teacherRuntime.error ? 'alert' : 'status'} aria-live="polite">
        <strong>{currentTeacherStatus.strong}</strong>
        <span>{teacherStatusDetail}</span>
      </div> : null}

      {!compactPractice ? <div className="pixel-chat-context">
        <span>BƯỚC HỌC HIỆN TẠI</span>
        <strong>
          {workspace?.activePractice
            ? workspace.title
            : context ? 'Bước hiện tại trong khóa học' : 'Chưa bắt đầu bài học'}
        </strong>
      </div> : null}

      {workspaceLoaded && !workspaceUnavailable && !practiceMode ? <div className="pixel-companion-tabs" role="tablist" aria-label="Chế độ của Triết">
        <button aria-selected={activeTab === 'teacher'} className={activeTab === 'teacher' ? 'is-active' : ''} onClick={() => void selectTab('teacher')} role="tab" type="button">
          HỎI TRIẾT
        </button>
        <button aria-selected={activeTab === 'progress'} className={activeTab === 'progress' ? 'is-active' : ''} onClick={() => void selectTab('progress')} role="tab" type="button">
          TIẾN ĐỘ
        </button>
      </div> : null}

      {!workspaceLoaded ? (
        <div className="pixel-practice-status" role="status">Đang tải không gian của Triết…</div>
      ) : workspaceUnavailable ? (
        <div className="pixel-practice-status is-error" role="alert">
          <strong>CHƯA THỂ XÁC MINH CHẾ ĐỘ</strong>
          <p>Triết tạm khóa chat và duyệt tiến độ. Hãy đóng rồi mở lại cửa sổ này.</p>
        </div>
      ) : practiceMode ? (
        <section className="pixel-practice-review" aria-label="Duyệt tiến độ Practice">
          <div {...practiceGuideAnchor('review-progress')} className="pixel-practice-review__primary practice-review-overview">
            {!compactPractice ? <div role="status" aria-live="polite">
              <small>TRẠNG THÁI HIỆN TẠI</small>
              <strong>{workspace?.review?.status === 'passed'
                ? 'Tiến độ đã đạt yêu cầu'
                : workspace?.review?.status === 'needs-work'
                  ? 'Có mục cần bổ sung'
                  : 'Sẵn sàng đối chiếu tiến độ'}</strong>
              {!compactPractice ? <p>Triết sẽ cập nhật bằng chứng từ đúng task Codex rồi duyệt tiến độ hiện tại.</p> : null}
            </div> : null}
            {workspace?.review?.canReview ? (
              <button
                className={'pixel-review-primary' + (reviewBusy ? ' is-busy' : '')}
                type="button"
                aria-label="Cập nhật và kiểm tra tiến độ Practice"
                aria-busy={reviewBusy}
                disabled={reviewBusy || hintBusy || returnBusy}
                onClick={() => void reviewProgress()}
              >
                {reviewBusy ? <span className="pixel-review-spinner" aria-hidden="true" /> : null}
                {reviewBusy ? 'ĐANG CẬP NHẬT & KIỂM TRA…' : 'Cập nhật và kiểm tra tiến độ'}
              </button>
            ) : null}
            <button
              className="practice-hint-button"
              type="button"
              aria-label="Cần gợi ý cho Practice?"
              aria-busy={hintBusy}
              disabled={hintBusy || reviewBusy || returnBusy || planningActionBusy}
              onClick={() => void requestHint()}
            >
              {hintBusy ? 'Triết đang xem tiến độ…' : 'Cần gợi ý?'}
            </button>
          </div>
          <section className="pixel-practice" aria-live="polite" ref={practiceRef}>
          {hint && hint.runId === workspace?.activePractice?.runId
            && hint.generation === workspace.activePractice.generation ? (
            <aside className="practice-hint" aria-label="Gợi ý của Triết" role="status" aria-live="polite">
              <div className="practice-hint-heading">
                <strong>{hint.source === 'fixture' ? 'Gợi ý mô phỏng' : 'Gợi ý của Triết'}</strong>
                <button type="button" aria-label="Đóng gợi ý" onClick={() => setHint(null)}>Đóng</button>
              </div>
              <p tabIndex={0}>{hint.content}</p>
              <small>Dựa trên tiến độ lúc {formatTime(hint.observedAt)}. Thử bước này trong task Codex, rồi xin thêm gợi ý nếu cần.</small>
            </aside>
          ) : null}
          {hintError ? <div className="pixel-chat-warning" role="alert">{hintError}</div> : null}
          {error ? <div className="pixel-chat-warning" role="alert">{error} Kết quả gần nhất vẫn được giữ nguyên.</div> : null}
            {workspace ? (
              <PracticeProgress
                workspace={workspace}
                api={window.courseCompanion}
                onWorkspaceChange={setWorkspace}
                onBusyChange={setReviewBusy}
                compact={!embedded}
                returnBusy={returnBusy || reviewBusy || hintBusy}
                actionBusy={planningActionBusy || hintBusy}
                onPlanningAction={(action) => void recordPlanningAction(action)}
                onRefresh={() => void refreshPracticeWorkspace()}
                onReturn={() => void returnToCourse()}
              />
            ) : null}
          </section>
        </section>
      ) : activeTab === 'teacher' ? (
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
              api={window.courseCompanion}
              onWorkspaceChange={setWorkspace}
              onBusyChange={setReviewBusy}
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

      {workspaceLoaded && !workspaceUnavailable && !practiceMode && error ? <div className="pixel-chat-error" role="alert">{error}</div> : null}
      {embedded
        && workspace?.activePractice?.practiceId === 'm1-codex-safe-setup'
        && practiceGuide
        && !practiceGuide.replay
        && (practiceGuide.status === 'skipped' || practiceGuide.status === 'completed') ? (
        <button className="practice-guide-replay" type="button" onClick={() => void updatePracticeGuide({ type: 'replay' })}>
          Xem lại hướng dẫn Practice
        </button>
      ) : null}
      <PracticeGuide
        view={practiceGuide}
        onUpdate={updatePracticeGuide}
        onReview={() => void reviewProgress()}
        onReturn={() => void returnToCourse()}
        actionBusy={reviewBusy || returnBusy || hintBusy}
        actionError={error}
      />

      {!embedded ? <footer>
        <button className="pixel-panel-quit" type="button" onClick={() => void window.courseCompanion?.quitApp()}>Thoát ứng dụng</button>
      </footer> : null}
    </section>
  )
}
