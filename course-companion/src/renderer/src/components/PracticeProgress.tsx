import type { PracticeWorkspaceView } from '../../../../shared/contracts'

type PracticeProgressProps = {
  workspace: PracticeWorkspaceView
  compact?: boolean
  returnBusy?: boolean
  onReturn?: () => void
}

const stepIcon = {
  completed: '✓',
  current: '→',
  upcoming: '·'
} as const

export function PracticeProgress({
  workspace,
  compact = false,
  returnBusy = false,
  onReturn
}: PracticeProgressProps) {
  const reviewStatus = workspace.review?.status
  return (
    <section className={'practice-progress' + (compact ? ' is-compact' : '')} aria-label="Tiến độ Practice">
      <div className="practice-progress__summary">
        <small>MỤC TIÊU</small>
        <strong>{workspace.objective}</strong>
        {!compact ? <p>{workspace.expectedOutcome}</p> : null}
      </div>

      {reviewStatus === 'passed' || reviewStatus === 'needs-work' ? (
        <div className={`practice-review-result is-${reviewStatus}`} role="status">
          <div>
            <small>KẾT QUẢ DUYỆT</small>
            <strong>{reviewStatus === 'passed' ? 'ĐÃ ĐẠT' : 'CẦN BỔ SUNG'}</strong>
            <p>
              {workspace.review?.result?.summary ?? (reviewStatus === 'passed'
                ? 'Bằng chứng đáp ứng các tiêu chí bắt buộc.'
                : 'Hãy bổ sung bằng chứng theo các bước còn lại rồi yêu cầu duyệt lại.')}
            </p>
          </div>
          {reviewStatus === 'passed' && workspace.review?.canReturn && onReturn ? (
            <button type="button" disabled={returnBusy} onClick={onReturn}>
              {returnBusy ? 'ĐANG QUAY LẠI…' : 'Quay lại khóa học'}
            </button>
          ) : null}
        </div>
      ) : null}

      <ol className="practice-checklist">
        {workspace.checklist.map((step) => (
          <li className={'is-' + step.status} key={step.id}>
            <span aria-hidden="true">{stepIcon[step.status]}</span>
            <div>
              <strong>{step.title}</strong>
              <small>
                {step.status === 'completed'
                  ? 'Đã hoàn thành'
                  : step.status === 'current'
                    ? 'Bước tiếp theo'
                    : 'Sắp tới'}
              </small>
            </div>
          </li>
        ))}
      </ol>

      {workspace.activePractice ? (
        <details className="practice-receipt">
          <summary>Executor chat đang hoạt động</summary>
          <p>{workspace.activePractice.executorChatName}</p>
        </details>
      ) : null}
    </section>
  )
}
