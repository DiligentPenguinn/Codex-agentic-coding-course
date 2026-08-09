# Agentic Coding Graduation Assessment v1 — ContentPilot Evidence Project

**Status:** Locked assessment contract  
**Decision:** Evidence-gated portfolio defense  
**Applies to:** Version A Module 6 and the graduation application  
**Primary language:** Vietnamese for learner-facing assessment

## Purpose

Graduation proves that the learner can direct a coding agent through a real,
multi-step software project: frame the problem, preserve context, specify and
approve work, use tools safely, inspect evidence, recover from failure, and
defend the result. ContentPilot supplies the project evidence; completing its
feature checklist alone does not prove agentic-coding mastery.

The assessment combines:

1. non-negotiable evidence gates,
2. a human-reviewed agentic-coding mastery rubric,
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
- Product completeness is necessary practice evidence, but transferable
  agentic-coding skill remains the primary learning outcome.
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
| G11. Learner ownership | The learner explains one consequential decision, one revision or recovery, one remaining limitation, and how the same reasoning transfers to another software task | Reviewer |
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
| R1. Problem framing and scope | The learner names the real user problem, observable outcome, allowed scope, constraints, non-goals, and decisions that stay with the human |
| R2. Context, specification, and plan | The learner separates durable from task-specific context, defines inspectable output contracts, and reviews files, operations, risks, and verification before execution |
| R3. Tool, source, and safety judgment | The learner chooses tools deliberately, handles source quality and uncertainty, protects secrets and consent, and pauses at network, destructive, costly, or external-action boundaries |
| R4. Evidence review and recovery | The learner traces fresh artifacts, diffs, checks, logs, and interface behavior; rejects unsupported completion claims; and performs a bounded recovery without losing valid work |
| R5. Product usefulness and human judgment | The final ContentPilot batch fits the saved audience and platform, uses evidence without copying, preserves learner edits, and is genuinely review-ready |
| R6. Transfer and technical ownership | The learner can explain the system, defend a consequential decision and limitation, then apply the same agentic-coding loop to a different software task |

## Passing rule

A submission passes only when:

1. all 12 evidence gates pass,
2. the rubric total is at least **18 of 24**,
3. no rubric dimension scores below **2**,
4. R2 Context, specification, and plan scores at least **3**,
5. R4 Evidence review and recovery scores at least **3**,
6. R6 Transfer and technical ownership scores at least **3**, and
7. the learner completes the defense in their own words.

This allows one bounded developing area while preventing strong presentation
from masking weak evidence or unsafe technical ownership.

## Learner defense

The Teacher asks one question at a time. The defense covers:

1. Which problem, scope boundary, or human decision most shaped the work?
2. Which context or specification detail prevented the agent from guessing?
3. Which evidence changed the learner's conclusion or caused a revision?
4. What failed, how was the recovery bounded, and which valid work was preserved?
5. What limitation remains?
6. How would the learner apply the same loop to a different software task?

Each answer must reference the learner's own run, package, source, artifact, or
verification result. The transfer answer must include a new task, a boundary,
and at least one observable completion signal. Repeating course language
without a concrete example does not satisfy G11.

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
completion message leads with the agentic-coding skills demonstrated, then uses
ContentPilot artifacts as evidence. When a submission needs more work, the
course states the missing evidence and smallest next step in plain language.
