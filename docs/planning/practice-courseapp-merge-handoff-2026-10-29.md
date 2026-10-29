# Practice and course app merge handoff

29 October 2026. Prepared for the collaborator integrating the Practice branch
with the course app. Previously pushed implementation includes
`fbd56acd85515ce94e8aba56cb52350e834be1da`, the windowed Teacher continuity
repair at `1ba1c11e927904394288568df546b214bddbd752`, and cleaner Practice surfaces
and subtle motion at `0860453102c54eda7f0889864b19f3e44687ee92`. This follow-up
adds the requested task-continuation banner and Module 2 quiz-blocker feedback
fixes. The owner explicitly requested committing and pushing all current fixes
and the updated handoff on the existing branch.

The batch repairs the actual learner route through Modules 2–4, makes Practice
instructions repeatable, fixes task reopening and progress refresh, improves
Practice presentation, and makes portfolio review appropriate for beginners.
Windows automated checks passed and the owner-authorized QA route reached all
19 checkpoints. QA completion used isolated assessment waivers; it is not a
passed learner assessment or pilot acceptance.

## Branch and merge scope

- Source: `codex/practice-workflow-to-triet-v3-planning` on `origin`.
- Intended integration target from the existing handoff: `triet-v3-planning`.
  Confirm your team's destination before merging; this work does not merge to
  `main` or create a new pull request.
- A fresh fetch before this feedback follow-up on 29 October found target
  `22e8c2b6f6f20909189086c063e9ea008fe3a048` to be an ancestor of implementation
  HEAD `0860453`, with zero target-only and 22 source-only commits. The source
  branch matched its remote before this follow-up. A fast-forward was possible
  at that point; this feedback/handoff commit adds another commit. Fetch again before
  integration.
- Merge the whole branch. Cherry-picking only the final fix omits earlier
  contracts, Practice lifecycle work and the Module 1 introduction UI.

Recent commits worth reviewing in order:

| Commit | Purpose |
|---|---|
| `59135d9` | Incorporate incoming course content while preserving Practice runtime |
| `9898f9d` | Portfolio Practice workflows and Module 4 release review |
| `3773ac4` | Approved beginner-friendly Module 1 Practice design |
| `231241d` | Practice introductions, clearer workflow and success presentation |
| `fbd56ac` | Live walkthrough repairs, reusable prompts, compatibility checks, beginner review and UI polish |
| `1ba1c11` | Retain windowed Teacher state across minimize and reopen, with current-evidence refresh |
| `0860453` | Remove heavy Practice framing and add subtle motion with reduced-motion support |

The current feedback/handoff commit follows `0860453`; preserve the full history
when integrating.

Read root `AGENTS.md`, the closest scoped instructions, and the current
[implementation ledger](portfolio-course-implementation-plan.md). The
[September handoff](practice-teacher-handoff-triet-v3-2026-09-12.md) remains useful
background. The [22 October handoff](practice-courseapp-handoff-2026-10-22.md)
describes the previous ownership boundary: later explicit owner requests
authorized the course-entry, lesson-restoration, completion and exact-copy
repairs below. Its statements that Module 4 entry is unwired and no live
publication has occurred are historical, not outstanding implementation tasks.

## What changed for learners

The latest feedback fixes address two issues found during the owner's manual
test. Module 3/4 transitions now describe checking or reconnecting the handed-off
Codex task, rather than creating a new task. A failed continuation says
“Chưa thể tiếp tục task Codex đã bàn giao.”; the loading spinner stops while an
error is displayed and no retry is running. Retry/cancel controls and the
existing task, approval and current-evidence checks remain unchanged.

The Module 2 mastery summary still reports how many questions were answered,
but now also reports how many answers are not correct and directs the learner
to “Làm lại 5 câu” when completion is disabled for that reason. The existing
successful-summary wording and completion requirements remain unchanged.

The earlier presentation pass removes nested outlines around Practice prompt,
next-action, submission and review content. Spacing, typography and quiet
separators group the content; secondary controls use subdued fills and the
primary gold action no longer has a raised rim. The Teacher panel has an opaque
neutral background and a faint outer edge, keeping the application behind it
from competing with the text. Checklist, hints, approval, introduction and
success surfaces follow the same quieter treatment.

Buttons use short color/depth transitions, a one-pixel hover lift on primary
actions and gentle press feedback. Panel entry, feedback and disclosure content
have subtle reveals; supported renderers animate disclosure height in both
directions. Reduced-motion preferences disable these additions. This pass
changes only Practice CSS, with no copy, page, route, review, task-binding,
learner-approval or persistence changes. Restart an already running Course
Companion to load the rebuilt assets.

