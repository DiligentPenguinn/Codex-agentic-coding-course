import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
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
import { createExecutorChatCoordinator } from "./executor-chat-coordinator.mjs";
import { createExecutorConversationService } from "./executor-conversation-service.mjs";
import { registerIpcHandlers } from "./ipc-handlers.mjs";
import { loadPracticeStartRequest } from "./mission-repository.mjs";
import {
  registerPracticeIpcHandlers,
  registerPracticeWorkspaceIpcHandlers,
  toBubbleViewModel,
  toQuickChatViewModel,
} from "./practice-ipc-handlers.mjs";
import { createPracticeOrchestrator } from "./practice-orchestrator.mjs";
import { createPracticeStore, createPracticeWorkspaceStore } from "./practice-store.mjs";
import { createPracticeTransitionCoordinator } from "./practice-transition-coordinator.mjs";
import { createAutomaticHandoffSelection } from "./selective-handoff.mjs";
import { createSetupStore } from "./setup-store.mjs";
import { createAppServerTeacherAdapter } from "./teacher-adapter.mjs";
import { createWindowCoordinator } from "./window-coordinator.mjs";
import { CHANNELS } from "../shared/channels.mjs";
import { parseOnboardingContent } from "../shared/content-schema.mjs";

import { migrateLegacyPracticeState } from "../shared/practice-state-schema.mjs";
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

export const APP_SERVER_START_TIMEOUT_MS = 2_000;
export const APP_SERVER_STOP_TIMEOUT_MS = 1_500;

function activeMainWindow(coordinator) {
  const mainWindow = coordinator?.getMainWindow?.();
  return Boolean(mainWindow && !mainWindow.isDestroyed());
}

export function createCoordinatorOwnership({ onReleased = () => {} } = {}) {
  let currentRecord = null;
  let nextGeneration = 0;

  function release(record) {
    if (!record || record.released) return false;
    record.released = true;
    try {
      record.coordinator.dispose();
    } finally {
      if (currentRecord === record) currentRecord = null;
      try {
        onReleased(record.coordinator);
      } catch {
        // Release reporting cannot retain a dead coordinator.
      }
    }
    return true;
  }

  function install(coordinator) {
    if (!coordinator || typeof coordinator.getMainWindow !== "function") {
      throw new TypeError("A window coordinator is required.");
    }
    if (currentRecord?.coordinator === coordinator) return currentRecord.generation;
    release(currentRecord);

    const mainWindow = coordinator.getMainWindow();
    const record = {
      coordinator,
      generation: ++nextGeneration,
      released: false,
    };
    currentRecord = record;
    if (!mainWindow || typeof mainWindow.once !== "function") {
      release(record);
      throw new Error("The coordinator main window is unavailable.");
    }
    mainWindow.once("closed", () => release(record));
    if (mainWindow.isDestroyed()) release(record);
    return record.generation;
  }

  return Object.freeze({
    install,
    current: () => currentRecord?.coordinator ?? null,
    isCurrent: (coordinator) => (
      currentRecord?.coordinator === coordinator && !currentRecord.released
    ),
    hasUsableMain: () => (
      !currentRecord?.released && activeMainWindow(currentRecord?.coordinator)
    ),
    disposeCurrent: () => release(currentRecord),
  });
}



export async function ensureUsableCoordinatorMain({
  ownership,
  acquire,
  expand = false,
  assertCurrent = () => {},
}) {
  if (
    !ownership
    || typeof ownership.current !== "function"
    || typeof ownership.isCurrent !== "function"
    || typeof ownership.hasUsableMain !== "function"
    || typeof acquire !== "function"
    || typeof assertCurrent !== "function"
  ) {
    throw new TypeError("Current-main recovery requires lifecycle dependencies.");
  }

  for (let attempt = 0; attempt < 2; attempt += 1) {
    assertCurrent();
    if (!ownership.hasUsableMain()) {
      await acquire();
      assertCurrent();
    }

    const coordinator = ownership.current();
    if (
      !coordinator
      || !ownership.isCurrent(coordinator)
      || !ownership.hasUsableMain()
    ) {
      continue;
    }

    if (expand) {
      let expanded = false;
      try {
        expanded = await coordinator.expandTeacher();
      } catch {
        assertCurrent();
        continue;
      }
      assertCurrent();
      if (expanded !== true) continue;
    }

    if (
      !ownership.isCurrent(coordinator)
      || !ownership.hasUsableMain()
    ) {
      continue;
    }
    const mainWindow = coordinator.getMainWindow();
    if (!mainWindow || mainWindow.isDestroyed()) continue;
    return mainWindow;
  }
  return null;
}

