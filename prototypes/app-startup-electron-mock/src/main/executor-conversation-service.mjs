import path from "node:path";

import { parseExecutorBinding } from "../shared/practice-contracts.mjs";

const THREAD_ID = /^[A-Za-z0-9_-]+$/;
const TASK_STATUSES = new Set(["notLoaded", "idle", "active", "systemError"]);

function samePath(left, right) {
  if (typeof left !== "string" || typeof right !== "string") return false;
  const normalize = (value) => path.resolve(value).replaceAll("/", "\\").toLocaleLowerCase("en-US");
  return normalize(left) === normalize(right);
}

function validThreadId(value) {
  return typeof value === "string" && THREAD_ID.test(value);
}

function taskName(startRequest) {
  return `Practice · ${startRequest.lessonId.replace("module-", "Module ")} · Read-only inspection`;
}

function verifyThread(thread, expectedRoot) {
  if (!thread || typeof thread !== "object" || Array.isArray(thread) || !validThreadId(thread.id)) {
    throw new TypeError("Executor task ID is invalid.");
  }
  if (!samePath(thread.cwd, expectedRoot)) throw new TypeError("Executor task workspace does not match the mission.");
  if (thread.ephemeral !== false) throw new TypeError("Executor task must be persistent.");
  return thread;
}

function displayName(thread) {
  if (typeof thread.name === "string" && thread.name.trim() !== "" && [...thread.name].length <= 500) {
    return thread.name;
  }
  return `Codex task ${thread.id.slice(-6)}`;
}

function canonicalUpdatedAt(value) {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new TypeError("Executor task updatedAt is invalid.");
  const date = new Date(value * 1_000);
  if (Number.isNaN(date.valueOf())) throw new TypeError("Executor task updatedAt is invalid.");
  return date.toISOString();
}

function pickerTask(thread, expectedRoot) {
  verifyThread(thread, expectedRoot);
  return {
    threadId: thread.id,
    displayName: displayName(thread),
    updatedAt: canonicalUpdatedAt(thread.updatedAt),
    status: TASK_STATUSES.has(thread.status?.type) ? thread.status.type : "notLoaded",
  };
}

export function createExecutorConversationService({
  client,
  openExternal,
  clock = () => new Date(),
}) {
  async function readAndVerify(startRequest, threadId) {
    if (!validThreadId(threadId)) throw new TypeError("Executor task ID is invalid.");
    const result = await client.request("thread/read", { threadId, includeTurns: false });
    const thread = verifyThread(result?.thread, startRequest.workspace.expectedRepositoryRoot);
    if (thread.id !== threadId) throw new TypeError("Executor task does not match the requested task.");
    return thread;
  }

  async function createDedicatedTask(startRequest, sessionId) {
    const started = await client.request("thread/start", {
      cwd: startRequest.workspace.expectedRepositoryRoot,
      sandbox: "read-only",
      approvalPolicy: "on-request",
      serviceName: "content_builder_academy_practice",
    });
    verifyThread(started?.thread, startRequest.workspace.expectedRepositoryRoot);
    const name = taskName(startRequest);
    await client.request("thread/name/set", { threadId: started.thread.id, name });
    await readAndVerify(startRequest, started.thread.id);
    const now = clock().toISOString();
    const binding = parseExecutorBinding({
      schemaVersion: 1,
      sessionId,
      threadId: started.thread.id,
      displayName: name,
      workspaceRoot: startRequest.workspace.expectedRepositoryRoot,
      sourceKind: "created-by-practice",
      boundAt: now,
      verifiedAt: now,
    });
    return { binding, handoff: await openBoundTask(binding) };
  }

  async function listEligibleTasks(startRequest) {
    const result = await client.request("thread/list", {
      cwd: [startRequest.workspace.expectedRepositoryRoot],
      archived: false,
      limit: 25,
      sortKey: "updated_at",
      sortDirection: "desc",
      sourceKinds: ["cli", "vscode", "appServer"],
    });
    if (!Array.isArray(result?.data)) throw new TypeError("thread/list data must be an array.");
    return result.data.flatMap((thread) => {
      try {
        return [pickerTask(thread, startRequest.workspace.expectedRepositoryRoot)];
      } catch {
        return [];
      }
    });
  }

  async function bindExistingTask(startRequest, sessionId, threadId) {
    const thread = await readAndVerify(startRequest, threadId);
    const now = clock().toISOString();
    return parseExecutorBinding({
      schemaVersion: 1,
      sessionId,
      threadId,
      displayName: displayName(thread),
      workspaceRoot: startRequest.workspace.expectedRepositoryRoot,
      sourceKind: "selected-existing",
      boundAt: now,
      verifiedAt: now,
    });
  }

  async function revalidateBinding(startRequest, binding) {
    const parsedBinding = parseExecutorBinding(binding);
    if (!samePath(parsedBinding.workspaceRoot, startRequest.workspace.expectedRepositoryRoot)) {
      throw new TypeError("Executor binding workspace does not match the mission.");
    }
    const thread = await readAndVerify(startRequest, parsedBinding.threadId);
    return {
      thread,
      binding: parseExecutorBinding({ ...parsedBinding, verifiedAt: clock().toISOString() }),
    };
  }

  async function openBoundTask(binding) {
    if (!validThreadId(binding?.threadId)) throw new TypeError("Executor task ID is invalid.");
    const url = `codex://threads/${encodeURIComponent(binding.threadId)}`;
    const parsed = new URL(url);
    if (parsed.protocol !== "codex:" || parsed.hostname !== "threads" || parsed.pathname !== `/${binding.threadId}`) {
      throw new TypeError("Executor deep link is invalid.");
    }
    try {
      await openExternal(url);
      return { opened: true, fallbackName: binding.displayName };
    } catch {
      return { opened: false, fallbackName: binding.displayName };
    }
  }

  return Object.freeze({
    createDedicatedTask,
    listEligibleTasks,
    bindExistingTask,
    revalidateBinding,
    openBoundTask,
  });
}
