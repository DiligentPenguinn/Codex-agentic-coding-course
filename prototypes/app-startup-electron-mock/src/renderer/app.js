import {
  createInitialOnboardingState,
  reduceOnboarding,
} from "./onboarding-state.mjs";
import {
  createInitialPracticeRendererState,
  reducePracticeRenderer,
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

function dispatchPractice(event, { focusHeading = false } = {}) {
  const previousScreen = currentScreen();
  practiceState = reducePracticeRenderer(practiceState, event);
  render();
  if (focusHeading && currentScreen() !== previousScreen) {
    queueMicrotask(() => {
      const heading = document.querySelector("#practice-title");
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

  const mark = document.createElement("span");
  mark.className = "executor-symbol";
  mark.setAttribute("aria-hidden", "true");
  mark.textContent = symbol;

  const copy = document.createElement("span");
  const caption = document.createElement("small");
  caption.textContent = "Executor";
  const strong = document.createElement("strong");
  strong.textContent = label;
  copy.append(caption, strong);
  root.replaceChildren(mark, copy);
}

function renderExercise(session) {
  const mission = session?.mission ?? {};
  const executor = session?.executor ?? {};
  document.querySelector("#exercise-description").textContent = safeText(
    mission.description,
    "The mission description is unavailable.",
  );
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
  document.querySelector("#receipt-mission").textContent = safeText(
    receipt.missionTitle,
    safeText(session?.mission?.title, "Mission unavailable"),
  );
  document.querySelector("#receipt-task").textContent = safeText(
    receipt.taskName,
    executor.bound ? safeText(executor.taskName, "Verified Practice task") : "No task bound",
  );
  document.querySelector("#receipt-scope").textContent = safeText(
    receipt.scopeLabel,
    "Bound task only",
  );

  const rawFreshness = typeof receipt.freshness === "string"
    ? receipt.freshness
    : executor.freshness;
  const freshness = rawFreshness === "fresh"
    ? "Fresh"
    : rawFreshness === "stale"
      ? "Stale"
      : "Disconnected";
  const observedAt = receipt.observedAt ?? executor.observedAt;
  document.querySelector("#freshness-disclosure").textContent =
    `${freshness} · Observed ${formatTime(observedAt)}`;
}

function renderTeacherMessages(messages) {
  const log = document.querySelector("#teacher-messages");
  log.replaceChildren();
  const safeMessages = Array.isArray(messages) ? messages.slice(-40) : [];
  for (const message of safeMessages) {
    if (!message || typeof message !== "object") continue;
    const role = message.role === "teacher" ? "teacher" : message.role === "learner" ? "learner" : null;
    if (!role || typeof message.text !== "string") continue;
    const article = document.createElement("article");
    article.className = `chat-message is-${role}`;
    const meta = document.createElement("p");
    meta.className = "message-meta";
    const roleLabel = role === "teacher" ? "Teacher" : "You";
    meta.textContent = `${roleLabel} · ${formatTime(message.createdAt, "Time unavailable")}`;
    const text = document.createElement("p");
    text.className = "message-text";
    text.textContent = message.text.slice(0, 12_000);
    article.append(meta, text);
    log.append(article);
  }
  document.querySelector("#teacher-empty").hidden = log.childElementCount > 0;
}

function renderTeacher(session) {
  document.querySelector("#teacher-mission").textContent = session?.mission
    ? `Current mission: ${safeText(session.mission.title, "Practice mission")}. Ask about activity in the verified task.`
    : "The Teacher can discuss this mission using bound-task context only.";
  renderContextReceipt(session);
  renderTeacherMessages(session?.teacherChat);
  const composer = document.querySelector("#teacher-message");
  if (composer.value !== practiceState.teacherDraft) {
    composer.value = practiceState.teacherDraft;
  }
  const sending = practiceState.busyAction === "teacher";
  composer.disabled = sending;
  document.querySelector("#teacher-send").disabled = sending;
  document.querySelector("#teacher-send").textContent = sending ? "Sending…" : "Send";
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
  const disconnected = ["stale", "disconnected"].includes(executor.status)
    || ["stale", "disconnected"].includes(executor.freshness);
  const fixedError = practiceState.error?.message ?? "";
  const sessionError = typeof session?.error === "string"
    ? safeText(session.error, "Practice encountered a recoverable issue.", 500)
    : "";
  document.querySelector("#practice-error").textContent = fixedError || sessionError;
  const actions = document.querySelector("#recovery-actions");
  actions.hidden = !disconnected && !fixedError && !sessionError;
  const retry = document.querySelector('[data-practice-action="retry"]');
  const rebind = document.querySelector('[data-practice-action="rebind"]');
  retry.hidden = !disconnected && practiceState.error?.recoveryAction !== "retry-observation";
  rebind.hidden = !executor.bound;
  retry.disabled = practiceState.busyAction === "retrying";
  rebind.disabled = practiceState.busyAction === "rebinding";
}

function renderTaskPicker() {
  const dialog = document.querySelector("#task-picker");
  const list = document.querySelector("#eligible-task-list");
  list.replaceChildren();

  if (practiceState.busyAction === "listing") {
    const status = document.createElement("p");
    status.className = "picker-status";
    status.textContent = "Checking recent tasks in this workspace…";
    list.append(status);
  } else if (practiceState.eligibleTasks.length === 0) {
    const status = document.createElement("p");
    status.className = "picker-status";
    status.textContent = "No eligible tasks are available. Create a dedicated task instead.";
    list.append(status);
  } else {
    for (const task of practiceState.eligibleTasks) {
      const choice = document.createElement("button");
      choice.type = "button";
      choice.className = "eligible-task";
      choice.dataset.practiceTaskChoice = "";
      choice.value = task.threadId;
      const name = document.createElement("strong");
      name.textContent = task.displayName;
      const detail = document.createElement("span");
      detail.textContent = `${safeText(task.status, "Unknown status")} · Updated ${formatTime(task.updatedAt, "time unavailable")}`;
      choice.append(name, detail);
      list.append(choice);
    }
  }

  if (practiceState.pickerOpen && !dialog.open) dialog.showModal();
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

async function refreshPracticeState() {
  try {
    const value = unwrap(await practice.getState());
    dispatchPractice({ type: "VIEW_MODEL_LOADED", viewModel: value });
  } catch {
    dispatchPractice({ type: "ERROR", kind: "generic" });
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

async function createDedicatedTask() {
  dispatchPractice({ type: "CREATE_TASK_REQUESTED" });
  try {
    const value = unwrap(await practice.createTask());
    const handoff = value?.session?.executor?.handoff;
    dispatchPractice({
      type: "TASK_CREATED",
      viewModel: value,
      opened: handoff?.opened !== false,
      fallbackName: handoff?.fallbackName,
    });
  } catch {
    dispatchPractice({ type: "ERROR", kind: "binding" });
  }
}

async function startPractice() {
  dispatchPractice({ type: "START_REQUESTED" });
  let value;
  try {
    value = unwrap(await practice.start());
    dispatchPractice({ type: "VIEW_MODEL_LOADED", viewModel: value }, { focusHeading: true });
  } catch {
    dispatchPractice({ type: "ERROR", kind: "start" });
    return;
  }
  if (value?.session?.lifecycle === "needs-binding") {
    await createDedicatedTask();
  }
}

async function openTaskPicker() {
  dispatchPractice({ type: "OPEN_PICKER" });
  try {
    const tasks = unwrap(await practice.listTasks());
    dispatchPractice({ type: "ELIGIBLE_TASKS_LOADED", tasks });
  } catch {
    dispatchPractice({ type: "ERROR", kind: "picker" });
  }
}

async function bindSelectedTask(taskId) {
  dispatchPractice({ type: "TASK_BIND_REQUESTED" });
  try {
    const value = unwrap(await practice.bindTask(taskId));
    dispatchPractice({ type: "TASK_BOUND", viewModel: value });
  } catch {
    dispatchPractice({ type: "ERROR", kind: "binding" });
  }
}

async function selectPracticeTab(tab) {
  dispatchPractice({ type: "TAB_SELECTED", tab });
  try {
    const value = unwrap(await practice.selectTab(tab));
    dispatchPractice({ type: "VIEW_MODEL_LOADED", viewModel: value });
  } catch {
    dispatchPractice({ type: "ERROR", kind: "generic" });
  }
}

async function retryObservation() {
  dispatchPractice({ type: "BUSY_STARTED", action: "retrying" });
  try {
    const value = unwrap(await practice.retry());
    dispatchPractice({ type: "VIEW_MODEL_LOADED", viewModel: value });
  } catch {
    dispatchPractice({ type: "ERROR", kind: "observation" });
  }
}

async function rebindTask() {
  const confirmed = window.confirm(
    "Rebind this Practice session? The observation cursor will reset, and the Teacher will use only the newly selected task.",
  );
  if (!confirmed) return;
  dispatchPractice({ type: "BUSY_STARTED", action: "rebinding" });
  try {
    const value = unwrap(await practice.rebind());
    dispatchPractice({ type: "VIEW_MODEL_LOADED", viewModel: value });
    if (value?.session?.lifecycle === "needs-binding") await openTaskPicker();
  } catch {
    dispatchPractice({ type: "ERROR", kind: "rebind" });
  }
}

async function openBoundTask() {
  dispatchPractice({ type: "BUSY_STARTED", action: "opening" });
  try {
    const value = unwrap(await practice.openTask());
    const handoff = value?.session?.executor?.handoff;
    dispatchPractice({
      type: "TASK_CREATED",
      viewModel: value,
      opened: handoff?.opened !== false,
      fallbackName: handoff?.fallbackName,
    });
  } catch {
    dispatchPractice({ type: "ERROR", kind: "open" });
  }
}

async function compactPractice() {
  try {
    unwrap(await practice.compact());
  } catch {
    dispatchPractice({ type: "ERROR", kind: "generic" });
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
  dispatchPractice({ type: "TEACHER_DRAFT_CHANGED", text: event.target.value });
});

document.querySelector("#teacher-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const composer = document.querySelector("#teacher-message");
  const text = practiceState.teacherDraft.trim();
  if (!text || practiceState.busyAction === "teacher") {
    composer.focus();
    return;
  }
  dispatchPractice({ type: "TEACHER_SEND_REQUESTED" });
  try {
    const value = unwrap(await practice.sendTeacherMessage(text));
    dispatchPractice({ type: "TEACHER_SEND_ACCEPTED", viewModel: value });
  } catch {
    dispatchPractice({ type: "ERROR", kind: "teacher" });
  }
  queueMicrotask(() => document.querySelector("#teacher-message")?.focus());
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
  await selectPracticeTab(tabs[next].dataset.practiceTab);
});

document.querySelector("#task-picker").addEventListener("cancel", (event) => {
  event.preventDefault();
  dispatchPractice({ type: "CLOSE_PICKER" });
});

document.addEventListener("click", async (event) => {
  const taskChoice = event.target.closest("[data-practice-task-choice]");
  if (taskChoice) {
    await bindSelectedTask(taskChoice.value);
    return;
  }

  const tab = event.target.closest("[data-practice-tab]")?.dataset.practiceTab;
  if (tab) {
    await selectPracticeTab(tab);
    return;
  }

  const practiceAction = event.target.closest("[data-practice-action]")?.dataset.practiceAction;
  if (practiceAction === "start") await startPractice();
  if (practiceAction === "create-task") await createDedicatedTask();
  if (practiceAction === "open-picker") await openTaskPicker();
  if (practiceAction === "close-picker") dispatchPractice({ type: "CLOSE_PICKER" });
  if (practiceAction === "open-task") await openBoundTask();
  if (practiceAction === "retry") await retryObservation();
  if (practiceAction === "rebind") await rebindTask();
  if (practiceAction === "compact") await compactPractice();
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

removePracticeListener = practice.onStateChanged((value) => {
  dispatchPractice({ type: "STATE_PUSHED", viewModel: value });
});

window.addEventListener("beforeunload", () => {
  removeAuthListener();
  removePracticeListener();
}, { once: true });

render();
await Promise.all([refreshStatus(), refreshPracticeState()]);
