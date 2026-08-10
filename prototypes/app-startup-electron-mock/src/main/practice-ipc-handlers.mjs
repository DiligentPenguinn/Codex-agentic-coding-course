import { CHANNELS } from "../shared/channels.mjs";

const FAILURES = Object.freeze({
  [CHANNELS.PRACTICE_GET_STATE]: {
    code: "PRACTICE_STATE_UNAVAILABLE",
    message: "Practice state could not be loaded.",
    recoveryAction: "Retry or restart Practice.",
  },
  [CHANNELS.PRACTICE_GET_BUBBLE_STATE]: {
    code: "PRACTICE_BUBBLE_STATE_UNAVAILABLE",
    message: "Compact Practice status could not be loaded.",
    recoveryAction: "Expand Practice and retry.",
  },
  [CHANNELS.PRACTICE_GET_QUICK_STATE]: {
    code: "PRACTICE_QUICK_STATE_UNAVAILABLE",
    message: "Quick chat could not be loaded.",
    recoveryAction: "Expand Practice and retry.",
  },
  [CHANNELS.PRACTICE_START]: {
    code: "PRACTICE_START_FAILED",
    message: "Practice could not be started.",
    recoveryAction: "Retry starting Practice.",
  },
  [CHANNELS.PRACTICE_CREATE_TASK]: {
    code: "PRACTICE_TASK_CREATE_FAILED",
    message: "A dedicated Codex task could not be created.",
    recoveryAction: "Retry or choose an eligible task.",
  },
  [CHANNELS.PRACTICE_LIST_TASKS]: {
    code: "PRACTICE_TASK_LIST_FAILED",
    message: "Eligible Codex tasks could not be listed.",
    recoveryAction: "Retry after checking the Codex connection.",
  },
  [CHANNELS.PRACTICE_BIND_TASK]: {
    code: "PRACTICE_TASK_BIND_FAILED",
    message: "That Codex task could not be bound.",
    recoveryAction: "Choose an eligible task and retry.",
  },
  [CHANNELS.PRACTICE_REBIND]: {
    code: "PRACTICE_REBIND_FAILED",
    message: "The Executor task could not be unbound safely.",
    recoveryAction: "Wait for the current operation and retry.",
  },
  [CHANNELS.PRACTICE_OPEN_TASK]: {
    code: "PRACTICE_TASK_OPEN_FAILED",
    message: "The bound Codex task could not be opened.",
    recoveryAction: "Locate the named task in Codex or retry.",
  },
  [CHANNELS.PRACTICE_RETRY]: {
    code: "PRACTICE_RETRY_FAILED",
    message: "Executor activity could not be refreshed.",
    recoveryAction: "Reconnect or rebind the Executor task.",
  },
  [CHANNELS.PRACTICE_SEND_TEACHER]: {
    code: "PRACTICE_TEACHER_SEND_FAILED",
    message: "The Teacher message could not be sent.",
    recoveryAction: "Review the message and retry.",
  },
  [CHANNELS.PRACTICE_SELECT_TAB]: {
    code: "PRACTICE_TAB_SELECT_FAILED",
    message: "The Practice tab could not be selected.",
    recoveryAction: "Select Exercise or Teacher and retry.",
  },
  [CHANNELS.PRACTICE_COMPACT]: {
    code: "PRACTICE_COMPACT_FAILED",
    message: "Practice could not be compacted.",
    recoveryAction: "Retry from the full Practice window.",
  },
  [CHANNELS.PRACTICE_OPEN_QUICK_CHAT]: {
    code: "PRACTICE_QUICK_CHAT_OPEN_FAILED",
    message: "Quick chat could not be opened.",
    recoveryAction: "Expand Practice and retry.",
  },
  [CHANNELS.PRACTICE_TOGGLE_QUICK_CHAT]: {
    code: "PRACTICE_QUICK_CHAT_TOGGLE_FAILED",
    message: "Quick chat could not be toggled.",
    recoveryAction: "Expand Practice and retry.",
  },
  [CHANNELS.PRACTICE_CLOSE_QUICK_CHAT]: {
    code: "PRACTICE_QUICK_CHAT_CLOSE_FAILED",
    message: "Quick chat could not be closed.",
    recoveryAction: "Expand Practice and retry.",
  },
  [CHANNELS.PRACTICE_EXPAND]: {
    code: "PRACTICE_EXPAND_FAILED",
    message: "Practice could not be expanded.",
    recoveryAction: "Retry from the compact Practice window.",
  },
  [CHANNELS.PRACTICE_PAUSE]: {
    code: "PRACTICE_PAUSE_FAILED",
    message: "Practice could not be paused.",
    recoveryAction: "Wait for the current operation and retry.",
  },
  [CHANNELS.PRACTICE_BUBBLE_MENU]: {
    code: "PRACTICE_BUBBLE_MENU_FAILED",
    message: "The Practice menu could not be opened.",
    recoveryAction: "Expand Practice and retry.",
  },
  [CHANNELS.PRACTICE_QUIT]: {
    code: "PRACTICE_QUIT_FAILED",
    message: "Practice could not be closed.",
    recoveryAction: "Expand Practice and retry.",
  },
});

function failure({ code, message, recoveryAction }) {
  return {
    ok: false,
    error: { code, message, recoveryAction },
  };
}

