# Practice review authoritative settings and guide recovery implementation plan

**Design:** `docs/superpowers/specs/2026-08-22-practice-review-authoritative-settings-and-guide-recovery-design.md`

## 1. Restore baseline-plus-updates review configuration

- Preflight the exact bound thread once with `thread/read` and reject
  in-progress turns before metadata access.
- Validate the saved `thread-start` snapshot against the active run and exact
  task binding.
- Resolve and scan the exact rollout read-only; use the latest valid settings
  event when present and the saved baseline when no later event exists.
- Preserve activity projection, workspace evidence, stable-file detection, and
  fail-closed handling for missing or unverifiable values.

## 2. Prove the path remains non-owning

- Permit only `thread/read` on the dedicated Practice verification transport.
- Release that transport in `finally` after every read attempt.
- Add tests for one-read call ordering, explicit absence of `thread/resume`, busy
  preflight, binding mismatches, malformed configuration, success, and failure
  release.
- Preserve concurrent review coalescing and final Teacher transport release.

## 3. Restore semantic guide progression

- Change step 5 back to `review-requested` and remove its duplicate `Tiếp`
  control.
- Keep step 5 visible until authoritative pass, then show step 6.
- Reconcile persisted step-6 cursors back to step 5 when review is not passed.
- Apply the same rule to replay, restart, invalidation, and return races.

## 4. Replace false-positive tests

- Update source-contract and snapshot-reader tests to require a read-only
  transport and explicitly forbid resume.
- Add the real empty-rollout shape without a settings event as a regression
  fixture and prove production review uses its exact saved baseline.
- Prove a later persisted settings event supersedes that baseline.
- Replace the test that blessed hidden step 6 with needs-work, pass, migration,
  replay, and step-7 assertions.

## 5. Add a real-runtime diagnostic

- Add a standalone Node diagnostic that launches the installed
  `codex app-server` with an isolated temporary Codex home and workspace.
- Create an empty task, capture and validate its start configuration, validate
  the empty rollout shape, run the production baseline fallback, stop,
  reconnect with a second client, and read the same task without resume.
- Clean only the diagnostic's explicit temporary directories and report skips
  separately from passes.

## 6. Run product verification

- Run focused Practice tests after each boundary change.
- Run typecheck, lint, all unit/startup tests, production build, Electron smoke,
  the real-runtime diagnostic, and `git diff --check`.
- Run the production reader read-only against the exact active Module 1 task
  that exposed the defect.
- Combine focused wrong-setting, corrected-pass, restart, and invalidation tests
  with the production-built Electron journey through guide steps 5–7 and the
  installed-App-Server ownership diagnostic.

## 7. Synchronize the Foundation ledger

- Re-read the affected Foundation checkpoint and record actual test counts,
  runtime diagnostic output, end-to-end observations, remaining gaps, and the
  next permitted action.
- Mark verification `passed` only if both runtime and product acceptance gates
  pass; otherwise keep it `failed` or `blocked` with exact evidence.
- Do not infer pilot acceptance or overall owner approval.
