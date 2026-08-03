import assert from "node:assert/strict";
import { mkdtemp, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  createDefaultPracticeState,
  parsePracticeState,
} from "../src/shared/practice-state-schema.mjs";
import { createPracticeStore } from "../src/main/practice-store.mjs";

const now = "2026-08-03T00:00:00.000Z";
const clock = () => new Date(now);

function startRequest() {
  return {
    schemaVersion: 1,
    courseRunId: "run-1",
    lessonId: "lesson-1",
    missionId: "mission-1",
    checkpointId: "checkpoint-1",
    content: {
      version: "1",
      locale: "vi-VN",
      title: "Practice",
      description: "Practice safely",
      learningOutcomes: ["Learn"],
      instructions: ["Do it"],
      allowedActions: ["Edit"],
      prohibitedActions: ["Delete"],
      expectedEvidence: ["File"],
      kind: "mock-adaptation",
      owner: "Triết",
    },
    workspace: {
      expectedRepositoryRoot: "D:/NUS/course",
      exercisePath: "exercises/one.md",
    },
  };
}

function binding() {
  return {
    schemaVersion: 1,
    sessionId: "practice-session-1",
    threadId: "thread-1",
    displayName: "Practice task",
    workspaceRoot: "D:/NUS/course",
    sourceKind: "created-by-practice",
    boundAt: "2026-08-03T00:00:01.000Z",
    verifiedAt: "2026-08-03T00:00:01.000Z",
  };
}

function activity(threadId = "thread-1") {
  return {
    schemaVersion: 1,
    threadId,
    status: "working",
    cursor: "turn-1:item-4",
    learnerPromptSummary: "Work on the exercise",
    executorResponseSummary: "Editing the exercise",
    activityKinds: ["response"],
    changedFiles: ["exercises/one.md"],
    observedAt: "2026-08-03T00:00:01.000Z",
  };
}

function activeSession(overrides = {}) {
  return {
    sessionId: "practice-session-1",
    lifecycle: "active",
    startRequest: startRequest(),
    binding: binding(),
    activity: activity(),
    observationCursor: "turn-1:item-4",
    boundAt: "2026-08-03T00:00:01.000Z",
    ...overrides,
  };
}

function validState(overrides = {}) {
  return {
    schemaVersion: 1,
    activeSession: null,
    presentation: {
      mode: "full",
      lastFullTab: "exercise",
      mainBounds: null,
      bubbleBounds: null,
      popoverBounds: null,
    },
    teacherChat: [],
    updatedAt: now,
    ...overrides,
  };
}

test("creates the exact safe default", () => {
  assert.deepEqual(createDefaultPracticeState(clock), validState());
});

test("writes atomically and resumes a normalized active session", async (t) => {
  const userDataPath = await mkdtemp(path.join(os.tmpdir(), "practice-store-"));
  t.after(() => rm(userDataPath, { recursive: true, force: true }));
  const store = createPracticeStore({ userDataPath, clock });

  const written = await store.write(validState({ activeSession: activeSession() }));

  assert.equal(written.activeSession.error, null);
  assert.equal(written.activeSession.updatedAt, now);
  assert.deepEqual(await store.read(), written);
  assert.doesNotMatch((await readdir(userDataPath)).join(","), /\.tmp/);
});

test("retains only the newest forty Teacher messages", () => {
  const teacherChat = Array.from({ length: 41 }, (_, index) => ({
    id: `message-${index}`,
    role: "teacher",
    text: `Message ${index}`,
    createdAt: now,
  }));

  const state = parsePracticeState(validState({ teacherChat }));

  assert.equal(state.teacherChat.length, 40);
  assert.equal(state.teacherChat[0].id, "message-1");
});

test("rejects incomplete, invalid, and unknown bounds", () => {
  assert.throws(
    () => parsePracticeState(validState({
      presentation: { ...validState().presentation, mainBounds: { x: 1, y: 2, width: 0, height: 10 } },
    })),
    /dimensions must be positive/i,
  );
  assert.throws(
    () => parsePracticeState(validState({
      presentation: { ...validState().presentation, bubbleBounds: { x: 1, y: 2, width: 10, height: 10, extra: true } },
    })),
    /unknown Practice bounds field/i,
  );
});

test("quarantines corrupt state and returns the safe default", async (t) => {
  const userDataPath = await mkdtemp(path.join(os.tmpdir(), "practice-corrupt-"));
  t.after(() => rm(userDataPath, { recursive: true, force: true }));
  await writeFile(path.join(userDataPath, "practice-state.json"), "{broken");
  const store = createPracticeStore({ userDataPath, clock });

  assert.deepEqual(await store.read(), validState());
  assert.equal(
    (await readdir(userDataPath)).includes("practice-state.corrupt-2026-08-03T00-00-00.000Z.json"),
    true,
  );
  assert.deepEqual(store.lastRecovery, {
    code: "STATE_RESET",
    message: "Local Practice progress was reset because it could not be read.",
  });
});

test("rejects forbidden fields at every depth", () => {
  const state = validState({
    activeSession: activeSession({
      activity: { ...activity(), environment: { SECRET: "no" } },
    }),
  });

  assert.throws(() => parsePracticeState(state), /Forbidden Practice state field/i);
});

test("rejects a completed lifecycle and mismatched activity thread", () => {
  assert.throws(
    () => parsePracticeState(validState({ activeSession: activeSession({ lifecycle: "completed" }) })),
    /Invalid Practice lifecycle/i,
  );
  assert.throws(
    () => parsePracticeState(validState({
      activeSession: activeSession({ activity: activity("thread-2") }),
    })),
    /Activity must belong to the bound Executor task/i,
  );
});
