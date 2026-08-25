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
- For interface changes, inspect supported desktop window sizes and verify there is no horizontal overflow, clipping, or overlap. Do not require phone-width or `390 × 844` verification for the learning experience.
- Treat sibling panels that share a viewport as one layout system with an explicit gap. Measure their rendered bounds at supported desktop sizes so longer content cannot make them touch or overlap.

## Verification

- Review every changed file and choose either a focused or full acceptance gate from the risk rules in the repository root.
- Use a focused gate for a narrow, additive change confined to one module, scene, local route, copy surface, or component presentation when it does not touch runtime integrity, persistence, saved-progress compatibility, Practice lifecycle, evidence, receipts, unlock gates, security, dependencies, build configuration, shared layout, or cross-module behavior.
- A focused gate normally includes the directly affected contract or unit tests, typecheck when typed code or registries change, `git diff --check`, and one focused Electron desktop journey only when the change affects visible layout or navigation. Run lint or a production build only when the changed code makes that evidence relevant. Do not run the complete unit suite or full Electron smoke merely because a Course Companion file changed.
- Use the full gate for runtime, persistence, migration, Practice, completion, security, dependency, build, shared-renderer, cross-module, broad-refactor, release, rehearsal, or application-wide acceptance work. The full gate is `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`, and `npm run test:electron` from this directory.
- A known unrelated full-suite blocker does not invalidate a passing focused gate. Report the focused evidence and the separate blocker without claiming full-app verification, owner approval, or pilot acceptance.
