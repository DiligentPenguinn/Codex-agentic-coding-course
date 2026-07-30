# Electron Startup Mock Design

**Status:** Approved design; implementation not started | **Date:** 30 July 2026 | **Primary implementation owner:** Duy | **Content owner:** Triết | **Target:** Windows-first local prototype

## Purpose

Build a new, minimal Electron application that validates the course startup
experience before the production Course App exists.

The prototype must prove that a learner can:

1. clone the repository;
2. run one short command;
3. understand and approve any missing prerequisite installation;
4. launch an app interface;
5. connect a ChatGPT/Codex subscription through Codex App Server;
6. complete a fixture-based first-run form;
7. restart without losing non-secret setup progress.

The mock is separate from the existing Course Companion prototype. It is
intended to become a technical foundation for Duy's later Practice Mode
mechanism, including the Teacher chat window or tray icon.

## Workload boundary

This design follows:

- [Team Workload Boundaries](../../planning/team-workload-boundaries.md)
- [ADHD-Friendly Workload Quick Reference](../../planning/team-workload-quick-reference.md)

### Duy owns

- the repository launcher;
- prerequisite detection and permission prompts;
- installation orchestration;
- Electron process and window lifecycle;
- Codex App Server lifecycle and authentication orchestration;
- first-run form mechanics;
- validation and non-secret setup persistence;
- disconnected, retry, cancellation, error, and recovery behavior;
- UI/UX outside the production Course App;
- the clearly labeled fixture content needed to test the mechanism.

### Triết owns

- final onboarding script;
- final onboarding questions;
- explanations, labels, wording, and sequence;
- UI/UX presentation when the setup mechanism is embedded inside the
  production Course App;
- final Course App entry and post-setup destination.

### Shared review

The root launcher is a Duy-side prototype decision. Because it becomes a
shared repository entry point, Triết reviews the command and handoff before the
team treats it as the final production Course App launcher.

The fixture content is not a draft of Triết's onboarding content. It exists
only to exercise Duy's technical form contract.

## Approved decisions

- Build a new minimal mock rather than modifying the current Course Companion.
- Use Electron so the startup work can evolve into Practice Mode, a tray icon,
  and a Teacher chat window without changing application shells later.
- Target Windows first.
- Use a short root command: `.\start-course.cmd`.
- Do not require `ExecutionPolicy Bypass`.
- Detect missing prerequisites before installing anything.
- Explain the exact proposed installations and ask permission.
- Keep installation and app launch in the terminal bootstrap.
- Put Codex login and first-run interaction in the Electron UI.
- Use real Codex authentication through Codex App Server.
- Let Codex own and refresh credentials.
- Never read, copy, display, or persist raw Codex credentials.
- Use a fixed-form mechanism with clearly labeled fixture content.
- Store only non-secret setup state in Electron's per-user data directory.
- Allow the mock to open in a disconnected state when Electron can run but
  Codex is unavailable.

## User experience

### README path

```powershell
git clone https://github.com/DiligentPenguinn/codex-content-creator-course.git
cd codex-content-creator-course
.\start-course.cmd
```

The learner sees no PowerShell execution-policy flags.

### Terminal responsibility

The terminal performs only:

```text
detect prerequisites
  → list missing or incompatible items
  → ask permission
  → install approved items
  → install locked project dependencies
  → launch Electron
```

The terminal does not ask teaching questions or handle ChatGPT credentials.

### Electron responsibility

After Electron opens, the app UI performs:

```text
Checking setup
  → Connect Codex
  → official browser authentication when required
  → return to Electron
  → fixture teaching-setup form
  → Setup complete
```

The external browser appears only for an official OpenAI authentication page.
The learner returns to Electron after the Codex callback completes.

## System architecture

```text
start-course.cmd
├── verify Windows
├── verify winget
├── locate a compatible Node.js
├── ask before installing Node.js
└── start scripts/setup-and-start.mjs

scripts/setup-and-start.mjs
├── detect Node.js, npm, Codex CLI, and project packages
├── build an installation plan
├── ask permission before executing the plan
├── install approved prerequisites
├── install package-lock dependencies
├── refresh executable paths for the current process
└── launch the Electron mock

Electron main process
├── own application and window lifecycle
├── spawn and supervise codex app-server
├── speak JSONL over app-server stdio
├── orchestrate authentication
├── validate external authentication URLs
├── own setup-state persistence
└── expose a narrow IPC API

Electron preload
└── expose only approved setup and authentication operations

Electron renderer
├── render first-run states
├── request operations through preload
├── validate learner-visible form requirements
└── never access Node.js, child processes, or credentials
```

