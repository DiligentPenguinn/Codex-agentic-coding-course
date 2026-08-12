# Multi-Practice Course Companion Design

**Date:** 11 August 2026
**Status:** Approved design
**Scope:** Reconcile the merged Pilot 0.2 curriculum with PR #4 and deliver real,
resumable Module 1 and Module 2 Practice workflows

## Problem

PR #4 implements a verified Practice lifecycle with a persistent Executor task,
activity observation, evidence review, recovery, Teacher guidance, and an
idempotent return to the course. That implementation is still hardcoded to the
historical `m1-verifiable-brief` CSS exercise.

PR #5 subsequently rebuilt the runnable Pilot around two current modules:

- Module 1 teaches safe Codex setup and defines `m1-codex-safe-setup`.
- Module 2 teaches planning, PRDs, prompts, and implementation plans, and
  requires an approved planning package.

The merged curriculum contains the learner outcomes, lesson content,
assessments, checkpoints, and artifact templates. It does not connect those
outcomes to PR #4's real Teacher/Executor lifecycle. `main` contains only a
simulated planning-package fixture, while PR #4 cannot load the new Module 1
definition and contains no Module 2 definition.

The product needs a reusable Practice core that runs both current exercises,
preserves the merged curriculum, and supports future evidence patterns without
adding module-specific branches throughout the application.

## Course authority and reconciliation rule

During conflict resolution, use these authorities in order:

1. `pilot-workspace/` on merged `main` owns the runnable course sequence,
   learner outcomes, lesson scripts, checkpoints, quizzes, and artifact paths.
2. PR #4 owns the real Practice lifecycle, Executor binding, evidence integrity,
   review safety, recovery, and return behavior.
3. Development fixtures may model learner states, but they do not define
   learner-facing outcomes.

The merged curriculum remains intact. The old `m1-verifiable-brief` learner
content is removed. Teacher-facing copy consistently identifies Triết. The
historical name Hương is not carried into current learner-facing behavior.

## Goals

- Make the Practice lifecycle independent of a single Practice ID.
- Implement the real `m1-codex-safe-setup` flow using directly observed Codex
  task settings rather than screenshots or self-reported values.
- Implement one end-to-end, resumable `m2-planning-package` Practice.
- Require semantic review of Module 2 artifacts and their alignment.
- Preserve explicit learner ownership of product and approval decisions.
- Invalidate dependent Module 2 steps when an upstream artifact changes.
- Explain invalidation immediately through both Triết and the progress UI.
- Keep Teacher inference read-only and tool-free.
- Preserve PR #4's bounded evidence, provenance, recovery, and idempotency
  guarantees.

## Non-goals

- Teaching implementation or debugging in Module 2.
- Letting Triết modify Codex settings, write learner artifacts, run commands, or
  control the Executor task.
- Giving Teacher inference general filesystem, shell, browser, or Codex UI
  tools.
- Requiring screenshots of Codex settings.
- Treating artifact existence as sufficient evidence of quality.
- Inferring learner approval from Executor or Teacher prose.
- Building a general-purpose JSON rules language for every future course.
- Moving public-course roadmap content into the runnable private Pilot.

## Product sequence

The runnable Pilot remains:

1. Introduction
2. Module 1 — Bắt đầu làm việc với Codex
3. Module 2 — Giao tiếp hiệu quả với coding agent: Planning, PRD và prompt

Module 1 ends with one configuration Practice. Module 2 teaches all planning
concepts and runs its eight formative questions before launching one
uninterrupted planning-package Practice. The existing 15-question Module 2
assessment remains after the Practice and continues to be the mastery gate.

## Architecture

### Generic Practice lifecycle

One coordinator owns the reusable lifecycle:

```text
load definition
  -> create or restore run
  -> create or restore bound Executor task
  -> select evidence adapter
  -> collect and persist step evidence
  -> review frozen evidence
  -> revise or complete
  -> return to configured course destination
```

The coordinator must not contain default or fallback references to
`m1-verifiable-brief`, `m1-codex-safe-setup`, or `m2-planning-package`. The
renderer, Teacher service, context broker, progress repository, review service,
and completion path receive the active Practice identity from the run.

