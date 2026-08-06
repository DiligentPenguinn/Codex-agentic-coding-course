export type RuntimeInfo = {
  appVersion: string
  platform: string
  packaged: boolean
}

export type CompanionMode = 'compact' | 'expanded'

export const COURSE_VERSION = '0.1.0'
export const LEARNER_STATE_SCHEMA_VERSION = 1

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
  'module-1-success'
] as const

export type LessonId = 'intro' | 'module-1'
export type CheckpointId = (typeof checkpointIds)[number]
export type SceneId = (typeof sceneIds)[number]

export type LearnerProgress = {
  schemaVersion: typeof LEARNER_STATE_SCHEMA_VERSION
  courseVersion: typeof COURSE_VERSION
  currentLessonId: LessonId
  checkpointId: CheckpointId
  sceneId: SceneId
  completedCheckpointIds: CheckpointId[]
  decisions: Record<string, string>
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

export type CourseCompanionApi = {
  getRuntimeInfo: () => Promise<RuntimeInfo>
  loadProgress: () => Promise<ProgressLoadResult>
  saveProgress: (update: ProgressUpdate) => Promise<LearnerProgress>
  resetProgress: () => Promise<void>
  loadCompanionState: () => Promise<CompanionState>
  sendTeacherMessage: (request: TeacherSendRequest) => Promise<TeacherSendResult>
  showLearningWindow: () => Promise<void>
  hideLearningWindow: () => Promise<void>
  setCompanionMode: (mode: CompanionMode) => Promise<void>
  quitApp: () => Promise<void>
}
