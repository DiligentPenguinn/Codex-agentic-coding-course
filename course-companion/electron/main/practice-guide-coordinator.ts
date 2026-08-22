import type {
  PracticeGuideContext,
  PracticeGuideCoordinatorAdapter,
  PracticeGuideDefinition,
  PracticeGuideStateIdentity,
  PracticeGuideStateRecord,
  PracticeGuideUpdateRequest,
  PracticeGuideView
} from '../../shared/contracts'
import type { PracticeGuideDefinitionRepository } from './practice-guide-definition-repository'
import type { PracticeGuideStateRepository } from './practice-guide-state-repository'

const GUIDE_ID = 'm1-practice-mode-first-run'
const WARNING = 'Hướng dẫn tạm thời không thể lưu. Practice vẫn hoạt động bình thường.'
const LEGACY_STAGE_REPLACEMENTS: Record<string, string> = {
  'ask-teacher': 'review-workspace',
  'inspect-progress': 'configuration-evidence'
}

function compareVersion(left: string, right: string): number {
  const a = left.split('.').map(Number)
  const b = right.split('.').map(Number)
  for (let index = 0; index < 3; index += 1) {
    const leftPart = a[index] ?? 0
    const rightPart = b[index] ?? 0
    if (leftPart !== rightPart) return leftPart - rightPart
  }
  return 0
}

function eligible(definition: PracticeGuideDefinition, context: PracticeGuideContext): boolean {
  const active = context.workspace?.activePractice
  if (context.progress?.currentLessonId !== 'module-1') return false
  if (!active || active.practiceId !== definition.eligiblePractice.practiceId) return false
  return compareVersion(active.practiceVersion, definition.eligiblePractice.minimumVersion) >= 0
    && compareVersion(active.practiceVersion, definition.eligiblePractice.maximumVersion) <= 0
}

function identity(
  definition: PracticeGuideDefinition,
  context: PracticeGuideContext,
  existing?: PracticeGuideStateRecord | null
): PracticeGuideStateIdentity | null {
  if (!context.progress) return null
  if (existing) {
    return {
      guideId: existing.guideId,
      guideVersion: existing.guideVersion,
      courseRunId: existing.courseRunId,
      practiceId: existing.practiceId,
      practiceRunId: existing.practiceRunId
    }
  }
  const active = context.workspace?.activePractice
  if (!active) return null
  return {
    guideId: definition.guideId,
    guideVersion: definition.version,
    courseRunId: context.progress.courseRunId,
    practiceId: active.practiceId,
    practiceRunId: active.runId
  }
}

export class PracticeGuideCoordinator implements PracticeGuideCoordinatorAdapter {
  private readonly replayStages = new Map<string, number>()
  private readonly volatile = new Map<string, PracticeGuideStateRecord>()

  constructor(
    private readonly definitions: Pick<PracticeGuideDefinitionRepository, 'load'>,
    private readonly states: Pick<
      PracticeGuideStateRepository,
      'load' | 'start' | 'advance' | 'pause' | 'resume' | 'skip' | 'complete' | 'dismissConfirmation' | 'reset'
    >
  ) {}

  private async definition(): Promise<PracticeGuideDefinition | null> {
    try {
      return await this.definitions.load(GUIDE_ID)
    } catch {
      return null
    }
  }

  private key(courseRunId: string): string {
    return courseRunId + ':' + GUIDE_ID
  }

  private initialRecord(
    definition: PracticeGuideDefinition,
    context: PracticeGuideContext
  ): PracticeGuideStateRecord | null {
    if (!eligible(definition, context)) return null
    const nextIdentity = identity(definition, context)
    if (!nextIdentity) return null
    const timestamp = new Date().toISOString()
    return {
      schemaVersion: 1,
      ...nextIdentity,
      status: 'in-progress',
      lastStageId: definition.stages[0]!.id,
      masteryConfirmation: null,
      createdAt: timestamp,
      updatedAt: timestamp
    }
  }

