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
  pending: '·',
  stale: '!',
  upcoming: '·'
} as const

const configurationRows = [
  { key: 'model', label: 'Model', expected: 'gpt-5.6-sol', expectedLabel: '5.6 Sol' },
  { key: 'reasoningEffort', label: 'Effort', expected: 'high', expectedLabel: 'High' },
  { key: 'serviceTier', label: 'Speed', expected: 'standard', expectedLabel: 'Standard' },
  { key: 'approvalPolicy', label: 'Approval', expected: 'on-request', expectedLabel: 'Approve for me' },
  { key: 'fullAccess', label: 'Full access', expected: 'off', expectedLabel: 'Off' }
] as const

export function PracticeProgress({
  workspace,
  compact = false,
  returnBusy = false,
  onReturn
}: PracticeProgressProps) {
  const reviewStatus = workspace.review?.status
  const configurationPractice = workspace.activePractice?.practiceId === 'm1-codex-safe-setup'
    || workspace.checklist.some((step) => step.id === 'set-model')
  const configuration = workspace.configuration
  const configurationFresh = configuration?.freshness === 'fresh'
    && configuration.connection === 'connected'
  return (
    <section className={'practice-progress' + (compact ? ' is-compact' : '')} aria-label="Tiến độ Practice">
      <div className="practice-progress__summary">
        <small>MỤC TIÊU</small>
        <strong>{workspace.objective}</strong>
        {!compact ? <p>{workspace.expectedOutcome}</p> : null}
      </div>

      {configurationPractice ? (
        <section className="practice-configuration" aria-label="Cấu hình Codex được phát hiện" aria-live="polite">
          <header>
            <div>
              <small>CẤU HÌNH TASK ĐƯỢC PHÁT HIỆN</small>
              <strong>
                {!configuration
                  ? 'CHƯA CÓ DỮ LIỆU'
                  : configurationFresh ? 'DỮ LIỆU MỚI' : 'CHƯA THỂ XÁC MINH'}
              </strong>
            </div>
            <span className={configurationFresh ? 'is-fresh' : 'is-unavailable'}>
              {configurationFresh
                ? 'Mới'
                : !configuration ? 'Đang chờ'
                : configuration.connection === 'disconnected'
                  ? 'Mất kết nối'
                  : configuration.freshness === 'stale' ? 'Đã cũ' : 'Không khả dụng'}
            </span>
          </header>
          <p>
            Course Companion chỉ đọc metadata hiệu lực của task Executor đang liên kết;
            ứng dụng không tự thay đổi cài đặt của bạn.
          </p>
          <dl>
            {configurationRows.map((row) => {
              const value = configuration?.[row.key]
              const matches = configurationFresh && value?.protocolValue === row.expected
              return (
                <div className={matches ? 'is-match' : 'is-mismatch'} key={row.key}>
                  <dt>{row.label}</dt>
                  <dd>{value?.label ?? 'Không xác minh được'}</dd>
                  <small>{matches ? 'Khớp' : 'Cần ' + row.expectedLabel}</small>
                </div>
              )
            })}
          </dl>
          {configuration ? (
            <time dateTime={configuration.observedAt}>
              Ghi nhận: {new Date(configuration.observedAt).toLocaleString('vi-VN')}
            </time>
          ) : null}
        </section>
      ) : null}

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
                    : step.status === 'stale'
                      ? 'Cần xem lại'
                      : 'Sắp tới'}
              </small>
              {step.reason ? <p>{step.reason}</p> : null}
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
