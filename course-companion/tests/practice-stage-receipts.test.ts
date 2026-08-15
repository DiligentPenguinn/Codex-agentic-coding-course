import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { parsePracticeDefinition } from '../electron/main/practice-definition-repository'
import {
  defaultPracticeWorkspaceRecord,
  practiceWorkspaceIdentityDigest,
  PracticeRunRepository,
  type PracticeRunRecord
} from '../electron/main/practice-run-repository'
import type { PracticeDefinition, PracticeStageReceipt } from '../shared/contracts'

const temporaryDirectories: string[] = []
const observedAt = '2026-08-15T00:00:00.000Z'

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-stage-receipts-'))
  temporaryDirectories.push(directory)
  return directory
}

function definition(): PracticeDefinition {
  return parsePracticeDefinition({
    schemaVersion: 2,
    practiceId: 'm2-portfolio-planning',
    title: 'Portfolio stage fixture',
    version: '1.0.0',
    checkpointId: 'm2-portfolio-brief',
    objective: 'Verify reusable stage receipts.',
    expectedOutcome: 'Five current receipts.',
    workspaceKind: 'learner-portfolio',
    taskPolicy: 'safe-workspace-write',
    evidenceProfile: 'portfolio-planning',
    stages: Array.from({ length: 5 }, (_, index) => ({
      id: `stage-${index + 1}`,
      order: index + 1,
      dependsOn: index === 0 ? [] : [`stage-${index}`],
      requiredArtifactPaths: [`planning/stage-${index + 1}.md`]
    })),
    checklist: [
      { id: 'complete-stages', title: 'Complete all stages', dependsOn: [] }
    ],
    criteria: [{
      id: 'current-receipts',
      description: 'All receipts are current.',
      required: true,
      checklistStepId: 'complete-stages',
      acceptedEvidence: ['artifact'],
      assertion: 'Five current receipts exist.',
      freshness: 'fresh'
    }],
    completionDestination: {
      lessonId: 'module-2',
      checkpointId: 'm2-portfolio-brief',
      sceneId: 'module-2-portfolio-placeholder',
      label: 'Continue Module 2'
    }
  })
}

function activeRun(workspaceRoot: string): PracticeRunRecord {
  return {
    runId: 'run-portfolio-1',
    generation: 1,
    status: 'active',
    practiceId: 'm2-portfolio-planning',
    practiceVersion: '1.0.0',
    workspaceKind: 'learner-portfolio',
    taskPolicy: 'safe-workspace-write',
    evidenceProfile: 'portfolio-planning',
    binding: {
      runId: 'run-portfolio-1',
      threadId: 'thread-portfolio-1',
      name: 'Practice · Module 2 · portfolio',
      workspaceRoot,
      createdAt: observedAt
    },
    startedAt: observedAt,
    updatedAt: observedAt,
    checklist: [{
      id: 'complete-stages',
      title: 'Complete all stages',
      status: 'current',
      dependencyInputs: {}
    }],
    learnerDecisions: {},
    learnerApprovals: {},
    evidence: null,
    invalidations: [],
    stageReceipts: [],
    reviewStatus: 'not-reviewed'
  }
}

function digest(index: number, alternate = false): string {
  return (alternate ? String(index + 5) : String(index)).repeat(64)
}

function receipt(workspaceRoot: string, stageIndex: number): PracticeStageReceipt {
  const artifactPath = `planning/stage-${stageIndex}.md`
  const artifactDigest = digest(stageIndex)
  return {
    schemaVersion: 1,
    courseRunId: 'course-run-portfolio-1',
    practiceId: 'm2-portfolio-planning',
    practiceVersion: '1.0.0',
    runId: 'run-portfolio-1',
    stageId: `stage-${stageIndex}`,
    stageIndex: stageIndex as PracticeStageReceipt['stageIndex'],
    workspace: {
      canonicalPath: workspaceRoot,
      identityDigest: practiceWorkspaceIdentityDigest(workspaceRoot)
    },
    artifactDigests: { [artifactPath]: artifactDigest },
    approval: {
      approvedAt: observedAt,
      artifactDigests: { [artifactPath]: artifactDigest }
    },
    evidence: {
      executorReportedChecks: [`Executor reported stage ${stageIndex} checks.`],
      corroboratedArtifacts: { [artifactPath]: artifactDigest }
    },
    status: 'completed',
    freshness: 'current',
    observedAt
  }
}

