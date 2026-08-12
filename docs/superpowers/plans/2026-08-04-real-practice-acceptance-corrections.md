# Real Practice Acceptance Corrections Implementation Plan

> **For implementers:** Execute this plan task-by-task with test-first checkpoints. Use the `executing-plans` skill when implementation begins in a separate session. Do not skip the real Teacher probe or replace it with the fake App Server result.

**Goal:** Repair the three failures found in the real Practice Mode acceptance run: unusable bubble dragging, repetitive returning startup, and opaque Teacher failure/retry behavior.

**Architecture:** Preserve the approved Course/Practice Electron architecture. The main process remains the trust boundary; Codex remains the separate execution application; the compact surface remains a 72 by 72 pixel BrowserWindow; one canonical launcher handles both first and returning runs; and Teacher inference remains an ephemeral, read-only App Server thread receiving only the bounded context envelope and active chat.

**Tech stack:** Node.js 22+ ESM, Electron 43.2.0, Codex App Server JSONL protocol, Node's built-in test runner, Playwright 1.62.0, HTML, CSS, browser JavaScript, and Windows batch. Add no dependency.

**Approved design:** [`../specs/2026-08-04-real-practice-acceptance-corrections-design.md`](../specs/2026-08-04-real-practice-acceptance-corrections-design.md)

## Global constraints

- Work only in `prototypes/app-startup-electron-mock`, the root launcher/setup scripts, the approved design/plan, and `.superpowers/sdd/progress.md`.
- Keep the original Practice design authoritative outside the three approved corrections.
- Do not change the mission fixture or Triết-owned production content.
- Keep the bubble BrowserWindow exactly 72 by 72 pixels and the Teacher button at least 44 by 44 pixels.
- Keep `start-course.cmd` as the single learner-facing command. Do not add a resume launcher.
- First-run setup must remain permission-gated. Returning startup must never suppress a newly required installation or broken prerequisite.
- Treat the installed App Server schema and a bounded real-runtime probe as compatibility evidence. Do not change protocol fields based only on a documentation example.
- Never expose or log raw JSON-RPC errors, payloads, URLs, credentials, environment data, unrestricted transcript content, or hidden reasoning.
- A Teacher diagnostic may contain only an approved operation and category.
- Preserve the exact bound `threadId` and existing redaction, freshness, persistence, and disposal rules.
- Test both English and Vietnamese Teacher messages; language is not a failure category.
- Use test-driven development: add the focused failing assertion, run it and observe the expected failure, then implement the smallest correction.
- Keep commits limited to each task's listed responsibility. Preserve unrelated user changes.

## Safe Teacher failure contract

Use these exact internal values:

```text
operation: thread-start | turn-start | turn-completion
category: timeout | disconnected | boundary-violation | runtime-failure
```

The renderer-visible mapping is:

```text
thread-start + any non-connection category
  → Teacher could not start a response. Retry.

turn-start or turn-completion + runtime-failure
  → Teacher response did not complete. Retry.

any + timeout
  → Teacher is taking too long. Retry your message.

any + disconnected
  → Teacher lost connection. Retry observation or restart Course App.

any + boundary-violation
  → Teacher could not use the current Practice context. Refresh observation and retry.
```

Unknown or malformed errors map to `turn-completion/runtime-failure`; they never
pass through their original message.

---

### Task 1: Add safe Teacher diagnostics and the bounded real probe

**Files:**

- Modify: `prototypes/app-startup-electron-mock/src/main/teacher-adapter.mjs`
- Create: `prototypes/app-startup-electron-mock/scripts/teacher-adapter-probe.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/teacher-adapter.test.mjs`
- Create: `prototypes/app-startup-electron-mock/tests/teacher-probe.test.mjs`
- Modify: `prototypes/app-startup-electron-mock/package.json`

**Interfaces:**

- Produce: `createTeacherFailure(operation, category): Error` with fixed code `TEACHER_ADAPTER_FAILED` and only the two approved public fields.
- Produce: `teacherFailureDetails(error): { operation, category }` with a fixed safe fallback.
- Extend: `createAppServerTeacherAdapter({ ..., onDiagnostic? })`; the optional callback receives only `teacherFailureDetails(error)`.
- Produce: `runTeacherProbe({ client, teacherCwd, output? }): Promise<{ ok, operation?, category? }>`.
- Add package command: `npm run probe:teacher`.

