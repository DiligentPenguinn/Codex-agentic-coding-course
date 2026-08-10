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
  'm1-why-planning',
  'm1-contentpilot-brief',
  'm1-prd-concept',
  'm1-prd-interview',
  'm1-prd-approved',
  'm1-implementation-plan',
  'm1-alignment-review',
  'm1-planning-package',
  'm1-mastery',
  'm1-complete'
] as const

export const sceneIds = [
  'intro-visual-onboarding',
  'intro-course-overview-2',
  'intro-learning-method',
  'module-1-why-planning',
  'module-1-planning-example',
  'module-1-why-planning-check',
  'module-1-planning-cost',
  'module-1-contentpilot-brief',
  'module-1-implementation-too-soon',
  'module-1-prd-concept',
  'module-1-prd-example',
  'module-1-prd-visual-examples',
  'module-1-prd-code-examples',
  'module-1-check-planning-prd-1',
  'module-1-check-planning-prd-2',
  'module-1-check-planning-prd-3',
  'module-1-prd-check',
  'module-1-prd-misclassification',
  'module-1-prd-interview',
  'module-1-prompt-example',
  'module-1-prompt-guided-practice',
  'module-1-check-prompt-1',
  'module-1-check-prompt-2',
  'module-1-check-prompt-3',
  'module-1-prd-approved',
  'module-1-implementation-plan',
  'module-1-implementation-plan-example',
  'module-1-check-plan-1',
  'module-1-check-plan-2',
  'module-1-alignment-review',
  'module-1-alignment-mismatch',
  'module-1-planning-package',
  'module-1-mastery',
  'module-1-mastery-repair',
  'module-1-final-1',
  'module-1-final-2',
  'module-1-final-3',
  'module-1-final-4',
  'module-1-final-5',
  'module-1-final-6',
  'module-1-final-7',
  'module-1-final-8',
  'module-1-final-9',
  'module-1-final-10',
  'module-1-final-11',
  'module-1-final-12',
  'module-1-final-13',
  'module-1-final-14',
  'module-1-final-15',
  'module-1-final-summary',
  'module-1-complete'
] as const

export type LessonId = 'intro' | 'module-1'
export type CheckpointId = (typeof checkpointIds)[number]
export type SceneId = (typeof sceneIds)[number]

export const courseLessonIds = [
  'intro-overview',
  'm1-when-to-plan',
  'm1-product-requirements',
  'm1-prd-prompt',
  'm1-prd-review',
  'm1-implementation-plan',
  'm1-assessment'
] as const

export type CourseLessonId = (typeof courseLessonIds)[number]

