import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type {
  LearnerProgress,
  PracticeGuideContext,
  PracticeGuideDefinition,
  PracticeWorkspaceView
} from '../shared/contracts'
import { PracticeGuideCoordinator } from '../electron/main/practice-guide-coordinator'
import { PracticeGuideStateRepository } from '../electron/main/practice-guide-state-repository'

const directories: string[] = []
const definition: PracticeGuideDefinition = {
  schemaVersion: 1,
  guideId: 'm1-practice-mode-first-run',
  version: '2.0.0',
  eligiblePractice: {
    practiceId: 'm1-codex-safe-setup',
    minimumVersion: '2.0.0',
    maximumVersion: '2.0.0'
  },
  replayPolicy: 'once-per-course-run',
  stages: [
    { id: 'practice-introduction', presentation: 'intro-dialog', advancement: 'continue', title: 'Intro', body: 'Body', primaryLabel: 'Start' },
    { id: 'executor-orientation', presentation: 'orientation-card', advancement: 'continue', title: 'Executor', body: 'Body' },
    { id: 'review-workspace', presentation: 'coach-mark', advancement: 'continue', anchor: 'review-progress', title: 'Review workspace', body: 'Body' },
    { id: 'configuration-evidence', presentation: 'coach-mark', advancement: 'continue', anchor: 'configuration-evidence', title: 'Evidence', body: 'Body' },
    { id: 'request-review', presentation: 'coach-mark', advancement: 'review-requested', anchor: 'review-progress', title: 'Review', body: 'Body' },
    { id: 'return-to-course', presentation: 'coach-mark', advancement: 'course-returned', anchor: 'return-to-course', title: 'Return', body: 'Body' },
    { id: 'practice-loop-confirmation', presentation: 'mastery-confirmation', advancement: 'continue', title: 'Done', body: 'Body' }
  ]
}
const definitions = { load: async () => definition }

function progress(module: 'module-1' | 'module-2' = 'module-1', sceneId = 'module-1-practice'): LearnerProgress {
  return {
    schemaVersion: 3,
    courseVersion: '0.2.0',
    courseRunId: 'course-1',
    currentLessonId: module,
    currentCourseLessonId: module,
    checkpointId: module === 'module-1' ? 'm1-practice' : 'm2-practice',
    sceneId,
    sceneHistory: [],
    completedCheckpointIds: [],
    decisions: {},
    practice: { schemaVersion: 1, fixtures: [] },
    practiceCompletions: [],
    startedAt: '2026-08-17T00:00:00.000Z',
    updatedAt: '2026-08-17T00:00:00.000Z'
  } as unknown as LearnerProgress
}

function workspace(status: 'not-reviewed' | 'needs-work' | 'passed' = 'not-reviewed'): PracticeWorkspaceView {
  return {
    schemaVersion: 1,
    phase: 'active',
    title: 'Practice',
    objective: 'Objective',
    expectedOutcome: 'Outcome',
    checklist: [],
    activePractice: {
      runId: 'run-1',
      generation: 1,
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0',
      executorChatName: 'Executor',
      startedAt: '2026-08-17T00:00:00.000Z'
    },
    review: { status, canReview: status !== 'passed', canReturn: status === 'passed' },
    presentation: { fullPanel: 'teacher', compactPanel: 'teacher' },
    capabilities: {
      canStartNew: true,
      canResume: true,
      selectiveTransferAvailable: false,
      selectiveTransferReason: 'Unavailable'
    }
  } as PracticeWorkspaceView
}

function context(overrides: Partial<PracticeGuideContext> = {}): PracticeGuideContext {
  return { progress: progress(), workspace: workspace(), surface: 'full', activeTab: 'teacher', ...overrides }
}

async function coordinator() {
  const directory = await mkdtemp(join(tmpdir(), 'guide-coordinator-'))
  directories.push(directory)
  return new PracticeGuideCoordinator(definitions, new PracticeGuideStateRepository(directory))
}

async function harness() {
  const directory = await mkdtemp(join(tmpdir(), 'guide-coordinator-'))
  directories.push(directory)
  const states = new PracticeGuideStateRepository(directory)
  return { guide: new PracticeGuideCoordinator(definitions, states), states }
}

afterEach(async () => Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))))

