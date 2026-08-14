# ContentPilot Artifact Schema and Run-State Contract v1

> **Superseded for the runnable course.** This ContentPilot state contract
> remains historical planning evidence and is not the contract for portfolio
> learner artifacts. See
> [Portfolio Course v1](./portfolio-course-v1/README.md).

**Status:** Locked planning contract  
**Decision:** Versioned artifacts with one active-run manifest  
**Schema version:** `1.0.0`  
**Storage:** Local JSON and local asset files  
**Applies to:** The Version A learner starter and graduation application

## Purpose

This contract defines:

- reusable brand and voice profiles,
- immutable input snapshots for each weekly run,
- versioned phase artifacts,
- the one manifest that selects active revisions,
- attempt and failure records,
- derived interface states,
- rerun and downstream-invalidation behavior,
- review, approval, archive, and export records,
- validation and atomic-write requirements.

The contract is intentionally direct. It does not introduce a database, event
sourcing, authentication, cloud storage, the Agents SDK, or background
automation.

## Core decision

ContentPilot must let a learner rerun an earlier phase without overwriting the
currently accepted work.

Each successful attempt therefore writes a new immutable artifact revision. The
learner accepts a revision by updating its pointer in `run.json`. Downstream
artifacts record the exact upstream revisions they used and become `stale` when
those references no longer match.

## Invariants

1. `run.json` is the only authority for active artifact revisions.
2. Generated artifact files are immutable after they pass validation.
3. A rerun never overwrites the active artifact.
4. A failed rerun never removes the last usable artifact.
5. Every artifact records the exact input snapshots and upstream artifacts used
   to create it.
6. Interface phase state is derived; it is not stored as a second status field.
7. Brand and voice profiles are reusable and versioned outside weekly runs.
8. A run receives immutable copies of the active brand and voice profiles.
9. Refreshing a reusable profile affects only new runs.
10. Approved archive files are immutable.
11. Model output cannot become an artifact until it passes its Zod schema.
12. Every JSON write is validated and replaced atomically.
13. Every stored asset path is relative to the ContentPilot data directory.
14. API keys and other secrets are never stored in an artifact.

## Directory layout

```text
data/
  profiles/
    index.json
    brand/
      001.json
      002.json
    voice/
      001.json
      002.json

  runs/
    <run-id>/
      run.json

      inputs/
        brand.json
        voice.json

      attempts/
        research/
          001.json
          002.json
        patterns/
          001.json
        ideas/
          001.json
        drafts/
          001.json
        visuals/
          001.json
        review/
          001.json

      artifacts/
        evidence/
          001.json
          002.json
        patterns/
          001.json
        ideas/
          001.json
        drafts/
          001.json
        visuals/
          001.json
        review/
          001.json

      assets/
        inputs/
        generated/

      archive/
        <package-id>/
          <approval-id>/
            package.json
            final-copy.md
            source-notes.md
            selected-image.<ext>

      export/
        <export-id>/
          manifest.json
          content/
          images/
```

## Naming and primitive rules

| Concept | Rule |
|---|---|
| Schema version | Exact semantic version string, initially `1.0.0` |
| IDs | Server-generated lowercase identifiers with a semantic prefix |
| Revisions | Positive integers represented in paths with three digits |
| Timestamps | UTC ISO 8601 strings |
| Dates | `YYYY-MM-DD` |
| Paths | Relative POSIX-style paths under `data/`; no `..` segments |
| URLs | Valid `http` or `https` URLs |
| Hashes | Lowercase SHA-256 hexadecimal strings |
| Optional text | Omitted or `null`; never an unexplained empty string |
| Learner-facing text | Vietnamese by default |

Recommended ID prefixes:

```text
brand-
voice-
run-
attempt-
evidence-
pattern-
idea-
package-
visual-
review-
approval-
export-
```

## Shared reference types

```ts
type SchemaVersion = "1.0.0";

type ArtifactType =
  | "evidence"
  | "patterns"
  | "ideas"
  | "drafts"
  | "visuals"
  | "review";

type PhaseId =
  | "research"
  | "patterns"
  | "ideas"
  | "drafts"
  | "visuals"
  | "review";

type ArtifactRef = {
  artifactId: string;
  artifactType: ArtifactType;
  revision: number;
  path: string;
  sha256: string;
};

type ProfileRef = {
  profileId: string;
  revision: number;
  path: string;
  sha256: string;
};

type InputSnapshotRef = {
  sourceProfile: ProfileRef;
  snapshotPath: string;
  snapshotSha256: string;
};
```

