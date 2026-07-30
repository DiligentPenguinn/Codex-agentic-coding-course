# Course Companion Technical Diagram Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a collaborator-ready technical architecture document and interactive diagram that explain how the course companion, Teacher, Codex Executor, learner workspace, evidence, and privacy controls work together.

**Architecture:** The documentation will define one recommended MVP architecture: a local always-on-top companion binds explicitly to one Codex thread, receives scoped lifecycle events through a Codex integration adapter, assembles a provenance-bearing Teacher context snapshot, and keeps all screen sharing opt-in and ephemeral. A dependency-free HTML diagram will render this system as selectable end-to-end workflows rather than imply that the existing visual mock already has a live Codex connection.

**Tech Stack:** Markdown and Mermaid for the canonical specification; semantic HTML, CSS, and vanilla JavaScript for the interactive diagram; Node.js for dependency-free structural tests.

## Global Constraints

- Keep the course companion separate from ContentPilot.
- Preserve Teacher–Executor role disaggregation: Teacher coaches and assesses; Executor operates on the repository; Learner decides and approves.
- Treat the Codex App Server and trusted Hooks as proposed integration adapters that require a technical spike against the selected Codex surface.
- Do not claim there is a documented API for detecting the currently focused native Codex thread.
- Bind the course session to an explicit Codex `threadId`.
- Share the current tab, window, or screen only after an explicit learner action, with visible scope and expiry.
- Never include secrets, unrelated applications, unbound threads, or unrestricted workspace content in Teacher context.
- Keep the diagram dependency-free and directly openable through the prototype's existing local server.
- Label unimplemented integrations as proposed or simulated.

---

### Task 1: Canonical Technical Architecture

**Files:**
- Create: `docs/architecture/course-companion-technical-workflow.md`

**Interfaces:**
- Consumes: the approved companion interaction model in `docs/superpowers/specs/2026-07-29-course-experience-companion-design.md`
- Produces: stable component names, context-envelope fields, workflow IDs, trust boundaries, and MVP decisions used by the interactive diagram

- [x] **Step 1: Write the architecture document**

Define:

- the recommended local companion + explicit thread binding architecture;
- presentation, orchestration, Teacher, Codex, workspace, evidence, persistence, and optional capture components;
- the `TeacherContextEnvelope` JSON example with source, freshness, and scope;
- the start/resume, Executor activity, ask Teacher, approval/evidence, screen-share, and recovery sequences;
- default Teacher visibility and explicit exclusions;
- documented Codex capabilities versus product decisions and technical-spike assumptions;
- phased MVP implementation and unresolved validation questions.

- [x] **Step 2: Review terminology and boundaries**

Run:

```powershell
rg -n "ContentPilot|Teacher|Executor|threadId|App Server|Hooks|screen|secret|proposed|technical spike" docs/architecture/course-companion-technical-workflow.md
```

Expected: every architectural boundary is discoverable, `threadId` is explicit, and uncertain Codex integration behavior is labeled as a spike rather than a guarantee.

- [x] **Step 3: Commit**

```powershell
git add docs/architecture/course-companion-technical-workflow.md
git commit -m "docs: define companion technical architecture"
```

### Task 2: Interactive Workflow Diagram

**Files:**
- Create: `prototypes/mvp-3-course-experience-companion/technical-architecture.html`
- Create: `prototypes/mvp-3-course-experience-companion/technical-architecture.css`
- Create: `prototypes/mvp-3-course-experience-companion/technical-architecture.js`
- Create: `prototypes/mvp-3-course-experience-companion/architecture-smoke.mjs`

**Interfaces:**
- Consumes: component IDs and workflow IDs from `docs/architecture/course-companion-technical-workflow.md`
- Produces: `data-node` component elements, `data-edge` relationship elements, and workflow buttons using the IDs `overview`, `launch`, `executor`, `teacher`, `evidence`, `share`, and `recovery`

- [x] **Step 1: Write the failing structural test**

Create `architecture-smoke.mjs` to assert that:

- HTML links the architecture CSS and JavaScript;
- all seven workflow controls exist;
- all core component nodes and trust-boundary labels exist;
- the context receipt and “Teacher never gets” sections exist;
- every uncertain or unimplemented integration is labeled `PROPOSED` or `TECHNICAL SPIKE`;
- JavaScript defines the same workflow IDs and connects every workflow to at least one node and one edge.