describe('PracticeGuideCoordinator', () => {
  it('auto-starts and advances only on the stage semantic event', async () => {
    const guide = await coordinator()
    expect((await guide.load(context()))?.currentStageId).toBe('practice-introduction')
    expect((await guide.update({ type: 'review-requested', expectedStageId: 'practice-introduction' }, context()))?.currentStageId)
      .toBe('practice-introduction')
    expect((await guide.update({ type: 'continue', expectedStageId: 'practice-introduction' }, context()))?.currentStageId)
      .toBe('executor-orientation')
  })

  it('pauses, resumes, skips, and replays without replacing durable skip', async () => {
    const guide = await coordinator()
    await guide.load(context())
    expect((await guide.update({ type: 'pause', expectedStageId: 'practice-introduction' }, context()))?.presentation).toBeNull()
    expect((await guide.update({ type: 'resume' }, context()))?.presentation).toBe('intro-dialog')
    expect((await guide.update({ type: 'skip', expectedStageId: 'practice-introduction' }, context()))?.status).toBe('skipped')
    expect((await guide.update({ type: 'replay' }, context()))?.replay).toBe(true)
    await guide.update({ type: 'continue', expectedStageId: 'practice-introduction' }, context())
    const replay = await guide.load(context())
    expect(replay?.currentStageId).toBe('executor-orientation')
    expect(replay?.status).toBe('in-progress')
  })

  it('dismisses the final replay confirmation without changing durable skip state', async () => {
    const guide = await coordinator()
    await guide.load(context())
    await guide.update({ type: 'skip', expectedStageId: 'practice-introduction' }, context())
    await guide.update({ type: 'replay' }, context())
    const events = [
      { type: 'continue', expectedStageId: 'practice-introduction' },
      { type: 'continue', expectedStageId: 'executor-orientation' },
      { type: 'continue', expectedStageId: 'review-workspace' },
      { type: 'continue', expectedStageId: 'configuration-evidence' },
      { type: 'review-requested', expectedStageId: 'request-review' },
      { type: 'course-returned', expectedStageId: 'return-to-course' }
    ] as const
    for (const event of events) await guide.update(event, context({ workspace: workspace('passed') }))
    const mastery = context({
      progress: progress('module-1', 'module-1-mastery'),
      workspace: null,
      surface: 'learning'
    })
    const confirmation = await guide.load(mastery)
    expect(confirmation?.presentation).toBe('mastery-confirmation')
    expect(confirmation?.replay).toBe(true)
    const dismissed = await guide.update({ type: 'dismiss-confirmation' }, mastery)
    expect(dismissed?.presentation).toBeNull()
    expect(dismissed?.replay).toBe(false)
    expect(dismissed?.status).toBe('skipped')
  })

  it('reconciles an early pass directly to return', async () => {
    const guide = await coordinator()
    await guide.load(context())
    const view = await guide.load(context({ workspace: workspace('passed') }))
    expect(view?.currentStageId).toBe('return-to-course')
    expect(view?.anchor).toBe('return-to-course')
  })

  it('completes on course return and shows confirmation only at mastery', async () => {
    const guide = await coordinator()
    await guide.load(context({ workspace: workspace('passed') }))
    await guide.update(
      { type: 'course-returned', expectedStageId: 'return-to-course' },
      context({ workspace: workspace('passed') })
    )
    const mastery = context({
      progress: progress('module-1', 'module-1-mastery'),
      workspace: null,
      surface: 'learning'
    })
    expect((await guide.load(mastery))?.presentation).toBe('mastery-confirmation')
    expect((await guide.update({ type: 'dismiss-confirmation' }, mastery))?.presentation).toBeNull()
  })

  it('keeps step five visible until review passes, then reveals return', async () => {
    const guide = await coordinator()
    await guide.load(context())
    for (const stage of [
      'practice-introduction',
      'executor-orientation',
      'review-workspace',
      'configuration-evidence'
    ]) {
      await guide.update({ type: 'continue', expectedStageId: stage }, context())
    }
    expect((await guide.load(context()))?.primaryLabel).toBeNull()
    const waiting = await guide.update(
      { type: 'review-requested', expectedStageId: 'request-review' },
      context({ workspace: workspace('needs-work') })
    )
    expect(waiting?.currentStageId).toBe('request-review')
    expect(waiting?.presentation).toBe('coach-mark')
    const passed = await guide.update(
      { type: 'review-requested', expectedStageId: 'request-review' },
      context({ workspace: workspace('passed') })
    )
    expect(passed?.currentStageId).toBe('return-to-course')
    expect(passed?.presentation).toBe('coach-mark')
  })

  it('keeps replayed step five visible until an authoritative pass', async () => {
    const guide = await coordinator()
    await guide.load(context())
    await guide.update({ type: 'skip', expectedStageId: 'practice-introduction' }, context())
    await guide.update({ type: 'replay' }, context())
    for (const stage of [
      'practice-introduction',
      'executor-orientation',
      'review-workspace',
      'configuration-evidence'
    ]) {
      await guide.update(
        { type: 'continue', expectedStageId: stage },
        context({ workspace: workspace('needs-work') })
      )
    }
    expect((await guide.update(
      { type: 'review-requested', expectedStageId: 'request-review' },
      context({ workspace: workspace('needs-work') })
    ))?.currentStageId).toBe('request-review')
    expect((await guide.update(
      { type: 'review-requested', expectedStageId: 'request-review' },
      context({ workspace: workspace('passed') })
    ))?.currentStageId).toBe('return-to-course')
  })

  it.each(['not-reviewed', 'needs-work'] as const)(
    'repairs a stranded return cursor back to step five while review is %s',
    async (status) => {
      const { guide, states } = await harness()
      await guide.load(context())
      const state = await states.load('course-1', definition.guideId)
      expect(state).not.toBeNull()
      await states.advance({
        guideId: state!.guideId,
        guideVersion: state!.guideVersion,
        courseRunId: state!.courseRunId,
        practiceId: state!.practiceId,
        practiceRunId: state!.practiceRunId
      }, state!.lastStageId, 'return-to-course')

      const repaired = await guide.load(context({ workspace: workspace(status) }))
      expect(repaired?.currentStageId).toBe('request-review')
      expect(repaired?.presentation).toBe('coach-mark')
      expect((await states.load('course-1', definition.guideId))?.lastStageId).toBe('request-review')
    }
  )

  it('authoritatively completes return when the renderer guide update is still racing', async () => {
    const guide = await coordinator()
    await guide.load(context())
    await guide.completeCourseReturn(context({ workspace: workspace('passed') }))

    const mastery = context({
      progress: progress('module-1', 'module-1-mastery'),
      workspace: null,
      surface: 'learning'
    })
    expect((await guide.load(mastery))?.presentation).toBe('mastery-confirmation')
  })

  it('does not start for Module 2 or a replaced Practice run', async () => {
    const guide = await coordinator()
    expect(await guide.load(context({ progress: progress('module-2', 'module-2-practice') }))).toBeNull()
    await guide.load(context())
    const replaced = workspace()
    if (replaced.activePractice) replaced.activePractice.runId = 'run-2'
    expect(await guide.load(context({ workspace: replaced }))).toBeNull()
  })

  it('keeps Practice usable when guide content is unavailable', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'guide-coordinator-'))
    directories.push(directory)
    const guide = new PracticeGuideCoordinator(
      { load: async () => { throw new Error('missing') } },
      new PracticeGuideStateRepository(directory)
    )
    expect(await guide.load(context())).toBeNull()
  })

  it('continues in volatile state with a warning when the first state write fails', async () => {
    const guide = new PracticeGuideCoordinator(definitions, {
      load: async () => null,
      start: async () => { throw new Error('read-only') },
      advance: async () => { throw new Error('read-only') },
      pause: async () => { throw new Error('read-only') },
      resume: async () => { throw new Error('read-only') },
      skip: async () => { throw new Error('read-only') },
      complete: async () => { throw new Error('read-only') },
      dismissConfirmation: async () => { throw new Error('read-only') },
      reset: async () => undefined
    })
    const intro = await guide.load(context())
    expect(intro?.currentStageId).toBe('practice-introduction')
    expect(intro?.error).toContain('không thể lưu')
    const orientation = await guide.update(
      { type: 'continue', expectedStageId: 'practice-introduction' },
      context()
    )
    expect(orientation?.currentStageId).toBe('executor-orientation')
    expect(orientation?.error).toContain('không thể lưu')
    const paused = await guide.update(
      { type: 'pause', expectedStageId: 'executor-orientation' },
      context()
    )
    expect(paused?.status).toBe('paused')
    expect((await guide.update({ type: 'resume' }, context()))?.currentStageId)
      .toBe('executor-orientation')
  })
})
