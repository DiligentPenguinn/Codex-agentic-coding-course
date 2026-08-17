# ContentPilot Starter Repository Progression v1

> **Retired from the runnable course direction.** This starter contract remains
> historical planning evidence. The portfolio course creates the learner
> application from scratch in Module 3; see
> [Portfolio Course v1](./portfolio-course-v1/README.md).

**Status:** Locked planning contract; initial baseline implemented and validated
on 27 July 2026  
**Decision:** Runnable foundation with learner-built product behavior  
**Applies to:** Version A initial starter repository through graduation  
**Primary stack:** Next.js, TypeScript, OpenAI JavaScript SDK, Zod, plain CSS,
and local JSON storage

## Purpose

This document defines:

- the exact repository surface provided before Module 1,
- what already works and what is intentionally absent,
- the files and behavior added in each chapter,
- the repository surface expected at graduation, and
- the automated and manual proof required at every milestone.

This is an implementation contract for the ContentPilot practice project. The
transferable learning outcomes and assessment sequence live in the curriculum
blueprint; completing these product additions alone does not prove mastery.

The phrase **initial starter repository** means the repository state before the
learner begins Module 1. It is not a product phase, workflow phase, or course
module.

Related source-of-truth contracts:

- [Version A curriculum blueprint](./version-a-curriculum-blueprint.md)
- [Artifact schema and run-state contract v1](./artifact-schema-and-run-state-v1.md)
- [Graduation assessment v1](./graduation-assessment-v1.md)

## Core decision

The starter provides generic infrastructure that is difficult, repetitive, or
safety-sensitive. The learner builds every ContentPilot-specific capability.

Provided infrastructure:

- a runnable application shell,
- server-only environment handling,
- guarded paths and atomic JSON writes,
- a small visual foundation,
- honest empty states,
- a sample-brand fallback, and
- passing baseline checks.

Learner-built product behavior:

- brand and voice schemas,
- reusable profile storage,
- OpenAI requests,
- cited research and source review,
- patterns, ideas, drafts, and visuals,
- run manifests and active artifact revisions,
- approval, archive, export, rerun, and recovery behavior.

The initial repository never presents hard-coded ideas, drafts, images, or
workflow progress as if they were real results.

## Initial starter repository

The validated implementation lives at:

```text
starters/contentpilot/
```

```text
contentpilot/
  AGENTS.md
  README.md
  .env.example
  .gitignore
  package.json
  package-lock.json
  tsconfig.json
  next-env.d.ts
  next.config.ts
  eslint.config.mjs
  vitest.config.ts

  app/
    layout.tsx
    page.tsx
    globals.css
    setup/
      page.tsx
    workflow/
      page.tsx
    review/
      page.tsx
    api/
      health/
        route.ts

  components/
    AppShell.tsx
    EmptyState.tsx

  server/
    config/
      env.ts
    storage/
      paths.ts
      atomic-json.ts

  samples/
    sample-brand.json

  data/
    .gitkeep

  tests/
    health.test.ts
    atomic-json.test.ts
```

The initial validated baseline pins:

| Package | Version |
|---|---:|
| Next.js | 16.2.12 |
| React and React DOM | 19.2.8 |
| OpenAI JavaScript SDK | 6.49.0 |
| Zod | 4.4.3 |
| TypeScript | 5.9.3 |
| ESLint | 9.39.5 |
| Vitest | 4.1.10 |

The package lock also overrides affected transitive versions of PostCSS, Sharp,
Minimatch, and Brace Expansion. The validated installation reports zero known
npm vulnerabilities. Future releases update pins only after the full starter
check passes again.

## What works initially

### Commands

`README.md` documents one purpose for each command:

| Command | Initial responsibility |
|---|---|
| `npm install` | Install the pinned dependency set |
| `npm run dev` | Start the local application |
| `npm run lint` | Check source style and common mistakes |
| `npm run typecheck` | Check TypeScript without emitting files |
| `npm test` | Run the automated test suite |
| `npm run build` | Prove the production build compiles |
| `npm run check` | Run lint, typecheck, tests, and build |

Every command above succeeds before the learner changes the repository.

### Routes and screens

