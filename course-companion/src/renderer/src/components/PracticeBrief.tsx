import { useEffect, useState } from 'react'
import type { PracticeWorkspaceView } from '../../../../shared/contracts'
import { PracticeProgress } from './PracticeProgress'
import { PracticeSwitchDialog } from './PracticeSwitchDialog'

type PracticeBriefProps = {
  onClose: () => void
}

const previewWorkspace: PracticeWorkspaceView = {
  schemaVersion: 1,
  phase: 'brief',
  objective: 'Tạo một brief kiểm chứng được trước khi cho Codex thay đổi giao diện.',
  expectedOutcome: 'Một thay đổi CSS đúng phạm vi, có bằng chứng ở viewport 390px và không gây tràn ngang.',
  checklist: [
    { id: 'review-objective', title: 'Xem mục tiêu và dấu hiệu hoàn thành', status: 'current' },
    { id: 'open-executor', title: 'Mở Executor chat riêng cho Practice', status: 'upcoming' }
  ],
  presentation: { fullPanel: 'teacher', compactPanel: 'teacher' },
  capabilities: {
    canStartNew: true,
    canResume: false,
    selectiveTransferAvailable: false,
    selectiveTransferReason: 'Tạm thời không khả dụng trong bản Codex hiện tại.'
  }
}

export function PracticeBrief({ onClose }: PracticeBriefProps) {
  const [workspace, setWorkspace] = useState<PracticeWorkspaceView | null>(null)
  const [busy, setBusy] = useState(false)
  const [switchOpen, setSwitchOpen] = useState(false)
  const [error, setError] = useState('')

  const load = async () => {
    try {
      setWorkspace(
        window.courseCompanion
          ? await window.courseCompanion.loadPracticeWorkspace()
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
          ? await window.courseCompanion.loadPracticeWorkspace()
          : await Promise.resolve(previewWorkspace)
        setWorkspace(initialWorkspace)
      } catch {
        setError('Không thể đọc trạng thái Practice. Hãy thử lại.')
      }
    }

    void loadInitial()
  }, [])

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
        ? await window.courseCompanion.startPractice({ transfer: false })
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
          ? await window.courseCompanion.resumePractice()
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
        <div><small>PRACTICE · MODULE 1</small><strong>Brief kiểm chứng được</strong></div>
        <span aria-hidden="true">01</span>
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

      <PracticeProgress workspace={workspace} />

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
