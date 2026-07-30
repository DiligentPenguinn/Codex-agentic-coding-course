# Electron Startup Mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Windows-first Electron startup mock that installs prerequisites only after permission, authenticates through Codex App Server, collects fixture onboarding responses, and resumes non-secret setup state.

**Architecture:** A minimal root `.cmd` bootstrap starts a testable Node.js setup orchestrator, which launches an isolated Electron package under `prototypes/app-startup-electron-mock`. Electron's main process owns Codex App Server, authentication, persistence, external URLs, and narrow IPC; a sandboxed renderer owns only presentation and user interaction.

**Tech Stack:** Windows Command Script, Node.js 22+ ESM, Electron 43.2.0, Playwright 1.62.0, Node's built-in test runner, HTML, CSS, and browser JavaScript.

**Approved design:** [`../specs/2026-07-30-electron-startup-mock-design.md`](../specs/2026-07-30-electron-startup-mock-design.md)

**Ownership references:** [`../../planning/team-workload-boundaries.md`](../../planning/team-workload-boundaries.md) and [`../../planning/team-workload-quick-reference.md`](../../planning/team-workload-quick-reference.md)

## Global Constraints

- Target Windows first.
- The learner-facing root command is exactly `.\start-course.cmd`.
- Do not use or recommend PowerShell `ExecutionPolicy Bypass`.
- Detect missing or incompatible prerequisites before running installation commands.
- Show the exact installation plan and require explicit permission before executing it.
- Use `winget install --id OpenJS.NodeJS.LTS` for missing Node.js LTS.
- Use `npm install -g @openai/codex@latest` for a missing Codex CLI.
- Use `npm ci` for locked project dependencies.
- Use `npx --no-install install-electron --no` for Electron 43's pinned native
  runtime, and display it as a separate approved action.
- Do not silently upgrade a compatible Codex installation.
- Keep ChatGPT login and first-run interaction in Electron, not the terminal.
- Authenticate only through Codex App Server managed ChatGPT flows.
- Never read `~/.codex/auth.json`.
- Never expose or persist access tokens, refresh tokens, API keys, raw
  environment variables, raw App Server messages, or browser-login
  authentication URLs. A validated device-code verification URL may be shown
  because the learner must visit it, but it is never persisted.
- Set `nodeIntegration: false`, `contextIsolation: true`, and `sandbox: true`.
- The renderer must not receive filesystem, shell, child-process, environment, or generic IPC access.
- Store non-secret setup state under Electron's per-user `userData` path, never in the repository.
- Treat `codexConnected` as cached display state; recheck authentication through `account/read`.
- Label all onboarding fixture content as non-production and Duy-owned.
- Do not author Triết's final onboarding script, questions, explanations, wording, or sequence.
- Do not modify the existing Course Companion prototype.
- Keep the root launcher documented as a Duy-side prototype proposal pending Triết's shared-entry-point review.
- Use test-driven development: observe each new test fail before adding its minimal implementation.
- Do not add production packaging, signing, auto-update, tray behavior, Practice Mode monitoring, real Teacher inference, voice, capture, or macOS/Linux launchers.

## File and responsibility map

### Root bootstrap

- `start-course.cmd` — Windows/Node bootstrap only; no teaching or authentication.
- `scripts/setup-core.mjs` — pure prerequisite detection, install-plan construction, formatting, permission gating, and lock fingerprint logic.
- `scripts/setup-and-start.mjs` — terminal entry point that calls setup-core and launches Electron.
- `README.md` — short, explicitly experimental startup-mock instructions.

### Mock package

- `prototypes/app-startup-electron-mock/package.json` — pinned runtime, scripts, and Node floor.
- `prototypes/app-startup-electron-mock/package-lock.json` — exact dependency graph.
- `prototypes/app-startup-electron-mock/README.md` — implemented/simulated/deferred behavior and manual recovery.
- `prototypes/app-startup-electron-mock/content/onboarding.fixture.json` — visibly non-production fixture owned by Duy.

### Shared pure modules

- `prototypes/app-startup-electron-mock/src/shared/content-schema.mjs` — parse and validate the versioned fixture contract.
- `prototypes/app-startup-electron-mock/src/shared/setup-state-schema.mjs` — parse, sanitize, and create setup-state defaults.
- `prototypes/app-startup-electron-mock/src/shared/channels.mjs` — frozen IPC
  channel names for the main process; contract tests keep the sandbox preload's
  inline copy synchronized.

### Main process

- `prototypes/app-startup-electron-mock/src/main/codex-app-server-client.mjs` — JSONL process transport, request correlation, initialization, notifications, exit, and restart.
- `prototypes/app-startup-electron-mock/src/main/auth-service.mjs` — display-safe account state, browser/device login, cancellation, URL validation, and completion.
- `prototypes/app-startup-electron-mock/src/main/setup-store.mjs` — atomic user-data persistence and corrupt-state quarantine.
- `prototypes/app-startup-electron-mock/src/main/window-policy.mjs` — secure BrowserWindow options and navigation/external URL rules.
- `prototypes/app-startup-electron-mock/src/main/ipc-handlers.mjs` — narrow handlers joining auth, content, and state.
- `prototypes/app-startup-electron-mock/src/main/main.mjs` — Electron lifecycle composition only.

### Renderer boundary

- `prototypes/app-startup-electron-mock/src/preload/preload.cjs` — exact
  sandbox-compatible `window.courseSetup` bridge.
- `prototypes/app-startup-electron-mock/src/renderer/onboarding-state.mjs` — pure screen/state reducer.
- `prototypes/app-startup-electron-mock/src/renderer/index.html` — semantic first-run shell.
- `prototypes/app-startup-electron-mock/src/renderer/app.js` — renderer orchestration through `window.courseSetup`.
- `prototypes/app-startup-electron-mock/src/renderer/styles.css` — minimal, accessible mock styling outside the Course App.

### Tests

