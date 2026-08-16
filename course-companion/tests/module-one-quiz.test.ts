import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

type QuizQuestion = {
  id: string
  sceneId?: string
  type: 'multiple-choice' | 'short-answer' | 'artifact-answer'
  bloomLevel?: number
  bloomLabel?: string
  choices?: string[]
  answerIndex?: number
  criteria?: string[]
  expectedSignals?: string[]
  explanation?: string
  source: {
    kind?: 'authoritative-source' | 'curriculum-judgment'
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

type MasteryPolicy = {
  strategy: 'pilot-configured'
  configurationKey: string
  publishThreshold: boolean
  fallback: string
  requiresCurrentArtifactDigests: boolean
  requiresPracticeReceipt: boolean
  manualReviewTypes: string[]
}

async function loadQuiz(moduleId: 'module-1' | 'module-2'): Promise<{
  passingScore?: number
  questions?: QuizQuestion[]
  groups?: QuizGroup[]
  masteryPolicy?: MasteryPolicy
}> {
  const path = join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', `${moduleId}.quiz.json`)
  return JSON.parse(await readFile(path, 'utf8')) as {
    passingScore?: number
    questions?: QuizQuestion[]
    groups?: QuizGroup[]
    masteryPolicy?: MasteryPolicy
  }
}

type CourseLesson = {
  id: string
  titleVi: string
  estimatedMinutes?: number
  checkpoints: string[]
}

type CourseModule = {
  id: string
  kind: 'introduction' | 'module'
  estimatedMinutes?: number
  checkpoints: string[]
  lessons: CourseLesson[]
}

async function loadCourseStructure(): Promise<{ modules: CourseModule[] }> {
  const path = join(process.cwd(), '..', 'pilot-workspace', 'course', 'course-structure.json')
  return JSON.parse(await readFile(path, 'utf8')) as { modules: CourseModule[] }
}

describe('Course module assessment banks', () => {
  it('keeps the introduction separate and exposes setup before planning', async () => {
    const course = await loadCourseStructure()
    const introduction = course.modules.find((module) => module.id === 'intro')
    const moduleOne = course.modules.find((module) => module.id === 'module-1')
    const moduleTwo = course.modules.find((module) => module.id === 'module-2')

    expect(introduction?.kind).toBe('introduction')
    expect(introduction?.lessons).toHaveLength(1)
    expect(moduleOne?.kind).toBe('module')
    expect(moduleOne?.lessons.map((lesson) => lesson.titleVi)).toEqual([
      'Codex và coding agent',
      'Áp dụng cấu hình Codex',
      'Thực hành và ôn tập cuối Module 1'
    ])
    expect(moduleTwo?.lessons.map((lesson) => lesson.titleVi)).toEqual([
      'Tạo bản mô tả ngắn cho portfolio',
      'Kiểm kê nội dung và bằng chứng',
      'Chọn một tham chiếu hình ảnh',
      'Tạo và duyệt PRD cho portfolio',
      'Tạo hợp đồng xây dựng và kiểm chứng'
    ])
    expect(moduleOne?.lessons.reduce((total, lesson) => total + (lesson.estimatedMinutes ?? 0), 0)).toBe(38)
    expect(moduleTwo?.lessons.every((lesson) => lesson.estimatedMinutes === undefined)).toBe(true)
    expect(moduleOne?.lessons.flatMap((lesson) => lesson.checkpoints)).toEqual(moduleOne?.checkpoints)
    expect(moduleTwo?.lessons.flatMap((lesson) => lesson.checkpoints)).toEqual(moduleTwo?.checkpoints)
  })

  it('provides one sourced illustration for every runnable module lesson', async () => {
    const course = await loadCourseStructure()
    const lessonIds = course.modules
      .filter((module) => module.id === 'module-1')
      .flatMap((module) => module.lessons.map((lesson) => lesson.id))
    const visualDirectory = join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'assets',
      'lesson-visuals'
    )
    const visualFiles = (await readdir(visualDirectory))
      .filter((file) => file.startsWith('m1-') && file.endsWith('.webp'))
      .sort()
    const sources = await readFile(join(visualDirectory, 'SOURCES.md'), 'utf8')

    expect(visualFiles).toEqual(lessonIds.map((lessonId) => `${lessonId}.webp`).sort())
    for (const visualFile of visualFiles) expect(sources).toContain(`\`${visualFile}\``)
  })

  it('places retrieval checks after each milestone and delayed checks near the gate', async () => {
    const quiz = await loadQuiz('module-2')
    expect(Object.fromEntries((quiz.groups ?? []).map((group) => [group.id, group.questions.length]))).toEqual({
      'brief-retrieval': 2,
      'evidence-retrieval': 2,
      'reference-retrieval': 2,
      'prd-retrieval': 2,
      'planning-retrieval': 2,
      'final-assessment': 10
    })
    expect((quiz.groups ?? []).flatMap((group) => group.questions)).toHaveLength(20)
  })

  it('gives every question an answer contract and approved source', async () => {
    const setupQuiz = await loadQuiz('module-1')
    const planningQuiz = await loadQuiz('module-2')
    const setupQuestions = setupQuiz.questions ?? []
    const planningQuestions = (planningQuiz.groups ?? []).flatMap((group) => group.questions)
    const questions = [...setupQuestions, ...planningQuestions]
    const allowedHosts = new Set([
      'developers.openai.com',
      'docs.github.com',
      'learn.chatgpt.com',
      'openai.com',
      'microsoft.github.io',
      'www.freecodecamp.org',
      'www.atlassian.com',
      'www.gov.uk',
      'www.w3.org'
    ])

    expect(new Set(questions.map((question) => question.id)).size).toBe(questions.length)
    expect(new Set(planningQuestions.map((question) => question.sceneId)).size).toBe(planningQuestions.length)

    for (const question of questions) {
      if (question.explanation) expect(question.explanation.length).toBeGreaterThan(40)
      expect(question.source.basis.length).toBeGreaterThan(40)
      if (question.source.kind === 'curriculum-judgment') {
        expect(question.source.label).toMatch(/Quyết định chương trình|Kết luận kiểm toán nguồn/)
        expect(question.source.url).toMatch(/^docs\/planning\/portfolio-course-v1\/(?:DECISION_LOG|RESEARCH_SOURCES)\.md#/)
      } else {
        expect(allowedHosts.has(new URL(question.source.url).host)).toBe(true)
      }
      if (question.type === 'multiple-choice') {
        expect(question.choices).toHaveLength(4)
        expect(question.answerIndex).toBeGreaterThanOrEqual(0)
        expect(question.answerIndex).toBeLessThan(4)
      } else {
        expect((question.criteria ?? question.expectedSignals)?.length).toBeGreaterThanOrEqual(3)
      }
    }
  })

  it('keeps Module 1 fixed while making the Module 2 threshold pilot-configurable', async () => {
    const setupQuiz = await loadQuiz('module-1')
    const planningQuiz = await loadQuiz('module-2')
    const setupQuestions = setupQuiz.questions ?? []
    const finalGroup = planningQuiz.groups?.find((group) => group.id === 'final-assessment')
    expect(setupQuiz.passingScore).toBe(4)
    expect(setupQuestions.filter((question) => question.type === 'multiple-choice')).toHaveLength(3)
    expect(setupQuestions.filter((question) => question.type === 'short-answer')).toHaveLength(2)
    expect(finalGroup?.passingScore).toBeUndefined()
    expect(planningQuiz.masteryPolicy).toMatchObject({
      strategy: 'pilot-configured',
      configurationKey: 'course.module-2.mastery.minimum',
      publishThreshold: false,
      fallback: 'manual-review-required',
      requiresCurrentArtifactDigests: true,
      requiresPracticeReceipt: true
    })
    expect(finalGroup?.questions.filter((question) => question.type === 'multiple-choice')).toHaveLength(6)
    expect(finalGroup?.questions.filter((question) => question.type === 'short-answer')).toHaveLength(4)
    expect(finalGroup?.questions.filter((question) => question.type === 'artifact-answer')).toHaveLength(0)
  })

  it('keeps all five Module 1 review questions at Bloom level 2 or higher', async () => {
    const setupQuiz = await loadQuiz('module-1')
    const setupQuestions = setupQuiz.questions ?? []

    expect(setupQuestions).toHaveLength(5)
    expect(setupQuestions.map((question) => question.bloomLevel)).toEqual([2, 3, 3, 3, 4])
    expect(setupQuestions.every((question) => (question.bloomLevel ?? 0) >= 2)).toBe(true)
    expect(setupQuestions.every((question) => Boolean(question.bloomLabel))).toBe(true)
  })
})