The follow-up minimize/reopen repair retains the windowed Teacher after its
first open. Compact mode hides the existing panel instead of destroying it;
reopening refreshes data without a loading reset. Sensitive Practice actions
wait for that refresh, and source changes still invalidate stale acceptance.
Completed Practice return quietly restores launcher mode; the hidden panel
stops workspace/focus subscriptions until reopened. A different run clears
run-specific hints, guide presentation and return state.
Verification passed: 775 unit tests (three existing skips), nine startup checks,
typecheck, lint, build, Electron smoke/chat/guide and the expanded portfolio
journey. The new checks retain draft, prompt disclosure and exact scroll
position over repeated minimize/reopen cycles, while a PRD edit clears stale
acceptance. The full unit run used `vitest run --maxWorkers=2` after Windows I/O
timeouts with default concurrency; no timeout or assertion was weakened. The
guide test now resumes its retained paused view, with its existing retry and
replay checks preserved. Local follow-up logs use `teacher-keepalive-*.log`.

| Area | Current behavior |
|---|---|
| Practice introduction | A short title, readable objective and three steps explain the workflow. The full instruction is body text rather than an oversized heading. Existing approved reference copy stays available. |
| Folder confirmation | The Continue action aligns with the portfolio content panel. The original empty-folder complaint was withdrawn by the owner; do not treat it as an unresolved reproduced bug. |
| Modules 2–4 prompts | Instructions can be copied again from the transition, Practice and Teacher surfaces. Module 2 identifies the selected portfolio root and required paths. Modules 3–4 continue the same task through explicit learner copy/paste. |
| Reopen task | The app resolves a compatible installed Codex runtime and opens the exact bound task. A desktop-owned continuation no longer starts a second writer. |
| Progress refresh | Repeated matching resume metadata is accepted; wrong task or workspace identities still fail. Failed refresh visibly blocks new acceptance instead of presenting stale evidence as ready. |
| Module 3 debugging lesson | Original lesson dialogue is restored, with the five-file handoff reference in a subordinate collapsed section. |
| Module 4 | The normal course button enters release Practice. Reviewed return reaches the completion scene and records `m4-complete`. No final quiz was added. |
| Return to course | Authoritative return is saved and displayed before background Teacher memory summarization; a slow summary no longer holds navigation open. |
| Home progress | Counts the 19 current checkpoints, excludes retired IDs from the numerator, and preserves their saved history. |
| Practice appearance | Unframed content groups, quiet separators, opaque neutral panel, softer secondary controls and one primary gold action. Subtle hover, press, panel and disclosure transitions respect reduced motion. Existing current/completed states and course palette remain. |
| Windowed Teacher | One usable scrolling area keeps review content and actions reachable at narrow widths. |

Module 2 still submits one package with these five files:

1. `planning/portfolio-brief.md`
2. `planning/content-evidence-inventory.md`
3. `planning/reference/reference.md`
4. `planning/PRD.md`
5. `planning/implementation-plan.md`

The existing legacy `planning/portfolio-plan.md` may remain as background; it
does not replace these five documents or enter their acceptance digest.

## Beginner review policy and retained checks

The portfolio reviewer now accepts the stated minimum rather than professional
polish. Minor visual, wording or implementation imperfections are optional
improvements unless they prevent a required outcome. Clearly labelled concepts,
sample identities and placeholders are acceptable when approved planning allows
them. If planning explicitly requires real material, feedback must identify that
specific conflict. Concrete mobile viewport observations do not require a
physical phone or extra browser proof unless the definition actually says so.

Needs-work feedback should acknowledge sufficient work and give the single
smallest blocking next action. Already satisfied work should not be repeated.
This changes the portfolio review prompt, not Module 1 criteria or a numerical
passing threshold. Actual beginner-pilot review quality remains to be tested.

Keep exact task/workspace binding, required criteria, current approval,
freshness, functional outcomes, honest evidence attribution and prior publishing
consent. Missing evidence remains unverifiable. Executor-reported checks are
not independently verified results. Teacher cannot edit learner files, send
Executor instructions, approve on the learner's behalf or grant completion.

## Technical changes to preserve during integration

Paths below are relative to `course-companion/`.

