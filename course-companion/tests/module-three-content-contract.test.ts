import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(process.cwd(), '..')
const courseRoot = resolve(repositoryRoot, 'pilot-workspace', 'course')
const artifactRoot = resolve(repositoryRoot, 'pilot-workspace', 'artifacts')

async function read(relativePath: string): Promise<string> {
  return readFile(resolve(courseRoot, relativePath), 'utf8')
}

async function moduleThree() {
  const structure = JSON.parse(await read('course-structure.json')) as {
    modules: Array<Record<string, unknown>>
  }
  const module = structure.modules.find((candidate) => candidate.id === 'module-3')
  if (!module) throw new Error('Missing Module 3 manifest')
  return module as {
    titleVi: string
    estimatedMinutes?: number
    artifactPaths: string[]
    viewportContract: {
      desktop: { width: number; height: number }
      mobile: { width: number; height: number }
    }
    checkpoints: string[]
    lessons: Array<{ id: string; titleVi: string; estimatedMinutes?: number; checkpoints: string[] }>
    unlockGate: Record<string, unknown>
    nextLessonId: string
  }
}

describe('Module 3 content and evidence contract', () => {
  it('locks five ordered milestones and the approved viewport pair without duration claims', async () => {
    const module = await moduleThree()
    expect(module.titleVi).toBe('Xây dựng và gỡ lỗi theo từng phần đã kiểm chứng')
    expect(module.estimatedMinutes).toBeUndefined()
    expect(module.lessons.map((lesson) => lesson.id)).toEqual([
      'm3-scaffold-baseline',
      'm3-complete-first-version',
      'm3-whole-page-revision',
      'm3-evidence-debugging',
      'm3-independent-enhancement'
    ])
    expect(module.lessons.flatMap((lesson) => lesson.checkpoints)).toEqual(module.checkpoints)
    expect(module.lessons.every((lesson) => lesson.estimatedMinutes === undefined)).toBe(true)
    expect(module.viewportContract).toEqual({
      desktop: { width: 1440, height: 900 },
      mobile: { width: 390, height: 844 }
    })
    expect(module.nextLessonId).toBe('module-4')
    expect(module.unlockGate).toMatchObject({
      nextLessonId: 'module-4',
      requiresStageReceiptCount: 5,
      requiresNestedBuildSliceReceiptCount: 4,
      requiresCurrentCheck: true,
      requiresBrowserValidation: true,
      requiresMasteryReceipt: true
    })
  })

  it('maps eight unique evidence artifacts to solution-free templates', async () => {
    const module = await moduleThree()
    expect(module.artifactPaths).toHaveLength(8)
    expect(new Set(module.artifactPaths).size).toBe(8)
    expect(module.artifactPaths.every((path) => path.startsWith('evidence/module-3/'))).toBe(true)
    expect(module.artifactPaths.every((path) => !path.includes('..'))).toBe(true)

    const templates = await Promise.all(module.artifactPaths.map((path) =>
      readFile(resolve(artifactRoot, path), 'utf8')))
    for (const template of templates) {
      expect(template).toContain('Phê duyệt phiên bản hiện tại')
      expect(template).toContain('Quyết định: `chưa duyệt`')
      expect(template).not.toContain('Quyết định: `đã duyệt`')
      expect(template).not.toMatch(/```(?:jsx|tsx|ts|js|html|css)/)
    }
    expect(templates.join('\n')).toContain('1440 × 900')
    expect(templates.join('\n')).toContain('390 × 844')
  })

  it('teaches the two loops, four build slices, and five-part summary consistently', async () => {
    const [lesson, script, prompt] = await Promise.all([
      read('lessons/module-3.vi.md'),
      read('lesson-scripts/module-3.script.vi.md'),
      read('prompts/start-module-3.vi.md')
    ])
    const combined = `${lesson}\n${script}\n${prompt}`
    const milestoneHeadings = [
      'Milestone 1 —',
      'Milestone 2 —',
      'Milestone 3 —',
      'Milestone 4 —',
      'Milestone 5 —'
    ]
    for (const content of [lesson, script]) {
      let previous = -1
      for (const heading of milestoneHeadings) {
        const current = content.indexOf(heading)
        expect(current).toBeGreaterThan(previous)
        previous = current
      }
    }
    for (const path of (await moduleThree()).artifactPaths) {
      expect(combined).toContain(path.split('/').at(-1))
    }
    for (const required of [
      'Nền trang và Hero',
      'Selected Work',
      'About, Contact và footer',
      'Tích hợp responsive và accessibility',
      'Điều đã thay đổi',
      'Điều bạn nên chú ý',
      'Điều chủ động giữ nguyên',
      'Kiểm tra đã chạy và kết quả',
      'Rủi ro, giới hạn hoặc quyết định còn lại'
    ]) expect(combined).toContain(required)
    expect(combined).toMatch(/tái hiện[^]*kết quả mong đợi[^]*bằng chứng[^]*giả thuyết[^]*thay đổi nhỏ nhất/i)
  })

  it('keeps learner review non-technical and core work separate from optional enhancement', async () => {
    const files = await Promise.all([
      read('lessons/module-3.vi.md'),
      read('lesson-scripts/module-3.script.vi.md'),
      read('prompts/start-module-3.vi.md')
    ])
    const combined = files.join('\n')
    expect(combined).toMatch(/không (?:cần|bắt).*đọc code/i)
    expect(combined).toMatch(/diff/)
    expect(combined).toMatch(/portfolio core.*(?:bắt buộc|tách)/i)
    expect(combined).toMatch(/cải tiến.*(?:tùy chọn|có giới hạn)/i)
    expect(combined).toMatch(/hỏi đúng một câu mỗi lượt/i)
    expect(combined).not.toMatch(/ước tính.*(?:phút|giờ)|hoàn thành trong \d+/i)
    expect(combined).not.toContain('docs/internal/target-learner-definition.md')
    expect(combined).toMatch(/[ăâđêôơưĂÂĐÊÔƠƯ]/)
  })

  it('keeps assessment one-question-at-a-time, configurable, sourced, and learner-owned', async () => {
    const quiz = JSON.parse(await read('quizzes/module-3.quiz.json')) as {
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
      requiresCurrentArtifactDigests: true,
      requiresPracticeReceipt: true
    })
    expect(quiz.groups.filter((group) => group.mode === 'formative')).toHaveLength(5)
    const final = quiz.groups.find((group) => group.id === 'final-assessment')!
    expect(final.questions).toHaveLength(5)
    expect(final.questions.filter((question) => question.type === 'short-answer').map((question) => question.id)).toEqual([
      'mastery-owned-revision', 'mastery-owned-enhancement'
    ])
    for (const question of quiz.groups.flatMap((group) => group.questions)) {
      const source = question.source as { kind: string; url: string; basis: string }
      expect(source.basis.length).toBeGreaterThan(40)
      expect(source.kind === 'authoritative-source'
        ? new URL(source.url).protocol
        : source.url.startsWith('docs/planning/portfolio-course-v1/')).toBeTruthy()
    }
  })
})
