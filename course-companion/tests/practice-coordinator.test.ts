import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PracticeCoordinator } from '../electron/main/practice-coordinator'
import {
  defaultPracticeWorkspaceRecord,
  PracticeRunRepository,
  type ExecutorChatBinding,
  type PracticeWorkspaceRecord
} from '../electron/main/practice-run-repository'

const temporaryDirectories: string[] = []

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'course-companion-practice-coordinator-'))
  temporaryDirectories.push(directory)
  return directory
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
      calls.push(`create:${runId}`)
      if (options.failCreate) throw new Error('private runtime detail')
      created += 1
      return {
        runId,
        threadId: `thread-${created}`,
        name: `Practice ${created}`,
        workspaceRoot: 'D:\\course',
        createdAt: '2026-08-08T00:00:00.000Z'
      }
    },
    async prepareTarget(binding: ExecutorChatBinding): Promise<void> {
      calls.push(`prepare-target:${binding.threadId}`)
      if (options.failPrepare) throw new Error(options.failPrepare)
    },
    async openTarget(binding: ExecutorChatBinding): Promise<void> {
      calls.push(`open:${binding.threadId}`)
    }
  }
  const ids = ['transition-1', 'run-1', 'transition-2', 'run-2', 'transition-3', 'run-3']
  return {
    calls,
    executor,
    createId: () => ids.shift() ?? 'fallback-id'
  }
}