export function createLifecycleGate() {
  let generation = 0;
  let cancelled = false;

  function isCurrent(capturedGeneration) {
    return !cancelled && capturedGeneration === generation;
  }

  function assertCurrent(capturedGeneration) {
    if (!isCurrent(capturedGeneration)) {
      throw Object.assign(new Error("Application lifecycle is no longer current."), {
        code: "APPLICATION_LIFECYCLE_CANCELLED",
      });
    }
  }

  return Object.freeze({
    capture: () => generation,
    isCurrent,
    assertCurrent,
    cancel() {
      if (cancelled) return;
      cancelled = true;
      generation += 1;
    },
  });
}

export function createOrderedCleanup({
  steps,
  onStart = () => {},
  onFinish = () => {},
}) {
  if (!Array.isArray(steps) || steps.some((step) => typeof step !== "function")) {
    throw new TypeError("Cleanup steps must be functions.");
  }
  let cleanupPromise = null;
  let cleanupFinished = false;

  function run() {
    if (cleanupPromise) return cleanupPromise;
    try {
      onStart();
    } catch {
      // Cleanup still owns every acquired resource.
    }
    cleanupPromise = (async () => {
      for (const step of steps) {
        try {
          await step();
        } catch {
          // Cleanup remains best effort and preserves required ordering.
        }
      }
      cleanupFinished = true;
      try {
        onFinish();
      } catch {
        // Completion reporting is non-authoritative.
      }
    })();
    return cleanupPromise;
  }

  return Object.freeze({
    run,
    finished: () => cleanupFinished,
  });
}

export async function runOwnedStartup({
  gate,
  start,
  cleanup,
}) {
  const generation = gate.capture();
  const assertCurrent = () => gate.assertCurrent(generation);
  try {
    assertCurrent();
    return await start({ generation, assertCurrent });
  } catch (error) {
    await cleanup();
    throw error;
  }
}

function timeoutResult(timers, timeoutMs, result) {
  let timer = null;
  return {
    promise: new Promise((resolve) => {
      timer = timers.setTimeout(() => resolve(result), timeoutMs);
    }),
    clear() {
      if (timer !== null) timers.clearTimeout(timer);
      timer = null;
    },
  };
}

export async function stopClientBounded(clientInstance, {
  stopTimeoutMs = APP_SERVER_STOP_TIMEOUT_MS,
  clearListeners = true,
  timers = globalThis,
} = {}) {
  if (!clientInstance) return;
  const timeout = timeoutResult(timers, stopTimeoutMs, undefined);
  const stopping = Promise.resolve()
    .then(() => clientInstance.stop({ clearListeners }))
    .catch(() => undefined);
  try {
    await Promise.race([stopping, timeout.promise]);
  } finally {
    timeout.clear();
  }
}

export async function startClientWithBoundedCleanup({
  client: clientInstance,
  startTimeoutMs = APP_SERVER_START_TIMEOUT_MS,
  stopTimeoutMs = APP_SERVER_STOP_TIMEOUT_MS,
  clearListenersOnFailure = true,
  isCurrent = () => true,
  timers = globalThis,
}) {
  const timeout = timeoutResult(timers, startTimeoutMs, { connected: false });
  const starting = Promise.resolve()
    .then(() => clientInstance.start())
    .then(
      () => ({ connected: true }),
      () => ({ connected: false }),
    );
  let outcome;
  try {
    outcome = await Promise.race([starting, timeout.promise]);
  } finally {
    timeout.clear();
  }
  if (outcome.connected && isCurrent()) return true;
  await stopClientBounded(clientInstance, {
    stopTimeoutMs,
    clearListeners: clearListenersOnFailure,
    timers,
  });
  return false;
}

let client = null;
let auth = null;
let practiceStore = null;
let practiceWorkspaceStore = null;
let orchestrator = null;
let transitionCoordinator = null;
let startupActivityReader = null;
let startupTeacherAdapter = null;
let applicationPromise = null;
let windowCreation = null;
let retryPromise = null;
let unregisterIpc = () => {};
let unregisterPracticeIpc = () => {};
let unregisterPracticeWorkspaceIpc = () => {};
let removeAuthForwarder = () => {};
let removePracticeForwarder = () => {};
let cleanupFinished = false;

const lifecycleGate = createLifecycleGate();
const coordinatorOwnership = createCoordinatorOwnership({
  onReleased(coordinator) {
    if (windowCreation?.coordinator === coordinator) windowCreation = null;
  },
});

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

async function connectAppServer(generation) {
  if (forceDisconnected) return false;
  return startClientWithBoundedCleanup({
    client,
    isCurrent: () => lifecycleGate.isCurrent(generation),
  });
}

