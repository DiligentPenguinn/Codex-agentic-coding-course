# Practice Review Clarity and Companion Hierarchy Implementation Plan

**Design:** `docs/superpowers/specs/2026-08-23-practice-review-clarity-and-companion-hierarchy-design.md`

**Objective:** Make authoritative Practice review changes understandable,
synchronize compact and full companion surfaces, make first-run guide steps 5–6
actionable, align Practice typography with the Course App, and replace the
square return loader without weakening any Practice gate.

## 1. Capture the current behavior with failing tests

**Files**

- Modify `course-companion/tests/practice-review-checklist-regression.test.ts`.
- Modify `course-companion/tests/practice-review-state-recovery.test.ts`.
- Modify `course-companion/tests/practice-guide-renderer.test.ts`.
- Modify `course-companion/tests/teacher-practice-review-controls.test.ts`.
- Modify `course-companion/tests/module-one-practice-renderer.test.ts`.
- Add `course-companion/tests/practice-review-comparison.test.ts`.

**Work**

1. Add a regression fixture where a previously passed five-step configuration
   review changes one fresh criterion. Assert that four steps remain completed,
   the affected step becomes `stale`, and the UI-facing count is 4/5.
2. Add a failed-review fixture that snapshots the prior current result,
   checklist, completion, and history and proves all remain byte-for-byte
   equivalent after recovery.
3. Change the guide contract test to require a real primary label for step 5
   instead of enforcing the current missing button.
4. Add source/render contracts requiring Course App font usage on readable
   compact Practice text and a circular, geometry-preserving return loader.
5. Add comparison tests for first review, unchanged recheck, one regression,
   one recovery, and multiple simultaneous changes.
6. Run the focused tests and record the expected failures before production
   edits.

**Checkpoint:** The defects are reproducible without altering runtime code.

## 2. Add bounded review history and migration

**Files**

- Modify `course-companion/electron/main/practice-run-repository.ts`.
- Modify `course-companion/shared/contracts.ts`.
- Modify `course-companion/tests/practice-run-repository.test.ts`.
- Modify `course-companion/tests/practice-review-state-recovery.test.ts`.

**Work**

1. Add validated `reviewHistory` state to each active and archived Practice run.
   Keep the five newest successful `PracticeReviewResult` events, including the
   current result.
2. Preserve `reviewResult` as the current-result compatibility field and require
   it to match the newest history entry when history is non-empty.
3. Migrate an existing run with `reviewResult` to a one-entry history and a run
   without a review to an empty history. Preserve archived runs and existing
   completion receipts.
4. In `saveReview`, append the validated successful review event, trim to five,
   and save the current result, checklist, history, and completion through one
   repository write.
5. Do not append history in `beginReview`, `clearReviewing`, evidence refresh,
   error recovery, or return-to-course.
6. Prove repeated identical source digests create distinct successful review
   events with their own timestamps while remaining capped at five.
7. Prove only the explicit repository/course reset removes review history.

**Focused verification**

```powershell
npx vitest run tests/practice-run-repository.test.ts tests/practice-review-state-recovery.test.ts
```

**Checkpoint:** Current and prior successful reviews survive restart and can be
compared without exposing new sensitive data.

## 3. Derive factual review comparisons and stale checklist state

**Files**

- Add `course-companion/electron/main/practice-review-comparison.ts`.
- Modify `course-companion/electron/main/practice-review-contracts.ts`.
- Modify `course-companion/electron/main/practice-coordinator.ts`.
- Modify `course-companion/shared/contracts.ts`.
- Modify `course-companion/tests/practice-review-comparison.test.ts`.
- Modify `course-companion/tests/practice-review-checklist-regression.test.ts`.
- Modify `course-companion/tests/practice-coordinator.test.ts`.

**Work**

1. Add a pure comparison module that maps the two newest validated reviews and
   checklist definitions to a `PracticeReviewComparisonView`.
