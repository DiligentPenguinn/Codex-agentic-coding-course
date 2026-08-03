import path from "node:path";

import { parseTeacherContextEnvelope } from "../shared/practice-contracts.mjs";
import { buildTeacherTurnInput } from "./teacher-context-broker.mjs";

const FORBIDDEN_TOOL_ITEMS = new Set([
  "commandExecution",
  "fileChange",
  "mcpToolCall",
  "dynamicToolCall",
  "collabAgentToolCall",
  "webSearch",
  "imageView",
  "imageGeneration",
]);

const DEVELOPER_INSTRUCTIONS = [
  "You are the Practice Mode Teacher.",
  "Answer only from the supplied Teacher context envelope and Teacher chat.",
  "Do not use tools, inspect files, control Executor tasks, or claim fresh context when freshness is stale or disconnected.",
  "If context is insufficient, say exactly what is unavailable.",
].join(" ");

const SAFE_ID = /^[A-Za-z0-9_-]{1,500}$/;
const STOPPED = Symbol("teacher-adapter-stopped");
const MAX_STARTING_FACTS = 64;

function safeId(value) {
  return typeof value === "string" && SAFE_ID.test(value);
}

function absolutePath(value) {
  return typeof value === "string"
    && (path.isAbsolute(value) || path.win32.isAbsolute(value) || path.posix.isAbsolute(value));
}

function boundedAnswer(value) {
  const codePoints = [...value];
  return codePoints.length <= 4_000
    ? value
    : `${codePoints.slice(0, 3_999).join("")}…`;
}

function notificationFact(notification) {
  const { method, params } = notification ?? {};
  if (!params || typeof params !== "object" || Array.isArray(params)) return null;

  if (method === "item/started" || method === "item/completed") {
    if (!safeId(params.turnId)) return null;
    const item = params.item;
    if (FORBIDDEN_TOOL_ITEMS.has(item?.type)) {
      return { kind: "forbidden", turnId: params.turnId };
    }
    if (
      method === "item/completed"
      && item?.type === "agentMessage"
      && item.phase === "final_answer"
      && typeof item.text === "string"
      && item.text.trim() !== ""
    ) {
      return { kind: "answer", turnId: params.turnId, text: boundedAnswer(item.text) };
    }
    return null;
  }

  if (method === "turn/completed" && safeId(params.turn?.id)) {
    return {
      kind: "completed",
      turnId: params.turn.id,
      completed: params.turn.status === "completed",
    };
  }
  return null;
}

function verifyThreadStart(result, teacherCwd) {
  const thread = result?.thread;
  if (
    !thread
    || typeof thread !== "object"
    || Array.isArray(thread)
    || !safeId(thread.id)
    || thread.cwd !== teacherCwd
    || thread.ephemeral !== true
  ) {
    throw new TypeError("Teacher task response is invalid.");
  }
  return thread.id;
}

function verifyTurnStart(result) {
  if (!safeId(result?.turn?.id)) throw new TypeError("Teacher turn response is invalid.");
  return result.turn.id;
}

function stoppedError() {
  return new Error("Teacher adapter stopped.");
}

function setupError() {
  return new Error("Teacher inference setup failed.");
}

export function createFakeTeacherAdapter() {
  let disposed = false;
  return Object.freeze({
    async respond({ envelope }) {
      if (disposed) throw stoppedError();
      const parsed = parseTeacherContextEnvelope(envelope);
      const activity = parsed.executor.activity;
      return boundedAnswer([
        `Freshness: ${parsed.freshness.state}.`,
        `Learner prompt: ${activity.learnerPromptSummary || "not observed"}.`,
        "Constraints: bound task only; Teacher tools disabled.",
        `Executor report: ${activity.executorResponseSummary || "not observed"}.`,
        `Changed files: ${activity.changedFiles.length}.`,
      ].join(" "));
    },
    async dispose() {
      disposed = true;
    },
  });
}

