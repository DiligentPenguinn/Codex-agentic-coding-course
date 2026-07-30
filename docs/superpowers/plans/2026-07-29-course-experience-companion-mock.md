# Course Experience Companion Mock Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a dependency-free interactive mock that demonstrates the approved pixel-art Home Base, linear narrative scenes, Codex Workshop transition, and expandable Teacher companion.

**Architecture:** A static HTML document defines accessible surfaces and controls, CSS provides the pixel-art presentation and responsive layout, and one JavaScript module owns the small presentation-state machine. A dependency-free Node smoke test verifies the required surfaces, hotspot targets, simulated-integration labels, asset references, and JavaScript actions.

**Tech Stack:** HTML5, CSS, browser JavaScript, Node.js built-in modules.

## Global Constraints

- The mock represents the course experience, not ContentPilot.
- Teacher, Executor, and Learner roles remain distinct.
- Narrative is authored and linear.
- Codex, voice, screen sharing, thread binding, and evidence detection are visibly simulated.
- No external runtime dependencies or network calls.
- Vietnamese learner-facing copy uses correct Vietnamese diacritics when present.

---

### Task 1: Structural smoke test and semantic shell

**Files:**
- Create: `prototypes/mvp-3-course-experience-companion/smoke-test.mjs`
- Create: `prototypes/mvp-3-course-experience-companion/index.html`

**Interfaces:**
- Consumes: asset names and state names defined in the approved design.
- Produces: DOM IDs `homeView`, `sceneOverlay`, `workshopView`, `teacherChat`, `progressPanel`, `streakPanel`, and `rewardPanel`; hotspot buttons with `data-action`.

- [ ] **Step 1: Write the failing structural test**

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = dirname(fileURLToPath(import.meta.url));
const html = readFileSync(join(root, "index.html"), "utf8");

for (const id of [
  "homeView",
  "sceneOverlay",
  "workshopView",
  "teacherChat",
  "progressPanel",
  "streakPanel",
  "rewardPanel"
]) {
  assert.match(html, new RegExp(`id=["']${id}["']`), `missing #${id}`);
}

for (const action of [
  "open-mission",
  "open-workshop",
  "open-teacher",
  "open-progress",
  "open-streak",
  "open-reward"
]) {
  assert.match(html, new RegExp(`data-action=["']${action}["']`), `missing ${action}`);
}

assert.match(html, /Simulated integration/i);
assert.match(html, /assets\/home-base\.png/);
assert.match(html, /assets\/teacher\.png/);
```

- [ ] **Step 2: Run the test and verify RED**

Run:

```powershell
node prototypes/mvp-3-course-experience-companion/smoke-test.mjs
```

Expected: failure because `index.html` does not exist.

- [ ] **Step 3: Create the semantic HTML shell**

Create the required IDs and actions as real buttons. Add a skip link, live region, Home Base hotspot labels, authored briefing/debrief containers, simulated Workshop, Teacher Chat, progress, streak, and reward panels. Include `styles.css` and load `app.js` with `defer`.

- [ ] **Step 4: Run the test and verify GREEN**

Run:

```powershell
node prototypes/mvp-3-course-experience-companion/smoke-test.mjs
```

Expected: `Course companion smoke test passed.`

### Task 2: Pixel-art visual system and project assets

**Files:**
- Create: `prototypes/mvp-3-course-experience-companion/styles.css`
- Create: `prototypes/mvp-3-course-experience-companion/assets/home-base.png`
- Create: `prototypes/mvp-3-course-experience-companion/assets/teacher.png`

**Interfaces:**
- Consumes: semantic classes and IDs from `index.html`.
- Produces: desktop-first room composition, pixel frames, overlay transitions, responsive narrow layout, and reduced-motion behavior.

- [ ] **Step 1: Extend the smoke test**

Add assertions that `styles.css`, `assets/home-base.png`, and `assets/teacher.png` exist and that the CSS contains `prefers-reduced-motion`, `:focus-visible`, and the five presentation-state selectors.

- [ ] **Step 2: Run the test and verify RED**

Expected: failure naming the first missing visual asset or CSS requirement.

- [ ] **Step 3: Add the visual system and assets**

Copy the generated room artwork into `assets/home-base.png`. Remove the generated Teacher sprite's chroma-key background and save the alpha result as `assets/teacher.png`. Implement the cool-blue/amber palette, visible hotspot affordances, pixel-frame panels, Teacher bubble, animated quest marker, and responsive layout.

- [ ] **Step 4: Run the test and verify GREEN**

Expected: `Course companion smoke test passed.`

### Task 3: Interaction state machine and simulated course loop

**Files:**
- Modify: `prototypes/mvp-3-course-experience-companion/smoke-test.mjs`
- Create: `prototypes/mvp-3-course-experience-companion/app.js`

**Interfaces:**
- Consumes: buttons with `data-action` and panels with the approved DOM IDs.
- Produces: `setSurface(surface)`, `openPanel(panelId)`, `closeTopLayer()`, `renderScene()`, `sendTeacherMessage()`, and `completeSimulatedMission()`.

- [ ] **Step 1: Extend the smoke test for required actions**

Assert that `app.js` defines each produced function and handles `Escape`, `KeyT`, and `KeyH`.

- [ ] **Step 2: Run the test and verify RED**

Expected: failure because `app.js` does not exist.

- [ ] **Step 3: Implement the minimal interaction state machine**

Implement:

- hotspot-to-panel routing;
- briefing dialogue progression;
- transition from briefing to simulated Workshop;
- Teacher bubble expansion and minimization;
- three canned Teacher responses selected from learner input keywords;
- explicit context-details drawer;
- simulated mission completion and debrief;
- room reward unlock;
- safe demonstration progress in `localStorage`;
- top-layer close and keyboard shortcuts.

- [ ] **Step 4: Run the test and verify GREEN**

Expected: `Course companion smoke test passed.`

### Task 4: Handoff documentation and browser verification

**Files:**
- Create: `prototypes/mvp-3-course-experience-companion/README.md`
- Modify: `docs/planning/course-experience-ui-progress.md`

**Interfaces:**
- Consumes: completed mock behavior and known simulation boundaries.
- Produces: collaborator-ready launch instructions, interaction map, limitations, and recommended next decisions.

- [ ] **Step 1: Add README assertions to the smoke test**

Require the README to contain the headings `How to run`, `What to click`, and `What is simulated`.

- [ ] **Step 2: Run the test and verify RED**

Expected: failure because the README is missing.

- [ ] **Step 3: Write the mock README**

Document a zero-install launch option, a local-server option, all hotspot interactions, keyboard shortcuts, simulated boundaries, and the generated-asset prompts.

- [ ] **Step 4: Run automated verification**

Run:

```powershell
node prototypes/mvp-3-course-experience-companion/smoke-test.mjs
```

Expected: `Course companion smoke test passed.`

- [ ] **Step 5: Run browser verification**

Serve the repository locally, open the prototype, and exercise:

1. mission board → briefing → Workshop;
2. Teacher bubble → chat → minimize;
3. context drawer and simulated screen-share consent;
4. simulated completion → debrief → updated room;
5. progress, streak, and reward panels;
6. `Escape`, `T`, and `H`;
7. desktop and narrow viewport layouts.

Expected: no console errors, no inaccessible hidden focus, and every integration simulation visibly labeled.
