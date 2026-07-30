import { isAllowedAuthUrl } from "./auth-service.mjs";

export function createWindowOptions({ preloadPath }) {
  return {
    width: 880,
    height: 680,
    minWidth: 680,
    minHeight: 560,
    show: false,
    webPreferences: {
      preload: preloadPath,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
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