export function createAppServerTeacherAdapter({
  client,
  teacherCwd,
  setTimeoutFn = setTimeout,
  clearTimeoutFn = clearTimeout,
  timeoutMs = 60_000,
}) {
  if (!absolutePath(teacherCwd)) throw new TypeError("Teacher workspace must be absolute.");

  let teacherThreadId = null;
  let pending = null;
  let starting = null;
  let busy = false;
  let disposed = false;
  let generation = 0;
  let stop;
  const stopSignal = new Promise((resolve) => {
    stop = () => resolve(STOPPED);
  });

  function safeRequest(method, params) {
    try {
      return Promise.resolve(client.request(method, params)).catch(() => undefined);
    } catch {
      return Promise.resolve(undefined);
    }
  }

  function interrupt(threadId, turnId) {
    return safeRequest("turn/interrupt", { threadId, turnId });
  }

  function finish(error, value) {
    if (!pending) return;
    const current = pending;
    pending = null;
    busy = false;
    try {
      if (current.timeout !== null) clearTimeoutFn(current.timeout);
    } catch {
      // Timer cleanup is non-authoritative.
    }
    if (error) current.reject(error);
    else current.resolve(value);
  }

  function processFact(fact) {
    if (!pending || fact.turnId !== pending.turnId) return;
    if (fact.kind === "forbidden") {
      const { threadId, turnId } = pending;
      finish(new Error("Teacher inference violated the no-tools boundary."));
      void interrupt(threadId, turnId);
      return;
    }
    if (fact.kind === "answer") {
      pending.answer = fact.text;
      return;
    }
    if (fact.kind === "completed") {
      if (fact.completed && pending.answer) {
        finish(null, pending.answer);
      } else {
        finish(new Error("Teacher inference did not complete."));
      }
    }
  }

  async function setupRequest(request) {
    const result = await Promise.race([request, stopSignal]);
    if (result === STOPPED) throw STOPPED;
    return result;
  }

  async function ensureThread(activeGeneration) {
    if (teacherThreadId) return teacherThreadId;
    const request = Promise.resolve(client.request("thread/start", {
      cwd: teacherCwd,
      ephemeral: true,
      sandbox: "read-only",
      approvalPolicy: "never",
      serviceName: "content_builder_academy_teacher",
      developerInstructions: DEVELOPER_INSTRUCTIONS,
    }));

    void request.then((result) => {
      if (!disposed && activeGeneration === generation) return;
      try {
        const lateThreadId = verifyThreadStart(result, teacherCwd);
        void safeRequest("thread/unsubscribe", { threadId: lateThreadId });
      } catch {
        // Never act on an unverified late response.
      }
    }, () => {});

    const result = await setupRequest(request);
    const verifiedThreadId = verifyThreadStart(result, teacherCwd);
    if (disposed || activeGeneration !== generation) throw STOPPED;
    teacherThreadId = verifiedThreadId;
    return verifiedThreadId;
  }

  const removeNotification = client.onNotification((notification) => {
    if (notification?.params?.threadId !== teacherThreadId) return;
    const fact = notificationFact(notification);
    if (!fact) return;
    if (pending) {
      processFact(fact);
      return;
    }
    if (!starting || starting.threadId !== teacherThreadId || starting.overflowed) return;
    if (starting.facts.length === MAX_STARTING_FACTS) {
      starting.facts.length = 0;
      starting.overflowed = true;
      return;
    }
    starting.facts.push(fact);
  });

  async function respond({ envelope, chat, learnerMessage }) {
    if (disposed) throw stoppedError();
    if (busy) throw new Error("Teacher is already responding.");
    busy = true;
    const activeGeneration = generation;

    let activeThreadId;
    let turnId;
    let provisional;
    try {
      activeThreadId = await ensureThread(activeGeneration);
      const text = buildTeacherTurnInput({ envelope, chat, learnerMessage });
      provisional = {
        threadId: activeThreadId,
        facts: [],
        overflowed: false,
      };
      starting = provisional;
      const request = Promise.resolve(client.request("turn/start", {
        threadId: activeThreadId,
        input: [{ type: "text", text }],
      }));

      void request.then((result) => {
        if (!disposed && activeGeneration === generation) return;
        try {
          const lateTurnId = verifyTurnStart(result);
          void interrupt(activeThreadId, lateTurnId);
        } catch {
          // Never act on an unverified late response.
        }
      }, () => {});

      const started = await setupRequest(request);
      turnId = verifyTurnStart(started);
      if (disposed || activeGeneration !== generation) throw STOPPED;
    } catch (error) {
      if (starting === provisional) starting = null;
      busy = false;
      if (error === STOPPED || disposed || activeGeneration !== generation) throw stoppedError();
      throw setupError();
    }

    let resolveCompletion;
    let rejectCompletion;
    const completion = new Promise((resolve, reject) => {
      resolveCompletion = resolve;
      rejectCompletion = reject;
    });
    pending = {
      threadId: activeThreadId,
      turnId,
      answer: null,
      resolve: resolveCompletion,
      reject: rejectCompletion,
      timeout: null,
    };
    if (starting === provisional) starting = null;
    if (provisional.overflowed) {
      finish(new Error("Teacher notification buffer overflowed."));
      void interrupt(activeThreadId, turnId);
    } else {
      for (const fact of provisional.facts) {
        if (!pending) break;
        processFact(fact);
      }
    }
    try {
      if (pending) {
        pending.timeout = setTimeoutFn(() => {
          if (!pending || pending.threadId !== activeThreadId || pending.turnId !== turnId) return;
          finish(new Error("Teacher response timed out."));
          void interrupt(activeThreadId, turnId);
        }, timeoutMs);
      }
    } catch {
      finish(setupError());
      void interrupt(activeThreadId, turnId);
    }
    return completion;
  }

  async function dispose() {
    if (disposed) return;
    disposed = true;
    generation += 1;
    stop();
    starting = null;
    try {
      removeNotification();
    } catch {
      // Listener cleanup is non-authoritative.
    }

    const active = pending;
    if (active) finish(stoppedError());
    if (active) void interrupt(active.threadId, active.turnId);
    if (teacherThreadId) {
      const activeThreadId = teacherThreadId;
      teacherThreadId = null;
      void safeRequest("thread/unsubscribe", { threadId: activeThreadId });
    }
  }

  return Object.freeze({ respond, dispose });
}
