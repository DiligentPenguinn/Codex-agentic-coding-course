# Pilot 0.1 MVP Acceptance and Progress Tracker

> **Superseded for Course Companion planning — 6 August 2026.** This file
> records the earlier Codex-native Pilot 0.1 release rehearsal. Its passing
> checks apply only to that historical course path; they do **not** mean the
> Course Companion desktop application has been built or tested. The current
> desktop-app MVP is tracked in
> [`course-companion-mvp-progress.md`](course-companion-mvp-progress.md).

**MVP decision date:** 6 August 2026
**Last evidence review:** 6 August 2026, release-candidate rehearsal
**Owner:** Triết
**Historical Pilot status:** Ready to invite private testers; learner validation remains
**Course Companion status:** Superseded — do not use this gate for the desktop app

## MVP finish line

Pilot 0.1 is successful when it has been privately tested with 3–5 target
learners and the evidence shows that a beginner can:

1. start the course without developer help;
2. understand the course goal and complete the Intro;
3. make one small, real, safely approved change in ContentPilot;
4. inspect the diff, automated checks, and visible result before accepting it;
5. stop and resume from saved progress; and
6. explain which decisions remain theirs rather than Codex's.

The release is **ready to invite testers** when the release gate below passes.
The MVP is **validated** only after the learner-evidence gate passes.

## Scope firewall

### Required for this MVP

- One runnable path: `intro -> module-1`.
- Vietnamese-first guidance for a beginner with no assumed coding experience.
- Visual onboarding followed by a real read-only Codex action.
- A learner-owned quest card.
- One bounded ContentPilot change with an approval gate.
- Diff, test, and visual evidence before learner acceptance.
- Local checkpoint state and a working resume path.
- A two-session private test with 3–5 target learners.

### Explicitly later

- Modules 2–6.
- Real OpenAI content research or generation.
- The production Course Companion or Teacher application.
- Game economy, voice interaction, custom character-art pipeline, or deep
  gamification.
- Authentication, cloud persistence, deployment, analytics, scheduling, or
  automatic publishing.
- General ContentPilot polish that is not needed for the Module 1 exercise.

## Rule for accepting new work

A newly noticed detail enters the MVP only when at least one statement is true:

- Without it, a target learner cannot start, complete, or resume the pilot.
- Without it, the learner could approve an unsafe or misunderstood change.
- It causes data loss, exposes a secret, breaks accessibility for a tester, or
  makes the evidence untrustworthy.
- The same critical stall appears for at least two testers.

Otherwise, record it under **After the private test** and continue toward the
next unfinished gate. Aesthetic preference alone is not an MVP blocker.

## Progress snapshot

| Gate | Current state | Meaning |
|---|---|---|
| Scope | **Locked** | The finish line and exclusions are explicit. |
| Build | **Implemented in source** | Intro, Module 1, onboarding, artifacts, and state helper exist. |
| Release verification | **Pass** | All 13 release checks passed in an isolated copy of the current worktree. |
| Learner evidence | **Not started** | No 3–5 learner test results are recorded yet. |

Do not convert these gates into one percentage. Source implementation and
learner validation are different kinds of progress.

## Gate A — Ready to invite testers

| ID | Acceptance check | Status | Current evidence / next proof |
|---|---|---|---|
| A1 | Pilot scope is only Intro + Module 1. | Pass | [`course-structure.json`](../../pilot-workspace/course/course-structure.json) maps `intro -> module-1` and stops. |
| A2 | Root course commands resolve only to the current Pilot. | Pass | Root skills delegate to `pilot-workspace/` and reject historical `module-0`. |
| A3 | Course JavaScript and JSON parse successfully. | Pass | Fresh syntax/parse check passed on 6 August 2026. |
| A4 | A clean learner copy can follow `START_HERE.md` and begin Intro. | Pass | The isolated copy resolved the local Intro sources and initialized at `intro-visual-onboarding` without prior state. |
| A5 | Visual onboarding works on desktop and narrow mobile, including keyboard access and the return-to-Codex instruction. | Pass | All five stages and four Codex-guide views worked at 1440×900 and 390×844; arrow-key navigation worked and `scrollWidth` equaled `innerWidth`. |
| A6 | Intro reaches the first safe read-only action and creates a learner-owned quest card. | Pass | Script order was verified and a representative learner-owned quest card was created in the isolated copy. |
| A7 | Module 1 enforces plan approval before the bounded UI change. | Pass | The script keeps inspection and planning before `m1-plan-approval`; the rehearsal changed only the approved CSS file. |
| A8 | The learner receives diff, automated-check, and visible-UI evidence before acceptance. | Pass | Rehearsal evidence included the one-file diff, passing checks, desktop/mobile measurements, route verification, and an evidence artifact. |
| A9 | Resume restores the correct lesson, checkpoint, time budget, and artifacts. | Pass | A new helper process resumed at `module-1 / m1-orient` with the 30-minute budget and completed Intro recorded. |
| A10 | Missing checkpoints prevent lesson completion. | Pass | Intro and Module 1 both rejected premature completion, then completed after all required checkpoints. State file mode was `0600`. |
| A11 | ContentPilot passes the pinned lint, typecheck, tests, and production build. | Pass | Offline clean install reported 0 known vulnerabilities; lint, typecheck, 4 tests, and production build passed before and after the rehearsal change. |
| A12 | The downloadable workspace contains no secret, learner state, build output, or machine-specific dependency folder. | Pass | The isolated release copy contained no `.git`, `node_modules`, `.next`, live learner state, secret file, or detected API-key assignment. |
| A13 | Facilitator instructions and the learner session record below are ready. | Pass | This document defines the test method and evidence fields. |