- `prototypes/app-startup-electron-mock/tests/content-schema.test.mjs`
- `prototypes/app-startup-electron-mock/tests/setup-detection.test.mjs`
- `prototypes/app-startup-electron-mock/tests/setup-store.test.mjs`
- `prototypes/app-startup-electron-mock/tests/app-server-client.test.mjs`
- `prototypes/app-startup-electron-mock/tests/auth-service.test.mjs`
- `prototypes/app-startup-electron-mock/tests/window-policy.test.mjs`
- `prototypes/app-startup-electron-mock/tests/onboarding-state.test.mjs`
- `prototypes/app-startup-electron-mock/tests/ipc-contract.test.mjs`
- `prototypes/app-startup-electron-mock/tests/launcher-contract.test.mjs`
- `prototypes/app-startup-electron-mock/tests/fixtures/fake-app-server.mjs`
- `prototypes/app-startup-electron-mock/tests/electron-smoke.test.mjs`

---

### Task 1: Lock the mock package and fixture-content contract

**Files:**
- Create: `prototypes/app-startup-electron-mock/package.json`
- Create: `prototypes/app-startup-electron-mock/package-lock.json`
- Create: `prototypes/app-startup-electron-mock/content/onboarding.fixture.json`
- Create: `prototypes/app-startup-electron-mock/src/shared/content-schema.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/content-schema.test.mjs`

**Interfaces:**
- Consumes: no earlier task.
- Produces: `parseOnboardingContent(input): OnboardingContent`.
- Produces: `ContentValidationError extends Error` with `issues: string[]`.
- Produces: a fixture with `schemaVersion: 1`, `contentKind: "fixture"`, `contentOwner: "Duy mock fixture"`, and supported field types `shortText | singleChoice | multipleChoice`.

- [ ] **Step 1: Create the pinned package manifest**

Create:

```json
{
  "name": "course-app-startup-electron-mock",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/main/main.mjs",
  "engines": {
    "node": ">=22"
  },
  "scripts": {
    "start": "electron .",
    "test:unit": "node --test tests/content-schema.test.mjs tests/setup-detection.test.mjs tests/setup-store.test.mjs tests/app-server-client.test.mjs tests/auth-service.test.mjs tests/window-policy.test.mjs tests/onboarding-state.test.mjs tests/ipc-contract.test.mjs tests/launcher-contract.test.mjs",
    "test:smoke": "node --test tests/electron-smoke.test.mjs",
    "test": "npm run test:unit && npm run test:smoke",
    "check": "npm test"
  },
  "devDependencies": {
    "electron": "43.2.0",
    "playwright": "1.62.0"
  }
}
```

- [ ] **Step 2: Generate the lockfile**

Run from `prototypes/app-startup-electron-mock`:

```powershell
npm install --package-lock-only
```

Expected: exit `0`; `package-lock.json` pins Electron `43.2.0` and Playwright `1.62.0`.

- [ ] **Step 3: Write failing content-contract tests**

Create tests covering one valid fixture and credential-like or ambiguous inputs:

```js
import test from "node:test";
import assert from "node:assert/strict";

import {
  ContentValidationError,
  parseOnboardingContent,
} from "../src/shared/content-schema.mjs";

const validFixture = {
  schemaVersion: 1,
  contentKind: "fixture",
  contentOwner: "Duy mock fixture",
  title: "Sample teaching setup",
  notice: "Fixture content for testing the setup mechanism.",
  fields: [{
    id: "sample-goal",
    type: "shortText",
    label: "Sample question",
    required: true,
  }],
};

test("accepts the versioned Duy-owned fixture contract", () => {
  assert.deepEqual(parseOnboardingContent(validFixture), validFixture);
});

test("rejects production-looking content and unsupported fields", () => {
  assert.throws(
    () => parseOnboardingContent({
      ...validFixture,
      contentKind: "production",
      fields: [{ id: "secret", type: "password", label: "API key", required: true }],
    }),
    ContentValidationError,
  );
});
```

- [ ] **Step 4: Run the test and observe failure**

Run:

```powershell
node --test tests/content-schema.test.mjs
```

Expected: FAIL because `src/shared/content-schema.mjs` does not exist.

- [ ] **Step 5: Implement the minimal strict parser**

Implement `parseOnboardingContent` with these exact rules:

```js
const FIELD_TYPES = new Set(["shortText", "singleChoice", "multipleChoice"]);
const SAFE_ID = /^[a-z][a-z0-9-]*$/;

export class ContentValidationError extends Error {
  constructor(issues) {
    super(`Invalid onboarding fixture: ${issues.join("; ")}`);
    this.name = "ContentValidationError";
    this.issues = issues;
  }
}

export function parseOnboardingContent(input) {
  const issues = [];
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new ContentValidationError(["content must be an object"]);
  }
  if (input.schemaVersion !== 1) issues.push("schemaVersion must equal 1");
  if (input.contentKind !== "fixture") issues.push("contentKind must equal fixture");
  if (input.contentOwner !== "Duy mock fixture") {
    issues.push("contentOwner must identify Duy mock fixture");
  }
  if (typeof input.title !== "string" || input.title.trim() === "") {
    issues.push("title is required");
  }
  if (typeof input.notice !== "string" || !/fixture/i.test(input.notice)) {
    issues.push("notice must identify fixture content");
  }
  if (!Array.isArray(input.fields) || input.fields.length === 0) {
    issues.push("fields must contain at least one item");
  } else {
    const ids = new Set();
    for (const field of input.fields) {
      if (!field || typeof field !== "object") {
        issues.push("every field must be an object");
        continue;
      }
      if (!SAFE_ID.test(field.id ?? "")) issues.push("field id is invalid");
      if (ids.has(field.id)) issues.push(`duplicate field id: ${field.id}`);
      ids.add(field.id);
      if (!FIELD_TYPES.has(field.type)) issues.push(`unsupported field type: ${field.type}`);
      if (typeof field.label !== "string" || field.label.trim() === "") {
        issues.push(`field label is required: ${field.id ?? "unknown"}`);
      }
      if (typeof field.required !== "boolean") {
        issues.push(`field required must be boolean: ${field.id ?? "unknown"}`);
      }
      if (field.type !== "shortText") {
        if (!Array.isArray(field.options) || field.options.length < 2) {
          issues.push(`choice field needs at least two options: ${field.id ?? "unknown"}`);
        }
      }
    }
  }
  if (issues.length > 0) throw new ContentValidationError(issues);
  return structuredClone(input);
}
```

- [ ] **Step 6: Add a clearly labeled fixture**

Create three neutral mechanism-only fields: one `shortText`, one
`singleChoice`, and one `multipleChoice`. Every learner-facing heading must
include either `Sample` or `Fixture`, and the notice must say:

```text
Fixture content for testing Duy's setup mechanism. Triết owns the final onboarding content.
```

- [ ] **Step 7: Run tests**

Run:

```powershell
npm run test:unit
```

Expected: content tests PASS; the command may report missing later-task test files. Until Task 8 creates every listed test, use:

```powershell
node --test tests/content-schema.test.mjs
```

Expected: all content-schema tests PASS.

- [ ] **Step 8: Commit**

```powershell
git add prototypes/app-startup-electron-mock/package.json prototypes/app-startup-electron-mock/package-lock.json prototypes/app-startup-electron-mock/content/onboarding.fixture.json prototypes/app-startup-electron-mock/src/shared/content-schema.mjs prototypes/app-startup-electron-mock/tests/content-schema.test.mjs
git commit -m "feat: define startup mock fixture contract"
```

---

### Task 2: Build the permission-gated setup planner

**Files:**
- Create: `scripts/setup-core.mjs`
- Create: `scripts/setup-and-start.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/setup-detection.test.mjs`

**Interfaces:**
- Consumes: mock directory and lockfile from Task 1.
- Produces: `detectSetup(deps): Promise<SetupReport>`.
- Produces: `buildInstallPlan(report): InstallAction[]`.
- Produces: `formatInstallPlan(actions): string`.
- Produces: `executeInstallPlan(actions, deps): Promise<void>`.
- Produces: `packageLockFingerprint(lockPath): Promise<string>`.
- Produces: install actions shaped `{ id, reason, scope, command, args, cwd? }`.

- [ ] **Step 1: Write failing detection and permission tests**

Cover:

```js
test("plans Codex and project installs without executing them", async () => {
  const calls = [];
  const report = await detectSetup(fakeDeps({
    nodeMajor: 24,
    npmAvailable: true,
    codexAvailable: false,
    appServerAvailable: false,
    lockMatches: false,
    calls,
  }));

  const plan = buildInstallPlan(report);
  assert.deepEqual(plan.map((item) => item.id), ["codex-cli", "project-packages"]);
  assert.deepEqual(calls, []);
});

test("decline executes no installation command", async () => {
  const calls = [];
  await assert.rejects(
    executeInstallPlan([{ id: "codex-cli", command: "npm", args: ["install"] }], {
      confirm: async () => false,
      run: async (...args) => calls.push(args),
    }),
    { code: "INSTALL_DECLINED" },
  );
  assert.deepEqual(calls, []);
});
```

Also test Node below 22, missing npm, compatible Codex, lock match, lock mismatch,
and command failure naming the action ID.

- [ ] **Step 2: Run the test and observe failure**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/setup-detection.test.mjs
```

Expected: FAIL because `scripts/setup-core.mjs` does not exist.

- [ ] **Step 3: Implement pure detection and plan construction**

Use injected dependencies only:

```js
export async function detectSetup({
  platform,
  nodeVersion,
  commandExists,
  commandSucceeds,
  fileExists,
  lockPath,
  stampPath,
  electronRuntimePath,
  readFile,
}) { /* return booleans and exact paths; run no installer */ }

export function buildInstallPlan(report) {
  const actions = [];
  if (!report.codexAvailable || !report.appServerAvailable) {
    actions.push({
      id: "codex-cli",
      reason: "Codex App Server is required for managed ChatGPT login.",
      scope: "user-level global npm package",
      command: "npm",
      args: ["install", "-g", "@openai/codex@latest"],
    });
  }
  if (!report.lockMatches || !report.electronRuntimeAvailable) {
    actions.push({
      id: "project-packages",
      reason: "The Electron mock dependencies must match package-lock.json.",
      scope: "project-local node_modules",
      command: "npm",
      args: ["ci"],
      cwd: report.mockRoot,
    });
    actions.push({
      id: "electron-runtime",
      reason: "The pinned native Electron runtime must be available.",
      scope: "project-local Electron cache",
      command: "npx",
      args: ["--no-install", "install-electron", "--no"],
      cwd: report.mockRoot,
    });
  }
  return actions;
}
```

Node installation remains in `start-course.cmd`, because this module cannot
run until Node exists.

- [ ] **Step 4: Implement one-plan permission and execution**

`executeInstallPlan` must:

1. format every action before confirmation;
2. call `confirm(formattedPlan)` exactly once;
3. throw an error with `code = "INSTALL_DECLINED"` on decline;
4. call injected `run` sequentially only after approval;
5. stop on the first failure and attach `actionId`;
6. write the new lock fingerprint only after both `npm ci` and the explicit
   Electron runtime installation succeed.

- [ ] **Step 5: Implement the terminal entry point**

`setup-and-start.mjs` must resolve paths relative to `import.meta.url`, create
real adapters for command detection, process execution, readline confirmation,
and file hashing, then:

```js
const report = await detectSetup(deps);
const plan = buildInstallPlan(report);
if (plan.length > 0) await executeInstallPlan(plan, deps);
const finalReport = await detectSetup(deps);
await launchElectron({
  mockRoot,
  disconnected: !finalReport.codexAvailable || !finalReport.appServerAvailable,
});
```

`launchElectron` must execute `npm start` with `cwd: mockRoot`, inherit stdio,
and return the child exit code. Re-running detection after installation ensures
the Electron state reflects what was actually installed rather than the stale
pre-install report.

Sanitize errors to layer plus recovery command. Do not print environment
variables or child-process command output that may contain secrets.

- [ ] **Step 6: Run tests**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/setup-detection.test.mjs
```

Expected: all setup-detection tests PASS.

- [ ] **Step 7: Commit**

```powershell
git add scripts/setup-core.mjs scripts/setup-and-start.mjs prototypes/app-startup-electron-mock/tests/setup-detection.test.mjs
git commit -m "feat: add permission-gated setup planner"
```

---

### Task 3: Persist only validated non-secret setup state

**Files:**
- Create: `prototypes/app-startup-electron-mock/src/shared/setup-state-schema.mjs`
- Create: `prototypes/app-startup-electron-mock/src/main/setup-store.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/setup-store.test.mjs`

