import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { portfolioPackageArtifactPaths, type PortfolioPackageHandoff } from '../shared/contracts'
import { ExecutorChatCoordinator } from '../electron/main/executor-chat-coordinator'
import { PracticeCoordinator } from '../electron/main/practice-coordinator'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { defaultPracticeWorkspaceRecord, PracticeRunRepository } from '../electron/main/practice-run-repository'

const directories: string[] = []
const time = '2026-09-11T00:00:00.000Z'
const definitions = new PracticeDefinitionRepository(resolve('../pilot-workspace/course/practices'))
afterEach(async () => { await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))) })

function handoff(workspace: string): PortfolioPackageHandoff {
  const artifacts = portfolioPackageArtifactPaths.map((path) => ({ path, digest: 'a'.repeat(64) }))
  return { schemaVersion: 2, workspace: { canonicalPath: workspace, identityDigest: 'b'.repeat(64) }, artifacts,
    mastery: { questionIds: [], answerDigest: 'c'.repeat(64) },
    summary: { learnerDecision: 'Audience', evidenceBoundary: 'Private', firstBuild: 'Plan order', deliberatelyOutOfScope: 'Deploy' },
    moduleThreeInput: { workspacePath: workspace, artifactReferences: artifacts },
    approval: { courseRunId: 'course-1', runId: 'planning-1', generation: 1, threadId: 'original-task',
      workspaceIdentityDigest: 'b'.repeat(64), sourceDigest: 'd'.repeat(64), artifactDigests: Object.fromEntries(artifacts.map((item) => [item.path, item.digest])), recordedAt: time },
    submission: { runId: 'planning-1', generation: 1, sourceDigest: 'd'.repeat(64), reviewDigest: 'e'.repeat(64), reviewedAt: time },
    task: { runId: 'planning-1', threadId: 'original-task', name: 'Original portfolio', workspaceRoot: workspace, createdAt: time }
  }
}

