# Executor App Server Discovery Fix Design

## Problem

Course Companion creates Executor chats through Codex App Server, then waits for the new thread to appear in the desktop state database before opening its deep link. The discoverability query currently omits `sourceKinds`. Codex therefore applies its documented default of listing only `cli` and `vscode` threads. The new thread has source kind `appServer`, so the check can never find it and eventually reports that Practice creation failed.

The renderer then replaces the underlying exception with a generic retry message, which obscures the cause.

## Design

Pass `sourceKinds: ['appServer']` to the state-database `thread/list` request. Keep `useStateDbOnly: true` and the bounded retry loop so Course Companion still waits until the desktop can discover the exact new thread before navigating to it. Continue matching the exact returned thread ID.

Propagate a bounded, learner-readable creation error through `PracticeWorkspaceView.error` and display it alongside the retry controls. The UI should still avoid exposing stacks or arbitrary server payloads.

## Alternatives Rejected

- Removing the discoverability check would reintroduce the earlier “conversation not found” navigation race.
- Omitting `useStateDbOnly` would permit a scan-and-repair side effect and would not directly prove that the desktop state database is ready.
- Listing every source kind would be broader than necessary and could hide a source-classification regression.

## Verification

- Update the coordinator request assertion to require `sourceKinds: ['appServer']`.
- Add a regression where CLI and VS Code threads are present but only the matching App Server thread satisfies discovery.
- Verify that creation failures preserve a bounded specific error in the Practice workspace and renderer.
- Run focused coordinator/component tests, lint, the full test suite, build/typecheck, and Electron smoke testing.
