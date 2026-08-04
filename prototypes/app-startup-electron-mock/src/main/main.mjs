import { spawn } from "node:child_process";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

import {
  app,
  BrowserWindow,
  ipcMain,
  Menu,
  screen,
  shell,
} from "electron";

import { createAuthService } from "./auth-service.mjs";
import { CodexAppServerClient } from "./codex-app-server-client.mjs";
import { createExecutorActivityReader } from "./executor-activity-reader.mjs";
import { createExecutorConversationService } from "./executor-conversation-service.mjs";
import { registerIpcHandlers } from "./ipc-handlers.mjs";
import { loadPracticeStartRequest } from "./mission-repository.mjs";
import {
  registerPracticeIpcHandlers,
  toBubbleViewModel,
  toQuickChatViewModel,
} from "./practice-ipc-handlers.mjs";
import { createPracticeOrchestrator } from "./practice-orchestrator.mjs";
import { createPracticeStore } from "./practice-store.mjs";
import { createSetupStore } from "./setup-store.mjs";
import { createAppServerTeacherAdapter } from "./teacher-adapter.mjs";
import { createWindowCoordinator } from "./window-coordinator.mjs";
import { CHANNELS } from "../shared/channels.mjs";
import { parseOnboardingContent } from "../shared/content-schema.mjs";

// Window security is applied by window-coordinator.mjs through window-policy.mjs.
const mainDirectory = path.dirname(fileURLToPath(import.meta.url));
const mockRoot = path.resolve(mainDirectory, "..", "..");
const allowTestHooks = (
  process.env.NODE_ENV === "test" && !app.isPackaged
);
if (allowTestHooks) app.disableHardwareAcceleration();
if (allowTestHooks && process.env.COURSE_MOCK_USER_DATA_DIR) {
  app.setPath(
    "userData",
    path.resolve(process.env.COURSE_MOCK_USER_DATA_DIR),
  );
}
const fixtureServerPath = allowTestHooks
  ? process.env.COURSE_MOCK_APP_SERVER_FIXTURE
  : null;
const forceDisconnected = (
  process.env.COURSE_MOCK_START_DISCONNECTED === "1"
  || (
    allowTestHooks
    && process.env.COURSE_MOCK_FORCE_DISCONNECTED === "1"
  )
);

let client = null;
let auth = null;
let practiceStore = null;
let orchestrator = null;
let windowCoordinator = null;
let applicationPromise = null;
let windowCreationPromise = null;
let cleanupPromise = null;
let unregisterIpc = () => {};
let unregisterPracticeIpc = () => {};
let removeAuthForwarder = () => {};
let removePracticeForwarder = () => {};
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
  const spawnAppServer = fixtureServerPath
    ? (_command, _args, options) => spawn(
      process.execPath,
      [path.resolve(fixtureServerPath)],
      {
        ...options,
        env: {
          ...process.env,
          ELECTRON_RUN_AS_NODE: "1",
        },
      },
    )
    : spawn;
  return new CodexAppServerClient({
    spawn: spawnAppServer,
    logger,
  });
}

function openAuthUrl(url) {
  if (fixtureServerPath) return Promise.resolve();
  return shell.openExternal(url);
}

