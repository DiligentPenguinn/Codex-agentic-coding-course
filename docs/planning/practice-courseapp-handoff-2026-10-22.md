# Practice workflow handoff to the courseapp owner — 22 October 2026

The owner clarified: this branch implements Practice workflow; the courseapp
belongs to the other owner. No new edits to LearningWindow, lesson scenes,
theory/script/prompt copy, course navigation or completion-page wording belong
to this batch. Earlier uncommitted courseapp work is preserved as found.

## Module 4 integration contract

Practice identity: `m4-portfolio-release` / `1.0.0`.
Definition: `pilot-workspace/course/practices/m4-portfolio-release.json`.
The existing shared course contract already declares this identity and the
`portfolio-release` evidence profile. No courseapp scene or course map changes
were made to activate it.

Practice starts only with the current course's Module 3 v2 completion receipt,
matching retained task and selected portfolio folder. It continues the same
task; unavailable/mismatched handoff preserves the previous state and offers
retry. The app never logs in, pushes or deploys for the learner.

Codex maintains one `evidence/module-4/deployment-record.json`. Actual local
Git/source/file checks and a bounded public HTTPS request corroborate parts of
the record. Provider/build/desktop/mobile results remain reported unless
corroborated; the read-only AI review compares them with the exact task and
authentic learner decisions. Final in-app acceptance and review are required.
There is no final quiz, separate Preview stage, rollback exercise, essay or
transfer project.

The existing public Practice API supports:

```ts
await api.startPractice({
  practiceId: 'm4-portfolio-release', practiceVersion: '1.0.0', transfer: false
})
await api.loadPracticeWorkspace({
  practiceId: 'm4-portfolio-release', practiceVersion: '1.0.0'
})
// Existing Practice submission controls call approvePortfolioPackage with
// approveWebsite:true, then reviewPractice. They bind run/generation/digest.
await api.returnPassedPractice()
```

After a fresh passed review, `returnPassedPractice()` rechecks evidence, saves
the authoritative return and archives the full attempt. Receipt checkpoint is
`m4-portfolio-release`; destination is lesson `module-4`, checkpoint
`m4-complete`, scene `module-4-complete`. No new graduation screen is supplied.
Ordinary `saveProgress` calls cannot replace the required reviewed return.

### Courseapp work still owned by the recipient

1. `LearningWindow.tsx`'s `action === 'practice'` branch currently recognizes
   only scene-owned Practice definitions and the explicit Module 2/3 entries.
   The Module 4 renderer scene has no attached `practice` object, so its existing
   button does not open the workflow. Add the Module 4 entry to the host's normal
   Practice-opening route and resolve the identity above. Do not let the current
   default identity silently fall back to Module 3.
2. Existing Module 4 Practice/completion scenes and Pilot text still describe
   the integration as deferred. The owner must approve and update that copy;
   this branch deliberately preserves it.
3. Use the receipt-driven destination and refreshed progress on return. Avoid
   the Module 2/3 legacy stage callback for Module 4 and do not add a final quiz.
4. Course-wide graduation/acceptance remains a separate owner decision. A
   technically verified Practice receipt is not live provider, AI or learner
   acceptance, nor approval of all courseapp UI.

The disposable integration test starts Module 4 through the public Practice
API and uses actual companion Practice controls. This proves the owned workflow
without silently implementing the recipient's entry page.

## Picky-student review — courseapp findings, untouched

The two reviewers used isolated data and simulated Codex. Their observed UI and
actual-service reproductions are distinguished from source-only findings.

| Finding | Evidence | Suggested owner-side repair |
|---|---|---|
| Module 2 wrong-answer submission immediately hides correctness/explanations; Back displays an empty assessment | Observed Electron UI after four correct answers and one incorrect; `saveAssessmentBatch` advances to summary before feedback, while review mode suppresses assessment controls | Preserve the existing post-submit feedback before summary; render submitted answers read-only when browsing history |
| Narrow Module 2 summary clips redo/completion actions | Visually inspected at 390px; `.pixel-summary-navigation` remains horizontal while Back refuses to shrink | Stack the summary navigation and reset child sizing at narrow widths |
| Module 3 completion button enables for five answered questions despite the backend requiring five correct | Confirmed renderer/backend mismatch; completion service correctly rejects the incomplete mastery result | Align button availability with the existing five-correct gate, preserving retry |
| Normal Module 2 handoff hides approved Module 3 debugging dialogue behind technical handoff metadata | Confirmed `LearningWindow` branch replacing `scene.dialogue` whenever the legitimate planning handoff exists | Render the approved lesson dialogue and put optional context in a subordinate surface |
| Module 3 summary says “tám tài liệu”; internal decisions still name old stages/slices | Current source references historical v1 requirements despite v2 Practice | Seek exact-copy approval for the summary; align internal metadata with the existing v2 contract |

Module 2 UI evidence:
`.superpowers/picky-module2/ui-1792602520873/quiz-wrong-answer-summary.png` and
`quiz-wrong-answer-back.png`.
Module 3 path coverage:
`.practice-test-artifacts/module3-ui/coverage.json`.
All 22 Module 3 scenes were traversed in a disposable Electron build at
1180/390/320px with no horizontal overflow. That traversal used a temporary
debug-dialogue repair build; the new courseapp edits were removed after the
owner clarified the boundary. They are not delivered as fixes here.

## Picky-student review — owned Practice repairs

- Regular Finder `.DS_Store` files no longer block Module 2's otherwise valid
  five-document package or change its digest. Links/directories with that name
  and unrelated dotfiles remain rejected.
- Nested source/assets such as `src/evidence`, `src/planning`, `src/out` and
  `public/evidence` participate in Module 3's fingerprint. Reserved generated
  and evidence directories are excluded only at workspace root.
- An unchanged completed Module 3 v2 attempt remains archived after fresh task
  and file checks; changed evidence reopens the original task without approval.
- Explicit restart preserves the full old attempt and its history.
- Restart after building checks the original five planning/screenshot digests
  without incorrectly applying Module 2's no-application-files rule to the now
  expanded Module 3 workspace. Actual Module 2 submission remains strict.
- Withdrawing acceptance after a passed Module 3/4 review blocks return, clears
  current approval/review and requires a new review. Renewed acceptance on the
  same source creates an authoritative receipt without a key collision.
- Modules 3–4 restart copy now explains that the current task, files and history
  are retained. The owner approved that exact paragraph/button separately;
  other modules retain their original wording.

## Delivered verification and limits

The coherent Windows batch passed typecheck, lint, 711 unit tests (three skips),
nine startup checks, build, full Electron smoke/Teacher chat/Practice Guide and
the disposable Module 2→3→4 rehearsal. Two intentional unit skips pre-existed;
one release file-symlink test cannot create that link with the Windows account's
privileges. Directory-junction tests ran. The later approved exact-copy edit
received narrow render/TypeScript/lint checks under the trivial-edit fast path.

Module 4 desktop 1024px and narrow 360/320px screenshots are under
`.superpowers/sdd/screenshots/module-4-release-*.png`; 1024/320px were visually
inspected after the record-path layout repair and no-overflow assertions pass.
The preservation audit retains all 22 Module 3 scenes and six Module 4 scenes
in the incoming order and found no new courseapp edits in this batch.

All AI, deployment/provider and public-URL responses in lifecycle rehearsals
are explicitly simulated. Real authenticated deployment, live AI review quality,
native macOS behavior and learner/owner/pilot acceptance remain unverified.
The owner subsequently authorized committing and pushing all preserved work
to the existing Practice branch. Publication includes that earlier work and
does not change the recorded ownership or acceptance gaps. No external
deployment was performed.
