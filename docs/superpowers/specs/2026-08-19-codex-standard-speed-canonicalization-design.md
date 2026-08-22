# Codex Standard Speed Canonicalization Design

## Problem

Codex persists the UI selection `Standard` with more than one protocol
representation. The current bound Practice task persisted `service_tier` as
`"default"`. Course Companion rendered that value with the label `Standard`,
but retained `"default"` as its protocol value. Module 1's deterministic review
correctly requires canonical protocol value `"standard"`, so it produced the
contradictory result `Speed hiện là Standard; cần Standard.`

## Decision

Canonicalize equivalent service-tier representations at the Codex configuration
normalization boundary:

- missing `serviceTier` remains unverifiable;
- explicit `null`, `"default"`, and `"standard"` normalize to protocol value
  `"standard"` with label `Standard`;
- `"priority"` and `"fast"` continue to represent `Fast`;
- unknown strings remain visible as protocol values but unverifiable because
  they have no recognized label.

The review evaluator and Practice definition remain strict and continue to
compare against one canonical value. Protocol aliases do not spread into review
logic or UI components.

## Data Flow

The non-owning metadata reader reads the exact persisted settings event and
passes it to `normalizeCodexTaskConfiguration`. The normalizer canonicalizes the
tier before creating the configuration snapshot. The existing activity
projection, Practice persistence, checklist reconciliation, and deterministic
review then consume the canonical snapshot without any change to task ownership
or Teacher context.

On the learner's next review attempt, the current task is read again. Its
persisted `"default"` value becomes canonical `"standard"`, allowing the Speed
criterion to pass when the other settings still match.

## Error and Safety Boundaries

- Missing tier data must not be interpreted as Standard.
- Unknown tier values must not pass the Standard criterion.
- The repair must not introduce `thread/resume`, `thread/start`, or task
  switching.
- Existing pre/post semantic evidence comparison remains authoritative.

## Verification

Add regression coverage for `null`, `"default"`, and `"standard"` all producing
canonical Standard; preserve `"priority"` as Fast and missing-tier
unverifiability. Run focused normalization, metadata-reader, and Practice-review
tests, followed by typecheck, lint, the full test suite, production build, and
Electron smoke.
