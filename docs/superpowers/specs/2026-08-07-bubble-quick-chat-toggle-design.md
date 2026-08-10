# Bubble Quick-Chat Toggle Design

## Goal

A single bubble click opens quick chat when closed and closes it when open, without reopening after the quick-chat blur event. Double-click still expands full Practice.

## Design

The window coordinator owns a `toggleQuickChat` action. The bubble invokes that action after the existing single-versus-double-click delay. Quick-chat blur remains an outside-click close, but defers its decision until focus settles and does not close when focus moved to the bubble; the subsequent bubble toggle then closes it exactly once.

This avoids timing suppression and keeps native window state authoritative. Tests cover closed-to-open, open-to-closed, blur-to-bubble ordering, outside blur, and unchanged double-click expansion.
