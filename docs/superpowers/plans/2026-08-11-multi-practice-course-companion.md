# Multi-Practice Course Companion Implementation Plan

**Goal:** Reconcile PR #4 with the merged Pilot 0.2 curriculum and deliver real,
resumable, evidence-grounded Practice workflows for Module 1 Codex setup and
Module 2 planning-package creation.

**Approved design:**
[`../specs/2026-08-11-multi-practice-course-companion-design.md`](../specs/2026-08-11-multi-practice-course-companion-design.md)

**Primary packages:** `course-companion/`, `pilot-workspace/`

## Execution rules

- Work on `feature/course-companion-practice-workflow`, the branch behind PR #4.
- Merge `origin/main` into the feature branch; do not rewrite the shared branch
  with a force-pushed rebase.
- In content conflicts, preserve the merged `pilot-workspace/` curriculum.
- In Practice-lifecycle conflicts, preserve PR #4's verified binding, review,
  recovery, and completion invariants.
- Write or update focused tests before each behavioral change.
- Use disposable learner workspaces for any test that writes artifacts.
- Do not mark PR #4 ready until every completion gate passes.

## Task 1: Merge current `main` and establish a green integration baseline

**Expected conflict area:**

- `README.md`
- `course-companion/README.md`
- `course-companion/electron/main/progress-repository.ts`
- `course-companion/electron/main/teacher-fixture.ts`
- `course-companion/package.json`
- `course-companion/shared/contracts.ts`
- `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`
- `course-companion/src/renderer/src/styles.css`
- `course-companion/src/renderer/src/surfaces/CompanionWindow.tsx`
- `course-companion/src/renderer/src/surfaces/LearningWindow.tsx`
- `course-companion/tests/electron-smoke.mjs`
- `course-companion/tests/progress-repository.test.ts`

1. Fetch `origin/main` and confirm the merge base and branch cleanliness.
2. Merge `origin/main` into the PR #4 branch.
3. Resolve content and course-map conflicts in favor of the merged Pilot 0.2
   sequence, checkpoints, quizzes, visuals, artifact templates, and Triết
   identity.
4. Preserve PR #4's real App Server client, Executor binding, activity
   observer, review service, run repository, Teacher adapter, and window
   coordination.
5. Keep simulated Practice behavior behind explicit fixture flags only.
6. Remove no old Practice code yet unless it blocks compilation; preserve the
   baseline long enough to migrate it deliberately in later tasks.
7. Run `npm install` only if the merged lockfile requires it, then run from
   `course-companion/`:

   ```powershell
   npm run typecheck
   npm run lint
   npm test
   npm run build
   ```

8. Record any expected failures caused specifically by the old hardcoded
   Practice ID; all unrelated failures must be fixed before proceeding.

## Task 2: Add Practice definition schema 2 and the adapter registry contract

**Create:**

- `course-companion/electron/main/practice-evidence-adapter.ts`
- `course-companion/electron/main/practice-evidence-adapter-registry.ts`
- `course-companion/tests/practice-evidence-adapter-registry.test.ts`

**Modify:**

- `course-companion/shared/contracts.ts`
- `course-companion/electron/main/practice-definition-repository.ts`
- `course-companion/tests/practice-definition-repository.test.ts`

1. Add schema 2 contracts for task policy, evidence profile, workspace kind,
   resumable step dependencies, and adapter-produced evidence state.
2. Keep schema 1 parsing available only for explicit historical migration; do
   not make it the current default.
3. Validate exact fields, bounded text, stable IDs, semantic versions,
   supported profile/policy pairs, known destinations, unique steps and
   criteria, and criterion-to-step references.
4. Validate the dependency graph and reject unknown dependencies,
   self-dependencies, and cycles.
5. Define the bounded adapter interface without giving adapters permission to
   persist verdicts or course progress.
6. Add a registry that resolves `codex-task-configuration` and
   `planning-package`; reject unknown profiles without fallback.
7. Test valid definitions and every fail-closed parser/registry case.

