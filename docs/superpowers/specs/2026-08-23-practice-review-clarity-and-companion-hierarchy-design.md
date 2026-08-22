# Practice Review Clarity and Companion Hierarchy Design

- **Date:** 23 August 2026
- **Status:** Owner-approved design; implementation not started
- **Scope:** Course Companion Practice review, first-run guide steps 5–6,
  compact/windowed companion, full Practice review, and return-to-course loading
- **Authority preserved:** Exact bound-task evidence, fail-closed review,
  completion revocation after evidence regression, and one active Practice

## Problem

The current Practice review is technically stricter than its presentation. It
recomputes checklist state from current authoritative evidence and revokes a
completion receipt when that evidence no longer passes. The interface does not
explain that transition. A learner can therefore interpret a legitimate
regression as lost work or a complete progress reset.

Three concrete presentation defects make that confusion worse:

1. First-run guide step 5 describes the review button but intentionally has no
   primary action. The coach mark can cover the full review surface, leaving no
   obvious way to continue.
2. Only the surface that initiates a successful review immediately receives the
   returned workspace. Another open compact or full companion can continue to
   display stale progress.
3. The quick return control replaces its book/return icon with a border-only
   square while busy. Its small pixel font and control styling do not fit the
   Course App typography used around it.

The product principle for this repair is learner-first ordering: show what just
happened, where the learner is now, and what they should do next. Detailed
evidence follows only where the learner asks for or expects it.

## Goals

1. Keep the latest authoritative result honest while making every regression
   understandable.
2. Never make a changed step look like erased or never-started work.
3. Give guide step 5 a real review action and guide step 6 a real course-return
   action.
4. Keep the compact/windowed companion focused on one status, one change
   summary, and one next action.
5. Use the full Practice view for comparison, criteria, evidence, and complete
   step detail.
6. Synchronize every open Practice surface after persisted review transitions.
7. Make review and return loading states stable, readable, and consistent with
   the Course App.

## Non-goals

- Do not weaken exact-task binding, evidence freshness, or completion gates.
- Do not freeze an old pass when current evidence contradicts it.
- Do not add a learner-facing audit-log or timeline screen.
- Do not let Teacher edit files, change Codex settings, or approve on the
  learner's behalf.
- Do not redesign ordinary Hỏi Triết chat, course lesson pages, or unrelated
  Practice definitions.
- Do not introduce a new font dependency or a separate compact-app visual
  identity.

## Core behavior

### Authoritative progress may move backward

A successful review replaces the current result with the latest verified
result. If a previously verified requirement no longer passes, the affected
step becomes `stale` and is presented as `Cần xác minh lại`. It must not become
`pending`, `upcoming`, or `Chưa bắt đầu`.

Unaffected verified steps remain completed. For example, a five-step Practice
with one regressed setting becomes `4/5 bước đã xác minh`, with exactly one
stale step. It must not appear as `0/5`.

A regressed pass revokes the active completion receipt and disables course
return, as it does today. The UI explains that the learner's files, task, and
prior review have not been erased.

### A failed review changes nothing visible

The current result, checklist, completion state, and comparison remain visible
while a review is running. If metadata cannot be read, evidence changes during
review, or evaluation fails, the persisted review returns from `reviewing` to
the exact prior status. No new comparison is saved.

The learner sees:

> Không cập nhật được tiến độ. Kết quả duyệt gần nhất vẫn được giữ nguyên.

The specific actionable reason follows that sentence. A retry uses the same
authoritative review path.

### Successful review comparison

After a successful review, the interface derives a comparison with the prior
successful result:

- newly verified steps;
- steps that now need reverification;
- unchanged verified count;
- previous and current review times; and
- the first recommended next action.

On the first successful review, the summary says `Đã lưu kết quả kiểm tra đầu
tiên.` If a later review changes nothing, the summary says `Không có bước nào
thay đổi.` If one step regressed, it says:

> 1 bước cần xác minh lại. Công việc của bạn và kết quả duyệt trước vẫn được
> lưu.

The comparison is factual and generated from validated criteria and checklist
mapping. It is not model-authored prose.

## State and data model

### Bounded review history

The active Practice run retains its current `reviewResult` for compatibility
and adds a bounded `reviewHistory` collection containing the five most recent
validated successful review events, including the current event. Every
successful review appends one event and then trims the oldest event. Rechecking
unchanged evidence is still a real event with a new review time, but its
comparison reports no changed steps.

