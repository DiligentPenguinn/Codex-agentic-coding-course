import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type { CodexConnectionState, CodexNotification } from '../electron/main/codex-app-server-client'
import {
  ExecutorActivityObserver,
  initialActivity,
  reduceExecutorActivity
} from '../electron/main/executor-activity-observer'
import { ExecutorActivityRepository } from '../electron/main/executor-activity-repository'
import type { ExecutorChatBinding } from '../electron/main/practice-run-repository'
import {
  GitWorkspaceEvidenceProvider,
  WorkspaceGitUnavailableError,
  type WorkspaceEvidenceProvider
} from '../electron/main/workspace-evidence-provider'
import { TestCodexGateway } from '../electron/main/test-codex-gateway'

const directories: string[] = []
const timestamp = '2026-08-09T06:14:45.000Z'

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

const binding: ExecutorChatBinding = {
  runId: 'run-real-shape',
  threadId: 'thread-real-shape',
  name: 'Practice · Module 1',
  workspaceRoot: 'D:\\course',
  createdAt: timestamp
}

class SilentDesktopGateway {
  private listeners = new Set<(notification: CodexNotification) => void>()
  turns: unknown[] = []
  methods: string[] = []

  onNotification(listener: (notification: CodexNotification) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  onConnectionState(listener: (state: CodexConnectionState) => void): () => void {
    listener('connected')
    return () => undefined
  }

  async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    this.methods.push(method)
    if (method === 'thread/resume') {
      return {
        thread: { id: params.threadId },
        model: 'gpt-5.6-sol',
        reasoningEffort: 'high',
        serviceTier: null,
        approvalPolicy: 'on-request',
        sandbox: { type: 'workspaceWrite' }
      }
    }
    if (method === 'thread/read') return { thread: { id: params.threadId, turns: this.turns } }
    return {}
  }

  emit(notification: CodexNotification): void {
    for (const listener of this.listeners) listener(notification)
  }
}

class ReconciledWorkspace implements WorkspaceEvidenceProvider {
  captureCalls = 0
  reportedPaths: string[] = []
  confirmReportedChange = true
  failReconciliation = false
  gitUnavailable = false

  async capture(_workspaceRoot: string, capturedAt: string) {
    this.captureCalls += 1
    return {
      schemaVersion: 1 as const,
      capturedAt,
      gitAvailable: true,
      head: null,
      entries: { 'preexisting.css': 'file:before' }
    }
  }

  async reconcile(_workspaceRoot: string, _baseline: unknown, reportedPaths: string[] = []) {
    if (this.gitUnavailable) throw new WorkspaceGitUnavailableError()
    if (this.failReconciliation) throw new Error('Git temporarily unavailable')
    this.reportedPaths = reportedPaths
    return {
      committedReportedFilesSinceRunStart: [],
      changedSinceBaseline: this.confirmReportedChange && reportedPaths.includes('starters/contentpilot/app/globals.css')
        ? ['starters/contentpilot/app/globals.css']
        : [],
      currentlyDirtyReportedFiles: []
    }
  }
}

const silentDesktopTurn = {
  id: 'turn-desktop-custom-exec',
  status: 'completed',
  items: [
    { id: 'user', type: 'userMessage', content: [{ type: 'text', text: 'resume' }] },
    { id: 'reasoning', type: 'reasoning' },
    {
      id: 'final',
      type: 'agentMessage',
      phase: 'final_answer',
      text: [
        '**Changed**',
        '- Updated `D:\\course\\starters\\contentpilot\\app\\globals.css:138`.',
        '- Added intrinsic-width safeguards and mobile heading wrapping.',
        '',
        '**Verification**',
        '- `npm run lint` — passed.',
        '- `npm run typecheck` — passed.',
        '- Headless Chrome at exactly 390px reported `scrollWidth: 390`, `innerWidth: 390`, zero overflowing elements, and `hasHorizontalOverflow: false`.'
      ].join('\n')
    }
  ]
}

