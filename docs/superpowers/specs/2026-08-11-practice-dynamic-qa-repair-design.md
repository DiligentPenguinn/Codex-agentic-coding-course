# Practice Dynamic QA Repair Design

**Date:** 11 August 2026
**Status:** Approved for implementation
**Scope:** Repair defects introduced by the Module 1 and Module 2 Practice workflows, then repeat dynamic visual QA until the scoped workflow is clean.

## Problem

The first dynamic end-to-end audit completed the full Pilot 0.2 desktop journey and found two issues in newly added Practice surfaces:

1. After a Teacher message fails and the learner retries it, the compact Teacher document can scroll away from the origin. The panel shell then appears shifted and clipped.
2. Learner-facing Practice surfaces expose internal identifiers such as `m2-planning-package` and raw completion checkpoint IDs.

The functional harness passed, but several priority screenshots still require inspection after the repairs. Automated success alone is not sufficient for this quality gate.

## Product boundary

- Preserve the current pixel-art and retro interface.
- Limit changes to the Module 1 and Module 2 Practice workflow added on this branch.
- Improve clarity, consistency, accessibility, overflow behavior, interaction feedback, state transitions, and learner-facing Vietnamese copy.
- Do not redesign unrelated course, Home Base, lesson, or legacy surfaces.
- Do not expose internal Practice, checkpoint, scene, or run identifiers as learner guidance.

## Repair 1: stable compact Teacher viewport

`TeacherWorkspace` will focus the message composer with `preventScroll: true`. The fix must preserve the existing keyboard-first behavior without allowing browser focus restoration to scroll the compact document.

The Electron regression will reproduce the real failure and retry sequence and then assert:

- the page remains at `scrollX = 0` and `scrollY = 0`;
- the Teacher panel starts within the viewport;
- the panel width does not extend beyond the viewport;
- chat-log scrolling still follows the newest message;
- compact-to-full and full-to-compact transitions continue to work.

The implementation will not add an unconditional global `scrollTo` unless the focused fix fails to protect a verified browser path, because global scroll correction could mask a different layout defect.

## Repair 2: content-owned learner labels

Practice definitions are the authority for learner-facing Practice language. Schema 2 definitions will gain:

- a localized Practice title;
- a localized completion-destination label.

The definition repository will validate both strings using the same bounded-input discipline as other learner content. `PracticeCoordinator` will project them into `PracticeWorkspaceView`.

The renderer will use:

- the localized Practice title in the Practice brief header;
- the localized destination label in Practice progress;
- internal IDs only for protocol identity, persistence, IPC validation, diagnostics, and tests.

The current definitions will use concise Vietnamese labels:

- Module 1: `Thiết lập Codex an toàn`;
- Module 2: `Xây dựng planning package`;
- Module 1 destination: `Phần tổng kết Module 1`;
- Module 2 destination: `Bài kiểm tra và hoàn thành Module 2`.

Legacy schema 1 content will receive neutral learner-safe fallback labels rather than exposing identifiers.

## Data flow

1. A schema 2 Practice JSON file supplies `title` and `completionDestination.label`.
2. `PracticeDefinitionRepository` validates the fields.
3. `PracticeCoordinator.toView` copies the localized values into the workspace view.
4. `PracticeBrief` and `PracticeProgress` render those values.
5. Internal identity remains unchanged for task binding, evidence review, completion receipts, and progress persistence.

No migration of persisted Practice runs is required because labels are loaded from definitions and are not part of run identity.

## Error and compatibility behavior

- Missing or invalid required labels in schema 2 fail definition loading with a bounded validation error.
- Legacy schema 1 definitions remain readable and render neutral labels.
- A failed definition load continues through the existing Practice error surface.
- Focus preservation changes only browser scroll behavior; message delivery, retry ownership, and Teacher state remain unchanged.

## Dynamic QA loop

The same sub-agent owns each audit pass so it can compare the refined workflow against the original evidence.

For every pass it will:

1. run the real Electron end-to-end workflow;
2. exercise Module 1 setup and approval;
3. exercise Module 2 start, resume, switch, planning actions, invalidation, recovery, review, completion, return, and restart;
4. inspect compact and full Teacher surfaces, including failure and retry;
5. inspect all 14 priority Practice/Teacher captures;
6. report verified defects separately from subjective suggestions;
7. include reproduction steps and evidence for every finding.

If a new scoped defect is verified, it will be fixed with the smallest coherent change, covered by a regression assertion where practical, and the complete audit pass will run again. The loop ends only when the sub-agent reports:

- no functional errors;
- no scoped clipping, overflow, hierarchy, copy, accessibility, feedback, or transition defects;
- all priority states visually inspected;
- no uninspected state hidden behind a tooling limitation.

## Validation

Each repair iteration will run focused tests for touched behavior. The final clean pass must also run:

- `npm run typecheck`;
- `npm run lint`;
- `npm test`;
- `npm run build`;
- `npm run test:electron`;
- the Pilot workspace course-state regression test;
- `git diff --check origin/main...HEAD`.

## Out of scope

- changing the pixel-art aesthetic;
- broad typography, color, or layout redesign;
- polishing unrelated lesson or Home Base screens;
- changing Practice objectives, assessment outcomes, or evidence requirements;
- replacing deterministic desktop fixtures with external live-service acceptance.