| Route | Initial behavior |
|---|---|
| `/` | Shows the ContentPilot welcome screen and one primary action, `Bắt đầu thiết lập` |
| `/setup` | Shows an honest empty state explaining that brand setup will be built in Module 2 |
| `/workflow` | Shows an honest empty state; it contains no fake research, ideas, or drafts |
| `/review` | Shows an honest empty state; it contains no fake packages or approval status |
| `/api/health` | Returns a non-sensitive readiness response without requiring an API key |

The empty routes establish the destination and navigation model. They are not
counted as implemented workflow phases.

### Generic infrastructure

- `env.ts` reads server environment variables without exposing secrets to the
  client. A missing OpenAI key does not prevent the starter shell from running.
- `paths.ts` resolves paths only inside the application-managed `data/`
  directory and rejects absolute paths and `..` traversal.
- `atomic-json.ts` writes generic JSON through a temporary file and atomic
  rename. It does not know about brands, runs, or artifacts.
- `AppShell.tsx` supplies the page frame and navigation.
- `EmptyState.tsx` supplies one consistent empty-state pattern.
- `sample-brand.json` contains a complete fallback brand and at least five
  writing examples. It is reference material, not preloaded application state.

### Initial safety rules

- `.env*` files containing secrets are ignored; `.env.example` is committed.
- Runtime content under `data/` is ignored except for `.gitkeep`.
- No API key appears in client code, logs, samples, or tests.
- The app does not require an account, database, deployment, or network request
  to reach its initial screens.
- Baseline tests cover the health response, path rejection, successful atomic
  replacement, and preservation of the previous file after a failed write.

## Intentionally absent initially

The following must not exist as completed behavior before the learner builds
it:

- brand or voice domain schemas,
- profile indexes or stored profile revisions,
- an OpenAI client or generation route,
- run manifests, attempts, or artifact envelopes,
- evidence, patterns, ideas, drafts, visuals, or review artifacts,
- generated images,
- approval, archive, or export logic,
- mock workflow results,
- automatic scheduling or publishing.

The artifact contract still governs every feature when it is introduced. The
course does not first build a disposable data model and later migrate to the
real one.

## Module and chapter additions

The paths below name responsibilities. A chapter may split a large component
into smaller files during implementation as long as it preserves the stated
boundary and proof.

### Module 1 — Inspect, delegate, and verify changes

The learner:

- updates `AGENTS.md` with the product purpose, approved commands, language
  rules, data boundaries, and verification expectations;
- completes a course-supplied responsive-interface task in `app/page.tsx` and
  `app/globals.css`;
- reviews the complete diff; and
- runs the documented checks.

The task makes the welcome screen's primary action easy to use at narrow mobile
widths without changing desktop behavior. No test begins in a failing state.

No ContentPilot domain schema or generated content is added in Module 1.

### Chapter 2.1 — Save reusable brand data

Adds:

```text
app/
  setup/
    BrandSetupForm.tsx
  api/
    profiles/
      brand/
        route.ts

server/
  schemas/
    shared.ts
    brand-profile.ts
  storage/
    profile-store.ts

tests/
  brand-profile.test.ts
  brand-profile-route.test.ts
```

Behavior:

- `/setup` renders the real brand form.
- Saving creates a validated, versioned brand profile and updates
  `data/profiles/index.json`.
- Reloading returns the saved profile.
- Editing creates a new revision instead of overwriting the previous revision.
- The sample brand can populate the form only after an explicit learner action.

### Chapter 2.2 — Analyze and save a voice profile

Adds:

```text
app/
  setup/
    VoiceAnalysisPanel.tsx
  api/
    profiles/
      voice/
        analyze/
          route.ts

server/
  openai/
    client.ts
  schemas/
    voice-profile.ts
  workflow/
    analyze-voice.ts

tests/
  voice-profile.test.ts
  voice-analysis-route.test.ts
```

Behavior:

- The first real OpenAI request runs only on the server.
- The route requires at least five writing examples.
- Structured output must pass the voice-profile schema before it is saved.
- Invalid output or request failure cannot replace the last valid voice profile.
- Voice analysis runs only when the learner intentionally requests it.

### Chapter 3.1 — Collect cited evidence

Adds:

```text
app/
  workflow/
    [runId]/
      page.tsx
    RunWorkspace.tsx
    EvidencePanel.tsx
  api/
    runs/
      route.ts
      [runId]/
        research/
          route.ts

server/
  schemas/
    run.ts
    attempt.ts
    artifact-envelope.ts
    evidence.ts
  storage/
    run-store.ts
    artifact-store.ts
  workflow/
    research.ts

tests/
  run-store.test.ts
  evidence.test.ts
  research-route.test.ts
```

