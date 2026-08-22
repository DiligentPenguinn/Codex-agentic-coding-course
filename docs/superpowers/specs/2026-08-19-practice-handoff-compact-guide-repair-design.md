# Practice ownership handoff, compact review, and guide repair

**Date:** 19 August 2026
**Status:** Owner-approved design; implementation pending
**Scope:** Course Companion Practice workflow only

## Problem

Three defects remain in the Practice experience:

1. Course Companion resumes the bound Practice thread through Codex App Server
   immediately before opening the same thread in Codex Desktop. Codex therefore
   reports that the task is open in another app.
2. The compact/windowed Triết surface renders the same dense evidence and
   explanatory content as the full-screen review workspace.
3. Step 5 of the first-run Practice guide explains review but provides no
   visible `Tiếp` action.

Normal Hỏi Triết outside Practice, course content, Practice evidence authority,
and completion gates remain unchanged.

## Approved behavior

### Explicit task ownership handoff

Course Companion may hold the bound Practice thread only while collecting an
authoritative snapshot. Before opening that task in Codex Desktop, Course
Companion must fully release its App Server ownership.

The same lifecycle applies to a new Practice and a resumed Practice:

1. Resolve and validate the exact persisted Practice binding.
2. Perform any required bootstrap or baseline capture.
3. Close the App Server session that touched the bound thread and wait for it to
   exit.
4. Open the exact thread through the Codex deep link.

When Course Companion refreshes or reviews Practice evidence, it may reconnect,
read only the exact bound thread, persist the resulting snapshot, and then
release the connection again. A failed read preserves the previous snapshot and
reports stale or unavailable evidence; it must not silently switch threads.

This lifecycle must not create a replacement thread, ask the learner to find a
thread manually, or weaken the exact-thread binding.

### Compact progress-only projection

The compact/windowed Practice surface is a concise projection of the same
authoritative workspace used by full-screen review. It shows only:

- overall review status;
- completed-step count and the current step;
- one next action;
- `Cập nhật & duyệt tiến độ`; and
- `Quay lại khóa học` after an authoritative pass.

It does not show objectives, expected outcomes, lesson-context chrome,
criterion explanations, configuration values, evidence lists, timestamps,
artifact details, invalidation details, or approval controls. Those remain in
the full-screen review workspace.

Compact mode must provide a clear full-screen expansion control. It must not
introduce a second review state, derive pass/fail from rendered copy, or restore
direct Teacher chat.

### Guide step 5

Step 5 receives a primary button labelled `Tiếp`.

Selecting `Tiếp` acknowledges the explanation and moves the guide into a
waiting state. It does not trigger review and cannot advance the learner to the
return step. Step 6 becomes visible only after the persisted Practice review is
`passed`. A failed or not-yet-run review keeps the return step unavailable.

The existing `Bỏ qua hướng dẫn` and Escape-to-pause behavior remain available.

## Error handling and recovery

- App Server shutdown is awaited before the Codex deep link opens.
- A shutdown or deep-link failure leaves the Practice run and binding intact and
  exposes the existing retry path.
- Evidence refresh failures preserve the last structured review result and mark
  freshness accurately.
- Unknown or unavailable Practice authority remains fail-closed: no chat
  controls, detailed evidence, or return action are inferred.
- Repeated open/resume actions are serialized so ownership cannot overlap.

## Verification

Automated and adversarial coverage must include:

- new Practice: bootstrap, release ownership, then open the exact Codex thread;
- resumed Practice: snapshot/release/open without creating another thread;
- review followed by return to Codex without the “open in another app” state;
- shutdown and deep-link failures preserving the active run and retry path;
- compact rendering containing only status, step count/current step, next action,
  review, and eligible return controls;
- full-screen rendering retaining criteria, configuration/evidence details,
  timestamps, warnings, and Practice approval controls;
- desktop and narrow layouts without horizontal overflow;
- guide step 5 showing `Tiếp`, acknowledgement without review bypass, and step 6
  appearing only after an authoritative pass; and
- restoration of normal Hỏi Triết after Practice completion.

Run focused tests while iterating, then typecheck, lint, the complete unit and
startup suites, production build, full Electron smoke, and read-only adversarial
QA with a sub-agent.

## Non-goals

- Rewriting course or guide copy beyond adding the approved `Tiếp` label.
- Changing Practice criteria, completion destinations, or evidence policy.
- Restoring direct Teacher chat during Practice.
- Creating duplicate Codex tasks or allowing focus-based thread inference.
