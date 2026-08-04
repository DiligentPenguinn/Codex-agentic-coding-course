const FIXED_ERRORS = Object.freeze({
  start: Object.freeze({
    message: "Practice Mode could not be started.",
    recoveryAction: "retry-start",
  }),
  binding: Object.freeze({
    message: "A dedicated Codex task could not be prepared.",
    recoveryAction: "choose-task",
  }),
  picker: Object.freeze({
    message: "Eligible Codex tasks could not be loaded.",
    recoveryAction: "choose-task",
  }),
  observation: Object.freeze({
    message: "Executor observation could not be refreshed.",
    recoveryAction: "retry-observation",
  }),
  rebind: Object.freeze({
    message: "The task binding could not be reset safely.",
    recoveryAction: "rebind-task",
  }),
  open: Object.freeze({
    message: "The bound Codex task could not be opened.",
    recoveryAction: "open-task",
  }),
  teacher: Object.freeze({
    message: "The Teacher could not answer right now. Your draft is still here.",
    recoveryAction: "retry-teacher",
  }),
  generic: Object.freeze({
    message: "Practice encountered a recoverable issue.",
    recoveryAction: "dismiss",
  }),
});

function deepFreeze(value) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child);
  return value;
}

function safeClone(value) {
  if (!value || typeof value !== "object") return null;
  try {
    return deepFreeze(structuredClone(value));
  } catch {
    return null;
  }
}

function safeTask(task) {
  if (
    !task
    || typeof task !== "object"
    || typeof task.threadId !== "string"
    || !/^[-A-Za-z0-9_]{1,200}$/.test(task.threadId)
  ) return null;
  const displayName = typeof task.displayName === "string"
    ? task.displayName.trim().slice(0, 200)
    : "";
  if (!displayName) return null;
  return Object.freeze({
    threadId: task.threadId,
    displayName,
    updatedAt: typeof task.updatedAt === "string" ? task.updatedAt : null,
    status: typeof task.status === "string" ? task.status : "unknown",
  });
}

function safeTasks(tasks) {
  if (!Array.isArray(tasks)) return Object.freeze([]);
  return Object.freeze(tasks.map(safeTask).filter(Boolean).slice(0, 25));
}

function safeFallbackName(value) {
  if (typeof value !== "string") return "the named Practice task";
  const trimmed = value.trim().slice(0, 200);
  if (!trimmed || /(?:^|\b)(?:thr[-_]|thread(?:\s+id)?|task[-_]?id)(?:\b|[-_])/i.test(trimmed)) {
    return "the named Practice task";
  }
  return trimmed;
}

function frozenState(state) {
  return Object.freeze({
    ...state,
    eligibleTasks: Object.isFrozen(state.eligibleTasks)
      ? state.eligibleTasks
      : safeTasks(state.eligibleTasks),
    error: state.error ? Object.freeze({ ...state.error }) : null,
  });
}

export function createInitialPracticeRendererState() {
  return frozenState({
    screen: "course",
    viewModel: null,
    busyAction: null,
    eligibleTasks: [],
    pickerOpen: false,
    teacherDraft: "",
    error: null,
    fallbackNotice: null,
  });
}

function withViewModel(state, viewModel, extra = {}) {
  const safeViewModel = safeClone(viewModel);
  return frozenState({
    ...state,
    screen: safeViewModel?.session ? "practice" : "course",
    viewModel: safeViewModel,
    busyAction: null,
    error: null,
    ...extra,
  });
}

export function reducePracticeRenderer(state, event) {
  switch (event?.type) {
    case "VIEW_MODEL_LOADED":
      return withViewModel(state, event.viewModel);
    case "STATE_PUSHED":
      return withViewModel(state, event.viewModel, {
        busyAction: state.busyAction,
        error: state.error,
      });
    case "START_REQUESTED":
      return frozenState({
        ...state,
        busyAction: "entering",
        error: null,
        fallbackNotice: null,
      });
    case "CREATE_TASK_REQUESTED":
      return frozenState({
        ...state,
        busyAction: "binding",
        error: null,
        fallbackNotice: null,
      });
    case "TASK_CREATED": {
      const fallbackNotice = event.opened === false
        ? `Codex could not focus the new task. Locate “${safeFallbackName(event.fallbackName)}” in Codex; the verified binding is still active.`
        : null;
      const next = withViewModel(state, event.viewModel, { fallbackNotice });
      if (!next.viewModel?.presentation) return next;
      return frozenState({
        ...next,
        viewModel: deepFreeze({
          ...next.viewModel,
          presentation: {
            ...next.viewModel.presentation,
            lastFullTab: "exercise",
          },
        }),
      });
    }
    case "OPEN_PICKER":
      return frozenState({
        ...state,
        pickerOpen: true,
        eligibleTasks: [],
        busyAction: "listing",
        error: null,
      });
    case "ELIGIBLE_TASKS_LOADED":
      return frozenState({
        ...state,
        pickerOpen: true,
        eligibleTasks: safeTasks(event.tasks),
        busyAction: null,
        error: null,
      });
    case "CLOSE_PICKER":
      return frozenState({
        ...state,
        pickerOpen: false,
        eligibleTasks: [],
        busyAction: null,
      });
    case "TASK_BIND_REQUESTED":
      return frozenState({ ...state, busyAction: "binding", error: null });
    case "TASK_BOUND":
      return withViewModel(state, event.viewModel, {
        pickerOpen: false,
        eligibleTasks: [],
        fallbackNotice: null,
      });
    case "TAB_SELECTED": {
      if (
        !["exercise", "teacher"].includes(event.tab)
        || !state.viewModel?.presentation
      ) return state;
      return frozenState({
        ...state,
        viewModel: deepFreeze({
          ...state.viewModel,
          presentation: {
            ...state.viewModel.presentation,
            lastFullTab: event.tab,
          },
        }),
      });
    }
    case "TEACHER_DRAFT_CHANGED":
      return frozenState({
        ...state,
        teacherDraft: typeof event.text === "string"
          ? event.text.slice(0, 4_000)
          : "",
      });
    case "TEACHER_SEND_REQUESTED":
      return frozenState({ ...state, busyAction: "teacher", error: null });
    case "TEACHER_SEND_ACCEPTED":
      return withViewModel(state, event.viewModel, {
        teacherDraft: "",
      });
    case "BUSY_STARTED":
      return frozenState({
        ...state,
        busyAction: typeof event.action === "string" ? event.action : "working",
        error: null,
      });
    case "ERROR":
      return frozenState({
        ...state,
        busyAction: null,
        error: FIXED_ERRORS[event.kind] ?? FIXED_ERRORS.generic,
      });
    case "ERROR_CLEARED":
      return frozenState({ ...state, error: null });
    default:
      return state;
  }
}
