# Course Companion — Simplified Architecture Design

**Date:** 29 July 2026
**Decision status:** Approved direction; ready for implementation planning after spec review.

## Purpose

Make the technical architecture understandable in roughly ten seconds, including for a distracted or non-technical collaborator, without removing the accurate technical model.

The existing architecture page is visually polished but presents too many components, arrows, labels, and caveats at once. The redesign will use progressive disclosure: plain-language visuals first, technical details only when requested.

## Success criteria

A reviewer should understand these five ideas without opening technical details:

1. The learner uses the Course App to talk with the Teacher.
2. The learner uses Codex to work with the Executor.
3. The course connects to one specific Codex conversation.
4. The Teacher receives only course-relevant context and evidence.
5. Screen sharing is optional and requires explicit learner permission.

The reviewer should also be able to answer:

- Who teaches?
- Who edits and runs commands?
- What can the Teacher see?
- What completes a mission?
- What happens if the connection fails?

## Information hierarchy

### Level 1 — Ten-second overview

The first viewport shows one simple visual with five large actors:

```text
Learner
   ├── asks → Teacher through the Course App
   └── builds → Executor through Codex → Project Files
```

A visible connection between the Course App and Codex says:

> Follows one specific Codex conversation

**Naming rule:** Course Companion remains the product name. The simple diagram
uses **Course App** for the interface layer so collaborators do not mistake it
for another agent or role.

No infrastructure terms appear in this first visual. Do not show `threadId`, App Server, Hooks, context broker, trust boundaries, or lifecycle events here.

Three short role labels sit directly below the visual:

- Teacher: explains and checks understanding.
- Executor: edits, runs, and verifies.
- Learner: decides and approves.

### Level 2 — “What happens when…”

Six large scenario buttons replace the seven compact technical tabs:

- I start a lesson
- I work in Codex
- I ask the Teacher
- I finish a mission
- I share my screen
- Something disconnects

Selecting a scenario updates one visual path. Each path contains:

- three or four numbered steps;
- one short sentence per step;
- one clear outcome;
- no more than five visible components;
- no unexplained acronym.

The active scenario uses a strong visual highlight. Inactive architecture disappears or becomes visually quiet instead of remaining as a dense background.

### Level 3 — Context visibility

Teacher context becomes three immediately distinguishable groups:

#### Teacher sees automatically

- current lesson and mission;
- learner decisions and answers;
- the connected Codex conversation;
- relevant changed files, tests, and mission evidence.

#### Teacher sees only when the learner shares it

- current window or screenshot;
- selected or unsaved text;
- voice during an active voice interaction.

#### Teacher never sees

- passwords, tokens, or environment secrets;
- unrelated applications or browser tabs;
- unrelated Codex conversations or repositories;
- continuous hidden screen capture;
- authority to approve an Executor action.

Use text labels and icons in addition to green, amber, and red. Color must not carry meaning alone.

### Level 4 — Technical details

A single **Show technical details** control reveals the existing technical concepts in a compact appendix:

- explicit `missionId ↔ threadId` binding;
- Course Orchestrator;
- Context Broker;
- Codex Adapter;
- App Server and/or trusted Hooks;
- Evidence Collector;
- local, Teacher-service, and OpenAI/Codex boundaries;
- technical-spike caveats.

The appendix is collapsed by default. It is a reference for engineering discussion, not the primary explanation.

## Scenario flows

### I start a lesson

```text
1. Course App loads my progress.
2. I see the mission briefing.
3. I connect one Codex conversation.
4. Codex becomes the main workspace.
```

Outcome: the Teacher and course know which mission and Codex conversation belong together.

### I work in Codex

```text
1. I give the Executor instructions in Codex.
2. The Executor edits or runs approved work.
3. Codex reports progress to the course.
4. Relevant results become mission evidence.
```

Outcome: the Teacher can follow progress without taking over the Executor.

### I ask the Teacher

```text
1. I open the Teacher bubble.
2. The course collects only relevant context.
3. The Teacher explains, questions, or gives a hint.
4. I decide what to do next in Codex.
```