## Profile index

`data/profiles/index.json` is the only authority for the profile revisions used
when a new run is created.

```ts
type ProfileIndex = {
  schemaVersion: SchemaVersion;
  updatedAt: string;
  activeBrand: ProfileRef | null;
  activeVoice: ProfileRef | null;
};
```

Rules:

- A new profile revision is written and validated before the index changes.
- Updating the index does not alter an existing run.
- A run cannot start without both an active brand and an active voice profile.

## Brand profile schema

```ts
type PrimaryPlatform =
  | "facebook"
  | "instagram"
  | "linkedin"
  | "tiktok"
  | "youtube"
  | "other";

type Cadence =
  | "weekly"
  | "biweekly"
  | "monthly"
  | "custom";

type BrandProfile = {
  schemaVersion: SchemaVersion;
  profileId: string;
  revision: number;
  createdAt: string;
  data: {
    brandName: string;
    nicheKeywords: string[];
    audienceSummary: string;
    primaryPlatform: PrimaryPlatform;
    otherPlatform: string | null;
    cadence: Cadence;
    customCadence: string | null;
    knownCompetitors: string[];
    brandNotes: string[];
    visualPreferences: {
      styleNotes: string[];
      defaultMode: "illustration_only" | "brand_assets";
      reusableAssetPaths: string[];
    };
  };
};
```

Validation:

- `brandName`, `audienceSummary`, and every niche keyword are non-empty.
- `nicheKeywords` contains at least one unique value.
- `otherPlatform` is required only when `primaryPlatform` is `other`.
- `customCadence` is required only when `cadence` is `custom`.
- Competitor names are optional and deduplicated case-insensitively.
- Reusable asset paths must exist under `data/profiles/` or the app-managed
  asset directory.
- This profile does not grant permission to use a learner's likeness.

## Voice profile schema

```ts
type VoiceExample = {
  exampleId: string;
  text: string;
  sourceUrl: string | null;
  evidencePath: string | null;
  capturedAt: string;
};

type VoiceEvidenceRef = {
  exampleId: string;
  observation: string;
  supportingExcerpt: string;
};

type VoiceProfile = {
  schemaVersion: SchemaVersion;
  profileId: string;
  revision: number;
  createdAt: string;
  model: string;
  sourceExamples: VoiceExample[];
  analysis: {
    summary: string;
    toneTraits: string[];
    vocabularyPatterns: string[];
    hookPatterns: string[];
    structurePatterns: string[];
    formattingHabits: string[];
    doGuidance: string[];
    avoidGuidance: string[];
    evidence: VoiceEvidenceRef[];
  };
};
```

Validation:

- At least five distinct examples are required.
- Every example contains non-empty text.
- Duplicate examples are rejected by normalized-text hash.
- Every analysis observation links to an existing example.
- Every `supportingExcerpt` must occur in the referenced example.
- Every analysis list contains at least one item.
- A malformed API response cannot replace the active profile.

## Run manifest schema

`run.json` contains identity, immutable input-snapshot references, and active
artifact pointers. It does not contain a manually updated workflow status.

```ts
type ActiveArtifacts = {
  evidence: ArtifactRef | null;
  patterns: ArtifactRef | null;
  ideas: ArtifactRef | null;
  drafts: ArtifactRef | null;
  visuals: ArtifactRef | null;
  review: ArtifactRef | null;
};

type RunManifest = {
  schemaVersion: SchemaVersion;
  runId: string;
  title: string;
  weekOf: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  inputs: {
    brand: InputSnapshotRef;
    voice: InputSnapshotRef;
  };
  activeArtifacts: ActiveArtifacts;
};
```

Rules:

- `runId` matches the containing directory.
- Input snapshot files and hashes must resolve before the manifest is accepted.
- Input snapshots never change after run creation.
- `archivedAt` makes the run read-only.
- An active pointer can reference only a valid artifact inside the same run.
- Updating an active pointer uses atomic manifest replacement.
- There is no `run.status` field.