## Repository layout

```text
start-course.cmd
scripts/
└── setup-and-start.mjs

prototypes/
└── app-startup-electron-mock/
    ├── package.json
    ├── package-lock.json
    ├── README.md
    ├── content/
    │   └── onboarding.fixture.json
    ├── src/
    │   ├── main/
    │   │   ├── main.mjs
    │   │   ├── codex-app-server-client.mjs
    │   │   └── setup-store.mjs
    │   ├── preload/
    │   │   └── preload.mjs
    │   └── renderer/
    │       ├── index.html
    │       ├── app.js
    │       └── styles.css
    └── tests/
        ├── setup-detection.test.mjs
        ├── app-server-client.test.mjs
        ├── setup-store.test.mjs
        └── onboarding-state.test.mjs
```

The mock owns its Electron dependencies and lockfile. The root launcher
delegates to the mock rather than turning the repository root into an Electron
package.

## Launcher contract

### Checks

The launcher checks:

- Windows;
- `winget`;
- Node.js 22 or newer;
- npm;
- `codex`;
- `codex app-server`;
- the mock package lock;
- whether installed project dependencies match the package-lock fingerprint.

Git is not an install target because the learner already used Git to obtain
the repository. The launcher may still report an unusual Git state as
diagnostic information.

### Installation plan

Before changing the system, the launcher prints one plan containing:

- each missing or incompatible prerequisite;
- why it is required;
- the exact command that will run;
- whether the change is system-level, user-level, or project-local.

One explicit confirmation authorizes only the displayed plan.

Approved installation routes:

- Node.js LTS: `winget install --id OpenJS.NodeJS.LTS`;
- Codex CLI: `npm install -g @openai/codex@latest`;
- mock dependencies: `npm ci` in the mock directory.

Package and source agreement flags may be passed to `winget` only after the
learner approves the displayed plan.

### Decline behavior

If the learner declines:

- do not run any proposed installation;
- do not modify system configuration;
- show the exact manual commands;
- explain which parts of the mock can or cannot start;
- exit with a distinct, documented status code when Electron cannot run.

If Electron and its project packages are ready but Codex is missing, the
launcher may open the mock in disconnected mode.

### Repeat-run behavior

Later runs:

- reuse compatible Node.js and Codex installations;
- skip project installation when the lockfile fingerprint matches;
- run `npm ci` when the lockfile fingerprint changes;
- preserve setup state;
- launch Electron directly when all checks pass.

The launcher does not silently upgrade a compatible Codex installation.
Electron can recommend an update when required App Server methods are missing.

### Missing package manager

When `winget` is unavailable:

- do not attempt an alternate silent package manager;
- show the official manual installation path;
- stop if Node.js is required;
- continue only when the existing prerequisites are sufficient.

## Codex App Server integration

Codex App Server is the credential and agent boundary. Electron spawns:

```text
codex app-server
```

using stdio transport and exchanges newline-delimited JSON messages.

### Initialization

The main process:

1. starts the child process;
2. listens to stdout by line;
3. sends `initialize` with mock client metadata;
4. sends the `initialized` notification;
5. calls `account/read`.

No other request is sent before initialization completes.

### Authentication state

Electron sends:

```json
{
  "method": "account/read",
  "params": {
    "refreshToken": false
  }
}
```

The UI distinguishes:

- OpenAI authentication not required by the active provider;
- authentication required and no account connected;
- ChatGPT account connected;
- API-key account connected;
- unreadable or unavailable account state.

The mock's primary path is ChatGPT-managed authentication. It does not ask the
learner to paste an API key.

### Browser login

Electron starts managed browser login with:

```json
{
  "method": "account/login/start",
  "params": {
    "type": "chatgpt",
    "useHostedLoginSuccessPage": true,
    "appBrand": "chatgpt"
  }
}
```

The main process:

1. receives `loginId` and `authUrl`;
2. validates that the URL is HTTPS and its hostname equals `chatgpt.com` or
   `auth.openai.com`, or ends with `.chatgpt.com` or `.auth.openai.com`;
3. opens the URL with Electron's external-browser API;
4. waits for the matching `account/login/completed` notification;
5. listens for `account/updated`;
6. calls `account/read` again;
7. returns only display-safe account information to the renderer.

### Device-code fallback

If the browser callback is unavailable, Electron can start:

```json
{
  "method": "account/login/start",
  "params": {
    "type": "chatgptDeviceCode"
  }
}
```

The renderer shows the verification URL and one-time user code. The main
process still owns the App Server request and completion notification.

### Cancellation and process loss

- User cancellation calls `account/login/cancel` with the active `loginId`.
- App Server exit changes the UI to disconnected.
- Pending requests reject with a typed connection error.
- Electron can restart App Server and re-run initialization and
  `account/read`.
- The mock never treats cached UI state as proof of authentication.

### Credential rule

The application must not:

- read `~/.codex/auth.json`;
- import Codex tokens;
- copy Hermes' credential-store approach;
- expose raw App Server messages to the renderer;
- persist access tokens, refresh tokens, API keys, raw environment variables,
  or authentication URLs;
- log credentials or complete authentication payloads.

Codex owns managed ChatGPT OAuth, token persistence, and refresh.

## Electron first-run states

### 1. Checking setup

Show:

- app version;
- Codex availability;
- App Server connection;
- last setup timestamp when present.

Transitions:

- ready → Connect Codex;
- Codex unavailable → disconnected action state;
- App Server failed → retry or update guidance.

### 2. Connect Codex

States:

- checking;
- already connected;
- signed out;
- opening browser;
- waiting for callback;
- device-code fallback;
- cancelled;
- failed;
- connected.

Connected display may include the email and plan type returned by
`account/read`. Missing values are omitted rather than guessed.

### 3. Teaching setup

The renderer:

- loads a versioned content document;
- displays a visible fixture badge;
- renders supported field types;
- validates required responses;
- sends only validated responses to the main process;
- allows returning to the prior screen without losing entered values.

### 4. Setup complete

Show:

- prerequisite readiness;
- current Codex connection state;
- fixture-form completion;
- a way to reopen setup;
- a button to continue to a clearly labeled mock destination.

The production Course App destination is outside this prototype.

## Onboarding content interface

The mechanism consumes a versioned document shaped like:

```json
{
  "schemaVersion": 1,
  "contentKind": "fixture",
  "contentOwner": "Duy mock fixture",
  "title": "Sample teaching setup",
  "notice": "Fixture content for testing the setup mechanism.",
  "fields": [
    {
      "id": "sample-field",
      "type": "singleChoice",
      "label": "Sample question",
      "required": true,
      "options": [
        {
          "value": "sample-option",
          "label": "Sample answer"
        }
      ]
    }
  ]
}
```

The prototype may support only:

- short text;
- single choice;
- multiple choice.

Adding new content must not require changes to authentication or persistence.
Adding a new field type is a mechanism change owned by Duy.

Triết later supplies a document with the agreed schema and owns all
learner-facing content within it.

## Persistence

Use Electron's per-user application-data directory. Do not write learner setup
state into the repository.

Stored state:

```json
{
  "schemaVersion": 1,
  "setupCompleted": true,
  "codexConnected": true,
  "onboardingResponses": {},
  "updatedAt": "2026-07-30T00:00:00.000Z"
}
```

Rules:

- `codexConnected` is cached display state only;
- authentication is rechecked with `account/read`;
- writes are atomic;
- schema validation occurs on read and write;
- unknown fields are ignored or rejected according to the schema policy;
- corrupted state is quarantined and replaced with a safe default;
- the UI explains that local setup progress was reset;
- no credential-shaped field is accepted.

## Electron security boundary

Browser window requirements:

- `nodeIntegration: false`;
- `contextIsolation: true`;
- renderer sandbox enabled;
- navigation restricted to the packaged renderer;
- new-window creation denied by default;
- external URLs opened only after main-process validation.

Preload exposes a narrow API for:

- reading display-safe setup status;
- starting or cancelling managed login;
- requesting device-code login;
- submitting validated fixture responses;
- reopening setup;
- retrying App Server connection.

Preload does not expose:

- generic IPC send or invoke;
- filesystem paths;
- shell execution;
- child-process access;
- environment variables;
- raw App Server requests;
- raw credentials.

The Codex child process terminates when the app exits. Expected shutdown noise
is not presented as an authentication failure.

## Failure and recovery behavior

