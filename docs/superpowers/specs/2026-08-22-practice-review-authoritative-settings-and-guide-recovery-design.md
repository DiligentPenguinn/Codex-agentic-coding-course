# Practice review authoritative settings and guide recovery

**Date:** 22 August 2026
**Status:** Implemented and technically verified; overall Foundation approval and pilot acceptance pending
**Scope:** Module 1 Practice review, first-run Practice guide, and verification gates

## Problem

The Module 1 Practice workflow has two coupled regressions:

1. `Cập nhật & duyệt tiến độ` cannot obtain the effective configuration of a
   newly created Codex task. The workspace reports that fresh task metadata is
   unavailable and review cannot proceed.
2. The first-run guide appears to stop after step 5. Its durable cursor advances
   to step 6 before review passes, but step 6 is hidden until an authoritative
   pass, leaving no guide visible.

The learner found both defects in a real end-to-end run. Existing automated
verification did not reproduce the runtime state that caused the first defect,
and one guide test explicitly treated the second defect as intended behavior.
The repair therefore includes a stronger verification contract rather than only
changing the production paths.

## Root cause

The original automatic configuration path captured the exact bound task's
effective configuration from Codex App Server when the task was created. Live
`thread/settings/updated` notifications then kept that saved snapshot current.

That observer was long-lived. After Codex Desktop became the learner-facing
owner of the task, Course Companion could remain a competing writer and trigger
the task-open-in-another-app failure. The ownership repair correctly removed
the long-lived resume observer, but replaced it with a rollout-file reader that
expects an `event_msg/thread_settings_applied` item.

Current newly created Codex Desktop tasks can have only `session_meta` in their
rollout until a setting changes or a turn is started. They do not persist a
redundant settings event when the configuration already equals the task-start
values. The replacement reader incorrectly discarded the exact saved
`thread-start` configuration in that valid case. The tests generated a later
settings event themselves, so they verified the reader against an invented
happy path rather than the empty-task state produced by the current runtime.

The guide regression was introduced alongside that ownership repair. Step 5
changed from the semantic `review-requested` advancement event to a generic
`continue` event with its own `Tiếp` control. The guide then durably enters
`return-to-course` even when review is still `needs-work`; the coordinator hides
that stage because return is not yet allowed.

## Approved configuration design

Practice review uses the exact saved task-start configuration as its baseline
and applies a later persisted settings event when one exists:

1. Load the authoritative active Practice run and exact persisted task binding.
2. Start the dedicated read-only Practice verification transport.
3. Call `thread/read` for the exact thread.
4. Validate the returned thread ID and workspace against the binding.
5. Fail with the existing busy diagnostic if any turn is in progress.
6. Resolve the exact rollout through the read-only Codex state database and
   validate its thread ID, workspace, filename, and sessions-root containment.
7. Scan a stable rollout snapshot for the latest valid
   `thread_settings_applied` event.
8. If an event exists, normalize it and let it supersede the baseline. If no
   event exists, validate and use the exact persisted `thread-start` snapshot.
9. Reconcile the exact thread activity and workspace evidence.
10. Continue through the existing review envelope and evaluator.
11. Stop the dedicated read-only transport in `finally`, on success,
    needs-work, busy state, protocol failure, validation failure, or evaluator
    failure.

The verifier never resumes a task, starts a turn, sends a prompt, chooses a
focused window, switches tasks, or keeps a settings subscription alive. It uses
only `thread/read` plus read-only persisted evidence, so it never acquires task
ownership. This retains automatic, authoritative verification without restoring
the old competing owner.

The baseline-plus-updates model is authoritative because Codex Desktop emits a
settings update when a value changes, while unchanged values remain represented
by the exact configuration returned at task creation. A rollout event may
supersede the baseline; its absence is not an error.

## Binding and failure invariants

- Only the active Practice run's persisted thread ID and workspace are valid.
- Thread ID and workspace are checked in the task read, database row, session
  metadata, rollout filename, and saved baseline.
- A running turn prevents review and produces the specific busy recovery path.
- Missing or unrecognized configuration fields remain unverifiable and cannot
  satisfy a criterion.
- A binding, transport, stable-read, or normalization failure preserves the last
  structured review result and leaves return locked.
- The verification transport is released after every terminal path.
- Direct Teacher chat and non-Practice Teacher ownership behavior are unchanged.
- No settings are inferred from task title, active window, saved Practice
  expectations, learner self-report, or Course Companion defaults.

## Approved guide design

The guide returns to semantic, event-driven advancement:

- Step 5 remains `request-review` and advances only on
  `review-requested` after the authoritative review succeeds.
- The generic guide `Tiếp` control is removed from step 5. The existing
  `Cập nhật & duyệt tiến độ` product action is the only action that can complete
  that stage.
- A failed or needs-work review keeps step 5 visible with the existing guide
  copy and the product's actionable review result.
- A passed review advances to step 6, `return-to-course`, which is immediately
  visible because return is then authorized.
- Returning to the course completes step 6 and preserves the existing step 7
  mastery confirmation in the learning surface.
- Existing persisted states stranded at `return-to-course` while review is not
  passed are reconciled back to `request-review` on load.
