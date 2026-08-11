import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  defaultPracticeWorkspaceRecord,
  PracticeRunRepository,
  type PracticeRunRecord,
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

function activeRun(overrides: Partial<PracticeRunRecord> = {}): PracticeRunRecord {
  return {
    runId: 'run-1',
    generation: 1,
    status: 'active',
    practiceId: 'm1-codex-safe-setup',
    practiceVersion: '2.0.0',
    workspaceKind: 'pilot-workspace',
    taskPolicy: 'inherit-configuration-only',
    evidenceProfile: 'codex-task-configuration',
    binding: {
      runId: 'run-1',
      threadId: 'thread-1',
      name: 'Practice · Thiết lập Codex',
      workspaceRoot: 'D:\\course',
      createdAt: '2026-08-08T00:00:00.000Z'
    },
    startedAt: '2026-08-08T00:00:00.000Z',
    updatedAt: '2026-08-08T00:00:00.000Z',
    checklist: [
      { id: 'open-task', title: 'Mở task', status: 'current', dependencyInputs: {} },
      { id: 'review-settings', title: 'Duyệt cấu hình', status: 'pending', dependencyInputs: {} }
    ],
    learnerDecisions: {},
    learnerApprovals: {},
    evidence: null,
    invalidations: [],
    reviewStatus: 'not-reviewed',
    ...overrides
  }
}

function activeRecord(run = activeRun()): PracticeWorkspaceRecord {
  return { ...defaultPracticeWorkspaceRecord(), activeRun: run }
}

