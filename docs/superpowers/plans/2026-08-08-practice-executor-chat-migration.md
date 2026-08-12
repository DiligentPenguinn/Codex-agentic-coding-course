# Practice Executor Chat Migration Implementation Plan

> **For implementers:** Execute this plan task-by-task with test-first checkpoints. Use the `executing-plans` skill when implementation begins. Stop at the real Codex visibility gate if the supported App Server cannot make the handoff visibly inspectable in the learner's new Executor chat.

**Goal:** Add safe Executor chat switching, automatic selective context transfer, layered Practice brief/progress surfaces, and the approved Teacher bubble behavior; prove the behavior in the mature Windows prototype; then port it into Triết's shared Course Companion without losing macOS compatibility.

**Architecture:** Keep Electron's main process as the trust boundary and the sole owner of Practice-run state. A Practice coordinator manages one active run, archived read-only run receipts, and one durable pending transition. A Codex coordinator performs exact chat discovery, creation, bounded reads, visible handoff attachment, and navigation. Teacher and progress consume only the committed active binding. Renderer surfaces receive typed, display-safe projections through narrow preload IPC.

**Tech stack:** Node.js 22+ ESM, TypeScript 6, React 19, Electron 43, electron-vite, Codex App Server JSONL protocol, Vitest, Node's built-in test runner, Playwright, HTML/CSS, Windows batch, and macOS shell launchers. Add no new runtime dependency unless repository evidence proves it necessary.

**Approved design:** [`../specs/2026-08-07-practice-executor-chat-switching-design.md`](../specs/2026-08-07-practice-executor-chat-switching-design.md)

## Global constraints

- Triết's `course-companion/` content model and visual world remain authoritative.
- The historical prototype is a release-gate harness, not a second product direction.
- Keep at most one active Practice run and one pending transition.
- Starting a new Practice never mutates, compacts, resumes, or deletes the old Executor chat.
- A fresh switch carries no old-chat content.
- A transfer switch includes only the approved bounded categories and a visible attribution marker.
- Do not transfer credentials, raw protocol data, environment values, hidden reasoning, unrelated-chat content, or raw tool payloads.
- Do not claim that Codex compaction transfers context. `/compact` and `thread/compact/start` remain unused for cross-chat handoff.
- Use `thread/inject_items` only after a real Codex desktop checkpoint proves the attached item is visible and inspectable in the learner's new chat.
- If visible attachment cannot be proven through the supported runtime, stop the transfer increment. Do not use hidden context or edit rollout files.
- Keep the old active binding authoritative until the final atomic transition commit.
- Teacher, progress, and navigation always resolve through the same committed binding generation.
- Use correct Vietnamese diacritics in every learner-facing string.
- All icon-only controls require an accessible name, tooltip, keyboard path, and visible focus state.
- Preserve the selected Teacher/Progress tab and each panel's scroll position across compact/full window changes.
- Use test-driven development: add a focused failing assertion, observe the expected failure, implement the smallest passing change, and rerun the local suite.
- Keep commits scoped to a task. Preserve unrelated user and collaborator changes.

## Canonical state and command contract

The shared concepts are:

```text
PracticeDefinition
  id, version, objective, expectedOutcome, steps[]

PracticeStep
  id, title, completionAuthority: machine | teacher

PracticeRun
  id, definitionId, definitionVersion, status
  executorChatBinding, bindingGeneration, checklist, createdAt, updatedAt

PracticeWorkspaceState
  schemaVersion, activeRun?, archivedRuns[], pendingTransition?

PendingTransition
  id, sourceRunId?, sourceBindingGeneration?, mode: fresh | selective
  stage, targetChat?, handoffHash?, attachmentReceipt?, createdAt, updatedAt
```

The renderer commands are:

```text
loadPracticeWorkspace()
startFirstPractice()
resumePractice()
beginPracticeSwitch({ transfer: boolean })
cancelPracticeSwitch()
retryPracticeSwitch()
openActiveExecutorChat()
loadTeacherWorkspace()
```

The renderer never selects arbitrary run IDs, chat IDs, binding generations, or transition stages.

---

### Task 1: Merge Triết's Course Companion and establish dual baselines

**Files:**

- Merge: `origin/main` into `duy-branch`
- Resolve if needed: `.gitignore`
- Verify: `prototypes/app-startup-electron-mock/`
- Verify: `course-companion/`

- [ ] **Step 1: Merge without discarding either implementation lineage**

Fetch `origin/main`, merge it into `duy-branch`, and resolve `.gitignore` by retaining both branches' generated-file exclusions. Do not resolve by deleting the prototype or any design/test evidence.

