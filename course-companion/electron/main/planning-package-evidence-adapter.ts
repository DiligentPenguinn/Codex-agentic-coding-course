import { createHash } from 'node:crypto'
import {
  planningArtifactPaths,
  type ExecutorActivitySnapshot,
  type PlanningArtifactIssue,
  type PlanningArtifactSnapshot,
  type PracticeAdapterEvidenceState,
  type PracticeAdapterStepState,
  type PracticeEvidenceReference
} from '../../shared/contracts'
import type {
  PracticeEvidenceAdapter,
  PracticeEvidenceAdapterContext
} from './practice-evidence-adapter'
import {
  PlanningArtifactRepository,
  redactPlanningEvidence
} from './planning-artifact-repository'
import {
  GitWorkspaceEvidenceProvider,
  type WorkspaceEvidenceProvider
} from './workspace-evidence-provider'

type ActivitySource = {
  current: () => Promise<ExecutorActivitySnapshot | null>
}

function sourceDigest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function initialSteps(context: Readonly<PracticeEvidenceAdapterContext>): PracticeAdapterStepState[] {
  return context.definition.checklist.map((step, index) => ({
    stepId: step.id,
    status: index === 0 ? 'current' : 'pending',
    dependencyInputs: {}
  }))
}

export class PlanningPackageEvidenceAdapter implements PracticeEvidenceAdapter {
  readonly evidenceProfile = 'planning-package' as const

  constructor(
    private readonly source: ActivitySource,
    private readonly artifacts: PlanningArtifactRepository = new PlanningArtifactRepository(),
    private readonly workspaceEvidence: WorkspaceEvidenceProvider = new GitWorkspaceEvidenceProvider(),
    private readonly now: () => Date = () => new Date()
  ) {}

  async collect(
    context: Readonly<PracticeEvidenceAdapterContext>
  ): Promise<PracticeAdapterEvidenceState> {
    const activity = await this.source.current()
    const identityMatches = activity
      && activity.runId === context.runId
      && context.task?.threadId === activity.threadId
      && context.task.workspaceRoot === context.workspaceRoot
    const observedAt = this.now().toISOString()
    if (!identityMatches || !activity?.workspaceBaseline?.gitAvailable) {
      return {
        schemaVersion: 1,
        practiceId: context.definition.practiceId,
        practiceVersion: context.definition.version,
        runId: context.runId,
        evidenceProfile: this.evidenceProfile,
        observedAt,
        freshness: 'unverifiable',
        sourceDigest: null,
        evidence: [],
        steps: initialSteps(context),
        invalidations: [],
        planningArtifacts: [],
        artifactIssues: planningArtifactPaths.map((path) => ({
          path,
          code: 'unchanged',
          message: 'Chưa có baseline Git mới và xác minh được cho Practice này.'
        })),
        unexpectedChangedPaths: []
      }
    }

    const reconciliation = await this.workspaceEvidence.reconcile(
      context.workspaceRoot,
      activity.workspaceBaseline,
      [...planningArtifactPaths],
      activity.workspaceBaseline.capturedAt
    )
    const changed = new Set([
      ...reconciliation.changedSinceBaseline,
      ...reconciliation.committedReportedFilesSinceRunStart
    ])
    const allowed = new Set<string>(planningArtifactPaths)
    const unexpectedChangedPaths = [...changed]
      .filter((path) => !allowed.has(path))
      .sort()
      .slice(0, 100)
    const planningArtifacts: PlanningArtifactSnapshot[] = []
    const artifactIssues: PlanningArtifactIssue[] = []
    const learnerAuthoredPrompts = activity.learnerAuthoredPrompts
      ?? activity.learnerPrompts.filter((prompt) =>
        !prompt.startsWith('Thực hiện Practice ' + context.definition.practiceId + '.'))
    const rawPrdPrompt = learnerAuthoredPrompts[0]?.slice(0, 2_000) ?? null
    const planningActivity = {
      schemaVersion: 1 as const,
      cursor: activity.cursor,
      observedAt: activity.observedAt,
      learnerTurnCount: learnerAuthoredPrompts.length,
      executorTurnCount: activity.executorResponses.length,
      prdPrompt: rawPrdPrompt
        ? {
            text: redactPlanningEvidence(rawPrdPrompt),
            digest: createHash('sha256').update(rawPrdPrompt).digest('hex')
          }
        : null
    }

    for (const path of planningArtifactPaths) {
      const result = await this.artifacts.inspect(context.workspaceRoot, path, observedAt)
      if (result.status === 'rejected') {
        artifactIssues.push(result.issue)
      } else if (!changed.has(path)) {
        artifactIssues.push({
          path,
          code: 'unchanged',
          message: 'Artifact chưa thay đổi kể từ baseline của Practice.'
        })
      } else {
        planningArtifacts.push(result.artifact)
      }
    }

    const evidence: PracticeEvidenceReference[] = [
      ...planningArtifacts.map((artifact) => ({
        id: 'planning-artifact-' + artifact.path.replaceAll('/', '-').toLowerCase(),
        kind: 'planning-artifact' as const,
        text: [
          artifact.path,
          'sha256=' + artifact.digest,
          'bytes=' + String(artifact.byteLength),
          'modifiedAt=' + artifact.modifiedAt
        ].join(' | '),
        freshness: 'fresh' as const
      })),
      ...unexpectedChangedPaths.slice(0, 12).map((path, index) => ({
        id: 'unexpected-workspace-change-' + String(index + 1),
        kind: 'unexpected-workspace-change' as const,
        text: path.slice(0, 500),
        freshness: 'fresh' as const
      }))
    ]
    const connectionFresh = activity.status !== 'stale'
      && activity.status !== 'disconnected'
    const complete = planningArtifacts.length === planningArtifactPaths.length
      && artifactIssues.length === 0
      && unexpectedChangedPaths.length === 0
    const digest = sourceDigest({
      baselineCapturedAt: activity.workspaceBaseline.capturedAt,
      artifacts: planningArtifacts.map(({ path, digest, byteLength }) => ({
        path,
        digest,
        byteLength
      })),
      issues: artifactIssues,
      changedPaths: [...changed].sort(),
      unexpectedChangedPaths
    })

    return {
      schemaVersion: 1,
      practiceId: context.definition.practiceId,
      practiceVersion: context.definition.version,
      runId: context.runId,
      evidenceProfile: this.evidenceProfile,
      observedAt,
      freshness: !connectionFresh ? 'stale' : complete ? 'fresh' : 'unverifiable',
      sourceDigest: digest,
      evidence: evidence.map((item) => ({
        ...item,
        freshness: connectionFresh ? item.freshness : 'stale'
      })),
      steps: initialSteps(context),
      invalidations: [],
      planningArtifacts,
      artifactIssues,
      unexpectedChangedPaths,
      planningActivity
    }
  }
}
