import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { ExecutorActivitySnapshot } from '../shared/contracts'
import type { ExecutorActivityObserver } from '../electron/main/executor-activity-observer'
import { PracticeCoordinator } from '../electron/main/practice-coordinator'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { DeterministicPracticeReviewEvaluator } from '../electron/main/practice-review-evaluator'
import { PracticeReviewService } from '../electron/main/practice-review-service'
import {
  defaultPracticeWorkspaceRecord,
  PracticeRunRepository
} from '../electron/main/practice-run-repository'
import { ProgressRepository } from '../electron/main/progress-repository'
import { TeacherChatRepository } from '../electron/main/teacher-fixture'

const directories: string[] = []

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

async function harness(options: { verification?: boolean } = {}) {
  const directory = await mkdtemp(join(tmpdir(), 'course-companion-practice-review-'))
  directories.push(directory)
  const runs = new PracticeRunRepository(directory)
  const progress = new ProgressRepository(directory, () => new Date('2026-08-09T00:00:00.000Z'))
  await progress.save({
    currentLessonId: 'module-1',
    checkpointId: 'm1-plan-approval',
    sceneId: 'module-1-success',
    completedCheckpointIds: [],
    decisions: {}
  })
  const binding = {
    runId: 'run-1',
    threadId: 'thread-1',
    name: 'Practice 1',
    workspaceRoot: directory,
    createdAt: '2026-08-09T00:00:00.000Z'
  }
  await runs.save({
    ...defaultPracticeWorkspaceRecord(),
    activeRun: {
      runId: 'run-1',
      generation: 1,
      status: 'active',
      binding,
      startedAt: '2026-08-09T00:00:00.000Z',
      updatedAt: '2026-08-09T00:00:00.000Z',
      practiceId: 'm1-verifiable-brief',
      practiceVersion: '1.0.0',
      reviewStatus: 'not-reviewed',
      checklist: [
        { id: 'review-objective', title: 'Review objective', status: 'completed' },
        { id: 'open-executor', title: 'Open Executor', status: 'current' },
        { id: 'build-and-verify', title: 'Build', status: 'upcoming' },
        { id: 'review-evidence', title: 'Review', status: 'upcoming' }
      ]
    }
  })
  const snapshot: ExecutorActivitySnapshot = {
    schemaVersion: 1,
    runId: 'run-1',
    threadId: 'thread-1',
    status: 'response-ready',
    cursor: 'turn:item',
    learnerPrompts: ['Apply the approved scoped change.'],
    executorResponses: ['Implemented and checked the requested change.'],
    approvalEvents: [],
    changedFiles: [],
    verificationEvidence: [],
    reportedChangedFiles: ['starters/contentpilot/app/globals.css'],
    reportedVerificationEvidence: options.verification === false
      ? []
      : ['390px routes report scrollWidth <= innerWidth and no horizontal overflow.'],
    workspaceConfirmedChangedFiles: ['starters/contentpilot/app/globals.css'],
    workspaceCommittedReportedFilesSinceRunStart: [],
    workspaceCurrentlyDirtyReportedFiles: [],
    observedAt: '2026-08-09T00:01:00.000Z',
    workspaceBaseline: null
  }
  const activity = {
    async bind() {
      return structuredClone(snapshot)
    }
  } as unknown as ExecutorActivityObserver
  const coordinator = new PracticeCoordinator(runs, {
    async createTarget() {
      throw new Error('not used')
    },
    async prepareTarget() {
      throw new Error('not used')
    },
    async openTarget() {
      throw new Error('not used')
    }
  })
  const chat = new TeacherChatRepository(directory)
  const service = new PracticeReviewService(
    new PracticeDefinitionRepository(join(process.cwd(), 'content', 'practices')),
    runs,
    coordinator,
    progress,
    activity,
    new DeterministicPracticeReviewEvaluator(),
    chat,
    true,
    () => new Date('2026-08-09T00:02:00.000Z'),
    () => 'review-message-1'
  )
  return { chat, runs, service }
}

describe('PracticeReviewService', () => {
  it('persists a pass, completes the checklist, and exposes a return receipt', async () => {
    const { chat, runs, service } = await harness()

    const response = await service.review()

    expect(response.workspace.review).toMatchObject({
      status: 'passed',
      canReturn: true
    })
    expect(response.workspace.checklist.every((step) => step.status === 'completed')).toBe(true)
    await expect(service.passedCompletion()).resolves.toMatchObject({
      practiceId: 'm1-verifiable-brief',
      runId: 'run-1',
      status: 'completed',
      destination: { sceneId: 'module-1-reflection' }
    })
    expect((await runs.load()).activeRun?.reviewStatus).toBe('passed')
    expect((await chat.loadConversation()).messages.at(-1)?.content).toContain(
      'Executor b\u00e1o c\u00e1o'
    )
  })

  it('keeps course return locked and points at the earliest unmet step', async () => {
    const { service } = await harness({ verification: false })

    const response = await service.review()

    expect(response.workspace.review).toMatchObject({
      status: 'needs-work',
      canReturn: false
    })
    expect(response.workspace.checklist.map((step) => step.status)).toEqual([
      'completed',
      'completed',
      'current',
      'upcoming'
    ])
    await expect(service.passedCompletion()).rejects.toThrow()
  })
})
