# Module 1 Practice Mode Guidance Implementation Plan

**Design authority:** [`../specs/2026-08-17-module-1-practice-mode-guidance-design.md`](../specs/2026-08-17-module-1-practice-mode-guidance-design.md)

**Goal:** Add a versioned, automatically triggered, learner-controlled first-run guide that teaches the existing Module 1 Practice loop without changing Practice evidence, review, or completion semantics.

**Primary package:** `course-companion/`

## Execution rules

- Work on `feature/course-companion-practice-workflow`.
- Keep the five existing Module 1 configuration criteria as the only Practice pass conditions.
- Keep guide persistence separate from learner progress, Practice runs, evidence, reviews, and completion receipts.
- The guide may observe lifecycle events but must never invoke Executor, review, or course-return actions for the learner.
- Write focused failing tests before each behavioral change.
- Reject unknown definition fields and enum values.
- Preserve the pixel-art interface, compact/full Teacher behavior, and Module 2 workflow.
- Use disposable user-data directories for Electron tests.
- Commit after each green task using the listed checkpoint.

## Task 1: Add the versioned guide definition

**Create**

- `course-companion/content/practice-guides/m1-practice-mode-first-run.json`
- `course-companion/electron/main/practice-guide-definition-repository.ts`
- `course-companion/tests/practice-guide-definition-repository.test.ts`

**Modify**

- `course-companion/shared/contracts.ts`
- `course-companion/electron/main/index.ts`

**Steps**

1. Add contracts for guide identity/version, eligible Practice identity/version range, replay policy, ordered stages, presentation type, advancement mode, stable anchor identity, and bounded localized copy.
2. Support the approved presentation types: `intro-dialog`, `orientation-card`, `coach-mark`, and `mastery-confirmation`.
3. Support advancement through `continue`, `teacher-tab-selected`, `progress-tab-selected`, `review-requested`, and `course-returned`.
4. Define stable anchors for Teacher tab, Progress tab, configuration evidence, review, and course return.
5. Encode the approved eight-stage Vietnamese Module 1 guide. Keep each coach-mark body to no more than two short sentences.
6. Implement a strict parser modeled after `PracticeDefinitionRepository`. Reject unknown fields, invalid IDs or versions, duplicate stages, unknown presentation/advancement/anchor values, blank or oversized copy, anchor/type mismatches, empty guides, and unsupported replay policies.
7. Resolve content through `COURSE_COMPANION_PRACTICE_GUIDES_DIR` plus packaged/development candidates matching the existing Practice-definition pattern.
8. Fail guidance loading without failing Practice loading when the definition is missing or invalid.
9. Run `npx vitest run tests/practice-guide-definition-repository.test.ts` and `npm run typecheck` from `course-companion/`.

**Commit checkpoint:** `feat: add practice guide definitions`

## Task 2: Persist isolated guide presentation state

**Create**

- `course-companion/electron/main/practice-guide-state-repository.ts`
- `course-companion/tests/practice-guide-state-repository.test.ts`

**Modify**

- `course-companion/shared/contracts.ts`

**Steps**

1. Define a separate persistence schema containing only guide ID/version, course run ID, Practice ID/run ID, status, last stage, mastery-confirmation state, and timestamps.
2. Use statuses `not-started`, `in-progress`, `paused`, `skipped`, and `completed`.
3. Key durable records by course run and guide ID. Do not add guide fields to `LearnerProgress` or `PracticeRunRecord`.
4. Implement atomic start, advance, pause, skip, complete, dismiss-confirmation, load, and reset operations scoped to expected course, Practice run, and stage identity.
5. Preserve an existing completed/skipped first-run record across guide content-version changes in the same course run.
6. Treat replay as an in-memory session that does not rewrite durable completion/skip state and does not survive relaunch.
7. Recover malformed state to an empty guide record with a bounded diagnostic; never reinterpret it as Practice or course progress.
8. Test serialization, duplicate/stale events, replaced runs, relaunch, corruption, guide-version changes, replay isolation, and reset.
9. Run `npx vitest run tests/practice-guide-state-repository.test.ts` and `npm run typecheck`.

**Commit checkpoint:** `feat: persist practice guide state`

## Task 3: Add the side-effect-free guide coordinator

**Create**

- `course-companion/electron/main/practice-guide-coordinator.ts`
- `course-companion/tests/practice-guide-coordinator.test.ts`

**Modify**

- `course-companion/shared/contracts.ts`

**Steps**

