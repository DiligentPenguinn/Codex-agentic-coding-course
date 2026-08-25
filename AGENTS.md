# Repository Guidance

## Instruction routing

- Before changing files under `pilot-workspace/`, read `pilot-workspace/AGENTS.md`, even when the task starts from the repository root.
- Before changing files under `course-companion/`, read `course-companion/AGENTS.md`.
- Before changing files under `starters/contentpilot/` or a runnable scaffold under `prototypes/`, read the closest nested `AGENTS.md`.
- Apply the closest scoped guidance together with this file; keep cross-repository rules here and specialized implementation details near the files they govern.

## Consequential decisions

- Don't execute a multi-step actions without defining to me what are the steps and get my approval
- Resolve small, reversible details from repository evidence or a safe default.
- For consequential product, curriculum, architecture, or workflow choices, explain why the decision matters, recommend a direction, describe meaningful alternatives and tradeoffs, and state which downstream choices it settles.
- Group linked choices into one decision packet and ask only one packet at a time. Escalate scope, learner outcomes, cost, safety, external effects, or difficult reversals separately.

## Risk-based verification and batching

- Define the smallest meaningful acceptance gate from the actual scope and risk before implementation. Do not treat the full repository suite as the default for every change.
- A focused gate is sufficient for a narrow, additive, local change such as copy, scene metadata, one new learner page, a local route, or a component-level presentation adjustment when it does not affect security, persisted data, schemas, migrations, dependencies, external systems, Practice lifecycle, completion receipts, unlock gates, or shared cross-module behavior.
- For a focused gate, inspect the affected source and adjacent route or page inventory, run only the relevant contract or unit tests, run typecheck when typed code or registries change, inspect a supported desktop size only when visible layout or navigation changes, and finish with a scoped diff plus `git diff --check`. Do not add lint, the complete unit suite, a production build, or the full Electron smoke unless the changed surface or focused evidence makes that check relevant.
- Require the full project gate when a change affects runtime integrity, persistence or saved-progress migration, Practice coordination, evidence or completion gates, security boundaries, dependencies or build configuration, shared renderer or cross-module navigation, broad refactors, release behavior, or application-wide acceptance. Also run it before merge, release, pilot rehearsal, or any claim of full-app verification.
- For small related changes, define the batch scope first, implement them together, and run focused checks while iterating. Run the full gate once at the end only when the combined batch meets a full-gate trigger.
- Report whether verification was focused or full, list what ran, and state why intentionally skipped broad checks were unnecessary. Never postpone a failing focused check or present focused evidence as full-app verification.

## Implementation-plan synchronization

- Treat `docs/planning/portfolio-course-implementation-plan.md` as part of the definition of done for work that implements, verifies, changes, or blocks a numbered checkpoint or acceptance gate.
- Before the final response and before a qualifying checkpoint commit, re-read the affected checkpoint, inspect the actual changes and verification output, then update its progress ledger, remaining gaps, and next permitted action.
- Set implementation only to `not-started`, `in-progress`, or `implemented`, and verification only to `pending`, `passed`, `failed`, or `blocked`, when repository evidence supports the transition.
- Never infer owner approval or pilot acceptance. Mark owner approval only after explicit user approval and pilot acceptance only after the required rehearsal or learner evidence.
- Do not begin the next module while the current module still lacks its required approval or acceptance gate.
- If implementation changed but the plan cannot be synchronized safely, stop before committing and report the mismatch.

## Course routing and authority

- `pilot-workspace/` is the only runnable private-course authority; `docs/planning/` is the public-course plan.
- Use `$start-course-lesson intro` for the normal start and `$start-course-lesson module-1` only for an intentional intro skip. Never offer historical `module-0`.
- Use `$course-teacher` to teach, assess, resume, or review Pilot lessons. Follow the current lesson `scriptPath`, ask assessed questions one at a time, and require learner-owned written examples.
- If the user asks to resume without specifying time, ask whether they have 10, 20, 30, 45, or 60 minutes.
- Read `docs/internal/target-learner-definition.md` before curriculum, product, or learner-experience decisions. Keep it internal and out of learner-facing or public packages.
- Treat `starters/contentpilot/` as the real application baseline. Treat `prototypes/` and `codex_content_creator_course_plan_v8.html` as historical references only; never fall back to them when current Pilot material is missing.

## Learning-device scope

- Treat Course Companion and all learner-facing lesson, review, and assessment flows as desktop-only experiences. Do not optimize, design, or verify these learning surfaces for phone-sized viewports, and do not require `390 × 844` evidence for them.
- Continue checking supported desktop window sizes for readability, clipping, overlap, and horizontal overflow.
- This desktop-only learning scope does not remove responsive requirements from learner-built products such as the portfolio. Keep mobile behavior in scope for those outputs when their approved requirements or curriculum require it.

## Page preservation

- Never remove an existing application or course page, learner-facing lesson scene, route, or navigation target unless the user explicitly requests removal of that exact page.
- Changes to adjacent content must not merge away, hide, skip, orphan, repurpose, or otherwise make an unrequested page unreachable.
- Before committing a changed learner flow, compare the affected page and scene inventory with the baseline and restore any removal that the user did not explicitly approve.

## Copy preservation

- Treat existing application and course copy as user-owned approved text. Never rewrite, polish, shorten, expand, translate, or change its tone unless the user explicitly requests a change to that exact copy.
- Product, curriculum, layout, and navigation work must preserve surrounding copy verbatim, including wording, punctuation, and capitalization.
- If a technical or consistency issue appears to require a copy change, keep the current copy unchanged, explain the issue, and ask for approval before editing it.

## Vietnamese

- Write learner-facing Vietnamese naturally with complete diacritics and tone marks.
- Do not use ASCII-only Vietnamese unless quoting intentionally unaccented input.
