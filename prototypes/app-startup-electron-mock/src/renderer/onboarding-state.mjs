function frozenState(state) {
  return Object.freeze({
    ...state,
    responses: Object.freeze({ ...state.responses }),
    validationErrors: Object.freeze({ ...state.validationErrors }),
    account: state.account ? Object.freeze({ ...state.account }) : null,
    device: state.device ? Object.freeze({ ...state.device }) : null,
  });
}

export function createInitialOnboardingState() {
  return frozenState({
    screen: "checking",
    connection: "checking",
    account: null,
    loginId: null,
    device: null,
    content: null,
    responses: {},
    validationErrors: {},
    submitting: false,
    error: null,
  });
}

function requiredErrors(content, responses) {
  const errors = {};
  for (const field of content?.fields ?? []) {
    if (!field.required) continue;
    const value = responses[field.id];
    const missing = field.type === "shortText"
      ? typeof value !== "string" || value.trim() === ""
      : field.type === "multipleChoice"
        ? !Array.isArray(value) || value.length === 0
        : value === undefined || value === null || value === "";
    if (missing) errors[field.id] = "This sample field is required.";
  }
  return errors;
}

export function reduceOnboarding(state, event) {
  switch (event.type) {
    case "STATUS_LOADED":
      return frozenState({
        ...state,
        screen: event.setupCompleted
          ? "complete"
          : event.connected
            ? "teachingSetup"
            : "connect",
        connection: event.connected ? "connected" : "signedOut",
        account: event.account ?? null,
        responses: event.responses ?? state.responses,
        error: null,
      });
    case "CONNECTION_UNAVAILABLE":
      return frozenState({
        ...state,
        screen: "connect",
        connection: "disconnected",
        error: null,
      });
    case "RETRY_STARTED":
      return frozenState({
        ...state,
        connection: "checking",
        error: null,
      });
    case "BROWSER_LOGIN_OPENING":
      return frozenState({
        ...state,
        connection: "openingBrowser",
        error: null,
      });
    case "BROWSER_LOGIN_STARTED":
      return frozenState({
        ...state,
        connection: "waitingForCallback",
        loginId: event.loginId,
        device: null,
        error: null,
      });
    case "DEVICE_LOGIN_STARTED":
      return frozenState({
        ...state,
        connection: "deviceCode",
        loginId: event.loginId,
        device: {
          verificationUrl: event.verificationUrl,
          userCode: event.userCode,
        },
        error: null,
      });
    case "LOGIN_SUCCEEDED":
      return frozenState({
        ...state,
        screen: "teachingSetup",
        connection: "connected",
        account: event.account,
        loginId: null,
        device: null,
        error: null,
      });
    case "LOGIN_CANCELLED":
      return frozenState({
        ...state,
        connection: "cancelled",
        loginId: null,
        device: null,
        error: null,
      });
    case "LOGIN_FAILED":
      return frozenState({
        ...state,
        connection: "failed",
        loginId: null,
        device: null,
        error: event.message ?? "Codex login did not complete.",
      });
    case "CONTENT_LOADED":
      return frozenState({ ...state, content: event.content });
    case "RESPONSE_CHANGED":
      return frozenState({
        ...state,
        responses: {
          ...state.responses,
          [event.fieldId]: event.value,
        },
        validationErrors: {
          ...state.validationErrors,
          [event.fieldId]: undefined,
        },
      });
    case "SUBMIT_REQUESTED": {
      const validationErrors = requiredErrors(state.content, state.responses);
      return frozenState({
        ...state,
        validationErrors,
        submitting: Object.keys(validationErrors).length === 0,
      });
    }
    case "SETUP_SAVED":
      return frozenState({
        ...state,
        screen: "complete",
        submitting: false,
        error: null,
      });
    case "SETUP_SAVE_FAILED":
      return frozenState({
        ...state,
        submitting: false,
        error: event.message ?? "Sample setup could not be saved.",
      });
    case "BACK_TO_CONNECT":
      return frozenState({ ...state, screen: "connect" });
    case "REOPEN_SETUP":
      return frozenState({
        ...state,
        screen: "teachingSetup",
        validationErrors: {},
        error: null,
      });
    default:
      return state;
  }
}
