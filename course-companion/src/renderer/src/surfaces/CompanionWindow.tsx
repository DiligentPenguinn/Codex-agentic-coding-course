import { useEffect, useState } from 'react'
import type { CompanionMode, CompanionState } from '../../../../shared/contracts'
import teacherImage from '../../../../../prototypes/mvp-3-course-experience-companion/assets/teacher.png'
import { TeacherWorkspace } from '../components/TeacherWorkspace'

export function CompanionWindow() {
  const [mode, setMode] = useState<CompanionMode | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        const state: CompanionState = window.courseCompanion
          ? await window.courseCompanion.loadCompanionState()
          : { mode: 'compact', conversation: { messages: [], recovered: false } }
        setMode(state.mode)
      } catch {
        setMode('compact')
      }
    }

    void load()
  }, [])

  const changeMode = async (nextMode: CompanionMode) => {
    try {
      await window.courseCompanion?.setCompanionMode(nextMode)
      setMode(nextMode)
    } catch {
      setMode('compact')
    }
  }

  const restoreLearningWindow = async () => {
    await changeMode('compact')
    await window.courseCompanion?.showLearningWindow()
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
          onClick={() => void changeMode('expanded')}
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
        onOpenLesson={() => void restoreLearningWindow()}
      />
    </main>
  )
}
