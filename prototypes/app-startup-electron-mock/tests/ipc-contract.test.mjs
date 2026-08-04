import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

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
  assert.match(source, /client\.stop\(\)/);
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
    "tests/executor-conversation-service.test.mjs",
    "tests/executor-activity-reader.test.mjs",
    "tests/teacher-context-broker.test.mjs",
    "tests/teacher-adapter.test.mjs",
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
  assert.match(source, /createAppServerTeacherAdapter\(\{\s*client,\s*teacherCwd\s*\}\)/);
  assert.match(source, /practice\.module-0\.fixture\.json/);
  assert.match(source, /repositoryRoot:\s*path\.resolve\(mockRoot,\s*"\.\.",\s*"\.\."\)/);
  assert.match(source, /registerIpcHandlers\(\{/);
  assert.match(source, /registerPracticeIpcHandlers\(\{/);
  assert.match(source, /toBubbleViewModel/);
  assert.match(source, /toQuickChatViewModel/);
  assert.match(source, /orchestrator\.onChange\(\(viewModel\)\s*=>\s*\{/);
  assert.match(source, /windowCoordinator\?\.broadcast\(viewModel\)/);
  assert.match(source, /second-instance[\s\S]*?expandTeacher\(\)/);
  assert.doesNotMatch(source, /\.codex[\\/]auth\.json|auth\.json/);

  const cleanupOrder = [
    "unregisterIpc()",
    "unregisterPracticeIpc()",
    "removeAuthForwarder()",
    "removePracticeForwarder()",
    "windowCoordinator?.dispose()",
    "await orchestrator?.dispose()",
    "auth?.dispose()",
    "client.stop()",
  ];
  let cursor = source.indexOf("async function cleanup");
  assert.notEqual(cursor, -1);
  for (const marker of cleanupOrder) {
    const next = source.indexOf(marker, cursor);
    assert.notEqual(next, -1, `missing cleanup marker: ${marker}`);
    assert.ok(next >= cursor, `cleanup marker out of order: ${marker}`);
    cursor = next;
  }
  assert.match(source, /setTimeout\(resolve,\s*1_500\)/);
});
