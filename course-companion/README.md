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
- a 72px Teacher bubble with single-click quick view and double-click full view;
- minimize-to-companion and restore behavior;
- explicit Quit behavior;
- a context-isolated, sandboxed renderer with narrow preload IPC;
- new-learner and returning-learner routing;
- Intro-to-Module-1 scene transitions;
- atomic local checkpoint saves with a last-known-good backup;
- exact resume after a complete app relaunch;
- confirmed reset and damaged-state recovery behavior;
- a floating, tool-free Triết Teacher backed by an ephemeral read-only Codex
  thread;
- persistent `teacher-chat.jsonl` history, delivery state, companion mode, and
  versioned `teacher-memory.json` Practice summaries;
- just-in-time reconciliation of only the exact Executor thread bound to the
  active Practice, with visible live, stale, offline, and simulated states;
- one active Practice at most, with a layered objective/outcome brief;
- creation, naming, verification, deep-link opening, and resume of an exact
  persistent Executor chat through the local Codex App Server;
- recoverable fresh Practice switching that leaves the old Codex chat unchanged;
- Teacher and Progress peer tabs with persisted compact/full presentation state;
- a checklist-based Practice progress view;
- automatic, versioned first-run guidance for the Module 1 Practice loop, with
  accessible pause, skip, resume, replay, and mastery confirmation;
- an Electron-owned fixture evidence adapter with started, approval-required,
  success,
  stale-evidence, offline, and error fixtures;
- visible practice evidence plus expandable local scenario controls; and
- a complete Module 1 evidence-reflection and debrief finish.

Triết receives the current course checkpoint, the full active Practice state,
bounded observations from its exact Executor thread, recent Teacher chat, prior
summaries for the same Practice, and durable learner-level takeaways. Before a
Teacher response, Course Companion refreshes the persistent Executor thread and
distinguishes structured activity, Executor-reported results, and file changes
corroborated read-only against the Practice Git baseline. Reported verification
is never presented as independently rerun. Triết does not receive tools and
cannot modify files, control the Executor, approve work, or declare Practice
completion. Older runs are consolidated by a separate ephemeral Triết summary
thread; invalid or unavailable summaries fall back to a validated local record
marked pending refinement.

Automatic selective context transfer into a new learner-visible Executor chat
remains disabled. The installed protocol can inject model context, but cannot
append a separate learner-visible summary safely to that chat.

Learner progress is stored by Electron in the operating system's application
data directory. It is not stored in browser `localStorage` or inside the
repository.

Practice guidance is stored separately in `practice-guide-state.json` in the
same operating-system application-data directory. It contains presentation
state only; it never changes learner checkpoints, Practice evidence, review
results, completion receipts, or the five Module 1 configuration criteria.

Production uses the real local Codex App Server for Teacher inference. Development
smoke tests set `COURSE_COMPANION_FAKE_CODEX=1`; only that deterministic path is
visibly labeled **MÔ PHỎNG**.

The practice adapter follows the same honesty rule. Every simulated lifecycle
event has `source: "fixture"`, a correlation ID, and a visible **MÔ PHỎNG**
label. A fixture success is never presented as evidence from a live Codex task.
Starting a Practice is different: Course Companion creates and verifies a real
Codex chat. In development tests only, `COURSE_COMPANION_FAKE_CODEX=1` swaps in
a deterministic non-packaged gateway so the smoke suite never creates user tasks.


## Module 1 Practice guidance

When a fresh Module 1 Practice run reaches the stable full Teacher workspace,
Course Companion automatically opens the first-run guide. The learner controls
every step: **Esc** pauses it, **Bỏ qua** skips it, the paused notice resumes it,
and **Xem lại hướng dẫn Practice** starts an in-memory replay. Replay does not
reset the guide, Practice run, evidence, review, or course progress.

The guide observes real tab selections, review requests, and course return. It
never clicks those controls, sends an Executor or Teacher message, edits
configuration, or awards completion. It is ungraded; the existing evidence
review and completion receipt remain the only authorities.

Guide definitions live in `content/practice-guides/`. Development and packaged
content resolution mirrors Practice definitions. Set
`COURSE_COMPANION_PRACTICE_GUIDES_DIR` to an absolute directory only when
testing alternate local guide content.
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

Each App Server connection and Practice task reopen also resolves and verifies
the Codex runtime. The current desktop installation is preferred over PATH or
an inherited runtime path that may survive a desktop update. Standalone
fallbacks require Codex CLI 0.164 or newer; missing, unrecognized, or older
runtimes fail the check before task creation or navigation. This check does not
download software or change the learner's system installation.

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
5. Single-click the bubble for the quick Teacher/Progress window. Use the
   expand icon for the full Teacher workspace; double-clicking the bubble is a
   shortcut to the same full-screen state.
6. Confirm the Module 1 guide opens automatically in the stable full Teacher
   workspace. Exercise pause/resume or skip, then use the real tabs, evidence,
   review, and return controls. Confirm the guide never performs those actions.
7. After returning, dismiss the inline Practice-loop confirmation. Reopen the
   full Teacher workspace and confirm **Xem lại hướng dẫn Practice** is available.
8. In full-screen Teacher, use the minimize icon to return directly to the
   72px bubble. Use the close icon to reveal the unchanged lesson.
9. Bring Codex forward and confirm the bubble stays above it when always-on-top
   is enabled, then quit and relaunch to confirm the preference persists.

The UI, repository, state machine, IPC contracts, and one-active-Practice rule
are shared across Windows and macOS. Launcher commands, Electron runtime paths,
window focus/positioning, and `codex://` deep-link behavior are platform
adapters. Windows has passed the automated Electron flow in this repository;
physical macOS verification is still required after changes to those adapters.
