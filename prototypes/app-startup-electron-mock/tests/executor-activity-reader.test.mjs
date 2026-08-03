import assert from "node:assert/strict";
import test from "node:test";

import {
  createExecutorActivityReader,
  createInitialActivitySnapshot,
  reduceExecutorNotification,
  snapshotFromThread,
} from "../src/main/executor-activity-reader.mjs";

const bound = {
  schemaVersion: 1,
  sessionId: "practice-session-1",
  threadId: "thr-bound",
  displayName: "Practice · Module 0 · Read-only inspection",
  workspaceRoot: "C:\\course",
  sourceKind: "created-by-practice",
  boundAt: "2026-08-03T00:00:00.000Z",
  verifiedAt: "2026-08-03T00:00:00.000Z",
};

const boundUser = {
  method: "item/completed",
  params: {
    threadId: "thr-bound",
    turnId: "turn-1",
    completedAtMs: 1,
    item: {
      id: "item-user",
      type: "userMessage",
      content: [{
        type: "text",
        text: "Inspect ContentPilot Lite. Read only; do not edit, install, or use network.",
      }],
    },
  },
};

const boundRead = {
  method: "item/completed",
  params: {
    threadId: "thr-bound",
    turnId: "turn-1",
    completedAtMs: 2,
    item: {
      id: "item-command",
      type: "commandExecution",
      command: "Get-ChildItem",
      cwd: "C:\\course",
      status: "completed",
      commandActions: [{ type: "listFiles", command: "Get-ChildItem", path: "." }],
      aggregatedOutput: "RAW OUTPUT MUST NOT BE STORED",
    },
  },
};

const boundAnswer = {
  method: "item/completed",
  params: {
    threadId: "thr-bound",
    turnId: "turn-1",
    completedAtMs: 3,
    item: {
      id: "item-answer",
      type: "agentMessage",
      phase: "final_answer",
      text: "The folder contains Brand Brain, Idea Lab, Draft Studio, and Calendar Board. No files changed.",
    },
  },
};

function fixedClock(iso = "2026-08-03T00:00:03.000Z") {
  return () => new Date(iso);
}

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createFakeClient(requestImpl = async (method, params) => {
  if (method === "thread/resume") return {};
  return { thread: { id: params.threadId, turns: [] } };
}) {
  const notificationListeners = new Set();
  const connectionListeners = new Set();
  const requests = [];
  return {
    requests,
    request(method, params) {
      requests.push({ method, params });
      return requestImpl(method, params, requests.length);
    },
    onNotification(listener) {
      notificationListeners.add(listener);
      return () => notificationListeners.delete(listener);
    },
    onConnectionState(listener) {
      connectionListeners.add(listener);
      return () => connectionListeners.delete(listener);
    },
    emitNotification(notification) {
      for (const listener of notificationListeners) listener(notification);
    },
    emitConnection(state) {
      for (const listener of connectionListeners) listener(state);
    },
  };
}

function completedThread(threadId = bound.threadId, answer = boundAnswer.params.item.text) {
  return {
    id: threadId,
    turns: [{
      id: "turn-1",
      status: "completed",
      completedAt: "2026-08-03T00:00:02.000Z",
      items: [boundUser.params.item, { ...boundAnswer.params.item, text: answer }],
    }],
  };
}

test("reduces only completed bound items into a display-safe snapshot", () => {
  const clock = fixedClock();
  let snapshot = createInitialActivitySnapshot(bound, clock);
  snapshot = reduceExecutorNotification(snapshot, boundUser, bound, clock);
  snapshot = reduceExecutorNotification(snapshot, boundRead, bound, clock);
  snapshot = reduceExecutorNotification(snapshot, boundAnswer, bound, clock);

  assert.equal(snapshot.status, "response-ready");
  assert.equal(snapshot.cursor, "turn-1:item-answer");
  assert.equal(snapshot.learnerPromptSummary, boundUser.params.item.content[0].text);
  assert.equal(snapshot.executorResponseSummary, boundAnswer.params.item.text);
  assert.deepEqual(snapshot.activityKinds, ["prompt", "read", "response"]);
  assert.deepEqual(snapshot.changedFiles, []);
  assert.doesNotMatch(JSON.stringify(snapshot), /RAW OUTPUT/);

  const beforeDecoy = snapshot;
  for (const notification of [boundUser, boundRead, boundAnswer]) {
    snapshot = reduceExecutorNotification(snapshot, {
      ...structuredClone(notification),
      params: {
        ...structuredClone(notification.params),
        threadId: "thr-decoy",
        item: { ...structuredClone(notification.params.item), text: "DECOY SECRET" },
      },
    }, bound, clock);
  }
  assert.strictEqual(snapshot, beforeDecoy);
  assert.doesNotMatch(JSON.stringify(snapshot), /DECOY SECRET/);
});

