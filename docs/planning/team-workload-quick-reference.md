# Team Workload — ADHD-Friendly Quick Reference

**For Duy and Triết:** use this when deciding who owns a task or what to do next. [Full agreement](team-workload-boundaries.md)

Optimized for fast scanning, low working-memory load, and clear next actions; the full agreement remains authoritative for edge cases.

> One task. One owner. One visible next action.

## The 10-second version

| Question | Owner |
|---|---|
| What do learners study or practise? | **Triết** |
| How does setup, Practice Mode, tracking, or recovery work? | **Duy** |
| UI/UX inside the Course App? | **Triết** |
| UI/UX outside the Course App? | **Duy** |
| Does it change both sides or the transition between them? | **Discuss together; choose one implementation owner** |

If this table answers the question, stop here.

## Who owns what?

### Duy owns the mechanisms

- repository clone, setup, and startup flow;
- Windows-first startup mock;
- Codex installation and connection checks;
- Codex login/status integration;
- onboarding setup mechanism;
- response validation and non-secret storage;
- Practice Mode runtime;
- Teacher interaction during practice;
- Teacher memory and resumable state;
- Executor thread binding;
- practice activity and evidence capture;
- progress tracking;
- completion processing;
- interruption, error, resume, and recovery behavior;
- UI/UX outside the Course App.

### Triết owns the content

- Course App;
- theory lessons and slides;
- course navigation and content presentation;
- learner-facing teaching copy;
- onboarding script and questions;
- onboarding explanations, labels, wording, and order;
- practice exercise briefs;
- practice instructions and scenarios;
- exercise examples and starter material;
- expected outcomes and expected evidence;
- exercise-specific evaluation criteria;
- UI/UX inside the Course App.

### Discuss together

- Course App → Practice Mode transition;
- Practice Mode → Course App return;
- startup or onboarding behavior that changes the Course App;
- shared data fields, schemas, and identifiers;
- shared terminology and labels;
- colors, typography, spacing, icons, and motion used on both sides;
- reusable interaction patterns;
- shared loading, empty, offline, error, and recovery patterns;
- privacy, Teacher context, and data-retention changes;
- root commands, dependencies, or configuration affecting both workstreams.

After discussing, name **one implementation owner**. Joint review does not mean
both people implement the same change.

## What we do not own

- **Duy does not own:** theory, onboarding or exercise content,
  exercise-specific criteria, or UI/UX inside the Course App.
- **Triết does not own:** startup/authentication implementation, onboarding
  mechanics, Practice Mode runtime, Teacher/Executor integration, tracking,
  persistence, recovery, or UI/UX outside the Course App.

## 30-second task router

Ask these questions in order:

1. **Does this change what the learner is taught or asked to practise?**
   - Yes → **Triết**
2. **Does this change how the learner installs, connects, starts, tracks,
   interacts with the Teacher, completes, or resumes?**
   - Yes → **Duy**
3. **Does this change UI/UX inside the Course App?**
   - Yes → **Triết**
4. **Does this change UI/UX outside the Course App?**
   - Yes → **Duy**
5. **Does it cross both sides?**
   - Yes → split it into a **content input** and a **mechanism output**, then
     assign one owner to each part.

If the owner is still unclear, stop and write one handoff card.

## Before starting a task

- [ ] What is the exact output?
- [ ] Who is the single owner?
- [ ] Is this content or mechanism?
- [ ] Is the UI inside or outside the Course App?
- [ ] Does it change a shared contract or transition?
- [ ] Does the other person need to review before implementation?
- [ ] What is the next visible action?

Do not start parallel implementations of the same output.

## Handoff card

Copy this when work crosses the boundary:

```text
Task:
Owner:
Output:

Input needed from the other person:
Shared contract or transition affected:
Decision needed:

Next visible action:
Review by:
```

## Practice Mode handoff

### Triết sends

```text
lessonId + missionId + checkpointId
exercise brief + instructions + objective
expected evidence + evaluation criteria
```

### Duy returns

```text
courseRunId + missionId + checkpointId
status + completedAt + evidence summary
mechanical evaluation result + mastery summary
```

Triết defines the exercise. Duy makes the exercise run, tracks what happened,
and returns the result.

## UI/UX alignment

### No meeting needed

- small local adjustment inside one owned surface;
- implementation detail that does not change a shared pattern;
- content edit that does not change the Practice Mode contract;
- mechanism refactor that does not change learner-facing behavior.

### Talk before implementing

- new shared component or interaction pattern;
- change to a cross-surface transition;
- terminology used on both sides;
- major visual direction change;
- changed loading, error, offline, or recovery behavior;
- changed data passed between Course App and Practice Mode.

## 10-minute alignment check

1. **Show — 2 min:** each person shows one concrete output.
2. **Next — 2 min:** each states their next visible deliverable.
3. **Seams — 3 min:** check work crossing Course App, onboarding, or Practice
   Mode.
4. **Decide — 2 min:** name one owner, required input, and next action.
5. **Record — 1 min:** write the decision in the agreement, contract, or task.

## Current Duy-side prototype decisions

These are Duy's workstream choices, not automatically joint team decisions:

- README clone instructions plus one setup-and-start command;
- Windows-first startup mock;
- terminal handles installation and launch;
- interactive setup happens in the app;
- real Codex login/status through Codex App Server;
- Codex retains ownership of credentials;
- Teacher and course behavior may be simulated in the startup mock;
- first technical onboarding uses a fixed-form mechanism.

## When overwhelmed or blocked

Do only this:

1. Write the output in one sentence.
2. Choose **Duy**, **Triết**, or **Discuss together**.
3. If it is shared, split content from mechanism.
4. Pick one next action that takes less than 30 minutes.
5. Send the handoff card if another input is required.

Do not solve the whole project before choosing the next action.
