# Practice Mode Executor Chat Switching and Layered UI Design

**Status:** Design approved; written specification pending user review
**Date:** 7 August 2026
**Initial implementation target:** `prototypes/app-startup-electron-mock/`
**Product migration target:** `course-companion/`

## Goal

Make Practice Mode easier to understand while adding safe, intentional switching
between Codex Executor chats. The learner should see only the information needed
for the current decision, remain able to inspect objective and progress without
leaving Codex, and choose whether Teacher carries relevant context into a new
Executor chat.

The current Windows prototype is the first implementation and validation
surface because it already contains the mature Codex App Server, binding,
observation, Teacher, persistence, recovery, and test mechanisms. After the
mechanism passes its release gates, the same services and state transitions move
into Triết's `course-companion/` application as the shared Windows and macOS
product shell.

## Product decisions

- Use **Executor chat** in learner-facing language. Do not use “Executor task.”
- Keep at most one active Practice run.
- Starting a new run archives the previous run as read-only local history.
- The old Executor chat remains unchanged and available in Codex.
- `Resume practice` always refers to the one active run.
- Context transfer is optional and requires one explicit learner choice.
- When approved, context selection and transfer happen automatically according
  to a fixed safety policy; the learner does not configure transfer categories.
- Show a short automatic transfer confirmation. Keep the detailed receipt
  collapsed until requested.
- Use hybrid checklist authority: machine-verifiable steps complete from fresh
  evidence, while judgment-based steps require Teacher confirmation.

## Non-goals

- Deleting, archiving, compacting, or editing the previous Executor chat.
- Supporting multiple simultaneously active Practice runs.
- Allowing learners to resume archived local Practice runs in this release.
- Copying full Executor transcripts into another chat.
- Carrying hidden reasoning, credentials, raw protocol data, unrelated chats, or
  stale observations presented as current.
- Replacing Triết's ownership of Practice objectives, outcomes, subtask
  sequencing, evidence requirements, or instructional wording.
- Packaging, signing, auto-update, cloud sync, voice, or screen capture.

## Layered learner journey

### 1. Practice brief

Each Practice begins on a concise brief containing:

- a short objective;
- the expected outcome;
- a high-level checklist preview;
- `Start new practice`; and
- `Resume practice` only when an active run exists.

Detailed instructions, evidence, history, and recovery information remain behind
progressive-disclosure controls. The brief must not become a full lesson page.

### 2. Start or resume

`Resume practice` revalidates the saved Executor chat binding, opens that exact
chat in Codex, changes the Course App to Teacher, and minimizes the Course App to
the Teacher bubble.

`Start new practice` begins a new run. If no run is active, the learner selects
an eligible Executor chat or creates a new one. If a run is already active,
Teacher asks:

> Bring useful context?

The choices are:

- `Prepare and continue`; or
- `Start fresh`.

The popup explains that the old Executor chat stays unchanged.

### 3. Automatic selective handoff

After `Prepare and continue`, Teacher shows a cancellable preparation surface
with truthful stages rather than invented percentages:

1. read bounded chat history;
2. select decisions and evidence;
3. validate the new Executor chat;
4. attach the handoff; and
5. activate the new Practice run.

The handoff is visible in the new Executor chat as a clearly labelled Practice
context item. After activation, Teacher shows a compact confirmation with a
collapsed `Carried context` receipt.

The receipt records:

- transfer ID;
- source Practice run ID and source Executor chat ID;
- target Practice run ID and target Executor chat ID;
- Practice definition ID and version;
- carried categories;
- source freshness time;
- handoff hash; and
- completion time.

### 4. Work in Codex

After starting or resuming, the selected Executor chat opens in Codex. The
Course App changes to Teacher and minimizes into one draggable bubble.

Bubble interaction:

- single click opens the compact Teacher workspace;
- double click opens the full Teacher workspace;
- `Enter` opens the compact workspace;
- `Shift+Enter` opens the full workspace;
- the compact workspace retains a visible expand button; and
- minimize, restore, or expand retains the active Teacher/Progress panel and its
  scroll position.

