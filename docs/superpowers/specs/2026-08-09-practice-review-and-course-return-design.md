# Practice Review and Course Return Design

**Date:** 9 August 2026
**Status:** Approved design
**Scope:** Course Companion Practice review, checklist completion, and return to the Course App

## Problem

Course Companion can observe the active Executor thread, reconcile workspace
evidence, and advance a Practice checklist conservatively. It currently stops at
the final review step. Hương may tell the learner that they passed, but that
conversation does not create a persisted pass result, complete the checklist, or
return the learner to the Course App.

The product needs a deliberate review action that turns fresh Practice evidence
into a validated, persisted result. When the result is a pass, the learner must
receive a concise icon control that returns them to the course flow so they can
finish the exercise.

## Goals

- Add an icon-only progress-review action to both windowed and full-screen
  Teacher chat.
- Review the active Practice against its own objective, expected outcome, and
  versioned evaluation criteria.
- Persist checklist changes and the Practice verdict independently of Teacher
  prose.
- Make incomplete or unverifiable work actionable without moving course
  progress forward.
- Expose an icon-only return-to-course action after a persisted pass.
- Resume the Course App at the exercise's configured post-Practice destination.
- Make the workflow reusable for future Practice tasks without adding
  exercise-specific logic to the review engine.

## Non-goals

- Inferring completion from phrases in ordinary Teacher chat.
- Letting Hương edit project files, run Executor commands, or approve Executor
  actions.
- Independently rerunning every Executor-reported verification command.
- Hardcoding the current CSS exercise or its 390px criterion into the review
  service.
- Automatically moving the learner away from the pass explanation without an
  explicit return action.

## Product behavior

### Review control

While a Practice run is active, TeacherWorkspace displays a clipboard-check
icon before its existing expand, minimize, and close controls. The control is
rendered by the shared TeacherWorkspace component, so it behaves identically in
the windowed companion and full-screen Teacher overlay.

The control has:

- the accessible name and tooltip `Yêu cầu Hương duyệt tiến độ`;
- a visible focus state;
- a loading spinner and disabled state while a review is running; and
- retry behavior after a technical failure.

The action is not shown when no Practice run is active.

### Needs-work result

When one or more required criteria are unsatisfied or unverifiable:

1. the persisted result becomes `needs-work`;
2. completed checklist steps remain completed;
3. the earliest unmet required step becomes current;
4. later incomplete steps become upcoming;
5. the Teacher workspace selects the Progress tab; and
6. Hương adds a concise explanation of what passed, what remains, and what
   evidence the learner should produce next.

No course checkpoint advances.

### Passed result

When every required criterion is satisfied:

1. the persisted result becomes `passed`;
2. every Practice checklist step becomes completed;
3. the Course App's Practice result becomes `completed` through the versioned
   Practice-progress return contract;
4. Hương adds a concise pass explanation with evidence provenance; and
5. TeacherWorkspace reveals a book-with-return-arrow icon.

The return icon has the accessible name and tooltip `Quay lại khóa học`. It is
shown only for a persisted pass, not merely because the latest Teacher message
contains passing language.

### Return to the Course App

Pressing the return icon:

1. focuses and shows the Course App window;
2. closes the full-screen Teacher overlay or hides the companion window as
   appropriate;
3. reloads the persisted Practice and learner progress records;
4. records the configured Practice checkpoint completion; and
5. navigates to the Practice definition's post-Practice destination.

For `m1-verifiable-brief`, that destination is the Module 1 reflection scene.
The operation is idempotent: repeated clicks, duplicate IPC delivery, or a
restart during the transition cannot skip checkpoints or advance twice.

## Generalized Practice definition

The review engine consumes a versioned Practice definition rather than
exercise-specific conditions. A definition contains:

```ts
type PracticeDefinition = {
  schemaVersion: 1
  practiceId: string
  version: string
  courseRunId: string
  checkpointId: string
  objective: string
  expectedOutcome: string
  checklist: PracticeChecklistDefinition[]
  criteria: PracticeCriterionDefinition[]
  completionDestination: {
    lessonId: LessonId
    checkpointId: CheckpointId
    sceneId: SceneId
  }
}
```

Each criterion declares:

