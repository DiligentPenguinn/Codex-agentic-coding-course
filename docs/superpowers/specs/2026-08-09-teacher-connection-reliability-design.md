# Teacher Connection Reliability Design

## Problem

The Teacher UI can remain in `connecting` even after Codex App Server is ready,
then collapse every send failure into a generic `offline` state. The learner's
message is preserved, but the application discards the safe diagnostic detail
needed to distinguish transport, thread-creation, turn-start, protocol, timeout,
and model failures. The deterministic Electron test covers only the successful
fixture response and therefore does not exercise the main failure and recovery
paths.

## Product behavior

- `connecting` means the local App Server transport is starting.
- `ready` means the App Server is connected and Hương can accept a message.
- `live` means the latest Hương turn completed successfully.
- `stale` means Hương is available but the bound Executor observation is stale.
- `offline` means the Teacher transport or inference turn failed.
- A failed learner message remains persisted once, visibly marked `CHƯA GỬI`,
  and can be retried without creating duplicate transcript messages.
- The UI presents a bounded Vietnamese explanation and retry guidance. It never
  displays raw prompts, protocol payloads, paths, tokens, or server stderr.

## Architecture

### Transport diagnostics

`CodexAppServerClient` will preserve a small typed failure containing a stable
code and sanitized message. App Server JSON-RPC errors will retain only bounded
error code/message metadata. Process spawn and exit failures will retain a
bounded safe reason. Notification and callback isolation remains unchanged.

### Staged Teacher failures

`RealTeacherAdapter` will wrap failures with their stage:

1. `thread-start`
2. `thread-verify`
3. `turn-start`
4. `turn-wait`
5. `turn-protocol`

`TeacherService` maps those stages to the runtime view and persistent failed
delivery state. It does not mark a model or protocol failure as a transport
disconnect unless the transport actually disconnected.

### Connection propagation

The Teacher service receives App Server connection changes. A connected
transport moves a new Teacher from `connecting` to `ready`; a successful reply
moves it to `live` or `stale` according to Executor freshness. Disconnect moves
it to `offline`. Reconnection returns it to `ready` without erasing failed
messages or memory.

### Scenario validation

A deterministic mock Teacher gateway will run these scenarios:

- connection startup and ready transition;
- successful grounded response;
- stale and disconnected Executor context;
- thread-start rejection;
- turn-start rejection;
- timeout;
- forbidden tool/callback attempt;
- failed-message retry without transcript duplication;
- previous-run live summary and pending fallback summary;
- restart persistence and course reset;
- bounded oversized context;
- compact and full-screen Electron Teacher UI lifecycle.

The scenario runner must fail on unexpected requests, leaked tool calls,
duplicate messages, incorrect state labels, or unhandled rejections. After each
failure, the implementation is corrected and the complete matrix is rerun.

## Safety

Hương remains ephemeral, read-only, `approvalPolicy: never`, and tool-free.
Diagnostic reporting is allow-listed and bounded. The mock harness cannot open
real user tasks or modify learner files. The real probe uses only an ephemeral
Teacher thread and is disposed immediately after the diagnostic turn.

## Acceptance criteria

- The real Teacher produces a response or exposes a specific safe failure stage.
- The UI never remains indefinitely `connecting` after transport connection.
- Every mock scenario passes repeatedly with no unhandled rejection.
- Typecheck, lint, unit/integration tests, build, and Electron smoke all pass.
- Existing Practice window, bubble, scroll, persistence, and reset behavior
  remains unchanged.
