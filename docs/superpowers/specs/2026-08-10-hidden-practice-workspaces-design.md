# Disposable Developer Practice Workspace

## Status

Revised after developer clarification on 2026-08-10.

## Problem

Developers and automated workflow tests currently rehearse Module 1 against the
repository root. A rehearsal can therefore leave changes in
`starters/contentpilot`, which must remain clean before an end user begins.

This is a test-isolation problem, not a learner-workspace feature. End users are
supposed to work directly in the single canonical course workspace and make
real progress there.

## Product Boundary

Production and learner launches remain unchanged. Course Companion continues to
use the course repository as the Executor workspace, and learners modify
`starters/contentpilot` directly. There are no per-run learner workspaces, copy
steps, folder prompts, alternate paths, cleanup controls, or workspace concepts
in the learner UI.

Only explicit developer test and rehearsal commands use an isolated workspace.

## Developer Test Architecture

Before an Electron smoke test or developer Practice rehearsal begins, the test
harness creates a disposable directory under the operating system's temporary
directory. It copies the clean `starters/contentpilot` tree into the same
relative layout:

```text
<temporary-root>/starters/contentpilot/
```

The harness initializes the temporary root as an independent Git repository and
records a baseline commit. It then launches Course Companion with the existing
`COURSE_COMPANION_WORKSPACE_ROOT` override pointed at that temporary root.
Executor task creation, workspace evidence, Practice review, and screenshots
therefore observe only disposable developer-test state.

The normal launcher does not set the override and continues to resolve the real
course repository root.

## Source and Cleanup Rules

- The test copy excludes `node_modules`, build output, secrets, environment
  files, Git metadata, and generated artifacts.
- The canonical starter is source-only during test setup and is never used as
  the test Executor working directory.
- The test harness removes its temporary workspace in a `finally` path after
  success or failure.
- A failed cleanup reports the retained temporary path to developers only; it
  does not change learner-facing behavior.
- Screenshot output defaults to a separate temporary directory unless a
  developer explicitly supplies `COURSE_COMPANION_SCREENSHOT_DIR`.
- Repository-local fallback artifacts, if ever needed for debugging, live under
  `.practice-test-artifacts/`, which is Git-ignored and never used by production.

## Manual Developer Rehearsal

A dedicated developer command may reuse the same helper to create a disposable
workspace and launch the real windows for visual inspection. It is explicitly a
developer command and is not referenced by learner onboarding or launchers.
Closing the rehearsal performs the same bounded cleanup.

## Verification

Automated coverage must prove:

1. production workspace resolution still selects the canonical repository;
2. developer smoke/rehearsal mode selects a unique temporary workspace;
3. the copied starter preserves the required relative paths and begins from a
   clean independent Git baseline;
4. test Practice changes and commits affect only the temporary copy;
5. the canonical `starters/contentpilot` tree remains byte-for-byte unchanged
   through the complete Electron workflow;
6. cleanup runs after both passing and failing tests;
7. unsafe source content and generated files are excluded; and
8. no learner-facing UI, contract, or launcher exposes developer workspace
   isolation.

The existing lint, typecheck, unit, build, and Electron smoke gates remain
required after implementation.