- a stable identifier and learner-facing description;
- whether it is required to pass;
- the checklist step it supports;
- the accepted evidence kinds;
- any task-specific assertion supplied as content; and
- the freshness requirement for that evidence.

Accepted evidence kinds may include bound-thread activity,
workspace-confirmed changes, Executor-reported verification, learner decisions,
artifacts, or Teacher assessment. Evidence sufficiency belongs to the Practice
definition. For example, the current CSS Practice may accept clearly labelled
Executor-reported viewport verification, while another Practice may require an
independently observed artifact.

Adding a future Practice should require a new definition and content, not a new
review workflow.

## Review result contract

The review service produces and validates a structured result before changing
state:

```ts
type PracticeReviewResult = {
  schemaVersion: 1
  practiceId: string
  practiceVersion: string
  runId: string
  verdict: 'needs-work' | 'passed'
  criteria: Array<{
    criterionId: string
    status: 'satisfied' | 'unsatisfied' | 'unverifiable'
    evidenceRefs: string[]
    explanation: string
  }>
  summary: string
  reviewedAt: string
  sourceDigest: string
}
```

The validator rejects unknown, duplicate, or missing required criterion IDs;
run or Practice mismatches; unsupported statuses; overlong text; invalid
evidence references; and a `passed` verdict when any required criterion is not
`satisfied`.

Teacher prose is generated from the validated result. The prose is a
presentation of the verdict, not its source of truth.

## Universal integrity gates

Universal gates protect the review process but do not encode a task's learning
outcome. A review can persist only when:

- the Practice definition and active run still match;
- the bound Executor thread identity matches the observed activity;
- the definition version is current for that run;
- evidence meets the freshness declared by the relevant criteria;
- every evidence reference has known provenance; and
- the structured result passes schema and semantic validation.

Stale or disconnected evidence is not automatically a global failure. It makes
any criterion requiring fresh Executor evidence `unverifiable`. A Practice made
entirely of durable learner-authored artifacts can still be evaluated according
to its own definition.

## Architecture

### PracticeReviewService

A dedicated main-process service owns the review use case. It:

1. loads the active run and its Practice definition;
2. refreshes evidence from only the bound Executor thread;
3. reconciles workspace evidence;
4. builds a bounded review envelope;
5. requests a structured assessment from the review evaluator;
6. validates the result against the definition and active run;
7. derives the checklist from criterion results;
8. persists the review and checklist atomically; and
9. appends Hương's learner-facing explanation to Teacher chat.

The service returns a single view model containing the updated Practice
workspace, review state, and appended Teacher message.

### Review evaluator

The evaluator is an interface separate from ordinary Teacher conversation. The
live implementation may use the existing Teacher inference transport with a
strict structured-output prompt. Tests use a deterministic evaluator.

Mechanical facts such as run identity, provenance, freshness, and required
criterion coverage are validated outside the model. The model cannot create
evidence, change a binding, omit a required criterion, or override the pass
invariant.

### PracticeRunRepository

The active run gains persisted review information:

- `reviewStatus`: `not-reviewed`, `reviewing`, `needs-work`, or `passed`;
- the latest validated review result;
- the derived checklist;
- `reviewedAt`; and
- an optional completion receipt.

Repository updates are atomic and scoped to the expected active run and
Practice version. A late result from a replaced run is ignored.

On startup, a persisted `reviewing` state recovers to a retryable state rather
than remaining permanently busy.

### Course progress return contract

The Practice side returns a versioned completion record containing:

- course run ID;
- Practice ID and version;
- run ID;
- checkpoint ID;
- status;
- completion timestamp;
- evidence summary;
- mastery summary; and
- configured course destination.

The Course App remains responsible for reflecting completion and navigating to
the destination. Applying the same completion record more than once is a no-op.

### Renderer and IPC

The shared API adds explicit operations for:

- reviewing the active Practice; and
- returning a passed Practice to the course.

The preload bridge exposes only validated, named operations. The renderer does
not submit arbitrary verdicts, checklist mutations, destinations, or evidence.

## Checklist derivation

Checklist state is derived from the validated criterion results and the
definition's criterion-to-step mapping:

- a step is completed when all of its required criteria are satisfied;
- the earliest step with an unsatisfied or unverifiable required criterion is
  current;
