import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { ProgressRepository } from '../electron/main/progress-repository'
import type { PracticeCompletionReceipt } from '../shared/contracts'

const directories: string[] = []

afterEach(async () => {
  await Promise.all(directories.splice(0).map((value) => rm(value, { recursive: true, force: true })))
})

describe('Practice completion progress', () => {
  it('records one authoritative receipt and applies its destination idempotently', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'practice-completion-progress-'))
    directories.push(directory)
    const repository = new ProgressRepository(directory)
    const progress = await repository.save({
      currentLessonId: 'module-1',
      currentCourseLessonId: 'm1-assessment',
      checkpointId: 'm1-setup-checklist',
      sceneId: 'module-1-setup-checklist',
      sceneHistory: [],
      completedCheckpointIds: ['m1-codex-orientation'],
      decisions: {}
    })
    const receipt: PracticeCompletionReceipt = {
      schemaVersion: 1,
      courseRunId: progress.courseRunId,
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0',
      runId: 'run-1',
      checkpointId: 'm1-setup-checklist',
      status: 'completed',
      completedAt: '2026-08-10T00:00:00.000Z',
      evidenceSummary: 'Passed',
      masterySummary: 'Complete',
      destination: {
        lessonId: 'module-1',
        checkpointId: 'm1-mastery',
        sceneId: 'module-1-mastery'
      },
      approvedConfiguration: {
        schemaVersion: 1,
        sourcePracticeId: 'm1-codex-safe-setup',
        sourcePracticeVersion: '2.0.0',
        model: 'gpt-5.6-sol',
        reasoningEffort: 'high',
        serviceTier: 'standard',
        approvedAt: '2026-08-10T00:00:00.000Z'
      }
    }

    await repository.recordPracticeCompletion(receipt)
    const duplicate = await repository.recordPracticeCompletion(receipt)
    expect(duplicate.practiceCompletions).toEqual([receipt])
    const returned = await repository.returnFromPractice(receipt)
    expect(returned).toMatchObject({
      currentLessonId: 'module-1',
      checkpointId: 'm1-mastery',
      sceneId: 'module-1-mastery',
      practiceCompletions: [receipt]
    })
    await expect(repository.returnFromPractice(receipt)).resolves.toEqual(returned)
    await expect(repository.recordPracticeCompletion({
      ...receipt,
      courseRunId: 'another-course'
    })).rejects.toThrow('another course run')
  })
})
