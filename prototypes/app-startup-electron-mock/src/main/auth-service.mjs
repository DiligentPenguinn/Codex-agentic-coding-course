function authError(code, message) {
  return Object.assign(new Error(message), { code });
}

export function isAllowedAuthUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && (
      url.hostname === "chatgpt.com"
      || url.hostname.endsWith(".chatgpt.com")
      || url.hostname === "auth.openai.com"
      || url.hostname.endsWith(".auth.openai.com")
    );
  } catch {
    return false;
  }
}

export function toDisplayAccount(result) {
  const account = result?.account;
  const display = {
    connected: Boolean(account),
    accountType: account?.type ?? result?.accountType ?? null,
    requiresOpenaiAuth: Boolean(result?.requiresOpenaiAuth),
  };
  if (typeof account?.email === "string") display.email = account.email;
  if (typeof account?.planType === "string") {
    display.planType = account.planType;
  }
  return display;
}

export function createAuthService({ client, openExternal }) {
  const listeners = new Set();
  let activeLogin = null;
  let disposed = false;

  function emit(status) {
    if (disposed) return;
    for (const listener of listeners) listener(structuredClone(status));
  }

  async function readAccount() {
    const result = await client.request("account/read", {
      refreshToken: false,
    });
    return toDisplayAccount(result);
  }

  async function emitCurrentAccount() {
    try {
      const account = await readAccount();
      emit({
        status: account.connected ? "connected" : "signedOut",
        account,
      });
    } catch {
      emit({
        status: "failed",
        code: "ACCOUNT_READ_FAILED",
        message: "Codex account status could not be read.",
      });
    }
  }

  const unsubscribe = client.onNotification((notification) => {
    if (
      notification.method === "account/login/completed"
      && notification.params?.loginId === activeLogin?.loginId
    ) {
      const completed = notification.params;
      activeLogin = null;
      if (completed.success === false || completed.error) {
        emit({
          status: "failed",
          code: "LOGIN_FAILED",
          message: "Codex login did not complete.",
        });
      } else {
        void emitCurrentAccount();
      }
    } else if (notification.method === "account/updated") {
      void emitCurrentAccount();
    }
  });

  return {
    readAccount,

    async startBrowserLogin() {
      const result = await client.request("account/login/start", {
        type: "chatgpt",
        useHostedLoginSuccessPage: true,
        appBrand: "chatgpt",
      });
      if (!isAllowedAuthUrl(result?.authUrl)) {
        throw authError(
          "AUTH_URL_REJECTED",
          "Codex returned an untrusted authentication URL.",
        );
      }
      activeLogin = { loginId: result.loginId, mode: "browser" };
      await openExternal(result.authUrl);
      return {
        loginId: result.loginId,
        status: "waitingForCallback",
      };
    },

    async startDeviceLogin() {
      const result = await client.request("account/login/start", {
        type: "chatgptDeviceCode",
      });
      if (!isAllowedAuthUrl(result?.verificationUrl)) {
        throw authError(
          "AUTH_URL_REJECTED",
          "Codex returned an untrusted device verification URL.",
        );
      }
      activeLogin = { loginId: result.loginId, mode: "device" };
      return {
        loginId: result.loginId,
        verificationUrl: result.verificationUrl,
        userCode: result.userCode,
        status: "deviceCode",
      };
    },

    async cancelLogin(loginId) {
      if (!activeLogin || activeLogin.loginId !== loginId) {
        throw authError("LOGIN_NOT_ACTIVE", "That login is no longer active.");
      }
      await client.request("account/login/cancel", { loginId });
      activeLogin = null;
      emit({ status: "cancelled", loginId });
    },

    onStatus(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },

    dispose() {
      disposed = true;
      activeLogin = null;
      listeners.clear();
      unsubscribe();
    },
  };
}
