# Disposable Developer Practice Workspace Implementation Plan

**Goal:** Prevent developer smoke tests and rehearsals from modifying the
canonical `starters/contentpilot` tree without changing learner workspace
behavior.

**Approved design:**
[`../specs/2026-08-10-hidden-practice-workspaces-design.md`](../specs/2026-08-10-hidden-practice-workspaces-design.md)

## Task 1: Add a developer-only disposable workspace helper

1. Create a test-support helper that makes a unique OS-temporary root.
2. Copy the canonical starter into `starters/contentpilot` under that root.
3. Exclude Git metadata, dependencies, builds, secrets, and generated artifacts.
4. Initialize an independent Git repository and create a clean baseline commit.
5. Expose bounded cleanup that removes only the resolved owned temporary root.
6. Add focused tests for layout, exclusions, clean baseline, source preservation,
   uniqueness, and cleanup after success or failure.

## Task 2: Isolate the Electron Practice smoke workflow

1. Provision the disposable workspace before Electron launches.
2. Set `COURSE_COMPANION_WORKSPACE_ROOT` only in the smoke child environment.
3. Rehearse the Module 1 CSS change inside the disposable copy after the
   Practice baseline exists.
4. Assert Executor binding and evidence paths resolve to the disposable root.
5. Fingerprint the canonical starter before and after the workflow and fail if
   it changes.
6. Clean the disposable workspace in the smoke test's final teardown path.

## Task 3: Keep developer artifacts out of source control

1. Ignore `.practice-test-artifacts/` as an explicit developer-only fallback.
2. Keep default screenshots and disposable workspaces in the OS temporary
   directory.
3. Do not add learner-facing settings, contracts, paths, or launcher behavior.

## Task 4: Verify product and test boundaries

1. Prove production workspace resolution still defaults to the repository root.
2. Prove only explicit test environment overrides select the disposable root.
3. Run focused helper and Electron tests.
4. Run lint, typecheck, unit/startup tests, build, and Electron smoke.
5. Capture and inspect the complete Practice workflow, fix actionable defects,
   and rerun until a clean pass.

## Completion gate

- The canonical starter stays byte-for-byte unchanged during developer tests.
- Developer Practice evidence is generated only inside a disposable Git root.
- Test cleanup is bounded and runs on success and failure.
- Learner launches still use the single canonical workspace directly.
- The complete verification suite passes.
