# Portfolio Course Implementation Plan

- **Status:** Foundation, Module 2, and Module 3 are implemented; owner
  acceptance is pending. On the `practice-disabled-content-development` branch,
  Module 4 learner content, five formative checks, and a six-question final
  review are implemented for session-only content review. Temporary review-only
  bypasses are available at every current Practice boundary. Module 4 Practice,
  artifact templates, completion, and graduation wiring remain deferred. The
  M4.0 provider rehearsal is complete, and the Codex-operated CLI flow with a
  neutral public bootstrap was approved on 16 August 2026. F0.2 was removed by
  decision on 14 August 2026.
- **Scope:** Course migration foundation plus Modules 2–4
- **Delivery rule:** Complete, verify, and accept one module before beginning the
  next module. The content-first branch has a temporary authoring-only exception:
  content and review questions may be drafted across Modules 2–4, but official
  Practice integration, completion, acceptance, and release gates remain in order.
- **Pacing rule:** Mastery-based and resumable; no fixed lesson duration or
  completion-time promise
- **Practice project:** One learner-owned portfolio workspace shared by Modules
  2–4

## Progress ledger

Update this ledger from repository evidence as part of each affected
checkpoint's definition of done. Implementation and verification are technical
states. Owner approval and pilot acceptance require their own explicit evidence
and must never be inferred from a passing automated check.

| Phase | Implementation | Verification | Owner approval | Pilot acceptance | Next permitted action |
|---|---|---|---|---|---|
| Foundation | `implemented` | `passed` — current full automated suite, production build, strict-palette and terminology audits, responsive checks, and Electron smoke after the approved Module 1 live-Practice routing fix on 16 August 2026 | `pending` overall; the global Course Companion palette, scoped Harness removal, learner-facing Codex terminology correction, Module 1 portfolio quiz scenario, and live-Practice routing fix were approved on 16 August 2026 | `pending` | Present the Foundation evidence for owner review; do not infer overall approval. |
| Module 2 | `implemented` | `passed` — current full automated suite, production build, strict-palette and terminology audits, responsive checks, and Electron smoke on 16 August 2026 | `pending` overall; the global Course Companion palette and learner-facing Codex terminology correction were approved on 16 August 2026 | `pending` | Review the learner-facing content and complete the required rehearsal before acceptance. |
| Module 3 | `implemented` | `passed` — current full automated suite, production build, strict-palette and terminology audits, responsive checks, and Electron smoke on 16 August 2026 | `pending` overall; the global Course Companion palette and learner-facing Codex terminology correction were approved on 16 August 2026 | `pending` | Present Module 3 evidence for owner review; do not infer overall approval. |
| Module 4 | `M4.0 complete`; M4.1 learner lesson, Teacher script, start prompt, five formative checks, six-question final review, typed scenes, session-only content-review route, and temporary per-Practice review bypasses implemented on `practice-disabled-content-development`; artifact templates, Practice/evidence adapters, official completion, and graduation wiring deferred | `passed` for the content-first scope on 17 August 2026: typecheck, lint, 284 unit tests, nine startup tests, production build, strict-palette/responsive Electron smoke, and byte-for-byte persisted-progress preservation after entering and exiting the Module 1 bypass; macOS provider rehearsal passed on 16 August 2026; Windows provider runtime remains unverified | `pending` overall; the M4.0 provider flow and temporary content-first sequencing were approved, but learner-facing Module 4 content has not yet received owner acceptance | `pending` | Review Modules 2–4 content and questions end to end; revise content without claiming completion, then wire Practice and graduation gates after content approval. |

## Temporary content-first authoring exception

On 17 August 2026, the owner approved branch
`practice-disabled-content-development` to finish and review learner content and
review questions before wiring the remaining Practices.

This exception is intentionally narrow:

1. Home Base exposes a clearly labeled content-review launcher for Modules 2–4.
2. Review navigation, answers, and checkpoint movement exist only in renderer
   memory for that session. Exiting review restores the exact previously loaded
   learner progress.
3. Review mode never calls the progress persistence API, opens Practice, creates
   a Practice or mastery receipt, unlocks a module, or records completion.
4. The atomic Module 2-to-3 and Module 3-to-4 gates remain unchanged in
   `ProgressRepository`; Practice identities and existing Practice services are
   preserved for later wiring.
5. The exception permits Module 4 content authoring before Module 3 pilot
   acceptance only for content review. It does not permit official Module 4
   progression, external deployment, owner acceptance, pilot acceptance, or
   graduation claims.
6. Every current Practice boundary exposes a temporary secondary action for the
   owner to continue reviewing: Module 1 opens Module 2, Module 2 opens Module
   3, Module 3 opens Module 4, and Module 4 opens its final review. Each action
   enters the same session-only review mode and leaves saved progress unchanged.

### Merge boundary — bring back content, not Practice bypasses

When this branch is integrated into the original branch, merge learner content
and approved question revisions only. Do not merge any temporary mechanism that
skips, disables, simulates, or routes around Practice.

The non-mergeable review scaffolding includes:

- the Home Base content-review launcher and `contentReviewMode` session routing;
- `contentReviewStartSceneByModule`, `practiceReviewDestinationByScene`,
  `startContentReviewAtScene`, and the `pixel-practice-bypass` button;
- tests and smoke steps whose sole purpose is to prove Practice bypass or
  persisted-progress preservation while review mode is active;
- learner-facing notices that say Practice is disabled on the content branch.

The mergeable scope includes approved lesson, Teacher-script, prompt, quiz,
source, and typed scene-content changes. Do not cherry-pick a whole mixed commit
or merge a whole mixed file merely because it contains approved content. Inspect
the diff by responsibility, retain the real Practice coordinators and completion
gates, and exclude the review-only identifiers above. Before completing the
merge, verify that no `pixel-practice-bypass` control remains and that every
module still requires authoritative Practice evidence for official progression.

Electron smoke verifies the content-review path at desktop and `390 × 844`,
answers a Module 4 formative question, exits to Home Base, and confirms that
`learner-state.json` is byte-for-byte unchanged. On 17 August 2026, the same
smoke journey also exercised the Module 1 bypass, opened Module 2 review, exited,
restored the exact Practice checkpoint, and then completed the real Practice
path. Typecheck, lint, 284 unit tests, nine startup tests, production build, and
Electron smoke passed. This verification does not mark Foundation or any module
as owner-approved or pilot-accepted.

## Purpose

This document translates the approved Beginner Agentic Portfolio Course plan
into a repository-specific implementation sequence. It does not redesign the
curriculum. It identifies the files, runtime contracts, learner artifacts,
progress reset behavior, Course Companion changes, tests, acceptance gates, and
local Git checkpoints needed to replace the ContentPilot path safely.

The implementation must remain beginner-first. The learner directs product
decisions, approvals, acceptance, and publication. Codex performs technical
inspection and implementation, then returns plain-language evidence the learner
can verify without reading source code.

## Source authority and boundaries

### Curriculum authority

The approved portable source plan currently lives at
`/Users/nguyenminhtriet/Portfolio-SMU/portfolio-course-planning/`:

