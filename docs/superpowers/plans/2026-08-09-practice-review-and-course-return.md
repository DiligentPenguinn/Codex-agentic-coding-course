# Practice Review and Course Return Implementation Plan

**Goal:** Add a reusable, evidence-grounded Practice review action that persists
checklist results and returns a passed learner to the Course App through an
explicit icon control.

**Approved design:**
[`../specs/2026-08-09-practice-review-and-course-return-design.md`](../specs/2026-08-09-practice-review-and-course-return-design.md)

**Primary package:** `course-companion/`

## Task 1: Define generalized Practice content and review contracts

**Create:**

- `course-companion/content/practices/m1-verifiable-brief.json`
- `course-companion/electron/main/practice-definition-repository.ts`
- `course-companion/tests/practice-definition-repository.test.ts`

**Modify:**

- `course-companion/shared/contracts.ts`

1. Add bounded contracts for `PracticeDefinition`, checklist definitions,
   criterion definitions, accepted evidence kinds, completion destinations,
   criterion results, review verdicts, and completion receipts.
2. Keep integrity gates generic. Do not put CSS, viewport, route, or test-command
   assumptions in shared review code.
3. Move the existing `m1-verifiable-brief` objective, expected outcome,
   checklist, post-Practice destination, and its scoped CSS/390px requirements
   into the versioned JSON definition.
4. Validate stable IDs, unique checklist/criterion IDs, criterion-to-step
   references, supported evidence kinds, required fields, bounded text, and a
   valid course destination.
5. Reject unknown fields so content/schema drift fails clearly.
6. Add tests for valid loading and malformed, duplicate, dangling, unsupported,
   or overlong content.

## Task 2: Add pure review validation and checklist derivation

**Create:**

- `course-companion/electron/main/practice-review-contracts.ts`
- `course-companion/tests/practice-review-contracts.test.ts`

1. Parse structured evaluator output into `PracticeReviewResult`.
2. Require exactly one result for every required criterion and reject unknown or
   duplicate criterion IDs.
3. Validate evidence references against the review envelope's evidence index.
4. Enforce that `passed` is legal only when every required criterion is
   `satisfied`.
5. Implement a pure checklist derivation function: completed satisfied steps,
   earliest unmet required step current, and later incomplete steps upcoming.
6. Allow a previously completed step to regress only when its definition
   explicitly requires current evidence and the new validated review no longer
   satisfies it.
7. Test pass, needs-work, unverifiable, optional criteria, invalid evidence
   references, malformed output, and deterministic checklist ordering.

## Task 3: Persist versioned review state safely

**Modify:**

- `course-companion/electron/main/practice-run-repository.ts`
- `course-companion/tests/practice-run-repository.test.ts`

1. Extend the active run with Practice ID/version, `reviewStatus`, latest review,
   review timestamps, and an optional completion receipt.
2. Add a schema migration for existing active runs. Preserve their binding,
   start time, and checklist while assigning the current Practice definition.
3. Add compare-and-save operations scoped to the expected run ID, binding
   generation, and Practice version.
4. Persist checklist and verdict in one atomic update.
5. Recover a saved `reviewing` state to a retryable non-busy state on load.
6. Ignore late results for a replaced run and make repeated identical pass
   writes idempotent.
7. Test migration, atomicity, restart recovery, replaced-run protection, and
   repeated completion writes.

## Task 4: Build a bounded evidence index and review envelope

**Create:**

- `course-companion/electron/main/practice-review-context.ts`
- `course-companion/tests/practice-review-context.test.ts`

**Modify:**

- `course-companion/electron/main/teacher-context-broker.ts`

1. Build the review envelope from the active definition, active run, reconciled
   Executor activity, workspace evidence, learner decisions, and relevant
   artifacts.
2. Assign stable evidence reference IDs and preserve provenance: observed,
   workspace-confirmed, Executor-reported, learner-authored, or
   Teacher-assessed.
3. Apply per-kind count and character bounds; exclude raw transcripts,
   credentials, environment variables, and unrelated thread activity.
4. Represent freshness per evidence item so stale Executor evidence affects only
   criteria that require freshness.