## Task 3: Replace hardcoded Practice identity with explicit run identity

**Modify:**

- `course-companion/electron/main/practice-coordinator.ts`
- `course-companion/electron/main/practice-run-repository.ts`
- `course-companion/electron/main/practice-review-service.ts`
- `course-companion/electron/main/teacher-context-broker.ts`
- `course-companion/electron/main/teacher-service.ts`
- `course-companion/electron/main/progress-repository.ts`
- `course-companion/shared/contracts.ts`
- `course-companion/tests/practice-coordinator.test.ts`
- `course-companion/tests/practice-run-repository.test.ts`
- `course-companion/tests/practice-review-service.test.ts`
- `course-companion/tests/teacher-context-broker.test.ts`
- `course-companion/tests/progress-repository.test.ts`

1. Add a failing repository-wide test or assertion that current lifecycle
   services contain no fallback to `m1-verifiable-brief`.
2. Require Practice ID and version at run creation and pass them through every
   service boundary.
3. Persist task policy, evidence profile, ordered step states, learner
   decisions, evidence snapshots, invalidations, and completion data.
4. Add an explicit migration that archives the historical CSS run or preserves
   it only as a historical receipt; never reinterpret it as a current run.
5. Keep compare-and-save operations scoped to run ID, generation, Practice ID,
   and Practice version.
6. Remove hardcoded destination, checkpoint, Teacher context, and renderer
   defaults.
7. Test migration, restart recovery, replaced-run protection, stale writes,
   and multiple Practice identities.

## Task 4: Add validated workspace resolution and per-Practice task policies

**Create:**

- `course-companion/electron/main/practice-workspace-resolver.ts`
- `course-companion/electron/main/practice-task-policy.ts`
- `course-companion/tests/practice-workspace-resolver.test.ts`
- `course-companion/tests/practice-task-policy.test.ts`

**Modify:**

- `course-companion/electron/main/executor-chat-coordinator.ts`
- `course-companion/electron/main/index.ts`
- `course-companion/electron/main/practice-run-repository.ts`
- `course-companion/tests/executor-chat-coordinator.test.ts`
- `course-companion/tests/disposable-practice-workspace.test.mjs`

1. Resolve `pilot-workspace` from the validated course root and reject arbitrary
   or escaping paths.
2. Make development tests resolve the same workspace kind to a disposable copy.
3. Change Executor creation to accept a parsed task policy and Practice-aware
   title rather than fixed Module 1 text.
4. For `inherit-configuration-only`, omit model, effort, service tier, approval,
   and sandbox overrides and send no Executor turn.
5. For `safe-workspace-write`, require the approved Module 1 configuration and
   explicitly set its model, effort, and service tier plus `on-request` and a
   workspace-write sandbox.
6. Parse and validate the effective `thread/start` response. Stop before any
   turn if the task identity, workspace, permission policy, or configuration is
   incompatible.
7. Test both policies, missing receipts, unsafe responses, workspace mismatch,
   and Practice-aware task naming.

## Task 5: Capture and persist effective Codex task configuration

**Create:**

- `course-companion/electron/main/codex-configuration-evidence-adapter.ts`
- `course-companion/electron/main/codex-configuration-normalizer.ts`
- `course-companion/tests/codex-configuration-evidence-adapter.test.ts`
- `course-companion/tests/codex-configuration-normalizer.test.ts`

**Modify:**

- `course-companion/electron/main/codex-app-server-client.ts`
- `course-companion/electron/main/executor-activity-observer.ts`
- `course-companion/electron/main/executor-activity-repository.ts`
- `course-companion/electron/main/executor-chat-coordinator.ts`
- `course-companion/shared/contracts.ts`
- `course-companion/tests/executor-activity-observer.test.ts`
- `course-companion/tests/executor-activity-observer-reliability.test.ts`

1. Add typed projections for the effective settings in `thread/start`,
   `thread/resume`, and `thread/settings/updated`.
