import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { parsePracticeDefinition } from "../src/shared/practice-contracts.mjs";
import {
  createDefaultPracticeWorkspaceState,
  parsePracticeWorkspaceState,
} from "../src/shared/practice-state-schema.mjs";
import { completePracticeStep } from "../src/shared/practice-session-reducer.mjs";
import { createPracticeWorkspaceStore } from "../src/main/practice-store.mjs";

const NOW = "2026-08-08T00:00:00.000Z";
const RUN_ID = "11111111-1111-4111-8111-111111111111";

function definition() {
  return {
    id: "module-0-read-only-inspection-awareness-fixture",
    version: "mock-2",
    objective: "Kiểm tra repository mà chưa thay đổi tệp.",
    expectedOutcome: "Có báo cáo ngắn, có cấu trúc để quyết định bước tiếp theo.",
    steps: [
      {
        id: "inspect",
        title: "Yêu cầu Executor kiểm tra ở chế độ chỉ đọc",
        completionAuthority: "machine",
      },
      {
        id: "review",
        title: "Đọc báo cáo và giải thích bước tiếp theo",
        completionAuthority: "teacher",
      },
    ],
  };
}

function startRequest() {
  return {
    schemaVersion: 1,
    courseRunId: "run-1",
    lessonId: "module-0",
    missionId: definition().id,
    checkpointId: "executor-awareness",
    content: {
      version: "mock-1",
      locale: "vi-VN",
      title: "Practice safely",
      description: "Inspect the repository.",
      learningOutcomes: ["Inspect before editing"],
      instructions: ["Use read-only tools"],
      allowedActions: ["Read"],
      prohibitedActions: ["Delete"],
      expectedEvidence: ["A report"],
      kind: "mock-adaptation",
      owner: "Triết",
    },
    workspace: {
      expectedRepositoryRoot: "C:\\course",
      exercisePath: "exercises/one",
    },
  };
}

function binding() {
  return {
    schemaVersion: 1,
    sessionId: RUN_ID,
    threadId: "thr-one",
    displayName: "Practice · Module 0 · Read-only inspection",
    workspaceRoot: "C:\\course",
    sourceKind: "created-by-practice",
    boundAt: NOW,
    verifiedAt: NOW,
  };
}

function checklist() {
  return [
    {
      stepId: "inspect",
      completionAuthority: "machine",
      status: "completed",
      completion: {
        source: "bound-executor-chat",
        cursor: "turn-1:item-1",
        observedAt: NOW,
      },
    },
    {
      stepId: "review",
      completionAuthority: "teacher",
      status: "next",
      completion: null,
    },
  ];
}

function activeRun() {
  return {
    runId: RUN_ID,
    definitionId: definition().id,
    definitionVersion: definition().version,
    status: "active",
    startRequest: startRequest(),
    binding: binding(),
    bindingGeneration: 1,
    checklist: checklist(),
    createdAt: NOW,
    updatedAt: NOW,
  };
}

function workspaceState(overrides = {}) {
  return {
    schemaVersion: 2,
    activeRun: activeRun(),
    archivedRuns: [],
    pendingTransition: null,
    presentation: {
      mode: "full",
      activePanel: "progress",
      teacherScrollTop: 0,
      progressScrollTop: 0,
      mainBounds: null,
      bubbleBounds: null,
      popoverBounds: null,
    },
    teacherChat: [],
    updatedAt: NOW,
    ...overrides,
  };
}

test("accepts a versioned Practice definition with explicit completion authority", () => {
  assert.deepEqual(parsePracticeDefinition(definition()), definition());
});

test("rejects ambiguous definitions and duplicate step ids", () => {
  const ambiguous = definition();
  delete ambiguous.steps[0].completionAuthority;
  assert.throws(() => parsePracticeDefinition(ambiguous), /completionAuthority/i);

  const duplicate = definition();
  duplicate.steps[1].id = duplicate.steps[0].id;
  assert.throws(() => parsePracticeDefinition(duplicate), /duplicate/i);
});

test("creates the safe version-2 workspace default", () => {
  assert.deepEqual(createDefaultPracticeWorkspaceState(() => new Date(NOW)), {
    schemaVersion: 2,
    activeRun: null,
    archivedRuns: [],
    pendingTransition: null,
    presentation: {
      mode: "full",
      activePanel: "teacher",
      teacherScrollTop: 0,
      progressScrollTop: 0,
      mainBounds: null,
      bubbleBounds: null,
      popoverBounds: null,
    },
    teacherChat: [],
    updatedAt: NOW,
  });
});