describe('Executor evidence reconciliation', () => {
  it('classifies a real non-Git workspace separately from a Git command failure', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'executor-evidence-real-non-git-'))
    directories.push(directory)
    const provider = new GitWorkspaceEvidenceProvider()

    const baseline = await provider.capture(directory, timestamp)
    expect(baseline).toMatchObject({ gitAvailable: false })
    await expect(provider.reconcile(directory, baseline)).rejects.toBeInstanceOf(WorkspaceGitUnavailableError)
  })

  it('keeps malformed Git metadata and a stale false baseline as generic failures', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'executor-evidence-invalid-git-'))
    directories.push(directory)
    await writeFile(join(directory, '.git'), 'not a valid gitdir declaration', 'utf8')
    const provider = new GitWorkspaceEvidenceProvider()

    const captureError = await provider.capture(directory, timestamp).then(() => null, (error: unknown) => error)
    expect(captureError).toBeInstanceOf(Error)
    expect(captureError).not.toBeInstanceOf(WorkspaceGitUnavailableError)
    const staleBaseline = { schemaVersion: 1 as const, capturedAt: timestamp, gitAvailable: false, head: null, entries: {} }
    const reconcileError = await provider.reconcile(directory, staleBaseline).then(() => null, (error: unknown) => error)
    expect(reconcileError).toBeInstanceOf(Error)
    expect(reconcileError).not.toBeInstanceOf(WorkspaceGitUnavailableError)
  })

  it('models incorrect Module 1 defaults, settings notifications, disconnects, and safe or unsafe later tasks', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'test-codex-gateway-'))
    directories.push(directory)
    const gateway = new TestCodexGateway(directory)
    const notifications: CodexNotification[] = []
    const connections: CodexConnectionState[] = []
    gateway.onNotification((notification) => notifications.push(notification))
    gateway.onConnectionState((state) => connections.push(state))

    const moduleOne = await gateway.request('thread/start', {
      cwd: directory,
      serviceName: 'content_builder_academy_practice'
    }) as { thread: { id: string }; model: string; reasoningEffort: string; serviceTier: string; approvalPolicy: string; sandbox: { type: string } }
    expect(moduleOne).toMatchObject({
      model: 'gpt-5.6-terra',
      reasoningEffort: 'medium',
      serviceTier: 'fast',
      approvalPolicy: 'never',
      sandbox: { type: 'dangerFullAccess' }
    })
    for (let index = 0; index < 5; index += 1) {
      gateway.advanceConfiguration(moduleOne.thread.id)
    }
    const corrected = await gateway.request('thread/resume', {
      threadId: moduleOne.thread.id
    }) as { model: string; reasoningEffort: string; serviceTier: string; approvalPolicy: string; sandbox: { type: string } }
    expect(corrected).toMatchObject({
      model: 'gpt-5.6-sol',
      reasoningEffort: 'high',
      serviceTier: 'standard',
      approvalPolicy: 'on-request',
      sandbox: { type: 'workspaceWrite' }
    })
    expect(notifications.filter((item) => item.method === 'thread/settings/updated')).toHaveLength(6)
    gateway.disconnectThread(moduleOne.thread.id)
    gateway.setConnectionState('disconnected')
    gateway.setConnectionState('connected')
    expect(notifications.at(-1)?.method).toBe('thread/closed')
    expect(connections).toEqual(['connected', 'disconnected', 'connected'])

    const safe = await gateway.request('thread/start', {
      cwd: directory,
      serviceName: 'content_builder_academy_practice',
      model: 'gpt-5.6-sol',
      serviceTier: 'standard',
      approvalPolicy: 'on-request',
      sandbox: 'workspace-write',
      config: { model_reasoning_effort: 'high' }
    }) as { sandbox: { type: string } }
    expect(safe.sandbox.type).toBe('workspaceWrite')

    const unsafeGateway = new TestCodexGateway(directory, { unsafeLaterTask: true })
    const unsafe = await unsafeGateway.request('thread/start', {
      cwd: directory,
      serviceName: 'content_builder_academy_practice',
      model: 'gpt-5.6-sol',
      serviceTier: 'standard',
      approvalPolicy: 'on-request',
      sandbox: 'workspace-write',
      config: { model_reasoning_effort: 'high' }
    }) as { sandbox: { type: string } }
    expect(unsafe.sandbox.type).toBe('dangerFullAccess')
  })

  it('refreshes a silent Desktop turn, preserves structured facts, and keeps evidence across rebind', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'executor-evidence-'))
    directories.push(directory)
    const gateway = new SilentDesktopGateway()
    const workspace = new ReconciledWorkspace()
    const repository = new ExecutorActivityRepository(directory)
    const observer = new ExecutorActivityObserver(gateway, repository, () => new Date(timestamp), workspace)

    await observer.bind(binding, { captureBaseline: true })
    gateway.emit({
      method: 'item/completed',
      params: {
        threadId: binding.threadId,
        turnId: 'live-turn',
        item: { id: 'live-file', type: 'fileChange', changes: [{ path: 'src/observed.ts' }] }
      }
    })
    expect((await observer.current())?.changedFiles).toEqual(['src/observed.ts'])

    gateway.turns = [silentDesktopTurn]
    const refreshed = await observer.refresh()
    expect(gateway.methods).toContain('thread/resume')
    expect(refreshed?.executorResponses.at(-1)).toContain('hasHorizontalOverflow: false')
    expect(refreshed?.reportedChangedFiles).toEqual(['starters/contentpilot/app/globals.css'])
    expect(refreshed?.reportedVerificationEvidence).toEqual(expect.arrayContaining([
      expect.stringContaining('npm run lint'),
      expect.stringContaining('390px')
    ]))
    expect(refreshed?.workspaceConfirmedChangedFiles).toEqual(['starters/contentpilot/app/globals.css'])
    expect(refreshed?.changedFiles).toEqual(['src/observed.ts'])
    expect(workspace.reportedPaths).toContain('starters/contentpilot/app/globals.css')
    expect(workspace.captureCalls).toBe(1)
    observer.dispose()

    const rebound = new ExecutorActivityObserver(gateway, repository, () => new Date(timestamp), workspace)
    const recovered = await rebound.bind(binding)
    expect(recovered.changedFiles).toEqual(['src/observed.ts'])
    expect(recovered.workspaceConfirmedChangedFiles).toEqual(['starters/contentpilot/app/globals.css'])
    expect(workspace.captureCalls).toBe(1)
    rebound.dispose()
  })

  it('captures verification from the command name even when output is terse', () => {
    const snapshot = reduceExecutorActivity(
      initialActivity(binding, () => new Date(timestamp)),
      {
        method: 'item/completed',
        params: {
          threadId: binding.threadId,
          turnId: 'turn-command',
          item: {
            id: 'command',
            type: 'commandExecution',
            command: ['npm', 'run', 'typecheck'],
            aggregatedOutput: 'done'
          }
        }
      },
      binding,
      () => new Date(timestamp)
    )

    expect(snapshot.verificationEvidence).toEqual(['npm run typecheck — done'])
  })

  it('migrates a legacy snapshot without discarding its captured facts', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'executor-evidence-legacy-'))
    directories.push(directory)
    await writeFile(join(directory, 'executor-activity.json'), JSON.stringify({
      schemaVersion: 1,
      snapshots: {
        [binding.runId]: {
          schemaVersion: 1,
          runId: binding.runId,
          threadId: binding.threadId,
          status: 'response-ready',
          cursor: 'legacy:item',
          learnerPrompts: ['Do the work.'],
          executorResponses: ['Legacy final answer.'],
          approvalEvents: [],
          changedFiles: ['src/legacy.ts'],
          verificationEvidence: ['Legacy typecheck passed.'],
          observedAt: timestamp
        }
      }
    }), 'utf8')

    const loaded = await new ExecutorActivityRepository(directory).load(binding.runId)
    expect(loaded).toMatchObject({
      changedFiles: ['src/legacy.ts'],
      verificationEvidence: ['Legacy typecheck passed.'],
      reportedChangedFiles: [],
      workspaceConfirmedChangedFiles: [],
      workspaceBaseline: null,
      configuration: null
    })
  })

  it('does not treat negated, reviewed-only, or planned paths as changed', () => {
    const snapshot = reduceExecutorActivity(
      initialActivity(binding, () => new Date(timestamp)),
      {
        method: 'item/completed',
        params: {
          threadId: binding.threadId,
          turnId: 'turn-negation',
          item: {
            id: 'final-negation',
            type: 'agentMessage',
            phase: 'final_answer',
            text: [
              '**Changed**',
              '- No files changed; only reviewed `src/reviewed.ts`.',
              '- Planned update to `src/planned.ts`.',
              '- `src/not-changed.ts` was not changed.',
              '- `src/passive-not.ts` has not been updated.',
              '- `src/future.ts` will be updated next.',
              '- Updated `src/actual.ts`.',
              '- `src/path-only.ts`'
            ].join('\n')
          }
        }
      },
      binding,
      () => new Date(timestamp)
    )

    expect(snapshot.reportedChangedFiles).toEqual(['src/actual.ts', 'src/path-only.ts'])
  })

  it('keeps an in-progress thread in working state during refresh', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'executor-evidence-working-'))
    directories.push(directory)
    const gateway = new SilentDesktopGateway()
    gateway.turns = [{
      id: 'active-turn',
      status: 'inProgress',
      items: [{
        id: 'premature-final',
        type: 'agentMessage',
        phase: 'final_answer',
        text: '**Changed**\n- Updated src/in-progress.ts.'
      }]
    }]
    const observer = new ExecutorActivityObserver(
      gateway,
      new ExecutorActivityRepository(directory),
      () => new Date(timestamp),
      new ReconciledWorkspace()
    )

    const snapshot = await observer.bind(binding)
    expect(snapshot.status).toBe('working')
    expect(snapshot.reportedChangedFiles).toEqual(['src/in-progress.ts'])
    observer.dispose()
  })

  it('preserves prior confirmation and marks context stale when Git reconciliation fails', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'executor-evidence-git-failure-'))
    directories.push(directory)
    const gateway = new SilentDesktopGateway()
    gateway.turns = [silentDesktopTurn]
    const workspace = new ReconciledWorkspace()
    const observer = new ExecutorActivityObserver(
      gateway,
      new ExecutorActivityRepository(directory),
      () => new Date(timestamp),
      workspace
    )

    expect((await observer.bind(binding)).workspaceConfirmedChangedFiles).toEqual(['starters/contentpilot/app/globals.css'])
    workspace.failReconciliation = true
    const stale = await observer.refresh()
    expect(stale?.workspaceConfirmedChangedFiles).toEqual(['starters/contentpilot/app/globals.css'])
    expect(stale?.status).toBe('stale')
    expect(stale?.workspaceEvidenceStatus).toBe('failed')
    observer.dispose()
  })

  it('distinguishes an intentionally non-Git workspace from a failed Git reconciliation', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'executor-evidence-non-git-'))
    directories.push(directory)
    const gateway = new SilentDesktopGateway()
    gateway.turns = [silentDesktopTurn]
    const workspace = new ReconciledWorkspace()
    workspace.gitUnavailable = true
    const observer = new ExecutorActivityObserver(
      gateway,
      new ExecutorActivityRepository(directory),
      () => new Date(timestamp),
      workspace
    )

    const stale = await observer.bind(binding)
    expect(stale.status).toBe('stale')
    expect(stale.workspaceEvidenceStatus).toBe('git-unavailable')
    expect(stale.workspaceConfirmedChangedFiles).toEqual([])
    observer.dispose()
  })

  it('clears workspace confirmation after reconciliation no longer finds the change', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'executor-evidence-reverted-'))
    directories.push(directory)
    const gateway = new SilentDesktopGateway()
    gateway.turns = [silentDesktopTurn]
    const workspace = new ReconciledWorkspace()
    const observer = new ExecutorActivityObserver(
      gateway,
      new ExecutorActivityRepository(directory),
      () => new Date(timestamp),
      workspace
    )

    expect((await observer.bind(binding)).workspaceConfirmedChangedFiles).toEqual(['starters/contentpilot/app/globals.css'])
    workspace.confirmReportedChange = false
    expect((await observer.refresh())?.workspaceConfirmedChangedFiles).toEqual([])
    observer.dispose()
  })
})
