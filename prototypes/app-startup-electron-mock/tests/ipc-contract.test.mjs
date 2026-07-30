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
  assert.deepEqual(CHANNELS, {
    GET_STATUS: "setup:get-status",
    START_BROWSER_LOGIN: "auth:start-browser-login",
    START_DEVICE_LOGIN: "auth:start-device-login",
    CANCEL_LOGIN: "auth:cancel-login",
    RETRY_APP_SERVER: "auth:retry-app-server",
    AUTH_STATUS_CHANGED: "auth:status-changed",
    GET_CONTENT: "setup:get-content",
    SAVE_RESPONSES: "setup:save-responses",
    REOPEN_SETUP: "setup:reopen",
  });
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
    new URL("../src/preload/preload.mjs", import.meta.url),
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
  assert.doesNotMatch(source, /node:fs|child_process|process\.env/);
  assert.match(source, /CHANNELS\.AUTH_STATUS_CHANGED/);
  assert.match(source, /removeListener\(CHANNELS\.AUTH_STATUS_CHANGED, wrapped\)/);
  assert.match(source, /listener\(status\)/);
  assert.doesNotMatch(source, /listener\(_?event/);
});
