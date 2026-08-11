import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type {
  CodexTaskConfigurationSnapshot,
  ExecutorActivitySnapshot
} from '../shared/contracts'
import type { ExecutorActivityObserver } from '../electron/main/executor-activity-observer'
import { PracticeCoordinator } from '../electron/main/practice-coordinator'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { DeterministicPracticeReviewEvaluator } from '../electron/main/practice-review-evaluator'
import { PracticeReviewService } from '../electron/main/practice-review-service'
import {
  defaultPracticeWorkspaceRecord,
  PracticeRunRepository
} from '../electron/main/practice-run-repository'
import { ProgressRepository } from '../electron/main/progress-repository'
import { TeacherChatRepository } from '../electron/main/teacher-fixture'

const directories: string[] = []
const timestamp = '2026-08-09T00:00:00.000Z'

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

function configuration(
  overrides: Partial<CodexTaskConfigurationSnapshot> = {}
): CodexTaskConfigurationSnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-1',
    threadId: 'thread-1',
    source: 'thread-resume',
    eventTimestampMs: 1,
    observedAt: timestamp,
    freshness: 'fresh',
    connection: 'connected',
    model: { protocolValue: 'gpt-5.6-sol', label: '5.6 Sol' },
    reasoningEffort: { protocolValue: 'high', label: 'High' },
    serviceTier: { protocolValue: 'standard', label: 'Standard' },
    approvalPolicy: { protocolValue: 'on-request', label: 'Approve for me' },
    fullAccess: { protocolValue: 'off', label: 'Off' },
    sandboxType: 'workspaceWrite',
    activePermissionProfile: null,
    ...overrides
  }
}

function activity(config: CodexTaskConfigurationSnapshot | null): ExecutorActivitySnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-1',
    threadId: 'thread-1',
    status: config?.connection === 'disconnected' ? 'disconnected' : 'ready',
    cursor: '',
    learnerPrompts: [],
    executorResponses: [],
    approvalEvents: [],
    changedFiles: [],
    verificationEvidence: [],
    reportedChangedFiles: [],
    reportedVerificationEvidence: [],
    workspaceConfirmedChangedFiles: [],
    workspaceCommittedReportedFilesSinceRunStart: [],
    workspaceCurrentlyDirtyReportedFiles: [],
    observedAt: timestamp,
    workspaceBaseline: null,
    configuration: config
  }
}

async function harness(
  initial: CodexTaskConfigurationSnapshot | null = configuration()
) {
  const directory = await mkdtemp(join(tmpdir(), 'course-companion-m1-review-'))
  directories.push(directory)
  const definitions = new PracticeDefinitionRepository(join(process.cwd(), 'content', 'practices'))
  const definition = await definitions.load('m1-codex-safe-setup', '2.0.0')
  const runs = new PracticeRunRepository(directory)
  const progress = new ProgressRepository(directory, () => new Date(timestamp))
  await progress.save({
    currentLessonId: 'module-1',
    currentCourseLessonId: 'm1-assessment',
    checkpointId: 'm1-setup-checklist',
    sceneId: 'module-1-setup-checklist',
    sceneHistory: [],
    completedCheckpointIds: ['m1-codex-orientation'],
    decisions: {}
  })
  const binding = {
    runId: 'run-1',
    threadId: 'thread-1',
    name: 'Practice · Module 1',
    workspaceRoot: directory,
    createdAt: timestamp
  }
  await runs.save({
    ...defaultPracticeWorkspaceRecord(),
    activeRun: {
      runId: 'run-1',
      generation: 1,
      status: 'active',
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      workspaceKind: definition.workspaceKind,
      taskPolicy: definition.taskPolicy,
      evidenceProfile: definition.evidenceProfile,
      binding,
      startedAt: timestamp,
      updatedAt: timestamp,
      checklist: definition.checklist.map((step, index) => ({
        id: step.id,
        title: step.title,
        status: index === 0 ? 'current' : 'pending'
      })),
      learnerDecisions: {},
      learnerApprovals: {},
      evidence: null,
      invalidations: [],
      reviewStatus: 'not-reviewed'
    }
  })
  let current: ExecutorActivitySnapshot = activity(initial)
  const observer = {
    async bind() {
      return structuredClone(current)
    }
  } as unknown as ExecutorActivityObserver
  const coordinator = new PracticeCoordinator(
    runs,
    definitions,
    {
      async createTarget() { throw new Error('not used') },
      async prepareTarget() { throw new Error('not used') },
      async openTarget() { throw new Error('not used') }
    }
  )
  const chat = new TeacherChatRepository(directory)
  let messageId = 0
  const createService = () => new PracticeReviewService(
      definitions,
      runs,
      coordinator,
      progress,
      observer,
      new DeterministicPracticeReviewEvaluator(),
      chat,
      true,
      () => new Date(timestamp),
      () => 'review-message-' + String(++messageId)
    )
  const service = createService()
  return {
    chat,
    progress,
    runs,
    service,
    restartService: createService,
    setConfiguration(value: CodexTaskConfigurationSnapshot | null) {
      current = activity(value)
    }
  }
}

