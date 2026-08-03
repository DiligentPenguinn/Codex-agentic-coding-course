# Practice Mode Awareness Prototype Design

**Status:** Approved design; ready for implementation planning | **Date:** 3 August 2026 | **Primary implementation owner:** Duy | **Content owner:** Triết | **Target:** Windows-first local prototype

## Purpose

Extend the existing Electron startup prototype into the first Practice Mode
vertical slice. The slice tests one architectural claim:

> The Teacher can accurately describe activity from one explicitly bound Codex
> Executor task while excluding activity from every unbound task.

This is an **awareness** prototype. It does not judge mastery, grade evidence,
or complete the course exercise. The architecture in this document takes
priority over older module mechanics when they disagree.

The prototype must prove that a learner can:

1. enter Practice Mode from the Course window without moving to a second full
   application window;
2. create and bind a clean, dedicated Codex task from Practice Mode;
3. perform the exercise in the Codex desktop app;
4. see quiet, current Executor status in Practice Mode or its compact Teacher
   bubble;
5. ask the Teacher what happened and receive an answer grounded only in the
   bound task;
6. recover the session safely after a restart, stale connection, or missing
   task.

## Authority and workload boundary

This design follows:

- [Team Workload Boundaries](../../planning/team-workload-boundaries.md)
- [Course Companion Technical Workflow](../../architecture/course-companion-technical-workflow.md)
- [Electron Startup Mock Design](2026-07-30-electron-startup-mock-design.md)

When older course material assumes a different runtime, this design's
architecture and trust boundaries win. Existing content is used only as a
test fixture.

### Duy owns

- the Practice Mode session lifecycle;
- the main-window transformation and compact Teacher surface;
- Codex App Server lifecycle and task creation, discovery, binding, and
  observation;
- scoped Teacher context, freshness, provenance, redaction, and persistence;
- the Teacher adapter and deterministic test double;
- disconnected, stale, retry, resume, and rebind behavior;
- fixture packaging needed to test the mechanism.

### Triết owns

- production exercise descriptions, outcomes, instructions, constraints,
  expected evidence, and evaluation criteria;
- production lesson sequencing and the point at which a lesson starts
  Practice Mode;
- final learner-facing course copy.

### Shared review

The versioned Practice Mode entry contract, shared terminology, transition
from theory to practice, and privacy boundary require joint review before the
prototype becomes a production Course App integration.

## Mock mission

The prototype adapts the existing Module 0 ContentPilot Lite read-only
inspection exercise because it produces a clear interaction:

```text
Learner writes a scoped prompt
  → Executor inspects ContentPilot Lite without editing
  → Executor returns a structured report
  → Learner asks Teacher what the Executor did
  → Teacher answers from the bound task only
```

The fixture points at:

```text
prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite/
```

Its expected interaction includes:

- a learner-authored prompt with the target path;
- explicit read-only constraints;
- no edits, installs, or network access;
- a report summarizing structure, important files, risks, and possible next
  steps;
- a second, unbound Codex task containing decoy activity.

The fixture metadata must identify it as:

```json
{
  "contentKind": "mock-adaptation",
  "source": "existing Module 0 ContentPilot Lite inspection exercise",
  "sourceOwner": "Triết",
  "mechanismOwner": "Duy",
  "productionApproved": false
}
```

The prototype must not silently rewrite this fixture into production course
content or imply that Triết approved its current wording.

## Design principles

Research into adjacent products led to these principles:

1. **Keep the exercise beside the work.** Hyperskill keeps task descriptions
   available in the IDE, and DataCamp separates context, instructions, hints,
   submission, and feedback. Practice Mode therefore keeps a dedicated
   Exercise tab instead of hiding the brief inside Teacher chat.
2. **Preserve context across the handoff.** Scrimba's interactive transitions
   and Khanmigo's contextual launcher reduce reorientation. The Course window
   therefore transforms into Practice Mode and remembers the active mission.
3. **Keep agent state visible but quiet.** Replit, Cursor, and GitHub expose
   agent progress without turning every event into a message. The bubble uses
   a small state ring; proactive Teacher chatter is outside this slice.
