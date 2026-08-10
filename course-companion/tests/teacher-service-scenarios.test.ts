import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type {
  CodexConnectionState,
  CodexNotification
} from '../electron/main/codex-app-server-client'
import { ExecutorActivityObserver } from '../electron/main/executor-activity-observer'
import { ExecutorActivityRepository } from '../electron/main/executor-activity-repository'
import { PracticeRunRepository } from '../electron/main/practice-run-repository'
import { ProgressRepository } from '../electron/main/progress-repository'
import { RealTeacherAdapter } from '../electron/main/real-teacher-adapter'
import { TeacherChatRepository } from '../electron/main/teacher-fixture'
import { TeacherMemoryRepository } from '../electron/main/teacher-memory-repository'
import { TeacherService } from '../electron/main/teacher-service'

const directories: string[] = []
const timestamp = '2026-08-09T00:00:00.000Z'

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

class ScenarioGateway {
  private notifications = new Set<(notification: CodexNotification) => void>()
  private connections = new Set<(state: CodexConnectionState) => void>()
  private sequence = 0
  private services = new Map<string, string>()
  failNextTeacherTurn = true
  failNextSummaryTurn = false
  holdNextTeacherTurn = false
  holdNextExecutorRead = false
  private releaseHeldExecutorRead: (() => void) | null = null
  lastTeacherInput = ''
  executorTurns = [
    {
      id: 'executor-turn-silent',
      status: 'completed',
      items: [
        { id: 'executor-user', type: 'userMessage', content: [{ type: 'text', text: 'resume' }] },
        {
          id: 'executor-final',
          type: 'agentMessage',
          phase: 'final_answer',
          text: [
            '**Changed**',
            '- Updated D:\\course\\starters\\contentpilot\\app\\globals.css:138.',
            '',
            '**Verification**',
            '- npm run lint — passed.',
            '- Headless Chrome at 390px reported scrollWidth: 390, innerWidth: 390, and hasHorizontalOverflow: false.'
          ].join('\n')
        }
      ]
    }
  ]

  onNotification(listener: (notification: CodexNotification) => void): () => void {
    this.notifications.add(listener)
    return () => this.notifications.delete(listener)
  }

  onConnectionState(listener: (state: CodexConnectionState) => void): () => void {
    this.connections.add(listener)
    listener('connected')
    return () => this.connections.delete(listener)
  }

