# Practice Review Teacher Role Implementation Plan

**Spec:** `docs/superpowers/specs/2026-08-19-practice-review-teacher-role-design.md`
**Goal:** Replace direct Teacher chat during an active Practice with one unified,
authoritative progress-review surface while preserving Hỏi Triết during lessons
and quizzes.

## Constraints

- Preserve the current dirty worktree and the uncommitted authoritative Hỏi
  Triết context work already present.
- Do not remove or rewrite course pages, scenes, routes, or unrelated approved
  learner copy.
- Derive Practice mode only from `PracticeWorkspaceView.activePractice`.
- Keep Teacher read-only and keep completion/return authority in structured,
  persisted Practice state.
- Maintain compact and full-screen surfaces, narrow-window support, sandboxed
  renderer boundaries, and the existing one-active-Practice rule.

## Task 1 — Lock the Practice-mode UI contract with failing tests

**Files**

- Modify: `course-companion/tests/teacher-practice-review-controls.test.ts`
- Add or modify: `course-companion/tests/teacher-workspace-mode.test.ts`
- Inspect: `course-companion/tests/electron-smoke.mjs`

**Steps**

1. Add source/component contract assertions that active Practice renders a
   dedicated review branch and learning mode retains the conversation branch.
2. Assert the Practice branch has no Hỏi Triết tab, chat log, composer, send,
   retry, or message-derived progress logic.
3. Assert the Practice branch exposes `Cập nhật & duyệt tiến độ`, manual evidence
   refresh, criterion findings, and persisted return gating.
4. Assert contextual labels use `Duyệt Practice` only for an authoritative active
   Practice and retain `Hỏi Triết` otherwise.
5. Run the focused tests and confirm they fail for the missing behavior.

## Task 2 — Make Practice review a structured non-chat operation

**Files**

- Modify: `course-companion/shared/contracts.ts`
- Modify: `course-companion/electron/main/practice-review-service.ts`
- Modify: `course-companion/electron/main/index.ts`
- Modify: `course-companion/tests/practice-review-service.test.ts`
- Modify affected review fixtures and IPC contract tests discovered by `rg`.

**Steps**

1. Change `PracticeReviewResponse` to return the authoritative updated workspace
   without a `TeacherMessage` side channel.
2. Remove the Practice review service dependency on `TeacherChatRepository` and
   stop appending review summaries to the normal Teacher conversation.
3. Preserve evaluator isolation, structured JSON validation, source digest,
   criterion results, concurrency de-duplication, generation/run checks, and
   persisted review state.
4. Verify that review collection refreshes the relevant evidence before building
   the immutable envelope for every supported evidence profile. Add a regression
   where evidence changes immediately before review.
5. Add failure regressions proving evaluator/refresh failure preserves the last
   persisted review and never grants completion or return.
6. Run the focused review service and IPC tests until green.

## Task 3 — Build the unified Practice review surface

**Files**

- Modify: `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`
- Modify: `course-companion/src/renderer/src/components/PracticeProgress.tsx`
- Modify: `course-companion/src/renderer/src/styles.css`
- Modify: `course-companion/src/renderer/src/surfaces/CompanionWindow.tsx`
- Modify: `course-companion/src/renderer/src/surfaces/LearningWindow.tsx`

**Steps**

1. Derive `practiceMode` from the loaded workspace's `activePractice` and render
   mutually exclusive learning-chat and Practice-review bodies.
2. In Practice mode, remove the tab switcher and all conversation/composer/retry
   rendering. Do not call `sendTeacherMessage` from any Practice control.
3. Add a high-priority review header/card with review readiness and the primary
   `Cập nhật & duyệt tiến độ` button. The button calls `reviewPractice()` once,
   uses accessible busy state, and replaces the workspace with the returned
   authoritative view.
4. Keep `Làm mới bằng chứng` subordinate and separate from evaluation.
5. Render each structured criterion with satisfied, unsatisfied, or unverifiable
   status and its explanation. Derive one next action from the first unresolved
   criterion/checklist item or the passed return action; do not infer it from
   Teacher prose.
6. Preserve the latest result on a failed new review and show a retryable error
   stating that it was not newly verified.
7. Change bubble/window labels and accessible names to `Duyệt Practice` only in
   Practice mode; restore the existing Hỏi Triết identity outside Practice.
