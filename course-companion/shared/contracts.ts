export type RuntimeInfo = {
  appVersion: string
  platform: string
  packaged: boolean
}

export type CompanionMode = 'compact' | 'expanded'

export type AppSettings = {
  companionMode: CompanionMode
  companionAlwaysOnTop: boolean
}

export type AppSettingsUpdate = Pick<AppSettings, 'companionAlwaysOnTop'>

export const COURSE_VERSION = '0.1.0'
export const LEARNER_STATE_SCHEMA_VERSION = 4

export const checkpointIds = [
  'intro-visual-onboarding',
  'intro-first-safe-win',
  'intro-time-budget',
  'intro-graduation',
  'intro-problem',
  'intro-platform',
  'intro-quest-card',
  'intro-readiness',
  'intro-complete',
  'm1-orient',
  'm1-baseline',
  'm1-inspect',
  'm1-guidance',
  'm1-brief',
  'm1-plan-approval',
  'm1-build',
  'm1-review',
  'm1-mastery',
  'm1-complete'
] as const

export const sceneIds = [
  'intro-visual-onboarding',
  'intro-first-safe-win',
  'intro-time-budget',
  'intro-graduation',
  'intro-problem',
  'intro-platform',
  'intro-quest-card',
  'intro-readiness',
  'intro-complete',
  'module-1-opening',
  'module-1-bad-consequence',
  'module-1-concept',
  'module-1-brief-choice',
  'module-1-weak-brief',
  'module-1-success',
  'module-1-reflection',
  'module-1-debrief',
  'module-1-complete'
] as const

export type LessonId = 'intro' | 'module-1'
export type CheckpointId = (typeof checkpointIds)[number]
export type SceneId = (typeof sceneIds)[number]

export const practiceScenarios = [
  'started',
  'approval_required',
  'success',
  'stale',
  'offline',
  'error'
] as const

export type PracticeScenario = (typeof practiceScenarios)[number]
export type PracticeStatus =
  | 'idle'
  | 'active'
  | 'approval_required'
  | 'completed'
  | 'stale'
  | 'offline'
  | 'error'

export type PracticeEvidence = {
  viewport: string
  changedScope: string
  horizontalOverflow: string
  observedAt: string
  freshness: 'current' | 'stale'
}

export type PracticeEvent = {
  id: string
  missionId: 'm1-verifiable-brief'
  scenario: PracticeScenario
  status: Exclude<PracticeStatus, 'idle'>
  source: 'fixture'
  correlationId: string
  timestamp: string
  summary: string
  evidence?: PracticeEvidence
}

export type PracticeState = {
  missionId: 'm1-verifiable-brief'
  status: PracticeStatus
  latestEvent?: PracticeEvent
}

export type PracticeFixtureRequest = {
  scenario: PracticeScenario
}

export type LearnerProgress = {
  schemaVersion: typeof LEARNER_STATE_SCHEMA_VERSION
  courseVersion: typeof COURSE_VERSION
  courseRunId: string
  currentLessonId: LessonId
  checkpointId: CheckpointId
  sceneId: SceneId
  completedCheckpointIds: CheckpointId[]
  decisions: Record<string, string>
  practice: PracticeState
  practiceCompletions: PracticeCompletionReceipt[]
  startedAt: string
  updatedAt: string
}

export type ProgressUpdate = Pick<
  LearnerProgress,
  | 'currentLessonId'
  | 'checkpointId'
  | 'sceneId'
  | 'completedCheckpointIds'
  | 'decisions'
>

export type ProgressLoadResult =
  | { status: 'new' }
  | { status: 'returning'; progress: LearnerProgress }
  | { status: 'recovered'; progress: LearnerProgress }
  | { status: 'reset-required'; reason: string }

export type TeacherContext = {
  lessonId: LessonId
  checkpointId: CheckpointId
  sceneId: SceneId
}

export type TeacherConnectionState = 'simulated' | 'connecting' | 'ready' | 'live' | 'stale' | 'offline'
export type TeacherContextFreshness = 'unavailable' | 'fresh' | 'stale' | 'disconnected'
export type TeacherMemoryStatus = 'ready' | 'pending'
export type TeacherDeliveryStatus = 'pending' | 'delivered' | 'failed'

export type TeacherRuntimeView = {
  connection: TeacherConnectionState
  memory: TeacherMemoryStatus
  observedAt?: string
  contextFreshness?: TeacherContextFreshness
  error?: string
}

