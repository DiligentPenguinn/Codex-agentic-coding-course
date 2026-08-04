import {
  createInitialOnboardingState,
  reduceOnboarding,
} from "./onboarding-state.mjs";
import {
  createInitialPracticeRendererState,
  createPracticeRendererController,
} from "./practice-state.mjs";

const courseSetup = window.courseSetup;
const practice = window.practice;
let state = createInitialOnboardingState();
let practiceState = createInitialPracticeRendererState();
let removeAuthListener = () => {};
let removePracticeListener = () => {};

const exactTime = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "long",
});

const EXECUTOR_STATUS = Object.freeze({
  "not-bound": ["–", "No task bound"],
  ready: ["○", "Ready"],
  working: ["◌", "Working"],
  "waiting-for-learner": ["!", "Waiting for you"],
  "response-ready": ["✓", "Response ready"],
  stale: ["~", "Context stale"],
  disconnected: ["×", "Disconnected"],
});

function unwrap(result) {
  if (result?.ok) return result.value;
  const error = new Error(result?.error?.message ?? "The setup action failed.");
  error.recoveryAction = result?.error?.recoveryAction;
  throw error;
}

function safeText(value, fallback = "Not available", limit = 4_000) {
  if (typeof value !== "string") return fallback;
  const text = value.trim().slice(0, limit);
  return text || fallback;
}

function setTextIfChanged(element, value) {
  if (element.textContent !== value) element.textContent = value;
}

function safeTextArray(value) {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => typeof item === "string")
    .map((item) => item.trim().slice(0, 1_000))
    .filter(Boolean)
    .slice(0, 30);
}

function formatTime(value, fallback = "Observation time unavailable") {
  if (typeof value !== "string") return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return exactTime.format(date);
}

function currentScreen() {
  return practiceState.screen === "practice" ? "practice" : state.screen;
}

function dispatch(event) {
  const previousScreen = currentScreen();
  state = reduceOnboarding(state, event);
  render();
  if (currentScreen() !== previousScreen) {
    queueMicrotask(() => {
      const heading = document.querySelector(
        `[data-screen="${CSS.escape(currentScreen())}"] h2`,
      );
      heading?.setAttribute("tabindex", "-1");
      heading?.focus();
    });
  }
}

function setScreenVisibility() {
  const screen = currentScreen();
  for (const section of document.querySelectorAll("[data-screen]")) {
    section.hidden = section.dataset.screen !== screen;
  }
  for (const step of document.querySelectorAll("[data-step]")) {
    step.toggleAttribute("aria-current", step.dataset.step === screen);
  }
  document.querySelector("#setup-progress").hidden = [
    "landing",
    "destination",
    "practice",
  ].includes(screen);
  document.body.classList.toggle("is-practice", screen === "practice");
}

function renderLanding() {
  const button = document.querySelector("#landing-primary");
  const status = document.querySelector("#landing-status");
  const recovery = document.querySelector("#recovery-notice");
  recovery.hidden = !state.recovery;
  recovery.textContent = state.recovery?.message ?? "";
  button.disabled = !state.statusReady;
  if (!state.statusReady) {
    button.textContent = "Checking setup…";
    status.textContent = "Checking your saved setup…";
    return;
  }

  if (state.setupCompleted) {
    button.textContent = "Open course";
    status.textContent = "Your setup is complete.";
  } else if (state.connection === "connected") {
    button.textContent = "Continue setup";
    status.textContent = "Your Codex account is connected.";
  } else {
    button.textContent = "Start setup";
    status.textContent = "You’re ready to begin.";
  }
}