- [ ] **Step 1: Write failing taxonomy tests**

Add table-driven tests that force failure during:

- `thread/start` request and response verification;
- `turn/start` request and response verification;
- terminal completion without an answer;
- timeout;
- forbidden tool item;
- App Server not initialized/exited/stopped;
- malformed unknown exception.

Assert only the approved operation/category pair is observable. Use raw-looking
fixture strings such as `RAW credential protocol URL` and assert they do not
appear in the error, diagnostic callback, or serialized result.

Run:

```powershell
node --test tests/teacher-adapter.test.mjs
```

Expected: FAIL because the adapter currently collapses setup failures and
exposes untyped completion errors.

- [ ] **Step 2: Implement the safe adapter failure boundary**

Replace `setupError()` and free-form completion errors with the fixed contract.
Tag the operation at the call site. Classify only stable client codes as
`disconnected`; classify no-tools rejection as `boundary-violation`; classify
the adapter timer as `timeout`; use `runtime-failure` for every other case.

Call `onDiagnostic` at most once per failed response and wrap the callback so a
diagnostic failure cannot affect adapter behavior. Preserve interrupt,
unsubscribe, late-result rejection, and idempotent disposal.

- [ ] **Step 3: Write the bounded probe and its tests**

The probe must:

1. create a unique empty temporary Teacher directory;
2. start `CodexAppServerClient` with the normal installed `codex app-server`;
3. invoke the production adapter with a minimal synthetic bound-context
   envelope and one non-sensitive message;
4. accept any non-empty bounded Teacher answer as success;
5. emit only `PASS teacher-roundtrip` or
   `FAIL operation=<approved> category=<approved>`;
6. dispose the adapter, stop the client, and remove the verified temporary
   directory in `finally`.

Unit-test the output formatter and cleanup using a fake client. Do not snapshot
an answer, account, model, request, response, path, or raw error.

- [ ] **Step 4: Run fake tests and capture the safe real RED**

From `prototypes/app-startup-electron-mock`:

```powershell
node --test tests/teacher-adapter.test.mjs tests/teacher-probe.test.mjs
npm run probe:teacher
```

Expected: fake tests PASS. The real probe is expected to report either PASS or
one safe failing operation/category. If it passes, preserve that evidence and
continue to Task 2's retry-contract work; if it fails, that exact safe stage is
the only protocol area Task 2 may change.

- [ ] **Step 5: Commit the diagnostic boundary**

```powershell
git add prototypes/app-startup-electron-mock/src/main/teacher-adapter.mjs prototypes/app-startup-electron-mock/scripts/teacher-adapter-probe.mjs prototypes/app-startup-electron-mock/tests/teacher-adapter.test.mjs prototypes/app-startup-electron-mock/tests/teacher-probe.test.mjs prototypes/app-startup-electron-mock/package.json
git commit -m "test: diagnose real teacher adapter safely"
```

---

### Task 2: Fix the evidenced Teacher stage and make retry truthful

**Files:**

- Modify: `prototypes/app-startup-electron-mock/src/main/teacher-adapter.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/main/practice-orchestrator.mjs`
- Modify only if required by observed schema/event evidence: `prototypes/app-startup-electron-mock/tests/fixtures/fake-app-server.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/practice-state.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/quick-chat.js`
- Modify: `prototypes/app-startup-electron-mock/tests/teacher-adapter.test.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/practice-orchestrator.test.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/practice-renderer.test.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/compact-renderers.test.mjs`

**Interfaces:**

- Consume: Task 1's safe real-probe result and the installed generated schema.
- Produce: `teacherErrorMessage(error): string` inside the orchestrator boundary.
- Change: failed `sendTeacherMessage` persists the safe session error and then rejects with a fixed public error so IPC returns `ok: false`.
- Change: retry of the same unresolved learner message reuses its persisted chat entry instead of appending it again.

- [ ] **Step 1: Add the installed-shape regression at the evidenced stage**

Inspect only the installed generated schema and approved safe diagnostic. Add a
minimal regression fixture for the exact accepted response/event shape.

Choose only the branch selected by evidence:

- `thread-start`: align thread response verification while retaining safe ID,
  exact ephemeral ownership, and normalized exact Teacher-directory checks;
- `turn-start`: align the turn request/response verification while retaining
  one text input and exact verified thread ownership;
