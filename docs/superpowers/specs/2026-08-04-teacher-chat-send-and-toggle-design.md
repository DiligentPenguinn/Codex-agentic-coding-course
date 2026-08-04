# Teacher Chat Send Feedback and Bubble Toggle Design

**Status:** Implemented and verified | **Date:** 4 August
2026 | **Owner:** Duy

## Goal

Make Teacher chat behave like a familiar modern AI conversation:

- a submitted message leaves the composer immediately and appears once in the
  transcript;
- the Teacher visibly enters a thinking state while preparing the reply;
- clicking an open quick-chat bubble minimizes it instead of closing and then
  reopening it.

This applies to the full Practice Teacher view and the compact quick-chat
popover.

## Send interaction

When the learner submits a valid message:

1. capture the submitted text for possible recovery;
2. clear the composer immediately;
3. render the persisted learner message in the transcript;
4. render one temporary Teacher row labeled `Teacher · Thinking…`;
5. prevent duplicate submission while the request is active;
6. replace the temporary row with the real Teacher reply when it arrives.

The thinking row belongs to renderer state only. It is not persisted as a
Teacher message and is never sent back as conversation history.

The row uses a subtle animated indicator when motion is allowed and a static
`Thinking…` label under reduced-motion preferences. Its status is announced
politely to assistive technology without repeatedly announcing animation
frames.

## Failure recovery

If the Teacher request fails:

- remove the temporary thinking row;
- restore the exact submitted text to the composer;
- show the existing sanitized retry message;
- return focus to the composer;
- do not duplicate the learner message in the transcript.

A superseded or disposed request must not restore stale text over a newer
draft or mutate the current conversation.

## Bubble toggle interaction

The compact Teacher bubble follows one predictable click contract:

- single click in `compact` mode opens quick chat;
- single click in `quick-chat` mode closes only the popover and returns to the
  bubble;
- double click expands the full Practice window and selects Teacher;
- keyboard activation keeps the existing full-window expansion behavior;
- right click keeps the existing native menu.

The bubble receives the current presentation mode in its bounded ViewModel.
When the cached mode is `quick-chat`, the click path calls the existing
close-quick-chat IPC operation immediately and never schedules a delayed open.
This makes the action safe even when the quick-chat blur handler also requests
closure.

The bubble marks unread Teacher messages as seen only after a confirmed quick
chat open. Closing or expanding does not falsely mark unread content as seen.

## Boundaries

This change does not alter:

- Teacher inference, prompts, context, or persistence;
- Executor task binding or observation;
- lesson or practice content;
- authentication;
- window security settings;
- native minimize behavior.

## Testing

Focused automated tests must cover:

- immediate composer clearing in full and quick chat;
- one visible thinking row while a request is active;
- thinking removal on success and failure;
- exact draft restoration on failure;
- stale or superseded requests cannot restore old text;
- compact click opens quick chat;
- quick-chat click closes to the bubble without scheduling reopen;
- double click still expands full Practice;
- unread state changes only after confirmed open;
- reduced-motion and accessible status markup;
- full renderer, compact renderer, IPC, and coordinator regressions.

## Acceptance criteria

1. After pressing Send, the message no longer remains in the composer.
2. The transcript shows the learner message and a clear Teacher thinking state.
3. A successful reply replaces the thinking state without duplicate messages.
4. A failed reply restores the submitted text for retry.
5. Clicking the bubble while quick chat is open minimizes to the bubble once
   and does not reopen.
6. Existing expand, context-menu, unread, privacy, and request-ownership
   behavior remains intact.
