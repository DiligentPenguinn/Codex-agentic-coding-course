import assert from "node:assert/strict";
import test from "node:test";

import {
  buildTeacherTurnInput,
  createContextReceipt,
  createTeacherContextEnvelope,
} from "../src/main/teacher-context-broker.mjs";

const startRequest = {
  schemaVersion: 1,
  courseRunId: "fixture-course-run",
  lessonId: "module-0",
  missionId: "module-0-read-only-inspection-awareness-fixture",
  checkpointId: "executor-awareness",
  content: { version: "mock-1", rawDiff: "RAW DIFF MUST NOT PASS" },
  workspace: { expectedRepositoryRoot: "C:\\course", exercisePath: "exercise" },
  credential: "SECRET CREDENTIAL MUST NOT PASS",
};

const binding = {
  schemaVersion: 1,
  sessionId: "session-1",
  threadId: "thr-bound",
  displayName: "Practice task",
  workspaceRoot: "C:\\course",
  sourceKind: "created-by-practice",
  boundAt: "2026-08-03T00:00:00.000Z",
  verifiedAt: "2026-08-03T00:00:01.000Z",
  unboundText: "UNBOUND TEXT MUST NOT PASS",
};

const activity = {
  schemaVersion: 1,
  threadId: "thr-bound",
  status: "response-ready",
  cursor: "turn-1:item-1",
  learnerPromptSummary: "Inspect the repository without changes.",
  executorResponseSummary: "The report is ready.",
  activityKinds: ["prompt", "read", "response"],
  changedFiles: [],
  observedAt: "2026-08-03T00:00:02.000Z",
};

function envelope(overrides = {}) {
  return createTeacherContextEnvelope({
    startRequest,
    binding,
    activity: { ...activity, ...overrides },
    clock: () => new Date("2026-08-03T00:00:10.000Z"),
  });
}

function chatMessage(index, overrides = {}) {
  return {
    id: `message-${index}`,
    role: index % 2 ? "learner" : "teacher",
    text: `bounded-message-${index}`,
    createdAt: new Date(Date.UTC(2026, 7, 3, 0, 1, index)).toISOString(),
    ...overrides,
  };
}

test("creates only the versioned bound-thread Teacher context envelope", () => {
  const result = envelope();

  assert.deepEqual(result, {
    schemaVersion: 1,
    course: {
      courseRunId: "fixture-course-run",
      lessonId: "module-0",
      missionId: "module-0-read-only-inspection-awareness-fixture",
      checkpointId: "executor-awareness",
      contentVersion: "mock-1",
    },
    executor: { threadId: "thr-bound", status: "response-ready", activity },
    freshness: { observedAt: activity.observedAt, state: "fresh" },
    privacy: { scope: "bound-thread-only", redactionsApplied: true },
    provenance: { sources: ["practice-start-request", "bound-executor-task"] },
  });
  assert.doesNotMatch(JSON.stringify(result), /SECRET CREDENTIAL|RAW DIFF|UNBOUND TEXT/);
});

test("marks age at the threshold and stale activity as stale, and disconnected activity as disconnected", () => {
  assert.equal(createTeacherContextEnvelope({
    startRequest,
    binding,
    activity,
    clock: () => new Date("2026-08-03T00:00:17.000Z"),
  }).freshness.state, "stale");
  assert.equal(envelope({ status: "stale" }).freshness.state, "stale");
  assert.equal(envelope({ status: "disconnected" }).freshness.state, "disconnected");
});

test("returns a receipt with exactly five display-safe fields", () => {
  assert.deepEqual(createContextReceipt(envelope(), {
    missionTitle: "Inspect ContentPilot Lite",
    taskName: "Practice · Module 0",
  }), {
    missionTitle: "Inspect ContentPilot Lite",
    taskName: "Practice · Module 0",
    observedAt: activity.observedAt,
    freshness: "fresh",
    scopeLabel: "Bound task only",
  });
});

test("serializes only the parsed envelope, newest 40 parsed chat records, and current learner message", () => {
  const chat = Array.from({ length: 42 }, (_, index) => chatMessage(index));
  const input = buildTeacherTurnInput({
    envelope: envelope(),
    chat,
    learnerMessage: "What should I inspect next?",
  });

  assert.match(input, /TEACHER_CONTEXT_ENVELOPE/);
  assert.match(input, /CURRENT_LEARNER_MESSAGE\nWhat should I inspect next\?/);
  assert.doesNotMatch(input, /"bounded-message-(?:0|1)"/);
  assert.match(input, /bounded-message-2/);
  assert.match(input, /bounded-message-41/);
  assert.doesNotMatch(input, /"id":/);
  assert.doesNotMatch(input, /SECRET CREDENTIAL|RAW DIFF|UNBOUND TEXT|raw command output/i);
  const recent = JSON.parse(input.split("RECENT_TEACHER_CHAT\n")[1].split("\nCURRENT_LEARNER_MESSAGE")[0]);
  assert.equal(recent.length, 40);
  assert.deepEqual(Object.keys(recent[0]), ["role", "text", "createdAt"]);
});

test("defensively rejects an invalid envelope and any invalid chat message before slicing", () => {
  assert.throws(() => buildTeacherTurnInput({
    envelope: { ...envelope(), secret: "must reject" },
    chat: [],
    learnerMessage: "Hello",
  }), /Unknown Teacher envelope field/);
  assert.throws(() => buildTeacherTurnInput({
    envelope: envelope(),
    chat: [chatMessage(0, { rawOutput: "must reject" }), ...Array.from({ length: 40 }, (_, index) => chatMessage(index + 1))],
    learnerMessage: "Hello",
  }), /Unknown Teacher chat message field/);
});

test("rejects empty, non-string, and over-4,000-code-point learner messages", () => {
  for (const learnerMessage of ["", "   ", null, "😀".repeat(4_001)]) {
    assert.throws(
      () => buildTeacherTurnInput({ envelope: envelope(), chat: [], learnerMessage }),
      /learner message/i,
    );
  }
  assert.doesNotThrow(() => buildTeacherTurnInput({
    envelope: envelope(),
    chat: [],
    learnerMessage: "😀".repeat(4_000),
  }));
});