function renderConnection() {
  const labels = {
    checking: "Checking Codex connection…",
    disconnected: "Codex connection is unavailable",
    signedOut: "Ready to connect",
    openingBrowser: "Opening the official sign-in page…",
    openingDevice: "Preparing a one-time device code…",
    waitingForCallback: "Waiting for browser sign-in to finish",
    deviceCode: "Use the one-time device code",
    cancelled: "Login cancelled",
    failed: "Connection failed",
    connected: "Codex connected",
  };
  document.querySelector("#connection-status span:last-child").textContent =
    labels[state.connection] ?? "Connection status unavailable";
  const mark = document.querySelector("#connection-status .status-mark");
  mark.className = `status-mark is-${state.connection}`;
  document.querySelector("#connection-error").textContent = state.error ?? "";
  const connectButton = document.querySelector("#connect-button");
  const deviceButton = document.querySelector("#device-button");
  const cancelButton = document.querySelector("#cancel-button");
  const retryButton = document.querySelector("#retry-button");
  const continueButton = document.querySelector("#connected-continue");
  const canBeginLogin = ["signedOut", "cancelled", "failed"].includes(
    state.connection,
  );
  const loginActive = ["waitingForCallback", "deviceCode"].includes(
    state.connection,
  );
  connectButton.hidden = !canBeginLogin;
  deviceButton.hidden = !canBeginLogin;
  cancelButton.hidden = !loginActive;
  retryButton.hidden = state.connection !== "disconnected";
  continueButton.hidden = state.connection !== "connected";
  const accountSummary = document.querySelector("#account-summary");
  accountSummary.hidden = state.connection !== "connected";
  if (state.connection === "connected") {
    const identity = state.account?.email
      ?? (state.account?.accountType === "chatgpt"
        ? "your ChatGPT account"
        : "your Codex account");
    accountSummary.textContent = `Connected as ${identity}.`;
  }
  const deviceCard = document.querySelector("#device-card");
  deviceCard.hidden = !state.device;
  if (state.device) {
    document.querySelector("#device-code").textContent = state.device.userCode;
    document.querySelector("#device-link").href = state.device.verificationUrl;
  }
}

function makeChoice(field, option, multiple) {
  const wrapper = document.createElement("label");
  wrapper.className = "choice";
  const input = document.createElement("input");
  input.type = multiple ? "checkbox" : "radio";
  input.name = field.id;
  input.value = option.value;
  const current = state.responses[field.id];
  input.checked = multiple
    ? Array.isArray(current) && current.includes(option.value)
    : current === option.value;
  const text = document.createElement("span");
  text.textContent = option.label;
  wrapper.append(input, text);
  return wrapper;
}

function renderFixture() {
  if (!state.content) return;
  document.querySelector("#fixture-title").textContent = state.content.title;
  document.querySelector("#fixture-notice").textContent = state.content.notice;
  const form = document.querySelector("#fixture-form");
  form.replaceChildren();

  for (const field of state.content.fields) {
    const group = document.createElement("fieldset");
    group.dataset.fieldId = field.id;
    const legend = document.createElement("legend");
    legend.textContent = `${field.label}${field.required ? " *" : ""}`;
    group.append(legend);

    if (field.type === "shortText") {
      const input = document.createElement("input");
      input.type = "text";
      input.id = field.id;
      input.name = field.id;
      input.value = state.responses[field.id] ?? "";
      input.required = field.required;
      input.setAttribute("aria-label", field.label);
      group.append(input);
    } else {
      const choices = document.createElement("div");
      choices.className = "choices";
      for (const option of field.options) {
        choices.append(makeChoice(field, option, field.type === "multipleChoice"));
      }
      group.append(choices);
    }

    if (state.validationErrors[field.id]) {
      const error = document.createElement("p");
      error.id = `${field.id}-error`;
      error.className = "field-error";
      error.textContent = state.validationErrors[field.id];
      group.append(error);
      for (const input of group.querySelectorAll("input")) {
        input.setAttribute("aria-invalid", "true");
        input.setAttribute("aria-describedby", error.id);
      }
    }
    form.append(group);
  }
  document.querySelector("#form-error").textContent = state.error ?? "";
  const continueButton = document.querySelector("#form-continue");
  continueButton.disabled = state.submitting;
  continueButton.textContent = state.submitting ? "Saving…" : "Continue";
}

