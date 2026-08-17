import { createHash } from 'node:crypto'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import type {
  ExecutorActivitySnapshot,
  PracticeAdapterEvidenceState,
  PracticeEvidenceProfile
} from '../shared/contracts'
import type { PracticeEvidenceAdapter } from '../electron/main/practice-evidence-adapter'
import { PracticeEvidenceAdapterRegistry } from '../electron/main/practice-evidence-adapter-registry'
import { PracticeCoordinator } from '../electron/main/practice-coordinator'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { DeterministicPracticeReviewEvaluator } from '../electron/main/practice-review-evaluator'
import type { PracticeReviewEvaluator } from '../electron/main/practice-review-evaluator'
import { PracticeReviewService } from '../electron/main/practice-review-service'
import {
  defaultPracticeWorkspaceRecord,
  PracticeRunRepository
} from '../electron/main/practice-run-repository'
import { ProgressRepository } from '../electron/main/progress-repository'
import { TeacherChatRepository } from '../electron/main/teacher-fixture'
import type { ExecutorActivityObserver } from '../electron/main/executor-activity-observer'

const directories: string[] = []
const timestamp = '2026-08-11T00:00:00.000Z'

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function planningEvidence(prd: string, plan: string): PracticeAdapterEvidenceState {
  const prompt = 'Hãy phỏng vấn tôi từng câu để tạo PRD.'
  return {
    schemaVersion: 1,
    practiceId: 'm2-planning-package',
    practiceVersion: '2.0.0',
    runId: 'run-2',
    evidenceProfile: 'planning-package',
    observedAt: timestamp,
    freshness: 'fresh',
    sourceDigest: digest(prd + '\n' + plan),
    evidence: [],
    steps: [],
    invalidations: [],
    planningArtifacts: [
      {
        schemaVersion: 1,
        path: 'artifacts/PRD.md',
        content: prd,
        digest: digest(prd),
        byteLength: Buffer.byteLength(prd),
        modifiedAt: timestamp,
        observedAt: timestamp
      },
      {
        schemaVersion: 1,
        path: 'artifacts/implementation-plan.md',
        content: plan,
        digest: digest(plan),
        byteLength: Buffer.byteLength(plan),
        modifiedAt: timestamp,
        observedAt: timestamp
      }
    ],
    artifactIssues: [],
    unexpectedChangedPaths: [],
    planningActivity: {
      schemaVersion: 1,
      cursor: 'cursor-1',
      observedAt: timestamp,
      learnerTurnCount: 3,
      executorTurnCount: 2,
      prdPrompt: { text: prompt, digest: digest(prompt) }
    }
  }
}

function adapter(
  evidenceProfile: PracticeEvidenceProfile,
  current: () => PracticeAdapterEvidenceState
): PracticeEvidenceAdapter {
  return {
    evidenceProfile,
    async collect(context) {
      if (evidenceProfile === 'planning-package') return structuredClone(current())
      return {
        schemaVersion: 1,
        practiceId: context.definition.practiceId,
        practiceVersion: context.definition.version,
        runId: context.runId,
        evidenceProfile,
        observedAt: timestamp,
        freshness: 'unverifiable',
        sourceDigest: null,
        evidence: [],
        steps: [],
        invalidations: []
      }
    }
  }
}