**Interfaces:**
- Consumes: none beyond Node filesystem adapters.
- Produces: `createDefaultSetupState(clock): SetupState`.
- Produces: `parseSetupState(input): SetupState`.
- Produces: `createSetupStore({ userDataPath, fs, clock }): { read, write, reset }`.
- State keys are exactly `schemaVersion`, `setupCompleted`, `codexConnected`, `onboardingResponses`, and `updatedAt`.

- [ ] **Step 1: Write failing schema and store tests**

Required cases:

```js
test("rejects credential-shaped fields recursively", () => {
  assert.throws(() => parseSetupState({
    ...validState,
    onboardingResponses: { accessToken: "secret" },
  }), /credential-shaped field/i);
});

test("quarantines corrupt JSON and returns defaults", async () => {
  await fs.writeFile(statePath, "{broken");
  const state = await store.read();
  assert.equal(state.setupCompleted, false);
  assert.equal((await fs.readdir(userDataPath)).some((name) =>
    name.startsWith("setup-state.corrupt-")
  ), true);
});
```

Also test atomic temp-write/rename, valid resume, unknown top-level rejection,
and `codexConnected` preservation as a boolean only.

- [ ] **Step 2: Run the test and observe failure**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/setup-store.test.mjs
```

Expected: FAIL because the schema and store do not exist.

- [ ] **Step 3: Implement strict state parsing**

Use a recursive forbidden-key check with case-insensitive patterns:

```js
const FORBIDDEN_KEY =
  /^(access.?token|refresh.?token|api.?key|authorization|auth.?url|environment|env)$/i;
const TOP_LEVEL = new Set([
  "schemaVersion",
  "setupCompleted",
  "codexConnected",
  "onboardingResponses",
  "updatedAt",
]);
```

Require schema version `1`, booleans for the two flags, a plain object for
responses, and an ISO timestamp. Return a deep clone.

- [ ] **Step 4: Implement atomic storage and quarantine**

Write to `setup-state.json.tmp`, flush/close, then rename to
`setup-state.json`. On invalid JSON or schema:

1. rename the original to `setup-state.corrupt-<filesystem-safe timestamp>.json`;
2. return defaults;
3. return a non-secret recovery notice alongside the state or expose it through
   a `lastRecovery` property.

- [ ] **Step 5: Run tests**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/setup-store.test.mjs
```

Expected: all setup-store tests PASS.

- [ ] **Step 6: Commit**

```powershell
git add prototypes/app-startup-electron-mock/src/shared/setup-state-schema.mjs prototypes/app-startup-electron-mock/src/main/setup-store.mjs prototypes/app-startup-electron-mock/tests/setup-store.test.mjs
git commit -m "feat: add safe setup state persistence"
```

---

### Task 4: Implement the Codex App Server JSONL client

**Files:**
- Create: `prototypes/app-startup-electron-mock/src/main/codex-app-server-client.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/app-server-client.test.mjs`

**Interfaces:**
- Consumes: injected `spawn(command, args, options)` and a logger with
  `info(event, safeFields)` and `error(event, safeFields)`.
- Produces: `CodexAppServerClient`.
- Methods: `start()`, `request(method, params)`, `notify(method, params)`,
  `onNotification(listener)`, `stop()`, and `restart()`.
- `start()` performs `initialize`, `initialized`, then resolves.

- [ ] **Step 1: Write a controllable fake process in the unit test**

Use `PassThrough` streams and an `EventEmitter`:

```js
function createFakeProcess() {
  const stdout = new PassThrough();
  const stdin = new PassThrough();
  const proc = new EventEmitter();
  Object.assign(proc, { stdout, stdin, stderr: new PassThrough(), kill: () => proc.emit("exit", 0) });
  return proc;
}
```

Test that no `account/read` request can be sent before initialization, request
IDs correlate out-of-order responses, notifications reach listeners, malformed
JSON produces a sanitized protocol error, and exit rejects every pending
request.

- [ ] **Step 2: Run the test and observe failure**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/app-server-client.test.mjs
```

Expected: FAIL because `CodexAppServerClient` does not exist.

- [ ] **Step 3: Implement line parsing and request correlation**

Core state:

```js
class CodexAppServerClient {
  #nextId = 1;
  #pending = new Map();
  #listeners = new Set();
  #process = null;
  #initialized = false;
}
```

Every stdout line is parsed once. A message with `id` resolves/rejects the
matching pending request. A message with `method` and no `id` is a notification.
Logs include only method, ID, success/failure category, and process status.

- [ ] **Step 4: Implement initialization**

`start()` spawns exactly:

```js
spawn("codex", ["app-server"], {
  stdio: ["pipe", "pipe", "pipe"],
  windowsHide: true,
});
```

Then send:

```js
await rawRequest("initialize", {
  clientInfo: {
    name: "content_builder_academy_startup_mock",
    title: "Content Builder Academy Startup Mock",
    version: "0.1.0",
  },
});
rawNotify("initialized", {});
this.#initialized = true;
```

Public `request()` rejects until initialization is true.

- [ ] **Step 5: Implement stop and restart**

`stop()` rejects pending requests with code `APP_SERVER_STOPPED`, ends stdin,
kills the child only if still running, and clears listeners only on final app
shutdown. `restart()` preserves notification listeners, replaces the process,
and repeats initialization.

- [ ] **Step 6: Run tests**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/app-server-client.test.mjs
```

Expected: all App Server client tests PASS.

- [ ] **Step 7: Commit**

```powershell
git add prototypes/app-startup-electron-mock/src/main/codex-app-server-client.mjs prototypes/app-startup-electron-mock/tests/app-server-client.test.mjs
git commit -m "feat: add Codex App Server client"
```

---

### Task 5: Add managed ChatGPT authentication orchestration

**Files:**
- Create: `prototypes/app-startup-electron-mock/src/main/auth-service.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/auth-service.test.mjs`

**Interfaces:**
- Consumes: initialized `CodexAppServerClient`.
- Consumes: injected `openExternal(url)`.
- Produces: `isAllowedAuthUrl(value): boolean`.
- Produces: `toDisplayAccount(result): DisplayAccount`.
- Produces: `createAuthService({ client, openExternal }): AuthService`.
- Methods: `readAccount()`, `startBrowserLogin()`, `startDeviceLogin()`,
  `cancelLogin()`, `onStatus(listener)`, and `dispose()`.

