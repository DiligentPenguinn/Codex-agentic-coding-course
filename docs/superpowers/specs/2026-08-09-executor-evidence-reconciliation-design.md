# Executor Evidence Reconciliation Design

## Problem

Hương can receive a stale and incomplete view of a persistent Practice Executor thread.
Course Companion opens the Practice thread in Codex Desktop but observes it through a
separate App Server process. Desktop work performed through the current custom
`exec` wrapper is not returned by `thread/read` as `fileChange` or
`commandExecution` items, and live notifications are not shared across those App
Server processes.

The affected real run demonstrates every failure mode:

- the Practice binding and thread identity are correct;
- the workspace contains a modified `starters/contentpilot/app/globals.css`;
- the Executor final answer reports that file and successful verification at 390px;
- the persisted snapshot stopped at the earlier plan response;
- `changedFiles` and `verificationEvidence` remained empty;
- the Practice checklist remained at “Open Executor chat riêng cho Practice”.

Rebinding is additionally destructive because it replaces a prior snapshot with the
incomplete `thread/read` projection.

## Evidence Model

Course Companion must keep three evidence levels distinct:

1. **Observed structured activity** — first-class App Server events such as
   `fileChange` and `commandExecution`.
2. **Executor-reported results** — paths and checks explicitly stated in the latest
   final Executor response.
3. **Workspace-confirmed changes** — Executor-reported or newly dirty paths that a
   read-only comparison against the Practice run's Git baseline confirms changed.

Hương may use all three levels, but her input labels their provenance. She must not
describe an Executor-reported test result as independently rerun by Course Companion.

## Architecture

### Just-in-time thread refresh

`ExecutorActivityObserver` gains an explicit refresh operation. Before every Hương
response, the Teacher service refreshes the bound thread with
`thread/read { includeTurns: true }`. This closes the cross-process timing gap and
ensures the latest final Executor response is present.

Loading the Teacher surface may start a background refresh, but a foreground send
always awaits its own refresh. Refresh failures retain the last valid snapshot and
mark it stale; they never erase facts.

### Non-destructive projection

Rehydration reduces the returned turns into a new protocol projection, then merges it
with the persisted snapshot. Append-only facts such as structured changed files,
verification receipts, approvals, and prior final responses are preserved within
existing bounds. A partial or tool-omitting `thread/read` response cannot delete
previously captured evidence.

### Executor report projection

A bounded deterministic projector reads final Executor responses and extracts:

- safe workspace-relative file paths explicitly written in code spans or changed-file
  sections;
- verification statements that explicitly mention commands, pass/fail results,
  viewport measurements, overflow measurements, or comparable evidence.

The projector does not infer unstated facts. Unsafe, outside-workspace, malformed, or
unbounded paths are rejected. Extracted values are stored in separate
`reportedChangedFiles` and `reportedVerificationEvidence` fields.

### Workspace baseline and corroboration

At Practice creation, before the Executor window is opened, Course Companion captures
a bounded Git worktree baseline using direct process arguments with no shell:

- `git status --porcelain=v1 -z --untracked-files=all`;
- content signatures for paths already dirty at baseline;
- a deletion marker for missing paths.

On refresh, a workspace evidence provider repeats the read-only snapshot. A path is
workspace-confirmed when it became dirty after the baseline or its signature changed
from the baseline. Pre-existing unrelated changes are excluded. Non-Git workspaces
fall back to Executor-reported evidence without pretending it is confirmed.

The baseline is persisted per Practice run. Production code never reads private
`.codex/sessions` logs.

### Practice checklist reconciliation

The Practice checklist advances conservatively from reconciled activity:

- any bound-thread learner prompt or Executor response completes “Open Executor”;
- a structured or workspace-confirmed file change completes “Build and verify” and
  makes evidence review current;
- reported verification can inform Hương, but does not independently complete the
  learner-owned evidence review;
- Practice completion remains an explicit course outcome, not an automatic side
  effect of parsing text.

The repository update is idempotent and never moves a later checklist step backward.

## Safety and failure handling

- Git commands use `spawn`/argument arrays with `shell: false`.
- All paths pass workspace containment checks before filesystem access.
- Baselines and evidence arrays are bounded and schema-validated.
- A Git/read/parse failure degrades to stale or Executor-reported context; it does not
  block Hương or fabricate confirmation.
- Refreshes remain serialized with observer updates.
- Existing reset generation guards prevent a late refresh from resurrecting reset
  state.

## Test strategy

Tests use a sanitized fixture based on the real failing protocol:

1. `thread/read` returns complete turns containing messages/reasoning but no
   `fileChange` or `commandExecution` items.
2. The final response reports `app/globals.css`, passing checks, a 390px viewport,
   and zero horizontal overflow.
3. The thread changes without an in-process notification.
4. The next Hương send must refresh and receive the latest response and reported
   evidence.
5. A fake or temporary Git baseline confirms the CSS path while excluding unrelated
   pre-existing dirty files.
6. Rebind/restart must preserve earlier structured evidence.
7. The Practice checklist advances without marking learner review complete.
8. The Electron mock-Teacher rehearsal includes this silent external-update shape,
   then verifies Hương reports the file with correct provenance.

The full lint, typecheck, unit/integration, startup, and Electron suites run after the
targeted regression passes. The mock-Teacher audit repeats until it finds no further
defect in these covered scenarios.