describe('portfolio task continuation', () => {
  it('starts Module 3 in the exact handed-off task and never creates a replacement on failed preparation or retry', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'portfolio-continuity-'))
    directories.push(workspace)
    const repository = new PracticeRunRepository(workspace)
    const createTarget = vi.fn(async () => { throw new Error('Must not create') })
    const prepareTarget = vi.fn(async (): Promise<void> => { throw new Error('Disconnected') })
    const openTarget = vi.fn(async () => undefined)
    const ids = ['switch-1', 'build-1']
    const coordinator = new PracticeCoordinator(repository, definitions, { createTarget, prepareTarget, openTarget },
      () => new Date(time), () => ids.shift()!, undefined, undefined, undefined, undefined, undefined, async () => handoff(workspace))
    await expect(coordinator.startNew({ practiceId: 'm3-portfolio-build', practiceVersion: '1.0.0', transfer: false })).rejects.toThrow('không tạo task thay thế')
    expect(createTarget).not.toHaveBeenCalled()
    expect((await repository.load()).pendingTransition?.targetBinding).toMatchObject({ threadId: 'original-task', runId: 'build-1', workspaceRoot: workspace })
    prepareTarget.mockImplementation(async () => undefined)
    await coordinator.retry()
    expect(createTarget).not.toHaveBeenCalled()
    expect(openTarget).toHaveBeenCalledWith(expect.objectContaining({ threadId: 'original-task', runId: 'build-1' }))
    expect((await repository.load()).activeRun?.binding.threadId).toBe('original-task')
  })

  it('fails closed with no handed-off task', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'portfolio-no-handoff-'))
    directories.push(workspace)
    const createTarget = vi.fn(async () => { throw new Error('Must not create') })
    const coordinator = new PracticeCoordinator(new PracticeRunRepository(workspace), definitions, {
      createTarget, prepareTarget: async () => undefined, openTarget: async () => undefined
    })
    await expect(coordinator.startNew({ practiceId: 'm3-portfolio-build', practiceVersion: '1.0.0', transfer: false })).rejects.toThrow('không tạo task thay thế')
    expect(createTarget).not.toHaveBeenCalled()
  })

  it('updates the existing task to the five-document instructions once, without a new task or repeated interview', async () => {
    const workspace = resolve('portfolio-task-fixture')
    const target = handoff(workspace).task
    const turns: unknown[] = [{ input: 'Old planning discussion' }]
    const request = vi.fn(async (method: string, params?: Record<string, unknown>) => {
      if (method === 'thread/read') return { thread: { id: target.threadId, cwd: workspace, turns } }
      if (method === 'turn/start') turns.push(params)
      return {}
    })
    const executor = new ExecutorChatCoordinator({ request }, { resolve: async () => workspace }, async () => undefined)
    const definition = await definitions.load('m2-portfolio-planning', '2.0.0')
    await executor.prepareTarget(target, definition)
    await executor.prepareTarget(target, definition)
    expect(request.mock.calls.filter(([method]) => method === 'turn/start')).toHaveLength(1)
    expect(request.mock.calls.some(([method]) => method === 'thread/start')).toBe(false)
    const prompt = JSON.stringify(turns.at(-1))
    for (const path of portfolioPackageArtifactPaths) expect(prompt).toContain(path)
    expect(prompt).toContain('không dừng duyệt từng tài liệu')
    expect(prompt).toContain('ảnh chụp là tùy chọn')
    expect(prompt).toContain('Không tạo ứng dụng')
  })

  it('validates an existing task by exact read-only identity and workspace without starting a turn', async () => {
    const workspace = resolve('portfolio-task-fixture')
    const target = handoff(workspace).task
    const request = vi.fn(async (method: string) => {
      if (method === 'thread/read') return { thread: { id: target.threadId, cwd: workspace, turns: [] } }
      throw new Error('Migration validation must remain read-only')
    })
    const executor = new ExecutorChatCoordinator({ request }, { resolve: async () => workspace }, async () => undefined)
    const definition = await definitions.load('m2-portfolio-planning', '2.0.0')

    await expect(executor.validateExistingTarget(target, definition)).resolves.toBe(true)
    expect(request).toHaveBeenCalledTimes(1)
    expect(request).toHaveBeenCalledWith('thread/read', { threadId: target.threadId, includeTurns: false })

    request.mockResolvedValueOnce({ thread: { id: target.threadId, cwd: resolve('wrong-workspace'), turns: [] } })
    await expect(executor.validateExistingTarget(target, definition)).resolves.toBe(false)
    request.mockRejectedValueOnce(new Error('unreadable'))
    await expect(executor.validateExistingTarget(target, definition)).resolves.toBe(false)
    expect(request.mock.calls.some(([method]) => method === 'thread/start' || method === 'turn/start')).toBe(false)
  })

  it('relaunches an archive-only v1 attempt through validated coordinator recovery exactly once', async () => {
    const workspace = await mkdtemp(join(tmpdir(), 'portfolio-archive-continuity-'))
    directories.push(workspace)
    const repository = new PracticeRunRepository(workspace)
    const definition = await definitions.load('m2-portfolio-planning', '2.0.0')
    await repository.save({
      ...defaultPracticeWorkspaceRecord(),
      archivedRuns: [{
        runId: 'legacy-run', generation: 3, practiceId: definition.practiceId, practiceVersion: '1.0.0',
        threadId: 'legacy-task', name: 'Historical Module 2', outcome: 'completed', archivedAt: time,
        reviewHistory: []
      }]
    })
    const validateExistingTarget = vi.fn(async () => true)
    const createTarget = vi.fn(async () => { throw new Error('must not create') })
    const coordinator = new PracticeCoordinator(
      repository,
      definitions,
      { createTarget, prepareTarget: async () => undefined, openTarget: async () => undefined, validateExistingTarget },
      () => new Date(time),
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      async () => ({ courseRunId: 'course-1', runId: 'legacy-run', workspaceRoot: workspace })
    )

    await coordinator.loadWorkspace({ practiceId: definition.practiceId, practiceVersion: definition.version })
    const migrated = await repository.load()
    await coordinator.loadWorkspace({ practiceId: definition.practiceId, practiceVersion: definition.version })

    expect(migrated.activeRun).toMatchObject({
      runId: 'legacy-run', generation: 4, practiceVersion: '2.0.0',
      binding: { threadId: 'legacy-task', workspaceRoot: workspace }
    })
    expect(await repository.load()).toEqual(migrated)
    expect(validateExistingTarget).toHaveBeenCalledTimes(1)
    expect(createTarget).not.toHaveBeenCalled()
  })
})