- [ ] **Step 1: Write failing URL and redaction tests**

Exact URL expectations:

```js
assert.equal(isAllowedAuthUrl("https://chatgpt.com/auth"), true);
assert.equal(isAllowedAuthUrl("https://login.chatgpt.com/auth"), true);
assert.equal(isAllowedAuthUrl("https://auth.openai.com/codex/device"), true);
assert.equal(isAllowedAuthUrl("http://chatgpt.com/auth"), false);
assert.equal(isAllowedAuthUrl("https://chatgpt.com.evil.example/auth"), false);
assert.equal(isAllowedAuthUrl("file:///C:/secret"), false);
```

`toDisplayAccount` must retain only:

```js
{
  connected,
  accountType,
  email,
  planType,
  requiresOpenaiAuth,
}
```

Inject access tokens and extra fields in the test input and assert they are
absent from output JSON.

- [ ] **Step 2: Write failing managed-login tests**

Assert exact requests:

```js
await client.request("account/read", { refreshToken: false });
await client.request("account/login/start", {
  type: "chatgpt",
  useHostedLoginSuccessPage: true,
  appBrand: "chatgpt",
});
```

Test that login start returns immediately with a display-safe `loginId`, a
matching completion triggers `account/read` and a sanitized status listener,
an unrelated completion is ignored, failure is sanitized, device-code results
contain only `loginId`, validated `verificationUrl`, and `userCode`, and
`account/login/cancel` receives the active ID.

- [ ] **Step 3: Run tests and observe failure**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/auth-service.test.mjs
```

Expected: FAIL because `auth-service.mjs` does not exist.

- [ ] **Step 4: Implement URL validation and display-safe mapping**

Use `new URL(value)` and require:

```js
url.protocol === "https:" &&
(
  url.hostname === "chatgpt.com" ||
  url.hostname.endsWith(".chatgpt.com") ||
  url.hostname === "auth.openai.com" ||
  url.hostname.endsWith(".auth.openai.com")
)
```

Return `false` on parsing errors.

- [ ] **Step 5: Implement login lifecycle**

Store one active `{ loginId, mode }` and a set of status listeners. Subscribe
to client notifications. `startBrowserLogin()` validates and opens `authUrl`
but returns `{ loginId, status: "waitingForCallback" }` immediately, without
returning the URL. `startDeviceLogin()` returns only `loginId`,
`verificationUrl`, `userCode`, and `status: "deviceCode"`.

On `account/login/completed`:

- ignore a different `loginId`;
- on success, call `account/read` and notify listeners with only the
  display-safe account object;
- on error, notify listeners with code `LOGIN_FAILED` and a sanitized message;
- clear active login exactly once.

`cancelLogin()` sends the cancellation request, clears the matching active
login, and notifies listeners with a sanitized cancelled state. `dispose()`
unsubscribes from App Server notifications and clears status listeners.

- [ ] **Step 6: Run tests**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/auth-service.test.mjs
```

Expected: all auth-service tests PASS.

- [ ] **Step 7: Commit**

```powershell
git add prototypes/app-startup-electron-mock/src/main/auth-service.mjs prototypes/app-startup-electron-mock/tests/auth-service.test.mjs
git commit -m "feat: add managed Codex authentication"
```

---

### Task 6: Enforce the Electron window and IPC security boundary

**Files:**
- Create: `prototypes/app-startup-electron-mock/src/shared/channels.mjs`
- Create: `prototypes/app-startup-electron-mock/src/main/window-policy.mjs`
- Create: `prototypes/app-startup-electron-mock/src/main/ipc-handlers.mjs`
- Create: `prototypes/app-startup-electron-mock/src/preload/preload.cjs`
- Create: `prototypes/app-startup-electron-mock/tests/window-policy.test.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/ipc-contract.test.mjs`

**Interfaces:**
- Consumes: content parser, setup store, and auth service from Tasks 1, 3, and 5.
- Produces: frozen `CHANNELS`.
- Produces: `createWindowOptions({ preloadPath }): BrowserWindowConstructorOptions`.
- Produces: `installWindowPolicy(window, { openExternal }): void`.
- Produces: `registerIpcHandlers({ ipcMain, auth, store, content }): () => void`.
- Produces renderer global `window.courseSetup` with no generic transport.

- [ ] **Step 1: Write failing window-policy tests**

Assert:

```js
assert.deepEqual(options.webPreferences, {
  preload: preloadPath,
  nodeIntegration: false,
  contextIsolation: true,
  sandbox: true,
});
```

Use fake `webContents` hooks to assert in-app navigation outside the packaged
renderer is prevented, new windows are denied, and only `isAllowedAuthUrl`
values reach `openExternal`.

- [ ] **Step 2: Write failing IPC contract tests**

The exact channels are:

```js
export const CHANNELS = Object.freeze({
  GET_STATUS: "setup:get-status",
  START_BROWSER_LOGIN: "auth:start-browser-login",
  START_DEVICE_LOGIN: "auth:start-device-login",
  CANCEL_LOGIN: "auth:cancel-login",
  RETRY_APP_SERVER: "auth:retry-app-server",
  AUTH_STATUS_CHANGED: "auth:status-changed",
  GET_CONTENT: "setup:get-content",
  SAVE_RESPONSES: "setup:save-responses",
  REOPEN_SETUP: "setup:reopen",
});
```

Assert the preload source exposes only named methods and contains no
`ipcRenderer.send`, no channel parameter supplied by the renderer, and no
filesystem/process API. Assert the status subscription uses only the fixed
`AUTH_STATUS_CHANGED` channel, removes the exact wrapped listener, and never
forwards Electron's event object to the renderer.