1. Define `PracticeGuideView` with guide/run identity, durable status, current stage, visible step count, presentation, anchor, copy/actions, replay flag, mastery-confirmation state, and non-blocking error.
2. Define validated requests for start, continue, pause, skip, replay, dismiss-confirmation, and semantic Teacher/Progress tab events.
3. Combine guide definition, isolated state, authoritative `LearnerProgress`, current `PracticeWorkspaceView`, and active Practice run.
4. Derive the earliest eligible unfinished stage:
   - intro after the Module 1 active run exists;
   - Executor orientation after start and binding;
   - Teacher/Progress guidance only on the full Teacher surface;
   - evidence guidance whenever the configuration panel can render, regardless of freshness;
   - review guidance when review is available and idle;
   - return guidance after a persisted pass;
   - mastery confirmation after the receipt is accepted at `module-1-mastery`.
5. Reconcile forward after a quick pass instead of forcing stale earlier tips.
6. Return no presentation for Module 2, missing/replaced runs, or unsupported Practice versions.
7. Restrict side effects to the guide-state repository. Never call Executor, evidence, Teacher, review, or progress mutations.
8. On guide persistence failure, preserve an in-memory view and warning without throwing into Practice.
9. Test every stage, pause/resume, skip, replay, early pass, duplicate/stale events, replaced-run protection, failure recovery, Module 2 exclusion, and mastery confirmation.
10. Run `npx vitest run tests/practice-guide-coordinator.test.ts tests/practice-guide-state-repository.test.ts` and `npm run typecheck`.

**Commit checkpoint:** `feat: coordinate module one practice guidance`

## Task 4: Wire the guide through main process and preload

**Modify**

- `course-companion/electron/main/index.ts`
- `course-companion/electron/preload/index.ts`
- `course-companion/shared/contracts.ts`
- `course-companion/tests/practice-guide-coordinator.test.ts`
- `course-companion/tests/progress-repository.test.ts`

**Steps**

1. Construct the definition repository, state repository, and coordinator from app user data and the resolved guide directory.
2. Add narrowly scoped API methods `loadPracticeGuide(identity?)` and `updatePracticeGuide(request)`.
3. Add strict IPC validation and matching preload methods without exposing raw files or repository records.
4. Load authoritative course progress and current Practice workspace before deriving every guide view.
5. After successful `reviewPractice`, reconcile guidance with the returned workspace.
6. After successful `returnPassedPractice` and accepted completion receipt, complete the return stage and mark mastery confirmation pending.
7. Preserve existing review/return ordering and errors.
8. Add guide reset to `course:reset-progress`.
9. Prove startup, Module 1, and Module 2 remain usable when guide content/state is missing or invalid.
10. Run focused tests, `npm run typecheck`, and `npm run lint`.

**Commit checkpoint:** `feat: expose practice guidance lifecycle`

## Task 5: Build accessible presentation primitives

**Create**

- `course-companion/src/renderer/src/components/PracticeGuide.tsx`
- `course-companion/src/renderer/src/components/practice-guide-anchors.ts`
- `course-companion/tests/practice-guide-renderer.test.ts`

**Modify**

- `course-companion/src/renderer/src/styles.css`

**Steps**

1. Implement a semantic anchor registry. Definitions use stable anchor IDs, never CSS selectors.
2. Implement the intro modal with a visible/programmatic title, initial focus, Tab containment, Escape pause, explicit start/skip actions, and logical focus restoration.
3. Implement non-modal orientation/coach-mark views with visible progress, concise copy, informational `Tiếp`, persistent secondary skip, Escape pause, and no timer or synthetic click.
4. Position coach marks from anchor bounds and update on resize/target movement while keeping the target and focus indicator visible.
5. Render a non-anchored in-flow fallback card when the full surface is stable but the expected anchor is absent.
6. Announce each eligible stage once rather than on every workspace refresh.
7. Use existing pixel-art conventions; animate only opacity/transform and honor reduced motion.
8. Support 200% zoom and the minimum full-Teacher viewport without clipping.
9. Test labels, focus, keyboard order, Escape, skip, action-dependent stages, missing anchors, progress, replay, and reduced-motion CSS.
10. Run `npx vitest run tests/practice-guide-renderer.test.ts`, `npm run typecheck`, and `npm run lint`.

**Commit checkpoint:** `feat: render accessible practice guidance`

## Task 6: Integrate real Teacher and Progress stages

**Modify**

- `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`
- `course-companion/src/renderer/src/components/PracticeProgress.tsx`
- `course-companion/src/renderer/src/components/PracticeGuide.tsx`
- `course-companion/tests/module-one-practice-renderer.test.ts`
- `course-companion/tests/teacher-practice-review-controls.test.ts`
- `course-companion/tests/practice-guide-renderer.test.ts`

**Steps**

