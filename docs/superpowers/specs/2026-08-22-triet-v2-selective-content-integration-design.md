# Triet V2 selective content integration

**Date:** 22 August 2026
**Status:** Owner-approved design; implementation pending
**Source:** `origin/Triet-V2-planning` at `283c455`
**Destination:** `feature/course-companion-practice-workflow`

## Objective

Integrate the newly approved Module 2 and Module 3 course content and the Course
Companion changes required to render and resume that content, while preserving
the destination branch as the authority for every Practice workflow contract.

The incoming branch contains both streams. Its content stream adds revised
lessons, assessments, visuals, scene topology, navigation, saved-progress
redirection, reference links, and supporting desktop UI. It also changes shared
Practice boundaries, including weakening Module 3 completion from five stage
receipts and four build-slice receipts to zero. Those Practice changes are not
part of the approved integration.

## Integration strategy

Use an ancestry-preserving merge so the repository records that the incoming
content branch was integrated. Perform it without an automatic commit, then
audit the resulting tree semantically rather than accepting only conflict-free
Git results.

Three approaches were considered:

1. A normal merge would preserve history but could silently accept unconflicted
   Practice regressions.
2. Cherry-picking content commits would avoid a merge resolution, but the
   content is distributed across merge commits and coupled application changes,
   creating a material omission risk.
3. A selective ancestry-preserving merge retains history and dependencies while
   allowing explicit Practice restoration and mixed-file hunk review.

The third approach is approved.

## Incoming scope to adopt

- Module 2 and Module 3 learner-facing lessons, scripts, prompts, quizzes, scene
  copy, approved assessment questions, and course outline changes.
- New and updated lesson visuals with their source records.
- The consolidated Module 2 and Module 3 scene topology and ordinary lesson
  navigation.
- Safe progress redirections from retired content scenes and assessment IDs to
  current content destinations.
- Course-app components and styles required by the new content, including
  design-reference links, layout support, and safe external HTTPS handling.
- Content-focused tests and Electron journey changes required to verify the new
  course flow.
- Planning records that directly define or evidence the incoming content.

Learner-facing incoming copy is preserved verbatim unless a Practice-authority
conflict makes that copy ineligible for this merge.

## Practice authority to preserve

The destination branch remains authoritative for:

- one active Practice and exact persisted task binding;
- non-owning `thread/read` review and the saved `thread-start` plus later-update
  configuration model;
- refusal to resume, start, switch, or infer the learner's task;
- Teacher/Executor separation and the Practice-only structured review surface;
- guide step 5 semantic `review-requested` advancement, step 6 return gating,
  step 7 confirmation, replay behavior, and stranded-state repair;
- Module 3's five stage receipts and four nested build-slice receipts;
- freshness, artifact-digest, learner-approval, current-check, browser-evidence,
  mastery, and completion gates;
- current Practice definitions, evidence adapters, review envelopes, lifecycle,
  handoff, invalidation, return, and recovery behavior; and
- the real-runtime and bound-task diagnostics added after the empty-task
  metadata regression.

The new Module 3 teaching sequence and its learner-facing transition into
Practice are adopted. The transition continues into the destination branch's
existing strict Practice contract; it does not reduce or bypass the evidence
required for completion.

## Mixed-file resolution

Files that contain both content/progression and Practice behavior are resolved
hunk-by-hunk.

- `progress-repository.ts` may adopt retired-scene and retired-assessment
  redirections, while retaining authoritative Practice state and completion
  invariants.
- `portfolio-module-completion-service.ts` may adopt the new mastery question
  IDs and summaries, while retaining five stage receipts, four build-slice
  receipts, current artifact digests, current checks, browser evidence, and
  learner approval.
- `course-structure.json` may adopt new lesson titles, topology, and checkpoint
  placement, while retaining `requiresStageReceiptCount: 5` and
  `requiresNestedBuildSliceReceiptCount: 4`.
- `m3-portfolio-build.json` remains on the destination Practice contract. New
  transition copy may be used outside the Practice definition, but the Practice
  objective, expected evidence, steps, and completion destination are not
  weakened.
- `LearningWindow.tsx`, `styles.css`, and `electron-smoke.mjs` adopt the new
  course experience while preserving existing Practice controls, guide anchors,
  semantic review progression, and end-to-end assertions.
- `portfolio-course-implementation-plan.md` is reconciled chronologically: new
  content evidence is added without overwriting the later 22 August Practice
  regression repair or changing approval and acceptance states without evidence.

Incoming root or scoped `AGENTS.md` policy changes are excluded from the merge.
They are repository-governance changes rather than course content or required
Course Companion behavior and require separate owner consideration.

## Page and copy preservation

Before committing, compare the learner-facing scene and navigation inventory
against both parents.

- Removals explicitly represented by the approved incoming content topology are
  accepted and covered by progress redirects.
- No other existing page, scene, route, navigation target, or Practice surface
  may be lost, orphaned, or made unreachable.
- Destination Practice copy remains unchanged.
- Incoming approved course copy is not rewritten during conflict resolution.

## Verification design

Verification is layered so content success cannot mask a Practice regression.

### Static and contract checks

- Validate course registry, scene graph, lesson/quiz IDs, reference links,
  progress redirects, page inventory, and frozen introduction/Module 1 scope.
- Audit every changed Practice-sensitive source and test file against the
  destination branch.
- Search for weakened receipt counts, bypasses, mock completion shortcuts,
  `thread/resume`, focused-window inference, direct Teacher chat during Practice,
  and generic step-5 guide advancement.
- Run TypeScript typecheck, ESLint, and `git diff --check`.

### Dynamic application checks

- Run focused Module 2 and Module 3 content and progression tests.
- Run focused Practice metadata, snapshot, review, guide, lifecycle, completion,
  return, invalidation, concurrency, and recovery tests.
- Run the complete unit/integration suite and startup suite.
- Build the production Electron application and run the full Electron journey,
  including the new content and Practice guide steps 5 through 7.

### Real-runtime Practice checks

- Run the isolated installed-App-Server empty-task diagnostic.
- Run the production metadata reader read-only against the exact currently bound
  Practice task.
- Confirm the verifier remains non-owning and the saved baseline is used when no
  later settings event exists.

## Completion and records

After verification, re-read the affected Foundation, Module 2, and Module 3
checkpoints and synchronize the implementation ledger with exact commands,
counts, failures, and remaining gaps. Do not infer overall owner approval or
pilot acceptance. The final merge commit must contain only the approved content,
required Course Companion support, Practice-preserving resolutions, tests, and
synchronized records.

## Non-goals

- Redesigning or simplifying the Practice workflow.
- Adopting incoming weakened evidence or completion gates.
- Changing repository governance or device-scope policy.
- Rewriting approved course copy during integration.
- Advancing Module 4 implementation or acceptance.
