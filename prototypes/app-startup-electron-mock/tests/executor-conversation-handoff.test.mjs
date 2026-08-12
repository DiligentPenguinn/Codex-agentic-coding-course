import assert from "node:assert/strict";
import test from "node:test";

import { createExecutorConversationService } from "../src/main/executor-conversation-service.mjs";

const ROOT = "C:\\course";
const NOW = "2026-08-08T01:00:00.000Z";
const RUN_ID = "11111111-1111-4111-8111-111111111111";

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
    workspace: { expectedRepositoryRoot: ROOT, exercisePath: "exercise" },
  };
}

function thread(overrides = {}) {
  return {
    id: "thr-source",
    cwd: ROOT,
    ephemeral: false,
    name: "Practice cũ",
    updatedAt: 1_754_265_600,
    status: { type: "idle" },
    turns: [],
    ...overrides,
  };
}

function binding(overrides = {}) {
  return {
    schemaVersion: 1,
    sessionId: RUN_ID,
    threadId: "thr-source",
    displayName: "Practice cũ",
    workspaceRoot: ROOT,
    sourceKind: "selected-existing",
    boundAt: NOW,
    verifiedAt: NOW,
    ...overrides,
  };
}

test("reads turns only from the exact verified bound Executor chat", async () => {
  const calls = [];
  const service = createExecutorConversationService({
    client: {
      async request(method, params) {
        calls.push([method, params]);
        return { thread: thread() };
      },
    },
    openExternal: async () => {},
    clock: () => new Date(NOW),
  });

  const result = await service.readBoundTask(startRequest(), binding(), { includeTurns: true });

  assert.equal(result.thread.id, "thr-source");
  assert.equal(result.binding.threadId, "thr-source");
  assert.deepEqual(calls, [["thread/read", { threadId: "thr-source", includeTurns: true }]]);
});

test("rejects source substitution while preserving the original binding", async () => {
  const original = binding();
  const service = createExecutorConversationService({
    client: { request: async () => ({ thread: thread({ id: "thr-decoy" }) }) },
    openExternal: async () => {},
    clock: () => new Date(NOW),
  });

  await assert.rejects(
    service.readBoundTask(startRequest(), original, { includeTurns: true }),
    /does not match the requested chat/i,
  );
  assert.equal(original.threadId, "thr-source");
});

test("creates and verifies a target chat without opening it when requested", async () => {
  const calls = [];
  const opened = [];
  const service = createExecutorConversationService({
    client: {
      async request(method, params) {
        calls.push([method, params]);
        if (method === "thread/start") return { thread: thread({ id: "thr-target", name: null }) };
        if (method === "thread/name/set") return {};
        if (method === "thread/read") return { thread: thread({ id: "thr-target" }) };
        throw new Error(`Unexpected method: ${method}`);
      },
    },
    openExternal: async (url) => opened.push(url),
    clock: () => new Date(NOW),
  });

  const result = await service.createDedicatedTask(startRequest(), RUN_ID, { open: false });

  assert.equal(result.binding.threadId, "thr-target");
  assert.equal(result.handoff, null);
  assert.deepEqual(opened, []);
});
