import assert from "node:assert/strict";
import test from "node:test";

import { createExecutorConversationService } from "../src/main/executor-conversation-service.mjs";

const ROOT = "C:\\course";
const NOW = "2026-08-04T00:00:00.000Z";

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
    workspace: { expectedRepositoryRoot: ROOT, exercisePath: "exercises/one.md" },
  };
}

function thread(overrides = {}) {
  return {
    id: "thr-practice-1",
    cwd: ROOT,
    ephemeral: false,
    name: "Existing task",
    preview: "private prompt text",
    updatedAt: 1_754_265_600,
    status: { type: "idle" },
    ...overrides,
  };
}

function fakeClient(respond) {
  const calls = [];
  return {
    calls,
    client: {
      async request(method, params) {
        calls.push([method, params]);
        return respond(method, params, calls.length);
      },
    },
  };
}

function service(client, openExternal = async () => {}) {
  return createExecutorConversationService({ client, openExternal, clock: () => new Date(NOW) });
}

test("creates, names, verifies, and opens one dedicated empty task", async () => {
  const { client, calls } = fakeClient((method) => {
    if (method === "thread/start") return { cwd: ROOT, thread: thread() };
    if (method === "thread/name/set") return {};
    if (method === "thread/read") return { thread: thread() };
    throw new Error(`Unexpected request: ${method}`);
  });
  const opened = [];

  const result = await service(client, async (url) => opened.push(url)).createDedicatedTask(startRequest(), "session-1");

  assert.deepEqual(calls, [
    ["thread/start", { cwd: "C:\\course", sandbox: "read-only", approvalPolicy: "on-request", serviceName: "content_builder_academy_practice" }],
    ["thread/name/set", { threadId: "thr-practice-1", name: "Practice · Module 0 · Read-only inspection" }],
    ["thread/read", { threadId: "thr-practice-1", includeTurns: false }],
  ]);
  assert.deepEqual(result.binding, {
    schemaVersion: 1, sessionId: "session-1", threadId: "thr-practice-1",
    displayName: "Practice · Module 0 · Read-only inspection", workspaceRoot: ROOT,
    sourceKind: "created-by-practice", boundAt: NOW, verifiedAt: NOW,
  });
  assert.equal(JSON.stringify(result.binding).includes("private prompt text"), false);
  assert.deepEqual(result.handoff, { opened: true, fallbackName: "Practice · Module 0 · Read-only inspection" });
  assert.deepEqual(opened, ["codex://threads/thr-practice-1"]);
});

test("does not return a binding when naming the new task fails", async () => {
  const { client, calls } = fakeClient((method) => {
    if (method === "thread/start") return { cwd: ROOT, thread: thread() };
    if (method === "thread/name/set") throw new Error("name failed");
  });

  await assert.rejects(service(client).createDedicatedTask(startRequest(), "session-1"), /name failed/);
  assert.deepEqual(calls.map(([method]) => method), ["thread/start", "thread/name/set"]);
});

test("rejects a newly created task when verification changes its workspace", async () => {
  const { client } = fakeClient((method) => {
    if (method === "thread/start") return { cwd: ROOT, thread: thread() };
    if (method === "thread/name/set") return {};
    if (method === "thread/read") return { thread: thread({ cwd: "C:\\other" }) };
  });

  await assert.rejects(service(client).createDedicatedTask(startRequest(), "session-1"), /workspace does not match/i);
});

test("rejects a different valid ID returned from verification without substituting it", async () => {
  const { client } = fakeClient((method) => {
    if (method === "thread/start") return { cwd: ROOT, thread: thread() };
    if (method === "thread/name/set") return {};
    if (method === "thread/read") return { thread: thread({ id: "thr-different" }) };
  });

  await assert.rejects(service(client).createDedicatedTask(startRequest(), "session-1"), /does not match the requested task/i);
});

test("does not construct a deep link for a malicious task ID", async () => {
  const opened = [];

  await assert.rejects(
    service({ request: async () => {} }, async (url) => opened.push(url)).openBoundTask({ threadId: "thr/../../settings", displayName: "Unsafe" }),
    /ID is invalid/i,
  );
  assert.deepEqual(opened, []);
});

