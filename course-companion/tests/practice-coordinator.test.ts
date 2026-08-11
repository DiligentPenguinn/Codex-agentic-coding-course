import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PracticeCoordinator } from '../electron/main/practice-coordinator'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import {
  defaultPracticeWorkspaceRecord,
  PracticeRunRepository,
  type ExecutorChatBinding,
  type PracticeWorkspaceRecord
} from '../electron/main/practice-run-repository'

const temporaryDirectories: string[] = []
const m1Identity = { practiceId: 'm1-codex-safe-setup', practiceVersion: '2.0.0' }
const m2Identity = { practiceId: 'm2-planning-package', practiceVersion: '2.0.0' }

async function temporaryDirectory(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

async function definitions(): Promise<PracticeDefinitionRepository> {
  const directory = await temporaryDirectory('course-companion-definitions-')
  const base = {
    schemaVersion: 2,
    version: '2.0.0',
    workspaceKind: 'pilot-workspace',
    checklist: [
      { id: 'open-task', title: 'Mở task' },
      { id: 'review', title: 'Duyệt bằng chứng', dependsOn: ['open-task'] }
    ],
    criteria: [{
      id: 'reviewed',
      description: 'Bằng chứng đã được duyệt.',
      required: true,
      checklistStepId: 'review',
      acceptedEvidence: ['teacher-assessment'],
      assertion: 'The current evidence was reviewed.',
      freshness: 'fresh'
    }]
  }
  const m1 = {
    ...base,
    practiceId: m1Identity.practiceId,
    version: m1Identity.practiceVersion,
    checkpointId: 'm1-setup-checklist',
    objective: 'Thiết lập Codex an toàn.',
    expectedOutcome: 'Năm thiết lập được xác nhận.',
    taskPolicy: 'inherit-configuration-only',
    evidenceProfile: 'codex-task-configuration',
    completionDestination: {
      lessonId: 'module-1',
      checkpointId: 'm1-mastery',
      sceneId: 'module-1-mastery'
    }
  }
  const m2 = {
    ...base,
    practiceId: m2Identity.practiceId,
    version: m2Identity.practiceVersion,
    checkpointId: 'm2-planning-package',
    objective: 'Tạo planning package.',
    expectedOutcome: 'PRD và implementation plan đã duyệt.',
    taskPolicy: 'safe-workspace-write',
    evidenceProfile: 'planning-package',
    completionDestination: {
      lessonId: 'module-2',
      checkpointId: 'm2-mastery',
      sceneId: 'module-2-mastery'
    }
  }
  await Promise.all([
    writeFile(join(directory, m1.practiceId + '.json'), JSON.stringify(m1), 'utf8'),
    writeFile(join(directory, m2.practiceId + '.json'), JSON.stringify(m2), 'utf8')
  ])
  return new PracticeDefinitionRepository(directory)
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

function harness(options: { failCreate?: boolean; failPrepare?: string } = {}) {
  const calls: string[] = []
  let created = 0
  const executor = {
    async createTarget(runId: string): Promise<ExecutorChatBinding> {
      calls.push('create:' + runId)
      if (options.failCreate) throw new Error('private runtime detail')
      created += 1
      return {
        runId,
        threadId: 'thread-' + created,
        name: 'Practice ' + created,
        workspaceRoot: 'D:\\course',
        createdAt: '2026-08-08T00:00:00.000Z'
      }
    },
    async prepareTarget(binding: ExecutorChatBinding): Promise<void> {
      calls.push('prepare-target:' + binding.threadId)
      if (options.failPrepare) throw new Error(options.failPrepare)
    },
    async openTarget(binding: ExecutorChatBinding): Promise<void> {
      calls.push('open:' + binding.threadId)
    }
  }
  const ids = ['transition-1', 'run-1', 'transition-2', 'run-2']
  return { calls, executor, createId: () => ids.shift() ?? 'fallback-id' }
}

describe('PracticeCoordinator', () => {
  it('creates, resumes, and switches explicitly identified Practices', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(
      repository,
      await definitions(),
      testHarness.executor,
      () => new Date('2026-08-08T00:00:00.000Z'),
      testHarness.createId
    )

    const first = await coordinator.startNew({ ...m1Identity, transfer: false })
    expect(first.activePractice).toMatchObject({ runId: 'run-1', ...m1Identity })
    expect(first.objective).toBe('Thiết lập Codex an toàn.')
    expect(first.checklist.map((step) => step.status)).toEqual(['current', 'pending'])

    await coordinator.resume(m1Identity)
    const second = await coordinator.startNew({ ...m2Identity, transfer: false })
    expect(second.activePractice).toMatchObject({ runId: 'run-2', ...m2Identity })
    expect(second.objective).toBe('Tạo planning package.')

    const stored = await repository.load()
    expect(stored.activeRun).toMatchObject({
      practiceId: 'm2-planning-package',
      taskPolicy: 'safe-workspace-write',
      evidenceProfile: 'planning-package'
    })
    expect(stored.archivedRuns).toEqual([
      expect.objectContaining({
        runId: 'run-1',
        practiceId: 'm1-codex-safe-setup',
        outcome: 'replaced'
      })
    ])
  })

  it('rejects selective transfer and identity-mismatched resume', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(repository, await definitions(), testHarness.executor)

    await expect(coordinator.startNew({ ...m1Identity, transfer: true })).rejects.toMatchObject({
      code: 'SELECTIVE_TRANSFER_UNAVAILABLE'
    })
    await coordinator.startNew({ ...m1Identity, transfer: false })
    await expect(coordinator.resume(m2Identity)).rejects.toThrow('không khớp')
  })

  it('keeps the active run authoritative when replacement creation fails', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const firstHarness = harness()
    const definitionRepository = await definitions()
    const first = new PracticeCoordinator(repository, definitionRepository, firstHarness.executor)
    await first.startNew({ ...m1Identity, transfer: false })

    const failing = new PracticeCoordinator(
      repository,
      definitionRepository,
      harness({ failCreate: true }).executor
    )
    await expect(failing.startNew({ ...m2Identity, transfer: false }))
      .rejects.toThrow('Không thể tạo Executor chat mới')
    expect((await repository.load()).activeRun?.practiceId).toBe('m1-codex-safe-setup')
    await expect(failing.cancel()).resolves.toMatchObject({
      activePractice: { practiceId: 'm1-codex-safe-setup' }
    })
  })

  it('recovers a durable target-created transition without duplicate creation', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const record: PracticeWorkspaceRecord = {
      ...defaultPracticeWorkspaceRecord(),
      pendingTransition: {
        transitionId: 'transition-1',
        sourceRunId: null,
        targetRunId: 'run-1',
        ...m1Identity,
        stage: 'target-created',
        targetBinding: {
          runId: 'run-1',
          threadId: 'thread-1',
          name: 'Practice 1',
          workspaceRoot: 'D:\\course',
          createdAt: '2026-08-08T00:00:00.000Z'
        },
        startedAt: '2026-08-08T00:00:00.000Z'
      }
    }
    await repository.save(record)
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(
      repository,
      await definitions(),
      testHarness.executor,
      () => new Date('2026-08-08T00:01:00.000Z')
    )

    const recovered = await coordinator.retry()
    expect(recovered.activePractice).toMatchObject({ runId: 'run-1', ...m1Identity })
    expect(testHarness.calls).toEqual(['prepare-target:thread-1', 'open:thread-1'])
  })

  it('fails before task creation for unknown IDs or version mismatches', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory('practice-runs-'))
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(repository, await definitions(), testHarness.executor)

    await expect(coordinator.startNew({
      practiceId: 'unknown-practice',
      practiceVersion: '2.0.0',
      transfer: false
    })).rejects.toThrow()
    await expect(coordinator.startNew({
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '9.0.0',
      transfer: false
    })).rejects.toThrow('version mismatch')
    expect(testHarness.calls).toEqual([])
  })
})