Outcome: Teacher coaching never silently changes the repository.

### I finish a mission

```text
1. The course checks files, tests, and required artifacts.
2. The Teacher checks my understanding.
3. If both pass, the mission completes.
4. The story continues and the Home Base updates.
```

Outcome: saying “done” is not enough; completion requires evidence.

### I share my screen

```text
1. I choose Share view.
2. I select one window, region, or screenshot.
3. I confirm what will be shared and for how long.
4. I can stop sharing at any time.
```

Outcome: screen context is optional, visible, limited, and revocable.

### Something disconnects

```text
1. The course shows which connection is stale.
2. My lesson progress remains saved.
3. I reconnect the Codex conversation or continue working.
4. The Teacher never pretends stale context is current.
```

Outcome: connection failures do not erase course progress.

## Copy rules

- Use “connected Codex conversation” before introducing `threadId`.
- Use “project files and results” before “workspace evidence.”
- Use “course connection” before “Codex adapter.”
- Use “technical check needed” before “technical spike.”
- Keep each visible explanatory sentence below 18 words where practical.
- Prefer verbs: asks, teaches, edits, checks, connects, shares, stops.
- Do not use protocol names in the default view.
- Do not use unexplained abbreviations or two concepts in one label.

## Visual direction

This artifact is a collaborator-facing architecture brief, not part of the
learner's gamified course interface. Use a clean, neutral presentation style
that can be shown in a planning meeting or exported as a document:

- larger actors and arrows;
- more empty space;
- fewer simultaneous colors;
- one highlighted flow at a time;
- recognizable human and application icons;
- direct labels on arrows;
- minimal looping animation;
- no decorative metric counts.
- no pixel-art framing, scanlines, game-console labels, or gamified decoration.

The memorable visual should be the learner standing between two clear paths:

- **Ask and learn** with the Teacher.
- **Build and verify** with the Executor in Codex.

## Interaction and accessibility

- The overview must be useful before any interaction.
- Scenario controls are real buttons with visible focus.
- Arrow keys move between scenario buttons.
- Number keys are optional shortcuts, not required knowledge.
- The technical appendix uses native `<details>` and `<summary>` elements.
- Selected scenarios update an `aria-live="polite"` explanation.
- Icons remain decorative when the adjacent text already names the concept.
- Reduced-motion preferences disable path animation.
- The mobile view stacks actors in reading order and avoids shrinking the whole diagram into unreadable text.

## Error and recovery presentation

Do not show protocol-level errors by default. Use plain states:

- Connected
- Updating
- Context may be old
- Codex conversation disconnected
- Teacher unavailable

Each error shows one next action. Technical error details may appear inside the expanded appendix.

## Files and scope

The redesign modifies:

- `prototypes/mvp-3-course-experience-companion/technical-architecture.html`
- `prototypes/mvp-3-course-experience-companion/technical-architecture.css`
- `prototypes/mvp-3-course-experience-companion/technical-architecture.js`
- `prototypes/mvp-3-course-experience-companion/architecture-smoke.mjs`
- `prototypes/mvp-3-course-experience-companion/browser-smoke.mjs`
- `prototypes/mvp-3-course-experience-companion/README.md`

The canonical technical specification remains:

- `docs/architecture/course-companion-technical-workflow.md`

It may receive a short plain-language summary and a link to the simplified visualization, but its detailed contracts and technical claims remain intact.

## Verification

Automated checks must confirm:

- the five-actor overview is present;
- all six scenario controls exist;
- every scenario has three or four steps;
- default copy contains no unexplained infrastructure terms;
- the three Teacher-visibility groups are present;
- the technical appendix is collapsed by default;
- all scenario controls update the visual and explanation;
- desktop and narrow layouts remain readable;
- no browser console errors occur;
- reduced-motion and keyboard behavior remain supported.

Manual review must confirm that a collaborator can explain the Teacher, Executor, learner, context, and evidence model after viewing only the default overview.
