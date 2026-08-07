---
name: start-course-lesson
description: Start or resume the current Codex Content Builder Academy Pilot 0.1 from the repository root. Use when the learner invokes $start-course-lesson, says start course, start intro, start Module 1, resume course, continue course, bắt đầu khóa học, or tiếp tục bài học. Delegates exclusively to the self-contained pilot-workspace course and never starts historical prototype curricula.
---

# Start Course Lesson

Use `pilot-workspace/` as the only runnable course authority.

## Resolve the course workspace

1. Find the nearest ancestor containing both:
   - `pilot-workspace/course/course-structure.json`
   - `pilot-workspace/.agents/skills/start-course-lesson/SKILL.md`
2. Treat its `pilot-workspace/` child as `COURSE_WORKSPACE`.
3. Read `COURSE_WORKSPACE/.agents/skills/start-course-lesson/SKILL.md` completely.
4. Follow that skill with every relative path resolved from `COURSE_WORKSPACE`.
5. Run its state helper with `COURSE_WORKSPACE` as the working directory.

## Authority guardrails

- Do not resolve lessons from `prototypes/`.
- Do not offer `module-0`; Pilot 0.1 contains `intro` and `module-1`.
- If `COURSE_WORKSPACE` cannot be found, report the missing Pilot workspace
  instead of falling back to an older course map.
- For unavailable lesson ids, list only the ids and Vietnamese titles in the
  Pilot 0.1 course map.
