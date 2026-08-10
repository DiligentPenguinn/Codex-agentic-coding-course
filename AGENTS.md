# Repository Guidance

## Decision Scope

- Do not ask the user to decide small, isolated details that can be resolved from
  repository evidence, established constraints, or a safe and reversible
  default.
- Group tightly connected, consequential choices into one decision packet so
  the user can evaluate the direction rather than approve implementation
  details one by one.
- For each decision packet, provide the recommended direction, meaningful
  alternatives, tradeoffs, and the downstream decisions it would settle.
- When recommending a product, curriculum, architecture, workflow, or
  implementation direction, explain why the decision matters before requesting
  approval. State the problem it addresses, why the option is recommended, its
  concrete consequences, the tradeoffs of meaningful alternatives, and which
  downstream decisions it settles. Do not present option labels without
  explaining their practical effects.
- Ask one decision-packet question at a time. A packet may contain multiple
  linked choices when they share the same product or curriculum consequence.
- Escalate a choice separately only when it changes product scope, learner
  outcomes, cost exposure, safety, external side effects, or a decision that is
  difficult to reverse.

## Vietnamese Language

- When writing Vietnamese for this project, always use correct Vietnamese diacritics and tone marks.
- Do not write ASCII-only Vietnamese such as "Xin chao toi la nguoi Viet Nam" unless quoting an input that intentionally lacks accents.
- Prefer natural, learner-facing Vietnamese for course materials, prompts, rubrics, and dialogues.

## Course Skills

- `pilot-workspace/` is the only runnable course authority.
- Use `$start-course-lesson intro` to start Pilot 0.1 from
  `pilot-workspace/course/course-structure.json`.
- Use `$start-course-lesson module-1` only when the learner intentionally skips
  the Pilot intro and starts its technical lesson.
- Do not offer `module-0`; it belongs to the historical MVP 1 prototype.
- Use `$course-teacher` when teaching, assessing, resuming, or reviewing Pilot
  lessons.
- Prefer explicit skill invocation over fuzzy natural-language shortcuts when demonstrating the course flow.
- When teaching course materials, follow the lesson `scriptPath` first; ask quiz questions one at a time and require learner-owned examples for written answers.
- If the user asks to resume the course without specifying time, ask how many minutes they have today: 10, 20, 30, 45, or 60.

## Course Authority

- Current runnable private course: `pilot-workspace/`.
- Current public-course plan: `docs/planning/`.
- Internal target-learner definition:
  `docs/internal/target-learner-definition.md`. Read it before making
  curriculum, product, or learner-experience decisions. Do not copy it into
  learner-facing content or include it in a public release package.
- Current real application baseline: `starters/contentpilot/`.
- Historical references only: `prototypes/` and
  `codex_content_creator_course_plan_v8.html`.
- Never fall back to a historical course when a current Pilot lesson cannot be
  resolved.
