const { contextBridge, ipcRenderer } = require("electron");

// Sandboxed preloads cannot import local modules. Keep these fixed values in
// lockstep with src/shared/channels.mjs and verify them in the IPC contract.
const CHANNELS = Object.freeze({
  GET_STATUS: "setup:get-status",
  START_BROWSER_LOGIN: "auth:start-browser-login",
  START_DEVICE_LOGIN: "auth:start-device-login",
  CANCEL_LOGIN: "auth:cancel-login",
  RETRY_APP_SERVER: "auth:retry-app-server",
  AUTH_STATUS_CHANGED: "auth:status-changed",
  GET_CONTENT: "setup:get-content",
  SAVE_RESPONSES: "setup:save-responses",
  REOPEN_SETUP: "setup:reopen",
  PRACTICE_GET_STATE: "practice:get-state",
  PRACTICE_START: "practice:start",
  PRACTICE_CREATE_TASK: "practice:create-task",
  PRACTICE_LIST_TASKS: "practice:list-tasks",
  PRACTICE_BIND_TASK: "practice:bind-task",
  PRACTICE_REBIND: "practice:rebind",
  PRACTICE_OPEN_TASK: "practice:open-task",
  PRACTICE_RETRY: "practice:retry",
  PRACTICE_SEND_TEACHER: "practice:send-teacher",
  PRACTICE_SELECT_TAB: "practice:select-tab",
  PRACTICE_COMPACT: "practice:compact",
  PRACTICE_STATE_CHANGED: "practice:state-changed",
});

contextBridge.exposeInMainWorld("courseSetup", Object.freeze({
  getStatus: () => ipcRenderer.invoke(CHANNELS.GET_STATUS),
  startBrowserLogin: () => ipcRenderer.invoke(CHANNELS.START_BROWSER_LOGIN),
  startDeviceLogin: () => ipcRenderer.invoke(CHANNELS.START_DEVICE_LOGIN),
  cancelLogin: (loginId) => (
    ipcRenderer.invoke(CHANNELS.CANCEL_LOGIN, { loginId })
  ),
  retryAppServer: () => ipcRenderer.invoke(CHANNELS.RETRY_APP_SERVER),
  onAuthStatusChanged: (listener) => {
    const wrapped = (_event, status) => listener(status);
    ipcRenderer.on(CHANNELS.AUTH_STATUS_CHANGED, wrapped);
    return () => (
      ipcRenderer.removeListener(CHANNELS.AUTH_STATUS_CHANGED, wrapped)
    );
  },
  getContent: () => ipcRenderer.invoke(CHANNELS.GET_CONTENT),
  saveResponses: (responses) => (
    ipcRenderer.invoke(CHANNELS.SAVE_RESPONSES, { responses })
  ),
  reopenSetup: () => ipcRenderer.invoke(CHANNELS.REOPEN_SETUP),
}));

contextBridge.exposeInMainWorld("practice", Object.freeze({
  getState: () => ipcRenderer.invoke(CHANNELS.PRACTICE_GET_STATE),
  start: () => ipcRenderer.invoke(CHANNELS.PRACTICE_START),
  createTask: () => ipcRenderer.invoke(CHANNELS.PRACTICE_CREATE_TASK),
  listTasks: () => ipcRenderer.invoke(CHANNELS.PRACTICE_LIST_TASKS),
  bindTask: (threadId) => (
    ipcRenderer.invoke(CHANNELS.PRACTICE_BIND_TASK, { threadId })
  ),
  rebind: () => ipcRenderer.invoke(CHANNELS.PRACTICE_REBIND),
  openTask: () => ipcRenderer.invoke(CHANNELS.PRACTICE_OPEN_TASK),
  retry: () => ipcRenderer.invoke(CHANNELS.PRACTICE_RETRY),
  sendTeacherMessage: (text) => (
    ipcRenderer.invoke(CHANNELS.PRACTICE_SEND_TEACHER, { text })
  ),
  selectTab: (tab) => (
    ipcRenderer.invoke(CHANNELS.PRACTICE_SELECT_TAB, { tab })
  ),
  compact: () => ipcRenderer.invoke(CHANNELS.PRACTICE_COMPACT),
  onStateChanged: (listener) => {
    const wrapped = (_event, value) => listener(value);
    ipcRenderer.on(CHANNELS.PRACTICE_STATE_CHANGED, wrapped);
    return () => (
      ipcRenderer.removeListener(CHANNELS.PRACTICE_STATE_CHANGED, wrapped)
    );
  },
}));
