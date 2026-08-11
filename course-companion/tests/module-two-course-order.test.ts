import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { checkpointCourseLesson, sceneCheckpoint } from '../shared/contracts'

async function pilotFile(path: string): Promise<string> {
  return readFile(join(process.cwd(), '..', 'pilot-workspace', ...path.split('/')), 'utf8')
}

describe('Module 2 course order', () => {
  it('teaches every concept and formative check before one planning Practice', async () => {
    const course = JSON.parse(await pilotFile('course/course-structure.json')) as {
      modules: Array<{
        id: string
        checkpoints: string[]
        lessons: Array<{ id: string; titleVi: string; checkpoints: string[] }>
      }>
    }
    const moduleTwo = course.modules.find((module) => module.id === 'module-2')

    expect(moduleTwo?.lessons.map((lesson) => lesson.id)).toEqual([
      'm2-when-to-plan',
      'm2-product-requirements',
      'm2-prd-prompt',
      'm2-implementation-plan',
      'm2-prd-review',
      'm2-assessment'
    ])
    expect(moduleTwo?.lessons.map((lesson) => lesson.checkpoints)).toEqual([
      ['m2-why-planning', 'm2-contentpilot-brief'],
      ['m2-prd-concept'],
      ['m2-prd-interview'],
      ['m2-implementation-plan'],
      ['m2-planning-package'],
      ['m2-mastery', 'm2-complete']
    ])
    expect(moduleTwo?.lessons.flatMap((lesson) => lesson.checkpoints)).toEqual(moduleTwo?.checkpoints)
  })

  it('places applied planning work inside Practice and mastery after Practice', async () => {
    const script = await pilotFile('course/lesson-scripts/module-2.script.vi.md')
    const promptInstruction = script.indexOf('## Bước 4 — Hiểu prompt')
    const planInstruction = script.indexOf('## Bước 5 — Hiểu implementation plan')
    const practice = script.indexOf('## Bước 6 — Hoàn thành một Practice planning package')
    const mastery = script.indexOf('## Bước 7 — Kiểm tra cuối Module 2')

    expect(promptInstruction).toBeGreaterThan(-1)
    expect(planInstruction).toBeGreaterThan(promptInstruction)
    expect(practice).toBeGreaterThan(planInstruction)
    expect(mastery).toBeGreaterThan(practice)
    for (const appliedAction of [
      'Learner tự viết prompt',
      'Executor dùng nguyên văn prompt',
      'Duyệt và lưu PRD',
      'Duyệt và lưu implementation plan',
      'yêu cầu Triết duyệt'
    ]) {
      expect(script.indexOf(appliedAction)).toBeGreaterThan(practice)
    }
  })

  it('keeps quiz placement and checkpoint mappings on the new boundary', async () => {
    const quiz = JSON.parse(await pilotFile('course/quizzes/module-2.quiz.json')) as {
      delivery: { practiceBoundary?: string }
      groups: Array<{ id: string; placement: string }>
    }
    expect(quiz.delivery.practiceBoundary).toContain('m2-planning-package')
    expect(Object.fromEntries(quiz.groups.map((group) => [group.id, group.placement]))).toEqual({
      'planning-prd-check': 'after-prd',
      'prompt-check': 'after-prompt',
      'implementation-plan-check': 'before-planning-package',
      'final-assessment': 'after-passed-planning-package'
    })
    expect(sceneCheckpoint['module-2-check-plan-2']).toBe('m2-implementation-plan')
    expect(checkpointCourseLesson['m2-planning-package']).toBe('m2-prd-review')
  })

  it('routes formative exits into instruction, Practice, then final assessment', async () => {
    const source = await readFile(
      join(process.cwd(), 'src', 'renderer', 'src', 'surfaces', 'LearningWindow.tsx'),
      'utf8'
    )
    expect(source).toContain("'prompt-check': 'module-2-implementation-plan'")
    expect(source).toContain("'implementation-plan-check': 'module-2-planning-package'")
    expect(source).toContain("sceneId: 'module-2-mastery'")
  })
})
