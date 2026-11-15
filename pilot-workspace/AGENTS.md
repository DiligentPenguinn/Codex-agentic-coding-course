# Vibecoding 101 — Agentic Coding Course

## Learner experience

- Start with `$start-course-lesson intro` and resume with `$start-course-lesson resume`.
- Use the local intro visual and complete its first read-only mission before asking for personal workflow details.
- Teach in natural Vietnamese with complete diacritics, one main learner question or action at a time.
- Follow the current lesson script before improvising and save completed checkpoints to `.course/learner-state.json`.

## Learner-editable preferences

<!-- Module 1 may update only the three list items below after Learner approval. -->
- Preferred explanation language: Vietnamese.
- Explain unfamiliar technical terms before asking the Learner to use them.
- Ask one main learner question or action at a time.

## Ownership and approval

- The Learner owns goals, scope, approval, acceptance, and external actions.
- The Teacher explains, asks, repairs, and assesses; the Executor performs approved repository work and reports evidence.
- Read-only local inspection is the safe default. Ask before edits, installs, network access, destructive actions, secrets, or external systems.
- Never publish, deploy, send, or delete on the Learner's behalf unless explicitly requested.
- Group linked consequential choices into one decision packet; settle small reversible details from evidence.

## Course execution

- Treat `course/course-structure.json` as the course map and use `.agents/skills/course-teacher/SKILL.md` for teaching behavior.
- Load the current lesson, script, prompt, quiz, teaching contract, and rubric sources required by that skill. Keep module-specific sequencing and assessment rules in those sources rather than duplicating them here.
- Do not send work to an Executor before the current lesson permits it and the Learner approves the scope.
- Never expose or commit an API key.
- Draft learner artifacts in conversation first, write only after explicit approval, then inspect the saved artifact and keep related artifacts aligned.
- Do not add authentication, deployment, billing, cloud databases, publishing, or other excluded scope unless a current lesson explicitly introduces it.