export type TeacherMessage = {
  schemaVersion?: 1
  id: string
  role: 'learner' | 'teacher'
  source: 'learner' | 'fixture' | 'live'
  content: string
  timestamp: string
  checkpointId?: CheckpointId
  practiceRunId?: string
  deliveryStatus?: TeacherDeliveryStatus
}

export type TeacherConversation = {
  messages: TeacherMessage[]
  recovered: boolean
}

export type TeacherSendRequest = {
  content: string
  context?: TeacherContext
}

export type TeacherSendResult = {
  learnerMessage: TeacherMessage
  teacherMessage: TeacherMessage
}

export type CompanionState = {
  mode: CompanionMode
  conversation: TeacherConversation
  teacher: TeacherRuntimeView
}

export type ExecutorActivityStatus =
  | 'ready'
  | 'working'
  | 'waiting-for-learner'
  | 'response-ready'
  | 'stale'
  | 'disconnected'

export type WorkspaceEvidenceBaseline = {
  schemaVersion: 1
  capturedAt: string
  gitAvailable: boolean
  head: string | null
  entries: Record<string, string>
}

export type WorkspaceEvidenceReconciliation = {
  changedSinceBaseline: string[]
  committedReportedFilesSinceRunStart: string[]
  currentlyDirtyReportedFiles: string[]
}

export type ExecutorActivitySnapshot = {
  schemaVersion: 1
  runId: string
  threadId: string
  status: ExecutorActivityStatus
  cursor: string
  learnerPrompts: string[]
  executorResponses: string[]
  approvalEvents: string[]
  changedFiles: string[]
  verificationEvidence: string[]
  reportedChangedFiles: string[]
  reportedVerificationEvidence: string[]
  workspaceConfirmedChangedFiles: string[]
  workspaceCommittedReportedFilesSinceRunStart: string[]
  workspaceCurrentlyDirtyReportedFiles: string[]
  observedAt: string
  workspaceBaseline: WorkspaceEvidenceBaseline | null
}

export type PracticeLearningSignal = {
  text: string
  basis: 'observed' | 'inferred'
  sourceRunId: string
}

export type PracticeRunSummary = {
  schemaVersion: 1
  practiceId: string
  runId: string
  attempt: number
  outcome: 'completed' | 'replaced' | 'abandoned' | 'error'
  objective: string
  approach: string
  learnerDecisions: string[]
  approvals: string[]
  changedFiles: string[]
  verificationEvidence: string[]
  learningSignals: PracticeLearningSignal[]
  unresolvedIssues: string[]
  nextAttemptGuidance: string[]
  startedAt: string
  endedAt: string
  summarizedAt: string
  sourceDigest: string
  model: string
  freshness: 'current' | 'stale'
  quality: 'live' | 'pending-refinement'
}

export type TeacherMemoryDocument = {
  schemaVersion: 1
  learnerDecisions: string[]
  learningSignals: PracticeLearningSignal[]
  unresolvedNeeds: PracticeLearningSignal[]
  practiceSummaries: Record<string, PracticeRunSummary[]>
  updatedAt: string
}

export type PracticePanel = 'teacher' | 'progress'
export type PracticeStepStatus = 'completed' | 'current' | 'upcoming'
export type PracticeReviewStatus = 'not-reviewed' | 'reviewing' | 'needs-work' | 'passed'

export type PracticeEvidenceKind =
  | 'bound-thread-activity'
  | 'workspace-confirmed-change'
  | 'executor-reported-verification'
  | 'learner-decision'
  | 'artifact'
  | 'teacher-assessment'

export type PracticeChecklistDefinition = {
  id: string
  title: string
}

export type PracticeCriterionDefinition = {
  id: string
  description: string
  required: boolean
  checklistStepId: string
  acceptedEvidence: PracticeEvidenceKind[]
  assertion: string
  freshness: 'fresh' | 'any'
}

export type PracticeDefinition = {
  schemaVersion: 1
  practiceId: string
  version: string
  checkpointId: CheckpointId
  objective: string
  expectedOutcome: string
  checklist: PracticeChecklistDefinition[]
  criteria: PracticeCriterionDefinition[]
  completionDestination: {
    lessonId: LessonId
    checkpointId: CheckpointId
    sceneId: SceneId
  }
}

export type PracticeEvidenceReference = {
  id: string
  kind: PracticeEvidenceKind
  text: string
  freshness: 'fresh' | 'stale'
}

export type PracticeCriterionReview = {
  criterionId: string
  status: 'satisfied' | 'unsatisfied' | 'unverifiable'
  evidenceRefs: string[]
  explanation: string
}