4. **Separate status from unread communication.** Messenger-style launchers
   reserve numbered badges for unread messages. Executor state uses color and
   a symbol, while unread Teacher messages alone use a number.
5. **Make the compact surface reversible.** Compact mode is a lightweight
   companion beside Codex, not a new application destination. One action
   restores the full Practice Mode to the Teacher tab.
6. **Keep learner agency at the handoff.** Practice Mode creates an empty Codex
   task, but the learner writes and submits the first prompt in Codex.

Reference products and documentation:

- [Hyperskill task descriptions in IDEs](https://hyperskill.org/learn/step/53354)
- [DataCamp coding exercise anatomy](https://instructor-support.datacamp.com/en/articles/2347523-coding-exercise-anatomy)
- [Scrimba interactive learning model](https://scrimba.com/articles/scrimba-vs-mimo-which-coding-platform-should-you-choose/)
- [Khanmigo contextual access](https://support.khanacademy.org/hc/en-us/articles/13982530363533-Where-can-I-access-Khanmigo-while-working-on-Khan-Academy)
- [Replit Project Editor](https://docs.replit.com/learn/projects-and-artifacts/project-editor)
  and [task board](https://docs.replit.com/references/agent/task-board)
- [Cursor Agent](https://docs.cursor.com/chat/overview) and
  [review interface](https://docs.cursor.com/en/agent/review)
- [GitHub Copilot agent sessions](https://docs.github.com/en/enterprise-cloud%40latest/copilot/how-tos/copilot-on-github/use-copilot-agents/manage-and-track-agents)
- [Intercom Messenger launcher](https://www.intercom.com/help/en/articles/6612589-set-up-and-customize-the-messenger)
- [Frontend Mentor challenge stages](https://www.frontendmentor.io/guides/how-to-start-a-challenge)

## Product surfaces

The learner uses two applications but only one full course window:

```text
Course Electron application
├── Main Course/Practice BrowserWindow
│   ├── Course state
│   ├── Practice: Exercise tab
│   └── Practice: Teacher chat tab
├── Compact Teacher bubble BrowserWindow
└── Teacher quick-chat popover BrowserWindow

Codex desktop application
└── One explicitly bound Executor task
```

Practice Mode and the Course App are modes of the same Electron application,
not separate applications. The Codex desktop app remains the execution
surface.

At most one course surface is prominent:

- full Practice Mode hides the bubble and popover;
- compacting hides the main window and shows the bubble;
- opening quick chat keeps the main window hidden;
- expanding quick chat closes the compact surfaces and restores the main
  window on the Teacher tab.

## System architecture

```text
Course/Practice renderer
  ↕ narrow, typed IPC ViewModels
Electron main process
├── PracticeOrchestrator
├── MissionRepository
├── ExecutorConversationService
│   └── CodexAppServerClient
├── ExecutorActivityReader
├── TeacherContextBroker
├── TeacherAdapter
├── PracticeStateStore
└── WindowCoordinator
       ↕
Codex App Server
       ↕
Codex desktop task identified by threadId
```

### Main-process responsibilities

The main process is the trust boundary. It:

- validates the practice-start request and pinned mission content;
- creates, names, verifies, binds, observes, and revalidates Codex tasks;
- filters all Executor activity by the explicit bound `threadId`;
- creates bounded, display-safe activity snapshots;
- assembles and redacts Teacher context envelopes;
- invokes the real or fake Teacher adapter;
- persists non-secret session state atomically;
- coordinates full, bubble, and popover windows;
- exposes only narrow operations and safe ViewModels to renderers.

### Renderer responsibilities

Renderers:

- display supplied mission content and Practice state;
- request approved actions through preload;
- collect Teacher chat input;
- never connect directly to App Server or a model provider;
- never receive credentials, raw environment variables, unrestricted task
  transcripts, raw App Server messages, or hidden reasoning.

Every Practice window uses:

- `nodeIntegration: false`;
- `contextIsolation: true`;
- renderer sandboxing;
- navigation restricted to packaged content;
- new-window creation denied by default;
- no generic IPC, filesystem, shell, child-process, or App Server bridge.

### Teacher boundary

The Teacher is a separate inference path behind `TeacherAdapter`. It receives
only the versioned context envelope produced by `TeacherContextBroker` and the
learner's current Teacher-chat message.

The real adapter proves awareness behavior. The deterministic fake adapter
drives automated tests. Neither adapter receives repository tools, Executor
task control, credentials, raw App Server access, or an unrestricted
conversation archive. Provider-specific inference details remain private to
the adapter so the Practice contract does not depend on a single model
transport.

## Practice-session state model

Three orthogonal state groups prevent lifecycle, Executor status, and window
presentation from becoming one fragile state machine.

### Session lifecycle

```text
Entering
  → NeedsBinding
  → Ready
  → Active
  ↔ Paused
```

- `Entering`: validate and pin the practice-start request.
- `NeedsBinding`: no verified Executor task is bound.
- `Ready`: a task is bound and available, but no learner turn has been
  observed.
- `Active`: at least one bound-task turn has been observed.
- `Paused`: learner explicitly pauses observation or leaves the current
  practice flow without discarding it.

There is no `Completed` state in this slice. Awareness is not evidence of
mastery or exercise completion.

### Executor observation status

```text
NotBound | Ready | Working | WaitingForLearner | ResponseReady |
Stale | Disconnected
```

- `NotBound`: session has no task binding.
- `Ready`: bound task is reachable and has no active turn.
- `Working`: an active turn is producing activity.
- `WaitingForLearner`: Executor requires learner input or approval.
- `ResponseReady`: a new completed response is available.
- `Stale`: the last verified observation exceeded the freshness threshold.
- `Disconnected`: App Server or the bound task cannot be reached.

Status transitions do not create Teacher messages. They update the shared
status element and compact bubble ring.

### Presentation state

```text
FullExercise | FullTeacher | CompactBubble | QuickChat
```

Presentation changes never modify the mission, binding, or activity cursor.
Restart restores the last full tab and valid window positions. If the app
closed while compact, restart may restore the bubble after session
revalidation.

## Versioned contracts

All cross-boundary documents include a `schemaVersion`. Unknown major schema
versions fail safely instead of being guessed.

### Practice start request

```json
{
  "schemaVersion": 1,
  "courseRunId": "fixture-course-run",
  "lessonId": "module-0",
  "missionId": "module-0-read-only-inspection-awareness-fixture",
  "checkpointId": "executor-awareness",
  "content": {
    "version": "mock-1",
    "kind": "mock-adaptation",
    "owner": "Triết",
    "locale": "vi-VN",
    "title": "Inspect ContentPilot Lite ở chế độ chỉ đọc",
    "description": "Fixture dùng để kiểm tra cơ chế Practice Mode.",
    "learningOutcomes": [
      "Viết yêu cầu inspect repo ở chế độ chỉ đọc trước khi sửa file"
    ],
    "instructions": [
      "Tự viết prompt cho Executor trong Codex",
      "Yêu cầu report giúp quyết định bước tiếp theo",
      "Đọc report trước khi hỏi Teacher"
    ],
    "allowedActions": ["read files", "list files", "summarize"],
    "prohibitedActions": ["edit files", "install packages", "use network"],
    "expectedEvidence": ["structured inspection report"]
  },
  "workspace": {
    "expectedRepositoryRoot": "resolved repository root",
    "exercisePath": "prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite"
  }
}
```

The orchestrator pins `content.version` for the session. A source-file change
does not mutate an active mission.

### Executor binding

```json
{
  "schemaVersion": 1,
  "sessionId": "practice-session-id",
  "threadId": "codex-app-server-thread-id",
  "displayName": "Practice · Module 0 · Read-only inspection",
  "workspaceRoot": "resolved repository root",
  "sourceKind": "created-by-practice",
  "boundAt": "ISO-8601 timestamp",
  "verifiedAt": "ISO-8601 timestamp"
}
```

`sourceKind` is either `created-by-practice` or `selected-existing`. Binding
is accepted only after the task and expected workspace are verified. The
session never silently changes `threadId`.

### Activity snapshot

```json
{
  "schemaVersion": 1,
  "threadId": "bound-thread-id",
  "status": "response-ready",
  "cursor": "opaque-observation-cursor",
  "learnerPromptSummary": "bounded plain-text summary",
  "executorResponseSummary": "bounded plain-text summary",
  "activityKinds": ["prompt", "response", "read"],
  "changedFiles": [],
  "observedAt": "ISO-8601 timestamp"
}
```

The reader subscribes to task events where the App Server capability is
available and uses bounded polling as a compatibility fallback. Both paths
must produce the same snapshot contract. `changedFiles` is awareness data,
not an evaluation result; the fixture expects it to remain empty.

### Teacher context envelope

```json
{
  "schemaVersion": 1,
  "course": {
    "courseRunId": "fixture-course-run",
    "lessonId": "module-0",
    "missionId": "module-0-read-only-inspection-awareness-fixture",
    "checkpointId": "executor-awareness",
    "contentVersion": "mock-1"
  },
  "executor": {
    "threadId": "bound-thread-id",
    "status": "response-ready",
    "activity": "bounded activity snapshot"
  },
  "freshness": {
    "observedAt": "ISO-8601 timestamp",
    "state": "fresh"
  },
  "privacy": {
    "scope": "bound-thread-only",
    "redactionsApplied": true
  },
  "provenance": {
    "sources": ["practice-start-request", "bound-executor-task"]
  }
}
```

The Teacher UI exposes a concise context receipt derived from this envelope:
mission, bound task name, observation time, freshness, and bound-task-only
scope. It does not expose internal prompts or raw protocol payloads.

## Task creation and binding

### Primary path: create a dedicated task

When the learner chooses **Start Practice**, Practice Mode:

1. validates and pins the mission;
2. verifies the expected repository workspace;
3. calls App Server `thread/start` with that workspace;
4. calls `thread/name/set` with a recognizable Practice name;
5. verifies the returned task identity and workspace;
6. atomically persists the binding;
7. attempts the best available **Open in Codex** handoff;
8. shows the task name and recovery guidance even if focus/open handoff is not
   supported.

Task creation produces an empty task. Practice Mode does not prefill or submit
the learner's exercise prompt. The learner authors and sends the first prompt
in Codex.

The binding write is atomic: if creation, naming, verification, or persistence
fails, the session stays `NeedsBinding` and does not retain a partial binding.

### Desktop handoff constraint

Current App Server documentation establishes task creation and naming but does
not guarantee that an external application can focus the Codex desktop app on
that exact task. Implementation therefore includes an early capability spike:

- preferred result: open or focus the created task directly in Codex;
- acceptable fallback: show the unique task name and a one-step **Locate in
  Codex** instruction while retaining the valid binding;
- unacceptable result: create an unidentifiable task or pretend that focus
  succeeded.

The fallback changes convenience, not the binding or Teacher-awareness
architecture.

### Secondary path: select an existing task

If creation is unavailable or the learner intentionally chooses an existing
task, Practice Mode presents only eligible recent tasks from the expected
workspace. The learner explicitly selects one. Practice Mode verifies and
persists it with `sourceKind: selected-existing`.

Unrelated workspaces are excluded. Ambiguous or unverifiable tasks cannot be
bound.

### Rebinding

Rebinding is an explicit recovery action. The UI shows the current task and
explains that changing it resets the observation cursor for the session. No
background heuristic may replace the binding.

## Learner experience

### Enter Practice Mode

The mock Course screen includes one **Start Practice** action. Activating it
transforms the existing main window into Practice Mode. It does not open a
second full Practice window.

During entry, the learner sees bounded progress for mission validation,
workspace verification, and task creation. When the binding is ready, the
Exercise tab becomes active and offers **Open in Codex**.

### Full Practice layout

The full window contains:

- a persistent mission header;
- two primary tabs: **Exercise** and **Teacher chat**;
- a persistent Executor status/freshness element visible from both tabs;
- a dedicated **Compact to Teacher** control beside standard native window
  controls.

The operating system's minimize button retains normal minimize behavior.
Compact mode is a distinct, learnable action and is not hidden behind the
native minimize affordance.

### Exercise tab

The Exercise tab renders Triết-owned fields supplied through the versioned
content contract:

- description;
- lesson outcome;
- instructions;
- allowed and prohibited actions;
- expected evidence.

For this slice, those fields are fixture content and visibly labeled as such.
The tab also shows the bound Codex task name and **Open in Codex** action.

### Teacher chat tab

The Teacher chat tab contains:

- the Teacher conversation for this practice session;
- a message composer;
- current mission and Executor status;
- a context receipt showing the bound-task scope and freshness;
- explicit stale or disconnected disclosure when current observation is not
  available.

The Teacher does not proactively interrupt the learner when Executor status
changes. The learner initiates chat.

### Compact Teacher bubble

Selecting **Compact to Teacher** hides the main Course window and shows a
small, draggable, always-on-top avatar bubble inspired by mobile Messenger
chat heads.

The bubble:

- stays within the usable bounds of the current display;
- remembers a valid position;
- uses a small ring/symbol for Executor status and freshness;
- uses a numbered badge only for unread Teacher messages;
- exposes an accessible name and keyboard activation;
- does not contain exercise content or raw activity details.

Clicking the bubble opens quick chat beside it.

### Teacher quick-chat popover

Quick chat provides:

- recent Teacher messages;
- a compact composer;
- current Executor status and freshness;
- an **Expand** action.

**Expand** closes the compact surfaces and restores the full main window on
the Teacher chat tab. Clicking away or pressing Escape closes only the
popover; the bubble remains. The bubble's accessible context menu provides
**Open Practice**, **Pause Practice**, and **Quit Course App**. Quitting
persists the session before closing; it never silently abandons or completes
the mission.

## Persistence and privacy

Use Electron's per-user application-data directory. Practice state must not be
written into the learner's repository.

Persist:

- session and course identifiers;
- pinned mission content version and safe display content;
- verified Executor binding;
- observation cursor and bounded activity summary;
- bounded active Teacher-chat messages for the current session;
- last full tab;
- main-window, bubble, and popover positions;
- last verified freshness metadata.

Never persist:

- Codex or model credentials;
- raw environment variables;
- unrestricted Executor transcripts;
- content from unbound tasks;
- raw App Server protocol logs;
- hidden reasoning;
- unrelated repository or window content.

Writes are schema-validated and atomic. Corrupted state is quarantined and
replaced with a safe default. Authentication, task existence, workspace, and
binding are revalidated on startup; cached state is never treated as proof of
current connectivity.

## Failure and recovery behavior

| Failure | Safe behavior | Recovery |
|---|---|---|
| Invalid mission contract | Do not enter an ambiguous session | Show fixture/configuration error and return to Course state |
| App Server unavailable | Preserve pinned mission; create no binding | Retry connection or remain in disconnected Practice state |
| Task creation or naming fails | Persist no partial binding | Retry or select an eligible existing task |
| Codex desktop cannot open the task directly | Keep the valid binding and show the unique name | Learner locates the named task in Codex |
| Task workspace is wrong | Reject the binding | Create a new task in the expected workspace or choose an eligible one |
| Bound task disappears | Mark `Disconnected`; never substitute another task | Explicitly rebind |
| Observation exceeds freshness threshold | Mark `Stale`; Teacher discloses age | Refresh or reconnect before claiming current awareness |
| Teacher inference fails | Preserve chat and context receipt; show a retryable error | Retry with the same bounded context envelope |
| Stored state is corrupt | Quarantine it; do not infer a binding | Start safely and explain that local Practice state was reset |
| Saved window is off-screen | Clamp to a usable display | Restore at the nearest safe position |
| Unbound decoy task emits activity | Ignore it completely | No learner action required |

Errors shown to the renderer are typed and sanitized. Raw provider, protocol,
filesystem, or credential payloads are not displayed.

## Testing strategy

### Unit tests

- independent session, observation, and presentation reducers;
- schema validation and version rejection;
- workspace eligibility filtering;
- atomic binding behavior;
- strict `threadId` filtering;
- activity bounding and redaction;
- Teacher context envelope construction;
- stale/fresh calculations;
- persistence migration, corruption quarantine, and forbidden-field rejection;
- window-position clamping.

### Contract tests with a fake App Server

- initialization and capability discovery;
- task creation, naming, verification, and binding;
- task-event subscription and polling fallback producing equivalent snapshots;
- wrong-workspace rejection;
- unbound-task event exclusion;
- process loss, retry, missing task, and explicit rebind;
- no partial binding after any creation-stage failure.

### Electron end-to-end tests

- Course window transforms into Practice Mode;
- Exercise and Teacher tabs preserve shared status;
- native minimize remains native minimize;
- Compact to Teacher hides the main window and shows one bubble;
- bubble opens quick chat and Expand restores the Teacher tab;
- restart restores and revalidates the session;
- disconnected and stale states remain visible;
- keyboard navigation, focus restoration, accessible names, and reduced-motion
  behavior work across all surfaces.

### Real-Codex capability spike

Before completing the integration, manually verify on the supported Windows
environment that:

1. App Server can create and name a persistent task in the expected workspace;
2. the learner can locate that task in the Codex desktop app;
3. a prompt sent in the desktop app remains under the same `threadId`;
4. bound-task activity becomes visible to Practice Mode within the target
   interval;
5. activity from an unbound decoy task is excluded;
6. app restart recovers and revalidates the same binding;
7. the real Teacher accurately reports the learner prompt, constraints,
   Executor report, and whether files changed;
8. the Teacher says when context is stale or disconnected;
9. credentials and unrelated task content never enter Practice storage or the
   Teacher envelope.

If the Codex desktop app cannot reliably display or share an App
Server-created task, preserve the interaction and contract design but replace
the conversation adapter. Do not weaken explicit binding or silently switch to
screen scraping.

## First vertical-slice scope

### Included

- one mock Course lesson with **Start Practice**;
- one versioned mock mission adapted from Module 0;
- same-main-window transition into Practice Mode;
- Exercise and Teacher chat tabs;
- persistent mission, Executor, and freshness status across tabs;
- creation, naming, verification, and atomic binding of a dedicated task;
- eligible existing-task picker as fallback;
- best available **Open in Codex** handoff plus named-task fallback;
- observation of learner prompts and Executor responses from only the bound
  task;
- bounded activity kinds and changed-file awareness;
- real Teacher adapter and deterministic fake adapter;
- visible Teacher context receipt;
- compact Teacher bubble and quick-chat popover;
- restart, resume, stale, disconnected, and explicit rebind behavior;
- one unbound decoy task to prove exclusion.

### Excluded

- production Course App integration;
- new or rewritten production exercise content;
- mastery assessment or exercise completion;
- evidence grading or rubric application;
- proactive coaching or hint ladders;
- approving or steering Executor actions from Practice Mode;
- file-diff or test-result evaluation;
- multiple concurrent missions;
- voice, microphone, camera, or screen capture;
- system tray behavior;
- cloud sync or multi-device state;
- packaging and distribution;
- macOS or Linux support;
- automatic submission of the learner's first prompt.

## Acceptance criteria

The slice is successful when:

1. **Start Practice** transforms the Course window into Practice Mode.
2. Practice Mode creates and explicitly binds a clean, named Codex task in the
   correct workspace.
3. The learner can locate and use that task in the Codex desktop app.
4. Bound-task activity normally appears in Practice Mode within 10 seconds.
5. The compact bubble communicates Executor state quietly without creating a
   Teacher message.
6. The learner can chat with Teacher from the popover and restore the full
   Teacher tab.
7. Given fresh context, Teacher accurately answers what the learner requested,
   which constraints were stated, what the Executor reported, and whether
   files changed.
8. Similar activity in an unbound decoy task never appears in status, storage,
   context receipts, or Teacher answers.
9. Stale or disconnected context is visibly disclosed and is never presented
   as current.
10. Restart recovers the pinned mission and same binding, then revalidates them
    before observation resumes.
11. No credentials, unrelated task content, unrestricted transcripts, or raw
    environment data cross into the renderer, Practice store, or Teacher
    context.

## Deferred production decisions

The prototype intentionally defines stable boundaries without prematurely
coupling them to the future production shell. Moving beyond this slice
requires joint review of:

- final Course App route and navigation integration;
- Triết-approved mission wording and content versions;
- production mastery, evidence, and completion contracts;
- shared visual tokens and final learner-facing terminology;
- retention duration and deletion controls for Teacher chat and activity
  summaries;
- packaging, auto-update, and non-Windows support.

These are excluded product decisions, not gaps in the awareness prototype's
implementation contract.
