import { practiceGuideAnchor } from './practice-guide-anchors'

type PracticeReturnActionProps = {
  busy: boolean
  disabled?: boolean
  compact?: boolean
  quick?: boolean
  onReturn: () => void
}

export function PracticeReturnAction({ busy, disabled = false, compact = false, quick = false, onReturn }: PracticeReturnActionProps) {
  return (
    <button
      {...practiceGuideAnchor('return-to-course')}
      className={quick
        ? 'pixel-panel-control pixel-panel-control--return practice-return-action is-quick'
        : `practice-return-action${compact ? ' is-compact' : ''}`}
      type="button"
      aria-label={quick ? 'Quay lại khóa học nhanh' : 'Lưu kết quả và quay lại khóa học'}
      title={quick ? 'Quay lại khóa học nhanh' : undefined}
      aria-busy={busy}
      disabled={busy || disabled}
      onClick={onReturn}
    >
      <span className="practice-return-action__visual" aria-hidden="true">
        <svg className="practice-return-action__icon" viewBox="0 0 24 24">
          <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5zM20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5A2.5 2.5 0 0 1 20 21.5zM17 10h4m-2-2 2 2-2 2" />
        </svg>
        {busy ? <span className="practice-return-action__spinner" /> : null}
      </span>
      {!quick ? (
        <span className="practice-return-action__copy">
          <strong>{busy ? 'Đang lưu kết quả và quay lại…' : 'Lưu kết quả và quay lại khóa học'}</strong>
          {busy ? <small>Kết quả đạt đã được lưu.</small> : null}
        </span>
      ) : null}
    </button>
  )
}