function replaceList(selector, values, emptyText) {
  const list = document.querySelector(selector);
  list.replaceChildren();
  const items = safeTextArray(values);
  if (items.length === 0) {
    const item = document.createElement("li");
    item.className = "empty-list-item";
    item.textContent = emptyText;
    list.append(item);
    return;
  }
  for (const value of items) {
    const item = document.createElement("li");
    item.textContent = value;
    list.append(item);
  }
}

function renderExecutorStatus(executor) {
  const statusKey = typeof executor?.status === "string"
    && EXECUTOR_STATUS[executor.status]
    ? executor.status
    : "disconnected";
  const [symbol, label] = EXECUTOR_STATUS[statusKey];
  const root = document.querySelector("#executor-status");
  root.dataset.status = statusKey;
  setTextIfChanged(root.querySelector(".executor-symbol"), symbol);
  setTextIfChanged(root.querySelector("small"), "Executor");
  setTextIfChanged(root.querySelector("strong"), label);
}

function renderExercise(session) {
  const mission = session?.mission ?? {};
  const executor = session?.executor ?? {};
  setTextIfChanged(document.querySelector("#exercise-description"), safeText(
    mission.description,
    "The mission description is unavailable.",
  ));
  replaceList("#exercise-outcomes", mission.learningOutcomes, "No lesson outcome is available.");
  replaceList("#exercise-instructions", mission.instructions, "No instructions are available.");
  replaceList("#allowed-actions", mission.allowedActions, "No allowed actions are listed.");
  replaceList("#prohibited-actions", mission.prohibitedActions, "No prohibited actions are listed.");
  replaceList("#expected-evidence", mission.expectedEvidence, "No expected evidence is listed.");

  document.querySelector("#bound-task-name").textContent = executor.bound
    ? safeText(executor.taskName, "Verified Practice task")
    : practiceState.busyAction === "binding"
      ? "Preparing a clean, dedicated task…"
      : "No task is currently bound";
  const notice = document.querySelector("#handoff-notice");
  notice.hidden = !practiceState.fallbackNotice;
  notice.textContent = practiceState.fallbackNotice ?? "";

  const openButton = document.querySelector('[data-practice-action="open-task"]');
  const createButton = document.querySelector('[data-practice-action="create-task"]');
  const pickerButton = document.querySelector('[data-practice-action="open-picker"]');
  openButton.disabled = !executor.bound || practiceState.busyAction === "opening";
  createButton.hidden = Boolean(executor.bound);
  pickerButton.hidden = Boolean(executor.bound);
  createButton.disabled = practiceState.busyAction === "binding";
  pickerButton.disabled = ["binding", "listing"].includes(practiceState.busyAction);
}

function renderContextReceipt(session) {
  const receipt = session?.contextReceipt ?? {};
  const executor = session?.executor ?? {};
  setTextIfChanged(document.querySelector("#receipt-mission"), safeText(
    receipt.missionTitle,
    safeText(session?.mission?.title, "Mission unavailable"),
  ));
  setTextIfChanged(document.querySelector("#receipt-task"), safeText(
    receipt.taskName,
    executor.bound ? safeText(executor.taskName, "Verified Practice task") : "No task bound",
  ));
  setTextIfChanged(document.querySelector("#receipt-scope"), safeText(
    receipt.scopeLabel,
    "Bound task only",
  ));

  const rawFreshness = typeof receipt.freshness === "string"
    ? receipt.freshness
    : executor.freshness;
  const freshness = rawFreshness === "fresh"
    ? "Fresh"
    : rawFreshness === "stale"
      ? "Stale"
      : "Disconnected";
  const observedAt = receipt.observedAt ?? executor.observedAt;
  setTextIfChanged(
    document.querySelector("#freshness-disclosure"),
    `${freshness} · Observed ${formatTime(observedAt)}`,
  );
}

