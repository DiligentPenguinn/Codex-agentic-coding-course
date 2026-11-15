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
const SAFE_MODEL_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,199}$/;
const STOPPED = Symbol("teacher-adapter-stopped");
const MAX_STARTING_FACTS = 64;
const TEACHER_OPERATIONS = new Set([
  "thread-start",
  "turn-start",
  "turn-completion",
]);
const TEACHER_CATEGORIES = new Set([
  "timeout",
  "disconnected",
  "boundary-violation",
  "runtime-failure",
]);
const DISCONNECTED_CODES = new Set([
  "APP_SERVER_NOT_INITIALIZED",
  "APP_SERVER_EXITED",
  "APP_SERVER_STOPPED",
]);

function teacherFailureMessage(operation, category) {
  if (category === "timeout") return "Teacher response timed out.";
  if (category === "disconnected") return "Teacher connection is unavailable.";
  if (category === "boundary-violation") {
    return "Teacher inference violated the no-tools boundary.";
  }
  if (operation === "thread-start" || operation === "turn-start") {
    return "Teacher inference setup failed.";
  }
  return "Teacher inference did not complete.";
}

export function createTeacherFailure(operation, category) {
  const safeOperation = TEACHER_OPERATIONS.has(operation)
    ? operation
    : "turn-completion";
  const safeCategory = TEACHER_CATEGORIES.has(category)
    ? category
    : "runtime-failure";
  return Object.assign(
    new Error(teacherFailureMessage(safeOperation, safeCategory)),
    {
      code: "TEACHER_ADAPTER_FAILED",
      operation: safeOperation,
      category: safeCategory,
    },
  );
}

export function teacherFailureDetails(error) {
  if (
    error?.code === "TEACHER_ADAPTER_FAILED"
    && TEACHER_OPERATIONS.has(error.operation)
    && TEACHER_CATEGORIES.has(error.category)
  ) {
    return Object.freeze({
      operation: error.operation,
      category: error.category,
    });
  }
  return Object.freeze({
    operation: "turn-completion",
    category: "runtime-failure",
  });
}

function failureCategory(error) {
  return DISCONNECTED_CODES.has(error?.code)
    ? "disconnected"
    : "runtime-failure";
}

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

function completedAnswer(item) {
  if (
    item?.type !== "agentMessage"
    || (item.phase !== "final_answer" && item.phase != null)
    || typeof item.text !== "string"
    || item.text.trim() === ""
  ) return null;
  return boundedAnswer(item.text);
}

function terminalFailureCategory(error) {
  const info = error?.codexErrorInfo;
  if (info === "unauthorized") return "disconnected";
  if (!info || typeof info !== "object" || Array.isArray(info)) {
    return "runtime-failure";
  }
  if (
    Object.hasOwn(info, "httpConnectionFailed")
    || Object.hasOwn(info, "responseStreamConnectionFailed")
    || Object.hasOwn(info, "responseStreamDisconnected")
  ) return "disconnected";
  return "runtime-failure";
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
    const text = method === "item/completed" ? completedAnswer(item) : null;
    if (text) {
      return { kind: "answer", turnId: params.turnId, text };
    }
    return null;
  }

  if (method === "turn/completed" && safeId(params.turn?.id)) {
    const items = Array.isArray(params.turn.items) ? params.turn.items : [];
    if (items.some((item) => FORBIDDEN_TOOL_ITEMS.has(item?.type))) {
      return { kind: "forbidden", turnId: params.turn.id };
    }
    let answer = null;
    for (const item of items) {
      const candidate = completedAnswer(item);
      if (candidate) answer = candidate;
    }
    return {
      kind: "completed",
      turnId: params.turn.id,
      completed: params.turn.status === "completed",
      answer,
      category: terminalFailureCategory(params.turn.error),
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

function verifyDefaultModel(result) {
  if (!Array.isArray(result?.data)) {
    throw new TypeError("Teacher model catalog is invalid.");
  }
  const model = result.data.find((item) => (
    item?.isDefault === true
    && item.hidden === false
    && typeof item.model === "string"
    && SAFE_MODEL_ID.test(item.model)
  ));
  if (!model) throw new TypeError("Teacher default model is unavailable.");
  return model.model;
}

function stoppedError() {
  return Object.assign(new Error("Teacher adapter stopped."), {
    code: "TEACHER_ADAPTER_STOPPED",
  });
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
  onDiagnostic = () => {},
}) {
  if (!absolutePath(teacherCwd)) throw new TypeError("Teacher workspace must be absolute.");

  let teacherThreadId = null;
  let teacherModelId = null;
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
      finish(createTeacherFailure("turn-completion", "boundary-violation"));
      void interrupt(threadId, turnId);
      return;
    }
    if (fact.kind === "answer") {
      pending.answer = fact.text;
      return;
    }
    if (fact.kind === "completed") {
      if (fact.answer) pending.answer = fact.answer;
      if (fact.completed && pending.answer) {
        finish(null, pending.answer);
      } else {
        finish(createTeacherFailure("turn-completion", fact.category));
      }
    }
  }

  async function setupRequest(request) {
    const result = await Promise.race([request, stopSignal]);
    if (result === STOPPED) throw STOPPED;
    return result;
  }

  async function ensureModel(activeGeneration) {
    if (teacherModelId) return teacherModelId;
    const result = await setupRequest(Promise.resolve(client.request("model/list", {
      limit: 100,
    })));
    const verifiedModelId = verifyDefaultModel(result);
    if (disposed || activeGeneration !== generation) throw STOPPED;
    teacherModelId = verifiedModelId;
    return verifiedModelId;
  }

  async function ensureThread(activeGeneration) {
    if (teacherThreadId) return teacherThreadId;
    const model = await ensureModel(activeGeneration);
    const request = Promise.resolve(client.request("thread/start", {
      cwd: teacherCwd,
      model,
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
    let diagnosticReported = false;

    function reportFailure(error) {
      if (error?.code !== "TEACHER_ADAPTER_FAILED") return error;
      if (!diagnosticReported) {
        diagnosticReported = true;
        try {
          onDiagnostic(teacherFailureDetails(error));
        } catch {
          // Diagnostics are non-authoritative and contain only fixed fields.
        }
      }
      return error;
    }

    let activeThreadId;
    let turnId;
    let provisional;
    try {
      activeThreadId = await ensureThread(activeGeneration);
    } catch (error) {
      busy = false;
      if (error === STOPPED || disposed || activeGeneration !== generation) throw stoppedError();
      throw reportFailure(createTeacherFailure("thread-start", failureCategory(error)));
    }

    try {
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
      throw reportFailure(createTeacherFailure("turn-start", failureCategory(error)));
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
      finish(createTeacherFailure("turn-completion", "runtime-failure"));
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
          finish(createTeacherFailure("turn-completion", "timeout"));
          void interrupt(activeThreadId, turnId);
        }, timeoutMs);
      }
    } catch {
      finish(createTeacherFailure("turn-completion", "runtime-failure"));
      void interrupt(activeThreadId, turnId);
    }
    return completion.catch((error) => {
      throw reportFailure(error);
    });
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
