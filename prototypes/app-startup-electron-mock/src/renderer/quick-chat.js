import { resizeTeacherComposer, shouldSubmitTeacherComposer } from "./teacher-composer.mjs";

const MAX_MESSAGES = 24;
const MAX_MESSAGE_LENGTH = 4_000;

const STATUS = Object.freeze({
  ready: Object.freeze(["○", "Executor ready"]),
  working: Object.freeze(["◌", "Executor working"]),
  "waiting-for-learner": Object.freeze(["!", "Executor waiting for you"]),
  "response-ready": Object.freeze(["✓", "Executor response ready"]),
  stale: Object.freeze(["~", "Executor context stale"]),
  disconnected: Object.freeze(["×", "Executor disconnected"]),
  "not-bound": Object.freeze(["–", "No Executor task bound"]),
});

const timeFormatter = new Intl.DateTimeFormat(undefined, {
  hour: "numeric",
  minute: "2-digit",
});

function boundedText(value, limit) {
  return typeof value === "string" ? [...value].slice(0, limit).join("") : "";
}

export function normalizeQuickMessages(value) {
  if (!Array.isArray(value)) return [];
  const safe = [];
  const keys = new Set();
  for (const message of value) {
    if (!message || typeof message !== "object") continue;
    if (!['teacher', 'learner'].includes(message.role)) continue;
    if (typeof message.id !== "string" || message.id.length === 0 || message.id.length > 200) continue;
    if (keys.has(message.id) || typeof message.text !== "string") continue;
    keys.add(message.id);
    safe.push(Object.freeze({
      id: message.id,
      role: message.role,
      text: boundedText(message.text, MAX_MESSAGE_LENGTH),
      createdAt: typeof message.createdAt === "string" && message.createdAt.length <= 100
        ? message.createdAt
        : null,
    }));
  }
  return safe.slice(-MAX_MESSAGES);
}

function effectiveStatus(executor) {
  if (executor?.freshness === "disconnected") return "disconnected";
  if (executor?.freshness === "stale") return "stale";
  return Object.hasOwn(STATUS, executor?.status) ? executor.status : "not-bound";
}

function normalizeSnapshot(value) {
  const executor = value?.executor && typeof value.executor === "object"
    ? value.executor
    : {};
  const key = effectiveStatus(executor);
  const [symbol, label] = STATUS[key];
  return Object.freeze({
    executor: Object.freeze({
      key,
      symbol,
      label,
      freshness: typeof executor.freshness === "string"
        ? executor.freshness
        : "disconnected",
      observedAt: typeof executor.observedAt === "string" ? executor.observedAt : null,
    }),
    messages: normalizeQuickMessages(value?.teacherChat),
    error: typeof value?.error === "string" ? boundedText(value.error, 500) : null,
  });
}

function invokeSafely(operation) {
  try {
    Promise.resolve(operation()).catch(() => {});
  } catch {
    // Closing and expanding are best-effort fixed bridge actions.
  }
}

export function createQuickChatController({ bridge, view }) {
  let disposed = false;
  let initialized = false;
  let stateRevision = 0;
  let removeStateListener = null;
  let draft = "";
  let sending = false;
  let requestGeneration = 0;
  let activeRequest = null;

  function renderComposer() {
    if (disposed) return;
    view.renderComposer({ draft, sending });
  }

  function applyState(value) {
    if (disposed) return;
    view.renderSnapshot(normalizeSnapshot(value));
  }

  function receiveState(value) {
    stateRevision += 1;
    applyState(value);
  }

  function ownsRequest(request) {
    return !disposed && activeRequest === request;
  }

  function supersedeRequest() {
    requestGeneration += 1;
    activeRequest = null;
    if (sending) {
      sending = false;
      renderComposer();
    }
  }

  async function initialize() {
    if (disposed || initialized) return;
    initialized = true;
    renderComposer();
    removeStateListener = bridge.onStateChanged(receiveState);
    const revisionAtRequest = stateRevision;
    try {
      const response = await bridge.getState();
      if (!disposed && stateRevision === revisionAtRequest && response?.ok) {
        applyState(response.value);
      } else if (!disposed && stateRevision === revisionAtRequest) {
        applyState({
          executor: { status: "disconnected", freshness: "disconnected" },
          teacherChat: [],
          error: null,
        });
        view.renderLocalError("Teacher chat is unavailable. Try expanding Practice.");
      }
    } catch {
      if (!disposed && stateRevision === revisionAtRequest) {
        applyState({
          executor: { status: "disconnected", freshness: "disconnected" },
          teacherChat: [],
          error: null,
        });
        view.renderLocalError("Teacher chat is unavailable. Try expanding Practice.");
      }
    }
  }

  function changeDraft(value) {
    if (disposed || sending) return;
    draft = boundedText(value, MAX_MESSAGE_LENGTH);
    view.renderLocalError(null);
    renderComposer();
  }

  async function send() {
    const text = draft.trim();
    if (disposed || sending || text.length === 0) return;
    const request = Object.freeze({ generation: ++requestGeneration });
    activeRequest = request;
    sending = true;
    view.renderLocalError(null);
    renderComposer();

    let response;
    try {
      response = await bridge.sendTeacherMessage(text);
    } catch {
      response = null;
    }
    if (!ownsRequest(request)) return;

    activeRequest = null;
    sending = false;
    if (response?.ok) {
      draft = "";
      view.renderLocalError(null);
    } else {
      view.renderLocalError("Your message was not sent. Check the connection and try again.");
    }
    renderComposer();
    view.focusComposer();
  }

  function close() {
    if (disposed) return;
    supersedeRequest();
    invokeSafely(() => bridge.closeQuickChat());
  }

  function expand() {
    if (disposed) return;
    supersedeRequest();
    invokeSafely(() => bridge.expand());
  }

  function handleKeyDown(event) {
    if (disposed || event?.key !== "Escape") return;
    event.preventDefault?.();
    close();
  }

  function dispose() {
    if (disposed) return;
    disposed = true;
    requestGeneration += 1;
    activeRequest = null;
    sending = false;
    removeStateListener?.();
    removeStateListener = null;
  }

  return Object.freeze({
    changeDraft,
    dispose,
    expand,
    handleKeyDown,
    initialize,
    send,
  });
}

