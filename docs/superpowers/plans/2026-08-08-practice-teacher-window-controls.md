# Practice Teacher Window Controls Implementation Plan

**Goal:** Make Practice Teacher transitions explicit and state-safe, keep the floating Hương bubble topmost when enabled, and remove the misleading `Mở bài học` action.

**Architecture:** Preserve the existing learning and companion `BrowserWindow` split. Add narrow IPC commands for full-screen Teacher entry and direct minimize-to-bubble. Keep lesson navigation state in the learning renderer and native visibility/topmost behavior in Electron's main process.

**Tech stack:** Electron 43, React 19, TypeScript 6, CSS, Vitest, Playwright Electron smoke tests.

**Approved design:** [`../specs/2026-08-08-practice-teacher-window-controls-design.md`](../specs/2026-08-08-practice-teacher-window-controls-design.md)

## Task 1: Lock the window-transition contract in tests

**Files:** `course-companion/tests/electron-smoke.mjs`

- Replace `Mở bài học` expectations with accessible expand and minimize-to-bubble controls.
- Assert windowed Teacher expands without changing the lesson checkpoint.
- Assert full-screen minimize hides the learning window and restores a 72×72 bubble directly.
- Assert full-screen close reveals the unchanged lesson.
- Assert enabled always-on-top survives companion show and mode changes; disabled state is respected.

## Task 2: Add narrow cross-window IPC

**Files:** `course-companion/shared/contracts.ts`, `course-companion/electron/preload/index.ts`, `course-companion/electron/main/index.ts`

- Replace the overloaded learning-window restore flow with explicit `showFullTeacher` and `minimizeFullTeacher` commands.
- Send a dedicated full-Teacher renderer event when the learning window is shown for Practice.
- Make every transition converge on one visible window.
- Centralize companion topmost reassertion and invoke it after create, show, restore, and resize without stealing focus.

## Task 3: Implement presentation-specific Teacher controls

**Files:** `course-companion/src/renderer/src/components/TeacherWorkspace.tsx`, `course-companion/src/renderer/src/surfaces/CompanionWindow.tsx`, `course-companion/src/renderer/src/surfaces/LearningWindow.tsx`, `course-companion/src/renderer/src/styles.css`

- Remove `Mở bài học` from `TeacherWorkspace`.
- Add an icon-only expand control to windowed Teacher.
- Add an icon-only minimize-to-bubble control to full-screen Teacher.
- Keep the full-screen close control as the route back to the unchanged lesson.
- Provide Vietnamese accessible names, titles, hover state, and visible keyboard focus.

## Task 4: Update product documentation

**Files:** `course-companion/README.md`

- Document bubble, windowed, full-screen, close, and minimize behavior.
- Document that always-on-top reassertion respects the saved setting.

## Task 5: Verify the implementation

- Run `npm run typecheck`.
- Run `npm run lint`.
- Run `npm test`.
- Run `npm run build`.
- Run `npm run test:electron`.
- Review `git diff --check` and confirm only intended files changed.
