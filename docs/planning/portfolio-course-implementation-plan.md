# Portfolio Course Implementation Plan

- **Status:** Foundation and Module 3 are implemented. Module 1 now includes
  the approved `AGENTS.md` and Skills introduction and routes directly from it
  to setup Practice. Module 2 now keeps five Course Companion knowledge slides,
  routes directly to Practice, and retires all 23 Teacher-led Practice-setup
  slides. The combined fictional implementation-plan page, final assessment,
  saved-progress redirects, and detailed Teacher/Executor integration handoff
  are implemented and verified for this scoped content change. The previous seven-artifact
  runtime remains active until the delegated integration plan is implemented;
  Module 2 is therefore still `in-progress` and owner acceptance remains
  pending. On the
  `practice-disabled-content-development` branch,
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
| Foundation | `implemented` | `passed` — 294 unit tests, nine startup tests, typecheck, lint, production build, desktop and `390 × 844` inspection without horizontal overflow, and full Electron smoke; the approved three-page Portfolio introduction copy and exact-copy regressions passed on 19 August 2026 | `pending` overall; the global Course Companion palette, scoped Harness removal, learner-facing Codex terminology correction, Module 1 portfolio quiz scenario, live-Practice routing fix, the `AGENTS.md` and Skills introduction, revised reading order, removed Module 2 reminder, revised Skill opening, two-page Skill split with centered content, two added Module 1 questions, configuration-page removal, the temporary Module 1 quiz-review bypass, the simplified Module 1 review introduction, question-only assessment layout, and three-page Portfolio positioning were explicitly approved | `pending` | Present the Foundation evidence for owner review; do not infer overall approval. |
| Module 2 | `in-progress` — five Course Companion knowledge slides now route directly to the existing Practice entry; all 23 Teacher-led Practice-setup slides, their five formative quiz groups, folder/`AGENTS.md` review scaffolding, and five stage-shaped renderer lessons are retired. The final five-question mastery assessment, Practice entry prompt, saved-progress redirect to Practice, five Practice checkpoints, and detailed integration handoff remain. The delegated Teacher/Executor, five-document Practice, evidence, completion, and Module 3 handoff runtime still use the old seven-artifact contract | `blocked` overall by the unrelated Module 1 full-smoke review-bypass expectation; the current complete unit run passes 310/310, and nine startup tests, typecheck, lint and production build pass. The scoped 21 August Practice-setup retirement also passed focused content-review Electron smoke, direct desktop inspection at `1180 × 780`, saved-progress migration coverage for all 23 retired scene IDs, and `git diff --check`. The focused Electron route confirms the combined implementation-plan page proceeds immediately to Practice with no folder, `AGENTS.md`, or formative-check slide in between. The later direct-to-summary assessment change also passed its focused contract test and focused Electron journey through submit, summary, full-group retry and resubmission | `pending` overall; the retirement of all 23 setup slides, direct knowledge-to-Practice route, and direct-to-summary Module 2 assessment flow were explicitly approved on 21 August 2026. Earlier approval of the now-retired folder/`AGENTS.md` slide flow is superseded. The redesigned Executor runtime and full Module 2 acceptance remain pending | `pending` | Implement Teacher/Executor handoff checkpoints I1–I6 so Executor owns workspace setup, project rules, five-stage artifact guidance, approval, resume, and recovery; do not treat the current old seven-artifact runtime as the redesigned Practice. |
| Module 3 | `implemented` — the approved five-section lesson, 12 knowledge scenes, six illustrations, revised visible-error prompt example, repeated-error Codex prompt illustration, Git/GitHub image in place of that scene's standalone title box, non-overlapping commit-history illustration/dialogue layout, owner-supplied pre-Practice recap, final Teacher review, and five-question mastery check are wired into the Pilot and Course Companion. The redundant `module-3-practice-intro` setup scene remains retired; `module-3-git-branch` now opens `module-3-pre-practice-summary`, which then opens `module-3-portfolio-practice` | `blocked` overall by the unrelated Module 1 full-smoke review-bypass expectation. The current complete unit run passes 314/314, and nine startup tests, typecheck, lint and production build pass. The focused Module 3 content-review Electron journey passes and direct desktop inspection at `1440 × 900` confirms the new recap has no clipping, overlap or horizontal overflow. The full Electron smoke still stops at the unrelated missing Module 1 review-bypass control before reaching Module 3 | `pending` overall; the Module 3 wording, five-section sequence, debugging guidance, Git/GitHub explanations, continuous Practice experience, Teacher actions, six illustrations, five final questions, supporting copy with the commit-history authoring note removed, both prompt-image enlargements, Git/GitHub image replacement with title-box removal, commit-history layout repair, retirement of the redundant Practice-transition slide, and exact owner-supplied pre-Practice recap were explicitly approved | `pending` | Reconcile the unrelated Module 1 full-smoke bypass expectation without weakening real Practice gates, rerun full Electron smoke, then present the evidence for overall owner review. |
| Module 4 | `M4.0 complete`; M4.1 learner lesson, Teacher script, start prompt, five formative checks, six-question final review, typed scenes, session-only content-review route, temporary per-Practice review bypasses, and question-only assessment pages implemented on `practice-disabled-content-development`; redundant review banners and the dedicated header exit control removed by owner decision; artifact templates, Practice/evidence adapters, official completion, and graduation wiring deferred | `passed` for the content-first scope on 18 August 2026: typecheck, lint, 294 unit tests, nine startup tests, production build, desktop visual inspection of the question-only Module 4 layout, responsive Electron smoke, and byte-for-byte persisted-progress preservation after entering and exiting review through Home Base; macOS provider rehearsal passed on 16 August 2026; Windows provider runtime remains unverified | `pending` overall; the M4.0 provider flow, temporary content-first sequencing, review-UI simplification, and question-only assessment layout were approved, but learner-facing Module 4 content has not yet received owner acceptance | `pending` | Review Modules 2–4 content and questions end to end; revise content without claiming completion, then wire Practice and graduation gates after content approval. |

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
   owner to continue reviewing: Module 1 opens its six-question review, Module 2
   opens Module 3, Module 3 opens Module 4, and Module 4 opens its final review.
   Each action enters the same session-only review mode and leaves saved progress
   unchanged.

### Merge boundary — bring back content, not Practice bypasses

When this branch is integrated into the original branch, merge learner content
and approved question revisions only. Do not merge any temporary mechanism that
skips, disables, simulates, or routes around Practice.

The non-mergeable review scaffolding includes:

- the Home Base content-review launcher and `contentReviewMode` session routing;
- `contentReviewStartSceneByModule`, `practiceReviewDestinationByScene`,
  `startContentReviewAtScene`, and the `pixel-practice-bypass` button;
- tests and smoke steps whose sole purpose is to prove Practice bypass or
  persisted-progress preservation while review mode is active.

The mergeable scope includes approved lesson, Teacher-script, prompt, quiz,
source, and typed scene-content changes. Do not cherry-pick a whole mixed commit
or merge a whole mixed file merely because it contains approved content. Inspect
the diff by responsibility, retain the real Practice coordinators and completion
gates, and exclude the review-only identifiers above. Before completing the
merge, verify that no `pixel-practice-bypass` control remains and that every
module still requires authoritative Practice evidence for official progression.

Electron smoke verifies the content-review path at desktop and `390 × 844`,
answers a Module 4 formative question, exits through the Home Base brand control,
and confirms that `learner-state.json` is byte-for-byte unchanged. On 17 August
2026, the same smoke journey also exercised the Module 1 bypass, opened Module 2
review, exited through Home Base, restored the exact Practice checkpoint, and
then completed the real Practice path. On 18 August 2026, the owner redirected
that temporary Module 1 bypass to its own six-question review; smoke now confirms
all six questions render and saved progress still returns to the exact Practice
checkpoint. After the owner-approved removal of the
two redundant review banners and dedicated header exit control, typecheck, lint,
284 unit tests, nine startup tests, production build, desktop and narrow
screenshot inspection, and Electron smoke passed. This verification does not
mark Foundation or any module as owner-approved or pilot-accepted.

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
- On 19 August 2026, the owner explicitly reopened all three introduction
  dialogues and supplied the replacement copy. The existing three-scene flow
  now presents the portfolio practice project, the recruiter-facing web
  portfolio outcome, and the transfer of those skills to other AI-built tools.
  Scene order, navigation, buttons, layout, and progress behavior remain
  unchanged. Typecheck, lint, 294 unit tests, nine startup tests, production
  build, exact-copy regressions, desktop and `390 × 844` inspection without
  horizontal overflow, full Electron smoke, and `git diff --check` passed.
  This scoped approval does not mark overall Foundation owner approval or
  pilot acceptance as complete.
- On 16 August 2026, the owner approved removing the complete Harness
  Engineering lesson from Module 1. The runnable course now has three Module 1
  lessons and an estimated 38 minutes; `/` and `@` route directly to the Codex
  configuration lesson. The retired lesson, visual, two checkpoints and
  Harness assessment topic were removed. Existing progress at those retired
  IDs now migrate to `module-1-setup-checklist`, and the assessment gate remains
  intact with a source-backed `/status` and `/goal` question. The related introduction
  script reference, Course Companion renderer, static guide, contracts and
  regression expectations were synchronized. Typecheck, lint, 274 unit tests,
  nine startup tests, production build and full Electron smoke passed. This
  scoped approval does not mark overall Foundation owner approval or pilot
  acceptance complete; every other introduction and Module 1 surface remains
  frozen.
- On 18 August 2026, the owner explicitly reopened Module 1 to add one
  two-page `AGENTS.md` and Skills lesson. The first page introduces only the
  Global and Current repo levels, shows Triết's current setup, and postpones
  learner file creation until a portfolio workspace exists. The second page
  introduces `frontend-design`, `copywriting`, and `skills.sh`; its single
  code-native example panel contains an English excerpt from `SKILL.md` and no
  screenshot. The lesson now has four lessons and an estimated 46 minutes.
  Module 2 asks the learner to create the Current repo file only after choosing
  the portfolio folder, then records the learner's confirmation without reading
  or grading the file. The owner approved the exact learner-facing content and
  the use of “ứng dụng này” instead of the internal product name. The current
  full verification suite passed. This scoped approval does not mark overall
  Foundation or Module 2 owner acceptance, or pilot acceptance, complete.
