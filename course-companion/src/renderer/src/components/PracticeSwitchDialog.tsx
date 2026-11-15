import { useEffect, useRef } from 'react'

type PracticeSwitchDialogProps = {
  busy: boolean
  continuesTask?: boolean
  onFresh: () => void
  onCancel: () => void
}

export function PracticeSwitchDialog({
  busy,
  continuesTask = false,
  onFresh,
  onCancel
}: PracticeSwitchDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const previousFocus = document.activeElement
    const dialog = dialogRef.current
    dialog?.showModal()
    return () => {
      dialog?.close()
      if (previousFocus instanceof HTMLElement) previousFocus.focus()
    }
  }, [])

  return (
    <dialog ref={dialogRef} className="practice-switch-dialog" aria-labelledby="practiceSwitchTitle"
      aria-describedby="practiceSwitchDescription" aria-busy={busy}
      onCancel={(event) => { event.preventDefault(); if (!busy) onCancel() }}>
      <small>Practice đang hoạt động</small>
      <h2 id="practiceSwitchTitle">Bắt đầu một Practice mới?</h2>
      <p id="practiceSwitchDescription">Task Codex hiện tại vẫn được giữ lại. Chỉ có một Practice được đánh dấu đang hoạt động.</p>

      <p>{continuesTask ? 'Bắt đầu lượt Practice mới trong task Codex hiện tại; tệp và lịch sử trao đổi được giữ lại.' : 'Tạo task Codex trống cho Practice mới.'}</p>
      <div className="practice-switch-actions">
        <button className="practice-switch-cancel" type="button" disabled={busy} onClick={onCancel} autoFocus>
          Hủy
        </button>
        <button className="practice-switch-confirm" type="button" disabled={busy} onClick={onFresh}>
          {busy ? 'Đang chuẩn bị…' : continuesTask ? 'Bắt đầu lượt Practice mới' : 'Bắt đầu hoàn toàn mới'}
        </button>
      </div>
    </dialog>
  )
}
