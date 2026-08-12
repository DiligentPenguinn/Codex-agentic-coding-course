import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialPracticeWorkspaceRendererState,
  createPracticeWorkspaceRendererController,
  getPracticeWorkspaceLoadingLabel,
  reducePracticeWorkspaceRenderer,
} from "../src/renderer/practice-workspace-state.mjs";

function workspace({ active = false, transition = null } = {}) {
  return {
    brief: {
      objective: "Kiểm tra repository mà chưa thay đổi tệp.",
      expectedOutcome: "Có báo cáo ngắn để quyết định bước tiếp theo.",
    },
    activeRun: active ? {
      status: "active",
      executorChatName: "Practice hiện tại",
      steps: [
        { id: "inspect", title: "Kiểm tra ở chế độ chỉ đọc", status: "completed", completionAuthority: "machine" },
        { id: "review", title: "Đọc và giải thích báo cáo", status: "next", completionAuthority: "teacher" },
      ],
    } : null,
    transition,
    archivedRunCount: 0,
    presentation: { mode: "full", activePanel: "teacher" },
    actions: {
      canStartNew: transition === null,
      canResume: active && transition === null,
      canRetrySwitch: transition !== null,
    },
  };
}

function ok(value) {
  return Promise.resolve({ ok: true, value });
}

function harness(initialWorkspace = workspace(), overrides = {}) {
  const calls = [];
  const bridge = {
    getWorkspace: () => ok({ workspace: initialWorkspace, navigation: null }),
    startNew: (transfer) => ok({ workspace: workspace({ active: true }), navigation: { opened: true, fallbackName: "Practice mới" } }),
    resumeActive: () => ok({ workspace: initialWorkspace, navigation: { opened: true, fallbackName: "Practice hiện tại" } }),
    retrySwitch: () => ok({ workspace: workspace({ active: true }), navigation: { opened: true, fallbackName: "Practice mới" } }),
    cancelSwitch: () => ok({ workspace: workspace({ active: true }), navigation: null }),
    ...overrides,
  };
  const wrapped = {};
  for (const [name, operation] of Object.entries(bridge)) {
    wrapped[name] = (...args) => {
      calls.push([name, ...args]);
      return operation(...args);
    };
  }
  const view = {
    state: null,
    opens: 0,
    dialogFocus: 0,
    startFocus: 0,
    errorFocus: 0,
    render(next) { this.state = next; },
    openPractice() { this.opens += 1; },
    focusTransferDialog() { this.dialogFocus += 1; },
    focusStartNew() { this.startFocus += 1; },
    focusError() { this.errorFocus += 1; },
  };
  return {
    calls,
    controller: createPracticeWorkspaceRendererController({ bridge: wrapped, view }),
    view,
  };
}

test("initial brief state is loading, immutable, and does not fabricate progress", () => {
  const state = createInitialPracticeWorkspaceRendererState();
  assert.deepEqual(state, {
    workspace: null,
    phase: "loading",
    transferDialogOpen: false,
    error: null,
    navigationNotice: null,
  });
  assert.equal(Object.isFrozen(state), true);
  assert.equal(getPracticeWorkspaceLoadingLabel(state), "");
});

test("Start new opens the transfer choice only when an active Practice exists", async () => {
  const fresh = harness();
  await fresh.controller.initialize();
  await fresh.controller.requestStartNew();
  assert.deepEqual(fresh.calls, [["getWorkspace"], ["startNew", false]]);
  assert.equal(fresh.view.opens, 1);

  const active = harness(workspace({ active: true }));
  await active.controller.initialize();
  active.controller.requestStartNew();
  assert.deepEqual(active.calls, [["getWorkspace"]]);
  assert.equal(active.view.state.transferDialogOpen, true);
  assert.equal(active.view.dialogFocus, 1);
  await active.controller.startNew(true);
  assert.deepEqual(active.calls.at(-1), ["startNew", true]);
  assert.equal(active.view.opens, 1);
});

test("Resume opens the one active Executor chat and no inactive fallback", async () => {
  const active = harness(workspace({ active: true }));
  await active.controller.initialize();
  await active.controller.resumeActive();
  assert.deepEqual(active.calls.at(-1), ["resumeActive"]);
  assert.equal(active.view.opens, 1);

  const fresh = harness();
  await fresh.controller.initialize();
  await fresh.controller.resumeActive();
  assert.deepEqual(fresh.calls, [["getWorkspace"]]);
});

test("loading uses the persisted named stage and never a fabricated percentage", () => {
  const transition = {
    mode: "selective",
    stage: "handoff-prepared",
    label: "Đang gắn phần tóm tắt đã chọn lọc…",
    canCancel: true,
  };
  let state = reducePracticeWorkspaceRenderer(
    createInitialPracticeWorkspaceRendererState(),
    { type: "WORKSPACE_LOADED", workspace: workspace({ active: true, transition }) },
  );
  state = reducePracticeWorkspaceRenderer(state, { type: "WORKSPACE_SWITCH_REQUESTED" });
  const label = getPracticeWorkspaceLoadingLabel(state);
  assert.equal(label, transition.label);
  assert.doesNotMatch(label, /\d+%|percent/i);
});

test("a failed switch reloads the durable stage and exposes Retry without opening Practice", async () => {
  const pending = workspace({
    active: true,
    transition: {
      mode: "selective",
      stage: "attached",
      label: "Đang xác minh phần tóm tắt trong Executor chat mới…",
      canCancel: false,
    },
  });
  const testHarness = harness(workspace({ active: true }), {
    startNew: async () => ({ ok: false, error: { message: "private" } }),
    getWorkspace: (() => {
      let count = 0;
      return () => ok({ workspace: count++ === 0 ? workspace({ active: true }) : pending, navigation: null });
    })(),
  });
  await testHarness.controller.initialize();
  testHarness.controller.requestStartNew();
  await testHarness.controller.startNew(true);
  assert.equal(testHarness.view.state.workspace.transition.stage, "attached");
  assert.equal(testHarness.view.state.workspace.actions.canRetrySwitch, true);
  assert.equal(testHarness.view.state.error.recoveryAction, "retry-switch");
  assert.equal(testHarness.view.opens, 0);
  assert.equal(testHarness.view.errorFocus, 1);
});
