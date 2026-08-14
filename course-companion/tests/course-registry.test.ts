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
      'm3-scaffold-baseline',
      'm4-release-validation'
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
})
