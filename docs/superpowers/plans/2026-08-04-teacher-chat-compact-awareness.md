# Teacher Chat Compactness and Mission Awareness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make both Teacher composers compact and keyboard-friendly, map native minimize to compact mode, and give the Teacher validated mission context for direct learner guidance.

**Architecture:** Keep presentation behavior in the existing renderers and window coordinator. Extend the shared Teacher context envelope with a validated mission snapshot sourced from the pinned start request, then strengthen the turn instruction without adding file reads or a second context source.

**Tech Stack:** Electron, browser DOM APIs, ECMAScript modules, Node.js built-in test runner.

## Global Constraints

- `Enter` sends and `Shift+Enter` inserts a newline in both Teacher composers.
- Empty composers render as one visible line and auto-grow only to a fixed cap.
- IME composition never triggers submission.
- Native main-window minimize transitions to existing `compact` mode.
- Teacher context remains bounded to the active mission and bound Executor task.
- Do not create commits unless the user explicitly requests them.

---

### Task 1: Shared Composer Interaction

**Files:**
- Create: `prototypes/app-startup-electron-mock/src/renderer/teacher-composer.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/index.html`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/quick-chat.html`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/app.js`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/quick-chat.js`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/styles.css`
- Modify: `prototypes/app-startup-electron-mock/src/renderer/compact.css`
- Test: `prototypes/app-startup-electron-mock/tests/practice-renderer.test.mjs`
- Test: `prototypes/app-startup-electron-mock/tests/compact-renderers.test.mjs`

**Interfaces:**
- Produces: `resizeTeacherComposer(textarea: HTMLTextAreaElement): void`
- Produces: `shouldSubmitTeacherComposer(event: KeyboardEvent): boolean`
- Consumes: existing full-view `controller.sendTeacherMessage()` and quick-chat `controller.send()` actions.

- [ ] **Step 1: Write failing helper and markup tests**

Assert both textareas use `rows="1"`; verify resizing sets height to `auto`, then to bounded `scrollHeight`; verify plain `Enter` returns `true`, while `Shift+Enter`, composition, and non-Enter keys return `false`.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test tests/practice-renderer.test.mjs tests/compact-renderers.test.mjs`

Expected: FAIL because the helper does not exist and markup still declares three rows.

- [ ] **Step 3: Implement the shared helper and renderer wiring**

Implement:

```js
export function resizeTeacherComposer(textarea) {
  textarea.style.height = "auto";
  textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  textarea.style.overflowY = textarea.scrollHeight > 120 ? "auto" : "hidden";
}

export function shouldSubmitTeacherComposer(event) {
  return event.key === "Enter" && !event.shiftKey && !event.isComposing;
}
```

Call resize after input, state-driven draft rendering, send success, and send failure. On keydown, prevent default and invoke the existing send action only when `shouldSubmitTeacherComposer` returns true. Change both markup declarations to `rows="1"`. Replace fixed minimum heights with one-line minimum heights while retaining a `120px` cap.

- [ ] **Step 4: Run focused tests and verify pass**

Run: `node --test tests/practice-renderer.test.mjs tests/compact-renderers.test.mjs`

Expected: PASS.

### Task 2: Native Minimize to Compact Mode

**Files:**
- Modify: `prototypes/app-startup-electron-mock/src/main/window-coordinator.mjs`
- Test: `prototypes/app-startup-electron-mock/tests/window-coordinator.test.mjs`

**Interfaces:**
- Consumes: existing `compact(): Promise<boolean>` transition.
- Produces: a main-window `minimize` listener that prevents native minimization and safely requests `compact()`.

- [ ] **Step 1: Write the failing minimize test**

Create the coordinator, emit the main window's `minimize` event with a spy event exposing `preventDefault()`, then assert prevention occurred, presentation updated to `{ mode: "compact" }`, the main window hid, and the bubble showed.

- [ ] **Step 2: Run the focused test and verify failure**

Run: `node --test tests/window-coordinator.test.mjs`

Expected: FAIL because no `minimize` listener is installed.

- [ ] **Step 3: Install the coordinator-owned minimize listener**

After creating the main window, register:

```js
addListener(mainWindow, "minimize", (event) => {
  event.preventDefault?.();
  invokeSafely(compact);
});
```

Keep this inside the coordinator so disposal removes it through the existing listener registry.

- [ ] **Step 4: Run the focused test and verify pass**

Run: `node --test tests/window-coordinator.test.mjs`

Expected: PASS.

### Task 3: Mission-Aware Teacher Envelope

**Files:**
- Modify: `prototypes/app-startup-electron-mock/src/shared/practice-contracts.mjs`
- Modify: `prototypes/app-startup-electron-mock/src/main/teacher-context-broker.mjs`
- Test: `prototypes/app-startup-electron-mock/tests/practice-contracts.test.mjs`
- Test: `prototypes/app-startup-electron-mock/tests/teacher-context-broker.test.mjs`

**Interfaces:**
- Produces: `TeacherContextEnvelope.mission` containing validated `title`, `description`, `learningOutcomes`, `instructions`, `allowedActions`, `prohibitedActions`, `expectedEvidence`, `contentKind`, and `contentVersion`.
- Consumes: `startRequest.content` from the pinned and validated practice start request.

- [ ] **Step 1: Write failing contract and broker tests**

Assert parsed envelopes preserve all mission fields, reject missing/extra/malformed mission data, and ensure `createTeacherContextEnvelope` copies the mission snapshot from `startRequest.content`.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test tests/practice-contracts.test.mjs tests/teacher-context-broker.test.mjs`

