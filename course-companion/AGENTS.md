# Course Companion Guidance

## Product boundary

- This directory contains the production learner-facing Electron Course Companion, not ContentPilot or a historical prototype.
- Keep `pilot-workspace/` as the runnable course-content authority and synchronize Course Companion contracts, fixtures, and UI when that authority changes.
- Preserve the separation between Learner, Teacher, and Executor. Teacher may coach and assess but must not edit files, control Executor work, approve actions, or declare Practice completion.

## Runtime integrity

- Bind Teacher context only to the exact active Practice and its explicitly bound Executor thread. Do not infer context from whichever Codex window appears focused.
- Distinguish Executor-reported results from evidence independently corroborated against the Practice workspace.
- Never present fixture or simulated lifecycle events as live evidence. Keep `COURSE_COMPANION_FAKE_CODEX=1` restricted to deterministic development and smoke paths.
- Keep learner progress in Electron-owned application data, not browser `localStorage` or repository files.
- Preserve context isolation, sandboxed renderers, narrow preload IPC, recoverable persistence, and the one-active-Practice rule.
- Never log, render, or commit secrets.

## Learner-facing UI

- Write natural Vietnamese with complete diacritics and outcome-oriented wording.
- Keep the current learner task dominant and supporting Teacher, progress, metadata, and simulation controls subordinate.
- Do not add a standalone title or status banner above the primary content unless the owner explicitly requests one. Keep necessary hierarchy inside the primary content surface so removing decorative chrome does not leave empty vertical space.
- For interface changes, inspect desktop and narrow layouts and verify there is no horizontal overflow.
- Treat sibling panels that share a viewport as one layout system with an explicit gap. Measure their rendered bounds at desktop and narrow sizes so longer content cannot make them touch or overlap.

## Verification

- Review every changed file and run the narrowest relevant checks while iterating.
- Before delivery of a coherent Course Companion change, run `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:electron` from this directory unless the task explicitly documents a narrower acceptance gate.
- Report any skipped or blocked check; do not convert automated verification into owner approval or pilot acceptance.
