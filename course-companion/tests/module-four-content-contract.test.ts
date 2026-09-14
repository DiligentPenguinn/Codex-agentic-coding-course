import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(process.cwd(), '..')
const courseRoot = resolve(repositoryRoot, 'pilot-workspace', 'course')

async function read(relativePath: string): Promise<string> {
  return readFile(resolve(courseRoot, relativePath), 'utf8')
}

async function moduleFour() {
  const structure = JSON.parse(await read('course-structure.json')) as {
    modules: Array<Record<string, unknown>>
  }
  const module = structure.modules.find((candidate) => candidate.id === 'module-4')
  if (!module) throw new Error('Missing Module 4 manifest')
  return module as {
    titleVi: string
    estimatedMinutes?: number
    checkpoints: string[]
    lessons: Array<{ id: string; estimatedMinutes?: number; checkpoints: string[] }>
    contentDevelopment: Record<string, string>
    viewportContract: Record<string, { width: number; height: number }>
    nextLessonId: null
  }
}

describe('Module 4 content-first contract', () => {
  it('locks five ordered content milestones without claiming Practice completion', async () => {
    const module = await moduleFour()
    expect(module.titleVi).toBe('Kiểm chứng, phát hành và chứng minh quyền sở hữu')
    expect(module.estimatedMinutes).toBeUndefined()
    expect(module.lessons.map((lesson) => lesson.id)).toEqual([
      'm4-release-validation',
      'm4-security-publication',
      'm4-preview-deployment',
      'm4-production-decision',
      'm4-ownership-transfer'
    ])
    expect(module.lessons.flatMap((lesson) => lesson.checkpoints)).toEqual(module.checkpoints)
    expect(module.lessons.every((lesson) => lesson.estimatedMinutes === undefined)).toBe(true)
    expect(module.contentDevelopment).toEqual({
      practiceWiring: 'deferred',
      officialCompletion: 'disabled',
      reviewMode: 'session-only'
    })
    expect(module.viewportContract).toEqual({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 }
    })
    expect(module.nextLessonId).toBeNull()
  })

  it('keeps lesson, Teacher script and start prompt aligned to content-only review', async () => {
    const [lesson, script, prompt] = await Promise.all([
      read('lessons/module-4.vi.md'),
      read('lesson-scripts/module-4.script.vi.md'),
      read('prompts/start-module-4.vi.md')
    ])
    const combined = `${lesson}\n${script}\n${prompt}`
    for (const content of [lesson, script]) {
      let previous = -1
      for (const heading of ['Milestone 1 —', 'Milestone 2 —', 'Milestone 3 —', 'Milestone 4 —', 'Milestone 5 —']) {
        const current = content.indexOf(heading)
        expect(current).toBeGreaterThan(previous)
        previous = current
      }
    }
    expect(combined).toMatch(/Preview.*bắt buộc/i)
    expect(combined).toMatch(/Production.*lựa chọn/i)
    expect(combined).toContain('Standard Protection')
    expect(combined).toContain('All Deployments')
    expect(combined).toContain('Undo Rollback')
    expect(combined).toMatch(/không (?:cần|yêu cầu).*đọc code/i)
    expect(combined).toMatch(/không (?:tạo|ghi nhận).*biên nhận/i)
    expect(combined).not.toMatch(/ước tính.*(?:phút|giờ)|hoàn thành trong \d+/i)
    expect(combined).not.toContain('docs/internal/target-learner-definition.md')
  })

  it('provides five formative checks and a sourced eight-question ownership assessment', async () => {
    const quiz = JSON.parse(await read('quizzes/module-4.quiz.json')) as {
      delivery: Record<string, unknown>
      masteryPolicy: Record<string, unknown>
      groups: Array<{ id: string; mode: string; questions: Array<Record<string, unknown>> }>
    }
    expect(quiz.delivery).toMatchObject({
      mode: 'one-question-at-a-time',
      doNotStackQuestions: true,
      feedbackTiming: 'after-answer'
    })
    expect(quiz.masteryPolicy).toMatchObject({
      publishThreshold: false,
      requiresPracticeReceipt: true,
      requiresVerifiedPreview: true,
      allowsProductionDecline: true
    })
    expect(quiz.groups.filter((group) => group.mode === 'formative')).toHaveLength(5)
    const final = quiz.groups.find((group) => group.id === 'm4-final-assessment')!
    expect(final.questions).toHaveLength(8)
    expect(final.questions.filter((question) => question.type !== 'multiple-choice').map((question) => question.id)).toEqual([
      'm4-mastery-owned-release',
      'm4-mastery-owned-transfer'
    ])
    for (const question of quiz.groups.flatMap((group) => group.questions)) {
      const source = question.source as { kind: string; url: string; basis: string }
      expect(source.basis.length).toBeGreaterThan(40)
      expect(source.kind === 'authoritative-source'
        ? new URL(source.url).protocol === 'https:'
        : source.url.startsWith('docs/planning/')).toBe(true)
    }
  })
})