2. Normalize model, effort, service tier, approval policy, sandbox policy, and
   active permission profile through an explicit allowlist.
3. Treat null/runtime-advertised standard service tier as Standard and reject
   unknown nonstandard values.
4. Treat Full access as off only when the effective sandbox is not
   `dangerFullAccess` and no full-access permission profile is active.
5. Persist raw normalized protocol values, learner-facing values, task/run
   identity, observation time, and freshness.
6. Ensure unrelated task updates cannot mutate the bound Practice evidence.
7. Mark disconnects and missing fields stale or unverifiable without erasing
   the last observed snapshot.
8. Test all five passing values, one mismatch at a time, unknown values,
   duplicate/out-of-order notifications, reconnect, and wrong-thread events.

## Task 6: Implement the real Module 1 Practice

**Modify:**

- `course-companion/content/practices/m1-codex-safe-setup.json`
- `course-companion/electron/main/practice-review-context.ts`
- `course-companion/electron/main/practice-review-service.ts`
- `course-companion/electron/main/progress-repository.ts`
- `course-companion/electron/main/teacher-service.ts`
- `course-companion/shared/contracts.ts`
- `course-companion/tests/practice-review-context.test.ts`
- `course-companion/tests/practice-review-service.test.ts`
- `course-companion/tests/practice-completion-progress.test.ts`
- `course-companion/tests/teacher-service-scenarios.test.ts`

1. Convert the Module 1 definition to schema 2 with five resumable steps and
   `codex-task-configuration` evidence.
2. Remove screenshot, attachment, Executor-report, and workspace-change
   requirements from the definition and lesson contract.
3. Build the review envelope from fresh effective configuration metadata only.
4. Require all five normalized settings and reject stale, disconnected,
   incomplete, or unknown evidence.
5. Generate Triết guidance that names current matches, mismatches, and exactly
   one next settings action.
6. Persist the approved model, effort, and service tier in the completion
   receipt for later task creation.
7. Complete `m1-mastery` only after a validated pass and retain idempotent
   return behavior.
8. Test every mismatch, retry, reconnect, pass, restart-after-pass, and duplicate
   review/return path.

## Task 7: Align Module 1 learner content and UI with direct metadata review

**Modify:**

- `pilot-workspace/course/lesson-scripts/module-1.script.vi.md`
- `pilot-workspace/course/lessons/module-1.vi.md`
- `pilot-workspace/course/prompts/start-module-1.vi.md`
- `pilot-workspace/artifacts/codex-setup-checklist.template.md`
- `pilot-workspace/AGENTS.md`
- `course-companion/src/renderer/src/components/PracticeBrief.tsx`
- `course-companion/src/renderer/src/components/PracticeProgress.tsx`
- `course-companion/src/renderer/src/surfaces/LearningWindow.tsx`
- `course-companion/src/renderer/src/styles.css`

1. Replace the two-screenshot instructions with a direct-settings workflow.
2. Tell the learner that Course Companion reads only the bound task's effective
   configuration and does not change it.
3. Show the five detected values, freshness, mismatches, and unavailable states
   in learner-facing Vietnamese.
4. Explain that Course Companion sends no task or command before setup passes;
   do not claim that it blocks all manual learner input in Codex.
5. Preserve the existing lesson concepts, recommended settings, checkpoint,
   mastery gate, and Triết identity.
6. Update the setup-checklist artifact to record direct metadata provenance
   rather than screenshot paths.
7. Add renderer tests for loading, mismatch, stale, pass, keyboard, compact,
   full-screen, and reduced-motion states.

## Task 8: Add bounded Module 2 artifact and workspace evidence

**Create:**

- `course-companion/electron/main/planning-package-evidence-adapter.ts`
- `course-companion/electron/main/planning-artifact-repository.ts`
- `course-companion/tests/planning-package-evidence-adapter.test.ts`
- `course-companion/tests/planning-artifact-repository.test.ts`

**Modify:**