  private async state(
    definition: PracticeGuideDefinition,
    context: PracticeGuideContext
  ): Promise<{ record: PracticeGuideStateRecord; error?: string } | null> {
    if (!context.progress) return null
    const key = this.key(context.progress.courseRunId)
    try {
      let current = await this.states.load(context.progress.courseRunId, definition.guideId)
      if (current && !definition.stages.some((stage) => stage.id === current!.lastStageId)) {
        const replacement = LEGACY_STAGE_REPLACEMENTS[current.lastStageId] ?? definition.stages[0]!.id
        try {
          current = await this.states.advance(
            identity(definition, context, current) as PracticeGuideStateIdentity,
            current.lastStageId,
            replacement
          )
        } catch {
          current = { ...current, lastStageId: replacement, updatedAt: new Date().toISOString() }
        }
      }
      if (!current) {
        const cached = this.volatile.get(key)
        if (cached) return { record: cached, error: WARNING }
        const initial = this.initialRecord(definition, context)
        if (!initial) return null
        this.volatile.set(key, initial)
        current = await this.states.start({
          guideId: initial.guideId,
          guideVersion: initial.guideVersion,
          courseRunId: initial.courseRunId,
          practiceId: initial.practiceId,
          practiceRunId: initial.practiceRunId
        }, initial.lastStageId)
      }
      this.volatile.set(key, current)
      return { record: current }
    } catch {
      const current = this.volatile.get(key) ?? this.initialRecord(definition, context)
      if (current) this.volatile.set(key, current)
      return current ? { record: current, error: WARNING } : null
    }
  }

  private hidden(
    definition: PracticeGuideDefinition,
    record: PracticeGuideStateRecord,
    replay: boolean,
    error?: string
  ): PracticeGuideView {
    return {
      schemaVersion: 1,
      guideId: definition.guideId,
      guideVersion: definition.version,
      courseRunId: record.courseRunId,
      practiceId: record.practiceId,
      practiceRunId: record.practiceRunId,
      status: record.status,
      currentStageId: record.lastStageId,
      step: Math.max(1, definition.stages.findIndex((stage) => stage.id === record.lastStageId) + 1),
      stepCount: definition.stages.length,
      presentation: null,
      anchor: null,
      title: null,
      body: null,
      primaryLabel: null,
      secondaryLabel: null,
      replay,
      masteryConfirmation: record.masteryConfirmation,
      ...(error ? { error } : {})
    }
  }

  private view(
    definition: PracticeGuideDefinition,
    record: PracticeGuideStateRecord,
    context: PracticeGuideContext,
    replay: boolean,
    error?: string
  ): PracticeGuideView {
    const confirmationIndex = definition.stages.length - 1
    const replayIndex = this.replayStages.get(this.key(record.courseRunId))
    const index = record.status === 'completed' && record.masteryConfirmation === 'pending'
      ? confirmationIndex
      : replay && replayIndex !== undefined
        ? replayIndex
        : definition.stages.findIndex((stage) => stage.id === record.lastStageId)
    const stage = definition.stages[Math.max(0, index)]!

    const confirmation = stage.presentation === 'mastery-confirmation'
    const wrongSurface = confirmation
      ? context.surface !== 'learning' || context.progress?.sceneId !== 'module-1-mastery'
      : context.surface !== 'full'
    const unavailable = (stage.id === 'request-review' && (
      !context.workspace?.review?.canReview
      || (context.workspace.review.status === 'needs-work' && Boolean(context.workspace.review.result))
    ))
      || (stage.id === 'return-to-course' && !context.workspace?.review?.canReturn)
    const inactive = !replay && (
      record.status === 'paused'
      || record.status === 'skipped'
      || (record.status === 'completed' && record.masteryConfirmation !== 'pending')
    )

    if (wrongSurface || unavailable || inactive) return this.hidden(definition, record, replay, error)

    return {
      ...this.hidden(definition, record, replay, error),
      status: replay ? 'in-progress' : record.status,
      currentStageId: stage.id,
      step: index + 1,
      presentation: stage.presentation,
      anchor: stage.anchor ?? null,
      title: stage.title,
      body: stage.body,
      primaryLabel: stage.primaryLabel ?? null,
      secondaryLabel: stage.secondaryLabel ?? null
    }
  }

