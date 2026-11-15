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
  [CHANNELS.PRACTICE_WORKSPACE_GET]: {
    code: "PRACTICE_WORKSPACE_UNAVAILABLE",
    message: "Practice workspace could not be loaded.",
    recoveryAction: "Retry or restart Course App.",
  },
  [CHANNELS.PRACTICE_START_NEW]: {
    code: "PRACTICE_SWITCH_FAILED",
    message: "A new Practice could not be started.",
    recoveryAction: "Retry the saved transition or continue the current Practice.",
  },
  [CHANNELS.PRACTICE_RESUME_ACTIVE]: {
    code: "PRACTICE_RESUME_FAILED",
    message: "The active Executor chat could not be opened.",
    recoveryAction: "Locate the named Executor chat in Codex or retry.",
  },
  [CHANNELS.PRACTICE_RETRY_SWITCH]: {
    code: "PRACTICE_SWITCH_RETRY_FAILED",
    message: "The saved Practice switch could not continue.",
    recoveryAction: "Retry without starting another Practice.",
  },
  [CHANNELS.PRACTICE_CANCEL_SWITCH]: {
    code: "PRACTICE_SWITCH_CANCEL_FAILED",
    message: "The Practice switch could not be cancelled.",
    recoveryAction: "Retry the saved transition; attached context cannot be cancelled.",
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
    presentationMode: full?.presentation?.mode === "quick-chat"
      ? "quick-chat"
      : "compact",
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

const TRANSITION_LABELS = Object.freeze({
  prepared: "Đang chuẩn bị Practice mới…",
  "target-created": "Đang tạo phần tóm tắt có chọn lọc…",
  "handoff-prepared": "Đang gắn phần tóm tắt đã chọn lọc…",
  attached: "Đang xác minh phần tóm tắt trong Executor chat mới…",
  verified: "Đang chuyển sang Practice mới…",
});

export function toPracticeWorkspaceViewModel(state, fallbackStartRequest) {
  const definition = state?.activeRun?.startRequest?.practiceDefinition
    ?? fallbackStartRequest?.practiceDefinition;
  if (!definition || !Array.isArray(definition.steps)) {
    throw new TypeError("Practice definition is unavailable.");
  }
  const checklist = new Map(
    (state?.activeRun?.checklist ?? []).map((step) => [step.stepId, step]),
  );
  const activeRun = state?.activeRun
    ? {
        status: state.activeRun.status,
        executorChatName: state.activeRun.binding?.displayName ?? null,
        steps: definition.steps.map((step) => ({
          id: step.id,
          title: step.title,
          completionAuthority: step.completionAuthority,
          status: checklist.get(step.id)?.status ?? "remaining",
        })),
      }
    : null;
  const transition = state?.pendingTransition
    ? {
        mode: state.pendingTransition.mode,
        stage: state.pendingTransition.stage,
        label: TRANSITION_LABELS[state.pendingTransition.stage] ?? "Đang tiếp tục Practice mới…",
        canCancel: new Set(["prepared", "target-created", "handoff-prepared"]).has(state.pendingTransition.stage),
      }
    : null;
  return Object.freeze({
    brief: {
      objective: definition.objective,
      expectedOutcome: definition.expectedOutcome,
    },
    activeRun,
    transition,
    archivedRunCount: Array.isArray(state?.archivedRuns) ? state.archivedRuns.length : 0,
    presentation: {
      mode: state?.presentation?.mode ?? "full",
      activePanel: state?.presentation?.activePanel ?? "teacher",
    },
    actions: {
      canStartNew: transition === null,
      canResume: Boolean(activeRun?.executorChatName) && transition === null,
      canRetrySwitch: transition !== null,
    },
  });
}

function parseTransferChoice(payload) {
  if (!hasExactPayloadKey(payload, "transfer") || typeof payload.transfer !== "boolean") {
    throw new TypeError("Practice transfer choice must be boolean.");
  }
  return payload.transfer;
}

export function registerPracticeWorkspaceIpcHandlers({
  ipcMain,
  transitionCoordinator,
  workspaceStore,
  loadStartRequest,
  activateRuntime = async () => {},
}) {
  async function project(state, navigation = null) {
    const startRequest = await loadStartRequest();
    return {
      workspace: toPracticeWorkspaceViewModel(state, startRequest),
      navigation: navigation ? {
        opened: navigation.opened === true,
        fallbackName: typeof navigation.fallbackName === "string" ? navigation.fallbackName : null,
      } : null,
    };
  }

  const operations = new Map([
    [CHANNELS.PRACTICE_WORKSPACE_GET, async () => project(await workspaceStore.read())],
    [CHANNELS.PRACTICE_START_NEW, async (_event, payload) => {
      const transfer = parseTransferChoice(payload);
      const result = await transitionCoordinator.beginSwitch({
        mode: transfer ? "selective" : "fresh",
      });
      await activateRuntime(result.state);
      return project(result.state, result.navigation);
    }],
    [CHANNELS.PRACTICE_RESUME_ACTIVE, async () => {
      const result = await transitionCoordinator.resumeActive();
      await activateRuntime(result.state);
      return project(result.state, result.navigation);
    }],
    [CHANNELS.PRACTICE_RETRY_SWITCH, async () => {
      const result = await transitionCoordinator.retrySwitch();
      await activateRuntime(result.state);
      return project(result.state, result.navigation);
    }],
    [CHANNELS.PRACTICE_CANCEL_SWITCH, async () => (
      project(await transitionCoordinator.cancelSwitch())
    )],
  ]);
  const handlers = new Map();
  for (const [channel, operation] of operations) {
    handlers.set(channel, safeHandler(operation, FAILURES[channel]));
  }
  for (const [channel, handler] of handlers) ipcMain.handle(channel, handler);
  return () => {
    for (const channel of handlers.keys()) ipcMain.removeHandler(channel);
  };
}