function identity() {
  return {
    runId: 'run-portfolio-1',
    generation: 1,
    practiceId: 'm2-portfolio-planning',
    practiceVersion: '1.0.0'
  }
}

async function seededRepository() {
  const directory = await temporaryDirectory()
  const workspaceRoot = await temporaryDirectory()
  const repository = new PracticeRunRepository(directory)
  await repository.save({
    ...defaultPracticeWorkspaceRecord(),
    activeRun: activeRun(workspaceRoot)
  })
  return { directory, workspaceRoot, repository }
}

describe('Practice staged portfolio receipts', () => {
  it('persists and resumes the same active Practice after every one of five ordered stages', async () => {
    const { directory, workspaceRoot } = await seededRepository()
    for (let stageIndex = 1; stageIndex <= 5; stageIndex += 1) {
      const repository = new PracticeRunRepository(directory)
      const saved = await repository.saveStageReceipt({
        ...identity(),
        definition: definition(),
        receipt: receipt(workspaceRoot, stageIndex),
        updatedAt: observedAt
      })
      expect(saved.activeRun?.runId).toBe('run-portfolio-1')
      expect(saved.activeRun?.stageReceipts).toHaveLength(stageIndex)
      await expect(new PracticeRunRepository(directory).load()).resolves.toMatchObject({
        activeRun: {
          runId: 'run-portfolio-1',
          stageReceipts: expect.arrayContaining([
            expect.objectContaining({ stageId: `stage-${stageIndex}`, freshness: 'current' })
          ])
        }
      })
    }
  })

  it('rejects a skipped stage, another active run, and an approval from an older digest', async () => {
    const { workspaceRoot, repository } = await seededRepository()
    await expect(repository.saveStageReceipt({
      ...identity(),
      definition: definition(),
      receipt: receipt(workspaceRoot, 2),
      updatedAt: observedAt
    })).rejects.toThrow('completed in order')

    await expect(repository.saveStageReceipt({
      ...identity(),
      runId: 'another-run',
      definition: definition(),
      receipt: { ...receipt(workspaceRoot, 1), runId: 'another-run' },
      updatedAt: observedAt
    })).rejects.toThrow('active Practice run')

    const newer = receipt(workspaceRoot, 1)
    newer.artifactDigests['planning/stage-1.md'] = digest(1, true)
    newer.evidence.corroboratedArtifacts['planning/stage-1.md'] = digest(1, true)
    await expect(repository.saveStageReceipt({
      ...identity(),
      definition: definition(),
      receipt: newer,
      updatedAt: observedAt
    })).rejects.toThrow('Invalid Practice stage receipt identity')
  })

  it('marks only the changed stage and its dependency descendants stale', async () => {
    const { workspaceRoot, repository } = await seededRepository()
    for (let stageIndex = 1; stageIndex <= 5; stageIndex += 1) {
      await repository.saveStageReceipt({
        ...identity(),
        definition: definition(),
        receipt: receipt(workspaceRoot, stageIndex),
        updatedAt: observedAt
      })
    }
    const currentArtifactDigests = Object.fromEntries(Array.from({ length: 5 }, (_, index) => [
      `planning/stage-${index + 1}.md`,
      index === 1 ? digest(2, true) : digest(index + 1)
    ]))

    const reconciled = await repository.reconcileStageArtifacts({
      ...identity(),
      definition: definition(),
      currentArtifactDigests,
      updatedAt: '2026-08-15T00:05:00.000Z'
    })

    expect(reconciled.activeRun?.stageReceipts?.map((item) => [item.stageId, item.freshness]))
      .toEqual([
        ['stage-1', 'current'],
        ['stage-2', 'stale'],
        ['stage-3', 'stale'],
        ['stage-4', 'stale'],
        ['stage-5', 'stale']
      ])
    expect(reconciled.activeRun?.reviewStatus).toBe('not-reviewed')
  })
})