test("accepts exactly one active run and one ordered next checklist step", () => {
  assert.deepEqual(parsePracticeWorkspaceState(workspaceState()), workspaceState());
  assert.throws(
    () => parsePracticeWorkspaceState({ ...workspaceState(), activeRuns: [activeRun()] }),
    /Unknown Practice workspace field/i,
  );
  assert.throws(
    () => parsePracticeWorkspaceState(workspaceState({
      activeRun: {
        ...activeRun(),
        checklist: checklist().map((step) => ({ ...step, status: "next", completion: null })),
      },
    })),
    /exactly one next|ordered/i,
  );
});

test("requires pending transitions to reference the exact active run generation", () => {
  const pendingTransition = {
    id: "22222222-2222-4222-8222-222222222222",
    sourceRunId: RUN_ID,
    sourceBindingGeneration: 1,
    mode: "fresh",
    stage: "prepared",
    targetChat: null,
    handoffHash: null,
    attachmentReceipt: null,
    createdAt: NOW,
    updatedAt: NOW,
  };
  assert.deepEqual(
    parsePracticeWorkspaceState(workspaceState({ pendingTransition })).pendingTransition,
    pendingTransition,
  );
  assert.throws(
    () => parsePracticeWorkspaceState(workspaceState({
      pendingTransition: { ...pendingTransition, sourceBindingGeneration: 2 },
    })),
    /binding generation/i,
  );
});

test("hybrid checklist completion rejects learner assertion and stale machine evidence", () => {
  const current = checklist().map((step, index) => index === 0
    ? { ...step, status: "next", completion: null }
    : { ...step, status: "remaining", completion: null });

  assert.throws(
    () => completePracticeStep(current, {
      stepId: "inspect",
      source: "learner-assertion",
      observedAt: NOW,
    }),
    /authority|learner assertion/i,
  );
  assert.throws(
    () => completePracticeStep(current, {
      stepId: "inspect",
      source: "bound-executor-chat",
      cursor: "turn-1:item-1",
      observedAt: NOW,
      freshness: "stale",
    }),
    /fresh/i,
  );
});

test("hybrid checklist completion advances only the current next step", () => {
  const afterMachine = completePracticeStep(
    checklist().map((step, index) => index === 0
      ? { ...step, status: "next", completion: null }
      : { ...step, status: "remaining", completion: null }),
    {
      stepId: "inspect",
      source: "bound-executor-chat",
      cursor: "turn-1:item-1",
      observedAt: NOW,
      freshness: "fresh",
    },
  );
  assert.deepEqual(afterMachine.map((step) => step.status), ["completed", "next"]);

  const afterTeacher = completePracticeStep(afterMachine, {
    stepId: "review",
    source: "teacher-assessment",
    messageId: "teacher-message-1",
    assessedAt: NOW,
  });
  assert.deepEqual(afterTeacher.map((step) => step.status), ["completed", "completed"]);
  assert.throws(
    () => completePracticeStep(afterMachine, {
      stepId: "inspect",
      source: "bound-executor-chat",
      cursor: "turn-2:item-1",
      observedAt: NOW,
      freshness: "fresh",
    }),
    /next step/i,
  );
});

test("writes version-2 workspace state atomically", async (t) => {
  const userDataPath = await mkdtemp(path.join(os.tmpdir(), "practice-workspace-store-"));
  t.after(() => rm(userDataPath, { recursive: true, force: true }));
  const store = createPracticeWorkspaceStore({
    userDataPath,
    clock: () => new Date(NOW),
  });

  const written = await store.write(workspaceState());
  assert.deepEqual(await store.read(), written);
  assert.equal(written.activeRun.runId, RUN_ID);
});

test("quarantines corrupt version-2 workspace state and returns the safe default", async (t) => {
  const userDataPath = await mkdtemp(path.join(os.tmpdir(), "practice-workspace-corrupt-"));
  t.after(() => rm(userDataPath, { recursive: true, force: true }));
  await writeFile(path.join(userDataPath, "practice-workspace-state.json"), "{broken");
  const store = createPracticeWorkspaceStore({
    userDataPath,
    clock: () => new Date(NOW),
  });

  assert.deepEqual(
    await store.read(),
    createDefaultPracticeWorkspaceState(() => new Date(NOW)),
  );
  assert.equal(
    (await readdir(userDataPath)).includes("practice-workspace-state.corrupt-2026-08-08T00-00-00.000Z.json"),
    true,
  );
  assert.deepEqual(store.lastRecovery, {
    code: "STATE_RESET",
    message: "Local Practice workspace was reset because it could not be read.",
  });
});
