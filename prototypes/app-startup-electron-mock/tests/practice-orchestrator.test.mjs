import assert from "node:assert/strict";
import test from "node:test";

import { createPracticeOrchestrator } from "../src/main/practice-orchestrator.mjs";
import { createDefaultPracticeState } from "../src/shared/practice-state-schema.mjs";

const ROOT = "C:\\course";
const NOW = "2026-08-04T00:00:00.000Z";
const NEXT = "2026-08-04T00:00:01.000Z";
const SESSION_ID = "11111111-1111-4111-8111-111111111111";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}

async function tick() {
  await new Promise((resolve) => setImmediate(resolve));
}

function startRequest() {
  return {
    schemaVersion: 1,
    courseRunId: "run-1",
    lessonId: "module-0",
    missionId: "mission-1",
    checkpointId: "checkpoint-1",
    content: {
      version: "mock-1", locale: "vi-VN", title: "Practice safely",
      description: "Inspect the repository.", learningOutcomes: ["Inspect first"],
      instructions: ["Use read-only tools"], allowedActions: ["Read"],
      prohibitedActions: ["Delete"], expectedEvidence: ["A report"],
      kind: "mock-adaptation", owner: "Triết",
    },
    workspace: { expectedRepositoryRoot: ROOT, exercisePath: "exercises/one" },
  };
}

function binding(threadId = "thr-one", overrides = {}) {
  return {
    schemaVersion: 1, sessionId: SESSION_ID, threadId,
    displayName: `Practice ${threadId}`, workspaceRoot: ROOT,
    sourceKind: "created-by-practice", boundAt: NOW, verifiedAt: NOW,
    ...overrides,
  };
}

function activity(threadId = "thr-one", overrides = {}) {
  return {
    schemaVersion: 1, threadId, status: "ready", cursor: "initial",
    learnerPromptSummary: "", executorResponseSummary: "",
    activityKinds: [], changedFiles: [], observedAt: NOW,
    ...overrides,
  };
}

function activeSession(overrides = {}) {
  return {
    sessionId: SESSION_ID, lifecycle: "ready", startRequest: startRequest(),
    binding: binding(), activity: activity(), observationCursor: "initial",
    boundAt: NOW, error: null, updatedAt: NOW, ...overrides,
  };
}

function state(overrides = {}) {
  return {
    ...createDefaultPracticeState(() => new Date(NOW)),
    ...overrides,
  };
}

function message(index, role = index % 2 ? "learner" : "teacher") {
  return {
    id: `message-${index}`, role, text: `message ${index}`,
    createdAt: new Date(Date.UTC(2026, 7, 4, 0, 0, index)).toISOString(),
  };
}

function createHarness(options = {}) {
  let stored = structuredClone(options.initialState ?? state());
  let snapshotListener = null;
  let removed = false;
  const writes = [];
  const bindCalls = [];
  const calls = [];
  const pauseCalls = [];
  const teacherCalls = [];
  let disposedReader = false;
  let disposedTeacher = false;
  let observing = false;

  const store = options.store ?? {
    async read() { return structuredClone(stored); },
    async write(value) {
      writes.push(structuredClone(value));
      if (options.writeImpl) {
        const result = await options.writeImpl(value, writes.length);
        if (result) stored = structuredClone(result);
      } else {
        stored = structuredClone(value);
      }
      return structuredClone(stored);
    },
  };

  const conversationService = {
    async createDedicatedTask(request, sessionId) {
      calls.push(["create", request, sessionId]);
      if (options.createDedicatedTask) return options.createDedicatedTask(request, sessionId);
      return { binding: binding(), handoff: { opened: true, fallbackName: "Practice thr-one" } };
    },
    async listEligibleTasks(request) {
      calls.push(["list", request]);
      return options.eligible ?? [{ threadId: "thr-one", displayName: "Eligible", updatedAt: NOW, status: "idle" }];
    },
    async bindExistingTask(request, sessionId, threadId) {
      calls.push(["bind", request, sessionId, threadId]);
      if (options.bindExistingTask) return options.bindExistingTask(request, sessionId, threadId);
      return binding(threadId, { sourceKind: "selected-existing" });
    },
    async revalidateBinding(request, currentBinding) {
      calls.push(["revalidate", request, currentBinding]);
      if (options.revalidateBinding) return options.revalidateBinding(request, currentBinding);
      return { binding: structuredClone(currentBinding), thread: { id: currentBinding.threadId } };
    },
    async openBoundTask(currentBinding) {
      calls.push(["open", currentBinding]);
      if (options.openBoundTask) return options.openBoundTask(currentBinding);
      return { opened: true, fallbackName: currentBinding.displayName };
    },
  };

  const activityReader = {
    onSnapshot(listener) {
      snapshotListener = listener;
      return () => { removed = true; snapshotListener = null; };
    },
    async bind(nextBinding) {
      bindCalls.push(structuredClone(nextBinding));
      observing = true;
      if (options.activityBind) return options.activityBind(nextBinding, snapshotListener);
      return activity(nextBinding.threadId);
    },
    async refresh() {
      if (options.activityRefresh) return options.activityRefresh();
      return stored.activeSession?.activity ?? null;
    },
    pause() { pauseCalls.push(true); observing = false; },
    dispose() { disposedReader = true; observing = false; },
  };

  const teacherAdapter = {
    async respond(input) {
      teacherCalls.push(structuredClone(input));
      if (options.teacherRespond) return options.teacherRespond(input);
      return "Use the current bound report.";
    },
    async dispose() { disposedTeacher = true; },
  };

  const orchestrator = createPracticeOrchestrator({
    startRequest: options.startRequest ?? startRequest(),
    store, conversationService, activityReader, teacherAdapter,
    randomUUID: options.randomUUID ?? (() => SESSION_ID),
    clock: options.clock ?? (() => new Date(NOW)),
  });

  return {
    orchestrator, writes, bindCalls, calls, pauseCalls, teacherCalls,
    emitActivity(value) { snapshotListener?.(structuredClone(value)); },
    get stored() { return structuredClone(stored); },
    get removed() { return removed; },
    get disposedReader() { return disposedReader; },
    get disposedTeacher() { return disposedTeacher; },
    get observing() { return observing; },
  };
}

