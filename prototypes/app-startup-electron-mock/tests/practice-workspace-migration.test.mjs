import assert from "node:assert/strict";
import test from "node:test";

import { migrateLegacyPracticeState } from "../src/shared/practice-state-schema.mjs";

const NOW = "2026-08-08T00:00:00.000Z";
const RUN_ID = "11111111-1111-4111-8111-111111111111";

const definition = {
  id: "mission-1",
  version: "mock-2",
  objective: "Kiểm tra repository mà chưa thay đổi tệp.",
  expectedOutcome: "Có báo cáo ngắn để quyết định bước tiếp theo.",
  steps: [
    { id: "inspect", title: "Kiểm tra ở chế độ chỉ đọc", completionAuthority: "machine" },
    { id: "review", title: "Đọc và giải thích báo cáo", completionAuthority: "teacher" },
  ],
};

function startRequest() {
  return {
    schemaVersion: 1,
    courseRunId: "run-1",
    lessonId: "module-0",
    missionId: "mission-1",
    checkpointId: "checkpoint-1",
    content: {
      version: "mock-1",
      locale: "vi-VN",
      title: "Practice",
      description: "Practice safely",
      learningOutcomes: ["Learn"],
      instructions: ["Do it"],
      allowedActions: ["Read"],
      prohibitedActions: ["Delete"],
      expectedEvidence: ["Report"],
      kind: "mock-adaptation",
      owner: "Triết",
    },
    workspace: { expectedRepositoryRoot: "C:\\course", exercisePath: "exercise" },
  };
}

function binding() {
  return {
    schemaVersion: 1,
    sessionId: RUN_ID,
    threadId: "thr-exact",
    displayName: "Practice · Exact chat",
    workspaceRoot: "C:\\course",
    sourceKind: "selected-existing",
    boundAt: NOW,
    verifiedAt: NOW,
  };
}

function legacyState(activeSession) {
  return {
    schemaVersion: 1,
    activeSession,
    presentation: {
      mode: "quick-chat",
      lastFullTab: "teacher",
      mainBounds: null,
      bubbleBounds: null,
      popoverBounds: null,
    },
    teacherChat: [],
    updatedAt: NOW,
  };
}

test("migrates an exact legacy binding without inventing completion", () => {
  const exactBinding = binding();
  const migrated = migrateLegacyPracticeState(legacyState({
    sessionId: RUN_ID,
    lifecycle: "active",
    startRequest: startRequest(),
    binding: exactBinding,
    activity: null,
    observationCursor: null,
    boundAt: NOW,
    error: null,
    updatedAt: NOW,
  }), definition);

  assert.deepEqual(migrated.activeRun.binding, exactBinding);
  assert.equal(migrated.activeRun.bindingGeneration, 1);
  assert.deepEqual(migrated.activeRun.checklist.map((step) => step.status), ["next", "remaining"]);
  assert.equal(migrated.pendingTransition, null);
});

test("migrates an unbound legacy session without inventing a chat binding", () => {
  const migrated = migrateLegacyPracticeState(legacyState({
    sessionId: RUN_ID,
    lifecycle: "needs-binding",
    startRequest: startRequest(),
    binding: null,
    activity: null,
    observationCursor: null,
    boundAt: null,
    error: null,
    updatedAt: NOW,
  }), definition);

  assert.equal(migrated.activeRun.binding, null);
  assert.equal(migrated.activeRun.bindingGeneration, 0);
  assert.equal(migrated.activeRun.status, "preparing");
});
