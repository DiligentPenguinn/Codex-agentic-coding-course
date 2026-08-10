import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  parsePracticeDefinition,
  PracticeDefinitionRepository
} from '../electron/main/practice-definition-repository'

const definitions = join(process.cwd(), 'content', 'practices')

describe('PracticeDefinitionRepository', () => {
  it('loads the current task as versioned content with generic criteria', async () => {
    const definition = await new PracticeDefinitionRepository(definitions).load()

    expect(definition.practiceId).toBe('m1-verifiable-brief')
    expect(definition.version).toBe('1.0.0')
    expect(definition.criteria.map((criterion) => criterion.acceptedEvidence)).toContainEqual([
      'executor-reported-verification'
    ])
    expect(definition.completionDestination).toEqual({
      lessonId: 'module-1',
      checkpointId: 'm1-review',
      sceneId: 'module-1-reflection'
    })
  })

  it('rejects unknown fields and dangling checklist references', async () => {
    const original = JSON.parse(await readFile(
      join(definitions, 'm1-verifiable-brief.json'),
      'utf8'
    ))
    expect(() => parsePracticeDefinition({ ...original, unexpected: true })).toThrow(
      'Invalid Practice definition shape'
    )
    original.criteria[0].checklistStepId = 'missing-step'
    expect(() => parsePracticeDefinition(original)).toThrow(
      'unknown checklist step'
    )
  })
})
