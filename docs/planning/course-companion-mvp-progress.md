# Course Companion MVP Plan and Progress Tracker

**Decision locked:** 6 August 2026; Home Base interaction corrected 7 August 2026
**Owner:** Triết
**Current phase:** Unified Home Base correction verified; ready for Triết's personal walkthrough
**Current decision:** Home Base is the roadmap; the current stage opens the focused lesson, while Hương remains a subordinate corner companion

## Product decision

The MVP is a real Electron desktop application around the learner's Codex
practice. It is not an HTML onboarding flow and it is not ContentPilot, the app
learners build during the course.

The personal-test version will provide a real Course Companion interface,
desktop-window behavior, learner journey, local progress, resume behavior, and
Teacher chat history. Teacher intelligence, Codex lifecycle events, and evidence
detection will initially come through clearly labelled fixture adapters.

The complete app now opens into a pixel Home Base whose main content is the
roadmap. The highlighted current stage is the lesson entry point; lesson and
Teacher are not separate primary-navigation destinations. The focused lesson
remains a distraction-limited scene, while Hương stays available as a compact
corner companion that expands into a right-docked overlay. Saved progress and
settings remain quiet header utilities.

### Home Base interaction correction — 7 August 2026

The first production Home Base exposed Home Base, roadmap, lesson, Hương,
progress, and settings as six equal tabs. User review rejected that hierarchy
because it fragmented one learning environment into artificial destinations and
made Hương visually dominant.

The accepted correction is:

- Home Base directly renders the Pilot roadmap;
- the current unlocked stage is visually highlighted and opens the focused
  lesson when selected;
- the lesson returns to the same roadmap-first Home Base;
- Hương sits in the bottom-right corner and expands into a right-docked overlay,
  never a primary tab; and
- progress and settings remain subordinate utility controls in the header.

The app becomes eligible for an external learner test only after those fixture
adapters are replaced by live Teacher and Codex integrations and the integration
gate in this document passes.

### Visual correction — 6 August 2026

The first Increment 1 renderer preserved the Electron workflow but failed user
review because its cream-and-green productivity-app styling replaced the
established pixel-art product identity. That renderer is technically verified
but is not visually accepted.

The selected correction is one focused mission inside the existing pixel world:

- the mission-room environment is the learning surface;
- Hương is an in-world pixel character, not a generic assistant card or bubble;
- the learner experiences concepts through dialogue, choices, consequences, and
  visible evidence changes;
- practice mode uses a transparent floating Hương sprite that expands into a
  pixel dialogue panel; and
- the Home Base, essential hotspots, roadmap, progress, and settings form the
  product shell; rewards, streaks, inventory, and a game economy remain deferred.

The disposable review surface is
[`prototypes/course-companion-focused-pixel/`](../../prototypes/course-companion-focused-pixel/).
The prototype was accepted as sufficient for MVP progression rather than as a
finished visual design. Its focused pixel scene and Hương companion have now
been migrated into the production Electron renderer.

## MVP finish line

The personal-test MVP is complete when Triết can launch the Course Companion
from the repository, complete or resume the Intro and Module 1 journey, orient
from Home Base, inspect the roadmap and saved progress, change a real companion
setting, move between the full learning window and the floating Teacher
companion, exercise the complete practice-and-debrief loop through honest
fixtures, quit the app, and recover the same state after relaunch.

This finish line validates the product experience and desktop behavior. It does
not validate live Teacher quality or real Codex observation.

## Required experience

```text
Launch Course Companion
  -> load saved progress
  -> welcome a new learner or offer exact resume
  -> open the roadmap-first pixel Home Base
  -> identify and select the highlighted current stage
  -> play an interactive character-led lesson scene
  -> present the current practice mission
  -> minimize the main window to the floating Teacher character
  -> let the learner work in the separate Codex app
  -> show fixture-backed Teacher and practice updates honestly
  -> collect the learner's evidence reflection
  -> play the debrief
  -> save progress and the next checkpoint
```

Closing the full learning window leaves the Teacher companion running. The app
ends only through an explicit Quit action.

## Scope firewall

### Required for personal testing

- A production package at `course-companion/`.
- Electron, React, and TypeScript.
- A full learning window.
- A pixel Home Base that directly presents the roadmap and opens the lesson from
  its highlighted current stage.
