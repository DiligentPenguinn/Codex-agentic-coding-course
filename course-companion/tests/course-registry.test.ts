import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { CourseModuleDefinition } from '../shared/course/module-contracts'
import {
  portfolioModuleDefinitions,
  validateCourseModuleDefinitions
} from '../shared/course/registry'

function mutableDefinitions(): CourseModuleDefinition[] {
  return structuredClone(portfolioModuleDefinitions) as unknown as CourseModuleDefinition[]
}

describe('portfolio course registry', () => {
  it('exposes ordered typed definitions for Modules 2-4', () => {
    expect(portfolioModuleDefinitions.map((module) => module.id)).toEqual([
      'module-2',
      'module-3',
      'module-4'
    ])
    expect(portfolioModuleDefinitions.flatMap((module) =>
      module.lessons.map((lesson) => lesson.id))).toEqual([
      'm2-portfolio-brief',
      'm2-content-evidence-inventory',
      'm2-visual-reference',
      'm2-portfolio-prd',
      'm2-implementation-contract',
      'm3-scaffold-baseline',
      'm3-complete-first-version',
      'm3-whole-page-revision',
      'm3-evidence-debugging',
      'm3-independent-enhancement',
      'm4-release-validation',
      'm4-security-publication',
      'm4-preview-deployment',
      'm4-production-decision',
      'm4-ownership-transfer'
    ])
  })

  it('rejects duplicate module ids', () => {
    const definitions = mutableDefinitions()
    definitions[1] = { ...definitions[1]!, id: 'module-2' }
    expect(() => validateCourseModuleDefinitions(definitions)).toThrow('Duplicate module id')
  })

  it('rejects unknown checkpoint references', () => {
    const definitions = mutableDefinitions()
    definitions[0] = {
      ...definitions[0]!,
      scenes: [{
      ...definitions[0]!.scenes[0]!,
      checkpointId: 'missing-checkpoint'
      }]
    }
    expect(() => validateCourseModuleDefinitions(definitions)).toThrow('Unknown checkpoint')
  })

  it('rejects broken scene destinations', () => {
    const definitions = mutableDefinitions()
    definitions[0] = {
      ...definitions[0]!,
      scenes: [{
      ...definitions[0]!.scenes[0]!,
      nextSceneId: 'missing-scene'
      }]
    }
    expect(() => validateCourseModuleDefinitions(definitions)).toThrow('Broken scene destination')
  })

  it('rejects a scene routed to a different lesson than its checkpoint', () => {
    const definitions = mutableDefinitions()
    definitions[0] = {
      ...definitions[0]!,
      scenes: [{
        ...definitions[0]!.scenes[0]!,
        courseLessonId: 'm2-content-evidence-inventory'
      }]
    }
    expect(() => validateCourseModuleDefinitions(definitions)).toThrow('different lessons')
  })

  it('rejects module-order errors', () => {
    const definitions = mutableDefinitions()
    definitions.reverse()
    expect(() => validateCourseModuleDefinitions(definitions)).toThrow('strictly increasing order')
  })

  it('routes registry scenes into LearningWindow without extending the legacy scene literal', async () => {
    const learningWindowSource = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'surfaces',
      'LearningWindow.tsx'
    ), 'utf8')
    const registrySource = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'course',
      'registry.ts'
    ), 'utf8')
    expect(learningWindowSource).toContain('...registrySceneContent')
    expect(learningWindowSource).not.toContain("'module-2-portfolio-placeholder': {")
    expect(registrySource).toContain('validateRendererRegistry()')
    expect(registrySource).toContain('moduleTwoScenes')
  })

  it('renders the complete Module 2 journey and every quiz scene from the registry', () => {
    const moduleTwo = portfolioModuleDefinitions[0]
    expect(moduleTwo.lessons).toHaveLength(5)
    expect(moduleTwo.quizGroupIds).toEqual([
      'brief-retrieval',
      'evidence-retrieval',
      'reference-retrieval',
      'prd-retrieval',
      'planning-retrieval',
      'final-assessment'
    ])
    expect(moduleTwo.scenes.map((scene) => scene.id)).toEqual(expect.arrayContaining([
      'module-2-portfolio-workspace',
      'module-2-portfolio-practice',
      'module-2-portfolio-mastery',
      'module-2-portfolio-mastery-summary'
    ]))
    expect(moduleTwo.scenes.filter((scene) => scene.id.startsWith('module-2-check-'))).toHaveLength(10)
    expect(moduleTwo.scenes.filter((scene) => scene.id.startsWith('module-2-mastery-'))).toHaveLength(10)
  })

  it('registers the complete Module 4 content journey while preserving its deferred Practice identity', () => {
    const moduleFour = portfolioModuleDefinitions[2]
    expect(moduleFour.lessons).toHaveLength(5)
    expect(moduleFour.quizGroupIds).toEqual([
      'release-validation-retrieval',
      'security-publication-retrieval',
      'preview-deployment-retrieval',
      'production-decision-retrieval',
      'ownership-transfer-retrieval',
      'm4-final-assessment'
    ])
    expect(moduleFour.practice).toEqual({
      id: 'm4-portfolio-release',
      version: '1.0.0',
      evidenceProfile: 'portfolio-release'
    })
    expect(moduleFour.scenes.map((scene) => scene.id)).toEqual(expect.arrayContaining([
      'module-4-release-intro',
      'module-4-portfolio-practice',
      'module-4-portfolio-mastery',
      'module-4-mastery-summary'
    ]))
  })
})
