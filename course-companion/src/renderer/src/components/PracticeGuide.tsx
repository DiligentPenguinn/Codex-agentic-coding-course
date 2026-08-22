import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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
}

type Placement = { left: number; top: number; fallback: boolean; above: boolean }

const initialPlacement: Placement = { left: 24, top: 24, fallback: true, above: false }
function findPracticeGuideAnchor(id: PracticeGuideAnchorId): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[${PRACTICE_GUIDE_ANCHOR_ATTRIBUTE}="${id}"]`)
}


export function PracticeGuide({ view, onUpdate, onReview, onReturn, actionBusy = false, actionError = '' }: PracticeGuideProps) {
  const panelRef = useRef<HTMLElement>(null)
  const restoreFocusRef = useRef<HTMLElement | null>(null)
  const [placement, setPlacement] = useState(initialPlacement)
  const [updating, setUpdating] = useState(false)
  const visible = Boolean(view?.presentation && view.title && view.body)

  useLayoutEffect(() => {
    if (!visible || view?.presentation !== 'coach-mark' || !view.anchor) {
      return
    }
    let frame = 0
    const position = () => {
      const target = findPracticeGuideAnchor(view.anchor!)
      const panel = panelRef.current
      if (!target || !panel) {
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
      const top = above
        ? Math.max(margin, targetBounds.top - panelBounds.height - margin)
        : below
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
    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('resize', schedule)
      window.removeEventListener('scroll', schedule, true)
    }
  }, [visible, view?.anchor, view?.presentation])

  useEffect(() => {
    if (!visible) return
    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const panel = panelRef.current
    const initial = panel?.querySelector<HTMLElement>('[data-guide-primary], button')
    initial?.focus({ preventScroll: true })
    return () => restoreFocusRef.current?.focus({ preventScroll: true })
  }, [visible, view?.currentStageId])

  if (!view) return null

  const update = async (type: PracticeGuideUpdateRequest['type']) => {
    if (updating) return
    setUpdating(true)
    try {
      if (type === 'resume' || type === 'replay' || type === 'dismiss-confirmation' || type === 'start') {
        await onUpdate({ type } as PracticeGuideUpdateRequest)
        return
      }
      await onUpdate({ type, expectedStageId: view.currentStageId! } as PracticeGuideUpdateRequest)
    } finally {
      setUpdating(false)
    }
  }

  const runPrimaryAction = async () => {
    if (updating || actionBusy) return
    if (view.currentStageId === 'request-review' && onReview) {
      await onReview()
      return
    }
    if (view.currentStageId === 'return-to-course' && onReturn) {
      await onReturn()
      return
    }
    await update(nextType)
  }

  if (view.status === 'paused') {
    return (
      <aside className="practice-guide-resume" role="status">
        <span>Hướng dẫn Practice đang tạm dừng.</span>
        <button disabled={updating} type="button" onClick={() => void update('resume')}>Tiếp tục hướng dẫn</button>
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
    if (event.key !== 'Tab' || view.presentation !== 'intro-dialog') return
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
          <small>VÒNG PRACTICE · HOÀN THÀNH</small>
          <h2 id="practice-guide-title">{view.title}</h2>
          <p>{view.body}</p>
        </div>
        <button data-guide-primary disabled={updating} type="button" onClick={() => void update('dismiss-confirmation')}>
          {view.primaryLabel ?? 'Đã hiểu'}
        </button>
      </aside>
    )
  }

  const isDialog = view.presentation === 'intro-dialog'
  const style = view.presentation === 'coach-mark'
    ? ({ '--guide-left': placement.left + 'px', '--guide-top': placement.top + 'px' } as CSSProperties)
    : undefined

  return (
    <>
      {isDialog ? <div className="practice-guide-scrim" aria-hidden="true" /> : null}
      <aside
        aria-describedby="practice-guide-body"
        aria-labelledby="practice-guide-title"
        aria-modal={isDialog || undefined}
        className={`practice-guide is-${view.presentation}${placement.fallback && view.presentation === 'coach-mark' ? ' is-fallback' : ''}${placement.above && view.presentation === 'coach-mark' ? ' is-above' : ''}`}
        onKeyDown={trapFocus}
        ref={panelRef}
        role={isDialog ? 'dialog' : 'region'}
        style={style}
      >
        <header>
          <small>BƯỚC {view.step}/{view.stepCount} · HƯỚNG DẪN PRACTICE</small>
          <h2 id="practice-guide-title">{view.title}</h2>
        </header>
        <p id="practice-guide-body">{view.body}</p>
        {view.error || actionError ? <div className="practice-guide-warning" role="status">{actionError || view.error}</div> : null}
        <div className="practice-guide-actions">
          {view.primaryLabel ? (
            <button data-guide-primary disabled={updating || actionBusy} type="button" onClick={() => void runPrimaryAction()}>
              {actionBusy
                ? view.currentStageId === 'return-to-course' ? 'Đang lưu và quay lại…' : 'Đang cập nhật và kiểm tra…'
                : view.primaryLabel}
            </button>
          ) : null}
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
}
