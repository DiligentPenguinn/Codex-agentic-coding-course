import type { CourseLessonId, SceneId } from '../../../../shared/contracts'
import {
  portfolioModuleDefinitions,
  validateCourseModuleDefinitions
} from '../../../../shared/course/registry'
import type { RendererModuleDefinition, RegistrySceneContent } from './module-contracts'
import { moduleTwoDefinition } from './modules/module-2/definition'
import { moduleTwoScenes } from './modules/module-2/scenes'
import { moduleThreeDefinition } from './modules/module-3/definition'
import { moduleThreeScenes } from './modules/module-3/scenes'
import { moduleFourDefinition } from './modules/module-4/definition'
import { moduleFourScenes } from './modules/module-4/scenes'

const rendererModules = [
  {
    id: moduleTwoDefinition.id,
    titleVi: moduleTwoDefinition.titleVi,
    lessons: moduleTwoDefinition.lessons,
    lessonPages: {
      'm2-portfolio-brief': [['module-2-portfolio-placeholder']]
    },
    scenes: moduleTwoScenes
  },
  {
    id: moduleThreeDefinition.id,
    titleVi: moduleThreeDefinition.titleVi,
    lessons: moduleThreeDefinition.lessons,
    lessonPages: {
      'm3-scaffold-baseline': [['module-3-placeholder']]
    },
    scenes: moduleThreeScenes
  },
  {
    id: moduleFourDefinition.id,
    titleVi: moduleFourDefinition.titleVi,
    lessons: moduleFourDefinition.lessons,
    lessonPages: {
      'm4-release-validation': [['module-4-placeholder']]
    },
    scenes: moduleFourScenes
  }
] as const satisfies readonly RendererModuleDefinition[]

export function validateRendererRegistry(
  modules: readonly RendererModuleDefinition[] = rendererModules
): void {
  validateCourseModuleDefinitions(portfolioModuleDefinitions)
  const moduleIds = new Set<string>()
  const sceneIds = new Set<string>()

  for (const module of modules) {
    if (moduleIds.has(module.id)) throw new Error(`Duplicate renderer module id: ${module.id}`)
    moduleIds.add(module.id)
    const contract = portfolioModuleDefinitions.find((candidate) => candidate.id === module.id)
    if (!contract) throw new Error(`Renderer module has no shared contract: ${module.id}`)

    const contractScenes = new Set(contract.scenes.map((scene) => scene.id))
    for (const sceneId of Object.keys(module.scenes)) {
      if (sceneIds.has(sceneId)) throw new Error(`Duplicate renderer scene id: ${sceneId}`)
      if (!contractScenes.has(sceneId as never)) {
        throw new Error(`Renderer scene is missing from its shared contract: ${sceneId}`)
      }
      sceneIds.add(sceneId)
    }
    for (const sceneId of contractScenes) {
      if (!module.scenes[sceneId as SceneId]) {
        throw new Error(`Shared scene is missing renderer content: ${sceneId}`)
      }
    }

    for (const lesson of module.lessons) {
      const pages = module.lessonPages[lesson.id]
      if (!pages || pages.length === 0) throw new Error(`Lesson has no pages: ${lesson.id}`)
      for (const sceneId of pages.flat()) {
        if (!module.scenes[sceneId]) throw new Error(`Lesson references unknown scene: ${sceneId}`)
      }
    }
  }
}

validateRendererRegistry()

export const registrySceneContent = Object.assign(
  {},
  ...rendererModules.map((module) => module.scenes)
) as Partial<Record<SceneId, RegistrySceneContent>>

export const registryLessonDefinitions = rendererModules.flatMap((module) =>
  module.lessons.map((lesson) => ({ id: lesson.id, titleVi: lesson.titleVi }))
)

export const registryLessonPages = Object.assign(
  {},
  ...rendererModules.map((module) => module.lessonPages)
) as Partial<Record<CourseLessonId, readonly (readonly SceneId[])[]>>

export const registryModuleLessonIds = Object.fromEntries(
  rendererModules.map((module) => [module.id, module.lessons.map((lesson) => lesson.id)])
) as Record<'module-2' | 'module-3' | 'module-4', CourseLessonId[]>
