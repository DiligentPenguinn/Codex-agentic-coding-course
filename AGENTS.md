# Repository Guidance

## Vietnamese Language

- When writing Vietnamese for this project, always use correct Vietnamese diacritics and tone marks.
- Do not write ASCII-only Vietnamese such as "Xin chao toi la nguoi Viet Nam" unless quoting an input that intentionally lacks accents.
- Prefer natural, learner-facing Vietnamese for course materials, prompts, rubrics, and dialogues.

## Course Skills

- Use `$start-course-lesson intro` to deterministically start the course from the opening scene in `prototypes/mvp-1-course-repo/course-structure.json`.
- Use `$start-course-lesson module-0` only when the learner intentionally skips the opening scene and starts the first technical lesson.
- Use `$course-teacher` when teaching, assessing, resuming, or reviewing lessons.
- Prefer explicit skill invocation over fuzzy natural-language shortcuts when demonstrating the course flow.
- When teaching course materials, follow the lesson `scriptPath` first; ask quiz questions one at a time and require learner-owned examples for written answers.
- If the user asks to resume the course without specifying time, ask how many minutes they have today: 10, 20, 30, 45, or 60.
