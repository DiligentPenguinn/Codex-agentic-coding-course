import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { EventEmitter } from "node:events";
import { readFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { registerIpcHandlers } from "../src/main/ipc-handlers.mjs";
import { CHANNELS } from "../src/shared/channels.mjs";

const content = {
  schemaVersion: 1,
  contentKind: "fixture",
  contentOwner: "Duy mock fixture",
  title: "Sample teaching setup",
  notice: "Fixture content for testing Duy's setup mechanism.",
  fields: [{
    id: "sample-goal",
    type: "shortText",
    label: "Sample goal",
    required: true,
  }],
};

function createIpcMain() {
  const handlers = new Map();
  return {
    handlers,
    handle(channel, handler) {
      handlers.set(channel, handler);
    },
    removeHandler(channel) {
      handlers.delete(channel);
    },
  };
}

function createDependencies() {
  let state = {
    schemaVersion: 1,
    setupCompleted: false,
    codexConnected: false,
    onboardingResponses: {},
    updatedAt: "2026-07-30T00:00:00.000Z",
  };
  return {
    auth: {
      readAccount: async () => ({
        connected: true,
        accountType: "chatgpt",
        email: "learner@example.com",
        requiresOpenaiAuth: true,
      }),
      startBrowserLogin: async () => ({
        loginId: "login-1",
        status: "waitingForCallback",
      }),
      startDeviceLogin: async () => ({
        loginId: "device-1",
        verificationUrl: "https://auth.openai.com/codex/device",
        userCode: "ABCD",
        status: "deviceCode",
      }),
      cancelLogin: async () => undefined,
    },
    store: {
      get lastRecovery() {
        return null;
      },
      read: async () => structuredClone(state),
      write: async (next) => {
        state = structuredClone(next);
        return structuredClone(state);
      },
      reset: async () => undefined,
    },
    getState: () => structuredClone(state),
  };
}

test("exports the exact frozen channel contract", () => {
  const legacyChannels = {
    GET_STATUS: "setup:get-status",
    START_BROWSER_LOGIN: "auth:start-browser-login",
    START_DEVICE_LOGIN: "auth:start-device-login",
    CANCEL_LOGIN: "auth:cancel-login",
    RETRY_APP_SERVER: "auth:retry-app-server",
    AUTH_STATUS_CHANGED: "auth:status-changed",
    GET_CONTENT: "setup:get-content",
    SAVE_RESPONSES: "setup:save-responses",
    REOPEN_SETUP: "setup:reopen",
  };
  assert.deepEqual(
    Object.fromEntries(
      Object.keys(legacyChannels).map((key) => [key, CHANNELS[key]]),
    ),
    legacyChannels,
  );
  assert.equal(Object.isFrozen(CHANNELS), true);
});

test("registers only fixed handlers and unregisters exactly those handlers", () => {
  const ipcMain = createIpcMain();
  const deps = createDependencies();
  const unregister = registerIpcHandlers({
    ipcMain,
    ...deps,
    content,
    retryAppServer: async () => ({}),
    clock: () => new Date("2026-07-30T01:00:00.000Z"),
  });

  assert.deepEqual(
    [...ipcMain.handlers.keys()].sort(),
    Object.values(CHANNELS)
      .filter((channel) => !channel.startsWith("practice:"))
      .filter((channel) => channel !== CHANNELS.AUTH_STATUS_CHANGED)
      .sort(),
  );

  unregister();
  assert.equal(ipcMain.handlers.size, 0);
});

test("returns display-safe status without filesystem or raw auth data", async () => {
  const ipcMain = createIpcMain();
  const deps = createDependencies();
  registerIpcHandlers({
    ipcMain,
    ...deps,
    content,
    retryAppServer: async () => ({}),
  });

  const result = await ipcMain.handlers.get(CHANNELS.GET_STATUS)();

  assert.equal(result.ok, true);
  assert.equal(result.value.account.email, "learner@example.com");
  assert.doesNotMatch(
    JSON.stringify(result),
    /userDataPath|accessToken|refreshToken|authUrl|child/i,
  );
});

test("returns saved setup when the live account check is unavailable", async () => {
  const ipcMain = createIpcMain();
  const deps = createDependencies();
  deps.auth.readAccount = async () => {
    throw new Error("App Server unavailable");
  };
  registerIpcHandlers({
    ipcMain,
    ...deps,
    content,
    retryAppServer: async () => ({}),
  });

  const result = await ipcMain.handlers.get(CHANNELS.GET_STATUS)();

  assert.equal(result.ok, true);
  assert.equal(result.value.setupCompleted, false);
  assert.deepEqual(result.value.onboardingResponses, {});
  assert.deepEqual(result.value.account, { connected: false });
  assert.equal(result.value.connectionUnavailable, true);
});

test("validates declared responses before completing and storing setup", async () => {
  const ipcMain = createIpcMain();
  const deps = createDependencies();
  registerIpcHandlers({
    ipcMain,
    ...deps,
    content,
    retryAppServer: async () => ({}),
    clock: () => new Date("2026-07-30T01:00:00.000Z"),
  });

  const invalid = await ipcMain.handlers.get(CHANNELS.SAVE_RESPONSES)(
    {},
    { responses: { unknown: "secret" } },
  );
  assert.deepEqual(invalid, {
    ok: false,
    error: {
      code: "INVALID_RESPONSES",
      message: "The fixture responses are invalid.",
      recoveryAction: "Review the highlighted sample fields and try again.",
    },
  });

  const saved = await ipcMain.handlers.get(CHANNELS.SAVE_RESPONSES)(
    {},
    { responses: { "sample-goal": "Test the setup" } },
  );
  assert.equal(saved.ok, true);
  assert.equal(deps.getState().setupCompleted, true);
  assert.equal(deps.getState().updatedAt, "2026-07-30T01:00:00.000Z");
});

test("preload exposes named methods without generic renderer transport", async () => {
  const source = await readFile(
    new URL("../src/preload/preload.cjs", import.meta.url),
    "utf8",
  );

  for (const name of [
    "getStatus",
    "startBrowserLogin",
    "startDeviceLogin",
    "cancelLogin",
    "retryAppServer",
    "onAuthStatusChanged",
    "getContent",
    "saveResponses",
    "reopenSetup",
  ]) {
    assert.match(source, new RegExp(`${name}\\s*:`));
  }
  assert.doesNotMatch(source, /ipcRenderer\.send/);
  assert.match(source, /require\("electron"\)/);
  assert.doesNotMatch(source, /require\(["']\.\.?[\\/]/);
  assert.doesNotMatch(source, /node:fs|child_process|process\.env|^\s*import\s/m);
  assert.match(source, /CHANNELS\.AUTH_STATUS_CHANGED/);
  assert.match(source, /removeListener\(CHANNELS\.AUTH_STATUS_CHANGED, wrapped\)/);
  assert.match(source, /listener\(status\)/);
  assert.doesNotMatch(source, /listener\(_?event/);
});

test("main process composes secure services and guarded development hooks", async () => {
  const source = await readFile(
    new URL("../src/main/main.mjs", import.meta.url),
    "utf8",
  );

  for (const moduleName of [
    "window-policy.mjs",
    "setup-store.mjs",
    "codex-app-server-client.mjs",
    "auth-service.mjs",
    "content-schema.mjs",
    "ipc-handlers.mjs",
  ]) {
    assert.match(source, new RegExp(moduleName.replaceAll(".", "\\.")));
  }
  assert.match(source, /app\.getPath\("userData"\)/);
  assert.match(source, /stopClientBounded\(client/);
  assert.match(
    source,
    /process\.env\.NODE_ENV === "test"\s*&&\s*!app\.isPackaged/,
  );
  assert.match(source, /COURSE_MOCK_USER_DATA_DIR/);
  assert.match(source, /COURSE_MOCK_FORCE_DISCONNECTED/);
  assert.match(source, /requestSingleInstanceLock/);
  assert.doesNotMatch(source, /\.codex[\\/]auth\.json|auth\.json/);
});

test("unit script preserves setup coverage and includes Practice tests in order", async () => {
  const packageJson = JSON.parse(await readFile(
    new URL("../package.json", import.meta.url),
    "utf8",
  ));
  const command = packageJson.scripts["test:unit"];
  const existingTests = [
    "tests/content-schema.test.mjs",
    "tests/setup-detection.test.mjs",
    "tests/setup-store.test.mjs",
    "tests/app-server-client.test.mjs",
    "tests/auth-service.test.mjs",
    "tests/window-policy.test.mjs",
    "tests/onboarding-state.test.mjs",
    "tests/ipc-contract.test.mjs",
    "tests/launcher-contract.test.mjs",
  ];
  const practiceTests = [
    "tests/practice-contracts.test.mjs",
    "tests/practice-store.test.mjs",
    "tests/practice-session-reducer.test.mjs",
    "tests/practice-workspace-state.test.mjs",
    "tests/practice-workspace-migration.test.mjs",
    "tests/executor-conversation-service.test.mjs",
    "tests/executor-activity-reader.test.mjs",
    "tests/teacher-context-broker.test.mjs",
    "tests/teacher-adapter.test.mjs",
    "tests/teacher-probe.test.mjs",
    "tests/practice-orchestrator.test.mjs",
    "tests/practice-ipc-contract.test.mjs",
    "tests/window-coordinator.test.mjs",
    "tests/practice-renderer.test.mjs",
    "tests/compact-renderers.test.mjs",
  ];

  assert.equal(command, `node --test ${[...existingTests, ...practiceTests].join(" ")}`);
});

test("main process composes one shared Practice lifecycle and coordinated windows", async () => {
  const source = await readFile(
    new URL("../src/main/main.mjs", import.meta.url),
    "utf8",
  );

  for (const moduleName of [
    "mission-repository.mjs",
    "practice-store.mjs",
    "executor-conversation-service.mjs",
    "executor-activity-reader.mjs",
    "teacher-adapter.mjs",
    "practice-orchestrator.mjs",
    "practice-ipc-handlers.mjs",
    "window-coordinator.mjs",
  ]) {
    assert.match(source, new RegExp(moduleName.replaceAll(".", "\\.")));
  }

  assert.equal(source.match(/client\s*=\s*createCodexClient\(\)/g)?.length, 1);
  assert.match(source, /path\.join\(userDataPath\(\),\s*"teacher-sandbox"\)/);
  assert.match(source, /mkdir\(teacherCwd,\s*\{\s*recursive:\s*true\s*\}\)/);
  assert.match(source, /createAppServerTeacherAdapter\(\{\s*client,\s*teacherCwd,\s*\}\)/);
  assert.match(source, /practice\.module-0\.fixture\.json/);
  assert.match(source, /repositoryRoot:\s*path\.resolve\(mockRoot,\s*"\.\.",\s*"\.\."\)/);
  assert.match(source, /registerIpcHandlers\(\{/);
  assert.match(source, /registerPracticeIpcHandlers\(\{/);
  assert.match(source, /toBubbleViewModel/);
  assert.match(source, /toQuickChatViewModel/);
  assert.match(source, /orchestrator\.onChange\(\(viewModel\)\s*=>\s*\{/);
  assert.match(source, /coordinatorOwnership\.current\(\)\?\.broadcast\(viewModel\)/);
  assert.match(source, /second-instance[\s\S]*?ensureCurrentMainWindow\(\{\s*expand:\s*true\s*\}\)/);
  assert.match(source, /activate[\s\S]*?ensureCurrentMainWindow\(\)/);
  assert.doesNotMatch(source, /BrowserWindow\.getAllWindows\(\)/);
  assert.match(source, /runOwnedStartup\(\{/);
  assert.match(source, /return ensureUsableCoordinatorMain\(\{/);
  assert.doesNotMatch(source, /\.codex[\\/]auth\.json|auth\.json/);

  const cleanupOrder = [
    "unregisterIpc()",
    "unregisterPracticeIpc()",
    "removeAuthForwarder()",
    "removePracticeForwarder()",
    "coordinatorOwnership.disposeCurrent()",
    "await orchestrator?.dispose()",
    "auth?.dispose()",
    "await stopClientBounded(client",
  ];
  let cursor = source.indexOf("const cleanupController");
  assert.notEqual(cursor, -1);
  for (const marker of cleanupOrder) {
    const next = source.indexOf(marker, cursor);
    assert.notEqual(next, -1, `missing cleanup marker: ${marker}`);
    assert.ok(next >= cursor, `cleanup marker out of order: ${marker}`);
    cursor = next;
  }
  assert.match(source, /APP_SERVER_START_TIMEOUT_MS = 2_000/);
  assert.match(source, /APP_SERVER_STOP_TIMEOUT_MS = 1_500/);
  assert.match(source, /await cleanup\(\);\s*app\.exit\(1\)/);
});


let mainLifecycleHelpersPromise;

function loadMainLifecycleHelpers() {
  if (mainLifecycleHelpersPromise) return mainLifecycleHelpersPromise;
  const electronModuleUrl = "task11-electron:stub";
  const hooks = registerHooks({
    resolve(specifier, context, nextResolve) {
      if (specifier === "electron") {
        return { url: electronModuleUrl, shortCircuit: true };
      }
      return nextResolve(specifier, context);
    },
    load(url, context, nextLoad) {
      if (url === electronModuleUrl) {
        return {
          format: "module",
          shortCircuit: true,
          source: `
            export const app = {
              isPackaged: true,
              isReady: () => true,
              whenReady: () => Promise.resolve(),
              disableHardwareAcceleration() {},
              setPath() {},
              getPath: () => "C:/task-11-test",
              requestSingleInstanceLock: () => false,
              quit() {},
              exit() {},
              on() {},
            };
            export class BrowserWindow {
              static getAllWindows() { return []; }
            }
            export const ipcMain = {};
            export const Menu = {};
            export const screen = {};
            export const shell = { openExternal: async () => undefined };
          `,
        };
      }
      return nextLoad(url, context);
    },
  });
  mainLifecycleHelpersPromise = import(
    new URL("../src/main/main.mjs?task-11-lifecycle-contract=1", import.meta.url)
  ).finally(() => hooks.deregister());
  return mainLifecycleHelpersPromise;
}

function createFakeCoordinator(label, {
  expandTeacher = async () => true,
} = {}) {
  const mainWindow = new EventEmitter();
  mainWindow.destroyed = false;
  mainWindow.isDestroyed = () => mainWindow.destroyed;
  const compactWindows = [
    { label: `${label}-bubble`, closed: false },
    { label: `${label}-quick-chat`, closed: false },
  ];
  let disposeCount = 0;
  return {
    label,
    mainWindow,
    compactWindows,
    get disposeCount() {
      return disposeCount;
    },
    getMainWindow: () => mainWindow,
    expandTeacher,
    dispose() {
      disposeCount += 1;
      for (const compactWindow of compactWindows) compactWindow.closed = true;
    },
  };
}

test("coordinator ownership closes hidden compact windows and ignores stale main-close races", async () => {
  const { createCoordinatorOwnership } = await loadMainLifecycleHelpers();
  const released = [];
  const ownership = createCoordinatorOwnership({
    onReleased: (coordinator) => released.push(coordinator.label),
  });

  const first = createFakeCoordinator("first");
  ownership.install(first);
  assert.equal(ownership.hasUsableMain(), true);
  first.mainWindow.destroyed = true;
  first.mainWindow.emit("closed");

  assert.equal(ownership.current(), null);
  assert.deepEqual(first.compactWindows.map(({ closed }) => closed), [true, true]);
  assert.deepEqual(released, ["first"]);

  const oldCoordinator = createFakeCoordinator("old");
  const currentCoordinator = createFakeCoordinator("current");
  ownership.install(oldCoordinator);
  ownership.install(currentCoordinator);
  oldCoordinator.mainWindow.destroyed = true;
  oldCoordinator.mainWindow.emit("closed");

  assert.equal(ownership.current(), currentCoordinator);
  assert.equal(ownership.hasUsableMain(), true);
  assert.equal(currentCoordinator.disposeCount, 0);

  currentCoordinator.mainWindow.destroyed = true;
  assert.equal(ownership.hasUsableMain(), false);
  currentCoordinator.mainWindow.emit("closed");
  assert.equal(ownership.current(), null);
  assert.deepEqual(
    currentCoordinator.compactWindows.map(({ closed }) => closed),
    [true, true],
  );
});



test("current-main recovery replaces a coordinator released during awaited expansion", async () => {
  const {
    createCoordinatorOwnership,
    ensureUsableCoordinatorMain,
  } = await loadMainLifecycleHelpers();
  const ownership = createCoordinatorOwnership();
  let resolveFirstExpansion;
  let secondExpansionCalls = 0;
  const first = createFakeCoordinator("first", {
    expandTeacher: () => new Promise((resolve) => {
      resolveFirstExpansion = resolve;
    }),
  });
  const second = createFakeCoordinator("second", {
    expandTeacher: async () => {
      secondExpansionCalls += 1;
      second.mainWindow.focused = true;
      return true;
    },
  });
  ownership.install(first);
  let acquisitionCalls = 0;

  const recovery = ensureUsableCoordinatorMain({
    ownership,
    expand: true,
    acquire: async () => {
      acquisitionCalls += 1;
      ownership.install(second);
      return second.mainWindow;
    },
  });
  await Promise.resolve();
  assert.equal(typeof resolveFirstExpansion, "function");

  first.mainWindow.destroyed = true;
  first.mainWindow.emit("closed");
  resolveFirstExpansion(false);

  const recoveredMain = await recovery;
  assert.equal(recoveredMain, second.mainWindow);
  assert.equal(recoveredMain.isDestroyed(), false);
  assert.equal(ownership.current(), second);
  assert.equal(acquisitionCalls, 1);
  assert.equal(secondExpansionCalls, 1);
  assert.equal(second.mainWindow.focused, true);
});

test("current-main recovery retries expansion failure once and never loops indefinitely", async () => {
  const {
    createCoordinatorOwnership,
    ensureUsableCoordinatorMain,
  } = await loadMainLifecycleHelpers();

  for (const firstOutcome of ["false", "throw"]) {
    const ownership = createCoordinatorOwnership();
    let expansionCalls = 0;
    const coordinator = createFakeCoordinator(firstOutcome, {
      expandTeacher: async () => {
        expansionCalls += 1;
        if (expansionCalls === 1 && firstOutcome === "throw") {
          throw new Error("stale expansion");
        }
        return expansionCalls > 1;
      },
    });
    ownership.install(coordinator);

    assert.equal(await ensureUsableCoordinatorMain({
      ownership,
      acquire: async () => {
        throw new Error("usable current coordinator must not be replaced");
      },
      expand: true,
    }), coordinator.mainWindow);
    assert.equal(expansionCalls, 2);
  }

  const ownership = createCoordinatorOwnership();
  let boundedCalls = 0;
  const neverExpanded = createFakeCoordinator("never-expanded", {
    expandTeacher: async () => {
      boundedCalls += 1;
      return false;
    },
  });
  ownership.install(neverExpanded);
  assert.equal(await ensureUsableCoordinatorMain({
    ownership,
    acquire: async () => neverExpanded.mainWindow,
    expand: true,
  }), null);
  assert.equal(boundedCalls, 2);
});

test("bounded App Server startup clears hanging and rejected children before clean retry", async () => {
  const { startClientWithBoundedCleanup } = await loadMainLifecycleHelpers();

  for (const firstFailure of ["hang", "reject"]) {
    let attempt = 0;
    let live = false;
    let stops = 0;
    const client = {
      async start() {
        if (live) {
          throw Object.assign(new Error("already started"), {
            code: "APP_SERVER_ALREADY_STARTED",
          });
        }
        live = true;
        attempt += 1;
        if (attempt === 1 && firstFailure === "hang") {
          return new Promise(() => {});
        }
        if (attempt === 1) throw new Error("initialize rejected");
      },
      async stop() {
        stops += 1;
        live = false;
      },
    };

    assert.equal(await startClientWithBoundedCleanup({
      client,
      startTimeoutMs: 10,
      stopTimeoutMs: 10,
    }), false);
    assert.equal(live, false);
    assert.equal(stops, 1);

    assert.equal(await startClientWithBoundedCleanup({
      client,
      startTimeoutMs: 10,
      stopTimeoutMs: 10,
    }), true);
    assert.equal(attempt, 2);
    assert.equal(live, true);
    await client.stop();
  }

  let cancelledStops = 0;
  const cancelledClient = {
    start: async () => undefined,
    stop: async () => {
      cancelledStops += 1;
    },
  };
  assert.equal(await startClientWithBoundedCleanup({
    client: cancelledClient,
    startTimeoutMs: 10,
    stopTimeoutMs: 10,
    isCurrent: () => false,
  }), false);
  assert.equal(cancelledStops, 1);
});

test("owned startup cleans partial acquisitions in exact order and cleanup is single-flight", async () => {
  const {
    createLifecycleGate,
    createOrderedCleanup,
    runOwnedStartup,
  } = await loadMainLifecycleHelpers();
  const acquisitionOrder = [
    "client",
    "auth",
    "orchestrator",
    "coordinator",
    "ipc",
  ];
  const cleanupOrder = [
    "ipc",
    "coordinator",
    "orchestrator",
    "auth",
    "client",
  ];

  for (const failedStage of ["client", "orchestrator", "ipc"]) {
    const gate = createLifecycleGate();
    const acquired = new Set();
    const cleaned = [];
    const cleanup = createOrderedCleanup({
      onStart: () => gate.cancel(),
      steps: cleanupOrder.map((resource) => async () => {
        if (acquired.has(resource)) cleaned.push(resource);
      }),
    });

    await assert.rejects(runOwnedStartup({
      gate,
      cleanup: cleanup.run,
      start: async ({ assertCurrent }) => {
        for (const resource of acquisitionOrder) {
          acquired.add(resource);
          await Promise.resolve();
          assertCurrent();
          if (resource === failedStage) {
            throw new Error(`failed at ${resource}`);
          }
        }
      },
    }), new RegExp(`failed at ${failedStage}`));

    assert.deepEqual(
      cleaned,
      cleanupOrder.filter((resource) => acquired.has(resource)),
    );
    assert.equal(cleanup.finished(), true);
  }

  let releaseStep;
  let stepCalls = 0;
  const cleanup = createOrderedCleanup({
    steps: [async () => {
      stepCalls += 1;
      await new Promise((resolve) => {
        releaseStep = resolve;
      });
    }],
  });
  const first = cleanup.run();
  const second = cleanup.run();
  assert.equal(first, second);
  releaseStep();
  await Promise.all([first, second]);
  assert.equal(stepCalls, 1);
});


function startFixtureProtocol({ restartRevalidation = false } = {}) {
  const fixturePath = fileURLToPath(new URL(
    "./fixtures/fake-app-server.mjs",
    import.meta.url,
  ));
  const child = spawn(process.execPath, [fixturePath], {
    env: {
      ...process.env,
      ...(restartRevalidation
        ? { COURSE_MOCK_RESTART_REVALIDATION: "1" }
        : {}),
    },
    stdio: ["pipe", "pipe", "pipe"],
    windowsHide: true,
  });
  child.stderr.resume();
  let nextId = 1;
  let buffer = "";
  const pending = new Map();
  child.stdout.setEncoding("utf8");
  child.stdout.on("data", (chunk) => {
    buffer += chunk;
    let newline = buffer.indexOf("\n");
    while (newline >= 0) {
      const line = buffer.slice(0, newline);
      buffer = buffer.slice(newline + 1);
      if (line) {
        const message = JSON.parse(line);
        const request = pending.get(message.id);
        if (request) {
          pending.delete(message.id);
          if (message.error) request.reject(new Error(message.error.message));
          else request.resolve(message.result);
        }
      }
      newline = buffer.indexOf("\n");
    }
  });
  child.once("exit", () => {
    for (const request of pending.values()) {
      request.reject(new Error("Fixture exited before responding."));
    }
    pending.clear();
  });

  return {
    request(method, params = {}) {
      const id = nextId++;
      const response = new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
      });
      child.stdin.write(`${JSON.stringify({ id, method, params })}\n`);
      return response;
    },
    close() {
      child.stdin.end();
      if (child.exitCode === null) child.kill();
    },
  };
}

function finalActivityText(thread) {
  return thread.turns
    .flatMap((turn) => turn.items ?? [])
    .find((item) => item.type === "agentMessage" && item.phase === "final_answer")
    ?.text;
}

test("restart-signaled fake revalidates the same bound task with a distinct report", async (t) => {
  const normal = startFixtureProtocol();
  t.after(() => normal.close());
  await normal.request("initialize", {});
  const initialRead = await normal.request("thread/read", {
    threadId: "thr-practice-1",
    includeTurns: true,
  });
  const canonical = finalActivityText(initialRead.thread);
  assert.match(canonical, /ContentPilot Lite contains Brand Brain/);
  assert.doesNotMatch(canonical, /RESTART_REVALIDATED_BOUND_TASK/);

  const restart = startFixtureProtocol({ restartRevalidation: true });
  t.after(() => restart.close());
  await restart.request("initialize", {});
  const revalidatedRead = await restart.request("thread/read", {
    threadId: "thr-practice-1",
    includeTurns: true,
  });
  const revalidatedResume = await restart.request("thread/resume", {
    threadId: "thr-practice-1",
  });
  const readReport = finalActivityText(revalidatedRead.thread);
  const resumedReport = finalActivityText(revalidatedResume.thread);

  assert.equal(revalidatedRead.thread.id, "thr-practice-1");
  assert.equal(revalidatedResume.thread.id, "thr-practice-1");
  assert.match(readReport, /RESTART_REVALIDATED_BOUND_TASK/);
  assert.equal(resumedReport, readReport);
  assert.notEqual(readReport, canonical);
  assert.doesNotMatch(JSON.stringify(revalidatedRead), /DECOY/);
  assert.doesNotMatch(JSON.stringify(revalidatedResume), /DECOY/);
});
