# Practice review snapshot and compact checklist implementation plan

**Design:** `docs/superpowers/specs/2026-08-19-practice-review-snapshot-and-compact-checklist-design.md`

## 1. Protect the non-owning observation contract

- Extend Executor activity tests with a review/read mode that permits only an
  exact `thread/read({ includeTurns: true })` request for the bound thread.
- Assert zero `thread/resume`, `thread/list`, `turn/start`, thread switching, or
  focus-based lookup calls during Practice review.
- Split ownership-taking observation from non-owning snapshot collection behind
  explicit interfaces so start/resume lifecycle code cannot accidentally be
  reused by review.
- Keep exact thread ID, run ID, generation, and workspace validation at the
  main-process boundary.

## 2. Add a read-only task metadata adapter

- Introduce a narrow adapter that reads the exact persisted Codex task metadata
  needed by the existing configuration normalizer.
- Open the local metadata store read-only and query only the exact bound thread.
- Validate supported schema/columns and the stored thread ID, workspace, and
  rollout identity before returning data.
- Normalize model, reasoning effort, service tier, approval policy, sandbox,
  active permission profile, Full access, observation time, freshness, and
  connection using the existing contracts.
- Treat absent, incompatible, or ambiguous values as unverifiable; never supply
  an expected value by default.
- Add fixtures for valid metadata, wrong thread, wrong workspace, missing
  columns, locked/unavailable storage, and unsupported values.

## 3. Rebuild the same review context without claiming ownership

- Add a non-owning snapshot collector that combines exact `thread/read` turns,
  read-only task metadata, persisted activity, and workspace reconciliation.
- Preserve the existing merge and evidence rules for configuration and planning
  Practices.
- Route `PracticeReviewService` through the non-owning collector rather than
  `ExecutorActivityObserver.bind`.
- Keep the existing frozen-envelope, changed-during-review, completion receipt,
  invalidation, and final review-transport release behavior.
- Add field-by-field parity tests comparing the previous normalized successful
  fixtures with the new snapshot output and final review envelope.
- Add pass, needs-work, repeated review, concurrent review, evaluator failure,
  metadata failure, read failure, and mid-review mutation regressions.

## 4. Make review feedback explicit and evidence-specific

- Define narrow main-process error codes for busy task, unavailable metadata,
  disconnected read transport, binding mismatch, and evidence mutation.
- Return safe structured review failures through preload IPC without exposing
  internal paths or raw database errors.
- Keep the review button busy until the complete operation settles.
- Render the actionable failure adjacent to the review action in compact and
  full-screen Practice modes while preserving the last valid result.
- Remove Teacher-chat connection wording from active-Practice review UI; show
  evidence freshness/availability instead.
- Verify that every click produces updated progress or a visible error and that
  retry remains available.

## 5. Render the full compact checklist as an accordion

- Replace the compact single-current-step projection with all ordered checklist
  rows.
- Show status icon, step title, and short state label on every collapsed row.
- Keep every row collapsed on initial render and after reopening the window.
- Use a single-open accessible accordion: click, Enter, and Space toggle a row;
  opening another row closes the previous one.
- Place only that step's concise guidance inside its expanded panel.
- Keep overall completed count, review status, review action, and eligible return
  visible outside the accordion.
- Continue excluding configuration values, criterion explanations, evidence,
  timestamps, artifacts, invalidations, and approval controls from compact mode.
- Preserve all detailed information in full-screen mode.
- Add desktop and narrow-layout assertions for overflow, focus visibility, and
  readable collapsed/expanded states.

## 6. Exercise real ownership and recovery

- Add a production-client diagnostic that keeps the bound Practice open through
  the Desktop ownership boundary while the review path performs only non-owning
  reads.
- Verify that review does not produce “open in another app,” does not interrupt
  an active task, and does not leave an App Server process holding the task.
- Extend Electron smoke through start, open, compact accordion, full review,
  needs-work, correction, pass, return, reset/reopen, and restored normal Hỏi
  Triết.
- Run a read-only adversarial sub-agent iteratively against ownership races,
  context parity, stale evidence, UI disclosure, errors, and recovery; fix every
  reproducible product defect and rerun.

## 7. Final verification and ledger synchronization

- Run focused unit and integration tests during each boundary change.
- Run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and
  `npm run test:electron` from `course-companion/`.
- Run the real App Server ownership diagnostic and `git diff --check`.
- Re-read the Foundation checkpoint and update
  `docs/planning/portfolio-course-implementation-plan.md` with actual counts,
  verification evidence, remaining gaps, and the next permitted action.
- Do not infer pilot acceptance from automated results.
