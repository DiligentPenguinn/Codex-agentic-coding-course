# Course Experience UI — Collaborator Update

**Snapshot date:** 6 August 2026
**Status:** One canonical visual prototype selected; Electron implementation has not started.

## Interactive mock

The collaborator-facing mock is located at:

- [`prototypes/mvp-3-course-experience-companion/`](../../prototypes/mvp-3-course-experience-companion/)

It is the repository's single current visual authority for the teaching
application. It demonstrates the approved interaction direction with visible
simulation labels and a complete Home Base-to-debrief loop. It is not a
production Codex integration. Earlier standalone Teacher-layout and
roadmap-comparison experiments have been retired.

The collaborator-facing technical map is:

- [`prototypes/mvp-3-course-experience-companion/technical-architecture.html`](../../prototypes/mvp-3-course-experience-companion/technical-architecture.html)

The canonical architecture and context contract are:

- [`docs/architecture/course-companion-technical-workflow.md`](../architecture/course-companion-technical-workflow.md)

## Executive summary

The UI discussed here belongs to the **course experience**, not to ContentPilot. ContentPilot remains the product learners build. The course UI wraps the learning experience around Codex.

The current direction is a hybrid desktop experience:

- Codex remains the primary work surface.
- A separate always-on-top desktop companion provides the course interface.
- A persistent pixel-art room serves as the landing page and narrative home base.
- The Teacher is available through an expandable chat bubble while the learner works in Codex.
- Linear visual-novel scenes frame each mission before and after practical work.
- Teacher and Executor remain separate roles.

## Product model

### Learner

The Learner owns the goal, writes or approves instructions, makes decisions, and evaluates evidence.

### Teacher

The Teacher explains, diagnoses, asks questions, gives bounded hints, and assesses mastery. The Teacher can react to course and Executor context but does not perform repository work for the learner.

### Executor

The Executor operates through Codex. It reads files, proposes plans, edits within an approved scope, runs commands and tests, and reports evidence. It does not teach, coach, or grade.

## Approved experience direction

### 1. Hybrid desktop companion

The companion is a separate application rather than an injected component inside Codex. It can:

- remain always on top;
- expand into the course Home Base;
- shrink into the Teacher bubble;
- show visual-novel scenes;
- retain course progress independently of the Codex window.

This is currently the lowest-effort path that preserves Codex as the real working environment.

### 2. Persistent pixel-art Home Base

The landing page is an immersive room rather than a dashboard or equal-weight mode grid. Learners navigate through objects in the environment:

| Room object | Destination |
|---|---|
| Mission board | Current story, mission briefing, scene archive |
| Workstation | Codex Workshop |
| Teacher character | Teacher chat |
| Bookshelf | Progress, completed artifacts, mission archive |
| Calendar/window detail | Streak and lightweight progression |
| Reward chest | Future unlocks and cosmetic rewards |

The room evolves as the learner advances. New objects, decorations, lighting changes, and displayed artifacts make progress visible without relying only on points.

### 3. Linear narrative framing

The story is authored and linear. It frames fixed lessons rather than creating consequential branching paths.

The Narrative Director owns canonical scenes, triggers, expressions, and unlocks. The Teacher may react in character, but does not freely invent plot events or change the course sequence.

### 4. Experience flow

```text
Home Base
  → authored mission briefing
  → Codex Workshop
  → optional Teacher coaching through the bubble
  → evidence checkpoint
  → authored debrief
  → visibly updated Home Base
```

Narrative is strongest at transitions. During practical work it becomes ambient so the learner can focus on Codex.

### 5. Modes are application states

The learner does not repeatedly choose among equal pages. The main application states are:

- **Home Base:** default landing and orientation state.
- **Scene:** authored visual-novel sequence.
- **Workshop:** Codex is primary and the companion is minimized.
- **Teacher Chat:** overlay available from Home Base or Workshop.
- **Debrief:** evidence-triggered narrative resolution.

Teacher Chat is an overlay, not a destination that destroys the underlying context.

