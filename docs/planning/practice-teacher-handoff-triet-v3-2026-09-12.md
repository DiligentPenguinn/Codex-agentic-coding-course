# Practice and Teacher handoff for triet-v3-planning

12 September 2026. Read this before reviewing the PR or changing the merged app.

For the current merge, also read the
[29 October merge handoff](practice-courseapp-merge-handoff-2026-10-29.md).
It records the later owner-authorized course-flow repairs, live QA publication,
beginner review policy, final verification and remaining acceptance gates.

This PR brings the Practice branch into `triet-v3-planning`. It includes the
earlier review and five-document portfolio work, plus the latest Practice UI,
guide and Teacher chat fixes. The latest app changes are in commit `d4fc9d4`.
The PR branch is `codex/practice-workflow-to-triet-v3-planning`.
The separate existing PR to `main` has not been changed.

## What the learner now sees

- **Practice:** clearer window controls, readable progress and review panels,
  and correctly aligned return buttons. A button only shows return progress
  when the app is actually returning to the course.
- **Practice guide:** the existing Module 1 guide is also available in the
  windowed panel. Both windows keep the same place. Pause, resume and replay
  work; unsuccessful reviews and missing highlighted elements no longer make
  the guide disappear or leave its controls out of reach. Replay explains the
  workflow without submitting work, changing results or leaving Practice.
- **Hints:** `Cần gợi ý?` uses the current Practice and its evidence to suggest
  a next step. A hint does not approve work or complete Practice.
- **Teacher chat:** sending immediately shows the learner's message, clears the
  input and displays “Triết đang suy nghĩ…”. Failed sends remain retryable
  without duplicate messages. Replies render Markdown, including saved replies.
- **Theory lessons:** the Teacher panel opens directly to chat. The redundant
  tab strip, including `TIẾN ĐỘ`, is removed. Old saved tab choices cannot bring
  it back. Practice still has its dedicated progress and review screen.

## Module 2 now ends with five documents

The learner chooses one empty portfolio folder and uses the same Codex task
through planning and the handoff to Module 3. Module 2 requires these files:

1. `planning/portfolio-brief.md`
2. `planning/content-evidence-inventory.md`
3. `planning/reference/reference.md`
4. `planning/PRD.md`
5. `planning/implementation-plan.md`

The learner approves the current PRD and plan once, then submits the whole
package for review. The app checks the actual files and their contents. There
are no five separate learner approval gates. Validation belongs in the plan;
a separate validation map and first-build-task document are not required.
Module 2 does not build or publish the portfolio.

Old files, tasks and history are preserved, but older work needs a fresh review
against the five-document requirement. Changing reviewed files invalidates the
old result. Revision must keep the original task and require fresh approval and
review. Do not restore older completion rules from historical planning notes.

## Preserve these boundaries

- Practice work belongs to this integration; theory content belongs to the
  course-app side. Preserve existing lesson wording, questions, pages and routes
  unless the owner explicitly requests a change.
- Shared integration edits include the Module 2 folder-selection step, Practice
  version and document list, and the specifically requested Teacher chat fixes.
  Do not remove folder selection when reconciling shared course files.
- During active Practice, Triết reviews evidence and provides hints. Direct
  Teacher chat remains disabled. The learner works with the linked Codex task;
  Triết does not edit files, control that task or grant learner approval.
- Keep review tied to the exact Practice and linked task. Distinguish what Codex
  reports from what the app independently confirms. Do not bypass failed or
  stale reviews to make navigation easier.
- Keep the course's black, gold and rounded visual theme. Prioritize what the
  learner needs to do next; avoid adding status panels that compete with it.

## Where to look

Paths below start at `course-companion/` unless stated otherwise.

| Area | Main files |
|---|---|
| Teacher window and theory chat | `src/renderer/src/components/TeacherWorkspace.tsx`, `TeacherMarkdown.tsx` in the same folder |
| Practice layout and return | `PracticeProgress.tsx`, `PracticeReturnAction.tsx`, `PracticeBrief.tsx` in that component folder; `src/renderer/src/styles.css` |
| Guide state and display | `electron/main/practice-guide-coordinator.ts`, `src/renderer/src/components/PracticeGuide.tsx` |
| Package collection, review and continuity | `electron/main/portfolio-package-evidence.ts`, `practice-run-repository.ts`, `practice-review-service.ts`, `portfolio-module-completion-service.ts` |
| Current Practice requirements | Repository root: `pilot-workspace/course/practices/` |
| Verification and remaining gates | Repository root: `docs/planning/portfolio-course-implementation-plan.md` |

Read the closest `AGENTS.md` before editing. The full PR also carries earlier
changes to root and Course Companion guidance; inspect those differences when
reviewing the integration rather than assuming only application files changed.

## Verification and remaining decisions

The final app version passed typecheck, lint, 493 unit tests (two intentional
skips), nine startup checks, build, and the full Electron smoke/chat/guide suite.
Desktop and narrow windows were visually inspected. Focused checks also cover
return-button states and the five-document handoff. The planning ledger records
the separate runs and resolved test timeouts.

Electron tests use disposable data and simulated Codex responses. They do not
prove live AI review quality, native macOS behavior or learner acceptance.
Keep those acceptance gates open. The owner began a separate live rehearsal,
but a live Module 2 package review has not been recorded as passed.

One open learning issue: Module 1 can pass when the required settings are already
inherited, without the learner changing them. That checks the current settings,
not the learner's ability to configure them. The written mastery response is
also learner self-review. Discuss any stronger demonstration requirement with
the owner before changing Practice or assessment rules. Do not invent new
Module 3 completion criteria; the replacement criteria remain undecided.

For a quick manual check, open theory chat, send a question, inspect Markdown,
and confirm there is no progress tab. Then enter Module 1 Practice, open the
windowed guide, switch windows, pause/resume and replay. Finally review the
five-document journey with learner-owned work. Use the existing checks; do not
reset personal progress or fill in assessed answers for the learner.
