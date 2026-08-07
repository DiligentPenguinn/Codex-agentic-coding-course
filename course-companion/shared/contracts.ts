export type RuntimeInfo = {
  appVersion: string
  platform: string
  packaged: boolean
}

export type CompanionMode = 'compact' | 'expanded'

export const COURSE_VERSION = '0.1.0'
export const LEARNER_STATE_SCHEMA_VERSION = 2

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
  currentLessonId: LessonId
  checkpointId: CheckpointId
  sceneId: SceneId
  completedCheckpointIds: CheckpointId[]
  decisions: Record<string, string>
  practice: PracticeState
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

export type TeacherMessage = {
  id: string
  role: 'learner' | 'teacher'
  source: 'learner' | 'fixture'
  content: string
  timestamp: string
  checkpointId?: CheckpointId
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

export type CourseCompanionApi = {
  getRuntimeInfo: () => Promise<RuntimeInfo>
  loadProgress: () => Promise<ProgressLoadResult>
  saveProgress: (update: ProgressUpdate) => Promise<LearnerProgress>
  resetProgress: () => Promise<void>
  loadCompanionState: () => Promise<CompanionState>
  sendTeacherMessage: (request: TeacherSendRequest) => Promise<TeacherSendResult>
  loadPracticeState: () => Promise<PracticeState>
  emitPracticeFixture: (request: PracticeFixtureRequest) => Promise<PracticeState>
  onLearningWindowShown: (callback: () => void) => () => void
  showLearningWindow: () => Promise<void>
  hideLearningWindow: () => Promise<void>
  setCompanionMode: (mode: CompanionMode) => Promise<void>
  quitApp: () => Promise<void>
}