- [ ] **Step 2: Prove the historical prototype baseline**

Run its unit tests, lint if present, and Electron smoke test. Record pre-existing failures separately; do not mask them with migration changes.

- [ ] **Step 3: Prove the Course Companion baseline**

Run typecheck, lint, Vitest/startup tests, build, and Electron smoke. Confirm the current fixture labels remain truthful.

- [ ] **Step 4: Commit the merge checkpoint**

Commit only the merge resolution. Both apps must remain runnable at this checkpoint.

---

### Task 2: Add versioned Practice definitions and one-active-run state to the prototype

**Files:**

- Modify: `prototypes/app-startup-electron-mock/content/practice.module-0.fixture.json`
- Modify: `prototypes/app-startup-electron-mock/src/shared/content-schema.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/shared/practice-contracts.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/shared/practice-state-schema.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/shared/practice-session-reducer.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/main/practice-store.mjs`
- Modify: matching schema, reducer, and store tests

- [ ] **Step 1: Write failing content-contract tests**

Cover versioned definitions, ordered subtasks, concise objective/outcome copy, and explicit `machine` versus `teacher` completion authority. Reject unknown authority, duplicate step IDs, missing expected outcome, and definitions without exactly one next incomplete step.

- [ ] **Step 2: Write failing persistence and migration tests**

Cover zero/one active run, bounded archived receipts, valid pending references, binding generations, atomic writes, corrupt-state quarantine, and migration from the existing single-session schema. The migration must not invent a chat binding.

- [ ] **Step 3: Implement the schema, reducer, and store**

Keep raw Codex transcript content out of persisted Practice state. Persist only display-safe receipts, hashes, checklist evidence summaries, and exact binding identity.

- [ ] **Step 4: Commit the state-contract checkpoint**

Run focused tests and the full prototype unit suite before committing.

---

### Task 3: Add bounded selective handoff and exact Executor chat operations

**Files:**

- Modify: `prototypes/app-startup-electron-mock/src/main/codex-app-server-client.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/main/executor-conversation-service.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/main/executor-activity-reader.mjs`
- Create: `prototypes/app-startup-electron-mock/src/main/selective-handoff.mjs`
- Create: `prototypes/app-startup-electron-mock/src/main/executor-chat-coordinator.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/fixtures/fake-app-server.mjs`
- Modify/Create: matching App Server, conversation, activity, handoff, and coordinator tests

- [ ] **Step 1: Write failing bounded-selection tests**

Include only learner goals, explicit decisions, approved constraints, unresolved blockers, and concise outcome/evidence summaries. Enforce turn, item, per-field, and total-character limits. Exclude reasoning, credentials, environment data, raw protocol messages, unrelated chat items, and stale evidence.

- [ ] **Step 2: Write failing identity and idempotency tests**

Cover exact source reads with turns, new-chat creation, canonical binding identity, deterministic handoff hashes, stable transfer markers, visible attachment receipts, duplicate retry detection, decoy-chat exclusion, and unchanged source chat.

- [ ] **Step 3: Implement supported App Server operations**

Add only schema-confirmed operations. Validate every request and response at the main-process boundary and map failures to fixed safe categories.

- [ ] **Step 4: Implement selective handoff assembly**

Produce a concise structured Vietnamese handoff and a collapsed display-safe Teacher receipt. The service receives bounded normalized items rather than an unrestricted transcript.

- [ ] **Step 5: Commit the chat-service checkpoint**

Run focused tests plus the existing fake-App-Server suite.

---

### Task 4: Implement the failure-safe Practice switch transaction in the prototype

**Files:**

- Modify: `prototypes/app-startup-electron-mock/src/main/practice-orchestrator.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/main/practice-ipc-handlers.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/main/main.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/shared/channels.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/preload/preload.cjs`
- Modify: `prototypes/app-startup-electron-mock/tests/practice-orchestrator.test.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/practice-ipc-contract.test.mjs`
- Modify: `prototypes/app-startup-electron-mock/tests/ipc-contract.test.mjs`

- [ ] **Step 1: Write a table of failing transition-stage tests**

For every failure before final commit, assert the old run and binding remain active. Cover restart reconciliation at every durable stage, cancel before attachment, retry after attachment, concurrent switch requests, concurrent Teacher send/observation, and out-of-order completion.

- [ ] **Step 2: Implement staged commands and generation guards**