- If a previously passed result is invalidated before return, the same
  reconciliation makes step 5 visible again.
- Replay follows the same semantic rule and cannot skip into a hidden waiting
  state.

No learner-facing body, title, criterion, rubric, or error copy is rewritten.
The only copy removal is the duplicate step-5 `Tiếp` label whose control caused
the invalid transition.

## Verification failure and prevention

The prior verification failed in two distinct ways:

1. **Synthetic protocol fixture:** metadata tests wrote
   `thread_settings_applied` even though the current empty-task runtime did not.
2. **Incorrect expected behavior:** the guide test asserted that step 5 should
   advance into a hidden step 6 before review passed.

The replacement verification strategy must exercise both semantic logic and
runtime compatibility.

### Automated unit and integration coverage

- Capture a sanitized fixture representing a real newly created task rollout
  with `session_meta` and no settings event. Assert that review does not depend
  on a rollout settings record.
- Assert the exact protocol sequence contains one exact `thread/read` and never
  calls `thread/resume`.
- Assert the exact saved `thread-start` snapshot supplies all five reviewed
  fields when no later settings event exists.
- Assert the latest valid settings event supersedes the baseline field values.
- Assert exact run, thread, workspace, rollout path, and session validation.
- Assert review stops before metadata access while a turn is in progress.
- Assert release after success, needs-work, busy, malformed response, binding
  mismatch, disconnect, and evaluator failure.
- Assert repeated review and concurrent-review coalescing do not retain an
  owner or create overlapping verification transports.
- Preserve field-by-field review-envelope parity for configuration, activity,
  workspace evidence, checklist state, and timestamps.
- Replace the hidden-step expectation with tests that step 5 remains visible
  until pass and step 6 becomes visible immediately after pass.
- Add migration coverage for an existing durable cursor at step 6 with
  `not-reviewed`, `needs-work`, and invalidated review states.
- Add replay, restart, and course-return race coverage across steps 5 through 7.

### Real-runtime contract diagnostic

Add a separately named diagnostic that uses the installed `codex app-server`
against an isolated temporary Codex home and temporary workspace. It must:

1. create an empty task without starting a turn;
2. prove the rollout lacks the synthetic settings event when that is the
   runtime's actual behavior;
3. capture the exact `thread-start` response and validate the production
   reader's baseline fallback;
4. stop the first client;
5. read the same task from a second client without resuming it to prove the
   diagnostic and product path remain non-owning;
6. clean up only its explicit temporary directories; and
7. fail loudly when the installed protocol no longer satisfies the contract.

This diagnostic is required on the release workstation for Practice transport
changes. It may be skipped in environments without a Codex binary, but a skip is
not evidence of runtime compatibility and must be reported separately.

### End-to-end acceptance

The release gate combines independent evidence so it does not need to mutate a
learner's real task merely to test the verifier:

- the installed-App-Server diagnostic creates a real empty task, captures its
  start configuration, confirms the missing-event rollout shape, exercises the
  production reader, and proves a second client can read the task without a
  retained owner;
- the bound-run diagnostic applies the production reader read-only to the exact
  active Practice run that exposed the defect;
- focused review tests prove a deliberately wrong setting yields needs-work,
  the corrected value passes, and a later settings event supersedes the saved
  baseline; and
- the production-built Electron journey proves step 5 has no generic advance,
  a successful review reveals step 6, return reaches the Module 1 mastery scene,
  and step 7 completes the guide. Coordinator tests cover needs-work visibility,
  restart repair, invalidation, and replay.

Record the exact commands and observed outcomes in the affected implementation
plan ledger. Unit tests, a green build, fake-gateway Electron smoke, synthetic
rollout fixtures, or a real protocol diagnostic alone do not satisfy this gate;
all complementary layers must pass.

## Alternatives not selected

### Require a learner turn before review

Starting a harmless turn could cause more settings context to be persisted, but
adds an unrelated learner action and still does not guarantee every reviewed
field. It changes the exercise instead of repairing observation.

### Move settings into Course Companion

Companion-owned controls would be easy to verify, but would stop assessing the
learner's ability to configure the real Codex task. The owner explicitly chose
to retain the existing Codex UI workflow.

### Resume the task during review

This initially appeared to offer an authoritative short-lived snapshot. A real
two-client App Server diagnostic disproved that design: after restarting the
server, `thread/resume` could rebuild the task with process defaults, losing the
saved reasoning effort and sandbox configuration. It also acquires task
ownership. The approved design therefore never resumes the learner's task.

### Restore the long-lived observer

This would recover live notifications but reintroduce the previous competing
owner. Persisted task-start state plus emitted updates provides the same
configuration history without a second live owner.

### Read Codex Desktop UI or private in-memory state

Focused-window inspection is not exact-task evidence and private Desktop state
has no supported cross-process contract. Either approach would be more fragile
than the protocol operation that previously worked.

## Non-goals

- Changing Practice criteria, approved target settings, or completion rules.
- Rewriting existing learner-facing Vietnamese copy.
- Sending prompts or starting turns on the learner's behalf.
- Closing, navigating, or selecting a Codex Desktop task.
- Restoring direct Teacher chat during Practice.
- Treating fake-gateway or synthetic-rollout success as real-runtime acceptance.