- `turn-completion`: align final-answer extraction and terminal-state handling
  while continuing to reject tool items, other thread IDs, and incomplete
  turns;
- `disconnected` or `timeout`: fix lifecycle/timing ownership without weakening
  any response validation.

Do not broaden acceptance beyond fields/statuses present in the installed
schema. Run the focused adapter test and observe the regression fail before the
implementation edit.

- [ ] **Step 2: Add failing orchestrator and renderer retry tests**

Cover this exact flow on both full and quick-chat surfaces:

```text
send “bây giờ tôi phải làm gì”
→ adapter fails with each safe category
→ one learner message is persisted
→ safe category-specific recovery is displayed
→ draft remains available
→ retry the unchanged draft
→ no second learner bubble is appended
→ successful Teacher answer follows the original learner message
→ draft clears only after success
```

Also assert a different new message after a failed one is appended normally.
No renderer may branch on raw App Server codes.

- [ ] **Step 3: Implement safe mapping, rejection, and retry reuse**

In `practice-orchestrator.mjs`:

- map `teacherFailureDetails(error)` to the approved fixed message;
- persist the fixed session error;
- reject the send with a fixed public code after persistence, allowing existing
  IPC sanitization to return `ok: false`;
- when the newest chat entry is an unanswered learner entry with the same
  normalized text, reuse it and exclude it from `priorChat` instead of storing
  or prompting it twice.

In both renderer controllers, clear the draft only on a genuinely successful
IPC result. Preserve current stale-request ownership and focus behavior.

- [ ] **Step 4: Run the focused fake gate**

```powershell
node --test tests/teacher-adapter.test.mjs tests/practice-orchestrator.test.mjs tests/practice-renderer.test.mjs tests/compact-renderers.test.mjs
```

Expected: PASS, including safe copy, retained drafts, one learner bubble across
retry, bound-context isolation, and existing cancellation/disposal cases.

- [ ] **Step 5: Prove the production adapter path**

```powershell
npm run probe:teacher
```

Expected: `PASS teacher-roundtrip`. If it still fails, stop this task and use
the new safe stage to add one more evidence-matched regression; do not proceed
by weakening validation or showing raw detail.

- [ ] **Step 6: Commit the Teacher correction**

```powershell
git add prototypes/app-startup-electron-mock/src/main/teacher-adapter.mjs prototypes/app-startup-electron-mock/src/main/practice-orchestrator.mjs prototypes/app-startup-electron-mock/src/renderer/practice-state.mjs prototypes/app-startup-electron-mock/src/renderer/quick-chat.js prototypes/app-startup-electron-mock/tests/teacher-adapter.test.mjs prototypes/app-startup-electron-mock/tests/practice-orchestrator.test.mjs prototypes/app-startup-electron-mock/tests/practice-renderer.test.mjs prototypes/app-startup-electron-mock/tests/compact-renderers.test.mjs prototypes/app-startup-electron-mock/tests/fixtures/fake-app-server.mjs
git commit -m "fix: recover teacher chat from real failures"
```

Omit the fake-server path from `git add` when the real schema did not require a
fixture change.

---

### Task 3: Give the compact Teacher bubble a usable drag grip

**Files:**

- Modify: `prototypes/app-startup-electron-mock/src/renderer/bubble.html`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/bubble.css`
- Modify: `prototypes/app-startup-electron-mock/tests/compact-renderers.test.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/electron-smoke.test.mjs`

**Interfaces:**

- Preserve: the 72 by 72 pixel BrowserWindow and all bubble controller events.
- Add: one visible `.drag-grip` with `-webkit-app-region: drag`, `cursor: move`, and a descriptive accessible label/title.
- Keep: `#teacher-bubble` as `no-drag`, 52–56 pixels square, and at least 44 pixels square.
- Keep: the state ring visually separate from the grip and non-interactive.

- [ ] **Step 1: Write failing geometry and surface tests**

Assert that:

- `bubble.html` contains the dedicated grip separately from the button;
- the shell itself does not rely on an almost fully covered drag region;
- computed grip height is at least 10 pixels and computed width at least 28
  pixels;
- computed button width and height are at least 44 pixels;
- the grip is `drag`, the button is `no-drag`, and the state ring cannot capture
  pointer input;
- click, double-click, keyboard, unread, and context-menu controller behavior is
  unchanged.

