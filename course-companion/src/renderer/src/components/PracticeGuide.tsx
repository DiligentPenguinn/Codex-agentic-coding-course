import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { CSSProperties, KeyboardEvent } from 'react'
import type { PracticeGuideAnchorId, PracticeGuideUpdateRequest, PracticeGuideView } from '../../../../shared/contracts'
import { PRACTICE_GUIDE_ANCHOR_ATTRIBUTE } from './practice-guide-anchors'

type PracticeGuideProps = {
  view: PracticeGuideView | null
  onUpdate: (request: PracticeGuideUpdateRequest) => void | Promise<void>
  onReview?: () => void | Promise<void>
  onReturn?: () => void | Promise<void>
  actionBusy?: boolean
  actionError?: string
  compact?: boolean
}

type Placement = { left: number; top: number; fallback: boolean; above: boolean }

const initialPlacement: Placement = { left: 24, top: 24, fallback: true, above: false }
function findPracticeGuideAnchor(id: PracticeGuideAnchorId): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[${PRACTICE_GUIDE_ANCHOR_ATTRIBUTE}="${id}"]`)
}


export function PracticeGuide({ view, onUpdate, onReview, onReturn, actionBusy = false, actionError = '', compact = false }: PracticeGuideProps) {
  const panelRef = useRef<HTMLElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const [placement, setPlacement] = useState(initialPlacement)
  const [updating, setUpdating] = useState(false)
  const updatingRef = useRef(false)
  const [updateError, setUpdateError] = useState('')
  const visible = Boolean(view?.presentation && view.title && view.body)

  useLayoutEffect(() => {
    if (compact || !visible || view?.presentation !== 'coach-mark' || !view.anchor) {
      return
    }
    let frame = 0
    findPracticeGuideAnchor(view.anchor)?.scrollIntoView({ block: 'nearest' })
    const position = () => {
      const target = findPracticeGuideAnchor(view.anchor!)
      const panel = panelRef.current
      if (!target || !panel || target.getClientRects().length === 0) {
        setPlacement(initialPlacement)
        return
      }
      const targetBounds = target.getBoundingClientRect()
      const panelBounds = panel.getBoundingClientRect()
      const margin = 14
      const left = Math.min(
        Math.max(margin, targetBounds.left),
        Math.max(margin, window.innerWidth - panelBounds.width - margin)
      )
      const below = targetBounds.bottom + margin
      const above = below + panelBounds.height > window.innerHeight
      const preferredTop = above
        ? Math.max(margin, targetBounds.top - panelBounds.height - margin)
        : below
      const top = Math.max(margin, Math.min(preferredTop, window.innerHeight - panelBounds.height - margin))
      setPlacement({ left, top, fallback: false, above })
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(position)
    }
    position()
    window.addEventListener('resize', schedule)
    window.addEventListener('scroll', schedule, true)
    const observer = new ResizeObserver(schedule)
    const target = findPracticeGuideAnchor(view.anchor)
    if (target) observer.observe(target)
    if (panelRef.current) observer.observe(panelRef.current)
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
    }
  }, [compact, visible, view?.anchor, view?.presentation, view?.currentStageId])

  useEffect(() => {
    if (!visible) return
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    const initial = compact ? panel : panel?.querySelector<HTMLElement>('[data-guide-primary], button')
    initial?.focus({ preventScroll: true })
    return () => restoreFocusRef.current?.focus({ preventScroll: true })
  }, [compact, visible, view?.currentStageId])

  if (!view) return null

  const perform = async (action: () => void | Promise<void>) => {
    if (updatingRef.current) return
    updatingRef.current = true
    setUpdating(true)
    setUpdateError('')
    try {
      await action()
    } catch {
      setUpdateError('Chưa thể chuyển bước hướng dẫn. Hãy thử lại; tiến độ Practice vẫn được giữ nguyên.')
    } finally {
      updatingRef.current = false
      setUpdating(false)
    }
  }

  const update = (type: PracticeGuideUpdateRequest['type']) => perform(async () => {
      if (type === 'resume' || type === 'replay' || type === 'dismiss-confirmation' || type === 'start') {
        await onUpdate({ type } as PracticeGuideUpdateRequest)
        return
      }
      await onUpdate({ type, expectedStageId: view.currentStageId! } as PracticeGuideUpdateRequest)
  })

  const runPrimaryAction = async () => {
    if (updatingRef.current || actionBusy || view.primaryDisabled) return
    if (view.replay) {
      await update(view.currentStageId === 'practice-loop-confirmation' ? 'dismiss-confirmation' : 'continue')
      return
    }
    if (view.currentStageId === 'request-review' && onReview) {
      await perform(onReview)
      return
    }
    if (view.currentStageId === 'return-to-course' && onReturn) {
      await perform(onReturn)
      return
    }
    await update(nextType)
  }

  if (view.status === 'paused') {
    return (
      <aside className="practice-guide-resume" role="status">
        <span>Hướng dẫn Practice đang tạm dừng.</span>
        <button disabled={updating} type="button" onClick={() => void update('resume')}>Tiếp tục hướng dẫn</button>
        {updateError || actionError || view.error ? <p role="alert">{updateError || actionError || view.error}</p> : null}
      </aside>
    )
  }
  if (!visible) return null

  const nextType = view.currentStageId === 'practice-loop-confirmation'
    ? 'continue'
    : view.currentStageId === 'return-to-course' ? 'course-returned'
      : 'continue'

  const trapFocus = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      update('pause')
      return
    }
    if (event.key !== 'Tab' || compact || view.presentation !== 'intro-dialog') return
    const controls = [...(panelRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled)') ?? [])]
    if (controls.length < 2) return
    const first = controls[0]
    const last = controls[controls.length - 1]
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault()
      last?.focus()
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault()
      first?.focus()
    }
  }

  if (view.presentation === 'mastery-confirmation') {
    return (
      <aside className="practice-guide-mastery" aria-labelledby="practice-guide-title" role="status">
        <div>
          <small>Vòng Practice · Hoàn thành</small>
          <h2 id="practice-guide-title">{view.title}</h2>
          <p>{view.body}</p>
        </div>
        <button data-guide-primary disabled={updating} type="button" onClick={() => void update('dismiss-confirmation')}>
          {view.primaryLabel ?? 'Đã hiểu'}
        </button>
      </aside>
    )
  }

  const isDialog = !compact && view.presentation === 'intro-dialog'
  const style = !compact && view.presentation === 'coach-mark'
    ? ({ '--guide-left': placement.left + 'px', '--guide-top': placement.top + 'px' } as CSSProperties)
    : undefined

  const guide = (
    <>
      {isDialog ? <div className="practice-guide-scrim" aria-hidden="true" /> : null}
      <aside
        aria-describedby="practice-guide-body"
        aria-labelledby="practice-guide-title"
        aria-modal={isDialog || undefined}
        className={`practice-guide is-${view.presentation}${compact ? ' is-docked' : ''}${placement.fallback && view.presentation === 'coach-mark' ? ' is-fallback' : ''}${placement.above && view.presentation === 'coach-mark' ? ' is-above' : ''}`}
        onKeyDown={trapFocus}
        ref={panelRef}
        tabIndex={-1}
        role={isDialog ? 'dialog' : 'region'}
        aria-busy={updating || actionBusy}
        style={style}
      >
        <header>
          <small>Bước {view.step}/{view.stepCount} · Hướng dẫn Practice</small>
          <h2 id="practice-guide-title">{view.title}</h2>
        </header>
        <p id="practice-guide-body">{view.body}</p>
        {view.actionNotice ? <div className="practice-guide-warning" role="status">{view.actionNotice}</div> : null}
        {view.error || actionError || updateError ? <div className="practice-guide-warning" role="alert">{updateError || actionError || view.error}</div> : null}
        <div className="practice-guide-actions">
          {view.primaryLabel ? (
            <button data-guide-primary disabled={updating || actionBusy || view.primaryDisabled} type="button" onClick={() => void runPrimaryAction()}>
              {actionBusy
                ? view.currentStageId === 'return-to-course' ? 'Đang lưu và quay lại…' : 'Đang cập nhật và kiểm tra…'
                : view.primaryLabel}
            </button>
          ) : null}
          <button className="is-secondary" disabled={updating} type="button" onClick={() => void update('pause')}>Tạm dừng</button>
          {view.secondaryLabel ? (
            <button className="is-secondary" disabled={updating} type="button" onClick={() => void update('skip')}>
              {view.secondaryLabel}
            </button>
          ) : null}
        </div>
        <span className="practice-guide-escape">Esc để tạm dừng</span>
      </aside>
    </>
  )
  return compact ? guide : createPortal(<div className="practice-guide-layer practice-workflow">{guide}</div>, document.body)
}
