# Team Workload Boundaries

**Owners:** Duy and Triết  
**Status:** Active working agreement  
**Established:** 30 July 2026  
**Source:** Collaborator workflow discussion and ownership diagram

## Purpose

This document separates Duy's and Triết's work so both people can develop in
parallel without silently implementing the same feature or changing the other
person's area.

The product has two connected experiences:

1. **Learn theory in the Course App.**
2. **Apply the theory in Practice Mode with Codex, the Teacher, and the
   Executor.**

Triết owns the first experience. Duy owns the second experience and the path
that installs, starts, and connects the system.

## Ownership summary

| Area | Primary owner | Expected outcome |
|---|---|---|
| Course App | Triết | Learners can navigate and study the theory experience |
| Course content and theory slides | Triết | Complete learner-facing explanations, examples, and slides |
| Repository startup flow | Duy | Learners can clone the repository, run one setup command, and enter the app |
| First-run onboarding | Duy | Learners connect Codex and provide the initial teaching profile |
| Practice Mode | Duy | Learners apply theory through supervised, evidence-based work |
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

### 2. First-run onboarding and Codex connection

Duy owns the onboarding steps that prepare Practice Mode:

- check whether Codex is installed and available;
- show Codex connection status inside the app;
- start the official ChatGPT/Codex sign-in flow when required;
- confirm the connected account or workspace without exposing credentials;
- collect the initial teaching-profile answers;
- store non-secret onboarding state for later Teacher sessions;
- provide retry, cancellation, and recovery states.

Codex owns authentication credentials. The Course App must not copy, display,
log, or independently store Codex access tokens or `~/.codex/auth.json`.

For the first mock:

- Codex authentication and status checking are real through Codex App Server;
- Teacher responses and the rest of the course experience may remain simulated;
- the implementation is Windows-first.

### 3. Practice Mode

Duy owns the transition from theory to supervised practical work:

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
- binding one mission to one explicit Codex Executor thread;
- keeping unrelated Codex conversations outside the Teacher context;
- collecting mission-relevant activity and evidence;
- displaying context freshness and connection failures;
- returning practice completion and progress to the Course App.

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
- app-level UI decisions outside Duy's startup, onboarding, and practice
  surfaces.

### 2. Course content

Triết owns the learner-facing curriculum presented in the app:

- theory explanations;
- examples and demonstrations;
- lesson sequencing;
- slide content;
- instructional copy;
- content revisions required for clarity and correctness.

### 3. Theory-to-practice intent

Triết defines what the learner should understand before each practical task:

- the theory objective;
- the concepts introduced;
- the intended learner outcome;
- the point at which the lesson sends the learner into Practice Mode.

Triết does not implement the Practice Mode runtime, Teacher memory, Executor
connection, or startup/authentication system.

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
- teaching-profile questions and stored answers;
- an onboarding-complete signal.

**Triết provides:**

- the app shell and visual language in which onboarding appears;
- the navigation destination after onboarding completes.

The onboarding interaction belongs to Duy even when it is rendered inside
Triết's app shell.

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

**Triết provides:** the correct theory and mission identifiers.

**Duy provides:** validation, session creation or resume, Executor binding, and
the Practice Mode experience.

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

**Duy provides:** accurate practice status and evidence summaries.

**Triết provides:** the course UI that reflects completion and determines the
next theory destination.

### Contract E: Content changes that affect practice

When Triết changes a lesson objective, mission identifier, expected evidence,
or checkpoint meaning, Duy reviews the corresponding Practice Mode contract.

When Duy changes the practice data contract or completion rules, Triết reviews
the corresponding Course App integration.

Neither person changes the shared contract unilaterally.

## Non-overlap rules

1. Duy does not rewrite theory content, theory slides, or general Course App
   navigation unless Triết requests the change.
2. Triết does not implement a second startup system, Codex authentication
   flow, Teacher runtime, Executor adapter, or practice-state store.
3. UI placement does not determine ownership. Onboarding remains Duy's
   responsibility even when it appears inside the Course App.
4. Content authorship does not determine runtime ownership. Triết specifies
   the learning intent; Duy implements how Practice Mode observes and assesses
   the practical work.
5. Shared schemas and navigation handoffs require review from both owners.
6. A prototype must label simulated behavior clearly and must not be presented
   as a live integration.
7. Work in the other owner's area starts only after an explicit handoff or
   request.

## Repository working boundaries

Until the production app structure is finalized, use these working boundaries:

### Duy may change independently

- repository startup and setup scripts;
- README startup instructions;
- the Course Companion and Practice Mode prototype;
- Codex App Server integration experiments;
- Teacher, Executor, context, evidence, progress, and persistence
  implementation owned by Practice Mode;
- architecture and integration documentation for those areas.

### Triết may change independently

- the Course App implementation outside onboarding and Practice Mode;
- theory lessons, slides, examples, and instructional copy;
- course-content sequencing and presentation;
- content-focused planning documents.

### Joint review required

- root commands that change how both workstreams run;
- shared package or dependency strategy;
- shared schemas and identifiers;
- routing between theory, onboarding, and Practice Mode;
- changes to privacy, data retention, or Teacher context scope;
- renaming product concepts used by both experiences.

## Decision rule for ambiguous work

Use this test before starting an unclear task:

- If it changes **what the learner is taught**, Triết owns it.
- If it changes **how the learner installs, connects, practises, is observed,
  is assessed, or resumes**, Duy owns it.
- If it changes the data or navigation crossing between those two experiences,
  both owners review it and nominate one implementation owner before work
  begins.

## Current agreed decisions

As of 30 July 2026:

- the README will provide repository clone commands and one setup-and-start
  command;
- the first startup mock is Windows-first;
- the terminal handles installation and launch only;
- interactive setup happens inside the app;
- Codex login/status is real through Codex App Server;
- Codex retains ownership of authentication credentials;
- the Teacher and remaining course experience may be simulated in the first
  startup mock;
- initial teaching setup uses a short fixed form;
- conversational Teacher onboarding is deferred until the real Teacher exists.

## Updating this agreement

When responsibilities change:

1. state the affected deliverable;
2. name the new primary owner;
3. identify any shared contract that changes;
4. obtain acknowledgement from both owners;
5. update this document before parallel implementation continues.

This document is the default authority when a task could reasonably belong to
either workstream.
