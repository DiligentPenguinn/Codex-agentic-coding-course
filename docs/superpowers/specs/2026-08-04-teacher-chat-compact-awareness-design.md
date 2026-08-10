# Teacher Chat Compactness and Mission Awareness Design

## Goal

Make Teacher chat fast to use in both full and quick-chat views, align native minimize with the compact Teacher workflow, and ensure the Teacher guides the learner from the active mission rather than redirecting them to the Executor.

## Scope

This change covers the Electron practice prototype in `prototypes/app-startup-electron-mock`:

- full Practice Teacher composer;
- compact quick-chat composer;
- main-window minimize behavior;
- Teacher context contract and turn instructions;
- focused automated tests for those behaviors.

It does not change Executor behavior, lesson content, task binding, or the compact bubble interaction.

## Composer Behavior

Both Teacher textareas start at a single visible line. They grow automatically as content wraps or gains explicit newlines, up to a fixed maximum height. Beyond that height, the textarea scrolls internally. Clearing or successfully sending a message returns the field to one line.

Keyboard behavior is identical in both views:

- `Enter` submits a non-empty message;
- `Shift+Enter` inserts a newline;
- submission remains blocked while a Teacher request is active;
- the existing Send button remains available and follows the same validation rules.

The key handler prevents the newline only when it is converting `Enter` into a submission. IME composition must not be submitted prematurely.

## Minimize Behavior

The native minimize action on the full Practice window transitions to `compact` presentation mode. The main window is hidden and the compact Teacher bubble is shown, matching the existing Compact Teacher button. The coordinator prevents the operating system's default minimize result so the app does not leave both a minimized main window and a compact bubble.

Restoring through the bubble continues to use the existing full-mode transition and selects the Teacher tab.

## Teacher Context

The Teacher context envelope becomes the single authoritative payload for both course identity and active mission guidance. In addition to the existing course IDs, Executor activity, freshness, privacy, and provenance, it includes a bounded mission snapshot derived from the pinned practice start request:

- title and description;
- learning outcomes;
- learner instructions;
- allowed and prohibited actions;
- expected evidence;
- content kind and version.

The shared parser validates and bounds this mission snapshot before it reaches the Teacher adapter. No Teacher-side file reads or unbound task context are introduced.

## Teacher Guidance Contract

Each Teacher turn instructs the model to:

- answer from the active mission and bound Executor evidence;
- tell the learner the concrete next step when asked what to do;
- explain how that step advances the mission objective;
- distinguish guidance from execution without telling the learner to go ask the Executor;
- disclose stale or disconnected Executor evidence when relevant;
- avoid inventing progress that is absent from the envelope.

The Teacher may recommend an action the learner should perform in the Executor task, but must phrase that action as direct guidance rather than a handoff of responsibility.

## Data Flow

1. Practice startup pins and validates the mission content.
2. The orchestrator creates a Teacher envelope from that start request and the latest bound Executor activity.
3. The context broker serializes the validated envelope, recent Teacher chat, and current learner message into the Teacher turn.
4. The adapter returns the Teacher response through the existing persisted chat flow.
5. Full and quick-chat renderers receive the same resulting conversation state.

## Error Handling

Existing send-failure behavior remains: preserve the draft, show the local error, and restore focus. Auto-sizing runs whenever the rendered draft changes, including after failures and successful clearing. Minimize transition failures retain the last applied presentation mode through the coordinator's existing transition recovery.

## Testing

Add or update focused tests to verify:

- both HTML composers declare one initial row;
- auto-size behavior grows, caps, and resets;
- `Enter` submits, `Shift+Enter` does not, and composition is respected;
- native minimize invokes the compact transition and prevents default minimization;
- the context parser accepts the mission snapshot and rejects malformed or extra fields;
- the Teacher turn includes mission objectives and the direct-guidance contract;
- existing privacy, freshness, retry, and stale-request guarantees remain intact.

## Acceptance Criteria

- Both Teacher chat fields display as one line when empty.
- Long text expands each field automatically up to a readable cap.
- Pressing `Enter` sends exactly once; `Shift+Enter` adds a newline.
- Clicking native minimize shows the compact Teacher bubble instead of a taskbar-minimized main window.
- Given the active mission context, a learner asking “Bây giờ tôi phải làm gì?” receives a concrete mission-aligned next step and is not told to ask the Executor what to do.
