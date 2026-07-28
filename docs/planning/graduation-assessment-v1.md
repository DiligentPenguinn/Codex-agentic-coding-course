# ContentPilot Graduation Assessment v1

**Status:** Locked assessment contract  
**Decision:** Evidence-gated portfolio defense  
**Applies to:** Version A Module 6 and the graduation application  
**Primary language:** Vietnamese for learner-facing assessment

## Purpose

Graduation proves that the learner can use Codex to build, inspect, and operate
a real content workflow. It does not reward a polished demonstration that hides
missing data, mock output, unsafe key handling, unsupported claims, or weak
learner judgment.

The assessment combines:

1. non-negotiable evidence gates,
2. a human-reviewed mastery rubric,
3. a short learner defense, and
4. targeted resubmission when only part of the submission is weak.

Related source-of-truth contracts:

- [Version A curriculum blueprint](./version-a-curriculum-blueprint.md)
- [Artifact schema and run-state contract v1](./artifact-schema-and-run-state-v1.md)
- [Starter repository progression v1](./starter-repository-progression-v1.md)

## Assessment principles

- Real API provenance is mandatory; mock or fixture output cannot graduate.
- Automated checks prove structure, counts, references, and safety boundaries.
- Human review judges usefulness, evidence reasoning, voice, visuals, and
  learner ownership.
- A high rubric score cannot compensate for a failed evidence gate.
- Generated content is not accepted merely because its schema is valid.
- Learners may repair the failed part of a submission without repeating valid
  work.
- The Teacher asks defense questions one at a time and requires learner-owned
  examples.

## Required graduation bundle

The learner submits one bundle tied to one selected graduation run:

```text
graduation/
  submission.json
  verification/
    check-output.txt
    graduation-verification.json
  reflection/
    learner-defense.md
```

The submission references, rather than duplicates:

- the real brand and voice input snapshots,
- the run manifest and attempt records,
- active evidence, patterns, ideas, drafts, and visuals,
- the immutable approval archive,
- the validated export manifest and exported files, and
- the revision or recovery example discussed by the learner.

`submission.json` records the selected run ID, submission timestamp, learner
attestation, referenced artifact revisions, verification result, and assessment
version. It contains no API key, access token, cookie, or hidden system prompt.

## Non-negotiable evidence gates

Every gate must pass.

| Gate | Required proof | Verification owner |
|---|---|---|
| G1. Real workflow | Attempt metadata contains real Responses API identifiers, model metadata, timestamps, and usage when returned; the selected artifacts are not marked mock or fixture | Automated |
| G2. Safe repository | `npm run check` passes from a clean installation; secrets and runtime content are not committed or exposed to client code | Automated plus reviewer |
| G3. Real inputs | The run references learner-owned or authorized brand material, at least five distinct writing examples, a niche, audience, platform, and cadence | Automated plus reviewer |
| G4. Traceable evidence | Every retained pattern satisfies the locked source-role, capture, freshness, confidence, and independence rules | Automated plus reviewer |
| G5. Complete idea set | The active ideas revision contains 10 distinct ideas and exactly 5 intentional selections | Automated |
| G6. Complete drafts | The selected run contains 5 editable packages; each has a primary post, alternate hook, CTA, and its required references | Automated plus reviewer |
| G7. Complete visuals | Every package contains 2 stored visual variants; likeness use, when present, has attempt-specific consent | Automated plus reviewer |
| G8. Human review | All 5 packages have a recorded learner review decision and are approved only after review | Automated |
| G9. Durable output | The immutable archive reopens and the export bundle contains final copy, selected image, source notes, and suggested date for every package | Automated plus reviewer |
| G10. Recovery evidence | One failed, rejected, or deliberately revised phase demonstrates a bounded rerun without destroying unrelated accepted work | Automated plus learner defense |
| G11. Learner ownership | The learner explains one consequential decision, one revision or recovery, and one remaining limitation using evidence from the submitted run | Reviewer |
| G12. Integrity | The submission does not copy competitor wording or layouts, misrepresent sources, conceal mock output, or use unapproved likeness material | Reviewer |

The verification script reports each gate separately. It never reduces the
gates to one opaque pass/fail message.

## Human-reviewed mastery rubric

Each dimension receives one score:

- **4 — Strong:** clear, well-supported judgment that improves the result.
- **3 — Meets:** correct, usable, and supported at graduation level.
- **2 — Developing:** partially effective but has a bounded weakness.
- **1 — Insufficient:** major weakness, unsupported decision, or unusable result.

| Dimension | What the reviewer judges |
|---|---|
| R1. Audience and platform fit | The batch addresses the saved audience, business goal, primary platform, and cadence rather than producing generic content |
| R2. Evidence and anti-copy reasoning | Claims are supported, patterns are derived transparently, uncertainty is handled, and competitor expression is not copied |
| R3. Voice and copy usefulness | The five packages reflect the submitted voice evidence, differ meaningfully, and are realistically review-ready |
| R4. Visual judgment and consent | Visual choices support each package, variants are meaningfully different, and source or likeness permissions are respected |
| R5. Review and revision quality | The learner identifies weaknesses, makes a consequential revision, and explains why the approved result is better |
| R6. Technical ownership and recovery | The learner can trace artifacts, interpret checks and failures, protect secrets, and explain the bounded recovery path |

## Passing rule

A submission passes only when:

1. all 12 evidence gates pass,
2. the rubric total is at least **18 of 24**,
3. no rubric dimension scores below **2**,
4. R2 Evidence and anti-copy reasoning scores at least **3**,
5. R6 Technical ownership and recovery scores at least **3**, and
6. the learner completes the defense in their own words.

This allows one bounded developing area while preventing strong presentation
from masking weak evidence or unsafe technical ownership.

## Learner defense

The Teacher asks one question at a time. The defense covers:

1. Which product or audience decision most shaped the final batch?
2. Which evidence changed or rejected an initial idea?
3. What did the learner revise or recover, and what improved?
4. What limitation remains, and what would the learner change next?

Each answer must reference the learner's own run, package, source, artifact, or
verification result. Repeating course language without a concrete example does
not satisfy G11.

## Targeted resubmission

The assessor returns:

- failed gate IDs,
- rubric dimensions below the passing rule,
- evidence supporting each judgment, and
- the smallest acceptable resubmission scope.

Resubmission follows these rules:

- A structural or verification failure requires the affected artifact,
  repository check, or export to be repaired and reverified.
- A content-quality weakness requires only the affected packages and their
  dependent archive/export revisions to be resubmitted.
- Missing real-API provenance requires a new real attempt for the affected
  phase; fabricated metadata is an integrity failure.
- Weak learner ownership requires a new defense using the existing valid run
  unless the underlying evidence is also invalid.
- The learner repeats the complete workflow only when the selected run's
  provenance or dependency chain is fundamentally invalid.

Previously valid immutable artifacts remain valid unless the repaired input
makes them stale under the artifact contract.

## Assessor output

The assessment result records:

```text
assessment version
selected run ID
gate results with evidence
six rubric scores with evidence
total score
pass or targeted-resubmission result
required resubmission scope
reviewer notes
assessment timestamp
```

The result is saved separately from the learner's immutable run and archive. An
assessment never rewrites generated artifacts or approval history.

## Completion definition

The learner graduates only after the latest assessment result passes. The
course may celebrate rubric strengths, but it must state failed gates and
required resubmission plainly when the submission does not yet pass.
