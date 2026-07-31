import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  createInitialOnboardingState,
  reduceOnboarding,
} from "../src/renderer/onboarding-state.mjs";

const account = {
  connected: true,
  accountType: "chatgpt",
  email: "learner@example.com",
  requiresOpenaiAuth: true,
};

const content = {
  fields: [
    {
      id: "sample-goal",
      type: "shortText",
      required: true,
    },
    {
      id: "sample-format",
      type: "singleChoice",
      required: true,
      options: [{ value: "one" }, { value: "two" }],
    },
  ],
};

test("starts on the landing page while saved setup is checked", () => {
  const state = createInitialOnboardingState();
  assert.equal(state.screen, "landing");
  assert.equal(state.connection, "checking");
  assert.equal(state.statusReady, false);
  assert.deepEqual(state.responses, {});
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.responses), true);
});

test("moves from signed out through browser login to teaching setup", () => {
  let state = createInitialOnboardingState();
  state = reduceOnboarding(state, {
    type: "STATUS_LOADED",
    connected: false,
  });
  assert.equal(state.screen, "landing");
  assert.equal(state.connection, "signedOut");
  assert.equal(state.entryTarget, "connect");

  state = reduceOnboarding(state, { type: "LANDING_CONTINUE" });
  assert.equal(state.screen, "connect");

  state = reduceOnboarding(state, {
    type: "BROWSER_LOGIN_STARTED",
    loginId: "login-1",
  });
  assert.equal(state.connection, "waitingForCallback");
  assert.equal(state.loginId, "login-1");

  state = reduceOnboarding(state, {
    type: "LOGIN_SUCCEEDED",
    account,
  });
  assert.equal(state.screen, "teachingSetup");
  assert.equal(state.connection, "connected");
  assert.deepEqual(state.account, account);
});

test("supports disconnected retry, device code, cancellation, and failure", () => {
  let state = reduceOnboarding(createInitialOnboardingState(), {
    type: "CONNECTION_UNAVAILABLE",
  });
  assert.equal(state.connection, "disconnected");

  state = reduceOnboarding(state, { type: "RETRY_STARTED" });
  assert.equal(state.connection, "checking");

  state = reduceOnboarding(state, { type: "DEVICE_LOGIN_OPENING" });
  assert.equal(state.connection, "openingDevice");

  state = reduceOnboarding(state, {
    type: "DEVICE_LOGIN_STARTED",
    loginId: "device-1",
    verificationUrl: "https://auth.openai.com/codex/device",
    userCode: "ABCD",
  });
  assert.equal(state.connection, "deviceCode");
  assert.equal(state.device.userCode, "ABCD");

  state = reduceOnboarding(state, { type: "LOGIN_CANCELLED" });
  assert.equal(state.connection, "cancelled");
  assert.equal(state.loginId, null);

  state = reduceOnboarding(state, {
    type: "LOGIN_FAILED",
    message: "Codex login did not complete.",
  });
  assert.equal(state.connection, "failed");
  assert.equal(state.error, "Codex login did not complete.");
});

test("keeps saved progress visible when the account check is unavailable", () => {
  const state = reduceOnboarding(createInitialOnboardingState(), {
    type: "STATUS_LOADED",
    connected: false,
    connectionUnavailable: true,
    setupCompleted: true,
    responses: { "sample-goal": "Saved locally" },
  });

  assert.equal(state.screen, "landing");
  assert.equal(state.connection, "disconnected");
  assert.equal(state.entryTarget, "destination");
  assert.equal(state.responses["sample-goal"], "Saved locally");
});

