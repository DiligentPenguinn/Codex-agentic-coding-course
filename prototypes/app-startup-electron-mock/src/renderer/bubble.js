export const STATUS = Object.freeze({
  ready: Object.freeze(["○", "Executor ready"]),
  working: Object.freeze(["◌", "Executor working"]),
  "waiting-for-learner": Object.freeze(["!", "Executor waiting for you"]),
  "response-ready": Object.freeze(["✓", "Executor response ready"]),
  stale: Object.freeze(["~", "Executor context stale"]),
  disconnected: Object.freeze(["×", "Executor disconnected"]),
  "not-bound": Object.freeze(["–", "No Executor task bound"]),
});

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

function invokeAndThen(operation, onSuccess, isDisposed) {
  try {
    Promise.resolve(operation())
      .then((response) => {
        if (!isDisposed() && response?.ok) onSuccess();
      })
      .catch(() => {});
  } catch {
    // A failed compact action must not claim that the destination opened.
  }
}

export function createBubbleController({
  bridge,
  view,
  schedule = globalThis.setTimeout,
  cancel = globalThis.clearTimeout,
  clickDelay = 240,
}) {
  let disposed = false;
  let initialized = false;
  let stateRevision = 0;
  let removeStateListener = null;
  let pendingOpenTimer = null;
  let newestTeacherMessageId = null;
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
    pendingOpenTimer = null;
    invokeAndThen(
      () => bridge.openQuickChat(),
      markCurrentSeen,
      () => disposed,
    );
  }

  function expand() {
    cancelPendingOpen();
    invokeAndThen(() => bridge.expand(), markCurrentSeen, () => disposed);
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

  function handleClick() {
    if (disposed) return;
    cancelPendingOpen();
    pendingOpenTimer = schedule(openQuickChat, clickDelay);
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

function createBubbleDomView() {
  const shell = document.querySelector(".bubble-shell");
  const symbol = document.querySelector("#executor-symbol");
  const badge = document.querySelector("#unread-badge");
  const status = document.querySelector("#bubble-status");

  return Object.freeze({
    renderStatus(next) {
      shell.dataset.state = next.key;
      symbol.textContent = next.symbol;
      status.textContent = next.label;
    },
    renderUnread(count) {
      const bounded = Math.max(0, Number.isFinite(count) ? count : 0);
      badge.hidden = bounded === 0;
      badge.textContent = bounded > 99 ? "99+" : String(bounded);
      badge.setAttribute(
        "aria-label",
        bounded === 0
          ? "No new Teacher message updates"
          : `${bounded > 99 ? "More than 99" : bounded} new Teacher message ${bounded === 1 ? "update" : "updates"} observed`,
      );
    },
  });
}

function startBubbleRenderer() {
  const bridge = window.practiceBubble;
  const button = document.querySelector("#teacher-bubble");
  if (!bridge || !button) return;

  const controller = createBubbleController({ bridge, view: createBubbleDomView() });
  const onClick = () => controller.handleClick();
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