- A subordinate corner Hương overlay plus working progress and settings
  utilities.
- A roadmap that distinguishes the active Pilot from locked future modules.
- A progress surface backed by the saved learner state.
- A real setting for the floating companion's always-on-top behavior.
- An always-on-top floating Teacher character.
- An expandable Teacher chat panel.
- Intro and Module 1 only.
- A focused mission journey with character-led interactive scenes.
- New-learner and returning-learner paths.
- Real local progress, answers, activity, chat history, recovery, and reset.
- Typed `TeacherAdapter`, `PracticeAdapter`, and `ProgressRepository` boundaries.
- Clearly labelled fixtures for Teacher, Codex activity, evidence, offline, stale,
  and error states.
- A secure, narrow Electron preload/IPC boundary.
- Typecheck, lint, automated tests, production build, and desktop behavior checks.

### Explicitly deferred

- Free movement or an explorable-room game.
- Rewards, streaks, inventory, collectibles, or a game economy.
- Voice interaction or continuous screen awareness.
- Modules 2–6.
- Real Teacher inference in Triết's implementation scope.
- Real Codex App Server integration in Triết's implementation scope.
- Authentication, cloud persistence, analytics, or multi-device sync.
- Installer, updater, Windows validation, and public distribution.
- Final character-art and animation pipeline.

## Technical boundary

### Application structure

```text
course-companion/
  electron/       Electron main process, preload, windows, filesystem adapters
  src/            React learner interface and course orchestrator
  content/        Versioned Intro and Module 1 content
  fixtures/       Scripted Teacher, practice, evidence, and failure scenarios
  shared/         Schemas, event types, and adapter contracts
  tests/          Unit, integration, and desktop behavior checks
  package.json
```

A build tool may use a minimal internal HTML entry for the React renderer, but
the learner never opens an HTML file. The supported entry point is the Electron
application.

### Adapter responsibilities

`TeacherAdapter` provides connection status, conversation loading, message
sending, and streamed responses. The fixture implementation is scripted and
cannot edit files, run commands, or approve learner actions.

`PracticeAdapter` starts or resumes a mission and emits normalized lifecycle
events such as `session_started`, `prompt_submitted`, `work_started`,
`approval_requested`, `work_completed`, `evidence_updated`, and
`connection_lost`. Every event includes its mission, timestamp, source, and
correlation ID.

`ProgressRepository` loads, validates, saves, resets, and recovers course state.
The initial JSON/JSONL repository is real enough for personal testing but remains
replaceable by Duy's final persistence mechanism.

React components depend only on these interfaces. Fixture logic, filesystem
access, credentials, and future Codex integration stay outside the renderer.

### Honesty rule

All simulated events carry `source: "fixture"`. Development mode visibly shows
fixture status. A production configuration may never silently substitute a fake
success when a live service is unavailable.

## Local state contract

Electron owns the learner data in the operating system's application-data
directory. Browser `localStorage` is not the course authority.

- `learner-state.json` stores schema version, app version, course run, current
  lesson, mission, checkpoint, scene step, completed IDs, learner decisions,
  practice status, fixture evidence, Teacher summary, and timestamps.
- `activity-log.jsonl` stores meaningful journey and practice events.
- `teacher-chat.jsonl` stores timestamped messages and their fixture/live source.

Writes must be schema-validated and atomic, with a last-known-good recovery path.
The app must not store tokens, raw environment variables, unrelated Codex
threads, unrestricted transcripts, silent screenshots, or unrelated workspace
content.

## Implementation sequence

Each increment must end in a runnable state. Visual polish does not begin a new
increment while a required behavior in the current increment is broken.

### Increment 1 — Desktop shell

- Scaffold `course-companion/`.
- Launch the Electron and React application with the documented development
  command after dependencies are installed.
- Create the main window and floating Teacher window.
- Implement explicit Quit behavior and secure preload defaults.

**Technical and MVP visual status: Verified on macOS, 6 August 2026.** The real
application launches in Electron, opens the focused pixel learning scene with
Hương hidden, follows the lesson choices, minimizes or closes into the compact
always-on-top pixel companion, expands Hương, restores the learning window, and
exits through the explicit Quit action. The visual direction is intentionally
accepted as sufficient for the MVP rather than treated as final polish.