**Current release decision:** Gate A passes. Do not add features. Invite private
testers and let Gate B evidence decide whether any repair enters the MVP.

## Release rehearsal record — 6 August 2026

- Rehearsal location: isolated temporary copy of the current worktree.
- Runtime: Node.js 22.20.0 and npm 10.9.3, both within the declared minimums.
- ContentPilot baseline and post-change result: lint, typecheck, 4/4 tests, and
  production build passed.
- Module 1 visual result: at 390px, the approved action was 358px wide and 54px
  high, equal to the content frame; at 1440px it remained content-width at
  211.109px. Neither viewport had horizontal overflow.
- State result: fresh start, blocked premature completion, Intro completion,
  resume into Module 1, blocked premature Module 1 completion, and final
  completion all behaved as intended.
- Packaging result: release hygiene audit passed before installing temporary
  dependencies.

### Non-blocking observations

- After onboarding is already complete, reloading the start screen labels its
  primary action as `XEM LẠI PHẦN GIỚI THIỆU`, but that action resumes at the
  final handoff screen. The final screen's separate reset action does restart
  the introduction. Keep this after the private test unless it stalls two
  learners.
- The onboarding showed `ĐÃ SAO CHÉP`, but the isolated in-app browser did not
  expose the clipboard text for an independent read. The handoff sentence
  remained visible and selectable. Observe real learner paste behavior before
  treating this as a defect.
- A generic local static server requested a missing `favicon.ico`; the course
  assets and interaction flow loaded successfully. This is not an MVP blocker.

## Gate B — Learner validation

### Participants

- Recruit 3–5 creators or marketers who match the intended beginner audience.
- Prefer people who have not previously used this repository.
- Do not teach the interface while observing. Offer help only after recording
  the exact stall and the learner's expectation.

### Two-session protocol

**Session 1 — activation and Intro**

1. Give the learner only the release workspace and its normal start
   instructions.
2. Observe setup, visual onboarding, the first read-only Codex action, and the
   quest card.
3. Stop at a real checkpoint chosen by the course flow.
4. Record elapsed time, unexpected help, confusion, and the saved state.

**Session 2 — resume and Module 1**

1. Resume in a new Codex task after the break.
2. Observe whether the learner finds the correct next action.
3. Continue through briefing, plan approval, build, evidence review, acceptance,
   and mastery.
4. Ask the learner to explain what Codex did, what evidence they checked, and
   which decision remained theirs.

### MVP validation threshold

The MVP passes when all of the following are true:

- At least 80% of participants, and at least three people, complete both
  sessions.
- At least 80% activate and resume without the facilitator editing files or
  course state for them.
- At least 80% produce the required quest-card and Module 1 evidence artifacts.
- At least 80% can explain the approval, diff, check, and human-decision loop in
  their own words.
- There are no safety incidents, exposed secrets, corrupted states, or lost
  learner artifacts.
- No critical step causes the same unassisted stall for two or more learners.

If the threshold fails, fix only the smallest repeated blocker and retest that
step. Do not reopen the entire course design.

## Learner session record

Use one row per learner. Link to detailed notes rather than expanding this table
with every observation.

| Learner | Target profile? | Activated | Intro complete | Resumed | Module 1 complete | Artifacts present | Explained ownership | Critical stall | Notes |
|---|---|---|---|---|---|---|---|---|---|
| P1 | — | — | — | — | — | — | — | — | — |
| P2 | — | — | — | — | — | — | — | — | — |
| P3 | — | — | — | — | — | — | — | — | — |
| P4 | — | — | — | — | — | — | — | — | Optional |
| P5 | — | — | — | — | — | — | — | — | Optional |

## After the private test

These are legitimate ideas, but they cannot block this MVP unless learner
evidence moves them into the release gate:

- richer progress visualization;
- formal 10/20/30/45/60-minute Module 1 scheduling;
- automatic artifact validation in the state helper;
- expanded Teacher memory and hint history;
- Course Companion production architecture;
- additional narrative, animation, rewards, or visual polish;
- Modules 2–6 and the real API-backed ContentPilot workflow.

## Next action

Recruit the first three target learners and schedule the two-session protocol.
Do not begin Modules 2–6 or Course Companion production work while Gate B is
open.
