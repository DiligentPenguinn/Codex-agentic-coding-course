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
import type { WorkspaceEvidenceProvider } from '../electron/main/workspace-evidence-provider'

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

  onNotification(listener: (notification: CodexNotification) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  onConnectionState(listener: (state: CodexConnectionState) => void): () => void {
    listener('connected')
    return () => undefined
  }

  async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    if (method === 'thread/resume') return {}
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

  async capture(_workspaceRoot: string, capturedAt: string) {
    this.captureCalls += 1
    return {
      schemaVersion: 1 as const,
      capturedAt,
      gitAvailable: true,
      entries: { 'preexisting.css': 'file:before' }
    }
  }

  async reconcile(_workspaceRoot: string, _baseline: unknown, reportedPaths: string[] = []) {
    this.reportedPaths = reportedPaths
    return reportedPaths.includes('starters/contentpilot/app/globals.css')
      ? ['starters/contentpilot/app/globals.css']
      : []
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
      workspaceBaseline: null
    })
  })
})
