import { contextBridge, ipcRenderer } from 'electron'
import type {
  CompanionMode,
  CompanionState,
  CourseCompanionApi,
  LearnerProgress,
  PracticeFixtureRequest,
  PracticeState,
  ProgressLoadResult,
  ProgressUpdate,
  RuntimeInfo,
  TeacherSendRequest,
  TeacherSendResult
} from '../../shared/contracts'

const courseCompanionApi: CourseCompanionApi = {
  getRuntimeInfo: () => ipcRenderer.invoke('course:get-runtime-info') as Promise<RuntimeInfo>,
  loadProgress: () =>
    ipcRenderer.invoke('course:load-progress') as Promise<ProgressLoadResult>,
  saveProgress: (update: ProgressUpdate) =>
    ipcRenderer.invoke('course:save-progress', update) as Promise<LearnerProgress>,
  resetProgress: () => ipcRenderer.invoke('course:reset-progress') as Promise<void>,
  loadCompanionState: () =>
    ipcRenderer.invoke('course:load-companion-state') as Promise<CompanionState>,
  sendTeacherMessage: (request: TeacherSendRequest) =>
    ipcRenderer.invoke('course:send-teacher-message', request) as Promise<TeacherSendResult>,
  loadPracticeState: () =>
    ipcRenderer.invoke('course:load-practice-state') as Promise<PracticeState>,
  emitPracticeFixture: (request: PracticeFixtureRequest) =>
    ipcRenderer.invoke('course:emit-practice-fixture', request) as Promise<PracticeState>,
  onLearningWindowShown: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('course:learning-window-shown', listener)
    return () => ipcRenderer.removeListener('course:learning-window-shown', listener)
  },
  showLearningWindow: () => ipcRenderer.invoke('course:show-learning-window') as Promise<void>,
  hideLearningWindow: () => ipcRenderer.invoke('course:hide-learning-window') as Promise<void>,
  setCompanionMode: (mode: CompanionMode) =>
    ipcRenderer.invoke('course:set-companion-mode', mode) as Promise<void>,
  quitApp: () => ipcRenderer.invoke('course:quit') as Promise<void>
}

contextBridge.exposeInMainWorld('courseCompanion', courseCompanionApi)