  async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    if (method === 'model/list') {
      return { data: [{ id: 'compatible', model: 'compatible', hidden: false, isDefault: true }] }
    }
    if (method === 'thread/resume') return {}
    if (method === 'thread/read') {
      if (params.threadId === 'executor-thread' && this.holdNextExecutorRead) {
        this.holdNextExecutorRead = false
        await new Promise<void>((resolve) => { this.releaseHeldExecutorRead = resolve })
      }
      return { thread: { id: params.threadId, turns: params.threadId === 'executor-thread' ? this.executorTurns : [] } }
    }
    if (method === 'thread/start') {
      const threadId = `teacher-thread-${++this.sequence}`
      this.services.set(threadId, String(params.serviceName ?? ''))
      return {
        thread: {
          id: threadId,
          cwd: params.cwd,
          ephemeral: true
        },
        approvalPolicy: 'never',
        sandbox: { type: 'readOnly' }
      }
    }
    if (method === 'turn/start') {
      const threadId = String(params.threadId)
      const isSummary = this.services.get(threadId) === 'content_builder_academy_teacher_memory'
      if (!isSummary) this.lastTeacherInput = String((params.input as Array<{ text?: string }> | undefined)?.[0]?.text ?? '')
      const turnId = `teacher-turn-${++this.sequence}`
      if (!isSummary && this.holdNextTeacherTurn) {
        this.holdNextTeacherTurn = false
        return { turn: { id: turnId } }
      }
      queueMicrotask(() => {
        if ((isSummary && this.failNextSummaryTurn) || (!isSummary && this.failNextTeacherTurn)) {
          if (isSummary) this.failNextSummaryTurn = false
          else this.failNextTeacherTurn = false
          this.emit({
            method: 'error',
            params: {
              threadId,
              turnId,
              error: { message: 'Temporary model failure', codexErrorInfo: 'internalServerError' }
            }
          })
          return
        }
        const text = isSummary
          ? JSON.stringify({
              approach: 'H\u01b0\u01a1ng refined the fallback.',
              learnerDecisions: ['Keep verification scoped.'],
              strengths: ['Used grounded evidence.'],
              mistakes: [],
              approvals: [],
              changedFiles: [],
              verificationEvidence: [],
              unresolvedIssues: [],
              nextAttemptGuidance: ['Continue with scoped evidence.']
            })
          : 'Grounded retry answer'
        const item = { id: 'answer', type: 'agentMessage', phase: 'final_answer', text }
        this.emit({ method: 'item/completed', params: { threadId, turnId, item } })
        this.emit({
          method: 'turn/completed',
          params: { threadId, turn: { id: turnId, status: 'completed', items: [item] } }
        })
      })
      return { turn: { id: turnId } }
    }
    if (method === 'thread/unsubscribe' || method === 'turn/interrupt') return {}
    return {}
  }

  async waitForExecutorReadToHold(): Promise<void> {
    const deadline = Date.now() + 1_000
    while (!this.releaseHeldExecutorRead && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 0))
    }
    if (!this.releaseHeldExecutorRead) throw new Error('Executor read was not held')
  }

  releaseExecutorRead(): void {
    this.releaseHeldExecutorRead?.()
    this.releaseHeldExecutorRead = null
  }

  private emit(notification: CodexNotification): void {
    for (const listener of this.notifications) listener(notification)
  }
}

