# Real Teacher and Persistent Practice Memory Implementation Plan

> **For implementers:** Execute task-by-task with test-first checkpoints. Preserve unrelated worktree changes and keep all Teacher/Executor protocol handling inside the Electron main process.

**Goal:** Replace fixture Teacher replies with a guarded real Codex Teacher, give every turn current bound-Executor context, and persist Hương-generated summaries across Practice runs.

**Architecture:** Extend the shared App Server client with notification subscriptions, observe only the active Executor binding, persist normalized activity and layered Teacher memory locally, assemble a complete envelope for each turn, and use tool-free ephemeral Teacher threads for replies and run summarization. The Course Companion remains the memory authority.

**Tech stack:** TypeScript 6, Electron 43, React 19, Codex App Server JSONL, Vitest, Node test runner, Playwright Electron smoke tests. Add no dependency.

**Approved design:** [`../specs/2026-08-08-real-teacher-persistent-memory-design.md`](../specs/2026-08-08-real-teacher-persistent-memory-design.md)

## Global constraints

- Work only in `course-companion/`, this plan, and directly related documentation.
- Preserve existing uncommitted Practice window-control changes.
- The main process owns task bindings, raw App Server messages, memory, and validation.
- Never expose raw JSON-RPC payloads, credentials, environment data, hidden reasoning, or unrelated task content.
- Hương is read-only, approval-disabled, and tool-free.
- Fixture behavior is allowed only through `COURSE_COMPANION_FAKE_CODEX=1` and must remain visibly simulated.
- No automatic Practice pass/fail, embeddings, proactive coaching, or Teacher tools.
- Use focused failing tests before implementation changes where practical.

## Task 1: Version Teacher, activity, memory, and UI contracts

**Files:**

- Modify: `course-companion/shared/contracts.ts`
- Modify: `course-companion/electron/main/teacher-fixture.ts`
- Modify: `course-companion/tests/teacher-fixture.test.ts`

**Work:**

1. Add Teacher connection states, message delivery states, `live` source, Practice run identity, activity snapshots, archived-run summaries, and versioned Teacher memory types.
2. Extend companion state with sanitized Teacher runtime and memory status.
3. Make persistence validators accept legacy fixture messages and the new versioned live messages without relabelling old data.
4. Add migration and malformed-record tests.

**Verification:** `npm test -- teacher-fixture`

## Task 2: Add App Server notification and connection subscriptions

**Files:**

- Modify: `course-companion/electron/main/codex-app-server-client.ts`
- Create: `course-companion/tests/codex-app-server-client.test.ts`

**Work:**

1. Add `onNotification` and `onConnectionState` registration with idempotent removal.
2. Parse response IDs separately from notification messages.
3. Emit safe connection lifecycle states without exposing stderr or raw errors.
4. Clear listeners and reject pending requests on stop/exit.
5. Test malformed input, notification delivery, removal, disconnect, and late messages.

**Verification:** focused Vitest file plus typecheck.

## Task 3: Observe and persist only the bound Executor activity

**Files:**

- Create: `course-companion/electron/main/executor-activity-observer.ts`
- Create: `course-companion/electron/main/executor-activity-repository.ts`
- Create: `course-companion/tests/executor-activity-observer.test.ts`
- Create: `course-companion/tests/executor-activity-repository.test.ts`
- Modify: `course-companion/electron/main/practice-coordinator.ts`
- Modify: `course-companion/electron/main/practice-run-repository.ts`

**Work:**

1. Port only the current-authority-safe patterns from the historical observer: exact `threadId` filtering, bounded prompt/final answer extraction, changed-path normalization, status/freshness reduction, and `thread/read` rehydration.
2. Persist normalized active-run snapshots atomically and key them by Practice run.
3. Bind/rebind the observer when a Practice is started, resumed, recovered, or replaced.
4. Ignore decoy tasks, unsupported events, hidden reasoning, and paths outside the workspace.
5. Test ordering, stale/disconnected behavior, rehydration, race disposal, and decoy isolation.

**Verification:** focused Vitest files.

## Task 4: Implement layered Teacher memory and context assembly

**Files:**

- Create: `course-companion/electron/main/teacher-memory-repository.ts`
- Create: `course-companion/electron/main/teacher-context-broker.ts`
- Create: `course-companion/tests/teacher-memory-repository.test.ts`
- Create: `course-companion/tests/teacher-context-broker.test.ts`

**Work:**