test("keeps a valid binding usable when opening its task fails", async () => {
  const binding = { threadId: "thr-practice-1", displayName: "Practice task" };

  const handoff = await service({ request: async () => {} }, async () => { throw new Error("blocked"); }).openBoundTask(binding);

  assert.deepEqual(handoff, { opened: false, fallbackName: "Practice task" });
  assert.deepEqual(binding, { threadId: "thr-practice-1", displayName: "Practice task" });
});

test("lists only display-safe persistent tasks in the exact workspace", async () => {
  const { client, calls } = fakeClient(() => ({ data: [
    thread({ id: "thr-named", name: "A safe name", preview: "DECOY PREVIEW" }),
    thread({ id: "thr-fallback", name: "", preview: "SECRET PROMPT" }),
    thread({ id: "bad/id" }),
    thread({ cwd: "C:\\other" }),
    thread({ id: "thr-ephemeral", ephemeral: true }),
    thread({ id: "thr-bad-time", updatedAt: "yesterday" }),
    thread({ id: "thr-unknown-status", status: { type: "unexpected" } }),
    { id: "thr-malformed" },
  ] }));

  const tasks = await service(client).listEligibleTasks(startRequest());

  assert.deepEqual(calls, [["thread/list", {
    cwd: [ROOT], archived: false, limit: 25, sortKey: "updated_at", sortDirection: "desc",
    sourceKinds: ["cli", "vscode", "appServer"],
  }]]);
  assert.deepEqual(tasks, [
    { threadId: "thr-named", displayName: "A safe name", updatedAt: "2025-08-04T00:00:00.000Z", status: "idle" },
    { threadId: "thr-fallback", displayName: "Codex task llback", updatedAt: "2025-08-04T00:00:00.000Z", status: "idle" },
    { threadId: "thr-unknown-status", displayName: "Existing task", updatedAt: "2025-08-04T00:00:00.000Z", status: "notLoaded" },
  ]);
  assert.equal(JSON.stringify(tasks).includes("DECOY PREVIEW"), false);
  assert.equal(JSON.stringify(tasks).includes("SECRET PROMPT"), false);
});

test("treats a non-array task list response as a service contract error", async () => {
  const { client } = fakeClient(() => ({ data: {} }));

  await assert.rejects(service(client).listEligibleTasks(startRequest()), /thread\/list data must be an array/i);
});

test("binds only a verified existing task and does not resume or subscribe", async () => {
  const { client, calls } = fakeClient((method, params) => {
    assert.equal(method, "thread/read");
    assert.deepEqual(params, { threadId: "thr-existing", includeTurns: false });
    return { thread: thread({ id: "thr-existing", name: "Chosen task" }) };
  });

  const binding = await service(client).bindExistingTask(startRequest(), "session-1", "thr-existing");

  assert.equal(binding.sourceKind, "selected-existing");
  assert.equal(binding.displayName, "Chosen task");
  assert.deepEqual(calls.map(([method]) => method), ["thread/read"]);
});

test("revalidation rejects a substituted task ID and never changes the binding", async () => {
  const original = {
    schemaVersion: 1, sessionId: "session-1", threadId: "thr-practice-1", displayName: "Practice task",
    workspaceRoot: ROOT, sourceKind: "created-by-practice", boundAt: NOW, verifiedAt: NOW,
  };
  const { client, calls } = fakeClient(() => ({ thread: thread({ id: "thr-different" }) }));

  await assert.rejects(service(client).revalidateBinding(startRequest(), original), /does not match the requested task/i);
  assert.equal(original.threadId, "thr-practice-1");
  assert.deepEqual(calls, [["thread/read", { threadId: "thr-practice-1", includeTurns: false }]]);
});

test("revalidation rejects a failed read without replacing the binding", async () => {
  const original = {
    schemaVersion: 1, sessionId: "session-1", threadId: "thr-practice-1", displayName: "Practice task",
    workspaceRoot: ROOT, sourceKind: "created-by-practice", boundAt: NOW, verifiedAt: NOW,
  };
  const { client } = fakeClient(() => { throw new Error("read failed"); });

  await assert.rejects(service(client).revalidateBinding(startRequest(), original), /read failed/);
  assert.equal(original.threadId, "thr-practice-1");
});
