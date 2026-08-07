import { CHANNELS } from "../shared/channels.mjs";
import { parseOnboardingContent } from "../shared/content-schema.mjs";
import { parseSetupState } from "../shared/setup-state-schema.mjs";

function failure(code, message, recoveryAction) {
  return {
    ok: false,
    error: {
      code,
      message,
      ...(recoveryAction ? { recoveryAction } : {}),
    },
  };
}

function safeHandler(handler, fallback) {
  return async (...args) => {
    try {
      return { ok: true, value: await handler(...args) };
    } catch {
      return failure(fallback.code, fallback.message, fallback.recoveryAction);
    }
  };
}

function validateResponses(content, responses) {
  if (!responses || typeof responses !== "object" || Array.isArray(responses)) {
    throw new TypeError("Responses must be an object.");
  }
  const fields = new Map(content.fields.map((field) => [field.id, field]));
  for (const id of Object.keys(responses)) {
    if (!fields.has(id)) throw new TypeError("Unknown response field.");
  }

  for (const field of content.fields) {
    const value = responses[field.id];
    if (field.type === "shortText") {
      if (
        (field.required && (typeof value !== "string" || value.trim() === ""))
        || (value !== undefined && typeof value !== "string")
      ) {
        throw new TypeError("Invalid text response.");
      }
    } else if (field.type === "singleChoice") {
      const allowed = new Set(field.options.map((option) => option.value));
      if (
        (field.required && !allowed.has(value))
        || (value !== undefined && !allowed.has(value))
      ) {
        throw new TypeError("Invalid single-choice response.");
      }
    } else {
      const allowed = new Set(field.options.map((option) => option.value));
      if (
        (field.required && (!Array.isArray(value) || value.length === 0))
        || (
          value !== undefined
          && (
            !Array.isArray(value)
            || new Set(value).size !== value.length
            || value.some((item) => !allowed.has(item))
          )
        )
      ) {
        throw new TypeError("Invalid multiple-choice response.");
      }
    }
  }
  return structuredClone(responses);
}

export function registerIpcHandlers({
  ipcMain,
  auth,
  store,
  content: sourceContent,
  retryAppServer,
  clock = () => new Date(),
}) {
  const content = parseOnboardingContent(sourceContent);
  const handlers = new Map([
    [CHANNELS.GET_STATUS, safeHandler(async () => {
      const state = await store.read();
      let account;
      let connectionUnavailable = false;
      try {
        account = await auth.readAccount();
      } catch {
        account = { connected: false };
        connectionUnavailable = true;
      }
      return {
        ...state,
        codexConnected: account.connected,
        account,
        connectionUnavailable,
        recovery: store.lastRecovery,
      };
    }, {
      code: "STATUS_UNAVAILABLE",
      message: "Setup status could not be loaded.",
      recoveryAction: "Retry the Codex connection.",
    })],
    [CHANNELS.START_BROWSER_LOGIN, safeHandler(
      () => auth.startBrowserLogin(),
      {
        code: "LOGIN_START_FAILED",
        message: "Codex browser login could not start.",
        recoveryAction: "Retry or use device-code login.",
      },
    )],
    [CHANNELS.START_DEVICE_LOGIN, safeHandler(
      () => auth.startDeviceLogin(),
      {
        code: "DEVICE_LOGIN_FAILED",
        message: "Codex device login could not start.",
        recoveryAction: "Retry browser login.",
      },
    )],
    [CHANNELS.CANCEL_LOGIN, safeHandler(
      (_event, payload) => auth.cancelLogin(payload?.loginId),
      {
        code: "LOGIN_CANCEL_FAILED",
        message: "The active login could not be cancelled.",
      },
    )],
    [CHANNELS.RETRY_APP_SERVER, safeHandler(retryAppServer, {
      code: "APP_SERVER_RETRY_FAILED",
      message: "Codex could not reconnect.",
      recoveryAction: "Check the Codex installation and retry.",
    })],
    [CHANNELS.GET_CONTENT, safeHandler(() => structuredClone(content), {
      code: "FIXTURE_UNAVAILABLE",
      message: "The sample setup content could not be loaded.",
    })],
    [CHANNELS.SAVE_RESPONSES, safeHandler(async (_event, payload) => {
      let responses;
      try {
        responses = validateResponses(content, payload?.responses);
      } catch {
        throw Object.assign(new Error("Invalid responses."), {
          code: "INVALID_RESPONSES",
        });
      }
      const current = await store.read();
      return store.write(parseSetupState({
        ...current,
        setupCompleted: true,
        onboardingResponses: responses,
        updatedAt: clock().toISOString(),
      }));
    }, {
      code: "INVALID_RESPONSES",
      message: "The fixture responses are invalid.",
      recoveryAction: "Review the highlighted sample fields and try again.",
    })],
    [CHANNELS.REOPEN_SETUP, safeHandler(async () => {
      const current = await store.read();
      return store.write(parseSetupState({
        ...current,
        setupCompleted: false,
        updatedAt: clock().toISOString(),
      }));
    }, {
      code: "SETUP_REOPEN_FAILED",
      message: "Setup could not be reopened.",
    })],
  ]);

  for (const [channel, handler] of handlers) ipcMain.handle(channel, handler);
  return () => {
    for (const channel of handlers.keys()) ipcMain.removeHandler(channel);
  };
}
