# MVP 0.5 - Pedagogy Kernel

This prototype validates the Teacher's instructional behavior before building the web shell, ContentPilot Studio, or production integrations. Codex remains the learning environment: the Teacher coaches, the Executor performs safe implementation work, and the learner gradually learns how to direct Codex.

Vietnamese is the primary learner-facing language. English companion artifacts exist for translation, review, and future localization.

## Goal

- Turn the course plan into a Codex-runnable prototype.
- Test whether the Teacher follows a loop of diagnose -> goal -> hint -> action -> feedback -> mastery gate.
- Keep the learner active through prediction, inspection, approval, and explanation.
- Create the reusable pattern for Module 0 before expanding into a full lesson repo.

## Components

- `teacher/teacher-system-prompt.vi.md`: Vietnamese Teacher system prompt.
- `teacher/scripted-delivery-contract.vi.md`: rules for reading static scripts and handling off-track learner behavior.
- `rubrics/hint-ladder.vi.md`: hint ladder from Socratic question to worked solution.
- `rubrics/mastery-rubric.vi.md`: mastery rubric for learner capability.
- `rubrics/quiz-delivery-protocol.vi.md`: one-question-at-a-time quiz protocol with transfer and anti-copy checks.
- `schemas/learner-state.schema.json`: learner state for resume and personalization.
- `schemas/xapi-event.schema.json`: lightweight xAPI-style learning events.
- `dialogues/`: 10 sample teaching dialogues, Vietnamese first with English summaries.
- `simulations/module-0-simulation.vi.md`: Module 0 dry-run script for Codex.

## Run A Simulation In Codex

Start a new thread at the repository root and use this prompt:

```text
Act as the Teacher for Codex Content Builder Academy.

Before teaching, read:
- prototypes/mvp-0.5-pedagogy-kernel/teacher/teacher-system-prompt.vi.md
- prototypes/mvp-0.5-pedagogy-kernel/rubrics/hint-ladder.vi.md
- prototypes/mvp-0.5-pedagogy-kernel/rubrics/mastery-rubric.vi.md
- prototypes/mvp-0.5-pedagogy-kernel/simulations/module-0-simulation.vi.md

Then start Module 0 in Vietnamese. Teach in short steps. When the Executor needs to inspect the repo, ask me to predict first, name which actions are safe, and ask for approval before any action that may edit files, use the network, install dependencies, or touch external systems.
```

## Success Criteria

- The Teacher does not jump into file edits while the learner still needs conceptual scaffolding.
- The Teacher follows polished static lesson scripts and improvises only for off-track moments or repair.
- Each learning step produces a small artifact: an answer, risk classification, sample prompt, or exit ticket.
- Hints follow the ladder: question -> light hint -> partial example -> worked solution.
- Quizzes are delivered one question at a time and do not accept written answers that merely copy the Teacher.
- Mastery gates measure behavior: the learner can request inspection, distinguish explanation from action, recognize approvals, and summarize what Codex did.
- Learner state can be updated after each lesson and used for resume planning.

## Out Of Scope For MVP 0.5

- No Teacher-Executor web shell yet.
- No Next.js, Supabase, or ContentPilot Studio implementation yet.
- No real MCP, Postiz, Sheets, n8n, or automation integrations.
- No automatic LLM scoring yet. The rubric is for dry runs and manual review.
