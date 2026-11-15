# Module 4 Practice — proposed implementation scope

Status: implementation requested, 22 October 2026. In response to this scope,
the owner clarified that only Practice workflow belongs to this branch;
everything in the courseapp belongs to the other owner. Apply that boundary
throughout. Earlier live acceptance remains pending; scoped development does
not record learner, owner, provider or pilot acceptance.

## Authoritative outcome

Follow the 6 October M4.8 scope update and current Module 4 lesson/script:
the learner has an online portfolio they can open and share. There is no final
quiz, ownership essay, transfer project, mandatory separate Preview deployment,
rollback exercise or additional feature requirement. Earlier M4.2–M4.8 detail
is historical wherever it conflicts with that outcome.

Keep all six current Module 4 scenes and all existing courseapp/Pilot lesson,
script and prompt copy unchanged. Do not change LearningWindow, courseapp
navigation, assessment controls, shared course scenes or completion-page copy.
Practice definitions/templates, Practice services and persistence, Practice
submission/return controls, narrow IPC and Practice tests are owned here.
The owner later approved an exact Practice restart paragraph/button for
Modules 3–4 explaining same-task continuation; that scoped wording exception
does not authorize changing any courseapp copy.
Provide an explicit integration handoff for any host-page wiring or wording
the courseapp owner must update. A Practice receipt is not approval of that
owner's UI or of the course as a whole.

## Recommended journey

1. Enter the existing Practice page after the current Module 3 v2 completion
   receipt. Keep the learner-selected portfolio folder and the original readable
   Module 2/3 Codex task. If the task is unavailable, retain the attempt and offer
   retry; do not silently create another task.
2. Continue deployment with Codex following the current Vercel lesson. The
   learner controls login, account permissions, Git push, deployment and public
   access. Starting/resuming Practice never performs any of those actions.
3. Codex maintains one supporting record,
   `evidence/module-4/deployment-record.json`. The learner does not fill in
   technical metadata or write a separate assessment answer. The record names
   the Module 3 handoff, release source/revision, deployed URL/provider,
   build/deployment result, actual desktop/mobile checks and any limitations.
   Reported observations and actual learner decisions remain distinguishable.
4. The learner opens the shared URL while signed out, checks it on desktop and
   mobile, and confirms the current online result in Course Companion. The
   checkbox and submit button are one final submission gate, not a set of
   repeated per-stage approvals.
5. On submission the app independently reads the supporting record and source,
   checks the public HTTPS URL without account cookies, and invokes the existing
   read-only AI review with the exact bound task. A URL or HTTP 200 alone cannot
   prove that the right portfolio/version works: review also needs deployment
   identity, source evidence and concrete browser observations.
6. A passed, fresh review allows the existing return action to save an atomic
   Module 4 completion receipt targeting the existing completion scene. No
   quiz is introduced. Failed/stale review continues in the same task. Resume
   after restart and archived revision retain files, history and prior receipts.

## Evidence and implementation boundaries

Reuse the final-package approval/review lifecycle from Modules 2/3, but give
release evidence its own discriminated contract and adapter. Keep evidence,
approval, review and completion bound to course run, Practice version, attempt,
generation, selected workspace, task, source fingerprint and submitted URL.

The release record is machine-maintained JSON with a versioned schema. Read it
with bounded size, UTF-8, path containment and regular-file checks. Verify the
local source fingerprint and available Git identity independently. Necessary
deployment fixes may advance the Module 4 release source; record its relation
to the accepted Module 3 starting version without requiring another Module 3
content assessment. A source, record, URL or relevant task change invalidates
the Module 4 approval/review and requires fresh checks.

The URL check is read-only and runs only for the submitted public URL. Support
ordinary public HTTPS Vercel and custom-domain addresses; reject credentials,
token-bearing URLs, local/private destinations and redirects into them. Apply
bounded redirects, response size and timeout; never execute remote scripts or
render remote HTML inside a privileged window. Keep secrets and authentication
material out of evidence and reviewer context. Network failure is retryable and
cannot produce completion. HTTP reachability is labeled independently observed;
browser behavior and deployment revision remain reported unless corroborated.

No Vercel/GitHub credentials, paid plan, provider API integration, new service
or runtime dependency is required. The app records the outcome; it does not
publish a portfolio or change provider settings for the learner. Optional
custom domains are supported but never required. A protected/login-only URL
does not establish the proposed shareable, signed-out outcome.

Vercel distinguishes deployment URLs from production domains, so the app must
test the submitted sharing URL rather than assume all `.vercel.app` links have
the same visibility. Sources checked for this design:
[deployment protection](https://vercel.com/docs/deployment-protection) and
[Git deployments](https://vercel.com/docs/git).

## Alternatives considered

- **Recommended: one final deployment package and review.** Matches the current
  lesson, reuses existing lifecycle behavior and keeps learner effort small.
- **Manual URL/checkbox completion.** Smaller implementation, but cannot
  distinguish an unrelated, stale, inaccessible or unverified URL.
- **Historical five-stage release curriculum.** Adds separate deliverables and
  assessments explicitly removed on 6 October; do not restore it.

## Implementation sequence and verification

1. Versioned Practice definition, one record template, release evidence and
   completion contracts; preserve all pages and existing receipts.
2. Same-task start/resume, bounded collection and public-URL verification,
   approval/review freshness and atomic completion/revocation.
3. Existing Practice submission/return surfaces and URL/result feedback;
   preserve the black/gold visual theme. Document host-page integration without
   changing the courseapp owner's files or approved copy.
4. Focused tests: missing/wrong prior handoff, task unavailable, missing/invalid
   records, wrong source or workspace, auth/error/private/redirect URL,
   source/URL edits after approval and after review, review rejection, retry,
   concurrent mutation, archived completion/revision and restart.
5. Disposable Module 2→3→4 journey with simulated provider/reviewer responses,
   desktop/narrow no-overflow checks and visual inspection. Verify that ordinary
   progress writes and browsing all pages cannot grant completion.
6. Required typecheck, lint, unit/startup tests, build and Electron smoke/chat/
   guide; synchronize the progress ledger with actual evidence. Real provider,
   live AI and learner acceptance remain separate recorded gates.

Module 2/3 picky-student reviews run concurrently using disposable data. Their
confirmed repairs are a separate batch and must preserve existing approved
copy, evidence boundaries and the owner's uncommitted work.