function renderTeacherMessages(messages) {
  const log = document.querySelector("#teacher-messages");
  const safeMessages = Array.isArray(messages) ? messages.slice(-40) : [];
  const desired = [];
  for (const [index, message] of safeMessages.entries()) {
    if (!message || typeof message !== "object") continue;
    const role = message.role === "teacher" ? "teacher" : message.role === "learner" ? "learner" : null;
    if (!role || typeof message.text !== "string") continue;
    const key = typeof message.id === "string" && message.id.length <= 200
      ? message.id
      : `message-${index}`;
    desired.push({ key, message, role });
  }

  const desiredKeys = new Set(desired.map(({ key }) => key));
  for (const child of [...log.children]) {
    if (!desiredKeys.has(child.dataset.messageKey)) child.remove();
  }

  for (const [index, { key, message, role }] of desired.entries()) {
    let article = [...log.children].find(
      (child) => child.dataset.messageKey === key,
    );
    if (!article) {
      article = document.createElement("article");
      article.dataset.messageKey = key;
      const meta = document.createElement("p");
      meta.className = "message-meta";
      const text = document.createElement("p");
      text.className = "message-text";
      article.append(meta, text);
      log.insertBefore(article, log.children[index] ?? null);
    } else if (log.children[index] !== article) {
      log.insertBefore(article, log.children[index] ?? null);
    }
    article.className = `chat-message is-${role}`;
    const roleLabel = role === "teacher" ? "Teacher" : "You";
    setTextIfChanged(
      article.querySelector(".message-meta"),
      `${roleLabel} · ${formatTime(message.createdAt, "Time unavailable")}`,
    );
    setTextIfChanged(
      article.querySelector(".message-text"),
      message.text.slice(0, 12_000),
    );
  }
  document.querySelector("#teacher-empty").hidden = log.childElementCount > 0;
}

function renderTeacherComposer() {
  const composer = document.querySelector("#teacher-message");
  if (composer.value !== practiceState.teacherDraft) {
    composer.value = practiceState.teacherDraft;
  }
  const sending = practiceState.busyAction === "teacher";
  composer.disabled = sending;
  document.querySelector("#teacher-send").disabled = sending;
  document.querySelector("#teacher-send").textContent = sending ? "Sending…" : "Send";
}

function renderTeacher(session) {
  setTextIfChanged(
    document.querySelector("#teacher-mission"),
    session?.mission
      ? `Current mission: ${safeText(session.mission.title, "Practice mission")}. Ask about activity in the verified task.`
      : "The Teacher can discuss this mission using bound-task context only.",
  );
  renderContextReceipt(session);
  renderTeacherMessages(session?.teacherChat);
  renderTeacherComposer();
}

function renderTabs(viewModel) {
  const selected = viewModel?.presentation?.lastFullTab === "teacher"
    ? "teacher"
    : "exercise";
  for (const tab of document.querySelectorAll("[data-practice-tab]")) {
    const active = tab.dataset.practiceTab === selected;
    tab.setAttribute("aria-selected", String(active));
    tab.tabIndex = active ? 0 : -1;
  }
  document.querySelector("#exercise-panel").hidden = selected !== "exercise";
  document.querySelector("#teacher-panel").hidden = selected !== "teacher";
}

function renderRecovery(session) {
  const executor = session?.executor ?? {};
  const disconnected = Boolean(executor.bound) && (
    ["stale", "disconnected"].includes(executor.status)
    || ["stale", "disconnected"].includes(executor.freshness)
  );
  const fixedError = practiceState.pickerOpen ? "" : practiceState.error?.message ?? "";
  const sessionError = typeof session?.error === "string"
    ? safeText(session.error, "Practice encountered a recoverable issue.", 500)
    : "";
  setTextIfChanged(document.querySelector("#practice-error"), fixedError || (practiceState.pickerOpen ? "" : sessionError));
  const actions = document.querySelector("#recovery-actions");
  actions.hidden = !disconnected && !fixedError && !sessionError;
  const retry = document.querySelector('[data-practice-action="retry"]');
  const rebind = document.querySelector('[data-practice-action="rebind"]');
  retry.hidden = !executor.bound || (!disconnected && practiceState.error?.recoveryAction !== "retry-observation");
  rebind.hidden = !executor.bound;
  retry.disabled = practiceState.busyAction === "retrying";
  rebind.disabled = practiceState.busyAction === "rebinding";
}

