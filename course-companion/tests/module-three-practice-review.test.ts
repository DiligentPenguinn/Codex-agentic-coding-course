import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { buildPracticeReviewEnvelope } from '../electron/main/practice-review-context'
import { DeterministicPracticeReviewEvaluator } from '../electron/main/practice-review-evaluator'
import type { PracticeRunRecord } from '../electron/main/practice-run-repository'

const timestamp = '2026-08-19T00:00:00.000Z'
const definitions = new PracticeDefinitionRepository(
  join(process.cwd(), '..', 'pilot-workspace', 'course', 'practices')
)

async function envelopeWithIssues(issueCodes: string[] = []) {
  const definition = await definitions.load('m3-portfolio-build', '1.0.0')
  const artifacts = definition.stages!.flatMap((stage) => stage.requiredArtifactPaths).map((path) => ({
    path,
    digest: path.padEnd(64, '0').slice(0, 64),
    byteLength: 240,
    modifiedAt: timestamp,
    observedAt: timestamp
  }))
  const run: PracticeRunRecord = {
    runId: 'run-build',
    generation: 1,
    status: 'active',
    practiceId: definition.practiceId,
    practiceVersion: definition.version,
    workspaceKind: definition.workspaceKind,
    taskPolicy: definition.taskPolicy,
    evidenceProfile: definition.evidenceProfile,
    binding: {
      runId: 'run-build',
      threadId: 'thread-build',
      name: 'Portfolio build',
      workspaceRoot: '/tmp/portfolio-build',
      createdAt: timestamp
    },
    startedAt: timestamp,
    updatedAt: timestamp,
    checklist: definition.checklist.map((step, index) => ({
      id: step.id,
      title: step.title,
      status: index === 0 ? 'current' : 'pending'
    })),
    learnerDecisions: {},
    learnerApprovals: {},
    evidence: {
      schemaVersion: 1,
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      runId: 'run-build',
      evidenceProfile: 'portfolio-build',
      observedAt: timestamp,
      freshness: 'fresh',
      sourceDigest: 'a'.repeat(64),
      evidence: artifacts.map((artifact, index) => ({
        id: `artifact:${index + 1}`,
        kind: 'artifact',
        text: artifact.path,
        freshness: 'fresh'
      })),
      steps: definition.stages!.map((stage, index) => ({
        stepId: stage.id,
        status: index === 0 ? 'current' : 'pending',
        dependencyInputs: {}
      })),
      invalidations: [],
      portfolioBuild: {
        schemaVersion: 1,
        workspaceIdentityDigest: 'b'.repeat(64),
        artifacts,
        issues: issueCodes.map((code) => ({
          stageId: definition.stages![0]!.id,
          path: definition.stages![0]!.requiredArtifactPaths[0]!,
          code: code as 'missing',
          message: 'Fixture issue'
        })),
        unexpectedPaths: [],
        stages: definition.stages!.map((stage) => ({
          stageId: stage.id,
          stageIndex: stage.order,
          status: issueCodes.length > 0 && stage.order === 1 ? 'blocked' : 'ready',
          artifactDigests: {},
          executorReportedChecks: ['npm run check passed'],
          corroboratedArtifacts: {},
          issueCodes: issueCodes.length > 0 && stage.order === 1 ? ['missing'] : []
        }))
      }
    },
    invalidations: [],
    stageReceipts: [],
    buildSliceReceipts: [],
    reviewStatus: 'not-reviewed'
  }
  return buildPracticeReviewEnvelope({
    definition,
    run,
    activity: null,
    generatedAt: timestamp
  })
}

describe('Module 3 final Practice review', () => {
  it('passes only when every internal evidence stage is ready and clean', async () => {
    const evaluator = new DeterministicPracticeReviewEvaluator()
    const passed = JSON.parse(await evaluator.evaluate(await envelopeWithIssues())) as { verdict: string }
    const blocked = JSON.parse(await evaluator.evaluate(await envelopeWithIssues(['missing']))) as { verdict: string }

    expect(passed.verdict).toBe('passed')
    expect(blocked.verdict).toBe('needs-work')
  })
})
