import type { PracticeWorkspaceView } from '../../../../shared/contracts'

type PracticeSwitchDialogProps = {
  workspace: PracticeWorkspaceView
  busy: boolean
  onFresh: () => void
  onCancel: () => void
}

export function PracticeSwitchDialog({
  workspace,
  busy,
  onFresh,
  onCancel
}: PracticeSwitchDialogProps) {
  return (
    <div className="practice-switch-backdrop">
      <section className="practice-switch-dialog" role="dialog" aria-modal="true" aria-labelledby="practiceSwitchTitle">
        <small>PRACTICE ĐANG HOẠT ĐỘNG</small>
        <h2 id="practiceSwitchTitle">Bắt đầu một Practice mới?</h2>
        <p>Task Codex hiện tại vẫn được giữ lại. Chỉ có một Practice được đánh dấu đang hoạt động.</p>

        <button className="practice-switch-option" type="button" disabled aria-describedby="selectiveUnavailable">
          <span aria-hidden="true">↗</span>
          <strong>Chuyển ngữ cảnh có chọn lọc</strong>
          <small id="selectiveUnavailable">{workspace.capabilities.selectiveTransferReason}</small>
        </button>
        <button className="practice-switch-option is-primary" type="button" disabled={busy} onClick={onFresh}>
          <span aria-hidden="true">○</span>
          <strong>Bắt đầu hoàn toàn mới</strong>
          <small>Tạo task Codex trống cho Practice mới.</small>
        </button>

        <button className="practice-switch-cancel" type="button" disabled={busy} onClick={onCancel}>
          Hủy
        </button>
      </section>
    </div>
  )
}