test("maps bound lifecycle notifications to safe activity statuses", () => {
  const clock = fixedClock();
  const initial = createInitialActivitySnapshot(bound, clock);
  const working = reduceExecutorNotification(initial, {
    method: "turn/started",
    params: { threadId: bound.threadId, turn: { id: "turn-1" } },
  }, bound, clock);
  const waiting = reduceExecutorNotification(working, {
    method: "thread/status/changed",
    params: {
      threadId: bound.threadId,
      status: { type: "active", activeFlags: ["waitingOnApproval"] },
    },
  }, bound, clock);

  assert.equal(working.status, "working");
  assert.equal(waiting.status, "waiting-for-learner");
});

test("keeps unique normalized in-repository file paths without diff content", () => {
  const initial = createInitialActivitySnapshot(bound, fixedClock());
  const snapshot = reduceExecutorNotification(initial, {
    method: "item/completed",
    params: {
      threadId: bound.threadId,
      turnId: "turn-file",
      item: {
        id: "item-file",
        type: "fileChange",
        changes: [
          { path: "src\\main.mjs", diff: "PRIVATE DIFF" },
          { path: "src/main.mjs", diff: "OTHER PRIVATE DIFF" },
          { path: "C:\\course\\tests\\main.test.mjs", diff: "SECRET" },
          { path: "C:\\outside\\escape.mjs", diff: "ESCAPE" },
        ],
      },
    },
  }, bound, fixedClock());

  assert.deepEqual(snapshot.changedFiles, ["src/main.mjs", "tests/main.test.mjs"]);
  assert.deepEqual(snapshot.activityKinds, ["file-change"]);
  assert.doesNotMatch(JSON.stringify(snapshot), /PRIVATE|SECRET|ESCAPE/);
});

test("ignores non-authoritative and unsafe item content", () => {
  const initial = createInitialActivitySnapshot(bound, fixedClock());
  const unsafeNotifications = [
    { method: "item/started", params: { threadId: bound.threadId, turnId: "t", item: boundUser.params.item } },
    { method: "item/agentMessage/delta", params: { threadId: bound.threadId, delta: "DELTA SECRET" } },
    { method: "item/completed", params: { threadId: bound.threadId, turnId: "t", item: { id: "reason", type: "reasoning", summary: "REASONING SECRET" } } },
    { method: "item/completed", params: { threadId: bound.threadId, turnId: "t", item: { id: "plan", type: "plan", text: "PLAN SECRET" } } },
    { method: "item/completed", params: { threadId: bound.threadId, turnId: "t", item: { id: "mcp", type: "mcpToolCall", result: "MCP SECRET" } } },
    { method: "item/completed", params: { threadId: bound.threadId, turnId: "t", item: { id: "command", type: "commandExecution", aggregatedOutput: "COMMAND SECRET", commandActions: [] } } },
  ];
  let snapshot = initial;
  for (const notification of unsafeNotifications) {
    snapshot = reduceExecutorNotification(snapshot, notification, bound, fixedClock());
  }

  assert.equal(snapshot.learnerPromptSummary, "");
  assert.equal(snapshot.executorResponseSummary, "");
  assert.deepEqual(snapshot.activityKinds, []);
  assert.doesNotMatch(JSON.stringify(snapshot), /SECRET/);
});