describe('Module 1 Practice review service', () => {
  it('passes only all five fresh values and persists the approved task configuration', async () => {
    const { chat, progress, runs, service } = await harness()

    const response = await service.review()

    expect(response.workspace.review).toMatchObject({ status: 'passed', canReturn: true })
    expect(response.workspace.checklist.every((step) => step.status === 'completed')).toBe(true)
    const receipt = await service.passedCompletion()
    expect(receipt).toMatchObject({
      practiceId: 'm1-codex-safe-setup',
      checkpointId: 'm1-setup-checklist',
      destination: { checkpointId: 'm1-mastery', sceneId: 'module-1-mastery' },
      approvedConfiguration: {
        model: 'gpt-5.6-sol',
        reasoningEffort: 'high',
        serviceTier: 'standard'
      }
    })
    expect((await progress.load()).status).toBe('returning')
    expect((await runs.load()).activeRun?.reviewStatus).toBe('passed')
    expect((await chat.loadConversation()).messages.at(-1)?.content).toContain(
      'cả năm thiết lập'
    )
  })

  it.each([
    ['Model', { model: { protocolValue: 'gpt-5.6-terra', label: '5.6 Terra' } }],
    ['Effort', { reasoningEffort: { protocolValue: 'medium', label: 'Medium' } }],
    ['Speed', { serviceTier: { protocolValue: 'fast', label: 'Fast' } }],
    ['Approval', { approvalPolicy: { protocolValue: 'never', label: 'Never' } }],
    ['Full access', { fullAccess: { protocolValue: 'on', label: 'On' } }]
  ])('rejects a %s mismatch and gives exactly one next settings action', async (
    label,
    overrides
  ) => {
    const { service } = await harness(configuration(overrides))

    const response = await service.review()

    expect(response.workspace.review).toMatchObject({ status: 'needs-work', canReturn: false })
    expect(response.teacherMessage.content).toContain(label)
    expect(response.teacherMessage.content.match(/Thao tác cài đặt tiếp theo:/g)).toHaveLength(1)
    await expect(service.passedCompletion()).rejects.toThrow()
  })

  it.each([
    ['missing', null],
    ['stale', configuration({ freshness: 'stale' })],
    ['disconnected', configuration({ freshness: 'stale', connection: 'disconnected' })],
    ['unknown', configuration({
      model: { protocolValue: null, label: null },
      freshness: 'unverifiable'
    })]
  ])('rejects %s configuration evidence', async (_label, value) => {
    const { service } = await harness(value)
    await expect(service.review()).resolves.toMatchObject({
      workspace: { review: { status: 'needs-work', canReturn: false } }
    })
  })

  it('passes after reconnect and keeps review, receipt, and return idempotent', async () => {
    const disconnected = configuration({ freshness: 'stale', connection: 'disconnected' })
    const { progress, service, restartService, setConfiguration } = await harness(disconnected)
    expect((await service.review()).workspace.review).toMatchObject({ status: 'needs-work' })

    setConfiguration(configuration({ eventTimestampMs: 2 }))
    expect((await service.review()).workspace.review).toMatchObject({ status: 'passed' })
    const receipt = await service.passedCompletion()
    await expect(restartService().passedCompletion()).resolves.toEqual(receipt)
    await expect(service.review()).resolves.toMatchObject({
      workspace: { review: { status: 'passed' } }
    })
    expect((await progress.load()).status).toBe('returning')
    await expect(service.returnPassedPractice()).resolves.toEqual(receipt)
    await expect(service.returnPassedPractice()).resolves.toEqual(receipt)
  })
})
