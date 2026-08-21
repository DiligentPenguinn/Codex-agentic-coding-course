import { createHash } from 'node:crypto'
import type {
  CodexTaskConfigurationSnapshot,
  ExecutorActivitySnapshot,
  PracticeDefinition,
  PracticeEvidenceKind,
  PracticeEvidenceReference,
  PortfolioPlanningEvidenceState
} from '../../shared/contracts'
import type { PracticeRunRecord } from './practice-run-repository'

const MAX_TEXT = 1_000
const MAX_PER_KIND = 12

function redact(value: string): string {
  return value
    .replace(/-----BEGIN [^-\r\n]*PRIVATE KEY-----[\s\S]*?-----END [^-\r\n]*PRIVATE KEY-----/gi, '[REDACTED PRIVATE KEY]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(/\b(token|password|secret|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
}

function bounded(value: string): string {
  const points = [...redact(value)]
  return points.length <= MAX_TEXT ? points.join('') : points.slice(0, MAX_TEXT - 3).join('') + '...'
}

function append(
  target: PracticeEvidenceReference[],
  kind: PracticeEvidenceKind,
  values: string[],
  freshness: 'fresh' | 'stale'
): void {
  const existing = target.filter((item) => item.kind === kind).length
  values.slice(0, Math.max(0, MAX_PER_KIND - existing)).forEach((text, index) => {
    target.push({
      id: kind + ':' + String(existing + index + 1),
      kind,
      text: bounded(text),
      freshness
    })
  })
}

export type PracticeReviewEnvelope = {
  schemaVersion: 1
  definition: PracticeDefinition
  run: {
    runId: string
    generation: number
    threadId: string
    startedAt: string
  }
  evidence: PracticeEvidenceReference[]
  configuration?: CodexTaskConfigurationSnapshot
  planning?: {
    evidenceDigest: string
    observedAt: string
    freshness: 'fresh' | 'stale' | 'unverifiable'
    artifacts: Array<{
      path: 'artifacts/PRD.md' | 'artifacts/implementation-plan.md'
      content: string
      digest: string
      byteLength: number
      modifiedAt: string
    }>
    approvals: Array<{
      key: string
      decision: 'approved' | 'revision-requested'
      recordedAt: string
      artifactDigests: Record<string, string>
    }>
    prdPrompt: { text: string; digest: string } | null
    scopeDecision: string | null
    alignment: { prdDigest: string; planDigest: string } | null
    unexpectedChangedPaths: string[]
  }
  portfolioBuild?: PortfolioPlanningEvidenceState
  generatedAt: string
}

function digest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

const configurationFields = [
  ['model', 'Model'],
  ['reasoningEffort', 'Effort'],
  ['serviceTier', 'Speed'],
  ['approvalPolicy', 'Approval'],
  ['fullAccess', 'Full access']
] as const

export function buildPracticeReviewEnvelope(input: {
  definition: PracticeDefinition
  run: PracticeRunRecord
  activity: ExecutorActivitySnapshot | null
  decisions?: Record<string, string>
  generatedAt: string
}): PracticeReviewEnvelope {
  if (input.definition.evidenceProfile === 'codex-task-configuration') {
    const configuration = input.activity?.configuration
    const configurationMatches = input.activity?.runId === input.run.runId
      && input.activity.threadId === input.run.binding.threadId
      && configuration?.runId === input.run.runId
      && configuration.threadId === input.run.binding.threadId
    const accepted = configurationMatches ? configuration : null
    const freshness = accepted?.freshness === 'fresh' && accepted.connection === 'connected'
      ? 'fresh' as const
      : 'stale' as const
    return {
      schemaVersion: 1,
      definition: structuredClone(input.definition),
      run: {
        runId: input.run.runId,
        generation: input.run.generation,
        threadId: input.run.binding.threadId,
        startedAt: input.run.startedAt
      },
      evidence: accepted
        ? configurationFields.map(([key, label]) => ({
            id: 'configuration-' + key,
            kind: 'codex-task-configuration' as const,
            text: label + ': ' + (accepted[key].label ?? 'không xác minh được'),
            freshness
          }))
        : [],
      ...(accepted ? { configuration: structuredClone(accepted) } : {}),
      generatedAt: input.generatedAt
    }
  }
  if (input.definition.evidenceProfile === 'planning-package') {
    const state = input.run.evidence
    const accepted = state?.evidenceProfile === 'planning-package'
      && state.practiceId === input.definition.practiceId
      && state.practiceVersion === input.definition.version
      && state.runId === input.run.runId
      ? state
      : null
    const artifacts = (accepted?.planningArtifacts ?? []).map((artifact) => ({
      path: artifact.path,
      content: redact(artifact.content),
      digest: artifact.digest,
      byteLength: artifact.byteLength,
      modifiedAt: artifact.modifiedAt
    }))
    const prdDigest = artifacts.find((artifact) => artifact.path === 'artifacts/PRD.md')?.digest
    const planDigest = artifacts.find((artifact) =>
      artifact.path === 'artifacts/implementation-plan.md')?.digest
    const approvals = Object.entries(input.run.learnerApprovals).map(([key, approval]) => ({
      key,
      decision: approval.decision,
      recordedAt: approval.recordedAt,
      artifactDigests: structuredClone(approval.artifactDigests)
    }))
    const scopeDecision = input.run.learnerDecisions['scope-decision']?.trim() || null
    const alignmentValue = input.run.learnerDecisions['alignment-confirmed']
    const alignment = prdDigest && planDigest
      && alignmentValue === prdDigest + ':' + planDigest
      ? { prdDigest, planDigest }
      : null
    const prdPrompt = accepted?.planningActivity?.prdPrompt
      && input.run.learnerDecisions['prd-prompt-digest']
        === accepted.planningActivity.prdPrompt.digest
      ? structuredClone(accepted.planningActivity.prdPrompt)
      : null
    const unexpectedChangedPaths = [...(accepted?.unexpectedChangedPaths ?? [])].slice(0, 100)
    const freshness = accepted?.freshness ?? 'unverifiable'
    const evidence: PracticeEvidenceReference[] = artifacts.map((artifact) => ({
      id: artifact.path === 'artifacts/PRD.md'
        ? 'planning-artifact:prd'
        : 'planning-artifact:plan',
      kind: 'planning-artifact',
      text: [
        artifact.path,
        'sha256=' + artifact.digest,
        'bytes=' + String(artifact.byteLength),
        'modifiedAt=' + artifact.modifiedAt
      ].join(' | '),
      freshness: freshness === 'fresh' ? 'fresh' : 'stale'
    }))
    const approvalMatches = (key: string, expected: Record<string, string>) => {
      const approval = input.run.learnerApprovals[key]
      return approval?.decision === 'approved'
        && Object.entries(expected).every(([path, value]) =>
          approval.artifactDigests[path as keyof typeof approval.artifactDigests] === value)
    }
    if (prdDigest && input.run.learnerApprovals['prd-approval']) {
      evidence.push({
        id: 'learner-approval:prd',
        kind: 'learner-approval',
        text: 'Người học phê duyệt PRD sha256=' + prdDigest,
        freshness: approvalMatches('prd-approval', {
          'artifacts/PRD.md': prdDigest
        }) ? 'fresh' : 'stale'
      })
    }
    if (prdDigest && planDigest && input.run.learnerApprovals['plan-approval']) {
      evidence.push({
        id: 'learner-approval:plan',
        kind: 'learner-approval',
        text: 'Người học phê duyệt implementation plan sha256=' + planDigest,
        freshness: approvalMatches('plan-approval', {
          'artifacts/PRD.md': prdDigest,
          'artifacts/implementation-plan.md': planDigest
        }) ? 'fresh' : 'stale'
      })
    }
    if (prdPrompt) {
      evidence.push({
        id: 'learner-decision:prd-prompt',
        kind: 'learner-decision',
        text: bounded('Prompt do người học viết: ' + prdPrompt.text),
        freshness: 'fresh'
      })
    }
    if (scopeDecision) {
      evidence.push({
        id: 'scope-decision:1',
        kind: 'scope-decision',
        text: bounded(scopeDecision),
        freshness: 'fresh'
      })
    }
    if (alignment) {
      evidence.push({
        id: 'artifact-alignment:1',
        kind: 'artifact-alignment',
        text: 'Người học đã xác nhận bốn điểm alignment cho đúng hai digest hiện tại.',
        freshness: 'fresh'
      })
    }
    unexpectedChangedPaths.slice(0, MAX_PER_KIND).forEach((path, index) => {
      evidence.push({
        id: 'unexpected-workspace-change:' + String(index + 1),
        kind: 'unexpected-workspace-change',
        text: path.slice(0, 500),
        freshness: 'fresh'
      })
    })
    const stablePlanning = {
      runId: input.run.runId,
      threadId: input.run.binding.threadId,
      artifacts,
      approvals,
      prdPrompt,
      scopeDecision,
      alignment,
      unexpectedChangedPaths,
      freshness
    }
    return {
      schemaVersion: 1,
      definition: structuredClone(input.definition),
      run: {
        runId: input.run.runId,
        generation: input.run.generation,
        threadId: input.run.binding.threadId,
        startedAt: input.run.startedAt
      },
      evidence,
      planning: {
        evidenceDigest: digest(stablePlanning),
        observedAt: accepted?.observedAt ?? input.generatedAt,
        freshness,
        artifacts,
        approvals,
        prdPrompt,
        scopeDecision,
        alignment,
        unexpectedChangedPaths
      },
      generatedAt: input.generatedAt
    }
  }
  if (input.definition.evidenceProfile === 'portfolio-build') {
    const state = input.run.evidence
    const accepted = state?.evidenceProfile === 'portfolio-build'
      && state.practiceId === input.definition.practiceId
      && state.practiceVersion === input.definition.version
      && state.runId === input.run.runId
      ? state
      : null
    return {
      schemaVersion: 1,
      definition: structuredClone(input.definition),
      run: {
        runId: input.run.runId,
        generation: input.run.generation,
        threadId: input.run.binding.threadId,
        startedAt: input.run.startedAt
      },
      evidence: structuredClone(accepted?.evidence ?? []),
      ...(accepted?.portfolioBuild
        ? { portfolioBuild: structuredClone(accepted.portfolioBuild) }
        : {}),
      generatedAt: input.generatedAt
    }
  }
  const evidence: PracticeEvidenceReference[] = []
  const activityMatches = input.activity?.runId === input.run.runId
    && input.activity.threadId === input.run.binding.threadId
  const freshness = input.activity?.status === 'stale' || input.activity?.status === 'disconnected'
    ? 'stale'
    : 'fresh'
  if (activityMatches && input.activity) {
    append(
      evidence,
      'bound-thread-activity',
      [
        [
          'Bound Executor activity',
          'thread=' + input.activity.threadId,
          'status=' + input.activity.status,
          'learnerPrompts=' + input.activity.learnerPrompts.length,
          'executorResponses=' + input.activity.executorResponses.length,
          'observedAt=' + input.activity.observedAt
        ].join(' | ')
      ],
      freshness
    )
    append(
      evidence,
      'workspace-confirmed-change',
      [
        ...input.activity.workspaceConfirmedChangedFiles,
        ...input.activity.workspaceCommittedReportedFilesSinceRunStart
      ],
      freshness
    )
    append(
      evidence,
      'executor-reported-verification',
      input.activity.reportedVerificationEvidence,
      freshness
    )
  }
  append(
    evidence,
    'learner-decision',
    Object.entries(input.decisions ?? {}).map(([key, value]) => key + ': ' + value),
    'fresh'
  )
  append(
    evidence,
    'teacher-assessment',
    ['Teacher review action is active.'],
    'fresh'
  )
  return {
    schemaVersion: 1,
    definition: structuredClone(input.definition),
    run: {
      runId: input.run.runId,
      generation: input.run.generation,
      threadId: input.run.binding.threadId,
      startedAt: input.run.startedAt
    },
    evidence,
    generatedAt: input.generatedAt
  }
}

export function buildPracticeReviewPrompt(envelope: PracticeReviewEnvelope): string {
  return [
    'PRACTICE_REVIEW_ENVELOPE',
    JSON.stringify(envelope),
    'Return strict JSON only with this shape:',
    JSON.stringify({
      schemaVersion: 1,
      practiceId: envelope.definition.practiceId,
      practiceVersion: envelope.definition.version,
      runId: envelope.run.runId,
      verdict: 'needs-work | passed',
      criteria: envelope.definition.criteria.map((criterion) => ({
        criterionId: criterion.id,
        status: 'satisfied | unsatisfied | unverifiable',
        evidenceRefs: ['evidence-id'],
        explanation: 'concise Vietnamese explanation'
      })),
      summary: 'concise Vietnamese summary'
    }),
    'Evaluate only the supplied definition and evidence.',
    'Use only evidence refs whose kind the criterion accepts.',
    'If fresh evidence is required, stale evidence is unverifiable.',
    'Do not invent evidence or omit required criteria.',
    ...(envelope.planning
      ? [
          'For planning-package review, inspect both supplied artifact contents semantically.',
          'Reject implementation code, scope leakage, hidden critical assumptions, missing current approvals, missing learner scope ownership, or any unexpected changed path.',
          'Check all four PRD-to-plan alignment rules explicitly.'
        ]
      : []),
    ...(envelope.portfolioBuild
      ? [
          'For portfolio-build review, require fresh artifacts, no issues, no unexpected paths, and every internal stage to be ready.',
          'Use the supplied portfolioBuild state as the authoritative filesystem review.'
        ]
      : []),
    'Executor-reported verification is not independently rerun.',
    'The verdict is passed only when every required criterion is satisfied.'
  ].join('\n')
}
