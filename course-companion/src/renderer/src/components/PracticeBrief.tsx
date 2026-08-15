import { useEffect, useState } from 'react'
import type { PracticeIdentity, PracticeWorkspaceView } from '../../../../shared/contracts'
import { PracticeProgress } from './PracticeProgress'
import { PracticeSwitchDialog } from './PracticeSwitchDialog'

type PracticeBriefProps = {
  identity: PracticeIdentity
  courseRunId?: string
  onClose: () => void
  onPortfolioComplete?: () => void | Promise<void>
}

const previewWorkspace: PracticeWorkspaceView = {
  schemaVersion: 1,
  phase: 'brief',
  title: 'Bài thực hành',
  objective: 'Đang tải mục tiêu Practice…',
  expectedOutcome: 'Course Companion sẽ hiển thị kết quả cần đạt từ định nghĩa Practice.',
  checklist: [],
  presentation: { fullPanel: 'teacher', compactPanel: 'teacher' },
  capabilities: {
    canStartNew: true,
    canResume: false,
    selectiveTransferAvailable: false,
    selectiveTransferReason: 'Tạm thời không khả dụng trong bản Codex hiện tại.'
  }
}

export function PracticeBrief({
  identity,
  courseRunId,
  onClose,
  onPortfolioComplete
}: PracticeBriefProps) {
  const [workspace, setWorkspace] = useState<PracticeWorkspaceView | null>(null)
  const [busy, setBusy] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setWorkspace(
        window.courseCompanion
          ? await window.courseCompanion.loadPracticeWorkspace(identity)
          : previewWorkspace
      )
    } catch {
      setError('Không thể đọc trạng thái Practice. Hãy thử lại.')
    }
  }

  useEffect(() => {
    const loadInitial = async () => {
      try {
        const initialWorkspace = window.courseCompanion
          ? await window.courseCompanion.loadPracticeWorkspace(identity)
          : await Promise.resolve(previewWorkspace)
        setWorkspace(initialWorkspace)
      } catch {
        setError('Không thể đọc trạng thái Practice. Hãy thử lại.')
      }
    }

    void loadInitial()
  }, [identity])

  const start = async () => {
    if (!workspace || busy) return
    if (workspace.activePractice && !switchOpen) {
      setSwitchOpen(true)
      return
    }
    setBusy(true)
    setError('')
    try {
      const next = window.courseCompanion
        ? await window.courseCompanion.startPractice({ ...identity, transfer: false })
        : workspace
      setWorkspace(next)
      setSwitchOpen(false)
    } catch {
      setError('')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const resume = async () => {
    if (!workspace || busy) return
    setBusy(true)
    setError('')
    try {
      setWorkspace(
        window.courseCompanion
          ? await window.courseCompanion.resumePractice(identity)
          : workspace
      )
    } catch {
      setError('Không thể mở Executor chat đang hoạt động. Hãy thử lại.')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const retry = async () => {
    if (busy) return
    setBusy(true)
    setError('')
    try {
      if (window.courseCompanion) {
        setWorkspace(await window.courseCompanion.retryPracticeSwitch())
      }
    } catch {
      setError('')
      await load()
    } finally {
      setBusy(false)
    }
  }

  const cancelTransition = async () => {
    if (!window.courseCompanion || busy) return
    setBusy(true)
    try {
      setWorkspace(await window.courseCompanion.cancelPracticeSwitch())
    } catch {
      setError('Không thể hủy lần chuyển ở giai đoạn hiện tại.')
    } finally {
      setBusy(false)
    }
  }

  const recordPortfolioStage = async (
    stageId: string,
    decision: 'approved' | 'revision-requested',
    sliceId?: import('../../../../shared/contracts').PortfolioBuildSliceId
  ) => {
    const active = workspace?.activePractice
    if (!active || !courseRunId || busy || !window.courseCompanion) return
    setBusy(true)
    setError('')
    try {
      const next = await window.courseCompanion.recordPortfolioStageAction({
        runId: active.runId,
        generation: active.generation,
        practiceId: active.practiceId,
        practiceVersion: active.practiceVersion,
        courseRunId,
        stageId,
        ...(sliceId ? { sliceId } : {}),
        decision
      })
      setWorkspace(next)
      if (decision === 'approved'
        && (next.portfolioPlanning ?? next.portfolioBuild)?.stages.every((stage) => stage.status === 'completed')) {
        await onPortfolioComplete?.()
      }
    } catch {
      setError('Không thể ghi nhận quyết định trên bằng chứng hiện tại. Hãy làm mới rồi thử lại.')
      await load()
    } finally {
      setBusy(false)
    }
  }

  if (!workspace) {
    return (
      <main className="practice-brief-overlay is-loading" aria-live="polite">
        <span className="practice-loading-orbit" aria-hidden="true" />
        <strong>{error || 'Đang đọc Practice…'}</strong>
        {error ? <button type="button" onClick={() => void load()}>Thử lại</button> : null}
      </main>
    )
  }

  const switching = workspace.phase === 'switching'
  return (
    <main className="practice-brief-overlay">
      <header className="practice-brief-header">
        <button type="button" aria-label="Đóng trang Practice" onClick={onClose}>×</button>
        <div><small>PRACTICE</small><strong>{workspace.title}</strong></div>
        <span aria-hidden="true">◆</span>
      </header>

      <section className="practice-brief-card" aria-labelledby="practiceObjective">
        <small>MỤC TIÊU / KẾT QUẢ</small>
        <h1 id="practiceObjective">{workspace.objective}</h1>
        <p>{workspace.expectedOutcome}</p>

        <div className="practice-brief-actions">
          <button className="is-primary" type="button" disabled={busy || switching} onClick={() => void start()}>
            {busy ? 'Đang chuẩn bị…' : 'Bắt đầu Practice mới'}
          </button>
          {workspace.capabilities.canResume ? (
            <button type="button" disabled={busy || switching} onClick={() => void resume()}>
              Tiếp tục Practice
            </button>
          ) : null}
        </div>

        {switching && workspace.transition ? (
          <div className="practice-transition" aria-live="polite">
            <span className="practice-loading-orbit" aria-hidden="true" />
            <strong>{workspace.transition.label}</strong>
            {workspace.transition.canRetry ? <button type="button" disabled={busy} onClick={() => void retry()}>Thử lại</button> : null}
            {workspace.transition.canCancel ? (
              <button type="button" disabled={busy} onClick={() => void cancelTransition()}>Hủy</button>
            ) : null}
          </div>
        ) : null}
        {error || workspace.error ? <p className="practice-brief-error" role="alert">{error || workspace.error}</p> : null}
      </section>

      <PracticeProgress
        workspace={workspace}
        actionBusy={busy}
        onPortfolioStageAction={courseRunId ? (stageId, decision, sliceId) => void recordPortfolioStage(stageId, decision, sliceId) : undefined}
        onRefresh={() => void load()}
      />

      {switchOpen ? (
        <PracticeSwitchDialog
          workspace={workspace}
          busy={busy}
          onFresh={() => void start()}
          onCancel={() => setSwitchOpen(false)}
        />
      ) : null}
    </main>
  )
}
