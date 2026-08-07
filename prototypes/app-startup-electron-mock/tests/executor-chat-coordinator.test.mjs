import assert from "node:assert/strict";
import test from "node:test";

import { createExecutorChatCoordinator } from "../src/main/executor-chat-coordinator.mjs";

const NOW = "2026-08-08T01:00:00.000Z";
const SOURCE_RUN_ID = "11111111-1111-4111-8111-111111111111";
const TARGET_RUN_ID = "22222222-2222-4222-8222-222222222222";

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

function sourceThread() {
  return {
    id: "thr-source",
    cwd: "C:\\course",
    ephemeral: false,
    turns: [{
      id: "turn-source",
      status: "completed",
      items: [
        { type: "userMessage", content: [{ type: "text", text: "Chỉ sửa CSS ở 390px." }] },
        { type: "agentMessage", phase: "final_answer", text: "Chưa thay đổi tệp." },
      ],
    }],
  };
}

function summary() {
  return {
    goals: ["Làm nút chính rộng 100% ở viewport 390px."],
    decisions: [],
    constraints: ["Chỉ sửa CSS onboarding."],
    blockers: ["Chưa có thay đổi."],
    outcomes: ["Đã kiểm tra trạng thái ban đầu."],
  };
}

function harness() {
  const calls = [];
  const source = sourceThread();
  const target = {
    id: "thr-target",
    cwd: "C:\\course",
    ephemeral: false,
    turns: [],
  };
  const sourceBinding = binding(SOURCE_RUN_ID, source.id, "Practice cũ");
  const targetBinding = binding(TARGET_RUN_ID, target.id, "Practice mới");
  const conversationService = {
    async readBoundTask(_request, currentBinding, options) {
      calls.push(["readBoundTask", currentBinding.threadId, options]);
      const thread = currentBinding.threadId === source.id ? source : target;
      return { thread: structuredClone(thread), binding: structuredClone(currentBinding) };
    },
    async createDedicatedTask(_request, runId, options) {
      calls.push(["createDedicatedTask", runId, options]);
      return { binding: structuredClone(targetBinding), handoff: null };
    },
    async openBoundTask(currentBinding) {
      calls.push(["openBoundTask", currentBinding.threadId]);
      return { opened: true, fallbackName: currentBinding.displayName };
    },
  };
  const client = {
    async request(method, params) {
      calls.push([method, structuredClone(params)]);
      if (method === "thread/inject_items") {
        target.turns.push({ id: "injected", status: "completed", items: structuredClone(params.items) });
        return {};
      }
      throw new Error(`Unexpected method: ${method}`);
    },
  };
  const summarize = async (boundedSource) => {
    calls.push(["summarize", structuredClone(boundedSource)]);
    return summary();
  };
  return {
    calls,
    source,
    target,
    sourceBinding,
    targetBinding,
    coordinator: createExecutorChatCoordinator({
      client,
      conversationService,
      summarize,
      clock: () => new Date(NOW),
    }),
  };
}

test("prepares handoff from the exact source chat without mutating it", async () => {
  const testHarness = harness();
  const before = structuredClone(testHarness.source);

  const prepared = await testHarness.coordinator.prepareSelectiveHandoff({
    startRequest: startRequest(),
    sourceBinding: testHarness.sourceBinding,
  });

  assert.deepEqual(testHarness.source, before);
  assert.equal(prepared.sourceThreadId, "thr-source");
  assert.match(prepared.marker, /^\[CBA_HANDOFF_V1:/);
  assert.deepEqual(testHarness.calls.map((call) => call[0]), ["readBoundTask", "summarize"]);
  assert.deepEqual(testHarness.calls[0], ["readBoundTask", "thr-source", { includeTurns: true }]);
  assert.equal(JSON.stringify(testHarness.calls).includes("thr-decoy"), false);
});

test("creates an unopened target, attaches once, verifies, then opens the exact chat", async () => {
  const testHarness = harness();
  const prepared = await testHarness.coordinator.prepareSelectiveHandoff({
    startRequest: startRequest(),
    sourceBinding: testHarness.sourceBinding,
  });
  const targetBinding = await testHarness.coordinator.createTargetChat({
    startRequest: startRequest(),
    targetRunId: TARGET_RUN_ID,
  });
  const receipt = await testHarness.coordinator.attachSelectiveHandoff({
    startRequest: startRequest(),
    targetBinding,
    handoff: prepared,
  });
  const opened = await testHarness.coordinator.openChat(targetBinding);

  assert.equal(targetBinding.threadId, "thr-target");
  assert.equal(receipt.visible, true);
  assert.equal(receipt.hash, prepared.hash);
  assert.deepEqual(opened, { opened: true, fallbackName: "Practice mới" });
  assert.equal(testHarness.calls.filter((call) => call[0] === "thread/inject_items").length, 1);
  assert.deepEqual(
    testHarness.calls.find((call) => call[0] === "createDedicatedTask"),
    ["createDedicatedTask", TARGET_RUN_ID, { open: false }],
  );
});

test("retry detects the existing visible marker and never injects a duplicate", async () => {
  const testHarness = harness();
  const prepared = await testHarness.coordinator.prepareSelectiveHandoff({
    startRequest: startRequest(),
    sourceBinding: testHarness.sourceBinding,
  });
  testHarness.target.turns.push({ id: "existing", status: "completed", items: [prepared.item] });

  const receipt = await testHarness.coordinator.attachSelectiveHandoff({
    startRequest: startRequest(),
    targetBinding: testHarness.targetBinding,
    handoff: prepared,
  });

  assert.equal(receipt.duplicate, true);
  assert.equal(testHarness.calls.some((call) => call[0] === "thread/inject_items"), false);
});