### Increment 2 — Journey and persistence

- Implement new versus returning learner routing.
- Add Intro and Module 1 content and scene transitions.
- Implement the local `ProgressRepository`, recovery, and reset.
- Prove exact-checkpoint resume after a complete app quit.

**Status: Verified on macOS, 6 August 2026.** A new learner starts in the
pixel welcome scene, progresses through the Intro checkpoints, and enters the
focused Module 1 mission. Every meaningful transition is saved through the
Electron-owned repository. A returning learner sees an explicit resume screen
with the exact saved scene. Reset and last-known-good recovery are implemented.

### Increment 3 — Floating Teacher

- Implement the minimized Teacher character and expanded chat panel.
- Persist window mode and chat history appropriately.
- Add accessible keyboard and focus behavior.
- Prove that closing the main window leaves the companion available.

**Status: Verified on macOS, 6 August 2026.** The compact Hương character opens
an expanded pixel chat panel with the current checkpoint, composer, message
history, and explicit live-disconnected fixture labels. Enter sends, Shift+Enter
creates a new line, focus moves to the composer on expansion, and both chat
history and companion mode survive a complete app restart. Reset clears the
journey, chat, and companion setting together.

### Increment 4 — Adapter-driven practice loop

- Connect the fixture `TeacherAdapter` and `PracticeAdapter`.
- Add hidden developer controls for success, approval, offline, stale, and error
  scenarios.
- Complete the mission briefing, Codex handoff, evidence reflection, and debrief
  loop.
- Ensure no fixture state is presented as live Codex evidence.

**Status: Verified on macOS, 7 August 2026.** The Electron-owned practice
adapter persists six explicit fixture scenarios: started, approval-required,
success, stale evidence, offline, and error. The expanded Hương panel separates
chat from practice, keeps the developer controls inside a disclosure, and
returns the viewport to the newly emitted result. Fixture success restores the
learning window into evidence reflection, debrief, and the deliberate Pilot 0.1
finish. Live Teacher inference and live Codex observation remain excluded.

### Increment 5 — Self-test release candidate

- Pass typecheck, lint, automated tests, and production build.
- Verify fresh start, resume, recovery, reset, window lifecycle, and companion
  behavior on macOS.
- Create a clean repository copy without `.git`, `node_modules`, build output,
  secrets, or learner state.
- Install dependencies inside the clean copy and repeat the self-test journey.

**Status: Verified on macOS, 7 August 2026.** A committed-HEAD snapshot was
created beside the working repository, audited before dependency installation,
installed from the lockfile, and exercised through the complete real-Electron
journey. The first rehearsal exposed a hard-coded Electron binary path in the
smoke test; commit `8c11131` replaced it with Electron's runtime resolver. A
second copy rebuilt from that checkpoint passed from a fresh install with no
Electron runtime initially present. Increment 6 superseded that pre-shell copy;
the refreshed Home Base copy is recorded below. External testing remains behind
the live integration gate.

### Increment 6 — Complete Course Companion shell

- Make the pixel Home Base the new-start and resume destination.
- Add explicit roadmap, lesson, Hương, progress, and settings navigation.
- Reuse one Teacher workspace inside the full app and floating companion.
- Persist and apply the floating companion's always-on-top setting.
- Preserve the focused lesson and existing fixture practice loop.

**Status: Verified in the source repository on macOS, 7 August 2026.** The real
Electron flow opens Home Base, reaches all six destinations, applies the
always-on-top setting to the native companion window, completes the full Pilot
journey, restores Hương, and survives relaunch. Desktop and 390px screenshots
confirm the pixel hierarchy and separate full-width narrow-layout rows. The
refreshed clean self-test copy passes the same complete Electron journey.

## Increment 1 verification record — 6 August 2026

- Runtime: Node.js 22.20.0 and npm 11.12.1.
- Pinned toolchain: Electron 43.3.0, electron-vite 5.0.0, Vite 7.3.6,
  React 19.2.8, and TypeScript 6.0.3.