### Definition-driven core with bounded adapters

Each Practice definition selects:

- a stable Practice ID and semantic version;
- its course checkpoint and completion destination;
- a task policy;
- an evidence profile;
- ordered resumable steps;
- required criteria and accepted evidence kinds; and
- dependency invalidation rules when applicable.

A registry maps each supported evidence profile to one bounded adapter. The
first two profiles are:

- `codex-task-configuration` for Module 1; and
- `planning-package` for Module 2.

Unknown profiles fail definition loading. A Practice cannot fall back to a
generic adapter whose evidence is weaker than the definition expects.

### Adapter contract

An adapter has one clear responsibility: convert a narrowly scoped source into
versioned Practice evidence and step state. It may:

- validate the task policy after task creation;
- observe relevant App Server notifications;
- read explicitly allowed files within a validated workspace root;
- produce bounded, typed evidence references;
- calculate freshness and source digests; and
- report step invalidations.

It may not persist a verdict, advance course progress, send Teacher prose, or
select a completion destination. Those remain lifecycle-core responsibilities.

### Workspace resolution

Practice definitions select a known workspace kind, not an arbitrary path.
Both current Practices use the validated learner Pilot workspace. Within that
workspace, Module 2 may read or write only:

- `artifacts/PRD.md`; and
- `artifacts/implementation-plan.md`.

Development rehearsals resolve the same workspace kind to a disposable copy.
They never operate on the canonical learner starter workspace.

## Definition and run contracts

The definition schema advances to a new version rather than changing schema 1
semantics in place. Its conceptual shape is:

```ts
type PracticeDefinitionV2 = {
  schemaVersion: 2
  practiceId: string
  version: string
  checkpointId: CheckpointId
  objective: string
  expectedOutcome: string
  workspaceKind: 'pilot-workspace'
  taskPolicy: 'inherit-configuration-only' | 'safe-workspace-write'
  evidenceProfile: 'codex-task-configuration' | 'planning-package'
  checklist: Array<{
    id: string
    title: string
    dependsOn?: string[]
  }>
  criteria: PracticeCriterionDefinition[]
  completionDestination: {
    lessonId: LessonId
    checkpointId: CheckpointId
    sceneId: SceneId
  }
}
```

Dependencies form a directed acyclic graph. The parser rejects unknown step
references, self-dependencies, cycles, duplicate IDs, unsupported task-policy
and evidence-profile combinations, and invalid destinations.

The persisted run records:

- Practice ID and version;
- run generation and bound task;
- task policy and evidence profile;
- ordered step states;
- learner decisions and explicit approvals;
- current configuration or artifact evidence;
- evidence timestamps, freshness, and digests;
- dependency invalidations and their reasons;
- latest validated review; and
- an optional completion receipt.

Existing schema 1 mock runs either migrate explicitly when their Practice still
exists or archive as historical receipts. They never silently become a current
Module 1 or Module 2 run.

## Module 1 Practice

### Objective and outcome

`m1-codex-safe-setup` teaches the learner to establish a safe, suitable Codex
configuration for the course.

The expected outcome is a fresh App Server observation from the bound Practice
task confirming:

- Model: 5.6 Sol
- Reasoning effort: High
- Speed: Standard
- Approval: Approve for me
- Full access: off

The JSON definition remains the machine-readable content authority, but it is
updated to remove screenshot and Executor-report requirements.

### Resumable steps

1. Open the dedicated configuration task.
2. Set Model, Effort, and Speed.
3. Set Approval and Full access.
4. Review the detected configuration.
5. Ask Triết to approve it.

### Task policy

The Module 1 task uses `inherit-configuration-only`. `thread/start` supplies the
validated learner workspace, persistence, and service name but does not
override model, effort, service tier, approval policy, or sandbox policy.

Course Companion does not call `turn/start` for this task before the
configuration passes. It tells the learner to use only the task settings
controls. Course Companion cannot prevent a learner from manually sending an
unrelated message in the Codex UI, so the product must not claim that it
enforces such a prohibition. Any unrelated activity is ignored for completion.

### Configuration evidence

