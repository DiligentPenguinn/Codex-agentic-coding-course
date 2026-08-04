# Electron Startup and Practice Mode Mock

## Purpose

This Windows-first prototype tests the repository startup, first-run setup, and
one Practice Mode awareness slice before the production Course App exists:

```text
short root command
  → permission-gated prerequisites
  → Electron
  → Codex connection
  → non-production setup fixture
  → same-window Course-to-Practice transition
  → one explicitly bound Codex task
  → bounded Teacher awareness
```

The Module 0 mission is a **non-production mock adaptation** of the existing
ContentPilot Lite read-only inspection exercise. It tests Duy-owned Practice
Mode mechanics. It is not production course content, and its wording is not
presented as approved production content from Triết.

## Ownership boundary

Duy owns this launcher, setup mechanism, Codex connection, Practice session
lifecycle, task binding and observation, Teacher context boundary, persistence,
recovery behavior, and prototype UI. Triết owns production onboarding and
exercise content, learning outcomes, evidence and evaluation criteria,
sequencing, labels, wording, and the production Course App UI.

The setup form is deliberately marked **Non-production fixture**. The Practice
mission metadata is deliberately marked `mock-adaptation` with
`productionApproved: false`, `sourceOwner: "Triết"`, and
`mechanismOwner: "Duy"`.

## Prerequisites

- Windows 10 or newer;
- Git, because the learner already cloned the repository;
- `winget` only when Node.js must be installed automatically;
- internet access for approved package/runtime installation and real Codex
  authentication.

Node.js 22+, npm, Codex CLI, Codex App Server, project packages, and the pinned
Electron runtime are detected by the startup flow.

## Run the prototype

From the repository root:

```powershell
.\start-course.cmd
```

No `ExecutionPolicy Bypass` flag is needed. Complete setup, choose
**Continue to mock app**, and then choose **Start Practice**. Practice Mode
creates and verifies an empty dedicated task named
`Practice · Module 0 · Read-only inspection`. The learner writes and submits
the first exercise prompt in Codex; the Course App does not submit it.

## What installation may occur

The terminal displays one plan before running any missing action:

```text
Node.js:
winget install --id OpenJS.NodeJS.LTS

Codex CLI:
npm install -g @openai/codex@latest

Locked mock packages:
npm ci

Pinned Electron native runtime:
npx --no-install install-electron --no
```

The Node installation has a separate bootstrap prompt because Node must exist
before the combined Node-based plan can run. Every displayed plan requires
`Y` or `Yes`. Declining runs no proposed command.

## Implemented behavior

- Windows-native `.\start-course.cmd`;
- Node.js 22+, npm, Codex CLI, Codex App Server, lockfile, and Electron runtime
  detection;
- exact installation plan, scope, reason, and permission gate;
- repeat runs that skip installation when the lock and runtime match;
- secure Electron windows with renderer sandboxing and context isolation;
- Codex App Server lifecycle, request correlation, managed authentication, and
  sanitized failure states;
- versioned fixture content, atomic non-secret setup persistence, corrupt-state
  quarantine, and restart/resume behavior;
- one versioned Module 0 mock-adaptation mission;
- same-window Course-to-Practice transition;
- Exercise and Teacher chat tabs with shared Executor freshness;
- dedicated App Server task creation, naming, verification, binding, and
  canonical Codex deep link;
- eligible same-workspace existing-task fallback;
- strict bound-task-only prompt, response, read-action, and changed-file
  awareness;
- bounded Teacher context receipt and guarded ephemeral real Teacher adapter;
- draggable always-on-top Teacher bubble and quick-chat popover;
- restart revalidation, stale/disconnected disclosure, retry, pause, and
  explicit rebind.

The awareness slice does not judge mastery, grade evidence, or complete the
exercise. Executor status is informational, and changed-file awareness is not
an evaluation result.

## Simulated fixture behavior

- the onboarding fields and answer choices are neutral Duy-owned fixtures;
- the Module 0 Practice mission is a non-production mock adaptation used to
  exercise the mechanism;
- automated unit and Electron smoke tests use a local fake App Server for the
  account, bound Executor, unbound decoy, and Teacher events;
- the fake Executor and Teacher responses are deterministic test data, and the
  fake decoy proves that unbound-task activity is excluded.

The normal application path does not use those fake events. It connects to the
installed Codex App Server for account and Executor task behavior and invokes
the guarded ephemeral real Teacher adapter with a bounded context envelope.
That real path still requires the manual checkpoint below on the installed
desktop build; automated success is not proof that the real adapter checkpoint
passed.

## Explicitly deferred

- production Course App integration and production course or exercise content;
- mastery assessment, exercise completion, and evidence or rubric grading;
- proactive coaching, hint ladders, and approval steering;
- multiple missions and exercises;
- tray integration;
- cloud persistence;
- packaging, signing, auto-update, and distribution;
- macOS and Linux launchers;
- capture and voice interaction.

## Setup data stored

Electron stores only this versioned setup state under its per-user `userData`
directory:

- setup-completed flag;
- cached display-only Codex-connected flag;
- validated fixture responses;
- last-updated timestamp.

