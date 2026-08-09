# Practice Teacher Window Controls Design

**Status:** Approved for implementation
**Date:** 8 August 2026  
**Implementation target:** `course-companion/`

## Follow-up UI regression fixes

- The full Practice Teacher surface must cover the complete renderer viewport with an opaque background. The lesson remains mounted so closing Teacher can restore it unchanged, but no lesson content may remain visible while full Teacher is open.
- The Teacher message log owns its scroll position. It scrolls directly to its end after messages load or change and whenever the learner returns from the Progress tab; it must not call `scrollIntoView`, which can move ancestor containers instead of only the chat log.
- The windowed Teacher keeps its existing size and visual treatment. Scroll containment prevents wheel or touch gestures at the edge of the message history from leaking into the underlying surface.


## Goal

Make the Practice Teacher window behave as one predictable three-state surface:
a topmost bubble, a compact windowed Teacher, and a full-screen Teacher. Window
controls must change only the Teacher presentation state. They must not
silently navigate the learner back into the lesson or expose a misleading
`Mở bài học` action.

## Current problems

1. The floating Hương bubble can fall behind Codex after Codex is reopened or
   brought to the foreground, even when the saved always-on-top setting is on.
2. `TeacherWorkspace` exposes the same `Mở bài học` callback in compact and
   full-screen contexts. In full-screen Practice, the action changes the lesson
   surface and leaves Teacher in a windowed state, combining two unrelated
   transitions in one control.
3. The existing full-screen shortcut is not represented by the explicit expand
   icon required by the approved Practice interaction design.

## Approved interaction contract

The Teacher has three presentation states:

| State | Visible surface | Expand/minimize behavior |
|---|---|---|
| Bubble | 72×72 floating Hương launcher | Single click opens windowed Teacher; double click may remain as a full-screen shortcut. |
| Windowed Teacher | 380×520 floating Teacher workspace | An explicit expand icon opens full-screen Teacher. |
| Full-screen Teacher | Teacher overlay filling the learning window | An explicit minimize-to-bubble icon hides the learning window and restores the 72×72 bubble directly. |

Additional rules:

- Remove `Mở bài học` from every Teacher workspace.
- Expanding Teacher must not change lesson progress, destination, checkpoint,
  active Practice, selected Teacher/Progress tab, or conversation state.
- Minimizing full-screen Teacher returns directly to the bubble. It must not
  pass through the windowed Teacher state or reveal the lesson.
- The existing close control in full-screen Teacher remains the deliberate way
  to dismiss Teacher and reveal the unchanged lesson.
- Compact minimize returns from windowed Teacher to the bubble.
- Icon-only controls require a Vietnamese accessible name, keyboard focus
  treatment, and a tooltip/title.

## Architecture

Keep the existing two-window Electron architecture:

- the learning `BrowserWindow` owns lesson content and the full-screen Teacher
  overlay;
- the transparent companion `BrowserWindow` owns the bubble and windowed
  Teacher; and
- main-process IPC owns cross-window show, hide, focus, bounds, and topmost
  transitions.

Do not convert the feature into one resizable native window. That would require
a larger lifecycle and persistence refactor without improving the requested
behavior.

## Component responsibilities

### `TeacherWorkspace`

Replace the generic `onOpenLesson` contract with a presentation-specific
expand action. Render the expand control only in the windowed companion. In the
embedded full-screen overlay, render the minimize-to-bubble control instead.
The footer must no longer contain `Mở bài học`.

### `CompanionWindow`

- Bubble single click: set companion mode to `expanded`.
- Bubble double click: request full-screen Teacher.
- Windowed expand icon: request full-screen Teacher.
- Windowed minimize: set companion mode to `compact`.

The request for full-screen Teacher must compact and hide the companion window,
show the learning window, and tell the learning renderer to display Teacher in
Practice full-screen mode. It must not navigate the lesson.

### `LearningWindow`

Treat full-screen Teacher as presentation state layered over the existing
lesson state. Its controls are:

- close: dismiss the overlay and reveal the unchanged lesson;
- minimize-to-bubble: clear the overlay state, hide the learning window, and
  show the compact companion bubble.

The learning-window visibility event must distinguish a normal lesson restore
from a full-screen Teacher request so it cannot accidentally recreate the old
`Mở bài học` transition.

### Electron main process

Expose narrow commands for the two cross-window transitions:

1. show full-screen Teacher; and
2. minimize full-screen Teacher to the bubble.

The main process remains authoritative for native visibility and bounds. The
renderer remains authoritative only for which Teacher presentation to render.

## Always-on-top behavior

When `companionAlwaysOnTop` is enabled, apply the topmost state when the
companion window is:

- created;
- shown after Practice starts or resumes;
- repositioned or changes between compact and expanded bounds; and
- restored from full-screen Teacher.

After showing the companion, explicitly move it to the top without activating
or stealing typing focus from Codex. Reassertion must respect the saved setting:
when the learner disables always-on-top, none of these lifecycle paths may turn
it back on.

The implementation should use Electron's supported window APIs already present
in the installed dependency. It must not add polling, global hooks, native
addons, or a parent-child relationship with Codex.

## State and persistence

No new durable Practice or lesson state is required. Continue persisting:

- `companionMode` for bubble versus windowed Teacher; and
- `companionAlwaysOnTop` for the learner's topmost preference.

Full-screen Teacher is transient presentation state. Restart recovery should
continue from the saved active Practice and compact companion mode rather than
attempting to reopen an interrupted full-screen overlay.

## Error handling

- If a cross-window request fails, keep the currently visible surface usable
  and show the existing learner-safe UI error path where applicable.
- Never leave both the companion and learning windows hidden after a requested
  transition.
- Never reveal raw Electron or IPC errors in learner-facing copy.
- Repeated expand or minimize requests must be harmless and converge on one
  visible target state.

## Testing

### Renderer and component checks

- `Mở bài học` is absent from compact and full-screen Teacher workspaces.
- Windowed Teacher exposes an expand icon with an accessible name.
- Full-screen Teacher exposes a minimize-to-bubble icon with an accessible
  name.
- Full-screen close reveals the unchanged lesson.
- Active Teacher/Progress tab and conversation remain intact across
  presentation changes.

### Electron smoke checks

1. Start Practice and verify the 72×72 bubble is visible and topmost.
2. Bring or reopen Codex in the foreground and verify the enabled bubble stays
   above it.
3. Single-click the bubble and verify the 380×520 windowed Teacher.
4. Use the expand icon and verify full-screen Teacher appears without lesson
   navigation or checkpoint changes.
5. Use minimize-to-bubble and verify the learning window hides while the 72×72
   bubble appears directly.
6. Reopen full-screen Teacher, close it, and verify the unchanged lesson is
   revealed.
7. Disable always-on-top and verify show, resize, expand, and minimize flows do
   not re-enable it.
8. Relaunch the application and verify the saved always-on-top preference is
   honored.

## Acceptance criteria

The change is complete when:

1. the Hương bubble reliably remains above Codex whenever its always-on-top
   setting is enabled;
2. no Teacher surface contains a `Mở bài học` button;
3. windowed Teacher has an explicit expand icon;
4. full-screen Teacher has an explicit minimize-to-bubble icon;
5. expanding does not navigate or mutate lesson and Practice state;
6. minimizing full-screen Teacher returns directly to the bubble with the
   learning window hidden;
7. closing full-screen Teacher reveals the unchanged lesson; and
8. automated tests cover the transitions and preference behavior above.
