import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  app,
  BrowserWindow,
  ipcMain,
  shell,
} from "electron";

import { createAuthService } from "./auth-service.mjs";
import { CodexAppServerClient } from "./codex-app-server-client.mjs";
import { registerIpcHandlers } from "./ipc-handlers.mjs";
import { createSetupStore } from "./setup-store.mjs";
import {
  createWindowOptions,
  installWindowPolicy,
} from "./window-policy.mjs";
import { CHANNELS } from "../shared/channels.mjs";
import { parseOnboardingContent } from "../shared/content-schema.mjs";

const mainDirectory = path.dirname(fileURLToPath(import.meta.url));
const mockRoot = path.resolve(mainDirectory, "..", "..");
const allowTestHooks = (
  process.env.NODE_ENV === "test" && !app.isPackaged
);
const forceDisconnected = (
  process.env.COURSE_MOCK_START_DISCONNECTED === "1"
  || (
    allowTestHooks
    && process.env.COURSE_MOCK_FORCE_DISCONNECTED === "1"
  )
);

let mainWindow = null;
let client = null;
let auth = null;
let unregisterIpc = () => {};
let removeAuthForwarder = () => {};
let cleanupStarted = false;
let cleanupFinished = false;

const logger = Object.freeze({
  info(event, fields) {
    console.info(event, fields);
  },
  error(event, fields) {
    console.error(event, fields);
  },
});

function createCodexClient() {
  return new CodexAppServerClient({
    spawn,
    logger,
  });
}

async function loadFixture() {
  const source = await readFile(
    path.join(mockRoot, "content", "onboarding.fixture.json"),
    "utf8",
  );
  return parseOnboardingContent(JSON.parse(source));
}

function userDataPath() {
  if (allowTestHooks && process.env.COURSE_MOCK_USER_DATA_DIR) {
    return path.resolve(process.env.COURSE_MOCK_USER_DATA_DIR);
  }
  return app.getPath("userData");
}

async function connectAppServer() {
  if (forceDisconnected) return false;
  try {
    await client.start();
    return true;
  } catch {
    return false;
  }
}

async function retryAppServer() {
  if (client.initialized) {
    await client.restart();
  } else {
    await client.start();
  }
  return auth.readAccount();
}

async function createMainWindow() {
  const content = await loadFixture();
  const store = createSetupStore({ userDataPath: userDataPath() });
  client = createCodexClient();
  await connectAppServer();
  auth = createAuthService({
    client,
    openExternal: (url) => shell.openExternal(url),
  });

  unregisterIpc = registerIpcHandlers({
    ipcMain,
    auth,
    store,
    content,
    retryAppServer,
  });

  const preloadPath = path.join(
    mockRoot,
    "src",
    "preload",
    "preload.cjs",
  );
  mainWindow = new BrowserWindow(createWindowOptions({ preloadPath }));
  installWindowPolicy(mainWindow, {
    openExternal: (url) => shell.openExternal(url),
  });
  removeAuthForwarder = auth.onStatus((status) => {
    if (!mainWindow?.isDestroyed()) {
      mainWindow.webContents.send(CHANNELS.AUTH_STATUS_CHANGED, status);
    }
  });
  mainWindow.once("ready-to-show", () => mainWindow?.show());
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  await mainWindow.loadFile(
    path.join(mockRoot, "src", "renderer", "index.html"),
  );
}

async function cleanup() {
  if (cleanupStarted) return;
  cleanupStarted = true;
  unregisterIpc();
  removeAuthForwarder();
  auth?.dispose();
  if (client) {
    await Promise.race([
      client.stop(),
      new Promise((resolve) => setTimeout(resolve, 1_500)),
    ]);
  }
  cleanupFinished = true;
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    await createMainWindow();
    app.on("activate", async () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        await createMainWindow();
      }
    });
  }).catch(() => {
    app.exit(1);
  });

  app.on("window-all-closed", () => {
    app.quit();
  });

  app.on("before-quit", (event) => {
    if (cleanupFinished) return;
    event.preventDefault();
    void cleanup().finally(() => app.quit());
  });
}