2. Include prior/current timestamps and completed counts, first-review and
   unchanged flags, and step summaries grouped as `newlyVerified` and
   `needsReverification`.
3. Derive reasons only from validated criterion explanations and checklist-step
   mappings; do not call a model or generate speculative copy.
4. Update checklist reconciliation:
   - satisfied current criteria produce `completed`;
   - previously completed steps with a current unsatisfied or unverifiable
     required criterion produce `stale`;
   - the first never-completed unmet step produces `current`;
   - later never-completed blocked steps produce `upcoming`;
   - independently satisfied later steps remain completed.
5. Expose the comparison in `PracticeWorkspaceView` from the main-process
   coordinator. Renderers must not compare raw review results independently.
6. Cover configuration, planning-package, and missing-prior-review cases.

**Focused verification**

```powershell
npx vitest run tests/practice-review-comparison.test.ts tests/practice-review-checklist-regression.test.ts tests/practice-coordinator.test.ts
```

**Checkpoint:** A legitimate evidence regression is strict but cannot resemble
lost or never-started work.

## 4. Synchronize persisted review lifecycle across companion surfaces

**Files**

- Modify `course-companion/electron/main/practice-review-service.ts`.
- Modify `course-companion/electron/main/index.ts`.
- Modify `course-companion/electron/preload/index.ts`.
- Modify `course-companion/shared/contracts.ts`.
- Add `course-companion/src/renderer/src/hooks/usePracticeWorkspaceSync.ts`.
- Modify `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`.
- Modify `course-companion/tests/practice-review-service.test.ts`.
- Add `course-companion/tests/practice-workspace-sync.test.ts`.
- Modify `course-companion/tests/teacher-practice-review-controls.test.ts`.

**Work**

1. Define a narrow `PracticeWorkspaceChangedEvent` containing active-run
   identity plus a monotonic persisted revision or `updatedAt`. Do not send raw
   evidence through the notification.
2. Notify only after persisted review lifecycle transitions: `reviewing`,
   successful review, and failed-review restoration.
3. Keep current review, checklist, comparison, and completion visible while the
   persisted status is `reviewing`.
4. Continue coalescing concurrent reviews for the same run and generation.
5. Expose a preload subscription that returns a cleanup function and validates
   the event shape.
6. Move renderer loading/subscription ordering into `usePracticeWorkspaceSync`.
   Ignore stale revisions, reload through the existing authoritative workspace
   IPC, and preserve the last good view if reload fails.
7. Use the hook in both windowed and full `TeacherWorkspace` instances so a
   review started in either surface produces the same busy and completed state
   in both.
8. Keep an initiating-surface error actionable while the other surface reloads
   the restored prior result.

**Focused verification**

```powershell
npx vitest run tests/practice-review-service.test.ts tests/practice-workspace-sync.test.ts tests/teacher-practice-review-controls.test.ts
```

**Checkpoint:** Compact and full Practice surfaces converge on one persisted
review transaction and cannot silently display different results.

## 5. Make guide steps 5–6 invoke the real actions

**Files**

- Modify `course-companion/content/practice-guides/m1-practice-mode-first-run.json`.
- Modify `course-companion/src/renderer/src/components/PracticeGuide.tsx`.
- Modify `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`.
- Modify `course-companion/electron/main/practice-guide-coordinator.ts`.
- Modify `course-companion/tests/practice-guide-definition-repository.test.ts`.
- Modify `course-companion/tests/practice-guide-renderer.test.ts`.
- Modify `course-companion/tests/practice-guide-coordinator.test.ts`.
- Modify `course-companion/tests/electron-smoke.mjs`.

**Work**

1. Give step 5 the primary label `Cập nhật và kiểm tra ngay` and step 6 the
   primary label `Quay lại khóa học`.
2. Add explicit `onReview` and `onReturn` action boundaries to `PracticeGuide`.
   Step 5 must call the same `reviewPractice` path as the main review button;
   step 6 must call the same deduplicated return path as the main return button.
