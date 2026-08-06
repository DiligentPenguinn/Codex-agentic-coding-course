# Course Companion

This is the production desktop-app package for the learner-facing Course
Companion. It is intentionally separate from the historical HTML prototypes and
from ContentPilot, the application learners build during the course.

## Implemented scope

The current app proves:

- a real Electron application;
- a full learning window;
- a separate always-on-top Teacher companion;
- minimize-to-companion and restore behavior;
- explicit Quit behavior;
- a context-isolated, sandboxed renderer with narrow preload IPC;
- new-learner and returning-learner routing;
- Intro-to-Module-1 scene transitions;
- atomic local checkpoint saves with a last-known-good backup;
- exact resume after a complete app relaunch;
- confirmed reset and damaged-state recovery behavior;
- a floating Teacher chat with checkpoint-aware scripted replies;
- persistent `teacher-chat.jsonl` history and companion window mode;
- visible fixture labels that never present scripted replies as live Teacher
  intelligence.

Adapter-driven practice fixtures and live Teacher/Codex integration belong to
later increments.

Learner progress is stored by Electron in the operating system's application
data directory. It is not stored in browser `localStorage` or inside the
repository.

The current Teacher adapter is deliberately deterministic and fixture-backed.
The expanded panel labels this state as **MÔ PHỎNG** and **CHƯA KẾT NỐI TEACHER
LIVE**.

## Run locally

```bash
npm install
npm run dev
```

The repository should not distribute `node_modules`. `npm install` creates it
locally from `package-lock.json`.

## Verify

```bash
npm run typecheck
npm run lint
npm test
npm run build
```