The click handler uses a 300 ms decision window for the optional double-click
shortcut. One click opens compact after that window; a recognized double click
opens full screen without first flashing compact. The visible expand control is
the accessibility-safe path when a learner's click timing does not match the
shortcut.

### 5. Teacher and Progress panels

Compact and full workspaces expose the same two horizontal destinations:

- Teacher; and
- Progress.

The top-right controls use familiar icons for Progress, expand/restore, and
minimize. Every icon has an accessible name, keyboard focus treatment, and hover
tooltip. Icons reduce visual noise; they do not replace meaningful objective,
outcome, next-step, or error text.

Progress shows:

- completed subtasks;
- the single current or next subtask;
- remaining subtasks;
- the evidence or Teacher decision supporting completion;
- evidence freshness; and
- a compact route back to the Practice brief.

## Practice content contract

Triết's content defines the instructional meaning. Each versioned Practice
definition supplies:

```ts
type PracticeDefinition = {
  id: string
  version: number
  title: string
  objective: string
  expectedOutcome: string
  steps: PracticeStepDefinition[]
}

type PracticeStepDefinition = {
  id: string
  title: string
  conciseInstruction: string
  completionAuthority: 'evidence' | 'teacher'
  evidenceRequirement?: EvidenceRequirement
}
```

An `evidence` step must define an observable requirement that the application
can evaluate against fresh, bound-chat-only activity. A `teacher` step defines
the learner response or judgment Teacher must assess. Step IDs are stable within
a definition version and ordered by content.

The app validates definitions before rendering them. Invalid definitions fail
closed with a fixed content-unavailable state; they never produce inferred
steps or completion criteria.

## State model

Practice persistence contains:

```ts
type PracticeState = {
  schemaVersion: number
  activeRun: PracticeRun | null
  archivedRuns: ArchivedPracticeRun[]
  pendingTransition: PendingPracticeTransition | null
  presentation: PracticePresentation
}
```

### Active run

The active run is the only run that:

- `Resume practice` can restore;
- Teacher may use as current context;
- the activity reader may observe;
- automated progress may advance; and
- the compact/full Teacher workspace presents as current.

### Archived runs

Starting a new run converts the prior active run into a bounded read-only
history record. The archive preserves safe progress, binding identity, transfer
receipt references, and timestamps. It excludes raw transcripts, credentials,
environment variables, hidden reasoning, unrestricted repository content, and
raw App Server payloads.

Archived runs are not resumable in this release. Their Executor chats remain
owned by Codex and are not changed by Course Companion.

### Pending transition

A durable pending transition makes partial transfer recoverable. It records:

- transition ID and stage;
- source active-run generation;
- source and target chat identities;
- target Practice run identity;
- consent choice;
- structured handoff and hash when applicable;
- whether attachment has been observed; and
- timestamps.

The state parser rejects unknown fields and invalid cross-references. Corrupt
state is quarantined using the existing safe-recovery pattern.

## Component boundaries

### Practice coordinator

The coordinator is the sole owner of active-run and binding transitions. It
serializes start, resume, create, select, switch, cancel, retry, and restart
reconciliation. Renderer actions never mutate Practice state directly.

It preserves these invariants:

1. at most one active run exists;
2. Teacher and the activity reader observe only the committed active binding;
3. a stale operation cannot commit after a newer binding generation;
4. the old binding remains current until the target transition commits; and
5. a transition never attaches the same handoff twice.

### Executor chat coordinator

This adapter:

- lists recent eligible chats for the exact Practice workspace;
- creates and names a dedicated chat;
- validates selected chat identity and workspace;
- reads the exact source chat with turns included, then applies explicit turn,
  item, and character bounds before any content reaches Teacher;
- opens the canonical Codex deep link;
- injects a visible handoff item when authorized; and
- revalidates bindings on startup and resume.

The adapter never silently substitutes a chat and never treats cached identity
as current proof.

### Teacher handoff service

The handoff service receives only bounded, display-safe history from the source
bound chat plus the Practice definition and verified progress. It returns a
schema-validated handoff containing:

- objective and expected outcome;
- learner-approved scope, constraints, and decisions;
- latest verified evidence with provenance and freshness;
- completed Practice steps; and
- the unresolved next step.

