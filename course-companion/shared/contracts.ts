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

export const COURSE_VERSION = '0.2.0'
export const LEARNER_STATE_SCHEMA_VERSION = 5

export const checkpointIds = [
  'intro-visual-onboarding',
  'm1-codex-orientation',
  'm1-model-choice',
  'm1-permissions',
  'm1-agents-guidance',
  'm1-skills',
  'm1-setup-checklist',
  'm1-mastery',
  'm1-complete',
  'm2-why-planning',
  'm2-contentpilot-brief',
  'm2-prd-concept',
  'm2-prd-interview',
  'm2-prd-approved',
  'm2-implementation-plan',
  'm2-alignment-review',
  'm2-planning-package',
  'm2-mastery',
  'm2-complete'
] as const

export const sceneIds = [
  'intro-visual-onboarding',
  'intro-course-overview-2',
  'intro-learning-method',
  'module-1-codex-orientation',
  'module-1-codex-examples',
  'module-1-harness-intro',
  'module-1-harness-codex',
  'module-1-model-choice',
  'module-1-model-use-cases',
  'module-1-reasoning-effort',
  'module-1-project-setup',
  'module-1-permissions',
  'module-1-approval-choice',
  'module-1-agents-guidance',
  'module-1-skills',
  'module-1-setup-checklist',
  'module-1-mastery',
  'module-1-final-1',
  'module-1-final-2',
  'module-1-final-3',
  'module-1-final-4',
  'module-1-final-5',
  'module-1-final-summary',
  'module-1-complete',
  'module-2-why-planning',
  'module-2-planning-example',
  'module-2-why-planning-check',
  'module-2-planning-cost',
  'module-2-contentpilot-brief',
  'module-2-implementation-too-soon',
  'module-2-prd-concept',
  'module-2-prd-example',
  'module-2-prd-visual-examples',
  'module-2-prd-code-examples',
  'module-2-check-planning-prd-1',
  'module-2-check-planning-prd-2',
  'module-2-check-planning-prd-3',
  'module-2-prd-check',
  'module-2-prd-misclassification',
  'module-2-prd-interview',
  'module-2-prompt-example',
  'module-2-prompt-guided-practice',
  'module-2-check-prompt-1',
  'module-2-check-prompt-2',
  'module-2-check-prompt-3',
  'module-2-prd-approved',
  'module-2-implementation-plan',
  'module-2-implementation-plan-example',
  'module-2-check-plan-1',
  'module-2-check-plan-2',
  'module-2-alignment-review',
  'module-2-alignment-mismatch',
  'module-2-planning-package',
  'module-2-mastery',
  'module-2-mastery-repair',
  'module-2-final-1',
  'module-2-final-2',
  'module-2-final-3',
  'module-2-final-4',
  'module-2-final-5',
  'module-2-final-6',
  'module-2-final-7',
  'module-2-final-8',
  'module-2-final-9',
  'module-2-final-10',
  'module-2-final-11',
  'module-2-final-12',
  'module-2-final-13',
  'module-2-final-14',
  'module-2-final-15',
  'module-2-final-summary',
  'module-2-complete'
] as const

export type LessonId = 'intro' | 'module-1' | 'module-2'
export type CheckpointId = (typeof checkpointIds)[number]
export type SceneId = (typeof sceneIds)[number]

export const courseLessonIds = [
  'intro-overview',
  'm1-understand-codex',
  'm1-workspace-permissions',
  'm1-agents-guidance',
  'm1-skills-and-checklist',
  'm1-assessment',
  'm2-when-to-plan',
  'm2-product-requirements',
  'm2-prd-prompt',
  'm2-prd-review',
  'm2-implementation-plan',
  'm2-assessment'
] as const

export type CourseLessonId = (typeof courseLessonIds)[number]