- `course-companion/electron/main/workspace-evidence-provider.ts`
- `course-companion/shared/contracts.ts`
- `course-companion/tests/workspace-evidence-provider.test.ts`

1. Capture a workspace baseline at Module 2 Practice start.
2. Permit only `artifacts/PRD.md` and
   `artifacts/implementation-plan.md` as changed paths.
3. Reject missing, empty, oversized, directory, symlink, escaping, or substitute
   artifacts.
4. Read bounded UTF-8 contents and produce digests, timestamps, freshness, and
   canonical relative paths.
5. Report unexpected changed paths without reading their contents and block
   completion until they are restored or removed.
6. Keep credential redaction and evidence count/size limits in the Teacher
   projection.
7. Test permitted changes, every unsafe file case, unrelated dirty files,
   committed changes, restart, and exact digest stability.

## Task 9: Implement Module 2 resumable step and dependency state

**Create:**

- `course-companion/electron/main/practice-step-state.ts`
- `course-companion/tests/practice-step-state.test.ts`

**Modify:**

- `course-companion/electron/main/practice-coordinator.ts`
- `course-companion/electron/main/practice-run-repository.ts`
- `course-companion/electron/main/executor-chat-coordinator.ts`
- `course-companion/electron/main/executor-activity-observer.ts`
- `course-companion/shared/contracts.ts`
- `course-companion/tests/practice-coordinator.test.ts`
- `course-companion/tests/practice-run-repository.test.ts`

1. Represent pending, current, completed, and stale step states with a persisted
   reason and dependency inputs.
2. Record learner-owned PRD prompt, bounded interview completion evidence,
   explicit PRD approval, explicit plan approval, and learner scope decision.
3. Accept approvals only through bounded course actions tied to the current run;
   never infer them from Executor or Teacher messages.
4. On PRD digest change, invalidate PRD approval, plan generation, alignment,
   package approval, and Teacher review.
5. On plan-only digest change, preserve PRD approval and invalidate alignment,
   package approval, and Teacher review.
6. Keep the same run and bound task while selecting the earliest invalidated
   step as current.
7. Guard all state writes with run generation and current artifact digests.
8. Test initial ordering, every step transition, both invalidation paths,
   out-of-order decisions, restart, and late events.

## Task 10: Add the Module 2 definition and semantic review profile

**Create:**

- `course-companion/content/practices/m2-planning-package.json`
- `course-companion/tests/planning-package-review.test.ts`

**Modify:**

- `course-companion/electron/main/practice-review-context.ts`
- `course-companion/electron/main/practice-review-contracts.ts`
- `course-companion/electron/main/practice-review-evaluator.ts`
- `course-companion/electron/main/practice-review-service.ts`
- `course-companion/electron/main/real-teacher-adapter.ts`
- `course-companion/tests/practice-review-context.test.ts`
- `course-companion/tests/practice-review-contracts.test.ts`
- `course-companion/tests/practice-review-service.test.ts`
- `course-companion/tests/real-teacher-adapter.test.ts`

1. Encode the approved objective, expected planning package, eight resumable
   steps, semantic criteria, dependencies, and `m2-mastery` destination.
2. Extend evidence kinds only where needed for configuration, canonical
   artifacts, explicit learner approval, learner scope decisions, alignment,
   and unexpected workspace changes.
3. Build a frozen Module 2 review envelope containing only bounded artifact
   content, current digests, approvals, scope decision, provenance, and task
   identity.
4. Require criterion results for PRD quality, plan quality, alignment, scope
   control, learner ownership, and evidence freshness.
5. Reject a pass when either artifact changed during review, any required
   criterion is absent, an evidence kind is incompatible, or an unexpected path
   changed.
6. Generate Triết feedback with verdict, evidence reviewed, passes, problems,
   and one next action.
7. Test strong/weak PRDs, strong/weak plans, alignment gaps, scope leakage,
   hidden assumptions, implementation code, absent approvals, stale digests,
   malformed evaluator output, and deterministic pass.

