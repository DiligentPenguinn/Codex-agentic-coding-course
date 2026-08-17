import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(process.cwd(), '..')

async function source(relativePath: string): Promise<string> {
  return readFile(resolve(repositoryRoot, relativePath), 'utf8')
}

describe('session-only content review mode', () => {
  it('reviews Modules 2-4 without calling the persistence API or Practice actions', async () => {
    const learningWindow = await source('course-companion/src/renderer/src/surfaces/LearningWindow.tsx')
    const reviewBranch = learningWindow.indexOf('if (contentReviewMode) {\n      const reviewed = previewProgress')
    const persistedSave = learningWindow.indexOf('await window.courseCompanion.saveProgress', reviewBranch)
    expect(reviewBranch).toBeGreaterThan(-1)
    expect(persistedSave).toBeGreaterThan(reviewBranch)
    expect(learningWindow).toContain("'planning-retrieval': contentReviewMode ? 'module-2-portfolio-mastery'")
    expect(learningWindow).toContain("'enhancement-retrieval': contentReviewMode ? 'module-3-portfolio-mastery'")
    expect(learningWindow).toContain("'ownership-transfer-retrieval': contentReviewMode ? 'module-4-portfolio-mastery'")
    expect(learningWindow).toContain('Practice đang tắt trong chế độ duyệt nội dung')
    expect(learningWindow).toContain('savedProgressBeforeContentReview')
  })

  it('leaves the atomic Module 2 and Module 3 gates intact', async () => {
    const repository = await source('course-companion/electron/main/progress-repository.ts')
    expect(repository).toContain('assertModuleThreeUnlockGate(update')
    expect(repository).toContain('Module 3 requires an atomic Module 2 completion receipt')
    expect(repository).toContain('assertModuleFourUnlockGate(update')
    expect(repository).toContain('Module 4 requires an atomic Module 3 completion receipt')
  })
})