Stages are durable and monotonic: prepared, target-created, handoff-prepared, attached, verified, committed. A fresh transition skips handoff stages without inventing a receipt. Final commit archives exactly one old run and activates exactly one new run.

- [ ] **Step 3: Narrow the IPC surface**

Expose intent-level commands only. Return learner-safe status projections and fixed recovery actions; never return raw App Server objects or paths.

- [ ] **Step 4: Commit the transaction checkpoint**

Run coordinator, IPC, persistence, Teacher-context, and activity-observation suites together.

---

### Task 5: Build the layered prototype UI and window behavior

**Files:**

- Modify: `prototypes/app-startup-electron-mock/src/renderer/index.html`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/app.js`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/practice-state.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/styles.css`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/quick-chat.html`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/quick-chat.js`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/compact.css`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/bubble.html`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/bubble.js`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/bubble.css`
- Modify: `prototypes/app-startup-electron-mock/src/main/window-coordinator.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/main/window-policy.mjs`
- Modify: renderer, compact-renderer, window-policy, and Electron smoke tests

- [ ] **Step 1: Write failing brief and switch-dialog renderer tests**

Assert that the initial surface shows only objective, expected outcome, and valid Start/Resume actions. The transfer choice appears only when starting new with an active run. Loading uses truthful named stages with no fabricated percentage.

- [ ] **Step 2: Implement the Practice brief and checklist**

Use progressive disclosure. Show completed, next, and remaining steps; keep raw evidence collapsed. Machine steps advance only from fresh bound-chat evidence; Teacher steps advance only after Teacher assessment.

- [ ] **Step 3: Write failing bubble/window tests**

Cover single click opening compact Teacher, double click within 300 ms opening full Teacher, explicit expand, keyboard equivalents, drag behavior, minimize after navigation to Codex, and retained Teacher/Progress tab plus scroll state.

- [ ] **Step 4: Implement the approved window contract**

Use one 300 ms click arbiter. Keep a direct accessible full-open control so keyboard users never depend on click timing. Preserve multi-display bounds, always-on-top behavior, and recovery from stale window state.

- [ ] **Step 5: Commit the prototype UI checkpoint**

Run renderer/unit suites, Electron smoke, and a visible Windows interaction pass.

---

### Task 6: Pass the real Codex visible-transfer release gate

**Files:**

- Create/Modify: a bounded probe under `prototypes/app-startup-electron-mock/scripts/`
- Modify: prototype README with the exact manual checkpoint
- Modify: probe tests and package command

- [ ] **Step 1: Probe the installed App Server schema and runtime**

Confirm the exact installed methods and fields for create, read-with-turns, visible item injection, and navigation. Documentation examples are not sufficient evidence when the local runtime differs.

- [ ] **Step 2: Run an end-to-end real-desktop switch**

Bind an old chat, create a new chat, authorize selective transfer, open the exact new chat in Codex, and verify the transfer item is visible and attributable. Verify the old chat is byte-for-byte behaviorally unchanged and an unrelated active chat is excluded.

- [ ] **Step 3: Decide the gate from evidence**

If visible attachment succeeds, record the supported method and keep transfer enabled. If it fails, keep fresh switching enabled, leave selective transfer behind a truthful unavailable state, and stop before porting transfer behavior. Do not add a hidden fallback.

- [ ] **Step 4: Commit the real-runtime checkpoint**

Include only the probe, tests, safe documentation, and any schema-confirmed adapter correction.

---

### Task 7: Port the proven coordinator and persistence contracts into Course Companion

**Files:**

- Modify: `course-companion/shared/contracts.ts`
- Modify: `course-companion/electron/main/index.ts`
- Modify: `course-companion/electron/preload/index.ts`
- Modify: `course-companion/electron/main/progress-repository.ts`
- Create: `course-companion/electron/main/practice-run-repository.ts`
- Create: `course-companion/electron/main/codex-app-server-client.ts`
- Create: `course-companion/electron/main/executor-chat-coordinator.ts`
- Create: `course-companion/electron/main/selective-handoff.ts`
- Create: `course-companion/electron/main/practice-coordinator.ts`
- Add/Modify: focused Vitest tests and fake App Server fixtures

- [ ] **Step 1: Write failing TypeScript contract and migration tests**

Model the same state machine with discriminated unions and exhaustive stage handling. Bump the learner-state schema and migrate fixture-era practice state without importing the prototype's local state, matching the approved fresh-local-state decision.

- [ ] **Step 2: Port behavior behind typed interfaces**

Port semantics, not prototype renderer code. Keep repositories, Codex transport, selective handoff, transition orchestration, Teacher observation, and platform navigation as deep modules with narrow interfaces.