Behavior:

- Starting research creates a run with immutable brand and voice snapshots.
- Research uses the saved niche, primary platform, and optional known
  competitors.
- Every saved claim keeps its supporting source reference.
- Direct competitor examples and secondary discovery or context sources retain
  distinct roles.
- Text claims save a short supporting excerpt, visual claims save a local
  screenshot, and mixed claims save both.
- A validated evidence revision and its attempt record are inspectable after
  reload.
- `/workflow/[runId]` becomes the active run workspace.

### Chapter 3.2 — Accept sources and extract patterns

Adds:

```text
app/
  workflow/
    SourceReviewPanel.tsx
    PatternsPanel.tsx
  api/
    runs/
      [runId]/
        sources/
          route.ts
        patterns/
          route.ts

server/
  schemas/
    patterns.ts
  workflow/
    extract-patterns.ts

tests/
  source-review.test.ts
  patterns.test.ts
  patterns-route.test.ts
```

Behavior:

- The learner can accept, reject, or flag a source with a reason.
- Rejected evidence cannot support a retained pattern.
- Supporting research alone cannot validate a pattern attributed to a named
  competitor.
- A source that becomes inaccessible without its required capture is marked
  unverifiable and cannot support a retained pattern.
- Research prioritizes the preceding 12 months. Older or undated direct evidence
  requires a relevance reason and cannot produce high confidence.
- A single-competitor pattern requires two distinct direct examples from that
  competitor; a cross-competitor pattern requires direct examples from at least
  two competitors.
- One direct example remains an observation rather than a pattern.
- Only high- and medium-confidence findings can become retained patterns.
- A valid artifact contains 3–5 patterns. Fewer than 3 produces
  `needs_more_research` and no candidate patterns artifact.
- Every pattern links to accepted evidence.
- Anti-copy rules prevent reused competitor wording, claims, and distinctive
  layouts.

### Chapter 4.1 — Generate 10 ideas and select 5

Adds:

```text
app/
  workflow/
    IdeasPanel.tsx
  api/
    runs/
      [runId]/
        ideas/
          route.ts
        selections/
          route.ts

server/
  schemas/
    ideas.ts
  workflow/
    generate-ideas.ts

tests/
  ideas.test.ts
  idea-selection.test.ts
  ideas-route.test.ts
```

Behavior:

- The active evidence, patterns, brand, and voice revisions are explicit
  generation inputs.
- Generation produces exactly 10 distinct, validated ideas.
- The interface shows platform fit, voice fit, evidence support, and variety.
- The learner explicitly selects exactly 5 ideas.
- The run manifest is the only authority for active artifact revisions.

### Chapter 4.2 — Draft 5 copy packages

Adds:

```text
app/
  workflow/
    DraftsPanel.tsx
  api/
    runs/
      [runId]/
        drafts/
          route.ts

server/
  schemas/
    drafts.ts
  workflow/
    generate-drafts.ts

tests/
  drafts.test.ts
  drafts-route.test.ts
```

Behavior:

- Exactly 5 selected ideas become editable content packages.
- Each package contains a primary post, alternate hook, CTA, and optional
  short-video script.
- Learner edits survive reload and remain distinguishable from model output.
- A draft retains references to the idea and upstream artifact revisions used
  to produce it.

### Chapter 5.1 — Generate 2 visual variants per package

Adds:

```text
app/
  workflow/
    VisualsPanel.tsx
    LikenessConsent.tsx
  api/
    runs/
      [runId]/
        visuals/
          route.ts

server/
  schemas/
    visuals.ts
  storage/
    asset-store.ts
  workflow/
    generate-visuals.ts

tests/
  asset-store.test.ts
  likeness-consent.test.ts
  visuals.test.ts
  visuals-route.test.ts
```

Behavior:

- Each of the 5 packages receives 2 meaningfully different visual variants.
- Input and generated assets remain inside the managed data directory.
- An uploaded likeness requires per-attempt approval.
- One failed visual attempt cannot erase successful copy or other images.

### Chapter 5.2 — Review, approve, archive, and export

Adds:

