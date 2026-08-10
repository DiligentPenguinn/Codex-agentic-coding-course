# Executor Desktop Ownership Handoff Implementation Plan

## Implemented Direction

1. Split provisioning into durable `createTarget`, read-only `prepareTarget`, and
   `openTarget` phases.
2. Create and name a blank, non-ephemeral task through a dedicated App Server process.
3. Make `CodexAppServerClient.stop()` wait for actual process exit/close, with a
   graceful period, forced signal, and bounded timeout.
4. Persist `target-created` immediately so retry and restart recovery reuse the exact
   binding and never create a duplicate.
5. Verify the blank task through exact `thread/read(includeTurns: false)`. Do not use
   `thread/list`: Codex 0.147 excludes stored tasks that have no user event.
6. Send no kickoff message. Do not call `turn/start` or `thread/resume` during
   provisioning.
7. Keep evidence refresh read-only with `thread/read(includeTurns: true)`.
8. Open the Desktop deep link only after the verification App Server process has fully
   exited.

## Release Gates

- Focused lifecycle, coordinator, and retry tests.
- Full lint, typecheck/build, unit/startup, and Electron smoke suites.
- Real production-client diagnostic using the installed Codex runtime:
  - exact task remains zero-turn and `notLoaded`;
  - every bootstrap PID is dead before open callbacks;
  - two concurrent persisted retries create zero additional tasks;
  - exactly one stored row matches the unique diagnostic title;
  - only the disposable diagnostic task is archived afterward.
- One final human Course Companion → Codex Desktop click-through; automated Desktop
  inspection is not claimed because its task tools hung during the diagnostic.
