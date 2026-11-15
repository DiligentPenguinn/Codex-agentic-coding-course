import type {
  CheckpointId,
  CourseLessonId,
  LessonId,
  SceneId
} from '../../../../shared/contracts'
import type { PortfolioModuleId } from '../../../../shared/course/registry'

export type RegistryChoice = {
  label: string
  next?: SceneId
  primary?: boolean
  preservePrimaryLabel?: boolean
  danger?: boolean
  action?: 'practice' | 'home' | 'review-module'
  afterSave?: 'home'
  decision?: { key: string; value: string }
}

export type RegistrySceneContent = {
  lessonId: LessonId
  checkpointId: CheckpointId
  step: number
  totalSteps: number
  lessonLabel: string
  mission: string
  objective: string
  panelLabel: string
  panelStatus: string
  tone: 'neutral' | 'bad' | 'good'
  request: string
  evidence: Array<{ label: string; value: string; ready?: boolean }>
  dialogue?: string
  highlightTerms?: readonly string[]
  choices: RegistryChoice[]
  copyPrompt?: string
  copyPromptLabel?: string
  copyPromptTitle?: string
  assessmentQuestionId?: string
  assessmentGroupId?: string
  assessmentSummary?: boolean
  showTitle?: boolean
  showPanel?: boolean
}

export type RendererModuleDefinition = {
  id: PortfolioModuleId
  titleVi: string
  lessons: readonly { id: CourseLessonId; titleVi: string }[]
  lessonPages: Readonly<Partial<Record<CourseLessonId, readonly (readonly SceneId[])[]>>>
  scenes: Readonly<Partial<Record<SceneId, RegistrySceneContent>>>
}