| Concern | Main files and integration rule |
|---|---|
| Codex compatibility | `electron/main/codex-runtime.ts`, `codex-app-server-client.ts`, `executor-chat-coordinator.ts`: resolve the current desktop CLI afresh on connection/reopen, prefer its bundled runtime, require CLI 0.164 or newer. The local standalone CLI was updated during QA; that machine update is not shipped by Git. There is no scheduled updater, automatic download or installation. |
| Resume metadata | `electron/main/codex-task-metadata-reader.ts`: validate every `session_meta` against the exact task and folder; matching repeated headers are normal after resume. |
| Continuation ownership | `electron/main/portfolio-continuation-instructions.ts`, `executor-chat-coordinator.ts`: preserve read-only Module 3 v2/Module 4 continuation and the original task. Preserve legacy Module 3 v1 handling separately. |
| Repeatable instructions | `shared/module-two-start-prompt.ts`, `src/renderer/src/components/PracticeStartPrompt.tsx`, `PracticeBrief.tsx`, `PracticeProgress.tsx`, `TeacherWorkspace.tsx`, `surfaces/LearningWindow.tsx` and module scene files: retain copy access and selected-folder guidance together. Do not restore one-time-only instructions. |
| Evidence and review | `electron/main/portfolio-package-evidence.ts`, `portfolio-release-evidence-adapter.ts`, `practice-coordinator.ts`, `practice-review-context.ts`, `executor-activity-observer.ts`: refreshed errors block acceptance; independently checked clean Git HEAD and Module 3 handoff facts reach review context. Vietnamese check reports remain attributed reports. |
| Windows Git reads | `electron/main/portfolio-release-git.ts`: read-only `--no-optional-locks` with bounded retries only for the observed index permission error; preserve other failures. |
| Completion and progress | `electron/main/index.ts`, `progress-repository.ts`, `shared/contracts.ts`, `shared/course/outline.ts`, `shared/course/modules/module-3.ts`, `LearningWindow.tsx`: preserve receipt-driven return, Module 4 checkpoint and current-checkpoint counting together. Ordinary outline navigation cannot earn completion. |
| Presentation | `PracticeIntroduction.tsx`, `practice-introduction-copy.ts`, `PracticeSuccess.tsx`, Practice components and `styles.css`: preserve the shared introduction and success hierarchy, narrow layouts, keyboard controls and reduced motion. |

The only two newly approved pre-Practice Module 4 sentence corrections are
synchronized in renderer scenes and
`pilot-workspace/course/lessons/module-4.vi.md`:

- “Khi thực hành đưa portfolio lên Vercel, bạn hãy mở đường link mà Vercel cung cấp.”
- “Sau khi phát hành portfolio trong Practice, bạn sẽ có một website để gửi cho người khác xem.”

Earlier exact status and continuation-copy approvals are recorded in the
ledger. Preserve surrounding approved copy. The latest batch retained every
affected renderer scene ID: 11 Module 2 source IDs, 22 Module 3 IDs and six
Module 4 IDs. Do not use a whole-file conflict resolution that discards incoming
lessons or restores old Practice identities.

## What the live QA run proves

The owner explicitly authorized a QA walkthrough, labelled placeholder content,
administrative assessment waivers for this test, and public sample publishing
on the free tier. The real course path included lessons, Module 3 quiz and
summary, the complete Module 4 video, Practice entry, prompt copy/paste,
publication, refresh, submission and return.

Live review exposed metadata and review-context defects that were repaired.
The genuine Module 3 and Module 4 needs-work reviews were retained. Separate
one-use QA receipts then allowed route testing in a copied profile. Production
gates were never disabled; no waiver helper or QA progress is committed. All
seven original learner-profile JSON hashes matched before and after QA. The
isolated walkthrough app was closed after reaching Home Base at 19/19.

The publicly released sample is separate from this course repository:

