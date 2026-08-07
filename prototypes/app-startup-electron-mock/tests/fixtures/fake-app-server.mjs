import path from "node:path";
import readline from "node:readline";
import { fileURLToPath } from "node:url";

const fixtureDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(fixtureDirectory, "..", "..", "..", "..");
const promptText = "Inspect ContentPilot Lite. Read only; do not edit, install, or use network.";
const reportText = "ContentPilot Lite contains Brand Brain, Idea Lab, Draft Studio, and Calendar Board. No files changed.";
const restartReportText = "RESTART_REVALIDATED_BOUND_TASK: ContentPilot Lite was revalidated from the same bound task; Brand Brain, Idea Lab, Draft Studio, and Calendar Board remain present. No files changed.";
const restartRevalidation = process.env.COURSE_MOCK_RESTART_REVALIDATION === "1";
const decoyText = "DECOY TASK MUST STAY OUT OF TEACHER CONTEXT";
const taskName = "Practice · Module 0 · Read-only inspection";
const threads = new Map();
const scheduledTimers = new Set();
const teacherTurnTimers = new Map();
let nextThread = 1;
let nextTeacherTurn = 1;
let nextInjectedTurn = 1;
let account = null;
let activeLogin = null;

function send(message) {
  process.stdout.write(`${JSON.stringify(message)}\n`);
}

function respond(id, result) {
  send({ id, result });
}

function reject(id, message, code = -32602) {
  send({ id, error: { code, message } });
}

function schedule(delayMs, callback) {
  const timer = setTimeout(() => {
    scheduledTimers.delete(timer);
    callback();
  }, delayMs);
  scheduledTimers.add(timer);
  return timer;
}

function threadRecord(id, params) {
  const now = Math.floor(Date.now() / 1_000);
  return {
    id,
    sessionId: id,
    name: null,
    cwd: params.cwd,
    preview: "",
    ephemeral: Boolean(params.ephemeral),
    modelProvider: "openai",
    source: "appServer",
    status: { type: "idle" },
    turns: [],
    createdAt: now,
    updatedAt: now,
    cliVersion: "fixture",
  };
}

function makeThread(params) {
  const id = params.ephemeral
    ? `thr-teacher-${nextThread++}`
    : `thr-practice-${nextThread++}`;
  return threadRecord(id, params);
}

function serializeThread(thread, includeTurns) {
  const copy = structuredClone(thread);
  if (!includeTurns) delete copy.turns;
  return copy;
}

function threadResponse(thread, params = {}) {
  return {
    thread: serializeThread(thread, true),
    cwd: thread.cwd,
    model: params.model ?? "fixture-model",
    modelProvider: "openai",
    approvalPolicy: params.approvalPolicy ?? (thread.ephemeral ? "never" : "on-request"),
    approvalsReviewer: "user",
    sandbox: params.sandbox ?? "read-only",
  };
}

function commandItem(id, rawOutput) {
  return {
    id,
    type: "commandExecution",
    command: "Get-ChildItem",
    cwd: repositoryRoot,
    status: "completed",
    commandActions: [{ type: "listFiles", command: "Get-ChildItem", path: "." }],
    aggregatedOutput: rawOutput,
  };
}

function makeActivityTurn(threadId, prompt, report) {
  return {
    id: `turn-${threadId}`,
    status: "completed",
    completedAt: new Date().toISOString(),
    items: [
      {
        id: `item-user-${threadId}`,
        type: "userMessage",
        content: [{ type: "text", text: prompt }],
      },
      commandItem(`item-command-${threadId}`, "RAW OUTPUT MUST NOT BE STORED"),
      {
        id: `item-answer-${threadId}`,
        type: "agentMessage",
        phase: "final_answer",
        text: report,
      },
    ],
  };
}