The connection flag is not proof of authentication. Every launch rechecks the
account through the Codex App Server. If local setup state is corrupt or
violates the schema, it is quarantined, safe defaults are loaded, and the UI
receives a non-secret recovery notice.

## Practice data stored

Practice state is stored under Electron's per-user application-data directory,
not in the learner's repository. It contains only:

- session and course identifiers;
- pinned mission content version and safe display content;
- verified Executor binding;
- observation cursor and bounded activity summary;
- bounded active Teacher-chat messages for the current session;
- last full tab;
- main-window, bubble, and popover positions;
- last verified freshness metadata.

Writes are schema-validated and atomic. Corrupted Practice state is quarantined
and replaced with a safe default. Authentication, task existence, workspace,
and binding are revalidated on startup; cached state is never proof of current
connectivity.

## Practice data never stored

Practice state never persists:

- Codex or model credentials;
- raw environment variables;
- unrestricted Executor transcripts;
- content from unbound tasks;
- raw App Server protocol logs;
- hidden reasoning;
- unrelated repository or window content.

Renderers receive narrow, display-safe view models rather than unrestricted
task or provider data. Codex owns managed authentication credentials and
refresh.

## Recovery

Use the recovery that matches the visible state:

- **Stale context:** select **Retry observation**. If freshness does not return,
  reconnect the App Server and retry. Until the status is fresh, the Teacher
  must disclose the context age and must not claim current awareness.
- **Missing bound task:** Practice Mode marks the session disconnected and does
  not silently substitute another task. Select **Rebind task**, then create a
  dedicated task or explicitly choose an eligible existing task.
- **Wrong workspace:** Practice Mode rejects the task and excludes it from the
  eligible-task picker. Create the dedicated task in the repository workspace
  or choose a verified recent task shown for that workspace.
- **Named-task fallback:** **Open in Codex** uses
  `codex://threads/<verified-threadId>`. If the installed desktop build cannot
  focus that task, locate the exact displayed task name in Codex. The verified
  binding remains active. If the named task is not discoverable at all, stop
  the real checkpoint and report the adapter gate as failed.
- **Corrupt local state:** rerun the app after it quarantines the invalid state;
  Practice Mode starts from a safe default and does not infer a binding.

To repair a launcher prerequisite, run only the command relevant to the
reported layer:

```powershell
winget install --id OpenJS.NodeJS.LTS
npm install -g @openai/codex@latest
cd prototypes\app-startup-electron-mock
npm ci
npx --no-install install-electron --no
```

Then return to the repository root and rerun `.\start-course.cmd`.

Launcher exit codes:

| Code | Meaning |
|---:|---|
| `0` | App exited normally |
| `2` | Installation declined or manual prerequisite required |
| `3` | System or user prerequisite failed |
| `4` | Project packages or Electron runtime failed |
| `5` | Electron exited unexpectedly |

## Automated release gate

From `prototypes\app-startup-electron-mock`:

```powershell
npm ci
npx --no-install install-electron --no
npm run check
```

`npm run check` runs the complete Node unit suite and then the Playwright
Electron smoke test. The smoke flow uses an isolated temporary profile and the
local fake App Server. It exercises setup, the same-window Practice transition,
the bound-task-only awareness boundary, Teacher chat, compact mode, and restart
revalidation. Passing this gate proves the automated fixture path only.

## Real Codex desktop checkpoint

This is a manual acceptance gate for the installed Codex/ChatGPT desktop build.
Do not record it as passed unless every applicable item has been observed on
the real path:

1. From the repository root, run `.\start-course.cmd` and reach Practice Mode
   through the normal setup flow.
2. Confirm **Start Practice** creates
   `Practice · Module 0 · Read-only inspection` in the repository workspace.
3. Confirm **Open in Codex** focuses that exact verified task through the
   canonical deep link, or follow the truthful named-task fallback above.
4. Confirm the task composer is empty and Practice Mode did not submit a first
   prompt.
5. In Codex, author and send a read-only inspection prompt for the fixture.
6. Under normal local conditions, confirm Practice Mode shows **Working** and
   then **Response ready** within 10 seconds.
7. Create a second Codex task with visibly different decoy activity.
8. Ask the Teacher what the bound Executor was asked, which constraints it
   followed, what it reported, and whether files changed.
9. Confirm the Teacher reports only the bound task, accurately describes its
   prompt, constraints, report, and changed-file result, and omits the decoy.
10. Confirm **Compact to Teacher** hides the main window, shows one draggable
    bubble, opens quick chat, and **Expand Practice** restores the Teacher tab.
11. Disconnect or stop the App Server and confirm Practice Mode discloses stale
    or disconnected state without claiming current awareness.
12. Restart the Course App and confirm the mission, verified task, and bounded
    Teacher chat return only after binding revalidation.
13. Inspect the visible UI and application output for privacy-boundary
    violations. Record pass/fail only; do not record private account,
    conversation, authentication, provider, machine, or unrelated-task data.

If the created task is not visible in the installed desktop build, stop this
checkpoint. Preserve the UI and contracts, report the real adapter gate as
failed, and do not claim that the complete slice passed acceptance.
