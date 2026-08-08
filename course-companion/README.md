# Course Companion

This is the production desktop-app package for the learner-facing Course
Companion. It is intentionally separate from the historical HTML prototypes and
from ContentPilot, the application learners build during the course.

## Implemented scope

The current app proves:

- a real Electron application;
- a full learning window;
- a separate always-on-top Teacher companion;
- a 72px Teacher bubble with single-click quick view and double-click full view;
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
  intelligence;
- one active Practice at most, with a layered objective/outcome brief;
- creation, naming, verification, deep-link opening, and resume of an exact
  persistent Executor chat through the local Codex App Server;
- recoverable fresh Practice switching that leaves the old Codex chat unchanged;
- Teacher and Progress peer tabs with persisted compact/full presentation state;
- a checklist-based Practice progress view;
- an Electron-owned fixture evidence adapter with started, approval-required,
  success,
  stale-evidence, offline, and error fixtures;
- visible fixture evidence plus hidden developer scenario controls; and
- a complete Module 1 evidence-reflection and debrief finish.

Live Teacher inference and progress derived from live Codex activity belong to
later increments. Automatic selective context transfer is also disabled: the
installed Codex protocol can inject model context, but cannot append a separate
learner-visible summary safely to the new chat.

Learner progress is stored by Electron in the operating system's application
data directory. It is not stored in browser `localStorage` or inside the
repository.

The current Teacher adapter is deliberately deterministic and fixture-backed.
The expanded panel labels this state as **MÔ PHỎNG** and **CHƯA KẾT NỐI TEACHER
LIVE**.

The practice adapter follows the same honesty rule. Every simulated lifecycle
event has `source: "fixture"`, a correlation ID, and a visible **MÔ PHỎNG**
label. A fixture success is never presented as evidence from a live Codex task.
Starting a Practice is different: Course Companion creates and verifies a real
Codex chat. In development tests only, `COURSE_COMPANION_FAKE_CODEX=1` swaps in
a deterministic non-packaged gateway so the smoke suite never creates user tasks.

## Start on Windows

From the repository root, run:

```bat
.\start-course.cmd
```

The launcher checks Node.js 22+, npm, Codex, App Server support, locked local
packages, and the pinned Electron runtime. It displays one exact preparation
plan and waits for permission before installing anything. Both fresh and
returning launches open `course-companion/`; the historical Windows prototype
is no longer a learner-facing launcher target.

## Start on macOS

From the repository root, double-click `start-course.command` in Finder or run:

```bash
./start-course.command
```

The launcher checks for Node.js 22+ and npm. On the first run, or after the
lockfile changes, it shows the exact local preparation plan and waits for
permission before running `npm ci` and verifying the pinned Electron runtime
inside `course-companion/`. It then builds and opens this Electron application.
It does not install a global Codex tool or claim that fixture Teacher replies or
fixture evidence are live.

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

## Test the Practice flow

1. Open Module 1 and continue to **Sang Codex để thực hành**.
2. Review the objective and expected outcome, then choose **Bắt đầu Practice
   mới** or **Tiếp tục Practice**.
3. When an active Practice already exists, starting another one opens the switch
   dialog. Choose the fresh path; selective transfer remains visibly disabled.
4. Confirm Codex opens the named Executor chat and Course Companion becomes the
   72px Teacher bubble.
5. Single-click the bubble for the quick Teacher/Progress window. Double-click
   it for the full Teacher workspace. Use **Mở bài học** to return to the lesson.
6. Quit and relaunch to confirm the active Practice and selected panel persist.

The UI, repository, state machine, IPC contracts, and one-active-Practice rule
are shared across Windows and macOS. Launcher commands, Electron runtime paths,
window focus/positioning, and `codex://` deep-link behavior are platform
adapters. Windows has passed the automated Electron flow in this repository;
physical macOS verification is still required after changes to those adapters.