- later incomplete steps are upcoming; and
- a passed result completes the final review step and every preceding step.

The repository never moves a later completed step backward because of a stale
UI request. A new validated review may move a previously completed evidence
step back only when the definition explicitly requires current evidence and
the stored evidence has expired or been invalidated.

## Evidence language

Hương must preserve provenance in both pass and needs-work explanations:

- structured observations are described as observed;
- workspace reconciliation is described as confirmed since the Practice
  baseline;
- Executor statements are described as Executor-reported; and
- verification not rerun by Course Companion is never described as
  independently verified.

Whether a particular provenance level is enough to satisfy a criterion is
defined by the Practice content.

## Failure and recovery

- No active Practice: return a typed unavailable result and leave the UI
  unchanged.
- Review already running: coalesce repeat requests for the same run.
- Replaced run: discard the late result without mutating the replacement.
- Stale or disconnected evidence: mark affected criteria unverifiable and show
  recovery guidance.
- Malformed evaluator output: persist no verdict or checklist mutation; retain
  the previous result and offer retry.
- Persistence failure: do not show the pass return control.
- Teacher-message append failure after a persisted review: keep the authoritative
  review result and show a recoverable presentation error.
- Return failure: retain the persisted pass and keep the return control
  available.
- Restart after pass: restore the completed checklist and return control.

## Accessibility and visual constraints

- Both controls are icon-only visually but always have `aria-label` and `title`
  text in Vietnamese.
- Icons must be recognizable at the compact companion size and must not rely on
  color alone.
- Hover, focus-visible, pressed, busy, success, disabled, and error states must
  remain distinct.
- The controls use the established pixel-panel control sizing and placement so
  the Teacher header does not grow or wrap.
- Reduced-motion preferences disable nonessential spinner or success animation.

## Testing

### Unit and contract tests

- Practice-definition validation and version matching.
- Criterion coverage, status, evidence-reference, and verdict invariants.
- Checklist derivation for passed, unsatisfied, and unverifiable criteria.
- Atomic repository updates and replaced-run protection.
- Recovery from an interrupted `reviewing` state.
- Idempotent completion-record application and course navigation.

### Service tests

- Passing review with the evidence accepted by a Practice definition.
- Needs-work review with the earliest unmet step selected.
- Mixed evidence provenance.
- Criteria that accept reported evidence and criteria that require stronger
  evidence.
- Stale and disconnected evidence affecting only criteria that require it.
- Mismatched run, thread, Practice ID, or Practice version.
- Malformed evaluator output and persistence failure.
- Repeat review and concurrent review requests.

### Renderer tests

- Review icon appears only during an active Practice in windowed and full-screen
  Teacher.
- Tooltip, accessible name, keyboard operation, focus, loading, and retry states.
- Needs-work selects Progress and refreshes the checklist.
- Passed state shows completed steps and the return icon.
- Chat wording alone never shows the return icon.
- Return works from both Teacher layouts.

### End-to-end tests

- Start Practice, produce passing evidence, request review, persist pass, return
  to the Course App, and arrive at the configured reflection scene.
- Produce incomplete evidence, request review, and remain in Practice with
  actionable guidance.
- Restart after pass and complete the return successfully.
- Double-click or repeat the return operation without duplicate checkpoint
  completion.
- Preserve the current exercise's evidence caveat while allowing it to pass
  according to its definition.

## Acceptance criteria

1. Both windowed and full-screen Teacher expose the same clipboard-check review
   action during an active Practice.
2. A review refreshes the bound run's evidence and evaluates the active
   Practice definition, not hardcoded exercise rules.
3. Every required criterion receives a validated structured result.
4. An ordinary Teacher message cannot set a pass state.
5. Needs-work results update the checklist conservatively and do not advance
   course progress.
6. Passed results persist every checklist step as completed and create a
   versioned completion record.
7. Only a persisted pass exposes the icon-only return-to-course action.
8. Return restores the Course App at the Practice definition's configured
   destination and is safe to repeat.
9. Evidence provenance remains accurate in Hương's explanation.
10. Future Practice tasks can use the workflow by supplying definitions and
    criteria without modifying the review engine.