- `FINAL_CURRICULUM_PLAN.md` — approved curriculum for Modules 2–4;
- `DECISION_LOG.md` — approved decisions D-001 through D-013;
- `RESEARCH_SOURCES.md` — source audit and evidence;
- `COURSE_PLAN.md` — portable planning summary.

The first implementation checkpoint copies a versioned snapshot of those files
into this repository under `docs/planning/portfolio-course-v1/`. The copy is a
provenance record for repository clones, not a second place for independent
curriculum editing. Future curriculum changes must be reconciled deliberately
between the portable plan and the implementation repository.

### Runnable authority

`pilot-workspace/` remains the only runnable course authority. Learner-facing
lesson, script, quiz, prompt, artifact-template, and Practice changes must land
there first and remain synchronized with Course Companion.

### Frozen and permitted surfaces

- The introduction before Module 1 is frozen. Do not change its content, UI,
  images, navigation, behavior, or tests, except for the explicitly approved
  `intro-learning-method` positioning update and removal of the obsolete
  Harness reference recorded below.
- On 16 August 2026, the owner explicitly reopened only
  `intro-learning-method`. The approved copy now introduces the course for
  beginners, names the personal portfolio as the practice project, and states
  the intended transfer to other coding agents and applications. The final
  action keeps its existing destination but displays `Bắt đầu Module 1`
  instead of the generic `Tiếp tục`. The renderer contract, frozen-journey
  assertion, exact-copy Electron assertion, restart path, and desktop/mobile
  overflow checks were updated and passed. This scoped approval does not mark
  overall Foundation owner approval or pilot acceptance as complete.
- On 16 August 2026, the owner approved removing the complete Harness
  Engineering lesson from Module 1. The runnable course now has three Module 1
  lessons and an estimated 38 minutes; `/` and `@` route directly to the Codex
  configuration lesson. The retired lesson, visual, two checkpoints and
  Harness assessment topic were removed. Existing progress at those retired
  IDs migrates to `m1-model-choice`, and the five-question gate remains intact
  with a source-backed `/status` and `/goal` question. The related introduction
  script reference, Course Companion renderer, static guide, contracts and
  regression expectations were synchronized. Typecheck, lint, 274 unit tests,
  nine startup tests, production build and full Electron smoke passed. This
  scoped approval does not mark overall Foundation owner approval or pilot
  acceptance complete; every other introduction and Module 1 surface remains
  frozen.
- A separate narrow Module 1 exception is approved: forward-looking transition
  copy may stop saying that Module 2 plans ContentPilot and may point to the new
  portfolio Module 2. No other Module 1 wording may change beyond the recorded
  exceptions under this plan.
- On 16 August 2026, the owner confirmed that `Executor` is an internal
  architecture term and must not be introduced to learners. Learner-facing
  lessons, scripts, quiz copy, Practice labels, artifact templates, Teacher
  responses, status messages, and recovery copy now use `Codex` or `task Codex`.
  Internal class names, IDs, evidence kinds, agent configuration, and
  architecture documentation retain `Executor`. The frozen Intro and Module 1
  digests, Course Companion assertions, and Electron smoke journey were
  synchronized. The terminology audit found no remaining `Executor` references
  in renderer copy, learner lessons, quizzes, the Codex setup page, artifacts,
  or Teacher-spoken script lines. Typecheck, lint, 274 unit tests, nine startup
  tests, production build, and Electron smoke passed. This scoped approval does
  not mark overall owner approval or pilot acceptance complete.
- On 16 August 2026, the owner approved replacing Module 1 question `m1-q4`
  with a direct comparison between 5.6 Sol and 5.6 Luna. The revised scenario
  distinguishes an ambiguous portfolio-structure task that needs analysis and
  judgment from a clear, repeatable, high-volume transformation task with a
  fixed output. It no longer mixes model selection with an Effort decision.
  The Bloom level, five-question structure, and 4/5 mastery gate are unchanged.
  Frozen-source regression, 274 unit tests, nine startup tests, production
  build, and Electron smoke passed. This scoped approval does not mark overall
  Foundation owner approval or pilot acceptance complete.
- On 16 August 2026, the owner approved removing question `m1-q5` and reducing
  the Module 1 review to four questions. The mastery gate is now 3/4, so a
  learner may still miss one question rather than being required to earn a
  perfect score. The runnable quiz, lesson, script, Teacher contract, mastery
  rubric, renderer scenes, saved decision label, and frozen-source regression
  are synchronized. Progress paused on the retired fifth-question scene moves
  safely to the four-question summary. Frozen-source regression, lint, 275
  unit tests, nine startup tests, production build, and Electron smoke passed.
  This scoped approval does not mark overall Foundation owner approval or
  pilot acceptance complete.
- On 16 August 2026, the owner approved replacing the Module 1
  `mock-completed` shortcut with Duy's existing live Practice coordinator.
  The unchanged learner action now opens the existing Practice brief, creates
  and opens a bound Codex task, moves the lesson window to the companion while
  work is active, and returns to the four-question review only after Triết has
  approved current task metadata. No Duy-authored lesson content or UI was
  imported. The full suite passed with 276 unit tests, nine startup tests,
  lint, production build, and Electron smoke covering the live-Practice
  transition and return path. This scoped approval does not mark overall
  Foundation owner approval or pilot acceptance complete.
- On 16 August 2026, the owner approved one cross-cutting visual exception for
  Course Companion: UI chrome uses only yellow, white, and black, with neutral
  gray hierarchy produced from white/black opacity. Raster artwork and
  instructional screenshots retain their source colors. This exception changes
  no lesson copy, images, navigation, checkpoints, or course behavior. Statuses
  remain understandable through labels and border styles instead of relying on
  additional semantic colors.
- Modules 2–4 may be replaced or created according to the approved curriculum.
- Existing ContentPilot code and historical planning contracts must not be
  deleted as incidental cleanup. They are retired from the runnable path first;
  archival or deletion is a separate later decision.

## Approved implementation decisions

The following decisions are settled for this implementation:

1. The primary learner is occupation-neutral: a non-technical beginner with
   real experience, projects, or honest documented concept work to present to
   one chosen audience. Marketers and content creators remain supported but no
   longer determine the project or examples.
2. The `0.3.0` course starts a fresh run from the introduction. State from the
   `0.2.0` test course is not migrated or archived and does not produce a
   migration notice. New `0.3.0` progress remains resumable normally.
3. Course Companion uses one persistent Executor Practice per module: one for
   Module 2, one for Module 3, and one for Module 4. Each Practice contains five
   resumable milestone checkpoints. Module 3 Milestone 2 also contains small
   implementation-slice checkpoints.
4. The introduction and Module 1 continue through their existing rendering
   path. The rewritten Module 2 and new Modules 3–4 use a modular course
   registry instead of extending the current monolithic scene map.
5. The learner selects one dedicated portfolio folder. The same folder is used
   throughout Modules 2–4. It must be outside the course repository.
