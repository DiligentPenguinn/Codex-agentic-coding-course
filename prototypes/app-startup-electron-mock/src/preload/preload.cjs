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
