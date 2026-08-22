# Triet V2 selective content integration implementation plan

**Design:** `docs/superpowers/specs/2026-08-22-triet-v2-selective-content-integration-design.md`
**Source:** `origin/Triet-V2-planning` at `283c455`
**Destination:** `feature/course-companion-practice-workflow`

## 1. Capture integration baselines

- Require a clean destination worktree and record the source, destination, and
  merge-base commits.
- Capture the destination Practice-sensitive file inventory and the incoming
  learner-facing scene/navigation inventory.
- Record files changed on both sides and mixed course/Practice files that need
  hunk-level review.

## 2. Start an ancestry-preserving selective merge

- Merge `origin/Triet-V2-planning` with `--no-commit --no-ff`.
- Resolve textual conflicts without rewriting either branch's approved course
  copy.
- Exclude incoming root and scoped `AGENTS.md` changes.
- Preserve destination versions of Practice-only source, definitions, tests,
  diagnostics, and planning records unless an incoming course dependency is
  explicitly integrated hunk-by-hunk.

## 3. Integrate course content and required app support

- Adopt Module 2 and Module 3 lessons, scripts, prompts, quizzes, visuals,
  renderer scenes, module definitions, registry topology, and reference links.
- Adopt safe external HTTPS handling, content layout support, and content-state
  migration required by the new scenes.
- Adopt incoming content tests and reconcile the Electron journey with the new
  scene topology.
- Include only planning artifacts that directly document or evidence the
  incoming content.

## 4. Preserve Practice authority in mixed files

- Keep Module 3 completion at five stage receipts and four nested build-slice
  receipts in `course-structure.json` and completion services.
- Keep the destination `m3-portfolio-build.json` Practice objective, expected
  evidence, steps, review, and completion contract.
- Preserve exact-task metadata recovery, saved baseline plus update precedence,
  non-owning review, Teacher/Executor boundaries, lifecycle release, guide
  steps 5–7, and stranded-state repair.
- Reconcile `progress-repository.ts` so new retired-scene/assessment redirects
  coexist with unchanged Practice state and completion invariants.
- Reconcile `electron-smoke.mjs` so it covers the new content and still asserts
  semantic Practice review advancement.
- Reconcile the implementation ledger chronologically without overwriting the
  22 August Practice repair evidence.

## 5. Perform static scope and preservation audits

- Compare the merged file list to the approved incoming scope and remove
  governance or unrelated planning changes.
- Compare learner page, scene, route, outline, and navigation inventories with
  both parents; allow only content-topology removals with explicit redirects.
- Search the merged tree for zeroed receipt requirements, Practice bypasses,
  mock-completion shortcuts, `thread/resume`, focused-window inference, direct
  Practice Teacher chat, generic step-5 continuation, and missing diagnostics.
- Inspect all Practice-sensitive diffs against the pre-merge destination.

## 6. Run focused verification

- Run Module 2/3 registry, content-contract, assessment, progress-migration,
  reference-link, completion-service, and page-inventory tests.
- Run Practice metadata, snapshot, review, guide, lifecycle, completion,
  invalidation, return, recovery, concurrency, and Teacher-boundary tests.
- Fix integration failures without weakening Practice contracts or rewriting
  approved incoming content.

## 7. Run complete and real-runtime verification

- Run typecheck and lint.
- Run all unit/integration tests and startup tests.
- Build the production Electron application and run the full Electron smoke
  journey.
- Run the isolated installed-App-Server empty-task diagnostic.
- Run the read-only bound-task diagnostic against the active Practice store.
- Run `git diff --check` and confirm a clean merge index.

## 8. Synchronize records and complete the merge

- Re-read the affected Foundation, Module 2, and Module 3 checkpoints.
- Update the implementation ledger with exact test counts, runtime results,
  integration decisions, remaining gaps, and the next permitted action.
- Mark implementation and verification only from repository evidence; do not
  infer overall owner approval or pilot acceptance.
- Inspect the final staged diff and create the selective merge commit with both
  parents intact.
