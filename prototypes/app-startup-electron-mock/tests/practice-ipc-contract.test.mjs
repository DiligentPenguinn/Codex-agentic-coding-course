import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { runInNewContext } from "node:vm";

import {
  registerPracticeIpcHandlers,
  toBubbleViewModel,
  toQuickChatViewModel,
} from "../src/main/practice-ipc-handlers.mjs";
import { CHANNELS } from "../src/shared/channels.mjs";

const LEGACY_CHANNELS = Object.freeze({
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

const PRACTICE_CHANNELS = Object.freeze({
  PRACTICE_GET_STATE: "practice:get-state",
  PRACTICE_GET_BUBBLE_STATE: "practice:get-bubble-state",
  PRACTICE_GET_QUICK_STATE: "practice:get-quick-state",
  PRACTICE_START: "practice:start",
  PRACTICE_CREATE_TASK: "practice:create-task",
  PRACTICE_LIST_TASKS: "practice:list-tasks",
  PRACTICE_BIND_TASK: "practice:bind-task",
  PRACTICE_REBIND: "practice:rebind",
  PRACTICE_OPEN_TASK: "practice:open-task",
  PRACTICE_RETRY: "practice:retry",
  PRACTICE_SEND_TEACHER: "practice:send-teacher",
  PRACTICE_SELECT_TAB: "practice:select-tab",
  PRACTICE_COMPACT: "practice:compact",
  PRACTICE_OPEN_QUICK_CHAT: "practice:open-quick-chat",
  PRACTICE_TOGGLE_QUICK_CHAT: "practice:toggle-quick-chat",
  PRACTICE_CLOSE_QUICK_CHAT: "practice:close-quick-chat",
  PRACTICE_EXPAND: "practice:expand",
  PRACTICE_PAUSE: "practice:pause",
  PRACTICE_BUBBLE_MENU: "practice:bubble-menu",
  PRACTICE_QUIT: "practice:quit",
  PRACTICE_STATE_CHANGED: "practice:state-changed",
});

const fullViewModel = {
  session: {
    sessionId: "private-session",
    mission: { title: "private-mission" },
    executor: {
      status: "working",
      freshness: "fresh",
      observedAt: "2026-08-03T10:00:00.000Z",
      taskId: "private-task-id",
      taskName: "private-task-name",
      handoff: { opened: true, fallbackName: "private-handoff" },
      changedFiles: ["private-file.txt"],
    },
    contextReceipt: { summary: "private-context" },
    eligibleTasks: [{ threadId: "private-eligible-task" }],
    teacherChat: [
      { id: "learner-1", role: "learner", text: "Help", createdAt: "2026-08-03T10:01:00.000Z" },
      { id: "teacher-1", role: "teacher", text: "First", createdAt: "2026-08-03T10:02:00.000Z" },
      { id: "teacher-2", role: "teacher", text: "Newest", createdAt: "2026-08-03T10:03:00.000Z" },
    ],
    error: "A display-safe error.",
  },
  presentation: { mode: "full", lastFullTab: "teacher" },
};

function createIpcMain() {
  const handlers = new Map();
  return {
    handlers,
    handle(channel, handler) {
      assert.equal(handlers.has(channel), false, `duplicate handler: ${channel}`);
      handlers.set(channel, handler);
    },
    removeHandler(channel) {
      handlers.delete(channel);
    },
  };
}

function createDependencies({ failure } = {}) {
  const calls = [];
  const operation = (owner, name, value) => (...args) => {
    calls.push({ owner, name, args });
    if (failure) throw new Error(failure);
    return structuredClone(value);
  };
  const orchestrator = {
    getViewModel: operation("orchestrator", "getViewModel", fullViewModel),
    startPractice: operation("orchestrator", "startPractice", { operation: "startPractice" }),
    createDedicatedTask: operation("orchestrator", "createDedicatedTask", { operation: "createDedicatedTask" }),
    listEligibleTasks: operation("orchestrator", "listEligibleTasks", [{ threadId: "eligible_1" }]),
    bindExistingTask: operation("orchestrator", "bindExistingTask", { operation: "bindExistingTask" }),
    requestRebind: operation("orchestrator", "requestRebind", { operation: "requestRebind" }),
    openBoundTask: operation("orchestrator", "openBoundTask", { operation: "openBoundTask" }),
    retryObservation: operation("orchestrator", "retryObservation", { operation: "retryObservation" }),
    sendTeacherMessage: operation("orchestrator", "sendTeacherMessage", { operation: "sendTeacherMessage" }),
    selectTab: operation("orchestrator", "selectTab", { operation: "selectTab" }),
    pause: operation("orchestrator", "pause", { operation: "pause" }),
  };
  const windowActions = {
    compact: operation("windowActions", "compact", { operation: "compact" }),
    openQuickChat: operation("windowActions", "openQuickChat", { operation: "openQuickChat" }),
    toggleQuickChat: operation("windowActions", "toggleQuickChat", { operation: "toggleQuickChat" }),
    closeQuickChat: operation("windowActions", "closeQuickChat", { operation: "closeQuickChat" }),
    expandTeacher: operation("windowActions", "expandTeacher", { operation: "expandTeacher" }),
    openBubbleMenu: operation("windowActions", "openBubbleMenu", { operation: "openBubbleMenu" }),
    quit: operation("windowActions", "quit", { operation: "quit" }),
  };
  return { calls, orchestrator, windowActions };
}

function register(options = {}) {
  const ipcMain = createIpcMain();
  const dependencies = createDependencies(options);
  const unregister = registerPracticeIpcHandlers({ ipcMain, ...dependencies });
  return { ipcMain, unregister, ...dependencies };
}

function assertSanitizedFailure(result) {
  assert.equal(result.ok, false);
  assert.deepEqual(Object.keys(result), ["ok", "error"]);
  assert.deepEqual(
    Object.keys(result.error).sort(),
    ["code", "message", "recoveryAction"],
  );
  assert.equal(typeof result.error.code, "string");
  assert.equal(typeof result.error.message, "string");
  assert.equal(typeof result.error.recoveryAction, "string");
  assert.doesNotMatch(JSON.stringify(result), /stack|private-provider-detail|raw-secret/i);
}

test("keeps setup and auth channels unchanged and adds the exact Practice channels", () => {
  for (const [key, value] of Object.entries({ ...LEGACY_CHANNELS, ...PRACTICE_CHANNELS })) {
    assert.equal(CHANNELS[key], value, key);
  }
  assert.deepEqual(Object.keys(CHANNELS).sort(), [
    ...Object.keys(LEGACY_CHANNELS),
    ...Object.keys(PRACTICE_CHANNELS),
  ].sort());
  assert.equal(Object.isFrozen(CHANNELS), true);
});

test("registers and unregisters every fixed Practice invoke handler", () => {
  const { ipcMain, unregister } = register();
  assert.deepEqual(
    [...ipcMain.handlers.keys()].sort(),
    Object.values(PRACTICE_CHANNELS)
      .filter((channel) => channel !== PRACTICE_CHANNELS.PRACTICE_STATE_CHANGED)
      .sort(),
  );
  unregister();
  assert.equal(ipcMain.handlers.size, 0);
});

test("routes each invoke channel to exactly one named operation", async () => {
  const sender = { id: "bubble-sender" };
  const cases = [
    [PRACTICE_CHANNELS.PRACTICE_GET_STATE, undefined, "orchestrator", "getViewModel", []],
    [PRACTICE_CHANNELS.PRACTICE_GET_BUBBLE_STATE, undefined, "orchestrator", "getViewModel", []],
    [PRACTICE_CHANNELS.PRACTICE_GET_QUICK_STATE, undefined, "orchestrator", "getViewModel", []],
    [PRACTICE_CHANNELS.PRACTICE_START, undefined, "orchestrator", "startPractice", []],
    [PRACTICE_CHANNELS.PRACTICE_CREATE_TASK, undefined, "orchestrator", "createDedicatedTask", []],
    [PRACTICE_CHANNELS.PRACTICE_LIST_TASKS, undefined, "orchestrator", "listEligibleTasks", []],
    [PRACTICE_CHANNELS.PRACTICE_BIND_TASK, { threadId: "thread_7" }, "orchestrator", "bindExistingTask", ["thread_7"]],
    [PRACTICE_CHANNELS.PRACTICE_REBIND, undefined, "orchestrator", "requestRebind", []],
    [PRACTICE_CHANNELS.PRACTICE_OPEN_TASK, undefined, "orchestrator", "openBoundTask", []],
    [PRACTICE_CHANNELS.PRACTICE_RETRY, undefined, "orchestrator", "retryObservation", []],
    [PRACTICE_CHANNELS.PRACTICE_SEND_TEACHER, { text: "What changed?" }, "orchestrator", "sendTeacherMessage", ["What changed?"]],
    [PRACTICE_CHANNELS.PRACTICE_SELECT_TAB, { tab: "teacher" }, "orchestrator", "selectTab", ["teacher"]],
    [PRACTICE_CHANNELS.PRACTICE_COMPACT, undefined, "windowActions", "compact", []],
    [PRACTICE_CHANNELS.PRACTICE_OPEN_QUICK_CHAT, undefined, "windowActions", "openQuickChat", []],
    [PRACTICE_CHANNELS.PRACTICE_TOGGLE_QUICK_CHAT, undefined, "windowActions", "toggleQuickChat", []],
    [PRACTICE_CHANNELS.PRACTICE_CLOSE_QUICK_CHAT, undefined, "windowActions", "closeQuickChat", []],
    [PRACTICE_CHANNELS.PRACTICE_EXPAND, undefined, "windowActions", "expandTeacher", []],
    [PRACTICE_CHANNELS.PRACTICE_PAUSE, undefined, "orchestrator", "pause", []],
    [PRACTICE_CHANNELS.PRACTICE_BUBBLE_MENU, undefined, "windowActions", "openBubbleMenu", [sender]],
    [PRACTICE_CHANNELS.PRACTICE_QUIT, undefined, "windowActions", "quit", []],
  ];

  for (const [channel, payload, owner, name, args] of cases) {
    const { ipcMain, calls } = register();
    const result = await ipcMain.handlers.get(channel)({ sender }, payload);
    assert.equal(result.ok, true, channel);
    assert.deepEqual(calls, [{ owner, name, args }], channel);
  }
});

test("validates the three payload-bearing operations before dispatch", async () => {
  const invalidCases = [
    [PRACTICE_CHANNELS.PRACTICE_BIND_TASK, undefined],
    [PRACTICE_CHANNELS.PRACTICE_BIND_TASK, { threadId: "../thread" }],
    [PRACTICE_CHANNELS.PRACTICE_BIND_TASK, { threadId: "thread_7", workspacePath: "raw-secret" }],
    [PRACTICE_CHANNELS.PRACTICE_SEND_TEACHER, { text: "   " }],
    [PRACTICE_CHANNELS.PRACTICE_SEND_TEACHER, { text: "x".repeat(4_001) }],
    [PRACTICE_CHANNELS.PRACTICE_SEND_TEACHER, { text: "hello", missionId: "raw-secret" }],
    [PRACTICE_CHANNELS.PRACTICE_SELECT_TAB, { tab: "settings" }],
    [PRACTICE_CHANNELS.PRACTICE_SELECT_TAB, { tab: "exercise", bounds: "raw-secret" }],
  ];

  for (const [channel, payload] of invalidCases) {
    const { ipcMain, calls } = register();
    const result = await ipcMain.handlers.get(channel)({}, payload);
    assertSanitizedFailure(result);
    assert.deepEqual(calls, [], channel);
  }

  const { ipcMain, calls } = register();
  const longestValid = "😀".repeat(4_000);
  const result = await ipcMain.handlers.get(PRACTICE_CHANNELS.PRACTICE_SEND_TEACHER)(
    {},
    { text: longestValid },
  );
  assert.equal(result.ok, true);
  assert.equal(calls[0].args[0], longestValid);
});

test("returns stable sanitized errors and discards caught error objects", async () => {
  const first = register({ failure: "private-provider-detail raw-secret" });
  const second = register({ failure: "a different private-provider-detail" });
  const payloads = new Map([
    [PRACTICE_CHANNELS.PRACTICE_BIND_TASK, { threadId: "thread_7" }],
    [PRACTICE_CHANNELS.PRACTICE_SEND_TEACHER, { text: "Hello" }],
    [PRACTICE_CHANNELS.PRACTICE_SELECT_TAB, { tab: "exercise" }],
  ]);

  for (const channel of first.ipcMain.handlers.keys()) {
    const event = { sender: { secret: "raw-secret" } };
    const payload = payloads.get(channel);
    const firstResult = await first.ipcMain.handlers.get(channel)(event, payload);
    const secondResult = await second.ipcMain.handlers.get(channel)(event, payload);
    assertSanitizedFailure(firstResult);
    assert.deepEqual(firstResult, secondResult, channel);
  }
});

test("maps full state to compact display-safe view models only", () => {
  const bubble = toBubbleViewModel(fullViewModel);
  assert.deepEqual(bubble, {
    executor: { status: "working", freshness: "fresh" },
    newestTeacherMessageId: "teacher-2",
  });
  assert.equal(Object.isFrozen(bubble), true);

  const quickChat = toQuickChatViewModel(fullViewModel);
  assert.deepEqual(quickChat, {
    executor: {
      status: "working",
      freshness: "fresh",
      observedAt: "2026-08-03T10:00:00.000Z",
    },
    teacherChat: fullViewModel.session.teacherChat,
    error: "A display-safe error.",
  });
  assert.notEqual(quickChat.teacherChat, fullViewModel.session.teacherChat);
  assert.equal(Object.isFrozen(quickChat), true);

  for (const compact of [bubble, quickChat]) {
    assert.doesNotMatch(
      JSON.stringify(compact),
      /private-mission|private-task-id|private-task-name|private-file|private-context|private-eligible-task|private-handoff/,
    );
  }
});

function executePreload(
  source,
  invokeResult = (channel) => ({ ok: true, value: channel }),
) {
  const exposed = new Map();
  const invocations = [];
  const listeners = new Map();
  const ipcRenderer = {
    invoke(channel, payload) {
      invocations.push(payload === undefined ? [channel] : [channel, payload]);
      return Promise.resolve(invokeResult(channel, payload));
    },
    on(channel, listener) {
      listeners.set(channel, listener);
    },
    removeListener(channel, listener) {
      if (listeners.get(channel) === listener) listeners.delete(channel);
    },
  };
  const contextBridge = {
    exposeInMainWorld(name, bridge) {
      exposed.set(name, bridge);
    },
  };
  const required = [];
  runInNewContext(source, {
    require(specifier) {
      required.push(specifier);
      if (specifier !== "electron") throw new Error(`Unexpected import: ${specifier}`);
      return { contextBridge, ipcRenderer };
    },
  });
  return { exposed, invocations, listeners, required };
}

function assertSafePreloadSource(source) {
  assert.doesNotMatch(source, /ipcRenderer\.send\b/);
  assert.doesNotMatch(source, /\binvoke\s*:/);
  assert.doesNotMatch(source, /require\(["']\.?\.?[\\/]/);
  assert.doesNotMatch(source, /node:fs|child_process|process\.env|^\s*import\s/m);
  assert.doesNotMatch(source, /listener\(\s*_?event\b/);
  assert.match(source, /require\("electron"\)/);
}

async function readPreload(name) {
  return readFile(new URL(`../src/preload/${name}`, import.meta.url), "utf8");
}

test("full preload preserves courseSetup and exposes only full Practice methods", async () => {
  const source = await readPreload("preload.cjs");
  assertSafePreloadSource(source);
  const runtime = executePreload(source);
  assert.deepEqual(runtime.required, ["electron"]);
  assert.deepEqual([...runtime.exposed.keys()], ["courseSetup", "practice"]);
  assert.deepEqual(Object.keys(runtime.exposed.get("courseSetup")).sort(), [
    "cancelLogin", "getContent", "getStatus", "onAuthStatusChanged",
    "reopenSetup", "retryAppServer", "saveResponses", "startBrowserLogin",
    "startDeviceLogin",
  ]);
  const practice = runtime.exposed.get("practice");
  assert.deepEqual(Object.keys(practice).sort(), [
    "bindTask", "compact", "createTask", "getState", "listTasks",
    "onStateChanged", "openTask", "rebind", "retry", "selectTab",
    "sendTeacherMessage", "start",
  ]);

  await practice.getState();
  await practice.start();
  await practice.createTask();
  await practice.listTasks();
  await practice.bindTask("thread_7");
  await practice.rebind();
  await practice.openTask();
  await practice.retry();
  await practice.sendTeacherMessage("Hello");
  await practice.selectTab("teacher");
  await practice.compact();
  assert.deepEqual(structuredClone(runtime.invocations), [
    ["practice:get-state"],
    ["practice:start"],
    ["practice:create-task"],
    ["practice:list-tasks"],
    ["practice:bind-task", { threadId: "thread_7" }],
    ["practice:rebind"],
    ["practice:open-task"],
    ["practice:retry"],
    ["practice:send-teacher", { text: "Hello" }],
    ["practice:select-tab", { tab: "teacher" }],
    ["practice:compact"],
  ]);
  assertStateListener(practice, runtime.listeners);
});

function assertStateListener(bridge, listeners) {
  const received = [];
  const remove = bridge.onStateChanged((value) => received.push(value));
  const wrapped = listeners.get("practice:state-changed");
  assert.equal(typeof wrapped, "function");
  wrapped({ rawEvent: "raw-secret" }, { safe: true });
  assert.deepEqual(received, [{ safe: true }]);
  remove();
  assert.equal(listeners.has("practice:state-changed"), false);
}

test("bubble preload exposes only its five least-privilege methods", async () => {
  const source = await readPreload("bubble-preload.cjs");
  assertSafePreloadSource(source);
  const runtime = executePreload(source);
  assert.deepEqual(runtime.required, ["electron"]);
  assert.deepEqual([...runtime.exposed.keys()], ["practiceBubble"]);
  const bridge = runtime.exposed.get("practiceBubble");
  assert.deepEqual(Object.keys(bridge).sort(), [
    "expand", "getState", "onStateChanged", "openMenu", "toggleQuickChat",
  ]);
  await bridge.getState();
  await bridge.toggleQuickChat();
  await bridge.expand();
  await bridge.openMenu();
  assert.deepEqual(runtime.invocations, [
    ["practice:get-bubble-state"],
    ["practice:toggle-quick-chat"],
    ["practice:expand"],
    ["practice:bubble-menu"],
  ]);
  assertStateListener(bridge, runtime.listeners);
});

test("quick-chat preload exposes only its five least-privilege methods", async () => {
  const source = await readPreload("quick-chat-preload.cjs");
  assertSafePreloadSource(source);
  const runtime = executePreload(source);
  assert.deepEqual(runtime.required, ["electron"]);
  assert.deepEqual([...runtime.exposed.keys()], ["practiceQuickChat"]);
  const bridge = runtime.exposed.get("practiceQuickChat");
  assert.deepEqual(Object.keys(bridge).sort(), [
    "closeQuickChat", "expand", "getState", "onStateChanged",
    "sendTeacherMessage",
  ]);
  await bridge.getState();
  await bridge.sendTeacherMessage("Hello");
  await bridge.closeQuickChat();
  await bridge.expand();
  assert.deepEqual(structuredClone(runtime.invocations), [
    ["practice:get-quick-state"],
    ["practice:send-teacher", { text: "Hello" }],
    ["practice:close-quick-chat"],
    ["practice:expand"],
  ]);
  assertStateListener(bridge, runtime.listeners);
});

test("quick-chat send resolves with ack-only success and preserves sanitized failure", async () => {
  const source = await readPreload("quick-chat-preload.cjs");
  const privateFullViewModel = {
    session: {
      mission: { title: "private-mission" },
      executor: {
        threadId: "private-thread",
        changedFiles: ["private-file"],
      },
      teacherChat: [{ id: "private-message", role: "teacher", text: "private-answer" }],
    },
  };
  const successRuntime = executePreload(source, (channel) => (
    channel === "practice:send-teacher"
      ? { ok: true, value: privateFullViewModel }
      : { ok: true, value: channel }
  ));
  const success = await successRuntime.exposed
    .get("practiceQuickChat")
    .sendTeacherMessage("Hello");
  assert.deepEqual(structuredClone(success), { ok: true, value: null });
  assert.doesNotMatch(JSON.stringify(success), /private-/);

  const sanitizedFailure = Object.freeze({
    ok: false,
    error: Object.freeze({
      code: "TEACHER_FAILED",
      message: "Teacher could not respond.",
      recoveryAction: "Try again from Practice.",
    }),
  });
  const failureRuntime = executePreload(source, (channel) => (
    channel === "practice:send-teacher"
      ? sanitizedFailure
      : { ok: true, value: channel }
  ));
  const failure = await failureRuntime.exposed
    .get("practiceQuickChat")
    .sendTeacherMessage("Hello");
  assert.equal(failure, sanitizedFailure);
  assert.deepEqual(structuredClone(failure), structuredClone(sanitizedFailure));
});
