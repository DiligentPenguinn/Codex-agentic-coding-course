export const STATUS = Object.freeze({
  ready: Object.freeze(["○", "Executor ready"]),
  working: Object.freeze(["◌", "Executor working"]),
  "waiting-for-learner": Object.freeze(["!", "Executor waiting for you"]),
  "response-ready": Object.freeze(["✓", "Executor response ready"]),
  stale: Object.freeze(["~", "Executor context stale"]),
  disconnected: Object.freeze(["×", "Executor disconnected"]),
  "not-bound": Object.freeze(["–", "No Executor task bound"]),
});

// Chromium does not expose the operating system's double-click threshold.
// The approved interaction contract uses one 300ms click arbiter.
export const BUBBLE_CLICK_DELAY_MS = 300;

function effectiveStatus(executor) {
  if (executor?.freshness === "disconnected") return "disconnected";
  if (executor?.freshness === "stale") return "stale";
  return Object.hasOwn(STATUS, executor?.status) ? executor.status : "not-bound";
}

function safeTeacherMessageId(value) {
  return typeof value === "string" && value.length > 0 && value.length <= 200
    ? value
    : null;
}

function invokeSafely(operation) {
  try {
    Promise.resolve(operation()).catch(() => {});
  } catch {
    // Compact actions fail closed; the shared state stream remains authoritative.
  }
}

export function formatBubbleLiveStatus(executorLabel, unreadCount) {
  const count = Math.max(
    0,
    Number.isFinite(unreadCount) ? Math.floor(unreadCount) : 0,
  );
  if (count === 0) {
    return `${executorLabel}. No new Teacher message updates observed.`;
  }
  return `${executorLabel}. ${count} new Teacher message ${count === 1 ? "update" : "updates"} observed.`;
}

export function createBubbleController({
  bridge,
  view,
  schedule = globalThis.setTimeout,
  cancel = globalThis.clearTimeout,
  clickDelay = BUBBLE_CLICK_DELAY_MS,
}) {
  let disposed = false;
  let initialized = false;
  let stateRevision = 0;
  let removeStateListener = null;
  let pendingOpenTimer = null;
  let newestTeacherMessageId = null;
  let presentationMode = "compact";
  let presentationRequestGeneration = 0;
  let lastSeenTeacherMessageId = null;
  let unreadTransitions = 0;
  const observedTeacherMessageIds = new Set();

  function renderUnread() {
    view.renderUnread(unreadTransitions);
  }

  function observeTeacherMessage(value) {
    const nextId = safeTeacherMessageId(value);
    newestTeacherMessageId = nextId;
    if (!nextId || observedTeacherMessageIds.has(nextId)) return;
    observedTeacherMessageIds.add(nextId);
    if (nextId !== lastSeenTeacherMessageId) unreadTransitions += 1;
  }

  function applyState(value) {
    if (disposed || !value || typeof value !== "object") return;
    const key = effectiveStatus(value.executor);
    const [symbol, label] = STATUS[key];
    view.renderStatus({
      key,
      symbol,
      label,
      freshness: typeof value.executor?.freshness === "string"
        ? value.executor.freshness
        : "disconnected",
    });
    presentationMode = value.presentationMode === "quick-chat"
      ? "quick-chat"
      : "compact";
    view.renderPresentationMode?.(presentationMode);
    observeTeacherMessage(value.newestTeacherMessageId);
    renderUnread();
  }

  function receiveState(value) {
    stateRevision += 1;
    applyState(value);
  }

  function markCurrentSeen() {
    lastSeenTeacherMessageId = newestTeacherMessageId;
    unreadTransitions = 0;
    renderUnread();
  }

  function cancelPendingOpen() {
    if (pendingOpenTimer === null) return;
    cancel(pendingOpenTimer);
    pendingOpenTimer = null;
  }

  function openQuickChat() {
    const requestGeneration = ++presentationRequestGeneration;
    pendingOpenTimer = null;
    try {
      Promise.resolve(bridge.openQuickChat())
        .then((response) => {
          if (
            !disposed
            && presentationRequestGeneration === requestGeneration
            && response?.ok === true
            && response.value === true
          ) {
            markCurrentSeen();
          }
        })
        .catch(() => {});
    } catch {
      // Failure cannot claim that quick chat opened or mutate unread state.
    }
  }

  function closeQuickChat() {
    const requestGeneration = ++presentationRequestGeneration;
    pendingOpenTimer = null;
    try {
      Promise.resolve(bridge.closeQuickChat())
        .then((response) => {
          if (
            !disposed
            && presentationRequestGeneration === requestGeneration
            && response?.ok === true
            && response.value === true
          ) {
            presentationMode = "compact";
            view.renderPresentationMode?.(presentationMode);
          }
        })
        .catch(() => {});
    } catch {
      // The shared state stream remains authoritative after a failed close.
    }
  }

  function expand() {
    cancelPendingOpen();
    presentationRequestGeneration += 1;
    invokeSafely(() => bridge.expand());
  }

  async function initialize() {
    if (disposed || initialized) return;
    initialized = true;
    removeStateListener = bridge.onStateChanged(receiveState);
    const revisionAtRequest = stateRevision;
    try {
      const response = await bridge.getState();
      if (!disposed && stateRevision === revisionAtRequest && response?.ok) {
        applyState(response.value);
      } else if (!disposed && stateRevision === revisionAtRequest) {
        applyState({
          executor: { status: "disconnected", freshness: "disconnected" },
          newestTeacherMessageId: null,
        });
      }
    } catch {
      if (!disposed && stateRevision === revisionAtRequest) {
        applyState({
          executor: { status: "disconnected", freshness: "disconnected" },
          newestTeacherMessageId: null,
        });
      }
    }
  }

  function handleClick(event) {
    if (disposed) return;
    cancelPendingOpen();
    // The second click only cancels; the following dblclick owns Expand.
    if (Number.isFinite(event?.detail) && event.detail > 1) return;
    const action = presentationMode === "quick-chat"
      ? closeQuickChat
      : openQuickChat;
    pendingOpenTimer = schedule(action, clickDelay);
  }

  function handleDoubleClick(event) {
    event?.preventDefault?.();
    if (disposed) return;
    expand();
  }

  function handleKeyDown(event) {
    if (disposed || event?.repeat || !["Enter", " "].includes(event?.key)) return;
    event.preventDefault?.();
    expand();
  }

  function handleContextMenu(event) {
    event?.preventDefault?.();
    if (disposed) return;
    cancelPendingOpen();
    invokeSafely(() => bridge.openMenu());
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    presentationRequestGeneration += 1;
    cancelPendingOpen();
    removeStateListener?.();
    removeStateListener = null;
  }

  return Object.freeze({
    dispose,
    handleClick,
    handleContextMenu,
    handleDoubleClick,
    handleKeyDown,
    initialize,
  });
}