## Task 11: Reorder Module 2 instruction and connect the real Practice

**Modify:**

- `pilot-workspace/course/course-structure.json`
- `pilot-workspace/course/lesson-scripts/module-2.script.vi.md`
- `pilot-workspace/course/lessons/module-2.vi.md`
- `pilot-workspace/course/prompts/start-module-2.vi.md`
- `pilot-workspace/course/quizzes/module-2.quiz.json`
- `pilot-workspace/course/pedagogy/rubrics/mastery-rubric.vi.md`
- `pilot-workspace/course/pedagogy/teacher/scripted-delivery-contract.vi.md`
- `pilot-workspace/course/pedagogy/teacher/teacher-system-prompt.vi.md`
- `pilot-workspace/AGENTS.md`
- `course-companion/src/renderer/src/surfaces/LearningWindow.tsx`
- `course-companion/electron/main/progress-repository.ts`

1. Preserve the collaborator's learning outcomes and Vietnamese-first content.
2. Move all PRD, prompt, and implementation-plan instruction plus the existing
   3 + 3 + 2 formative questions before Practice.
3. Launch `m2-planning-package` only after those concepts and checks complete.
4. Move prompt writing, interview, artifact drafting, approvals, alignment, and
   Teacher review inside the one real Practice run.
5. Keep the existing 15-question final assessment after the passed Practice.
6. Keep Module 2 completion dependent on both artifacts, planning-package
   review, learner scope decision, and mastery score.
7. Update checkpoint-to-scene mappings without changing the approved learner
   outcomes or adding implementation work.
8. Test course ordering, checkpoint persistence, artifact gates, resume, and
   final-assessment placement.

## Task 12: Generalize Practice renderer and Teacher communication

**Modify:**

- `course-companion/src/renderer/src/components/PracticeBrief.tsx`
- `course-companion/src/renderer/src/components/PracticeProgress.tsx`
- `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`
- `course-companion/src/renderer/src/surfaces/CompanionWindow.tsx`
- `course-companion/src/renderer/src/surfaces/LearningWindow.tsx`
- `course-companion/src/renderer/src/styles.css`
- `course-companion/shared/contracts.ts`
- `course-companion/tests/practice-brief-error-display.test.ts`
- `course-companion/tests/practice-completion-progress.test.ts`
- `course-companion/tests/teacher-practice-review-controls.test.ts`

1. Render objective, expected outcome, checklist, evidence status, and
   destination from the active definition/run.
2. Add Module 1 configuration value and mismatch presentation without exposing
   raw protocol objects.
3. Add Module 2 artifact availability, approval, freshness, alignment, and
   invalidation presentation.
4. When a dependency regresses, show the changed artifact, affected steps,
   reason, and next action in both Progress and Triết chat.
5. Preserve PR #4's review/return controls, compact/full parity, keyboard
   operation, accessible names, focus states, and reduced-motion behavior.
6. Ensure chat wording alone cannot mutate step, review, or completion state.
7. Test both definitions across idle, active, stale, needs-work, passed,
   invalidated, disconnected, and recovery states.

## Task 13: Generalize completion, return, and persistent Teacher memory

**Modify:**

- `course-companion/electron/main/practice-review-service.ts`
- `course-companion/electron/main/progress-repository.ts`
- `course-companion/electron/main/teacher-memory-repository.ts`
- `course-companion/electron/main/teacher-service.ts`
- `course-companion/electron/preload/index.ts`
- `course-companion/electron/main/index.ts`
- `course-companion/src/global.d.ts`
- `course-companion/src/renderer/src/surfaces/LearningWindow.tsx`
- `course-companion/tests/progress-repository.test.ts`
- `course-companion/tests/teacher-memory-repository.test.ts`
- `course-companion/tests/teacher-service-scenarios.test.ts`

1. Make completion receipts support both current Practice definitions and their
   configured destinations.
2. Keep receipt application idempotent across repeat clicks, IPC duplication,
   restart, and window handoff failure.
