# Team Workload Boundaries

**Owners:** Duy and Triết | **Status:** Active working agreement | **Established:** 30 July 2026
**Source:** Collaborator workflow discussion and ownership diagram

**Daily TL;DR:** after cloning the repository, open
[`team-workload-map.html`](team-workload-map.html) in a browser. Use this full
agreement only when the map does not answer the question.

## Purpose

This document separates Duy's and Triết's work so both people can develop in
parallel without silently implementing the same feature or changing the other
person's area.

The product has two connected experiences:

1. **Learn theory in the Course App.**
2. **Apply the theory in Practice Mode with Codex, the Teacher, and the
   Executor.**

Triết owns the learner-facing teaching and exercise content across both
experiences. Duy owns the mechanisms that install, start, connect, run, track,
and resume the practical experience.

## Ownership summary

| Area | Primary owner | Expected outcome |
|---|---|---|
| Course App | Triết | Learners can navigate and study the theory experience |
| Course content and theory slides | Triết | Complete learner-facing explanations, examples, and slides |
| Repository startup flow | Duy | Learners can clone the repository, run one setup command, and enter the app |
| First-run onboarding setup | Duy | The app connects Codex and reliably captures onboarding responses |
| First-run onboarding script and content | Triết | Learners receive the intended questions, explanations, and teaching language |
| Practice Mode mechanism | Duy | Practice sessions run, connect, track progress, and recover reliably |
| Practice exercise content | Triết | Learners receive the intended tasks, instructions, and success criteria |
| UI/UX inside the Course App | Triết | Theory and course-navigation surfaces remain coherent |
| UI/UX outside the Course App | Duy | Standalone setup, Practice Mode, Teacher, progress, and recovery surfaces remain coherent |
| Cross-surface UI/UX alignment | Joint review | Both sides feel like one product without duplicating implementation ownership |
| Teacher agent | Duy | The Teacher guides, questions, hints, assesses, and remembers progress |
| Executor integration | Duy | Codex performs scoped practical work while remaining separate from the Teacher |
| Practice activity and progress records | Duy | Practice actions, evidence, completion, and resumable state are recorded |

## Duy's ownership

### 1. Repository startup and app activation

Duy owns the learner journey from the GitHub README to the first app screen:

```text
View README
  → clone repository
  → run one setup-and-start command
  → verify prerequisites
  → launch the Course App
  → begin first-run onboarding
```

Deliverables include:

- README commands for cloning and starting the project;
- the Windows-first setup-and-start command;
- prerequisite detection and actionable error messages;
- dependency installation required by the complete local experience;
- app launch behavior;
- safe restart and resume behavior;
- startup diagnostics for common failures.

The terminal performs installation, verification, and launch. Interactive
onboarding belongs in the app interface.

### 2. First-run setup and Codex connection

Duy owns the technical setup flow that prepares Practice Mode:

- check whether Codex is installed and available;
- show Codex connection status inside the app;
- start the official ChatGPT/Codex sign-in flow when required;
- confirm the connected account or workspace without exposing credentials;
- load and display the onboarding script and questions supplied by Triết;
- validate, capture, and store the learner's responses;
- store non-secret onboarding state for later Teacher sessions;
- provide retry, cancellation, and recovery states.

Duy does not own the onboarding script, question wording, teaching
explanations, or instructional content.

Codex owns authentication credentials. The Course App must not copy, display,
log, or independently store Codex access tokens or `~/.codex/auth.json`.

For the first mock:

- Codex authentication and status checking are real through Codex App Server;
- Teacher responses and the rest of the course experience may remain simulated;
- the implementation is Windows-first.

### 3. Practice Mode mechanism

Duy owns the runtime surrounding the transition from theory to supervised
practical work:

```text
Finish relevant theory
  → enter Practice Mode
  → bind the active mission to one Codex Executor conversation
  → learner builds in Codex
  → Teacher follows scoped progress
  → evidence is checked
  → completion returns to the Course App
```

Deliverables include:

- starting, pausing, resuming, and completing a practice session;
- loading and presenting the practice exercise supplied by Triết;
- designing and implementing the UI/UX of the Practice Mode surface;
- designing Teacher interaction, progress, connection, error, and recovery
  states outside the Course App;
- binding one mission to one explicit Codex Executor thread;
- keeping unrelated Codex conversations outside the Teacher context;
- collecting mission-relevant activity and evidence;
- applying the exercise-specific completion criteria supplied by Triết;
- displaying context freshness and connection failures;
- returning practice completion and progress to the Course App.

