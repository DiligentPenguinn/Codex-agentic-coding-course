import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  checkpointIds,
  sceneIds,
  type PracticeCriterionDefinition,
  type PracticeDefinition,
  type PracticeEvidenceKind
} from '../../shared/contracts'

const ID = /^[A-Za-z0-9_-]{1,160}$/
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/
const evidenceKinds = new Set<PracticeEvidenceKind>([
  'bound-thread-activity',
  'workspace-confirmed-change',
  'executor-reported-verification',
  'learner-decision',
  'artifact',
  'teacher-assessment'
])
const checkpoints = new Set<string>(checkpointIds)
const scenes = new Set<string>(sceneIds)

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function exactKeys(value: Record<string, unknown>, expected: string[]): boolean {
  const actual = Object.keys(value).sort()
  return actual.length === expected.length
    && actual.every((key, index) => key === [...expected].sort()[index])
}

function bounded(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.length > 0 && value.length <= maximum
}

function parseCriterion(value: unknown, stepIds: Set<string>): PracticeCriterionDefinition {
  const item = record(value)
  if (!item || !exactKeys(item, [
    'acceptedEvidence',
    'assertion',
    'checklistStepId',
    'description',
    'freshness',
    'id',
    'required'
  ])) throw new Error('Invalid Practice criterion shape')
  if (!bounded(item.id, 160) || !ID.test(item.id)) throw new Error('Invalid Practice criterion id')
  if (!bounded(item.description, 500) || !bounded(item.assertion, 1000)) {
    throw new Error('Invalid Practice criterion text')
  }
  if (typeof item.required !== 'boolean') throw new Error('Invalid Practice criterion requirement')
  if (!bounded(item.checklistStepId, 160) || !stepIds.has(item.checklistStepId)) {
    throw new Error('Practice criterion references an unknown checklist step')
  }
  if (!Array.isArray(item.acceptedEvidence) || item.acceptedEvidence.length < 1) {
    throw new Error('Practice criterion requires accepted evidence')
  }
  const acceptedEvidence = item.acceptedEvidence.map((kind) => {
    if (typeof kind !== 'string' || !evidenceKinds.has(kind as PracticeEvidenceKind)) {
      throw new Error('Unsupported Practice evidence kind')
    }
    return kind as PracticeEvidenceKind
  })
  if (new Set(acceptedEvidence).size !== acceptedEvidence.length) {
    throw new Error('Duplicate Practice evidence kind')
  }
  if (item.freshness !== 'fresh' && item.freshness !== 'any') {
    throw new Error('Invalid Practice evidence freshness')
  }
  return {
    id: item.id,
    description: item.description,
    required: item.required,
    checklistStepId: item.checklistStepId,
    acceptedEvidence,
    assertion: item.assertion,
    freshness: item.freshness
  }
}

export function parsePracticeDefinition(value: unknown): PracticeDefinition {
  const input = record(value)
  if (!input || !exactKeys(input, [
    'checkpointId',
    'checklist',
    'completionDestination',
    'criteria',
    'expectedOutcome',
    'objective',
    'practiceId',
    'schemaVersion',
    'version'
  ])) throw new Error('Invalid Practice definition shape')
  if (input.schemaVersion !== 1) throw new Error('Unsupported Practice definition schema')
  if (!bounded(input.practiceId, 160) || !ID.test(input.practiceId)) throw new Error('Invalid Practice id')
  if (!bounded(input.version, 40) || !VERSION.test(input.version)) throw new Error('Invalid Practice version')
  if (typeof input.checkpointId !== 'string' || !checkpoints.has(input.checkpointId)) {
    throw new Error('Invalid Practice checkpoint')
  }
  if (!bounded(input.objective, 1000) || !bounded(input.expectedOutcome, 1000)) {
    throw new Error('Invalid Practice objective')
  }
  if (!Array.isArray(input.checklist) || input.checklist.length < 1 || input.checklist.length > 20) {
    throw new Error('Invalid Practice checklist')
  }
  const checklist = input.checklist.map((value) => {
    const step = record(value)
    if (!step || !exactKeys(step, ['id', 'title'])) throw new Error('Invalid Practice checklist step')
    if (!bounded(step.id, 160) || !ID.test(step.id) || !bounded(step.title, 300)) {
      throw new Error('Invalid Practice checklist step')
    }
    return { id: step.id, title: step.title }
  })
  const stepIds = new Set(checklist.map((step) => step.id))
  if (stepIds.size !== checklist.length) throw new Error('Duplicate Practice checklist step')
  if (!Array.isArray(input.criteria) || input.criteria.length < 1 || input.criteria.length > 40) {
    throw new Error('Invalid Practice criteria')
  }
  const criteria = input.criteria.map((criterion) => parseCriterion(criterion, stepIds))
  if (new Set(criteria.map((criterion) => criterion.id)).size !== criteria.length) {
    throw new Error('Duplicate Practice criterion')
  }
  const destination = record(input.completionDestination)
  if (!destination || !exactKeys(destination, ['checkpointId', 'lessonId', 'sceneId'])) {
    throw new Error('Invalid Practice completion destination')
  }
  if ((destination.lessonId !== 'intro' && destination.lessonId !== 'module-1')
    || typeof destination.checkpointId !== 'string' || !checkpoints.has(destination.checkpointId)
    || typeof destination.sceneId !== 'string' || !scenes.has(destination.sceneId)) {
    throw new Error('Invalid Practice completion destination')
  }
  return structuredClone({ ...input, checklist, criteria, completionDestination: destination }) as PracticeDefinition
}
export class PracticeDefinitionRepository {
  constructor(private readonly directory: string) {}

  async load(practiceId = 'm1-verifiable-brief'): Promise<PracticeDefinition> {
    if (!ID.test(practiceId)) throw new Error('Invalid Practice id')
    const parsed: unknown = JSON.parse(await readFile(join(this.directory, practiceId + '.json'), 'utf8'))
    const definition = parsePracticeDefinition(parsed)
    if (definition.practiceId !== practiceId) throw new Error('Practice definition id mismatch')
    return definition
  }
}
