import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  parseLegacyPracticeDefinitionV1,
  parsePracticeDefinition,
  PracticeDefinitionRepository
} from '../electron/main/practice-definition-repository'

const temporaryDirectories: string[] = []

type MutableDefinition = {
  schemaVersion: number
  practiceId: string
  version: string
  checkpointId: string
  objective: string
  expectedOutcome: string
  workspaceKind: string
  taskPolicy: string
  evidenceProfile: string
  checklist: Array<{ id: string; title: string; dependsOn?: string[] }>
  criteria: Array<{
    id: string
    description: string
    required: boolean
    checklistStepId: string
    acceptedEvidence: string[]
    assertion: string
    freshness: string
  }>
  completionDestination: {
    lessonId: string
    checkpointId: string
    sceneId: string
  }
}

const validDefinition: MutableDefinition = {
  schemaVersion: 2,
  practiceId: 'm1-codex-safe-setup',
  version: '2.0.0',
  checkpointId: 'm1-setup-checklist',
  objective: 'Thiết lập Codex an toàn.',
  expectedOutcome: 'Năm giá trị cấu hình được xác nhận trực tiếp.',
  workspaceKind: 'pilot-workspace',
  taskPolicy: 'inherit-configuration-only',
  evidenceProfile: 'codex-task-configuration',
  checklist: [
    { id: 'open-task', title: 'Mở task cấu hình' },
    { id: 'review-settings', title: 'Duyệt cấu hình', dependsOn: ['open-task'] }
  ],
  criteria: [
    {
      id: 'settings-match',
      description: 'Các thiết lập khớp cấu hình đề xuất.',
      required: true,
      checklistStepId: 'review-settings',
      acceptedEvidence: ['codex-task-configuration'],
      assertion: 'All five normalized settings match.',
      freshness: 'fresh'
    }
  ],
  completionDestination: {
    lessonId: 'module-1',
    checkpointId: 'm1-mastery',
    sceneId: 'module-1-mastery'
  }
}

function cloneDefinition(): MutableDefinition {
  return structuredClone(validDefinition)
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

describe('PracticeDefinitionRepository', () => {
  it('loads an explicitly identified schema-2 definition and normalizes dependencies', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'practice-definitions-'))
    temporaryDirectories.push(directory)
    await writeFile(
      join(directory, 'm1-codex-safe-setup.json'),
      JSON.stringify(validDefinition),
      'utf8'
    )

    const definition = await new PracticeDefinitionRepository(directory)
      .load('m1-codex-safe-setup', '2.0.0')

    expect(definition.schemaVersion).toBe(2)
    expect(definition.checklist[0].dependsOn).toEqual([])
    expect(definition.checklist[1].dependsOn).toEqual(['open-task'])
    expect(definition.evidenceProfile).toBe('codex-task-configuration')
  })

  it('rejects unknown fields, IDs, versions, evidence kinds, and destinations', () => {
    expect(() => parsePracticeDefinition({ ...validDefinition, unexpected: true }))
      .toThrow('Invalid Practice definition shape')

    const invalidId = cloneDefinition()
    invalidId.practiceId = '../escape'
    expect(() => parsePracticeDefinition(invalidId)).toThrow('Invalid Practice id')

    const invalidVersion = cloneDefinition()
    invalidVersion.version = 'latest'
    expect(() => parsePracticeDefinition(invalidVersion)).toThrow('Invalid Practice version')

    const invalidEvidence = cloneDefinition()
    invalidEvidence.criteria[0].acceptedEvidence = ['executor-says-so']
    expect(() => parsePracticeDefinition(invalidEvidence)).toThrow('Unsupported Practice evidence kind')

    const invalidDestination = cloneDefinition()
    invalidDestination.completionDestination.sceneId = 'module-2-mastery'
    expect(() => parsePracticeDefinition(invalidDestination)).toThrow('Invalid Practice completion destination')
  })

  it('rejects duplicate and dangling criterion or dependency references', () => {
    const danglingCriterion = cloneDefinition()
    danglingCriterion.criteria[0].checklistStepId = 'missing-step'
    expect(() => parsePracticeDefinition(danglingCriterion)).toThrow('unknown checklist step')

    const duplicateStep = cloneDefinition()
    duplicateStep.checklist[1].id = 'open-task'
    duplicateStep.checklist[1].dependsOn = []
    expect(() => parsePracticeDefinition(duplicateStep)).toThrow('Duplicate Practice checklist step')

    const unknownDependency = cloneDefinition()
    unknownDependency.checklist[1].dependsOn = ['missing-step']
    expect(() => parsePracticeDefinition(unknownDependency)).toThrow('unknown dependency')

    const selfDependency = cloneDefinition()
    selfDependency.checklist[1].dependsOn = ['review-settings']
    expect(() => parsePracticeDefinition(selfDependency)).toThrow('cannot depend on itself')
  })

  it('rejects dependency cycles', () => {
    const cyclic = cloneDefinition()
    cyclic.checklist[0].dependsOn = ['review-settings']
    expect(() => parsePracticeDefinition(cyclic)).toThrow('dependency cycle')
  })

  it('rejects unknown profiles, policies, workspaces, and unsafe combinations', () => {
    const unknownProfile = cloneDefinition()
    unknownProfile.evidenceProfile = 'generic'
    expect(() => parsePracticeDefinition(unknownProfile)).toThrow('Unsupported Practice evidence profile')

    const unknownPolicy = cloneDefinition()
    unknownPolicy.taskPolicy = 'full-access'
    expect(() => parsePracticeDefinition(unknownPolicy)).toThrow('Unsupported Practice task policy')

    const unknownWorkspace = cloneDefinition()
    unknownWorkspace.workspaceKind = '../other'
    expect(() => parsePracticeDefinition(unknownWorkspace)).toThrow('Unsupported Practice workspace kind')

    const mismatched = cloneDefinition()
    mismatched.taskPolicy = 'safe-workspace-write'
    expect(() => parsePracticeDefinition(mismatched)).toThrow('policy and evidence profile combination')
  })

  it('parses schema 1 only through the explicit legacy migration entrypoint', () => {
    const legacy = {
      schemaVersion: 1,
      practiceId: 'historical-practice',
      version: '1.0.0',
      checkpointId: 'm1-setup-checklist',
      objective: 'Historical objective',
      expectedOutcome: 'Historical outcome',
      checklist: [{ id: 'legacy-step', title: 'Legacy step' }],
      criteria: [{
        id: 'legacy-criterion',
        description: 'Historical criterion',
        required: true,
        checklistStepId: 'legacy-step',
        acceptedEvidence: ['artifact'],
        assertion: 'Artifact exists.',
        freshness: 'any'
      }],
      completionDestination: {
        lessonId: 'module-1',
        checkpointId: 'm1-mastery',
        sceneId: 'module-1-mastery'
      }
    }

    expect(() => parsePracticeDefinition(legacy)).toThrow('Invalid Practice definition shape')
    expect(parseLegacyPracticeDefinitionV1(legacy).checklist[0].dependsOn).toEqual([])
  })
})