function renderTaskPicker() {
  const dialog = document.querySelector("#task-picker");
  const list = document.querySelector("#eligible-task-list");
  const pickerError = practiceState.pickerOpen ? practiceState.error?.message ?? "" : "";
  const errorPanel = document.querySelector("#picker-error-panel");
  errorPanel.hidden = !pickerError;
  setTextIfChanged(document.querySelector("#picker-error"), pickerError);
  document.querySelector('[data-practice-action="retry-picker"]').disabled =
    practiceState.busyAction === "listing";

  const status = practiceState.busyAction === "listing"
    ? "Checking recent tasks in this workspace…"
    : practiceState.busyAction === "binding"
      ? "Binding the selected task. Other choices are temporarily unavailable."
      : pickerError
        ? ""
        : practiceState.pickerOpen && practiceState.eligibleTasks.length === 0
          ? "No eligible tasks are available. Create a dedicated task instead."
          : "";
  setTextIfChanged(document.querySelector("#picker-status"), status);

  const taskIds = new Set(practiceState.eligibleTasks.map((task) => task.threadId));
  for (const choice of [...list.querySelectorAll("[data-practice-task-choice]")]) {
    if (!taskIds.has(choice.value)) choice.remove();
  }
  for (const [index, task] of practiceState.eligibleTasks.entries()) {
    let choice = [...list.querySelectorAll("[data-practice-task-choice]")]
      .find((candidate) => candidate.value === task.threadId);
    if (!choice) {
      choice = document.createElement("button");
      choice.type = "button";
      choice.className = "eligible-task";
      choice.dataset.practiceTaskChoice = "";
      choice.value = task.threadId;
      const name = document.createElement("strong");
      const detail = document.createElement("span");
      choice.append(name, detail);
      list.insertBefore(choice, list.children[index] ?? null);
    }
    setTextIfChanged(choice.querySelector("strong"), task.displayName);
    setTextIfChanged(
      choice.querySelector("span"),
      `${safeText(task.status, "Unknown status")} · Updated ${formatTime(task.updatedAt, "time unavailable")}`,
    );
    choice.disabled = practiceState.busyAction === "binding";
  }

  document.querySelector("#close-picker").disabled = practiceState.busyAction === "binding";
  if (practiceState.pickerOpen && !dialog.open) {
    dialog.showModal();
    queueMicrotask(() => document.querySelector("#task-picker-title")?.focus());
  }
  if (!practiceState.pickerOpen && dialog.open) dialog.close();
}

function renderPractice() {
  const viewModel = practiceState.viewModel;
  document.querySelector("#course-practice-error").textContent =
    practiceState.screen === "course" ? practiceState.error?.message ?? "" : "";

  const session = viewModel?.session;
  if (!session) {
    renderTaskPicker();
    const startButton = document.querySelector('[data-practice-action="start"]');
    startButton.disabled = practiceState.busyAction === "entering";
    startButton.textContent = practiceState.busyAction === "entering"
      ? "Opening Practice…"
      : "Start Practice";
    return;
  }

  const mission = session.mission ?? {};
  const contentKind = safeText(mission.contentKind, "fixture", 80);
  document.querySelector("#practice-kicker").textContent =
    `${contentKind === "mock-adaptation" ? "Practice fixture" : "Practice mission"} · Focused workshop`;
  document.querySelector("#practice-title").textContent = safeText(
    mission.title,
    "Practice mission",
  );
  document.querySelector("#practice-description").textContent = safeText(
    mission.description,
    "Mission details are unavailable.",
  );
  renderExecutorStatus(session.executor);
  renderTabs(viewModel);
  renderExercise(session);
  renderTeacher(session);
  renderRecovery(session);
  renderTaskPicker();
}