function emitActivitySequence(thread, prompt, report, startDelayMs, persistTurns) {
  const turn = makeActivityTurn(thread.id, prompt, report);
  const [userItem, command, answer] = turn.items;
  const notifications = [
    ["thread/status/changed", {
      threadId: thread.id,
      status: { type: "active", activeFlags: [] },
    }],
    ["turn/started", {
      threadId: thread.id,
      turn: { id: turn.id, status: "inProgress", items: [] },
    }],
    ["item/started", { threadId: thread.id, turnId: turn.id, item: userItem }],
    ["item/completed", { threadId: thread.id, turnId: turn.id, item: userItem }],
    ["item/started", { threadId: thread.id, turnId: turn.id, item: command }],
    ["item/completed", { threadId: thread.id, turnId: turn.id, item: command }],
    ["item/started", { threadId: thread.id, turnId: turn.id, item: answer }],
    ["item/completed", { threadId: thread.id, turnId: turn.id, item: answer }],
    ["turn/completed", { threadId: thread.id, turn }],
    ["thread/status/changed", {
      threadId: thread.id,
      status: { type: "idle" },
    }],
  ];

  notifications.forEach(([method, params], index) => {
    schedule(startDelayMs + (index * 20), () => {
      if (method === "turn/completed" && persistTurns) {
        thread.turns = [structuredClone(turn)];
        thread.updatedAt = Math.floor(Date.now() / 1_000);
      }
      if (method === "thread/status/changed") {
        thread.status = structuredClone(params.status);
      }
      send({ method, params });
    });
  });
}

function ensureDecoyThread() {
  let thread = threads.get("thr-decoy");
  if (!thread) {
    thread = threadRecord("thr-decoy", { cwd: repositoryRoot, ephemeral: false });
    thread.name = "Unbound decoy";
    threads.set(thread.id, thread);
  }
  return thread;
}

function ensureRestoredPracticeThread(threadId) {
  let thread = threads.get(threadId);
  if (thread || threadId !== "thr-practice-1") return thread ?? null;
  thread = threadRecord(threadId, { cwd: repositoryRoot, ephemeral: false });
  thread.name = taskName;
  thread.turns = [makeActivityTurn(
    thread.id,
    promptText,
    restartRevalidation ? restartReportText : reportText,
  )];
  thread.updatedAt = Math.floor(Date.now() / 1_000);
  threads.set(thread.id, thread);
  nextThread = Math.max(nextThread, 2);
  return thread;
}

function differentWorkspaceThread() {
  const thread = threadRecord("thr-other-workspace", {
    cwd: path.resolve(repositoryRoot, "..", "unrelated-workspace"),
    ephemeral: false,
  });
  thread.name = "Different workspace task";
  return thread;
}

function parseTeacherEnvelope(message) {
  const thread = threads.get(message.params?.threadId);
  if (!thread?.ephemeral) throw new TypeError("Teacher turns require an ephemeral Teacher task.");
  const inputs = message.params?.input;
  if (!Array.isArray(inputs) || inputs.length !== 1 || inputs[0]?.type !== "text") {
    throw new TypeError("Teacher turns accept one text input only.");
  }
  const text = inputs[0].text;
  const startMarker = "TEACHER_CONTEXT_ENVELOPE\n";
  const endMarker = "\nRECENT_TEACHER_CHAT";
  const start = typeof text === "string" ? text.indexOf(startMarker) : -1;
  const end = typeof text === "string" ? text.indexOf(endMarker, start + startMarker.length) : -1;
  if (start < 0 || end < 0) throw new TypeError("Teacher context envelope is missing.");
  const envelope = JSON.parse(text.slice(start + startMarker.length, end));
  if (
    envelope?.privacy?.scope !== "bound-thread-only"
    || envelope?.privacy?.redactionsApplied !== true
    || envelope?.executor?.activity?.threadId !== envelope?.executor?.threadId
    || JSON.stringify(envelope).includes(decoyText)
  ) throw new TypeError("Teacher context envelope is not bound-task-only.");
  return { envelope, thread };
}

function boundedAnswer(value) {
  const normalized = String(value).replaceAll(/\s+/g, " ").trim();
  const points = [...normalized];
  return points.length <= 4_000
    ? normalized
    : `${points.slice(0, 3_999).join("")}…`;
}

function teacherAnswer(envelope) {
  const activity = envelope.executor.activity;
  const changedCount = Array.isArray(activity.changedFiles)
    ? activity.changedFiles.length
    : 0;
  return boundedAnswer([
    `The bound Executor inspected ContentPilot Lite from this prompt: ${activity.learnerPromptSummary}.`,
    "It followed read-only/no-edit constraints: do not edit, install, or use network.",
    `Executor report: ${activity.executorResponseSummary}.`,
    `Zero changed files were reported (${changedCount} changed files).`,
  ].join(" "));
}