describe('TeacherService mock scenarios', () => {
  it('persists a failed message, retries the same current-run message id, and resets all visible state', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'teacher-service-scenarios-'))
    directories.push(directory)
    const progress = new ProgressRepository(directory, () => new Date(timestamp))
    await progress.save({
      currentLessonId: 'module-1',
      checkpointId: 'm1-plan-approval',
      sceneId: 'module-1-success',
      completedCheckpointIds: ['m1-orient'],
      decisions: {}
    })
    const practice = new PracticeRunRepository(directory)
    await practice.save({
      schemaVersion: 1,
      activeRun: {
        runId: 'run-current',
        generation: 1,
        status: 'active',
        binding: {
          runId: 'run-current',
          threadId: 'executor-thread',
          name: 'Practice',
          workspaceRoot: 'D:\\course',
          createdAt: timestamp
        },
        startedAt: timestamp,
        updatedAt: timestamp,
        checklist: [{ id: 'plan', title: 'Review plan', status: 'current' }]
      },
      archivedRuns: [],
      pendingTransition: null,
      presentation: { fullPanel: 'teacher', compactPanel: 'teacher' }
    })

    const gateway = new ScenarioGateway()
    const activityRepository = new ExecutorActivityRepository(directory)
    const observer = new ExecutorActivityObserver(
      gateway,
      activityRepository,
      () => new Date(timestamp),
      {
        capture: async (_workspaceRoot, capturedAt) => ({
          schemaVersion: 1,
          capturedAt,
          gitAvailable: true,
          head: null,
          entries: {}
        }),
        reconcile: async () => ({
          committedReportedFilesSinceRunStart: [],
      changedSinceBaseline: ['starters/contentpilot/app/globals.css'],
          currentlyDirtyReportedFiles: []
        })
      }
    )
    const responseAdapter = new RealTeacherAdapter(gateway, join(directory, 'teacher-runtime'), 1_000)
    const summaryAdapter = new RealTeacherAdapter(gateway, join(directory, 'teacher-runtime'), 1_000)
    const chat = new TeacherChatRepository(directory)
    const memory = new TeacherMemoryRepository(directory, () => new Date(timestamp))
    let id = 0
    const service = new TeacherService(
      chat,
      progress,
      practice,
      activityRepository,
      observer,
      memory,
      summaryAdapter,
      responseAdapter,
      false,
      () => new Date(timestamp),
      () => `message-${++id}`
    )

    service.onConnectionState('connected')
    await expect(service.sendMessage({ content: 'Did I pass?' })).rejects.toThrow('Teacher is unavailable')
    let state = await service.loadState('expanded')
    const failed = state.conversation.messages.find((message) => message.role === 'learner')
    expect(failed?.deliveryStatus).toBe('failed')
    expect(state.teacher.error).toBe('Hương tạm thời chưa thể phản hồi. Tin nhắn đã được lưu; hãy thử lại.')
    expect(gateway.lastTeacherInput).toContain('reportedChangedFiles')
    expect(gateway.lastTeacherInput).toContain('starters/contentpilot/app/globals.css')
    expect(gateway.lastTeacherInput).toContain('hasHorizontalOverflow: false')

    await expect(service.sendMessage({ content: 'Did I pass?' })).resolves.toMatchObject({
      learnerMessage: { id: failed?.id, deliveryStatus: 'delivered' },
      teacherMessage: { content: 'Grounded retry answer' }
    })
    state = await service.loadState('expanded')
    expect(state.conversation.messages.filter((message) => message.role === 'learner')).toHaveLength(1)
    expect(state.teacher.connection).toBe('live')

    gateway.failNextSummaryTurn = true
    const currentRun = (await practice.load()).activeRun
    expect(currentRun).not.toBeNull()
    const fallback = await service.summarizeReplacedRun(currentRun!)
    expect(fallback.quality).toBe('pending-refinement')
    expect(fallback.changedFiles).toContain('starters/contentpilot/app/globals.css')
    expect(fallback.verificationEvidence).toEqual([])
    expect(fallback.unresolvedIssues).toEqual(expect.arrayContaining([
      expect.stringContaining('not independently rerun')
    ]))

    const refinementTrigger = service.loadState('expanded')
    const concurrentResponse = service.sendMessage({ content: 'Can Hương answer while refining memory?' })
    await expect(concurrentResponse).resolves.toMatchObject({
      teacherMessage: { content: 'Grounded retry answer' }
    })
    await refinementTrigger

    const deadline = Date.now() + 1_000
    let refinedMemory = await memory.load()
    while (memory.hasPending(refinedMemory) && Date.now() < deadline) {
      await new Promise((resolve) => setTimeout(resolve, 10))
      refinedMemory = await memory.load()
    }
    expect(refinedMemory.practiceSummaries['m1-verifiable-brief']?.[0]).toMatchObject({
      runId: 'run-current',
      quality: 'live',
      approach: 'Hương refined the fallback.',
      changedFiles: ['starters/contentpilot/app/globals.css'],
      verificationEvidence: []
    })
    expect(refinedMemory.practiceSummaries['m1-verifiable-brief']?.[0]?.unresolvedIssues).toEqual(expect.arrayContaining([
      expect.stringContaining('not independently rerun')
    ]))

    gateway.holdNextTeacherTurn = true
    const inFlightSend = service.sendMessage({ content: 'This must not survive reset.' })
    await new Promise((resolve) => setTimeout(resolve, 0))

    gateway.holdNextExecutorRead = true
    const staleLoad = service.loadState('compact')
    await gateway.waitForExecutorReadToHold()
    const reset = service.reset()
    gateway.releaseExecutorRead()
    await expect(staleLoad).rejects.toThrow('cancelled by course reset')
    await expect(inFlightSend).rejects.toThrow('cancelled by course reset')
    await reset

    state = await service.loadState('compact')
    expect(state.conversation.messages).toEqual([])
    await service.dispose()
  })
})