async function harness(mutateDuringReview: boolean) {
  const directory = await mkdtemp(join(tmpdir(), 'planning-review-service-'))
  directories.push(directory)
  const definitions = new PracticeDefinitionRepository(join(process.cwd(), 'content', 'practices'))
  const definition = await definitions.load('m2-planning-package', '2.0.0')
  const runs = new PracticeRunRepository(directory)
  const progress = new ProgressRepository(directory, () => new Date(timestamp))
  await progress.save({
    currentLessonId: 'module-2',
    currentCourseLessonId: 'm2-prd-review',
    checkpointId: 'm2-planning-package',
    sceneId: 'module-2-planning-package',
    sceneHistory: [],
    completedCheckpointIds: ['m2-alignment-review'],
    decisions: {}
  })
  const prd = '# PRD\n\nNội dung yếu nhưng hợp lệ.'
  const plan = '# Plan\n\nNội dung yếu nhưng hợp lệ.'
  let current = planningEvidence(prd, plan)
  const prdDigest = current.planningArtifacts![0]!.digest
  const planDigest = current.planningArtifacts![1]!.digest
  await runs.save({
    ...defaultPracticeWorkspaceRecord(),
    activeRun: {
      runId: 'run-2',
      generation: 1,
      status: 'active',
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      workspaceKind: definition.workspaceKind,
      taskPolicy: definition.taskPolicy,
      evidenceProfile: definition.evidenceProfile,
      binding: {
        runId: 'run-2',
        threadId: 'thread-2',
        name: 'Practice · Module 2',
        workspaceRoot: directory,
        createdAt: timestamp
      },
      startedAt: timestamp,
      updatedAt: timestamp,
      checklist: definition.checklist.map((step, index) => ({
        id: step.id,
        title: step.title,
        status: index < 6 ? 'completed' : index === 6 ? 'current' : 'pending',
        dependencyInputs: {}
      })),
      learnerDecisions: {
        'prd-prompt': current.planningActivity!.prdPrompt!.text,
        'prd-prompt-digest': current.planningActivity!.prdPrompt!.digest,
        'interview-completion': 'complete',
        'alignment-confirmed': prdDigest + ':' + planDigest,
        'scope-decision': 'Tôi giữ xuất bản thủ công ngoài phạm vi của phiên bản đầu tiên.'
      },
      learnerApprovals: {
        'prd-approval': {
          decision: 'approved',
          recordedAt: timestamp,
          artifactDigests: { 'artifacts/PRD.md': prdDigest }
        },
        'plan-approval': {
          decision: 'approved',
          recordedAt: timestamp,
          artifactDigests: {
            'artifacts/PRD.md': prdDigest,
            'artifacts/implementation-plan.md': planDigest
          }
        }
      },
      evidence: current,
      invalidations: [],
      reviewStatus: 'not-reviewed'
    }
  })
  const registry = new PracticeEvidenceAdapterRegistry([
    adapter('codex-task-configuration', () => current),
    adapter('planning-package', () => current),
    adapter('portfolio-planning', () => current)
  ])
  const observer = {
    async bind(): Promise<ExecutorActivitySnapshot> {
      return {
        schemaVersion: 1,
        runId: 'run-2',
        threadId: 'thread-2',
        status: 'response-ready',
        cursor: 'cursor-1',
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
        configuration: null
      }
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
  const deterministic = new DeterministicPracticeReviewEvaluator()
  const evaluator: PracticeReviewEvaluator = {
    async evaluate(envelope) {
      const result = await deterministic.evaluate(envelope)
      if (mutateDuringReview) {
        current = planningEvidence(prd, plan + '\nThay đổi trong lúc review.')
      }
      return result
    }
  }
  const service = new PracticeReviewService(
    definitions,
    runs,
    coordinator,
    progress,
    observer,
    evaluator,
    new TeacherChatRepository(directory),
    true,
    () => new Date(timestamp),
    () => 'teacher-message-1',
    registry
  )
  return { runs, service }
}

describe('Module 2 review transaction', () => {
  it('persists a deterministic needs-work review when frozen evidence stays unchanged', async () => {
    const { runs, service } = await harness(false)

    const response = await service.review()
    expect(response).toMatchObject({
      workspace: { review: { status: 'needs-work', canReturn: false } }
    })
    expect(response.teacherMessage.content).toContain('Kết luận: Cần chỉnh sửa.')
    expect(response.teacherMessage.content).toContain('Bằng chứng đã duyệt:')
    expect(response.teacherMessage.content).toContain('Đã đạt:')
    expect(response.teacherMessage.content).toContain('Cần sửa:')
    expect(response.teacherMessage.content.match(/Thao tác tiếp theo:/g)).toHaveLength(1)
    expect((await runs.load()).activeRun?.reviewResult?.verdict).toBe('needs-work')
  })

  it('discards evaluator output when an artifact digest changes during review', async () => {
    const { runs, service } = await harness(true)

    await expect(service.review()).rejects.toThrow('thay đổi trong khi Triết đang duyệt')
    const active = (await runs.load()).activeRun
    expect(active?.reviewStatus).toBe('not-reviewed')
    expect(active?.reviewResult).toBeUndefined()
  })
})
