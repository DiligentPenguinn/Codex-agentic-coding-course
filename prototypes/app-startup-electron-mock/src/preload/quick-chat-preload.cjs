const { contextBridge, ipcRenderer } = require("electron");

// Sandboxed preloads duplicate only the fixed channels their bridge needs.
const CHANNELS = Object.freeze({
  PRACTICE_GET_QUICK_STATE: "practice:get-quick-state",
  PRACTICE_SEND_TEACHER: "practice:send-teacher",
  PRACTICE_CLOSE_QUICK_CHAT: "practice:close-quick-chat",
  PRACTICE_EXPAND: "practice:expand",
  PRACTICE_STATE_CHANGED: "practice:state-changed",
});

contextBridge.exposeInMainWorld("practiceQuickChat", Object.freeze({
  getState: () => ipcRenderer.invoke(CHANNELS.PRACTICE_GET_QUICK_STATE),
  sendTeacherMessage: (text) => (
    ipcRenderer.invoke(CHANNELS.PRACTICE_SEND_TEACHER, { text })
  ),
  closeQuickChat: () => (
    ipcRenderer.invoke(CHANNELS.PRACTICE_CLOSE_QUICK_CHAT)
  ),
  expand: () => ipcRenderer.invoke(CHANNELS.PRACTICE_EXPAND),
  onStateChanged: (listener) => {
    const wrapped = (_event, value) => listener(value);
    ipcRenderer.on(CHANNELS.PRACTICE_STATE_CHANGED, wrapped);
    return () => (
      ipcRenderer.removeListener(CHANNELS.PRACTICE_STATE_CHANGED, wrapped)
    );
  },
}));