describe('PracticeCoordinator', () => {
  it('creates one real target, resumes it, then archives only its receipt on a fresh switch', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(
      repository,
      testHarness.executor,
      () => new Date('2026-08-08T00:00:00.000Z'),
      testHarness.createId,
      async (binding, captureBaseline) => {
        testHarness.calls.push('prepare:' + binding.threadId + ':' + captureBaseline)
      }
    )

    const first = await coordinator.startNew({ transfer: false })
    expect(first.activePractice).toMatchObject({ runId: 'run-1', executorChatName: 'Practice 1' })
    expect(first.checklist.map((step) => step.status)).toEqual([
      'completed',
      'current',
      'upcoming',
      'upcoming'
    ])
    await coordinator.resume()
    const second = await coordinator.startNew({ transfer: false })

    expect(second.activePractice).toMatchObject({ runId: 'run-2', executorChatName: 'Practice 2' })
    const stored = await repository.load()
    expect(stored.activeRun?.runId).toBe('run-2')
    expect(stored.archivedRuns).toEqual([
      expect.objectContaining({ runId: 'run-1', threadId: 'thread-1' })
    ])
    expect(stored.pendingTransition).toBeNull()
    expect(testHarness.calls).toEqual([
      'create:run-1',
      'prepare-target:thread-1',
      'prepare:thread-1:true',
      'open:thread-1',
      'prepare:thread-1:false',
      'open:thread-1',
      'create:run-2',
      'prepare-target:thread-2',
      'prepare:thread-2:true',
      'open:thread-2'
    ])
  })

  it('rejects selective transfer before creating or changing any task', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    const testHarness = harness()
    const coordinator = new PracticeCoordinator(repository, testHarness.executor)

    await expect(coordinator.startNew({ transfer: true })).rejects.toMatchObject({
      code: 'SELECTIVE_TRANSFER_UNAVAILABLE'
    })
    expect(testHarness.calls).toEqual([])
    await expect(repository.load()).resolves.toEqual(defaultPracticeWorkspaceRecord())
  })

  it('keeps the old Practice authoritative when target creation fails and allows cancellation', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    const firstHarness = harness()
    const first = new PracticeCoordinator(
      repository,
      firstHarness.executor,
      () => new Date('2026-08-08T00:00:00.000Z'),
      firstHarness.createId
    )
    await first.startNew({ transfer: false })
    const failingHarness = harness({ failCreate: true })
    const failing = new PracticeCoordinator(
      repository,
      failingHarness.executor,
      () => new Date('2026-08-08T00:01:00.000Z'),
      failingHarness.createId
    )

    await expect(failing.startNew({ transfer: false })).rejects.toThrow(
      'Không thể tạo Executor chat mới'
    )
    const pending = await repository.load()
    expect(pending.activeRun?.runId).toBe('run-1')
    expect(pending.pendingTransition?.stage).toBe('creating-target')
    const cancelled = await failing.cancel()
    expect(cancelled.activePractice?.runId).toBe('run-1')
    expect((await repository.load()).pendingTransition).toBeNull()
  })

  it('preserves a bounded learner-readable exact-read error across workspace reloads', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    const testHarness = harness()
    testHarness.executor.prepareTarget = async () => {
      throw new Error('Codex could not read the Executor chat after creation')
    }
    const coordinator = new PracticeCoordinator(
      repository,
      testHarness.executor,
      () => new Date('2026-08-08T00:00:00.000Z'),
      testHarness.createId
    )
    const expected = 'Executor chat đã được tạo nhưng Codex chưa đọc lại được dữ liệu đã lưu. Hãy thử lại.'

    await expect(coordinator.startNew({ transfer: false })).rejects.toThrow(expected)
    await expect(coordinator.loadWorkspace()).resolves.toMatchObject({
      phase: 'switching',
      error: expected
    })
  })
  it('finishes a durable target-created transition after restart without creating a duplicate', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    const record: PracticeWorkspaceRecord = {
      ...defaultPracticeWorkspaceRecord(),
      pendingTransition: {
        transitionId: 'transition-1',
        sourceRunId: null,
        targetRunId: 'run-1',
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
      testHarness.executor,
      () => new Date('2026-08-08T00:01:00.000Z')
    )

    const interrupted = await coordinator.loadWorkspace()
    expect(interrupted).toMatchObject({ phase: 'switching' })
    expect(testHarness.calls).toEqual([])
    expect((await repository.load()).pendingTransition?.targetBinding?.threadId).toBe('thread-1')

    const recovered = await coordinator.retry()
    expect(recovered.activePractice?.runId).toBe('run-1')
    expect(testHarness.calls).toEqual([
      'prepare-target:thread-1',
      'open:thread-1'
    ])
    expect((await repository.load()).pendingTransition).toBeNull()
  })

  it('persists a created task before preparation and retries it without creating a duplicate', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    const testHarness = harness({ failPrepare: 'Codex could not read the Executor chat after creation' })
    const coordinator = new PracticeCoordinator(
      repository,
      testHarness.executor,
      () => new Date('2026-08-08T00:00:00.000Z'),
      testHarness.createId
    )

    await expect(coordinator.startNew({ transfer: false })).rejects.toThrow(
      'Executor chat đã được tạo nhưng Codex chưa đọc lại được dữ liệu đã lưu. Hãy thử lại.'
    )
    expect((await repository.load()).pendingTransition).toMatchObject({
      targetRunId: 'run-1',
      stage: 'target-created',
      targetBinding: { threadId: 'thread-1' }
    })
    testHarness.executor.prepareTarget = async (binding) => {
      testHarness.calls.push(`prepare-target-retry:${binding.threadId}`)
    }

    await expect(coordinator.retry()).resolves.toMatchObject({
      activePractice: { runId: 'run-1' }
    })
    expect(testHarness.calls.filter((call) => call.startsWith('create:'))).toEqual(['create:run-1'])
    expect(testHarness.calls).toContain('prepare-target-retry:thread-1')
  })

  it('can cancel a durable target-created transition without deleting the old active Practice', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    const firstHarness = harness()
    const first = new PracticeCoordinator(
      repository,
      firstHarness.executor,
      () => new Date('2026-08-08T00:00:00.000Z'),
      firstHarness.createId
    )
    await first.startNew({ transfer: false })
    const failingHarness = harness({ failPrepare: 'Codex desktop could not discover the Executor chat' })
    const replacementIds = ['transition-2', 'run-2']
    const switching = new PracticeCoordinator(
      repository,
      failingHarness.executor,
      () => new Date('2026-08-08T00:01:00.000Z'),
      () => replacementIds.shift() ?? 'fallback-id'
    )
    await expect(switching.startNew({ transfer: false })).rejects.toThrow()

    await expect(switching.cancel()).resolves.toMatchObject({
      phase: 'active',
      activePractice: { runId: 'run-1' }
    })
    expect((await repository.load()).pendingTransition).toBeNull()
  })
})