describe('PracticeRunRepository', () => {
  it('persists a schema-2 run with explicit identity and policy fields', async () => {
    const directory = await temporaryDirectory()
    const repository = new PracticeRunRepository(directory)
    const record = activeRecord()

    await expect(repository.save(record)).resolves.toEqual(record)
    await expect(repository.load()).resolves.toEqual(record)
    expect(JSON.parse(await readFile(join(directory, 'practice-runs.json'), 'utf8'))).toEqual(record)
  })

  it('archives a historical schema-1 active run instead of reinterpreting it', async () => {
    const directory = await temporaryDirectory()
    const historical = {
      schemaVersion: 1,
      activeRun: {
        runId: 'old-run',
        generation: 3,
        practiceId: 'm1-verifiable-brief',
        practiceVersion: '1.0.0',
        binding: {
          runId: 'old-run',
          threadId: 'old-thread',
          name: 'Historical CSS Practice',
          workspaceRoot: 'D:\\course',
          createdAt: '2026-08-01T00:00:00.000Z'
        }
      },
      archivedRuns: [],
      pendingTransition: null,
      presentation: { fullPanel: 'progress', compactPanel: 'teacher' }
    }
    await writeFile(join(directory, 'practice-runs.json'), JSON.stringify(historical), 'utf8')

    const migrated = await new PracticeRunRepository(directory).load()

    expect(migrated.schemaVersion).toBe(2)
    expect(migrated.activeRun).toBeNull()
    expect(migrated.archivedRuns).toEqual([
      expect.objectContaining({
        runId: 'old-run',
        practiceId: 'm1-verifiable-brief',
        outcome: 'historical'
      })
    ])
    expect(migrated.presentation).toEqual({ fullPanel: 'progress', compactPanel: 'teacher' })
  })

  it('rejects unsafe policy/profile combinations and mismatched bindings', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    const unsafe = activeRecord(activeRun({
      taskPolicy: 'safe-workspace-write',
      binding: { ...activeRun().binding, runId: 'another-run' }
    }))

    await expect(repository.save(unsafe)).rejects.toThrow('Invalid Practice workspace record')
  })

  it('guards checklist and learner-decision writes by run, generation, Practice, and version', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    await repository.save(activeRecord())
    const identity = {
      runId: 'run-1',
      generation: 1,
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0'
    }

    const decided = await repository.saveLearnerDecision({
      ...identity,
      key: 'configuration-review',
      value: 'reviewed',
      updatedAt: '2026-08-08T00:01:00.000Z'
    })
    expect(decided.activeRun?.learnerDecisions).toEqual({ 'configuration-review': 'reviewed' })

    const stale = await repository.advanceChecklist({
      ...identity,
      generation: 2,
      currentStepId: 'review-settings',
      updatedAt: '2026-08-08T00:02:00.000Z'
    })
    expect(stale.activeRun?.checklist[0]?.status).toBe('current')

    const advanced = await repository.advanceChecklist({
      ...identity,
      currentStepId: 'review-settings',
      updatedAt: '2026-08-08T00:03:00.000Z'
    })
    expect(advanced.activeRun?.checklist.map((step) => step.status)).toEqual(['completed', 'current'])
  })

  it('persists evidence and invalidation while clearing an obsolete pass', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    await repository.save(activeRecord(activeRun({
      reviewStatus: 'passed',
      reviewResult: {
        schemaVersion: 1,
        practiceId: 'm1-codex-safe-setup',
        practiceVersion: '2.0.0',
        runId: 'run-1',
        verdict: 'passed',
        criteria: [],
        summary: 'Passed',
        reviewedAt: '2026-08-08T00:00:00.000Z',
        sourceDigest: 'a'.repeat(64)
      }
    })))
    const identity = {
      runId: 'run-1',
      generation: 1,
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0'
    }
    const invalidation = {
      changedInput: 'settings',
      affectedStepIds: ['review-settings'],
      reason: 'Cấu hình đã thay đổi.',
      nextAction: 'Duyệt lại cấu hình.'
    }
    const saved = await repository.saveEvidence({
      ...identity,
      evidence: {
        schemaVersion: 1,
        practiceId: identity.practiceId,
        practiceVersion: identity.practiceVersion,
        runId: identity.runId,
        evidenceProfile: 'codex-task-configuration',
        observedAt: '2026-08-08T00:05:00.000Z',
        freshness: 'fresh',
        sourceDigest: 'b'.repeat(64),
        evidence: [],
        steps: [],
        invalidations: [invalidation]
      },
      checklist: [
        { id: 'open-task', title: 'Mở task', status: 'completed', dependencyInputs: {} },
        { id: 'review-settings', title: 'Duyệt cấu hình', status: 'stale', reason: invalidation.reason, dependencyInputs: {} }
      ],
      invalidations: [invalidation],
      updatedAt: '2026-08-08T00:05:00.000Z'
    })

    expect(saved.activeRun).toMatchObject({
      reviewStatus: 'not-reviewed',
      reviewResult: undefined,
      invalidations: [{ changedInput: 'settings' }]
    })
  })

  it('recovers an interrupted review without changing run identity', async () => {
    const directory = await temporaryDirectory()
    const first = new PracticeRunRepository(directory)
    await first.save(activeRecord(activeRun({ reviewStatus: 'reviewing' })))

    await expect(new PracticeRunRepository(directory).load()).resolves.toMatchObject({
      activeRun: {
        runId: 'run-1',
        practiceId: 'm1-codex-safe-setup',
        practiceVersion: '2.0.0',
        reviewStatus: 'not-reviewed'
      }
    })
  })

  it('keeps multiple Practice identities separate across archived receipts', async () => {
    const record = activeRecord(activeRun({
      practiceId: 'm2-planning-package',
      practiceVersion: '2.0.0',
      taskPolicy: 'safe-workspace-write',
      evidenceProfile: 'planning-package'
    }))
    record.archivedRuns.push({
      runId: 'run-m1',
      generation: 1,
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0',
      threadId: 'thread-m1',
      name: 'Module 1 Practice',
      outcome: 'replaced',
      archivedAt: '2026-08-08T00:00:00.000Z'
    })
    const repository = new PracticeRunRepository(await temporaryDirectory())

    await expect(repository.save(record)).resolves.toMatchObject({
      activeRun: { practiceId: 'm2-planning-package' },
      archivedRuns: [{ practiceId: 'm1-codex-safe-setup' }]
    })
  })
})