export function createBubbleDomView({ root = document } = {}) {
  const button = root.querySelector("#teacher-bubble");
  const shell = root.querySelector(".bubble-shell");
  const symbol = root.querySelector("#executor-symbol");
  const badge = root.querySelector("#unread-badge");
  const status = root.querySelector("#bubble-status");
  let executorLabel = "Executor ready";
  let unreadCount = 0;

  function renderLiveStatus() {
    status.textContent = formatBubbleLiveStatus(executorLabel, unreadCount);
  }

  return Object.freeze({
    renderPresentationMode(mode) {
      button.setAttribute(
        "aria-label",
        mode === "quick-chat"
          ? "Minimize Teacher quick chat"
          : "Open Teacher quick chat",
      );
    },
    renderStatus(next) {
      shell.dataset.state = next.key;
      symbol.textContent = next.symbol;
      executorLabel = next.label;
      renderLiveStatus();
    },
    renderUnread(count) {
      const bounded = Math.max(0, Number.isFinite(count) ? count : 0);
      unreadCount = bounded;
      badge.hidden = bounded === 0;
      badge.textContent = bounded > 99 ? "99+" : String(bounded);
      renderLiveStatus();
    },
  });
}

function startBubbleRenderer() {
  const bridge = window.practiceBubble;
  const button = document.querySelector("#teacher-bubble");
  if (!bridge || !button) return;

  const controller = createBubbleController({ bridge, view: createBubbleDomView() });
  const onClick = (event) => controller.handleClick(event);
  const onDoubleClick = (event) => controller.handleDoubleClick(event);
  const onKeyDown = (event) => controller.handleKeyDown(event);
  const onContextMenu = (event) => controller.handleContextMenu(event);
  button.addEventListener("click", onClick);
  button.addEventListener("dblclick", onDoubleClick);
  button.addEventListener("keydown", onKeyDown);
  button.addEventListener("contextmenu", onContextMenu);

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    button.removeEventListener("click", onClick);
    button.removeEventListener("dblclick", onDoubleClick);
    button.removeEventListener("keydown", onKeyDown);
    button.removeEventListener("contextmenu", onContextMenu);
    controller.dispose();
  };
  window.addEventListener("unload", dispose, { once: true });
  void controller.initialize();
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  startBubbleRenderer();
}