6. Vercel is the supported default host for Module 4. Preview and production
   actions require an explicit security, privacy, approval, live-verification,
   and recovery gate.
7. Backend contact forms, authentication, analytics, payments, databases, and
   other data-processing services are outside the required beginner course.
   Adding one requires a separate scope and security review.
8. Learners advance through evidence gates, not elapsed time. Course UI and
   content must not promise fixed-duration lessons.
9. Course Companion uses one strict UI palette: yellow, white, and black only.
   Neutral grays come from white/black opacity; raster artwork and instructional
   screenshots are exempt. Automated source and rendered-surface checks prevent
   other UI color families from returning.
10. Content development may temporarily proceed without Practice on branch
    `practice-disabled-content-development`. The review surface is session-only,
    restores saved progress on exit, and cannot satisfy any evidence or
    completion gate. Practice is deferred, not deleted or simulated.

## Current-to-target impact map

| Current repository surface | Current state | Required target state |
|---|---|---|
| `docs/internal/target-learner-definition.md` | Optimized for marketers/content creators building ContentPilot | Occupation-neutral portfolio learner definition with marketers/content creators as supported examples |
| `docs/planning/version-a-curriculum-blueprint.md` | Six-module ContentPilot curriculum | Marked superseded for the runnable course and linked to the imported portfolio curriculum |
| `docs/planning/graduation-assessment-v1.md` | ContentPilot artifact and real-API graduation gates | Replaced by portfolio planning, build, debugging, release, deployment, ownership, and transfer evidence |
| `docs/planning/starter-repository-progression-v1.md` | Preconfigured Next.js ContentPilot starter | Retired from the runnable course; portfolio app is created from scratch in Module 3 |
| `pilot-workspace/course/course-structure.json` | Introduction, Module 1, and ContentPilot Module 2 only | Same introduction and Module 1 plus new portfolio Modules 2–4 |
| Module 2 lesson/script/quiz/prompt | Plans ContentPilot and produces two artifacts | Plans the learner portfolio and produces the full seven-artifact build contract |
| `pilot-workspace/contentpilot/` | Current Practice workspace | Not used by the new Modules 2–4; retained until archival is decided |
| `course-companion/shared/contracts.ts` | Course `0.2.0`, state schema 5, lesson IDs through Module 2 | Course `0.3.0`, state schema 6, semantic IDs through Module 4, silent clean restart for incompatible old state |
| `LearningWindow.tsx` | Roughly 3,000 lines with hardcoded Module 2 scenes | Frozen legacy path for introduction/Module 1 plus modular registry-driven Modules 2–4 |
| Practice definitions and adapters | Two evidence profiles with planning-package behavior hardcoded in several services | Generic module Practice lifecycle plus portfolio-planning, portfolio-build, and portfolio-release evidence profiles |
| Practice workspace resolver | Resolves only `pilot-workspace/` | Resolves and validates one learner-selected portfolio path |
| Progress completion gates | Hardcoded ContentPilot Module 2 Practice and 12/15 score | Module-specific evidence receipts and pilot-calibrated assessment gates through graduation |
| Electron smoke journey | Ends after Module 2 | Can verify each module independently and the complete Module 1-to-graduation path |

## Target implementation shape

### Modular course registry

The registry is a local TypeScript index, not a database or external service.
For each new module it connects:

- module identity and display metadata;
- lesson and scene definitions;
- semantic checkpoint IDs;
- quiz groups and mastery gate;
- Practice identity and version;
- artifact expectations;
- completion destination.

Recommended implementation paths:

```text
course-companion/src/renderer/src/course/
  registry.ts
  module-contracts.ts
  modules/
    module-2/
      definition.ts
      scenes.tsx
    module-3/
      definition.ts
      scenes.tsx
    module-4/
      definition.ts
      scenes.tsx
```

`LearningWindow.tsx` may delegate Modules 2–4 to this registry while retaining
the existing introduction and Module 1 scene implementation. A full rewrite of
the frozen path is out of scope.

### Stable IDs

Do not reuse an old ContentPilot checkpoint ID for a different portfolio
meaning. Use semantic IDs that survive scene-copy changes.

Recommended module-level checkpoints:

```text
Module 2
  m2-portfolio-brief
  m2-content-evidence
  m2-visual-reference
  m2-portfolio-prd
  m2-implementation-plan
  m2-complete

Module 3
  m3-scaffold-baseline
  m3-complete-first-version
  m3-whole-page-revision
  m3-evidence-debugging
  m3-independent-enhancement
  m3-complete

Module 4
  m4-release-validation
  m4-release-candidate
  m4-preview-deployment
  m4-production-decision
  m4-ownership-transfer
  m4-complete
```

Recommended Practice identities:

```text
m2-portfolio-planning
m3-portfolio-build
m4-portfolio-release
```

### Learner workspace

One learner-selected folder carries the project through the three modules:

```text
my-portfolio/
  planning/
  evidence/
    module-3/
    module-4/
  deployment/
  src/                  # created in Module 3
  public/               # created in Module 3
  AGENTS.md              # created in Module 3
  README.md              # created in Module 3
  package.json           # created in Module 3
```

Module 2 creates only `planning/` content. “Create from scratch” in Module 3
means that no application source, dependency manifest, design system, portfolio
component, or deployment configuration exists before the learner approves the
scaffold. The presence of approved planning artifacts does not make the app a
prepared starter.

Course Companion stores the canonical workspace path and evidence metadata in
its application-data directory. Learner artifacts stay in the selected folder.
The app must not copy the learner portfolio into the course installation.

### Learner artifact spine

The default artifact names are implementation contracts. Learner-facing copy
may describe them naturally, but the paths remain stable for evidence adapters.

```text
planning/
  portfolio-brief.md
  content-evidence-inventory.md
  reference/
    reference.md
    screenshots/
  PRD.md
  requirement-validation-map.md
  implementation-plan.md
  first-bounded-task.md

evidence/module-3/
  scaffold-report.md
  design-direction.md
  build-log.md
  browser-validation.md
  revision-record.md
  debugging-report.md
  enhancement-plan.md
  final-change-summary.md

evidence/module-4/
  release-validation-report.md
  release-summary.md
  security-publication-checklist.md
  preview-deployment-report.md
  production-decision.md
  ownership-walkthrough.md
  known-limitations.md
  transfer-project/
    brief.md
    requirements.md
    validation-approach.md
    first-bounded-plan.md
```

Evidence receipts record the Practice version, current artifact digest,
learner approval, observation time, source, and freshness. A chat statement
without the matching current artifact digest cannot complete a gate.

## Checkpoint contract for implementation work

Every numbered implementation checkpoint below must satisfy all five rules:

1. **Bounded change:** the checkpoint changes one coherent behavior or content
   contract and names its non-goals.
2. **Runnable state:** Course Companion and the runnable Pilot remain usable at
   the end of the checkpoint.
3. **Focused verification:** relevant unit/content tests and `git diff --check`
   pass before acceptance.
4. **Evidence review:** inspect the complete changed-file list and confirm that
   the introduction, unrelated Module 1 content, and unrelated user work are
   untouched.
