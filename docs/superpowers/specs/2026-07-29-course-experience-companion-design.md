# Course Experience Companion Design

**Date:** 29 July 2026  
**Decision status:** Core interaction design approved; production pilot boundary deferred.

## Purpose

Create a demonstrable course-experience mock that communicates the approved hybrid Teacher–Executor workflow. The mock is for collaborator review and does not attempt production Codex integration.

The course companion and ContentPilot are separate products:

- ContentPilot is the application learners build.
- The course companion teaches and frames the work performed in Codex.

## Audience and success criteria

The immediate audience is the project team and collaborators reviewing the product direction.

The mock succeeds when a reviewer can understand, without a verbal walkthrough:

1. that the pixel room is the course landing page;
2. where Story, Workshop, Teacher Chat, progress, streak, and rewards live;
3. that Codex becomes the primary surface during practical work;
4. that the Teacher remains available as an expandable bubble;
5. that narrative frames a linear mission before and after the Workshop;
6. which capabilities are simulated and which require later integration.

## Experience architecture

### Home Base

A persistent pixel-art room is the default landing surface. It is not a conventional dashboard. Interactive objects act as diegetic navigation:

- mission board: story and mission briefing;
- workstation: Workshop transition;
- Teacher: Teacher Chat;
- bookshelf: progress and artifacts;
- calendar: streak;
- reward chest: future unlocks.

The active objective receives the strongest visual cue. All hotspots remain keyboard accessible and have visible labels on focus or hover.

### Scene

An authored visual-novel overlay presents a short mission briefing or debrief. It contains:

- scene and chapter label;
- speaker portrait and name;
- authored dialogue;
- progress through the short scene;
- one primary continuation action.

The mock includes one briefing and one debrief. Narrative choices do not branch the course.

### Workshop

The Workshop view demonstrates the intended transition rather than implementing a Codex client. It contains a clearly labeled simulated Codex workspace and exposes:

- the active mission objective;
- a mock Executor plan and activity feed;
- changed-file and test-evidence summaries;
- the always-on-top Teacher bubble;
- a visible context-sharing status.

The design never represents simulated Executor output as a real integration.

### Teacher Chat

Teacher Chat expands over either Home Base or Workshop. It contains:

- Teacher identity and current availability;
- a short message history;
- text input and sample responses;
- a context drawer showing what the Teacher currently knows;
- disabled or simulated voice and screen-share controls;
- minimize control that returns to the underlying state.

The Teacher is a service/agent; the bubble is only its communication client.

### Progress surfaces

The bookshelf opens a compact progress view with completed evidence, current chapter, and locked future material. The calendar exposes streak status. The chest previews cosmetic rewards. These are demonstrations of gamification placement rather than a finalized reward system.

## State model

The mock has five presentation states:

- `home`
- `scene`
- `workshop`
- `chat`
- `debrief`

The JavaScript state stores the underlying surface separately from overlays so closing Teacher Chat restores Home Base or Workshop correctly.

The mock persists only safe demonstration values in `localStorage`:

- whether the briefing was viewed;
- whether the simulated mission was completed;
- whether the room reward was unlocked.

No real learner data, conversation transcript, file content, or credentials are stored.

## Visual direction

The interface uses a handcrafted 16-bit pixel-art environment with:

- crisp integer-like edges and framed panels;
- a cool cyan/blue exterior balanced by amber interior lighting;
- small, deliberate animation around active hotspots;
- a game dialogue font for headings and a readable sans-serif font for body copy;
- restrained particle and lighting effects;
- accessibility overrides for reduced motion.

The UI avoids generic dashboard cards as the primary composition. Functional overlays use the same pixel-frame language but remain readable.

## Content model

The mock uses one sample mission:

**Chapter 1 — Brief Codex like a collaborator**  
**Mission:** Create a safe, verifiable implementation brief.

The sample reinforces the existing course roles:

- Learner decides and approves.
- Teacher coaches and assesses.
- Executor performs scoped repository work.

## Simulated integration boundaries

The following elements are intentionally simulated and visibly labeled:

- launching or focusing Codex;
- Executor conversation and tool activity;
- Teacher awareness of the Executor thread;
- file changes and tests;
- voice chat;
- active-tab or screen sharing;
- evidence-triggered completion.

No UI element claims that the mock is connected to a live Codex session.

## Error and recovery presentation

The mock includes presentation states for:

- no Executor thread connected;
- context last updated timestamp;
- reconnect action;
- disabled voice capability;
- explicit screen-share consent.

A production implementation must fail back to Home Base without losing course progress.

## Accessibility

- Every hotspot is a real button with an accessible name.
- Keyboard focus is visibly distinct.
- `Escape` closes the topmost overlay.
- `T` toggles Teacher Chat and `H` returns to Home Base when focus is not in a text field.
- Text remains selectable and does not depend on image-embedded labels.
- Reduced-motion preferences disable decorative motion.

## Files

The mock is isolated under `prototypes/mvp-3-course-experience-companion/`:

- `index.html`: semantic structure and all mock panels;
- `styles.css`: visual system, room overlays, responsive states, and motion;
- `app.js`: state transitions, simulated messages, progress, and keyboard handling;
- `smoke-test.mjs`: dependency-free structural assertions;
- `assets/home-base.png`: generated pixel-art room;
- `assets/teacher.png`: generated Teacher sprite with transparent background;
- `README.md`: purpose, launch instructions, interaction map, and limitations.

## Verification

- Run `node prototypes/mvp-3-course-experience-companion/smoke-test.mjs`.
- Serve the repository locally and inspect the mock in a desktop browser.
- Exercise every hotspot, scene step, Workshop transition, bubble expansion, close action, keyboard shortcut, and simulated mission-completion action.
- Inspect at desktop and narrow viewport widths.
- Confirm every simulated capability is visibly labeled.
