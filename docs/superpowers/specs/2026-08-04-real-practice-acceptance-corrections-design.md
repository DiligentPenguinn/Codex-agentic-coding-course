# Real Practice Acceptance Corrections Design

**Status:** Proposed correction design; awaiting user review | **Date:** 4 August 2026 | **Owner:** Duy | **Target:** Windows-first local prototype

## Purpose

Correct three failures found during the first real-app Practice Mode acceptance
run without changing the approved Practice Mode architecture:

1. the compact Teacher bubble is technically draggable but does not provide a
   usable drag target;
2. returning learners see the first-run startup ceremony again and must take an
   avoidable step before returning to Course or Practice;
3. Teacher quick chat collapses distinct runtime failures into one opaque error,
   preventing safe diagnosis and useful recovery.

This document is an addendum to
[Practice Mode Awareness Prototype Design](2026-08-03-practice-mode-awareness-prototype-design.md).
That design remains authoritative where this document does not explicitly
change behavior.

## Evidence and constraints

The acceptance run established that:

- the bubble's outer shell is marked as an Electron drag region, but the
  `no-drag` chat button consumes nearly the entire 72 by 72 pixel window;
- saved setup state exists, but the canonical launcher still prints the full
  first-run setup explanation before starting the app;
- Executor observation was fresh and ready when Teacher chat failed, so the
  screenshot does not indicate a learner prompt or language error;
- the Teacher adapter deliberately sanitizes App Server failures, but currently
  removes the operation boundary needed to distinguish startup, turn, stream,
  timeout, and connection failures;
- the installed Codex App Server schema accepts the adapter's current
  `ephemeral`, `developerInstructions`, `approvalPolicy`, and `read-only`
  sandbox fields. The correction must reproduce the real failing stage rather
  than infer a protocol mismatch from an example in documentation.

The corrections must preserve:

- one Course/Practice Electron application and one separate Codex execution
  application;
- the 72 by 72 pixel compact window contract;
- a minimum 44 by 44 pixel interactive target;
- the explicit bound-task and redacted-context boundary;
- no raw App Server errors, credentials, environment data, request payloads,
  unrestricted transcripts, or hidden reasoning in renderer-visible state;
- one canonical learner launch command.

## Correction 1: usable bubble movement

### Interaction design

Keep the compact window at 72 by 72 pixels. Replace the visually ambiguous thin
draggable annulus with two unmistakable regions:

```text
┌──────────────────────┐
│   ━━━━━ drag grip    │  10–12 px visible grip zone
│                      │
│      Teacher         │  52–56 px chat button
│       button         │
└──────────────────────┘
```

- The upper grip is visibly different from the state ring and is the native
  Electron drag region.
- The Teacher button remains a `no-drag` region and opens quick chat.
- The button retains at least a 44 by 44 pixel hit target.
- Executor state remains visible on the button/ring; unread Teacher messages
  remain the only numbered badge.
- Hover and focus treatment must not imply that the grip opens chat.
- A short movement cursor and accessible label communicate that the grip moves
  the Teacher bubble.

The same pixels will not attempt to be both a click target and a native drag
target. Doing so would require custom pointer-threshold and window-position IPC
for a problem Electron already solves safely with a dedicated drag region.

### Movement behavior

- Dragging the grip moves the entire compact surface continuously.
- Releasing near a screen edge keeps the existing on-screen clamping behavior.
- Clicking the Teacher button without dragging opens quick chat.
- Compact, expand, unread, and status behavior do not change.

### Verification

Automated checks must assert meaningful grip and button dimensions, not merely
the presence of `-webkit-app-region`. Electron smoke coverage must confirm that
the dedicated grip is visible and the button still opens quick chat. The real
acceptance checklist must include physically dragging the window to a second
screen position.

## Correction 2: one smart startup path

### Learner contract

`start-course.cmd` remains the only documented command for both first use and
returning use.

```text
First run
  → explain local setup and any required approval
  → verify/install prerequisites
  → open Course

Returning run with valid setup
  → brief “Setup complete — opening Course” status
  → launch immediately
  → restore Course or active Practice

Missing or invalid prerequisite
  → fall back safely to setup/recovery
```

A returning learner must not repeat the setup ceremony, approve the same
installation, or click an intermediate **Open course** action when the saved
setup is still valid.

### Responsibility split

- The launcher performs a fast, non-sensitive readiness check and selects the
  quiet returning path or the full setup path.
- The main process remains authoritative for persisted onboarding and Practice
  state.
- The renderer routes a completed onboarding state directly to Course.
- If an active Practice session exists, the existing Practice restoration flow
  restores it; the launcher does not inspect mission or task content.
- Setup and recovery remain explicitly reachable from the app for learners who
  need to repair or change their environment.

The readiness signal may contain only setup/version/prerequisite status. It
must not duplicate credentials, workspace content, mission state, or bound-task
data into the batch launcher.

