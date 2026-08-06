import { contextBridge, ipcRenderer } from 'electron'
import type {
  CompanionMode,
  CourseCompanionApi,
  LearnerProgress,
  ProgressLoadResult,
  ProgressUpdate,
  RuntimeInfo
} from '../../shared/contracts'

const courseCompanionApi: CourseCompanionApi = {
  getRuntimeInfo: () => ipcRenderer.invoke('course:get-runtime-info') as Promise<RuntimeInfo>,
  loadProgress: () =>
    ipcRenderer.invoke('course:load-progress') as Promise<ProgressLoadResult>,
  saveProgress: (update: ProgressUpdate) =>
    ipcRenderer.invoke('course:save-progress', update) as Promise<LearnerProgress>,
  resetProgress: () => ipcRenderer.invoke('course:reset-progress') as Promise<void>,
  showLearningWindow: () => ipcRenderer.invoke('course:show-learning-window') as Promise<void>,
  hideLearningWindow: () => ipcRenderer.invoke('course:hide-learning-window') as Promise<void>,
  setCompanionMode: (mode: CompanionMode) =>
    ipcRenderer.invoke('course:set-companion-mode', mode) as Promise<void>,
  quitApp: () => ipcRenderer.invoke('course:quit') as Promise<void>
}

contextBridge.exposeInMainWorld('courseCompanion', courseCompanionApi)
