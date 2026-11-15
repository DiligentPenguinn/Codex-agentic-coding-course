# Agentic Coding Course — ContentPilot Planning Handoff

> **Historical handoff.** This document no longer defines the runnable-course
> direction. Use [Portfolio Course v1](./portfolio-course-v1/README.md) and the
> [portfolio implementation plan](./portfolio-course-implementation-plan.md).

**Snapshot date:** 27 July 2026  
**Branch:** `triet-content=planning`  
**Status:** The agentic-coding learning direction, ContentPilot practice
project, general visual direction, beginner stack, Version A six-module/chapter
progression, and artifact/run-state contract are agreed. The initial starter
repository, cost-awareness policy, graduation progression, and graduation
assessment are also locked. The initial learner starter is implemented and
validated inside this course repository.

## Resume prompt for a new Codex chat

> Continue planning from `docs/planning/content-automation-course-handoff.md`,
> `docs/planning/version-a-curriculum-blueprint.md`,
> `docs/planning/artifact-schema-and-run-state-v1.md`, and
> `docs/planning/starter-repository-progression-v1.md`, and
> `docs/planning/graduation-assessment-v1.md`. Inspect the repository before
> asking anything that the files can answer. Present tightly connected,
> consequential choices as one decision packet with a recommendation,
> alternatives, tradeoffs, and downstream consequences. Resolve small,
> reversible details from evidence or safe defaults. The validated initial
> starter is in `starters/contentpilot/`. Continue with the first learner
> release decision packet at the end of this handoff; do not publish an
> external repository until its owner and visibility are confirmed.

## Course outcome

The course teaches creators and marketers a transferable agentic-coding
workflow: understand a problem, inspect a repository, define scope and evidence
of completion, review a plan, delegate implementation to a coding agent, and
verify the result before accepting it.

ContentPilot is the continuous practice project that makes those skills
concrete. It is evidence of learning, not the subject of the course. After
graduating, a learner should be able to apply the same workflow to a different
repository and use ContentPilot to demonstrate an application that can:

1. Learn the creator's voice from real examples.
2. Research a niche and expand from optional known competitor names to
   additional competitors that match the niche and primary platform.
3. Identify evidence-backed content patterns without copying competitor wording or layouts.
4. Produce 10 content ideas, show the selection criteria, and let the learner
   choose 5 for development.
5. Generate review-ready copy and visuals.
6. Let the creator edit, revise, approve, archive, and export the 5 content
   packages.

The final application must use real AI workflows. It must not be a hard-coded educational demonstration.

## Locked product boundaries

- The learner modifies a provided starter GitHub repository throughout the course.
- The existing course structure may evolve substantially if needed.
- The default use case is the learner's own business and content; a sample brand is available as a fallback.
- The core application is local and private. Accounts, authentication, a cloud database, deployment, and automatic publishing are not required.
- The core course is schedule-aware: the learner can choose a cadence such as
  weekly and generate the default batch of 10 ideas and 5 selected packages.
- Fully unattended scheduled/background generation is advanced material, not a graduation requirement.
- The workflow stops for human review before anything is approved or published.
- Real OpenAI API use is required for graduation.
- A mock mode may exist only for learning and troubleshooting. It cannot be the final workflow.

## Inputs and onboarding

- Required research input: niche keywords.
- Optional research input: competitor names already known by the learner.
- The AI extends the research to find competitors that match the saved niche and
  primary platform, plus sources that directly support the saved claims.
- The learner chooses one primary publishing platform.
- Research may examine patterns across platforms, but final content is adapted to the primary platform.
- Secondary sources may help discover competitors or provide industry context.
  A claim about a named competitor's behavior requires inspectable content
  attributable directly to that competitor; secondary reporting alone cannot
  validate it.
- Voice onboarding requires at least five distinct real content examples.
- Voice analysis is reusable onboarding data, not something that must rerun for every weekly batch.
- Visual inputs may combine:
  - the creator's approved likeness,
  - product or brand imagery,
  - illustration-only visuals.
