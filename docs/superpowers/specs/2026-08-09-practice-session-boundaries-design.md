# Practice Session Boundaries Design

## Problem

Starting a new Practice successfully creates and opens a new Executor chat, but Codex can briefly show “conversation not found.” The Course Companion currently verifies the thread with `thread/read` and immediately opens its deep link. `thread/read` proves the stored rollout exists, but it does not prove that the desktop app can discover the thread through its state database.

Teacher chat also loads its entire append-only history. Messages already carry `practiceRunId`, but the visible conversation and live Teacher inference transport are not reset when the active Practice changes. A new Practice therefore looks like a continuation of the previous attempt.

## Outcomes

- A new Executor chat opens only after Codex can discover it through the state database.
- A new Practice shows an empty Teacher conversation and uses a fresh live Teacher response thread.
- Old Teacher messages remain archived for evidence and summary generation.
- Resuming the same Practice restores that Practice's Teacher conversation.
- Teacher memory and summaries survive Practice replacement.

## Executor Discovery Gate

`ExecutorChatCoordinator.createTarget` continues to create, name, and structurally verify the new non-ephemeral thread. After naming, it polls `thread/list` with `useStateDbOnly: true` until the exact thread ID appears. Polling is bounded by a short timeout and uses a small retry interval.

Only a confirmed thread is returned as a valid target. The existing canonical deep link, `codex://threads/<threadId>`, remains unchanged. If discovery times out, Practice transition stays recoverable and the user receives the existing retry-oriented error instead of navigating to a thread the desktop app cannot yet resolve.

The discovery helper is isolated behind the coordinator so tests can use an injected clock/wait function without real delays.

## Teacher Conversation Boundary

The chat log remains append-only. No old Teacher messages are deleted when a Practice is replaced.

When Teacher state loads:

- with an active Practice, return only messages whose `practiceRunId` equals the active run ID;
- without an active Practice, return only course-level messages that have no `practiceRunId`.

Pending-message recovery still examines the stored log, but only pending messages in the active visible conversation affect the current UI. Summary generation may continue reading archived messages by their explicit run ID.

When a new Practice is committed, Teacher session activation resets only the live response transport. It does not reset the summary transport, Teacher memory repository, archived chat log, or Executor activity history. Re-activating the same run is idempotent, so resuming a Practice preserves both its visible history and live session continuity.

## Transition Ordering

The start flow is:

1. Create and name the Executor thread.
2. Wait until state-database discovery confirms the thread.
3. Commit the new Practice run.
4. Activate the Teacher boundary for the new run.
5. Begin asynchronous summarization of the replaced run, if one exists.
6. Open the Executor deep link and enter companion mode.

If Executor creation or discovery fails before commit, the previous Practice and Teacher session remain active. If navigation fails after commit, the new Practice remains recoverable through “Tiếp tục Practice.”

## Testing

Automated tests cover:

- immediate and delayed state-database discovery;
- discovery timeout without opening a deep link;
- exact thread-ID matching;
- active-run Teacher message filtering;
- archived message retention for old-run summaries;
- fresh response transport on a new run;
- idempotent activation and same-run resume;
- preservation of Teacher memory and summary state.

The Electron smoke flow should assert that a new Practice starts with no visible messages from the previous run and that the Executor target is opened only after discovery succeeds.