Duy does not own the practice exercise brief, learner instructions, scenario,
example material, expected outcome, expected evidence, or evaluation criteria.

### 4. Teacher agent and persistent teaching state

Duy owns the Teacher's behavior and technical implementation:

- coaching and questioning;
- bounded hints rather than silently doing the task;
- mastery assessment;
- awareness of the current lesson, mission, and checkpoint;
- persistent summaries of learner progress and misconceptions;
- resumable Teacher state across app restarts;
- visible disclosure of what context the Teacher can access.

The Teacher does not edit the learner's project, run implementation commands,
or approve Executor actions on the learner's behalf.

### 5. Executor integration

Duy owns the technical boundary between the Course App and the Executor in
Codex:

- create, select, or bind the correct Executor thread;
- receive scoped thread status and lifecycle events;
- correlate commands, file changes, tests, and approvals with that thread;
- recover the binding after restart;
- prevent events from an unbound thread from entering Teacher context.

The Executor reads, edits, runs, and verifies. It does not teach or grade.

### 6. Practice records and progress

Duy owns practice-side records, including:

- active practice session;
- bound mission and Executor thread;
- learner decisions and answers made during practice;
- relevant file, command, test, and artifact evidence;
- checkpoint completion;
- Teacher hint and mastery state;
- timestamps, provenance, and last-sync status;
- the minimum state required to resume safely.

Secrets, raw environment variables, unrelated repositories, unrelated windows,
and unrestricted conversation archives must not be stored as learning records.

## Triết's ownership

### 1. Course App

Triết owns the primary learner-facing theory application:

- application structure and navigation;
- theory lesson screens;
- presentation and interaction patterns used while learning;
- the visual and content experience before Practice Mode;
- UI/UX decisions within the Course App;
- the Course App's shell, navigation system, and theory-facing interaction
  patterns;
- app-level UI decisions outside Duy's startup mechanics, onboarding setup
  mechanics, and Practice Mode runtime.

### 2. Course content

Triết owns the learner-facing curriculum presented in the app:

- theory explanations;
- examples and demonstrations;
- lesson sequencing;
- slide content;
- instructional copy;
- the first-run onboarding script, questions, explanations, wording, and order;
- content revisions required for clarity and correctness.

### 3. Theory and practice content

Triết defines what the learner should understand and do in each practical
task:

- the theory objective;
- the concepts introduced;
- the intended learner outcome;
- the point at which the lesson sends the learner into Practice Mode;
- the practice exercise brief and learner instructions;
- the exercise scenario, task, examples, and starter material;
- the expected outcome and expected evidence;
- the exercise-specific completion and evaluation criteria.

Triết does not implement the Practice Mode runtime, progress tracking, Teacher
interaction mechanism, Teacher memory, Executor connection, evidence capture,
persistence, recovery, or startup/authentication system.

## Shared integration contracts

Shared contracts are jointly reviewed, but each side implements only its own
half.

### Contract A: App launch

**Duy provides:**

- a setup-and-start command;
- a reliable app launch entry point;
- startup status and failure information.

**Triết provides:**

- the Course App entry point that the launcher starts;
- a stable first screen that can route new learners into onboarding and
  returning learners into the course.

### Contract B: First-run onboarding

**Duy provides:**

- Codex connection status;
- login initiation and completion states;
- the form or conversation mechanics used to present onboarding;
- validation, response capture, and non-secret response storage;
- a content interface through which Triết supplies the onboarding script and
  questions;
- an onboarding-complete signal.

**Triết provides:**

- the app shell and visual language in which onboarding appears;
- the exact onboarding script, questions, explanations, labels, wording, and
  sequence;
- the navigation destination after onboarding completes.

The onboarding setup mechanism belongs to Duy even when it is rendered inside
Triết's app shell. The teaching script and all learner-facing onboarding
content belong to Triết.

### Contract C: Enter Practice Mode

The Course App sends a versioned practice-start request containing:

```text
courseRunId
lessonId
missionId
checkpointId
practiceObjective
expectedEvidence
```

**Triết provides:** the correct theory and mission identifiers, exercise
brief, learner instructions, practice objective, expected evidence, and
evaluation criteria.

**Duy provides:** validation, session creation or resume, Executor binding, and
the surrounding Practice Mode mechanism that presents, tracks, and evaluates
the supplied exercise.