## Artifact envelope

Every generated phase artifact uses the same immutable envelope.

```ts
type ArtifactEnvelope<T> = {
  schemaVersion: SchemaVersion;
  artifactId: string;
  artifactType: ArtifactType;
  runId: string;
  revision: number;
  createdAt: string;
  createdBy: "learner" | "openai" | "system";
  inputRefs: {
    brandSnapshotSha256: string;
    voiceSnapshotSha256: string;
    upstreamArtifacts: ArtifactRef[];
  };
  data: T;
};
```

Rules:

- `artifactType`, ID prefix, path folder, and payload schema must agree.
- Artifact revisions increase monotonically within one artifact type and run.
- An artifact file is never edited after successful validation.
- Every artifact write, including a learner edit or source-review decision,
  receives an attempt record.
- A candidate is **accepted** when its exact `ArtifactRef` appears in
  `run.json.activeArtifacts`.
- A candidate is **pending review** when it comes from a successful attempt but
  is not active or rejected.
- A candidate is **rejected** when its attempt contains a rejection decision.

## Attempt schema

Attempt records describe execution, failure, and the candidate artifact. They do
not decide which artifact is active.

```ts
type AttemptState = "running" | "succeeded" | "failed";

type AttemptError = {
  code:
    | "missing_api_key"
    | "network_error"
    | "rate_limited"
    | "invalid_model_output"
    | "schema_validation_failed"
    | "insufficient_evidence"
    | "asset_error"
    | "storage_error"
    | "cancelled"
    | "unknown";
  message: string;
  retryable: boolean;
};

type Attempt = {
  schemaVersion: SchemaVersion;
  attemptId: string;
  runId: string;
  phase: PhaseId;
  sequence: number;
  state: AttemptState;
  startedAt: string;
  finishedAt: string | null;
  inputRefs: {
    brandSnapshotSha256: string;
    voiceSnapshotSha256: string;
    upstreamArtifacts: ArtifactRef[];
  };
  candidateArtifact: ArtifactRef | null;
  error: AttemptError | null;
  rejection: {
    rejectedAt: string;
    note: string;
  } | null;
  usage: {
    inputTokens: number | null;
    outputTokens: number | null;
    generatedImageCount: number | null;
  };
};
```

Validation:

- `running` requires `finishedAt`, `candidateArtifact`, and `error` to be `null`.
- `succeeded` requires `finishedAt` and `candidateArtifact`; `error` is `null`.
- `failed` requires `finishedAt` and `error`; `candidateArtifact` is `null`.
- Only a succeeded, inactive candidate can receive a rejection record.
- Acceptance is inferred from the active manifest pointer, not duplicated here.
- Attempt writes use atomic replacement when moving from `running` to a terminal
  state.

## Evidence artifact

```ts
type EvidenceDecision =
  | "pending"
  | "accepted"
  | "rejected"
  | "unverifiable";

type ClaimBasis = "text" | "visual" | "mixed";

type EvidenceItem = {
  evidenceId: string;
  sourceUrl: string;
  title: string;
  sourceType: "competitor_example" | "supporting_research";
  platform: PrimaryPlatform | "web";
  creatorOrPublisher: string | null;
  publishedAt: string | null;
  capturedAt: string;
  claim: string;
  claimBasis: ClaimBasis;
  evidenceNote: string;
  capturedExcerpt: string | null;
  evidencePath: string | null;
  freshnessReason: string | null;
  confidence: "high" | "medium" | "low";
  decision: EvidenceDecision;
  decisionReason: string | null;
};

type EvidenceData = {
  researchQuestion: string;
  items: EvidenceItem[];
};
```

Validation for an active evidence artifact:

- At least one item is accepted.
- No item remains `pending`.
- Accepted items require a source URL, creator or publisher, capture time, claim,
  evidence note, and confidence.
- A `text` claim requires a short `capturedExcerpt` containing only the passage
  needed to inspect the claim.
- A `visual` claim requires `evidencePath` to point to a local screenshot or
  equivalent visual capture.
