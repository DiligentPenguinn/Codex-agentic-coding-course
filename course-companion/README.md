# Course Companion

This is the production desktop-app package for the learner-facing Course
Companion. It is intentionally separate from the historical HTML prototypes and
from ContentPilot, the practice application learners use to demonstrate
agentic-coding skills during the course.

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
- learner-friendly practice-mode labels that never present scripted replies as
  live Teacher intelligence;
- an Electron-owned `PracticeAdapter` with started, approval-required, success,
  stale-evidence, offline, and error fixtures;
- visible practice evidence plus expandable local scenario controls; and
- a complete Module 1 evidence-reflection and debrief finish.

Live Teacher inference and live Codex observation belong to later increments.

Learner progress is stored by Electron in the operating system's application
data directory. It is not stored in browser `localStorage` or inside the
repository.

The current Teacher adapter is deliberately deterministic and fixture-backed.
The expanded panel describes this honestly in learner-facing language as
**PHẢN HỒI LUYỆN TẬP** and explains that it is not connected directly to Codex.

The practice adapter follows the same honesty rule. Every simulated lifecycle
event has `source: "fixture"` and a correlation ID for internal traceability;
the learner sees a clear **LUYỆN TẬP** label. Practice success is never
presented as evidence from a live Codex task.

## Start on macOS

From the repository root, double-click `start-course.command` in Finder or run:

```bash
./start-course.command
```

The launcher checks for Node.js 22+ and npm. On the first run, or after the
lockfile changes, it shows the exact local preparation plan and waits for
permission before running `npm ci` and verifying the pinned Electron runtime
inside `course-companion/`. It then builds and opens this Electron application.
It does not install a global Codex tool or claim that the practice Teacher is
connected directly to Codex.

## Run in development

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
npm run test:electron
```

To exercise the root macOS launcher and the complete Electron journey together,
run `./start-course.command --smoke`.