function startTeacherTurn(message) {
  let parsed;
  try {
    parsed = parseTeacherEnvelope(message);
  } catch (error) {
    reject(message.id, error.message);
    return;
  }
  const turnId = `turn-teacher-${nextTeacherTurn++}`;
  const turn = { id: turnId, status: "inProgress", items: [] };
  respond(message.id, { turn });
  const key = `${parsed.thread.id}:${turnId}`;
  const timer = schedule(60, () => {
    teacherTurnTimers.delete(key);
    const item = {
      id: `item-${turnId}`,
      type: "agentMessage",
      phase: "final_answer",
      text: teacherAnswer(parsed.envelope),
    };
    const completed = { id: turnId, status: "completed", items: [item] };
    parsed.thread.turns.push(completed);
    send({
      method: "item/completed",
      params: { threadId: parsed.thread.id, turnId, item },
    });
    send({
      method: "turn/completed",
      params: { threadId: parsed.thread.id, turn: completed },
    });
  });
  teacherTurnTimers.set(key, timer);
}

function interruptTeacherTurn(message) {
  const threadId = message.params?.threadId;
  const turnId = message.params?.turnId;
  const thread = threads.get(threadId);
  if (!thread?.ephemeral || typeof turnId !== "string") {
    reject(message.id, "Only active ephemeral Teacher turns can be interrupted.");
    return;
  }
  const key = `${threadId}:${turnId}`;
  const timer = teacherTurnTimers.get(key);
  if (timer) {
    clearTimeout(timer);
    scheduledTimers.delete(timer);
    teacherTurnTimers.delete(key);
  }
  respond(message.id, {});
  send({
    method: "turn/completed",
    params: { threadId, turn: { id: turnId, status: "interrupted", items: [] } },
  });
}

function handleThreadStart(message) {
  const params = message.params ?? {};
  const ephemeral = params.ephemeral === true;
  const expectedService = ephemeral
    ? "content_builder_academy_teacher"
    : "content_builder_academy_practice";
  const expectedApproval = ephemeral ? "never" : "on-request";
  if (
    typeof params.cwd !== "string"
    || !path.isAbsolute(params.cwd)
    || params.serviceName !== expectedService
    || params.sandbox !== "read-only"
    || params.approvalPolicy !== expectedApproval
    || (ephemeral && params.model !== "fixture-teacher-model")
  ) {
    reject(message.id, "Invalid fixture thread/start request.");
    return;
  }
  const thread = makeThread(params);
  threads.set(thread.id, thread);
  respond(message.id, threadResponse(thread, params));
  send({ method: "thread/started", params: { thread: serializeThread(thread, true) } });
}

function handleThreadNameSet(message) {
  const thread = threads.get(message.params?.threadId);
  if (!thread || thread.ephemeral || typeof message.params?.name !== "string") {
    reject(message.id, "Only persistent fixture tasks can be named.");
    return;
  }
  thread.name = message.params.name;
  thread.updatedAt = Math.floor(Date.now() / 1_000);
  respond(message.id, {});
  send({
    method: "thread/name/updated",
    params: { threadId: thread.id, name: thread.name },
  });
  if (thread.id.startsWith("thr-practice-") && thread.turns.length === 0) {
    const decoy = ensureDecoyThread();
    emitActivitySequence(thread, promptText, reportText, 120, true);
    emitActivitySequence(decoy, decoyText, decoyText, 130, true);
  }
}

function handleThreadRead(message) {
  const thread = threads.get(message.params?.threadId)
    ?? ensureRestoredPracticeThread(message.params?.threadId);
  if (!thread) {
    reject(message.id, "Fixture task not found.");
    return;
  }
  respond(message.id, {
    thread: serializeThread(thread, message.params?.includeTurns === true),
  });
}

function handleThreadList(message) {
  const persistent = [...threads.values()].filter((thread) => (
    !thread.ephemeral && thread.id.startsWith("thr-practice-")
  ));
  const candidates = [...persistent, differentWorkspaceThread()];
  const requestedCwds = Array.isArray(message.params?.cwd)
    ? message.params.cwd.filter((cwd) => typeof cwd === "string")
    : [];
  const filtered = requestedCwds.length === 0
    ? candidates
    : candidates.filter((thread) => requestedCwds.includes(thread.cwd));
  respond(message.id, {
    data: filtered.map((thread) => serializeThread(thread, false)),
    nextCursor: null,
  });
}