async function startedHarness(options = {}) {
  const harness = createHarness(options);
  await harness.orchestrator.initialize();
  await harness.orchestrator.startPractice();
  return harness;
}

async function boundHarness(options = {}) {
  const harness = await startedHarness(options);
  await harness.orchestrator.createDedicatedTask();
  return harness;
}

test("startPractice pins one validated UUID session, persists needs-binding, and emits the exact safe ViewModel", async () => {
  const request = startRequest();
  const harness = createHarness({ startRequest: request });
  const observed = [];
  harness.orchestrator.onChange((value) => observed.push(value));
  await harness.orchestrator.initialize();

  const view = await harness.orchestrator.startPractice();
  request.content.title = "mutated after start";
  await harness.orchestrator.startPractice();

  assert.equal(harness.writes.length, 1);
  assert.equal(harness.stored.activeSession.lifecycle, "needs-binding");
  assert.equal(view.session.sessionId, SESSION_ID);
  assert.equal(view.session.mission.title, "Practice safely");
  assert.deepEqual(Object.keys(view), ["session", "presentation"]);
  assert.deepEqual(Object.keys(view.session), [
    "sessionId", "lifecycle", "mission", "executor", "contextReceipt", "teacherChat", "error",
  ]);
  assert.equal(observed.at(-1).session.lifecycle, "needs-binding");
});

test("failed dedicated creation or reader binding never changes the stored binding and returns a fixed safe error", async () => {
  for (const options of [
    { createDedicatedTask: async () => { throw new Error("RAW thread/name/set failure"); } },
    { activityBind: async () => { throw new Error("RAW resume failure"); } },
  ]) {
    const harness = await startedHarness(options);
    const view = await harness.orchestrator.createDedicatedTask();
    assert.equal(harness.stored.activeSession.binding, null);
    assert.equal(view.session.executor.bound, false);
    assert.equal(view.session.error, "A dedicated Codex task could not be created. Retry or choose an eligible task.");
    assert.doesNotMatch(JSON.stringify(view), /RAW/);
  }
});

test("successful creation verifies exact activity identity before atomically persisting binding and handoff", async () => {
  const harness = await startedHarness();

  const view = await harness.orchestrator.createDedicatedTask();

  assert.equal(harness.bindCalls.length, 1);
  assert.equal(harness.stored.activeSession.binding.threadId, "thr-one");
  assert.equal(harness.stored.activeSession.activity.threadId, "thr-one");
  assert.deepEqual(view.session.executor.handoff, { opened: true, fallbackName: "Practice thr-one" });
  assert.doesNotMatch(JSON.stringify(view), /threadId|workspaceRoot|cursor/);
});

test("wrong-ID creation binding activity and retry snapshots are rejected without replacing the committed identity", async () => {
  const createHarnessWrong = await startedHarness({ activityBind: async () => activity("thr-decoy") });
  const createView = await createHarnessWrong.orchestrator.createDedicatedTask();
  assert.equal(createHarnessWrong.stored.activeSession.binding, null);
  assert.equal(createView.session.error, "A dedicated Codex task could not be created. Retry or choose an eligible task.");

  const retryHarness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    activityBind: async () => activity("thr-decoy"),
  });
  await retryHarness.orchestrator.initialize();
  const retryView = await retryHarness.orchestrator.retryObservation();
  assert.equal(retryHarness.stored.activeSession.binding.threadId, "thr-one");
  assert.equal(retryHarness.stored.activeSession.activity.threadId, "thr-one");
  assert.equal(retryView.session.error, "The bound Codex task is disconnected. Retry or rebind explicitly.");
});

test("explicit existing-task replacement clears the old cursor only after the new exact binding verifies", async () => {
  const pending = deferred();
  let activityBindCount = 0;
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    bindExistingTask: async () => pending.promise,
    activityBind: async (nextBinding) => {
      activityBindCount += 1;
      return activity(nextBinding.threadId, { cursor: activityBindCount === 1 ? "initial" : "new-cursor" });
    },
  });
  await harness.orchestrator.initialize();
  const replacing = harness.orchestrator.bindExistingTask("thr-two");
  await tick();
  assert.equal(harness.stored.activeSession.observationCursor, "initial");

  pending.resolve(binding("thr-two", { sourceKind: "selected-existing" }));
  await replacing;
  assert.equal(harness.stored.activeSession.binding.threadId, "thr-two");
  assert.equal(harness.stored.activeSession.observationCursor, "new-cursor");
});

