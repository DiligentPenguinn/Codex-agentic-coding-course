# Executor Kickoff Completion Gate Implementation Plan

1. Extend the Executor lifecycle options with a bounded kickoff-completion retry budget while retaining the existing desktop-discovery budget.
2. After `turn/start`, poll `thread/read` with turns included and match only the exact returned kickoff turn ID.
3. Proceed only when that turn is `completed`; treat `failed`, `interrupted`, and timeout outcomes as sanitized Practice creation failures.
4. Verify the exact thread ID and workspace from the same completed-thread read before querying desktop discovery across all supported source kinds.
5. Update the deterministic App Server gateway and coordinator tests for delayed completion, terminal failures, timeout, and the rule that Desktop never opens early.
6. Run focused tests, lint, typecheck, the complete test suite, and Electron smoke.
7. Run one disposable real App Server lifecycle check through completion and archive only its exact diagnostic task.
