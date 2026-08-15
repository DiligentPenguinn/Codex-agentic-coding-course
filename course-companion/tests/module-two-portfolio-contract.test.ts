import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

type ModuleTwoManifest = {
  id: 'module-2'
  titleVi: string
  estimatedMinutes?: number
  artifactPaths: string[]
  artifactGateCheckpoint: string
  masteryGateCheckpoint: string
  unlockGate: {
    nextLessonId: string
    requiresCurrentArtifactDigests: boolean
    requiresLearnerApproval: boolean
    requiresStageReceiptCount: number
    requiresMasteryReceipt: boolean
  }
  checkpoints: string[]
  lessons: Array<{ id: string; titleVi: string; estimatedMinutes?: number; checkpoints: string[] }>
  nextLessonId: string
}

async function manifest(): Promise<ModuleTwoManifest> {
  const structure = JSON.parse(await readFile(
    join(process.cwd(), '..', 'pilot-workspace', 'course', 'course-structure.json'),
    'utf8'
  )) as { modules: ModuleTwoManifest[] }
  const moduleTwo = structure.modules.find((module) => module.id === 'module-2')
  if (!moduleTwo) throw new Error('Missing Module 2 manifest')
  return moduleTwo
}

describe('Module 2 portfolio contract', () => {
  it('declares five ordered milestones and a combined evidence/mastery unlock gate', async () => {
    const moduleTwo = await manifest()

    expect(moduleTwo.titleVi).toBe('Xác định, giới hạn và lập kế hoạch portfolio')
    expect(moduleTwo.estimatedMinutes).toBeUndefined()
    expect(moduleTwo.lessons.map((lesson) => lesson.id)).toEqual([
      'm2-portfolio-brief',
      'm2-content-evidence-inventory',
      'm2-visual-reference',
      'm2-portfolio-prd',
      'm2-implementation-contract'
    ])
    expect(moduleTwo.lessons.every((lesson) => lesson.estimatedMinutes === undefined)).toBe(true)
    expect(moduleTwo.lessons.flatMap((lesson) => lesson.checkpoints)).toEqual(moduleTwo.checkpoints)
    expect(moduleTwo.artifactGateCheckpoint).toBe('m2-portfolio-planning')
    expect(moduleTwo.masteryGateCheckpoint).toBe('m2-portfolio-mastery')
    expect(moduleTwo.nextLessonId).toBe('module-3')
    expect(moduleTwo.unlockGate).toEqual({
      nextLessonId: 'module-3',
      requiresCurrentArtifactDigests: true,
      requiresLearnerApproval: true,
      requiresStageReceiptCount: 5,
      requiresMasteryReceipt: true
    })
  })

  it('maps seven unique planning artifacts to solution-free templates', async () => {
    const moduleTwo = await manifest()
    expect(moduleTwo.artifactPaths).toHaveLength(7)
    expect(new Set(moduleTwo.artifactPaths).size).toBe(7)
    expect(moduleTwo.artifactPaths.every((path) => path.startsWith('planning/'))).toBe(true)
    expect(moduleTwo.artifactPaths.every((path) => !path.includes('..'))).toBe(true)

    const templates = await Promise.all(moduleTwo.artifactPaths.map(async (artifactPath) => ({
      artifactPath,
      content: await readFile(join(process.cwd(), '..', 'pilot-workspace', 'artifacts', artifactPath), 'utf8')
    })))
    for (const { content } of templates) {
      expect(content).toContain('Phê duyệt phiên bản hiện tại')
      expect(content).toContain('Quyết định: `chưa duyệt`')
      expect(content).not.toContain('Quyết định: `đã duyệt`')
      expect(content).not.toMatch(/```(?:jsx|tsx|ts|js|html|css)/)
    }
    const combined = templates.map(({ content }) => content).join('\n')
    expect(combined).toContain('đã kiểm chứng')
    expect(combined).toContain('lời tự khai')
    expect(combined).toContain('giả định')
    expect(combined).toContain('còn thiếu')
    expect(combined).toContain('quyền riêng tư')
    expect(combined).toContain('quyền sở hữu')
    expect(combined).toContain('planning/reference/screenshots/')
    expect(combined).toContain('chưa được chạy để tạo ứng dụng')
  })
})