- Any use of the creator's photo requires explicit approval.

## Core workflow

The main experience uses one obvious workflow action:

```text
Onboarding
    ↓
Research and cited evidence
    ↓
Content patterns
    ↓
10 ideas
    ↓
5 selected content packages
    ↓
Copy and visual generation
    ↓
Human review
    ↓
Approval, archive, and export
```

- The workflow can run research → patterns → 10 ideas → 5 packages → visuals without mandatory approval between every phase.
- Research remains inspectable.
- Questionable or unsupported sources are excluded.
- Individual stages can be rerun when necessary.
- The default weekly batch produces 10 ideas and develops 5 learner-selected
  ideas, while the underlying batch size may become configurable later.

## Required output for each selected idea

Each of the five selected ideas should produce:

- a primary caption or post,
- an alternate hook,
- a call to action,
- two visual variants,
- an optional short-form video script.

The review experience allows the learner to:

- edit copy directly,
- choose between visual variants,
- request a revision,
- approve the package.

Approved work is saved to a local archive and can be exported with:

- final copy,
- selected image,
- source notes,
- suggested publishing date.

## Model and API decisions

- Primary course model: `gpt-5.6-terra`.
- Default reasoning effort: `medium`.
- `gpt-5.6-sol` may be offered later as an advanced quality option.
- The beginner path should not make learners choose a model.
- Use the OpenAI Responses API for the new implementation.
- Keep the API key in server-side environment configuration.
- Use web-search results with visible source citations.
- Use Structured Outputs with Zod schemas for reliable workflow artifacts.
- Use the image-generation tool for real visual generation and editing.
- Prefer explicit locally saved artifacts between phases instead of relying on a long hidden conversation.

Relevant current documentation:

- [Using the latest OpenAI models](https://developers.openai.com/api/docs/guides/latest-model)
- [Web search](https://developers.openai.com/api/docs/guides/tools-web-search)
- [Structured Outputs](https://developers.openai.com/api/docs/guides/structured-outputs)
- [Image generation](https://developers.openai.com/api/docs/guides/tools-image-generation)
- [Conversation state](https://developers.openai.com/api/docs/guides/conversation-state)

## Design direction

The approved general direction is:

- minimal and quiet,
- warm neutral palette,
- restrained coral accent,
- editorial rather than dashboard-heavy,
- one obvious primary action,
- very few visible buttons,
- advanced and secondary actions revealed only when needed.

The current disposable prototype is:

- [Prototype overview](../../prototypes/mvp-2-content-workflow-prototype/README.md)
- [Prototype interface](../../prototypes/mvp-2-content-workflow-prototype/index.html)

The user considers the visual direction good enough to keep for now. Specific interface copy and content will be discussed later.

The prototype contains simulated data only. It is not the final learner application.

## Research findings

### Local Workflow Lab

The local `husky-workflow-lab` is the strongest source for the product method:

- durable phase artifacts,
- an evidence ledger,
- separation of verified competitor examples from supporting research,
- reusable voice data,
- evidence before drafting,
- review before scheduling.

Reuse those ideas, but do not reproduce:

- a giant API implementation inside `vite.config.ts`,
- duplicated status fields that can become stale,
- a ten-agent architecture in the beginner course,
- unfinished scheduling and analytics stages.

### Official OpenAI examples

- [OpenAI Responses starter app](https://github.com/openai/openai-responses-starter-app): reuse server-protected keys, Responses API streaming, progress events, and citation rendering. Do not copy its generic chat interface or broad dependency set.
- [Structured Outputs samples](https://github.com/openai/openai-structured-outputs-samples): reuse schema-driven interface ideas. Implement them with the current Responses API rather than copying older request syntax.
- [OpenAI Agents SDK for JavaScript](https://github.com/openai/openai-agents-js): reserve agents, tracing, handoffs, and resumable human approval for advanced material.
- [OpenAI Cookbook](https://github.com/openai/openai-cookbook): use as a technique reference, not as the starter repository.

## Recommended starter architecture

Create a focused starter repository owned by this course instead of asking learners to modify a large external demo.

The exact initial repository, chapter additions, graduation tree, and milestone
checks are locked in:

- [Starter repository progression v1](./starter-repository-progression-v1.md)

The initial repository includes only the runnable application shell, setup,
workflow and review empty routes, server environment handling, safe generic JSON
storage, sample material, and passing checks. It does not contain finished
ContentPilot schemas, API workflows, or fake results.

At graduation, the application owns setup, run workspace, review and archive
screens; server-only OpenAI calls; typed domain schemas; workflow services;
profile, run, artifact and asset stores; recovery controls; and graduation
verification. Runtime content follows the directory layout in the artifact
contract.

Each phase accepts explicit inputs and writes an immutable, typed artifact
revision. `run.json` is the only authority for active revisions. The interface
derives progress from the manifest, validated artifacts, input references, and
attempt records rather than maintaining a second workflow status.

The complete contract is:

- [Artifact schema and run-state contract v1](./artifact-schema-and-run-state-v1.md)

## Pedagogical direction

- Learners build one coherent application incrementally.
- Each module completes one whole learner goal.
- Chapters provide resumable 40–95 minute milestones inside longer modules.
- Every chapter should leave the starter application more capable than before.
- Reusable teaching units remain 5–10 minutes long.
- Codex performs real repository work while the learner practices briefing, inspecting, making decisions, testing, and reviewing.
- Course exercises should use the learner's real business when possible.
- The sample brand exists so missing business material never blocks learning.
- Avoid teaching abstraction before learners have experienced the concrete problem it solves.
- Agent frameworks and unattended automation belong after the direct phase-based workflow is understood.

## Locked course architecture

The beginner starter stack is:

- Next.js,
- TypeScript,
- OpenAI JavaScript SDK,
- Zod,
- plain CSS,
- local JSON storage.

The selected curriculum is **Version A — Agentic Coding Through Practice**:

- one course introduction and six skill-based modules,
- resumable chapters inside modules that exceed one study session,
- approximately 14–16 hours,
- transferable skill outcomes demonstrated through product milestones,
- reusable 5–10 minute units with semantic IDs,
- one coherent application that becomes more capable in every chapter,
- a real API-powered graduation workflow.

Learner-facing module and chapter titles name both the action and the observable
output. Locked quantities appear directly when they clarify the task: 10 ideas,
5 selected packages, and 2 visual variants per package.

The exact progression, unit IDs, build labs, product artifacts, and completion
tests are defined in:

- [Version A curriculum blueprint](./version-a-curriculum-blueprint.md)

This structure may evolve toward the more guided Version B by splitting chapters
into smaller guided lesson groups and adding scaffolding. Module and chapter
numbers are presentation; semantic unit IDs are the durable identity.

## Locked artifact and run-state architecture

The selected design is **versioned artifacts with one active-run manifest**:

- reusable brand and voice profiles live outside weekly runs,
- each run receives immutable input snapshots,
- reruns create new artifact revisions,
- `run.json` selects the active revision for each phase,
- each artifact records its exact upstream input references,
- downstream artifacts become stale rather than being deleted,
- failed reruns preserve the last usable revision,
- approval creates immutable archive snapshots,
- phase state is derived rather than stored twice.

Exact schemas, dependencies, transitions, invalidation rules, archive behavior,
and validation requirements live in:

- [Artifact schema and run-state contract v1](./artifact-schema-and-run-state-v1.md)

## Current planning checkpoint

The starter stack, curriculum progression, artifact/run-state contract, and
initial-to-graduation repository progression are settled.

The starter decision is a runnable foundation with generic infrastructure,
honest empty states, and passing checks. Learners build every
ContentPilot-specific capability. The complete decision is:

- [Starter repository progression v1](./starter-repository-progression-v1.md)

The first research rule is settled: secondary sources support discovery and
context, while competitor-specific claims require inspectable direct evidence.
The evidence threshold is also settled:

- A single-competitor pattern requires two distinct direct examples from that
  competitor.
- A cross-competitor pattern requires at least two competitors and one distinct
  direct example from each.
- Supporting research does not count toward either minimum.
- One direct example remains an observation rather than a pattern.
- Every accepted source records its URL, publisher, capture time, claim, and
  evidence note.
- Text claims preserve a short supporting excerpt, visual claims preserve a
  local screenshot, and mixed claims preserve both.
- If the original becomes inaccessible and the required capture is absent, a
  new evidence revision marks the item unverifiable. It can no longer support a
  retained pattern.
- Full-page copies are not required.
- Research prioritizes sources from the preceding 12 months. Older or undated
  sources require a relevance reason and cannot produce high confidence.
- Only high- and medium-confidence findings can become retained patterns.
- A valid patterns artifact contains 3–5 patterns. Fewer than 3 creates
  `needs_more_research`; the application does not invent filler.

The API cost-awareness and recovery policy is settled:

- Learners use their own OpenAI API keys and remain responsible for deciding
  whether to proceed with a paid operation.
- The application shows a clearly labeled estimated cost range before starting
  a run and again before visual generation.
- The estimate states its assumptions and makes clear that actual cost may vary
  with input size, output length, tool use, retries, and image generation.
- The beginner workflow does not impose a mandatory spending ceiling.
- An optional learner-configured limit may be introduced in advanced material.
- Duplicate submissions and reruns of expensive downstream stages require an
  intentional learner action.
- Stopping, rejecting, or failing an API operation preserves every previously
  valid artifact and presents a bounded recovery path.

The graduation assessment is settled as an evidence-gated portfolio defense:

- all non-negotiable evidence gates must pass,
- human review scores six mastery dimensions,
- passing requires at least 18 of 24 with no dimension below 2,
- evidence reasoning and technical ownership must each score at least 3,
- the learner defends one decision, one revision or recovery, and one remaining
  limitation using their own run, and
- resubmission targets only the failed gate or weak dimension unless the run's
  provenance or dependency chain is fundamentally invalid.

The complete contract is:

- [Graduation assessment v1](./graduation-assessment-v1.md)

## Next execution decision

The implementation strategy is settled: build and validate the learner starter
inside this course repository, then extract the validated baseline into a clean
standalone GitHub template for learners.

The initial baseline now lives at `starters/contentpilot/`. It provides:

- a responsive Vietnamese-first application shell,
- honest `/setup`, `/workflow`, and `/review` empty states,
- a non-sensitive `/api/health` route,
- guarded paths and atomic local JSON writes,
- complete sample-brand reference material,
- pinned compatible dependencies and a package lock, and
- passing lint, typecheck, test, build, dependency, desktop, and mobile checks.

It intentionally contains no ContentPilot domain schemas, OpenAI request,
generated artifacts, fake workflow progress, approval, archive, or export
behavior.

Pilot 0.1 now lives at `pilot-workspace/` as a self-contained downloadable
workspace. It includes:

- a `START_HERE.md` entry point,
- project-local `$start-course-lesson` and `$course-teacher` skills,
- a two-stage manifest for the prologue and Module 1,
- static Vietnamese-first lesson scripts and one-question-at-a-time quizzes,
- ignored, atomically written local resume state,
- quest-card and Module 1 evidence templates, and
- a clean copy of the real ContentPilot starter with a bounded responsive UI
  lab.

The current workspace intentionally stops after Module 1. Its purpose is to
validate the first transferable agentic-coding loop: activation, resumption,
Teacher pacing, learner ownership, approval behavior, evidence review, and
application of the same reasoning outside ContentPilot before authoring all six
public-release modules.

After private testing, the next consequential decision packet should use
observed pilot evidence to settle:

1. whether the downloadable workspace remains the primary format,
2. which activation or resume friction must be removed,
3. which teaching beats should be shortened, combined, or expanded, and
4. whether to build Modules 2–6 in the same workspace before public release.
