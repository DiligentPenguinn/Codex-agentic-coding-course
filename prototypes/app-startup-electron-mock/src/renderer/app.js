import {
  createInitialOnboardingState,
  reduceOnboarding,
} from "./onboarding-state.mjs";

const courseSetup = window.courseSetup;
let state = createInitialOnboardingState();
let removeAuthListener = () => {};

function unwrap(result) {
  if (result?.ok) return result.value;
  const error = new Error(result?.error?.message ?? "The setup action failed.");
  error.recoveryAction = result?.error?.recoveryAction;
  throw error;
}

function dispatch(event) {
  const previousScreen = state.screen;
  state = reduceOnboarding(state, event);
  render();
  if (state.screen !== previousScreen) {
    queueMicrotask(() => {
      const heading = document.querySelector(
        `[data-screen="${CSS.escape(state.screen)}"] h2`,
      );
      heading?.setAttribute("tabindex", "-1");
      heading?.focus();
    });
  }
}

function setScreenVisibility() {
  for (const section of document.querySelectorAll("[data-screen]")) {
    section.hidden = section.dataset.screen !== state.screen;
  }
  for (const step of document.querySelectorAll("[data-step]")) {
    step.toggleAttribute("aria-current", step.dataset.step === state.screen);
  }
  document.querySelector("#setup-progress").hidden = [
    "landing",
    "destination",
  ].includes(state.screen);
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
    disconnected: "Codex App Server is unavailable",
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
    labels[state.connection];
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
  const loginActive = [
    "waitingForCallback",
    "deviceCode",
  ].includes(state.connection);
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
    document.querySelector("#device-link").href =
      state.device.verificationUrl;
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
        choices.append(makeChoice(
          field,
          option,
          field.type === "multipleChoice",
        ));
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

function render() {
  setScreenVisibility();
  renderLanding();
  renderConnection();
  renderFixture();
  document.querySelector("#complete-connection").textContent =
    state.connection === "connected" ? "Connected" : "Needs recheck";
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

document.addEventListener("click", async (event) => {
  const action = event.target.closest("[data-action]")?.dataset.action;
  if (!action) return;
  if (action === "enter") dispatch({ type: "LANDING_CONTINUE" });
  if (action === "forward") dispatch({ type: "CONTINUE_SETUP" });
  if (action === "connect") await startBrowserLogin();
  if (action === "device") await startDeviceLogin();
  if (action === "cancel" && state.loginId) {
    await courseSetup.cancelLogin(state.loginId);
  }
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
      document.querySelector(
        `[data-field-id="${CSS.escape(invalidFieldId)}"] input`,
      )?.focus();
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
  if (action === "mock-app") {
    dispatch({ type: "OPEN_MOCK_APP" });
  }
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

window.addEventListener("beforeunload", () => removeAuthListener(), {
  once: true,
});

render();
await refreshStatus();