test("a failed same-ID replacement cannot persist provisional reader activity or clear the old cursor", async () => {
  let bindCount = 0;
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    bindExistingTask: async () => binding("thr-one", { sourceKind: "selected-existing" }),
    activityBind: async (nextBinding, listener) => {
      bindCount += 1;
      if (bindCount === 1) return activity(nextBinding.threadId);
      if (bindCount === 2) {
        listener?.(activity(nextBinding.threadId, { cursor: "provisional-cursor", status: "working" }));
        throw new Error("RAW bind failure");
      }
      return activity(nextBinding.threadId);
    },
  });
  await harness.orchestrator.initialize();

  const view = await harness.orchestrator.bindExistingTask("thr-one");

  assert.equal(harness.stored.activeSession.observationCursor, "initial");
  assert.equal(harness.stored.activeSession.activity.status, "ready");
  assert.equal(view.session.error, "That Codex task is unavailable or belongs to a different workspace.");
});

test("a reader that switches before rejecting is rolled back exactly before replacement failure leaves transition", async () => {
  let bindCount = 0;
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    activityBind: async (nextBinding, listener) => {
      bindCount += 1;
      if (bindCount === 1) return activity(nextBinding.threadId);
      if (bindCount === 2) {
        listener?.(activity(nextBinding.threadId, { cursor: "provisional-new" }));
        throw new Error("reader switched before rejecting");
      }
      return activity(nextBinding.threadId, { cursor: "rollback-snapshot" });
    },
  });
  await harness.orchestrator.initialize();

  const view = await harness.orchestrator.bindExistingTask("thr-two");

  assert.deepEqual(harness.bindCalls.map(({ threadId }) => threadId), ["thr-one", "thr-two", "thr-one"]);
  assert.ok(harness.pauseCalls.length >= 1);
  assert.equal(harness.stored.activeSession.binding.threadId, "thr-one");
  assert.equal(harness.stored.activeSession.observationCursor, "initial");
  assert.equal(view.session.error, "That Codex task is unavailable or belongs to a different workspace.");
  assert.doesNotMatch(JSON.stringify(harness.stored), /provisional-new/);
});

test("a failed durable replacement write rolls the switched reader back to the exact committed binding", async () => {
  let bindCount = 0;
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    activityBind: async (nextBinding, listener) => {
      bindCount += 1;
      if (bindCount === 2) {
        listener?.(activity(nextBinding.threadId, { cursor: "uncommitted-new-cursor" }));
      }
      return activity(nextBinding.threadId, { cursor: bindCount === 2 ? "verified-new" : "initial" });
    },
    writeImpl: async (value) => {
      if (value.activeSession?.binding?.threadId === "thr-two") throw new Error("disk failed");
      return value;
    },
  });
  await harness.orchestrator.initialize();

  await assert.rejects(
    harness.orchestrator.bindExistingTask("thr-two"),
    /Practice state could not be saved/,
  );

  assert.deepEqual(harness.bindCalls.map(({ threadId }) => threadId), ["thr-one", "thr-two", "thr-one"]);
  assert.ok(harness.pauseCalls.length >= 1);
  assert.equal(harness.stored.activeSession.binding.threadId, "thr-one");
  assert.equal(harness.stored.activeSession.observationCursor, "initial");
  assert.doesNotMatch(JSON.stringify(harness.stored), /uncommitted-new-cursor/);
});

test("rollback failure pauses observation and durably marks the retained binding disconnected", async () => {
  let bindCount = 0;
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    activityBind: async (nextBinding) => {
      bindCount += 1;
      if (bindCount === 1) return activity(nextBinding.threadId);
      if (bindCount === 2) throw new Error("new reader failed after switching");
      throw new Error("old reader rollback failed");
    },
  });
  await harness.orchestrator.initialize();

  const view = await harness.orchestrator.bindExistingTask("thr-two");

  assert.deepEqual(harness.bindCalls.map(({ threadId }) => threadId), ["thr-one", "thr-two", "thr-one"]);
  assert.ok(harness.pauseCalls.length >= 2);
  assert.equal(harness.stored.activeSession.binding.threadId, "thr-one");
  assert.equal(harness.stored.activeSession.activity.status, "disconnected");
  assert.equal(view.session.error, "The bound Codex task is disconnected. Retry or rebind explicitly.");
});

test("wrong-thread listener activity is discarded at the orchestrator boundary", async () => {
  const harness = await boundHarness();
  const beforeWrites = harness.writes.length;

  harness.emitActivity(activity("thr-decoy", { learnerPromptSummary: "DECOY SECRET" }));
  await tick();

  assert.equal(harness.writes.length, beforeWrites);
  assert.doesNotMatch(JSON.stringify(harness.stored), /DECOY SECRET/);
});

