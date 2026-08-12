const FIXED_ERROR = Object.freeze({
  message: "Không thể hoàn tất thao tác Practice lúc này.",
  recoveryAction: "retry-switch",
});

const DEFAULT_LOADING_LABEL = "Đang chuẩn bị Practice mới…";

function cloneWorkspace(value) {
  if (!value || typeof value !== "object") return null;
  try {
    return Object.freeze(structuredClone(value));
  } catch {
    return null;
  }
}

function freeze(state) {
  return Object.freeze({
    ...state,
    error: state.error ? Object.freeze({ ...state.error }) : null,
  });
}

export function createInitialPracticeWorkspaceRendererState() {
  return freeze({
    workspace: null,
    phase: "loading",
    transferDialogOpen: false,
    error: null,
    navigationNotice: null,
  });
}

export function getPracticeWorkspaceLoadingLabel(state) {
  if (state?.phase !== "switching") return "";
  const label = state.workspace?.transition?.label;
  return typeof label === "string" && label.trim()
    ? label.trim().slice(0, 200)
    : DEFAULT_LOADING_LABEL;
}

export function reducePracticeWorkspaceRenderer(state, event) {
  switch (event?.type) {
    case "WORKSPACE_LOADED":
      return freeze({
        ...state,
        workspace: cloneWorkspace(event.workspace),
        phase: "ready",
        transferDialogOpen: false,
        error: null,
      });
    case "TRANSFER_DIALOG_OPENED":
      if (!state.workspace?.activeRun || state.phase !== "ready") return state;
      return freeze({ ...state, transferDialogOpen: true, error: null });
    case "TRANSFER_DIALOG_CLOSED":
      if (state.phase === "switching") return state;
      return freeze({ ...state, transferDialogOpen: false });
    case "WORKSPACE_SWITCH_REQUESTED":
      if (state.phase === "switching") return state;
      return freeze({
        ...state,
        phase: "switching",
        transferDialogOpen: false,
        error: null,
        navigationNotice: null,
      });
    case "WORKSPACE_ACTION_COMPLETED": {
      const workspace = cloneWorkspace(event.workspace);
      const fallbackName = typeof event.navigation?.fallbackName === "string"
        ? event.navigation.fallbackName.trim().slice(0, 200)
        : "";
      return freeze({
        ...state,
        workspace,
        phase: "ready",
        transferDialogOpen: false,
        error: null,
        navigationNotice: event.navigation?.opened === false
          ? `Codex chưa thể mở Executor chat. Hãy tìm “${fallbackName || "Practice hiện tại"}” trong Codex.`
          : null,
      });
    }
    case "WORKSPACE_ACTION_FAILED":
      return freeze({
        ...state,
        workspace: cloneWorkspace(event.workspace) ?? state.workspace,
        phase: "ready",
        transferDialogOpen: false,
        error: FIXED_ERROR,
      });
    default:
      return state;
  }
}

function unwrap(result) {
  if (result?.ok && result.value?.workspace) return result.value;
  throw new Error("Practice workspace bridge operation failed.");
}

export function createPracticeWorkspaceRendererController({ bridge, view }) {
  let state = createInitialPracticeWorkspaceRendererState();
  let requestGeneration = 0;
  let activeRequest = null;

  function apply(event) {
    state = reducePracticeWorkspaceRenderer(state, event);
    view.render?.(state);
    return state;
  }

  function claimRequest(kind) {
    if (activeRequest) return null;
    const request = Object.freeze({ kind, generation: requestGeneration + 1 });
    requestGeneration = request.generation;
    activeRequest = request;
    return request;
  }

  function owns(request) {
    return activeRequest === request && request.generation === requestGeneration;
  }

  async function recoverWorkspace() {
    try {
      return unwrap(await bridge.getWorkspace()).workspace;
    } catch {
      return null;
    }
  }

  async function initialize() {
    const request = claimRequest("initialize");
    if (!request) return state;
    try {
      const value = unwrap(await bridge.getWorkspace());
      if (!owns(request)) return state;
      activeRequest = null;
      return apply({ type: "WORKSPACE_LOADED", workspace: value.workspace });
    } catch {
      if (!owns(request)) return state;
      activeRequest = null;
      return apply({ type: "WORKSPACE_ACTION_FAILED" });
    }
  }

  function requestStartNew() {
    if (activeRequest || state.phase !== "ready") return state;
    if (state.workspace?.activeRun) {
      const next = apply({ type: "TRANSFER_DIALOG_OPENED" });
      view.focusTransferDialog?.();
      return next;
    }
    return startNew(false);
  }

  function closeTransferDialog() {
    if (activeRequest) return state;
    const next = apply({ type: "TRANSFER_DIALOG_CLOSED" });
    view.focusStartNew?.();
    return next;
  }

  async function runWorkspaceAction(kind, operation, { openPractice = false } = {}) {
    const request = claimRequest(kind);
    if (!request) return state;
    apply({ type: "WORKSPACE_SWITCH_REQUESTED" });
    try {
      const value = unwrap(await operation());
      if (!owns(request)) return state;
      activeRequest = null;
      const next = apply({
        type: "WORKSPACE_ACTION_COMPLETED",
        workspace: value.workspace,
        navigation: value.navigation,
      });
      if (openPractice) view.openPractice?.();
      return next;
    } catch {
      if (!owns(request)) return state;
      const workspace = await recoverWorkspace();
      if (!owns(request)) return state;
      activeRequest = null;
      const next = apply({ type: "WORKSPACE_ACTION_FAILED", workspace });
      view.focusError?.();
      return next;
    }
  }

  function startNew(transfer) {
    if (typeof transfer !== "boolean") return state;
    return runWorkspaceAction(
      "start-new",
      () => bridge.startNew(transfer),
      { openPractice: true },
    );
  }

  function resumeActive() {
    if (!state.workspace?.actions?.canResume) return state;
    return runWorkspaceAction(
      "resume",
      () => bridge.resumeActive(),
      { openPractice: true },
    );
  }

  function retrySwitch() {
    if (!state.workspace?.actions?.canRetrySwitch) return state;
    return runWorkspaceAction(
      "retry-switch",
      () => bridge.retrySwitch(),
      { openPractice: true },
    );
  }

  function cancelSwitch() {
    if (!state.workspace?.transition?.canCancel) return state;
    return runWorkspaceAction("cancel-switch", () => bridge.cancelSwitch());
  }

  function dispose() {
    requestGeneration += 1;
    activeRequest = null;
  }

  return Object.freeze({
    cancelSwitch,
    closeTransferDialog,
    dispose,
    getState: () => state,
    initialize,
    requestStartNew,
    resumeActive,
    retrySwitch,
    startNew,
  });
}
