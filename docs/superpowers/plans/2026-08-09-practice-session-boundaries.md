# Practice Session Boundaries Implementation Plan

**Goal:** Eliminate the false Executor “conversation not found” race and make Teacher chat visibly and operationally fresh for each new Practice run while retaining archived evidence and memory.

**Design:** `docs/superpowers/specs/2026-08-09-practice-session-boundaries-design.md`

## Task 1: Gate Executor navigation on state-database discovery

**Files:**
- Modify: `course-companion/electron/main/executor-chat-coordinator.ts`
- Modify: `course-companion/tests/executor-chat-coordinator.test.ts`

1. Add failing tests for immediate discovery, delayed discovery, exact ID matching, and bounded timeout.
2. Add an injectable wait function and bounded discovery settings to the coordinator.
3. After `thread/read` verification, poll `thread/list` with `useStateDbOnly: true` until the exact target ID appears.
4. Ensure `openTarget` is never called for a target whose discovery gate failed.
5. Run the coordinator and Practice coordinator tests.

## Task 2: Scope visible Teacher conversation to the active Practice

**Files:**
- Modify: `course-companion/electron/main/teacher-service.ts`
- Modify: `course-companion/tests/teacher-service-scenarios.test.ts`
- Modify: `course-companion/tests/teacher-fixture.test.ts` only if repository coverage needs an archive assertion

1. Add failing tests proving old-run messages are hidden, current-run messages are visible, course-level messages are visible only without an active run, and the append-only log retains every message.
2. Filter the returned `TeacherConversation` at the service boundary, not in the repository, so summary generation retains access to archived run messages.
3. Limit abandoned-pending recovery to the active visible conversation.
4. Keep retry lookup explicitly scoped to the active run.
5. Run Teacher fixture and Teacher service scenario tests.

## Task 3: Reset only the live Teacher response session on run replacement

**Files:**
- Modify: `course-companion/electron/main/teacher-service.ts`
- Modify: `course-companion/electron/main/index.ts`
- Modify: `course-companion/tests/teacher-service-scenarios.test.ts`

1. Add an idempotent `activatePracticeRun(runId)` lifecycle method with a response-run identity separate from Executor observer identity.
2. On a genuinely new run, increment the Teacher request generation, settle/cancel in-flight sends safely, and reset only the response inference transport.
3. Preserve summary transport, Teacher memory, archived chat, and Executor activity repositories.
4. Call activation after the new run is committed and before the Practice start handler returns; same-run resume must not reset it.
5. Verify old-run summarization still reads archived messages after activation.

## Task 4: Extend integration coverage

**Files:**
- Modify: `course-companion/tests/electron-smoke.mjs`

1. Make the fake Codex gateway expose state-database discovery behavior used by the production gate.
2. Add a two-run smoke assertion: the second run gets a new Executor target and no visible Teacher messages from the first run.
3. Assert the deep-link open happens only after discovery.

## Task 5: Full verification

From `course-companion/`, run:

1. `npm run lint`
2. `npm run typecheck`
3. `npm test`
4. `npm run build`
5. `npm run test:electron`
6. From repository root, run `git diff --check` and inspect the final scoped diff.
