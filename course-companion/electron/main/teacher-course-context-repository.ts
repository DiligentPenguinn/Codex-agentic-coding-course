import { createHash } from 'node:crypto'
import { readFile, realpath, stat } from 'node:fs/promises'
import { isAbsolute, join, relative, resolve } from 'node:path'
import {
  courseLessonIdForScene,
  sceneCheckpoint,
  type LearnerProgress,
  type LessonId
} from '../../shared/contracts'

export const MAX_TEACHER_COURSE_CHARACTERS = 160_000

const MODULE_SOURCE_PATHS: Record<LessonId, readonly string[]> = {
  intro: [
    'course/lessons/intro.vi.md',
    'course/lesson-scripts/intro.script.vi.md',
    'course/prompts/start-intro.vi.md',
    'course/quizzes/intro.quiz.json'
  ],
  'module-1': [
    'course/lessons/module-1.vi.md',
    'course/lesson-scripts/module-1.script.vi.md',
    'course/prompts/start-module-1.vi.md',
    'course/quizzes/module-1.quiz.json'
  ],
  'module-2': [
    'course/lessons/module-2.vi.md',
    'course/lesson-scripts/module-2.script.vi.md',
    'course/prompts/start-module-2.vi.md',
    'course/quizzes/module-2.quiz.json'
  ],
  'module-3': [
    'course/lessons/module-3.vi.md',
    'course/lesson-scripts/module-3.script.vi.md',
    'course/prompts/start-module-3.vi.md',
    'course/quizzes/module-3.quiz.json'
  ],
  'module-4': [
    'course/lessons/module-4.vi.md',
    'course/lesson-scripts/module-4.script.vi.md',
    'course/prompts/start-module-4.vi.md',
    'course/quizzes/module-4.quiz.json'
  ]
}

const SHARED_SOURCE_PATHS = [
  'course/course-structure.json',
  'course/pedagogy/teacher/teacher-system-prompt.vi.md',
  'course/pedagogy/teacher/scripted-delivery-contract.vi.md',
  'course/pedagogy/rubrics/hint-ladder.vi.md',
  'course/pedagogy/rubrics/quiz-delivery-protocol.vi.md',
  'course/pedagogy/rubrics/mastery-rubric.vi.md',
  '.agents/skills/triet-pedagogy/SKILL.md'
] as const

const PEDAGOGY_SKILL_PATH = '.agents/skills/triet-pedagogy/SKILL.md'

export type TeacherCourseSource = {
  path: string
  content: string
  digest: string
  characterCount: number
}

export type TeacherActiveAssessment = {
  groupId: string
  mode: 'formative' | 'mastery'
  questionId: string
  sceneId: string
  status: 'open' | 'answered'
  learnerResult?: string
  question: Record<string, unknown>
}

export type TeacherCoursePackage = {
  schemaVersion: 1
  moduleId: LessonId
  sources: TeacherCourseSource[]
  characterCount: number
  digest: string
  pedagogyInstructions: string
  activeAssessment: TeacherActiveAssessment | null
}

export class TeacherCourseContextError extends Error {
  constructor(
    readonly code:
      | 'COURSE_CONTEXT_INVALID_PROGRESS'
      | 'COURSE_CONTEXT_ROOT_UNAVAILABLE'
      | 'COURSE_CONTEXT_SOURCE_UNAVAILABLE'
      | 'COURSE_CONTEXT_SOURCE_INVALID'
      | 'COURSE_CONTEXT_SOURCE_ESCAPE'
      | 'COURSE_CONTEXT_SOURCE_CHANGED'
      | 'COURSE_CONTEXT_TOO_LARGE',
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'TeacherCourseContextError'
  }
}

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function activeAssessment(
  progress: LearnerProgress,
  quizContent: string
): TeacherActiveAssessment | null {
  let quiz: Record<string, unknown> | null
  try {
    quiz = record(JSON.parse(quizContent))
  } catch (cause) {
    throw new TeacherCourseContextError(
      'COURSE_CONTEXT_SOURCE_INVALID',
      'The active module quiz is malformed.',
      { cause }
    )
  }
  if (!quiz || quiz.moduleId !== progress.currentLessonId) {
    throw new TeacherCourseContextError(
      'COURSE_CONTEXT_SOURCE_INVALID',
      'The active module quiz does not match authoritative learner progress.'
    )
  }

  let selected: { groupId: string; mode: 'formative' | 'mastery'; question: Record<string, unknown> } | null = null
  if (progress.currentLessonId === 'module-1' && Array.isArray(quiz.questions)) {
    const match = /^module-1-final-(\d+)$/.exec(progress.sceneId)
    const question = match ? record(quiz.questions[Number(match[1]) - 1]) : null
    if (question) selected = { groupId: 'setup-final-assessment', mode: 'mastery', question }
  } else if (Array.isArray(quiz.groups)) {
    for (const candidate of quiz.groups) {
      const group = record(candidate)
      if (!group || !Array.isArray(group.questions)) continue
      const question = group.questions.map(record).find((item) => item?.sceneId === progress.sceneId)
      if (question && typeof group.id === 'string') {
        selected = {
          groupId: group.id,
          mode: group.mode === 'mastery' ? 'mastery' : 'formative',
          question
        }
        break
      }
    }
  }
  if (!selected || typeof selected.question.id !== 'string') return null
  const questionId = selected.question.id
  const learnerResult = progress.decisions[`assessment:${questionId}`]
  return {
    groupId: selected.groupId,
    mode: selected.mode,
    questionId,
    sceneId: progress.sceneId,
    status: learnerResult === undefined ? 'open' : 'answered',
    ...(learnerResult === undefined ? {} : { learnerResult }),
    question: structuredClone(selected.question)
  }
}

