# Interactive Team Workload Map Design

**Date:** 31 July 2026
**Status:** Approved interaction direction; awaiting written-spec review
**Owners represented:** Duy and Triết

## Purpose

Replace the current long ADHD-friendly quick reference with a repo-local,
interactive HTML map that can be understood by scanning.

The map answers two questions:

1. What is the complete learner journey?
2. Who owns each part of that journey?

The full agreement remains in
[`docs/planning/team-workload-boundaries.md`](../../planning/team-workload-boundaries.md).
The interactive map is a short daily guide, not a second source of truth.

## Audience

The primary readers are Duy and Triết.

The design assumes a reader who:

- loses focus in long lists;
- should not need to remember information between sections;
- needs plain English;
- benefits from seeing the whole workflow before opening details;
- should be able to hide details after using them.

## Deliverables

### Interactive map

Create:

```text
docs/planning/team-workload-map.html
```

It is a self-contained HTML file with:

- embedded CSS;
- embedded JavaScript;
- no build step;
- no package dependency;
- no external font, script, or network request;
- light- and dark-theme support.

The collaborator opens the file locally in a browser after cloning or
downloading the repository.

### Short Markdown entry point

Reduce:

```text
docs/planning/team-workload-quick-reference.md
```

This file should contain only:

- a one-sentence purpose;
- a prominent link to the local HTML map;
- one sentence explaining how to open a local HTML file;
- a link to the full agreement;
- a three-line fallback:
  - learner content → Triết;
  - system mechanism → Duy;
  - both sides → talk first and choose one owner per output.

It must not repeat the full ownership lists.

### Full agreement

Keep:

```text
docs/planning/team-workload-boundaries.md
```

This remains the detailed authority for:

- edge cases;
- shared contracts;
- non-overlap rules;
- decision provenance;
- repository boundaries;
- update procedures.

Only links or small corrections required by the new map should change in this
file.

## Information Architecture

The map uses three complexity layers.

### Layer 1: Complete learner journey

The full workflow stays visible:

```text
Get the repo
  → Start the app
  → First-time setup
  → Learn theory
  → Enter practice
  → Build with help
  → Return progress
```

Each node shows:

- one short action;
- one owner label;
- an expand or hide button when details exist.

Owner labels are:

- `Duy`;
- `Triết`;
- `Split`;
- `Talk first`.

Color supports the owner label but never replaces it.

### Layer 2: Work areas inside one journey step

Selecting `+` on a Layer 1 node reveals its direct child nodes.

Examples:

- `First-time setup` expands to `Connect Codex`, `Ask questions`, and
  `Save answers`.
- `Build with help` expands to `Exercise`, `Teacher`, `Executor`, and
  `Progress`.

Only one Layer 1 branch is open at a time.

The separator must state the relationship explicitly:

```text
Layer 2 · Inside “First-time setup”
```

Do not use a floating vertical arrow between complexity layers.

### Layer 3: Fine-grained responsibilities

Selecting `+` on a Layer 2 node reveals short leaf nodes.

Examples:

- `Ask questions` expands to `Build the form`, `Write the words`, and
  `Choose the order`.
- `Teacher` expands to `Chat`, `Hints`, and `Memory`.

Only one Layer 2 branch is open at a time.

The separator must state:

```text
Layer 3 · Inside “Ask questions”
```

Leaf nodes do not create another graph layer. Each leaf has an `i` button that
reveals one short description inside the same node. Only one leaf description
is open at a time.

## Interaction Rules

- The complete Layer 1 journey never disappears.
- `+` expands the selected node.
- `−` hides the selected node.
- `i` shows or hides a leaf's inline description.
- Opening a new node at the same layer closes the previous node.
- Opening a different Layer 1 node also clears Layer 3.
- Opening a different leaf closes the previous leaf description.
- Expansion happens inside the graph, not in a separate prose panel.
- Leaf descriptions stay inside their node and never create Layer 4.
- Horizontal arrows are used only for chronological workflow.
- Labeled full-width dividers separate complexity layers.
- No animation is required for the first version.
- The browser back button is not used for graph state.
- Refresh returns the graph to the fully collapsed state.

## Content Rules

Every node must:

- use plain English;
- describe one action or responsibility;
- stay under five words when practical;
- avoid implementation jargon;
- show its owner without requiring color recognition.

Prefer:

```text
Ask permission
Write the words
Track evidence
Resume later
```

