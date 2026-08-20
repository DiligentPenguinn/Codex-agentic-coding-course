import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('lesson summary presentation', () => {
  it('omits right-side summary panels while preserving lesson illustrations', async () => {
    const source = await readFile(resolve(
      process.cwd(),
      'src/renderer/src/surfaces/LearningWindow.tsx'
    ), 'utf8')

    expect(source).not.toContain('<aside className="pixel-consequence"')
    expect(source).not.toContain('<div className="pixel-scene-summary">')
    expect(source).toContain('const lessonVisual = sceneVisuals[displayedSceneId]')
    expect(source).toContain('className={`pixel-lesson-visual')
  })
})
