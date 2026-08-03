import assert from "node:assert/strict";
import test from "node:test";

import {
  createInitialPracticeSession,
  reducePracticeSession,
} from "../src/shared/practice-session-reducer.mjs";

const TIMES = {
  enter: "2026-08-04T00:00:00.000Z",
  mission: "2026-08-04T00:00:01.000Z",
  bind: "2026-08-04T00:00:02.000Z",
  activity: "2026-08-04T00:00:03.000Z",
  pause: "2026-08-04T00:00:04.000Z",
};
const SESSION_ID = "11111111-1111-4111-8111-111111111111";

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

function binding(threadId = "thr-one") {
  return {
    schemaVersion: 1,
    sessionId: SESSION_ID,
    threadId,
    displayName: "Practice task",
    workspaceRoot: "C:\\course",
    sourceKind: "created-by-practice",
    boundAt: TIMES.bind,
    verifiedAt: TIMES.bind,
  };
}

function activity(threadId = "thr-one", kinds = []) {
  return {
    schemaVersion: 1,
    threadId,
    status: "ready",
    cursor: "turn-1:item-1",
    learnerPromptSummary: "",
    executorResponseSummary: "",
    activityKinds: kinds,
    changedFiles: [],
    observedAt: TIMES.activity,
  };
}

function entered() {
  return createInitialPracticeSession(startRequest(), SESSION_ID, () => new Date(TIMES.enter));
}

function boundSession(lifecycle = "ready") {
  const needsBinding = reducePracticeSession(entered(), { type: "MISSION_READY", at: TIMES.mission });
  const ready = reducePracticeSession(needsBinding, {
    type: "BINDING_VERIFIED",
    binding: binding(),
    activity: activity(),
    at: TIMES.bind,
  });
  return lifecycle === "ready" ? ready : { ...ready, lifecycle };
}

test("ENTER creates an immutable entering session and defensively clones the pinned request", () => {
  const request = startRequest();
  const session = reducePracticeSession(null, {
    type: "ENTER",
    startRequest: request,
    sessionId: SESSION_ID,
    clock: () => new Date(TIMES.enter),
  });
  request.content.title = "mutated";

  assert.equal(Object.isFrozen(session), true);
  assert.equal(session.lifecycle, "entering");
  assert.equal(session.startRequest.content.title, "Practice safely");
  assert.equal(session.updatedAt, TIMES.enter);
});

test("approved lifecycle events enter, bind, activate, pause, and resume without completion state", () => {
  const entering = entered();
  const needsBinding = reducePracticeSession(entering, { type: "MISSION_READY", at: TIMES.mission });
  const ready = reducePracticeSession(needsBinding, {
    type: "BINDING_VERIFIED", binding: binding(), activity: activity(), at: TIMES.bind,
  });
  const active = reducePracticeSession(ready, {
    type: "ACTIVITY_OBSERVED", activity: activity("thr-one", ["prompt"]), at: TIMES.activity,
  });
  const paused = reducePracticeSession(active, { type: "PAUSE", at: TIMES.pause });
  const resumed = reducePracticeSession(paused, { type: "RESUME", at: TIMES.activity });

  assert.deepEqual(
    [entering.lifecycle, needsBinding.lifecycle, ready.lifecycle, active.lifecycle, paused.lifecycle, resumed.lifecycle],
    ["entering", "needs-binding", "ready", "active", "paused", "active"],
  );
  assert.equal(ready.observationCursor, "turn-1:item-1");
  assert.equal(ready.boundAt, TIMES.bind);
  assert.strictEqual(reducePracticeSession(active, { type: "COMPLETE", at: TIMES.pause }), active);
});

test("BINDING_VERIFIED validates exact identity and clones binding and activity", () => {
  const needsBinding = reducePracticeSession(entered(), { type: "MISSION_READY", at: TIMES.mission });
  const nextBinding = binding();
  const nextActivity = activity();
  const ready = reducePracticeSession(needsBinding, {
    type: "BINDING_VERIFIED", binding: nextBinding, activity: nextActivity, at: TIMES.bind,
  });
  nextBinding.displayName = "mutated";
  nextActivity.status = "disconnected";

  assert.equal(ready.binding.displayName, "Practice task");
  assert.equal(ready.activity.status, "ready");
  assert.throws(() => reducePracticeSession(needsBinding, {
    type: "BINDING_VERIFIED", binding: binding("thr-one"), activity: activity("thr-other"), at: TIMES.bind,
  }), /same Executor task|thread/i);
});

test("wrong-thread activity and PAUSE without a binding are identity-preserving no-ops", () => {
  const ready = boundSession();
  const unbound = reducePracticeSession(entered(), { type: "MISSION_READY", at: TIMES.mission });

  assert.strictEqual(reducePracticeSession(ready, {
    type: "ACTIVITY_OBSERVED", activity: activity("thr-decoy", ["prompt"]), at: TIMES.activity,
  }), ready);
  assert.strictEqual(reducePracticeSession(unbound, { type: "PAUSE", at: TIMES.pause }), unbound);
});

test("BINDING_LOST retains binding and marks only an existing activity disconnected", () => {
  const ready = boundSession();
  const lost = reducePracticeSession(ready, {
    type: "BINDING_LOST",
    error: "The bound Codex task is disconnected. Retry or rebind explicitly.",
    at: TIMES.pause,
  });
  const withoutActivity = { ...ready, activity: null, observationCursor: null };
  const lostWithoutActivity = reducePracticeSession(withoutActivity, {
    type: "BINDING_LOST", error: "disconnected", at: TIMES.pause,
  });

  assert.equal(lost.binding.threadId, "thr-one");
  assert.equal(lost.activity.status, "disconnected");
  assert.equal(lost.activity.observedAt, TIMES.pause);
  assert.equal(lostWithoutActivity.activity, null);
});

test("REBIND_REQUESTED clears binding identity and observation state but preserves the mission", () => {
  const ready = boundSession();
  const rebound = reducePracticeSession(ready, { type: "REBIND_REQUESTED", at: TIMES.pause });

  assert.equal(rebound.lifecycle, "needs-binding");
  assert.equal(rebound.binding, null);
  assert.equal(rebound.activity, null);
  assert.equal(rebound.observationCursor, null);
  assert.equal(rebound.boundAt, null);
  assert.deepEqual(rebound.startRequest, ready.startRequest);
});

test("unknown and invalid events preserve identity instead of corrupting a session", () => {
  const ready = boundSession();

  assert.strictEqual(reducePracticeSession(ready, { type: "UNKNOWN", secret: "raw" }), ready);
  assert.strictEqual(reducePracticeSession(ready, null), ready);
  assert.strictEqual(reducePracticeSession(null, { type: "MISSION_READY" }), null);
  assert.throws(() => createInitialPracticeSession({ bad: true }, SESSION_ID), /Practice start request|schemaVersion/);
});