- On 18 August 2026, the owner explicitly reopened the first `AGENTS.md` page
  again to correct its reading order. It now starts with the learner's question
  about information the agent should remember, introduces `AGENTS.md` as the
  answer, and only then presents the Global and Current repo levels. On desktop,
  the introduction occupies the full row above two side-by-side level cards. At
  390 px, the cards and action row follow in one scrollable column without
  horizontal overflow or overlap. The runnable lesson, Teacher script, renderer,
  frozen regression and Electron smoke assertions are synchronized. Typecheck,
  lint, 292 unit tests, nine startup tests, production build and the full
  Electron smoke passed. This scoped approval does not mark overall Foundation
  owner approval or pilot acceptance complete.
- On 18 August 2026, the owner explicitly removed the closing sentence that
  told learners they would create the Current repo `AGENTS.md` in Module 2. The
  runnable lesson and renderer no longer contain that sentence, and its unused
  presentation style was removed. The frozen lesson digest and Electron smoke
  now protect the revised page, including an explicit absence assertion.
  Typecheck, lint, 292 unit tests, nine startup tests, production build and the
  full Electron smoke passed. This scoped approval does not mark overall
  Foundation owner approval or pilot acceptance complete.
- On 18 August 2026, the owner explicitly replaced the Skill-page transition
  with a learner-facing problem: `AGENTS.md` can preserve recurring actions but
  should not contain every technique for many specialized skills. The new copy
  leads from writing as one example to Skill as the answer. The opening label
  now renders `SKILL` larger than its supporting description so the current
  section is immediately recognizable. The runnable lesson, Teacher script,
  renderer, responsive styling, frozen regression and Electron smoke assertions
  are synchronized. Typecheck, lint, 292 unit tests, nine startup tests,
  production build, full Electron smoke at desktop and `390 × 844`, and
  `git diff --check` passed. This scoped approval does not mark overall
  Foundation owner approval or pilot acceptance complete.
- On 18 August 2026, the owner approved splitting the crowded Skill surface
  into two pages while keeping it inside the same `m1-agents-and-skills`
  lesson. The first Skill page now contains the transition from `AGENTS.md`,
  the `SKILL.md` explanation, the English excerpt, and its language note. The
  second page contains only the `frontend-design` and `copywriting` guidance
  plus the `skills.sh` discovery panel. The lesson therefore has three pages in
  total: one `AGENTS.md` page and two Skill pages. Scene contracts, back/forward
  navigation, runnable lesson, Teacher script, frozen hashes, and responsive
  smoke assertions are synchronized. Typecheck, lint, 292 unit tests, nine
  startup tests, production build, full Electron smoke at desktop and
  `390 × 844`, and `git diff --check` passed. This scoped approval does not mark
  overall Foundation owner approval or pilot acceptance complete.
- On 18 August 2026, the owner refined the second Skill page by centering the
  title and two portfolio-skill cards vertically with the `skills.sh` panel in
  the desktop frame. The same alignment rule leaves the narrow one-column flow
  content-sized. Typecheck, lint, 293 unit tests, nine startup tests, production
  build, full responsive Electron smoke, and `git diff --check` passed. This is
  part of the scoped two-page Skill approval and does not mark overall
  Foundation owner approval or pilot acceptance complete.
- On 18 August 2026, the owner explicitly reopened the Module 1 review to add
  two multiple-choice questions about `AGENTS.md` and Skills while preserving
  the four existing questions. The new questions use project-rule and reusable-
  workflow scenarios, distinct IDs, and the current official OpenAI sources.
  The mastery gate is 5/6, so a learner may still miss one question. The fifth
  question scene is active again, a sixth scene is registered, and historical
  answers to the retired question cannot satisfy either new question. The
  runnable quiz, lesson, script, start prompt, Teacher contract, mastery rubric,
  renderer, progress handling, frozen regression, and Electron smoke are
  synchronized. Typecheck, lint, 293 unit tests, nine startup tests, production
  build, full Electron smoke, and `git diff --check` passed. This scoped approval
  does not mark overall Foundation owner approval or pilot acceptance complete.
- On 18 August 2026, the owner explicitly removed the complete `Dùng cấu hình
  đã chọn` page. Module 1 now has three lessons and an estimated 42 minutes;
  the final Skills page routes directly to setup Practice. The runnable scene,
  lesson outline, checkpoint count, stale visual, styles, Teacher script,
  frozen regression, and Electron smoke journey were synchronized. Saved
  progress on the retired configuration lesson migrates to
  `module-1-setup-checklist`, while its retired IDs remain readable only for
  migration. Typecheck, lint, 293 unit tests, nine startup tests, production
  build, full Electron smoke, and `git diff --check` passed. This scoped
  approval does not mark overall Foundation owner approval or pilot acceptance
  complete.
- On 18 August 2026, the owner redirected the temporary Module 1 Practice
  bypass from Module 2 to the Module 1 review itself. The action is now labeled
  `Bỏ qua Practice · Duyệt bài trắc nghiệm` and opens `module-1-mastery`, so the
  owner sees the review introduction before all six questions. It still uses
  session-only content-review state: it does not approve Practice, complete the
  module, or mutate saved learner progress. The content-review contract and
  Electron smoke protect the destination, six-question render, and exact saved-
  progress preservation. Typecheck, lint, 293 unit tests, nine startup tests,
  production build, full Electron smoke, and `git diff --check` passed. This
  temporary bypass remains excluded from the mergeable learner-course scope.
