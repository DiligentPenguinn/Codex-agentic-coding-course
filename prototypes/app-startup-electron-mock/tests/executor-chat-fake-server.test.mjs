import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import { CodexAppServerClient } from "../src/main/codex-app-server-client.mjs";
import { createExecutorChatCoordinator } from "../src/main/executor-chat-coordinator.mjs";
import { createExecutorConversationService } from "../src/main/executor-conversation-service.mjs";

const testDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(testDirectory, "..", "..", "..");
const fakeServerPath = path.join(testDirectory, "fixtures", "fake-app-server.mjs");
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
    workspace: { expectedRepositoryRoot: repositoryRoot, exercisePath: "exercise" },
  };
}

function selection() {
  return {
    goals: ["Làm nút chính rộng 100% ở viewport 390px."],
    decisions: [],
    constraints: ["Chỉ sửa CSS onboarding."],
    blockers: ["Chưa có thay đổi."],
    outcomes: ["Đã kiểm tra trạng thái ban đầu."],
  };
}

function markerCount(thread, marker) {
  return (thread.turns ?? []).flatMap((turn) => turn.items ?? []).filter((item) => (
    item?.type === "message"
    && Array.isArray(item.content)
    && item.content.some((content) => content?.text?.includes(marker))
  )).length;
}

test("real JSONL client attaches and verifies one visible fake-server handoff", async (t) => {
  const client = new CodexAppServerClient({
    spawn: (_command, _args, options) => spawn(process.execPath, [fakeServerPath], options),
  });
  t.after(() => client.stop());
  await client.start();
  const conversationService = createExecutorConversationService({
    client,
    openExternal: async () => {},
  });
  const coordinator = createExecutorChatCoordinator({
    client,
    conversationService,
    summarize: async () => selection(),
  });

  const source = await conversationService.createDedicatedTask(
    startRequest(),
    SOURCE_RUN_ID,
    { open: false },
  );
  const handoff = await coordinator.prepareSelectiveHandoff({
    startRequest: startRequest(),
    sourceBinding: source.binding,
  });
  const targetBinding = await coordinator.createTargetChat({
    startRequest: startRequest(),
    targetRunId: TARGET_RUN_ID,
  });
  const first = await coordinator.attachSelectiveHandoff({
    startRequest: startRequest(),
    targetBinding,
    handoff,
  });
  const retry = await coordinator.attachSelectiveHandoff({
    startRequest: startRequest(),
    targetBinding,
    handoff,
  });
  const target = await conversationService.readBoundTask(
    startRequest(),
    targetBinding,
    { includeTurns: true },
  );

  assert.equal(first.visible, true);
  assert.equal(first.duplicate, false);
  assert.equal(retry.duplicate, true);
  assert.equal(markerCount(target.thread, handoff.marker), 1);
});