- A `mixed` claim requires both a short excerpt and a local visual capture.
- Rejected and unverifiable items require a decision reason.
- If the original source becomes inaccessible and its required excerpt or
  visual capture is missing, a new evidence revision marks the item
  `unverifiable`.
- Unverifiable evidence cannot remain accepted merely because an older evidence
  revision accepted it.
- Full-page copies are not required or stored as evidence.
- Research prioritizes sources published within the 12 months before
  `capturedAt`.
- A publication date in the future is invalid.
- An item with no publication date or a date more than 12 months before
  `capturedAt` may remain accepted only when `freshnessReason` explains why it
  is still relevant. Its confidence cannot be `high`.
- URLs are unique after normalization.
- `competitor_example` and `supporting_research` remain distinct.
- A `competitor_example` must link to inspectable content attributable directly
  to the competitor, such as its post, video, advertisement, landing page, or
  official profile. An article that merely describes that content is
  `supporting_research`.
- An accepted `competitor_example` requires `creatorOrPublisher` so pattern
  validation can distinguish examples from the same competitor from examples
  across competitors.
- `supporting_research` may help discover competitors, frame industry context,
  or suggest a claim to investigate. It cannot independently validate a claim
  about a named competitor's behavior.

The initial research candidate may contain `pending` decisions. Saving learner
source decisions creates a new evidence revision. Only a fully reviewed
revision can become active.

## Patterns artifact

```ts
type PatternItem = {
  patternId: string;
  name: string;
  scope: "single_competitor" | "cross_competitor";
  competitors: string[];
  observation: string;
  evidenceIds: string[];
  whyItMayWork: string;
  brandAdaptation: string;
  antiCopyRules: string[];
  confidence: "high" | "medium";
  confidenceReason: string;
};

type PatternsData = {
  patterns: PatternItem[];
};
```

Validation:

- A valid patterns artifact contains 3–5 retained patterns.
- Every pattern references at least one accepted evidence item.
- Rejected and unverifiable evidence IDs are forbidden.
- A `single_competitor` pattern names exactly one competitor and references at
  least two accepted, distinct `competitor_example` items attributable to that
  competitor.
- A `cross_competitor` pattern names at least two competitors and references at
  least one accepted, distinct `competitor_example` item attributable to each
  named competitor.
- Competitor names are trimmed and compared case-insensitively against
  `creatorOrPublisher`; duplicate normalized names count once.
- Distinct examples require different normalized source URLs. Duplicate links
  or repeated captures of the same content count once.
- Accepted `supporting_research` may add context but never counts toward either
  direct-example minimum.
- One direct example remains an observation in the evidence artifact; it cannot
  become a retained `PatternItem`.
- A `high`-confidence pattern uses only threshold-counted direct examples
  published within the 12-month freshness window.
- A threshold-qualified pattern that relies on an older or undated direct
  example is `medium` confidence and requires a learner-visible
  `confidenceReason`.
- Every retained pattern gives a concise, learner-visible `confidenceReason`.
- Low-confidence findings remain observations in the evidence artifact and
  cannot become retained patterns.
- `antiCopyRules` contains at least one concrete prohibition.
- Names are unique within the artifact.

If extraction produces fewer than 3 threshold-qualified patterns, the server
does not write a candidate patterns artifact. It records a failed patterns
attempt with `error.code = "insufficient_evidence"`. The interface derives
`needs_more_research` rather than presenting weak patterns or a generic API
failure.

## Ideas artifact

```ts
type Score = {
  value: 1 | 2 | 3 | 4 | 5;
  reason: string;
};

type IdeaItem = {
  ideaId: string;
  workingTitle: string;
  angle: string;
  targetAudience: string;
  patternIds: string[];
  evidenceIds: string[];
  scores: {
    platformFit: Score;
    voiceFit: Score;
    evidenceSupport: Score;
    variety: Score;
  };
  selectedForDrafting: boolean;
  selectionReason: string | null;
};

type IdeasData = {
  ideas: IdeaItem[];
};
```

Validation for an active ideas artifact:

- Exactly 10 ideas are present.
- Exactly 5 ideas are selected.
- Every idea references at least one active pattern and accepted evidence item.
- Selected ideas require a selection reason.
- Titles and angles are distinct after normalization.

## Drafts artifact