function retryAppServer() {
  const generation = lifecycleGate.capture();
  lifecycleGate.assertCurrent(generation);
  if (retryPromise) return retryPromise;

  const current = (async () => {
    lifecycleGate.assertCurrent(generation);
    if (client.initialized) {
      await stopClientBounded(client, { clearListeners: false });
      lifecycleGate.assertCurrent(generation);
    }
    const connected = await startClientWithBoundedCleanup({
      client,
      clearListenersOnFailure: false,
      isCurrent: () => lifecycleGate.isCurrent(generation),
    });
    lifecycleGate.assertCurrent(generation);
    if (!connected) {
      throw Object.assign(new Error("Codex App Server is unavailable."), {
        code: "APP_SERVER_RETRY_FAILED",
      });
    }
    const account = await auth.readAccount();
    lifecycleGate.assertCurrent(generation);
    return account;
  })();
  retryPromise = current;
  current.then(
    () => {
      if (retryPromise === current) retryPromise = null;
    },
    () => {
      if (retryPromise === current) retryPromise = null;
    },
  );
  return current;
}

function requireWindowCoordinator() {
  const coordinator = coordinatorOwnership.current();
  if (!coordinator || !coordinatorOwnership.hasUsableMain()) {
    throw new Error("Practice windows are unavailable.");
  }
  return coordinator;
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
  return createWindowCoordinator({
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
}

function startCoordinatorCreation(presentation, generation) {
  lifecycleGate.assertCurrent(generation);
  if (windowCreation) return windowCreation.promise;

  const coordinator = configureWindowCoordinator(presentation);
  const operation = {
    coordinator,
    promise: null,
  };
  windowCreation = operation;

  let windowsReady;
  try {
    windowsReady = coordinator.create();
    lifecycleGate.assertCurrent(generation);
    coordinatorOwnership.install(coordinator);
  } catch (error) {
    coordinator.dispose();
    if (windowCreation === operation) windowCreation = null;
    throw error;
  }

  operation.promise = (async () => {
    await windowsReady;
    lifecycleGate.assertCurrent(generation);
    if (!coordinatorOwnership.isCurrent(coordinator)) return null;
    coordinator.broadcast(orchestrator.getViewModel());
    return coordinator.getMainWindow();
  })();
  operation.promise.then(
    () => {
      if (windowCreation === operation) windowCreation = null;
    },
    () => {
      if (windowCreation === operation) windowCreation = null;
    },
  );
  return operation.promise;
}

async function createCoordinatedWindows(generation = lifecycleGate.capture()) {
  lifecycleGate.assertCurrent(generation);
  if (coordinatorOwnership.hasUsableMain()) {
    return coordinatorOwnership.current().getMainWindow();
  }
  if (windowCreation) return windowCreation.promise;

  const persistedPracticeState = await practiceStore.read();
  lifecycleGate.assertCurrent(generation);
  if (coordinatorOwnership.hasUsableMain()) {
    return coordinatorOwnership.current().getMainWindow();
  }
  if (windowCreation) return windowCreation.promise;
  return startCoordinatorCreation(
    persistedPracticeState.presentation,
    generation,
  );
}

async function ensureCurrentMainWindow({ expand = false } = {}) {
  const generation = lifecycleGate.capture();
  lifecycleGate.assertCurrent(generation);
  return ensureUsableCoordinatorMain({
    ownership: coordinatorOwnership,
    acquire: () => createCoordinatedWindows(generation),
    expand,
    assertCurrent: () => lifecycleGate.assertCurrent(generation),
  });
}

const cleanupController = createOrderedCleanup({
  onStart() {
    lifecycleGate.cancel();
  },
  steps: [
    () => {
      unregisterIpc();
      unregisterIpc = () => {};
    },
    () => {
      unregisterPracticeIpc();
      unregisterPracticeIpc = () => {};
    },
    () => {
      unregisterPracticeWorkspaceIpc();
      unregisterPracticeWorkspaceIpc = () => {};
    },
    () => {
      removeAuthForwarder();
      removeAuthForwarder = () => {};
    },
    () => {
      removePracticeForwarder();
      removePracticeForwarder = () => {};
    },
    () => coordinatorOwnership.disposeCurrent(),
    async () => {
      if (orchestrator) {
        await orchestrator?.dispose();
      } else {
        try { startupActivityReader?.dispose(); } catch { /* Best effort. */ }
        try {
          await startupTeacherAdapter?.dispose();
        } catch {
          /* Best effort. */
        }
      }
      orchestrator = null;
      transitionCoordinator = null;
      practiceWorkspaceStore = null;
      startupActivityReader = null;
      startupTeacherAdapter = null;
    },
    () => {
      auth?.dispose();
      auth = null;
    },
    async () => {
      await stopClientBounded(client, {
        stopTimeoutMs: APP_SERVER_STOP_TIMEOUT_MS,
      });
      client = null;
    },
  ],
  onFinish() {
    cleanupFinished = true;
  },
});

function cleanup() {
  return cleanupController.run();
}

function createApplication() {
  if (applicationPromise) return applicationPromise;
  applicationPromise = runOwnedStartup({
    gate: lifecycleGate,
    cleanup,
    start: async ({ generation, assertCurrent }) => {
      if (!app.isReady()) {
        await app.whenReady();
        assertCurrent();
      }

      const onboardingContent = await loadOnboardingFixture();
      assertCurrent();
      const setupStore = createSetupStore({ userDataPath: userDataPath() });
      practiceStore = createPracticeStore({ userDataPath: userDataPath() });
      practiceWorkspaceStore = createPracticeWorkspaceStore({
        userDataPath: userDataPath(),
      });
      const practiceStartRequest = await loadPracticeStartRequest({
        fixturePath: path.join(
          mockRoot,
          "content",
          "practice.module-0.fixture.json",
        ),
        repositoryRoot: path.resolve(mockRoot, "..", ".."),
      });
      assertCurrent();

      client = createCodexClient();
      await connectAppServer(generation);
      assertCurrent();
      auth = createAuthService({ client, openExternal: openAuthUrl });

      const teacherCwd = path.join(userDataPath(), "teacher-sandbox");
      await mkdir(teacherCwd, { recursive: true });
      assertCurrent();
      const conversationService = createExecutorConversationService({
        client,
        openExternal: (url) => (
          fixtureServerPath ? Promise.resolve() : shell.openExternal(url)
        ),
      });
      const executorChatCoordinator = createExecutorChatCoordinator({
        client,
        conversationService,
        summarize: createAutomaticHandoffSelection,
      });
      transitionCoordinator = createPracticeTransitionCoordinator({
        store: practiceWorkspaceStore,
        chatCoordinator: executorChatCoordinator,
        loadStartRequest: async () => structuredClone(practiceStartRequest),
        createId: randomUUID,
      });
      startupActivityReader = createExecutorActivityReader({ client });
      startupTeacherAdapter = createAppServerTeacherAdapter({
        client,
        teacherCwd,
      });
      orchestrator = createPracticeOrchestrator({
        startRequest: practiceStartRequest,
        store: practiceStore,
        conversationService,
        activityReader: startupActivityReader,
        teacherAdapter: startupTeacherAdapter,
      });
      await orchestrator.initialize();
      assertCurrent();

      let practiceWorkspaceState = await practiceWorkspaceStore.read();
      const legacyPracticeState = await practiceStore.read();
      if (!practiceWorkspaceState.activeRun && legacyPracticeState.activeSession) {
        practiceWorkspaceState = await practiceWorkspaceStore.write(
          migrateLegacyPracticeState(
            legacyPracticeState,
            practiceStartRequest.practiceDefinition,
          ),
        );
      }
      if (practiceWorkspaceState.pendingTransition) {
        try {
          await transitionCoordinator.retrySwitch();
        } catch {
          // The durable transition remains available to the explicit Retry action.
        }
      }
      assertCurrent();

      const persistedPracticeState = await practiceStore.read();
      assertCurrent();
      const windowsReady = startCoordinatorCreation(
        persistedPracticeState.presentation,
        generation,
      );
      assertCurrent();

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
      unregisterPracticeWorkspaceIpc = registerPracticeWorkspaceIpcHandlers({
        ipcMain,
        transitionCoordinator,
        workspaceStore: practiceWorkspaceStore,
        loadStartRequest: async () => structuredClone(practiceStartRequest),
      });

      removeAuthForwarder = auth.onStatus((status) => {
        const mainWindow = coordinatorOwnership.current()?.getMainWindow();
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send(CHANNELS.AUTH_STATUS_CHANGED, status);
        }
      });
      removePracticeForwarder = orchestrator.onChange((viewModel) => {
        coordinatorOwnership.current()?.broadcast(viewModel);
      });

      await windowsReady;
      assertCurrent();
      if (!coordinatorOwnership.hasUsableMain()) return null;
      const coordinator = coordinatorOwnership.current();
      coordinator.broadcast(orchestrator.getViewModel());
      return coordinator.getMainWindow();
    },
  });
  return applicationPromise;
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    void createApplication()
      .then(() => ensureCurrentMainWindow({ expand: true }))
      .catch(() => {});
  });

  app.on("activate", () => {
    void createApplication()
      .then(() => ensureCurrentMainWindow())
      .catch(async () => {
        await cleanup();
        app.exit(1);
      });
  });

  app.whenReady()
    .then(() => createApplication())
    .catch(async () => {
      await cleanup();
      app.exit(1);
    });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("before-quit", (event) => {
    if (cleanupFinished) return;
    event.preventDefault();
    void cleanup().then(() => app.quit());
  });
}