- [ ] **Step 3: Run tests and observe failure**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/window-policy.test.mjs prototypes/app-startup-electron-mock/tests/ipc-contract.test.mjs
```

Expected: FAIL because the boundary modules do not exist.

- [ ] **Step 4: Implement channels and window policy**

`createWindowOptions` also sets a fixed initial size, a minimum size, and
`show: false`; it does not add permissions. `installWindowPolicy` denies
`will-navigate` except the current packaged file URL and returns
`{ action: "deny" }` from `setWindowOpenHandler`.

- [ ] **Step 5: Implement narrow IPC handlers**

Handlers:

- map auth output through display-safe objects;
- parse content before returning it;
- parse responses and setup state before writing;
- update `setupCompleted`, `onboardingResponses`, and `updatedAt`;
- never return paths, raw errors, raw App Server messages, or child output;
- return errors shaped `{ code, message, recoveryAction? }`.

Return an unregister function that removes exactly the registered handlers.

- [ ] **Step 6: Implement preload**

Use CommonJS because Electron 43 runs sandboxed preloads as plain JavaScript
without ESM imports. Inline the fixed channel constants and verify them against
`channels.mjs`; do not require local modules.

Expose:

```js
contextBridge.exposeInMainWorld("courseSetup", Object.freeze({
  getStatus: () => ipcRenderer.invoke(CHANNELS.GET_STATUS),
  startBrowserLogin: () => ipcRenderer.invoke(CHANNELS.START_BROWSER_LOGIN),
  startDeviceLogin: () => ipcRenderer.invoke(CHANNELS.START_DEVICE_LOGIN),
  cancelLogin: (loginId) => ipcRenderer.invoke(CHANNELS.CANCEL_LOGIN, { loginId }),
  retryAppServer: () => ipcRenderer.invoke(CHANNELS.RETRY_APP_SERVER),
  onAuthStatusChanged: (listener) => {
    const wrapped = (_event, status) => listener(status);
    ipcRenderer.on(CHANNELS.AUTH_STATUS_CHANGED, wrapped);
    return () => ipcRenderer.removeListener(CHANNELS.AUTH_STATUS_CHANGED, wrapped);
  },
  getContent: () => ipcRenderer.invoke(CHANNELS.GET_CONTENT),
  saveResponses: (responses) => ipcRenderer.invoke(CHANNELS.SAVE_RESPONSES, { responses }),
  reopenSetup: () => ipcRenderer.invoke(CHANNELS.REOPEN_SETUP),
}));
```

- [ ] **Step 7: Run tests**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/window-policy.test.mjs prototypes/app-startup-electron-mock/tests/ipc-contract.test.mjs
```

Expected: all window-policy and IPC-contract tests PASS.

- [ ] **Step 8: Commit**

```powershell
git add prototypes/app-startup-electron-mock/src/shared/channels.mjs prototypes/app-startup-electron-mock/src/main/window-policy.mjs prototypes/app-startup-electron-mock/src/main/ipc-handlers.mjs prototypes/app-startup-electron-mock/src/preload/preload.cjs prototypes/app-startup-electron-mock/tests/window-policy.test.mjs prototypes/app-startup-electron-mock/tests/ipc-contract.test.mjs
git commit -m "feat: secure Electron startup boundary"
```

---

### Task 7: Build and test the first-run renderer state machine

**Files:**
- Create: `prototypes/app-startup-electron-mock/src/renderer/onboarding-state.mjs`
- Create: `prototypes/app-startup-electron-mock/src/renderer/index.html`
- Create: `prototypes/app-startup-electron-mock/src/renderer/app.js`
- Create: `prototypes/app-startup-electron-mock/src/renderer/styles.css`
- Create: `prototypes/app-startup-electron-mock/tests/onboarding-state.test.mjs`

**Interfaces:**
- Consumes: `window.courseSetup` from Task 6.
- Produces: `createInitialOnboardingState()`.
- Produces: `reduceOnboarding(state, event): OnboardingState`.
- Produces screens `checking | connect | teachingSetup | complete`.
- Produces connection states `checking | disconnected | signedOut | openingBrowser | waitingForCallback | deviceCode | cancelled | failed | connected`.

- [ ] **Step 1: Write failing reducer tests**

Cover exact transitions:

```js
state = reduceOnboarding(state, { type: "STATUS_LOADED", connected: false });
assert.equal(state.screen, "connect");
assert.equal(state.connection, "signedOut");

state = reduceOnboarding(state, { type: "BROWSER_LOGIN_STARTED", loginId: "login-1" });
assert.equal(state.connection, "waitingForCallback");

state = reduceOnboarding(state, { type: "LOGIN_SUCCEEDED", account: displayAccount });
assert.equal(state.screen, "teachingSetup");
assert.equal(state.connection, "connected");
```

Also test disconnected retry, device code, cancellation, login failure, required
form validation, setup completion, reopening, and preservation of entered
responses when moving backward.

- [ ] **Step 2: Run tests and observe failure**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/onboarding-state.test.mjs
```

Expected: FAIL because `onboarding-state.mjs` does not exist.

- [ ] **Step 3: Implement the pure reducer**

Use frozen initial objects and immutable updates. Unknown event types must
return the unchanged state. Reducer errors must not contain raw IPC payloads.

- [ ] **Step 4: Create semantic HTML**

Required elements:

- `<main id="app" aria-live="polite">`;
- progress indicator with four named steps;
- fixture badge always visible on the teaching screen;
- connection status with text, not color alone;
- buttons for connect, device fallback, cancel, retry, back, continue, and
  reopen;
- form labels associated with every input;
- a setup-complete summary;
- a clearly labeled `Continue to mock app` destination.

Do not invent production Course App copy.

- [ ] **Step 5: Implement renderer orchestration**

`app.js`:

1. creates reducer state;
2. calls `getStatus` on load;
3. subscribes through `onAuthStatusChanged` and unregisters on unload;
4. calls only named `courseSetup` methods;
5. renders from state;
6. validates the versioned fixture;
7. collects only declared field IDs;
8. saves responses;
9. shows sanitized errors and recovery actions.

No renderer import may reference `node:*`, `electron`, or filesystem paths.

- [ ] **Step 6: Add minimal accessible styling**

Use CSS custom properties, a maximum readable width, visible focus, reduced
motion support, 44px minimum primary controls, and status styles that combine
icon/shape with text. Keep the visual language neutral because Triết owns the
production Course App UI.

- [ ] **Step 7: Run reducer tests**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/onboarding-state.test.mjs
```

Expected: all onboarding-state tests PASS.

- [ ] **Step 8: Commit**

```powershell
git add prototypes/app-startup-electron-mock/src/renderer/onboarding-state.mjs prototypes/app-startup-electron-mock/src/renderer/index.html prototypes/app-startup-electron-mock/src/renderer/app.js prototypes/app-startup-electron-mock/src/renderer/styles.css prototypes/app-startup-electron-mock/tests/onboarding-state.test.mjs
git commit -m "feat: add Electron first-run interface"
```

