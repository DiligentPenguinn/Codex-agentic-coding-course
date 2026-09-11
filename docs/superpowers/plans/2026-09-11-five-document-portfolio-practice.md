# Five-document portfolio Practice implementation plan

> **For agentic workers:** Use subagent-driven-development for bounded tasks
> and reviews; root owns integration. Steps use checkboxes for durable tracking.

**Goal:** Implement the approved Module 2 final-package Practice and preserve
the exact task, files, and history when existing attempts need fresh review.

**Architecture:** Version the portfolio contract at 2.0.0. Reuse existing
Practice review, presentation, persistence, and recovery; a bounded collector
supplies the five real documents to the existing read-only AI review service.
Keep a durable completed submission for mastery revalidation and task handoff.

**Tech Stack:** Existing TypeScript, Electron, React, Vitest, Playwright; no new
dependencies. Workspace: D:/NUS/codex-content-creator-course.

## Global constraints

- Preserve learner files, Executor task, existing review history, and original
  completion receipts as historical records.
- Require a fresh five-document submission and review before an old Module 2
  attempt can satisfy the new completion gate.
- Do not convert old stage receipts into new approvals or AI-review success.
- Theory lesson text, scripts, quiz, illustrations, navigation, and styling
  remain unchanged; report additional shared edits before modification.
- Teacher chat stays disabled during Practice; review uses a separate read-only
  AI task and does not take over the Executor task.
- Module 3 replacement completion criteria are outside this implementation.
- Follow the approved design at
  docs/superpowers/specs/2026-09-11-five-document-portfolio-practice-design.md.

## Task 1: Versioned evidence collection

Files: create electron/main/portfolio-package-evidence.ts and
tests/portfolio-package-evidence.test.ts under course-companion. Root owns
shared/contracts.ts and the Practice definition/registry updates.

Interface: export collectPortfolioPackage(context, now) returning
Promise<PracticeAdapterEvidenceState>. It uses the five explicit planning paths
and stores bounded UTF-8 content on snapshots for review. Context uses existing
PracticeEvidenceAdapterContext, with optional allowedLegacyArtifactPaths for
preserved migration files. It must not approve documents or synthesize receipts.

- [x] Add tests for five documents without screenshots/approval markers, missing
  or empty sections, unknown requirement references, symlinks/escaping paths,
  oversized inputs, optional referenced screenshots, and out-of-scope files.
- [x] Implement bounded filesystem collection, stable local digests, structural
  checks, optional screenshots, and issue/evidence records. Delegate content
  quality to AI. Test the actual filesystem rather than collector mocks.
- [x] Run `npx vitest run tests/portfolio-package-evidence.test.ts` and typecheck.
- [x] Review the diff and test report before integrating it.

## Task 2: Contract, approval, and migration persistence

Files: shared/contracts.ts; electron/main/practice-definition-repository.ts;
practice-run-repository.ts; practice-coordinator.ts; new
portfolio-package-state.ts; pilot-workspace/course/practices/m2-portfolio-planning.json;
course-structure.json; shared/course/modules/module-2.ts; relevant tests.

Interfaces: version 2.0.0 manifest retains stable checklist IDs but no mandatory
stage approvals. A package approval carries the exact run/course/task/workspace,
sourceDigest, artifact digests, and recordedAt. A retained completed run remains
readable after return. Migration retains originals and increases generation so
in-flight old results cannot commit; no filesystem edits occur during migration.

- [x] Keep version 1 definitions/receipts readable. Make the five-path contract
  explicit while preserving legacy types needed to load old receipts.
- [x] Persist explicit package approval, invalidate it and completion on changed
  digest, and reject stale/wrong-run/old-version submission actions.
- [x] Migrate old active or completed portfolio attempts to 2.0.0 on requested
  use, preserving task and review history and requiring fresh review. Retain
  old receipts as history; don't reinterpret old data as corrupt.
- [x] Test migration twice, relaunch, stale actions, wrong identity, legacy
  history preservation, and rollback/recovery before checking off this task.

## Task 3: AI review and Practice submission controls

Files: practice-review-context.ts; practice-review-service.ts;
practice-review-evaluator.ts; PracticeBrief.tsx; PracticeProgress.tsx;
TeacherWorkspace.tsx; electron/main/index.ts; preload/index.ts; relevant tests.

Interfaces: portfolioPackage in the review envelope contains the exact bounded
five document contents, deterministic issues, independent evidence digest,
and authenticated approval. Submission confirms PRD and plan approval explicitly
and then invokes existing review. Generic review alone is not learner approval.

- [x] Connect the collector to normal review, enable submission for portfolio
  planning, and retain existing history/comparison UI and failure recovery.
- [x] Deterministic failures cannot be overridden by AI; validate all returned
  criteria/evidence references and require current learner approval to pass.
- [x] Recollect after AI review and reject any changed evidence or task identity.
- [x] Add Practice-only final-package controls with explicit approval. No theory
  copy, route, or style rewrites. Keep old Module 1/ContentPilot/Module 3 behavior.
- [x] Verify fail, pass, resubmit, concurrent mutation, busy task, malformed AI,
  disconnection, and chat exclusion using focused service and renderer tests.

## Task 4: Completion and same-task handoff

Files: portfolio-module-completion-service.ts; progress-repository.ts;
executor-chat-coordinator.ts; practice-coordinator.ts; Practice launch wiring in
LearningWindow.tsx; relevant tests and fixtures.

Interfaces: versioned handoff stores five references, current verified
submission, approvals, exact task binding, and bounded scope/plan summary.
The completion service resolves the retained reviewed attempt after return,
revalidates current files, and writes an atomic/idempotent module receipt.

- [x] Replace seven-file/stage/first-task prerequisites with the current passed
  five-document submission and existing assessment requirements.
- [x] Read both old and new handoffs, but only fresh v2 completion unlocks the
  new flow. Keep original receipts for history and recovery.
- [x] Carry the original binding to Module 3; validate accessibility/workspace
  and never silently create a replacement when continuation is unavailable.
- [x] Test archived-run completion, relaunch, stale files, wrong course/task,
  repeated completion, exact five references, and same-task continuation.

## Task 5: Integration verification and delivery

- [x] Run typecheck, lint, all unit/startup tests, build, full Electron smoke,
  and a disposable portfolio rehearsal using simulated review evidence.
- [x] Audit the diff against bc99ef7: theory content, scenes, illustrations,
  navigation, and styling remain intact; shared changes are scoped/notified.
- [x] Run independent task/final review and resolve actionable findings with
  focused tests; synchronize the portfolio-course implementation ledger.
- [x] Commit the verified scoped implementation locally. Do not push or infer
  native/live evidence, owner acceptance, or learner/pilot acceptance.

## Progress

Design and migration approved. Implementation and independent final review are
complete. Verification passes 467 unit tests (two intentional skips), nine startup
tests, typecheck, lint, build, full Electron smoke and the expanded disposable
portfolio rehearsal, including same-task revision after returning to the course.
Theory, pages, routes and Module 3 gates remain unchanged. The verified local
checkpoint is complete on the existing Practice branch; nothing was pushed.
Owner runtime acceptance and pilot acceptance remain pending.
