import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { moduleThreeDefinition } from '../shared/course/modules/module-3'
import { moduleFourDefinition } from '../shared/course/modules/module-4'

const root = resolve(process.cwd(), '..')
const read = (path: string) => readFile(resolve(root, path), 'utf8')
const rendererPath = (module: number) => `course-companion/src/renderer/src/course/modules/module-${module}/scenes.tsx`

function sceneBlocks(source: string) {
  return [...source.matchAll(/^ {2}'(module-[34]-[^']+)': \{\n([\s\S]*?)^ {2}\},?$/gm)]
    .map((match) => ({ id: match[1]!, body: match[2]! }))
}

describe('GitHub and Vercel publication content', () => {
  it('keeps renderer next-page routes and ordered page inventories aligned with shared contracts', async () => {
    const registry = await read('course-companion/src/renderer/src/course/registry.ts')
    for (const module of [moduleThreeDefinition, moduleFourDefinition]) {
      const source = await read(rendererPath(module.order))
      const pages = module.lessons.flatMap((lesson) => {
        const block = registry.split(`      '${lesson.id}': [`)[1]!.split('\n      ]')[0]!
        return [...block.matchAll(/\['([^']+)'\]/g)].map((match) => match[1])
      })
      expect(pages).toEqual(module.scenes.map((scene) => scene.id))
      for (const block of sceneBlocks(source)) {
        const next = block.body.match(/next: '([^']+)'/)?.[1]
        if (!next) continue
        const definition = module.scenes.find((scene) => scene.id === block.id)!
        expect('nextSceneId' in definition && definition.nextSceneId, block.id).toBe(next)
      }
    }
  })

  it('teaches real GitHub publishing before Practice and stops for manual evidence before mastery', async () => {
    const ids = moduleThreeDefinition.scenes.map((scene) => String(scene.id))
    expect(ids.slice(ids.indexOf('module-3-git-merge'), ids.indexOf('module-3-portfolio-practice') + 1)).toEqual([
      'module-3-git-merge', 'module-3-github-publish', 'module-3-github-preflight',
      'module-3-github-create', 'module-3-github-push-practice', 'module-3-github-verify',
      'module-3-pre-practice-summary', 'module-3-portfolio-practice'
    ])
    const source = await read(rendererPath(3))
    const mastery = sceneBlocks(source).find((scene) => scene.id === 'module-3-portfolio-mastery')!
    expect(mastery.body).toContain('Trước bài tổng kết, hãy mở repo GitHub thật')
    expect(mastery.body).toContain('preservePrimaryLabel: true')
    const script = await read('pilot-workspace/course/lesson-scripts/module-3.script.vi.md')
    expect(script).toContain('thiếu hoặc không khớp thì quay lại task Codex, chưa bắt đầu tổng kết hoặc Module 4')
  })

  it('preserves all former Module 4 pages and keeps the unavailable Practice action inactive', async () => {
    const ids = moduleFourDefinition.scenes.map((scene) => String(scene.id))
    const preserved = [
      'hosting-intro', 'hosting-roles', 'release-intro', 'check-release-evidence',
      'security-intro', 'check-protection-scope', 'preview-intro', 'check-preview-evidence',
      'production-intro', 'check-production-choice', 'ownership-intro', 'check-transfer-boundary',
      'portfolio-practice', 'portfolio-mastery', 'mastery-release', 'mastery-security',
      'mastery-preview', 'mastery-production', 'mastery-owned-release', 'mastery-owned-transfer',
      'mastery-summary', 'complete'
    ]
    expect(ids).toEqual(expect.arrayContaining(preserved.map((id) => `module-4-${id}`)))
    expect(ids.indexOf('module-4-security-setup')).toBeLessThan(ids.indexOf('module-4-vercel-deploy'))
    expect(ids.indexOf('module-4-vercel-deploy')).toBeLessThan(ids.indexOf('module-4-vercel-preview'))
    expect(ids.indexOf('module-4-update-workflow')).toBeLessThan(ids.indexOf('module-4-rollback-resume'))
    const source = await read(rendererPath(4))
    expect(sceneBlocks(source).find((scene) => scene.id === 'module-4-portfolio-practice')!.body).toContain('choices: []')
  })

  it('keeps new instructional paragraphs in the Pilot authority and renderer', async () => {
    for (const module of [3, 4]) {
      const lesson = await read(`pilot-workspace/course/lessons/module-${module}.vi.md`)
      const source = await read(rendererPath(module))
      for (const scene of sceneBlocks(source)) {
        const newInstruction = module === 3 ? scene.id.startsWith('module-3-github-') : (
          !scene.id.includes('-hosting-') && !scene.id.includes('-mastery') && !scene.id.includes('-check-')
          && !scene.id.endsWith('-practice') && !scene.id.endsWith('-complete')
        )
        if (newInstruction) {
          const quoted = scene.body.match(/dialogue: ("(?:[^"\\]|\\.)*")/)?.[1]
          expect(quoted, scene.id).toBeDefined()
          const dialogue = JSON.parse(quoted!) as string
          for (const paragraph of dialogue.split('\n\n')) expect(lesson, scene.id).toContain(paragraph)
        }
      }
    }
  })
})
