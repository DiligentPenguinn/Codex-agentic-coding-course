import type { CourseModuleDefinition } from './module-contracts'
import { moduleTwoDefinition } from './modules/module-2'
import { moduleThreeDefinition } from './modules/module-3'
import { moduleFourDefinition } from './modules/module-4'

export const portfolioModuleDefinitions = [
  moduleTwoDefinition,
  moduleThreeDefinition,
  moduleFourDefinition
] as const satisfies readonly CourseModuleDefinition[]

export type PortfolioModuleDefinition = (typeof portfolioModuleDefinitions)[number]
export type PortfolioModuleId = PortfolioModuleDefinition['id']
export type PortfolioCourseLessonId = PortfolioModuleDefinition['lessons'][number]['id']
export type PortfolioCheckpointId = PortfolioModuleDefinition['checkpoints'][number]['id']
export type PortfolioSceneId = PortfolioModuleDefinition['scenes'][number]['id']

export const portfolioCourseLessonIds = portfolioModuleDefinitions.flatMap(
  (module) => module.lessons.map((lesson) => lesson.id)
) as PortfolioCourseLessonId[]

export const portfolioCheckpointIds = portfolioModuleDefinitions.flatMap(
  (module) => module.checkpoints.map((checkpoint) => checkpoint.id)
) as PortfolioCheckpointId[]

export const portfolioSceneIds = portfolioModuleDefinitions.flatMap(
  (module) => module.scenes.map((scene) => scene.id)
) as PortfolioSceneId[]

export const portfolioSceneCheckpoint = Object.fromEntries(
  portfolioModuleDefinitions.flatMap((module) =>
    module.scenes.map((scene) => [scene.id, scene.checkpointId])
  )
) as Record<PortfolioSceneId, PortfolioCheckpointId>

export const portfolioCheckpointCourseLesson = Object.fromEntries(
  portfolioModuleDefinitions.flatMap((module) =>
    module.checkpoints.map((checkpoint) => [checkpoint.id, checkpoint.courseLessonId])
  )
) as Record<PortfolioCheckpointId, PortfolioCourseLessonId>

export function validateCourseModuleDefinitions(
  definitions: readonly CourseModuleDefinition[]
): void {
  const moduleIds = new Set<string>()
  const lessonIds = new Set<string>()
  const checkpointIds = new Set<string>()
  const sceneIds = new Set<string>()
  const expectedOrders = definitions.map((definition) => definition.order)

  if (expectedOrders.some((order, index) => index > 0 && order <= expectedOrders[index - 1]!)) {
    throw new Error('Course modules must appear in strictly increasing order')
  }

  for (const definition of definitions) {
    if (moduleIds.has(definition.id)) throw new Error(`Duplicate module id: ${definition.id}`)
    moduleIds.add(definition.id)

    const moduleLessonIds = new Set(definition.lessons.map((lesson) => lesson.id))
    const moduleCheckpointIds = new Set(definition.checkpoints.map((checkpoint) => checkpoint.id))
    const checkpointLessons = new Map(definition.checkpoints.map((checkpoint) => [
      checkpoint.id,
      checkpoint.courseLessonId
    ]))
    const moduleSceneIds = new Set(definition.scenes.map((scene) => scene.id))

    for (const lesson of definition.lessons) {
      if (lessonIds.has(lesson.id)) throw new Error(`Duplicate course lesson id: ${lesson.id}`)
      lessonIds.add(lesson.id)
    }
    for (const checkpoint of definition.checkpoints) {
      if (checkpointIds.has(checkpoint.id)) throw new Error(`Duplicate checkpoint id: ${checkpoint.id}`)
      if (!moduleLessonIds.has(checkpoint.courseLessonId)) {
        throw new Error(`Unknown course lesson for checkpoint ${checkpoint.id}`)
      }
      checkpointIds.add(checkpoint.id)
    }
    for (const scene of definition.scenes) {
      if (sceneIds.has(scene.id)) throw new Error(`Duplicate scene id: ${scene.id}`)
      if (!moduleCheckpointIds.has(scene.checkpointId)) {
        throw new Error(`Unknown checkpoint for scene ${scene.id}`)
      }
      if (!moduleLessonIds.has(scene.courseLessonId)) {
        throw new Error(`Unknown course lesson for scene ${scene.id}`)
      }
      if (checkpointLessons.get(scene.checkpointId) !== scene.courseLessonId) {
        throw new Error(`Scene and checkpoint use different lessons: ${scene.id}`)
      }
      if (scene.nextSceneId && !moduleSceneIds.has(scene.nextSceneId)) {
        throw new Error(`Broken scene destination from ${scene.id}`)
      }
      sceneIds.add(scene.id)
    }
  }

  for (const definition of definitions) {
    const destination = definition.completionDestination
    if (!destination) continue
    if (!moduleIds.has(destination.moduleId) || !sceneIds.has(destination.sceneId)) {
      throw new Error(`Broken completion destination for ${definition.id}`)
    }
  }
}

validateCourseModuleDefinitions(portfolioModuleDefinitions)