export type PracticeReviewResult = {
  schemaVersion: 1
  practiceId: string
  practiceVersion: string
  runId: string
  verdict: 'needs-work' | 'passed'
  criteria: PracticeCriterionReview[]
  summary: string
  reviewedAt: string
  sourceDigest: string
}

export type PracticeCompletionReceipt = {
  schemaVersion: 1
  courseRunId: string
  practiceId: string
  practiceVersion: string
  runId: string
  checkpointId: CheckpointId
  status: 'completed'
  completedAt: string
  evidenceSummary: string
  masterySummary: string
  destination: PracticeDefinition['completionDestination']
}

export type PracticeChecklistStep = {
  id: string
  title: string
  status: PracticeStepStatus
}

export type PracticeWorkspaceView = {
  schemaVersion: 1
  phase: 'brief' | 'switching' | 'active' | 'error'
  objective: string
  expectedOutcome: string
  checklist: PracticeChecklistStep[]
  review?: {
    status: PracticeReviewStatus
    canReview: boolean
    canReturn: boolean
    result?: PracticeReviewResult
  }
  completion?: PracticeCompletionReceipt

  activePractice?: {
    runId: string
    executorChatName: string
    startedAt: string
  }
  transition?: {
    stage: 'creating-target' | 'target-created'
    label: string
    canCancel: boolean
    canRetry: boolean
  }
  presentation: {
    fullPanel: PracticePanel
    compactPanel: PracticePanel
  }
  capabilities: {
    canStartNew: boolean
    canResume: boolean
    selectiveTransferAvailable: false
    selectiveTransferReason: string
  }
  error?: string
}

export type PracticeStartRequest = {
  transfer: boolean
}

export type PracticePanelUpdate = {
  surface: 'full' | 'compact'
  panel: PracticePanel
}

export type PracticeWorkspaceAdapter = {
  loadWorkspace: () => Promise<PracticeWorkspaceView>
  startNew: (request: PracticeStartRequest) => Promise<PracticeWorkspaceView>
  resume: () => Promise<PracticeWorkspaceView>
  retry: () => Promise<PracticeWorkspaceView>
  cancel: () => Promise<PracticeWorkspaceView>
  selectPanel: (update: PracticePanelUpdate) => Promise<PracticeWorkspaceView>
  reset: () => Promise<void>
}

export type TeacherAdapter = {
  loadConversation: () => Promise<TeacherConversation>
  sendMessage: (request: TeacherSendRequest) => Promise<TeacherSendResult>
  reset: () => Promise<void>
}

export type PracticeAdapter = {
  loadState: () => Promise<PracticeState>
  emitFixture: (request: PracticeFixtureRequest) => Promise<PracticeState>
}

export type PracticeReviewResponse = {
  workspace: PracticeWorkspaceView
  teacherMessage: TeacherMessage
}

export type CourseCompanionApi = {
  getRuntimeInfo: () => Promise<RuntimeInfo>
  loadProgress: () => Promise<ProgressLoadResult>
  saveProgress: (update: ProgressUpdate) => Promise<LearnerProgress>
  resetProgress: () => Promise<void>
  loadCompanionState: () => Promise<CompanionState>
  sendTeacherMessage: (request: TeacherSendRequest) => Promise<TeacherSendResult>
  loadPracticeState: () => Promise<PracticeState>
  emitPracticeFixture: (request: PracticeFixtureRequest) => Promise<PracticeState>
  onFullTeacherRequested: (callback: () => void) => () => void
  onCompanionModeChanged: (callback: (mode: CompanionMode) => void) => () => void
  loadPracticeWorkspace: () => Promise<PracticeWorkspaceView>
  startPractice: (request: PracticeStartRequest) => Promise<PracticeWorkspaceView>
  resumePractice: () => Promise<PracticeWorkspaceView>
  retryPracticeSwitch: () => Promise<PracticeWorkspaceView>
  cancelPracticeSwitch: () => Promise<PracticeWorkspaceView>
  selectPracticePanel: (update: PracticePanelUpdate) => Promise<PracticeWorkspaceView>
  reviewPractice: () => Promise<PracticeReviewResponse>
  returnPassedPractice: () => Promise<PracticeCompletionReceipt>
  onPracticeReturned: (
    callback: (receipt: PracticeCompletionReceipt) => void
  ) => () => void
  loadAppSettings: () => Promise<AppSettings>
  saveAppSettings: (update: AppSettingsUpdate) => Promise<AppSettings>
  showFullTeacher: () => Promise<void>
  minimizeFullTeacher: () => Promise<void>
  setCompanionMode: (mode: CompanionMode) => Promise<void>
  quitApp: () => Promise<void>
}