The service does not receive unrelated chats, secrets, raw environment values,
hidden reasoning, or unrestricted filesystem content.

### Progress evaluator

The evaluator combines the versioned Practice definition with current evidence
and Teacher assessments.

- Evidence-backed steps advance only from fresh evidence tied to the committed
  Executor chat.
- Teacher-backed steps advance only from an explicit persisted Teacher
  assessment.
- A learner may report completion, but that report alone does not complete an
  assessed step.
- Stale or disconnected evidence cannot advance progress.
- The evaluator always produces at most one next step.

### Layered UI controller

The UI controller maps coordinator view models into brief, transition,
loading, Teacher, Progress, bubble, compact, and full states. It owns no App
Server or persistence capability and receives no raw provider data.

## Why Codex compaction is not used

Codex `thread/compact/start` summarizes history inside the same thread to reduce
active context. It changes the source thread and does not return a portable
handoff document suitable for attaching to another thread. Using it would also
violate the decision to leave the previous Executor chat unchanged.

Cross-chat transfer therefore uses an explicit Teacher-generated structured
handoff. The first implementation may use `thread/inject_items` only if the
real Codex desktop checkpoint proves that the injected Practice handoff is
visible to the learner in the target chat. If it is not visible, implementation
stops at that gate and selects another documented visible item mechanism; the
app must not fall back to hidden context or an undocumented rollout-file edit.

## Failure-safe switching transaction

Switching follows a recoverable staged transaction:

1. Capture the source active run and committed binding generation.
2. If authorized, prepare and validate the bounded handoff without mutating a
   chat.
3. Create or select and validate the target Executor chat.
4. Persist `pendingTransition` with target identity, handoff hash, and stage.
5. Attach the handoff once when applicable, bind the activity reader, and verify
   exact target identity.
6. In one durable state write, archive the old run, activate the new run, clear
   `pendingTransition`, and publish the new view model.

Until step 6 succeeds, the previous run remains the active run returned by
`Resume practice`.

### Idempotency

Every transfer uses a unique transfer ID embedded in the visible handoff item
and persisted in `pendingTransition`. Before retrying attachment, the coordinator
checks the target chat for that transfer marker. An observed marker advances the
stage without injecting another item.

### Cancellation

Cancellation is available before handoff attachment. It removes the pending
transition and returns to the previous active run. If a target chat was newly
created, it remains a normal unchanged Codex chat and is disclosed to the
learner; the Course App does not delete it.

After attachment begins, the UI changes from `Cancel` to `Finish setup` so it
does not promise a rollback it cannot provide.

## Error and recovery behavior

| Failure | Required behavior |
|---|---|
| Handoff generation fails | Keep the old run active; offer `Retry` or `Start fresh`; write to neither chat. |
| Eligible chats cannot be listed | Keep the old run active; show one retry action. |
| Target chat fails validation | Keep the old run active; reopen the picker; never substitute another chat. |
| Target chat creation succeeds but later preparation fails | Keep the old run active; disclose the created chat; do not delete it. |
| Handoff attachment fails | Retain the pending transition; offer retry or a fresh target before any activation. |
| Handoff attaches but final state commit fails | Show `New chat prepared, activation incomplete`; retry exact activation without duplicating the handoff. |
| App closes during preparation | Reconcile the durable transition stage on restart before accepting new switching actions. |
| Reader cannot bind the target | Keep the old run active and restore its exact reader identity; disclose disconnection if restoration fails. |
| Teacher assessment unavailable | Keep Teacher-owned steps pending; preserve evidence-owned progress. |
| Evidence becomes stale | Stop automated advancement; show last verified time and `Retry observation`. |

Provider errors are mapped to fixed learner-safe messages. Raw App Server
payloads, authentication URLs, credentials, environment values, and hidden
reasoning never enter the renderer, state store, transfer receipt, or logs.

## Cross-platform design

The Practice definition, state model, coordinator, handoff service, progress
evaluator, IPC contracts, and renderer behavior are shared between Windows and
macOS.

Thin platform adapters handle:

- `start-course.cmd` versus `start-course.command`;
- command discovery and prerequisite installation;
- Electron runtime paths;
- filesystem path normalization;
- deep-link acceptance testing;
- window focus, visible-workspace, and always-on-top differences; and
- platform-specific manual release checkpoints.