1. Persist a schema-versioned course-memory document by atomic replacement.
2. Store course-level takeaways and per-Practice archived-run summaries with provenance and summary quality.
3. Assemble every turn from progress, workspace, active activity, current chat, same-Practice summaries, and cross-Practice takeaways.
4. Apply deterministic redaction, ordering, freshness, and envelope size limits.
5. Preserve critical active-run facts when compacting older narrative and declare compaction in the envelope.
6. Test restart recovery, corrupt sections, source isolation, priority ordering, and reset.

**Verification:** focused Vitest files.

## Task 5: Build guarded real Hương inference and summarization

**Files:**

- Create: `course-companion/electron/main/real-teacher-adapter.ts`
- Create: `course-companion/tests/real-teacher-adapter.test.ts`
- Modify: `course-companion/electron/main/test-codex-gateway.ts`

**Work:**

1. Create verified ephemeral read-only Teacher threads with `approvalPolicy: never`, fixed developer instructions, and no tools.
2. Submit one bounded text input per learner reply and accept only a final agent message from the verified turn.
3. Track notifications arriving before or after `turn/start` resolves.
4. Interrupt on timeout, disposal, or any forbidden tool item.
5. Add a separate hidden Hương summarizer thread that returns strict structured JSON.
6. Validate summary facts against the frozen source snapshot and label inferred learning signals.
7. Extend the fake gateway to emulate model discovery, Teacher turns, notifications, failure categories, and summaries.

**Verification:** focused adapter tests covering English and Vietnamese, boundary violations, timeout, disconnect, late events, invalid summary, and disposal.

## Task 6: Compose the Teacher service, Practice rollover, and IPC

**Files:**

- Create: `course-companion/electron/main/teacher-service.ts`
- Create: `course-companion/tests/teacher-service.test.ts`
- Modify: `course-companion/electron/main/index.ts`
- Modify: `course-companion/electron/main/practice-coordinator.ts`
- Modify: `course-companion/electron/preload/index.ts`

**Work:**

1. Replace production `FixtureTeacherAdapter` composition with the real Teacher service; retain fixture inference only behind the fake gateway.
2. Persist a pending learner message before inference and make retry duplicate-free.
3. Build a fresh context envelope on every send.
4. Freeze replaced runs, queue hidden Hương summarization, persist validated summaries, and retain pending-refinement fallback records on failure.
5. Retry pending summaries on reconnect/load without blocking Practice switching.
6. Reset chat, memory, activity, and Practice bindings together.
7. Dispose observers and Teacher threads during app shutdown.

**Verification:** service tests plus full unit/startup suite.

## Task 7: Render truthful live, stale, offline, retry, and memory states

**Files:**

- Modify: `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`
- Modify: `course-companion/src/renderer/src/styles.css`
- Modify: `course-companion/src/renderer/src/surfaces/CompanionWindow.tsx`
- Modify: `course-companion/src/renderer/src/surfaces/LearningWindow.tsx`

**Work:**

1. Replace hard-coded simulated labels with connection and source state from the main process.
2. Show `LIVE`, `CONNECTING`, `STALE`, `OFFLINE`, or `MÔ PHỎNG` truthfully on both surfaces.
3. Preserve pending learner messages and provide an explicit retry action without duplicate chat entries.
4. Surface memory-pending status without blocking the current Practice.
5. Preserve the approved pixel-art visual system, fullscreen behavior, and fixed chat scrolling.

**Verification:** typecheck, lint, component behavior through Electron smoke.

## Task 8: Complete fake-gateway, persistence, Electron, and real-runtime acceptance

**Files:**

- Modify: `course-companion/tests/electron-smoke.mjs`
- Modify: `course-companion/README.md`
- Create: `course-companion/scripts/real-teacher-probe.mjs`

**Work:**

1. Extend the Electron flow to prove live Teacher replies are grounded in the bound Executor and exclude decoy activity.
2. Replace a Practice run and prove the new run receives the validated older-run summary.
3. Prove restart rehydration, stale/offline disclosure, retry, summary fallback/refinement, and reset.
4. Add a bounded real-App-Server probe that records only pass/fail categories and safe identifiers.
5. Document prerequisites, stored data, reset behavior, failure recovery, and the still-deferred Teacher tool boundary.

**Final verification:**

```powershell
npm run typecheck
npm run lint
npm test
npm run test:electron
node scripts/real-teacher-probe.mjs
git diff --check
```

The implementation is complete only if automated tests pass and the real-runtime probe confirms grounded bound-task-only Teacher awareness without leaking private protocol data.