3. Persist summaries keyed by real Practice ID and version; archive historical
   CSS summaries without presenting them as current learning history.
4. Preserve Module 1 approved configuration needed for later task creation.
5. Persist Module 2 strengths, mistakes, decisions, and unresolved issues from
   the frozen reviewed run without storing full artifact contents.
6. Reload authoritative state on return rather than trusting renderer payloads.
7. Test both destinations, duplicate completion, missing receipt, stale receipt,
   restart-after-pass, and Teacher-memory separation.

## Task 14: Update deterministic gateways, fixtures, and desktop tests

**Modify:**

- `course-companion/electron/main/test-codex-gateway.ts`
- `course-companion/electron/main/practice-fixture.ts`
- `course-companion/electron/main/teacher-fixture.ts`
- `course-companion/tests/electron-smoke.mjs`
- `course-companion/tests/practice-fixture.test.ts`
- `course-companion/tests/teacher-fixture.test.ts`
- `course-companion/tests/executor-evidence-reconciliation.test.ts`
- `course-companion/tests/support/disposable-practice-workspace.mjs`

1. Add deterministic thread-start settings and settings-update notifications.
2. Model safe and unsafe task creation, configuration mismatches, reconnects,
   and stale settings.
3. Model the complete Module 2 prompt/interview/approval/artifact/revision flow.
4. Add PRD-change and plan-only-change invalidation scenarios.
5. Keep fixture state clearly labelled simulated and unreachable in normal
   learner operation.
6. Exercise both Practices in disposable learner workspaces and fingerprint the
   canonical starter before and after each rehearsal.
7. Prove ordinary Teacher prose cannot pass a Practice and stale review output
   cannot overwrite current evidence.

## Task 15: Run complete validation and prepare PR #4 for review

Run from `course-companion/` and fix every failure:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:electron
```

Run the Pilot state tests from the repository root:

```powershell
node --test pilot-workspace/.agents/skills/start-course-lesson/scripts/course-state.test.mjs
git diff --check origin/main...HEAD
```

Perform real-window acceptance in a disposable learner workspace:

1. Start Module 1 with an intentionally incorrect default configuration.
2. Confirm no Executor turn starts automatically.
3. Correct each setting and confirm direct metadata refreshes.
4. Review, pass, return to `m1-mastery`, and relaunch.
5. Start Module 2 and confirm the task uses the approved model/effort/tier plus
   safe workspace-write permissions.
6. Complete the prompt, interview, PRD approval, plan draft, alignment, plan
   approval, scope explanation, and Teacher review in one task.
7. Modify the PRD and confirm dependent steps regress with explicit guidance.
8. Reconcile and pass, then confirm plan-only change invalidation separately.
9. Return to `m2-mastery` and complete the final assessment.
10. Exercise compact/full Teacher, minimize/resume, disconnect/reconnect,
    relaunch, concurrent review, and duplicate return.
11. Visually inspect every normal, mismatch, stale, invalidated, needs-work,
    passed, and recovery surface.
12. Confirm the canonical learner starter fingerprint is unchanged.

Update PR #4 only after validation:

- revise its summary from the historical CSS Practice to the two real Pilot
  Practices;
- list the merged curriculum reconciliation and direct configuration evidence;
- document the complete validation results and any platform limitation; and
- mark the PR ready only when all completion gates pass.

## Completion gate

Implementation is complete only when:

- merged Pilot 0.2 content remains authoritative;
- no current lifecycle path contains a hardcoded historical Practice default;
- Module 1 reads and reviews effective task settings without screenshots;
- later tasks reuse the approved Module 1 configuration with safe permissions;
- Module 2 is one resumable run producing only the two approved artifacts;
- Triết semantically reviews artifact quality and cross-artifact alignment;
- dependency regressions are persisted and clearly communicated;
- Teacher remains read-only and tool-free;
- completion and return remain idempotent for both modules; and
- all contract, unit, build, Electron, recovery, security, and visual checks
  pass.
