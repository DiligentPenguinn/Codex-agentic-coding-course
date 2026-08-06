import { contextBridge, ipcRenderer } from 'electron'
import type {
  CompanionMode,
  CourseCompanionApi,
  RuntimeInfo
} from '../../shared/contracts'

const courseCompanionApi: CourseCompanionApi = {
  getRuntimeInfo: () => ipcRenderer.invoke('course:get-runtime-info') as Promise<RuntimeInfo>,
  showLearningWindow: () => ipcRenderer.invoke('course:show-learning-window') as Promise<void>,
  hideLearningWindow: () => ipcRenderer.invoke('course:hide-learning-window') as Promise<void>,
  setCompanionMode: (mode: CompanionMode) =>
    ipcRenderer.invoke('course:set-companion-mode', mode) as Promise<void>,
  quitApp: () => ipcRenderer.invoke('course:quit') as Promise<void>
}

contextBridge.exposeInMainWorld('courseCompanion', courseCompanionApi)
