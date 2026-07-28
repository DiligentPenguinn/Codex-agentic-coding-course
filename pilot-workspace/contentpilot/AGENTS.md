# ContentPilot Starter Guidance

## Purpose

This repository is the learner starter for ContentPilot. Keep it runnable and
honest: the initial state provides generic infrastructure, not completed
content-generation behavior.

## Commands

- `npm run dev` starts the local application.
- `npm run lint` checks source style and common mistakes.
- `npm run typecheck` checks TypeScript without emitting files.
- `npm test` runs the automated tests.
- `npm run build` validates the production build.
- `npm run check` runs every required check.

## Boundaries

- Do not add generated research, ideas, drafts, images, or workflow progress as
  fake product state.
- Do not add authentication, a cloud database, deployment, scheduling,
  publishing, or analytics to the beginner path.
- Keep OpenAI credentials server-side. Never log, render, or commit secrets.
- Keep runtime content inside `data/`; only `data/.gitkeep` is committed.
- Resolve filesystem paths through `server/storage/paths.ts`.
- Use atomic writes for application-managed JSON.
- Preserve working behavior unless the current lesson explicitly changes it.

## Learner-facing language

- Write natural Vietnamese with complete diacritics.
- Prefer outcome-oriented labels and one obvious primary action.
- Do not expose provider names, internal workflow narration, or implementation
  details unless they are necessary for cost, safety, or troubleshooting.

## Verification

- Review every changed file.
- Run `npm run check`.
- Exercise the changed behavior manually.
- For interface changes, inspect desktop and narrow mobile widths and confirm
  there is no horizontal overflow.
