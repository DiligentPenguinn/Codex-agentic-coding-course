# Bubble Quick-Chat Toggle Implementation Plan

**Goal:** Remove the bubble blur/reopen race while preserving outside-click close and double-click expand.

1. Add a shared toggle IPC channel and preload bridge action.
2. Add coordinator `toggleQuickChat` routing by requested presentation mode.
3. Make quick-chat blur defer and ignore focus moving to the bubble.
4. Update bubble controller to invoke toggle.
5. Add focused IPC, renderer, and coordinator regression tests.
6. Run focused and complete unit suites plus `git diff --check`.