5. **Local Git checkpoint:** after the approved work is coherent and verified,
   stage only exact relevant files and create the repository-required local
   major-decision commit. Never push automatically.

The full Course Companion verification suite runs at each module acceptance
gate:

```text
npm test
npm run typecheck
npm run lint
npm run build
npm run test:electron
```

Run these commands from `course-companion/`. If Electron cannot launch because
of a sandbox boundary, report the blocked live check and rerun only with the
required approval. Static or unit evidence must never be presented as a passed
Electron journey.

---

## Foundation — Migrate the course safely

The foundation is not a learner module. It is the minimum cross-cutting work
needed to implement Module 2 without hardcoding another obsolete path. Complete
all foundation checkpoints before authoring the new Module 2 journey.

### F0.1 — Import authority and mark superseded contracts

**Change**

1. Copy the four approved portable planning files into
   `docs/planning/portfolio-course-v1/` with a short provenance README containing
   source path, import date, and source file digests.
2. Revise `docs/internal/target-learner-definition.md` for the approved
   occupation-neutral portfolio learner. Keep its internal-only boundary.
3. Add clear supersession notices to the old Version A blueprint, ContentPilot
   graduation assessment, starter progression, and artifact/run-state contract.
4. Update planning indexes so a future implementer cannot mistake ContentPilot
   plans for the new runnable direction.
5. Do not delete `starters/contentpilot/`, `pilot-workspace/contentpilot/`, or
   historical plans.

**Verify**

- Imported file digests match the portable originals.
- Planning links resolve.
- The internal target learner is not copied into learner-facing content.
- `rg` finds one clearly named current curriculum authority.

**Checkpoint output:** Authoritative portfolio curriculum snapshot and an
unambiguous supersession map.

### F0.3 — Add the modular Module 2–4 registry

**Change**

1. Bump the course to `0.3.0` and learner-state schema 6. Treat incompatible
   state from the `0.2.0` test course as a new run without migration, archive,
   or learner-facing notice.
2. Define a typed module contract for metadata, scenes, checkpoints, quizzes,
   Practice identity, and completion destinations.
3. Add the registry and route only Modules 2–4 through it.
4. Keep introduction and Module 1 on the current renderer path.
5. Add validation for duplicate IDs, unknown checkpoint references, broken
   scene destinations, and module-order errors.
6. Add a frozen-journey regression test for introduction and Module 1.

**Verify**

- Existing introduction and Module 1 unit tests pass unchanged.
- A valid `0.2.0` state loads as a new course run and no migration message or
  legacy archive is created.
- Snapshot or semantic assertions prove the frozen introduction has no content,
  asset, navigation, or behavior change.
- Module registry rejects deliberately malformed fixture definitions.
- The app can render a minimal placeholder Module 2 definition without
  extending the legacy scene map.

**Checkpoint output:** A safe extension point for the rewritten and new modules.

### F0.4 — Resolve one learner-selected portfolio workspace

**Change**

1. Add a folder-selection flow before the first Module 2 Practice.
2. Canonicalize the selected path and reject:
   - the course repository or any folder inside it;
   - the Course Companion application-data directory;
   - a file path instead of a directory;
   - an unreadable or unwritable directory;
   - a non-empty unrelated project unless the learner deliberately chooses a
     separately supported import path in a future release.
3. Persist one approved path per course run and reuse it across Modules 2–4.
4. Require confirmation before creating `planning/` or any later app files.
5. Provide recoverable states for moved, renamed, missing, or permission-denied
   folders. Never fall back silently to `pilot-workspace/`.
6. Record only the path and bounded metadata; do not index unrelated files.

**Verify**

- macOS and Windows path fixtures, including spaces and non-ASCII characters.
- Symlink/canonical-path escape attempts.
- Course-repository rejection.
- Missing-folder recovery.
- Relaunch and exact-path resume.
- The old `pilot-workspace` resolver remains available only to the unchanged
  Module 1 Practice.

**Checkpoint output:** One safe, persistent learner-owned portfolio workspace.

### F0.5 — Generalize Practice stages and evidence profiles

**Change**

1. Preserve the one-active-Practice rule.
2. Replace assumptions that every writable Practice is
   `m2-planning-package` with definition-driven Practice identities.
3. Add three evidence profiles:
   - `portfolio-planning`;
   - `portfolio-build`;
   - `portfolio-release`.
4. Add stage receipts so one Practice can save five milestone checkpoints
   without spawning five Executor tasks.
5. Bind every receipt to course run, Practice run, Practice version, workspace,
   artifact digests, and freshness.
6. Retain live/stale/offline/error honesty and the distinction between
   Executor-reported checks and independently corroborated file evidence.
7. Do not append new instructions to an old Module 2 active task. The clean
   restart makes old task state ineligible for the portfolio course.

**Verify**

- Parser rejects unsupported profile/policy combinations.
- Stage order and dependency tests.
- Resume after app quit at every stage.
- Stale artifact invalidates only dependent stage receipts.
- A newer artifact digest cannot inherit an older approval.
- Module 1 configuration Practice still passes its existing tests.

**Checkpoint output:** Reusable module Practice infrastructure without a
course-long or milestone-per-task chat explosion.

### Foundation acceptance gate

Do not begin Module 2 content implementation until:

- all four retained foundation checkpoint outputs exist;
- the introduction and Module 1 frozen regression passes;
- the silent clean-restart fixture passes;
- the learner workspace is never resolved inside the course repository;
- Course Companion passes unit, type, lint, build, and Electron smoke checks;
- the scoped foundation commits contain no Module 2 learner-facing curriculum.

---

## Module 2 — Define, scope, and plan the portfolio

### Module outcome

The learner turns a vague portfolio idea into an honest, evidence-backed build
contract that Codex can implement without inventing important requirements.

### M2.1 — Lock the module manifest and artifact contracts

**Change**

1. Replace the Module 2 entry in `course-structure.json` with the five approved
   milestones and new semantic checkpoints.
2. Set `nextLessonId` to Module 3, but keep Module 3 locked until the Module 2
   evidence and mastery gates pass.
3. Add templates for the seven Module 2 artifacts under
   `pilot-workspace/artifacts/`.
4. Define required headings, learner-owned decisions, approval fields,
   permissible reference screenshots, and privacy/ownership checks.
5. Keep technology selection and application code out of Module 2.

**Verify**

- Course-structure parser accepts the manifest.
- Every artifact path is unique and under `planning/`.
- Templates contain no completed learner answer or hidden portfolio solution.
- Module 2 cannot open Module 3 without the gate receipt.

**Checkpoint output:** A machine-readable Module 2 contract and solution-free
artifact templates.

### M2.2 — Author the five milestone lessons and Teacher script

**Change**

Create or replace the Module 2 lesson, Teacher script, and start prompt in
natural Vietnamese:

1. Create the portfolio brief.
2. Build the content and evidence inventory.
3. Choose and save one visual reference.
4. Create and review the portfolio PRD.
5. Create the requirement-validation map, phased implementation plan, and first
   bounded task.