3. Pass shared busy and structured action-error state into the guide. Retain its
   dimensions and accessible name while an action is running.
4. If review fails, keep step 5 visible with the preserved-result message and a
   retryable primary action.
5. If review returns `needs-work`, keep the persisted cursor at step 5 but hide
   its presentation so the change summary and next action are unobstructed.
6. On a later authoritative pass, reconcile to step 6. Never advance merely
   because a guide button was clicked.
7. Preserve replay, pause, skip, restart, stranded-cursor repair, and mastery
   confirmation semantics.

**Focused verification**

```powershell
npx vitest run tests/practice-guide-definition-repository.test.ts tests/practice-guide-renderer.test.ts tests/practice-guide-coordinator.test.ts
```

**Checkpoint:** The guide demonstrates the real learner workflow without
covering the action it expects the learner to find.

## 6. Implement the compact/full information hierarchy

**Files**

- Add `course-companion/src/renderer/src/components/PracticeReviewOverview.tsx`.
- Modify `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`.
- Modify `course-companion/src/renderer/src/components/PracticeProgress.tsx`.
- Modify `course-companion/src/renderer/src/styles.css`.
- Add `course-companion/tests/practice-review-overview.test.ts`.
- Modify `course-companion/tests/teacher-practice-review-controls.test.ts`.
- Modify `course-companion/tests/practice-guide-renderer.test.ts` if the anchor
  moves into the overview component.

**Work**

1. Create one typed overview component so compact and full surfaces share
   status, comparison, next-action, button labels, anchors, and live-region
   semantics.
2. Windowed/compact order:
   - `n/total bước đã xác minh` and status badge;
   - one comparison line;
   - exactly one recommended next action;
   - one dominant review or return action;
   - collapsed `Xem tất cả n bước` disclosure.
3. Full-view order:
   - current status and review action;
   - `Thay đổi từ lần kiểm tra trước`;
   - current step and one next action;
   - complete checklist;
   - criteria, evidence, configuration, artifact, and invalidation details;
   - prior/current review times.
4. Use exact learner-facing states:
   - first result: `Đã lưu kết quả kiểm tra đầu tiên.`;
   - unchanged: `Không có bước nào thay đổi.`;
   - regression: `n bước cần xác minh lại. Công việc của bạn và kết quả duyệt trước vẫn được lưu.`;
   - failure: `Không cập nhật được tiến độ. Kết quả duyệt gần nhất vẫn được giữ nguyên.`
5. Reserve `reset`, `mất`, and `bắt đầu lại` wording for explicit course reset.
6. Focus the full change summary after a successful initiating review; announce
   the concise new compact state through a polite live region.
7. Keep evidence detail accessible but subordinate to status and next action.

**Focused verification**

```powershell
npx vitest run tests/practice-review-overview.test.ts tests/teacher-practice-review-controls.test.ts tests/practice-guide-renderer.test.ts
```

**Checkpoint:** Each surface answers the learner's immediate question at the
appropriate level of detail without contradicting the other surface.

## 7. Align typography and repair return loading

**Files**

- Add `course-companion/src/renderer/src/components/PracticeReturnAction.tsx`.
- Modify `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`.
- Modify `course-companion/src/renderer/src/components/PracticeProgress.tsx`.
- Modify `course-companion/src/renderer/src/styles.css`.
- Modify `course-companion/tests/module-one-practice-renderer.test.ts`.
- Modify `course-companion/tests/teacher-practice-review-controls.test.ts`.
- Modify `course-companion/tests/electron-smoke.mjs`.

**Work**

1. Apply the Course App's existing `var(--app-font)`/Be Vietnam Pro stack to
   compact and full Practice headings, progress counts, body text, statuses,
   comparison text, and sentence-case action labels.
2. Keep `var(--pixel-font)` only for small decorative eyebrow labels. Do not
   add or download fonts.
3. Use 13–14 px readable compact text and 14–16 px full-view body text with
   existing Course App weights and line-height rhythm.
