import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import {
  practiceGuideAdvancementModes,
  practiceGuideAnchorIds,
  practiceGuidePresentationTypes,
  type PracticeGuideAdvancementMode,
  type PracticeGuideAnchorId,
  type PracticeGuideDefinition,
  type PracticeGuidePresentationType,
  type PracticeGuideStageDefinition
} from '../../shared/contracts'

const ID = /^[A-Za-z0-9_-]{1,160}$/
const VERSION = /^[0-9]+\.[0-9]+\.[0-9]+$/
const presentations = new Set<string>(practiceGuidePresentationTypes)
const advancements = new Set<string>(practiceGuideAdvancementModes)
const anchors = new Set<string>(practiceGuideAnchorIds)

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value as Record<string, unknown>
    : null
}

function exact(value: Record<string, unknown>, required: string[], optional: string[] = []): boolean {
  const keys = Object.keys(value)
  return required.every((key) => keys.includes(key))
    && keys.every((key) => required.includes(key) || optional.includes(key))
}

function text(value: unknown, maximum: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maximum
}

function version(value: unknown): value is string {
  return typeof value === 'string' && VERSION.test(value)
}

function stage(value: unknown): PracticeGuideStageDefinition {
  const input = record(value)
  if (!input || !exact(input, ['id', 'presentation', 'advancement', 'title', 'body'], [
    'anchor', 'primaryLabel', 'secondaryLabel'
  ])) throw new Error('Invalid Practice guide stage shape')
  if (!text(input.id, 160) || !ID.test(input.id)) throw new Error('Invalid Practice guide stage id')
  if (typeof input.presentation !== 'string' || !presentations.has(input.presentation)) {
    throw new Error('Unsupported Practice guide presentation')
  }
  if (typeof input.advancement !== 'string' || !advancements.has(input.advancement)) {
    throw new Error('Unsupported Practice guide advancement')
  }
  if (!text(input.title, 160) || !text(input.body, 600)
    || (input.primaryLabel !== undefined && !text(input.primaryLabel, 80))
    || (input.secondaryLabel !== undefined && !text(input.secondaryLabel, 80))) {
    throw new Error('Invalid Practice guide copy')
  }
  const presentation = input.presentation as PracticeGuidePresentationType
  const hasAnchor = input.anchor !== undefined
  if (presentation === 'coach-mark') {
    if (typeof input.anchor !== 'string' || !anchors.has(input.anchor)) {
      throw new Error('Practice guide coach mark requires a known anchor')
    }
  } else if (hasAnchor) {
    throw new Error('Practice guide anchor is allowed only on coach marks')
  }
  return {
    id: input.id,
    presentation,
    advancement: input.advancement as PracticeGuideAdvancementMode,
    ...(hasAnchor ? { anchor: input.anchor as PracticeGuideAnchorId } : {}),
    title: input.title,
    body: input.body,
    ...(input.primaryLabel !== undefined ? { primaryLabel: input.primaryLabel as string } : {}),
    ...(input.secondaryLabel !== undefined ? { secondaryLabel: input.secondaryLabel as string } : {})
  }
}

export function parsePracticeGuideDefinition(value: unknown): PracticeGuideDefinition {
  const input = record(value)
  if (!input || !exact(input, [
    'schemaVersion', 'guideId', 'version', 'eligiblePractice', 'replayPolicy', 'stages'
  ])) throw new Error('Invalid Practice guide definition shape')
  if (input.schemaVersion !== 1) throw new Error('Unsupported Practice guide schema')
  if (!text(input.guideId, 160) || !ID.test(input.guideId)) throw new Error('Invalid Practice guide id')
  if (!version(input.version)) throw new Error('Invalid Practice guide version')
  if (input.replayPolicy !== 'once-per-course-run') throw new Error('Unsupported Practice guide replay policy')
  const eligible = record(input.eligiblePractice)
  if (!eligible || !exact(eligible, ['practiceId', 'minimumVersion', 'maximumVersion'])
    || !text(eligible.practiceId, 160) || !ID.test(eligible.practiceId)
    || !version(eligible.minimumVersion) || !version(eligible.maximumVersion)) {
    throw new Error('Invalid Practice guide eligible Practice')
  }
  if (!Array.isArray(input.stages) || input.stages.length < 1 || input.stages.length > 20) {
    throw new Error('Invalid Practice guide stages')
  }
  const stages = input.stages.map(stage)
  if (new Set(stages.map((item) => item.id)).size !== stages.length) {
    throw new Error('Duplicate Practice guide stage')
  }
  return structuredClone({
    schemaVersion: 1,
    guideId: input.guideId,
    version: input.version,
    eligiblePractice: {
      practiceId: eligible.practiceId,
      minimumVersion: eligible.minimumVersion,
      maximumVersion: eligible.maximumVersion
    },
    replayPolicy: 'once-per-course-run',
    stages
  })
}

export class PracticeGuideDefinitionRepository {
  constructor(private readonly directory: string) {}

  async load(guideId: string): Promise<PracticeGuideDefinition> {
    if (!ID.test(guideId)) throw new Error('Invalid Practice guide id')
    const value: unknown = JSON.parse(await readFile(join(this.directory, guideId + '.json'), 'utf8'))
    const definition = parsePracticeGuideDefinition(value)
    if (definition.guideId !== guideId) throw new Error('Practice guide definition id mismatch')
    return definition
  }
}