Run:

```powershell
node --test tests/compact-renderers.test.mjs
```

Expected: FAIL because the current draggable area is only the thin uncovered
annulus.

- [ ] **Step 2: Implement the grip within the fixed window**

Use a two-row 72-pixel layout: a visible 10–12 pixel grip zone and a centered
52–56 pixel Teacher button. Keep the current visual language, focus ring,
status symbol, unread badge, forced-colors support, and reduced-motion behavior.
Do not add pointer-to-window IPC or make the chat button draggable.

- [ ] **Step 3: Extend Electron smoke coverage**

After compacting, read the grip and button bounding rectangles and computed
App Region values in the real Electron renderer. Confirm the grip is visible,
has the minimum geometry, and the button still opens quick chat. Keep physical
window movement in the real manual gate because synthetic native titlebar drag
is platform-sensitive.

Run:

```powershell
node --test tests/compact-renderers.test.mjs
npm run test:smoke
```

Expected: PASS.

- [ ] **Step 4: Commit the bubble correction**

```powershell
git add prototypes/app-startup-electron-mock/src/renderer/bubble.html prototypes/app-startup-electron-mock/src/renderer/bubble.css prototypes/app-startup-electron-mock/tests/compact-renderers.test.mjs prototypes/app-startup-electron-mock/tests/electron-smoke.test.mjs
git commit -m "fix: add usable teacher bubble grip"
```

---

### Task 4: Make the canonical launcher quiet and direct for returning learners

**Files:**

- Modify: `start-course.cmd`
- Create: `scripts/startup-first-run.txt`
- Modify: `scripts/setup-and-start.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/onboarding-state.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/launcher-contract.test.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/setup-detection.test.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/onboarding-state.test.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/electron-smoke.test.mjs`

**Interfaces:**

- Keep: `start-course.cmd` and exit codes `0`, `2`, `3`, `4`, and `5`.
- Create: a single first-run presentation asset shared by the Node-missing batch path and the Node setup path.
- Produce: `selectStartupPresentation(report, installPlan): "first-run" | "returning"`.
- Returning output: `Setup complete — opening Course.` with no setup ceremony or approval prompt.
- Change: `STATUS_LOADED` routes completed setup directly to `destination`; active Practice still takes visual priority through `practiceState.screen`.

- [ ] **Step 1: Write failing first-run/returning launcher tests**

Cover:

- Node missing: first-run presentation appears before the permission-gated
  Node installation path;
- non-empty install plan: first-run presentation appears once before approval;
- valid platform, Node, npm, Codex App Server, matching lock stamp, and Electron
  runtime: returning presentation appears, full ceremony does not, and no
  confirmation callback runs;
- stale stamp, missing runtime, or missing App Server: first-run/recovery path
  remains active;
- no credential-like or environment content is printed.

Keep the current subprocess Node-missing test. Unit-test returning selection
with injected detection/output/launch dependencies so it never opens Electron.

Run:

```powershell
node --test tests/launcher-contract.test.mjs tests/setup-detection.test.mjs
```

Expected: FAIL because the batch file always prints the ceremony.

- [ ] **Step 2: Move first-run presentation behind readiness detection**

Store the existing workshop art and setup explanation in
`scripts/startup-first-run.txt`. `start-course.cmd` prints it only when Node is
missing; otherwise `setup-and-start.mjs` prints it only when `buildInstallPlan`
is non-empty. A valid returning report prints the one-line returning status and
launches immediately.

Do not use onboarding state, mission data, credentials, or bound-task data in
the launcher decision. `detectSetup` remains the source of bootstrap readiness.

- [ ] **Step 3: Write and implement direct renderer routing tests**

Change the completed-setup reducer assertion from:

```text
STATUS_LOADED → landing → click Open course → destination
```

to:

```text
STATUS_LOADED(setupCompleted=true) → destination
```

Assert incomplete setup still remains on landing and **Review setup** still
reopens the fixture. Active persisted Practice must still restore directly and
retain the saved tab only after binding revalidation.

- [ ] **Step 4: Update the integrated smoke restart flow**

Remove `openCourseIfPresented`. After setup completion and a relaunch with the
same user data, expect the Course destination without clicking **Open course**.
After an active Practice relaunch, expect Practice directly. Continue asserting
setup review, mission/task/chat restoration, and revalidation.

