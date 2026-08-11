# Practice Dynamic QA Repairs Implementation Plan

**Design authority:** `docs/superpowers/specs/2026-08-11-practice-dynamic-qa-repair-design.md`

**Goal:** Fix the compact Teacher retry clipping and learner-facing internal-ID leaks, then repeat evidence-backed dynamic QA until all scoped Practice states are visually clean.

## Task 1: Add content-owned Practice labels

**Files**

- Modify: `course-companion/shared/contracts.ts`
- Modify: `course-companion/content/practices/m1-codex-safe-setup.json`
- Modify: `course-companion/content/practices/m2-planning-package.json`
- Modify: `course-companion/electron/main/practice-definition-repository.ts`
- Modify: `course-companion/tests/practice-definition-repository.test.ts`

**Steps**

1. Add a required bounded `title` to schema 2 Practice definitions.
2. Add a required bounded `label` to schema 2 `completionDestination`.
3. Add the approved Vietnamese labels to both current Practice definition files.
4. Keep schema 1 readable by deriving neutral learner-safe fallback labels during projection rather than changing historical files.
5. Add parser tests for valid labels and missing, blank, oversized, or unknown fields.
6. Run `npx vitest run tests/practice-definition-repository.test.ts` and `npm run typecheck`.

## Task 2: Project and render localized labels

**Files**

- Modify: `course-companion/shared/contracts.ts`
- Modify: `course-companion/electron/main/practice-coordinator.ts`
- Modify: `course-companion/src/renderer/src/components/PracticeBrief.tsx`
- Modify: `course-companion/src/renderer/src/components/PracticeProgress.tsx`
- Modify: `course-companion/tests/practice-coordinator.test.ts`
- Modify: `course-companion/tests/module-one-practice-renderer.test.ts`
- Modify: `course-companion/tests/electron-smoke.mjs`

**Steps**

1. Add learner-facing `title` and destination label data to `PracticeWorkspaceView`.
2. Project current schema 2 labels without changing Practice identity or persistence.
3. Project neutral labels for legacy schema 1 definitions.
4. Render the title in the Practice brief header.
5. Render the completion label in progress and remove raw checkpoint output.
6. Add assertions that neither current internal Practice ID nor completion checkpoint ID is visible in learner surfaces.
7. Run `npx vitest run tests/practice-coordinator.test.ts tests/module-one-practice-renderer.test.ts`, `npm run typecheck`, and `npm run lint`.

## Task 3: Prevent compact Teacher retry scrolling

**Files**

- Modify: `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`
- Modify: `course-companion/tests/electron-smoke.mjs`

**Steps**

1. Focus the Teacher composer with `focus({ preventScroll: true })`.
2. Preserve the existing auto-scroll behavior inside the chat log.
3. Extend the real failure/retry smoke sequence to assert zero document scroll.
4. Assert that the compact Teacher panel remains fully within viewport bounds after the live retry reply.
5. Do not add global scroll correction unless the focused change fails the reproduced path.
6. Run `npm run lint`, `npm run typecheck`, and `npm run test:electron`.

## Task 4: First refined dynamic QA pass

**Owner:** the same `dynamic_e2e_qa` sub-agent that produced the initial audit.

**Steps**

1. Review Tasks 1–3 changes without reverting other work.
2. Run the complete Electron journey with a fresh screenshot directory.
3. Visually inspect all 14 priority Practice/Teacher captures:
   - Module 1 setup desktop and 390 px;
   - settings;
   - Teacher lesson overlay;
   - Practice brief;
   - first-start and resume bubbles;
   - Teacher failure and retry chat;
   - compact progress and passed review;
   - full-screen Teacher and passed review;
   - Practice reflection.
4. Confirm localized labels and compact viewport stability.
5. Report every verified scoped issue with severity, reproduction, evidence, and smallest fix.
6. If issues remain, add one bounded repair task to this plan and implement it before repeating Task 4.

## Task 5: Repeat until clean

1. Reuse the same sub-agent for every pass.
2. Require a fresh end-to-end run after each fix.
3. Reject a clean result if any priority state is uninspected or hidden by a tooling limitation.
4. Stop only when the sub-agent reports no functional, copy, accessibility, clipping, overflow, hierarchy, feedback, or transition defect in scope.

## Task 6: Final validation and cleanup

1. Run `npm run typecheck`.
2. Run `npm run lint`.
3. Run `npm test`.
4. Run `npm run build`.
5. Run `npm run test:electron`.
6. Run `node --test pilot-workspace/.agents/skills/start-course-lesson/scripts/course-state.test.mjs`.
7. Run `git diff --check origin/main...HEAD`.
8. Remove disposable untracked QA screenshot folders after the final report is recorded.
9. Confirm a clean worktree.
10. Commit the verified repairs and report that the branch is ready to push.
