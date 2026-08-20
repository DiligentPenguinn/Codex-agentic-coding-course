import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type {
  CodexConnectionState,
  CodexNotification
} from '../electron/main/codex-app-server-client'
import { ExecutorActivityObserver } from '../electron/main/executor-activity-observer'
import { ExecutorActivityRepository } from '../electron/main/executor-activity-repository'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import {
  PracticeRunRepository,
  type PracticeRunRecord
} from '../electron/main/practice-run-repository'
import { ProgressRepository } from '../electron/main/progress-repository'
import { RealTeacherAdapter } from '../electron/main/real-teacher-adapter'
import { TeacherChatRepository } from '../electron/main/teacher-fixture'
import {
  practiceSummaryKey,
  TeacherMemoryRepository
} from '../electron/main/teacher-memory-repository'
import { TeacherService } from '../electron/main/teacher-service'
import { TeacherCourseContextRepository } from '../electron/main/teacher-course-context-repository'

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
  lastTeacherDeveloperInstructions = ''
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
    if (method === 'thread/resume') {
      return {
        thread: { id: params.threadId },
        cwd: 'D:\\course',
        model: 'gpt-5.6-sol',
        reasoningEffort: 'high',
        serviceTier: 'standard',
        approvalPolicy: 'on-request',
        sandbox: { type: 'workspaceWrite', writableRoots: ['D:\\course'] }
      }
    }
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
      if (params.serviceName === 'content_builder_academy_teacher') {
        this.lastTeacherDeveloperInstructions = String(params.developerInstructions ?? '')
      }
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
              approach: 'Triết refined the fallback.',
              learnerDecisions: ['Keep verification scoped.'],
              strengths: ['Used grounded evidence.'],
              mistakes: ['Needed one scope correction.'],
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
      currentCourseLessonId: 'm1-assessment',
      checkpointId: 'm1-setup-checklist',
      sceneId: 'module-1-setup-checklist',
      sceneHistory: [],
      completedCheckpointIds: ['m1-codex-orientation'],
      decisions: { audience: 'Nhà tuyển dụng sản phẩm số' }
    })
    const practice = new PracticeRunRepository(directory)
    await practice.save({
      schemaVersion: 2,
      activeRun: {
        runId: 'run-current',
        generation: 1,
        status: 'active',
        practiceId: 'm1-codex-safe-setup',
        practiceVersion: '2.0.0',
        workspaceKind: 'pilot-workspace',
        taskPolicy: 'inherit-configuration-only',
        evidenceProfile: 'codex-task-configuration',
        binding: {
          runId: 'run-current',
          threadId: 'executor-thread',
          name: 'Practice',
          workspaceRoot: 'D:\\course',
          createdAt: timestamp
        },
        startedAt: timestamp,
        updatedAt: timestamp,
        checklist: [{ id: 'set-model', title: 'Chọn Model', status: 'current' }],
        learnerDecisions: {},
        learnerApprovals: {},
        evidence: null,
        invalidations: [],
        reviewStatus: 'not-reviewed'
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
    const definitions = new PracticeDefinitionRepository(
      join(process.cwd(), 'content', 'practices')
    )
    let id = 0
    const service = new TeacherService(
      chat,
      progress,
      new TeacherCourseContextRepository(resolve(process.cwd(), '..', 'pilot-workspace')),
      practice,
      definitions,
      activityRepository,
      observer,
      memory,
      summaryAdapter,
      responseAdapter,
      false,
      () => new Date(timestamp),
      () => `message-${++id}`
    )

    await expect(service.sendMessage({ content: 'Can I chat during Practice?' }))
      .rejects.toThrow('Direct Teacher chat is unavailable during Practice')
    expect((await chat.loadConversation()).messages).toEqual([])
    await progress.save({
      currentLessonId: 'module-1',
      currentCourseLessonId: 'm1-assessment',
      checkpointId: 'm1-mastery',
      sceneId: 'module-1-final-1',
      sceneHistory: ['module-1-setup-checklist'],
      completedCheckpointIds: ['m1-codex-orientation', 'm1-setup-checklist'],
      decisions: { audience: 'Nhà tuyển dụng sản phẩm số' }
    })
    await expect(service.sendMessage({ content: 'Can mismatched Practice chat?' }))
      .rejects.toThrow('Direct Teacher chat is unavailable during Practice')
    expect((await chat.loadConversation()).messages).toEqual([])
    const currentRun = (await practice.load()).activeRun
    expect(currentRun).not.toBeNull()
    await observer.bind(currentRun!.binding, { captureBaseline: true })
    await practice.save({
      ...(await practice.load()),
      activeRun: null
    })

    service.onConnectionState('connected')
    await expect(service.sendMessage({ content: 'Did I pass?' })).rejects.toThrow('Teacher is unavailable')
    let state = await service.loadState('expanded')
    const failed = state.conversation.messages.find((message) => message.role === 'learner')
    expect(failed?.deliveryStatus).toBe('failed')
    expect(state.teacher.error).toBe('Triết tạm thời chưa thể phản hồi. Tin nhắn đã được lưu; hãy thử lại.')
    expect(gateway.lastTeacherInput).not.toContain('"activePractice"')
    expect(gateway.lastTeacherInput).toContain('"course/lessons/module-1.vi.md"')
    expect(gateway.lastTeacherInput).toContain('"audience":"Nhà tuyển dụng sản phẩm số"')
    expect(gateway.lastTeacherInput).toContain('answerIndex')
    expect(gateway.lastTeacherDeveloperInstructions).toContain('<TRIET_PEDAGOGY_SKILL>')
    expect(gateway.lastTeacherDeveloperInstructions).toContain('Protect open assessments')
    expect(gateway.lastTeacherInput).not.toContain('starters/contentpilot/app/globals.css')
    expect(gateway.lastTeacherInput).not.toContain('hasHorizontalOverflow: false')

    await expect(service.sendMessage({ content: 'Did I pass?' })).resolves.toMatchObject({
      learnerMessage: { id: failed?.id, deliveryStatus: 'delivered' },
      teacherMessage: { content: 'Grounded retry answer' }
    })
    state = await service.loadState('expanded')
    expect(state.conversation.messages.filter((message) => message.role === 'learner')).toHaveLength(1)
    expect(state.teacher.connection).toBe('live')

    gateway.failNextSummaryTurn = true
    const fallback = await service.summarizeReplacedRun(currentRun!)
    expect(fallback.quality).toBe('pending-refinement')
    expect(fallback.changedFiles).toContain('starters/contentpilot/app/globals.css')
    expect(fallback.verificationEvidence).toEqual([])
    expect(fallback.unresolvedIssues).toEqual(expect.arrayContaining([
      expect.stringContaining('not independently rerun')
    ]))

    const refinementTrigger = service.loadState('expanded')
    const concurrentResponse = service.sendMessage({ content: 'Can Triết answer while refining memory?' })
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
    const moduleOneMemoryKey = practiceSummaryKey('m1-codex-safe-setup', '2.0.0')
    expect(refinedMemory.practiceSummaries[moduleOneMemoryKey]?.[0]).toMatchObject({
      runId: 'run-current',
      practiceVersion: '2.0.0',
      quality: 'live',
      approach: 'Triết refined the fallback.',
      changedFiles: ['starters/contentpilot/app/globals.css'],
      verificationEvidence: []
    })
    expect(refinedMemory.practiceSummaries[moduleOneMemoryKey]?.[0]?.unresolvedIssues).toEqual(expect.arrayContaining([
      expect.stringContaining('not independently rerun')
    ]))

    const planningRun: PracticeRunRecord = {
      ...currentRun!,
      runId: 'run-planning',
      generation: 2,
      practiceId: 'm2-planning-package',
      practiceVersion: '2.0.0',
      taskPolicy: 'safe-workspace-write',
      evidenceProfile: 'planning-package',
      binding: {
        ...currentRun!.binding,
        runId: 'run-planning',
        threadId: 'planning-thread',
        name: 'Practice · Module 2'
      },
      checklist: [{ id: 'explain-scope-and-review', title: 'Giải thích phạm vi', status: 'completed' }],
      learnerDecisions: { scopeDecision: 'Giữ tự động đăng bài ngoài phạm vi V1.' },
      learnerApprovals: {
        'artifacts/PRD.md': {
          decision: 'approved',
          recordedAt: timestamp,
          artifactDigests: { 'artifacts/PRD.md': 'prd-digest' }
        },
        'artifacts/implementation-plan.md': {
          decision: 'approved',
          recordedAt: timestamp,
          artifactDigests: {
            'artifacts/PRD.md': 'prd-digest',
            'artifacts/implementation-plan.md': 'plan-digest'
          }
        }
      },
      evidence: {
        schemaVersion: 1,
        practiceId: 'm2-planning-package',
        practiceVersion: '2.0.0',
        runId: 'run-planning',
        evidenceProfile: 'planning-package',
        observedAt: timestamp,
        freshness: 'fresh',
        sourceDigest: 'planning-evidence-digest',
        evidence: [],
        steps: [],
        invalidations: [],
        planningArtifacts: [
          {
            schemaVersion: 1,
            path: 'artifacts/PRD.md',
            content: 'PRIVATE PRD CONTENT MUST NOT BE STORED',
            digest: 'prd-digest',
            byteLength: 38,
            modifiedAt: timestamp,
            observedAt: timestamp
          },
          {
            schemaVersion: 1,
            path: 'artifacts/implementation-plan.md',
            content: 'PRIVATE PLAN CONTENT MUST NOT BE STORED',
            digest: 'plan-digest',
            byteLength: 39,
            modifiedAt: timestamp,
            observedAt: timestamp
          }
        ],
        artifactIssues: [],
        unexpectedChangedPaths: []
      },
      invalidations: [{
        changedInput: 'artifacts/PRD.md',
        affectedStepIds: ['reconcile-alignment'],
        reason: 'PRD từng thay đổi sau lần đối chiếu đầu tiên.',
        nextAction: 'Đối chiếu lại trên digest hiện tại.'
      }],
      reviewStatus: 'passed',
      reviewResult: {
        schemaVersion: 1,
        practiceId: 'm2-planning-package',
        practiceVersion: '2.0.0',
        runId: 'run-planning',
        verdict: 'passed',
        criteria: [{
          criterionId: 'artifact-alignment',
          status: 'satisfied',
          evidenceRefs: ['alignment-current'],
          explanation: 'PRD và plan khớp phạm vi.'
        }],
        summary: 'Planning package đã đạt.',
        reviewedAt: timestamp,
        sourceDigest: 'review-digest'
      },
      completion: {
        schemaVersion: 1,
        courseRunId: 'course-run-1',
        practiceId: 'm2-planning-package',
        practiceVersion: '2.0.0',
        runId: 'run-planning',
        checkpointId: 'm2-planning-package',
        status: 'completed',
        completedAt: timestamp,
        evidenceSummary: 'Planning package đã đạt.',
        masterySummary: 'Hai artifact, alignment và quyết định phạm vi đều đạt.',
        destination: {
          lessonId: 'module-2',
          checkpointId: 'm2-mastery',
          sceneId: 'module-2-mastery'
        }
      }
    }
    const completedSummary = await service.summarizeCompletedRun(planningRun)
    const repeatedSummary = await service.summarizeCompletedRun(planningRun)
    expect(repeatedSummary).toEqual(completedSummary)
    expect(completedSummary).toMatchObject({
      practiceId: 'm2-planning-package',
      practiceVersion: '2.0.0',
      outcome: 'completed',
      changedFiles: ['artifacts/PRD.md', 'artifacts/implementation-plan.md'],
      learnerDecisions: expect.arrayContaining([
        'scopeDecision: Giữ tự động đăng bài ngoài phạm vi V1.'
      ]),
      verificationEvidence: expect.arrayContaining([
        'artifact-alignment: PRD và plan khớp phạm vi.'
      ]),
      learningSignals: expect.arrayContaining([
        expect.objectContaining({ text: 'Used grounded evidence.' }),
        expect.objectContaining({ text: 'Needed one scope correction.' })
      ]),
      unresolvedIssues: expect.arrayContaining([
        expect.stringContaining('PRD từng thay đổi sau lần đối chiếu đầu tiên.')
      ])
    })
    const planningMemory = await memory.load()
    expect(planningMemory.practiceSummaries[
      practiceSummaryKey('m2-planning-package', '2.0.0')
    ]).toHaveLength(1)
    expect(JSON.stringify(planningMemory)).not.toContain('PRIVATE PRD CONTENT')
    expect(JSON.stringify(planningMemory)).not.toContain('PRIVATE PLAN CONTENT')

    gateway.holdNextTeacherTurn = true
    const inFlightSend = service.sendMessage({ content: 'This must not survive reset.' })
    await new Promise((resolve) => setTimeout(resolve, 0))

    const reset = service.reset()
    await expect(inFlightSend).rejects.toThrow('cancelled by course reset')
    await reset

    state = await service.loadState('compact')
    expect(state.conversation.messages).toEqual([])
    await service.dispose()
  })
})
