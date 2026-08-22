import { createHash } from 'node:crypto'
import type {
  ExecutorActivitySnapshot,
  LearnerProgress,
  PracticeDefinition,
  PracticeRunSummary,
  TeacherConversation,
  TeacherMemoryDocument
} from '../../shared/contracts'
import type { PracticeRunRecord } from './practice-run-repository'
import { practiceSummaryKey } from './teacher-memory-repository'
import type { TeacherCoursePackage } from './teacher-course-context-repository'

const MAX_DYNAMIC_CONTEXT_CHARACTERS = 24_000
const MAX_TEACHER_TURN_CHARACTERS = 200_000
function boundedText(value: string, maximum: number): string {
  const points = [...value]
  return points.length <= maximum ? value : `${points.slice(0, maximum - 1).join('')}?`
}

function compactStrings(values: string[], count: number, characters: number): string[] {
  return values.slice(-count).map((value) => boundedText(value, characters))
}


export type TeacherContextEnvelope = {
  schemaVersion: 1
  generatedAt: string
  course: {
    lessonId: string
    courseLessonId: string
    sceneId: string
    checkpointId: string
    completedCheckpointIds: string[]
    decisions: Record<string, string>
    practiceState: LearnerProgress['practice']
    package: Omit<TeacherCoursePackage, 'pedagogyInstructions'>
  }
  practice: {
    practiceId: string | null
    practiceVersion: string | null
    objective: string
    expectedOutcome: string
    activeRun: PracticeRunRecord | null
    activity: ExecutorActivitySnapshot | null
    previousRuns: PracticeRunSummary[]
  }
  learnerMemory: {
    decisions: string[]
    learningSignals: TeacherMemoryDocument['learningSignals']
    unresolvedNeeds: TeacherMemoryDocument['unresolvedNeeds']
  }
  freshness: 'fresh' | 'stale' | 'disconnected'
  privacy: { scope: 'bound-thread-only'; redactionsApplied: true }
  compaction: { applied: boolean; omittedPreviousRuns: number; omittedChatMessages: number }
}

type EnvelopeInput = {
  progress: LearnerProgress
  definition: PracticeDefinition | null
  activeRun: PracticeRunRecord | null
  activity: ExecutorActivitySnapshot | null
  memory: TeacherMemoryDocument
  conversation: TeacherConversation
  coursePackage: TeacherCoursePackage
  excludeMessageId?: string
  now?: () => Date
}

