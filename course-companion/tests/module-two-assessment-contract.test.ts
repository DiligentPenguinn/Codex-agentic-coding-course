import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

type Source = {
  kind: 'authoritative-source' | 'curriculum-judgment'
  label: string
  url: string
  basis: string
}

type Question = {
  id: string
  sceneId: string
  type: 'multiple-choice' | 'short-answer' | 'artifact-answer'
  prompt: string
  choices?: string[]
  answerIndex?: number
  criteria?: string[]
  explanation: string
  source: Source
}

type Quiz = {
  delivery: {
    mode: string
    doNotStackQuestions: boolean
    feedbackTiming: string
    feedbackPolicy: string
    learnerOwnedAnswerPolicy: string
    practiceBoundary: string
  }
  masteryPolicy: {
    configurationKey: string
    publishThreshold: boolean
    requiresCurrentArtifactDigests: boolean
    requiresPracticeReceipt: boolean
  }
  groups: Array<{
    id: string
    placement: string
    mode: 'formative' | 'mastery'
    passingScore?: number
    questions: Question[]
  }>
}

async function loadQuiz(): Promise<Quiz> {
  const path = resolve(
    process.cwd(),
    '..',
    'pilot-workspace',
    'course',
    'quizzes',
    'module-2.quiz.json'
  )
  return JSON.parse(await readFile(path, 'utf8')) as Quiz
}

describe('Module 2 portfolio assessment contract', () => {
  it('delivers exactly one question before revealing feedback', async () => {
    const quiz = await loadQuiz()

    expect(quiz.delivery).toMatchObject({
      mode: 'one-question-at-a-time',
      doNotStackQuestions: true,
      feedbackTiming: 'after-answer'
    })
    expect(quiz.delivery.feedbackPolicy).toMatch(/sau khi Learner đã gửi câu trả lời/i)
  })

  it('uses retrieval after every milestone and a delayed check near the gate', async () => {
    const quiz = await loadQuiz()
    const formativePlacements = quiz.groups
      .filter((group) => group.mode === 'formative')
      .map((group) => group.placement)

    expect(formativePlacements).toEqual([
      'after-m2-portfolio-brief',
      'after-m2-content-evidence-inventory',
      'after-m2-visual-reference',
      'after-m2-portfolio-prd',
      'before-m2-mastery'
    ])
  })

  it('reviews the four taught lesson parts through contextual, plain-language scenarios', async () => {
    const quiz = await loadQuiz()
    const final = quiz.groups.find((group) => group.id === 'final-assessment')
    const scenarios = final?.questions.filter((question) => question.type === 'multiple-choice') ?? []
    const scenario = (id: string) => {
      const question = scenarios.find((candidate) => candidate.id === id)
      expect(question).toBeDefined()
      return [question?.prompt, ...(question?.choices ?? []), question?.explanation].join(' ')
    }

    expect(scenarios).toHaveLength(5)
    expect(scenario('mastery-1')).toMatch(/lỗi chính tả.*lập kế hoạch.*sản phẩm mới/i)
    expect(scenario('mastery-3')).toMatch(/URL nguồn.*cách thể hiện riêng.*sao chép/i)
    expect(scenario('mastery-4')).toMatch(/PRD.*dành cho ai.*lựa chọn kỹ thuật/i)
    expect(scenario('mastery-5')).toMatch(/mơ hồ.*tự mở rộng.*trước khi bạn duyệt/i)
    expect(scenario('mastery-6')).toMatch(/hỏi bạn từng câu/i)
    expect(scenario('mastery-6')).toMatch(/giữ quyền quyết định/i)
    expect(new Set(scenarios.map((question) => question.answerIndex)).size).toBeGreaterThan(1)

    for (const question of scenarios) {
      expect(question.prompt.length).toBeGreaterThan(100)
      expect([question.prompt, ...(question.choices ?? []), question.explanation].join(' '))
        .not.toMatch(/\bgate\b|\brequirement\b|\bartifact\b|\bLearner\b/i)
    }
  })

  it('requires four learner-owned answers that cannot pass by repeating the worked example', async () => {
    const quiz = await loadQuiz()
    const final = quiz.groups.find((group) => group.id === 'final-assessment')
    const learnerOwned = final?.questions.filter((question) => question.type === 'short-answer') ?? []

    expect(learnerOwned.map((question) => question.id)).toEqual([
      'mastery-audience-choice',
      'mastery-scope-boundary',
      'mastery-evidence-gap',
      'mastery-requirement-validation'
    ])
    expect(learnerOwned.map((question) => question.prompt)).toEqual([
      expect.stringContaining('portfolio-brief.md'),
      expect.stringContaining('PRD.md'),
      expect.stringContaining('content-evidence-inventory.md'),
      expect.stringContaining('implementation-plan.md')
    ])
    for (const question of learnerOwned) {
      expect(question.criteria?.join(' ')).toMatch(/hiện tại|thật/i)
      expect(`${question.criteria?.join(' ')} ${question.explanation}`).toMatch(/ví dụ Mai/i)
    }
  })

  it('keeps mastery configurable and independent from current Practice evidence', async () => {
    const quiz = await loadQuiz()
    const final = quiz.groups.find((group) => group.id === 'final-assessment')

    expect(final?.passingScore).toBeUndefined()
    expect(quiz.masteryPolicy).toEqual(expect.objectContaining({
      configurationKey: 'course.module-2.mastery.minimum',
      publishThreshold: false,
      requiresCurrentArtifactDigests: true,
      requiresPracticeReceipt: true
    }))
    expect(quiz.delivery.practiceBoundary).toMatch(/hai điều kiện độc lập/i)
    expect(quiz.delivery.practiceBoundary).toMatch(/không điều kiện nào thay thế/i)
  })

  it('traces every answer to an authoritative source or named curriculum judgment', async () => {
    const quiz = await loadQuiz()
    const questions = quiz.groups.flatMap((group) => group.questions)

    for (const question of questions) {
      expect(question.source.basis.length).toBeGreaterThan(40)
      if (question.source.kind === 'authoritative-source') {
        expect(new URL(question.source.url).protocol).toBe('https:')
      } else {
        expect(question.source.label).toMatch(/Quyết định chương trình|Kết luận kiểm toán nguồn/)
        expect(question.source.url).toMatch(/^docs\/planning\/portfolio-course-v1\//)
      }
    }
  })
})
