import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  defaultPracticeWorkspaceRecord,
  PracticeRunRepository,
  type PracticeWorkspaceRecord
} from '../electron/main/practice-run-repository'

const temporaryDirectories: string[] = []

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'course-companion-practice-runs-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

function activeRecord(): PracticeWorkspaceRecord {
  return {
    ...defaultPracticeWorkspaceRecord(),
    activeRun: {
      runId: 'run-1',
      generation: 1,
      status: 'active',
      practiceId: 'generic-practice',
      practiceVersion: '1.0.0',
      reviewStatus: 'not-reviewed',
      binding: {
        runId: 'run-1',
        threadId: 'thread-1',
        name: 'Practice · Module 1',
        workspaceRoot: 'D:\\course',
        createdAt: '2026-08-08T00:00:00.000Z'
      },
      startedAt: '2026-08-08T00:00:00.000Z',
      updatedAt: '2026-08-08T00:00:00.000Z',
      checklist: [
        { id: 'review', title: 'Review objective', status: 'completed' },
        { id: 'open', title: 'Open Executor chat', status: 'current' }
      ]
    }
  }
}

describe('PracticeRunRepository', () => {
  it('starts with no active Practice and Teacher selected on both surfaces', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    await expect(repository.load()).resolves.toEqual(defaultPracticeWorkspaceRecord())
  })

  it('writes one validated active Practice atomically', async () => {
    const directory = await temporaryDirectory()
    const repository = new PracticeRunRepository(directory)
    const record = activeRecord()

    await expect(repository.save(record)).resolves.toEqual(record)
    await expect(repository.load()).resolves.toEqual(record)
    expect(JSON.parse(await readFile(join(directory, 'practice-runs.json'), 'utf8'))).toEqual(record)
  })

  it('quarantines invalid state instead of inventing an active Practice', async () => {
    const directory = await temporaryDirectory()
    await writeFile(join(directory, 'practice-runs.json'), '{"schemaVersion":1,"activeRun":{}}', 'utf8')
    const repository = new PracticeRunRepository(directory)

    await expect(repository.load()).resolves.toEqual(defaultPracticeWorkspaceRecord())
    await expect(readFile(join(directory, 'practice-runs.corrupt.json'), 'utf8')).resolves.toContain('activeRun')
  })

  it('rejects mismatched binding identity and more than one current checklist step', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    const record = activeRecord()
    if (!record.activeRun) throw new Error('fixture missing active run')
    record.activeRun.binding.runId = 'another-run'
    record.activeRun.checklist.push({ id: 'second-current', title: 'Second', status: 'current' })

    await expect(repository.save(record)).rejects.toThrow('Invalid Practice workspace record')
  })

  it('updates panel selection atomically without replacing active review state', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    await repository.save(activeRecord())
    await repository.beginReview({
      runId: 'run-1',
      generation: 1,
      practiceId: 'generic-practice',
      practiceVersion: '1.0.0',
      updatedAt: '2026-08-09T00:00:00.000Z'
    })

    const selected = await repository.selectPanel('compact', 'progress')

    expect(selected.presentation.compactPanel).toBe('progress')
    expect(selected.activeRun?.reviewStatus).toBe('reviewing')
    await expect(repository.load()).resolves.toMatchObject({
      activeRun: { reviewStatus: 'reviewing' },
      presentation: { compactPanel: 'progress' }
    })
  })

  it('advances the active checklist conservatively and never moves it backward', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    const record = activeRecord()
    if (!record.activeRun) throw new Error('fixture missing active run')
    record.activeRun.checklist = [
      { id: 'review-objective', title: 'Review objective', status: 'completed' },
      { id: 'open-executor', title: 'Open Executor', status: 'current' },
      { id: 'build-and-verify', title: 'Build', status: 'upcoming' },
      { id: 'review-evidence', title: 'Review evidence', status: 'upcoming' }
    ]
    await repository.save(record)

    const advanced = await repository.advanceChecklist(
      'run-1',
      'review-evidence',
      '2026-08-09T00:00:00.000Z'
    )
    expect(advanced.activeRun?.checklist.map((step) => step.status)).toEqual([
      'completed', 'completed', 'completed', 'current'
    ])

    const unchanged = await repository.advanceChecklist(
      'run-1',
      'build-and-verify',
      '2026-08-09T00:00:01.000Z'
    )
    expect(unchanged.activeRun?.checklist).toEqual(advanced.activeRun?.checklist)
  })

  it('persists one authoritative review and ignores a stale generation', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    await repository.save(activeRecord())
    const result = {
      schemaVersion: 1 as const,
      practiceId: 'generic-practice',
      practiceVersion: '1.0.0',
      runId: 'run-1',
      verdict: 'passed' as const,
      criteria: [],
      summary: 'Passed.',
      reviewedAt: '2026-08-09T00:00:00.000Z',
      sourceDigest: 'a'.repeat(64)
    }
    const checklist = [
      { id: 'review', title: 'Review objective', status: 'completed' as const },
      { id: 'open', title: 'Open Executor chat', status: 'completed' as const }
    ]
    const completion = {
      schemaVersion: 1 as const,
      courseRunId: 'course-run-1',
      practiceId: 'generic-practice',
      practiceVersion: '1.0.0',
      runId: 'run-1',
      checkpointId: 'm1-plan-approval' as const,
      status: 'completed' as const,
      completedAt: '2026-08-09T00:00:00.000Z',
      evidenceSummary: 'Passed.',
      masterySummary: 'Complete.',
      destination: {
        lessonId: 'module-1' as const,
        checkpointId: 'm1-review' as const,
        sceneId: 'module-1-reflection' as const
      }
    }

    const saved = await repository.saveReview({
      runId: 'run-1',
      generation: 1,
      practiceId: 'generic-practice',
      practiceVersion: '1.0.0',
      result,
      checklist,
      completion,
      updatedAt: result.reviewedAt
    })
    expect(saved.activeRun).toMatchObject({
      reviewStatus: 'passed',
      completion: { runId: 'run-1' }
    })

    const stale = await repository.saveReview({
      runId: 'run-1',
      generation: 2,
      practiceId: 'generic-practice',
      practiceVersion: '1.0.0',
      result: { ...result, sourceDigest: 'b'.repeat(64) },
      checklist,
      completion,
      updatedAt: '2026-08-09T00:01:00.000Z'
    })
    expect(stale.activeRun?.reviewResult?.sourceDigest).toBe('a'.repeat(64))
  })
})
