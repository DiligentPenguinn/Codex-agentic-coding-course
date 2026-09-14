# GitHub and Vercel content review — 14 September 2026

The owner requested the whole content batch, followed by one review using
GPT-5.6 Sol with high reasoning effort. The read-only agent
`review_publication_content` performed that review. Vietnamese course copy used
only `write-natural-vietnamese`, as requested.

| Review finding | Resolution in the final batch |
| --- | --- |
| The Pilot hosting opening lost approved headings/table/closing sentence | Restored both opening sections from baseline `5526b30` verbatim. The two renderer dialogues remain unchanged. |
| GitHub push could be skipped before mastery | Added an explicit manual repo/branch/commit/visibility comparison at the existing post-Practice mastery introduction and in Teacher sequencing. The learner confirmation is labeled as manual; automatic provider verification remains out of this content batch. |
| Learner screens used internal implementation terminology and an unavailable primary Practice button | Replaced those explanations with plain review-state copy and removed the unavailable primary action. Existing Practice scene, identity and deferred integration remain. |
| New technical terms were concentrated or unexplained | Explained GitHub security/file/commit terms where needed; split agent preparation from the three illustrated build settings; removed the Vite/dist aside. |
| Correct answers clustered at the second option; transfer criteria exceeded the prompt | Distributed the eleven MC answers across positions, tightened distractors and explicitly requested scope, exclusions, checking and stopping point in the transfer prompt. |
| Optional clarity on accounts and later task recovery | Named GitHub/Vercel and explained using a new Codex task in the same project when the previous task is unavailable. |

The reviewer found the protected first Production → branch Preview → optional
public release sequence technically coherent and confirmed baseline scene IDs
were retained. Parent checks cover the final edits; the agent was not asked to
perform a second review. This document does not claim owner or pilot acceptance.

Current source links and image provenance are in the Module 4 lesson and
`course-companion/src/renderer/src/assets/lesson-visuals/module-4/SOURCES.md`.
The provider browser flow is documentation-backed and illustrated with read-only
captures; authenticated deployment/rollback rehearsal remains pending.

Final parent verification passed typecheck, lint, 40 focused tests, all 323 unit
tests, nine startup tests and the production build. The publication-specific
Electron journey passed 37 instructional pages across 74 desktop cases
(1440 × 900 and 1180 × 748), five formative and eight final questions, all three
annotated image enlargements, outline/keyboard navigation and unchanged saved
progress. Screenshots and measurements are in
`tmp/publication-content-2026-09-14/`.

Full-app Electron verification failed at `tests/electron-smoke.mjs:580`, which
expects the visible title `Module 1 đã hoàn thành`. Baseline `5526b30` already
does not render that title. This unrelated obsolete expectation stops the full
run before Modules 3/4 and remains outside the content batch. The passing scoped
journey does not establish full-app or authenticated provider acceptance.
