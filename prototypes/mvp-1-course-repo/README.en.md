# MVP 1 - Course Repo Running In Codex

MVP 1 turns the pedagogy kernel into a Codex-runnable course repo. The goal is not a custom learning web app yet; it is to prove that a learner can open the repo, use a start prompt, complete small exercises, answer quizzes, and create real artifacts in the ContentPilot Lite scaffold.

Vietnamese with proper tone marks is the primary learner-facing language. English is a companion layer for review.

## What Is Included

- `course-structure.json`: course map with lesson, quiz, prompt, and artifact paths.
- `lessons/`: the Prologue plus the first 4 lessons, Module 0 through Module 3.
- `lesson-scripts/`: polished static scripts; the Teacher follows them and only improvises when the learner goes off track.
- `codex-prompts/`: copy-paste prompts for starting each module in Codex.
- `quizzes/`: scenario-based JSON quizzes delivered one question at a time, with anti-copy rules for written answers.
- `visuals/opening-scene/`: an RPG-style opening scene that introduces the scenario, characters, and motivation for learning Codex.
- `templates/`: AGENTS.md templates for the course repo and app scaffold.
- `app-scaffold/contentpilot-lite/`: dependency-free static app scaffold for learner practice.

## Start The Course

The easiest path: open a new thread at the repository root, make sure Codex has discovered repo skills in `.agents/skills`, then type:

```text
$start-course-lesson intro
```

This uses the repo-scoped skill at:

```text
.agents/skills/start-course-lesson/SKILL.md
```

The skill reads `course-structure.json`, finds the exact lesson/quiz/prompt files, loads the pedagogy kernel when needed, and hands teaching behavior to:

```text
.agents/skills/course-teacher/SKILL.md
```

If the skill does not appear in Codex yet, open a new thread or restart Codex so repo skills are scanned again.

Long prompt files remain as fallback/reference:

```text
prototypes/mvp-1-course-repo/codex-prompts/start-intro.vi.md
```

Recommended invocations:

```text
$start-course-lesson intro
$start-course-lesson module-0
$start-course-lesson module-1
$start-course-lesson module-2
$start-course-lesson module-3
$course-teacher
```

Use `$start-course-lesson module-0` only when you want to skip the Prologue and jump straight into the first technical lesson.

## View The Opening Scene

Open this file directly in a browser:

```text
prototypes/mvp-1-course-repo/visuals/opening-scene/index.html
```

The opening scene introduces the course scenario, character roles, and learner motivation before Module 0.

## Generate Opening Scene Images

Add your OpenAI API key here:

```text
prototypes/mvp-1-course-repo/visuals/opening-scene/scripts/.env.openai
```

Then run this from the repository root:

```powershell
node scripts\generate-images.mjs
```

Generate the character avatars separately:

```powershell
node scripts\generate-avatars.mjs
```

The scripts write generated backgrounds and avatars to:

```text
prototypes/mvp-1-course-repo/visuals/opening-scene/images/
```

## Try The App Scaffold

Open this file directly in a browser:

```text
prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite/index.html
```

The scaffold is the practice arena for the course. It includes lightweight Brand Brain, Idea Lab, Draft Studio, and Calendar Board surfaces.
