# Executor Desktop Ownership Handoff Design

## Problem

Course Companion currently creates an Executor task with the same long-lived Codex App Server connection used by the teacher and activity observer. `thread/start` subscribes that connection to the new task, and the activity observer then calls `thread/resume` immediately before the deep link opens. Codex Desktop therefore receives a task that is still owned by another App Server client and reports both “Conversation not found” and “This task is active elsewhere.”

The creation transaction also records the Executor binding only after kickoff completion and desktop discovery. If either later check fails, the persisted transition knows the Practice run ID but not the already-created task ID. Retrying calls `thread/start` again and creates a second task with the same Practice suffix.

## Approved Invariants

1. One Practice run creates at most one Executor task.
2. A retry reuses the persisted task ID after any post-creation failure.
3. Course Companion must not own or subscribe to the Executor task when Codex Desktop opens it.
4. Teacher progress refreshes may read the stored task but must not resume or claim it.
5. Existing and orphaned Codex tasks are not deleted or archived by this fix.

## Architecture

### Short-lived bootstrap transport

Executor creation and kickoff use a dedicated Codex App Server process rather than the long-lived teacher transport. Each bootstrap operation starts that process on demand and stops it in a `finally` path. Stopping the dedicated process is the ownership handoff: no Course Companion connection remains subscribed when `codex://threads/<id>` is opened.

The teacher, summary, and review adapters continue using the existing long-lived App Server connection. They never resume the Executor task.

### Durable two-phase provisioning

Provisioning is split into two idempotent phases:

1. `createTarget` starts and names a non-ephemeral task, then returns its validated binding. Course Companion immediately persists that binding as a `target-created` transition.
2. `prepareTarget` resumes the persisted task only inside the short-lived bootstrap process, ensures the neutral kickoff exists and has completed, and verifies desktop discovery. The bootstrap process then stops.

Only after preparation succeeds does Course Companion commit the new Practice as active, capture its workspace baseline with a read-only observation, and open Desktop.

If preparation, discovery, or app shutdown before commit interrupts the flow, the durable `target-created` transition remains. Retry calls `prepareTarget` for that exact binding; it never calls `thread/start` again. Once preparation is committed, an opening failure leaves the new Practice active so “Tiếp tục Practice” can reopen that same task.

### Idempotent kickoff

`prepareTarget` reads stored turns and finds the exact Course Companion kickoff text. If a completed kickoff already exists, it is reused. If one is in progress, preparation waits for that turn. If none exists, preparation starts it once. Failed or interrupted kickoff turns remain bounded errors; retry may start one replacement kickoff in the same task, but never creates another task.

### Read-only evidence observation

`ExecutorActivityObserver` rebuilds evidence with `thread/read(includeTurns: true)` only. It removes `thread/resume`, because the official App Server contract defines `thread/read` as stored-thread access without loading or subscribing to the task. Review-time refresh still sees persisted learner prompts, Executor responses, file-change reports, and verification evidence without competing with Desktop ownership.

## State and Error Handling

- `creating-target` means no validated task binding is durable yet. Retry may create a task.
- `target-created` means a validated task binding is durable. Retry must reuse it.
- Loading an interrupted `target-created` transition does not auto-commit it; the UI offers retry or cancel while retaining the old active Practice. Cancel abandons the transition receipt but does not delete the already-created Codex task.
- Bootstrap shutdown runs after success and failure. A shutdown error must not hide the original preparation error.
- Learner-facing errors remain bounded and do not expose raw App Server payloads.
- Opening Desktop occurs only after bootstrap shutdown and read-only baseline capture.

## Alternatives Rejected

- Calling only `thread/unsubscribe` is weaker because App Server retains an unsubscribed task in memory during its inactivity grace period. Terminating a dedicated bootstrap process gives the ownership boundary an explicit lifetime.
- Stopping the shared App Server would also release the Executor task, but it would disrupt teacher, review, and summary inference.
- Keeping live Executor subscriptions would preserve push updates, but it is incompatible with Desktop being the interactive owner. On-demand read-only refresh matches the existing review button and avoids contention.
- Creating a fresh task on retry reproduces the orphan and duplicate-task bug.

## Verification

- Assert the binding is persisted before kickoff preparation begins.
- Simulate preparation failure and verify retry performs zero additional `thread/start` calls.
- Assert an interrupted `target-created` transition remains pending across restart.
- Assert kickoff preparation is idempotent for absent, in-progress, and completed kickoff history.
- Assert the dedicated bootstrap transport stops before `openExternal` runs, including failure paths.
- Assert activity refresh performs `thread/read` and never `thread/resume`.
- Run focused unit tests, the full test suite, lint, typecheck/build, and Electron smoke tests.
- Run a disposable real App Server lifecycle diagnostic that creates and prepares one task through a short-lived process, then confirms the task is stored and no longer loaded by that process.
