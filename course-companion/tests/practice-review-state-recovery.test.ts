import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  defaultPracticeWorkspaceRecord,
  PracticeRunRepository,
  type PracticeWorkspaceRecord
} from '../electron/main/practice-run-repository'
import type { PracticeCompletionReceipt, PracticeReviewResult } from '../shared/contracts'

const directories: string[] = []
const timestamp = '2026-08-10T00:00:00.000Z'

async function directory() {
  const value = await mkdtemp(join(tmpdir(), 'practice-review-state-'))
  directories.push(value)
  return value
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((value) => rm(value, { recursive: true, force: true })))
})

function workspace(): PracticeWorkspaceRecord {
  return {
    ...defaultPracticeWorkspaceRecord(),
    activeRun: {
      runId: 'run-1',
      generation: 1,
      status: 'active',
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0',
      workspaceKind: 'pilot-workspace',
      taskPolicy: 'inherit-configuration-only',
      evidenceProfile: 'codex-task-configuration',
      reviewStatus: 'not-reviewed',
      binding: {
        runId: 'run-1',
        threadId: 'thread-1',
        name: 'Practice 1',
        workspaceRoot: 'D:\\course',
        createdAt: timestamp
      },
      startedAt: timestamp,
      updatedAt: timestamp,
      checklist: [{ id: 'step-1', title: 'Step 1', status: 'current', dependencyInputs: {} }],
      learnerDecisions: {},
      learnerApprovals: {},
      evidence: null,
      invalidations: []
    }
  }
}

function result(verdict: 'needs-work' | 'passed', digest: string): PracticeReviewResult {
  return {
    schemaVersion: 1,
    practiceId: 'm1-codex-safe-setup',
    practiceVersion: '2.0.0',
    runId: 'run-1',
    verdict,
    criteria: [],
    summary: verdict,
    reviewedAt: timestamp,
    sourceDigest: digest.repeat(64)
  }
}

const completion: PracticeCompletionReceipt = {
  schemaVersion: 1,
  courseRunId: 'course-1',
  practiceId: 'm1-codex-safe-setup',
  practiceVersion: '2.0.0',
  runId: 'run-1',
  checkpointId: 'm1-setup-checklist',
  status: 'completed',
  completedAt: timestamp,
  evidenceSummary: 'Passed',
  masterySummary: 'Complete',
  destination: {
    lessonId: 'module-1',
    checkpointId: 'm1-mastery',
    sceneId: 'module-1-mastery'
  }
}

describe('Practice review state recovery', () => {
  it('recovers a persisted reviewing state to a retryable status on restart', async () => {
    const path = await directory()
    const repository = new PracticeRunRepository(path)
    await repository.save(workspace())
    const reviewing = await repository.beginReview({
      runId: 'run-1',
      generation: 1,
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0',
      updatedAt: timestamp
    })
    expect(reviewing.activeRun?.reviewStatus).toBe('reviewing')
    await expect(repository.load()).resolves.toMatchObject({
      activeRun: { reviewStatus: 'reviewing' }
    })
    await expect(new PracticeRunRepository(path).load()).resolves.toMatchObject({
      activeRun: { reviewStatus: 'not-reviewed' }
    })
  })

  it('keeps the first completion receipt while a later review needs work', async () => {
    const repository = new PracticeRunRepository(await directory())
    await repository.save(workspace())
    await repository.saveReview({
      runId: 'run-1', generation: 1, practiceId: 'm1-codex-safe-setup', practiceVersion: '2.0.0',
      result: result('passed', 'a'),
      checklist: [{ id: 'step-1', title: 'Step 1', status: 'completed' }],
      completion,
      updatedAt: timestamp
    })
    const later = await repository.saveReview({
      runId: 'run-1', generation: 1, practiceId: 'm1-codex-safe-setup', practiceVersion: '2.0.0',
      result: result('needs-work', 'b'),
      checklist: [{ id: 'step-1', title: 'Step 1', status: 'current' }],
      updatedAt: '2026-08-10T00:01:00.000Z'
    })
    expect(later.activeRun?.reviewStatus).toBe('needs-work')
    expect(later.activeRun?.completion).toEqual(completion)
  })
})
