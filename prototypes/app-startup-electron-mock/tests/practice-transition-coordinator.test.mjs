import assert from "node:assert/strict";
import test from "node:test";

import { createPracticeTransitionCoordinator } from "../src/main/practice-transition-coordinator.mjs";
import { parsePracticeWorkspaceState } from "../src/shared/practice-state-schema.mjs";

const NOW = "2026-08-08T02:00:00.000Z";
const SOURCE_RUN_ID = "11111111-1111-4111-8111-111111111111";
const TRANSITION_ID = "22222222-2222-4222-8222-222222222222";
const TARGET_RUN_ID = "33333333-3333-4333-8333-333333333333";

function definition() {
  return {
    id: "mission-1",
    version: "mock-2",
    objective: "Kiểm tra repository mà chưa thay đổi tệp.",
    expectedOutcome: "Có báo cáo ngắn để quyết định bước tiếp theo.",
    steps: [
      { id: "inspect", title: "Kiểm tra ở chế độ chỉ đọc", completionAuthority: "machine" },
      { id: "review", title: "Đọc và giải thích báo cáo", completionAuthority: "teacher" },
    ],
  };
}

function startRequest() {
  return {
    schemaVersion: 1,
    courseRunId: "run-1",
    lessonId: "module-0",
    missionId: "mission-1",
    checkpointId: "checkpoint-1",
    content: {
      version: "1", locale: "vi-VN", title: "Practice", description: "Practice safely",
      learningOutcomes: ["Learn"], instructions: ["Inspect"], allowedActions: ["Read"],
      prohibitedActions: ["Delete"], expectedEvidence: ["Notes"], kind: "mock-adaptation", owner: "Triết",
    },
    practiceDefinition: definition(),
    workspace: { expectedRepositoryRoot: "C:\\course", exercisePath: "exercise" },
  };
}

function binding(sessionId, threadId, displayName) {
  return {
    schemaVersion: 1,
    sessionId,
    threadId,
    displayName,
    workspaceRoot: "C:\\course",
    sourceKind: "created-by-practice",
    boundAt: NOW,
    verifiedAt: NOW,
  };
}

