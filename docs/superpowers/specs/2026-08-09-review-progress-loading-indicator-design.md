# Review Progress Loading Indicator Design

## Problem

The review-progress button currently replaces its clipboard/check icon with a square three-sided border while a review is running. A still frame resembles a broken `C` glyph rather than a loading indicator, and the disabled opacity further weakens the signal.

## Design

Keep the clipboard/check icon visible throughout the review so the control retains its meaning. While `reviewBusy` is true, dim that base icon slightly and overlay a small circular spinner at its upper-right corner. The button remains disabled, exposes `aria-busy="true"`, and keeps the same accessible name and tooltip.

The spinner will use a smooth circular border rather than the current square, stepped animation. Under `prefers-reduced-motion`, it will become a static progress badge rather than rotating.

The same component renders both the windowed and full-screen Teacher chat, so the treatment will remain identical on both surfaces.

## Scope

- Update the review button markup to render its base icon during loading and add an overlaid busy indicator.
- Add narrowly scoped CSS for icon dimming, spinner placement, and animation.
- Leave the return-to-course button behavior unchanged.
- Add assertions covering the busy-state structure and accessible state.
- Exercise the loading state in the Electron smoke test and verify that it clears after review.

## Success Criteria

- The button remains recognizable as “review progress” while busy.
- Loading is visibly distinct without relying on tooltip text.
- No clipped or three-sided square glyph appears.
- Windowed and full-screen Teacher surfaces share the behavior.
- Reduced-motion users receive a clear non-animated busy state.
