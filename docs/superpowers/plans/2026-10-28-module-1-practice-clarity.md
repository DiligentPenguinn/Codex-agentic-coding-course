# Module 1 Practice clarity implementation plan

**Goal:** Implement beginner-facing introductions across Modules 1–4, clear
post-review next actions and a passed-review celebration without changing
assessment, task binding, settings or learner data.

**Architecture:** Add a shared pure introduction component inside the existing
PracticeBrief. Render progress only for the requested task; disclose raw Module 1
configuration inside PracticeProgress while keeping blockers and guide anchors
visible. Keep all module-specific approval, evidence and completion rules intact.

**Tech stack:** React, TypeScript, scoped CSS, Vitest and Playwright Electron.

The owner approved the written specification and explicitly requested immediate
implementation without further process questions. Execute inline in this chat.
Use the approved spec's exact Vietnamese copy and existing values; no dependencies,
IPC, persistence changes, lesson edits, task creation during QA or new gates.

- [x] Add `PracticeIntroduction.tsx`, `practice-introduction-copy.ts` and scoped styles. Its children
  hold the existing action/error/transition controls. A `showReference` boolean
  controls the native settings disclosure. Render-check the purpose and reference.
- [x] Update `PracticeBrief.tsx` for the four current Practice identities: use the
  introduction, prefer resume, retain confirmed restart, and suppress pre-start
  progress. Keep unsupported/historical Practice rendering unchanged.
- [x] Update the Module 1 full `PracticeProgress.tsx` configuration panel: show
  missing/stale/mismatch guidance above collapsed raw values and retain the
  visible guide anchor, full checklist, review and return. The later owner request
  also puts the next action before compact progress/details and adds
  `PracticeSuccess.tsx` only for a passed, returnable review. Keep explicit
  submission/approval controls and all evidence available.
- [x] Extend renderer and Electron smoke coverage for pre-start clarity,
  keyboard disclosure, desktop/narrow layouts and the new initial button.
- [x] Run focused tests, then one full typecheck/lint/test/build/Electron batch.
  Inspect desktop and narrow screenshots, review scoped diffs and synchronize the
  Foundation ledger. Reopen the actual app without changing personal progress.

Validation commands run from `course-companion/`:

```powershell
npx.cmd vitest run tests/module-one-practice-renderer.test.ts tests/practice-brief-error-display.test.ts tests/practice-guide-renderer.test.ts
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run test:electron
```

Acceptance: the initial page communicates purpose, three steps and one primary
start action without empty telemetry. Active blockers and review remain honest;
all pages, unrelated copy and personal state are preserved. Passing automated
checks does not imply owner visual or live learner acceptance.

Outcome: implementation and Windows verification passed. Final evidence and
repaired intermediate checks are recorded in the 28 October entry of
`docs/planning/portfolio-course-implementation-plan.md`. Owner visual/runtime,
live learner/provider/AI and native macOS acceptance remain pending.