```ts
type DraftPackage = {
  packageId: string;
  ideaId: string;
  primaryPost: string;
  alternateHook: string;
  cta: string;
  optionalShortVideoScript: string | null;
  evidenceIds: string[];
  sourceNotes: string[];
  revisionNote: string | null;
};

type DraftsData = {
  packages: DraftPackage[];
};
```

Validation:

- Exactly 5 packages are present.
- Each package maps to one of the 5 selected ideas.
- Every selected idea appears exactly once.
- Primary post, alternate hook, CTA, and source notes are non-empty.
- Evidence IDs refer only to accepted evidence.
- The optional script is either non-empty or `null`.

## Visuals artifact

```ts
type LikenessUse =
  | { mode: "none" }
  | {
      mode: "approved_source";
      sourceAssetPath: string;
      approvedAt: string;
    };

type VisualVariant = {
  visualId: string;
  label: "A" | "B";
  assetPath: string;
  prompt: string;
  composition: string;
  format: string;
  visualConcept: string;
  sourceAssetPaths: string[];
  likenessUse: LikenessUse;
  generatedAt: string;
};

type PackageVisuals = {
  packageId: string;
  variants: [VisualVariant, VisualVariant];
};

type VisualsData = {
  packages: PackageVisuals[];
};
```

Validation:

- Exactly 5 package entries are present.
- Every draft package appears exactly once.
- Every package has exactly two variants labeled `A` and `B`.
- The variants must differ in composition, format, or visual concept.
- Asset paths must resolve inside the run.
- `approved_source` requires an existing source asset and explicit approval
  timestamp.
- A blanket profile-level likeness permission is forbidden.

## Review artifact

```ts
type ReviewStatus =
  | "needs_review"
  | "revision_requested"
  | "approved";

type ReviewedPackage = {
  packageId: string;
  finalCopy: {
    primaryPost: string;
    alternateHook: string;
    cta: string;
    optionalShortVideoScript: string | null;
  };
  selectedVisualId: string | null;
  sourceNotes: string[];
  suggestedPublishingDate: string | null;
  status: ReviewStatus;
  revisionRequest: string | null;
  approvedAt: string | null;
};

type ReviewData = {
  packages: ReviewedPackage[];
};
```

Validation:

- Exactly 5 packages are present.
- `selectedVisualId` must reference variant A or B for the same package.
- `revision_requested` requires a non-empty revision request and no approval
  timestamp.
- `approved` requires a selected visual and approval timestamp and forbids an
  unresolved revision request.
- An approved package cannot be edited in place; changes create a new review
  revision and require approval again.

## Archive package schema

Approval creates an immutable archive snapshot.

```ts
type ArchivedPackage = {
  schemaVersion: SchemaVersion;
  approvalId: string;
  runId: string;
  packageId: string;
  approvedAt: string;
  reviewArtifact: ArtifactRef;
  files: {
    finalCopy: string;
    sourceNotes: string;
    selectedImage: string;
  };
  sha256: {
    finalCopy: string;
    sourceNotes: string;
    selectedImage: string;
  };
};
```

Rules:

- Archive paths include `packageId` and `approvalId`.
- `package.json` is the archive manifest and does not contain a hash of itself.
- Existing archive files are never replaced.
- Reapproving a revised package creates a new approval directory.

## Export manifest schema

```ts
type ExportedPackage = {
  packageId: string;
  approvalId: string;
  finalCopyPath: string;
  selectedImagePath: string;
  sourceNotesPath: string;
  suggestedPublishingDate: string;
};

type ExportManifest = {
  schemaVersion: SchemaVersion;
  exportId: string;
  runId: string;
  generatedAt: string;
  reviewArtifact: ArtifactRef;
  packages: ExportedPackage[];
};
```

Validation:

- Export contains only approved packages.
- Graduation export requires exactly 5 packages.
- Every path resolves inside its export directory.
- The manifest and exported files are immutable after successful creation.

## Phase dependency contract

