import type { PracticeWorkspaceView } from '../../../../shared/contracts'

type PracticeProgressProps = {
  workspace: PracticeWorkspaceView
  compact?: boolean
}

const stepIcon = {
  completed: '✓',
  current: '→',
  upcoming: '·'
} as const

export function PracticeProgress({ workspace, compact = false }: PracticeProgressProps) {
  return (
    <section className={'practice-progress' + (compact ? ' is-compact' : '')} aria-label="Tiến độ Practice">
      <div className="practice-progress__summary">
        <small>MỤC TIÊU</small>
        <strong>{workspace.objective}</strong>
        {!compact ? <p>{workspace.expectedOutcome}</p> : null}
      </div>

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
