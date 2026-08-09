import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { FixturePracticeAdapter } from '../electron/main/practice-fixture'
import { ProgressRepository } from '../electron/main/progress-repository'
import type { PracticeScenario, ProgressUpdate } from '../shared/contracts'

const temporaryDirectories: string[] = []

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'course-companion-practice-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

const practiceCheckpoint: ProgressUpdate = {
  currentLessonId: 'module-1',
  checkpointId: 'm1-planning-package',
  sceneId: 'module-1-planning-package',
  completedCheckpointIds: [
    'intro-visual-onboarding',
    'm1-why-planning',
    'm1-contentpilot-brief',
    'm1-prd-concept',
    'm1-prd-interview',
    'm1-prd-approved',
    'm1-implementation-plan',
    'm1-alignment-review'
  ],
  decisions: {}
}

describe('FixturePracticeAdapter', () => {
  it('emits and persists every honestly sourced fixture scenario', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    await repository.save(practiceCheckpoint)
    const adapter = new FixturePracticeAdapter(
      repository,
      () => new Date('2026-08-07T03:00:00.000Z')
    )
    const expected = new Map<PracticeScenario, string>([
      ['started', 'active'],
      ['approval_required', 'approval_required'],
      ['success', 'completed'],
      ['stale', 'stale'],
      ['offline', 'offline'],
      ['error', 'error']
    ])

    for (const [scenario, status] of expected) {
      const state = await adapter.emitFixture({ scenario })
      expect(state.status).toBe(status)
      expect(state.latestEvent).toMatchObject({
        scenario,
        source: 'fixture',
        missionId: 'm1-planning-package'
      })
      await expect(adapter.loadState()).resolves.toEqual(state)
    }
  })

  it('marks success evidence as current and stale evidence as stale', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    await repository.save(practiceCheckpoint)
    const adapter = new FixturePracticeAdapter(
      repository,
      () => new Date('2026-08-07T03:00:00.000Z')
    )

    const success = await adapter.emitFixture({ scenario: 'success' })
    const stale = await adapter.emitFixture({ scenario: 'stale' })

    expect(success.latestEvent?.evidence).toMatchObject({
      prdArtifact: 'PRD.md · đã duyệt',
      implementationPlanArtifact: 'implementation-plan.md · đã duyệt',
      alignment: 'Khớp PRD',
      freshness: 'current'
    })
    expect(stale.latestEvent?.evidence?.freshness).toBe('stale')
    expect(stale.latestEvent?.evidence?.observedAt).not.toBe(stale.latestEvent?.timestamp)
  })

  it('refuses to run without an established learner journey', async () => {
    const adapter = new FixturePracticeAdapter(
      new ProgressRepository(await temporaryDirectory())
    )
    await expect(adapter.emitFixture({ scenario: 'started' })).rejects.toThrow(
      'Learner progress is required'
    )
  })
})
