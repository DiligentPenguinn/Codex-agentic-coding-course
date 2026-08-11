import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { ProgressRepository } from '../electron/main/progress-repository'
import type { PracticeCompletionReceipt, ProgressUpdate } from '../shared/contracts'

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

    await expect(repository.returnFromPractice(receipt)).rejects.toThrow('not authoritative')
    await repository.recordPracticeCompletion(receipt)
    const duplicate = await repository.recordPracticeCompletion(receipt)
    expect(duplicate.practiceCompletions).toEqual([receipt])
    expect(duplicate.practiceCompletions[0]?.approvedConfiguration).toEqual(receipt.approvedConfiguration)
    await expect(repository.recordPracticeCompletion({
      ...receipt,
      evidenceSummary: 'Conflicting stale review'
    })).rejects.toThrow('different completion receipt')
    await expect(repository.returnFromPractice({
      ...receipt,
      evidenceSummary: 'Conflicting stale review'
    })).rejects.toThrow('not authoritative')
    const returned = await repository.returnFromPractice(receipt)
    expect(returned).toMatchObject({
      currentLessonId: 'module-1',
      checkpointId: 'm1-mastery',
      sceneId: 'module-1-mastery',
      practiceCompletions: [receipt]
    })
    await expect(repository.returnFromPractice(receipt)).resolves.toEqual(returned)
    await expect(new ProgressRepository(directory).returnFromPractice(receipt)).resolves.toEqual(returned)
    await expect(repository.recordPracticeCompletion({
      ...receipt,
      courseRunId: 'another-course'
    })).rejects.toThrow('another course run')
  })

  it('requires a passed planning Practice and a 12/15 mastery score before Module 2 completion', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'practice-completion-progress-'))
    directories.push(directory)
    const repository = new ProgressRepository(directory)
    const assessmentDecisions = Object.fromEntries(
      Array.from({ length: 15 }, (_, index) => [
        `assessment:final-${index + 1}`,
        index < 12 ? 'correct:test' : 'incorrect:test'
      ])
    )
    const progress = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-prd-review',
      checkpointId: 'm2-planning-package',
      sceneId: 'module-2-planning-package',
      sceneHistory: [],
      completedCheckpointIds: ['m2-implementation-plan'],
      decisions: {}
    })
    const receipt: PracticeCompletionReceipt = {
      schemaVersion: 1,
      courseRunId: progress.courseRunId,
      practiceId: 'm2-planning-package',
      practiceVersion: '2.0.0',
      runId: 'run-m2',
      checkpointId: 'm2-planning-package',
      status: 'completed',
      completedAt: '2026-08-10T00:00:00.000Z',
      evidenceSummary: 'Triết đã duyệt hai artifact hiện tại.',
      masterySummary: 'PRD, plan, alignment, phạm vi và quyền sở hữu đều đạt.',
      destination: {
        lessonId: 'module-2',
        checkpointId: 'm2-mastery',
        sceneId: 'module-2-mastery'
      }
    }
    const completionUpdate: ProgressUpdate = {
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-assessment',
      checkpointId: 'm2-complete',
      sceneId: 'module-2-complete',
      sceneHistory: ['module-2-final-summary'],
      completedCheckpointIds: ['m2-implementation-plan', 'm2-planning-package', 'm2-mastery'],
      decisions: assessmentDecisions
    }

    await expect(repository.save(completionUpdate)).rejects.toThrow('passed planning Practice')
    await repository.recordPracticeCompletion(receipt)
    const returned = await repository.returnFromPractice(receipt)
    expect(returned).toMatchObject({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-assessment',
      checkpointId: 'm2-mastery',
      sceneId: 'module-2-mastery'
    })
    await expect(new ProgressRepository(directory).returnFromPractice(receipt)).resolves.toEqual(returned)
    await expect(repository.save({
      ...completionUpdate,
      decisions: { ...assessmentDecisions, 'assessment:final-12': 'incorrect:test' }
    })).rejects.toThrow('12/15')
    await expect(repository.save(completionUpdate)).resolves.toMatchObject({
      checkpointId: 'm2-complete',
      sceneId: 'module-2-complete'
    })
  })
})