### Contract D: Return practice progress

Practice Mode returns a versioned progress result containing:

```text
courseRunId
missionId
checkpointId
status
completedAt
evidenceSummary
masterySummary
```

**Duy provides:** accurate practice status, evidence summaries, and the
mechanical evaluation result produced from Triết's exercise criteria.

**Triết provides:** the course UI that reflects completion and determines the
next theory destination.

### Contract E: Content changes that affect practice

When Triết changes an exercise brief, learner instruction, objective, mission
identifier, expected evidence, evaluation criterion, or checkpoint meaning,
Duy reviews the corresponding Practice Mode contract.

When Duy changes the practice data contract or completion rules, Triết reviews
the corresponding Course App integration.

Neither person changes the shared contract unilaterally.

## UI/UX ownership and alignment

The team uses **surface ownership with shared design alignment**. Each person
has implementation authority within their surface, while both review decisions
that affect the product-wide system or the transition between surfaces.

### Triết's UI/UX surface

Triết is the primary UI/UX owner inside the Course App, including:

- the app shell;
- theory screens and content presentation;
- course navigation;
- lesson progress shown inside the Course App;
- course-side entry points into onboarding and Practice Mode;
- course-side completion and return destinations.

Triết makes local Course App UI/UX decisions without requiring Duy's approval
when they do not change a shared pattern or cross-surface handoff.

### Duy's UI/UX surfaces

Duy is the primary UI/UX owner outside the Course App, including:

- repository startup and standalone setup states;
- Codex connection, authentication status, and recovery surfaces that appear
  outside the Course App;
- Practice Mode;
- Teacher interaction during practice;
- practice progress and evidence displays;
- Executor connection and context-freshness states;
- practice completion, interruption, resume, error, and recovery experiences.

Duy makes local UI/UX decisions within these surfaces without requiring
Triết's approval when they do not change a shared pattern or cross-surface
handoff.

When Duy's setup or Codex-connection mechanism is presented inside the Course
App, Duy owns the required states, behavior, validation, and technical
integration, while Triết owns its UI/UX presentation within the Course App.

### Jointly reviewed UI/UX decisions

Both owners discuss and review:

- product terminology and labels used on both sides;
- color, typography, spacing, iconography, and motion conventions shared across
  surfaces;
- accessibility standards and interaction feedback;
- shared loading, empty, offline, error, and recovery patterns;
- navigation or state passed between the Course App and Practice Mode;
- any new component or interaction pattern intended for reuse by both sides;
- major visual changes that would make the two surfaces feel like different
  products.

Joint review does not transfer implementation ownership. After alignment, the
owner of each surface implements the decision on that surface.

### Cross-surface handoffs

The following transitions require review from both owners:

1. repository startup → Course App;
2. first-run onboarding → course lesson;
3. theory lesson → Practice Mode;
4. Practice Mode → Teacher interaction;
5. practice completion or interruption → Course App;
6. connection failure or stale progress → recovery destination.

Each handoff must agree on:

- the action that initiates the transition;
- the state and identifiers passed across;
- the learner-facing wording;
- loading, cancellation, error, and retry behavior;
- the destination and expected next action.

### Alignment cadence

The team uses two lightweight alignment mechanisms:

1. **Weekly or milestone review:** share current screenshots or prototypes,
   review upcoming cross-surface changes, and record decisions.
2. **Change-triggered review:** contact the other owner before implementing a
   new shared pattern or changing a cross-surface handoff.

Routine local adjustments do not require a meeting. Shared decisions are added
to the UI/UX alignment notes or this agreement before both sides depend on
them.

## Non-overlap rules

1. Duy does not rewrite theory content, theory slides, or general Course App
   navigation unless Triết requests the change.
2. Triết does not implement a second startup system, Codex authentication
   flow, Teacher runtime, Executor adapter, or practice-state store.
3. UI placement does not determine ownership. Duy owns the onboarding setup
   mechanism even when it appears inside the Course App; Triết owns the script
   and content presented through that mechanism.
4. Content authorship does not determine runtime ownership. Triết specifies
   the practice exercise and its evaluation criteria; Duy implements how
   Practice Mode presents it, observes activity, tracks progress, and applies
   those criteria.
5. Shared schemas and navigation handoffs require review from both owners.
6. A prototype must label simulated behavior clearly and must not be presented
   as a live integration.
7. Work in the other owner's area starts only after an explicit handoff or
   request.
