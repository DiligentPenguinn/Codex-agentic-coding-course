# Compact Practice Disclosure Control Implementation Plan

## Goal

Replace the compact checklist's font chevron with the approved C2 outlined,
CSS-drawn plus/minus disclosure control.

## Steps

1. Add source and renderer assertions for the C2 structure, collapsed/expanded
   states, accessibility, reduced motion, and removal of the raw glyph.
2. Replace the decorative chevron span with a semantic-neutral disclosure span.
3. Implement the 36 px outlined circular control and CSS-drawn plus/minus states,
   preserving full-row interaction and narrow-window fit.
4. Run focused UI tests, typecheck, lint, the full suite, production build, and
   Electron smoke.
5. Synchronize the Foundation verification ledger without changing owner or
   pilot acceptance.