  private async reconcile(
    definition: PracticeGuideDefinition,
    value: { record: PracticeGuideStateRecord; error?: string },
    context: PracticeGuideContext
  ): Promise<{ record: PracticeGuideStateRecord; error?: string }> {
    const key = this.key(value.record.courseRunId)
    if (this.replayStages.has(key) || value.record.status !== 'in-progress') return value
    const index = definition.stages.findIndex((stage) => stage.id === value.record.lastStageId)
    const returnIndex = definition.stages.findIndex((stage) => stage.id === 'return-to-course')
    const reviewPassed = context.workspace?.review?.status === 'passed'
    if (!reviewPassed && value.record.lastStageId === 'return-to-course') {
      try {
        const next = await this.states.advance(
          identity(definition, context, value.record) as PracticeGuideStateIdentity,
          value.record.lastStageId,
          'request-review'
        )
        this.volatile.set(key, next)
        return { record: next, error: value.error }
      } catch {
        const next = { ...value.record, lastStageId: 'request-review' }
        this.volatile.set(key, next)
        return { record: next, error: WARNING }
      }
    }
    if (!reviewPassed || index >= returnIndex) return value
    try {
      const next = await this.states.advance(
        identity(definition, context, value.record) as PracticeGuideStateIdentity,
        value.record.lastStageId,
        'return-to-course'
      )
      this.volatile.set(key, next)
      return { record: next, error: value.error }
    } catch {
      const next = { ...value.record, lastStageId: 'return-to-course' }
      this.volatile.set(key, next)
      return { record: next, error: WARNING }
    }
  }

  async load(context: PracticeGuideContext): Promise<PracticeGuideView | null> {
    const definition = await this.definition()
    if (!definition || !context.progress) return null
    const existing = await this.state(definition, context)
    if (!existing) return null

    const currentActive = context.workspace?.activePractice
    if (context.surface !== 'learning' && (
      !currentActive
      || currentActive.runId !== existing.record.practiceRunId
      || currentActive.practiceId !== existing.record.practiceId
    )) return null

    const reconciled = await this.reconcile(definition, existing, context)
    return this.view(
      definition,
      reconciled.record,
      context,
      this.replayStages.has(this.key(reconciled.record.courseRunId)),
      reconciled.error
    )
  }