4. Render quick-icon and text-button variants through
   `PracticeReturnAction.tsx` so both use one busy-state contract while keeping
   their distinct information density.
5. Keep return-control geometry fixed while busy.
6. Preserve the quick-return book icon at reduced opacity and add a small
   circular activity badge instead of replacing it.
7. Give every spinner `border-radius: 50%`. In reduced-motion mode, stop
   rotation while retaining a circular visible busy indicator.
8. Change text return actions to `Đang lưu kết quả và quay lại…` and show
   `Kết quả đạt đã được lưu.` while pending.
9. On return failure, restore the normal action and state that the passing
   result remains saved and retryable.
10. Verify focus-visible, disabled, hover, contrast, and status-without-color
   behavior.

**Checkpoint:** Windowed Practice looks like the Course App at compact density,
and no loading state produces a square replacement glyph.

## 8. Expand dynamic regression coverage

**Files**

- Modify `course-companion/tests/electron-smoke.mjs`.
- Modify `course-companion/tests/practice-review-service.test.ts`.
- Modify `course-companion/tests/practice-review-checklist-regression.test.ts`.
- Modify `course-companion/tests/practice-guide-coordinator.test.ts`.
- Modify `course-companion/tests/teacher-practice-review-controls.test.ts`.

**Work**

1. Exercise guide step 5 through its own primary action rather than clicking a
   covered underlying control.
2. Keep compact and full Practice surfaces open during one review; assert both
   show the same persisted revision and counts.
3. Start from 5/5, change one deterministic fixture criterion, review again,
   and assert 4/5 plus exactly one `Cần xác minh lại` row and the preserved-work
   message.
4. Trigger a deterministic review failure and assert the prior result remains
   visible on both surfaces.
5. Correct the criterion, review to pass, and assert guide step 6 and all return
   actions become available.
6. Capture return-action geometry before and during loading; assert width and
   height do not change, the book icon remains, and the busy indicator is
   circular.
7. Verify desktop, compact/windowed, and `390 × 844` layouts have no horizontal
   overflow and maintain readable text.
8. Relaunch and assert the current result, comparison, and five-entry history
   cap survive.

**Checkpoint:** The exact interaction failures reported by the owner are
covered dynamically, not only by source-string assertions.

## 9. Run complete verification and real diagnostics

From `course-companion/`, run:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:electron
npm run test:practice-runtime
npm run test:practice-bound-runtime -- "C:\Users\hoang\AppData\Roaming\course-companion\practice-runs.json" "C:\Users\hoang\.codex"
```

Then run `git diff --check` from the repository root.

Audit that:

- no review path calls global course or Practice reset;
- exact-task binding and non-owning metadata reads remain intact;
- a regression revokes completion but retains history and learner work;
- review errors retain the exact prior result;
- compact and full surfaces synchronize only from persisted state;
- guide progression still requires authoritative pass;
- Practice definitions, receipt counts, and Teacher/Executor boundaries are
  unchanged; and
- the worktree contains no unrelated course-copy or page-topology changes.

**Checkpoint:** Static, dynamic, packaged Electron, empty-task, and exact
active-task evidence all support the repair.

## 10. Synchronize the implementation ledger and commit

**Files**

- Modify `docs/planning/portfolio-course-implementation-plan.md`.

**Work**

1. Re-read the affected Foundation checkpoint and current Practice-repair
   ledger entries.
2. Record exact test counts, Electron scenarios, runtime diagnostic output,
   comparison/history behavior, compact/full synchronization, remaining gaps,
   and the next permitted action.
3. Mark implementation and verification only from repository evidence. Do not
   infer overall owner approval or pilot acceptance.
4. Review every changed file, run `git diff --check`, stage only this repair,
   and create a scoped implementation commit.
5. Confirm the final worktree is clean. Do not push unless explicitly asked.

**Definition of done:** A learner can immediately tell what the latest review
found, what changed, what remained saved, what to do next, where to inspect
details, and whether returning to the course is currently allowed.
