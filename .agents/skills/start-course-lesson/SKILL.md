---
name: start-course-lesson
description: Deterministically start or resume Codex Content Builder Academy lessons from this repo. Use when the user invokes $start-course-lesson, says "Start course", "Start lesson intro", "Start lesson module-0", "Bắt đầu phần mở đầu", "Bắt đầu Module 2", "Resume course", or asks for a reliable lesson-start command instead of copying long prompts. Resolves course-structure.json, loads the exact lesson/script/quiz/prompt files, then hands teaching to course-teacher.
---

# Start Course Lesson

Resolve a lesson deterministically, then teach it through `course-teacher`.

## Deterministic Workflow

1. Read `prototypes/mvp-1-course-repo/course-structure.json`.
2. Resolve the requested module:
   - `intro`, `prologue`, `opening`, `mở đầu`, `start course`, `bắt đầu khóa học`, or `Bài mở đầu` map to `intro`.
   - `module-0`, `module-1`, etc. match exact `id`.
   - `0`, `1`, `Module 0`, `lesson 0`, or `Bài 0` map to `module-0`.
   - If the learner asks to start the course without a module, start `intro` by default.
   - If the request is `Resume course` and no state is available, ask how many minutes the learner has: 10, 20, 30, 45, or 60.
3. If no module can be resolved, list available module ids and titles from the course map.
4. Read the resolved module's `promptPath`, `lessonPath`, `scriptPath`, and `quizPath`.
5. Read `prototypes/mvp-0.5-pedagogy-kernel/teacher/teacher-system-prompt.vi.md`.
6. Read `prototypes/mvp-0.5-pedagogy-kernel/teacher/scripted-delivery-contract.vi.md`.
7. Read `prototypes/mvp-0.5-pedagogy-kernel/rubrics/hint-ladder.vi.md`.
8. Read `prototypes/mvp-0.5-pedagogy-kernel/rubrics/mastery-rubric.vi.md` when the lesson needs mastery scoring.
9. Read `prototypes/mvp-0.5-pedagogy-kernel/rubrics/quiz-delivery-protocol.vi.md` before any quiz.
10. Teach using the `course-teacher` behavior. If the `course-teacher` skill is available, use it explicitly.

## Start Behavior

- Do not ask the user to paste a long prompt file.
- Do not summarize setup steps unless the user asks.
- Start the lesson in Vietnamese with correct diacritics.
- Prefer Vietnamese wording; use English only for necessary Codex terms, file names, commands, or product names.
- Begin with the first learner-facing line from the static script.
- Ask only one main question or action per turn.
- Keep all execution read-only until the learner approves edits.
- Treat `intro` as the default entry point for first-time learners.

## Quiz Behavior

- Ask quiz questions one at a time.
- Use MCQ choice UI when available; otherwise present compact A/B/C/D choices.
- Do not stack all quiz questions into one message.
- Do not pass written answers that merely copy the immediately previous Teacher wording; ask for an original example or scenario.

## Output Contract

For a successful start, the first teaching response should include:

- The first scripted Teacher line for the resolved module.
- One time-budget question or first learner action from the script.
- For `intro`, the script's concise invitation to open the visualization file when that beat is reached.

For an unresolved start request, output:

- What could not be resolved.
- Available module ids and titles from the course map.
- One example invocation, such as `$start-course-lesson intro`.