test("Teacher input is validated, learner is persisted before inference, current text is not duplicated, and newest 40 remain", async () => {
  const response = deferred();
  const initialChat = Array.from({ length: 39 }, (_, index) => message(index));
  const harness = createHarness({
    initialState: state({ activeSession: activeSession(), teacherChat: initialChat }),
    teacherRespond: async () => response.promise,
    randomUUID: (() => {
      const values = ["learner-new", "teacher-new"];
      return () => values.shift();
    })(),
  });
  await harness.orchestrator.initialize();

  for (const invalid of ["", "   ", "😀".repeat(4_001)]) {
    await assert.rejects(harness.orchestrator.sendTeacherMessage(invalid), /non-empty and at most 4,000 code points/);
  }
  const sending = harness.orchestrator.sendTeacherMessage("What next?");
  await tick();

  assert.equal(harness.stored.teacherChat.at(-1).text, "What next?");
  assert.equal(harness.teacherCalls.length, 1);
  assert.equal(harness.teacherCalls[0].learnerMessage, "What next?");
  assert.equal(harness.teacherCalls[0].chat.some(({ text }) => text === "What next?"), false);
  assert.equal(harness.teacherCalls[0].envelope.executor.threadId, "thr-one");

  response.resolve("Inspect the current report.");
  await sending;
  assert.equal(harness.stored.teacherChat.length, 40);
  assert.equal(harness.stored.teacherChat.at(-1).role, "teacher");
});

test("activity persists while Teacher inference is pending", async () => {
  const response = deferred();
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    teacherRespond: async () => response.promise,
    randomUUID: (() => { const ids = ["learner-1", "teacher-1"]; return () => ids.shift(); })(),
  });
  await harness.orchestrator.initialize();
  const sending = harness.orchestrator.sendTeacherMessage("Can you help?");
  await tick();

  harness.emitActivity(activity("thr-one", {
    cursor: "turn-2:item-1", status: "response-ready", activityKinds: ["prompt", "response"],
    executorResponseSummary: "New bounded activity",
  }));
  await tick();

  assert.equal(harness.stored.activeSession.observationCursor, "turn-2:item-1");
  assert.equal(harness.stored.teacherChat.at(-1).role, "learner");
  response.resolve("Answer");
  await sending;
});

test("Teacher failure retains learner message and exposes only a fixed retryable error", async () => {
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    teacherRespond: async () => { throw new Error("RAW provider credential and protocol error"); },
    randomUUID: () => "learner-1",
  });
  await harness.orchestrator.initialize();

  const view = await harness.orchestrator.sendTeacherMessage("Please help");

  assert.equal(harness.stored.teacherChat.at(-1).text, "Please help");
  assert.equal(view.session.error, "Teacher could not answer from the current context. Retry your message.");
  assert.doesNotMatch(JSON.stringify(view), /credential|protocol/i);
});

test("a pending Teacher answer cannot attach after an explicit replacement starts and commits", async () => {
  const answer = deferred();
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    teacherRespond: async () => answer.promise,
    randomUUID: (() => { const ids = ["learner-old", "teacher-old"]; return () => ids.shift(); })(),
  });
  await harness.orchestrator.initialize();
  const sending = harness.orchestrator.sendTeacherMessage("Question for old task");
  await tick();

  await harness.orchestrator.bindExistingTask("thr-two");
  answer.resolve("OLD TASK ANSWER MUST NOT PERSIST");
  await sending;

  assert.equal(harness.stored.activeSession.binding.threadId, "thr-two");
  assert.deepEqual(harness.stored.teacherChat.map(({ role }) => role), ["learner"]);
  assert.doesNotMatch(JSON.stringify(harness.orchestrator.getViewModel()), /OLD TASK ANSWER/);
});

test("a pending Teacher answer cannot attach after requestRebind clears the committed binding", async () => {
  const answer = deferred();
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    teacherRespond: async () => answer.promise,
    randomUUID: (() => { const ids = ["learner-old", "teacher-old"]; return () => ids.shift(); })(),
  });
  await harness.orchestrator.initialize();
  const sending = harness.orchestrator.sendTeacherMessage("Question before rebind");
  await tick();

  await harness.orchestrator.requestRebind();
  answer.resolve("OLD REBIND ANSWER MUST NOT PERSIST");
  await sending;

  assert.equal(harness.stored.activeSession.binding, null);
  assert.deepEqual(harness.stored.teacherChat.map(({ role }) => role), ["learner"]);
  assert.doesNotMatch(JSON.stringify(harness.orchestrator.getViewModel()), /OLD REBIND ANSWER/);
});

test("initialize revalidates only the saved binding and suppresses stale bind emissions before one atomic commit", async () => {
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    activityBind: async (nextBinding, listener) => {
      listener?.(activity(nextBinding.threadId, { cursor: "provisional" }));
      return activity(nextBinding.threadId, { cursor: "verified" });
    },
  });

  await harness.orchestrator.initialize();

  assert.deepEqual(harness.calls.filter(([kind]) => kind === "revalidate").map(([, , item]) => item.threadId), ["thr-one"]);
  assert.equal(harness.writes.length, 1);
  assert.equal(harness.stored.activeSession.observationCursor, "verified");
});