function staysInside(root: string, target: string): boolean {
  const path = relative(root, target)
  return path === '' || (!path.startsWith('..') && !isAbsolute(path))
}

function validateProgress(progress: LearnerProgress): void {
  const scenePrefix = progress.currentLessonId === 'intro' ? 'intro-' : `${progress.currentLessonId}-`
  if (!progress.sceneId.startsWith(scenePrefix)
    || sceneCheckpoint[progress.sceneId] !== progress.checkpointId
    || courseLessonIdForScene(progress.sceneId) !== progress.currentCourseLessonId) {
    throw new TeacherCourseContextError(
      'COURSE_CONTEXT_INVALID_PROGRESS',
      'Authoritative learner progress does not identify one valid course scene.'
    )
  }
}

export class TeacherCourseContextRepository {
  constructor(
    private readonly pilotWorkspaceRoot: string,
    private readonly maximumCharacters = MAX_TEACHER_COURSE_CHARACTERS,
    private readonly beforeSnapshotVerification: () => Promise<void> = async () => undefined
  ) {}

  async load(progress: LearnerProgress): Promise<TeacherCoursePackage> {
    validateProgress(progress)
    let canonicalRoot: string
    try {
      canonicalRoot = await realpath(resolve(this.pilotWorkspaceRoot))
    } catch (cause) {
      throw new TeacherCourseContextError(
        'COURSE_CONTEXT_ROOT_UNAVAILABLE',
        'The authoritative course workspace is unavailable.',
        { cause }
      )
    }

    const paths = [...MODULE_SOURCE_PATHS[progress.currentLessonId], ...SHARED_SOURCE_PATHS]
    const sources: TeacherCourseSource[] = []
    for (const sourcePath of paths) {
      sources.push(await this.loadSource(canonicalRoot, sourcePath))
    }
    await this.beforeSnapshotVerification()
    for (const source of sources) {
      let verified: TeacherCourseSource
      try {
        verified = await this.loadSource(canonicalRoot, source.path)
      } catch (cause) {
        if (cause instanceof TeacherCourseContextError
          && cause.code !== 'COURSE_CONTEXT_SOURCE_ESCAPE') {
          throw new TeacherCourseContextError(
            'COURSE_CONTEXT_SOURCE_CHANGED',
            `Teacher course source changed while the package was assembled: ${source.path}`,
            { cause }
          )
        }
        throw cause
      }
      if (verified.digest !== source.digest || verified.characterCount !== source.characterCount) {
        throw new TeacherCourseContextError(
          'COURSE_CONTEXT_SOURCE_CHANGED',
          `Teacher course source changed while the package was assembled: ${source.path}`
        )
      }
    }
    const characterCount = sources.reduce((total, source) => total + source.characterCount, 0)
    if (characterCount > this.maximumCharacters) {
      throw new TeacherCourseContextError(
        'COURSE_CONTEXT_TOO_LARGE',
        'The authoritative course package exceeds the supported Teacher context size.'
      )
    }
    const pedagogyInstructions = sources.find((source) => source.path === PEDAGOGY_SKILL_PATH)?.content
    if (!pedagogyInstructions) {
      throw new TeacherCourseContextError(
        'COURSE_CONTEXT_SOURCE_UNAVAILABLE',
        'The shared Teacher pedagogy policy is unavailable.'
      )
    }
    const quizPath = MODULE_SOURCE_PATHS[progress.currentLessonId].find((path) => path.includes('/quizzes/'))
    const quizContent = sources.find((source) => source.path === quizPath)?.content
    if (!quizContent) {
      throw new TeacherCourseContextError(
        'COURSE_CONTEXT_SOURCE_UNAVAILABLE',
        'The active module quiz is unavailable.'
      )
    }
    return {
      schemaVersion: 1,
      moduleId: progress.currentLessonId,
      sources,
      characterCount,
      digest: digest(sources.map((source) => `${source.path}:${source.digest}`).join('\n')),
      pedagogyInstructions,
      activeAssessment: activeAssessment(progress, quizContent)
    }
  }

  private async loadSource(canonicalRoot: string, sourcePath: string): Promise<TeacherCourseSource> {
    const candidate = join(canonicalRoot, ...sourcePath.split('/'))
    let canonicalSource: string
    try {
      canonicalSource = await realpath(candidate)
    } catch (cause) {
      throw new TeacherCourseContextError(
        'COURSE_CONTEXT_SOURCE_UNAVAILABLE',
        `Required Teacher course source is unavailable: ${sourcePath}`,
        { cause }
      )
    }
    if (!staysInside(canonicalRoot, canonicalSource)) {
      throw new TeacherCourseContextError(
        'COURSE_CONTEXT_SOURCE_ESCAPE',
        `Teacher course source escapes the authoritative workspace: ${sourcePath}`
      )
    }
    try {
      const before = await stat(canonicalSource)
      if (!before.isFile()) throw new Error('Source is not a regular file')
      const content = await readFile(canonicalSource, 'utf8')
      const after = await stat(canonicalSource)
      if (before.size !== after.size || before.mtimeMs !== after.mtimeMs) {
        throw new TeacherCourseContextError(
          'COURSE_CONTEXT_SOURCE_CHANGED',
          `Teacher course source changed while context was assembled: ${sourcePath}`
        )
      }
      return {
        path: sourcePath,
        content,
        digest: digest(content),
        characterCount: [...content].length
      }
    } catch (cause) {
      if (cause instanceof TeacherCourseContextError) throw cause
      throw new TeacherCourseContextError(
        'COURSE_CONTEXT_SOURCE_UNAVAILABLE',
        `Required Teacher course source could not be read: ${sourcePath}`,
        { cause }
      )
    }
  }
}