| Phase | Required inputs |
|---|---|
| Research | Brand input snapshot |
| Patterns | Brand snapshot, voice snapshot, active evidence |
| Ideas | Brand snapshot, voice snapshot, active evidence, active patterns |
| Drafts | Brand snapshot, voice snapshot, active evidence, active ideas |
| Visuals | Brand snapshot, active drafts, run-managed source assets and per-use likeness approval |
| Review | Active evidence, active drafts, active visuals |
| Export | Active review with approved packages |

Every artifact stores all listed inputs in `inputRefs`.

## Derived phase states

```ts
type PhaseState =
  | "blocked"
  | "not_started"
  | "running"
  | "needs_review"
  | "needs_revision"
  | "needs_more_research"
  | "ready"
  | "stale"
  | "failed";
```

The state is calculated in this order:

1. `running`: the latest attempt is currently running.
2. `stale`: an active artifact exists but its input references do not match the
   current run inputs and active upstream artifacts, or any required upstream
   phase is itself `stale`.
3. `needs_review`: the latest successful candidate is neither active nor
   rejected.
4. `ready`: an active artifact exists, validates, and has current input
   references.
5. `needs_more_research`: the patterns phase has no usable active artifact and
   its latest terminal attempt has `error.code = "insufficient_evidence"`.
6. `needs_revision`: no usable active artifact exists and the latest successful
   candidate was rejected.
7. `failed`: no usable active artifact exists and the latest terminal attempt
   failed.
8. `blocked`: one or more required upstream phases are not `ready`.
9. `not_started`: prerequisites are ready, but no attempt exists.

If a usable active artifact exists and a later experimental rerun fails or is
rejected, the phase remains `ready` and the UI shows a secondary notice about
the unsuccessful attempt.

## Transition table

| Current state | Learner/system action | Required condition | Persisted change | Result |
|---|---|---|---|---|
| `blocked` | Open phase | Upstream missing or stale | None | Explain the exact upstream requirement |
| `not_started` | Start | All dependencies `ready` | Create `running` attempt | `running` |
| `ready` | Rerun | Explicit learner action | Create new `running` attempt; preserve active pointer | `running` with usable fallback |
| `running` | Generation succeeds | Output passes Zod | Write immutable candidate; mark attempt succeeded | `needs_review` unless previous active remains displayed as fallback |
| `running` | Generation fails | Error captured | Mark attempt failed | `failed`, or `ready` with failure notice when fallback exists |
| `running` patterns | Fewer than 3 patterns qualify | Evidence and thresholds are recorded | Mark attempt failed with `insufficient_evidence`; write no artifact | `needs_more_research`, or `ready` with notice when a usable fallback exists |
| `needs_review` | Accept candidate | Candidate still validates against current inputs | Atomically update active pointer | `ready`; affected downstream phases derive `stale` |
| `needs_review` | Reject candidate | Learner supplies a note | Add rejection to attempt | `needs_revision`, or `ready` when fallback exists |
| `needs_revision` | Retry | Dependencies `ready` | Create new attempt | `running` |
| `needs_more_research` | Return to research | Fewer than 3 patterns qualify | Preserve attempts and evidence | Show the missing evidence needed before retry |
| `needs_more_research` | Retry patterns | Active evidence changed and dependencies are `ready` | Create new attempt | `running` |
| `stale` | Open phase | Upstream active reference changed | None | Show which upstream revision changed |
| `stale` | Rerun | Explicit learner action | Create attempt from current upstream refs | `running` |
| `ready` review | Approve package | Copy and visual selected; no open revision request | Write new review revision and immutable archive snapshot | Package `approved` |
| Any editable run | Archive run | All 5 packages approved and export succeeds | Set `archivedAt` atomically | Entire run becomes read-only |

## Rerun invalidation matrix

Changing an active pointer never deletes downstream files. It makes downstream
artifacts stale when their stored references no longer match.

| Active artifact changes | Artifacts that become stale |
|---|---|
| Evidence | Patterns, ideas, drafts, visuals, review, export |
| Patterns | Ideas, drafts, visuals, review, export |
| Ideas | Drafts, visuals, review, export |
| Drafts | Visuals, review, export |
| Visuals | Review, export |
| Review | Export; existing archives remain historical snapshots |

Staleness propagates transitively through the dependency graph. Approved archive
snapshots remain historically valid even when current run artifacts become
stale. They are not presented as the current output.

## Profile refresh rule