function safeHandler(handler, fallback) {
  return async (...args) => {
    try {
      return { ok: true, value: await handler(...args) };
    } catch {
      return failure(fallback);
    }
  };
}

function hasExactPayloadKey(payload, key) {
  return Boolean(
    payload
    && typeof payload === "object"
    && !Array.isArray(payload)
    && Object.keys(payload).length === 1
    && Object.hasOwn(payload, key)
  );
}

function parseThreadId(payload) {
  if (
    !hasExactPayloadKey(payload, "threadId")
    || typeof payload.threadId !== "string"
    || !/^[A-Za-z0-9_-]+$/.test(payload.threadId)
  ) throw new TypeError("Invalid Practice task binding request.");
  return payload.threadId;
}

function parseTeacherText(payload) {
  if (
    !hasExactPayloadKey(payload, "text")
    || typeof payload.text !== "string"
    || payload.text.trim() === ""
    || [...payload.text].length > 4_000
  ) throw new TypeError("Invalid Teacher message.");
  return payload.text;
}

function parseTab(payload) {
  if (
    !hasExactPayloadKey(payload, "tab")
    || !new Set(["exercise", "teacher"]).has(payload.tab)
  ) throw new TypeError("Invalid Practice tab.");
  return payload.tab;
}

export function toBubbleViewModel(full) {
  const session = full?.session;
  const newestTeacher = [...(session?.teacherChat ?? [])]
    .reverse()
    .find(({ role }) => role === "teacher");
  return Object.freeze({
    executor: {
      status: session?.executor?.status ?? "not-bound",
      freshness: session?.executor?.freshness ?? "disconnected",
    },
    newestTeacherMessageId: newestTeacher?.id ?? null,
  });
}

export function toQuickChatViewModel(full) {
  const session = full?.session;
  return Object.freeze({
    executor: {
      status: session?.executor?.status ?? "not-bound",
      freshness: session?.executor?.freshness ?? "disconnected",
      observedAt: session?.executor?.observedAt ?? null,
    },
    teacherChat: structuredClone(session?.teacherChat ?? []),
    error: session?.error ?? null,
  });
}

export function registerPracticeIpcHandlers({
  ipcMain,
  orchestrator,
  windowActions,
}) {
  const operations = new Map([
    [CHANNELS.PRACTICE_GET_STATE, () => orchestrator.getViewModel()],
    [CHANNELS.PRACTICE_GET_BUBBLE_STATE, () => (
      toBubbleViewModel(orchestrator.getViewModel())
    )],
    [CHANNELS.PRACTICE_GET_QUICK_STATE, () => (
      toQuickChatViewModel(orchestrator.getViewModel())
    )],
    [CHANNELS.PRACTICE_START, () => orchestrator.startPractice()],
    [CHANNELS.PRACTICE_CREATE_TASK, () => orchestrator.createDedicatedTask()],
    [CHANNELS.PRACTICE_LIST_TASKS, () => orchestrator.listEligibleTasks()],
    [CHANNELS.PRACTICE_REBIND, () => orchestrator.requestRebind()],
    [CHANNELS.PRACTICE_OPEN_TASK, () => orchestrator.openBoundTask()],
    [CHANNELS.PRACTICE_RETRY, () => orchestrator.retryObservation()],
    [CHANNELS.PRACTICE_COMPACT, () => windowActions.compact()],
    [CHANNELS.PRACTICE_OPEN_QUICK_CHAT, () => windowActions.openQuickChat()],
    [CHANNELS.PRACTICE_TOGGLE_QUICK_CHAT, () => windowActions.toggleQuickChat()],
    [CHANNELS.PRACTICE_CLOSE_QUICK_CHAT, () => windowActions.closeQuickChat()],
    [CHANNELS.PRACTICE_EXPAND, () => windowActions.expandTeacher()],
    [CHANNELS.PRACTICE_PAUSE, () => orchestrator.pause()],
    [CHANNELS.PRACTICE_BUBBLE_MENU, (event) => (
      windowActions.openBubbleMenu(event.sender)
    )],
    [CHANNELS.PRACTICE_QUIT, () => windowActions.quit()],
  ]);

  const handlers = new Map();
  for (const [channel, operation] of operations) {
    handlers.set(channel, safeHandler(operation, FAILURES[channel]));
  }
  handlers.set(CHANNELS.PRACTICE_BIND_TASK, safeHandler(
    (_event, payload) => orchestrator.bindExistingTask(parseThreadId(payload)),
    FAILURES[CHANNELS.PRACTICE_BIND_TASK],
  ));
  handlers.set(CHANNELS.PRACTICE_SEND_TEACHER, safeHandler(
    (_event, payload) => orchestrator.sendTeacherMessage(parseTeacherText(payload)),
    FAILURES[CHANNELS.PRACTICE_SEND_TEACHER],
  ));
  handlers.set(CHANNELS.PRACTICE_SELECT_TAB, safeHandler(
    (_event, payload) => orchestrator.selectTab(parseTab(payload)),
    FAILURES[CHANNELS.PRACTICE_SELECT_TAB],
  ));

  for (const [channel, handler] of handlers) ipcMain.handle(channel, handler);
  return () => {
    for (const channel of handlers.keys()) ipcMain.removeHandler(channel);
  };
}
