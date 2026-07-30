# Course Companion Simplified Architecture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the dense technical map with a plain-language, progressively disclosed visual that a collaborator can understand in roughly ten seconds.

**Architecture:** The page will render a five-actor overview first, then let the reviewer select one of six short scenario flows. Teacher visibility will use three explicit groups, while the accurate infrastructure map moves into a collapsed native `<details>` appendix.

**Tech Stack:** Semantic HTML, CSS, vanilla JavaScript, dependency-free Node.js structural tests, Chrome DevTools Protocol browser smoke tests.

## Global Constraints

- Keep the course companion separate from ContentPilot.
- Keep **Course Companion** as the product name, but label its interface layer
  **Course App** in the plain-language diagram.
- Preserve Teacher–Executor role separation.
- Default view contains no `threadId`, App Server, Hooks, Context Broker, lifecycle-event, or trust-boundary terminology.
- Use “connected Codex conversation” in the default view.
- Show no more than five actors in a selected scenario.
- Each scenario has three or four numbered steps and one short outcome.
- Screen sharing remains explicit, limited, visible, and revocable.
- The detailed technical model remains available in a collapsed native `<details>` appendix.
- The page stays dependency-free, keyboard accessible, responsive, and reduced-motion aware.
- Present this as a clean collaborator-facing architecture brief, not as part of the gamified learner interface.
- Do not use pixel-art framing, scanlines, game-console labels, or gamified decoration.

---

### Task 1: Simplified Structural Contract

**Files:**
- Modify: `prototypes/mvp-3-course-experience-companion/architecture-smoke.mjs`
- Test: `prototypes/mvp-3-course-experience-companion/architecture-smoke.mjs`

**Interfaces:**
- Consumes: `technical-architecture.html`, `technical-architecture.css`, and `technical-architecture.js`
- Produces: assertions for actor IDs, scenario IDs, privacy groups, collapsed details, plain-language defaults, and responsive accessibility behavior

- [x] **Step 1: Replace the dense-map assertions with the new contract**

Require these actor IDs:

```js
const actorIds = ["learner", "course", "teacher", "codex", "files"];
```

Require these scenario IDs:

```js
const scenarioIds = ["start", "work", "ask", "finish", "share", "disconnect"];
```

Assert that:

```js
assert.match(html, /data-actor="learner"/);
assert.match(html, /Teacher sees automatically/);
assert.match(html, /Teacher sees only when you share/);
assert.match(html, /Teacher never sees/);
assert.match(html, /<details[^>]*class="technical-details"/);
assert.doesNotMatch(html.match(/<section class="simple-overview"[\s\S]*?<\/section>/)?.[0] ?? "", /threadId|App Server|Hooks|Context Broker/);
assert.match(css, /prefers-reduced-motion/);
assert.match(css, /@media \(max-width:/);
assert.match(js, /Object\.freeze/);
assert.match(js, /aria-selected/);
```

Parse every scenario configuration and require three or four steps, an outcome, at least two actors, and at most five actors.

- [x] **Step 2: Run the structural test and verify RED**

Run:

```powershell
node prototypes/mvp-3-course-experience-companion/architecture-smoke.mjs
```

Expected: FAIL because the current page still exposes seven dense workflows and the old actor model.

### Task 2: Progressive-Disclosure Architecture Page

**Files:**
- Modify: `prototypes/mvp-3-course-experience-companion/technical-architecture.html`
- Modify: `prototypes/mvp-3-course-experience-companion/technical-architecture.css`
- Modify: `prototypes/mvp-3-course-experience-companion/technical-architecture.js`
- Test: `prototypes/mvp-3-course-experience-companion/architecture-smoke.mjs`

**Interfaces:**
- Consumes: the six `data-scenario` controls and five `data-actor` elements in HTML
- Produces: `setScenario(id, options)` and an immutable `scenarios` configuration with `actors`, `connections`, `steps`, `outcome`, and `status`

- [x] **Step 1: Replace the opening with a five-actor overview**

Render:

```text
Learner
├── Ask and learn → Course App → Teacher
└── Build and verify → Codex → Project Files
```

Use five large labeled actors, two directly labeled paths, and one connection label: “Follows one specific Codex conversation.”

- [x] **Step 2: Add the six scenario controls and one changing visual**

Create buttons for:

```text
I start a lesson
I work in Codex
I ask the Teacher
I finish a mission
I share my screen
Something disconnects
```

