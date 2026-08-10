# Executor Desktop Ownership Handoff Design

## Status

Implemented and production-lifecycle tested on 2026-08-10 with Codex CLI 0.147.0.
This document supersedes the earlier kickoff-based version of the design. Executor
tasks now start with zero turns; Course Companion does not send a synthetic message.

## Problem

`thread/start` subscribes the creating App Server process to the new task. Production
`CodexAppServerClient.stop()` previously signalled that process and returned before it
exited. Course Companion could therefore open the Desktop deep link while the
bootstrap process still owned the task, producing “Conversation not found,” “active
elsewhere,” or an interrupted kickoff.

Post-creation failures also need a durable task binding. Retrying must reuse that task
instead of calling `thread/start` again and creating duplicates.

## Runtime Constraint

Codex 0.147 stores a named zero-turn task, and exact `thread/read` returns it with
status `notLoaded`. However, `thread/list` omits that task because it has no user event.
Therefore list-based “desktop discovery” is not a valid readiness gate for blank tasks.

## Invariants

1. One Practice run creates at most one Executor task.
2. Retry and restart recovery reuse the persisted task ID.
3. No Course Companion App Server process owns the task when Desktop opens it.
4. Provisioning sends no kickoff message and starts no turn.
5. Readiness uses an exact, read-only `thread/read`; it never uses `thread/list` or
   `thread/resume`.
6. Existing Codex tasks are never deleted or archived by application recovery.

## Provisioning Sequence

1. `createTarget` starts and names one non-ephemeral task in a dedicated, short-lived
   App Server process.
2. The client closes stdin, allows a one-second graceful exit, then waits for the child
   process to emit `exit` or `close`. It force-signals after the grace period and fails
   after five seconds instead of pretending ownership was released.
3. Only after confirmed process exit does `createTarget` return the validated binding.
4. Practice state persists that binding as `target-created` before any later step.
5. `prepareTarget` starts a new short-lived read connection and performs only
   `thread/read({ threadId, includeTurns: false })`, validating the exact ID and
   workspace path. It retries briefly for state-persistence lag.
6. That read process also exits completely before preparation returns.
7. Course Companion commits the Practice and opens `codex://threads/<exact-id>`.

The activity observer may later use `thread/read(includeTurns: true)` to rebuild
evidence, but it never resumes or subscribes to the Executor task.

## Failure and Retry Semantics

- `creating-target`: no validated binding is durable; retry may create a task.
- `target-created`: the exact binding is durable; retry must not call `thread/start`.
- Concurrent retry calls share the coordinator's in-flight operation.
- A failed exact read or failed process shutdown leaves `target-created` available for
  retry. Desktop does not open until shutdown succeeds.
- Cancel removes the transition receipt but does not delete the Codex task.

## Verification Contract

Unit tests must assert zero `turn/start`, zero `thread/resume`, zero `thread/list`, exact
read validation, close-before-open ordering, shutdown waiting for child exit, and
retry/restart idempotency.

The real production-client diagnostic must create a uniquely named disposable task,
confirm every bootstrap PID is dead before its handoff point, verify exact ID/name/cwd,
zero turns and `notLoaded`, run concurrent persisted retries with zero new task
creation, confirm a single matching stored row, then archive only that diagnostic task.

The final renderer-level check remains a human click from Course Companion into Codex
Desktop because Desktop inspection tools can hang and are not treated as proof.
