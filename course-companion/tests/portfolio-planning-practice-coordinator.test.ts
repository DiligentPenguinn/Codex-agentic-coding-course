import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PracticeCoordinator } from '../electron/main/practice-coordinator'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { PracticeEvidenceAdapterRegistry } from '../electron/main/practice-evidence-adapter-registry'
import type { PracticeEvidenceAdapter } from '../electron/main/practice-evidence-adapter'
import {
  defaultPracticeWorkspaceRecord,
  practiceWorkspaceIdentityDigest,
  PracticeRunRepository,
  type PracticeRunRecord
} from '../electron/main/practice-run-repository'
import type {
  PracticeAdapterEvidenceState,
  PracticeDefinition,
  PracticeEvidenceProfile
} from '../shared/contracts'

const temporaryDirectories: string[] = []
const observedAt = '2026-08-15T09:00:00.000Z'

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

async function temporaryDirectory(prefix: string): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), prefix))
  temporaryDirectories.push(directory)
  return directory
}

function digest(index: number): string {
  return String(index).repeat(64)
}

function evidenceAdapter(
  evidenceProfile: PracticeEvidenceProfile,
  workspaceRoot: string
): PracticeEvidenceAdapter {
  return {
    evidenceProfile,
    async collect(context): Promise<PracticeAdapterEvidenceState> {
      if (evidenceProfile !== 'portfolio-planning') {
        return {
          schemaVersion: 1,
          practiceId: context.definition.practiceId,
          practiceVersion: context.definition.version,
          runId: context.runId,
          evidenceProfile,
          observedAt,
          freshness: 'unverifiable',
          sourceDigest: null,
          evidence: [],
          steps: [],
          invalidations: []
        }
      }
      const stages = context.definition.stages ?? []
      const artifacts = stages.flatMap((stage) => stage.requiredArtifactPaths.map((path) => ({
        path,
        digest: digest(stage.order),
        byteLength: 100 + stage.order,
        modifiedAt: observedAt,
        observedAt
      })))
      return {
        schemaVersion: 1,
        practiceId: context.definition.practiceId,
        practiceVersion: context.definition.version,
        runId: context.runId,
        evidenceProfile,
        observedAt,
        freshness: 'fresh',
        sourceDigest: 'a'.repeat(64),
        evidence: [],
        steps: context.definition.checklist.map((step, index) => ({
          stepId: step.id,
          status: index === 0 ? 'current' : 'pending',
          dependencyInputs: {}
        })),
        invalidations: [],
        portfolioPlanning: {
          schemaVersion: 1,
          workspaceIdentityDigest: practiceWorkspaceIdentityDigest(workspaceRoot),
          artifacts,
          issues: [],
          unexpectedPaths: [],
          stages: stages.map((stage) => {
            const artifactDigests = Object.fromEntries(stage.requiredArtifactPaths.map((path) => [
              path,
              digest(stage.order)
            ]))
            return {
              stageId: stage.id,
              stageIndex: stage.order,
              status: 'ready',
              artifactDigests,
              executorReportedChecks: [`Executor check for ${stage.id}`],
              corroboratedArtifacts: { ...artifactDigests },
              issueCodes: []
            }
          })
        }
      }
    }
  }
}

function activeRun(definition: PracticeDefinition, workspaceRoot: string): PracticeRunRecord {
  return {
    runId: 'run-portfolio-1',
    generation: 1,
    status: 'active',
    practiceId: definition.practiceId,
    practiceVersion: definition.version,
    workspaceKind: definition.workspaceKind,
    taskPolicy: definition.taskPolicy,
    evidenceProfile: definition.evidenceProfile,
    binding: {
      runId: 'run-portfolio-1',
      threadId: 'thread-portfolio-1',
      name: 'Practice · Module 2 · portfolio',
      workspaceRoot,
      createdAt: observedAt
    },
    startedAt: observedAt,
    updatedAt: observedAt,
    checklist: definition.checklist.map((step, index) => ({
      id: step.id,
      title: step.title,
      status: index === 0 ? 'current' : 'pending',
      dependencyInputs: {}
    })),
    learnerDecisions: {},
    learnerApprovals: {},
    evidence: null,
    invalidations: [],
    stageReceipts: [],
    reviewStatus: 'not-reviewed'
  }
}