- Dependency audit: 203 packages audited; 0 reported vulnerabilities.
- Static verification: typecheck and lint passed.
- Unit verification: 3/3 companion placement tests passed, including a
  negative-coordinate secondary display.
- Production build: Electron main, sandboxed CommonJS preload, and React
  renderer bundles built successfully.
- Desktop lifecycle smoke: launch, secure preferences, complete the focused
  lesson path, minimize, compact and expanded bounds, restore, native close,
  and explicit Quit passed against the real Electron runtime.
- Security preferences verified on both BrowserWindows: `contextIsolation: true`,
  `nodeIntegration: false`, and `sandbox: true`.
- Visual inspection: the 1180x780 real Electron window rendered the pixel room,
  Hương character, focused lesson panels, and vertically stacked choices.
- Narrow inspection: at 390x844, document and body width both remained 390px;
  the options remained separate 330px-wide left-aligned rows, the requested
  Vietnamese labels were present, and the renderer reported no console errors.
- Deliberately absent: persisted journey state, Teacher chat,
  Practice fixtures, and live Codex integration.

## Increment 2 verification record — 6 August 2026

- State authority: Electron-owned `learner-state.json`; browser
  `localStorage` remains unused.
- Save safety: schema and course version validation, whitelisted checkpoint and
  scene relationships, atomic temporary-file rename, and a last-known-good
  backup.
- Activity evidence: each successful checkpoint save and recovery appends a
  timestamped event to `activity-log.jsonl`.
- Unit verification: 8/8 tests passed across companion placement, new state,
  exact saves, start-time preservation, recovery, reset-required handling, and
  reset.
- Desktop lifecycle smoke: a clean profile started Intro, saved a checkpoint,
  quit fully, relaunched to the exact scene, completed Intro into Module 1,
  exercised the companion lifecycle, and retained `module-1-success` with
  checkpoint `m1-plan-approval` after explicit Quit.
- Real-app visual inspection: the 1180x780 new-learner pixel welcome screen
  rendered in Electron using an isolated temporary profile.
- Narrow inspection: at 390x844 the welcome and lesson scenes remained 390px
  wide with no horizontal overflow; growing lesson content became a scrollable
  single-column flow with no panel overlap.
- Deliberately absent: free-form Teacher chat, persisted chat history, practice
  lifecycle fixtures, and live Codex integration.

## Increment 3 verification record — 6 August 2026

- Adapter boundary: the renderer depends on typed Teacher message contracts;
  deterministic response logic and filesystem access remain in Electron.
- Persistence: learner and fixture messages append to `teacher-chat.jsonl`;
  malformed lines are skipped with a visible recovery notice rather than
  crashing or silently replacing the conversation.
- Honesty: the panel states `CHƯA KẾT NỐI TEACHER LIVE`, its identity says
  `TEACHER · MÔ PHỎNG`, and every fixture reply carries a `MÔ PHỎNG` badge.
- Unit verification: 14/14 tests passed across placement, progress, fixture
  source labelling, chat persistence, malformed-line recovery, mode persistence,
  and coordinated reset.
- Desktop lifecycle smoke: three real Electron launches proved journey resume,
  visible reset, checkpoint persistence, composer focus, Enter-to-send, fixture
  response, expanded-mode persistence, chat-history relaunch, restore, native
  close, and explicit Quit.
- Real-app visual inspection: the persisted chat rendered in the actual
  380x520 always-on-top Electron window with message history and checkpoint
  context readable.
- Narrow inspection: at 320x480 the panel and composer remained within 320px,
  focus stayed on `Nhắn cho Hương`, the message log scrolled internally, and no
  console errors or horizontal overflow appeared.
- Deliberately absent: live Teacher inference, streamed responses, practice
  lifecycle fixtures, and Codex observation.

## Increment 4 verification record — 7 August 2026

- State contract: learner state schema v2 adds the practice mission, normalized
  lifecycle event, fixture source, correlation ID, evidence freshness, and
  current practice status. Valid schema-v1 saves migrate without losing the
  learner's journey.
- Persistence safety: overlapping progress writes are serialized before the
  atomic temporary-file rename, preventing duplicate restore signals from
  colliding on macOS.
- Scenario coverage: started, approval-required, success, stale evidence,
  offline, and error all persist through the same typed `PracticeAdapter`.