export const sceneCheckpoint: Record<SceneId, CheckpointId> = {
  'intro-visual-onboarding': 'intro-visual-onboarding',
  'intro-course-overview-2': 'intro-visual-onboarding',
  'intro-learning-method': 'intro-visual-onboarding',
  'module-1-why-planning': 'm1-why-planning',
  'module-1-planning-example': 'm1-why-planning',
  'module-1-why-planning-check': 'm1-why-planning',
  'module-1-planning-cost': 'm1-why-planning',
  'module-1-contentpilot-brief': 'm1-contentpilot-brief',
  'module-1-implementation-too-soon': 'm1-contentpilot-brief',
  'module-1-prd-concept': 'm1-prd-concept',
  'module-1-prd-example': 'm1-prd-concept',
  'module-1-prd-visual-examples': 'm1-prd-concept',
  'module-1-prd-code-examples': 'm1-prd-concept',
  'module-1-check-planning-prd-1': 'm1-prd-concept',
  'module-1-check-planning-prd-2': 'm1-prd-concept',
  'module-1-check-planning-prd-3': 'm1-prd-concept',
  'module-1-prd-check': 'm1-prd-concept',
  'module-1-prd-misclassification': 'm1-prd-concept',
  'module-1-prd-interview': 'm1-prd-interview',
  'module-1-prompt-example': 'm1-prd-interview',
  'module-1-prompt-guided-practice': 'm1-prd-interview',
  'module-1-check-prompt-1': 'm1-prd-interview',
  'module-1-check-prompt-2': 'm1-prd-interview',
  'module-1-check-prompt-3': 'm1-prd-interview',
  'module-1-prd-approved': 'm1-prd-approved',
  'module-1-implementation-plan': 'm1-implementation-plan',
  'module-1-implementation-plan-example': 'm1-implementation-plan',
  'module-1-check-plan-1': 'm1-implementation-plan',
  'module-1-check-plan-2': 'm1-alignment-review',
  'module-1-alignment-review': 'm1-alignment-review',
  'module-1-alignment-mismatch': 'm1-alignment-review',
  'module-1-planning-package': 'm1-planning-package',
  'module-1-mastery': 'm1-mastery',
  'module-1-mastery-repair': 'm1-mastery',
  'module-1-final-1': 'm1-mastery',
  'module-1-final-2': 'm1-mastery',
  'module-1-final-3': 'm1-mastery',
  'module-1-final-4': 'm1-mastery',
  'module-1-final-5': 'm1-mastery',
  'module-1-final-6': 'm1-mastery',
  'module-1-final-7': 'm1-mastery',
  'module-1-final-8': 'm1-mastery',
  'module-1-final-9': 'm1-mastery',
  'module-1-final-10': 'm1-mastery',
  'module-1-final-11': 'm1-mastery',
  'module-1-final-12': 'm1-mastery',
  'module-1-final-13': 'm1-mastery',
  'module-1-final-14': 'm1-mastery',
  'module-1-final-15': 'm1-mastery',
  'module-1-final-summary': 'm1-mastery',
  'module-1-complete': 'm1-complete'
}

export const checkpointCourseLesson: Record<CheckpointId, CourseLessonId> = {
  'intro-visual-onboarding': 'intro-overview',
  'm1-why-planning': 'm1-when-to-plan',
  'm1-contentpilot-brief': 'm1-when-to-plan',
  'm1-prd-concept': 'm1-product-requirements',
  'm1-prd-interview': 'm1-prd-prompt',
  'm1-prd-approved': 'm1-prd-review',
  'm1-implementation-plan': 'm1-implementation-plan',
  'm1-alignment-review': 'm1-implementation-plan',
  'm1-planning-package': 'm1-implementation-plan',
  'm1-mastery': 'm1-assessment',
  'm1-complete': 'm1-assessment'
}

export function courseLessonIdForScene(sceneId: SceneId): CourseLessonId {
  return checkpointCourseLesson[sceneCheckpoint[sceneId]]
}

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
  prdArtifact: string
  implementationPlanArtifact: string
  alignment: string
  observedAt: string
  freshness: 'current' | 'stale'
}

export type PracticeEvent = {
  id: string
  missionId: 'm1-planning-package'
  scenario: PracticeScenario
  status: Exclude<PracticeStatus, 'idle'>
  source: 'fixture'
  correlationId: string
  timestamp: string
  summary: string
  evidence?: PracticeEvidence
}

export type PracticeState = {
  missionId: 'm1-planning-package'
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
  currentCourseLessonId: CourseLessonId
  checkpointId: CheckpointId
  sceneId: SceneId
  sceneHistory: SceneId[]
  completedCheckpointIds: CheckpointId[]
  decisions: Record<string, string>
  practice: PracticeState
  startedAt: string
  updatedAt: string
}

export type ProgressUpdate = Pick<
  LearnerProgress,
  | 'currentLessonId'
  | 'currentCourseLessonId'
  | 'checkpointId'
  | 'sceneId'
  | 'sceneHistory'
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
  loadAppSettings: () => Promise<AppSettings>
  saveAppSettings: (update: AppSettingsUpdate) => Promise<AppSettings>
  showLearningWindow: () => Promise<void>
  hideLearningWindow: () => Promise<void>
  setCompanionMode: (mode: CompanionMode) => Promise<void>
  quitApp: () => Promise<void>
}
