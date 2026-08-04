const { contextBridge, ipcRenderer } = require("electron");

// Sandboxed preloads duplicate only the fixed channels their bridge needs.
const CHANNELS = Object.freeze({
  PRACTICE_GET_BUBBLE_STATE: "practice:get-bubble-state",
  PRACTICE_OPEN_QUICK_CHAT: "practice:open-quick-chat",
  PRACTICE_CLOSE_QUICK_CHAT: "practice:close-quick-chat",
  PRACTICE_EXPAND: "practice:expand",
  PRACTICE_BUBBLE_MENU: "practice:bubble-menu",
  PRACTICE_STATE_CHANGED: "practice:state-changed",
});

contextBridge.exposeInMainWorld("practiceBubble", Object.freeze({
  getState: () => ipcRenderer.invoke(CHANNELS.PRACTICE_GET_BUBBLE_STATE),
  openQuickChat: () => ipcRenderer.invoke(CHANNELS.PRACTICE_OPEN_QUICK_CHAT),
  closeQuickChat: () => ipcRenderer.invoke(CHANNELS.PRACTICE_CLOSE_QUICK_CHAT),
  expand: () => ipcRenderer.invoke(CHANNELS.PRACTICE_EXPAND),
  openMenu: () => ipcRenderer.invoke(CHANNELS.PRACTICE_BUBBLE_MENU),
  onStateChanged: (listener) => {
    const wrapped = (_event, value) => listener(value);
    ipcRenderer.on(CHANNELS.PRACTICE_STATE_CHANGED, wrapped);
    return () => (
      ipcRenderer.removeListener(CHANNELS.PRACTICE_STATE_CHANGED, wrapped)
    );
  },
}));