test("unsupported and delta notifications preserve identity and freshness", () => {
  const initial = createInitialActivitySnapshot(bound, fixedClock("2026-08-03T00:00:00.000Z"));
  const unsupported = reduceExecutorNotification(initial, {
    method: "thread/unknown",
    params: { threadId: bound.threadId, rawProtocol: "UNKNOWN SECRET" },
  }, bound, fixedClock("2026-08-03T00:00:10.000Z"));
  const delta = reduceExecutorNotification(initial, {
    method: "item/agentMessage/delta",
    params: { threadId: bound.threadId, delta: "DELTA SECRET" },
  }, bound, fixedClock("2026-08-03T00:00:10.000Z"));

  assert.strictEqual(unsupported, initial);
  assert.strictEqual(delta, initial);
  assert.equal(initial.observedAt, "2026-08-03T00:00:00.000Z");
  assert.doesNotMatch(JSON.stringify(initial), /SECRET/);
});

test("supported item lifecycle observations recover stale and disconnected states safely", () => {
  const initial = createInitialActivitySnapshot(bound, fixedClock("2026-08-03T00:00:00.000Z"));
  const stale = { ...initial, status: "stale" };
  const started = reduceExecutorNotification(stale, {
    method: "item/started",
    params: {
      threadId: bound.threadId,
      turnId: "turn-active",
      item: { id: "reasoning-start", type: "reasoning", text: "STARTED SECRET" },
    },
  }, bound, fixedClock("2026-08-03T00:00:10.000Z"));

  const disconnected = { ...started, status: "disconnected" };
  const completed = reduceExecutorNotification(disconnected, {
    method: "item/completed",
    params: {
      threadId: bound.threadId,
      turnId: "turn-active",
      item: { id: "reasoning-complete", type: "reasoning", summary: "COMPLETED SECRET" },
    },
  }, bound, fixedClock("2026-08-03T00:00:11.000Z"));

  assert.equal(started.status, "working");
  assert.equal(started.observedAt, "2026-08-03T00:00:10.000Z");
  assert.equal(completed.status, "working");
  assert.equal(completed.observedAt, "2026-08-03T00:00:11.000Z");
  assert.equal(completed.executorResponseSummary, "");
  assert.deepEqual(completed.activityKinds, []);
  assert.doesNotMatch(JSON.stringify({ started, completed }), /SECRET/);
});

test("persists only final-answer agent messages", () => {
  const phases = ["commentary", undefined, "unknown"];
  let snapshot = createInitialActivitySnapshot(bound, fixedClock());
  for (const [index, phase] of phases.entries()) {
    snapshot = reduceExecutorNotification(snapshot, {
      method: "item/completed",
      params: {
        threadId: bound.threadId,
        turnId: "turn-1",
        item: { id: `unsafe-${index}`, type: "agentMessage", phase, text: `UNSAFE ${index}` },
      },
    }, bound, fixedClock());
  }
  assert.equal(snapshot.executorResponseSummary, "");
  assert.deepEqual(snapshot.activityKinds, []);

  snapshot = reduceExecutorNotification(snapshot, boundAnswer, bound, fixedClock());
  assert.equal(snapshot.executorResponseSummary, boundAnswer.params.item.text);
  assert.deepEqual(snapshot.activityKinds, ["response"]);
});

test("bounds prompt and response summaries by Unicode code point", () => {
  const longText = `  ${"😀".repeat(2_005)}  `;
  let snapshot = createInitialActivitySnapshot(bound, fixedClock());
  snapshot = reduceExecutorNotification(snapshot, {
    ...structuredClone(boundUser),
    params: {
      ...structuredClone(boundUser.params),
      item: { ...structuredClone(boundUser.params.item), content: [{ type: "text", text: longText }] },
    },
  }, bound, fixedClock());
  snapshot = reduceExecutorNotification(snapshot, {
    ...structuredClone(boundAnswer),
    params: {
      ...structuredClone(boundAnswer.params),
      item: { ...structuredClone(boundAnswer.params.item), text: longText },
    },
  }, bound, fixedClock());

  assert.equal([...snapshot.learnerPromptSummary].length, 2_000);
  assert.equal([...snapshot.executorResponseSummary].length, 2_000);
  assert.ok(snapshot.learnerPromptSummary.endsWith("…"));
  assert.ok(snapshot.executorResponseSummary.endsWith("…"));
});

