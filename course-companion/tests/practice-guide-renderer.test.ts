import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = (path: string) => readFile(join(process.cwd(), path), 'utf8')

describe('PracticeGuide renderer', () => {
  it('provides an accessible modal, keyboard pause, and focus containment', async () => {
    const component = await source('src/renderer/src/components/PracticeGuide.tsx')
    expect(component).toContain("role={isDialog ? 'dialog' : 'region'}")
    expect(component).toContain('aria-modal={isDialog || undefined}')
    expect(component).toContain("event.key === 'Escape'")
    expect(component).toContain("event.key !== 'Tab'")
    expect(component).toContain('restoreFocusRef')
    expect(component).toContain('Esc để tạm dừng')
  })

  it('renders visible progress, skip, missing-anchor fallback, and mastery confirmation', async () => {
    const component = await source('src/renderer/src/components/PracticeGuide.tsx')
    expect(component).toContain('BƯỚC {view.step}/{view.stepCount}')
    expect(component).toContain("update('skip')")
    expect(component).toContain('is-fallback')
    expect(component).toContain('practice-guide-mastery')
    expect(component).toContain("update('dismiss-confirmation')")
  })

  it('uses stable semantic anchors and reduced-motion styling', async () => {
    const anchors = await source('src/renderer/src/components/practice-guide-anchors.ts')
    const styles = await source('src/renderer/src/styles.css')
    expect(anchors).toContain("data-practice-guide-anchor")
    expect(anchors).not.toContain('querySelector(id)')
    expect(styles).toContain('@media (prefers-reduced-motion: reduce)')
    expect(styles).toContain('.practice-guide.is-coach-mark')
  })

  it('integrates with the unified Practice review controls without a Practice chat stage', async () => {
    const teacher = await source('src/renderer/src/components/TeacherWorkspace.tsx')
    const progress = await source('src/renderer/src/components/PracticeProgress.tsx')
    expect(teacher).toContain("practiceGuideAnchor('review-progress')")
    expect(teacher).not.toContain("practiceGuideAnchor('teacher-tab')")
    expect(teacher).not.toContain("practiceGuideAnchor('progress-tab')")
    expect(teacher).toContain('CẬP NHẬT & DUYỆT TIẾN ĐỘ')
    expect(teacher).toContain('Xem lại hướng dẫn Practice')
    expect(teacher).toContain('!practiceGuide.replay')
    expect(teacher).toContain("practiceGuide.status === 'skipped'")
    expect(teacher).toContain("practiceGuide.status === 'completed'")
    expect(teacher).toContain('reviewPractice()')
    expect(teacher).toContain('returnPassedPractice()')
    expect(progress).toContain("practiceGuideAnchor('configuration-evidence')")
    expect(progress).toContain("practiceGuideAnchor('return-to-course')")
  })

  it('renders the approved step-five Next action without treating it as review', async () => {
    const [definition, component, teacher] = await Promise.all([
      source('content/practice-guides/m1-practice-mode-first-run.json'),
      source('src/renderer/src/components/PracticeGuide.tsx'),
      source('src/renderer/src/components/TeacherWorkspace.tsx')
    ])
    expect(definition).toContain('"id": "request-review"')
    expect(definition).toContain('"advancement": "continue"')
    expect(definition).toContain('"primaryLabel": "Tiếp"')
    expect(component).not.toContain("view.currentStageId === 'request-review' ? 'review-requested'")
    expect(component).toContain('await onUpdate({ type, expectedStageId: view.currentStageId! }')
    expect(component).toContain('disabled={updating}')
    expect(teacher).toContain('<PracticeGuide view={practiceGuide} onUpdate={updatePracticeGuide} />')
  })

  it('restores and dismisses mastery confirmation without changing lesson navigation', async () => {
    const learning = await source('src/renderer/src/surfaces/LearningWindow.tsx')
    expect(learning).toContain("loadPracticeGuide({ surface: 'learning' })")
    expect(learning).toContain('<PracticeGuide view={practiceGuide}')
    expect(learning).toContain('setPracticeGuide(null)')
    const component = await source('src/renderer/src/components/PracticeGuide.tsx')
    expect(component).toContain("update('dismiss-confirmation')")
    expect(component).toContain('role="status"')
  })
})