8. Keep Practice approvals/revision actions, invalidations, evidence detail,
   checklist, and return gating intact.

## Task 4 — Remove Practice chat stages from the guide

**Files**

- Modify: `course-companion/shared/contracts.ts`
- Modify: `course-companion/electron/main/practice-guide-coordinator.ts`
- Modify the authoritative Practice guide definition under
  `pilot-workspace/course/practices/` identified by repository search.
- Modify: `course-companion/src/renderer/src/components/PracticeGuide.tsx`
- Modify: `course-companion/src/renderer/src/components/practice-guide-anchors.ts`
- Modify: `course-companion/tests/practice-guide-coordinator.test.ts`
- Modify affected guide definition/renderer tests.

**Steps**

1. Replace the `ask-teacher` and tab-selection stages/events with a unified
   review-workspace orientation and progress-inspection flow.
2. Remove panel-selection persistence from the visible Practice interaction. If
   the persisted `PracticePanel` contract must remain for backwards-compatible
   data migration, normalize both legacy values to the review workspace and keep
   it out of the UI.
3. Retarget guide anchors to the primary review action, evidence region,
   structured result, and course-return control.
4. Verify old saved guide state resumes safely at the nearest valid stage or
   restarts without blocking Practice.
5. Run guide coordinator, definition, and renderer tests until green.

## Task 5 — Responsive, accessibility, and preservation verification

**Files**

- Modify: `course-companion/tests/teacher-practice-review-controls.test.ts`
- Modify or add responsive/static UI regression tests as appropriate.
- Modify: `course-companion/tests/electron-smoke.mjs`

**Steps**

1. Assert accessible names, busy/error/result live regions, keyboard focus,
   disabled state, and reduced-motion styling.
2. Add desktop and `390 × 844` smoke coverage for the compact bubble and the
   expanded Practice review surface, including no horizontal overflow.
3. Exercise not reviewed, reviewing, needs work, passed, stale-after-pass,
   disconnected, evaluator failure/retry, and duplicate-click behavior.
4. Exit Practice and prove the lesson/quiz Hỏi Triết chat, prior history, and
   composer are restored.
5. Compare affected page, scene, route, and navigation inventories with baseline;
   confirm none were removed or orphaned.

## Task 6 — Independent iterative adversarial QA

**Ownership:** A QA sub-agent may inspect and execute tests but must not edit
production, test, curriculum, or documentation files. It reports exact
reproductions and smallest likely boundaries to the primary agent.

**Scenarios**

- Attempt to reach Teacher chat through tabs, keyboard shortcuts, stale saved
  panel state, compact/full transitions, and reopen/resume paths.
- Double-click and concurrent-window review requests.
- Evidence changes during refresh/evaluation and after a passing result.
- Disconnected or wrong Executor binding, stale evidence, invalid evaluator JSON,
  timeout, restart, and retry.
- Ensure model summary text cannot grant completion, return, learner approval,
  or a checklist transition.
- Verify ordinary lesson and quiz Hỏi Triết remain fully functional.

Iterate production fixes and focused regressions until the agent reports no
remaining defect in these scenarios.

## Task 7 — Full verification and ledger synchronization

**Commands from `course-companion/`**

1. `npm run typecheck`
2. `npm run lint`
3. `npm test`
4. `npm run build`
5. `npm run test:electron`

**Repository checks**

1. Validate changed JSON/guide definitions and run `git diff --check`.
2. Review every changed file and confirm unrelated dirty work remains preserved.
3. Re-read the affected Foundation checkpoint in
   `docs/planning/portfolio-course-implementation-plan.md`.
4. Update implementation state, verification evidence, remaining gaps, and next
   permitted action without inferring owner approval or pilot acceptance.

## Completion criteria

- Active Practice exposes no direct Teacher-chat path.
- The same bubble visibly becomes `Duyệt Practice` and opens one unified review
  workspace.
- One primary action refreshes authoritative evidence and reviews that exact
  snapshot.
- Structured criteria and one next action make needs-work results actionable.
- Persisted structured state alone controls progress, completion, and return.
- Lesson and quiz Hỏi Triết behavior is preserved.
- Focused, adversarial, full unit, build, lint, typecheck, and Electron smoke
  verification pass, with any intentional skip or platform limitation reported.
