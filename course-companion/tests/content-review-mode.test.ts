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
    expect(learningWindow).toContain("'m3-final-assessment': 'module-3-mastery-summary'")
    expect(learningWindow).not.toContain('ownership-transfer-retrieval')
    expect(learningWindow).not.toContain('contentReviewSlideDestinationByScene')
    expect(learningWindow).not.toContain("displayedSceneId === 'module-2-portfolio-folder'")
    expect(learningWindow).not.toContain("progress.sceneId === 'module-2-implementation-plan-intro'")
    expect(learningWindow).toContain("label: 'Bỏ qua Practice · Duyệt bài ôn tập', sceneId: 'module-2-portfolio-mastery'")
    expect(learningWindow).toContain('Practice đang tắt trong chế độ duyệt nội dung')
    expect(learningWindow).toContain('savedProgressBeforeContentReview')
  })

  it('offers a session-only bypass at every current Practice boundary', async () => {
    const learningWindow = await source('course-companion/src/renderer/src/surfaces/LearningWindow.tsx')
    expect(learningWindow).toContain("'module-1-setup-checklist': {\n    label: 'Bỏ qua Practice · Duyệt bài trắc nghiệm',\n    sceneId: 'module-1-mastery'")
    expect(learningWindow).toContain("'module-2-portfolio-practice': {\n    label: 'Bỏ qua Practice · Duyệt Module 3'")
    expect(learningWindow).toContain("'module-3-portfolio-practice': {\n    label: 'Bỏ qua Practice · Duyệt câu hỏi cuối bài'")
    expect(learningWindow).toContain("'module-4-portfolio-practice': {\n    label: 'Bỏ qua Practice · Duyệt bài ôn tập'")
    expect(learningWindow).toContain("const practiceReviewDestination = contentReviewMode\n    ? displayedSceneId === 'module-2-portfolio-practice'")
    expect(learningWindow).toContain(': practiceReviewDestinationByScene[displayedSceneId]\n    : undefined')
    expect(learningWindow).toContain('onClick={() => startContentReviewAtScene(practiceReviewDestination.sceneId)}')
    expect(learningWindow).toContain('Do not merge this map or its button into the original branch')
  })

  it('renders assessment questions from every module without standalone guidance chrome', async () => {
    const learningWindow = await source('course-companion/src/renderer/src/surfaces/LearningWindow.tsx')
    expect(learningWindow).toContain('const isAssessmentQuestionPage = Boolean(assessmentQuestion && assessmentGroup)')
    expect(learningWindow).toContain('&& !isAssessmentQuestionPage')
    expect(learningWindow).toContain('isAssessmentQuestionPage ? `Câu hỏi Module ${scene.lessonId.slice(-1)}` : undefined}')
    expect(learningWindow).toContain('questionOnly={isAssessmentQuestionPage}')
  })

  it('records the content-only merge boundary for the temporary review branch', async () => {
    const plan = await source('docs/planning/portfolio-course-implementation-plan.md')
    expect(plan).toContain('### Merge boundary — bring back content, not Practice bypasses')
    expect(plan).toContain('`practiceReviewDestinationByScene`')
    expect(plan).toContain('Do not cherry-pick a whole mixed commit')
    expect(plan).toContain('or merge a whole mixed file')
  })

  it('leaves the atomic Module 2 and Module 3 gates intact', async () => {
    const repository = await source('course-companion/electron/main/progress-repository.ts')
    expect(repository).toContain('assertModuleThreeUnlockGate(update')
    expect(repository).toContain('Module 3 requires an atomic Module 2 completion receipt')
    expect(repository).toContain('assertModuleFourUnlockGate(update')
    expect(repository).toContain('Module 4 requires an atomic Module 3 completion receipt')
  })
})
