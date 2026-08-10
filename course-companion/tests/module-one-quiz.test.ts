import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

type QuizQuestion = {
  id: string
  sceneId: string
  type: 'multiple-choice' | 'short-answer' | 'artifact-answer'
  choices?: string[]
  answerIndex?: number
  criteria?: string[]
  explanation: string
  source: {
    label: string
    url: string
    basis: string
  }
}

type QuizGroup = {
  id: string
  mode: 'formative' | 'mastery'
  passingScore?: number
  questions: QuizQuestion[]
}

async function loadQuiz(): Promise<{ groups: QuizGroup[] }> {
  const path = join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-1.quiz.json')
  return JSON.parse(await readFile(path, 'utf8')) as { groups: QuizGroup[] }
}

type CourseLesson = {
  id: string
  titleVi: string
  estimatedMinutes: number
  checkpoints: string[]
}

type CourseModule = {
  id: string
  kind: 'introduction' | 'module'
  estimatedMinutes: number
  checkpoints: string[]
  lessons: CourseLesson[]
}

async function loadCourseStructure(): Promise<{ modules: CourseModule[] }> {
  const path = join(process.cwd(), '..', 'pilot-workspace', 'course', 'course-structure.json')
  return JSON.parse(await readFile(path, 'utf8')) as { modules: CourseModule[] }
}

describe('Module 1 sourced assessment bank', () => {
  it('keeps the introduction separate and groups Module 1 into six complete lessons', async () => {
    const course = await loadCourseStructure()
    const introduction = course.modules.find((module) => module.id === 'intro')
    const moduleOne = course.modules.find((module) => module.id === 'module-1')

    expect(introduction?.kind).toBe('introduction')
    expect(introduction?.lessons).toHaveLength(1)
    expect(moduleOne?.kind).toBe('module')
    expect(moduleOne?.lessons.map((lesson) => lesson.titleVi)).toEqual([
      'Khi nào cần planning',
      'Từ ý tưởng đến PRD',
      'Viết prompt để tạo PRD',
      'Xem xét và duyệt PRD',
      'Từ PRD đến implementation plan',
      'Kiểm tra và hoàn thành Module 1'
    ])
    expect(moduleOne?.lessons.reduce((total, lesson) => total + lesson.estimatedMinutes, 0)).toBe(110)
    expect(moduleOne?.lessons.flatMap((lesson) => lesson.checkpoints)).toEqual(moduleOne?.checkpoints)
  })

  it('keeps the approved 3 + 3 + 2 + 15 assessment rhythm', async () => {
    const quiz = await loadQuiz()
    expect(Object.fromEntries(quiz.groups.map((group) => [group.id, group.questions.length]))).toEqual({
      'planning-prd-check': 3,
      'prompt-check': 3,
      'implementation-plan-check': 2,
      'final-assessment': 15
    })
    expect(quiz.groups.flatMap((group) => group.questions)).toHaveLength(23)
  })

  it('gives every question a unique scene, answer contract, explanation, and official source', async () => {
    const quiz = await loadQuiz()
    const questions = quiz.groups.flatMap((group) => group.questions)
    const allowedHosts = new Set([
      'developers.openai.com',
      'docs.github.com',
      'learn.chatgpt.com',
      'microsoft.github.io',
      'www.atlassian.com'
    ])

    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length)
    expect(new Set(questions.map((question) => question.sceneId)).size).toBe(questions.length)

    for (const question of questions) {
      expect(question.explanation.length).toBeGreaterThan(40)
      expect(question.source.basis.length).toBeGreaterThan(40)
      expect(allowedHosts.has(new URL(question.source.url).host)).toBe(true)
      if (question.type === 'multiple-choice') {
        expect(question.choices).toHaveLength(4)
        expect(question.answerIndex).toBeGreaterThanOrEqual(0)
        expect(question.answerIndex).toBeLessThan(4)
      } else {
        expect(question.criteria?.length).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('uses the approved mixed format and an explicit 80 percent final threshold', async () => {
    const quiz = await loadQuiz()
    const finalGroup = quiz.groups.find((group) => group.id === 'final-assessment')
    expect(finalGroup?.passingScore).toBe(0.8)
    expect(finalGroup?.questions.filter((question) => question.type === 'multiple-choice')).toHaveLength(10)
    expect(finalGroup?.questions.filter((question) => question.type === 'short-answer')).toHaveLength(3)
    expect(finalGroup?.questions.filter((question) => question.type === 'artifact-answer')).toHaveLength(2)
  })
})
