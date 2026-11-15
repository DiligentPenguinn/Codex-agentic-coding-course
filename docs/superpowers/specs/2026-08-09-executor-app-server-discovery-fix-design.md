# Executor Desktop Discovery Fix Design

## Problem

Course Companion creates Executor chats through Codex App Server, then waits for the new thread to appear in the desktop state database before opening its deep link. Live verification showed that thread/start alone leaves the blank thread available only to that App Server process; neither thread/name/set nor thread/inject_items makes it desktop-discoverable.

Starting the first turn persists and indexes the thread. In the current Codex Desktop integration, that stored thread reports source "vscode" even though Course Companion created it through App Server. serviceName is metrics metadata and does not control the stored source classification.

The renderer also replaced the underlying exception with a generic retry message, obscuring the cause.

## Design

After starting and naming the thread, start one neutral kickoff turn. The kickoff must clearly identify itself as Course Companion-generated, tell Codex not to inspect or modify files yet, and ask it only to confirm readiness for the learner's brief.

`turn/start` only acknowledges that the Executor turn is `inProgress`; it does not mean the Executor response has finished. Course Companion must poll `thread/read` for the exact returned turn ID until its status is `completed`. A `failed` or `interrupted` status is a creation failure, and a bounded completion timeout keeps the Practice in its retry flow. Course Companion must not deep-link into Codex Desktop while the kickoff is still active because Desktop cannot reliably take over an in-flight turn owned by the separate Course Companion App Server process.

The kickoff user message and Codex's short reply are intentionally visible in the Executor chat. This is a product constraint, not accidental learner-authored history. It keeps the lifecycle on supported APIs and avoids the deprecated thread/rollback workaround. The learner still owns the actual scoped brief and all subsequent instructions.

Poll thread/list with every currently supported stored-thread source kind, useStateDbOnly true, and the existing bounded retry loop. Source classification is diagnostic metadata only; readiness is determined solely by the exact newly created thread ID appearing in the desktop state database. This avoids coupling Course Companion to today's observed "vscode" classification.

Propagate a bounded, learner-readable creation error through PracticeWorkspaceView.error and display it alongside the retry controls. The UI must not expose stacks or arbitrary server payloads.

## Lifecycle Contract for Collaborators

The creation order is part of the desktop integration contract:

1. Create the non-ephemeral thread and validate its ID and workspace.
2. Name the thread.
3. Start the visible Course Companion-generated kickoff turn. A blank thread is not sufficient.
4. Poll `thread/read` until the exact kickoff turn reaches `completed`; reject `failed`, `interrupted`, or timed-out turns.
5. Poll the desktop state database with the complete currently supported source-kind set: cli, vscode, exec, appServer, subAgent, subAgentReview, subAgentCompact, subAgentThreadSpawn, subAgentOther, and unknown.
6. Treat the source label as metadata. Accept readiness only when the exact created thread ID appears after the kickoff has completed.
7. Open the exact thread deep link.

Do not narrow discovery to vscode or appServer, convert the kickoff into the learner's exercise brief, or hide the kickoff with deprecated rollback behavior. If Codex adds a new documented source kind, add it to the explicit discovery set and its regression assertion.

## Alternatives Rejected

- Removing the discoverability check would reintroduce the earlier “conversation not found” navigation race.
- Omitting useStateDbOnly would permit a scan-and-repair side effect and would not directly prove that the desktop state database is ready.
- Injecting hidden history does not index a blank thread in the verified Codex Desktop lifecycle.
- Starting and then rolling back a kickoff turn would hide it, but thread/rollback is deprecated.
- Automatically submitting the exercise brief would undermine the learner-owned Practice task.

## Verification

- Assert that the coordinator starts the neutral kickoff turn before discovery.
- Assert that Desktop is not opened while the exact kickoff turn is still `inProgress`.
- Verify completed, failed, interrupted, and timed-out kickoff outcomes.
- Require the complete supported source-kind set in the state-database query and match only the exact target thread ID.
- Verify that the kickoff explicitly identifies Course Companion and forbids premature inspection or edits.
- Add a live disposable lifecycle check: start, name, wait for the Executor kickoff response, discover, and archive the exact diagnostic thread.
- Verify that creation failures preserve a bounded specific error in the Practice workspace and renderer.
- Run focused coordinator/component tests, lint, the full test suite, build/typecheck, and Electron smoke testing.