Each milestone follows:

```text
Explain
-> show one complete but non-copyable example
-> guide one application
-> learner creates or revises their artifact
-> inspect fresh evidence
-> learner accepts or revises
```

Teacher questions are asked one at a time with a recommended answer when the
choice is consequential. The learner may describe preferences in ordinary
language. The script must distinguish verified facts, learner claims,
assumptions, missing evidence, private material, and publication permission.

**Verify**

- Every curriculum milestone appears once and in approved order.
- No fixed duration or speed promise appears.
- No learner is required to read code, choose dependencies, or create the app.
- Reference guidance prohibits copying content, branding, images, and source
  code.
- Vietnamese content passes diacritic and terminology review.

**Checkpoint output:** Complete source-first Module 2 instruction aligned with
the seven artifact contracts.

### M2.3 — Build formative checks and the mastery assessment

**Change**

1. Replace ContentPilot-specific quiz scenarios with portfolio scenarios.
2. Add retrieval checks after the relevant concepts and delayed checks near the
   module gate.
3. Require learner-owned short answers for audience choice, one scope boundary,
   one evidence gap, and one requirement-to-validation mapping.
4. Keep exact numeric passing thresholds configurable. Do not publish a final
   threshold until representative beginner pilots support it.
5. Ensure quiz feedback appears only after the learner answers.

**Verify**

- One-question-at-a-time delivery.
- Every answer traces to the imported source audit or an explicitly labeled
  curriculum judgment.
- No answer can pass merely by repeating the example portfolio.
- Practice completion cannot substitute for mastery, and mastery cannot
  substitute for current artifacts.

**Checkpoint output:** Portfolio-specific formative and mastery assessment.

### M2.4 — Implement the `m2-portfolio-planning` Practice

**Change**

1. Add the Practice definition with five ordered stage checkpoints.
2. Open the learner-selected portfolio folder in one persistent Executor task.
3. Limit write scope to the seven approved planning artifacts and reference
   screenshots.
4. Extend planning evidence collection to validate:
   - required sections and artifact digests;
   - honest evidence labels and privacy/permission review;
   - PRD scope and acceptance criteria;
   - one-to-one requirement-validation coverage;
   - phased plan dependencies and non-goals;
   - first-task boundaries;
   - learner approval of the current versions.
5. Prevent implementation source, dependency installation, or deployment work.

**Verify**

- Missing, stale, malformed, or unapproved artifacts fail the matching stage.
- Unexpected application files fail scope control.
- Reference screenshots do not count without source/permission metadata.
- Each stage can resume after relaunch without starting a new task.
- Completing Stage 5 returns to the Module 2 mastery scene, not Module 3.

**Checkpoint output:** A live, resumable portfolio-planning Practice with fresh
artifact evidence.

### M2.5 — Render Module 2 through the registry

**Change**

1. Build the Module 2 definition and scenes in its module package.
2. Add lesson navigation, progress display, Practice launch/resume, recovery,
   quiz, and mastery surfaces through the shared registry contract.
3. Create only the new Module 2 visual assets needed for comprehension and
   record their sources.
4. Update the single approved Module 1 transition sentence/button so it points
   to portfolio planning.
5. Add an assertion that no other Module 1 copy changed.

**Verify**

- Desktop and narrow Course Companion layouts.
- Keyboard and focus behavior.
- Correct return destination after every Practice stage and quiz group.
- Exact resume from each milestone.
- Module 1 frozen-content diff/snapshot check.

**Checkpoint output:** Complete learner-facing Module 2 in Course Companion.

### M2.6 — Complete the Module 2 gate and handoff

**Change**

1. Require all seven current artifacts, five stage receipts, learner approval,
   and mastery evidence.
2. Generate a plain-language completion summary: what the learner decided,
   which evidence is missing or bounded, what will be built first, and what is
   deliberately out of scope.
3. Unlock Module 3 only after the completion receipt is saved atomically.
4. Pass Module 3 the workspace path and artifact references, not the old chat
   transcript as hidden context.

**Verify**

- Gate rejects stale artifact digests, incomplete validation mappings, hidden
  implementation, or missing learner approval.
- Relaunch after completion opens Module 3 readiness without losing Module 2
  evidence.
- Reset and targeted Module 2 recovery remain functional.

**Checkpoint output:** Verified Module 2 completion and explicit Module 3 input
contract.

### Module 2 acceptance gate

Module 2 is accepted only when:

- its Pilot lesson, script, prompt, quiz, templates, and Practice definition are
  synchronized;
- Course Companion completes the full new Module 2 journey using a disposable
  learner portfolio folder;
- all seven artifacts are reviewed semantically on their current digests;
- Module 3 stays locked before the combined evidence/mastery gate;
- the full Course Companion verification suite passes;
- a manual beginner-language review finds no hidden coding prerequisite;
- the Module 2 implementation is committed locally in scoped checkpoints.

Do not author or implement Module 3 course content before this gate is accepted.

---

## Module 3 — Implement and debug in verified slices

### Module outcome

The learner creates the application from scratch, builds a coherent first
version from real content and an approved reference, improves it from visible
evidence, debugs one failure, and directs one independent enhancement.

### Decision gate before Module 3 authoring

The approved curriculum defers exact desktop and mobile viewport values. Before
writing visual assertions, present one small decision packet. Recommended pilot
default: one common desktop viewport and one narrow mobile viewport, used
consistently in instruction, screenshots, and smoke tests. The values may be
recalibrated after pilot evidence, but the same release must not use conflicting
values.

### M3.1 — Lock the module manifest, lessons, and artifacts

**Change**

1. Add Module 3 and its five milestones to `course-structure.json`.
2. Add the lesson, Teacher script, start prompt, quiz, and solution-free
   templates for the eight Module 3 evidence artifacts.
3. Teach the standard implementation loop and debugging loop in plain language.
4. Teach the five-part change summary:
   - what changed;
   - what the learner should notice;
   - what intentionally did not change;
   - checks and results;
   - risks, limitations, or remaining decisions.
5. Keep code reading, diff reading, staging, and pull-request review optional.

**Verify**

- Every milestone has an observable action, artifact, gate, and recovery path.
- No content assumes the app already exists.
- No fixed duration appears.
- Required core and optional enhancement remain visibly separate.

**Checkpoint output:** Complete Module 3 content and evidence contract.

### M3.2 — Implement constrained from-scratch scaffolding

**Change**

1. In the existing learner portfolio folder, ask Codex to inspect the approved
   planning package and propose the scaffold before writing.
2. The proposal must name commands, dependency versions, files, observable
   result, verification, network access, and approval needs.
3. After approval, create only React, TypeScript, Vite, a dependency lockfile,
   development/typecheck/lint/build/preview commands, ordinary entry files, a
   neutral page, minimal readable styles, `.gitignore`, `README.md`, and scoped
   `AGENTS.md`.
4. Define `npm run check` as typecheck, lint, and production build in a clear
   order. Preserve individual commands for diagnosis.
5. Do not create portfolio sections, final design tokens, optional libraries,
   deployment configuration, or personal content during scaffolding.
