export type PortfolioModuleId = 'module-2' | 'module-3' | 'module-4'

export type ModuleCheckpointDefinition<
  CheckpointId extends string = string,
  CourseLessonId extends string = string
> = {
  id: CheckpointId
  courseLessonId: CourseLessonId
}

export type ModuleSceneDefinition<
  SceneId extends string = string,
  CheckpointId extends string = string,
  CourseLessonId extends string = string
> = {
  id: SceneId
  checkpointId: CheckpointId
  courseLessonId: CourseLessonId
  nextSceneId?: string
}

export type CourseModuleDefinition = {
  id: PortfolioModuleId
  order: 2 | 3 | 4
  titleVi: string
  lessons: readonly { id: string; titleVi: string }[]
  checkpoints: readonly ModuleCheckpointDefinition[]
  scenes: readonly ModuleSceneDefinition[]
  quizGroupIds: readonly string[]
  practice: {
    id: string
    version: string
    evidenceProfile: 'portfolio-planning' | 'portfolio-build' | 'portfolio-release'
  }
  artifactPaths: readonly string[]
  completionDestination: { moduleId: PortfolioModuleId; sceneId: string } | null
}