1. Load the guide after the full-screen Module 1 Teacher workspace and active Practice are stable.
2. Never render coach marks in the compact bubble. Record pause before minimizing.
3. Register semantic anchors on both tabs, configuration evidence, review, and return controls.
4. Report real Teacher/Progress tab selections after preserving existing tab behavior. Keep `Tiếp` when Teacher is already selected.
5. Keep tab state, configuration polling, review availability, and return availability independent from guidance.
6. Reconcile after workspace refresh, review, and run changes without duplicate announcements.
7. Pause behind Practice switch/transition dialogs, review-busy state, focus-owning Teacher errors, and minimization; resume when stable.
8. Add `Xem lại hướng dẫn Practice` to the full Teacher context/help area for Module 1. Replay must not reset durable guide, Practice, or course state.
9. Prove skipped, paused, failed, and replaying guidance never hides or disables review/return.
10. Run the three focused renderer suites plus typecheck and lint.

**Commit checkpoint:** `feat: guide the module one practice workflow`

## Task 7: Add mastery confirmation and recovery

**Modify**

- `course-companion/src/renderer/src/surfaces/LearningWindow.tsx`
- `course-companion/src/renderer/src/components/PracticeGuide.tsx`
- `course-companion/electron/main/index.ts`
- `course-companion/tests/practice-completion-progress.test.ts`
- `course-companion/tests/progress-repository.test.ts`
- `course-companion/tests/practice-guide-coordinator.test.ts`
- `course-companion/tests/module-one-practice-renderer.test.ts`

**Steps**

1. After `course:practice-returned` reloads authoritative progress, derive guide presentation for the current scene.
2. Show the approved Practice-loop confirmation only for the current course run, accepted Module 1 receipt, `module-1-mastery` scene, and pending confirmation.
3. Keep it inline/dismissible so it never covers navigation or delays `Hoàn thành Module 1`.
4. Persist dismissal idempotently.
5. Restore an undismissed confirmation after relaunch; never show it after dismissal or in Module 2.
6. Test course reset, corrupted guide state, missing content, replaced run, failed review/return, and duplicate returns.
7. Confirm the completion receipt remains the sole checkpoint authority.
8. Run the focused coordinator, progress, completion, and renderer suites plus typecheck and lint.

**Commit checkpoint:** `feat: confirm the completed practice loop`

## Task 8: Extend Electron and visual coverage

**Modify**

- `course-companion/tests/electron-smoke.mjs`
- `course-companion/electron/main/test-codex-gateway.ts` only if existing deterministic events need clearer exposure

**Steps**

1. Use fresh disposable user-data and learner-workspace directories per scenario.
2. Cover the full guided path: auto intro, orientation, tabs, waiting/mismatch/fresh evidence, review, pass, return, and mastery confirmation.
3. Add scenarios for intro skip, pause/minimize/resume, relaunch, needs-work correction, quick-pass reconciliation, replay, missing anchor, replaced run, and Module 2 exclusion.
4. Assert guidance alone never submits a turn or mutates configuration, checklist, review, receipt, or destination state.
5. Assert keyboard-only operation, Escape pause, visible focus, no document scroll, and unobscured targets.
6. Capture intro, orientation, both tab tips, configuration waiting/mismatch/fresh, review, return, mastery, missing-anchor fallback, reduced-motion, and 200%-zoom states.
7. Inspect every capture for hierarchy, clipping, overlap, contrast, focus, wrapping, and pixel-art consistency. Repeat affected scenarios after scoped repairs.
8. Run `npm run test:electron`.

**Commit checkpoint:** `test: cover module one practice guidance`

## Task 9: Document and run completion gates

**Modify**

- `course-companion/README.md`
- `README.md` only if its existing workflow table requires an update

**Steps**

1. Document automatic first-run guidance, skip/pause/resume/replay, the guide-directory override, local isolated state, and the fact that guidance is ungraded.
2. Confirm learner UI exposes no guide/stage/Practice/run/checkpoint IDs or raw protocol values.
3. Run focused guide, Module 1 renderer, review-control, completion, and progress tests.
4. Run from `course-companion/`: `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:electron`.
5. Run `node --test pilot-workspace/.agents/skills/start-course-lesson/scripts/course-state.test.mjs` from the repository root.
6. Run `git diff --check` and confirm a clean worktree.
7. Compare the final diff to every approved acceptance criterion and record genuinely deferred items.

**Commit checkpoint:** `docs: document module one practice guidance`

## Completion definition

Implementation is complete only when:

1. the guide auto-triggers once for a fresh Module 1 course run;
2. the staged loop can be completed, skipped, paused, resumed, replayed, and recovered;
3. guide state remains isolated from graded and lifecycle state;
4. Module 1 still passes only on the five existing fresh configuration criteria;
5. Module 2 never auto-starts this guide;
6. keyboard, screen-reader, zoom, contrast, and reduced-motion expectations pass;
7. unit, integration, Electron, course-state, build, and visual gates are green; and
8. the worktree is clean with implementation commits ready for review.