test("retains only the first 50 normalized changed paths", () => {
  const initial = createInitialActivitySnapshot(bound, fixedClock());
  const snapshot = reduceExecutorNotification(initial, {
    method: "item/completed",
    params: {
      threadId: bound.threadId,
      turnId: "turn-files",
      item: {
        id: "many-files",
        type: "fileChange",
        changes: Array.from({ length: 51 }, (_, index) => ({ path: `src\\file-${index}.mjs` })),
      },
    },
  }, bound, fixedClock());

  assert.equal(snapshot.changedFiles.length, 50);
  assert.equal(snapshot.changedFiles[0], "src/file-0.mjs");
  assert.equal(snapshot.changedFiles[49], "src/file-49.mjs");
});

test("rejects a thread/read result whose thread id is not the exact binding", () => {
  assert.throws(
    () => snapshotFromThread(completedThread("thr-decoy", "DECOY RESPONSE"), bound, fixedClock()),
    /thread id/i,
  );
});

test("successful polling refreshes observedAt and derives current status", async () => {
  let now = new Date("2026-08-03T00:00:00.000Z");
  const client = createFakeClient(async (method) => {
    if (method === "thread/resume") return {};
    return { thread: completedThread() };
  });
  const reader = createExecutorActivityReader({
    client,
    clock: () => new Date(now),
    setIntervalFn: () => 1,
    clearIntervalFn() {},
  });

  now = new Date("2026-08-03T00:00:05.000Z");
  const snapshot = await reader.bind(bound);

  assert.equal(snapshot.observedAt, now.toISOString());
  assert.equal(snapshot.status, "response-ready");
  reader.dispose();
});

test("failed refresh keeps fresh state, then becomes stale after 15 seconds", async () => {
  let now = new Date("2026-08-03T00:00:00.000Z");
  let failReads = false;
  const client = createFakeClient(async (method, params) => {
    if (method === "thread/resume") return {};
    if (failReads) throw new Error("RAW READ ERROR");
    return { thread: { id: params.threadId, turns: [] } };
  });
  const reader = createExecutorActivityReader({
    client,
    clock: () => new Date(now),
    setIntervalFn: () => 1,
    clearIntervalFn() {},
  });
  const observed = [];
  reader.onSnapshot((snapshot) => observed.push(snapshot));
  await reader.bind(bound);
  failReads = true;

  now = new Date("2026-08-03T00:00:14.999Z");
  const fresh = await reader.refresh();
  assert.equal(fresh.status, "ready");
  assert.equal(fresh.observedAt, "2026-08-03T00:00:00.000Z");

  now = new Date("2026-08-03T00:00:15.000Z");
  const stale = await reader.refresh();
  assert.equal(stale.status, "stale");
  assert.doesNotMatch(JSON.stringify(observed), /RAW READ ERROR/);
  reader.dispose();
});

test("disconnect stays disconnected on refresh failure and verified read recovers", async () => {
  let failReads = false;
  let now = new Date("2026-08-03T00:00:00.000Z");
  const client = createFakeClient(async (method, params) => {
    if (method === "thread/resume") return {};
    if (failReads) throw new Error("private failure");
    return { thread: completedThread(params.threadId) };
  });
  const reader = createExecutorActivityReader({
    client,
    clock: () => new Date(now),
    setIntervalFn: () => 1,
    clearIntervalFn() {},
  });
  await reader.bind(bound);

  client.emitConnection("disconnected");
  failReads = true;
  now = new Date("2026-08-03T00:00:20.000Z");
  assert.equal((await reader.refresh()).status, "disconnected");

  failReads = false;
  now = new Date("2026-08-03T00:00:21.000Z");
  const recovered = await reader.refresh();
  assert.equal(recovered.status, "response-ready");
  assert.equal(recovered.observedAt, now.toISOString());
  reader.dispose();
});

test("a mismatched successful read cannot refresh freshness or expose decoy content", async () => {
  let now = new Date("2026-08-03T00:00:00.000Z");
  let decoy = false;
  const client = createFakeClient(async (method, params) => {
    if (method === "thread/resume") return {};
    return { thread: decoy ? completedThread("thr-decoy", "DECOY CONTENT") : { id: params.threadId, turns: [] } };
  });
  const reader = createExecutorActivityReader({
    client,
    clock: () => new Date(now),
    setIntervalFn: () => 1,
    clearIntervalFn() {},
  });
  const before = await reader.bind(bound);
  decoy = true;
  now = new Date("2026-08-03T00:00:15.000Z");
  const after = await reader.refresh();

  assert.equal(before.observedAt, "2026-08-03T00:00:00.000Z");
  assert.equal(after.status, "stale");
  assert.equal(after.observedAt, before.observedAt);
  assert.doesNotMatch(JSON.stringify(after), /DECOY CONTENT/);
  reader.dispose();
});

