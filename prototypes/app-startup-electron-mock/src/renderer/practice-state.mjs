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

function deepFreeze(value, seen = new WeakSet()) {
  if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
  if (seen.has(value)) return value;
  seen.add(value);
  Object.freeze(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
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

function fallbackNotice(event) {
  return event.opened === false
    ? `Codex could not focus the new task. Locate “${safeFallbackName(event.fallbackName)}” in Codex; the verified binding is still active.`
    : null;
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
      const next = withViewModel(state, event.viewModel, {
        fallbackNotice: fallbackNotice(event),
      });
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
    case "HANDOFF_UPDATED":
      return withViewModel(state, event.viewModel, {
        fallbackNotice: fallbackNotice(event),
      });
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
        error: null,
      });
    case "TASK_BIND_REQUESTED":
      return frozenState({ ...state, busyAction: "binding", error: null });
    case "TASK_BOUND":
      return withViewModel(state, event.viewModel, {
        pickerOpen: false,
        eligibleTasks: [],
        fallbackNotice: null,
      });
    case "TASK_BIND_REJECTED":
      return withViewModel(state, event.viewModel ?? state.viewModel, {
        pickerOpen: true,
        eligibleTasks: state.eligibleTasks,
        busyAction: null,
        error: FIXED_ERRORS.binding,
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
      return withViewModel(state, event.viewModel, { teacherDraft: "" });
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

function unwrapBridgeResult(result) {
  if (result?.ok) return result.value;
  throw new Error("The renderer bridge operation failed.");
}

function needsBinding(viewModel) {
  return viewModel?.session?.lifecycle === "needs-binding"
    && viewModel.session.executor?.bound !== true;
}

function hasBinding(viewModel) {
  return viewModel?.session?.executor?.bound === true;
}

function hasCommittedBinding(viewModel) {
  return hasBinding(viewModel)
    && ["ready", "active", "paused"].includes(viewModel.session.lifecycle)
    && !viewModel.session.error;
}

export function createPracticeRendererController({
  bridge,
  view,
  confirmRebind = () => false,
}) {
  let state = createInitialPracticeRendererState();
  let removeSubscription = null;
  let teacherRequestGeneration = 0;
  let activeTeacherRequest = null;

  function apply(event, { composerOnly = false } = {}) {
    state = reducePracticeRenderer(state, event);
    if (composerOnly) view.updateComposer?.(state);
    else view.render?.(state);
    return state;
  }

  function supersedeTeacherRequest() {
    teacherRequestGeneration += 1;
    activeTeacherRequest = null;
  }

  function ownsTeacherRequest(request) {
    return activeTeacherRequest === request
      && request.generation === teacherRequestGeneration;
  }

  function subscribe() {
    if (removeSubscription) return removeSubscription;
    const removeBridgeListener = bridge.onStateChanged((value) => {
      apply({ type: "STATE_PUSHED", viewModel: value });
    });
    let removed = false;
    removeSubscription = () => {
      if (removed) return;
      removed = true;
      removeBridgeListener?.();
      removeSubscription = null;
    };
    return removeSubscription;
  }

  async function initialize() {
    try {
      const value = unwrapBridgeResult(await bridge.getState());
      return apply({ type: "VIEW_MODEL_LOADED", viewModel: value });
    } catch {
      return apply({ type: "ERROR", kind: "generic" });
    }
  }

  async function createDedicatedTask() {
    if (state.busyAction === "binding") return state;
    apply({ type: "CREATE_TASK_REQUESTED" });
    try {
      const value = unwrapBridgeResult(await bridge.createTask());
      if (!hasBinding(value)) {
        apply({ type: "VIEW_MODEL_LOADED", viewModel: value });
        return apply({ type: "ERROR", kind: "binding" });
      }
      const handoff = value.session.executor?.handoff;
      return apply({
        type: "TASK_CREATED",
        viewModel: value,
        opened: handoff?.opened !== false,
        fallbackName: handoff?.fallbackName,
      });
    } catch {
      return apply({ type: "ERROR", kind: "binding" });
    }
  }

  async function startPractice() {
    if (state.busyAction === "entering") return state;
    apply({ type: "START_REQUESTED" });
    let value;
    try {
      value = unwrapBridgeResult(await bridge.start());
      apply({ type: "VIEW_MODEL_LOADED", viewModel: value });
    } catch {
      return apply({ type: "ERROR", kind: "start" });
    }
    if (value?.session) view.focusPracticeHeading?.();
    if (needsBinding(value)) return createDedicatedTask();
    return state;
  }

  async function openTaskPicker() {
    if (state.busyAction === "binding") return state;
    apply({ type: "OPEN_PICKER" });
    try {
      const tasks = unwrapBridgeResult(await bridge.listTasks());
      return apply({ type: "ELIGIBLE_TASKS_LOADED", tasks });
    } catch {
      const next = apply({ type: "ERROR", kind: "picker" });
      view.focusPickerAlert?.();
      return next;
    }
  }

  async function bindSelectedTask(taskId) {
    if (!state.pickerOpen || state.busyAction === "binding") return state;
    const selected = state.eligibleTasks.find((task) => task.threadId === taskId);
    if (!selected) return state;
    apply({ type: "TASK_BIND_REQUESTED" });
    try {
      const value = unwrapBridgeResult(await bridge.bindTask(selected.threadId));
      if (!hasCommittedBinding(value)) {
        const next = apply({ type: "TASK_BIND_REJECTED", viewModel: value });
        view.focusPickerChoice?.(selected.threadId);
        return next;
      }
      const next = apply({ type: "TASK_BOUND", viewModel: value });
      view.focusBoundTask?.();
      return next;
    } catch {
      const next = apply({ type: "TASK_BIND_REJECTED" });
      view.focusPickerChoice?.(selected.threadId);
      return next;
    }
  }

  function closePicker() {
    if (state.busyAction === "binding") return state;
    const next = apply({ type: "CLOSE_PICKER" });
    view.focusPickerTrigger?.();
    return next;
  }

  async function selectTab(tab) {
    if (!["exercise", "teacher"].includes(tab)) return state;
    apply({ type: "TAB_SELECTED", tab });
    try {
      const value = unwrapBridgeResult(await bridge.selectTab(tab));
      return apply({ type: "VIEW_MODEL_LOADED", viewModel: value });
    } catch {
      return apply({ type: "ERROR", kind: "generic" });
    }
  }

  async function openBoundTask() {
    if (!hasBinding(state.viewModel)) return state;
    apply({ type: "BUSY_STARTED", action: "opening" });
    try {
      const value = unwrapBridgeResult(await bridge.openTask());
      const handoff = value?.session?.executor?.handoff;
      return apply({
        type: "HANDOFF_UPDATED",
        viewModel: value,
        opened: handoff?.opened !== false,
        fallbackName: handoff?.fallbackName,
      });
    } catch {
      return apply({ type: "ERROR", kind: "open" });
    }
  }

  async function retryObservation() {
    if (!hasBinding(state.viewModel) || state.busyAction === "retrying") return state;
    apply({ type: "BUSY_STARTED", action: "retrying" });
    try {
      const value = unwrapBridgeResult(await bridge.retry());
      return apply({ type: "VIEW_MODEL_LOADED", viewModel: value });
    } catch {
      return apply({ type: "ERROR", kind: "observation" });
    }
  }

  async function rebindTask() {
    if (state.busyAction === "rebinding") return state;
    const confirmed = confirmRebind(
      "Rebind this Practice session? The observation cursor will reset, and the Teacher will use only the newly selected task.",
    );
    if (!confirmed) return state;
    supersedeTeacherRequest();
    apply({ type: "BUSY_STARTED", action: "rebinding" });
    try {
      const value = unwrapBridgeResult(await bridge.rebind());
      apply({ type: "VIEW_MODEL_LOADED", viewModel: value });
      if (needsBinding(value)) return openTaskPicker();
      return state;
    } catch {
      return apply({ type: "ERROR", kind: "rebind" });
    }
  }

  async function compact() {
    try {
      unwrapBridgeResult(await bridge.compact());
    } catch {
      apply({ type: "ERROR", kind: "generic" });
    }
    return state;
  }

  function changeTeacherDraft(text) {
    if (state.busyAction === "teacher") return state;
    return apply({ type: "TEACHER_DRAFT_CHANGED", text }, { composerOnly: true });
  }

  async function sendTeacherMessage() {
    const text = state.teacherDraft.trim();
    if (!text || state.busyAction === "teacher" || !hasBinding(state.viewModel)) {
      view.focusComposer?.();
      return state;
    }
    const request = Object.freeze({ generation: teacherRequestGeneration });
    activeTeacherRequest = request;
    apply({ type: "TEACHER_SEND_REQUESTED" }, { composerOnly: true });
    try {
      const value = unwrapBridgeResult(await bridge.sendTeacherMessage(text));
      if (!ownsTeacherRequest(request)) return state;
      activeTeacherRequest = null;
      apply({ type: "TEACHER_SEND_ACCEPTED", viewModel: value });
    } catch {
      if (!ownsTeacherRequest(request)) return state;
      activeTeacherRequest = null;
      apply({ type: "ERROR", kind: "teacher" });
    }
    view.focusComposer?.();
    return state;
  }

  function dispose() {
    supersedeTeacherRequest();
    removeSubscription?.();
  }

  return Object.freeze({
    bindSelectedTask,
    changeTeacherDraft,
    closePicker,
    compact,
    createDedicatedTask,
    dispose,
    getState: () => state,
    initialize,
    openBoundTask,
    openTaskPicker,
    rebindTask,
    retryObservation,
    selectTab,
    sendTeacherMessage,
    startPractice,
    subscribe,
  });
}
