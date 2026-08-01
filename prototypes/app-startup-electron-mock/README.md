# Electron Startup Mock

## Purpose

This Windows-first prototype tests the repository startup and first-run setup
mechanism before the production Course App exists:

```text
short root command
  → permission-gated prerequisites
  → Electron
  → Codex connection
  → fixture setup form
  → resumable completion
```

It is separate from the existing Course Companion and contains no course
lessons.

## Ownership boundary

Duy owns this launcher, setup mechanism, Codex connection, persistence,
recovery behavior, and standalone setup UI. Triết owns the final onboarding
script, questions, explanations, labels, wording, sequence, and production
Course App UI.

The packaged form is deliberately marked **Non-production fixture**. It tests
the content interface; it is not a draft of Triết's onboarding.

## Prerequisites

- Windows 10 or newer;
- Git, because the learner already cloned the repository;
- `winget` only when Node.js must be installed automatically;
- internet access for approved package/runtime installation and real Codex
  authentication.

Node.js 22+, npm, Codex CLI, project packages, and the native Electron runtime
are detected by the startup flow.

## Run

From the repository root:

```powershell
.\start-course.cmd
```

No `ExecutionPolicy Bypass` flag is needed.

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
- exact installation plan, scope, reason, and one permission gate;
- repeat runs that skip installation when the lock and runtime match;
- secure Electron window with renderer sandbox and context isolation;
- Codex App Server JSONL lifecycle and request correlation;
- managed ChatGPT browser login and device-code fallback;
- allowlisted OpenAI/ChatGPT authentication URLs;
- cancellation, retry, disconnected, and sanitized failure states;
- display-safe account status;
- versioned fixture content rendering and response validation;
- atomic non-secret setup persistence and corrupt-state quarantine;
- restart/resume behavior.

## Simulated fixture behavior

- the onboarding fields and answer choices are neutral Duy-owned fixtures;
- the automated smoke test uses a local fake App Server and fixture account;
- `Continue to mock app` reaches a labeled empty mock destination.

The normal app path uses the real installed Codex App Server, not the fake
test server.

## Explicitly deferred

- Triết's production onboarding content;
- production Course App lessons, shell, and navigation;
- practice exercise content;
- real Teacher inference;
- Practice Mode activity monitoring;
- Executor-thread binding;
- tray icon or always-on-top Teacher chat;
- packaging, signing, auto-update, and distribution;
- macOS and Linux launchers;
- cloud persistence, capture, or voice interaction.

## Data stored

Electron stores only this versioned setup state under its per-user `userData`
directory:

- setup-completed flag;
- cached display-only Codex-connected flag;
- validated fixture responses;
- last-updated timestamp.

The connection flag is not proof of authentication. Every launch rechecks the
account through `account/read`.

If local state is corrupt or violates the schema, the file is renamed to
`setup-state.corrupt-<timestamp>.json`, safe defaults are loaded, and the UI
receives a non-secret recovery notice.

## Data never stored or exposed

The mock does not read, log, return to the renderer, or persist:

- access or refresh tokens;
- API keys;
- `~/.codex/auth.json`;
- raw environment variables;
- raw App Server messages;
- browser-login authentication URLs;
- unrelated repositories, windows, or conversations.

Codex owns managed authentication credentials and refresh.

## Manual recovery

Run only the command relevant to the reported layer:

```powershell
winget install --id OpenJS.NodeJS.LTS
npm install -g @openai/codex@latest
cd prototypes\app-startup-electron-mock
npm ci
npx --no-install install-electron --no
```

Then return to the repository root and rerun:

```powershell
.\start-course.cmd
```

Launcher exit codes:

| Code | Meaning |
|---:|---|
| `0` | App exited normally |
| `2` | Installation declined or manual prerequisite required |
| `3` | System/user prerequisite failed |
| `4` | Project packages or Electron runtime failed |
| `5` | Electron exited unexpectedly |

## Tests

From this directory:

```powershell
npm ci
npx --no-install install-electron --no
npm run check
```

`npm run check` runs the Node unit contracts and a Playwright Electron smoke
flow with an isolated temporary profile and local fake App Server. It completes
setup, closes the app, relaunches it, and verifies response resume.

## Real-authentication checklist

On Windows with a current Codex CLI:

1. run `.\start-course.cmd`;
2. reach **Connect Codex**;
3. if already signed in, confirm display-safe account status;
4. otherwise complete the official browser login;
5. return to Electron;
6. confirm only account type, email, and plan fields are displayed when
   available;
7. complete the fixture form;
8. close and restart;
9. confirm fixture responses resume and authentication is re-read.

Record versions and pass/fail only. Never record the email address, one-time
code, authentication URL, token, or raw App Server payload.

### Latest local checkpoint

Recorded 30 July 2026:

```text
Windows version: 10.0.26200.8875
Node version: 24.13.0
Codex version: 0.139.0
Electron version: 43.2.0
Authentication path: existing managed ChatGPT session
Account re-read after restart: pass
Fixture restart/resume: pass
Credential output observed: no
```
