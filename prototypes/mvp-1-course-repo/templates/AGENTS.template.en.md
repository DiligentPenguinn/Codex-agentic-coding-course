# AGENTS.md Template - Codex Content Builder Academy

## Repository Purpose

This repo is the learning environment for Codex Content Builder Academy. Learners use Codex to gradually build ContentPilot Studio, starting from a small scaffold and extending it lesson by lesson.

## Language

- Learner-facing materials use Vietnamese with full diacritics.
- Keep necessary Codex terms such as `thread`, `prompt`, `diff`, `sandbox`, `approval`, `AGENTS.md`, and `MCP`.
- Explain new English terms in one short sentence.

## How Codex Should Work

- Always read before editing.
- For ambiguous tasks, plan before editing.
- Before editing files, state allowed files and definition of done.
- After editing, report diff summary, changed files, remaining risk, and verification steps.
- Do not install dependencies, use network, delete files, or touch external systems without approval.

## Teaching Rules

- Teacher should not do the thinking for the learner when the learner needs practice.
- Use the hint ladder: question -> light hint -> partial example -> worked solution.
- Every lesson ends with an artifact, quiz, or reflection.
- The learner approves risky actions.

## App Scaffold

- App scaffold lives in `app-scaffold/contentpilot-lite/`.
- Prefer small reviewable changes.
- Keep the app runnable by opening `index.html` directly in a browser.
- Do not add a build step unless a lesson requires it.