### Invalidating readiness

The returning path is valid only while its setup/version stamp and required
runtime checks pass. A missing marker, incompatible version, or missing runtime
uses the full setup path. False negatives are acceptable because they recover
safely; false positives that open a broken app are not.

### Verification

Tests cover first run, valid returning run, stale readiness, and missing
prerequisite. A clean-install release gate still proves first-run behavior. A
second launch against the same app data must prove that the ceremony and
intermediate Course-opening action are skipped and that active Practice is
restored when present.

## Correction 3: diagnosable, safe Teacher failures

### Reproduce before changing the protocol

The implementation begins with a bounded real-runtime probe using the same
Teacher adapter and installed `codex app-server` binary. The probe:

- creates an ephemeral Teacher thread in the read-only Teacher working
  directory;
- starts a minimal, non-sensitive turn without tool access;
- waits for terminal success or failure;
- unsubscribes, interrupts unfinished work when necessary, and disposes the
  client;
- reports only the safe failing operation and stable category.

The first red result identifies whether the current failure occurs during
thread start, turn start, streamed completion, timeout, boundary validation,
or connection loss. The implementation then corrects that exact stage. It must
not change request fields speculatively when the installed schema already
accepts them.

### Internal error contract

The main-process Teacher boundary uses a stable internal shape such as:

```text
TeacherFailure {
  operation: thread-start | turn-start | turn-completion
  category: timeout | disconnected | boundary-violation | runtime-failure
}
```

Raw exception messages, JSON-RPC data, inputs, outputs, URLs, and environment
values remain behind the adapter boundary. Development/test diagnostics may
record only the stable operation and category.

### Learner-facing recovery

The orchestrator maps the internal failure to concise, actionable copy:

| Safe condition | Learner-facing behavior |
| --- | --- |
| Teacher thread could not start | “Teacher could not start a response. Retry.” |
| Turn could not start or complete | “Teacher response did not complete. Retry.” |
| Timeout | “Teacher is taking too long. Retry your message.” |
| Connection lost | “Teacher lost connection. Retry observation or restart Course App.” |
| Context boundary rejected | “Teacher could not use the current Practice context. Refresh observation and retry.” |

The learner's draft remains available after failure. Retry creates no duplicate
visible learner message. Vietnamese and English learner messages follow the
same path; the failure model does not attribute runtime errors to prompt
language.

### Compatibility boundary

Tests pin the subset of the installed App Server contract that Teacher uses:
thread creation fields, turn input shape, relevant notifications, terminal
turn states, and interrupt/disposal behavior. Documentation examples can guide
the implementation, but the locally installed schema and the bounded real
probe decide compatibility.

### Verification

- Unit tests exercise each safe operation/category mapping and confirm no raw
  protocol detail reaches the renderer.
- Adapter tests cover successful completion, each failing stage, timeout,
  unsubscribe, interrupt, and disposal.
- The bounded real-runtime probe must pass using the same request/event path as
  production.
- Electron smoke coverage submits a Teacher message, receives an answer in the
  happy path, and verifies retained input plus safe copy in a controlled error
  path.
- Real acceptance repeats “What should I do now?” in Vietnamese and verifies a
  grounded Teacher reply from the bound Executor context.

## Delivery order

The three corrections ship as one acceptance repair, implemented in this
order:

1. add the safe Teacher diagnostic contract and obtain a reproducible failing
   stage from the real probe;
2. fix and verify the exact Teacher runtime failure;
3. add the dedicated bubble grip and real drag acceptance;
4. make returning launch quiet and direct while preserving recovery;
5. run unit, smoke, clean-install first-run, returning-run, and real manual
   acceptance gates.

This order resolves the only unknown root cause before UI changes can obscure
it. The three changes remain independently testable and revertible.

## Acceptance gates

The correction is complete only when all of the following are true:

1. A learner can drag the 72 by 72 bubble using a visible grip and can still
   open chat using a 44-pixel-or-larger button.
2. A returning learner runs `start-course.cmd` once and reaches Course or the
   active Practice session without the first-run ceremony or an intermediate
   opening action.
3. A missing or stale prerequisite falls back to setup/recovery.
4. The real Teacher adapter answers from the explicitly bound, fresh Executor
   context.
5. Controlled failures identify a safe stage internally and show actionable
   recovery without leaking raw runtime detail.
6. Existing bound-task isolation, redaction, persistence, compact-window, and
   clean-install checks continue to pass.

## Explicit non-goals

This correction does not:

- merge Codex execution into the Course renderer;
- add arbitrary bubble dragging from the chat button itself;
- add a second learner launch command;
- redesign exercise content owned by Triết;
- expose a developer console or raw Teacher/App Server logs to learners;
- add grading, mastery judgment, proactive Teacher messages, or multiple active
  Practice missions.
