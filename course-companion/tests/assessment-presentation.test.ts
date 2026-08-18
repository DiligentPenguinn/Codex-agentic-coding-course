import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('assessment question presentation', () => {
  it('renders every module question without standalone guidance chrome', async () => {
    const learningWindow = await readFile(resolve(
      process.cwd(),
      'src/renderer/src/surfaces/LearningWindow.tsx'
    ), 'utf8')

    expect(learningWindow).toContain('const isAssessmentQuestionPage = Boolean(assessmentQuestion && assessmentGroup)')
    expect(learningWindow).toContain('&& !isAssessmentQuestionPage')
    expect(learningWindow).toContain('aria-label={isAssessmentQuestionPage ? `Câu hỏi Module ${scene.lessonId.slice(-1)}` : undefined}')
    expect(learningWindow).toContain('questionOnly={isAssessmentQuestionPage}')
  })
})