8. Triết has final implementation authority for local UI/UX inside the Course
   App; Duy has final implementation authority for local UI/UX outside it.
9. Neither owner introduces a new shared UI/UX pattern or changes a
   cross-surface transition without review from the other owner.

## Repository working boundaries

Until the production app structure is finalized, use these working boundaries:

### Duy may change independently

- repository startup and setup scripts;
- README startup instructions;
- the Course Companion and Practice Mode mechanism prototype, excluding
  practice exercise content;
- Codex App Server integration experiments;
- the Duy-owned Teacher, Executor, context, evidence, progress, and persistence
  mechanisms;
- architecture and integration documentation for those areas.
- UI/UX implementation for standalone startup and setup, Practice Mode,
  Teacher interaction, progress, evidence, connection, and recovery surfaces
  outside the Course App.

### Triết may change independently

- the Course App implementation outside Duy's onboarding setup and Practice
  Mode mechanisms;
- onboarding scripts, questions, explanations, labels, and instructional copy;
- theory lessons, slides, examples, and instructional copy;
- practice exercise briefs, instructions, scenarios, examples, expected
  evidence, and evaluation criteria;
- course-content sequencing and presentation;
- UI/UX implementation inside the Course App;
- content-focused planning documents.

### Joint review required

- root commands that change how both workstreams run;
- shared package or dependency strategy;
- shared schemas and identifiers;
- routing between theory, onboarding, and Practice Mode;
- shared visual standards and reusable interaction patterns;
- cross-surface UI/UX transitions and their error or recovery behavior;
- changes to privacy, data retention, or Teacher context scope;
- renaming product concepts used by both experiences.

## Decision rule for ambiguous work

Use this test before starting an unclear task:

- If it changes **what the learner is taught or what exercise the learner is
  asked to complete**, Triết owns it.
- If it changes **how the learner installs, connects, enters a practice
  session, interacts with the Teacher, has progress and evidence tracked, is
  mechanically evaluated against supplied criteria, or resumes**, Duy owns it.
- If it changes the data or navigation crossing between those two experiences,
  both owners review it and nominate one implementation owner before work
  begins.

## Current decisions and proposals by source

This section records where each direction came from. A Duy workstream decision
must not be represented as a joint team decision merely because it is written
in this agreement.

### Duy workstream decisions

As of 30 July 2026, Duy has selected these directions for his prototype and
implementation area:

- the README will provide repository clone commands and one setup-and-start
  command;
- the first startup mock is Windows-first;
- the terminal handles installation and launch only;
- interactive setup happens inside the app;
- Codex login/status is real through Codex App Server;
- Codex retains ownership of authentication credentials;
- the Teacher and remaining course experience may be simulated in the first
  startup mock;
- initial teaching setup uses a short fixed-form mechanism implemented by Duy;
- conversational Teacher onboarding is deferred from Duy's first technical
  prototype.

These choices remain inside Duy's ownership unless they change a shared
contract or require work in Triết's area. In that case, the affected handoff
must be reviewed together before implementation depends on it.

### Ownership boundaries recorded by Duy

Duy has recorded the following responsibility boundaries for collaborator
review:

- Triết supplies the onboarding form's script, questions, explanations,
  wording, and sequence;
- Triết owns all practice exercise content and exercise-specific evaluation
  criteria;
- Duy owns the surrounding Practice Mode mechanism, including session state,
  Teacher interaction, Executor binding, evidence capture, progress tracking,
  persistence, completion processing, and recovery;
- Triết is the primary UI/UX owner inside the Course App;
- Duy is the primary UI/UX owner outside the Course App, including Practice
  Mode and its surrounding standalone setup, Teacher, progress, and recovery
  surfaces;
- setup or connection mechanisms displayed inside the Course App keep Duy's
  technical ownership but use Triết's UI/UX ownership;
- shared design standards and cross-surface transitions receive frequent
  review from both owners, while implementation remains with the owner of each
  surface.

These boundaries become joint decisions only after both Duy and Triết
explicitly confirm them.

### Jointly confirmed decisions

Do not place an item in this subsection until both Duy and Triết have
explicitly confirmed it. No additional decision is currently recorded here.

## Updating this agreement

When responsibilities change:

1. state the affected deliverable;
2. name the new primary owner;
3. identify any shared contract that changes;
4. obtain acknowledgement from both owners;
5. update this document before parallel implementation continues.

This document is the default authority when a task could reasonably belong to
either workstream.
