import path from "node:path";

import { parseActivitySnapshot } from "../shared/practice-contracts.mjs";

const TOOL_KINDS = new Set(["read", "listFiles", "search"]);

function bounded(text, maximum = 2_000) {
  const normalized = String(text ?? "").replaceAll(/\s+/g, " ").trim();
  const points = [...normalized];
  return points.length <= maximum
    ? normalized
    : `${points.slice(0, maximum - 1).join("")}…`;
}

function relativeChangedPath(filePath, workspaceRoot) {
  if (typeof filePath !== "string" || filePath.trim() === "") return null;
  const absolute = path.isAbsolute(filePath)
    ? path.normalize(filePath)
    : path.resolve(workspaceRoot, filePath);
  const relative = path.relative(workspaceRoot, absolute).replaceAll("\\", "/");
  if (
    relative === ""
    || relative.startsWith("..")
    || path.isAbsolute(relative)
    || relative.split("/").some((segment) => segment === "..")
  ) return null;
  return relative;
}

function mergeKinds(current, additions) {
  return [...new Set([...current, ...additions])];
}

export function createInitialActivitySnapshot(binding, clock = () => new Date()) {
  return parseActivitySnapshot({
    schemaVersion: 1,
    threadId: binding.threadId,
    status: "ready",
    cursor: "initial",
    learnerPromptSummary: "",
    executorResponseSummary: "",
    activityKinds: [],
    changedFiles: [],
    observedAt: clock().toISOString(),
  });
}

export function reduceExecutorNotification(
  snapshot,
  notification,
  binding,
  clock = () => new Date(),
) {
  if (notification?.params?.threadId !== binding.threadId) return snapshot;

  const next = structuredClone(snapshot);
  const { method, params } = notification;
  if (method === "turn/started") next.status = "working";
  if (method === "turn/completed") {
    next.status = params.turn?.status === "completed" ? "response-ready" : "ready";
  }
  if (method === "thread/closed" || method === "thread/archived") {
    next.status = "disconnected";
  }
  if (method === "thread/status/changed") {
    const status = params.status;
    next.status = status?.type === "active"
      ? status.activeFlags?.some((flag) => ["waitingOnApproval", "waitingOnUserInput"].includes(flag))
        ? "waiting-for-learner"
        : "working"
      : status?.type === "systemError"
        ? "disconnected"
        : next.status;
  }
  if (method === "item/completed") {
    const item = params.item;
    if (!item || typeof item !== "object") return snapshot;
    next.cursor = `${params.turnId}:${item.id}`;
    if (item.type === "userMessage") {
      next.learnerPromptSummary = bounded(
        item.content
          ?.filter(({ type }) => type === "text")
          .map(({ text }) => text)
          .join(" "),
      );
      next.activityKinds = mergeKinds(next.activityKinds, ["prompt"]);
    }
    if (item.type === "agentMessage" && item.phase === "final_answer") {
      next.executorResponseSummary = bounded(item.text);
      next.activityKinds = mergeKinds(next.activityKinds, ["response"]);
      next.status = "response-ready";
    }
    if (item.type === "commandExecution") {
      const kinds = (item.commandActions ?? [])
        .map(({ type }) => type)
        .filter((type) => TOOL_KINDS.has(type));
      if (kinds.length > 0) {
        next.activityKinds = mergeKinds(next.activityKinds, ["read"]);
      }
    }
    if (item.type === "fileChange") {
      const additions = (item.changes ?? [])
        .map(({ path: filePath }) => relativeChangedPath(filePath, binding.workspaceRoot))
        .filter(Boolean);
      next.changedFiles = [...new Set([...next.changedFiles, ...additions])].slice(0, 50);
      next.activityKinds = mergeKinds(next.activityKinds, ["file-change"]);
    }
  }

  next.observedAt = clock().toISOString();
  return parseActivitySnapshot(next);
}