test("the first bound initialization emission is already usable by public operations", async () => {
  const harness = createHarness({ initialState: state({ activeSession: activeSession() }) });
  let reaction = null;
  harness.orchestrator.onChange((view) => {
    if (!view.session || reaction) return;
    try {
      reaction = Promise.resolve(harness.orchestrator.selectTab("teacher"));
    } catch (error) {
      reaction = Promise.reject(error);
      void reaction.catch(() => undefined);
    }
  });

  await harness.orchestrator.initialize();

  assert.ok(reaction);
  await assert.doesNotReject(reaction);
  assert.equal(harness.orchestrator.getViewModel().presentation.lastFullTab, "teacher");
});

test("a failed initialization write stays uninitialized, pauses observation, and ignores later snapshots", async () => {
  const writeGate = deferred();
  const writeStarted = deferred();
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    writeImpl: async (value, writeNumber) => {
      if (writeNumber === 1) {
        writeStarted.resolve();
        return writeGate.promise;
      }
      return value;
    },
  });
  const observed = [];
  harness.orchestrator.onChange((value) => observed.push(value));
  const initializing = harness.orchestrator.initialize();
  await writeStarted.promise;
  harness.emitActivity(activity("thr-one", { cursor: "during-initialize" }));
  writeGate.reject(new Error("initial state write failed"));

  await assert.rejects(initializing, /Practice state could not be saved/);
  const writesAfterFailure = harness.writes.length;
  harness.emitActivity(activity("thr-one", { cursor: "after-failed-initialize" }));
  await tick();

  assert.equal(harness.writes.length, writesAfterFailure);
  assert.equal(observed.length, 0);
  assert.equal(harness.observing, false);
  assert.ok(harness.pauseCalls.length >= 1);
  assert.throws(() => harness.orchestrator.startPractice(), /initialized safely/i);
});

test("failed restart revalidation retains the exact binding, marks disconnected, and never lists or substitutes", async () => {
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    revalidateBinding: async () => { throw new Error("RAW missing thread"); },
  });

  const view = await harness.orchestrator.initialize();

  assert.equal(harness.stored.activeSession.binding.threadId, "thr-one");
  assert.equal(harness.stored.activeSession.activity.status, "disconnected");
  assert.deepEqual(harness.calls.map(([kind]) => kind), ["revalidate"]);
  assert.equal(view.session.error, "The bound Codex task is disconnected. Retry or rebind explicitly.");
});

test("restart rejects mutation of the saved binding identity even when the thread ID matches", async () => {
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    revalidateBinding: async (_request, saved) => ({
      binding: { ...saved, displayName: "Substituted task name", verifiedAt: NEXT },
      thread: { id: saved.threadId },
    }),
  });

  const view = await harness.orchestrator.initialize();

  assert.equal(harness.stored.activeSession.binding.displayName, "Practice thr-one");
  assert.equal(harness.stored.activeSession.activity.status, "disconnected");
  assert.equal(view.session.executor.taskName, "Practice thr-one");
});

test("a saved binding without activity is exposed as disconnected when restart validation fails", async () => {
  const harness = createHarness({
    initialState: state({ activeSession: activeSession({ activity: null, observationCursor: null }) }),
    revalidateBinding: async () => { throw new Error("RAW missing task"); },
  });

  const view = await harness.orchestrator.initialize();

  assert.equal(harness.stored.activeSession.binding.threadId, "thr-one");
  assert.equal(harness.stored.activeSession.activity, null);
  assert.equal(view.session.executor.status, "disconnected");
  assert.equal(view.session.executor.freshness, "disconnected");
});

test("failed retry retains the exact binding and persists a disconnected activity", async () => {
  let bindCount = 0;
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    activityBind: async (nextBinding) => {
      bindCount += 1;
      if (bindCount === 1) return activity(nextBinding.threadId);
      throw new Error("RAW retry failure");
    },
  });
  await harness.orchestrator.initialize();

  const view = await harness.orchestrator.retryObservation();

  assert.equal(harness.stored.activeSession.binding.threadId, "thr-one");
  assert.equal(harness.stored.activeSession.activity.status, "disconnected");
  assert.equal(view.session.executor.status, "disconnected");
  assert.equal(view.session.error, "The bound Codex task is disconnected. Retry or rebind explicitly.");
});

test("pause preserves mission, binding, chat, and presentation while stopping observation", async () => {
  const initial = state({
    activeSession: activeSession({ lifecycle: "active" }), teacherChat: [message(1)],
    presentation: { ...state().presentation, mode: "compact", lastFullTab: "teacher" },
  });
  const harness = createHarness({ initialState: initial });
  await harness.orchestrator.initialize();
  const before = harness.orchestrator.getViewModel();

  const after = await harness.orchestrator.pause();

  assert.equal(harness.pauseCalls.length, 1);
  assert.equal(after.session.lifecycle, "paused");
  assert.deepEqual(after.session.mission, before.session.mission);
  assert.deepEqual(after.session.teacherChat, before.session.teacherChat);
  assert.deepEqual(after.presentation, before.presentation);
  assert.equal(harness.stored.activeSession.binding.threadId, "thr-one");
});