The history contains only existing validated review fields, criterion statuses,
evidence references, summaries, digests, and timestamps. It does not contain
task messages, secrets, or new workspace content. Historical records migrate by
seeding `reviewHistory` from the existing current `reviewResult`, when present,
or with an empty collection otherwise.

Only an explicit course-progress reset may delete this history. Review,
refresh, retry, window close, and app restart may not delete it.

### Derived comparison view

The main-process Practice presenter derives a `reviewComparison` view from the
two newest history entries and the current checklist. It exposes:

- prior and current review timestamps;
- prior and current completed counts;
- `newlyVerified` step summaries;
- `needsReverification` step summaries; and
- an unchanged result indicator; or
- a first-review indicator when no earlier successful result exists.

Renderer surfaces consume this view; they do not independently compare raw
criteria. This keeps compact and full wording consistent.

### Checklist reconciliation

For each checklist step:

- current criteria satisfied: `completed`;
- previously completed but a current required criterion is unsatisfied or
  unverifiable: `stale`;
- never completed and first unmet: `current`;
- never completed and blocked by an earlier unmet step: `upcoming`.

Later independently verified steps stay completed even when an earlier step
becomes stale. Counts include only `completed` steps.

## Atomic review transaction and surface synchronization

One review operation follows this order:

1. Load and identity-check the exact active run.
2. Persist `reviewing` without clearing the current result or checklist.
3. Broadcast a workspace-change notification so all open surfaces show one
   honest busy state while retaining the last result.
4. Read fresh evidence from the exact bound Codex task.
5. Validate that the run and evidence remained stable.
6. Evaluate and derive the new checklist and comparison inputs.
7. Atomically save the current result, bounded prior history, checklist, and
   completion state.
8. Broadcast another workspace-change notification.

Concurrent requests for the same run and generation continue to share one
pending review promise. A notification carries only Practice identity and a
monotonic revision or updated timestamp; each renderer reloads the authoritative
workspace through the existing narrow IPC API. Renderers never accept a review
result directly from another renderer.

On failure, the service clears `reviewing` back to the prior persisted result,
broadcasts the restored workspace revision, and returns the structured error.

## Compact/windowed companion

The compact companion answers only four questions, in this order:

1. **Where am I?** `4/5 bước đã xác minh` and a plain-language status badge.
2. **What changed?** One line such as `1 bước cần xác minh lại` or `Không có
   thay đổi từ lần kiểm tra trước`.
3. **What should I do now?** Exactly one recommended next action.
4. **What can I do?** One dominant action: review, fix in Codex, or return.

The complete checklist moves behind `Xem tất cả 5 bước`. Opening it shows the
existing single-open step disclosure; detailed criteria and raw evidence remain
exclusive to the full view.

Before review, the primary action is `Cập nhật và kiểm tra tiến độ`. While
reviewing, it remains the same size and reads `Đang cập nhật và kiểm tra…` with
supporting text `Kết quả gần nhất vẫn hiển thị trong lúc kiểm tra.`

After a pass, the dominant action becomes `Quay lại khóa học`. The compact
surface does not repeat the full evidence explanation.

## Full Practice review

The full view presents:

1. current status and primary review action;
2. `Thay đổi từ lần kiểm tra trước`;
3. current step and exactly one recommended next action;
4. the complete step list;
5. criterion explanations and evidence details; and
6. previous/current review times.

The change section lists only changed steps. Each regressed row uses `Cần xác
minh lại` and a reason derived from the current criterion result. The prior
review timestamp supports the claim that the earlier result remains recorded.

The existing detailed configuration, evidence, invalidation, and artifact
surfaces remain available below the task-first summary. They do not precede the
learner's status or next action.

## First-run guide

Guide step 5 adds the primary label `Cập nhật và kiểm tra ngay`. Its action calls
the same real `reviewPractice` workflow as the full review button. It must not
send a guide-only advancement event or simulate a result.

While reviewing, the guide keeps its dimensions, disables duplicate actions,
and shows `Đang cập nhật và kiểm tra…`.

- On error, the guide stays visible with the structured error and retry action.
- On `needs-work`, the guide stops obstructing the review surface. Its persisted
  cursor remains at step 5, but presentation is hidden while the latest result
  needs work. The learner sees the full change summary and next action.
- On a later pass, coordinator reconciliation advances the cursor to step 6.
- Step 6 anchors the real course-return action and labels it `Quay lại khóa
  học`.

