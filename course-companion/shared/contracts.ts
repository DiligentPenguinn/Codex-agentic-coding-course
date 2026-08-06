export type RuntimeInfo = {
  appVersion: string
  platform: string
  packaged: boolean
}

export type CompanionMode = 'compact' | 'expanded'

export type CourseCompanionApi = {
  getRuntimeInfo: () => Promise<RuntimeInfo>
  showLearningWindow: () => Promise<void>
  hideLearningWindow: () => Promise<void>
  setCompanionMode: (mode: CompanionMode) => Promise<void>
  quitApp: () => Promise<void>
}
