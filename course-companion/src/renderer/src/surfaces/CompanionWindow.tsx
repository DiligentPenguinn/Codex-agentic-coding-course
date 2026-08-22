import { useEffect, useRef, useState } from 'react'
import type { CompanionMode, CompanionState } from '../../../../shared/contracts'
import teacherImage from '../assets/teacher-triet.png'
import { TeacherWorkspace } from '../components/TeacherWorkspace'

export function CompanionWindow() {
  const [mode, setMode] = useState<CompanionMode | null>(null)
  const [practiceMode, setPracticeMode] = useState<boolean | null>(null)
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const state: CompanionState = window.courseCompanion
          ? await window.courseCompanion.loadCompanionState()
          : { mode: 'compact', conversation: { messages: [], recovered: false }, teacher: { connection: 'simulated', memory: 'ready' } }
        const hasActivePractice = await window.courseCompanion?.hasActivePractice()
        setMode(state.mode)
        setPracticeMode(Boolean(hasActivePractice))
      } catch {
        setMode('compact')
        setPracticeMode(null)
      }
    }
    const refreshPracticeMode = async () => {
      try {
        const hasActivePractice = await window.courseCompanion?.hasActivePractice()
        setPracticeMode(Boolean(hasActivePractice))
      } catch {
        setPracticeMode(null)
      }
    }
    const unsubscribeMode = window.courseCompanion?.onCompanionModeChanged((nextMode) => {
      setMode(nextMode)
      setPracticeMode(null)
      void refreshPracticeMode()
    })
    const poll = window.setInterval(() => void refreshPracticeMode(), 1500)
    const refreshOnFocus = () => {
      setPracticeMode(null)
      void refreshPracticeMode()
    }
    window.addEventListener('focus', refreshOnFocus)

    void load()
    return () => {
      if (clickTimer.current) clearTimeout(clickTimer.current)
      window.clearInterval(poll)
      window.removeEventListener('focus', refreshOnFocus)
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
    return <main className="pixel-companion-surface" aria-label="Đang tải Triết" />
  }

  if (mode === 'compact') {
    return (
      <main className="pixel-companion-surface pixel-companion-surface--compact">
        <button
          className="pixel-teacher-launcher"
          type="button"
          aria-label={practiceMode === true ? 'Mở Duyệt Practice với Triết' : practiceMode === false ? 'Mở Triết, giáo viên đồng hành' : 'Mở Triết; đang kiểm tra trạng thái Practice'}
          aria-description="Nhấp một lần để mở nhanh. Nhấp đúp để mở toàn màn hình."
          title="Nhấp một lần để mở nhanh · Nhấp đúp để mở toàn màn hình"
          onClick={openQuickTeacher}
          onDoubleClick={openFullTeacher}
        >
          <img src={teacherImage} alt="" />
          <span>{practiceMode === true ? 'DUYỆT PRACTICE' : practiceMode === false ? 'TRIẾT' : 'ĐANG KIỂM TRA'}</span>
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