Platform adapters do not fork the Practice business rules or learner-facing
journey.

## Test contract

### Unit tests

- Practice definition accepts valid versioned steps and rejects invalid or
  ambiguous completion authority.
- State schema enforces one active run and valid pending-transition references.
- Selective handoff includes allowed categories and excludes forbidden data.
- Handoff hashing and transfer-marker detection are deterministic.
- Hybrid progress never advances from stale evidence or learner assertion alone.
- Reducers preserve one next step and reject out-of-order completion.
- Presentation state preserves active panel and scroll position across compact
  and full modes.

### Coordinator and integration tests

- Start, resume, create, select, fresh switch, and handoff switch follow exact
  binding identity.
- The old Executor chat receives no mutation.
- Unbound decoy-chat activity never enters Teacher context or progress.
- Concurrent switch, retry, Teacher send, open, and observation operations
  cannot cross binding generations.
- Every failure point before commit keeps the old run active.
- Restart reconciliation handles every pending stage.
- Retrying after attachment does not duplicate the handoff.
- A final successful commit archives exactly one old run and activates exactly
  one new run.

### Renderer tests

- Brief initially exposes only objective, outcome, and relevant start/resume
  actions.
- Transfer detail appears only after `Start new practice` with an active run.
- Loading stages are truthful and do not show fabricated progress percentages.
- All icon-only controls have accessible names, focus states, and tooltips.
- Single click, double click, keyboard equivalents, expand, restore, and
  minimize follow the approved window contract.
- Teacher/Progress state and scroll position survive window-mode changes.
- Checklist presents completed, next, and remaining steps without exposing raw
  evidence payloads.

### Electron smoke tests

- First Practice start and active Practice resume.
- Fresh switch and selective-handoff switch.
- Visible transfer item and collapsed Teacher receipt.
- Old chat unchanged and decoy chat excluded.
- Compact bubble, single/double click, full restore, and Progress navigation.
- App restart during a pending transition and successful reconciliation.
- Corrupt state quarantine and safe recovery.

### Manual Windows and macOS gates

- The canonical deep link opens the exact validated Executor chat or displays
  the truthful named-chat fallback.
- The Teacher bubble can be physically dragged and remains usable across
  displays and workspaces.
- Always-on-top and focus behavior match platform expectations.
- A real bound-chat prompt, response, evidence update, Teacher assessment, and
  context handoff are observed end to end.
- No credential, raw protocol message, unrelated-chat content, hidden
  reasoning, or private environment value appears in UI, logs, or state.

## Implementation and migration sequence

1. Merge current `main` into `duy-branch`, preserving Triết's Course Companion
   and the Windows prototype's mature integration work.
2. Implement and validate this design in
   `prototypes/app-startup-electron-mock/`.
3. Keep the old prototype runnable until its full automated and real-desktop
   release gates pass.
4. Extract or port the approved shared services and contracts into
   `course-companion/` behind its existing fixture adapters.
5. Replace fixture Teacher and Practice behavior incrementally while keeping
   Triết's learner-facing content and visual shell authoritative.
6. Route Windows and macOS launchers to the shared Course Companion only after
   both platforms pass the same product acceptance contract.
7. Retain the old prototype as historical validation evidence, not a second
   learner-facing application.

## Acceptance criteria

The design is implemented when:

1. learners see a concise Practice brief with correct `Start new practice` and
   `Resume practice` behavior;
2. only one Practice run can be active;
3. starting a new run leaves the old Executor chat unchanged;
4. learners can start fresh or authorize one automatic selective handoff;
5. the handoff is bounded, visible, attributable, fresh, and never duplicated;
6. partial failures and restarts preserve one truthful active run;
7. Teacher and automated progress use only the committed Executor chat;
8. the checklist follows Triết's versioned steps and hybrid completion rules;
9. compact and full Teacher/Progress surfaces follow the approved bubble
   interaction contract;
10. all automated gates pass in the prototype; and
11. the shared Course Companion later passes equivalent Windows and macOS
    acceptance with only platform adapters differing.