describe('Portfolio planning Practice coordinator', () => {
  it('approves five stages across relaunches in one task and returns to mastery', async () => {
    const dataDirectory = await temporaryDirectory('portfolio-practice-state-')
    const primaryDefinitions = await temporaryDirectory('portfolio-practice-defs-')
    const workspaceRoot = await temporaryDirectory('portfolio-practice-workspace-')
    const fallbackDefinitions = join(process.cwd(), '..', 'pilot-workspace', 'course', 'practices')
    const definitions = new PracticeDefinitionRepository(primaryDefinitions, fallbackDefinitions)
    const definition = await definitions.load('m2-portfolio-planning', '1.0.0')
    await new PracticeRunRepository(dataDirectory).save({
      ...defaultPracticeWorkspaceRecord(),
      activeRun: activeRun(definition, workspaceRoot)
    })
    const adapters = new PracticeEvidenceAdapterRegistry([
      evidenceAdapter('codex-task-configuration', workspaceRoot),
      evidenceAdapter('planning-package', workspaceRoot),
      evidenceAdapter('portfolio-planning', workspaceRoot)
    ])
    const executorCalls = { create: 0, prepare: 0, open: 0 }
    const executor = {
      async createTarget() {
        executorCalls.create += 1
        throw new Error('A stage must not create another task')
      },
      async prepareTarget() {
        executorCalls.prepare += 1
      },
      async openTarget() {
        executorCalls.open += 1
      }
    }

    let lastView
    for (const stage of definition.stages ?? []) {
      const coordinator = new PracticeCoordinator(
        new PracticeRunRepository(dataDirectory),
        definitions,
        executor,
        () => new Date(observedAt),
        undefined,
        undefined,
        undefined,
        adapters
      )
      await coordinator.resume({ practiceId: definition.practiceId, practiceVersion: definition.version })
      lastView = await coordinator.recordPortfolioStageAction({
        runId: 'run-portfolio-1',
        generation: 1,
        practiceId: definition.practiceId,
        practiceVersion: definition.version,
        courseRunId: 'course-run-portfolio-1',
        stageId: stage.id,
        decision: 'approved'
      })
      expect(lastView.activePractice?.runId).toBe('run-portfolio-1')
    }

    expect(executorCalls).toEqual({ create: 0, prepare: 0, open: 5 })
    expect(lastView?.portfolioPlanning?.stages.map((stage) => stage.status))
      .toEqual(['completed', 'completed', 'completed', 'completed', 'completed'])
    expect(lastView?.completionDestination).toMatchObject({
      lessonId: 'module-2',
      checkpointId: 'm2-portfolio-mastery',
      sceneId: 'module-2-portfolio-mastery'
    })
    const persisted = await new PracticeRunRepository(dataDirectory).load()
    expect(persisted.activeRun?.stageReceipts).toHaveLength(5)
    expect(new Set(persisted.activeRun?.stageReceipts?.map((receipt) => receipt.runId)))
      .toEqual(new Set(['run-portfolio-1']))
  })

  it('records a revision request without creating an approval receipt', async () => {
    const dataDirectory = await temporaryDirectory('portfolio-practice-revision-state-')
    const primaryDefinitions = await temporaryDirectory('portfolio-practice-revision-defs-')
    const workspaceRoot = await temporaryDirectory('portfolio-practice-revision-workspace-')
    const definitions = new PracticeDefinitionRepository(
      primaryDefinitions,
      join(process.cwd(), '..', 'pilot-workspace', 'course', 'practices')
    )
    const definition = await definitions.load('m2-portfolio-planning', '1.0.0')
    await new PracticeRunRepository(dataDirectory).save({
      ...defaultPracticeWorkspaceRecord(),
      activeRun: activeRun(definition, workspaceRoot)
    })
    const adapters = new PracticeEvidenceAdapterRegistry([
      evidenceAdapter('codex-task-configuration', workspaceRoot),
      evidenceAdapter('planning-package', workspaceRoot),
      evidenceAdapter('portfolio-planning', workspaceRoot)
    ])
    const coordinator = new PracticeCoordinator(
      new PracticeRunRepository(dataDirectory),
      definitions,
      { createTarget: async () => { throw new Error('unused') }, prepareTarget: async () => {}, openTarget: async () => {} },
      () => new Date(observedAt),
      undefined,
      undefined,
      undefined,
      adapters
    )

    await coordinator.recordPortfolioStageAction({
      runId: 'run-portfolio-1',
      generation: 1,
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      courseRunId: 'course-run-portfolio-1',
      stageId: 'portfolio-brief',
      decision: 'revision-requested'
    })

    const persisted = await new PracticeRunRepository(dataDirectory).load()
    expect(persisted.activeRun?.stageReceipts).toEqual([])
    expect(persisted.activeRun?.learnerDecisions['portfolio-brief-decision'])
      .toBe('revision-requested')
  })
})
