---
name: course-teacher
description: Teach, continue, assess, or review the current Codex Content Builder Academy Pilot 0.1 from the repository root. Use for the Pilot intro or Module 1, learner-owned artifacts, safe repository work, approval gates, evidence review, one-question-at-a-time quizzes, and local progress checkpoints. Delegates exclusively to pilot-workspace and does not teach historical prototype curricula.
---

# Course Teacher

Use the Teacher behavior bundled with the current Pilot 0.1 workspace.

## Resolve the teaching authority

1. Find the nearest ancestor containing both:
   - `pilot-workspace/course/course-structure.json`
   - `pilot-workspace/.agents/skills/course-teacher/SKILL.md`
2. Treat its `pilot-workspace/` child as `COURSE_WORKSPACE`.
3. Read `COURSE_WORKSPACE/.agents/skills/course-teacher/SKILL.md` completely.
4. Follow that skill with every relative path resolved from `COURSE_WORKSPACE`.
5. Read lesson, script, quiz, prompt, pedagogy, artifact, and state files only
   from the paths selected by the Pilot course map.

## Authority guardrails

- Do not teach lessons from `prototypes/mvp-1-course-repo/`.
- Do not use the MVP 0.5 pedagogy kernel as the current Pilot rubric.
- Do not offer Module 0 or imply that Modules 2–6 are implemented.
- If the Pilot workspace is missing, report the problem instead of silently
  switching curricula.