6. Create a recoverable local project checkpoint after learner acceptance.

**Verify**

- `npm run dev` shows the neutral page.
- `npm run check` passes.
- `npm run preview` serves the production build.
- Created dependencies and files match the approved proposal.
- No portfolio feature was implemented early.
- Recovery snapshot use, if unavoidable, is recorded as fallback evidence.

**Checkpoint output:** Known-good, learner-approved application baseline.

### M3.3 — Clarify and approve the design direction

**Change**

1. Give the same Executor task the approved PRD, real content inventory, and
   saved reference.
2. Have Codex explain the reference’s apparent hierarchy and visual character
   in ordinary language.
3. Recommend what to retain, adapt, simplify, or exclude.
4. Ask only high-impact questions, one at a time, with a recommendation.
5. Save and approve `evidence/module-3/design-direction.md` before app edits.

**Verify**

- Direction traces to the reference and PRD.
- It does not copy another person’s content, branding, images, or code.
- It defines a simple mobile adaptation rather than inventing it from a desktop
  screenshot.
- Optional motion or complexity is excluded unless explicitly justified.

**Checkpoint output:** Learner-approved design direction and build-slice plan.

### M3.4 — Build the complete first version in four accepted slices

Implement these slices sequentially inside the same Practice and Executor task:

1. **Foundation and Hero:** semantic page foundation, navigation, Hero, initial
   typography/color/spacing, mobile baseline, visible focus.
2. **Selected Work:** at least two evidence-rich project cases using real or
   honestly labeled concept evidence.
3. **About, Contact, and footer:** relevant story, capabilities, verified
   contact method, professional links, and focused footer.
4. **Responsive-accessibility integration:** required desktop/mobile behavior,
   heading/landmark review, keyboard operation, focus, image alternatives,
   primary links, and console review.

For every slice:

1. Codex proposes scope, files, non-goals, and checks.
2. Learner approves.
3. Codex implements only that slice.
4. Automated checks run.
5. Learner reviews the browser at the approved viewports.
6. Codex gives the five-part plain-language change summary.
7. Learner accepts or requests a bounded revision.
8. After acceptance, create a recoverable local project checkpoint and stage
   receipt before the next slice.

**Verify**

- A failed slice blocks the next slice.
- Later slices do not silently rewrite accepted content or design decisions.
- Build log records scope, evidence, learner decision, and checkpoint identity.
- The completed first version contains every required portfolio-core item.

**Checkpoint output:** Coherent first portfolio version built through four
recoverable evidence gates.

### M3.5 — Complete one whole-page revision cycle

**Change**

1. Compare the complete page with the PRD, design direction, primary-viewer
   goal, real content, and required viewports.
2. Let the learner give feedback in ordinary language.
3. Translate it into one bounded revision proposal and wait for approval.
4. Implement, verify, summarize, and record the accepted revision.

**Verify**

- The revision is prompted by observable evidence, not polish for its own sake.
- The record captures before, expected change, after, checks, and learner
  acceptance.
- Core behavior and previous accepted evidence receive regression checks.

**Checkpoint output:** One evidence-backed whole-page improvement.

### M3.6 — Complete one evidence-first debugging investigation

**Change**

1. Use an actual failure when one occurs; otherwise introduce one bounded,
   reversible course-controlled failure.
2. Follow: reproduce, expected/actual, collect evidence, one hypothesis,
   smallest justified fix, original check, regression checks.
3. Save `debugging-report.md` and require the learner to explain the visible
   failure, evidence used, and whether the accepted fix solved it.
4. Remove or reverse any course-controlled fault before completion.

**Verify**

- The report contains real commands/observations rather than invented evidence.
- The fix is causally connected to the reproduced failure.
- The original check passes and relevant regression checks pass.
- Unrelated accepted work remains intact.

**Checkpoint output:** Fresh debugging and recovery evidence.

### M3.7 — Plan and implement one independent enhancement

**Change**

1. Learner selects one bounded enhancement.
2. Learner states the goal and acceptance criteria with reduced guidance.
3. Codex proposes a small plan and waits for approval.
4. Implement through the standard loop and record acceptance evidence.
5. Do not admit backend/data-processing enhancements without a separately
   approved security scope.

**Verify**

- Enhancement is independent and bounded.
- It does not break the portfolio core.
- Learner can explain why it was selected and how success was checked.

**Checkpoint output:** Independent planning and implementation evidence.

### M3.8 — Implement the Practice, evidence adapter, and completion gate

**Change**

1. Add `m3-portfolio-build` with five milestone stages and four nested build
   slice receipts inside Stage 2.
2. Collect file, command, browser, learner-approval, plain-language-summary,
   and Git-checkpoint evidence without claiming to rerun checks that were only
   Executor-reported.
3. Invalidate dependent evidence when accepted source artifacts change.
4. Require all Module 3 evidence artifacts, current `npm run check`, browser
   verification, debugging, enhancement, and mastery evidence.
5. Unlock Module 4 only after atomic completion.

**Verify**

- Relaunch/resume at every milestone and internal slice.
- Stale PRD or design direction produces an explicit reconciliation path.
- No one-shot “complete first version” task can bypass slice receipts.
- Module 4 remains locked until both product and learner-ownership gates pass.

**Checkpoint output:** Complete live Module 3 journey and reliable gate.

### Module 3 acceptance gate

Module 3 is accepted only when:

- a disposable learner workspace starts with planning artifacts but no app;
- the approved scaffold creates a neutral app and passes all three learner
  commands;
- four build slices, one revision, one debugging investigation, and one
  enhancement produce current evidence;
- desktop/mobile, keyboard, focus, image, navigation, and console checks are
  represented honestly;
- Course Companion resumes at every Module 3 milestone;
- the full Course Companion verification suite passes;
- the module is committed locally in scoped checkpoints.

Do not implement Module 4 Practice, external deployment, official progression,
or graduation integration before this gate is accepted. The owner-approved
`practice-disabled-content-development` branch may author and review Module 4
lesson content and questions through the session-only review surface, without
claiming gate completion or acceptance.

---

## Module 4 — Validate, publish, and prove ownership

### Module outcome

The learner validates a release candidate, passes the security/publication
gate, verifies a deployed preview, makes an explicit production decision, and
proves ownership and transfer.

### M4.0 — Rehearse and lock one supported Vercel path

This is an implementation spike, not learner content.

**Rehearsal evidence:**
[Portfolio Course Vercel Rehearsal — 16 August 2026](portfolio-course-vercel-rehearsal-2026-08-16.md)
records the completed dashboard, linked-project CLI, CLI-only, protection,
responsive, log, and cleanup checks. On 16 August 2026, the owner approved the
recommended Codex-operated CLI flow with a neutral public bootstrap deployment,
Vercel Authentication verification before the real portfolio Preview, dashboard
inspection and recovery, and a separate optional Production decision.