function handleThreadResume(message) {
  const thread = threads.get(message.params?.threadId)
    ?? ensureRestoredPracticeThread(message.params?.threadId);
  if (!thread || thread.ephemeral) {
    reject(message.id, "Only a stored persistent Practice task can be resumed.");
    return;
  }
  respond(message.id, threadResponse(thread));
  send({ method: "thread/started", params: { thread: serializeThread(thread, true) } });
}

function handleThreadInjectItems(message) {
  const thread = threads.get(message.params?.threadId);
  const items = message.params?.items;
  if (!thread || thread.ephemeral || !Array.isArray(items) || items.length !== 1) {
    reject(message.id, "Only one visible item can be injected into a persistent Practice task.");
    return;
  }
  const item = items[0];
  const valid = item?.type === "message"
    && item?.role === "assistant"
    && Array.isArray(item?.content)
    && item.content.length === 1
    && item.content[0]?.type === "output_text"
    && typeof item.content[0]?.text === "string"
    && /^\[CBA_HANDOFF_V1:[a-f0-9]{64}\]/.test(item.content[0].text);
  if (!valid) {
    reject(message.id, "Injected Practice item is invalid.");
    return;
  }
  thread.turns.push({
    id: `turn-injected-${nextInjectedTurn++}`,
    status: "completed",
    items: [structuredClone(item)],
  });
  thread.updatedAt = Math.floor(Date.now() / 1_000);
  respond(message.id, {});
}

const lines = readline.createInterface({ input: process.stdin });
lines.on("line", (line) => {
  let message;
  try {
    message = JSON.parse(line);
  } catch {
    return;
  }

  if (message.method === "initialize") {
    respond(message.id, {
      serverInfo: { name: "fake-app-server", version: "1.0.0" },
    });
    return;
  }
  if (message.method === "initialized") return;

  if (message.method === "account/read") {
    respond(message.id, { account, requiresOpenaiAuth: true });
    return;
  }
  if (message.method === "account/login/start") {
    activeLogin = "login-fixture-1";
    if (message.params?.type === "chatgptDeviceCode") {
      respond(message.id, {
        loginId: activeLogin,
        verificationUrl: "https://auth.openai.com/codex/device",
        userCode: "FIXTURE-CODE",
      });
    } else {
      respond(message.id, {
        loginId: activeLogin,
        authUrl: "https://auth.openai.com/codex/fixture",
      });
    }
    schedule(120, () => {
      if (!activeLogin) return;
      account = {
        type: "chatgpt",
        email: "fixture@example.test",
        planType: "fixture",
      };
      send({
        method: "account/login/completed",
        params: { loginId: activeLogin, success: true },
      });
      send({
        method: "account/updated",
        params: { accountType: "chatgpt" },
      });
      activeLogin = null;
    });
    return;
  }
  if (message.method === "account/login/cancel") {
    activeLogin = null;
    respond(message.id, {});
    return;
  }

  if (message.method === "model/list") {
    respond(message.id, {
      data: [{
        id: "fixture-teacher-model",
        model: "fixture-teacher-model",
        displayName: "Fixture Teacher Model",
        description: "Deterministic smoke-test Teacher model.",
        hidden: false,
        isDefault: true,
        defaultReasoningEffort: "medium",
        supportedReasoningEfforts: [{ effort: "medium", description: "Fixture" }],
      }],
      nextCursor: null,
    });
    return;
  }

  if (message.method === "thread/start") return handleThreadStart(message);
  if (message.method === "thread/name/set") return handleThreadNameSet(message);
  if (message.method === "thread/read") return handleThreadRead(message);
  if (message.method === "thread/list") return handleThreadList(message);
  if (message.method === "thread/resume") return handleThreadResume(message);
  if (message.method === "thread/inject_items") return handleThreadInjectItems(message);
  if (message.method === "thread/unsubscribe") {
    respond(message.id, { status: "unsubscribed" });
    return;
  }
  if (message.method === "turn/start") return startTeacherTurn(message);
  if (message.method === "turn/interrupt") return interruptTeacherTurn(message);

  reject(message.id, "Fixture method unavailable", -32601);
});

lines.on("close", () => {
  for (const timer of scheduledTimers) clearTimeout(timer);
  scheduledTimers.clear();
  teacherTurnTimers.clear();
});