test("ViewModel and handoff expose only the exact safe renderer shape", async () => {
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    openBoundTask: async () => ({
      opened: false, fallbackName: "Practice thr-one", threadId: "SECRET-ID", rawOutput: "SECRET OUTPUT",
    }),
  });
  await harness.orchestrator.initialize();
  const view = await harness.orchestrator.openBoundTask();
  const serialized = JSON.stringify(view);

  assert.deepEqual(Object.keys(view.session.executor), [
    "bound", "taskName", "sourceKind", "status", "freshness", "observedAt", "handoff",
  ]);
  assert.deepEqual(view.session.executor.handoff, { opened: false, fallbackName: "Practice thr-one" });
  assert.doesNotMatch(serialized, /C:\\\\course|threadId|workspaceRoot|cursor|rawOutput|diff|reasoning|credential|environment|SECRET/);
});

test("requestRebind blocks new Teacher and handoff work synchronously before the queued clear commits", async () => {
  const clearGate = deferred();
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    writeImpl: async (value, writeNumber) => writeNumber === 2
      ? clearGate.promise.then(() => value)
      : value,
  });
  await harness.orchestrator.initialize();

  const rebinding = harness.orchestrator.requestRebind();
  let teacherOutcome = "pending";
  let openOutcome = "pending";
  const teacherAttempt = harness.orchestrator.sendTeacherMessage("Too late").then(
    () => { teacherOutcome = "resolved"; },
    (error) => { teacherOutcome = error.message; },
  );
  const openAttempt = harness.orchestrator.openBoundTask().then(
    () => { openOutcome = "resolved"; },
    (error) => { openOutcome = error.message; },
  );
  await tick();
  const immediateTeacherOutcome = teacherOutcome;
  const immediateOpenOutcome = openOutcome;

  clearGate.resolve();
  await Promise.allSettled([rebinding, teacherAttempt, openAttempt]);
  assert.match(immediateTeacherOutcome, /binding is changing/i);
  assert.match(immediateOpenOutcome, /binding is changing/i);
  assert.equal(harness.teacherCalls.length, 0);
  assert.equal(harness.calls.some(([kind]) => kind === "open"), false);
  assert.equal(harness.stored.activeSession.binding, null);
});

test("a failed durable rebind clear restores the exact prior reader before leaving transition", async () => {
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    writeImpl: async (value) => {
      if (value.activeSession?.binding === null) throw new Error("clear failed");
      return value;
    },
  });
  await harness.orchestrator.initialize();

  await assert.rejects(harness.orchestrator.requestRebind(), /Practice state could not be saved/);

  assert.deepEqual(harness.bindCalls.map(({ threadId }) => threadId), ["thr-one", "thr-one"]);
  assert.ok(harness.pauseCalls.length >= 1);
  assert.equal(harness.orchestrator.getViewModel().session.executor.bound, true);
  await assert.doesNotReject(harness.orchestrator.openBoundTask());
});

test("requestRebind exclusively owns the binding lock until its gated clear commits", async () => {
  const clearGate = deferred();
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    writeImpl: async (value, writeNumber) => writeNumber === 2
      ? clearGate.promise.then(() => value)
      : value,
  });
  await harness.orchestrator.initialize();
  const originalRebind = harness.orchestrator.requestRebind();
  const outcomes = new Map();
  const attempt = (name, operation) => {
    let result;
    try {
      result = operation();
    } catch (error) {
      outcomes.set(name, error.message);
      return Promise.resolve();
    }
    return Promise.resolve(result).then(
      () => outcomes.set(name, "resolved"),
      (error) => outcomes.set(name, error.message),
    );
  };
  const attempts = [
    attempt("create", () => harness.orchestrator.createDedicatedTask()),
    attempt("bind", () => harness.orchestrator.bindExistingTask("thr-two")),
    attempt("retry", () => harness.orchestrator.retryObservation()),
    attempt("rebind", () => harness.orchestrator.requestRebind()),
  ];
  await tick();
  const immediate = new Map(outcomes);

  clearGate.resolve();
  await Promise.allSettled([originalRebind, ...attempts]);

  for (const name of ["create", "bind", "retry", "rebind"]) {
    assert.match(immediate.get(name) ?? "pending", /binding.*(?:changing|progress)/i, name);
  }
  assert.deepEqual(harness.calls.filter(([kind]) => ["create", "bind"].includes(kind)), []);
  assert.equal(harness.pauseCalls.length, 1);
  assert.equal(harness.writes.length, 2);
  assert.equal(harness.stored.activeSession.binding, null);
});

test("failed replacement from paused restores the exact reader identity but keeps observation paused", async () => {
  let bindCount = 0;
  const harness = createHarness({
    initialState: state({ activeSession: activeSession({ lifecycle: "active" }) }),
    activityBind: async (nextBinding) => {
      bindCount += 1;
      if (bindCount === 2) throw new Error("new reader switched then failed");
      return activity(nextBinding.threadId);
    },
  });
  await harness.orchestrator.initialize();
  await harness.orchestrator.pause();

  const view = await harness.orchestrator.bindExistingTask("thr-two");

  assert.deepEqual(harness.bindCalls.map(({ threadId }) => threadId), ["thr-one", "thr-two", "thr-one"]);
  assert.equal(view.session.lifecycle, "paused");
  assert.equal(harness.observing, false);
  assert.ok(harness.pauseCalls.length >= 3);
});