This preserves semantic guide progression while ensuring the coach mark never
requires the learner to find a covered control.

## Return-to-course loading

All return controls preserve their geometry while busy.

- The text action reads `Đang lưu kết quả và quay lại…` and adds the reassurance
  `Kết quả đạt đã được lưu.`
- The top quick-return control keeps the book/return icon visible at reduced
  opacity and adds a small circular activity indicator as a badge.
- The activity indicator has `border-radius: 50%`; reduced-motion mode removes
  rotation but retains an unmistakable circular busy state.
- The return promise remains deduplicated. A failure restores the normal control
  and states that the saved passing result is still available.

No busy state may replace a readable control with a square glyph.

## Typography and visual hierarchy

The compact/windowed Practice companion uses the same existing `--app-font`
stack, Be Vietnam Pro assets, font weights, and sentence-case controls as the
Course App. It introduces no new font.

- Compact body, status, and action text: 13–14 px with readable line height.
- Full-view body and explanation text: 14–16 px.
- Headings and progress counts use the same app font with weight and size for
  hierarchy.
- Primary buttons use the app font and sentence case.
- The pixel font remains only on small decorative eyebrow labels such as
  `TRẠNG THÁI HIỆN TẠI`.

Status meaning is always written in text. Yellow, green, or muted styling may
reinforce but never replace the wording.

## Accessibility and focus

- Review and return containers expose `aria-busy` while retaining their
  accessible names.
- Successful review moves focus to the change summary in the initiating full
  surface. Compact surfaces announce the new status through a concise polite
  live region.
- Failed review uses an alert and leaves focus on the retryable primary action.
- Guide step 5 focuses its real primary action; needs-work dismissal returns
  focus to the change summary rather than a covered control.
- Keyboard, focus-visible, and reduced-motion behavior remain supported.
- Desktop, compact/windowed, and narrow layouts must not overflow horizontally.

## Error communication

Messages distinguish four cases:

- **Read/evaluation failure:** previous result is unchanged and retryable.
- **Evidence changed during review:** no new result was saved; finish the Codex
  change and retry.
- **Successful evidence regression:** the new result is current, affected steps
  need reverification, and prior work/history remain.
- **Return failure:** the passing result remains saved and return can be retried.

The terms `reset`, `lost`, and `start over` are reserved for the explicit course
reset flow and never appear for ordinary review regression.

## Verification strategy

### Unit and contract coverage

1. A 5/5 result followed by one regressed criterion becomes 4/5 with exactly
   one `stale` step and one `needsReverification` comparison row.
2. Unaffected completed steps remain completed across regression.
3. A failed or interrupted review preserves the current result, checklist,
   completion, prior history, and comparison exactly.
4. Every successful review appends one event and caps history at five records.
5. An identical digest records the new review event and reports no false step
   changes.
6. Completion is revoked after a real regression while prior review history is
   retained.
7. Concurrent review calls share one transaction.
8. Main-process workspace notifications cause compact and full surfaces to
   reload the same persisted revision.
9. Guide step 5 invokes real review, hides after needs-work, retries after error,
   and advances to step 6 only after an authoritative pass.
10. Return loading keeps the icon and control geometry, uses a circular
    indicator, and has a reduced-motion state.
11. Compact Practice typography resolves to `var(--app-font)`; pixel type is
    limited to decorative eyebrow labels.

### Dynamic verification

The Electron rehearsal opens both Practice surfaces and verifies:

- a review initiated in one surface updates the other;
- the last result remains visible while review is busy;
- one regressed criterion produces a clear 4/5 result and one stale step;
- the guide CTA performs the real review and exposes the correct next surface;
- passing review exposes the return action;
- return busy state retains geometry and never renders a square replacement;
- desktop, compact/windowed, and narrow layouts have no horizontal overflow;
  and
- relaunch preserves the current result, comparison, and bounded prior history.

Before delivery, run typecheck, lint, the full unit/startup suite, production
build, full Electron smoke, the installed-App-Server empty-task diagnostic, and
the exact bound-task diagnostic. Synchronize the affected implementation-plan
ledger without inferring overall owner approval or pilot acceptance.

## Acceptance criteria

The repair is complete when a beginner can answer, without inference:

1. What did the latest review find?
2. Did any previously verified step change, and why?
3. Is their previous work still present?
4. What is the one next action?
5. Where can they inspect details?
6. When is returning to the course allowed?

The compact and full surfaces must give consistent answers, with detail scaled
to the learner's immediate intent.
