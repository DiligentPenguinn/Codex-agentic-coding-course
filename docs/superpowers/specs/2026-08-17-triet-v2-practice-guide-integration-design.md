# Triet V2 and Module 1 Practice Guide Integration Design

**Date:** 17 August 2026  
**Status:** Approved through the user's merge instruction  
**Branches:** `feature/course-companion-practice-workflow` and `origin/Triet-V2-planning`

## Objective

Adopt the course architecture, curriculum, terminology, and visual system from
`Triet-V2-planning` while retaining the complete Module 1 Practice workflow
and automatic first-run guide implemented on the current branch.

## Authority

- `Triet-V2-planning` is authoritative for course content, modular registries,
  portfolio Modules 2–4, learner-facing terminology, and the Obsidian
  yellow/white/black interface.
- The current branch is authoritative for the versioned Module 1 guide
  definition, isolated guide state, side-effect-free coordinator, accessible
  presentation behavior, semantic anchors, replay, and mastery confirmation.
- The remote Module 1 Practice identity `m1-codex-safe-setup@2.0.0`, its five
  configuration criteria, and its `module-1-mastery` completion destination
  remain unchanged.

## Conflict resolution

- Combine remote portfolio and course-registry services with guide
  repositories and narrow guide IPC in `electron/main/index.ts`.
- Keep the remote modular scene and real-Practice routing in
  `LearningWindow.tsx`, then restore guide loading and mastery confirmation
  at the authoritative Module 1 destination.
- Use the remote Electron journey as the baseline and add the guided Module 1
  path without weakening its portfolio, relaunch, security, or lifecycle
  assertions.
- Preserve guide anchors and lifecycle reporting in the remote
  `TeacherWorkspace` and `PracticeProgress` implementations.
- Change guide-facing “Executor” copy to “Codex task” where the remote product
  uses that term. Stable internal IDs may remain unchanged.
- Restyle guide surfaces to the remote yellow/white/black Obsidian palette.
  Accessibility, focus, reduced motion, pause, skip, resume, and replay remain
  required.

## Invariants

The guide must not send messages, edit configuration, request review, return to
the course, mutate Practice evidence, or award completion. It must remain
optional, isolated from learner progress and Practice receipts, limited to
Module 1, and recover safely when its content or state is unavailable.

## Verification

Run focused guide, Module 1, progress, course-registry, and palette tests;
typecheck and lint; the complete unit/startup suite; production build; the full
Electron journey; Pilot course-state tests; and a final clean merge-range audit.