test("a poll started before a newer bound notification cannot overwrite it", async () => {
  const pendingRead = deferred();
  let readCount = 0;
  const client = createFakeClient(async (method, params) => {
    if (method === "thread/resume") return {};
    readCount += 1;
    if (readCount === 1) return { thread: { id: params.threadId, turns: [] } };
    return pendingRead.promise;
  });
  const reader = createExecutorActivityReader({
    client,
    clock: fixedClock(),
    setIntervalFn: () => 1,
    clearIntervalFn() {},
  });
  await reader.bind(bound);

  const polling = reader.refresh();
  client.emitNotification(boundAnswer);
  pendingRead.resolve({ thread: { id: bound.threadId, turns: [] } });
  const snapshot = await polling;

  assert.equal(snapshot.executorResponseSummary, boundAnswer.params.item.text);
  assert.equal(snapshot.status, "response-ready");
  reader.dispose();
});

test("an old binding refresh cannot overwrite a completed rebind", async () => {
  const oldRead = deferred();
  const secondBinding = { ...bound, threadId: "thr-second", sessionId: "practice-session-2" };
  let oldReadStarted = false;
  const client = createFakeClient(async (method, params) => {
    if (method === "thread/resume") return {};
    if (params.threadId === bound.threadId) {
      oldReadStarted = true;
      return oldRead.promise;
    }
    return { thread: completedThread(secondBinding.threadId, "SECOND BINDING ANSWER") };
  });
  const reader = createExecutorActivityReader({
    client,
    clock: fixedClock(),
    setIntervalFn: () => 1,
    clearIntervalFn() {},
  });

  const firstBind = reader.bind(bound);
  while (!oldReadStarted) await new Promise((resolve) => setImmediate(resolve));
  const secondSnapshot = await reader.bind(secondBinding);
  oldRead.resolve({ thread: completedThread(bound.threadId, "OLD BINDING SECRET") });
  await firstBind;

  assert.equal(secondSnapshot.threadId, secondBinding.threadId);
  assert.equal((await reader.refresh()).threadId, secondBinding.threadId);
  assert.doesNotMatch(JSON.stringify(secondSnapshot), /OLD BINDING SECRET/);
  reader.dispose();
});

test("dispose prevents an in-flight poll from emitting or restoring state", async () => {
  const pendingRead = deferred();
  let readCount = 0;
  const client = createFakeClient(async (method, params) => {
    if (method === "thread/resume") return {};
    readCount += 1;
    if (readCount === 1) return { thread: { id: params.threadId, turns: [] } };
    return pendingRead.promise;
  });
  const reader = createExecutorActivityReader({
    client,
    clock: fixedClock(),
    setIntervalFn: () => 1,
    clearIntervalFn() {},
  });
  const observed = [];
  reader.onSnapshot((snapshot) => observed.push(snapshot));
  await reader.bind(bound);
  const beforeDisposeCount = observed.length;

  const polling = reader.refresh();
  reader.dispose();
  pendingRead.resolve({ thread: completedThread() });

  assert.equal(await polling, null);
  assert.equal(observed.length, beforeDisposeCount);
});

test("pause clears one interval and repeated ticks do not overlap reads", async () => {
  const pendingRead = deferred();
  let intervalCallback;
  const cleared = [];
  let readCount = 0;
  const client = createFakeClient(async (method, params) => {
    if (method === "thread/resume") return {};
    readCount += 1;
    if (readCount === 1) return { thread: { id: params.threadId, turns: [] } };
    return pendingRead.promise;
  });
  const reader = createExecutorActivityReader({
    client,
    clock: fixedClock(),
    setIntervalFn(callback) {
      intervalCallback = callback;
      return 42;
    },
    clearIntervalFn(handle) {
      cleared.push(handle);
    },
  });
  await reader.bind(bound);

  intervalCallback();
  intervalCallback();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(readCount, 2);
  pendingRead.resolve({ thread: { id: bound.threadId, turns: [] } });
  await new Promise((resolve) => setImmediate(resolve));
  reader.pause();
  reader.pause();

  assert.deepEqual(cleared, [42]);
  reader.dispose();
});

