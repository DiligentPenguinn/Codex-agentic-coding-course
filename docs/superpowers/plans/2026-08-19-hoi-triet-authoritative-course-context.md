# Hỏi Triết Authoritative Course Context Implementation Plan

**Design authority:** `docs/superpowers/specs/2026-08-19-hoi-triet-authoritative-course-context-design.md`

**Goal:** Supply embedded Triết with the complete authoritative active-module package and learner decisions, enforce a shared pedagogical disclosure policy, and iteratively verify real learner scenarios without weakening Teacher or Practice isolation.

## Task 1: Create and validate the shared pedagogical skill

**Files**

- Create: `pilot-workspace/.agents/skills/triet-pedagogy/SKILL.md`
- Create: `pilot-workspace/.agents/skills/triet-pedagogy/agents/openai.yaml`
- Modify: `pilot-workspace/.agents/skills/course-teacher/SKILL.md`
- Add/modify focused skill contract tests under `course-companion/tests/`

**Steps**

1. Add a concise, automatically discoverable skill for active teaching-state classification, learner-level adaptation, staged hints, assessment disclosure gates, misconception repair, and completion honesty.
2. Preserve the Teacher/Learner/Executor authority split and Vietnamese-first beginner support.
3. Make `course-teacher` load the shared skill before teaching without duplicating its policy.
4. Add structural tests for discoverability and the cross-skill dependency.
5. Run the bundled skill validator and focused tests.

## Task 2: Add an authoritative course-context repository

**Files**

- Create: `course-companion/electron/main/teacher-course-context-repository.ts`
- Modify: `course-companion/shared/contracts.ts`
- Modify: `course-companion/electron/main/index.ts`
- Add: `course-companion/tests/teacher-course-context-repository.test.ts`

**Steps**

1. Define a structured module package with source-relative identifiers, full content, and SHA-256 digests.
2. Map Intro and Modules 1–4 to strict allowlists for lesson, Teacher script, start prompt, and quiz.
3. Load the shared Teacher prompt, delivery contract, hint ladder, quiz protocol, mastery rubric, and `triet-pedagogy` skill.
4. Resolve development and packaged course roots through validated candidates and an optional test-only override.
5. Reject root escapes, missing files, invalid progress/module mappings, content changes during assembly, and packages beyond the measured atomic ceiling.
6. Test every module plus malformed, missing, escaping, mismatched, and oversized scenarios.

## Task 3: Extend the Teacher envelope without lossy course truncation

**Files**

- Modify: `course-companion/electron/main/teacher-context-broker.ts`
- Modify: `course-companion/electron/main/teacher-service.ts`
- Modify: `course-companion/electron/main/index.ts`
- Modify: `course-companion/tests/teacher-context-broker.test.ts`
- Modify: `course-companion/tests/teacher-service-scenarios.test.ts`

**Steps**

1. Inject the verified course package and full authoritative learning state into every Teacher turn.
2. Include `currentCourseLessonId`, completed checkpoints, saved decisions, and Practice state from Electron-owned progress.
3. Keep course and pedagogy sources atomic while compacting only dynamic history, summaries, and Executor observations.
4. Replace the old 24,000-character total cap with separate atomic-course and bounded-dynamic limits sized from repository evidence.
5. Recheck progress after package assembly and cancel the turn if authoritative state changed.
6. Preserve exact active-Practice and bound-Executor filtering.
7. Add regressions proving complete Module 2 input, decision propagation, module switching, and absence of cross-module leakage.

## Task 4: Apply the skill at the Teacher instruction boundary

**Files**

- Modify: `course-companion/electron/main/real-teacher-adapter.ts`
- Modify: `course-companion/electron/main/teacher-service.ts`
- Modify: `course-companion/tests/real-teacher-adapter.test.ts`
- Modify: `course-companion/tests/real-teacher-adapter-reliability.test.ts`

**Steps**

1. Supply the verified pedagogical skill at the high-priority Teacher instruction layer.
2. Keep dynamic module sources and learner messages delimited as untrusted data.
3. Preserve the ephemeral read-only, no-approval, no-tools transport and forbidden-item interruption.
4. Test instruction ordering, skill inclusion, prompt-injection separation, and existing transport failures.

## Task 5: Remove renderer authority and improve recoverable failures

**Files**

- Modify: `course-companion/shared/contracts.ts`
- Modify: `course-companion/electron/preload/index.ts` if the public contract changes
- Modify: `course-companion/electron/main/teacher-fixture.ts`
- Modify: `course-companion/electron/main/index.ts`
- Modify: `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`
- Modify relevant fixture, renderer, and Electron smoke tests

**Steps**

1. Remove the optional renderer-supplied Teacher context or reduce it to a non-authoritative consistency assertion.
2. Ensure IPC always delegates content selection to the main-process service.
3. Surface sanitized categories for unavailable progress, invalid module packages, and oversize packages without exposing hidden course content or absolute paths.
4. Preserve approved learner-facing copy unless a new scoped error is strictly required.
5. Verify retry persistence and simulated/production labeling.

## Task 6: Focused deterministic integration pass

1. Run the new repository, broker, service, adapter, and skill contract tests.
2. Run existing Teacher boundary, Practice boundary, fixture, reliability, progress, and course-registry tests.
3. Fix every regression at the smallest responsible boundary and rerun the focused set until it passes consecutively.

## Task 7: Iterative adversarial sub-agent testing

**Owner:** a dedicated testing sub-agent that does not implement production changes.

1. Give the sub-agent the approved spec, built application behavior, and scenario matrix without suggesting expected defects.
2. Exercise lesson questions across Intro and Modules 1–4, saved decisions, navigation, relaunch, and Practice return.
3. Probe premature disclosure with polite requests, repeated demands, indirect extraction, hypothetical framing, answer confirmation, and prompt injection.
4. Exercise wrong, partial, copied, and reasoned answers; every hint level; and post-closure explanations.
5. Probe fresh, stale, disconnected, mismatched, and absent Executor evidence.
6. For each reported failure, reproduce it, add a regression test, implement the smallest fix, and return the same scenario to the sub-agent.
7. Stop only after the matrix passes or an evidenced external limitation is documented.

## Task 8: Full validation, inventory check, and plan synchronization

1. Run `npm run typecheck` from `course-companion/`.
2. Run `npm run lint`.
3. Run `npm test`.
4. Run `npm run build`.
5. Run `npm run test:electron`.
6. Run the skill validator against `pilot-workspace/.agents/skills/triet-pedagogy`.
7. Run `git diff --check` and inspect every changed file.
8. Compare the learner-facing page, scene, route, and navigation inventory with baseline; restore any unapproved removal.
9. Re-read the affected checkpoint in `docs/planning/portfolio-course-implementation-plan.md` and update only evidence-supported implementation, verification, gaps, and next action. Do not infer owner approval or pilot acceptance.
10. Report the completed repair, test evidence, any external limitation, and the implementation-plan ledger state.
