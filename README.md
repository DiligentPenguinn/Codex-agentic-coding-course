# Codex Content Creator Course

This repo contains the working materials for **Codex Content Builder Academy**, a Vietnamese-first course that teaches marketers and creators to use Codex by building practical AI content tools.

## Experimental Electron startup mock

> **Duy-side prototype:** this Windows-first command and setup surface are a
> proposal pending shared review before they become the production Course App
> entry point.

```powershell
git clone https://github.com/DiligentPenguinn/codex-content-creator-course.git
cd codex-content-creator-course
.\start-course.cmd
```

The launcher uses no PowerShell execution-policy bypass. It detects
prerequisites, prints every proposed installation with its exact command and
scope, and waits for one explicit approval before changing anything.

The Electron app owns Codex connection and first-run interaction. Authentication
uses Codex App Server's managed ChatGPT flow; the mock does not read or store
Codex credentials. Its onboarding questions are visibly labeled fixture
content for testing Duy's setup mechanism—not Triết's production onboarding
script.

See the
[startup mock README](prototypes/app-startup-electron-mock/README.md) for
installation details, stored data, recovery commands, tests, and deferred
behavior.

## Current prototype

- [MVP 0.5 Pedagogy Kernel](prototypes/mvp-0.5-pedagogy-kernel/README.vi.md): Vietnamese-first Teacher prompt, hint ladder, mastery rubric, learner-state schema, learning-event schema, sample dialogues, and a Module 0 Codex simulation script.
- [MVP 1 Course Repo](prototypes/mvp-1-course-repo/README.vi.md): Codex-runnable course map, an RPG-style opening scene, static Teacher scripts, scenario-based quizzes, Module 0-3 lessons, start prompts, AGENTS templates, and a dependency-free ContentPilot Lite scaffold.
- [MVP 3 Course Experience Companion](prototypes/mvp-3-course-experience-companion/README.md): interactive pixel-art Home Base mock with linear mission scenes, a simulated Codex Workshop, an expandable Teacher bubble, context transparency, placeholder gamification surfaces, and an [interactive technical workflow map](prototypes/mvp-3-course-experience-companion/technical-architecture.html).
- [ContentPilot learner starter](starters/contentpilot/README.md): validated Next.js foundation with honest empty states, guarded local JSON storage, a non-sensitive health route, sample material, and passing baseline checks. Product-specific AI workflows remain learner-built.
- [Pilot 0.1 workspace](pilot-workspace/START_HERE.md): downloadable-format source containing the opening lesson, Module 1, embedded start/teacher skills, local resume state, learner artifacts, and the real ContentPilot starter.
