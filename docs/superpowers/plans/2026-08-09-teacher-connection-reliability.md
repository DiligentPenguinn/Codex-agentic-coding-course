# Teacher Connection Reliability Implementation Plan

1. Extend Teacher runtime contracts with `ready` and a bounded diagnostic view.
2. Preserve sanitized JSON-RPC, spawn, exit, and write failure metadata in the
   App Server client.
3. Stage errors in the real Teacher adapter and expose transport connection
   changes to the Teacher service.
4. Correct runtime transitions: connecting → ready → live/stale, and genuine
   failures → offline with retry guidance.
5. Reproduce the production failure with an ephemeral real Teacher probe and
   correct the underlying protocol/runtime mismatch.
6. Add a deterministic mock-Teacher gateway and scenario matrix for success,
   stale context, disconnect, thread/turn rejection, timeout, forbidden tools,
   retry deduplication, memory summaries, persistence, reset, and context bounds.
7. Extend Electron smoke assertions for ready/live/offline rendering and failed
   delivery recovery without regressing bubble/full-screen behavior.
8. Run typecheck, lint, all tests, build, and Electron smoke. Fix and rerun the
   complete matrix until every check passes consecutively.
9. Update testing documentation with exact real and mock validation commands.
