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
  version: '1.0.0',
  eligiblePractice: {
    practiceId: 'm1-codex-safe-setup',
    minimumVersion: '2.0.0',
    maximumVersion: '2.0.0'
  },
  replayPolicy: 'once-per-course-run',
  stages: [
    { id: 'practice-introduction', presentation: 'intro-dialog', advancement: 'continue', title: 'Intro', body: 'Body', primaryLabel: 'Start' },
    { id: 'executor-orientation', presentation: 'orientation-card', advancement: 'continue', title: 'Executor', body: 'Body' },
    { id: 'ask-teacher', presentation: 'coach-mark', advancement: 'teacher-tab-selected', anchor: 'teacher-tab', title: 'Teacher', body: 'Body' },
    { id: 'inspect-progress', presentation: 'coach-mark', advancement: 'progress-tab-selected', anchor: 'progress-tab', title: 'Progress', body: 'Body' },
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

afterEach(async () => Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))))

describe('PracticeGuideCoordinator', () => {
  it('auto-starts and advances only on the stage semantic event', async () => {
    const guide = await coordinator()
    expect((await guide.load(context()))?.currentStageId).toBe('practice-introduction')
    expect((await guide.update({ type: 'teacher-tab-selected', expectedStageId: 'practice-introduction' }, context()))?.currentStageId)
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
})