function render() {
  setScreenVisibility();
  renderLanding();
  renderConnection();
  renderFixture();
  document.querySelector("#complete-connection").textContent =
    state.connection === "connected" ? "Connected" : "Needs recheck";
  renderPractice();
}

const practiceView = Object.freeze({
  render(next) {
    practiceState = next;
    render();
  },
  updateComposer(next) {
    practiceState = next;
    renderTeacherComposer();
  },
  focusPracticeHeading() {
    queueMicrotask(() => document.querySelector("#practice-title")?.focus());
  },
  focusComposer() {
    queueMicrotask(() => document.querySelector("#teacher-message")?.focus());
  },
  focusPickerAlert() {
    queueMicrotask(() => document.querySelector("#picker-error")?.focus());
  },
  focusPickerChoice(taskId) {
    queueMicrotask(() => {
      const choice = [...document.querySelectorAll("[data-practice-task-choice]")]
        .find((candidate) => candidate.value === taskId);
      choice?.focus();
    });
  },
  focusPickerTrigger() {
    queueMicrotask(() => document.querySelector('[data-practice-action="open-picker"]')?.focus());
  },
  focusBoundTask() {
    queueMicrotask(() => document.querySelector('[data-practice-action="open-task"]')?.focus());
  },
});

const practiceController = createPracticeRendererController({
  bridge: practice,
  view: practiceView,
  confirmRebind: (message) => window.confirm(message),
});

async function loadContent() {
  if (state.content) return;
  const content = unwrap(await courseSetup.getContent());
  dispatch({ type: "CONTENT_LOADED", content });
}

async function refreshStatus() {
  try {
    const status = unwrap(await courseSetup.getStatus());
    dispatch({
      type: "STATUS_LOADED",
      connected: status.account?.connected ?? false,
      connectionUnavailable: status.connectionUnavailable ?? false,
      setupCompleted: status.setupCompleted,
      account: status.account,
      responses: status.onboardingResponses,
      recovery: status.recovery,
    });
    if (status.account?.connected || status.setupCompleted) await loadContent();
  } catch {
    dispatch({ type: "CONNECTION_UNAVAILABLE" });
  }
}

async function startBrowserLogin() {
  dispatch({ type: "BROWSER_LOGIN_OPENING" });
  try {
    const result = unwrap(await courseSetup.startBrowserLogin());
    dispatch({ type: "BROWSER_LOGIN_STARTED", loginId: result.loginId });
  } catch (error) {
    dispatch({ type: "LOGIN_FAILED", message: error.message });
  }
}

async function startDeviceLogin() {
  dispatch({ type: "DEVICE_LOGIN_OPENING" });
  try {
    const result = unwrap(await courseSetup.startDeviceLogin());
    dispatch({ type: "DEVICE_LOGIN_STARTED", ...result });
  } catch (error) {
    dispatch({ type: "LOGIN_FAILED", message: error.message });
  }
}

document.querySelector("#fixture-form").addEventListener("input", (event) => {
  const field = state.content?.fields.find(({ id }) => id === event.target.name);
  if (!field) return;
  let value = event.target.value;
  if (field.type === "multipleChoice") {
    value = [...document.querySelectorAll(
      `input[name="${CSS.escape(field.id)}"]:checked`,
    )].map((input) => input.value);
  }
  state = reduceOnboarding(state, {
    type: "RESPONSE_CHANGED",
    fieldId: field.id,
    value,
  });
  const group = event.target.closest("fieldset");
  group?.querySelector(".field-error")?.remove();
  for (const input of group?.querySelectorAll("input") ?? []) {
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
  }
});

document.querySelector("#teacher-message").addEventListener("input", (event) => {
  practiceController.changeTeacherDraft(event.target.value);
});

document.querySelector("#teacher-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  await practiceController.sendTeacherMessage();
});