function formatTime(value, fallback = "Time unavailable") {
  if (typeof value !== "string") return fallback;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? fallback : timeFormatter.format(date);
}

function createQuickChatDomView() {
  const status = document.querySelector("#quick-status");
  const freshness = document.querySelector("#quick-freshness");
  const error = document.querySelector("#quick-error");
  const log = document.querySelector("#quick-messages");
  const empty = document.querySelector("#quick-empty");
  const composer = document.querySelector("#quick-message");
  const sendButton = document.querySelector('#quick-form button[type="submit"]');
  let stateError = null;
  let localError = null;

  function renderError() {
    const message = localError || stateError;
    error.hidden = !message;
    if (error.textContent !== (message || "")) error.textContent = message || "";
  }

  function renderMessages(messages) {
    const nearBottom = log.scrollHeight - log.scrollTop - log.clientHeight < 48;
    const desiredKeys = new Set(messages.map(({ id }) => id));
    for (const child of [...log.children]) {
      if (!desiredKeys.has(child.dataset.messageKey)) child.remove();
    }

    let added = false;
    for (const [index, message] of messages.entries()) {
      let article = [...log.children].find(
        (child) => child.dataset.messageKey === message.id,
      );
      if (!article) {
        article = document.createElement("article");
        article.dataset.messageKey = message.id;
        const meta = document.createElement("p");
        meta.className = "message-meta";
        const text = document.createElement("p");
        text.className = "message-text";
        article.append(meta, text);
        log.insertBefore(article, log.children[index] ?? null);
        added = true;
      } else if (log.children[index] !== article) {
        log.insertBefore(article, log.children[index] ?? null);
      }
      article.className = `quick-message is-${message.role}`;
      const role = message.role === "teacher" ? "Teacher" : "You";
      const metaText = `${role} · ${formatTime(message.createdAt)}`;
      const meta = article.querySelector(".message-meta");
      const text = article.querySelector(".message-text");
      if (meta.textContent !== metaText) meta.textContent = metaText;
      if (text.textContent !== message.text) text.textContent = message.text;
    }
    empty.hidden = messages.length > 0;
    if (added && nearBottom) log.scrollTop = log.scrollHeight;
  }

  return Object.freeze({
    focusComposer() {
      if (!composer.disabled) composer.focus();
    },
    renderComposer(next) {
      if (composer.value !== next.draft) composer.value = next.draft;
      resizeTeacherComposer(composer);
      composer.disabled = next.sending;
      sendButton.disabled = next.sending || next.draft.trim().length === 0;
      sendButton.textContent = next.sending ? "Sending…" : "Send";
    },
    renderLocalError(message) {
      localError = message;
      renderError();
    },
    renderSnapshot(snapshot) {
      status.dataset.state = snapshot.executor.key;
      status.textContent = `${snapshot.executor.symbol} ${snapshot.executor.label}`;
      const freshnessLabel = snapshot.executor.freshness === "fresh"
        ? "Context fresh"
        : snapshot.executor.freshness === "stale"
          ? "Context stale"
          : "Context disconnected";
      freshness.textContent = snapshot.executor.observedAt
        ? `${freshnessLabel} · Observed ${formatTime(snapshot.executor.observedAt)}`
        : `${freshnessLabel} · Observation time unavailable`;
      stateError = snapshot.error;
      renderError();
      renderMessages(snapshot.messages);
    },
  });
}

function startQuickChatRenderer() {
  const bridge = window.practiceQuickChat;
  const form = document.querySelector("#quick-form");
  const composer = document.querySelector("#quick-message");
  const expandButton = document.querySelector('[data-action="expand"]');
  if (!bridge || !form || !composer || !expandButton) return;

  const controller = createQuickChatController({
    bridge,
    view: createQuickChatDomView(),
  });
  const onInput = () => {
    resizeTeacherComposer(composer);
    controller.changeDraft(composer.value);
  };
const onComposerKeyDown = (event) => {
    if (!shouldSubmitTeacherComposer(event) || composer.disabled || composer.value.trim() === "") return;
    event.preventDefault();
    void controller.send();
  };
  const onSubmit = (event) => {
    event.preventDefault();
    void controller.send();
  };
  const onExpand = () => controller.expand();
  const onKeyDown = (event) => controller.handleKeyDown(event);
  composer.addEventListener("input", onInput);
  composer.addEventListener("keydown", onComposerKeyDown);
  form.addEventListener("submit", onSubmit);
  expandButton.addEventListener("click", onExpand);
  document.addEventListener("keydown", onKeyDown);

  let disposed = false;
  const dispose = () => {
    if (disposed) return;
    disposed = true;
    composer.removeEventListener("input", onInput);
    composer.removeEventListener("keydown", onComposerKeyDown);
    form.removeEventListener("submit", onSubmit);
    expandButton.removeEventListener("click", onExpand);
    document.removeEventListener("keydown", onKeyDown);
    controller.dispose();
  };
  window.addEventListener("unload", dispose, { once: true });
  void controller.initialize();
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  startQuickChatRenderer();
}