test("failed rebind clear from paused restores the exact reader identity without resuming observation", async () => {
  const harness = createHarness({
    initialState: state({ activeSession: activeSession({ lifecycle: "active" }) }),
    writeImpl: async (value) => {
      if (value.activeSession?.binding === null) throw new Error("clear failed");
      return value;
    },
  });
  await harness.orchestrator.initialize();
  await harness.orchestrator.pause();

  await assert.rejects(harness.orchestrator.requestRebind(), /Practice state could not be saved/);

  assert.deepEqual(harness.bindCalls.map(({ threadId }) => threadId), ["thr-one", "thr-one"]);
  assert.equal(harness.orchestrator.getViewModel().session.lifecycle, "paused");
  assert.equal(harness.observing, false);
  assert.ok(harness.pauseCalls.length >= 3);
});

test("rebind takeover inherits paused committed mode after an uncommitted reader switch", async () => {
  const replacementWrite = deferred();
  const replacementWriteStarted = deferred();
  const harness = createHarness({
    initialState: state({ activeSession: activeSession({ lifecycle: "active" }) }),
    writeImpl: async (value) => {
      if (value.activeSession?.binding?.threadId === "thr-two") {
        replacementWriteStarted.resolve();
        return replacementWrite.promise.then(() => value);
      }
      if (value.activeSession?.binding === null) throw new Error("clear failed");
      return value;
    },
  });
  await harness.orchestrator.initialize();
  await harness.orchestrator.pause();
  const replacing = harness.orchestrator.bindExistingTask("thr-two");
  await replacementWriteStarted.promise;

  const rebinding = harness.orchestrator.requestRebind();
  replacementWrite.resolve();
  await replacing;
  await assert.rejects(rebinding, /Practice state could not be saved/);

  assert.deepEqual(harness.bindCalls.map(({ threadId }) => threadId), ["thr-one", "thr-two", "thr-one"]);
  assert.equal(harness.orchestrator.getViewModel().session.lifecycle, "paused");
  assert.equal(harness.observing, false);
});

test("a pending open result is dropped when rebind invalidates its committed binding generation", async () => {
  const opened = deferred();
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    openBoundTask: async () => opened.promise,
  });
  await harness.orchestrator.initialize();
  const opening = harness.orchestrator.openBoundTask();
  await tick();

  await harness.orchestrator.requestRebind();
  opened.resolve({ opened: true, fallbackName: "OLD HANDOFF MUST NOT PERSIST" });
  await opening;

  const view = harness.orchestrator.getViewModel();
  assert.equal(view.session.executor.handoff, null);
  assert.doesNotMatch(JSON.stringify(view), /OLD HANDOFF/);
});

test("unknown persisted session errors are mapped to one fixed safe fallback", async () => {
  const unsafe = "C:\\Users\\learner\\secret.txt protocol failure apiKey=credential environment=private";
  const harness = createHarness({
    initialState: state({
      activeSession: activeSession({
        lifecycle: "needs-binding", binding: null, activity: null,
        observationCursor: null, boundAt: null, error: unsafe,
      }),
    }),
  });

  const view = await harness.orchestrator.initialize();

  assert.equal(view.session.error, "Practice encountered a recoverable issue. Retry or restart the session.");
  assert.doesNotMatch(JSON.stringify(view), /Users|secret\.txt|protocol|apiKey|credential|environment|private/i);
});

test("serialized writes preserve order across delayed presentation, activity, and Teacher updates", async () => {
  const firstWrite = deferred();
  let stored = state({ activeSession: activeSession() });
  let writeNumber = 0;
  const writeInputs = [];
  const store = {
    async read() { return structuredClone(stored); },
    async write(value) {
      writeNumber += 1;
      writeInputs.push(structuredClone(value));
      if (writeNumber === 2) await firstWrite.promise;
      stored = structuredClone(value);
      return structuredClone(stored);
    },
  };
  const harness = createHarness({ store, initialState: stored });
  await harness.orchestrator.initialize();
  const presentation = harness.orchestrator.setPresentation("compact");
  await tick();
  harness.emitActivity(activity("thr-one", { cursor: "new-cursor", status: "working" }));
  const teacher = harness.orchestrator.sendTeacherMessage("Help");
  await tick();
  assert.equal(writeInputs.length, 2);

  firstWrite.resolve();
  await presentation;
  await teacher;
  await tick();

  assert.equal(stored.presentation.mode, "compact");
  assert.equal(stored.activeSession.observationCursor, "new-cursor");
  assert.deepEqual(stored.teacherChat.map(({ role }) => role), ["learner", "teacher"]);
});

test("a store write failure leaves the prior in-memory ViewModel committed and is handled safely", async () => {
  let stored = state();
  let shouldFail = false;
  const store = {
    async read() { return structuredClone(stored); },
    async write(value) {
      if (shouldFail) throw new Error("RAW disk path and credential");
      stored = structuredClone(value);
      return structuredClone(stored);
    },
  };
  const harness = createHarness({ store });
  await harness.orchestrator.initialize();
  await harness.orchestrator.startPractice();
  const before = harness.orchestrator.getViewModel();
  shouldFail = true;

  await assert.rejects(harness.orchestrator.setPresentation("compact"), /Practice state could not be saved/);

  assert.deepEqual(harness.orchestrator.getViewModel(), before);
  assert.doesNotMatch(JSON.stringify(harness.orchestrator.getViewModel()), /disk path|credential/i);
});