The configuration adapter captures the effective fields returned by task
creation and refreshes them on `thread/settings/updated`:

- `model`;
- `effort` or `reasoningEffort`;
- `serviceTier`;
- `approvalPolicy`;
- `sandboxPolicy`; and
- `activePermissionProfile` when present.

Normalization is explicit and fail-closed:

- `gpt-5.6-sol` maps to the learner-facing label 5.6 Sol.
- `high` maps to High.
- a null or runtime-advertised standard/default service tier maps to Standard;
  unknown nonstandard tiers do not.
- `on-request` maps to Approve for me.
- Full access is off only when the effective sandbox is not
  `dangerFullAccess`; an explicit full-access permission profile also fails.

The implementation keeps the raw normalized protocol value beside the
learner-facing label so future protocol drift is diagnosable. Missing or unknown
values are `unverifiable`, never assumed correct.

### Review and completion

Triết receives structured configuration values, provenance, task identity, and
freshness. The learner sees every mismatch by name and receives one next action.
Passing writes a versioned receipt containing the normalized approved model,
effort, and service tier, then returns to `m1-mastery`.

Screenshots are not required. The Executor does not generate a verification
report. Direct task metadata is the authoritative evidence.

## Later-task safety policy

Module 2 and subsequent action-taking Practices use `safe-workspace-write`.
Task creation explicitly requests:

- `approvalPolicy: on-request`; and
- a workspace-write sandbox restricted to the validated learner workspace.

Model, effort, and service tier are copied from the validated Module 1
completion receipt into later task creation. This does not assume that a
thread-scoped settings change updated the learner's global Codex defaults. A
missing or obsolete Module 1 configuration receipt blocks later Practice
startup and sends the learner back to the setup checkpoint.

The effective start response is checked before any instructional turn is sent.
A full-access sandbox, unexpected workspace root, incompatible approval policy,
or mismatch with the approved Module 1 configuration stops startup with a typed
safety error and recovery guidance.

## Module 2 Practice

### Objective and outcome

`m2-planning-package` asks the learner to use Codex to transform the
one-sentence ContentPilot idea into an approved planning package without
writing implementation code.

The expected outcome is:

- an approved, approximately one-page `artifacts/PRD.md` containing the eight
  required product sections;
- an approved `artifacts/implementation-plan.md` derived from that PRD;
- complete alignment between requirements, scope boundaries, `Done When`
  conditions, plan steps, and verification; and
- a learner-owned explanation of at least one scope decision.

### Instruction boundary

Before Practice, the course teaches:

- when planning is appropriate;
- PRD purpose and structure;
- useful image and code examples;
- the five-question planning-prompt framework; and
- implementation-plan purpose, structure, and alignment.

The existing three Planning/PRD, three Prompt, and two Implementation Plan
formative questions run before Practice. Practice contains application, review,
and revision rather than interrupting itself for new instruction.

### Resumable steps

1. Write the learner-owned PRD prompt.
2. Complete the one-question-at-a-time Executor interview.
3. Review, approve, and save `artifacts/PRD.md`.
4. Ask the Executor to draft a plan from the approved PRD.
5. Reconcile PRD scope and `Done When` items against the plan.
6. Approve and save `artifacts/implementation-plan.md`.
7. Explain one scope decision and ask Triết for review.
8. Return to the course for the final assessment.

The same persistent Executor task and Practice run serve every step. Relaunch or
window switching returns to the earliest current step without creating a new
task.

### Learner ownership

The learner must explicitly approve both artifacts. Executor or Teacher prose
cannot create an approval. The recognized decisions are bounded course actions,
not arbitrary phrase matching:

- approve and save PRD;
- request PRD revision;
- approve and save implementation plan; and
- request plan revision.

The learner's scope-decision explanation is stored as learner-authored evidence.
Triết may clarify it but may not supply the answer on the learner's behalf.

### Artifact evidence

The planning adapter reads only the two canonical paths. It rejects:

- missing or empty files;
- directories, symlinks, and paths outside the validated learner workspace;
- content above the defined review bound;
- unexpected artifacts presented as substitutes; and
- implementation code embedded in the planning package.