document.querySelector(".practice-tabs").addEventListener("keydown", async (event) => {
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  const tabs = [...document.querySelectorAll("[data-practice-tab]")];
  const current = Math.max(0, tabs.indexOf(event.target));
  const next = event.key === "Home"
    ? 0
    : event.key === "End"
      ? tabs.length - 1
      : (current + (event.key === "ArrowRight" ? 1 : -1) + tabs.length) % tabs.length;
  event.preventDefault();
  tabs[next].focus();
  await practiceController.selectTab(tabs[next].dataset.practiceTab);
});

document.querySelector("#task-picker").addEventListener("cancel", (event) => {
  event.preventDefault();
  practiceController.closePicker();
});

document.addEventListener("click", async (event) => {
  const taskChoice = event.target.closest("[data-practice-task-choice]");
  if (taskChoice) {
    await practiceController.bindSelectedTask(taskChoice.value);
    return;
  }

  const tab = event.target.closest("[data-practice-tab]")?.dataset.practiceTab;
  if (tab) {
    await practiceController.selectTab(tab);
    return;
  }

  const practiceAction = event.target.closest("[data-practice-action]")?.dataset.practiceAction;
  if (practiceAction === "start") await practiceController.startPractice();
  if (practiceAction === "create-task") await practiceController.createDedicatedTask();
  if (["open-picker", "retry-picker"].includes(practiceAction)) {
    await practiceController.openTaskPicker();
  }
  if (practiceAction === "close-picker") practiceController.closePicker();
  if (practiceAction === "open-task") await practiceController.openBoundTask();
  if (practiceAction === "retry") await practiceController.retryObservation();
  if (practiceAction === "rebind") await practiceController.rebindTask();
  if (practiceAction === "compact") await practiceController.compact();
  if (practiceAction) return;

  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "enter") dispatch({ type: "LANDING_CONTINUE" });
  if (action === "forward") dispatch({ type: "CONTINUE_SETUP" });
  if (action === "connect") await startBrowserLogin();
  if (action === "device") await startDeviceLogin();
  if (action === "cancel" && state.loginId) await courseSetup.cancelLogin(state.loginId);
  if (action === "retry") {
    dispatch({ type: "RETRY_STARTED" });
    try {
      unwrap(await courseSetup.retryAppServer());
      await refreshStatus();
    } catch {
      dispatch({ type: "CONNECTION_UNAVAILABLE" });
    }
  }
  if (action === "back") dispatch({ type: "BACK_TO_CONNECT" });
  if (action === "continue") {
    dispatch({ type: "SUBMIT_REQUESTED" });
    const invalidFieldId = Object.keys(state.validationErrors)[0];
    if (invalidFieldId) {
      document.querySelector(`[data-field-id="${CSS.escape(invalidFieldId)}"] input`)?.focus();
    } else {
      try {
        unwrap(await courseSetup.saveResponses(state.responses));
        dispatch({ type: "SETUP_SAVED" });
      } catch (error) {
        dispatch({ type: "SETUP_SAVE_FAILED", message: error.message });
      }
    }
  }
  if (action === "reopen") {
    try {
      unwrap(await courseSetup.reopenSetup());
      await loadContent();
      dispatch({ type: "REOPEN_SETUP" });
    } catch (error) {
      dispatch({ type: "SETUP_SAVE_FAILED", message: error.message });
    }
  }
  if (action === "mock-app") dispatch({ type: "OPEN_MOCK_APP" });
});

removeAuthListener = courseSetup.onAuthStatusChanged(async (status) => {
  if (status.status === "connected") {
    dispatch({ type: "LOGIN_SUCCEEDED", account: status.account });
    await loadContent();
  } else if (status.status === "cancelled") {
    dispatch({ type: "LOGIN_CANCELLED" });
  } else if (status.status === "failed") {
    dispatch({ type: "LOGIN_FAILED", message: status.message });
  }
});

removePracticeListener = practiceController.subscribe();

window.addEventListener("beforeunload", () => {
  removeAuthListener();
  removePracticeListener();
}, { once: true });

render();
await Promise.all([refreshStatus(), practiceController.initialize()]);