---

### Task 8: Compose the Electron main process

**Files:**
- Create: `prototypes/app-startup-electron-mock/src/main/main.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/main/ipc-handlers.mjs`
- Test: existing unit tests from Tasks 3–7.

**Interfaces:**
- Consumes: all main/shared modules from prior tasks.
- Produces: one Electron application lifecycle.
- Supports test-only environment variables only when
  `NODE_ENV === "test" && !app.isPackaged`:
  `COURSE_MOCK_APP_SERVER_FIXTURE`, `COURSE_MOCK_USER_DATA_DIR`, and
  `COURSE_MOCK_FORCE_DISCONNECTED`.

- [ ] **Step 1: Add a failing composition test to `ipc-contract.test.mjs`**

Read `main.mjs` as text and assert it:

- imports the window policy, store, App Server client, auth service, content
  parser, and IPC registration;
- passes `app.getPath("userData")` to the store in normal mode;
- calls `client.stop()` on `before-quit`;
- contains the strict test-hook guard;
- never reads `.codex/auth.json`.

- [ ] **Step 2: Run the test and observe failure**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/ipc-contract.test.mjs
```

Expected: FAIL because `main.mjs` does not exist.

- [ ] **Step 3: Implement lifecycle composition**

On `app.whenReady()`:

1. read and parse packaged fixture JSON;
2. create the setup store;
3. create/start App Server client;
4. create auth service;
5. register IPC;
6. create BrowserWindow using `createWindowOptions`;
7. forward `auth.onStatus` through the fixed
   `CHANNELS.AUTH_STATUS_CHANGED` channel only after mapping to a display-safe
   object;
8. install navigation policy;
9. load `src/renderer/index.html`;
10. show on `ready-to-show`.

If App Server fails, still create the window and expose disconnected status.
Under the strict test-hook guard, `COURSE_MOCK_FORCE_DISCONNECTED=1` skips
starting the App Server and injects the same disconnected status. Ignore this
variable in packaged builds and whenever `NODE_ENV !== "test"`.

- [ ] **Step 4: Implement shutdown**

On `before-quit`, mark shutdown expected, unregister IPC, remove the auth
status forwarder, dispose auth listeners, and await `client.stop()` with a
bounded timeout. Do not render expected shutdown as a failure.

- [ ] **Step 5: Implement Windows single-instance behavior**

Use `app.requestSingleInstanceLock()`. A second launch focuses the existing
window. Release resources normally on final quit.

- [ ] **Step 6: Run all available unit tests**

Run:

```powershell
npm run test:unit
```

Expected: every unit test created through Task 8 PASS.

- [ ] **Step 7: Launch locally with disconnected Codex**

Run:

```powershell
$env:COURSE_MOCK_FORCE_DISCONNECTED='1'
npm start
```

Expected: Electron opens the Checking setup screen and transitions to an
actionable disconnected state. Remove the environment variable after the
check. This test flag must be honored only in un-packaged development mode.

- [ ] **Step 8: Commit**

```powershell
git add prototypes/app-startup-electron-mock/src/main/main.mjs prototypes/app-startup-electron-mock/src/main/ipc-handlers.mjs prototypes/app-startup-electron-mock/tests/ipc-contract.test.mjs
git commit -m "feat: compose Electron startup application"
```

---

### Task 9: Add the fake App Server and Electron smoke test

**Files:**
- Create: `prototypes/app-startup-electron-mock/tests/fixtures/fake-app-server.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/electron-smoke.test.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/main/main.mjs`

**Interfaces:**
- Consumes: test-only hooks from Task 8.
- Produces: a JSONL fake supporting `initialize`, `account/read`,
  `account/login/start`, `account/login/cancel`, and notifications.
- Produces: one full Playwright Electron smoke flow with an isolated temp
  user-data directory.

- [ ] **Step 1: Write the fake App Server**

The fixture reads stdin line by line and:

- returns an initialization result;
- starts signed out;
- returns a safe ChatGPT account after browser-login start;
- emits matching `account/login/completed` and `account/updated`;
- supports device-code output;
- never accesses network or real Codex state.

Use deterministic IDs such as `login-fixture-1`.

- [ ] **Step 2: Write the failing smoke test**

Use:

```js
import { _electron as electron } from "playwright";

const electronApp = await electron.launch({
  args: [mockRoot],
  env: {
    ...process.env,
    NODE_ENV: "test",
    COURSE_MOCK_APP_SERVER_FIXTURE: fakeServerPath,
    COURSE_MOCK_USER_DATA_DIR: userDataPath,
  },
});
```

Drive:

```text
Checking setup
→ Connect Codex
→ waiting state
→ connected
→ fixture badge
→ required response
→ Setup complete
```

Close, relaunch with the same user-data directory, and assert setup progress
resumes while account state is re-read.

- [ ] **Step 3: Run the smoke test and observe failure**

Run:

```powershell
npm run test:smoke
```

Expected: FAIL until `main.mjs` can spawn the fixture under the strict test
guard and the renderer exposes stable accessible names.

- [ ] **Step 4: Add the minimal guarded fixture spawn**

When and only when:

```js
process.env.NODE_ENV === "test" &&
!app.isPackaged &&
process.env.COURSE_MOCK_APP_SERVER_FIXTURE
```

spawn `process.execPath` with the fixture path and add
`ELECTRON_RUN_AS_NODE=1` to that child process only. In every other case spawn
`codex app-server`. This keeps the smoke test independent of a separately
installed Node executable while ensuring the Electron binary runs the fixture
as plain Node.

- [ ] **Step 5: Run smoke and full tests**

Run:

```powershell
npm run test:smoke
npm test
```

Expected: smoke PASS, then all unit and smoke tests PASS.

- [ ] **Step 6: Commit**

```powershell
git add prototypes/app-startup-electron-mock/tests/fixtures/fake-app-server.mjs prototypes/app-startup-electron-mock/tests/electron-smoke.test.mjs prototypes/app-startup-electron-mock/src/main/main.mjs
git commit -m "test: cover Electron startup flow"
```

---

### Task 10: Add the safe root launcher

**Files:**
- Create: `start-course.cmd`
- Create: `prototypes/app-startup-electron-mock/tests/launcher-contract.test.mjs`
- Modify: `scripts/setup-and-start.mjs`

**Interfaces:**
- Consumes: setup orchestrator from Task 2.
- Produces: learner command `.\start-course.cmd`.
- Exit codes: `0` success, `2` permission declined or manual prerequisite
  required, `3` prerequisite installation failed, `4` project setup failed,
  `5` Electron exited unexpectedly.

- [ ] **Step 1: Write failing launcher-contract tests**

Read `start-course.cmd` as text and assert:

```js
assert.doesNotMatch(source, /ExecutionPolicy|Bypass/i);
assert.match(source, /OpenJS\.NodeJS\.LTS/);
assert.match(source, /winget/);
assert.match(source, /setup-and-start\.mjs/);
assert.match(source, /process\.versions\.node/);
assert.match(source, /set \/p/i);
```

Also assert it does not contain ChatGPT, tokens, API keys, or teaching
questions.

- [ ] **Step 2: Run the test and observe failure**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/launcher-contract.test.mjs
```