Create one visual stage with five reusable actors and labeled connections. Inactive actors become quiet; they do not remain a competing technical map.

- [x] **Step 3: Implement the scenario configuration**

Define:

```js
const scenarios = Object.freeze({
  start: { label, summary, actors, connections, steps, outcome, status },
  work: { label, summary, actors, connections, steps, outcome, status },
  ask: { label, summary, actors, connections, steps, outcome, status },
  finish: { label, summary, actors, connections, steps, outcome, status },
  share: { label, summary, actors, connections, steps, outcome, status },
  disconnect: { label, summary, actors, connections, steps, outcome, status }
});
```

`setScenario` must update selected-button state, active actors and connections, title, summary, numbered steps, outcome, and plain-language status.

- [x] **Step 4: Add Teacher visibility groups**

Render three groups:

```text
Teacher sees automatically
Teacher sees only when you share
Teacher never sees
```

Pair each group with a text label, symbol, and stable color. Do not depend on color alone.

- [x] **Step 5: Move infrastructure into a collapsed appendix**

Use:

```html
<details class="technical-details">
  <summary>Show technical details</summary>
  <!-- explicit binding, Orchestrator, Broker, Adapter, App Server/Hooks,
       Evidence Collector, boundaries, and technical-check caveats -->
</details>
```

Keep the appendix closed by default.

- [x] **Step 6: Implement responsive and accessibility behavior**

At narrow widths, stack actors in reading order and keep all labels readable. Keep native focus, arrow-key scenario navigation, optional number shortcuts, `aria-live="polite"`, and reduced-motion overrides.

- [x] **Step 7: Run the structural test and verify GREEN**

Run:

```powershell
node prototypes/mvp-3-course-experience-companion/architecture-smoke.mjs
```

Expected: PASS with 5 actors, 6 scenarios, 3 visibility groups, and a collapsed technical appendix.

### Task 3: Browser Coverage, Documentation, and Visual QA

**Files:**
- Modify: `prototypes/mvp-3-course-experience-companion/browser-smoke.mjs`
- Modify: `prototypes/mvp-3-course-experience-companion/README.md`
- Modify: `docs/architecture/course-companion-technical-workflow.md`
- Test: `prototypes/mvp-3-course-experience-companion/browser-smoke.mjs`

**Interfaces:**
- Consumes: the completed simplified architecture page
- Produces: browser interaction coverage, collaborator launch guidance, and a plain-language entry point in the canonical technical specification

- [x] **Step 1: Update the browser smoke test**

For each scenario:

```js
document.querySelector(`[data-scenario="${scenarioId}"]`).click();
```

Assert:

- the button has `aria-selected="true"`;
- two to five actors are active;
- the flow title and outcome change;
- three or four numbered steps render;
- the technical appendix starts closed and opens through its summary;
- no browser console errors occur.

- [x] **Step 2: Update documentation**

State that the default map is intentionally plain-language, scenario driven, and progressively disclosed. Add a short “Plain-language summary” to the canonical architecture document before its technical system map.

- [x] **Step 3: Run all checks**

Run:

```powershell
node --check prototypes/mvp-3-course-experience-companion/technical-architecture.js
node prototypes/mvp-3-course-experience-companion/smoke-test.mjs
node prototypes/mvp-3-course-experience-companion/architecture-smoke.mjs
node prototypes/mvp-3-course-experience-companion/browser-smoke.mjs
git diff --check
```

Expected: every command exits `0`.

- [x] **Step 4: Inspect desktop and narrow screenshots**

Confirm:

- the overview and two role paths are visible in the first desktop viewport;
- the default view contains no infrastructure jargon;
- the selected scenario is understandable without reading the appendix;
- narrow layout uses readable stacked actors rather than a scaled-down desktop canvas;
- the visibility groups remain distinguishable without relying only on color.

- [x] **Step 5: Commit**

```powershell
git add docs/architecture/course-companion-technical-workflow.md docs/superpowers/plans/2026-07-29-course-companion-simple-architecture.md prototypes/mvp-3-course-experience-companion/README.md prototypes/mvp-3-course-experience-companion/architecture-smoke.mjs prototypes/mvp-3-course-experience-companion/browser-smoke.mjs prototypes/mvp-3-course-experience-companion/technical-architecture.html prototypes/mvp-3-course-experience-companion/technical-architecture.css prototypes/mvp-3-course-experience-companion/technical-architecture.js
git commit -m "feat: simplify companion architecture map"
```
