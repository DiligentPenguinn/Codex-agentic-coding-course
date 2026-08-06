# Course Companion

This is the production desktop-app package for the learner-facing Course
Companion. It is intentionally separate from the historical HTML prototypes and
from ContentPilot, the application learners build during the course.

## Increment 1 scope

The current shell proves:

- a real Electron application;
- a full learning window;
- a separate always-on-top Teacher companion;
- minimize-to-companion and restore behavior;
- explicit Quit behavior; and
- a context-isolated, sandboxed renderer with narrow preload IPC.

Lesson progression, persistence, Teacher chat, practice fixtures, and live Codex
integration belong to later increments.

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