```text
app/
  review/
    [runId]/
      page.tsx
  archive/
    page.tsx
  components/
    PackageReview.tsx
    RevisionControls.tsx
  api/
    runs/
      [runId]/
        review/
          route.ts
        archive/
          route.ts
        export/
          route.ts

server/
  schemas/
    review.ts
    archive.ts
    export.ts
  workflow/
    review-packages.ts
    archive-package.ts
    export-run.ts

tests/
  review.test.ts
  archive.test.ts
  export.test.ts
```

Behavior:

- One screen presents copy, both visuals, sources, edits, and approval state for
  each package.
- The learner can request revision, choose one visual, and approve explicitly.
- Only approved packages create immutable archive snapshots.
- Export contains final copy, the selected image, source notes, and a suggested
  publishing date.
- Nothing is scheduled or published automatically.

### Chapter 6.1 — Test and recover a failed phase

Adds:

```text
app/
  workflow/
    RecoveryPanel.tsx
  api/
    runs/
      [runId]/
        rerun/
          route.ts

server/
  workflow/
    derive-phase-state.ts
    rerun-phase.ts
    cost-awareness.ts

tests/
  phase-state.test.ts
  stale-dependencies.test.ts
  rerun-phase.test.ts
  partial-failure.test.ts
  cost-awareness.test.ts
```

Behavior:

- Interface state is derived from the run manifest, validated artifacts, input
  references, and attempts.
- Rerunning a phase creates a new revision and never overwrites the active
  artifact.
- Activating a new upstream revision marks mismatched downstream work stale.
- Failed reruns preserve the last usable revision.
- The learner sees an estimated cost range before starting a run and before
  visual generation; the application does not impose a mandatory spending
  ceiling.
- Duplicate submissions and expensive reruns require an intentional learner
  action.
- Missing-key, network, invalid-output, and partial-generation failures show a
  bounded recovery path.

### Chapter 6.2 — Complete graduation

Adds:

```text
scripts/
  verify-graduation.ts

tests/
  graduation-bundle.test.ts
```

Behavior:

- The verification script validates the selected run, active artifacts,
  approval archive, export manifest, and required evidence bundle.
- The learner completes one end-to-end run using real inputs and real API
  requests.
- Mock or fixture output is rejected as graduation evidence.
- The learner records one failure or revision they handled and one known
  limitation.

## Milestone verification matrix

Every milestone requires both automated proof and a learner-observed behavior.
An automated check cannot replace reviewing real generated content.

| Milestone | Automated proof | Manual proof |
|---|---|---|
| Initial starter | `npm run check` | Open all initial routes; confirm honest empty states and no key requirement |
| Module 1 | `npm run check` | Verify the primary action at desktop and narrow mobile widths; review the diff |
| Chapter 2.1 | Brand schema, route, revision, and reload tests | Save, reload, edit, and confirm a new brand revision |
| Chapter 2.2 | Voice schema and failed-response preservation tests | Run real analysis, trace one observation to a submitted example, and inspect the saved profile |
| Chapter 3.1 | Run snapshot, evidence schema, capture requirement, citation, and route tests | Open multiple sources and confirm text or visual proof survives reload |
| Chapter 3.2 | Source exclusion, freshness, confidence, 3–5 count, `needs_more_research`, and traceability tests | Exclude one weak source and explain the evidence and confidence behind one retained pattern |
| Chapter 4.1 | Exact-count, uniqueness, traceability, and selection tests | Compare 10 ideas and intentionally select 5 |
| Chapter 4.2 | Five-package, payload, reference, and edit-persistence tests | Edit one package, reload, and inspect the saved change |
| Chapter 5.1 | Asset path, consent, exact-count, and partial-failure tests | Compare 2 variants per package and revise one failed brief |
| Chapter 5.2 | Approval, immutable archive, reopen, and export tests | Revise one package, approve 5, reopen the archive, and inspect the export |
| Chapter 6.1 | Derived-state, stale, rerun, failure, and cost-awareness tests | Trigger one bounded failure and recover without losing accepted work |
| Chapter 6.2 | `npm run check` plus graduation-bundle validation | Complete and review one real onboarding-to-export run |

## Graduation repository surface

The final tree shows the expected responsibilities. Framework-generated cache
folders and runtime files are omitted.