- Editing brand onboarding creates a new brand-profile revision.
- Rerunning voice analysis creates a new voice-profile revision.
- Existing runs retain their original input snapshots.
- To use refreshed profile data, the learner creates a new run or explicitly
  clones the old run into a new run ID.
- A run's input snapshots are never updated in place.

## Partial-failure rules

- One failed image attempt cannot delete successful images or copy.
- A batch phase may write an artifact only when the complete artifact passes
  validation.
- If partial model output is useful for diagnosis, store it only inside the
  failed attempt record or a diagnostic file, never as an active artifact.
- The UI shows the last usable active revision alongside a failed-rerun notice.
- Retry starts from the same explicit inputs unless the learner changes the
  brief and starts another attempt.

## Validation and write sequence

Every server write follows:

1. Validate the request.
2. Resolve and validate all input references.
3. Produce or update the in-memory object.
4. Validate the complete object with Zod.
5. Write to a temporary file in the target directory.
6. Flush and close the temporary file.
7. Rename the temporary file to the final path.
8. Read the final file and validate it again.
9. Only then update an active pointer or return success.

If any step fails, the previous manifest and active artifacts remain unchanged.

## Schema evolution

- Every profile, manifest, attempt, artifact, archive, and export file carries a
  schema version.
- Version `1.0.0` readers reject unsupported major versions with a clear
  recovery message.
- Minor additive fields may be accepted only when the corresponding Zod schema
  explicitly allows them.
- Migrations must create a new file or backup before replacing old data.
- The beginner course does not teach a general migration framework.

## Security and consent rules

- API keys remain in server-side environment configuration.
- No artifact contains cookies, access tokens, or credentials.
- Paths cannot escape the app-managed data directory.
- Uploaded files are copied into app-managed storage with generated filenames.
- A likeness can be used only when the specific visual attempt records its
  approved source and approval timestamp.
- Approval to use a likeness is per attempt, not a permanent profile setting.
- Nothing in this contract schedules or publishes content automatically.

## Teaching sequence

The learner does not need to understand the full revision model in the initial
starter repository:

- Module 2 introduces version `001` brand and voice profiles.
- Module 3 introduces the run manifest, first active artifact references, and
  evidence and pattern envelopes through a concrete research run.
- Module 4 makes active-revision choice explicit when ideas and drafts are
  reviewed.
- Module 5 introduces review, approval, archive, and export records.
- Module 6 introduces reruns, stale dependencies, attempt failures, and recovery.

The initial starter contains only generic storage primitives. Every domain
feature follows the complete contract when it is introduced, so the learner
never builds a disposable simplified model that must later be replaced. The
curriculum reveals each rule when the learner encounters the problem it solves.

The exact initial repository, chapter additions, and graduation tree are fixed
in:

- [Starter repository progression v1](./starter-repository-progression-v1.md)

## Acceptance checklist for this planning branch

- Reusable profiles are separate from weekly runs.
- Existing runs are reproducible after a profile refresh.
- Every phase has an exact payload schema.
- Active revisions have one source of truth.
- Interface state is derived.
- Failed reruns preserve usable work.
- Downstream staleness is deterministic.
- Human review and approval remain explicit.
- Likeness consent is per attempt.
- Archive and export outputs are immutable.
- Accepted research preserves the required text or visual capture.
- Retained patterns satisfy source role, independence, freshness, confidence,
  and 3–5 quantity rules.
- Insufficient qualifying evidence derives `needs_more_research`.
- The design remains local JSON + Zod and does not require advanced
  infrastructure.

## Cost-awareness and recovery policy

- The learner sees a clearly labeled estimated cost range before starting a run
  and before visual generation.
- Estimates disclose their assumptions and are not presented as exact charges.
- The beginner workflow does not impose a mandatory spending ceiling.
- Duplicate submissions and expensive reruns require intentional confirmation.
- A stopped or failed operation cannot replace a valid active artifact.
- Optional learner-configured limits belong to advanced material.

## Next planning decision

Graduation evidence and scoring are defined in:

- [Graduation assessment v1](./graduation-assessment-v1.md)

The next decision packet chooses the learner starter's implementation location,
distribution path, standalone-repository timing, and first validated package
and API model versions.