- Honesty: every practice result shows **MÔ PHỎNG**; developer controls state
  that they create local events and do not observe real Codex work.
- Learning loop: a successful fixture restores Module 1 at evidence reflection,
  records the learner's evidence decision, plays the debrief, and persists
  `m1-complete` as the explicit Pilot 0.1 endpoint.
- Static and unit verification: typecheck and lint passed; 19/19 tests passed
  across window placement, progress, schema migration, concurrent-save safety,
  Teacher fixtures, and practice fixtures.
- Desktop lifecycle smoke: three real Electron launches exercised reset,
  journey progression, all six scenarios, chat, restore, reflection, debrief,
  Module 1 completion, explicit Quit, and relaunch persistence.
- Real-app visual inspection: the 380×520 practice panel kept the focused pixel
  identity, displayed current evidence without horizontal clipping, kept the
  developer matrix scrollable, and returned the scroll position to each new
  status.
- Deliberately absent: live Teacher inference, live Codex lifecycle events,
  automatic real-work evidence detection, and external learner validation.

## Increment 5 verification record — 7 August 2026

- Release source: `codex-content-creator-course-self-test-2026-08-07/` was
  created beside the working repository from committed `HEAD`, excluding all
  unrelated dirty work.
- Initial hygiene audit: 236 committed files; no `.git`, `node_modules`, build
  output, real environment file, live learner state, Teacher chat, or activity
  log. Safe `.env.example`, schema, and example learner-state files remain by
  design.
- Locked install: `npm ci --offline` installed 202 packages and audited 203;
  npm reported 0 vulnerabilities.
- Clean-copy verification: typecheck and lint passed; 19/19 unit tests passed;
  the production build succeeded.
- Blocker found and fixed: the original smoke test hard-coded an Electron
  binary path that does not exist immediately after Electron 43 installation.
  It now imports Electron's official executable resolver.
- Decisive desktop rehearsal: with no Electron `dist/` present before launch,
  the resolver installed the runtime and the three-launch smoke passed journey
  resume, reset, all six practice fixtures, reflection, debrief, Module 1
  completion, Teacher chat, window lifecycle, security settings, and persisted
  relaunch state.
- Supported entry point: `npm run dev` built the Electron main/preload surfaces,
  started the renderer server, and launched the app from the clean copy.
- Handoff state: locked dependencies remain installed for personal testing;
  generated `out/`, TypeScript build caches, and the temporary learner profile
  were removed after verification.

## Increment 6 verification record — 7 August 2026

- Product shell: new start and resume open a roadmap-first Home Base instead of
  dropping directly into one lesson scene.
- Interaction hierarchy: the former six-destination navigation bar is removed;
  the highlighted roadmap stage opens the lesson, while progress and settings
  remain header utilities.
- Shared Teacher behavior: the right-docked Hương overlay and floating panel use
  the same chat, practice, checkpoint, and persistence component.
- Real setting: `companionAlwaysOnTop` is validated, migrated from the old
  mode-only settings file, persisted atomically, and applied to the native
  BrowserWindow immediately.
- Honesty: Teacher and Codex remain visibly labelled as local fixtures; the
  settings surface does not imply a live connection.
- Static and unit verification: typecheck and lint passed; 21/21 tests passed.
- Desktop lifecycle smoke: the complete real-Electron journey passed across the
  roadmap-first Home Base, current-stage lesson entry, corner Hương, settings, all six
  practice fixtures, floating Hương, reset, quit, and restart persistence.
- Visual inspection: desktop captures show the roadmap as the dominant Home Base
  content and Hương at the right edge; the 390px Home Base uses full-width
  roadmap rows with no horizontal overflow.
- Prior clean-copy rehearsal: the pre-correction committed source was exported without `.git`,
  dependencies were installed from the lockfile, lint and 21/21 tests passed,
  and the complete Electron smoke passed from
  `codex-content-creator-course-self-test-2026-08-07-home-base/`.

## Progress snapshot

Do not convert these gates into one percentage. A locked decision, implemented
source, verified behavior, and learner validation are different kinds of
progress.