Expected: FAIL because the envelope contract does not permit a mission property.

- [ ] **Step 3: Extend parsing and envelope construction**

Add a strict mission parser using the same bounds and array-validation conventions as the practice content contract. Extend the envelope's allowed keys and return shape, then populate it in `createTeacherContextEnvelope` exclusively from the parsed start request content.

- [ ] **Step 4: Run focused tests and verify pass**

Run: `node --test tests/practice-contracts.test.mjs tests/teacher-context-broker.test.mjs`

Expected: PASS.

### Task 4: Direct Guidance Turn Contract

**Files:**
- Modify: `prototypes/app-startup-electron-mock/src/main/teacher-context-broker.mjs`
- Test: `prototypes/app-startup-electron-mock/tests/teacher-context-broker.test.mjs`
- Test: `prototypes/app-startup-electron-mock/tests/teacher-adapter.test.mjs`

**Interfaces:**
- Consumes: validated mission-aware envelope, recent chat, and current learner message.
- Produces: a Teacher turn instruction requiring concrete mission-aligned next-step guidance without redirecting responsibility to the Executor.

- [ ] **Step 1: Write the failing instruction test**

Assert the serialized turn contains the mission snapshot and explicit requirements to provide the learner's next step, connect it to the mission objective, disclose stale evidence, avoid invented progress, and not redirect the learner to ask the Executor.

- [ ] **Step 2: Run focused tests and verify failure**

Run: `node --test tests/teacher-context-broker.test.mjs tests/teacher-adapter.test.mjs`

Expected: FAIL because the current instruction only limits source material and freshness disclosure.

- [ ] **Step 3: Replace the trailing instruction with the direct-guidance contract**

Serialize a concise instruction block after `CURRENT_LEARNER_MESSAGE` that preserves source limits while requiring concrete next-step coaching. Do not add Teacher file access or unbound conversation context.

- [ ] **Step 4: Run focused tests and verify pass**

Run: `node --test tests/teacher-context-broker.test.mjs tests/teacher-adapter.test.mjs`

Expected: PASS.

### Task 5: Integrated Verification

**Files:**
- Modify only files required to correct regressions introduced by Tasks 1–4.

**Interfaces:**
- Consumes: all prior task outputs.
- Produces: a passing prototype unit suite and lint check.

- [ ] **Step 1: Run the complete unit suite**

Run: `npm run test:unit`

Expected: all unit tests PASS.

- [ ] **Step 2: Run lint**

Run: `npm run lint`

Expected: PASS with no errors.

- [ ] **Step 3: Review the final diff**

Run: `git diff --check` and `git diff -- prototypes/app-startup-electron-mock docs/superpowers`

Expected: no whitespace errors; changes remain limited to the approved design and implementation.
