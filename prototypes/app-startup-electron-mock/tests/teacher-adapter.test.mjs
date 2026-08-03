import assert from "node:assert/strict";
import test from "node:test";

import {
  createAppServerTeacherAdapter,
  createFakeTeacherAdapter,
} from "../src/main/teacher-adapter.mjs";

const TEACHER_CWD = "C:\\teacher-sandbox";
const DEVELOPER_INSTRUCTIONS = [
  "You are the Practice Mode Teacher.",
  "Answer only from the supplied Teacher context envelope and Teacher chat.",
  "Do not use tools, inspect files, control Executor tasks, or claim fresh context when freshness is stale or disconnected.",
  "If context is insufficient, say exactly what is unavailable.",
].join(" ");

const activity = {
  schemaVersion: 1,
  threadId: "thr-bound",
  status: "response-ready",
  cursor: "turn-1:item-1",
  learnerPromptSummary: "Inspect safely.",
  executorResponseSummary: "Inspection complete.",
  activityKinds: ["prompt", "read", "response"],
  changedFiles: ["one.txt", "two.txt"],
  observedAt: "2026-08-03T00:00:02.000Z",
};

const envelope = {
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
};

const input = {
  envelope,
  chat: [{ id: "message-1", role: "learner", text: "Hello", createdAt: "2026-08-03T00:00:03.000Z" }],
  learnerMessage: "What next?",
};

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function fakeClient(requestImpl) {
  const requests = [];
  const listeners = new Set();
  let turnNumber = 0;
  return {
    requests,
    get listenerCount() { return listeners.size; },
    async request(method, params) {
      requests.push([method, params]);
      if (requestImpl) return requestImpl(method, params, requests.length);
      if (method === "thread/start") {
        return { thread: { id: "thr-teacher", cwd: TEACHER_CWD, ephemeral: true } };
      }
      if (method === "turn/start") {
        turnNumber += 1;
        return { turn: { id: `turn-teacher-${turnNumber}` } };
      }
      return {};
    },
    onNotification(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    emit(notification) {
      for (const listener of listeners) listener(notification);
    },
  };
}

async function startResponse(adapter) {
  const response = adapter.respond(input);
  await new Promise((resolve) => setImmediate(resolve));
  return { response };
}

function itemNotification(method, item, overrides = {}) {
  return {
    method,
    params: {
      threadId: "thr-teacher",
      turnId: "turn-teacher-1",
      item,
      ...overrides,
    },
  };
}

function completedNotification(overrides = {}) {
  return {
    method: "turn/completed",
    params: {
      threadId: "thr-teacher",
      turn: { id: "turn-teacher-1", status: "completed" },
      ...overrides,
    },
  };
}

test("starts one verified ephemeral no-tools Teacher thread and sends text-only turn input", async () => {
  const client = fakeClient();
  const adapter = createAppServerTeacherAdapter({ client, teacherCwd: TEACHER_CWD });
  const { response } = await startResponse(adapter);

  assert.deepEqual(client.requests[0], ["thread/start", {
    cwd: TEACHER_CWD,
    ephemeral: true,
    sandbox: "read-only",
    approvalPolicy: "never",
    serviceName: "content_builder_academy_teacher",
    developerInstructions: DEVELOPER_INSTRUCTIONS,
  }]);
  assert.equal(client.requests[1][0], "turn/start");
  assert.deepEqual(Object.keys(client.requests[1][1]), ["threadId", "input"]);
  assert.equal(client.requests[1][1].threadId, "thr-teacher");
  assert.equal(client.requests[1][1].input.length, 1);
  assert.deepEqual(Object.keys(client.requests[1][1].input[0]), ["type", "text"]);
  assert.equal(client.requests[1][1].input[0].type, "text");
  assert.match(client.requests[1][1].input[0].text, /CURRENT_LEARNER_MESSAGE\nWhat next\?/);

  client.emit(itemNotification("item/completed", {
    id: "answer-1", type: "agentMessage", phase: "final_answer", text: "Use read-only inspection.",
  }));
  client.emit(completedNotification());
  assert.equal(await response, "Use read-only inspection.");
  await adapter.dispose();
});

test("ignores reasoning, commentary, unknown phases, and empty final answers", async () => {
  const client = fakeClient();
  const adapter = createAppServerTeacherAdapter({ client, teacherCwd: TEACHER_CWD });
  const { response } = await startResponse(adapter);

  client.emit(itemNotification("item/completed", { id: "reason", type: "reasoning", text: "SECRET REASONING" }));
  client.emit(itemNotification("item/completed", { id: "comment", type: "agentMessage", phase: "commentary", text: "Commentary" }));
  client.emit(itemNotification("item/completed", { id: "unknown", type: "agentMessage", phase: "analysis", text: "Analysis" }));
  client.emit(itemNotification("item/completed", { id: "empty", type: "agentMessage", phase: "final_answer", text: "   " }));
  client.emit(itemNotification("item/completed", { id: "final", type: "agentMessage", phase: "final_answer", text: "Safe final" }));
  client.emit(completedNotification());

  assert.equal(await response, "Safe final");
  await adapter.dispose();
});

test("interrupts and rejects when every forbidden tool item starts or completes", async (t) => {
  const types = [
    "commandExecution", "fileChange", "mcpToolCall", "dynamicToolCall",
    "collabAgentToolCall", "webSearch", "imageView", "imageGeneration",
  ];
  for (const type of types) {
    for (const method of ["item/started", "item/completed"]) {
      await t.test(`${type} ${method}`, async () => {
        const client = fakeClient();
        const adapter = createAppServerTeacherAdapter({ client, teacherCwd: TEACHER_CWD });
        const { response } = await startResponse(adapter);
        client.emit(itemNotification(method, { id: "forbidden", type, rawOutput: "MUST NOT LEAK" }));

        await assert.rejects(response, {
          message: "Teacher inference violated the no-tools boundary.",
        });
        assert.deepEqual(client.requests.find(([requestMethod]) => requestMethod === "turn/interrupt"), [
          "turn/interrupt", { threadId: "thr-teacher", turnId: "turn-teacher-1" },
        ]);
        await adapter.dispose();
      });
    }
  }
});

test("accepts final items and completion only from the exact Teacher thread and active turn", async () => {
  const client = fakeClient();
  const adapter = createAppServerTeacherAdapter({ client, teacherCwd: TEACHER_CWD });
  const { response } = await startResponse(adapter);

  client.emit(itemNotification("item/completed", { type: "commandExecution" }, { threadId: "thr-other" }));
  client.emit(itemNotification("item/completed", { type: "commandExecution" }, { turnId: "turn-other" }));
  client.emit(itemNotification("item/completed", { type: "agentMessage", phase: "final_answer", text: "DECOY" }, { turnId: undefined }));
  client.emit(completedNotification({ threadId: "thr-other", turn: { id: "turn-teacher-1", status: "completed" } }));
  client.emit(completedNotification({ turn: { id: "turn-other", status: "completed" } }));
  client.emit(completedNotification({ turn: { status: "completed" } }));
  client.emit(itemNotification("item/completed", { type: "agentMessage", phase: "final_answer", text: "Exact answer" }));
  client.emit(completedNotification());

  assert.equal(await response, "Exact answer");
  assert.equal(client.requests.some(([method]) => method === "turn/interrupt"), false);
  await adapter.dispose();
});

test("bounds the returned final answer to 4,000 code points including an ellipsis", async () => {
  const client = fakeClient();
  const adapter = createAppServerTeacherAdapter({ client, teacherCwd: TEACHER_CWD });
  const { response } = await startResponse(adapter);
  client.emit(itemNotification("item/completed", {
    type: "agentMessage", phase: "final_answer", text: "😀".repeat(4_001),
  }));
  client.emit(completedNotification());
  const answer = await response;

  assert.equal([...answer].length, 4_000);
  assert.equal(answer.endsWith("…"), true);
  await adapter.dispose();
});

test("sanitizes timeout, interrupts the exact turn, and releases the adapter", async () => {
  const timers = [];
  const client = fakeClient();
  const adapter = createAppServerTeacherAdapter({
    client,
    teacherCwd: TEACHER_CWD,
    setTimeoutFn(callback, delay) {
      const timer = { callback, delay, cleared: false };
      timers.push(timer);
      return timer;
    },
    clearTimeoutFn(timer) { timer.cleared = true; },
  });
  const { response } = await startResponse(adapter);
  assert.equal(timers[0].delay, 60_000);
  timers[0].callback();

  await assert.rejects(response, { message: "Teacher response timed out." });
  assert.equal(timers[0].cleared, true);
  assert.deepEqual(client.requests.find(([method]) => method === "turn/interrupt"), [
    "turn/interrupt", { threadId: "thr-teacher", turnId: "turn-teacher-1" },
  ]);
  await adapter.dispose();
});

test("reuses the verified Teacher thread across sequential turns", async () => {
  const client = fakeClient();
  const adapter = createAppServerTeacherAdapter({ client, teacherCwd: TEACHER_CWD });
  const { response: first } = await startResponse(adapter);
  client.emit(itemNotification("item/completed", { type: "agentMessage", phase: "final_answer", text: "First" }));
  client.emit(completedNotification());
  assert.equal(await first, "First");

  const { response: second } = await startResponse(adapter);
  client.emit(itemNotification("item/completed", { type: "agentMessage", phase: "final_answer", text: "Second" }, { turnId: "turn-teacher-2" }));
  client.emit(completedNotification({ turn: { id: "turn-teacher-2", status: "completed" } }));
  assert.equal(await second, "Second");
  assert.equal(client.requests.filter(([method]) => method === "thread/start").length, 1);
  assert.equal(client.requests.filter(([method]) => method === "turn/start").length, 2);
  await adapter.dispose();
});

test("sets the busy lock before awaiting setup and releases it after setup failure", async () => {
  const firstStart = deferred();
  let attempts = 0;
  const client = fakeClient((method) => {
    if (method === "thread/start") {
      attempts += 1;
      if (attempts === 1) return firstStart.promise;
      return { thread: { id: "thr-teacher", cwd: TEACHER_CWD, ephemeral: true } };
    }
    if (method === "turn/start") return { turn: { id: "turn-teacher-1" } };
    return {};
  });
  const adapter = createAppServerTeacherAdapter({ client, teacherCwd: TEACHER_CWD });
  const first = adapter.respond(input);
  await assert.rejects(adapter.respond(input), { message: "Teacher is already responding." });
  firstStart.reject(new Error("SECRET APP SERVER ERROR"));
  await assert.rejects(first, { message: "Teacher inference setup failed." });

  const { response: next } = await startResponse(adapter);
  client.emit(itemNotification("item/completed", { type: "agentMessage", phase: "final_answer", text: "Recovered" }));
  client.emit(completedNotification());
  assert.equal(await next, "Recovered");
  await adapter.dispose();
});

test("rejects relative cwd and sanitizes invalid thread and turn start responses", async () => {
  assert.throws(
    () => createAppServerTeacherAdapter({ client: fakeClient(), teacherCwd: "relative" }),
    { message: "Teacher workspace must be absolute." },
  );
  for (const result of [
    { thread: { id: "bad/id", cwd: TEACHER_CWD, ephemeral: true } },
    { thread: { id: "thr-teacher", cwd: "C:\\other", ephemeral: true } },
    { thread: { id: "thr-teacher", cwd: TEACHER_CWD, ephemeral: false } },
  ]) {
    const client = fakeClient((method) => method === "thread/start" ? result : {});
    const adapter = createAppServerTeacherAdapter({ client, teacherCwd: TEACHER_CWD });
    await assert.rejects(adapter.respond(input), { message: "Teacher inference setup failed." });
    await adapter.dispose();
  }

  const client = fakeClient((method) => method === "thread/start"
    ? { thread: { id: "thr-teacher", cwd: TEACHER_CWD, ephemeral: true } }
    : { turn: { id: "" } });
  const adapter = createAppServerTeacherAdapter({ client, teacherCwd: TEACHER_CWD });
  await assert.rejects(adapter.respond(input), { message: "Teacher inference setup failed." });
  await adapter.dispose();
});

test("dispose interrupts an active turn, rejects it safely, unsubscribes, and is terminal", async () => {
  const client = fakeClient();
  const adapter = createAppServerTeacherAdapter({ client, teacherCwd: TEACHER_CWD });
  const { response } = await startResponse(adapter);
  assert.equal(client.listenerCount, 1);
  await adapter.dispose();

  await assert.rejects(response, { message: "Teacher adapter stopped." });
  assert.equal(client.listenerCount, 0);
  assert.deepEqual(client.requests.filter(([method]) => ["turn/interrupt", "thread/unsubscribe"].includes(method)), [
    ["turn/interrupt", { threadId: "thr-teacher", turnId: "turn-teacher-1" }],
    ["thread/unsubscribe", { threadId: "thr-teacher" }],
  ]);
  await assert.rejects(adapter.respond(input), { message: "Teacher adapter stopped." });
  await adapter.dispose();
});

test("dispose races cannot leave setup responses pending or resurrect late server state", async () => {
  const threadStart = deferred();
  const client = fakeClient((method) => {
    if (method === "thread/start") return threadStart.promise;
    return {};
  });
  const adapter = createAppServerTeacherAdapter({ client, teacherCwd: TEACHER_CWD });
  const response = adapter.respond(input);
  await adapter.dispose();
  await assert.rejects(response, { message: "Teacher adapter stopped." });

  threadStart.resolve({ thread: { id: "thr-teacher", cwd: TEACHER_CWD, ephemeral: true } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(client.requests.find(([method]) => method === "thread/unsubscribe"), [
    "thread/unsubscribe", { threadId: "thr-teacher" },
  ]);
  assert.equal(client.listenerCount, 0);
});

test("dispose during turn start rejects immediately and interrupts a late verified turn", async () => {
  const turnStart = deferred();
  const client = fakeClient((method) => {
    if (method === "thread/start") return { thread: { id: "thr-teacher", cwd: TEACHER_CWD, ephemeral: true } };
    if (method === "turn/start") return turnStart.promise;
    return {};
  });
  const adapter = createAppServerTeacherAdapter({ client, teacherCwd: TEACHER_CWD });
  const { response } = await startResponse(adapter);
  await adapter.dispose();
  await assert.rejects(response, { message: "Teacher adapter stopped." });

  turnStart.resolve({ turn: { id: "turn-teacher-late" } });
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(client.requests.find(([method, params]) => method === "turn/interrupt" && params.turnId === "turn-teacher-late"), [
    "turn/interrupt", { threadId: "thr-teacher", turnId: "turn-teacher-late" },
  ]);
});

test("the fake adapter reports bounded prompt, constraints, response, changes, and freshness deterministically", async () => {
  const adapter = createFakeTeacherAdapter();
  const first = await adapter.respond(input);
  const second = await adapter.respond(input);
  assert.equal(first, second);
  assert.match(first, /Freshness: fresh\./);
  assert.match(first, /Learner prompt: Inspect safely\./);
  assert.match(first, /Constraints:/);
  assert.match(first, /Executor report: Inspection complete\./);
  assert.match(first, /Changed files: 2\./);
  await adapter.dispose();
});