Each accepted snapshot includes bounded content, a content digest, file
identity, observation time, and freshness. The review envelope never includes
unrelated workspace files or raw transcripts.

The adapter also reconciles the workspace against a baseline captured at
Practice start. Only the two canonical artifact paths may change during Module
2. A change to ContentPilot code, dependencies, course files, or any other path
is reported as an out-of-scope change and blocks completion until the learner
restores or deliberately removes it through the Executor task.

### Semantic criteria

PRD review requires:

- all eight required sections;
- product decisions rather than implementation detail;
- explicit in-scope and out-of-scope boundaries;
- observable and testable `Done When` conditions;
- no important unresolved decision hidden as an assumption; and
- explicit learner approval.

Implementation-plan review requires:

- the approved PRD as its sole product-scope source;
- an understandable overall approach;
- ordered, bounded steps;
- a goal, expected component or file, observable result, and verification for
  every step;
- dependencies, assumptions, risks, and open technical decisions;
- an end-to-end verification path;
- no implementation code; and
- explicit learner approval.

Alignment review requires:

- every in-scope PRD requirement maps to at least one plan step;
- every plan step traces to an in-scope requirement;
- out-of-scope content does not return as planned work; and
- every `Done When` condition maps to verification evidence in the plan.

### Dependency invalidation

Artifact snapshots are dependency inputs, not permanent completion flags.

If the approved PRD digest changes, invalidate:

- PRD approval;
- plan generation;
- alignment review;
- package approval; and
- Teacher review.

If only the implementation-plan digest changes, preserve PRD approval and
invalidate:

- alignment review;
- package approval; and
- Teacher review.

A review result is valid only for the exact current artifact digests. A result
that returns after either digest changes is discarded without mutating the run.
The learner stays in the same run and resumes at the first invalidated step.

### Invalidation communication

No completed step silently moves backward. The progress panel and Triết both
state:

1. which artifact changed;
2. which completed steps became stale;
3. why the dependency requires re-review; and
4. exactly one recommended next action.

Approved learner-facing wording for a PRD regression is:

> PRD vừa thay đổi sau khi implementation plan được tạo, nên bước đối chiếu và
> duyệt planning package không còn mới. Hãy cập nhật plan theo PRD, kiểm tra lại
> bốn điểm alignment rồi yêu cầu mình duyệt lại.

## Teacher review boundary

Triết remains a read-only, tool-free inference task. Course Companion collects
and validates evidence before inference.

Module 1 review receives structured task configuration and provenance. Module 2
review receives the two bounded artifact contents, learner approvals, scope
decision, task provenance, timestamps, and digests.

The evaluator returns strict structured results for every required criterion:

- `satisfied`;
- `unsatisfied`; or
- `unverifiable`.

Each result cites permitted evidence IDs and includes a concise Vietnamese
explanation. Application code validates criterion coverage, evidence kind,
freshness, Practice and run identity, digest identity, and verdict consistency.
Teacher prose presents the validated result; it is not the source of truth.

Every learner-facing review includes:

1. the verdict;
2. evidence reviewed;
3. criteria that passed;
4. criteria that need work or became stale; and
5. one recommended next action.

## Failure and recovery

- Unknown Practice ID, version, evidence profile, or task policy: fail loading
  before task creation.
- Unsafe effective Module 2 permissions: send no turn and show setup recovery.
- Missing or obsolete Module 1 configuration receipt: do not create an
  action-taking task; return to the setup checkpoint.
- Missing configuration fields: mark affected Module 1 criteria unverifiable.
- Disconnected or stale task metadata: preserve the run and offer reconnect or
  refresh.
- Missing, unsafe, or oversized artifact: reject it before Teacher inference.
- Unexpected Module 2 workspace change: mark scope control unsatisfied and
  identify the offending relative path without reading unrelated content.
- Artifact change during review: discard the stale result and report the
  invalidation.
- Concurrent review request for the same run: coalesce or reject without
  starting a second inference.
- Replaced Practice run: ignore late observations and review results.
- Teacher inference failure: preserve artifacts, approvals, step state, and the
  last valid review; expose retry.
- Persistence failure: do not expose a pass or return control.
- Restart from `reviewing`: recover to a retryable state.
- Repeated completion or return: reuse the same completion receipt and do not
  advance twice.

