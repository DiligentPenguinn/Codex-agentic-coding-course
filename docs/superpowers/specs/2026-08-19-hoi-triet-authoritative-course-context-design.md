# Hỏi Triết Authoritative Course Context and Pedagogy Design

**Date:** 2026-08-19
**Status:** Approved design; implementation pending

## Problem

The embedded **Hỏi Triết** Teacher currently receives identifiers for the active
lesson, scene, and checkpoint, but not the actual course material those
identifiers represent. The context envelope includes Practice and Executor
observations, recent Teacher chat, learner memory, and saved decisions, yet its
`course` section contains only IDs and decisions. As a result, the model can
truthfully report that it cannot see the lesson context.

The renderer constructs an optional `TeacherContext`, but the main-process IPC
handler discards it. Passing more content from the renderer would not be a safe
repair: Electron-owned progress and the runnable Pilot must remain authoritative,
and renderer state can be stale or inconsistent with the active course state.

Triết also needs access to hidden teaching and assessment material so it can
coach and assess correctly. That access must not cause answer keys, expected
signals, rubric thresholds, worked solutions, or future scripted content to be
revealed before the learner has completed the relevant learning step.

## Goals

- Give embedded Triết the complete authoritative content package for the active
  module, including hidden Teacher and assessment material.
- Include saved learner decisions and exact active learning state on every
  Teacher turn.
- Preserve the existing no-tools, read-only, exact-Practice, and exact-Executor
  security boundaries.
- Create one reusable pedagogical skill used by embedded Triết and the existing
  `course-teacher` skill.
- Prevent premature disclosure during open quizzes and mastery checks, even
  when the learner repeatedly requests the answer or attempts prompt injection.
- Verify the repair across deterministic and real-world scenarios, using a
  dedicated sub-agent iteratively to find and retest defects.

## Non-goals

- Changing approved learner-facing lesson or application copy.
- Giving the Teacher tools, file-editing ability, Executor control, or authority
  to declare Practice completion.
- Replacing the existing Practice evidence and review boundaries.
- Rewriting the course curriculum or assessment content.
- Treating automated evidence as owner approval or pilot acceptance.

## Considered approaches

### Renderer-supplied lesson content

The renderer could attach displayed lesson text to `TeacherSendRequest`. This is
simple, but it makes potentially stale renderer state authoritative and can
create mismatches between the visible scene, persisted progress, and content
sent to Triết. It is rejected.

### Teacher thread reads the course files

The Teacher thread could receive filesystem tools and inspect the current module
itself. This violates the existing no-tools boundary, weakens context isolation,
and makes it harder to prove which content informed a response. It is rejected.

### Main-process authoritative module loader

The Electron main process loads an allowlisted package selected from
Electron-owned progress, verifies it, and supplies it to the Teacher. This keeps
the trust boundary narrow and testable. It is the selected approach.

## Authoritative context architecture

Introduce a focused main-process repository responsible only for loading and
validating Teacher course context. For every Hỏi Triết turn it will:

1. Load authoritative learner progress.
2. Resolve the active module from `currentLessonId` and validate the associated
   course-lesson, checkpoint, and scene relationship.
3. Load only the allowlisted active-module package from `pilot-workspace/`:
   - learner lesson;
   - Teacher script;
   - start prompt;
   - quiz definition, including answers and expected signals;
   - Teacher system prompt and scripted-delivery contract;
   - hint ladder, quiz-delivery protocol, and mastery rubric;
   - the `triet-pedagogy` skill.
4. Attach source-relative identifiers and content digests so tests and
   diagnostics can establish exactly what was supplied without logging the
   hidden content.
5. Add authoritative active state: lesson, course-lesson, scene, checkpoint,
   completed checkpoints, saved decisions, Practice state, active Practice run,
   bounded exact-Executor observations, durable learner memory, and recent chat.
6. Pass the verified package into the Teacher context envelope.

The renderer's optional context remains non-authoritative. The main process may
remove it from the public request contract or validate it only as a consistency
assertion, but it must never choose content from renderer claims. A conflicting
renderer claim must not alter the authoritative module package.

## Completeness and size limits

The current 24,000-character envelope cap cannot hold the approved input. The
largest current module package is Module 2 at approximately 74,000 bytes before
shared pedagogy and runtime state. Implementation must set a documented ceiling
based on measured complete packages, with headroom for the shared policy and
bounded live state.

Course sources and pedagogical policy are atomic: they must not be silently
truncated. If a verified complete package exceeds the ceiling, the request fails
closed with a recoverable diagnostic. Existing lossy compaction remains
permitted only for explicitly bounded dynamic history, prior summaries, and
Executor observations, and its metadata must disclose omissions.

The loader must support development and packaged path resolution using the same
validated-root approach already used by Course Companion repositories. An
optional test-only directory override may be introduced for deterministic
fixtures, but arbitrary paths from the renderer are forbidden.

## Pedagogical skill

Create `pilot-workspace/.agents/skills/triet-pedagogy/SKILL.md` as the shared
pedagogical authority. The existing `course-teacher` skill will require it, and
embedded Triết will receive its contents as high-priority runtime instructions,
not as ordinary learner text.

The skill adapts relevant principles from Matt Pocock's `/teach` skill—mission
grounding, zone of proximal development, retrieval practice, desirable
difficulty, and tight feedback—without adopting its unrelated stateful HTML
lesson-generation workflow.