async function loadOnboardingFixture() {
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

function requireWindowCoordinator() {
  if (!windowCoordinator) throw new Error("Practice windows are unavailable.");
  return windowCoordinator;
}

const windowActions = Object.freeze({
  compact: () => requireWindowCoordinator().compact(),
  openQuickChat: () => requireWindowCoordinator().openQuickChat(),
  closeQuickChat: () => requireWindowCoordinator().closeQuickChat(),
  expandTeacher: () => requireWindowCoordinator().expandTeacher(),
  openBubbleMenu: (sender) => requireWindowCoordinator().openBubbleMenu(sender),
  quit: () => app.quit(),
});

function configureWindowCoordinator(presentation) {
  windowCoordinator?.dispose();
  windowCoordinator = createWindowCoordinator({
    BrowserWindow,
    Menu,
    screen,
    openExternal: openAuthUrl,
    rendererPaths: {
      main: path.join(mockRoot, "src", "renderer", "index.html"),
      bubble: path.join(mockRoot, "src", "renderer", "bubble.html"),
      quickChat: path.join(mockRoot, "src", "renderer", "quick-chat.html"),
    },
    preloadPaths: {
      main: path.join(mockRoot, "src", "preload", "preload.cjs"),
      bubble: path.join(mockRoot, "src", "preload", "bubble-preload.cjs"),
      quickChat: path.join(mockRoot, "src", "preload", "quick-chat-preload.cjs"),
    },
    presentation,
    updatePresentation: (patch) => orchestrator.updatePresentation(patch),
    selectTab: (tab) => orchestrator.selectTab(tab),
    pausePractice: () => orchestrator.pause(),
    quitApp: () => app.quit(),
    toBubbleViewModel,
    toQuickChatViewModel,
  });
  return windowCoordinator;
}

function createCoordinatedWindows() {
  if (cleanupStarted) return Promise.resolve(null);
  if (windowCreationPromise) return windowCreationPromise;
  const current = (async () => {
    const persistedPracticeState = await practiceStore.read();
    if (cleanupStarted) return null;
    const coordinator = configureWindowCoordinator(
      persistedPracticeState.presentation,
    );
    const mainWindow = await coordinator.create();
    if (cleanupStarted || coordinator !== windowCoordinator) {
      coordinator.dispose();
      return null;
    }
    coordinator.broadcast(orchestrator.getViewModel());
    return mainWindow;
  })();
  windowCreationPromise = current;
  current.then(
    () => {
      if (windowCreationPromise === current) windowCreationPromise = null;
    },
    () => {
      if (windowCreationPromise === current) windowCreationPromise = null;
    },
  );
  return current;
}

async function createApplication() {
  if (applicationPromise) return applicationPromise;
  applicationPromise = (async () => {
    if (!app.isReady()) await app.whenReady();
    const onboardingContent = await loadOnboardingFixture();
    const setupStore = createSetupStore({ userDataPath: userDataPath() });
    practiceStore = createPracticeStore({ userDataPath: userDataPath() });
    const practiceStartRequest = await loadPracticeStartRequest({
      fixturePath: path.join(
        mockRoot,
        "content",
        "practice.module-0.fixture.json",
      ),
      repositoryRoot: path.resolve(mockRoot, "..", ".."),
    });

    client = createCodexClient();
    await connectAppServer();
    auth = createAuthService({ client, openExternal: openAuthUrl });

    const teacherCwd = path.join(userDataPath(), "teacher-sandbox");
    await mkdir(teacherCwd, { recursive: true });
    const conversationService = createExecutorConversationService({
      client,
      openExternal: (url) => (
        fixtureServerPath ? Promise.resolve() : shell.openExternal(url)
      ),
    });
    const activityReader = createExecutorActivityReader({ client });
    const teacherAdapter = createAppServerTeacherAdapter({ client, teacherCwd });
    orchestrator = createPracticeOrchestrator({
      startRequest: practiceStartRequest,
      store: practiceStore,
      conversationService,
      activityReader,
      teacherAdapter,
    });
    await orchestrator.initialize();

    const persistedPracticeState = await practiceStore.read();
    const coordinator = configureWindowCoordinator(
      persistedPracticeState.presentation,
    );
    const windowsReady = coordinator.create();

    unregisterIpc = registerIpcHandlers({
      ipcMain,
      auth,
      store: setupStore,
      content: onboardingContent,
      retryAppServer,
    });
    unregisterPracticeIpc = registerPracticeIpcHandlers({
      ipcMain,
      orchestrator,
      windowActions,
    });
    removeAuthForwarder = auth.onStatus((status) => {
      const mainWindow = windowCoordinator?.getMainWindow();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(CHANNELS.AUTH_STATUS_CHANGED, status);
      }
    });
    removePracticeForwarder = orchestrator.onChange((viewModel) => {
      windowCoordinator?.broadcast(viewModel);
    });

    await windowsReady;
    if (cleanupStarted || coordinator !== windowCoordinator) {
      coordinator.dispose();
      return null;
    }
    coordinator.broadcast(orchestrator.getViewModel());
    return coordinator.getMainWindow();
  })();
  return applicationPromise;
}

async function cleanup() {
  if (cleanupPromise) return cleanupPromise;
  cleanupStarted = true;
  cleanupPromise = (async () => {
    try { unregisterIpc(); } catch { /* Cleanup remains best effort. */ }
    try { unregisterPracticeIpc(); } catch { /* Cleanup remains best effort. */ }
    try { removeAuthForwarder(); } catch { /* Cleanup remains best effort. */ }
    try { removePracticeForwarder(); } catch { /* Cleanup remains best effort. */ }
    try { windowCoordinator?.dispose(); } catch { /* Cleanup remains best effort. */ }
    try { await orchestrator?.dispose(); } catch { /* Cleanup remains best effort. */ }
    try { auth?.dispose(); } catch { /* Cleanup remains best effort. */ }
    if (client) {
      await Promise.race([
        client.stop(),
        new Promise((resolve) => setTimeout(resolve, 1_500)),
      ]).catch(() => {});
    }
    cleanupFinished = true;
  })();
  return cleanupPromise;
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    void createApplication().then(async () => {
      if (cleanupStarted) return;
      if (BrowserWindow.getAllWindows().length === 0) {
        await createCoordinatedWindows();
      }
      await windowActions.expandTeacher();
    }).catch(() => {});
  });

  app.on("activate", () => {
    void createApplication().then(async () => {
      if (!cleanupStarted && BrowserWindow.getAllWindows().length === 0) {
        await createCoordinatedWindows();
      }
    }).catch(() => app.exit(1));
  });

  app.whenReady().then(() => createApplication()).catch(() => {
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
