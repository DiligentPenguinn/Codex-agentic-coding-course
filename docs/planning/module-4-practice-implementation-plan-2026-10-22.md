# Module 4 Practice Implementation Plan

> Execute in this chat with delegated, independently owned subtasks. The user
> explicitly authorized concurrent agents. Preserve the existing mixed working
> tree; do not package unrelated changes into a checkpoint commit.

**Goal:** A learner can submit a shareable portfolio from the existing Codex
task and receive a current, reviewed Module 4 Practice completion receipt.

**Architecture:** Extend the existing final-package Practice lifecycle with a
discriminated release package. Keep the public-URL verifier separate from the
filesystem evidence adapter. Reuse binding, approval, review and return; keep
all courseapp pages/copy outside this change.

**Tech stack:** Existing TypeScript/Electron/React, Node HTTPS/DNS, Vitest and
Playwright Electron; no new dependency or provider credentials.

## Constraints

- Follow `module-4-practice-design-2026-10-22.md` and the owner's workflow-only
  correction. No LearningWindow, theory, quizzes, navigation or completion copy.
- One deployment record; one final learner approval/review; no restored essays,
  mandatory Preview stage, rollback exercise or quiz.
- Use actual current files and the same portfolio task; failed/stale review
  preserves history and requires fresh evidence. No app-triggered deployment.
- Run focused checks while iterating and one full coherent final gate.

## Task 1 — Release contract, definition and bounded evidence

Files: `course-companion/shared/contracts.ts`, Practice package helpers and
persisted evidence validators; new `portfolio-release-evidence-adapter.ts`,
`portfolio-release-instructions.ts`, `m4-portfolio-release.json`, and one
`evidence/module-4/deployment-record.json` template in the Pilot artifacts.

- [x] Define release package kind, record path/version, reported deployment and
  independently observed URL metadata; use `application/source` fingerprint.
- [x] Add adapter tests for malformed/missing files, wrong source/handoff,
  unavailable task, containment and changed evidence. Collect actual bytes,
  validate the record, and distinguish reports from corroboration.
- [x] Reuse a shared source snapshot helper rather than copy fingerprint rules.
- [x] Verify with targeted Vitest and TypeScript checks.

## Task 2 — Public URL verification (delegated)

Files: new `course-companion/electron/main/public-portfolio-url.ts` and its
focused test. Export a verifier and observation type consumed by Task 1.

- [x] Reject non-HTTPS, credentials/query secrets, private/local addresses,
  unsafe redirects and non-default ports. Pin validated DNS results to requests.
- [x] Bound response bytes, redirects and total time; never execute remote
  scripts, use cookies or request provider account access.
- [x] Return reachability, status, final URL and bounded plain-text observations.
  Treat authentication/errors as not shareable and transport failure as retryable.
- [x] Test injected DNS/transport behavior without live network calls.

## Task 3 — Same-task lifecycle, review and completion

Files: Practice coordinator, task coordinator, review context/service,
Practice repository, progress receipt validation, narrow IPC/bootstrap wiring.

- [x] Load the current course's Module 3 v2 receipt and its retained task; reject
  missing/mismatched workspace/task rather than create a silent replacement.
- [x] Register the release adapter and reuse explicit approval/review. Extend
  accepted package kinds without weakening Module 2/3 gates.
- [x] Save a fresh release receipt targeting `module-4-complete` only after the
  current review passes. Include source, URL, course and binding identities.
- [x] Test rejection, source/URL mutations, review races, archived revision,
  restart and ordinary progress writes that try to bypass completion.

## Task 4 — Practice controls and integration handoff

Files: Practice-only submission/progress/brief controls and their tests; new
courseapp-owner handoff document. Leave host course pages unchanged.

- [x] Show the deployment record, live-link observation and one learner
  confirmation using the existing submission/return layout.
- [x] Keep failed or unavailable evidence retryable in the same attempt.
- [x] Document the exact host action/identity/destination contract, deferred
  host wiring and courseapp student-review findings with reproduction evidence.

## Task 5 — Final validation and ledger

- [x] Finish picky-student Module 2/3 Practice repairs: Finder metadata,
  complete source fingerprint, current archived v2 retention and restart history.
- [x] Exercise a disposable Module 2→3→4 Practice journey with injected URL and
  AI/provider observations; capture desktop/narrow Practice layouts.
- [x] Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`,
  `npm run test:electron`; perform diff and page/copy preservation audits.
- [x] Re-read affected M4.2–M4.8 and update the progress ledger with actual
  implementation, verification, host-integration gaps and next permitted action.
  Keep live provider/AI, native-platform and learner acceptance pending.

## Verification outcome — 22 October 2026

All five implementation tasks are complete within the Practice boundary.
Typecheck, lint, 711 unit tests (three skips), nine startup checks, build, full
Electron smoke/chat/guide and disposable Module 2→3→4 rehearsal passed.
Desktop/narrow layouts were inspected; the scene/copy preservation audit and
diff check passed. The later owner-approved Module 3/4 restart paragraph/button
received scoped render, TypeScript and lint checks under the trivial-edit fast
path; the full runtime suite was not repeated for that exact-copy edit.

The three skips comprise two existing intentional cases and unavailable Windows
file-symlink creation. Test AI/provider/public-URL observations are simulated;
live learner/provider/AI and native macOS acceptance remain pending. Courseapp
entry/completion integration is documented in the owner handoff and is outside
this implementation. Existing mixed work is preserved and included in the
owner's subsequent explicit request to commit and push everything to the
current Practice branch. This publication does not imply runtime acceptance.
