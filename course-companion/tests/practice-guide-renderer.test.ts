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
})

