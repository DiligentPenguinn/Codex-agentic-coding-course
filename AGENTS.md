# Repository Guidance

## Instruction routing

- Before changing files under `pilot-workspace/`, read `pilot-workspace/AGENTS.md`, even when the task starts from the repository root.
- Before changing files under `course-companion/`, read `course-companion/AGENTS.md`.
- Before changing files under `starters/contentpilot/` or a runnable scaffold under `prototypes/`, read the closest nested `AGENTS.md`.
- Apply the closest scoped guidance together with this file; keep cross-repository rules here and specialized implementation details near the files they govern.

## Consequential decisions

- Resolve small, reversible details from repository evidence or a safe default.
- For consequential product, curriculum, architecture, or workflow choices, explain why the decision matters, recommend a direction, describe meaningful alternatives and tradeoffs, and state which downstream choices it settles.
- Group linked choices into one decision packet and ask only one packet at a time. Escalate scope, learner outcomes, cost, safety, external effects, or difficult reversals separately.

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

## Vietnamese

- Write learner-facing Vietnamese naturally with complete diacritics and tone marks.
- Do not use ASCII-only Vietnamese unless quoting intentionally unaccented input.
