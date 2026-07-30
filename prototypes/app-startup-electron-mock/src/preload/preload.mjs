import { contextBridge, ipcRenderer } from "electron";

import { CHANNELS } from "../shared/channels.mjs";

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