## Context and integration feasibility

### Context the Teacher should receive automatically

- current course, chapter, mission, and checkpoint;
- learner answers and approved decisions;
- explicitly bound Executor thread;
- Executor messages, plan, approvals, commands, diffs, and test evidence;
- workspace artifacts relevant to the active mission.

### Context requiring explicit sharing

- the learner's currently focused editor or browser tab;
- selected text or unsaved editor content;
- screenshots or other desktop applications.

The design principle is **Teacher-aware, not learner surveillance**. The companion must show what the Teacher can currently see and when that context was last updated.

### Technical constraint

The correct Executor conversation cannot be inferred reliably merely by watching the Codex window. Each course mission should create or explicitly bind one Codex thread. A context broker can then combine course state, the bound thread, workspace evidence, and optional learner-shared screen context.

### Proposed technical architecture

The first implementation should use a replaceable Codex integration adapter:

- **Codex App Server** is the primary documented reference for conversation history, approvals, and streamed rich-client events.
- **Trusted Codex Hooks** are a candidate lifecycle-event bridge when the learner remains in a native Codex surface.
- The concrete payloads, session identity, restart behavior, and thread correlation on the chosen surface remain a **technical spike**, not a confirmed production capability.

Each active course run persists:

```text
courseRunId + missionId + threadId + workspaceRoot
```

The Teacher receives a bounded context envelope with:

- active course state and learner decisions;
- the explicitly bound Executor thread's status and scoped recent history;
- changed-file metadata, diff summary, tests, and expected artifacts;
- mastery state, hint level, timestamps, and provenance;
- an optional learner-approved shared view with visible expiry.

The Teacher never automatically receives secrets, unbound threads, unrestricted workspace content, unrelated applications, or silent screen capture.

## Persistence and recovery

Persistent learning state and transient window state remain separate.

Persistent state includes:

- current mission and completed checkpoints;
- narrative progress and unlocked room objects;
- bound Executor thread;
- evidence and mastery status;
- Teacher conversation summary.

Transient state includes:

- companion size and position;
- open panel or highlighted object;
- bubble versus full-window presentation.

Opening the companion normally returns to Home Base. An active mission presents a clear resume action. If the Executor thread is unavailable, the learner returns to Home Base with a reconnection path rather than losing progress.

## Mock UI scope

The current mock demonstrates:

- the pixel-art Home Base;
- interactive room hotspots;
- an authored mission briefing;
- a simulated Codex Workshop transition;
- the minimized Teacher bubble;
- expandable Teacher chat;
- progress, streak, archive, and reward concepts;
- mission completion and an updated-room state;
- visible labels for simulated integrations.

It does not implement:

- real Codex thread binding;
- real Teacher inference;
- voice chat;
- continuous screen or tab awareness;
- OS-level always-on-top behavior;
- production persistence or authentication.

The technical map is also a proposal rather than a live integration. Its
`TECHNICAL SPIKE` labels identify assumptions that must be validated on the
selected Codex desktop surface before implementation estimates are treated as
reliable.

## Deferred decisions

The team intentionally has not selected:

- the exact first pilot/vertical-slice boundary;
- Electron versus another desktop wrapper;
- production voice interaction;
- whether active editor context warrants a future VS Code extension;
- the final reward economy;
- the complete narrative and character art pipeline.

## Recommended next decisions

1. Review the interactive mock with the collaborator.
2. Test whether learners understand the room hotspots without explanation.
3. Run a technical spike for explicit Codex thread binding and lifecycle events.
4. Select a single end-to-end mission for the first implemented pilot.
5. Only then estimate production art, desktop packaging, voice, and deeper gamification.

## Questions for the collaborator update

- Does the Home Base feel like part of the course rather than a decorative menu?
- Does the transition into Codex preserve immersion?
- Is the Teacher helpful without becoming intrusive?
- Which context should be automatic, and which should require explicit sharing?
- What is the smallest mission that can validate the whole loop?