5. Share bounded projection helpers with Teacher context where practical without
   coupling ordinary chat to review state.
6. Test correct-thread isolation, provenance, freshness, bounds, and redaction.

## Task 5: Add a structured review evaluator

**Modify:**

- `course-companion/electron/main/real-teacher-adapter.ts`
- `course-companion/tests/real-teacher-adapter.test.ts`
- `course-companion/tests/real-teacher-adapter-reliability.test.ts`

**Create:**

- `course-companion/electron/main/practice-review-evaluator.ts`

1. Define a narrow evaluator interface separate from ordinary Teacher
   conversation.
2. Add a live implementation that uses the existing ephemeral Teacher transport
   with a strict JSON-only review prompt.
3. Instruct the evaluator to assess only supplied criteria and evidence, return
   every required criterion, retain provenance, and never invent evidence.
4. Parse and validate the response through the pure review-contract module.
5. Keep deterministic fake evaluators available for service and Electron tests.
6. Test valid JSON, markdown-wrapped JSON, truncated/malformed output, missing or
   invented evidence, timeout, disconnect, retry, and adapter reset.

## Task 6: Implement the Practice review service

**Create:**

- `course-companion/electron/main/practice-review-service.ts`
- `course-companion/tests/practice-review-service.test.ts`

**Modify:**

- `course-companion/electron/main/teacher-service.ts`

1. Load the expected active run and definition, mark the run reviewing, and
   coalesce duplicate requests for that run.
2. Refresh only the bound Executor thread and reconcile workspace evidence using
   the existing observer/provider path.
3. Build the bounded review envelope, call the evaluator, validate the result,
   and derive the checklist.
4. Recheck run ID, generation, and Practice version before committing.
5. Atomically persist `needs-work` or `passed` and its checklist.
6. Produce Hương's concise learner-facing explanation from the validated result,
   preserving evidence provenance and independent-verification caveats.
7. Append the explanation to Teacher chat after the authoritative review write;
   expose a recoverable presentation error if chat persistence fails.
8. Test pass, needs-work, stale/unverifiable evidence, no active run, concurrent
   review, replaced run, invalid evaluator output, persistence failure, and chat
   append failure.

## Task 7: Implement the Practice-to-course completion contract

**Modify:**

- `course-companion/shared/contracts.ts`
- `course-companion/electron/main/progress-repository.ts`
- `course-companion/tests/progress-repository.test.ts`
- `course-companion/electron/main/practice-review-service.ts`

1. Bump the learner-state schema and migrate existing fixture-era Practice state
   without losing course progress.
2. Add a real Practice completion record with course run, Practice/version, run,
   checkpoint, timestamp, evidence summary, mastery summary, and destination.
3. Persist the completion record only after an authoritative passed review.
4. Keep fixture Practice support explicitly separate from real review results.
5. Add an idempotent repository operation that applies the same completion
   receipt at most once.
6. Test schema migration, pass persistence, duplicate application, mismatched
   checkpoint/destination rejection, and fixture compatibility.

## Task 8: Expose safe IPC operations and window handoff

**Modify:**

- `course-companion/shared/contracts.ts`
- `course-companion/electron/preload/index.ts`
- `course-companion/electron/main/index.ts`
- `course-companion/src/global.d.ts`
- `course-companion/tests/electron-smoke.mjs`

1. Add named API operations `reviewPractice()` and `returnPassedPractice()`.
2. Accept no renderer-supplied verdict, checklist, evidence, or destination.
3. Wire review to the new service and return an updated workspace/review view
   model plus the appended Teacher message.
4. Permit return only when the persisted active run is passed and its completion
   receipt is valid.
5. On return, show/focus the main Course App window, hide the companion window,
   and notify the main renderer with the completion receipt.
6. Coalesce duplicate return calls and keep the persisted pass available if
   window handoff fails.
7. Test invalid calls, pre-pass return rejection, successful compact/full
   handoff, and duplicate delivery.

## Task 9: Add the shared icon controls to TeacherWorkspace

**Modify:**

