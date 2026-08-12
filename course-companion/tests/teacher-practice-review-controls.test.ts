import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

async function source(path: string): Promise<string> {
  return readFile(join(process.cwd(), path), 'utf8')
}

describe('Teacher Practice review controls', () => {
  it('uses one shared icon implementation for windowed and full-screen Teacher', async () => {
    const [teacher, companion, learning] = await Promise.all([
      source('src/renderer/src/components/TeacherWorkspace.tsx'),
      source('src/renderer/src/surfaces/CompanionWindow.tsx'),
      source('src/renderer/src/surfaces/LearningWindow.tsx')
    ])

    expect(companion).toContain('<TeacherWorkspace')
    expect(learning).toContain('<TeacherWorkspace')
    expect(teacher).toContain('pixel-panel-control--review')
    expect(teacher).toContain('pixel-panel-control--return')
    expect(teacher).toContain('<svg aria-hidden="true" viewBox="0 0 24 24">')
  })

  it('gates return on persisted review state rather than Teacher prose', async () => {
    const teacher = await source('src/renderer/src/components/TeacherWorkspace.tsx')

    expect(teacher).toContain('workspace?.review?.canReturn')
    expect(teacher).toContain('window.courseCompanion.reviewPractice()')
    expect(teacher).toContain('window.courseCompanion.returnPassedPractice()')
    expect(teacher).not.toMatch(/message\.content.*passed/i)
  })

  it('provides accessible labels, busy state, and reduced-motion styling', async () => {
    const [teacher, styles] = await Promise.all([
      source('src/renderer/src/components/TeacherWorkspace.tsx'),
      source('src/renderer/src/styles.css')
    ])

    expect(teacher).toContain('aria-label="Yêu cầu Triết duyệt tiến độ"')
    expect(teacher).toContain('aria-label="Quay lại khóa học nhanh"')
    expect(teacher).toContain('onReturn={() => void returnToCourse()}')
    expect(teacher).toContain('returnBusy={returnBusy}')
    expect(teacher).toContain('aria-busy={reviewBusy}')
    expect(teacher).toContain('pixel-review-control-icon')
    expect(teacher).toContain('reviewBusy ? <span className="pixel-review-spinner" /> : null')
    expect(styles).toContain('.pixel-panel-control--review.is-busy .pixel-review-control-icon')
    expect(styles).toContain('border-radius: 50%')
    expect(styles).toContain('animation: pixel-review-spin .7s linear infinite')
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
  })

  it('renders Module 2 evidence and uses explicit actions instead of chat inference', async () => {
    const [teacher, progress, styles] = await Promise.all([
      source('src/renderer/src/components/TeacherWorkspace.tsx'),
      source('src/renderer/src/components/PracticeProgress.tsx'),
      source('src/renderer/src/styles.css')
    ])

    expect(progress).toContain('planning.artifacts.map')
    expect(progress).toContain('planning.invalidations.map')
    expect(progress).toContain('planning.unexpectedChangedPaths')
    expect(progress).toContain('Ghi nhận prompt của tôi')
    expect(progress).toContain('Duyệt và lưu PRD')
    expect(progress).toContain('Xác nhận bốn điểm alignment')
    expect(progress).toContain('Ghi nhận quyết định phạm vi')
    expect(progress).toContain('workspace.completionDestination')
    expect(teacher).toContain('window.courseCompanion.recordPlanningAction')
    expect(teacher).toContain('workspace?.planning?.invalidations[0]')
    expect(teacher).not.toMatch(/message\.content.*recordPlanningAction/)
    expect(styles).toContain('.practice-progress.is-compact .practice-artifacts')
    expect(styles).toContain('.practice-planning button:focus-visible')
  })
})
