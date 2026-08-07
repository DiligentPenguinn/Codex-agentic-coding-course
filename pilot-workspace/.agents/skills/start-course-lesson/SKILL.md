---
name: start-course-lesson
description: Start or resume Codex Content Builder Academy Pilot 0.1 from this downloaded workspace. Use when the learner invokes $start-course-lesson, says start course, start intro, start module 1, resume course, continue course, bắt đầu khóa học, or tiếp tục bài học. Resolves the local course map and learner state, loads the exact lesson, script, quiz, and pedagogy sources, then teaches through course-teacher.
---

# Start Course Lesson

Resolve the learner's requested lesson from the local workspace and hand
teaching to `course-teacher`.

## Locate the workspace

Find the nearest ancestor containing both:

- `course/course-structure.json`
- `.agents/skills/course-teacher/SKILL.md`

Treat that ancestor as `WORKSPACE_ROOT`. Do not assume an absolute path.

## Resolve start or resume

1. Read `course/course-structure.json`.
2. For a first start with no explicit lesson, use `intro`.
3. Map `intro`, `prologue`, `opening`, `mở đầu`, and `bắt đầu khóa học` to
   `intro`.
4. Map `module-1`, `module 1`, `1`, and `bài 1` to `module-1`.
5. For `resume`, `continue`, `tiếp tục`, or `học tiếp`, run:

   ```bash
   node .agents/skills/start-course-lesson/scripts/course-state.mjs show
   ```

   Use `currentLessonId` and `currentBeatId` from the output. Match
   `currentBeatId` to the checkpoint id shown in the script heading. If no state
   exists, start `intro`.
6. If the learner resumes without a time budget in the current conversation,
   ask one question with these choices: 10, 20, 30, 45, or 60 minutes.
7. If a requested id is unavailable, list only the ids and Vietnamese titles
   from the course map.

## Load exact sources

For the resolved module, read:

- its `promptPath`,
- its `lessonPath`,
- its `scriptPath`,
- its `quizPath`,
- `course/pedagogy/teacher/teacher-system-prompt.vi.md`,
- `course/pedagogy/teacher/scripted-delivery-contract.vi.md`,
- `course/pedagogy/rubrics/hint-ladder.vi.md`,
- `course/pedagogy/rubrics/quiz-delivery-protocol.vi.md`, and
- `course/pedagogy/rubrics/mastery-rubric.vi.md` before a mastery gate.

Then use the `course-teacher` behavior.

## State commands

Use the bundled helper from `WORKSPACE_ROOT`:

```bash
node .agents/skills/start-course-lesson/scripts/course-state.mjs show
node .agents/skills/start-course-lesson/scripts/course-state.mjs checkpoint <lesson-id> <beat-id> [minutes]
node .agents/skills/start-course-lesson/scripts/course-state.mjs complete <lesson-id>
```

- `show` is read-only.
- `checkpoint` creates state if needed and atomically records a completed beat.
- `complete` marks a lesson complete and advances to its `nextLessonId`.
- Update state only after the Learner completes the named beat.
- Do not claim progress was saved unless the command succeeds.

## Start response

- Teach in natural Vietnamese with complete diacritics.
- Begin with the first relevant `Teacher nói:` line at the current beat.
- Ask one main question or action and wait.
- Do not dump setup instructions, a course outline, or multiple quiz questions.
- Keep execution read-only until the script and Learner authorize an edit.
- At `intro-visual-onboarding`, resolve
  `course/onboarding/index.html` from `WORKSPACE_ROOT` and render it as a
  clickable absolute local-file Markdown link. Do not start a server, install a
  dependency, or skip directly to personal brand questions.