export function snapshotFromThread(thread, binding, clock = () => new Date()) {
  if (!thread || thread.id !== binding.threadId) {
    throw new TypeError("thread/read result thread id does not match the Executor binding.");
  }

  let snapshot = createInitialActivitySnapshot(binding, clock);
  for (const turn of thread.turns ?? []) {
    snapshot = reduceExecutorNotification(snapshot, {
      method: "turn/started",
      params: { threadId: thread.id, turn },
    }, binding, clock);
    for (const item of turn.items ?? []) {
      snapshot = reduceExecutorNotification(snapshot, {
        method: "item/completed",
        params: {
          threadId: thread.id,
          turnId: turn.id,
          item,
          completedAtMs: Date.parse(turn.completedAt ?? clock().toISOString()),
        },
      }, binding, clock);
    }
    snapshot = reduceExecutorNotification(snapshot, {
      method: "turn/completed",
      params: { threadId: thread.id, turn },
    }, binding, clock);
  }
  return parseActivitySnapshot({ ...snapshot, observedAt: clock().toISOString() });
}

export function createExecutorActivityReader({
  client,
  clock = () => new Date(),
  setIntervalFn = setInterval,
  clearIntervalFn = clearInterval,
  pollEveryMs = 3_000,
  staleAfterMs = 15_000,
}) {
  let binding = null;
  let snapshot = null;
  let interval = null;
  let intervalRefreshPending = false;
  let generation = 0;
  let revision = 0;
  let disposed = false;
  const listeners = new Set();

  function emit(next) {
    snapshot = parseActivitySnapshot(next);
    for (const listener of listeners) {
      try {
        listener(structuredClone(snapshot));
      } catch {
        // Snapshot observers must not corrupt activity tracking.
      }
    }
  }

  function currentSnapshot() {
    return snapshot ? structuredClone(snapshot) : null;
  }

  const removeNotification = client.onNotification((notification) => {
    if (disposed || !binding || !snapshot) return;
    const next = reduceExecutorNotification(snapshot, notification, binding, clock);
    if (next === snapshot) return;
    revision += 1;
    emit(next);
  });

  const removeConnection = client.onConnectionState((state) => {
    if (disposed || !snapshot || state !== "disconnected") return;
    revision += 1;
    emit({ ...snapshot, status: "disconnected", observedAt: clock().toISOString() });
  });

  async function refresh() {
    if (disposed || !binding) return null;

    const refreshGeneration = generation;
    const refreshBinding = structuredClone(binding);
    const refreshRevision = ++revision;
    try {
      const result = await client.request("thread/read", {
        threadId: refreshBinding.threadId,
        includeTurns: true,
      });
      const next = snapshotFromThread(result?.thread, refreshBinding, clock);
      if (
        !disposed
        && generation === refreshGeneration
        && revision === refreshRevision
        && binding?.threadId === refreshBinding.threadId
      ) emit(next);
    } catch {
      if (
        !disposed
        && snapshot
        && generation === refreshGeneration
        && revision === refreshRevision
        && binding?.threadId === refreshBinding.threadId
      ) {
        const age = clock().getTime() - Date.parse(snapshot.observedAt);
        if (age >= staleAfterMs && snapshot.status !== "disconnected") {
          emit({ ...snapshot, status: "stale" });
        }
      }
    }
    return currentSnapshot();
  }

  async function poll() {
    if (intervalRefreshPending) return;
    intervalRefreshPending = true;
    try {
      await refresh();
    } finally {
      intervalRefreshPending = false;
    }
  }

  async function bind(nextBinding) {
    disposed = false;
    generation += 1;
    revision += 1;
    const bindGeneration = generation;
    binding = structuredClone(nextBinding);
    emit(createInitialActivitySnapshot(binding, clock));

    await client.request("thread/resume", { threadId: binding.threadId });
    if (disposed || generation !== bindGeneration) return currentSnapshot();
    await refresh();
    if (!disposed && generation === bindGeneration && !interval) {
      interval = setIntervalFn(() => void poll(), pollEveryMs);
    }
    return currentSnapshot();
  }

  function onSnapshot(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  function pause() {
    if (interval !== null) clearIntervalFn(interval);
    interval = null;
  }

  function dispose() {
    disposed = true;
    generation += 1;
    revision += 1;
    removeNotification();
    removeConnection();
    pause();
    binding = null;
    snapshot = null;
    listeners.clear();
  }

  return Object.freeze({ bind, refresh, pause, onSnapshot, dispose });
}