  async update(
    request: PracticeGuideUpdateRequest,
    context: PracticeGuideContext
  ): Promise<PracticeGuideView | null> {
    const definition = await this.definition()
    if (!definition || !context.progress) return null
    const current = await this.state(definition, context)
    if (!current) return null
    const key = this.key(current.record.courseRunId)
    const stateIdentity = identity(definition, context, current.record) as PracticeGuideStateIdentity
    const replayIndex = this.replayStages.get(key)

    if (request.type === 'replay') {
      this.replayStages.set(key, 0)
      return this.view(definition, current.record, context, true)
    }

    if (replayIndex !== undefined) {
      if (request.type === 'skip') this.replayStages.delete(key)
      else if (request.type === 'dismiss-confirmation'
        && definition.stages[replayIndex]?.presentation === 'mastery-confirmation') {
        this.replayStages.delete(key)
      } else if (
        request.type === 'continue'
        || request.type === 'review-requested'
        || request.type === 'course-returned'
      ) {
        const stage = definition.stages[replayIndex]!
        const reviewPassed = request.type !== 'review-requested'
          || context.workspace?.review?.status === 'passed'
        if (request.expectedStageId === stage.id && request.type === stage.advancement && reviewPassed) {
          if (replayIndex >= definition.stages.length - 1) this.replayStages.delete(key)
          else this.replayStages.set(key, replayIndex + 1)
        }
      }
      return this.load(context)
    }

    let record = current.record
    try {
      if (request.type === 'pause') record = await this.states.pause(stateIdentity, request.expectedStageId)
      else if (request.type === 'resume') record = await this.states.resume(stateIdentity)
      else if (request.type === 'skip') record = await this.states.skip(stateIdentity, request.expectedStageId)
      else if (request.type === 'dismiss-confirmation') record = await this.states.dismissConfirmation(stateIdentity)
      else if (request.type === 'course-returned') {
        record = await this.states.complete(stateIdentity, request.expectedStageId)
      } else if (request.type !== 'start') {
        const index = definition.stages.findIndex((stage) => stage.id === record.lastStageId)
        const stage = definition.stages[index]!
        const eventMatches = request.expectedStageId === stage?.id && request.type === stage.advancement
        const reviewPassed = request.type !== 'review-requested' || context.workspace?.review?.status === 'passed'
        if (eventMatches && reviewPassed && index < definition.stages.length - 1) {
          record = await this.states.advance(stateIdentity, stage.id, definition.stages[index + 1]!.id)
        }
      }
      this.volatile.set(key, record)
      return this.load(context)
    } catch {
      const timestamp = new Date().toISOString()
      let fallback = record
      if (request.type === 'pause' && record.lastStageId === request.expectedStageId) {
        fallback = { ...record, status: 'paused', updatedAt: timestamp }
      } else if (request.type === 'resume') {
        fallback = {
          ...record,
          status: record.status === 'paused' ? 'in-progress' : record.status,
          updatedAt: timestamp
        }
      } else if (request.type === 'skip' && record.lastStageId === request.expectedStageId) {
        fallback = { ...record, status: 'skipped', updatedAt: timestamp }
      } else if (request.type === 'dismiss-confirmation') {
        fallback = {
          ...record,
          masteryConfirmation: record.status === 'completed' ? 'dismissed' : record.masteryConfirmation,
          updatedAt: timestamp
        }
      } else if (request.type === 'course-returned' && record.lastStageId === request.expectedStageId) {
        fallback = { ...record, status: 'completed', masteryConfirmation: 'pending', updatedAt: timestamp }
      } else if (request.type !== 'start') {
        const index = definition.stages.findIndex((stage) => stage.id === record.lastStageId)
        const stage = definition.stages[index]
        const eventMatches = request.expectedStageId === stage?.id && request.type === stage.advancement
        const reviewPassed = request.type !== 'review-requested' || context.workspace?.review?.status === 'passed'
        if (eventMatches && reviewPassed && index < definition.stages.length - 1) {
          fallback = { ...record, status: 'in-progress', lastStageId: definition.stages[index + 1]!.id, updatedAt: timestamp }
        }
      }
      this.volatile.set(key, fallback)
      return { ...this.view(definition, fallback, context, false), error: WARNING }
    }
  }

  async completeCourseReturn(context: PracticeGuideContext): Promise<void> {
    const definition = await this.definition()
    if (!definition || !context.progress) return
    const current = await this.state(definition, context)
    if (!current || current.record.status !== 'in-progress') return
    const returnStage = definition.stages.find((stage) => stage.id === 'return-to-course')
    if (!returnStage) return
    const stateIdentity = identity(definition, context, current.record) as PracticeGuideStateIdentity
    let record = current.record
    if (record.lastStageId !== returnStage.id) {
      record = await this.states.advance(stateIdentity, record.lastStageId, returnStage.id)
    }
    if (record.lastStageId === returnStage.id) {
      record = await this.states.complete(stateIdentity, returnStage.id)
    }
    this.volatile.set(this.key(record.courseRunId), record)
  }

  async reset(): Promise<void> {
    this.replayStages.clear()
    this.volatile.clear()
    await this.states.reset()
  }
}