Avoid:

```text
Permission-gated dependency orchestration
Learner-facing instructional copy authoring
Practice evidence persistence mechanism
```

Detailed explanations belong in the full agreement, not inside graph nodes.

Each leaf description must:

- use one plain-English sentence;
- use no more than 14 words;
- explain the task without repeating its title;
- avoid implementation jargon.

## Ownership Content

### Get the repo — Duy

- README steps
  - Copy clone command
  - Open the repo

### Start the app — Duy

- Check tools
  - Check Node
  - Check Codex
  - Check app files
- Ask permission
  - Show exact commands
  - Wait for Yes
- Open the app
  - Launch Electron
  - Resume saved state

### First-time setup — Split

- Connect Codex — Duy
  - Read login status
  - Open official login
  - Never store tokens
- Ask questions — Split
  - Build the form — Duy
  - Write the words — Triết
  - Choose the order — Triết
- Save answers — Duy
  - Check answers
  - Save non-secret data

### Learn theory — Triết

- Course App
  - App navigation
  - Course UI/UX
- Lesson content
  - Slides
  - Explanations
  - Examples

### Enter practice — Talk first

- Send the task — Triết
  - Lesson ID
  - Exercise brief
  - Success rules
- Start session — Duy
  - Check the request
  - Bind the Executor
  - Open Practice Mode

### Build with help — Split

- Exercise — Triết
  - Instructions
  - Examples
  - Success rules
- Teacher — Duy
  - Chat
  - Hints
  - Memory
- Executor — Duy
  - Bind one thread
  - Read activity
  - Keep scope narrow
- Progress — Duy
  - Track evidence
  - Check completion
  - Resume later

### Return progress — Talk first

- Send result — Duy
  - Status
  - Evidence summary
  - Mastery summary
- Show result — Triết
  - Update course
  - Choose next lesson

## Visual Design

The graph uses a neutral background and high-contrast cards.

Ownership colors:

- Duy: orange;
- Triết: blue;
- Split: purple;
- Talk first: green.

Each color requires a visible text label.

Theme requirements:

- declare `color-scheme: light dark`;
- provide explicit light and dark variables;
- use theme variables for backgrounds and text;
- meet readable contrast in both themes;
- never place inherited dark-theme text on a fixed pale background.

The graph may scroll horizontally on narrow screens. It must not compress node
text until it becomes difficult to read.

## Accessibility

- Expand buttons use native `<button>` elements.
- Each button has an `aria-label`.
- Each button updates `aria-expanded`.
- Keyboard focus is visible.
- Owner meaning is available in text.
- Text remains readable at 200% browser zoom.
- Motion is not required.
- The document has one clear `<h1>`.
- The graph is wrapped in a labeled region.

## Failure and Recovery

Because the page is self-contained, normal failures are limited:

- If JavaScript is disabled, show the complete Layer 1 journey and a link to
  the full agreement.
- If the file is moved, relative links to the agreement must still resolve
  from `docs/planning/`.
- If the viewport is narrow, horizontal scrolling preserves the graph.
- If stored state becomes a future requirement, design it separately. The
  first version stores no state.

## Validation

Automated checks should verify:

- the seven Layer 1 nodes and their order;
- every node's displayed owner;
- only one Layer 1 branch opens at a time;
- only one Layer 2 branch opens at a time;
- opening a new Layer 1 branch clears Layer 3;
- expand buttons update `aria-expanded`;
- leaf description buttons update `aria-expanded`;
- leaf descriptions open inline without creating Layer 4;
- only one leaf description opens at a time;
- all responsibility labels from this specification appear;
- no external requests or dependencies exist;
- links to the quick reference and full agreement resolve.

Manual checks should verify:

- the whole journey is understandable while collapsed;
- expanding `First-time setup` shows the Duy/Triết split;
- expanding `Build with help` shows exercise content versus mechanism;
- opening a leaf description explains the task without changing graph layers;
- the layer dividers cannot be mistaken for workflow arrows;
- light theme is readable;
- dark theme is readable;
- keyboard-only use works;
- 200% zoom remains usable;
- a reader can identify the correct owner without opening the full agreement.

## Out of Scope

- GitHub Pages or other hosting;
- editing the map from a graphical admin interface;
- saving expanded graph state;
- analytics;
- search;
- arbitrary zoom and pan;
- changing the full ownership agreement;
- replacing the full agreement with the map.
