import { useState } from 'react'
import { portfolioPackageArtifactPaths, type CourseCompanionApi, type PracticeWorkspaceView } from '../../../../shared/contracts'

type Props = {
  workspace: PracticeWorkspaceView
  api?: CourseCompanionApi
  disabled?: boolean
  onWorkspaceChange?: (workspace: PracticeWorkspaceView) => void
  onBusyChange?: (busy: boolean) => void
  onRefresh?: () => void
}

export function PortfolioPackageSubmission({ workspace, api, disabled, onWorkspaceChange, onBusyChange, onRefresh }: Props) {
  const [approved, setApproved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const packageView = workspace.portfolioPackage
  const active = workspace.activePractice
  if (!packageView || !active) return null

  const submit = async () => {
    if (!api?.approvePortfolioPackage || !approved || !packageView.sourceDigest || busy || disabled) return
    setBusy(true)
    onBusyChange?.(true)
    setError('')
    try {
      const loaded = await api.loadProgress()
      if (loaded.status !== 'returning' && loaded.status !== 'recovered') throw new Error('Không thể đọc tiến độ khóa học.')
      const confirmed = await api.approvePortfolioPackage({
        runId: active.runId, generation: active.generation, practiceId: active.practiceId,
        practiceVersion: active.practiceVersion, courseRunId: loaded.progress.courseRunId,
        sourceDigest: packageView.sourceDigest, approvePrd: true, approvePlan: true
      })
      onWorkspaceChange?.(confirmed)
      const reviewed = await api.reviewPractice()
      if ('error' in reviewed) setError(reviewed.error.message)
      else onWorkspaceChange?.(reviewed.workspace)
    } catch {
      setError('Chưa thể nộp gói hiện tại. Hãy làm mới tài liệu, kiểm tra lại PRD và kế hoạch rồi thử lại.')
    } finally {
      setBusy(false)
      onBusyChange?.(false)
    }
  }

  return (
    <section className="practice-planning-evidence" aria-label="Nộp gói planning">
      <details>
        <summary>Năm tài liệu cần nộp</summary>
        <ul>{portfolioPackageArtifactPaths.map((path) => <li key={path} style={{ overflowWrap: 'anywhere' }}>{path}</li>)}</ul>
      </details>
      {packageView.issues.length > 0 ? <ul>{packageView.issues.map((issue, index) => <li key={index} style={{ overflowWrap: 'anywhere' }}>{issue}</li>)}</ul> : null}
      {packageView.unexpectedPaths.length > 0 ? <p style={{ overflowWrap: 'anywhere' }}>Ngoài phạm vi: {packageView.unexpectedPaths.join(', ')}</p> : null}
      {!packageView.ready && packageView.issues.length === 0 ? <p>Lưu đủ năm tài liệu rồi làm mới bằng chứng để kiểm tra gói hiện tại.</p> : null}
      <label>
        <input type="checkbox" checked={approved} disabled={busy || disabled || !packageView.ready}
          onChange={() => setApproved(!approved)} />
        Tôi đã đọc và duyệt PRD cùng kế hoạch triển khai hiện tại.
      </label>
      <div className="practice-brief-actions">
        {onRefresh ? <button type="button" disabled={busy || disabled} onClick={onRefresh}>Làm mới bằng chứng</button> : null}
        <button type="button" disabled={busy || disabled || !approved || !packageView.ready || !onWorkspaceChange || !api?.approvePortfolioPackage}
          onClick={() => void submit()}>{busy ? 'Đang kiểm tra gói…' : 'Duyệt và nộp gói planning'}</button>
      </div>
      {error ? <p role="alert">{error}</p> : null}
    </section>
  )
}