| Failure | User-visible behavior | Recovery |
|---|---|---|
| Node.js missing | Terminal lists Node.js and asks permission | Install with `winget` or use the shown manual path |
| `winget` missing | Terminal explains automatic install is unavailable | Install Node.js manually, then rerun |
| Project packages missing | Terminal asks before `npm ci` | Approve or run the shown command manually |
| Codex missing | Terminal offers installation; Electron may open disconnected | Install Codex and retry |
| App Server method unavailable | App shows incompatible Codex version | Approve or manually run the update command |
| App Server exits | App shows disconnected with last known display state | Restart connection |
| Browser callback fails | App keeps the login pending state bounded | Use device-code fallback or cancel |
| Login cancelled | App remains signed out | Restart login |
| Login error | App shows sanitized error text | Retry or use fallback |
| Fixture invalid | App refuses to render unsafe or ambiguous fields | Restore the packaged valid fixture |
| Stored state corrupt | App reports local progress reset | Start from safe defaults |
| Electron crashes | Terminal receives a non-zero exit | Rerun `.\start-course.cmd` |

Errors must name the failed layer: bootstrap, prerequisite, project packages,
Electron, App Server, authentication, fixture, or local state.

## Testing strategy

### Launcher tests

Use dependency-injected command detection and execution so tests can simulate:

- compatible Node.js and Codex;
- missing Node.js;
- missing Codex;
- missing `winget`;
- declined installation;
- command failure;
- changed and unchanged package-lock fingerprints.

Tests assert that no installation command runs before permission.

### App Server client tests

Use a fake JSONL child process to verify:

- initialization ordering;
- request ID correlation;
- `account/read`;
- browser-login start;
- device-code start;
- matching login completion;
- cancellation;
- `account/updated`;
- malformed JSON;
- unexpected notifications;
- child exit with pending requests;
- restart and reinitialization.

### Persistence tests

Verify:

- first-run defaults;
- atomic writes;
- valid resume;
- schema-version handling;
- corrupted-state quarantine;
- rejection of credential-shaped fields;
- cached connection state never bypasses `account/read`.

### Renderer state tests

Cover:

- checking;
- disconnected;
- signed out;
- signing in;
- waiting for callback;
- device-code fallback;
- cancelled;
- failed;
- connected;
- invalid form;
- completed setup;
- reopened setup.

### Electron smoke test

Launch Electron with a fake App Server and complete:

```text
checking
  → signed out
  → simulated managed login
  → connected
  → fixture form
  → setup complete
  → restart
  → resumed setup
```

The smoke test must not require a real ChatGPT account.

### Manual real-authentication check

On a Windows machine with a current Codex CLI:

1. start from the root command;
2. reach Connect Codex;
3. complete official browser login;
4. return to Electron;
5. confirm display-safe account information;
6. complete the fixture form;
7. close and restart;
8. confirm non-secret progress resumes;
9. confirm authentication is rechecked without exposing credentials.

## Acceptance criteria

The startup mock is complete when:

1. a Windows learner with Git can begin with `.\start-course.cmd`;
2. the launcher requires no PowerShell execution-policy bypass;
3. no prerequisite installation occurs before explicit permission;
4. declined installation produces exact manual recovery commands;
5. Electron owns the visible first-run experience;
6. real ChatGPT subscription login runs through Codex App Server;
7. browser login and device-code fallback are both represented;
8. the renderer cannot access Node.js, child processes, or raw App Server
   messages;
9. no authentication credential is read or stored by the mock;
10. non-secret setup state survives restart;
11. a corrupted local state has a visible, safe recovery path;
12. the fixture is visibly marked as non-production content;
13. Triết can replace fixture content through the versioned content interface;
14. automated tests cover launcher permission gates, App Server protocol,
    persistence, and renderer states;
15. an Electron smoke test passes with a fake App Server;
16. the manual Windows authentication check passes;
17. README documentation distinguishes implemented, simulated, and deferred
    behavior.

## Explicit non-goals

This prototype does not implement:

- production Course App lessons or navigation;
- Triết's final onboarding script;
- production practice exercises;
- a real Teacher model response;
- Practice Mode activity monitoring;
- Executor thread binding;
- tray-icon behavior;
- always-on-top Teacher chat;
- production packaging, signing, auto-update, or distribution;
- macOS or Linux launchers;
- cloud persistence;
- screen capture;
- voice interaction.

Electron is chosen so Practice Mode and tray behavior can be added later, but
those features are not part of this startup slice.

## Sources

- [OpenAI Codex App Server](https://developers.openai.com/codex/app-server)
- [OpenAI Codex CLI setup](https://help.openai.com/en/articles/11096431)
- [Course Companion technical workflow](../../architecture/course-companion-technical-workflow.md)
