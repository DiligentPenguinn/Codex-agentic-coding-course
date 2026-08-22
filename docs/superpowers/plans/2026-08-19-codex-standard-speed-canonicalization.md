# Codex Standard Speed Canonicalization Implementation Plan

## Goal

Make the persisted Codex service-tier alias `default` satisfy the Module 1
Standard-speed requirement without weakening missing or unknown-value handling.

## Steps

1. Add normalizer tests proving `null`, `default`, and `standard` canonicalize to
   protocol value `standard`, while missing stays unverifiable and `priority`
   remains Fast.
2. Change only the service-tier normalization boundary to canonicalize the known
   Standard aliases.
3. Add metadata-reader and Practice-review regression coverage using the exact
   persisted `default` representation.
4. Run focused tests, typecheck, lint, the full suite, production build, and
   Electron smoke.
5. Update the Foundation verification ledger without changing owner or pilot
   acceptance.