| Area | State | Evidence / next proof |
|---|---|---|
| Product boundary | **Locked** | Desktop journey, fixture boundary, and external-test boundary approved on 6 August 2026. |
| Production location | **Locked** | The real package is `course-companion/`; prototypes remain references. |
| Desktop shell | **Verified with MVP pixel renderer** | Electron lifecycle, security, real-app visual inspection, and narrow-width inspection pass. |
| Focused pixel scene | **Production migration verified** | The real Electron renderer contains the interactive vague-request, consequence, verifiable-brief, practice, and floating-Hương states. |
| Complete app shell | **Verified** | Roadmap-first Home Base, current-stage lesson entry, corner Hương overlay, progress, and working settings pass in the real Electron smoke. |
| Journey and state | **Verified** | New start, Intro-to-Module-1 transition, exact relaunch resume, recovery, and reset pass in the real Electron app. |
| Floating Teacher | **Fixture chat verified** | Compact/expanded mode, checkpoint context, keyboard flow, reset, and chat persistence pass across real app restarts. |
| Fixture practice loop | **Verified** | Six honest fixture states, evidence reflection, debrief, persistence, and real-app visual inspection pass. |
| Personal self-test gate | **Verified** | P1–P11 pass in source and the refreshed clean copy; Triết's hands-on walkthrough is next. |
| Live integration gate | **Deferred** | Belongs after the personal-test MVP and collaborator integration. |
| External learner evidence | **Blocked by design** | Do not invite a tester until the live integration gate passes. |

## Personal self-test acceptance gate

| ID | Acceptance check | Status |
|---|---|---|
| P1 | The supported entry point launches an Electron app, not an HTML course page. | Pass |
| P2 | A new learner can complete the Intro and enter Module 1. | Pass |
| P3 | A returning learner resumes the exact saved checkpoint. | Pass |
| P4 | Closing the main window leaves the floating Teacher character running. | Pass |
| P5 | Clicking the character opens chat and chat history survives a full restart. | Pass |
| P6 | The practice journey responds correctly to success, approval, stale, offline, and error fixtures. | Pass |
| P7 | Every simulated integration state is visibly identifiable as a fixture. | Pass |
| P8 | Reset and last-known-good recovery work without manually editing state files. | Pass |
| P9 | The renderer has no unrestricted Node.js, filesystem, credential, or shell access. | Pass |
| P10 | Typecheck, lint, tests, production build, and clean-copy rehearsal pass. | Pass |
| P11 | Home Base directly shows the roadmap, opens the focused lesson from the highlighted current stage, and keeps Hương plus utilities subordinate. | Pass |

The personal-test MVP is complete only when P1–P11 pass. Passing source checks
without verifying the desktop window lifecycle is insufficient.

## External tester integration gate

Before inviting an external learner, the team must additionally verify:

- a live Teacher implementation replaces the Teacher fixture;
- the Codex integration uses an explicit bound `threadId` rather than guessing
  which conversation is visible;
- the selected App Server lifecycle events, approvals, history, restart, and
  correlation behavior work on the target Codex surface;
- the learner can see what context the Teacher receives and how fresh it is;
- connection loss never becomes fake success or silent data loss;
- secrets, unrelated repositories, applications, and Codex threads stay outside
  the Teacher context;
- live integration state can resume safely after restarting both applications.

Packaging and broader platform validation may follow this gate unless the first
external tester needs a distributable installer.

## Rule for accepting new work

A newly noticed detail enters the personal-test MVP only if at least one is true:

- Without it, Triết cannot start, complete, or resume the approved journey.
- Without it, the application falsely represents fixture data as live evidence.
- It causes state loss, exposes sensitive information, or breaks the secure
  Electron boundary.
- It prevents reliable testing of the floating companion lifecycle.
- The same critical stall appears repeatedly during the personal rehearsal.

Otherwise, record it after the personal test and continue with the current
increment. Aesthetic preference alone is not an MVP blocker.

## Next action

Triết performs one personal walkthrough from
`codex-content-creator-course-self-test-2026-08-07-home-base/` using `cd
course-companion && npm run dev`. Record only blockers that prevent start,
orientation, completion, resume, honest fixture interpretation, or the floating
companion lifecycle. Do not invite an external tester or add Modules 2–6 until
the live Teacher/Codex integration gate is intentionally opened and verified.
