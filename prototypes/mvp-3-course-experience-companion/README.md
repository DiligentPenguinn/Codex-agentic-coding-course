# Course Experience Companion Mock

This dependency-free prototype demonstrates the proposed course experience around Codex. It is intentionally separate from ContentPilot, the application learners build during the course.

The mock combines:

- an evolving pixel-art Home Base;
- linear visual-novel mission framing;
- a simulated Codex Workshop;
- an always-available Teacher bubble;
- context transparency, progress, streak, and room-reward concepts.

## How to run

The quickest option is to open `index.html` directly in a modern desktop browser.

For consistent local asset loading, serve the repository root:

```powershell
python -m http.server 4173
```

Then open:

```text
http://localhost:4173/prototypes/mvp-3-course-experience-companion/
```

No package installation or build step is required.

## Technical architecture map

The companion's proposed production workflow is available as a separate
interactive diagram:

```text
http://localhost:4173/prototypes/mvp-3-course-experience-companion/technical-architecture.html
```

Use the seven workflow controls to trace start/resume, Executor activity,
Teacher questions, evidence completion, explicit view sharing, and degraded
recovery. The diagram also shows the Teacher context receipt and the
information that never crosses the privacy boundary.

## What to click

From the Home Base:

- **Mission board:** opens the authored mission briefing.
- **Workstation:** enters the simulated Codex Workshop.
- **Hương:** opens Teacher Chat.
- **Bookshelf:** opens progress and collected evidence.
- **Window:** opens the seven-day learning rhythm.
- **Reward chest:** previews the evolving-room reward.

From the Workshop:

- Click the Teacher bubble to expand chat.
- Open **What can Teacher see?** to inspect the context receipt.
- Use **Share view** to preview explicit screen-sharing consent.
- Use **Simulate evidence complete** to trigger the debrief and unlock the room reward.

Keyboard shortcuts:

- `T`: open or minimize Teacher Chat;
- `H`: return to Home Base;
- `Escape`: close the topmost panel.

## What is simulated

The mock does not connect to Codex or an OpenAI API. The following are visibly presented as simulated:

- launching or focusing Codex;
- binding an Executor thread;
- Executor messages, files, commands, and tests;
- Teacher access to Executor context;
- evidence-triggered mission completion;
- voice chat;
- screen or tab sharing;
- OS-level always-on-top window behavior.

The mock stores only three demonstration flags in browser `localStorage`: whether the briefing was viewed, whether the mission was completed, and whether the reward is unlocked. It stores no real conversation, learner work, file data, or credentials.

## Design intent

The room is the landing page. Story, Workshop, Teacher Chat, progress, streak, and rewards are reached through objects in the world rather than a conventional mode grid.

Narrative frames the practical work:

```text
Home Base
  → Mission Briefing
  → Codex Workshop
  → Optional Teacher coaching
  → Evidence checkpoint
  → Debrief
  → Updated Home Base
```

Teacher, Executor, and Learner remain distinct:

- Learner decides, approves, and evaluates evidence.
- Teacher coaches, diagnoses, hints, and assesses.
- Executor performs scoped repository work and reports evidence.

## Generated assets

`assets/home-base.png` and `assets/teacher.png` were created with the built-in image-generation workflow for this project. The room prompt requested a wide handcrafted 16-bit creative studio with separate workstation, mission-board, archive, and reward zones. The Teacher prompt requested one friendly Vietnamese mentor sprite in a teal cardigan on a removable chroma-key background. The final Teacher asset was converted to a transparent PNG locally.

## Related documentation

- [`docs/planning/course-experience-ui-progress.md`](../../docs/planning/course-experience-ui-progress.md)
- [`docs/architecture/course-companion-technical-workflow.md`](../../docs/architecture/course-companion-technical-workflow.md)
- [`docs/superpowers/specs/2026-07-29-course-experience-companion-design.md`](../../docs/superpowers/specs/2026-07-29-course-experience-companion-design.md)
- [`docs/superpowers/plans/2026-07-29-course-experience-companion-mock.md`](../../docs/superpowers/plans/2026-07-29-course-experience-companion-mock.md)
- [`docs/superpowers/plans/2026-07-29-course-companion-technical-diagram.md`](../../docs/superpowers/plans/2026-07-29-course-companion-technical-diagram.md)