function activeRun() {
  return {
    runId: SOURCE_RUN_ID,
    definitionId: "mission-1",
    definitionVersion: "mock-2",
    status: "active",
    startRequest: startRequest(),
    binding: binding(SOURCE_RUN_ID, "thr-source", "Practice cũ"),
    bindingGeneration: 1,
    checklist: [
      {
        stepId: "inspect", completionAuthority: "machine", status: "next", completion: null,
      },
      {
        stepId: "review", completionAuthority: "teacher", status: "remaining", completion: null,
      },
    ],
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function workspace(active = activeRun()) {
  return {
    schemaVersion: 2,
    activeRun: active,
    archivedRuns: [],
    pendingTransition: null,
    presentation: {
      mode: "full", activePanel: "teacher", teacherScrollTop: 0, progressScrollTop: 0,
      mainBounds: null, bubbleBounds: null, popoverBounds: null,
    },
    teacherChat: [],
    updatedAt: NOW,
  };
}

function handoff() {
  const hash = "a".repeat(64);
  const marker = `[CBA_HANDOFF_V1:${hash}]`;
  const text = `${marker}\nBỐI CẢNH ĐƯỢC CHUYỂN CÓ CHỌN LỌC`;
  return {
    schemaVersion: 1,
    sourceThreadId: "thr-source",
    sourceDisplayName: "Practice cũ",
    hash,
    marker,
    text,
    item: { type: "message", role: "assistant", content: [{ type: "output_text", text }] },
    createdAt: NOW,
  };
}

function harness({ initialState = workspace(), failAt, blockCreate } = {}) {
  let state = parsePracticeWorkspaceState(initialState);
  const writes = [];
  const calls = [];
  let createRelease;
  const createGate = blockCreate ? new Promise((resolve) => { createRelease = resolve; }) : null;
  const store = {
    async read() { return structuredClone(state); },
    async write(value) {
      const stage = value.pendingTransition?.stage ?? "committed";
      if (failAt === `write:${stage}`) throw new Error(`fail ${stage}`);
      state = parsePracticeWorkspaceState(value);
      writes.push(stage);
      return structuredClone(state);
    },
  };
  const chatCoordinator = {
    async createTargetChat() {
      calls.push("create");
      if (createGate) await createGate;
      if (failAt === "create") throw new Error("fail create");
      return binding(TARGET_RUN_ID, "thr-target", "Practice mới");
    },
    async prepareSelectiveHandoff() {
      calls.push("prepare");
      if (failAt === "prepare") throw new Error("fail prepare");
      return handoff();
    },
    async attachSelectiveHandoff() {
      calls.push("attach");
      if (failAt === "attach") throw new Error("fail attach");
      return {
        marker: handoff().marker,
        hash: handoff().hash,
        attachedAt: NOW,
        visible: true,
        duplicate: false,
      };
    },
    async openChat() {
      calls.push("open");
      return { opened: true, fallbackName: "Practice mới" };
    },
  };
  const ids = [TRANSITION_ID, TARGET_RUN_ID];
  return {
    calls,
    writes,
    releaseCreate: () => createRelease?.(),
    readState: () => structuredClone(state),
    coordinator: createPracticeTransitionCoordinator({
      store,
      chatCoordinator,
      loadStartRequest: async () => startRequest(),
      createId: () => ids.shift(),
      clock: () => new Date(NOW),
    }),
  };
}

test("fresh switch commits one new run and archives the old receipt", async () => {
  const testHarness = harness();
  const result = await testHarness.coordinator.beginSwitch({ mode: "fresh" });
  const state = testHarness.readState();

  assert.equal(state.pendingTransition, null);
  assert.equal(state.activeRun.runId, TARGET_RUN_ID);
  assert.equal(state.activeRun.binding.threadId, "thr-target");
  assert.equal(state.activeRun.bindingGeneration, 2);
  assert.deepEqual(state.activeRun.checklist.map((step) => step.status), ["next", "remaining"]);
  assert.deepEqual(state.archivedRuns, [{
    runId: SOURCE_RUN_ID,
    definitionId: "mission-1",
    definitionVersion: "mock-2",
    threadId: "thr-source",
    displayName: "Practice cũ",
    archivedAt: NOW,
    handoffHash: null,
  }]);
  assert.deepEqual(testHarness.calls, ["create", "open"]);
  assert.deepEqual(testHarness.writes, ["prepared", "target-created", "verified", "committed"]);
  assert.equal(result.navigation.opened, true);
});

test("selective switch persists every recoverable stage before final commit", async () => {
  const testHarness = harness();
  await testHarness.coordinator.beginSwitch({ mode: "selective" });
  const state = testHarness.readState();

  assert.deepEqual(testHarness.calls, ["create", "prepare", "attach", "open"]);
  assert.deepEqual(testHarness.writes, [
    "prepared", "target-created", "handoff-prepared", "attached", "verified", "committed",
  ]);
  assert.equal(state.archivedRuns[0].handoffHash, handoff().hash);
  assert.equal(state.activeRun.runId, TARGET_RUN_ID);
});

for (const failure of ["create", "prepare", "attach", "write:attached", "write:committed"]) {
  test(`failure at ${failure} keeps the old run authoritative`, async () => {
    const testHarness = harness({ failAt: failure });

    await assert.rejects(
      testHarness.coordinator.beginSwitch({ mode: "selective" }),
      /fail/,
    );
    const state = testHarness.readState();
    assert.equal(state.activeRun.runId, SOURCE_RUN_ID);
    assert.equal(state.activeRun.binding.threadId, "thr-source");
    assert.equal(state.archivedRuns.length, 0);
    assert.notEqual(state.pendingTransition, null);
  });
}

test("retry resumes from the durable handoff stage without recreating or resummarizing", async () => {
  const testHarness = harness({ failAt: "attach" });
  await assert.rejects(testHarness.coordinator.beginSwitch({ mode: "selective" }), /fail attach/);
  const pending = testHarness.readState().pendingTransition;
  assert.equal(pending.stage, "handoff-prepared");

  const resumed = harness({ initialState: testHarness.readState() });
  await resumed.coordinator.retrySwitch();

  assert.deepEqual(resumed.calls, ["attach", "open"]);
  assert.equal(resumed.readState().activeRun.runId, TARGET_RUN_ID);
});

test("cancel is allowed before attachment and rejected after attachment", async () => {
  const beforeAttach = harness({ failAt: "attach" });
  await assert.rejects(beforeAttach.coordinator.beginSwitch({ mode: "selective" }), /fail attach/);
  await beforeAttach.coordinator.cancelSwitch();
  assert.equal(beforeAttach.readState().pendingTransition, null);
  assert.equal(beforeAttach.readState().activeRun.runId, SOURCE_RUN_ID);

  const afterAttachedState = beforeAttach.readState();
  afterAttachedState.pendingTransition = {
    id: TRANSITION_ID,
    targetRunId: TARGET_RUN_ID,
    sourceRunId: SOURCE_RUN_ID,
    sourceBindingGeneration: 1,
    mode: "selective",
    stage: "attached",
    targetChat: binding(TARGET_RUN_ID, "thr-target", "Practice mới"),
    handoffHash: handoff().hash,
    handoff: handoff(),
    attachmentReceipt: {
      marker: handoff().marker, hash: handoff().hash, attachedAt: NOW, visible: true,
    },
    createdAt: NOW,
    updatedAt: NOW,
  };
  const afterAttach = harness({ initialState: afterAttachedState });
  await assert.rejects(afterAttach.coordinator.cancelSwitch(), /cannot be cancelled/i);
});

test("concurrent begin requests share one transaction and create one target chat", async () => {
  const testHarness = harness({ blockCreate: true });
  const first = testHarness.coordinator.beginSwitch({ mode: "fresh" });
  const second = testHarness.coordinator.beginSwitch({ mode: "fresh" });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(testHarness.calls.filter((call) => call === "create").length, 1);
  testHarness.releaseCreate();

  const [firstResult, secondResult] = await Promise.all([first, second]);
  assert.deepEqual(secondResult, firstResult);
  assert.equal(testHarness.calls.filter((call) => call === "create").length, 1);
});

function workspaceAtStage(stage) {
  const state = workspace();
  const hasTarget = stage !== "prepared";
  const hasHandoff = ["handoff-prepared", "attached", "verified"].includes(stage);
  const hasReceipt = ["attached", "verified"].includes(stage);
  state.pendingTransition = {
    id: TRANSITION_ID,
    targetRunId: TARGET_RUN_ID,
    sourceRunId: SOURCE_RUN_ID,
    sourceBindingGeneration: 1,
    mode: "selective",
    stage,
    targetChat: hasTarget ? binding(TARGET_RUN_ID, "thr-target", "Practice mới") : null,
    handoffHash: hasHandoff ? handoff().hash : null,
    handoff: hasHandoff ? handoff() : null,
    attachmentReceipt: hasReceipt ? {
      marker: handoff().marker,
      hash: handoff().hash,
      attachedAt: NOW,
      visible: true,
    } : null,
    createdAt: NOW,
    updatedAt: NOW,
  };
  return state;
}

const recoveryCalls = {
  prepared: ["create", "prepare", "attach", "open"],
  "target-created": ["prepare", "attach", "open"],
  "handoff-prepared": ["attach", "open"],
  attached: ["open"],
  verified: ["open"],
};

for (const [stage, expectedCalls] of Object.entries(recoveryCalls)) {
  test(`restart reconciliation resumes from ${stage}`, async () => {
    const testHarness = harness({ initialState: workspaceAtStage(stage) });

    await testHarness.coordinator.retrySwitch();

    assert.deepEqual(testHarness.calls, expectedCalls);
    assert.equal(testHarness.readState().pendingTransition, null);
    assert.equal(testHarness.readState().activeRun.runId, TARGET_RUN_ID);
    assert.equal(testHarness.readState().archivedRuns.length, 1);
  });
}
