import { useState } from 'react'
import type { CompanionMode } from '../../../../shared/contracts'
import teacherImage from '../../../../../prototypes/mvp-3-course-experience-companion/assets/teacher.png'

export function CompanionWindow() {
  const [mode, setMode] = useState<CompanionMode>('compact')

  const changeMode = async (nextMode: CompanionMode) => {
    await window.courseCompanion?.setCompanionMode(nextMode)
    setMode(nextMode)
  }

  const restoreLearningWindow = async () => {
    await changeMode('compact')
    await window.courseCompanion?.showLearningWindow()
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
      <section className="pixel-teacher-panel" aria-label="Hương, giáo viên đồng hành">
        <header>
          <div className="pixel-teacher-identity">
            <img src={teacherImage} alt="" />
            <div>
              <small>TEACHER · ĐANG Ở BÊN BẠN</small>
              <strong>Hương</strong>
            </div>
          </div>
          <button
            className="pixel-panel-minimize"
            type="button"
            aria-label="Thu nhỏ Hương"
            onClick={() => void changeMode('compact')}
          >
            —
          </button>
        </header>

        <p>
          Bạn đã có mục tiêu, phạm vi và bằng chứng. Khi Codex đưa kế hoạch, hãy
          kiểm tra ba điều đó trước khi chấp thuận.
        </p>

        <footer>
          <button className="pixel-panel-quit" type="button" onClick={() => void window.courseCompanion?.quitApp()}>
            Thoát ứng dụng
          </button>
          <button className="pixel-panel-primary" type="button" onClick={() => void restoreLearningWindow()}>
            Mở lại bài học
          </button>
        </footer>
      </section>
    </main>
  )
}