test("dispose synchronously clears listeners and a pending write cannot commit ViewModel or handoff afterward", async () => {
  const pendingWrite = deferred();
  const writeStarted = deferred();
  const harness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    createDedicatedTask: async () => ({
      binding: binding("thr-two"),
      handoff: { opened: true, fallbackName: "LATE HANDOFF" },
    }),
    writeImpl: async (value) => {
      if (value.activeSession?.binding?.threadId === "thr-two") {
        writeStarted.resolve();
        await pendingWrite.promise;
      }
      return value;
    },
  });
  await harness.orchestrator.initialize();
  const observed = [];
  harness.orchestrator.onChange((value) => observed.push(value));
  const before = harness.orchestrator.getViewModel();
  const creating = harness.orchestrator.createDedicatedTask();
  await writeStarted.promise;
  const observedBeforeDispose = observed.length;

  const disposing = harness.orchestrator.dispose();
  assert.equal(harness.removed, true);
  assert.equal(harness.disposedReader, true);
  assert.throws(() => harness.orchestrator.createDedicatedTask(), /disposed/);
  pendingWrite.resolve();
  await Promise.all([creating, disposing]);

  assert.equal(observed.length, observedBeforeDispose);
  assert.deepEqual(harness.orchestrator.getViewModel(), before);
  assert.equal(harness.orchestrator.getViewModel().session.executor.handoff, null);
});

test("double create, bind, and send operations cannot race", async () => {
  const createPending = deferred();
  let createCount = 0;
  const creatingHarness = await startedHarness({
    createDedicatedTask: async () => { createCount += 1; return createPending.promise; },
  });
  const creating = creatingHarness.orchestrator.createDedicatedTask();
  const duplicateCreate = assert.rejects(
    creatingHarness.orchestrator.createDedicatedTask(),
    /binding.*(?:changing|progress)/i,
  );
  await tick();
  assert.equal(createCount, 1);
  createPending.resolve({ binding: binding(), handoff: null });
  await Promise.all([creating, duplicateCreate]);

  const bindPending = deferred();
  let bindCount = 0;
  const bindHarness = await startedHarness({ bindExistingTask: async () => { bindCount += 1; return bindPending.promise; } });
  const bindingOne = bindHarness.orchestrator.bindExistingTask("thr-two");
  const bindingTwo = assert.rejects(
    bindHarness.orchestrator.bindExistingTask("thr-three"),
    /binding.*(?:changing|progress)/i,
  );
  await tick();
  assert.equal(bindCount, 1);
  bindPending.resolve(binding("thr-two", { sourceKind: "selected-existing" }));
  await Promise.all([bindingOne, bindingTwo]);

  const teacherPending = deferred();
  const sendHarness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    teacherRespond: async () => teacherPending.promise,
    randomUUID: (() => { const ids = ["learner", "teacher"]; return () => ids.shift(); })(),
  });
  await sendHarness.orchestrator.initialize();
  const sending = sendHarness.orchestrator.sendTeacherMessage("First");
  await assert.rejects(sendHarness.orchestrator.sendTeacherMessage("Second"), /already being sent/);
  teacherPending.resolve("Answer");
  await sending;
  assert.equal(sendHarness.teacherCalls.length, 1);
});

test("explicit rebind and dispose invalidate late binding and Teacher results", async () => {
  const bindPending = deferred();
  const rebindHarness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    bindExistingTask: async () => bindPending.promise,
  });
  await rebindHarness.orchestrator.initialize();
  const lateBinding = rebindHarness.orchestrator.bindExistingTask("thr-two");
  await tick();
  await rebindHarness.orchestrator.requestRebind();
  bindPending.resolve(binding("thr-two", { sourceKind: "selected-existing" }));
  await lateBinding;
  assert.equal(rebindHarness.stored.activeSession.binding, null);

  const teacherPending = deferred();
  const disposeHarness = createHarness({
    initialState: state({ activeSession: activeSession() }),
    teacherRespond: async () => teacherPending.promise,
    randomUUID: (() => { const ids = ["learner", "teacher"]; return () => ids.shift(); })(),
  });
  await disposeHarness.orchestrator.initialize();
  const sending = disposeHarness.orchestrator.sendTeacherMessage("Pending");
  await tick();
  await disposeHarness.orchestrator.dispose();
  const writesAtDispose = disposeHarness.writes.length;
  teacherPending.resolve("Late answer");
  await sending;
  assert.equal(disposeHarness.writes.length, writesAtDispose);
  assert.equal(disposeHarness.removed, true);
  assert.equal(disposeHarness.disposedReader, true);
  assert.equal(disposeHarness.disposedTeacher, true);
  assert.throws(() => disposeHarness.orchestrator.startPractice(), /disposed/);
});

test("one failing UI listener cannot block persistence or later listeners", async () => {
  const harness = createHarness();
  const received = [];
  harness.orchestrator.onChange(() => { throw new Error("listener failure"); });
  harness.orchestrator.onChange((value) => received.push(value.session?.lifecycle ?? null));

  await harness.orchestrator.initialize();
  await harness.orchestrator.startPractice();

  assert.equal(harness.stored.activeSession.lifecycle, "needs-binding");
  assert.deepEqual(received, [null, "needs-binding"]);
});
