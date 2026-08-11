import type {
  CodexTaskConfigurationSnapshot,
  ExecutorActivitySnapshot,
  PracticeDefinition,
  PracticeEvidenceKind,
  PracticeEvidenceReference
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
  generatedAt: string
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
    'Executor-reported verification is not independently rerun.',
    'The verdict is passed only when every required criterion is satisfied.'
  ].join('\n')
}