Run:

```powershell
node --test tests/launcher-contract.test.mjs tests/setup-detection.test.mjs tests/onboarding-state.test.mjs
npm run test:smoke
```

Expected: PASS.

- [ ] **Step 5: Commit the returning-startup correction**

```powershell
git add start-course.cmd scripts/startup-first-run.txt scripts/setup-and-start.mjs prototypes/app-startup-electron-mock/src/renderer/onboarding-state.mjs prototypes/app-startup-electron-mock/tests/launcher-contract.test.mjs prototypes/app-startup-electron-mock/tests/setup-detection.test.mjs prototypes/app-startup-electron-mock/tests/onboarding-state.test.mjs prototypes/app-startup-electron-mock/tests/electron-smoke.test.mjs
git commit -m "fix: resume course without repeated setup"
```

---

### Task 5: Run corrected real acceptance and document the verified flow

**Files:**

- Modify: `prototypes/app-startup-electron-mock/README.md`
- Modify after gates pass: `.superpowers/sdd/progress.md`

- [ ] **Step 1: Run the focused and complete automated gates**

From `prototypes/app-startup-electron-mock`:

```powershell
npm run test:unit
npm run test:smoke
npm run probe:teacher
npm run check
```

Expected: all tests PASS and the real probe prints only
`PASS teacher-roundtrip`.

- [ ] **Step 2: Run the clean-install first-run gate**

Remove only the verified prototype dependency directory, then run:

```powershell
npm ci
npx --no-install install-electron --no
npm run check
```

Expected: dependency/runtime installation and all tests PASS. From the
repository root, launch once and confirm the first-run presentation and any
required permission gate still appear.

- [ ] **Step 3: Run the returning-startup and real UI checkpoint**

From the repository root, run the same command twice against the saved app
data:

```powershell
.\start-course.cmd
```

Verify:

1. the returning terminal shows the concise status, not the setup ceremony;
2. completed setup opens Course directly, or active Practice opens directly
   after binding revalidation;
3. compact mode shows a 72 by 72 bubble with a visible grip;
4. physically drag the grip and confirm the BrowserWindow bounds change while
   remaining on-screen;
5. click the Teacher button and confirm quick chat opens;
6. ask `bây giờ tôi phải làm gì` and receive a grounded response from the
   fresh, explicitly bound Executor context;
7. force one controlled Teacher failure, confirm only safe recovery copy is
   visible, the draft remains, and retry does not add a duplicate learner
   bubble;
8. confirm no decoy/unbound task content appears.

Record only pass/fail and the safe failure operation/category. Do not record
account identity, prompts beyond the approved test phrase, model output, paths,
raw protocol, or private values.

- [ ] **Step 4: Update documentation and progress truthfully**

Update the README to explain:

- first-run versus returning behavior for the same command;
- direct Course/active-Practice restoration and explicit **Review setup**;
- the dedicated bubble grip;
- safe Teacher recovery categories and retained-draft retry;
- the bounded `npm run probe:teacher` developer gate;
- corrected manual checkpoints for Teacher, drag, and restart.

Append a correction section to `.superpowers/sdd/progress.md` only after the
automated and real checks pass. If any real check fails, record that gate as
failed without marking the Practice slice complete.

- [ ] **Step 5: Run privacy and diff checks**

From the repository root:

```powershell
git diff --check
rg -n -i "access[_-]?token|refresh[_-]?token|api[_-]?key|authorization:|auth\.json|raw environment|reasoning" prototypes/app-startup-electron-mock scripts -g "!package-lock.json"
rg -n "thread-start|turn-start|turn-completion|timeout|disconnected|boundary-violation|runtime-failure|drag-grip|Setup complete" prototypes/app-startup-electron-mock scripts start-course.cmd
```

Expected: diff check exits `0`; secret scan finds only deliberate forbidden
tests/documentation, never values or reads; contract scan finds the safe
taxonomy, grip, and returning status.

- [ ] **Step 6: Commit documentation and final ledger**

```powershell
git add prototypes/app-startup-electron-mock/README.md .superpowers/sdd/progress.md
git commit -m "docs: verify practice acceptance corrections"
git status --short
git log --oneline -12
```

Expected: the worktree is clean. The handoff reports automated results, real
probe result, bubble drag result, returning launch result, and real Teacher
result without private content.