```text
contentpilot/
  AGENTS.md
  README.md
  .env.example
  .gitignore
  package.json
  package-lock.json
  tsconfig.json
  next-env.d.ts
  next.config.ts
  eslint.config.mjs
  vitest.config.ts

  app/
    layout.tsx
    page.tsx
    globals.css
    setup/
      page.tsx
      BrandSetupForm.tsx
      VoiceAnalysisPanel.tsx
    workflow/
      page.tsx
      [runId]/
        page.tsx
      RunWorkspace.tsx
      EvidencePanel.tsx
      SourceReviewPanel.tsx
      PatternsPanel.tsx
      IdeasPanel.tsx
      DraftsPanel.tsx
      VisualsPanel.tsx
      LikenessConsent.tsx
      RecoveryPanel.tsx
    review/
      page.tsx
      [runId]/
        page.tsx
    archive/
      page.tsx
    api/
      health/
        route.ts
      profiles/
        brand/
          route.ts
        voice/
          analyze/
            route.ts
      runs/
        route.ts
        [runId]/
          research/
            route.ts
          sources/
            route.ts
          patterns/
            route.ts
          ideas/
            route.ts
          selections/
            route.ts
          drafts/
            route.ts
          visuals/
            route.ts
          review/
            route.ts
          archive/
            route.ts
          export/
            route.ts
          rerun/
            route.ts

  components/
    AppShell.tsx
    EmptyState.tsx
    PackageReview.tsx
    RevisionControls.tsx

  server/
    config/
      env.ts
    openai/
      client.ts
    schemas/
      shared.ts
      brand-profile.ts
      voice-profile.ts
      run.ts
      attempt.ts
      artifact-envelope.ts
      evidence.ts
      patterns.ts
      ideas.ts
      drafts.ts
      visuals.ts
      review.ts
      archive.ts
      export.ts
    storage/
      paths.ts
      atomic-json.ts
      profile-store.ts
      run-store.ts
      artifact-store.ts
      asset-store.ts
    workflow/
      analyze-voice.ts
      research.ts
      extract-patterns.ts
      generate-ideas.ts
      generate-drafts.ts
      generate-visuals.ts
      review-packages.ts
      archive-package.ts
      export-run.ts
      derive-phase-state.ts
      rerun-phase.ts
      cost-awareness.ts

  samples/
    sample-brand.json

  data/
    .gitkeep

  scripts/
    verify-graduation.ts

  tests/
    health.test.ts
    atomic-json.test.ts
    brand-profile.test.ts
    brand-profile-route.test.ts
    voice-profile.test.ts
    voice-analysis-route.test.ts
    run-store.test.ts
    evidence.test.ts
    research-route.test.ts
    source-review.test.ts
    patterns.test.ts
    patterns-route.test.ts
    ideas.test.ts
    idea-selection.test.ts
    ideas-route.test.ts
    drafts.test.ts
    drafts-route.test.ts
    asset-store.test.ts
    likeness-consent.test.ts
    visuals.test.ts
    visuals-route.test.ts
    review.test.ts
    archive.test.ts
    export.test.ts
    phase-state.test.ts
    stale-dependencies.test.ts
    rerun-phase.test.ts
    partial-failure.test.ts
    cost-awareness.test.ts
    graduation-bundle.test.ts
```

Runtime data follows the exact tree in the artifact and run-state contract:

```text
data/
  profiles/
    index.json
    brand/
    voice/
  runs/
    <run-id>/
      run.json
      inputs/
      attempts/
      artifacts/
      assets/
      archive/
      export/
```

## Graduation acceptance

The repository is graduation-ready only when:

1. `npm run check` passes from a clean installation.
2. The application starts without requiring mock data.
3. Secrets remain server-side and runtime content remains uncommitted.
4. One real run contains immutable brand and voice snapshots.
5. Accepted evidence supports every retained pattern.
6. The active ideas artifact contains 10 distinct ideas and 5 explicit
   selections.
7. The drafts artifact contains 5 editable packages.
8. Every package has 2 stored visual variants.
9. All 5 packages are manually reviewed and approved.
10. Approved archives reopen and the export bundle validates.
11. A failed or rejected phase can rerun without destroying unrelated accepted
    work.
12. The learner can explain one decision, one revision, and one remaining
    limitation using their own evidence.

Passing also requires every evidence gate and mastery condition in
[Graduation assessment v1](./graduation-assessment-v1.md). Repository readiness
alone does not award graduation.

## Decisions deliberately left for later branches

This contract does not yet lock:

- final API model defaults,
- the standalone learner repository name and visibility, or
- the long-term synchronization mechanism between the course source and learner
  template.

Those decisions can change without altering the initial-versus-graduation
boundary defined here.