**Provider constraint found:** Vercel assigned the first deployment of each new
project to Production in both tested creation flows. Subsequent CLI deployments
without `--prod` were Preview deployments. The approved flow therefore uses a
learner-approved neutral bootstrap page so that the learner's real portfolio is
not the unavoidable first public Production deployment.

**Change**

1. Test the current Git-connected Vercel dashboard flow and the smallest safe
   CLI-based alternative against a disposable Vite portfolio.
2. Compare account prerequisites, repository visibility, preview visibility,
   approval points, logs, production promotion, rollback/removal, macOS, and
   Windows behavior.
3. Select one primary beginner flow and one recovery route.
4. Record any network, package installation, login, or external-state approval.
5. Present the resulting provider-flow decision packet for approval before
   writing the learner lesson.

**Verify**

- A clean preview deploys and is opened directly.
- Public/protected status is observable rather than assumed.
- Build logs can be found and explained.
- Production is not changed during a preview-only rehearsal.
- A preview can be removed or access-restricted through the documented recovery
  path.

**Checkpoint output:** One currently verified, beginner-supportable Vercel
deployment path.

### M4.1 — Lock the manifest, lesson, assessment, and artifact contracts

**Content-first implementation note — 17 August 2026:** The manifest, five
learner content milestones, Teacher script, start prompt, five formative checks,
six-question final review, typed renderer scenes, session-only review route, and
temporary per-Practice review bypasses are implemented on
`practice-disabled-content-development`. Artifact templates, the
`m4-portfolio-release` Practice definition file, evidence adapters, official
completion service, and graduation receipt remain deferred. Therefore M4.1 is
`in-progress`, not complete. Focused verification passed with typecheck, lint,
284 unit tests, nine startup tests, production build, and Electron smoke. The
content itself still requires owner review.

**Change**

1. Add Module 4 and its five milestones to `course-structure.json`.
2. Add lesson, Teacher script, start prompt, quiz, and artifact templates.
3. Replace the old ContentPilot graduation assessment with a portfolio
   assessment covering planning, scoped implementation, evidence review,
   debugging, security/publication judgment, deployment, ownership, and
   transfer.
4. Keep numeric passing thresholds configurable until beginner pilots support
   them. Required evidence gates remain non-negotiable.

**Verify**

- Graduation cannot be earned by visual polish alone.
- Production publication is optional; a verified preview is required.
- A protected preview counts only when protection is actually verified.
- A deliberately public preview counts only after the publication checklist
  and learner approval.

**Checkpoint output:** Complete Module 4 and graduation contract.

### M4.2 — Implement the release validation report

**Change**

1. Trace every PRD acceptance criterion to current evidence.
2. Run `npm run check` and `npm run preview`.
3. Repeat critical browser checks at approved desktop/mobile viewports.
4. Check content, navigation, links, keyboard, focus, image alternatives,
   readable contrast, and unexplained console errors.
5. Route blocking failures through the standard debugging loop.

**Verify**

- Every requirement is passed, failed, or explicitly deferred with approval.
- Automated success never substitutes for browser evidence.
- Deferred non-goals do not masquerade as failures or completed work.

**Checkpoint output:** PRD-traceable release validation report.

### M4.3 — Enforce the security and publication gate

**Change**

Before any unprotected preview or production action, inspect and record:

1. secrets, API keys, tokens, `.env` files, client-exposed configuration, and
   suspicious generated files;
2. repository visibility and committed history risks;
3. personal details, contact information, project confidentiality, and
   publication permissions;
4. asset ownership and downloadable-file metadata;
5. external links and third-party resources;
6. dependency and build warnings;
7. preview visibility/protection;
8. planned rollback, removal, or access-restriction route.

If the project contains a contact-form backend, analytics, authentication,
payments, a database, or another data-processing service, stop the standard
course flow. Require a new security scope or remove the feature from the
release candidate.

**Verify**

- Test fixtures for exposed secret, committed `.env`, private project copy,
  unapproved asset, public repository, public preview, and added backend.
- Gate blocks external action until the learner reviews and approves the
  current checklist.
- Sensitive values never enter Course Companion logs or Teacher context.

**Checkpoint output:** Learner-approved security and publication decision on
the current release candidate.

### M4.4 — Review and save the release candidate

**Change**

1. Codex inspects the complete technical change set.
2. Give the five-part plain-language release summary plus PRD match,
   unnecessary-change findings, visibility boundary, and sensitive-material
   findings.
3. Learner verifies the website and evidence, then accepts or requests revision.
4. After acceptance, create a clean local release checkpoint. Do not push or
   deploy as part of checkpoint creation.

**Verify**

- Working tree scope is understood.
- No secret or unrelated file enters the release checkpoint.
- `npm run check` still passes at the checkpoint.
- Learner approval references the current commit and artifact digests.

**Checkpoint output:** Clean, recoverable release candidate.

### M4.5 — Create and verify the deployed preview

**Change**

1. Codex proposes the exact supported Vercel steps and external effects.
2. Learner explicitly approves network, login, repository connection/push when
   required, and preview creation as separate consequential actions.
3. Create the preview using the verified path from M4.0.
4. Inspect build status and logs.
5. Open the deployed URL and repeat critical functional, responsive, content,
   accessibility, and security checks.
6. Record discrepancies and resolve or explicitly bound them.

**Verify**

- A URL alone cannot pass.
- Deployment identity, timestamp, source revision, build status, visibility,
  and live observations are recorded.
- Local and deployed results are reconciled.
- Course Companion does not label Executor-reported deployment as independently
  verified unless it has corroborating evidence.

**Checkpoint output:** Verified preview deployment evidence.

### M4.6 — Record the production-publication decision

**Change**

1. Present the consequences of public production, including privacy,
   repository, asset, and permanence concerns.
2. Require an explicit learner choice.
3. If the learner declines, record the reason and later publication steps; do
   not block graduation.
4. If the learner approves production, require a fresh security checklist,
   explicit production action approval, live verification, and rollback path.

**Verify**

- No preview action is treated as production approval.
- Declining production still permits the graduation gate when the preview is
  verified.
- Production evidence names the exact source revision and recovery route.

**Checkpoint output:** Deliberate, auditable production decision.

### M4.7 — Complete ownership defense and transfer package

**Change**

1. Ask ownership questions one at a time.
2. Require learner-owned explanations of audience, scope, reference adaptation,
   one design decision, one evidence-driven revision, one debugging
   investigation, deployment evidence, security/publication choice, and known
   limitations.
3. Have the learner frame a different small project with reduced guidance and
   save its brief, initial requirements, validation approach, and first bounded
   plan.
4. Do not require implementation of the transfer project for this course
   version.

**Verify**

- Answers cite the learner’s own artifacts and observations.
- Repeating course wording without a concrete example does not pass.
- Transfer work is genuinely a different project, not another portfolio
  feature.

**Checkpoint output:** Learner ownership and transfer evidence.

### M4.8 — Implement the Practice and graduation gate

**Change**

1. Add `m4-portfolio-release` with five milestone stages.
2. Add release, security, deployment, production-decision, ownership, and
   transfer evidence types.
