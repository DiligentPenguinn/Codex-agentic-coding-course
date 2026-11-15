# Practice handoff, compact review, and guide repair implementation plan

**Design:** `docs/superpowers/specs/2026-08-19-practice-handoff-compact-guide-repair-design.md`

## 1. Reproduce and protect thread ownership

- Add focused tests proving that Practice observation is released before every
  Codex deep-link open.
- Add a reusable main-process release helper that stops the active App Server,
  clears its restart promise, and waits for process exit.
- Route Practice coordinator observation through a snapshot wrapper that always
  releases ownership after capture.
- Route Practice review observation through the same release boundary.
- Prevent Teacher state loading from resuming an active Practice thread because
  direct Teacher chat is unavailable during Practice.
- Preserve exact-thread validation, serialized start/resume behavior, baseline
  capture, stale evidence behavior, and retry state.

## 2. Split compact and full review presentation

- Make `PracticeProgress` return a dedicated compact projection containing only
  status, completed-step count/current step, one next action, review, and
  eligible return controls.
- Keep configuration, criteria, evidence, timestamps, objectives, invalidation
  details, and approval controls in the full-screen branch.
- Remove duplicated context/explanation chrome from compact `TeacherWorkspace`.
- Preserve one shared authoritative workspace and existing expansion control.
- Add static-render and source-boundary regressions for allowed and forbidden
  compact content.

## 3. Repair guide step 5

- Add the approved `Tiếp` label to step 5.
- Model acknowledgement separately from authoritative review completion: `Tiếp`
  may hide the instruction, but step 6 remains unavailable until review passes.
- Preserve skip, pause, replay, and return-race behavior.
- Add coordinator, renderer, and Electron assertions for the button and gate.

## 4. Verify iteratively

- Run focused ownership, renderer, guide, review, and coordinator suites.
- Use a read-only sub-agent to adversarially test start/resume/review/reopen,
  compact/full disclosure, guide bypass, failure recovery, and restoration.
- Run typecheck, lint, all unit/startup tests, production build, full Electron
  smoke, responsive checks, and `git diff --check`.
- Re-read and synchronize the Foundation ledger without inferring pilot
  acceptance.