- [Live QA portfolio](https://course-companion-qa-portfolio.vercel.app/)
- [Sample application source](https://github.com/DiligentPenguinn/course-companion-qa-portfolio)
- Source commit: `d107f736b780af7330520e617069e30b37a33e18`.
- Vercel deployment: `dpl_DyDMaszWeNtFZuc39vrBb4paYQC7`, observed READY on the
  existing active Hobby plan. No paid upgrade, domain or add-on was purchased.

Only 12 reviewed application files were published. Vercel fetched that GitHub
commit; local planning, evidence, backups and private course data were excluded.
The sample identity and contact/profile placeholders are labelled. Desktop,
mobile viewport, 320/390/768/1440px overflow, image loading, links, keyboard
anchors and captured console checks passed. Mobile emulation does not prove
physical-device or cross-browser coverage. Do not copy this deployment record,
sample identity or administrative receipt into a learner submission.

## Verification and remaining acceptance work

The latest banner and quiz-summary feedback changes passed typecheck,
production builds and scoped diff review. They followed the repository's
trivial-edit fast path: full lint/unit/startup/Electron suites and screenshot
checks were not rerun for these small feedback edits. Local build logs are
`.superpowers/qa/course-fresh-start-build.log` and
`.superpowers/qa/module-two-summary-feedback-build.log`. The previous broad
verification below belongs to `0860453`, not to these later edits.

The owner requested and received a normal-profile reset for a fresh end-to-end
test. Prior local state was backed up under ignored `.superpowers/qa/`; portfolio
files and Codex chats were preserved. This manual run is ongoing and does not
close learner, live-review or overall acceptance gates. The continuation-banner
fix was loaded for the reset. The later Module 2 summary fix was built while
the owner continued testing; the existing session was left running and needs
an app restart to load that newest renderer. Do not reset the profile again or
replace the saved learning position without a new owner request.

One observed presentation gap remains open: browsing assessment question pages
through the outline can show navigation without the questions because the
read-only review branch suppresses the assessment renderer. The actual learning
flow uses the assessment renderer. Do not use outline preview as a substitute
for an end-to-end learner run; no preview-rendering repair is included here.

The earlier CSS and handoff delivery at `0860453` passed Windows typecheck/build, lint, all
775 unit tests (three existing skips), nine startup checks, the full Electron
smoke/Teacher chat/Practice guide suites, and the disposable Module 2→3→4
portfolio journey. The app regressions cover Modules 1–4; the earlier live QA
walkthrough reached all 19 checkpoints with the authorized assessment waivers
described above. Neither result establishes a beginner passing every assessment.

Desktop and narrow UI screenshots were visually inspected. The isolated
simulated Electron check passed body/document no-overflow assertions at
320/380/1024px, unframed prompt sides, hover and press transforms, disclosure
opening and zero transitions/animations under reduced motion. Logs and local
visual artifacts use `.superpowers/qa/practice-clean-*`; journey screenshots
remain under `.superpowers/sdd/screenshots/`. These ignored artifacts are local
evidence, not files shipped by Git. The first unit attempt encountered sandbox
temporary-file rename restrictions; the full two-worker rerun passed with the
required filesystem access. The one-off visual harness needed a corrected
Practice-startup wait. No product assertion or acceptance gate was weakened.

The final implementation at `fbd56ac` passed:

- Typecheck, lint, build, 775 unit tests with three existing skips, and all nine
  startup checks.
- Full Electron smoke, Teacher chat and Practice guide suites.
- Expanded disposable Module 2→3→4 portfolio journey, including delayed Teacher
  summary, stale acceptance, exact-task continuity, earned completion, retired
  progress history and narrow controls.
- Desktop and narrow visual inspection of the current Practice styling.

Reproduce from `course-companion/` after installing locked dependencies with
`npm ci`:

```powershell
npm run typecheck
npm run lint
npm test
npm run build
npm run test:electron
node tests/portfolio-package-electron.mjs
```

Electron fixtures deliberately simulate Codex, review and deployment responses
in disposable profiles. They are regression coverage, not live learner proof.
Local final logs are under `.superpowers/qa/release-done-*.log`; QA screenshots
and waiver audits also remain ignored and are not available from a fresh clone.
Committed tests and the ledger provide the portable verification record.

Still open: real first-time beginner rehearsal and live review acceptance,
native macOS behavior, and overall owner/pilot acceptance. The historical
Module 1 distinction between inherited correct settings and demonstrating the
ability to configure them remains an owner decision. Technical verification or
the QA-only 100% counter must not close those gates.

## Merge procedure and smoke checks

Fetch again and inspect your local work before switching branches. If the
intended target is still `triet-v3-planning`, has no additional commits, and your
checkout is clean, a fast-forward preserves the already integrated history:

```powershell
git fetch origin
git switch triet-v3-planning
git merge --ff-only origin/triet-v3-planning
git merge --ff-only origin/codex/practice-workflow-to-triet-v3-planning
```

If either fast-forward fails, review divergence and reconcile on an integration
branch under your normal merge process. Do not reset, force-push or overwrite a
collaborator's edits. Run the checks above on the merged result before publishing
the target branch.

For manual smoke testing, use disposable learner data and a dedicated portfolio
folder. Check introduction readability, repeated prompt copy, exact-task reopen,
refresh failures, current acceptance and review feedback. Continue a real
accepted Module 2 package into Module 3, inspect the restored debugging lesson,
then check Module 4 entry and reviewed return. Verify completion cannot be
earned merely by browsing the outline. Inspect full and windowed Teacher views
at desktop and 320/390px widths. Keep simulated evidence visibly labelled and
never reset a personal profile to make a smoke test pass.

No dependency or schema migration was added in the final repair commit. Preserve
older progress/history and let the existing application migrations run. Do not
ship `.superpowers/`, temporary profiles, `node_modules/`, build output, local
credentials or sample-portfolio evidence as course source.
