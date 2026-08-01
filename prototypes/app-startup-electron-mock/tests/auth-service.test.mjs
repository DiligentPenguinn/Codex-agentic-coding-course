import assert from "node:assert/strict";
import test from "node:test";

import {
  createAuthService,
  isAllowedAuthUrl,
  toDisplayAccount,
} from "../src/main/auth-service.mjs";

function createFakeClient(responses = {}) {
  const requests = [];
  let notificationListener;
  return {
    requests,
    async request(method, params) {
      requests.push({ method, params });
      const response = responses[method];
      return typeof response === "function"
        ? response({ method, params, requests })
        : response;
    },
    onNotification(listener) {
      notificationListener = listener;
      return () => {
        notificationListener = undefined;
      };
    },
    emit(method, params) {
      notificationListener?.({ method, params });
    },
  };
}

test("allows only HTTPS OpenAI and ChatGPT authentication hosts", () => {
  assert.equal(isAllowedAuthUrl("https://chatgpt.com/auth"), true);
  assert.equal(isAllowedAuthUrl("https://login.chatgpt.com/auth"), true);
  assert.equal(isAllowedAuthUrl("https://auth.openai.com/codex/device"), true);
  assert.equal(isAllowedAuthUrl("http://chatgpt.com/auth"), false);
  assert.equal(
    isAllowedAuthUrl("https://chatgpt.com.evil.example/auth"),
    false,
  );
  assert.equal(isAllowedAuthUrl("file:///C:/secret"), false);
  assert.equal(isAllowedAuthUrl("not a URL"), false);
});

test("maps account results to display-safe fields only", () => {
  const display = toDisplayAccount({
    account: {
      type: "chatgpt",
      email: "learner@example.com",
      planType: "plus",
      accessToken: "secret",
    },
    requiresOpenaiAuth: true,
    refreshToken: "secret",
    authUrl: "https://auth.openai.com/secret",
  });

  assert.deepEqual(display, {
    connected: true,
    accountType: "chatgpt",
    email: "learner@example.com",
    planType: "plus",
    requiresOpenaiAuth: true,
  });
  assert.doesNotMatch(JSON.stringify(display), /token|authUrl/i);
});

test("reads account without refreshing credentials", async () => {
  const client = createFakeClient({
    "account/read": {
      account: { type: "chatgpt", email: "learner@example.com" },
      requiresOpenaiAuth: true,
    },
  });
  const auth = createAuthService({ client, openExternal: async () => {} });

  const account = await auth.readAccount();

  assert.equal(account.connected, true);
  assert.deepEqual(client.requests[0], {
    method: "account/read",
    params: { refreshToken: false },
  });
});

test("browser login opens a validated URL but returns no URL", async () => {
  const opened = [];
  const client = createFakeClient({
    "account/login/start": {
      loginId: "login-1",
      authUrl: "https://auth.openai.com/codex",
    },
  });
  const auth = createAuthService({
    client,
    openExternal: async (url) => opened.push(url),
  });

  const result = await auth.startBrowserLogin();

  assert.deepEqual(client.requests[0], {
    method: "account/login/start",
    params: {
      type: "chatgpt",
      useHostedLoginSuccessPage: true,
      appBrand: "chatgpt",
    },
  });
  assert.deepEqual(result, {
    loginId: "login-1",
    status: "waitingForCallback",
  });
  assert.deepEqual(opened, ["https://auth.openai.com/codex"]);
});

test("rejects a browser login URL outside the allowlist", async () => {
  const client = createFakeClient({
    "account/login/start": {
      loginId: "login-unsafe",
      authUrl: "https://chatgpt.com.evil.example/steal",
    },
  });
  const auth = createAuthService({ client, openExternal: async () => {} });

  await assert.rejects(auth.startBrowserLogin(), {
    code: "AUTH_URL_REJECTED",
  });
});

test("device login returns only the validated verification fields", async () => {
  const client = createFakeClient({
    "account/login/start": {
      loginId: "device-1",
      verificationUrl: "https://auth.openai.com/codex/device",
      userCode: "ABCD-EFGH",
      accessToken: "secret",
    },
  });
  const auth = createAuthService({ client, openExternal: async () => {} });

  assert.deepEqual(await auth.startDeviceLogin(), {
    loginId: "device-1",
    verificationUrl: "https://auth.openai.com/codex/device",
    userCode: "ABCD-EFGH",
    status: "deviceCode",
  });
  assert.equal(
    client.requests[0].params.type,
    "chatgptDeviceCode",
  );
});

test("matching completion re-reads account and emits sanitized status", async () => {
  let accountReads = 0;
  const client = createFakeClient({
    "account/login/start": {
      loginId: "login-1",
      authUrl: "https://chatgpt.com/auth",
    },
    "account/read": () => {
      accountReads += 1;
      return {
        account: {
          type: "chatgpt",
          email: "learner@example.com",
          accessToken: "secret",
        },
        requiresOpenaiAuth: true,
      };
    },
  });
  const auth = createAuthService({ client, openExternal: async () => {} });
  const statuses = [];
  auth.onStatus((status) => statuses.push(status));
  await auth.startBrowserLogin();

  client.emit("account/login/completed", {
    loginId: "other-login",
    success: true,
  });
  client.emit("account/login/completed", {
    loginId: "login-1",
    success: true,
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(accountReads, 1);
  assert.equal(statuses.length, 1);
  assert.equal(statuses[0].account.connected, true);
  assert.doesNotMatch(JSON.stringify(statuses), /accessToken|secret/);
});

test("cancel sends the active login ID and emits cancelled", async () => {
  const client = createFakeClient({
    "account/login/start": {
      loginId: "login-1",
      authUrl: "https://chatgpt.com/auth",
    },
    "account/login/cancel": {},
  });
  const auth = createAuthService({ client, openExternal: async () => {} });
  const statuses = [];
  auth.onStatus((status) => statuses.push(status));
  await auth.startBrowserLogin();

  await auth.cancelLogin("login-1");

  assert.deepEqual(client.requests.at(-1), {
    method: "account/login/cancel",
    params: { loginId: "login-1" },
  });
  assert.deepEqual(statuses.at(-1), {
    status: "cancelled",
    loginId: "login-1",
  });
});

test("login failure emits a fixed message without raw App Server details", async () => {
  const client = createFakeClient({
    "account/login/start": {
      loginId: "login-1",
      authUrl: "https://chatgpt.com/auth",
    },
  });
  const auth = createAuthService({ client, openExternal: async () => {} });
  const statuses = [];
  auth.onStatus((status) => statuses.push(status));
  await auth.startBrowserLogin();

  client.emit("account/login/completed", {
    loginId: "login-1",
    success: false,
    error: "raw provider secret",
  });
  await new Promise((resolve) => setImmediate(resolve));

  assert.deepEqual(statuses, [{
    status: "failed",
    code: "LOGIN_FAILED",
    message: "Codex login did not complete.",
  }]);
});

test("account updates are re-read before emitting display state", async () => {
  const client = createFakeClient({
    "account/read": {
      account: { type: "chatgpt", email: "updated@example.com" },
      requiresOpenaiAuth: true,
    },
  });
  const auth = createAuthService({ client, openExternal: async () => {} });
  const statuses = [];
  auth.onStatus((status) => statuses.push(status));

  client.emit("account/updated", { accessToken: "secret" });
  await new Promise((resolve) => setImmediate(resolve));

  assert.equal(statuses[0].status, "connected");
  assert.equal(statuses[0].account.email, "updated@example.com");
  assert.doesNotMatch(JSON.stringify(statuses), /accessToken|secret/);
});
