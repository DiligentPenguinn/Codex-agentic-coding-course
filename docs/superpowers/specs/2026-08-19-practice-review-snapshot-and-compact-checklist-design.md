# Practice review snapshot and compact checklist repair

**Date:** 19 August 2026
**Status:** Owner-approved design; implementation pending
**Scope:** Practice workflow only

## Problem

Two defects remain in the Practice review experience:

1. The compact/windowed Triết surface shows only the next checklist step rather
   than the full Practice checklist and its progress.
2. Review still refreshes the bound Practice task through `thread/resume`.
   After Course Companion hands ownership to Codex Desktop, that resume creates
   a second-owner conflict. Review can then appear to do nothing while the full
   workspace reports disconnected evidence.

The earlier ownership repair correctly releases Course Companion before opening
the task in Codex Desktop. This design completes that repair by making subsequent
Practice observation non-owning.

## Approved compact checklist

The compact/windowed Practice surface shows:

- the overall completed-step count and review status;
- every ordered Practice checklist step;
- each step's status icon, title, and short state label;
- one collapsed disclosure control per step;
- guidance for a step only after the learner expands that row;
- `Cập nhật & duyệt tiến độ`; and
- `Quay lại khóa học` only after an authoritative pass.

All step rows are collapsed by default. The compact surface uses a single-open
accordion: expanding one row closes the previously expanded row. Expanding or
collapsing a row does not change Practice state, evidence, or completion.

The compact surface still excludes raw configuration values, criterion
explanations, evidence lists, timestamps, artifact details, invalidation
details, and approval controls. Those remain in the full-screen workspace.

## Non-owning Practice snapshot

Review must not call `thread/resume`, start a turn, subscribe to the bound
Practice task, or otherwise claim task ownership. It collects the exact bound
task through a read-only snapshot path:

1. Load the authoritative active Practice run and exact persisted binding.
2. Read the exact thread without resuming it.
3. Load exact persisted task metadata through a read-only adapter.
4. Validate thread ID and workspace against the Practice binding.
5. Rebuild the normalized activity and configuration snapshot.
6. Reconcile workspace evidence and learner decisions.
7. Freeze the same review envelope used by the existing evaluator.
8. Evaluate, persist, and render the result.

The snapshot adapter must be isolated behind a narrow interface so internal
Codex persistence details do not leak into review, UI, or completion logic. It
must open any local metadata store read-only, use the exact thread key, validate
the expected schema and values, and fail closed on incompatibility.

## Context-parity invariant

The change is transport-only. Before evaluation, the Teacher receives the same
semantic context as the previous successful review path:

- exact Practice identity, version, run, generation, binding, and checkpoint;
- normalized Executor activity and complete readable turns;
- normalized model, reasoning effort, service tier, approval policy, sandbox,
  active permission profile, and Full access state;
- workspace baseline and reconciled changed-file evidence;
- Practice-specific evidence and invalidations;
- learner decisions and approvals;
- checklist state and prior review state;
- freshness, connection, and observation timestamps; and
- the same definition, rubric, and completion destination.

The review envelope and evaluator contract remain unchanged. Context-parity
tests must compare the old normalized fixture output with the new snapshot
output field by field. Missing or ambiguous source values remain unverifiable;
the adapter must never infer a passing value merely to preserve parity.

## Connection and error semantics

Practice review is evidence collection, not direct Teacher chat. The Practice
workspace therefore reports evidence status rather than the Teacher chat
transport label.

Clicking review must always produce visible feedback:

- the button enters a busy state immediately;
- success refreshes all checklist rows and the overall result;
- failure preserves the last structured result;
- the failure appears adjacent to the review action with a specific recovery
  instruction; and
- retry remains available unless another review is already active.

Errors distinguish at least:

- the bound task is still producing a turn;
- exact task metadata is temporarily unavailable;
- the read-only App Server connection is unavailable;
- the task binding or workspace does not match; and
- evidence changed while the review was running.

Unknown state fails closed. It cannot unlock return, synthesize progress, switch
threads, or fall back to whichever Codex window is focused.

## Ownership boundaries

- Codex Desktop remains the sole owner of the learner's open Practice task.
- Course Companion uses only non-owning reads for that task.
- Teacher evaluation, when required, uses its separate review transport.
- Review transport is released after success, needs-work, or failure.
- Normal Hỏi Triết behavior outside Practice is unchanged.
- Direct Teacher chat remains unavailable during Practice.

## Verification

Automated coverage must include:

- proof that review sends zero `thread/resume`, `turn/start`, thread-switch, or
  focus-based lookup requests;
- exact-thread and exact-workspace validation;
- field-by-field context parity for configuration and planning Practices;
- real ownership behavior while Codex Desktop keeps the Practice task open;
- review success, needs-work, repeated review, concurrent review, disconnect,
  incompatible metadata, and mid-review evidence changes;
- preservation of prior results and visible actionable errors;
- every compact checklist step rendering in order and collapsed by default;
- click and keyboard disclosure behavior without changing Practice state;
- compact exclusion of detailed evidence and full-screen retention of it;
- desktop and narrow layouts without overflow;
- restart/reset recovery and restored normal Hỏi Triết after return; and
- independent read-only adversarial QA with a sub-agent.

Run focused tests during implementation, followed by typecheck, lint, all unit
and startup tests, production build, full Electron smoke, a real App Server
ownership diagnostic, and `git diff --check`.

## Non-goals

- Changing Practice criteria, rubric, completion rules, or course copy.
- Allowing stale or learner-reported settings to count as verified metadata.
- Controlling, closing, or navigating the learner's Codex Desktop task.
- Restoring direct Teacher chat during Practice.
- Moving full-screen evidence details into the compact window.
