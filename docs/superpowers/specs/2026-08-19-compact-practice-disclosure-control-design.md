# Compact Practice Disclosure Control Design

## Scope

Replace the compact Practice checklist's raw chevron glyph with the approved C2
outlined plus/minus disclosure control. Do not change checklist content,
progress calculation, accordion behavior, guidance copy, or the full Practice
workspace.

## Visual Design

Each compact checklist row retains its existing information hierarchy and full
row click target. A 36 px circular control sits at the right edge:

- transparent near-black fill;
- one-pixel muted yellow outline in the resting state;
- two-pixel optically centered strokes drawn with CSS pseudo-elements;
- plus when the row is collapsed;
- minus when the row is expanded.

The control uses geometry rather than a font glyph so its weight, alignment, and
shape remain stable across platforms. Hover and expanded states strengthen the
yellow outline and fill slightly without competing with the primary Review
button. Keyboard focus remains on the full row and uses the existing visible
focus treatment.

## Interaction and Accessibility

The existing row button remains the sole interactive element. `aria-expanded`,
`aria-controls`, single-open state, and the labelled guidance region remain
unchanged. The circular control is decorative and hidden from assistive
technology.

Transitions are limited to color, border, and background changes. Reduced-motion
mode disables nonessential transitions. The 36 px visual control sits inside the
row's larger click target and does not create a nested button.

## Responsive Behavior

The status label and control retain their right alignment at compact desktop
width. At narrow widths, the title may wrap while the control remains circular
and does not shrink. The component must not introduce horizontal overflow.

## Verification

Renderer and source tests will assert that the font chevron is removed, the
CSS-drawn plus/minus states follow `aria-expanded`, no nested interactive control
is introduced, focus remains visible, reduced-motion styling exists, and the
compact checklist fits the Electron smoke viewport. The full unit, startup,
typecheck, lint, production build, and Electron smoke suites must pass.