## Renderer behavior and accessibility

The Practice brief renders the active definition rather than module-specific
constants. The progress panel renders ordered step state and a short reason for
any invalidation.

Module 1 shows detected settings and mismatches without exposing raw protocol
objects. Module 2 shows artifact availability, approval state, freshness, and
alignment state without presenting the Teacher's internal evidence envelope.

Review and return controls preserve PR #4's accessible names, keyboard
operation, focus-visible styling, busy states, and compact/full-screen parity.
Status never relies on color alone. Reduced-motion preferences remain honored.

## Data retention and privacy

- No screenshots are collected or stored.
- Only configuration values relevant to the Module 1 criteria are persisted.
- Module 2 stores bounded canonical artifact evidence and digests, not unrelated
  files or raw task transcripts.
- Existing credential redaction remains active before Teacher inference.
- Teacher inference receives frozen evidence and cannot fetch additional data.
- Completion receipts contain summaries and digests, not full artifact content.

## Testing strategy

### Definition and lifecycle contracts

- Load multiple definitions by ID and version.
- Reject unknown adapters, task policies, evidence kinds, destinations, and
  cyclic dependencies.
- Prove no lifecycle service falls back to a hardcoded Practice ID.
- Migrate or archive historical schema 1 runs without reclassifying them.

### Module 1

- Capture inherited effective settings from task creation.
- Refresh configuration evidence from settings-update notifications.
- Normalize each known protocol value and reject unknown values.
- Report each of the five possible mismatches accurately.
- Confirm Course Companion starts no Executor turn before approval.
- Prevent stale, missing, disconnected, or unsafe configuration from passing.
- Persist the approved model, effort, and service tier for later task creation.
- Persist a pass and return to `m1-mastery`.

### Module 2

- Persist and resume every step in one bound task.
- Require learner-owned prompt and approval decisions.
- Enforce canonical artifact paths, file types, and size bounds.
- Reject unexpected workspace changes without reading their contents.
- Evaluate PRD quality, plan quality, and cross-artifact alignment.
- Invalidate all dependent steps after a PRD change.
- Preserve PRD approval but invalidate later steps after a plan-only change.
- Discard a late review tied to obsolete digests.
- Communicate invalidation through Teacher and progress state.
- Persist a pass and return to `m2-mastery`.

### Reliability and security

- Reconnect and relaunch at representative Module 1 and Module 2 steps.
- Reject mismatched task, run, Practice, version, and workspace identities.
- Coalesce concurrent review requests.
- Recover from malformed evaluator output and inference failure.
- Keep completion and return idempotent.
- Prove Teacher inference starts read-only with no tools.

### End-to-end and visual validation

- Run typecheck, lint, unit tests, production build, and Electron smoke tests.
- Complete both Practices in a clean disposable learner workspace.
- Exercise needs-work, stale, disconnected, revision, pass, return, and relaunch
  states.
- Visually inspect normal and recovery states at full and compact sizes.
- Confirm developer rehearsals do not modify the canonical learner starter.

## Acceptance criteria

1. PR #4 is reconciled with the merged Pilot without restoring historical
   curriculum content.
2. The generic lifecycle runs both Practice definitions without hardcoded
   module IDs.
3. Module 1 observes the bound task's inherited configuration directly and
   requires no screenshots.
4. Course Companion sends no Module 1 Executor turn before configuration pass.
5. Later tasks reuse the approved Module 1 model, effort, and service tier and
   start with explicit safe permissions.
6. Module 2 stops before code and rejects changes outside its two canonical
   artifacts.
7. Module 2 remains one run with durable, resumable sub-steps.
8. Triết semantically reviews both planning artifacts and their alignment.
9. Learner approvals and scope decisions remain learner-owned.
10. Artifact changes invalidate exactly the dependent steps and are explained
   immediately.
11. Review results are tied to current task identity, freshness, and artifact
    digests.
12. Both Practices return to their configured mastery destinations through
    idempotent completion receipts.
13. All automated, Electron, recovery, security, and visual validation gates
    pass before PR #4 leaves draft status.