test("validates required fixture responses before completion", () => {
  let state = reduceOnboarding(createInitialOnboardingState(), {
    type: "STATUS_LOADED",
    connected: true,
    account,
  });
  state = reduceOnboarding(state, { type: "LANDING_CONTINUE" });
  state = reduceOnboarding(state, { type: "CONTENT_LOADED", content });
  state = reduceOnboarding(state, { type: "SUBMIT_REQUESTED" });
  assert.deepEqual(
    Object.keys(state.validationErrors).sort(),
    ["sample-format", "sample-goal"],
  );
  assert.equal(state.screen, "teachingSetup");

  state = reduceOnboarding(state, {
    type: "RESPONSE_CHANGED",
    fieldId: "sample-goal",
    value: "Test the setup",
  });
  state = reduceOnboarding(state, {
    type: "RESPONSE_CHANGED",
    fieldId: "sample-format",
    value: "one",
  });
  state = reduceOnboarding(state, { type: "SUBMIT_REQUESTED" });
  assert.deepEqual(state.validationErrors, {});
  assert.equal(state.submitting, true);

  state = reduceOnboarding(state, { type: "SETUP_SAVED" });
  assert.equal(state.screen, "complete");
  assert.equal(state.submitting, false);
});

test("preserves entered responses when moving backward and reopening", () => {
  let state = reduceOnboarding(createInitialOnboardingState(), {
    type: "STATUS_LOADED",
    connected: true,
    account,
  });
  state = reduceOnboarding(state, { type: "LANDING_CONTINUE" });
  state = reduceOnboarding(state, { type: "CONTENT_LOADED", content });
  state = reduceOnboarding(state, {
    type: "RESPONSE_CHANGED",
    fieldId: "sample-goal",
    value: "Keep this",
  });
  state = reduceOnboarding(state, { type: "BACK_TO_CONNECT" });
  assert.equal(state.screen, "connect");
  assert.equal(state.responses["sample-goal"], "Keep this");

  state = reduceOnboarding(state, { type: "CONTINUE_SETUP" });
  assert.equal(state.screen, "teachingSetup");

  state = reduceOnboarding(state, { type: "REOPEN_SETUP" });
  assert.equal(state.screen, "teachingSetup");
  assert.equal(state.responses["sample-goal"], "Keep this");
});

test("loads completed setup and leaves unknown events unchanged", () => {
  let state = reduceOnboarding(createInitialOnboardingState(), {
    type: "STATUS_LOADED",
    connected: true,
    setupCompleted: true,
    account,
    responses: { "sample-goal": "Saved" },
  });
  assert.equal(state.screen, "landing");
  assert.equal(state.entryTarget, "destination");
  state = reduceOnboarding(state, { type: "LANDING_CONTINUE" });
  assert.equal(state.screen, "destination");
  assert.equal(
    reduceOnboarding(state, { type: "UNKNOWN_WITH_RAW_PAYLOAD", raw: "secret" }),
    state,
  );
});

test("renderer shell and orchestration preserve the accessible narrow boundary", async () => {
  const rendererRoot = new URL("../src/renderer/", import.meta.url);
  const [html, script, css] = await Promise.all([
    readFile(new URL("index.html", rendererRoot), "utf8"),
    readFile(new URL("app.js", rendererRoot), "utf8"),
    readFile(new URL("styles.css", rendererRoot), "utf8"),
  ]);

  assert.match(html, /<main id="app" aria-live="polite">/);
  assert.match(html, /Welcome to Content Builder Academy/);
  assert.match(html, /data-action="enter"/);
  assert.match(html, /Connect Codex/);
  assert.match(html, /Teaching setup/);
  assert.match(html, /Setup complete/);
  assert.match(
    html,
    /id="device-link"[^>]*target="_blank"[^>]*rel="noreferrer"/,
  );
  for (const action of [
    "connect",
    "device",
    "cancel",
    "retry",
    "back",
    "continue",
    "reopen",
    "forward",
  ]) {
    assert.match(html, new RegExp(`data-action="${action}"`));
  }
  assert.doesNotMatch(script, /node:|from\s+["']electron|require\s*\(/);
  assert.match(script, /courseSetup\.getStatus/);
  assert.match(script, /courseSetup\.onAuthStatusChanged/);
  assert.match(script, /courseSetup\.saveResponses/);
  assert.match(script, /aria-invalid/);
  assert.match(script, /heading\?\.focus/);
  assert.doesNotMatch(
    script,
    /addEventListener\("input"[\s\S]{0,800}dispatch\(\{ type: "RESPONSE_CHANGED"/,
  );
  assert.match(css, /:focus-visible/);
  assert.match(css, /prefers-reduced-motion/);
  assert.match(css, /min-height:\s*44px/);
});
