import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { CHANNELS } from "../src/shared/channels.mjs";
import {
  registerPracticeWorkspaceIpcHandlers,
  toPracticeWorkspaceViewModel,
} from "../src/main/practice-ipc-handlers.mjs";

const NOW = "2026-08-08T02:00:00.000Z";

function startRequest() {
  return {
    practiceDefinition: {
      id: "mission-1",
      version: "mock-2",
      objective: "Kiểm tra repository mà chưa thay đổi tệp.",
      expectedOutcome: "Có báo cáo ngắn để quyết định bước tiếp theo.",
      steps: [
        { id: "inspect", title: "Kiểm tra ở chế độ chỉ đọc", completionAuthority: "machine" },
        { id: "review", title: "Đọc và giải thích báo cáo", completionAuthority: "teacher" },
      ],
    },
  };
}

function state() {
  return {
    schemaVersion: 2,
    activeRun: {
      runId: "secret-run-id",
      status: "active",
      binding: { threadId: "secret-thread-id", displayName: "Practice hiện tại" },
      checklist: [
        { stepId: "inspect", completionAuthority: "machine", status: "completed", completion: { source: "bound-executor-chat" } },
        { stepId: "review", completionAuthority: "teacher", status: "next", completion: null },
      ],
      startRequest: startRequest(),
    },
    archivedRuns: [{ handoffHash: "a".repeat(64), displayName: "Practice cũ" }],
    pendingTransition: {
      mode: "selective",
      stage: "handoff-prepared",
      handoff: { text: "PRIVATE BOUNDED HANDOFF BODY" },
    },
    presentation: { mode: "compact", activePanel: "progress" },
    updatedAt: NOW,
  };
}

test("workspace ViewModel exposes the layered brief without IDs or handoff body", () => {
  const view = toPracticeWorkspaceViewModel(state(), startRequest());

  assert.deepEqual(view.brief, {
    objective: "Kiểm tra repository mà chưa thay đổi tệp.",
    expectedOutcome: "Có báo cáo ngắn để quyết định bước tiếp theo.",
  });
  assert.equal(view.activeRun.executorChatName, "Practice hiện tại");
  assert.deepEqual(view.activeRun.steps.map((step) => step.status), ["completed", "next"]);
  assert.deepEqual(view.transition, {
    mode: "selective",
    stage: "handoff-prepared",
    label: "Đang gắn phần tóm tắt đã chọn lọc…",
    canCancel: true,
  });
  assert.equal(view.archivedRunCount, 1);
  assert.equal(JSON.stringify(view).includes("secret-thread-id"), false);
  assert.equal(JSON.stringify(view).includes("secret-run-id"), false);
  assert.equal(JSON.stringify(view).includes("PRIVATE BOUNDED HANDOFF BODY"), false);
});

test("registers intent-level switching handlers with an exact boolean transfer choice", async () => {
  const handlers = new Map();
  const removed = [];
  const calls = [];
  const currentState = state();
  currentState.pendingTransition = null;
  const ipcMain = {
    handle(channel, handler) { handlers.set(channel, handler); },
    removeHandler(channel) { removed.push(channel); },
  };
  const coordinator = {
    async beginSwitch(input) { calls.push(["begin", input]); return { state: currentState, navigation: { opened: true, fallbackName: "Practice mới" } }; },
    async retrySwitch() { calls.push(["retry"]); return { state: currentState, navigation: null }; },
    async cancelSwitch() { calls.push(["cancel"]); return currentState; },
    async resumeActive() { calls.push(["resume"]); return { state: currentState, navigation: { opened: true, fallbackName: "Practice hiện tại" } }; },
  };
  const unregister = registerPracticeWorkspaceIpcHandlers({
    ipcMain,
    transitionCoordinator: coordinator,
    workspaceStore: { read: async () => currentState },
    loadStartRequest: async () => startRequest(),
    activateRuntime: async (nextState) => calls.push(["activate", nextState.activeRun.binding.displayName]),
  });

  assert.deepEqual([...handlers.keys()], [
    CHANNELS.PRACTICE_WORKSPACE_GET,
    CHANNELS.PRACTICE_START_NEW,
    CHANNELS.PRACTICE_RESUME_ACTIVE,
    CHANNELS.PRACTICE_RETRY_SWITCH,
    CHANNELS.PRACTICE_CANCEL_SWITCH,
  ]);
  assert.equal((await handlers.get(CHANNELS.PRACTICE_START_NEW)(null, { transfer: true })).ok, true);
  assert.deepEqual(calls[0], ["begin", { mode: "selective" }]);
  assert.deepEqual(calls[1], ["activate", "Practice hiện tại"]);
  assert.equal((await handlers.get(CHANNELS.PRACTICE_START_NEW)(null, { transfer: false })).ok, true);
  assert.deepEqual(calls[2], ["begin", { mode: "fresh" }]);
  assert.deepEqual(calls[3], ["activate", "Practice hiện tại"]);
  assert.equal((await handlers.get(CHANNELS.PRACTICE_START_NEW)(null, { transfer: "yes" })).ok, false);
  assert.equal(calls.length, 4);

  unregister();
  assert.deepEqual(removed, [...handlers.keys()]);
});

test("sandboxed preload exposes only named workspace intents", async () => {
  const source = await readFile(new URL("../src/preload/preload.cjs", import.meta.url), "utf8");

  for (const name of [
    "getWorkspace",
    "startNew",
    "resumeActive",
    "retrySwitch",
    "cancelSwitch",
  ]) {
    assert.match(source, new RegExp(`${name}\\s*:`));
  }
  for (const channel of [
    "practice:workspace:get",
    "practice:workspace:start-new",
    "practice:workspace:resume-active",
    "practice:workspace:retry-switch",
    "practice:workspace:cancel-switch",
  ]) assert.match(source, new RegExp(channel));
  assert.match(source, /PRACTICE_START_NEW, \{ transfer \}/);
  assert.doesNotMatch(source, /ipcRenderer\.send/);
});