- `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`
- `course-companion/src/renderer/src/components/PracticeProgress.tsx`
- `course-companion/src/renderer/src/styles.css`
- `course-companion/tests/window-layout.test.ts`

1. Render an inline clipboard-check SVG in the existing panel-control group only
   when an active Practice exists.
2. Add Vietnamese `aria-label`/`title`, keyboard support, focus-visible styling,
   and a non-layout-shifting busy indicator.
3. Call `reviewPractice`, refresh messages/workspace, and select Progress after a
   needs-work or passed result.
4. Render an inline book/return-arrow SVG only when persisted review status is
   passed.
5. Call `returnPassedPractice` without interpreting Teacher message text.
6. Preserve header width and hit-target usability in both the compact/windowed
   and embedded full-screen variants; honor reduced-motion preferences.
7. Test visibility, labels, loading, retry, passed-only return, and compact/full
   layout invariants.

## Task 10: Complete the Course App return transition

**Modify:**

- `course-companion/src/renderer/src/surfaces/LearningWindow.tsx`
- `course-companion/electron/preload/index.ts`
- `course-companion/shared/contracts.ts`
- `course-companion/tests/electron-smoke.mjs`

1. Subscribe to the typed Practice-return notification.
2. Reload persisted learner/Practice progress instead of trusting notification
   payload state.
3. Apply the completion checkpoint and destination from the validated receipt.
4. Close Practice brief/Teacher overlays, select the lesson destination, and
   render the configured reflection scene.
5. Replace the current hardcoded completed-fixture advancement path with the
   generalized receipt path while retaining fixture rehearsal support.
6. Make repeat notifications and restart-after-pass safe no-ops after the first
   transition.
7. Test the current Module 1 return and a second synthetic Practice definition
   with a different destination to prove the flow is generalized.

## Task 11: Extend deterministic test infrastructure

**Modify:**

- `course-companion/electron/main/test-codex-gateway.ts`
- `course-companion/tests/teacher-service-scenarios.test.ts`
- `course-companion/tests/practice-coordinator.test.ts`
- `course-companion/tests/executor-evidence-reconciliation.test.ts`
- `course-companion/tests/electron-smoke.mjs`

1. Add deterministic passing, needs-work, unverifiable, malformed-review, and
   delayed/replaced-run evaluator scenarios.
2. Preserve the current silent external Desktop activity fixture and its
   evidence-provenance distinctions.
3. Prove ordinary chat saying “you passed” never changes review or course state.
4. Prove the current CSS Practice can pass using evidence permitted by its
   definition while retaining the “Executor-reported, not independently rerun”
   caveat.
5. Prove a future synthetic Practice can use different criteria and evidence
   sufficiency without changing review-service code.

## Task 12: Verify the complete workflow

Run from `course-companion/` and fix failures before proceeding:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run test:electron
```

Then perform the real-window acceptance rehearsal:

1. Start Module 1 Practice and bind its Executor chat.
2. Confirm the review icon appears in windowed Teacher and full-screen Teacher.
3. Review incomplete work and verify the earliest unmet checklist step and
   guidance.
4. Produce passing evidence and review again.
5. Confirm every checklist item completes and the return icon appears.
6. Confirm Hương labels observed, confirmed, and Executor-reported evidence
   correctly.
7. Return from the windowed Teacher and arrive at Module 1 reflection.
8. Repeat from full-screen Teacher with fresh local test state.
9. Restart after a persisted pass and confirm the return control and transition
   still work.
10. Double-trigger review and return controls and confirm no duplicate progress
    or skipped checkpoints.

Do not claim a physical macOS pass from Windows. Run cross-platform contract
tests on Windows and leave the existing macOS manual verification checklist for
the macOS collaborator.

## Completion gate

The implementation is complete only when:

- both Teacher layouts expose the same accessible icon controls;
- review state is structured, validated, and persisted independently of chat;
- the engine evaluates versioned Practice criteria rather than hardcoded task
  rules;
- incomplete and unverifiable reviews cannot advance course progress;
- a persisted pass creates an idempotent completion receipt;
- return restores the Course App at the configured destination; and
- targeted, full-suite, build, and Electron lifecycle verification pass.
