# Executor Desktop Ownership Handoff Implementation Plan

1. Refactor `ExecutorChatCoordinator` into two phases: create-and-name a validated task binding, then idempotently prepare the persisted task with the neutral kickoff and desktop discovery.
2. Give the Executor coordinator a closable bootstrap transport and guarantee transport shutdown in `finally` after every creation or preparation attempt, before any Desktop deep link opens.
3. Add a dedicated `CodexAppServerClient` and lazy gateway in Electron main for Executor bootstrap only; keep teacher, summary, review, and read-only evidence traffic on the existing shared gateway.
4. Persist `target-created` immediately after `createTarget` returns. Change start, retry, restart recovery, and cancel behavior so post-creation failures always reuse the durable binding and never call `thread/start` again for that Practice run.
5. Make kickoff preparation idempotent by reading stored turns, reusing an existing completed or in-progress Course Companion kickoff, and starting a kickoff only when none exists or the previous one ended unsuccessfully.
6. Remove `thread/resume` from `ExecutorActivityObserver`; rebuild and reconcile evidence using `thread/read(includeTurns: true)` so teacher review cannot claim the Desktop-owned task.
7. Update deterministic gateways and focused tests for transport-close ordering, binding durability, retry idempotency, restart recovery, kickoff reuse, cancellation, and the absence of observer `thread/resume` requests.
8. Run focused tests, lint, typecheck/build, the full test suite, and Electron smoke. Then run a disposable real App Server lifecycle diagnostic using a short-lived process and verify the resulting task is stored and not left loaded by the bootstrap process.
9. Relaunch Course Companion with the current fresh Module 1 state so the learner can validate New Practice in Codex Desktop.

