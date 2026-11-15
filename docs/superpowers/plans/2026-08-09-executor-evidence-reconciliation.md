# Executor Evidence Reconciliation Implementation Plan

1. Extend the Executor activity contract and repository validation with bounded
   Executor-reported files/evidence, workspace-confirmed files, and a persisted
   per-run workspace baseline.
2. Add a safe workspace evidence provider that snapshots Git status and content
   signatures with direct process arguments, containment checks, strict bounds,
   and a non-Git fallback.
3. Capture the baseline before opening a newly created Practice Executor thread.
4. Refactor Executor thread rehydration into a just-in-time refresh that merges
   protocol projection with persisted facts instead of replacing them.
5. Add a bounded final-response projector for explicitly reported paths and
   verification lines, retaining provenance instead of presenting claims as
   independently verified.
6. Reconcile workspace-confirmed changes against the run baseline and expose all
   evidence levels distinctly in the Teacher context envelope.
7. Refresh the bound Executor thread before every Hương send and conservatively
   reconcile Practice checklist progress without auto-completing learner review.
8. Add sanitized real-protocol regression fixtures for a silent external Desktop
   turn with no fileChange/commandExecution items, including restart/rebind
   preservation and unrelated-dirty-file exclusion.
9. Extend the mock gateway and Electron rehearsal so Hương must recognize a
   silently completed external Executor result with correct provenance.
10. Run targeted tests, lint, typecheck, all unit/startup tests, the full Electron
    lifecycle, and an independent mock-Teacher audit; fix and repeat until all
    covered scenarios pass consecutively.