export const sceneCheckpoint: Record<SceneId, CheckpointId> = {
  'intro-visual-onboarding': 'intro-visual-onboarding',
  'intro-course-overview-2': 'intro-visual-onboarding',
  'intro-learning-method': 'intro-visual-onboarding',
  'module-1-codex-orientation': 'm1-codex-orientation',
  'module-1-codex-examples': 'm1-codex-orientation',
  'module-1-harness-intro': 'm1-agents-guidance',
  'module-1-harness-codex': 'm1-agents-guidance',
  'module-1-model-choice': 'm1-model-choice',
  'module-1-model-use-cases': 'm1-model-choice',
  'module-1-reasoning-effort': 'm1-model-choice',
  'module-1-project-setup': 'm1-model-choice',
  'module-1-permissions': 'm1-permissions',
  'module-1-approval-choice': 'm1-permissions',
  'module-1-agents-guidance': 'm1-agents-guidance',
  'module-1-skills': 'm1-skills',
  'module-1-setup-checklist': 'm1-setup-checklist',
  'module-1-mastery': 'm1-mastery',
  'module-1-final-1': 'm1-mastery',
  'module-1-final-2': 'm1-mastery',
  'module-1-final-3': 'm1-mastery',
  'module-1-final-4': 'm1-mastery',
  'module-1-final-5': 'm1-mastery',
  'module-1-final-summary': 'm1-mastery',
  'module-1-complete': 'm1-complete',
  'module-2-why-planning': 'm2-why-planning',
  'module-2-planning-example': 'm2-why-planning',
  'module-2-why-planning-check': 'm2-why-planning',
  'module-2-planning-cost': 'm2-why-planning',
  'module-2-contentpilot-brief': 'm2-contentpilot-brief',
  'module-2-implementation-too-soon': 'm2-contentpilot-brief',
  'module-2-prd-concept': 'm2-prd-concept',
  'module-2-prd-example': 'm2-prd-concept',
  'module-2-prd-visual-examples': 'm2-prd-concept',
  'module-2-prd-code-examples': 'm2-prd-concept',
  'module-2-check-planning-prd-1': 'm2-prd-concept',
  'module-2-check-planning-prd-2': 'm2-prd-concept',
  'module-2-check-planning-prd-3': 'm2-prd-concept',
  'module-2-prd-check': 'm2-prd-concept',
  'module-2-prd-misclassification': 'm2-prd-concept',
  'module-2-prd-interview': 'm2-prd-interview',
  'module-2-prompt-example': 'm2-prd-interview',
  'module-2-prompt-guided-practice': 'm2-prd-interview',
  'module-2-check-prompt-1': 'm2-prd-interview',
  'module-2-check-prompt-2': 'm2-prd-interview',
  'module-2-check-prompt-3': 'm2-prd-interview',
  'module-2-prd-approved': 'm2-prd-approved',
  'module-2-implementation-plan': 'm2-implementation-plan',
  'module-2-implementation-plan-example': 'm2-implementation-plan',
  'module-2-check-plan-1': 'm2-implementation-plan',
  'module-2-check-plan-2': 'm2-alignment-review',
  'module-2-alignment-review': 'm2-alignment-review',
  'module-2-alignment-mismatch': 'm2-alignment-review',
  'module-2-planning-package': 'm2-planning-package',
  'module-2-mastery': 'm2-mastery',
  'module-2-mastery-repair': 'm2-mastery',
  'module-2-final-1': 'm2-mastery',
  'module-2-final-2': 'm2-mastery',
  'module-2-final-3': 'm2-mastery',
  'module-2-final-4': 'm2-mastery',
  'module-2-final-5': 'm2-mastery',
  'module-2-final-6': 'm2-mastery',
  'module-2-final-7': 'm2-mastery',
  'module-2-final-8': 'm2-mastery',
  'module-2-final-9': 'm2-mastery',
  'module-2-final-10': 'm2-mastery',
  'module-2-final-11': 'm2-mastery',
  'module-2-final-12': 'm2-mastery',
  'module-2-final-13': 'm2-mastery',
  'module-2-final-14': 'm2-mastery',
  'module-2-final-15': 'm2-mastery',
  'module-2-final-summary': 'm2-mastery',
  'module-2-complete': 'm2-complete'
}

export const checkpointCourseLesson: Record<CheckpointId, CourseLessonId> = {
  'intro-visual-onboarding': 'intro-overview',
  'm1-codex-orientation': 'm1-understand-codex',
  'm1-model-choice': 'm1-skills-and-checklist',
  'm1-permissions': 'm1-workspace-permissions',
  'm1-agents-guidance': 'm1-agents-guidance',
  'm1-skills': 'm1-agents-guidance',
  'm1-setup-checklist': 'm1-assessment',
  'm1-mastery': 'm1-assessment',
  'm1-complete': 'm1-assessment',
  'm2-why-planning': 'm2-when-to-plan',
  'm2-contentpilot-brief': 'm2-when-to-plan',
  'm2-prd-concept': 'm2-product-requirements',
  'm2-prd-interview': 'm2-prd-prompt',
  'm2-prd-approved': 'm2-prd-review',
  'm2-implementation-plan': 'm2-implementation-plan',
  'm2-alignment-review': 'm2-implementation-plan',
  'm2-planning-package': 'm2-implementation-plan',
  'm2-mastery': 'm2-assessment',
  'm2-complete': 'm2-assessment'
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
  missionId: 'm2-planning-package'
  scenario: PracticeScenario
  status: Exclude<PracticeStatus, 'idle'>
  source: 'fixture'
  correlationId: string
  timestamp: string
  summary: string
  evidence?: PracticeEvidence
}

export type PracticeState = {
  missionId: 'm2-planning-package'
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