export function buildTeacherEnvelope(input: EnvelopeInput): { envelope: TeacherContextEnvelope; recentChat: TeacherConversation['messages'] } {
  const now = input.now ?? (() => new Date())
  const practiceId = input.activeRun?.practiceId ?? input.definition?.practiceId ?? null
  const practiceVersion = input.activeRun?.practiceVersion ?? input.definition?.version ?? null
  const summaryKey = practiceId && practiceVersion
    ? practiceSummaryKey(practiceId, practiceVersion)
    : null
  const allPrevious = (summaryKey ? input.memory.practiceSummaries[summaryKey] ?? [] : [])
    .filter((summary) => summary.runId !== input.activeRun?.runId)
  let previousRuns = allPrevious
    .slice(-2)
    .map((summary) => ({
      ...summary,
      objective: boundedText(summary.objective, 400),
      approach: boundedText(summary.approach, 500),
      learnerDecisions: compactStrings(summary.learnerDecisions, 2, 200),
      approvals: compactStrings(summary.approvals, 2, 200),
      changedFiles: compactStrings(summary.changedFiles, 8, 200),
      verificationEvidence: compactStrings(summary.verificationEvidence, 2, 300),
      learningSignals: summary.learningSignals.slice(-2).map((signal) => ({
        ...signal,
        text: boundedText(signal.text, 300)
      })),
      unresolvedIssues: compactStrings(summary.unresolvedIssues, 2, 300),
      nextAttemptGuidance: compactStrings(summary.nextAttemptGuidance, 2, 300)
    }))
  let recentChat = input.conversation.messages
    .filter((message) => input.activeRun ? message.practiceRunId === input.activeRun.runId : !message.practiceRunId)
    .filter((message) => message.id !== input.excludeMessageId)
    .slice(-40)
    .map((message) => ({ ...message, content: boundedText(message.content, 600) }))
  const activity = input.activity
    ? {
        ...input.activity,
        learnerPrompts: compactStrings(input.activity.learnerPrompts, 4, 400),
        executorResponses: compactStrings(input.activity.executorResponses, 4, 600),
        approvalEvents: compactStrings(input.activity.approvalEvents, 6, 200),
        changedFiles: compactStrings(input.activity.changedFiles, 12, 200),
        verificationEvidence: compactStrings(input.activity.verificationEvidence, 6, 400),
        reportedChangedFiles: compactStrings(input.activity.reportedChangedFiles, 12, 200),
        reportedVerificationEvidence: compactStrings(input.activity.reportedVerificationEvidence, 6, 400),
        workspaceConfirmedChangedFiles: compactStrings(input.activity.workspaceConfirmedChangedFiles, 12, 200),
        workspaceCommittedReportedFilesSinceRunStart: compactStrings(input.activity.workspaceCommittedReportedFilesSinceRunStart, 12, 200),
        workspaceCurrentlyDirtyReportedFiles: compactStrings(input.activity.workspaceCurrentlyDirtyReportedFiles, 12, 200),
        workspaceBaseline: null
      }
    : null
  const learnerDecisions = compactStrings(input.memory.learnerDecisions, 8, 200)
  const learningSignals = input.memory.learningSignals.slice(-4).map((signal) => ({ ...signal, text: boundedText(signal.text, 300) }))
  const unresolvedNeeds = input.memory.unresolvedNeeds.slice(-4).map((signal) => ({
    ...signal,
    text: boundedText(signal.text, 300)
  }))
  const normalizedCompaction = previousRuns.length !== allPrevious.length
    || recentChat.length !== input.conversation.messages.length
    || JSON.stringify(activity) !== JSON.stringify(input.activity)
    || JSON.stringify({ learnerDecisions, learningSignals, unresolvedNeeds })
      !== JSON.stringify({ learnerDecisions: input.memory.learnerDecisions, learningSignals: input.memory.learningSignals, unresolvedNeeds: input.memory.unresolvedNeeds })
  const freshness = !input.activeRun
    ? 'fresh'
    : input.activity?.status === 'disconnected'
    ? 'disconnected'
    : input.activity?.status === 'stale' || !input.activity
      ? 'stale'
      : 'fresh'

  const create = (): TeacherContextEnvelope => ({
    schemaVersion: 1,
    generatedAt: now().toISOString(),
    course: {
      lessonId: input.progress.currentLessonId,
      courseLessonId: input.progress.currentCourseLessonId,
      sceneId: input.progress.sceneId,
      checkpointId: input.progress.checkpointId,
      completedCheckpointIds: structuredClone(input.progress.completedCheckpointIds),
      decisions: structuredClone(input.progress.decisions),
      practiceState: structuredClone(input.progress.practice),
      package: {
        schemaVersion: input.coursePackage.schemaVersion,
        moduleId: input.coursePackage.moduleId,
        sources: structuredClone(input.coursePackage.sources),
        characterCount: input.coursePackage.characterCount,
        digest: input.coursePackage.digest,
        activeAssessment: structuredClone(input.coursePackage.activeAssessment)
      }
    },
    practice: {
      practiceId,
      practiceVersion,
      objective: input.definition?.objective ?? '',
      expectedOutcome: input.definition?.expectedOutcome ?? '',
      activeRun: input.activeRun ? structuredClone(input.activeRun) : null,
      activity: activity ? structuredClone(activity) : null,
      previousRuns: structuredClone(previousRuns)
    },
    learnerMemory: {
      decisions: structuredClone(learnerDecisions),
      learningSignals: structuredClone(learningSignals),
      unresolvedNeeds: structuredClone(unresolvedNeeds)
    },
    freshness,
    privacy: { scope: 'bound-thread-only', redactionsApplied: true },
    compaction: {
      applied: normalizedCompaction || previousRuns.length < allPrevious.length || recentChat.length < input.conversation.messages.length,
      omittedPreviousRuns: allPrevious.length - previousRuns.length,
      omittedChatMessages: input.conversation.messages.length - recentChat.length
    }
  })

  let envelope = create()
  const dynamicSize = () => JSON.stringify({
    envelope: {
      ...envelope,
      course: { ...envelope.course, package: undefined }
    },
    recentChat
  }).length
  while (dynamicSize() > MAX_DYNAMIC_CONTEXT_CHARACTERS && recentChat.length > 2) {
    recentChat = recentChat.slice(2)
    envelope = create()
  }
  while (dynamicSize() > MAX_DYNAMIC_CONTEXT_CHARACTERS && previousRuns.length > 0) {
    previousRuns = previousRuns.slice(1)
    envelope = create()
  }
  if (dynamicSize() > MAX_DYNAMIC_CONTEXT_CHARACTERS) {
    throw new Error('Teacher dynamic context exceeds its hard size cap')
  }
  if (JSON.stringify({ envelope, recentChat }).length > MAX_TEACHER_TURN_CHARACTERS) {
    throw new Error('Teacher context envelope exceeds its hard size cap')
  }
  return { envelope, recentChat }
}

export function buildTeacherTurnInput(
  context: ReturnType<typeof buildTeacherEnvelope>,
  learnerMessage: string
): string {
  return [
    'TEACHER_CONTEXT_ENVELOPE',
    JSON.stringify(context.envelope),
    'RECENT_TEACHER_CHAT',
    JSON.stringify(context.recentChat.map(({ role, content, timestamp, source }) => ({ role, content, timestamp, source }))),
    'CURRENT_LEARNER_MESSAGE',
    learnerMessage,
    'Answer only from this context. Disclose stale or disconnected Executor context. Distinguish observed structured evidence, Executor-reported results, files proven changed since the Practice baseline, reported files committed after the Practice began, and legacy files that are merely currently dirty and match the report. Legacy current dirt does not prove this Practice caused the change. Executor-reported verification was not independently rerun by Course Companion. Do not claim to have used tools.'
  ].join('\n')
}

export function sourceDigest(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}