- [ ] **Step 3: Replace fixture Practice incrementally**

Retain explicit fixture controls only as developer/test paths. Production learner actions use the real coordinator and never display fixture success as live evidence.

- [ ] **Step 4: Commit the Course Companion service checkpoint**

Run typecheck, lint, focused Vitest suites, startup tests, and build.

---

### Task 8: Build the approved layered experience in Triết's visual shell

**Files:**

- Modify: `course-companion/src/renderer/src/surfaces/LearningWindow.tsx`
- Modify: `course-companion/src/renderer/src/surfaces/CompanionWindow.tsx`
- Modify: `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`
- Create: `course-companion/src/renderer/src/components/PracticeBrief.tsx`
- Create: `course-companion/src/renderer/src/components/PracticeProgress.tsx`
- Create: `course-companion/src/renderer/src/components/PracticeSwitchDialog.tsx`
- Modify: `course-companion/src/renderer/src/styles.css`
- Modify: `course-companion/electron/main/window-layout.ts`
- Add/Modify: renderer tests, window-layout tests, and Electron smoke tests

- [ ] **Step 1: Write failing React interaction tests**

Cover first start, resume, new-with-fresh, new-with-transfer, loading/retry/cancel, checklist authority, collapsed receipt, icon accessibility, compact tabs, full tabs, and preserved presentation state.

- [ ] **Step 2: Implement a restrained mission-control aesthetic**

Keep Triết's pixel-world identity, warm palette, Vietnamese typography, and Teacher portrait. Reduce text density through a strong objective card, one next action, icon controls, layered disclosure, and a compact evidence receipt. Avoid introducing a second design system.

- [ ] **Step 3: Implement navigation and bubble behavior**

After start/resume, open the exact Codex chat, turn the Course Companion learning surface into Teacher mode, and minimize to the bubble. Single click opens compact Teacher; double click opens full Teacher; expand is always available. Teacher and Progress are peer tabs in compact and full modes.

- [ ] **Step 4: Commit the Course Companion UI checkpoint**

Run accessibility-focused renderer tests, typecheck, lint, build, and Electron smoke. Inspect all principal surfaces at normal and narrow window sizes.

---

### Task 9: Make Course Companion the shared launcher target

**Files:**

- Modify: `scripts/setup-and-start.mjs`
- Modify: `start-course.cmd`
- Verify/Modify: `scripts/macos-course-startup-core.mjs`
- Verify/Modify: `scripts/macos-course-startup.mjs`
- Verify/Modify: `start-course.command`
- Modify: root `README.md`
- Modify: `course-companion/README.md`
- Modify: launcher/startup tests in both app histories

- [ ] **Step 1: Write failing Windows launcher tests**

Assert Node/npm/Codex prerequisites, permission-gated first preparation, returning startup, paths with spaces, cancellation, and Course Companion as the only learner-facing target.

- [ ] **Step 2: Route Windows to Course Companion**

Preserve fresh Course Companion local state. Do not silently copy or delete prototype state. Keep the old prototype runnable only through its documented developer command.

- [ ] **Step 3: Re-run macOS startup contracts**

Confirm the shared app and business rules are identical while launcher, path, focus, and deep-link adapters remain platform-specific.

- [ ] **Step 4: Update documentation and commit**

Explain Start/Resume, one active Practice, selective transfer, local-state location, fixture/dev controls, recovery, and the historical-prototype boundary.

---

### Task 10: Final verification and handoff

- [ ] **Step 1: Run the complete prototype suite**

Run unit, renderer, IPC, App Server, launcher, and Electron smoke tests. Preserve the real-transfer probe result.

- [ ] **Step 2: Run the complete Course Companion suite**

Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:electron` from `course-companion/`.

- [ ] **Step 3: Perform the Windows manual acceptance pass**

Exercise first start, resume, fresh switch, selective switch, cancel/retry, restart during transition, Teacher send, progress advancement, single/double click, explicit expand, drag, multiple displays where available, and quit/relaunch.

- [ ] **Step 4: Record the macOS release gate honestly**

Automated macOS contract tests may pass on Windows, but do not claim a physical macOS manual pass. Provide exact commands and a short checklist for Triết or another macOS collaborator.

- [ ] **Step 5: Review the final diff and report residual gates**

Confirm no secrets, raw transcript, hidden reasoning, unrelated changes, generated dependencies, or temporary state are committed. Report the exact commits, automated results, real Codex result, Windows manual result, and any still-pending physical macOS verification.
