import { isAllowedAuthUrl } from "./auth-service.mjs";

function rectangleOptions(bounds) {
  if (!bounds) return {};
  return {
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
  };
}

function secureWebPreferences(preloadPath) {
  return {
    preload: preloadPath,
    nodeIntegration: false,
    contextIsolation: true,
    sandbox: true,
  };
}

export function createMainWindowOptions({ preloadPath, bounds }) {
  return {
    width: 1180,
    height: 800,
    ...rectangleOptions(bounds),
    minWidth: 760,
    minHeight: 600,
    show: false,
    webPreferences: secureWebPreferences(preloadPath),
  };
}

export const createWindowOptions = createMainWindowOptions;

export function createBubbleWindowOptions({ preloadPath, bounds }) {
  return {
    width: 72,
    height: 72,
    ...rectangleOptions(bounds),
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    webPreferences: secureWebPreferences(preloadPath),
  };
}

export function createQuickChatWindowOptions({ preloadPath, bounds }) {
  return {
    width: 360,
    height: 520,
    ...rectangleOptions(bounds),
    show: false,
    frame: false,
    transparent: false,
    resizable: false,
    maximizable: false,
    minimizable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    webPreferences: secureWebPreferences(preloadPath),
  };
}

export function installWindowPolicy(window, { openExternal }) {
  const { webContents } = window;

  webContents.on("will-navigate", (event, targetUrl) => {
    if (targetUrl !== webContents.getURL()) event.preventDefault();
  });

  webContents.setWindowOpenHandler(({ url }) => {
    if (isAllowedAuthUrl(url)) {
      void openExternal(url).catch(() => {});
    }
    return { action: "deny" };
  });
}