test("pause during a pending resume prevents bind from installing an interval", async () => {
  const pendingResume = deferred();
  let intervalInstallCount = 0;
  const client = createFakeClient(async (method, params) => {
    if (method === "thread/resume") return pendingResume.promise;
    return { thread: { id: params.threadId, turns: [] } };
  });
  const reader = createExecutorActivityReader({
    client,
    clock: fixedClock(),
    setIntervalFn() {
      intervalInstallCount += 1;
      return intervalInstallCount;
    },
    clearIntervalFn() {},
  });

  const binding = reader.bind(bound);
  await new Promise((resolve) => setImmediate(resolve));
  reader.pause();
  pendingResume.resolve({});
  await binding;

  assert.equal(intervalInstallCount, 0);
  reader.dispose();
});

test("pause during the initial refresh prevents bind from installing an interval", async () => {
  const pendingRead = deferred();
  let intervalInstallCount = 0;
  const client = createFakeClient(async (method) => {
    if (method === "thread/resume") return {};
    return pendingRead.promise;
  });
  const reader = createExecutorActivityReader({
    client,
    clock: fixedClock(),
    setIntervalFn() {
      intervalInstallCount += 1;
      return intervalInstallCount;
    },
    clearIntervalFn() {},
  });

  const binding = reader.bind(bound);
  await new Promise((resolve) => setImmediate(resolve));
  reader.pause();
  pendingRead.resolve({ thread: { id: bound.threadId, turns: [] } });
  await binding;

  assert.equal(intervalInstallCount, 0);
  reader.dispose();
});

test("a pending old-generation interval read cannot block or unlock the new generation", async () => {
  const oldTickRead = deferred();
  const newTickRead = deferred();
  const secondBinding = { ...bound, threadId: "thr-second", sessionId: "practice-session-2" };
  let intervalCallback;
  let oldReads = 0;
  let newReads = 0;
  const client = createFakeClient(async (method, params) => {
    if (method === "thread/resume") return {};
    if (params.threadId === bound.threadId) {
      oldReads += 1;
      return oldReads === 1
        ? { thread: { id: bound.threadId, turns: [] } }
        : oldTickRead.promise;
    }
    newReads += 1;
    return newReads === 1
      ? { thread: { id: secondBinding.threadId, turns: [] } }
      : newTickRead.promise;
  });
  const reader = createExecutorActivityReader({
    client,
    clock: fixedClock(),
    setIntervalFn(callback) {
      intervalCallback = callback;
      return 7;
    },
    clearIntervalFn() {},
  });

  await reader.bind(bound);
  intervalCallback();
  await new Promise((resolve) => setImmediate(resolve));
  await reader.bind(secondBinding);
  intervalCallback();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(newReads, 2);

  oldTickRead.resolve({ thread: { id: bound.threadId, turns: [] } });
  await new Promise((resolve) => setImmediate(resolve));
  intervalCallback();
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(newReads, 2);

  newTickRead.resolve({ thread: { id: secondBinding.threadId, turns: [] } });
  await new Promise((resolve) => setImmediate(resolve));
  reader.dispose();
});

test("dispose is terminal and cannot resurrect polling or subscriptions", async () => {
  let intervalCallback;
  const client = createFakeClient();
  const reader = createExecutorActivityReader({
    client,
    clock: fixedClock(),
    setIntervalFn(callback) {
      intervalCallback = callback;
      return 9;
    },
    clearIntervalFn() {},
  });
  await reader.bind(bound);
  reader.dispose();
  const requestCount = client.requests.length;

  await assert.rejects(
    reader.bind(bound),
    {
      code: "EXECUTOR_ACTIVITY_READER_DISPOSED",
      message: "Executor activity reader is disposed.",
    },
  );
  assert.equal(await reader.refresh(), null);
  intervalCallback();
  client.emitNotification(boundAnswer);
  client.emitConnection("disconnected");
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(client.requests.length, requestCount);
});
