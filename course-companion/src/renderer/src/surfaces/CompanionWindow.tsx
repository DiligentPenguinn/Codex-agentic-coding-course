import { useEffect, useRef, useState } from 'react'
import type { CompanionMode, CompanionState } from '../../../../shared/contracts'
import teacherImage from '../../../../../prototypes/mvp-3-course-experience-companion/assets/teacher.png'
import { TeacherWorkspace } from '../components/TeacherWorkspace'

export function CompanionWindow() {
  const [mode, setMode] = useState<CompanionMode | null>(null)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const state: CompanionState = window.courseCompanion
          ? await window.courseCompanion.loadCompanionState()
          : { mode: 'compact', conversation: { messages: [], recovered: false }, teacher: { connection: 'simulated', memory: 'ready' } }
        setMode(state.mode)
      } catch {
        setMode('compact')
      }
    }
    const unsubscribeMode = window.courseCompanion?.onCompanionModeChanged(setMode)

    void load()
    return () => {
      if (clickTimer.current) clearTimeout(clickTimer.current)
      unsubscribeMode?.()
    }
  }, [])

  const changeMode = async (nextMode: CompanionMode) => {
    try {
      await window.courseCompanion?.setCompanionMode(nextMode)
      setMode(nextMode)
    } catch {
      setMode('compact')
    }
  }

  const showFullTeacher = async () => {
    try {
      await window.courseCompanion?.showFullTeacher()
    } catch {
      setMode('compact')
    }
  }

  const openQuickTeacher = () => {
    if (clickTimer.current) return
    clickTimer.current = setTimeout(() => {
      clickTimer.current = null
      void changeMode('expanded')
    }, 300)
  }

  const openFullTeacher = () => {
    if (clickTimer.current) {
      clearTimeout(clickTimer.current)
      clickTimer.current = null
    }
    void showFullTeacher()
  }
  if (mode === null) {
    return <main className="pixel-companion-surface" aria-label="Đang tải Hương" />
  }

  if (mode === 'compact') {
    return (
      <main className="pixel-companion-surface pixel-companion-surface--compact">
        <button
          className="pixel-teacher-launcher"
          type="button"
          aria-label="Mở Hương, giáo viên đồng hành"
          onClick={openQuickTeacher}
          onDoubleClick={openFullTeacher}
        >
          <img src={teacherImage} alt="" />
          <span>HƯƠNG</span>
        </button>
      </main>
    )
  }

  return (
    <main className="pixel-companion-surface pixel-companion-surface--expanded">
      <TeacherWorkspace
        onClose={() => void changeMode('compact')}
        onExpand={() => void showFullTeacher()}
      />
    </main>
  )
}