- On 18 August 2026, the owner simplified the Module 1 review introduction by
  removing its title box and approved-configuration box from the rendered
  screen. Triết's dialogue now reads exactly `Bây giờ hãy cùng nhau trả lời các
  câu hỏi ôn tập để củng cố kiến thức vừa học nhen!`; the Continue action and
  six-question review are unchanged. The frozen renderer contract and Electron
  smoke now protect the absence of both boxes and the exact replacement copy.
  Typecheck, lint, 293 unit tests, nine startup tests, production build, desktop
  and `390 × 844` screenshot inspection without horizontal overflow, full
  Electron smoke, and `git diff --check` passed. This scoped approval does not
  mark overall Foundation owner approval or pilot acceptance complete.
- On 18 August 2026, the owner made the six-question Module 1 assessment pages
  question-only. The standalone `TEACHER · Triết` row, its guidance, the scene
  title box, and the assessment title, count, instructions, and divider are no
  longer rendered. The unchanged question cards begin at the top of the content
  surface, while the assessment retains a Module 1 accessibility label.
  Typecheck, lint, 293 unit tests, nine startup tests, production build, desktop
  visual inspection, full responsive Electron smoke, and `git diff --check`
  passed. This scoped UI approval does not mark overall Foundation owner
  approval or pilot acceptance complete.
- On 18 August 2026, the owner extended the same question-only presentation to
  every formative and mastery question page in Modules 2–4. A shared renderer
  rule now removes the Teacher row, dialogue, scene title, assessment title,
  count, instructions, and divider whenever an assessment question is active.
  Question content, choices, submission controls, feedback, introductions, and
  result pages remain unchanged. The existing Module 2 layout already matched
  this rule; Module 3 and Module 4 now inherit it without module-specific
  exceptions. Typecheck, lint, 294 unit tests, nine startup tests, production
  build, desktop Module 4 visual inspection, full responsive Electron smoke,
  and `git diff --check` passed. This scoped approval does not mark overall
  module owner approval or pilot acceptance complete.
- On 21 August 2026, the owner approved removing only learner-facing
  `NGUỒN PHƯƠNG PHÁP` panels from assessment feedback across Modules 1–4.
  `QUYẾT ĐỊNH CHƯƠNG TRÌNH` panels remain visible, and all quiz source metadata
  remains unchanged for internal traceability. Typecheck, lint, production
  build, nine startup tests, focused content-review Electron smoke, and
  `git diff --check` passed. The full unit run reached 305/306 tests and remains
  non-clean only because of the separately edited Module 2 `mastery-5` copy
  contract. This scoped UI approval does not mark overall Foundation or module
  owner approval, or pilot acceptance, complete.
- Later on 21 August 2026, the owner expanded that decision to remove the
  remaining `QUYẾT ĐỊNH CHƯƠNG TRÌNH` panels as well. Assessment feedback now
  renders no source-attribution panel, while quiz source metadata remains
  unchanged for internal traceability. Typecheck, lint, production build, nine
  startup tests, focused content-review Electron smoke, and `git diff --check`
  passed. The full unit run remains at 305/306 because of the same separately
  edited Module 2 `mastery-5` copy contract. This follow-up UI approval does not
  mark overall Foundation or module owner approval, or pilot acceptance,
  complete.
- On 19 August 2026, the Module 2 Practice prompt and Teacher panel were moved
  into one responsive layout with an explicit positive gap. Long prompt content
  now scrolls inside its own region instead of expanding into the Teacher
  panel. Electron smoke measures at least 16px between the rendered desktop
  bounds and 10px at `390 × 844`; typecheck, lint, 294 unit tests, nine startup
  tests, production build, full Electron smoke, and `git diff --check` passed.
  This layout correction does not change Module 2 implementation, owner
  approval, or pilot-acceptance status.
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
  implementation-plan.md

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

## Module 2 — Learn planning and PRDs before portfolio practice

### Module outcome

After seven focused Course Companion explanation pages, the learner
uses one persistent Codex task to turn a vague portfolio idea into five current,
learner-approved planning documents. The learner answers one plain-language
question at a time; Executor creates and updates the documents; Course
Companion independently inspects the files and current digests after every
stage. Module 2 ends with an approved implementation plan. Module 3, not Module
2, proposes the first concrete implementation task and begins building.

### Approved redesign authority — 17 August 2026

The approved product and artifact contract is recorded in
`docs/planning/module-2-redesign-working-spec.md`. It supersedes the previous
seven-artifact design for future implementation while preserving honest
historical progress notes about the runnable baseline.

The learner-facing stages and documents are:

| Stage | Learner-facing name | Current output |
| --- | --- | --- |
| 1 | Mục đích của portfolio này là gì? | `planning/portfolio-brief.md` |
| 2 | Hiện tại bạn đang có những gì? | `planning/content-evidence-inventory.md` |
| 3 | Bạn muốn portfolio của mình trông như thế nào? | `planning/reference/reference.md` plus optional sourced screenshots |
| 4 | Hoàn thành PRD | `planning/PRD.md` |
| 5 | Tạo kế hoạch triển khai | `planning/implementation-plan.md` |

The Stage 5 document absorbs requirement-to-validation coverage. The previous
`planning/requirement-validation-map.md` and
`planning/first-bounded-task.md` contracts are retired. Module 2 creates no
application, implementation task, dependency decision, command, or source file.

Course Companion owns approval timestamps, artifact digests, stage receipts,
freshness, and the review summary. Learners never fill technical metadata or
open templates as required work.

### Page-preservation correction — 18 August 2026

The owner explicitly restored the PRD definition, PRD anatomy, and coding-agent
review pages that the three-page redesign removed without a page-specific
deletion request. This changes the explanation route from three to six pages:
planning before building; PRD definition; PRD anatomy; PRD creation/review; one
persistent Codex task; and the five-stage map. The following Practice
transition remains separate. This correction changes the page count and
navigation contract only; it does not reopen the five-stage/five-document
Practice design.

### Exact-page deletion correction — 18 August 2026

The owner subsequently requested deletion of the exact “Một PRD tốt cần có
những gì?” page. The current five-page explanation route is: planning before
building; PRD definition; PRD creation/review; one persistent Codex task; and
the five-stage map. Saved progress that still points to the retired page moves
to PRD creation/review and removes that retired identity from history. No other
page or learner-facing copy is reopened by this deletion.

### One-task-page deletion correction — 18 August 2026

The owner subsequently requested deletion of the exact “Một task Codex, năm
lần duyệt” explanation page. The current four-page explanation route is:
planning before building; PRD definition; PRD creation/review; and the
five-stage map. The Practice still uses one persistent Executor task across all
five stages; only the separate explanation page is retired. Saved progress that
points to that page moves to the five-stage map and removes the retired identity
from history. No other page or learner-facing copy is reopened by this deletion.

### Implementation-plan walkthrough expansion — 19 August 2026

The owner approved a fictional portfolio implementation plan whose only purpose
is to teach the format before Practice. Five new pages follow the existing
four-page explanation route: one overview, then focused views of requirements
and boundaries, implementation stages, expected files and checks, and finally
risks, assumptions, and the approval stop. The example is explicitly labeled as
fictional and not an answer for the learner's portfolio. It does not change the
five-stage Practice contract, create a learner artifact, or claim that
implementation has started.

### Implementation-plan walkthrough simplification — 19 August 2026

The owner subsequently approved reducing the walkthrough to two informational
pages. The first page shows that an implementation plan contains multiple
ordered phases. The second page shows that every phase has its own observable
completion criteria. Neither page asks the learner a question; questions remain
in the end-of-lesson assessment. The three detail pages about requirements,
files and testing, and risks are retired from the learner route, while those
details remain available in the full fictional sample plan. Together with the
five preceding explanation pages, the current route has seven explanation pages
before Practice.

### Current repository comparison — 17 August 2026

**Preserve:**

- one selected external portfolio workspace;
- one persistent Executor task across all five stages;
- five ordered stage receipts, current-digest approval, stale invalidation,
  resumability, and atomic Module 2 completion;
- strict write scope under `planning/`, including bounded reference
  screenshots, with application code and dependency changes rejected;
- the separate mastery gate unless a later explicit owner decision reopens it;
- Module 3 receiving the selected workspace and current planning references,
  never an old chat transcript as hidden context.

**Replace or migrate:**

- the current outline and milestone-by-milestone teaching/example route with
  seven focused explanation surfaces followed by the real Practice;
- every seven-artifact list in the manifest, shared contracts, Practice
  definition, registry, evidence adapter, completion service, fixtures, and
  tests with the five-document contract;
- the learner-facing phrases `dấu hiệu thành công`, `đã kiểm chứng`, `lời tự
  khai`, and `implementation contract` with the approved questions, evidence
  labels, and stage names;
- the requirement for a URL and screenshot in every reference case with a
  source-aware contract that also permits learner-owned images and explicitly
  bounded unknown rights;
- the separate validation-map and first-bounded-task templates and all
  completion/mastery logic that reads or summarizes the first task;
- the current Module 2 Practice version and obsolete progress references so a
  receipt for the old artifact set cannot satisfy the new gate.

**Known implementation surfaces:**

- `pilot-workspace/course/course-structure.json`, the Module 2 lesson, Teacher
  script, start prompt, quiz, Practice definition, rubric, and planning
  templates;
- `course-companion/shared/contracts.ts` and the shared Module 2 registry
  definition;
- renderer scenes, outline/progress labels, Practice launch/resume routing, and
  the narrow Module 3 readiness handoff;
- `portfolio-planning-evidence-adapter.ts`,
  `portfolio-module-completion-service.ts`, Practice/progress repositories, and
  their stage/digest contracts;
- focused Module 2 curriculum, registry, evidence, completion, progress,
  coordinator, Electron smoke, and frozen-transition tests.

The pre-Module-1 introduction remains frozen. Temporary content-review Practice
bypasses on `practice-disabled-content-development` are not part of this
redesign and must not enter the real completion path.

**Planning checkpoint status — 17 August 2026:** Product design is approved and
the repository gap inventory is complete. No runnable course, contract, test,
or learner progress has been changed by this planning checkpoint. Verification
is limited to document inspection and `git diff --check`; runtime verification
remains `pending`. The next permitted action is one final owner confirmation of
the implementation scope above, followed by bounded implementation and focused
checkpoint commits. Pilot acceptance remains `pending` until a real disposable
workspace rehearsal and required learner evidence pass.

### Delegated Teacher/Executor integration boundary — 17 August 2026

The owner approved a split implementation. This repository checkpoint owns the
three Course Companion explanation pages, outline/navigation for content review,
learner-facing stage names, questions that do not require a live agent, and a
detailed technical handoff. It does **not** implement Teacher orchestration, the
persistent Executor task, document creation/update, filesystem digest review,
accept/revise receipts, stale/resume/completion behavior, progress migration,
or the Module 3 runtime handoff.

The delegated work is specified in
`docs/planning/module-2-teacher-executor-integration-handoff.md`, including the
state machine, five document contracts, file ownership, checkpoint order, test
matrix, atomic completion gate, and Module 3 first-task boundary. Until those
checkpoints pass, the redesigned Module 2 is reviewable content, not a runnable
or accepted learner flow.

### M2.1 — Lock the module manifest and artifact contracts

**Change**

1. Replace the Module 2 entry in `course-structure.json` with the five approved
   stages, learner-facing names, and semantic checkpoints.
2. Set `nextLessonId` to Module 3, but keep Module 3 locked until the Module 2
   evidence and mastery gates pass.
3. Replace the seven-artifact manifest with exactly five planning documents:
   the brief, evidence inventory, reference record, PRD, and implementation
   plan. Reference screenshots remain bounded supporting evidence rather than
   additional planning documents.
4. Retire `planning/requirement-validation-map.md` and
   `planning/first-bounded-task.md`; move requirement-validation coverage into
   `planning/implementation-plan.md` without creating a Module 3 task.
5. Define the approved headings, plain-language evidence labels, learner-owned
   decisions, source/rights boundaries, and system-managed approval metadata.
6. Bump the Module 2 Practice contract version and reject or safely redirect
   obsolete seven-artifact progress so old receipts cannot satisfy the new gate.
7. Keep technology selection, commands, dependency choices, implementation
   tasks, and application code out of Module 2.

**Verify**

- Course-structure parser accepts the manifest.
- Exactly five document paths are unique and under `planning/`.
- Templates contain no completed learner answer or hidden portfolio solution.
- The implementation plan contains both requirement-validation coverage and
  phased planning, but no first implementation task.
- Old seven-artifact receipts cannot unlock Module 3.
- Module 2 cannot open Module 3 without the gate receipt.

**Checkpoint output:** A machine-readable Module 2 contract and solution-free
artifact templates.

### M2.2 — Author the concept-first journey and five practice milestones

**Change**

Create or replace the Module 2 lesson, Teacher script, and start prompt in
natural Vietnamese:

1. Present five focused Course Companion knowledge slides before the Practice
   transition:
   - why planning matters;
   - what a PRD is and is not;
   - how a learner creates, reviews, and approves a PRD with a coding agent;
   - how visual references and a browser prototype can support planning;
   - what an implementation plan is, alongside one fictional example with
     ordered phases and observable completion criteria.
2. Retire all 23 pre-Practice setup, example, application and formative-check
   slides. Detailed
   clarification happens inside the one persistent Practice task, not across
   separate teaching tasks or learner-filled forms.
3. Keep explanations short, beginner-first, and transferable beyond portfolio
   work. Pafolios is the default discovery suggestion; Awwwards is an optional
   expressive source with an explicit complexity/copying warning.
4. Start the real portfolio-planning Practice immediately after the explanation
   surfaces.

The nested portfolio milestones are:

1. Determine the portfolio's purpose and create the portfolio brief.
2. Inventory current content and evidence.
3. Choose a reference and record liked, unsuitable, uncertain, source, and
   rights information without designing the UI.
4. Synthesize the first three approved documents into the PRD; ask only when a
   high-impact gap cannot be resolved from current evidence.
5. Create one implementation plan containing requirement-validation coverage
   and ordered phases, then stop before any implementation task is created.

Each milestone follows:

```text
Executor reads current approved inputs
-> asks one necessary plain-language question, if any
-> Executor creates or revises the document
-> inspect fresh evidence
-> Course Companion summarizes
-> learner accepts or requests a revision
```

Executor questions are asked one at a time with a recommended answer when the
choice is consequential. Stages 4 and 5 draft first and do not re-interview the
learner. The learner may describe preferences in ordinary language. The script
must use the approved labels `Có bằng chứng`, `Do bạn xác nhận`, `Đang giả định`,
and `Còn thiếu`, while preserving private/publication/ownership boundaries.

**Verify**

- Every curriculum milestone appears once and in approved order.
- Exactly five knowledge slides precede one real Practice launch.
- No fixed duration or speed promise appears.
- No learner is required to open a template, fill technical metadata, read
  code, choose dependencies, create a task, or create the app.
- The exact approved Stage 1 question replaces `dấu hiệu thành công` wording.
- Reference guidance prohibits copying content, branding, images, and source
  code while permitting an honestly bounded unknown-rights reference.
- Vietnamese content passes diacritic and terminology review.

**Checkpoint output:** Complete source-first Module 2 instruction aligned with
the five-document contract.

**Progress note — 17 August 2026:** The owner-approved four-part structure now
teaches planning and PRD concepts before introducing the portfolio practice.
The author's opening language remains in Part 1, while “Bây giờ, chúng ta sẽ
chính thức bắt tay vào tạo Portfolio.” remains at the Part 4 transition. The
dedicated “Một PRD tốt cần có những gì?” page has been retired; Part 2 now moves
directly to the coding-agent PRD workflow in Part 3. The five nested portfolio
milestones and seven-artifact contract were unchanged at that historical
checkpoint and are now superseded by the approved redesign above. Focused tests,
all 288 unit tests, nine startup tests, typecheck, lint, production build, and
full Electron smoke passed.

**Content-redesign progress note — 17 August 2026:** The renderer now presents
the approved three-page narrative: planning before building; one Codex task with
five learner approvals; and the five-stage/five-document map. The third page
mentions Pafolios and Awwwards with complexity and copying boundaries, then
routes directly to the Practice scope in session-only content review. A legacy
transition remains on the runnable seven-artifact path solely to avoid claiming
that the delegated Practice migration already exists. The Teacher lesson,
script, prompt, templates, and live Practice contract remain explicitly
delegated rather than partially rewritten here.

### M2.3 — Keep the final mastery assessment

**Change**

1. Preserve the separate mastery gate because its removal has not been approved,
   but remove or rewrite assessment items that assume seven artifacts, a
   separate validation map, or a first bounded task in Module 2.
2. Remove the five formative quiz groups that existed only to support the
   retired Practice-setup slides. Do not rebuild milestone-by-milestone teaching
   pages merely to host retrieval checks.
3. Require learner-owned short answers only where they demonstrate ownership of
   audience, scope, evidence, or requirement-validation decisions in the five
   current documents.
4. Keep exact numeric passing thresholds configurable. Do not publish a final
   threshold until representative beginner pilots support it.
5. Keep Teacher-led quiz delivery one question at a time in conversation.
6. In Course Companion, show every question in the current quiz group before
   submission. For the Module 2 final group, save the fifth unscored reflection
   as self-reviewed when the learner submits, then open the summary directly.
   Keep the summary's full-group retry path when any scored answer is incorrect.
   Other assessment groups retain their existing post-submit feedback flow.

**Verify**

- Teacher-led delivery remains one question at a time.
- Course Companion submits the complete Module 2 group once, records the fifth
  reflection as self-reviewed, and opens the summary without a second
  “Xem kết quả 5 câu” action; an incorrect scored choice can be retried from the
  summary.
- Every answer traces to the imported source audit or an explicitly labeled
  curriculum judgment.
- No answer can pass merely by repeating the example portfolio.
- No question requires `planning/requirement-validation-map.md`,
  `planning/first-bounded-task.md`, or a Module 2 implementation task.
- Practice completion cannot substitute for mastery, and mastery cannot
  substitute for current artifacts.

**Checkpoint output:** Portfolio-specific final mastery assessment.

**Content-redesign progress note — 17 August 2026:** Agent-independent Module 2
questions now use the approved Stage 1 outcome wording and evidence labels.
Mastery validation reads the relevant section of
`planning/implementation-plan.md`, and the former first-task scenario now tests
the Module 2/3 boundary. The live artifact review and mastery completion service
still use the old runtime contract until delegated integration checkpoints
I1–I6 are implemented.

### M2.4 — Implement the `m2-portfolio-planning` Practice

**Change**

1. Add the Practice definition with five ordered stage checkpoints.
2. Open the learner-selected portfolio folder in one persistent Executor task.
3. Limit write scope to the five approved planning documents and bounded
   reference screenshots.
4. Extend planning evidence collection to validate:
   - required sections and artifact digests;
   - the approved plain-language evidence labels and privacy/permission review;
   - learner-owned or externally sourced references, optional useful
     screenshots, and explicit unknown-rights boundaries;
   - PRD scope and acceptance criteria;
   - one-to-one requirement-validation coverage inside the implementation plan;
   - phased plan dependencies, non-goals, and the absence of a Module 2
     implementation task;
   - learner approval of the current versions.
5. After every stage, Course Companion must inspect the current filesystem
   artifact, show a learner-readable digest summary, and record only an explicit
   **Chấp nhận** decision; **Yêu cầu sửa** keeps the same task and stage open.
6. Stage 4 and Stage 5 synthesize current approved inputs before asking any
   question. Ask only for unresolved high-impact decisions.
7. Prevent implementation source, task creation, dependency installation, or
   deployment work.

**Verify**

- Missing, stale, malformed, or unapproved artifacts fail the matching stage.
- Unexpected application files fail scope control.
- A reference may be a URL, screenshot, or learner-owned image; unclear rights
  remain explicitly bounded and never authorize public reuse.
- Each stage can resume after relaunch without starting a new task.
- Every stage receipt binds to the current digests required by that stage and
  its dependency chain; a downstream edit invalidates the affected receipts.
- Completing Stage 5 returns to the Module 2 mastery scene, not Module 3.

**Checkpoint output:** A live, resumable portfolio-planning Practice with fresh
artifact evidence.

### M2.5 — Render Module 2 through the registry

**Change**

1. Build the Module 2 definition and scenes in its module package.
2. Present five focused knowledge scenes followed immediately by the single real
   Practice entry. Workspace selection, Current repo `AGENTS.md` and stage setup
   belong to Executor Practice, not Course Companion slides.
3. Update progress display, Practice launch/resume/revision recovery, quiz, and
   mastery surfaces through the shared registry contract without exposing
   templates or technical approval metadata to the learner.
4. Use the approved learner-facing names for all five stages and documents.
5. Reuse existing visual assets where possible. Any discovery-source UI links
   directly to the current official Pafolios or Awwwards page and includes the
   approved guidance about complexity and copying.
6. Preserve the approved Module 1 transition destination and frozen
   pre-Module-1 surfaces; add assertions that unrelated frozen copy and behavior
   remain unchanged.
7. Redirect or retire obsolete Module 2 scene/progress identities without
   treating old seven-artifact progress as completion of the redesigned module.

**Verify**

- Supported desktop Course Companion layouts.
- Keyboard and focus behavior.
- No folder, `AGENTS.md`, milestone example or formative-check slide appears
  between the fifth knowledge slide and Practice.
- Exactly five knowledge slides precede the real Practice.
- The PRD definition routes through coding-agent review directly to the
  visual-planning and implementation-plan knowledge slides; all retired
  PRD-anatomy, one-task and Practice-setup pages are unreachable.
- Correct return/review destination after every Practice stage and quiz group.
- Exact resume from each milestone.
- Module 1 frozen-content diff/snapshot check.

**Checkpoint output:** Complete learner-facing Module 2 in Course Companion.

**Progress note — 17 August 2026:** The existing Module 2 entry scene now starts
three general planning/PRD parts before the Part 4 portfolio transition and
workspace-selection page, preserving the frozen Module 1 destination and
resumable scene identity. The lesson HUD keeps Teacher and Quit at the upper
right and places a four-part outline trigger in the center. Its open menu uses a
small circle for every part, bold yellow treatment for the current part, reduced
opacity for completed parts, and normal treatment for upcoming parts without
status labels. Electron smoke verifies desktop and `390 × 844` placement, all
three progress states, no horizontal overflow, reachable navigation, and the
complete transition into workspace selection. Saved progress on the retired
PRD-anatomy page redirects to the coding-agent PRD workflow and removes the old
scene from history. Focused progress tests and the full automated/Electron suite
passed. This is evidence for the superseded four-part baseline, not verification
of the approved three-page redesign.

**Content-redesign progress note — 17 August 2026:** The Module 2 outline now
contains exactly three learner-facing entries, the shared lesson labels use the
five approved stage names, and the Practice/mastery/completion copy describes
five target documents. Desktop and `390 × 844` screenshots and full Electron
smoke passed. This verifies layout, navigation and content only; shared artifact
paths, Practice version, evidence adapters and completion remain intentionally
unchanged for the delegated integration owner.

**Page-restoration progress note — 18 August 2026:** The current one-task page
remains intact. The PRD definition, anatomy, and coding-agent review pages are
again reachable immediately after it, followed by the five-stage map and the
Practice transition. The outline now exposes all seven learner-facing entries,
and saved progress on `module-2-prd-anatomy` resumes that restored page instead
of redirecting past it. The current full suite passed with 288 unit tests, nine
startup tests, typecheck, lint, production build, full Electron smoke, desktop
screenshot inspection, and `390 × 844` responsive checks.

**PRD-first ordering note — 18 August 2026:** At the owner's explicit request,
the restored PRD definition, anatomy, and coding-agent review pages now precede
the intact one-task workflow page. The route, outline, active-part mapping, back
history, resume fixture, and smoke coverage are synchronized without rewriting
any existing learner-facing copy. Verification passed with 288 unit tests, nine
startup tests, typecheck, lint, production build, full Electron smoke, desktop
screenshot inspection, and `390 × 844` responsive checks.

**Exact-page deletion note — 18 August 2026:** At the owner's subsequent
explicit request, `module-2-prd-anatomy` and its Pilot lesson/script section are
retired. The PRD definition now routes directly to coding-agent PRD review; the
outline, renderer registry, active-part mapping, source contract, smoke route,
and saved-progress migration are synchronized. Verification passed with 288
unit tests, nine startup tests, typecheck, lint, production build, full Electron
smoke, desktop screenshot inspection, and `390 × 844` responsive checks.

**Original-copy restoration note — 18 August 2026:** At the owner's explicit
request, the first Module 2 explanation scene again renders the author's
approved opening paragraph verbatim from the Pilot lesson and Teacher script.
The replacement paragraph introduced by the content redesign is retired. A
source-to-renderer contract assertion and Electron smoke assertion now protect
the exact wording. Verification passed with 288 unit tests, nine startup tests,
typecheck, lint, production build, full Electron smoke, desktop screenshot
inspection, and `390 × 844` responsive checks.

**Illustration-first explanation note — 18 August 2026:** The owner clarified
that the Module 2 opening scene must remain and only its summary panel should be
removed. The first three explanation scenes now use existing, source-documented
course images in place of their summary panels: Codex planning before action, a
concrete PRD request, and a PRD review beside the Codex conversation. The fourth
explanation scene keeps its existing Pafolios/Awwwards gallery. Functional
transition and workspace surfaces remain unchanged; summary panels are a
fallback when no useful illustration exists. Verification passed with 294 unit
tests, nine startup tests, typecheck, lint, production build, full Electron
smoke, desktop screenshot inspection, `390 × 844` responsive checks, and no
horizontal overflow. Overall Module 2 owner acceptance and pilot acceptance
remain pending.

**Two-page implementation-plan correction — 19 August 2026:** The owner
approved replacing the five-page walkthrough with two informational pages. The
first shows four ordered phases. The second pairs every phase with its own
observable completion criteria. There are no questions on either page; the
learner encounters questions only in the end-of-lesson assessment. The three
retired detail-page identities migrate to the remaining completion-criteria
page and are removed from saved history. The full fictional sample plan keeps
the secondary details for learners who want to inspect the complete format.
Verification passed with 299 unit tests, nine startup tests, typecheck, lint,
production build, full Electron smoke, desktop and `390 × 844` screenshot
inspection without horizontal overflow, and `git diff --check`.

**PRD-to-implementation-plan bridge — 20 August 2026:** At the owner's explicit
request, the Module 2 explanation route now places one standard Teacher page
between the PRD/design-planning page and the two-page fictional plan. The page
uses the owner's supplied explanation of an implementation plan, ordered phases,
completion criteria, and the learner's review role. Its primary action opens the
fictional plan, making the two-column document layout an intentional example
rather than an abrupt change of teaching style. Verification passed with 305
unit tests, nine startup tests, typecheck, lint, production build, focused
content-review Electron smoke, exact-copy and route assertions, and desktop
`1180 × 780` plus narrow `390 × 844` inspection without clipping or horizontal
overflow. The full Electron smoke remains blocked before Module 2 by the
unrelated missing Module 1 review-bypass control.

**Implementation-plan page consolidation — 21 August 2026:** At the owner's
explicit request, the two standalone fictional-plan pages are retired. Their
left-side explanations are removed, while the complete fictional plan with all
completion criteria is placed beside the existing “Implementation plan là gì?”
introduction. The combined page routes directly to Practice. Saved progress on
either retired page returns to the combined introduction, and both retired IDs
are removed from saved history. This reduces the explanation slice from seven
pages to five without changing the plan artifact or Module 2/3 boundary.
Typecheck, lint, 305 unit tests, nine startup tests, a production build,
`git diff --check`, and the focused content-review Electron smoke passed.
Rendered inspection at `1180 × 780` and `390 × 844` confirmed the combined page
has no overlap, clipping, or horizontal overflow. The full Electron smoke still
stops before Module 2 at the unrelated missing Module 1 review-bypass control,
so overall Module 2 verification and acceptance are not inferred from this
scoped result.

**Implementation-plan visual refinement — 21 August 2026:** At the owner's
explicit request, the combined plan page removes the yellow outer frame and its
inset line, then rounds both the board and the white sample-document surface.
No lesson copy, route, or behavior changed. Typecheck, lint, 305 unit tests, nine
startup tests, a production build, `git diff --check`, and the focused
content-review Electron smoke passed. Rendered inspection at `1180 × 780` and
`390 × 844` confirmed the rounded treatment and no horizontal overflow. The
full Electron smoke still stops before Module 2 at the unrelated missing Module
1 review-bypass control, so overall Module 2 verification and acceptance remain
pending.

**Fullscreen responsive layout correction — 21 August 2026:** At the owner's
explicit request, the first three illustration-first Module 2 pages now place
their title and illustration in one desktop grid with a measured `16px` gap,
instead of anchoring both panels independently. The bounded Teacher copy is
centered horizontally inside its panel while remaining left-aligned for
reading. Focused Electron content review passed at `1180 × 780`, fullscreen
`1512 × 982`, increased text size, and `390 × 844`; rendered bounds confirmed
positive title-to-illustration and illustration-to-Teacher gaps, balanced text
insets, action clearance, and no horizontal overflow. The same pass inspected
the two-source reference gallery and combined implementation-plan page after
their images loaded. Typecheck, lint, production build, and `git diff --check`
passed before later unrelated concurrent edits. The current full unit rerun has
one pre-existing exact-copy mismatch after the separately edited Module 2
opening. The design-reference-link typing issue is resolved; the full Electron
rerun now stops before Module 2 at the unrelated missing Module 1 review-bypass
control. Neither blocker is treated as evidence
against the focused layout result; overall Module 2 owner approval and pilot
acceptance remain pending.

**Illustration-page vertical balance — 21 August 2026:** At the owner's explicit
request, all four illustration-led Module 2 pages now treat the Teacher
character, title or two-source gallery, and dialogue as one desktop composition.
The composition centers safely when the viewport has spare height and falls
back to top-aligned scrolling when content grows. The gallery retains two
separate image columns; assessment, Practice, copy-prompt, and lesson-board
pages keep their existing specialized layouts. No lesson copy, route, progress
state, or control behavior changed. Focused content-review Electron smoke and
production build passed at `1180 × 780`, `1512 × 982`, increased text, and the
existing narrow regression viewport. Rendered bounds confirmed at least `16px`
between the upper stage and dialogue, a `14px` gallery-column gap, balanced
top-and-bottom desktop whitespace, and no horizontal overflow. Typecheck, lint,
production build, the focused Electron journey, and `git diff --check` passed.
The full unit run has 305/307 passing tests and remains non-clean for two
separately edited Module 2 copy contracts; the full Electron journey still
stops before Module 2 at the unrelated missing Module 1 review-bypass control.
Overall Module 2 owner approval and pilot acceptance remain pending.

**Content-sized title boxes — 21 August 2026:** At the owner's explicit request,
the first three illustration-led Module 2 title boxes now opt out of CSS grid's
default cross-axis stretch, so each box ends after its content and intended
bottom padding instead of inheriting empty height from the illustration row.
No lesson copy, route, control, or image changed. The shared Electron layout
regression now measures the final title-content edge against the box's computed
padding and border. Focused content-review Electron smoke passed at `1180 ×
780`, `1512 × 982`, increased text size, and the existing narrow regression
viewport; rendered inspection confirmed the reported PRD-review title box is
content-sized. Typecheck, lint, production build, and `git diff --check` passed.
All nine startup tests passed. The full unit run remains at 305/307 because of
the same two separately edited Module 2 copy contracts. The full Electron
journey still stops before Module 2 at the unrelated missing Module 1
review-bypass control. Overall Module 2 owner approval and pilot acceptance
remain pending.

**Complete content-review route — 21 August 2026:** At the owner's explicit
request, session-only Module 2 content review now follows all 23 slides between
the combined implementation-plan introduction and the Practice entry instead
of jumping directly to Practice. The workspace and Current repo `AGENTS.md`
slides remain visible but use review-only `Tiếp tục` actions: review does not
open the folder picker, require learner self-confirmation, launch Executor, or
write a portfolio decision. The five formative groups remain interactive, and
the Practice entry retains its existing review-only bypass to mastery. The real
learner route, approved lesson copy, Practice action, persistence, and
Teacher/Executor boundaries are unchanged. The focused content-review contract
passed five tests; typecheck, lint, production build, nine startup tests,
`git diff --check`, and focused Electron smoke passed. Electron traversed all 23
slides and confirmed that persisted progress was unchanged. Desktop inspection
at `1180 × 780` confirmed visible review controls and no horizontal overflow on
the workspace and `AGENTS.md` slides. The full unit run remains at 305/307 due
to two separately edited Module 2 copy contracts, and the full Electron journey
still stops before Module 2 at the unrelated missing Module 1 review-bypass
control. This verifies the approved review route only; overall Module 2 owner
acceptance and pilot acceptance remain pending.

**Practice-setup slide retirement — 21 August 2026:** The owner superseded the
temporary 23-slide review-route decision and explicitly approved a sharper
Teacher/Executor boundary. Course Companion now teaches only the five existing
knowledge slides, then routes directly from the combined implementation-plan
page to `module-2-portfolio-practice`. The 23 setup scenes are removed from the
shared course graph, renderer registry and quiz bank; the five formative groups,
folder picker, Current repo `AGENTS.md` self-confirmation slide, examples and
stage-specific checks no longer appear in either the learner or content-review
route. Module 2 renderer metadata is consolidated to one Course Companion lesson
so deleted Practice stages cannot be mistaken for completed lessons. Saved
progress on any retired scene or old Module 2 course-lesson ID is redirected to
the Practice entry and stale scene history is scrubbed. Teacher lesson, script
and start prompt now stop after the knowledge sequence; the integration handoff
remains the authority for future Executor-owned workspace setup, project rules,
five-stage guidance, approval, resume and recovery. This does not claim the
redesigned five-document Practice is runnable: the existing runtime remains on
the old seven-artifact contract until checkpoints I1–I6 are implemented.
Scoped verification passed with 306 unit tests, nine startup tests, typecheck,
lint, production build, focused content-review Electron smoke, migration
coverage for all 23 scene IDs and desktop inspection at `1180 × 780` with no
horizontal overflow. Overall Module 2 implementation remains `in-progress`,
owner acceptance remains pending overall, and pilot acceptance remains pending.

**One-task-page deletion note — 18 August 2026:** At the owner's explicit
request, `module-2-prd-introduction` is retired. Coding-agent PRD review now
routes directly to the five-stage map; the outline, renderer registry,
active-part mapping, smoke journey, and saved-progress migration are
synchronized. Verification passed with 289 unit tests, nine startup tests,
typecheck, lint, production build, and full Electron smoke including desktop
and `390 × 844` responsive checks.

**Reference-gallery revision note — 18 August 2026:** At the owner's explicit
request, the five-stage map now teaches design planning with the supplied
Pafolios and Awwwards screenshots. The former title and roadmap panel are hidden
on this page, the two images appear side by side with source captions on desktop,
and they stack on narrow screens. Verification passed with 289 unit tests, nine
startup tests, typecheck, lint, production build, full Electron smoke, desktop
and `390 × 844` screenshot inspection, and no horizontal overflow. Module 2
remains content-reviewable rather than runnable on the redesigned five-document
contract; owner acceptance and pilot acceptance remain pending.

**Design-reference links note — 21 August 2026:** At the owner's explicit
request, the five source names in the design-planning explanation—Pafolios,
Awwwards, Dribbble, Mobbin, and Pinterest—are interactive external links. Each
link preserves the approved lesson wording, has visible hover and keyboard-focus
states, opens the HTTPS destination in the learner's default browser, and leaves
the current Course Companion page in place. The two focused link contract tests,
typecheck, lint, production build, nine startup tests, `git diff --check`, and
focused content-review Electron smoke passed. Automated hover/focus assertions
and rendered inspection at `1512 × 982` and `390 × 844` confirmed visible link
states, positive gallery-to-dialogue spacing, and no horizontal overflow. The
full unit run has 306 passing tests and one pre-existing exact-copy mismatch in
the separately edited Module 2 opening. The full Electron journey stops before
Module 2 at the unrelated missing Module 1 review-bypass control. Overall Module
2 owner approval and pilot acceptance remain pending.

**History-review dialogue spacing — 21 August 2026:** At the owner's explicit
request, Module 2 history review now keeps its long Teacher copy in a centered
`980px` reading column while preserving left-aligned prose. The review dialogue
moves `16px` lower, and “Trang trước” plus “Quay lại trang đang học” share the
same bottom action line instead of occupying different vertical positions. No
lesson copy, route, progress state, or button behavior changed. Typecheck, lint,
production build, `git diff --check`, and focused content-review Electron smoke
passed. Rendered bounds at the supported desktop sizes `1180 × 780` and
`1512 × 982` confirmed balanced text insets, visible space above the lowered
dialogue, aligned control bottoms, positive copy-to-control clearance, and no
clipping or horizontal overflow. The full unit run remains non-clean only for
the pre-existing exact-copy mismatch in the separately edited Module 2 opening;
the full Electron journey still stops before Module 2 at the unrelated missing
Module 1 review-bypass control. Overall Module 2 owner approval and pilot
acceptance remain pending.

**Copyable Practice prompt note — 18 August 2026:** At the owner's explicit
request, the Module 2 Practice transition replaces its title and scope panel
with a concise prompt that the learner can copy before opening Codex. The prompt
now starts from a first-time learner's uncertainty, guides a one-question-at-a-time
planning interview, offers plain-language choices when needed, and requests a
summary plus approval at each important decision. It does not expose stage or
module terminology, while keeping code, dependencies, and application creation
outside the planning conversation. The lower Teacher dialogue uses the owner's
supplied wording, and the desktop prompt card is centered on the viewport's
vertical axis.
Verification passed with 289 unit tests, nine startup tests, typecheck, lint,
production build, Electron assertions through the revised page, exact
clipboard-content verification, an exact desktop vertical-alignment assertion,
desktop and `390 × 844` screenshot inspection, and no horizontal overflow. A
subsequent full Electron journey passed with the four-item outline revision.
Owner acceptance and pilot acceptance remain pending.

**Outline-item removal note — 18 August 2026:** At the owner's explicit request,
the “Năm giai đoạn, năm tài liệu” entry is removed from the Module 2 outline
menu. Its lesson scene and forward route remain intact; the design-reference
page now shares the preceding outline section, and the Practice transition is
the fourth and final menu item. Verification passed with 289 unit tests, nine
startup tests, typecheck, lint, production build, full Electron smoke, desktop
and `390 × 844` screenshot inspection, and no horizontal overflow. Owner
acceptance and pilot acceptance remain pending.

**Mastery-question removal note — 18 August 2026:** At the owner's explicit
request, the unclear certificate/privacy scenario is removed from Module 2
Practice. The final mastery review now contains five multiple-choice scenarios
and four learner-owned answers. Its scene inventory, completion requirement,
summary copy, persisted decisions, and tests all use the nine-question contract.
Saved progress paused on the retired question advances to the next remaining
scenario and removes the obsolete answer, while already completed legacy
receipts remain readable. Verification passed with 290 unit tests, nine startup
tests, typecheck, lint, production build, full Electron smoke, and
`git diff --check`. Overall owner acceptance and pilot acceptance remain
pending.

**Mastery-introduction simplification note — 18 August 2026:** At the owner's
explicit request, the Module 2 mastery introduction no longer renders the title
or evidence panel. Its lower Teacher dialogue now contains only the supplied
review invitation, while the existing previous and continue controls remain
available. Verification passed with 290 unit tests, nine startup tests,
typecheck, lint, production build, full Electron smoke through the 9/9 summary,
desktop and `390 × 844` screenshot inspection, and no horizontal overflow.
Overall owner acceptance and pilot acceptance remain pending.

**Lesson-aligned mastery rewrite note — 18 August 2026:** After the owner's
explicit approval, all nine final review questions now use contextual, natural
Vietnamese tied to the Module 2 lesson. The five multiple-choice scenarios cover
when planning is necessary, the purpose of a PRD, PRD review, learner decision
ownership, and responsible use of visual references. The four learner-owned
answers retain current portfolio evidence while adding plain-language context.
Question count, Teacher-led one-at-a-time delivery, Practice separation, and
completion contracts remain unchanged. Verification passed with 291 unit tests, nine
startup tests, typecheck, lint, production build, full Electron smoke through
the 9/9 summary, and `git diff --check`. Overall owner acceptance and pilot
acceptance remain pending.

**Group-level Course Companion assessment note — 18 August 2026:** At the
owner's explicit request, Course Companion now presents every question in the
current quiz group before submission. The learner submits the complete group
once, then sees per-question results, explanations, criteria, and sources. An
incorrect multiple-choice answer can be revised and resubmitted while the other
answers remain available; the interface never advances automatically. Written
answers still require explicit self-review against their published criteria.
Teacher-led quiz delivery in conversation remains one question at a time.
Verification passed with 291 unit tests, nine startup tests, typecheck, lint,
production build, full Electron smoke through a deliberately incorrect answer,
correction, resubmission, and the 9/9 summary, desktop and `390 × 844`
screenshot inspection, no horizontal overflow, and explicit assertions that the
in-flow “Trang trước” control does not overlap any question card. Overall owner
acceptance and pilot acceptance remain pending.

**Assessment title-bar removal note — 18 August 2026:** At the owner's explicit
request, Module 2 quiz groups no longer render a standalone title/status banner
above the assessment. The assessment surface moves into the released space
directly below the HUD, while Module 1's frozen assessment presentation remains
unchanged. The Course Companion UI guidance now requires explicit owner
direction before adding a similar standalone banner in future work. Verification
requires desktop and `390 × 844` inspection, no horizontal overflow, and
assertions for the missing title, compact HUD-to-content gap, and non-overlapping
back control. The owner's direction for this bounded revision is explicit;
review of the implemented result, overall Module 2 acceptance, and pilot
acceptance remain pending.

**Assessment intro removal note — 18 August 2026:** At the owner's explicit
follow-up request, Module 2 quiz groups now begin directly with the first
question card. The Teacher identity, pre-submit introduction, group title,
question-count badge, and repeated submission guidance are not rendered above
the questions. The underlying quiz content and submission behavior remain
unchanged. Verification requires desktop and `390 × 844` inspection, no
horizontal overflow, absent intro/header elements, and a compact first-question
offset from the assessment container. Review of the implemented result, overall
Module 2 acceptance, and pilot acceptance remain pending.

**Five-question mastery note — 18 August 2026:** At the owner's explicit
request, the visual-reference scenario and the learner-owned scope, evidence,
and requirement-validation questions are removed from Module 2. The final
review now contains four multiple-choice scenarios and one learner-owned answer.
The retired question scenes, completion contract, persisted decisions, summary
count, and tests use the five-question contract. Saved progress on a retired
question returns to the first current review question and removes obsolete
answers, while historical nine- and ten-question completion receipts remain
readable. Verification passed with 291 unit tests, nine startup tests,
typecheck, lint, production build, full Electron smoke through the 5/5 summary,
and `git diff --check`. Overall owner acceptance and pilot acceptance remain
pending.

**Unscored PRD reflection copy note — 21 August 2026:** At the owner's explicit
request, the fifth Module 2 question no longer publishes marking criteria. Its
post-answer explanation now uses the exact supplied sentence: “Câu hỏi này
không tính điểm, nó chỉ tạo cơ hội cho bạn tự xem lại PRD của mình”. The
question, submission behavior, and surrounding assessment copy are unchanged.
The two focused assessment-contract checks, typecheck, lint, production build,
focused content-review Electron smoke, and `git diff --check` passed. The full
unit suite remains blocked by the pre-existing `mastery-5` wording assertion;
the full Electron smoke was stopped while still running after the owner narrowed
this task to copy only. Overall Module 2 owner acceptance and pilot acceptance
remain pending.

**Direct-to-summary assessment note — 21 August 2026:** The owner explicitly
approved removing the post-submit feedback step from the Course Companion
Module 2 final group. The learner still answers and submits all five questions
once; submission now saves the fifth unscored PRD reflection as self-reviewed
and opens `module-2-portfolio-mastery-summary` in the same progress update. The
separate “Xem kết quả 5 câu” action and fifth-question self-confirmation action
are no longer encountered in this flow. If any of the first four scored choices
is incorrect, the summary keeps “Làm lại 5 câu”; real Module 2 completion remains
disabled until all five saved results are current and correct. Teacher-led
one-question-at-a-time delivery and assessment behavior in other modules remain
unchanged. The focused contract test, typecheck, lint, production build and
focused Electron content-review journey passed. Electron verified direct
summary navigation after an intentionally incorrect first choice, full-group
retry, correct resubmission and continuation to Module 3. The complete unit run
remains at 309/310 because of the separately edited `mastery-5` wording
assertion. The complete Electron journey still stops before Module 2 at the
unrelated missing Module 1 review-bypass control. This bounded behavior has
owner approval; overall Module 2 owner acceptance and pilot acceptance remain
pending.

**Current checkpoint reconciliation — 22 August 2026:** The `mastery-5`
contract assertion now follows the approved current wording without changing
learner copy. The complete unit run passes 310/310; all nine startup tests,
typecheck, lint, and the production build pass. Full Electron smoke still stops
before Module 2 at the unrelated missing Module 1 review-bypass control, so
overall Module 2 and Module 3 verification remain `blocked`, not failed.

**Portfolio `AGENTS.md` setup note — 18 August 2026:** At the owner's explicit
request, workspace selection now leads to a dedicated setup page before the
four explanation pages. It presents the complete approved English portfolio
working-agreement template, tells the learner to keep the learning application
open while Codex creates the file, and advances only after the learner confirms
completion. Course Companion does not inspect or grade the file. The desktop
layout separates the guidance and scrollable prompt into two non-overlapping
columns; the narrow layout stacks them without horizontal overflow. Verification
passed with 292 unit tests, nine startup tests, typecheck, lint, production
build, full Electron smoke with clipboard verification, responsive DOM checks
without screenshots, and `git diff --check`. Overall Module 2 owner acceptance
and pilot acceptance remain pending.

**HTML visual-prototype guidance note — 18 August 2026:** At the owner's
explicit request, the Module 2 design-reference page now explains that a learner
can ask a coding agent for an HTML visual prototype before the real product is
built. The learner lesson and Teacher script define it immediately as a browser-
viewable interface sample, use it for learner review and design approval, and
keep actual product construction in Module 3. Verification passed with 294 unit
tests, nine startup tests, typecheck, lint, production build, full Electron
smoke, rendered-copy coverage, desktop and `390 × 844` screenshot inspection,
responsive no-overflow assertions, and `git diff --check`. Overall Module 2
owner acceptance and pilot acceptance remain pending.

**Implementation-plan walkthrough note — 19 August 2026:** At the owner's
explicit request, Module 2 now includes a fictional implementation plan for
Mai's UX Designer portfolio. One page shows the whole format; four following
pages highlight requirements and boundaries, ordered stages, expected files and
visible checks, then risks, assumptions, and the approval stop. The learner
lesson and Teacher script define the term when it first appears, and the full
example is stored under `pilot-workspace/course/examples/`. The app labels the
sample as fictional and not an answer, never requires code reading, and keeps
the real Practice and completion contract unchanged. Verification passed with
295 unit tests, nine startup tests, typecheck, lint, production build, full
Electron smoke, and desktop plus `390 × 844` rendered inspection without
horizontal overflow. Overall Module 2 owner acceptance and pilot acceptance
remain pending.

### M2.6 — Complete the Module 2 gate and handoff

**Change**

1. Require all five current documents, five stage receipts, learner approval,
   and mastery evidence.
2. Generate a plain-language completion summary: what the learner decided,
   which evidence is missing or bounded, the approved implementation sequence,
   and what is deliberately out of scope. Do not claim a first implementation
   task was created in Module 2.
3. Unlock Module 3 only after the completion receipt is saved atomically.
4. Pass Module 3 the workspace path and artifact references, not the old chat
   transcript as hidden context.
5. Make Module 3's first action read the five current documents, propose one
   bounded implementation task with technology/dependency/file consequences,
   and wait for learner approval before writing application code.

**Verify**

- Gate rejects stale artifact digests, incomplete validation coverage inside
  the implementation plan, hidden implementation/task creation, or missing
  learner approval.
- Relaunch after completion opens Module 3 readiness without losing Module 2
  evidence.
- The completion handoff contains exactly the five current planning references
  and no reference to a retired validation-map or first-task document.
- Reset and targeted Module 2 recovery remain functional.

**Checkpoint output:** Verified Module 2 completion and explicit Module 3 input
contract.

### Module 2 acceptance gate

Module 2 is accepted only when:

- its Pilot lesson, script, prompt, quiz, templates, and Practice definition are
  synchronized;
- Course Companion completes the full new Module 2 journey using a disposable
  learner portfolio folder;
- exactly five explanation pages lead to one persistent Practice task;
- all five planning documents are reviewed semantically on their current
  digests, and Stage 5 stops at the implementation plan;
- the same Executor thread remains bound through all five stages and every
  **Yêu cầu sửa** cycle;
- Module 3 stays locked before the combined evidence/mastery gate;
- Module 3 proposes and waits for approval of the first concrete task instead
  of receiving one created in Module 2;
- the full Course Companion verification suite passes;
- a manual beginner-language review finds no hidden coding prerequisite;
- a disposable-workspace rehearsal proves no application source, dependency,
  command execution, or deployment work occurs in Module 2;
- the Module 2 implementation is committed locally in scoped checkpoints.

Do not author or implement Module 3 course content before this gate is accepted.

---

## Module 3 — Implement and debug in verified slices

### Module outcome

The learner continues the Codex task used in Module 2 and turns the approved PRD
and implementation plan into a working portfolio one part at a time. The
learner checks visible behavior after each part, gives the coding agent useful
debugging evidence when something fails, and understands how Git, GitHub,
commit, push, and branch protect the work without having to perform the
technical commands personally.

### Decision gate before Module 3 authoring

The approved curriculum defers exact desktop and mobile viewport values. Before
writing visual assertions, present one small decision packet. Recommended pilot
default: one common desktop viewport and one narrow mobile viewport, used
consistently in instruction, screenshots, and smoke tests. The values may be
recalibrated after pilot evidence, but the same release must not use conflicting
values.

### M3.1 — Lock the module manifest, lessons, and artifacts

**Change**

1. Add Module 3 and its four learner-facing sections to
   `course-structure.json`: debugging, Git and GitHub, Practice, and final
   mastery. Keep the implementation-loop checkpoint as an internal technical
   boundary rather than a learner-facing section.
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

### Approved learner-facing redesign — 19 August 2026

The owner approved a content-first redesign that removes implementation-plan
instruction from Module 3 because that instruction belongs in Module 2. The
learner-facing route now teaches the implementation loop, three debugging
situations, Git and GitHub concepts, one continuous Practice, and five final
questions. Questions do not interrupt the explanation pages. The original five
Practice stages and four build slices below remain internal evidence and
recovery boundaries; they are not exposed as separate learner navigation or a
checklist the learner must manage.

### Practice-transition slide retirement — 21 August 2026

The owner explicitly approved removing the redundant
`module-3-practice-intro` setup slide so Course Companion keeps the knowledge
sequence while Practice/Executor owns working instructions. All 11 knowledge
scenes remain unchanged apart from the final branch CTA, which now opens
`module-3-portfolio-practice` directly. The real Practice page, five-section
outline, five-question mastery assessment, completion gate, Pilot lesson,
Teacher script, start prompt and six illustrations remain. Saved progress on
the retired slide, `module-3-enhancement-intro` or
`module-3-check-enhancement-boundary` now resumes at the real Practice page and
removes stale retired IDs from history.

Focused verification passed with 47 registry, progress, Module 3 content and
content-review tests, nine startup tests, typecheck, lint, production build,
`git diff --check` and the focused Electron content-review journey. Desktop
inspection at `1440 × 900` confirmed the Practice page appears immediately
after branch without horizontal overflow. The complete unit run has 308/309
passing tests and stops
at an unrelated Module 2 copy assertion. The complete Electron journey still
stops before Module 2 at the unrelated missing Module 1 review-bypass control.
Neither blocker is attributed to this Module 3 route change, and overall owner
approval and pilot acceptance remain `pending`.

The 22 August checkpoint reconciliation resolves that Module 2 assertion, and
the current complete unit run passes 310/310. Full Electron smoke remains
blocked at the same unrelated Module 1 control before reaching Module 3.

### Prompt-example presentation refinement — 20 August 2026

The owner approved replacing the Teacher dialogue that repeated the prompt
already visible inside the error-report illustration with one short explanation
of how to apply the example. The illustration alone receives a scene-specific
desktop width increase from `440px` to `500px`; narrow layouts continue using
the full available width without horizontal overflow. Focused content tests,
lint, all 302 unit tests, nine startup tests, a direct Electron/Vite production
build, and focused Electron inspection at `1440 × 900` and `390 × 844` passed.
The owner then removed the standalone log-definition sentence from the next
debugging page while preserving its surrounding guidance.
Full-suite blockers remain recorded in the progress ledger and do not count as
owner acceptance or pilot acceptance.

### Opening-page consolidation — 20 August 2026

The owner approved merging the first two implementation-loop explanation pages
into one page titled “Thực hiện Implementation Plan, từng bước một.” The merged
page preserves both approved dialogue blocks in their existing order and routes
directly to the debugging section. Saved progress on the retired second page is
redirected to the merged opening so a returning learner does not resume at an
invalid scene. Focused registry, progress-migration, content-contract, desktop,
and `390 × 844` Electron checks passed. The full Electron smoke remains failed
at the unrelated pre-Module-3 review-only mismatch recorded in the progress
ledger; this consolidation does not claim the overall Module 3 gate has passed.

### Opening-page retirement — 25 August 2026

The owner explicitly approved deleting the remaining Module 3 implementation-
loop opening page, `module-3-readiness`. Module 3 now opens directly on
`module-3-debugging-intro`; Module 2 completion receipts and content-review
routing use that destination. The implementation-loop checkpoint remains an
internal technical boundary under the debugging lesson. Saved progress on the
deleted page and older opening-page IDs is redirected to the debugging page so
returning learners do not reach an invalid scene. The Pilot lesson source,
Course Companion registry, content contracts and smoke expectations no longer
expose the deleted page or its copy. Overall owner approval and pilot acceptance
for Module 3 remain `pending` until the existing acceptance gate is completed.

### Module 3 dialogue-width balancing — 25 August 2026

The owner approved checking the opening-page alignment issue across Module 3.
All explanatory pages with one primary action now use a Module-3-scoped
`1200px` maximum dialogue width instead of the shared `1050px` limit. This lets
longer Vietnamese lines extend beyond the left edge of the yellow action button
and balances the dialogue panel without changing Module 1, Module 2, Module 4,
Practice or assessment layouts. Focused content-contract tests, typecheck, lint,
build and `git diff --check` passed. Electron inspection at `1440 × 900`
confirmed the wider opening, visible-error and prompt-example pages without
horizontal overflow or overlap. The focused content-review smoke then stopped
at an existing uncommitted repeated-error title expectation before the remaining
Module 3 screenshots; this does not establish overall Module 3 acceptance.

### Module 3 keyword highlighting — 25 August 2026

**Implementation:** implemented. The owner approved highlighting important
Module 3 terminology throughout the explanatory Teacher dialogue while leaving
Practice and assessment pages unchanged. Scene-owned keyword metadata now
covers the debugging terms `implementation plan`, `bug`, `debugging`, `prompt`,
`screenshot`, `terminal`, `log` and `nguyên nhân gốc`, followed by the Git terms
`Git`, `hệ thống quản lý phiên bản`, `phân tán`, `repository`, `GitHub`, `commit`,
`push`, `branch` and `phiên bản ổn định`. A shared renderer matches longer
overlapping terms first, preserves the approved source text and wraps matches
in semantic `mark` elements. After reviewing the initial yellow-background
treatment, the owner explicitly replaced it with bold yellow text on a
transparent background.

**Verification:** blocked overall. Focused term-segmentation and content-contract
tests, typecheck, lint, all 314 unit/startup tests, production build and
`git diff --check` passed. The focused Electron content-review journey passed
and desktop inspection at `1440 × 900` confirmed the Debug, repeated-error,
Git/GitHub and Commit pages remain readable without clipped text, overlap or
horizontal overflow. The required full Electron smoke still stops at the
pre-existing Module 1 review-bypass control before reaching Module 3. Owner
approval applies to this highlight treatment only; overall Module 3 approval
and pilot acceptance remain `pending`.

### Pre-Practice recap page — 25 August 2026

**Implementation:** `implemented`. The owner approved one new recap page after
`module-3-git-branch` and before `module-3-portfolio-practice`. Its heading and
four bullets preserve the supplied wording exactly, including the requested
debug, commit, branch and GitHub reminders. The page does not add an
implementation-plan reminder. The Pilot lesson, Teacher script, start prompt,
content-design draft, typed shared registry, renderer registry, focused content
contracts and Electron journey are synchronized. The retired
`module-3-practice-intro` scene remains retired.

**Verification:** `blocked` overall. The two focused registry/content-contract
files pass 22/22 tests; typecheck, lint, all 314 unit tests, nine startup tests,
production build and `git diff --check` pass. The focused Electron
content-review journey passes. Its `1440 × 900` screenshot and automated bounds
checks confirm the new page has positive title-to-dialogue and text-to-action
gaps, remains inside the viewport and has no horizontal overflow. The required
full Electron smoke launches but still stops at the pre-existing Module 1
review-bypass control before reaching Module 3. Owner approval applies to this
recap page only; overall Module 3 approval and pilot acceptance remain
`pending`. The next permitted action remains reconciling that unrelated Module
1 review-only mismatch, rerunning the full Electron smoke, then presenting the
overall Module 3 evidence for owner review.

### Summary-panel presentation simplification — 20 August 2026

The owner approved removing the generic right-side lesson summary panels while
retaining scene titles, real illustrations, specialized lesson boards, Practice,
assessments, and navigation. The common renderer no longer creates
`.pixel-consequence` or `.pixel-scene-summary`; the approved lesson copy remains
in the source contracts unchanged. Typecheck, lint, all 303 unit tests, nine
startup tests, a production build, `git diff --check`, and focused Electron
inspection of both the summary-free repeated-error page and the
illustration-preserving visible-error page passed at `1440 × 900` and
`390 × 844` without horizontal overflow or overlap. Overall verification remains
`failed` because the full Electron smoke still stops at the unrelated missing
Module 1 review-bypass control before reaching Module 3. This decision has owner
approval only for the presentation change; overall owner approval and pilot
acceptance remain `pending`. The next permitted action is to reconcile that
review-only mismatch without weakening the real Practice gate, then rerun the
full Electron smoke.

### Git and GitHub visual replacement — 20 August 2026

The owner supplied a Git and GitHub illustration for the Git/GitHub explanation
page and approved removing that page's standalone right-side title box. Only
`module-3-git-github` sets `showTitle: false`; its approved dialogue and
navigation remain unchanged. The supplied `1200 × 600` image uses `contain`,
occupies the former title region at desktop size, and returns to full-width
normal flow in the narrow layout. Typecheck, lint, all 304 unit tests, nine
startup tests, a production build, `git diff --check`, and the focused Electron
content-review journey passed. Rendered inspection at `1440 × 900` and
`390 × 844` confirmed the title is absent, the image is decoded at its native
dimensions, and neither viewport has horizontal overflow. Overall verification
remains `failed` because the complete Electron smoke still stops later at the
unrelated missing Module 1 review-bypass control. Overall owner approval and
pilot acceptance remain `pending`; the next permitted action is unchanged.

### Commit-history layout repair — 20 August 2026

The owner approved a scene-specific repair for `module-3-git-commit` after the
long dialogue overlapped its commit-history illustration in a short desktop
window. The scene now places its title, illustration, and dialogue in successive
grid rows with a positive gap; short desktop windows scroll the page instead of
allowing the independently anchored panels to intersect. The existing narrow
one-column flow remains unchanged, and all learner-facing copy, illustration,
navigation, and behavior are preserved. Typecheck, lint, all 304 unit tests,
nine startup tests, a production build, and `git diff --check` passed. The
focused Electron content-review journey measured at least a `16px` illustration-
to-dialogue gap at `1440 × 900` and `1180 × 664`, at least `10px` at
`390 × 844`, and no horizontal overflow at any viewport. Rendered screenshots
at all three sizes were inspected; an additional `22px` text-size check kept
the illustration visible and preserved at least `10px` between the dialogue
text and its navigation controls. The complete Electron smoke still stops at
the unrelated missing Module 1 review-bypass control before reaching Module 3,
so overall verification remains `failed`, owner approval remains `pending`
overall, pilot acceptance remains `pending`, and the next permitted action is
unchanged.

### Commit-history authoring-note removal — 20 August 2026

The owner identified one paragraph on `module-3-git-commit` as an internal
authoring note rather than learner-facing Teacher dialogue and explicitly
approved its removal. The exact paragraph was removed from the content-design
draft, the Pilot lesson authority, and the Course Companion scene without
changing the surrounding copy, illustration, navigation, or behavior. A
repository search found no remaining copy. Typecheck, lint, all 305 unit tests,
nine startup tests, a production build, `git diff --check`, and the focused
Electron content-review journey passed. The rendered scene was inspected at
`1440 × 900` and `390 × 844`; the paragraph is absent and the layout retains
positive gaps without horizontal overflow. The complete Electron smoke still
stops at the unrelated missing Module 1 review-bypass control before reaching
Module 3, so overall verification remains `failed`, owner approval remains
`pending` overall, pilot acceptance remains `pending`, and the next permitted
action is unchanged.

### Repeated-error Codex prompt illustration — 20 August 2026

The owner approved a course-created Codex mockup and requested its placement on
`module-3-repeated-error`. The `1200 × 650` illustration shows a learner asking
the coding agent to stop editing, list possible causes, and check each cause
against evidence. Its source record identifies the scene as a simulation rather
than data from a live Codex task. The approved dialogue, route, and navigation
remain unchanged. The illustration uses the existing `contain` treatment, a
`500px` desktop width, and the full available width in the narrow layout.
Typecheck, lint, all 305 unit tests, nine startup tests, a production build, and
the focused Electron content-review journey passed. Rendered inspection at
`1440 × 900` and `390 × 844` confirmed that the image decodes, no horizontal
overflow occurs, and the title, illustration, and dialogue retain positive
gaps without overlap. The complete Electron smoke still stops at the unrelated
missing Module 1 review-bypass control before reaching Module 3, so overall
verification remains `failed`. This decision has owner approval only for the
new illustration; overall owner approval and pilot acceptance remain `pending`,
and the next permitted action is unchanged.

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

1. Continue the same Codex task and learner workspace used by
   `m2-portfolio-planning`; do not ask the learner to create or choose another
   task when the valid Module 2 handoff is available.
2. Present one learner-facing Practice rather than five milestone pages. Keep
   the five stages and four build slices as internal evidence and recovery
   boundaries.
3. In Teacher Triết, show `Hoàn thành bài` and `Xem objective` as the two main
   Practice actions. Do not ask the learner to inspect code, diffs, stage
   receipts, or technical metadata.
4. When the learner chooses `Hoàn thành bài`, collect current file, command,
   browser, debugging, enhancement, summary, and learner-approval evidence.
   Return either a passed review or a plain-language list of what remains.
5. Require a passed current Practice review and all five final mastery answers
   before saving the atomic Module 3 completion receipt and unlocking Module 4.

**Verify**

- Relaunch/resume preserves the continuous Practice task and its internal
  milestone/slice evidence.
- Stale PRD or design direction produces an explicit reconciliation path.
- The learner does not see stage navigation, while the final review still
  rejects missing or stale internal evidence.
- Module 4 remains locked until both product and learner-ownership gates pass.

**Checkpoint output:** Complete live Module 3 journey and reliable gate.

### Module 3 acceptance gate

Module 3 is accepted only when:

- a disposable learner workspace starts with planning artifacts but no app;
- the approved scaffold creates a neutral app and passes all three learner
  commands;
- the same Codex task continues from Module 2 and current internal evidence
  covers four build slices, one revision, one debugging investigation, and one
  enhancement;
- desktop/mobile, keyboard, focus, image, navigation, and console checks are
  represented honestly;
- Course Companion resumes the continuous Practice without exposing internal
  stage navigation;
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
284 unit tests, nine startup tests, production build, desktop and narrow
screenshot inspection, and Electron smoke. The owner-approved review-UI
simplification removes the two redundant status banners and dedicated header
exit control while preserving session-only routing, the Home Base exit, and
persisted-progress protection. The content itself still requires owner review.

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
| Teacher-led one-question-at-a-time assessment | — | Required | Required | Required |
| Course Companion group submission and post-submit route | Regression | Direct summary + full-group retry | Feedback + retry | Feedback + retry |
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
3. Introduction remains unchanged. Module 1 differs only through the approved
   Module 2 transition copy, Harness Engineering removal, and the new
   `AGENTS.md` and Skills lesson, with synchronized references, checkpoints,
   assessment boundaries, and progress migration.
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
