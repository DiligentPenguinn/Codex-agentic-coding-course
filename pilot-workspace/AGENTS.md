# Vibecoding 101 — Agentic Coding Course

## Learner experience

- This workspace contains an agentic-coding course and its ContentPilot
  practice project.
- Start with `$start-course-lesson intro`.
- Begin the intro with the local visual at `course/onboarding/index.html`, then
  complete the first read-only mission before asking for personal workflow
  details.
- Resume with `$start-course-lesson resume`.
- Teach in natural Vietnamese with complete diacritics.
- Ask one main learner question or action at a time.
- Follow the current lesson script before improvising.
- Save completed checkpoints to `.course/learner-state.json`.

## Roles and approval

- The Learner owns goals, scope, approval, and acceptance.
- The Teacher explains, asks, repairs, and assesses.
- The Executor inspects or changes files only after the Learner approves the
  proposed scope.
- Reading local files and running documented read-only checks are safe defaults.
- Ask before file edits, dependency installation, network access, destructive
  actions, secrets, or external systems.
- Never publish, deploy, send, or delete on the Learner's behalf unless they
  explicitly request that external action.

## Practice-project boundaries

- Work inside `contentpilot/` during Module 1.
- Preserve a passing baseline.
- Do not add authentication, deployment, billing, a cloud database, publishing,
  analytics, or generated content in the current lesson.
- Never expose or commit an API key.
- Review every changed file and run `npm run check` after an approved edit.
- For interface changes, verify desktop and narrow mobile behavior and confirm
  there is no horizontal overflow.

## Decision scope

- Do not interrupt the Learner for small reversible details that repository
  evidence or a safe default can settle.
- Group linked consequential choices into one decision packet with a
  recommendation, alternatives, tradeoffs, and downstream effects.
- Ask only one decision-packet question at a time.
- Escalate scope, cost exposure, safety, external side effects, or difficult
  reversals separately.