- [x] **Step 2: Run the test to verify it fails**

Run:

```powershell
node prototypes/mvp-3-course-experience-companion/architecture-smoke.mjs
```

Expected: FAIL because the diagram files do not exist yet.

- [x] **Step 3: Implement the semantic diagram**

Build the page with:

- a compact header linking back to the experience mock and canonical technical document;
- a seven-button workflow selector;
- a layered architecture map with learner-device, Teacher-service, and OpenAI/Codex trust boundaries;
- named nodes for the companion UI, course orchestrator, context broker, consent gate, state store, Teacher agent, explicit thread binder, Codex adapter, Codex Executor, workspace, evidence collector, and optional capture adapter;
- arrowed SVG edges whose active styling changes with the selected workflow;
- a synchronized workflow narrative panel;
- a structured Teacher context receipt;
- a clear list of information the Teacher never receives;
- responsive and reduced-motion behavior.

- [x] **Step 4: Implement workflow interaction**

Create one immutable workflow configuration object with:

```js
{
  overview: { nodes: [], edges: [], steps: [], packet: [] },
  launch: { nodes: [], edges: [], steps: [], packet: [] },
  executor: { nodes: [], edges: [], steps: [], packet: [] },
  teacher: { nodes: [], edges: [], steps: [], packet: [] },
  evidence: { nodes: [], edges: [], steps: [], packet: [] },
  share: { nodes: [], edges: [], steps: [], packet: [] },
  recovery: { nodes: [], edges: [], steps: [], packet: [] }
}
```

On selection, update `aria-selected`, highlight the matching nodes and edges, update the numbered sequence, and switch the context-packet fields without navigating away.

- [x] **Step 5: Run the structural test**

Run:

```powershell
node prototypes/mvp-3-course-experience-companion/architecture-smoke.mjs
```

Expected: PASS with a summary of workflows, nodes, edges, privacy labels, and integration caveats.

- [x] **Step 6: Commit**

```powershell
git add prototypes/mvp-3-course-experience-companion/technical-architecture.html prototypes/mvp-3-course-experience-companion/technical-architecture.css prototypes/mvp-3-course-experience-companion/technical-architecture.js prototypes/mvp-3-course-experience-companion/architecture-smoke.mjs
git commit -m "feat: add interactive companion architecture map"
```

### Task 3: Cross-Link and Browser Verification

**Files:**
- Modify: `prototypes/mvp-3-course-experience-companion/README.md`
- Modify: `docs/planning/course-experience-ui-progress.md`
- Modify: `README.md`
- Modify: `prototypes/mvp-3-course-experience-companion/browser-smoke.mjs`

**Interfaces:**
- Consumes: the completed canonical document and interactive page
- Produces: repository navigation links and a browser test covering workflow switching

- [x] **Step 1: Add repository links**

Add the architecture diagram beside the experience mock in the root README, add launch and technical-document links to the prototype README, and record the architecture decision and technical-spike boundary in the progress handoff.

- [x] **Step 2: Extend the browser test**

Open `technical-architecture.html`, select each workflow, and assert:

- the selected button changes;
- the active node and edge counts are non-zero;
- the narrative title and context packet change;
- the page has no browser console errors;
- the narrow viewport preserves access to workflow controls and the detail panel.

- [x] **Step 3: Run all prototype tests**

Run:

```powershell
node prototypes/mvp-3-course-experience-companion/smoke-test.mjs
node prototypes/mvp-3-course-experience-companion/architecture-smoke.mjs
node prototypes/mvp-3-course-experience-companion/browser-smoke.mjs
```

Expected: all three scripts exit `0`.

- [x] **Step 4: Inspect the rendered diagram**

Serve the repository root on port `4173`, open:

```text
http://127.0.0.1:4173/prototypes/mvp-3-course-experience-companion/technical-architecture.html
```

Expected: the complete map is readable at desktop width, each workflow highlights a coherent path, and all proposed capabilities are visibly caveated.

- [x] **Step 5: Commit**

```powershell
git add README.md docs/planning/course-experience-ui-progress.md prototypes/mvp-3-course-experience-companion/README.md prototypes/mvp-3-course-experience-companion/browser-smoke.mjs
git commit -m "docs: link companion architecture artifacts"
```
