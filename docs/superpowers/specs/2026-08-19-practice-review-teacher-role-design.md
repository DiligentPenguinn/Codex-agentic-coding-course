# Practice Review Teacher Role Design

**Date:** 19 August 2026  
**Status:** Approved interaction, architecture, and verification design  
**Scope:** Course Companion Teacher surfaces while an authoritative Practice is active

## Problem

The Teacher currently presents the same chat-oriented interface during lessons,
quizzes, and Practice. During Practice, however, the learner should work with the
bound Codex Executor rather than chat directly with the Teacher. The Teacher's
Practice role is to refresh authoritative evidence, review progress, explain the
review result, and expose the next permitted learner action.

The existing compact window hides that role behind a small header icon and keeps
the chat log, chat tab, composer, and send controls dominant. This creates the
wrong interaction model and makes the review feature difficult for a beginner to
discover.

## Product decision

Direct Teacher chat remains available during lessons and quizzes. This change
applies only while `PracticeWorkspaceView.activePractice` is present.

During an active Practice, the existing floating Teacher bubble remains, but its
visible label changes contextually from `Hỏi Triết` to `Duyệt Practice`. Opening
it shows one unified review workspace. The Practice surface has no chat tabs,
conversation log, failed-message retry control, message composer, or send action.

The selected layout is a single review workspace rather than separate `Duyệt`
and `Chi tiết` tabs or a chronological monitoring feed. This keeps the primary
action and current evidence together and minimizes navigation for a beginner.

## Practice review hierarchy

The compact and full Practice Teacher surfaces use the same semantic hierarchy:

1. Current Practice identity and review readiness.
2. One prominent `Cập nhật & duyệt tiến độ` action.
3. The latest structured review result.
4. Current evidence and checklist progress.
5. Contextual learner-owned actions, manual refresh, and return to the course.

The primary action automatically refreshes the latest authoritative Practice
evidence and then reviews the immutable refreshed snapshot. A smaller manual
`Làm mới` action remains available for troubleshooting and inspection without
running a review.

## Review result

The latest review is presented as structured state rather than as a chat message.
It includes:

- the overall result: not reviewed, reviewing, passed, needs work, stale, or
  unavailable;
- the review summary;
- criterion-by-criterion findings from `review.result.criteria`;
- the single recommended next action; and
- the observation/review time when available.

A needs-work result must identify which criteria need attention and what the
learner should do next. A passing result exposes `Quay lại khóa học` only when
the persisted workspace state says return is permitted.

Teacher prose never creates progress, approval, completion, or course-return
authority. Those transitions remain derived from structured, persisted Practice
state.

## Component boundary

`TeacherWorkspace` remains the shared shell because the same bubble and window
mechanics are used in and outside Practice. It derives its mode exclusively from
the authoritative `PracticeWorkspaceView.activePractice` value.

The shell renders one of two mutually exclusive bodies:

- **Learning mode:** the existing Hỏi Triết conversation, history, composer, and
  lesson/quiz behavior.
- **Practice mode:** a dedicated review body built around `PracticeProgress`, the
  primary review action, structured review results, and learner-owned Practice
  controls.

Conversation state may remain persisted, but Practice mode neither displays it
nor offers a path to create or retry messages. Leaving Practice restores the
existing learning-mode conversation without deleting its history or draft.

The full-screen Practice guide must be updated so it no longer teaches an
`ask-teacher` stage or points to removed chat controls. Its anchors and panel
selection state must target the unified review workspace.

## Main-process data flow

The renderer invokes the existing narrow Practice review IPC operation. The
main-process review service owns the transaction:

1. Resolve the exact active Practice run and binding.
2. Refresh or collect evidence from that bound run.
3. Freeze the evidence snapshot and its identity/digest.
4. Evaluate that snapshot with the Practice review evaluator.
5. Reject results if the active run, generation, binding, or relevant evidence
   changed before persistence.
6. Persist the structured review result and derived progress.
7. Return the newly resolved `PracticeWorkspaceView`.

Concurrent clicks share or reject the same in-flight review rather than starting
overlapping evaluations. The renderer also disables the primary action and uses
an accessible busy announcement while this operation is active.

Manual refresh updates evidence and workspace state without treating the refresh
as a review or changing a review result to passed.

## Failure and stale-state behavior

If evidence refresh or evaluation fails, the last known review remains visible.
The UI identifies it as not newly verified, shows a concise retryable error, and
does not clear learner progress.

If evidence changes after a passing review, existing invalidation rules make the
review stale and remove return eligibility until the required evidence is
reviewed again. A disconnected Executor or unverifiable evidence cannot produce
a new passing result.

The surface must not imply that an error, timeout, model summary, or locally
cached message means Practice is complete.

## Copy and accessibility

All new learner-facing copy is natural Vietnamese with full diacritics. During
Practice, the visible identity and primary action use outcome-oriented wording:

- bubble: `Duyệt Practice`;
- primary action: `Cập nhật & duyệt tiến độ`;
- result headings: `Đã đạt`, `Cần bổ sung`, or a precise unavailable/stale state;
- supporting refresh: `Làm mới bằng chứng`.

Busy, error, and result changes use appropriate live regions without repeatedly
announcing the full evidence panel. Controls remain keyboard reachable with
visible focus. Loading decoration respects reduced-motion preferences. Compact
and full surfaces must avoid horizontal overflow at the supported narrow size.

## Preserved behavior

- Lesson and quiz Hỏi Triết chat remains unchanged.
- The existing Teacher bubble/window mechanics remain available.
- The Teacher remains read-only and cannot edit files or control Executor work.
- Learner approvals and revision requests remain explicit structured actions.
- Persisted Practice review state, not model prose, controls course return.
- No course page, scene, route, or approved surrounding course copy is removed.

## Verification

### Deterministic tests

- Practice mode contains no chat tab, chat log, composer, send, or retry path.
- Learning mode retains the existing Hỏi Triết conversation behavior.
- Bubble and panel labels switch only from authoritative active-Practice state.
- The primary action refreshes evidence before evaluation and prevents duplicate
  concurrent reviews.
- Review criteria, summary, next action, freshness, and time render from
  structured review state.
- Review failures preserve the previous result and never create pass/return
  eligibility.
- Evidence changes invalidate a prior pass and require a new review.
- Full-screen guide stages and anchors contain no Practice chat instruction.
- Desktop and narrow layouts have no horizontal overflow and retain accessible
  labels, focus, live status, disabled behavior, and reduced motion.

### Scenario and adversarial testing

Exercise active Practice with fresh, stale, disconnected, incomplete, and
changing evidence; needs-work and passing results; evaluator failure and retry;
double submission; pass invalidation; return gating; and exit from Practice back
to normal Hỏi Triết chat. A sub-agent independently probes state-transition and
authority-boundary regressions and feeds defects back into iterative fixes.

### Full acceptance checks

Run Course Companion typecheck, lint, the complete unit suite, production build,
and Electron smoke. Reconcile the affected implementation-plan checkpoint from
repository evidence without inferring owner approval or pilot acceptance.

## Out of scope

- Removing or redesigning Hỏi Triết outside Practice.
- Allowing Teacher to send instructions to the Executor or edit Practice files.
- Replacing deterministic Practice completion gates with model judgment.
- Adding a general notification timeline or long-term review-history product.
- Changing course content, assessment content, or Practice definitions except
  where guide anchors must be synchronized with the new interaction.