3. Bind preview evidence to the accepted release checkpoint.
4. Invalidate deployment acceptance when the release source changes.
5. Require current evidence for every non-negotiable gate and human review for
   ownership/transfer.
6. Save the graduation result separately from immutable learner artifacts.

**Verify**

- Stale deployment after a new commit fails until redeployed and reverified.
- Public preview without learner approval fails.
- Production decline passes when all other gates pass.
- Missing security evidence, debugging evidence, or transfer work fails.
- Targeted resubmission reopens only failed or stale stages.

**Checkpoint output:** Complete Module 4 and evidence-gated graduation flow.

### Module 4 and graduation acceptance gate

The course implementation is accepted only when:

- a disposable learner journey completes Modules 2–4 in order;
- the same learner-selected portfolio folder persists across all three
  Practices;
- the release candidate passes local, security, and publication review;
- a live preview is opened and verified at the accepted source revision;
- production can be approved or declined without corrupting progress;
- ownership and transfer require learner-owned evidence;
- targeted recovery works from each Module 4 milestone;
- the full Course Companion verification suite passes;
- clean-install launcher and Electron smoke tests pass on the supported
  platforms;
- Module 4 is committed locally in scoped checkpoints.

## Verification matrix

| Surface | Foundation | Module 2 | Module 3 | Module 4 |
|---|---:|---:|---:|---:|
| Course manifest/schema | Required | Required | Required | Required |
| Introduction/Module 1 frozen regression | Required | Required | Required | Required |
| Silent clean restart | Required | Regression | Regression | Regression |
| Workspace path safety | Required | Required | Required | Required |
| Practice-definition parser | Required | Required | Required | Required |
| Evidence freshness/digests | Required | Planning | Build | Release/deploy |
| Lesson/script/quiz synchronization | — | Required | Required | Required |
| One-question-at-a-time assessment | — | Required | Required | Required |
| Exact checkpoint resume | Required | 5 stages | 5 stages + 4 slices | 5 stages |
| Desktop/narrow Course Companion UI | Regression | Required | Required | Required |
| Learner app browser checks | — | — | Required | Required local/live |
| Security/publication gate | Boundary | Planning privacy | No backend creep | Required |
| Electron smoke | Required | Through M2 | Through M3 | Full journey |

## Pilot and rollout sequence

Implementation and learner pilots follow the same one-module-at-a-time rule.

1. **Foundation developer rehearsal:** clean-restart fixture, workspace selection,
   registry, and Module 1 regression only.
2. **Module 2 internal rehearsal:** use a disposable portfolio workspace and
   deliberately test incomplete, stale, private, and misaligned planning
   artifacts.
3. **Module 2 beginner pilot:** do not expose Module 3. Record confusion,
   unsupported help, recovery needs, and gate independence. Do not publish a
   duration claim.
4. **Module 2 acceptance:** repair and freeze the accepted Module 2 contract.
5. **Module 3 internal rehearsal and beginner pilot:** begin only after Module
   2 acceptance; test scaffold failures, slice recovery, ordinary-language
   feedback, debugging, and enhancement independence.
6. **Module 3 acceptance:** repair and freeze the accepted Module 3 contract.
7. **Module 4 provider rehearsal:** validate the current Vercel path before
   learner-facing authoring.
8. **Module 4 internal rehearsal and beginner pilot:** test public/protected
   previews, deliberate production decline, rollback, stale deployment,
   security blockers, defense, and transfer.
9. **Release candidate:** run clean-install, launcher, full Electron, and
   supported-platform checks.

Pilot research may record time spent, but learner progress and published course
claims remain mastery-based until representative evidence supports a useful
duration range.

## Risks and controls

| Risk | Control |
|---|---|
| Frozen introduction or Module 1 changes accidentally | Legacy rendering path, semantic snapshots, exact changed-file review, narrow transition-copy exception |
| Old ContentPilot completion falsely passes new Module 2 | New IDs, course/schema bump, silent clean restart, no receipt reuse |
| Module 2 registry refactor becomes a full UI rewrite | Route only Modules 2–4 through the registry; preserve legacy path |
| Learner portfolio is created inside course files | Canonical folder validation and explicit rejection |
| One Practice becomes one unreviewable change | Stage receipts, Module 3 internal slice receipts, acceptance before next stage |
| Many Practices lose context | One persistent Executor task per module; artifacts are the cross-module handoff |
| From-scratch scaffold becomes inconsistent | Constrained scaffold proposal, dependency lock, exact commands, neutral baseline, recovery snapshot only as fallback |
| Visual reference encourages copying | Source/permission metadata, adapt/simplify/exclude review, no copied content/assets/code |
| Beginner is asked to review unreadable code | Fixed five-part plain-language summary plus browser and check evidence |
| Automated checks replace human verification | Browser, responsive, keyboard, focus, content, console, and live deployment checks remain required |
| Preview is assumed private | Visibility is observed; public exposure requires privacy checklist and explicit approval |
| Optional backend expands security scope | Stop gate and separate security review or removal from release candidate |
| Production happens implicitly | Separate explicit production decision and action approval |
| Course promises an unsupported duration | No fixed time in manifest/copy; pilot measures without advancing by time |
| Historical ContentPilot files confuse contributors | Supersession notices and runnable-path removal before any deletion decision |

## Decisions intentionally deferred

The following are implementation-time decision gates, not permission to infer a
choice silently:

1. Exact desktop and mobile viewport values, before Module 3 visual assertions.
2. Final numeric quiz/mastery thresholds, after representative beginner pilot
   evidence.
3. Distribution and contents of the fallback scaffold recovery snapshot.
4. Whether and when historical ContentPilot starters, artifacts, and planning
   contracts are moved to an archive or deleted.
5. Public marketing wording and any published course-duration range.

Each decision must be presented as one consequence-based packet with a
recommendation, alternatives, tradeoffs, and downstream effects before the
hard-to-reverse implementation proceeds.

## Definition of implementation complete

This course migration is complete only when:

1. The imported portfolio curriculum is the unambiguous current planning
   authority in the repository.
2. The occupation-neutral target learner is reflected consistently in internal
   guidance and Modules 2–4.
3. Introduction and Module 1 remain unchanged except for the approved Module 2
   transition copy and the approved removal of the Harness Engineering lesson
   with its synchronized references, checkpoints, assessment topic and progress
   migration.
4. State from the `0.2.0` test course starts fresh without a migration notice,
   and old ContentPilot evidence cannot pass a portfolio gate.
5. Modules 2, 3, and 4 each pass their own acceptance gate before the next is
   implemented.
6. One learner-selected portfolio folder persists safely across all three
   module Practices.
7. Every required learner artifact is current, reviewable, and bound to explicit
   learner acceptance.
8. The portfolio is built through small verified slices, not generated as one
   unreviewed change.
9. Release security and publication checks run before external exposure.
10. A live preview, ownership defense, and different-project transfer package
    pass the graduation gate.
11. The complete Course Companion verification and clean-install journey pass
    on supported platforms.
12. All repository changes are delivered through scoped, verified local
    checkpoints with unrelated work preserved and no automatic push.