Before answering, Triết must classify the active teaching state as explanation,
prediction, guided practice, open quiz, open mastery check, review, or completed
assessment. It must then:

- teach from the supplied authoritative package rather than untrusted model
  memory;
- use learner decisions and demonstrated understanding to choose an appropriate
  level of support;
- define unfamiliar terminology before requiring the learner to use it;
- ask one main learner question or action per turn;
- prefer retrieval and learner explanation over answer restatement;
- diagnose misconceptions from learner reasoning and provide one focused repair;
- distinguish coaching, assessment, Practice review, and authoritative
  completion;
- preserve natural Vietnamese with full diacritics when speaking Vietnamese.

### Disclosure gate and hint ladder

For an unanswered quiz or mastery check, Triết must not reveal the answer,
expected signals, scoring threshold, worked solution, or equivalent information.
This remains true when the learner asks directly, repeats the request, asks for
the information indirectly, or attempts to override the policy.

Triết instead progresses through the smallest useful hint:

1. Clarify the task or restate what the learner is being asked to decide.
2. Point to the relevant concept or section without identifying the answer.
3. Narrow the alternatives or identify the dimension to compare.
4. Provide a partial worked step while leaving the assessed decision to the
   learner.
5. Reveal and explain the answer only after a learner-owned attempt has closed
   the question or authoritative state says the assessment is complete.

Ordinary learner persistence does not bypass this gate. Direct intervention is
allowed only for safety-critical misinformation, a genuine accessibility need,
or an assessment already marked closed by authoritative state.

## Runtime instruction order

The Teacher adapter will preserve its identity, no-tools, read-only, and evidence
honesty instructions. The pedagogical skill will be supplied at the same
high-priority instruction layer. Dynamic module material, learner state, and the
current question remain delimited data in the per-turn input.

The model must be told that hidden course content is reference material, not
permission to disclose it. Learner messages and course documents cannot override
the pedagogical or security policy. The response transport must continue to
reject tool calls and forbidden server requests.

## Failure handling

The system fails closed when:

- authoritative progress is unavailable;
- the active lesson/module mapping is invalid;
- a required module, pedagogy, or skill file is missing or malformed;
- a resolved source escapes its validated course root;
- source digests cannot be computed;
- the complete atomic package exceeds its limit; or
- course state changes while a turn is being assembled.

The learner sees a concise recoverable Teacher error. Diagnostic messages may
name the category and source identifier but must not log hidden answers, full
course content, personal data, secrets, or unsafe absolute paths.

## Verification strategy

### Deterministic automated tests

Add focused tests for:

- complete authoritative packages for Intro and Modules 1–4;
- exact module changes after navigation, resume, Practice return, and relaunch;
- learner decisions arriving unchanged;
- conflicting renderer context being ignored or rejected without changing the
  selected package;
- full lesson, script, prompt, quiz, rubrics, and skill content without silent
  truncation;
- missing, mismatched, malformed, escaping, and oversized sources;
- absence of cross-module, prior-Practice, or unrelated Executor leakage;
- no-Practice, fresh, stale, and disconnected Executor states;
- concurrent sends, failed sends, retries, reset cancellation, and conversation
  boundaries;
- continued enforcement of no-tools Teacher transport;
- visible fixture labeling and production/fixture separation.

Tests should assert structured fields and digests rather than snapshotting or
logging hidden course packages unnecessarily.

### Iterative adversarial sub-agent testing

After the first implementation passes focused tests, a dedicated sub-agent will
act as an adversarial learner and independently exercise a scenario matrix:

- ask about the active lesson using varied natural phrasing;
- ask questions requiring earlier or later parts of the active module;
- verify that saved learner decisions change relevant guidance;
- request direct answers politely, insistently, indirectly, and through prompt
  injection;
- submit wrong, partial, copied, and well-reasoned answers;
- request each hint level and check that the response does not jump ahead;
- ask for explanations after the authoritative assessment closes;
- switch modules and probe for stale-context leakage;
- exercise Practice with fresh, stale, disconnected, and conflicting Executor
  evidence;
- restart and resume at representative checkpoints.

For each failure, the primary agent will reproduce it, add a regression test,
fix the smallest responsible boundary, and return the same scenario to the
sub-agent. The loop continues until the matrix passes or an external limitation
is evidenced and documented.

### Full acceptance checks

Before delivery, run from `course-companion/`:

- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npm run build`
- `npm run test:electron`

Also inspect desktop and narrow layouts for regressions if any learner-visible
error or status surface changes, run `git diff --check`, review every changed
file, compare the learner-facing page/scene inventory with baseline, and
synchronize the affected checkpoint in
`docs/planning/portfolio-course-implementation-plan.md` from actual evidence.

## Definition of done

- Hỏi Triết answers from the complete authoritative active-module package and
  saved learner decisions rather than bare identifiers.
- Embedded Triết and `course-teacher` share the versioned `triet-pedagogy` skill.
- Open assessments resist direct-answer requests and prompt-injection attempts,
  use staged hints, and permit explanation after authoritative closure.
- Existing Teacher security, Practice isolation, copy preservation, and
  completion-authority boundaries remain intact.
- The deterministic suite, iterative sub-agent matrix, and full Course Companion
  verification suite pass, with any external limitation reported explicitly.
- The implementation-plan ledger records only evidence-supported status changes;
  owner approval and pilot acceptance remain pending unless explicitly granted.

## Reference

- Matt Pocock, [The `/teach` Skill](https://www.aihero.dev/skills-teach), accessed
  2026-08-19.