Expected: FAIL because `start-course.cmd` does not exist.

- [ ] **Step 3: Implement the minimal batch bootstrap**

The script must:

1. use `%~dp0` for repository-root resolution;
2. locate `node`;
3. run a Node-major check for `>=22`;
4. if missing/incompatible, check `winget` availability and show:

```text
Required: Node.js 22 or newer
Command: winget install --id OpenJS.NodeJS.LTS
Scope: system application
```

5. if `winget` is absent, show the official manual Node.js installation URL
   and command, run no installer, and exit `2`;
6. require `Y` or `Yes` before running `winget`;
7. use `%ProgramFiles%\nodejs\node.exe` after a successful install if PATH has
   not refreshed;
8. call `scripts\setup-and-start.mjs`;
9. map its exit code to the documented exit codes;
10. never change PowerShell execution policy.

- [ ] **Step 4: Test decline without installing**

Run in a subprocess with a test-only PATH that hides Node and `echo N` piped to
the script. If the environment cannot safely hide Node, add a test-only
`COURSE_MOCK_FORCE_NODE_MISSING=1` branch guarded by
`COURSE_MOCK_BOOTSTRAP_TEST=1`.

Expected: exit `2`; output contains the manual Node command; no `winget`
process is started.

- [ ] **Step 5: Run launcher and setup tests**

Run:

```powershell
node --test prototypes/app-startup-electron-mock/tests/launcher-contract.test.mjs prototypes/app-startup-electron-mock/tests/setup-detection.test.mjs
```

Expected: all launcher and setup tests PASS.

- [ ] **Step 6: Run the real launcher with prerequisites present**

Run:

```powershell
.\start-course.cmd
```

Expected: it displays any project-local/Codex install plan, waits for
permission if needed, and launches Electron. Do not approve a system change
unless the displayed plan matches the spec.

- [ ] **Step 7: Commit**

```powershell
git add start-course.cmd scripts/setup-and-start.mjs prototypes/app-startup-electron-mock/tests/launcher-contract.test.mjs
git commit -m "feat: add safe Windows startup command"
```

---

### Task 11: Document, verify, and run the real-authentication checkpoint

**Files:**
- Modify: `README.md`
- Create: `prototypes/app-startup-electron-mock/README.md`

**Interfaces:**
- Consumes: completed mock.
- Produces: accurate learner and collaborator documentation.
- Produces: recorded manual verification evidence without credentials.

- [ ] **Step 1: Add root README instructions**

Add an `Experimental Electron startup mock` section with:

```powershell
git clone https://github.com/DiligentPenguinn/codex-content-creator-course.git
cd codex-content-creator-course
.\start-course.cmd
```

State:

- Windows-first;
- installs only after permission;
- no execution-policy bypass;
- real Codex App Server authentication;
- fixture onboarding content;
- Duy-side prototype entry point pending shared production review.

- [ ] **Step 2: Write the mock README**

Required sections:

- purpose;
- ownership boundary;
- prerequisites;
- how to run;
- what installation may occur;
- implemented behavior;
- simulated fixture behavior;
- explicitly deferred behavior;
- data stored;
- data never stored;
- manual recovery commands;
- tests;
- real-authentication checklist.

Do not claim that Teacher inference, Practice Mode monitoring, tray behavior,
or Triết's onboarding content exists.

- [ ] **Step 3: Run the complete automated verification**

From the mock directory:

```powershell
npm ci
npm run check
```

Expected: install succeeds; every unit and Electron smoke test passes.

- [ ] **Step 4: Run repository formatting and secret scans**

From the repository root:

```powershell
git diff --check
rg -n -i "access[_-]?token|refresh[_-]?token|api[_-]?key|authorization:" start-course.cmd scripts/setup-*.mjs prototypes/app-startup-electron-mock -g '!package-lock.json'
```

Expected: `git diff --check` exits `0`. Secret scan matches only deliberate
forbidden-key tests or documentation statements, never credential values,
credential reads, or storage code.

- [ ] **Step 5: Perform the manual real-authentication check**

On Windows with current Codex CLI:

1. run `.\start-course.cmd`;
2. reach Connect Codex;
3. if already signed in, confirm `account/read` shows display-safe state;
4. if signed out, complete official browser login;
5. verify return to Electron;
6. verify only email/plan/type display fields appear;
7. complete fixture form;
8. close and restart;
9. verify responses resume;
10. verify authentication is re-read.

Record only:

```text
Date:
Windows version:
Node version:
Codex version:
Browser login or existing session:
Restart/resume result:
No credential output observed: yes/no
```

Never paste account email, token, authentication URL, or raw App Server
payload into the repository.

- [ ] **Step 6: Review workload separation**

Compare changed files against both workload documents. Confirm:

- no production onboarding content was authored;
- no Course App UI was changed;
- existing Course Companion files are untouched;
- root launcher is labeled a Duy proposal;
- mock UI is explicitly outside the production Course App.

- [ ] **Step 7: Commit documentation**

```powershell
git add README.md prototypes/app-startup-electron-mock/README.md
git commit -m "docs: explain Electron startup mock"
```

- [ ] **Step 8: Final verification**

Run:

```powershell
git status --short
git log --oneline -11
```

Expected: working tree clean; eleven focused implementation commits appear in
task order.
