import { contextBridge, ipcRenderer } from 'electron'
import type {
  CompanionMode,
  AppSettings,
  AppSettingsUpdate,
  CompanionState,
  CourseCompanionApi,
  LearnerProgress,
  PracticePanelUpdate,
  PlanningPracticeActionRequest,
  PracticeReviewResponse,
  PracticeStartRequest,
  PracticeWorkspaceView,
  PracticeFixtureRequest,
  PracticeIdentity,
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
  loadPracticeWorkspace: (identity?: PracticeIdentity) =>
    ipcRenderer.invoke('course:load-practice-workspace', identity) as Promise<PracticeWorkspaceView>,
  startPractice: (request: PracticeStartRequest) =>
    ipcRenderer.invoke('course:start-practice', request) as Promise<PracticeWorkspaceView>,
  resumePractice: (identity?: PracticeIdentity) =>
    ipcRenderer.invoke('course:resume-practice', identity) as Promise<PracticeWorkspaceView>,
  retryPracticeSwitch: () =>
    ipcRenderer.invoke('course:retry-practice-switch') as Promise<PracticeWorkspaceView>,
  cancelPracticeSwitch: () =>
    ipcRenderer.invoke('course:cancel-practice-switch') as Promise<PracticeWorkspaceView>,
  recordPlanningAction: (request: PlanningPracticeActionRequest) =>
    ipcRenderer.invoke('course:record-planning-action', request) as Promise<PracticeWorkspaceView>,
  selectPracticePanel: (update: PracticePanelUpdate) =>
    ipcRenderer.invoke('course:select-practice-panel', update) as Promise<PracticeWorkspaceView>,
  reviewPractice: () =>
    ipcRenderer.invoke('course:review-practice') as Promise<PracticeReviewResponse>,
  returnPassedPractice: () =>
    ipcRenderer.invoke('course:return-passed-practice') as Promise<void>,
  onPracticeReturned: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('course:practice-returned', listener)
    return () => ipcRenderer.removeListener('course:practice-returned', listener)
  },
  onFullTeacherRequested: (callback: () => void) => {
    const listener = () => callback()
    ipcRenderer.on('course:full-teacher-requested', listener)
    return () => ipcRenderer.removeListener('course:full-teacher-requested', listener)
  },
  onCompanionModeChanged: (callback: (mode: CompanionMode) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, mode: CompanionMode) => callback(mode)
    ipcRenderer.on('course:companion-mode-changed', listener)
    return () => ipcRenderer.removeListener('course:companion-mode-changed', listener)
  },
  loadAppSettings: () =>
    ipcRenderer.invoke('course:load-app-settings') as Promise<AppSettings>,
  saveAppSettings: (update: AppSettingsUpdate) =>
    ipcRenderer.invoke('course:save-app-settings', update) as Promise<AppSettings>,
  showFullTeacher: () => ipcRenderer.invoke('course:show-full-teacher') as Promise<void>,
  minimizeFullTeacher: () => ipcRenderer.invoke('course:minimize-full-teacher') as Promise<void>,
  setCompanionMode: (mode: CompanionMode) =>
    ipcRenderer.invoke('course:set-companion-mode', mode) as Promise<void>,
  quitApp: () => ipcRenderer.invoke('course:quit') as Promise<void>
}

contextBridge.exposeInMainWorld('courseCompanion', courseCompanionApi)
