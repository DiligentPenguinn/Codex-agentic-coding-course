# Real Teacher and Persistent Practice Memory Design

**Status:** Approved design; written specification pending user review  
**Date:** 8 August 2026  
**Implementation target:** `course-companion/`

## Purpose

Replace Hương's fixture replies with a real Codex-backed Teacher that always receives the current course and Practice context. Establish the first durable memory layer for the Teacher so that current work stays detailed, earlier attempts remain useful as summaries, and the application—not the inference model—owns authoritative state.

## Outcomes

- Hương answers through a real Codex App Server Teacher thread.
- Every Teacher turn receives a fresh, bounded context envelope assembled from authoritative local state.
- The active Practice run is represented at full normalized fidelity.
- Earlier runs of the same Practice are represented by guarded Hương-generated summaries.
- Other Practices contribute durable learner-level takeaways without injecting their raw task histories.
- Teacher memory survives application restarts and lesson transitions until the learner explicitly resets course data.
- The UI truthfully distinguishes connecting, live, stale, offline, and memory-pending states.

## Non-goals

- Hương does not call tools, inspect files directly, edit memory, control Executor tasks, or approve actions.
- Hương does not automatically pass or fail a Practice.
- This slice does not add embeddings, vector search, cloud memory, multi-user accounts, proactive coaching, or background autonomous work.
- Raw hidden reasoning, credentials, environment dumps, unrestricted tool output, and unrelated Codex task content are never Teacher memory.

## Research basis

The design follows the shared pattern found in current agent memory systems:

- Hermes Agent keeps small curated memory always in context while storing complete searchable sessions separately in SQLite.
- OpenClaw separates compact durable memory from detailed working notes and searchable history, and flushes durable information before compaction.
- Letta distinguishes always-visible memory blocks from archival memory and supports read-only blocks.
- LangGraph separates thread-scoped working memory from namespaced cross-thread memory and supports background consolidation.

Primary references:

- <https://hermes-agent.nousresearch.com/docs/user-guide/features/memory>
- <https://github.com/NousResearch/hermes-agent/blob/main/website/docs/developer-guide/session-storage.md>
- <https://docs.openclaw.ai/concepts/memory>
- <https://docs.openclaw.ai/compaction>
- <https://docs.letta.com/v1-sdk/memory/memory-blocks>
- <https://docs.letta.com/v1-sdk/memory/context-hierarchy>
- <https://docs.langchain.com/oss/python/concepts/memory>

The Course Companion adopts the layered-memory principle while keeping storage local, inspectable, course-scoped, and independent of any one model thread.

## Current baseline

The current application already has:

- a Codex App Server client used to create and open a dedicated Executor task;
- a verified active Practice binding stored by the main process;
- lesson, scene, and checkpoint context passed to the Teacher IPC handler;
- persistent Teacher chat history in `teacher-chat.jsonl`;
- a fixture-only `FixtureTeacherAdapter`;
- fixture-only Practice completion events.

It does not yet observe Executor notifications, assemble bound Executor activity for Hương, run real Teacher inference, or maintain structured cross-run Teacher memory.

## Architecture

### Trust boundary

The Electron main process remains the trust boundary. Renderer code can request a Teacher response and display a sanitized view model, but it cannot select arbitrary Codex threads, inject raw observations, mutate memory, or receive private App Server payloads.

### Components

1. **Codex App Server client**
   - Retains request/response support.
   - Adds bounded notification subscription and lifecycle reporting.
   - Never forwards raw protocol messages to the renderer or persistent logs.

2. **Executor activity observer**
   - Accepts events only for the exact active Practice `threadId`.
   - Normalizes allowed prompt, final-response, approval, changed-file, verification, status, and freshness facts.
   - Ignores unrelated and decoy tasks.
   - Stores no hidden reasoning or unrestricted tool payloads.

3. **Teacher memory repository**
   - Stores a versioned local memory document with atomic temp-file replacement.
   - Stores course-level learner takeaways and per-Practice archived-run summaries.
   - Preserves provenance, generation status, and source digests.
   - Recovers from malformed data by retaining valid sections and reporting recovery truthfully.

4. **Teacher context broker**
   - Reads authoritative progress, active Practice, normalized Executor activity, Teacher chat, and persistent memory.
   - Builds the complete bounded envelope for every reply and summary operation.
   - Applies ordering, size limits, provenance labels, redaction, and freshness rules.

5. **Real Teacher inference adapter**
   - Uses guarded ephemeral Codex threads for replies and hidden run-summary operations.
   - Runs read-only with `approvalPolicy: never`, no available tools, bounded text input, and fixed developer instructions.
   - Validates thread ownership, turn ownership, terminal status, response type, and response length.
   - Interrupts and rejects any Teacher turn that attempts a tool operation.

6. **Teacher service**
   - Persists learner messages before inference.
   - Prevents duplicate learner messages during retry.
   - Appends only validated live Teacher responses.
   - Exposes sanitized connection and memory status to both Teacher surfaces.

### Why the Codex Teacher thread is not the memory authority

The Teacher thread may be recreated after disconnects, upgrades, or application restarts. Every turn therefore carries the current canonical envelope. Correctness never depends on opaque model-thread retention. Local Course-owned state supports inspection, reset, migration, deterministic scoping, and selective cross-run compaction.

## Memory hierarchy

### Always-present course memory

The Teacher always receives:

- current lesson, scene, checkpoint, objective, and completion criteria;
- explicit learner decisions recorded by the course;
- durable observed or clearly labelled inferred learning signals;
- unresolved learning needs;
- current Practice identity and freshness.

### Active Practice memory

The active run contributes full normalized context:

- run identity and objective;
- expected outcome and constraints;
- bound Executor identity retained only inside the main-process envelope;
- learner prompts observed in the bound task;
- final Executor responses;
- status and approval events;
- changed-file paths;
- verification evidence;
- timestamps and freshness;
- current-run Teacher conversation.

Full fidelity means all normalized facts needed to understand the current attempt, not raw App Server events or hidden reasoning. If the envelope reaches its hard size limit, the broker compacts the oldest active-run narrative into a source-linked active-run digest while retaining the objective, constraints, current status, approvals, changed files, verification evidence, unresolved issues, and most recent exchanges. The envelope declares any compaction explicitly.

### Previous runs of the same Practice

Each earlier run is included as a bounded `PracticeRunSummary`. Raw prior Executor and Teacher transcripts remain local for audit and regeneration but are not injected on every turn.

A summary contains:

- Practice ID, run ID, attempt number, and outcome;
- objective and attempted approach;
- important learner decisions;
- approvals requested or granted;
- changed files reported by verified observations;
- verification evidence;
- demonstrated strengths and recurring mistakes;
- unresolved issues;
- guidance for the next attempt;
- start, end, and summary timestamps;
- source digest, model identifier, freshness, and summary quality.

### Other Practices

Other Practice types do not contribute raw task histories or their complete per-run summaries. They contribute only durable learner-level takeaways that remain useful across the course, such as demonstrated verification habits, recurring scope mistakes, stable preferences, and unresolved learning needs. Every takeaway retains its source Practice and whether it was directly observed or inferred.

## Run rollover and Hương-generated summaries

When the learner starts a new run while another run of the same Practice exists:

1. Freeze an immutable normalized snapshot of the old run.
2. Commit the Practice switch using the existing recoverable transition mechanism.
3. Send the frozen snapshot to a dedicated hidden Hương summarization turn.
4. Require a strict structured summary response.
5. Validate every factual field against the frozen source snapshot.
6. Persist the accepted summary and update course-level takeaways.
7. Inject the summary into subsequent Teacher envelopes for that Practice.

Hương proposes memory; Course Companion accepts and stores it. The validator rejects unknown task IDs, file paths, approvals, evidence, or outcomes. Strengths, mistakes, and guidance may be inferred, but must be labelled as inference and remain grounded in cited source facts.

The summarization turn uses the same Teacher identity and model policy but a separate ephemeral thread so hidden maintenance work cannot contaminate the learner-visible Teacher conversation.

### Summary failure

Starting a new Practice is never blocked by unavailable inference. On timeout, disconnect, invalid output, or validation failure:

- store a minimal source-derived fallback record;
- mark the summary `pending-refinement`;
- show a truthful memory-pending state;
- retry once the Teacher service reconnects or on the next relevant application load;
- replace the fallback atomically only after a validated Hương summary succeeds.

## Teacher turn data flow

1. The renderer submits bounded learner text.
2. The main process validates the request and derives the current checkpoint itself.
3. The Teacher service persists one pending learner message.
4. The context broker builds a fresh envelope from authoritative sources.
5. The inference adapter ensures a verified ephemeral read-only Teacher thread.
6. It submits one text input containing fixed Teacher instructions, the structured envelope, recent visible chat, and the learner message.
7. It accepts only a final agent message from the verified Teacher turn.
8. The service bounds, validates, labels, and persists the response as `live`.
9. Both renderer surfaces reload or receive the sanitized conversation state.

The same Teacher thread may be reused during one application process for conversational continuity, but every turn still includes the fresh canonical envelope.

## Connection and memory states

- `connecting`: App Server or Teacher inference setup is starting.
- `live`: the last response used a current verified context envelope.
- `stale`: stored context exists but Executor observation freshness is no longer current.
- `offline`: real inference is unavailable; the learner can retry without losing or duplicating their message.
- `memory-pending`: one or more archived runs still use fallback summaries awaiting guarded Hương refinement.

The UI replaces `TEACHER · MÔ PHỎNG`, `CHƯA KẾT NỐI TEACHER LIVE`, and message badges with truthful live/degraded states. Fixture mode remains available only through the explicit test gateway and is visibly labelled as simulated.

## Failure handling

- A Teacher setup failure leaves the learner message pending and returns a fixed safe error.
- Retry reuses that pending message instead of appending another copy.
- Concurrent Teacher sends are rejected while one response is active.
- Teacher turns have a fixed timeout and are interrupted on timeout or disposal.
- A forbidden Teacher tool item is a boundary violation: interrupt the turn, discard its output, and show a safe failure.
- A disconnected observer marks Executor context stale or offline; Hương may discuss stored facts but cannot claim current awareness.
- Malformed or oversized App Server events are ignored and recorded only as a fixed diagnostic category.
- Late responses from replaced or disposed threads are ignored after verified interruption/unsubscription.
- Reset clears Teacher chat, persistent Teacher memory, summary records, active observation state, and Practice bindings.

## Security and privacy rules

- Only the exact bound Executor `threadId` is observable.
- No renderer API accepts an arbitrary thread ID.
- Teacher context uses an allowlist of normalized facts.
- Raw JSON-RPC payloads, credentials, authorization data, environment variables, hidden reasoning, and unrestricted tool results are neither persisted nor rendered.
- File paths in summaries must be a subset of verified changed-file observations.
- Approval and evidence claims must match verified source facts.
- Memory preserves source authority and expiry but does not replace sandbox or approval enforcement.
- Hương has no memory-write tool. All persistent updates pass through application validation.

## Persistence and migration

- Add explicit schema versions to Teacher messages, memory documents, normalized observations, and run summaries.
- Write structured documents through temp-file replacement and retain the last valid state on interrupted writes.
- Keep the existing append-only chat history, extending messages with live source, delivery status, and optional Practice run identity.
- Migrate valid fixture messages as historical simulated messages; never relabel them as live.
- Bound retained summaries per Practice and preserve their source snapshots locally for regeneration until course reset.

## Testing strategy

### Unit tests

- App Server notification subscription and disposal.
- Exact bound-thread filtering and decoy-task exclusion.
- Event allowlisting, normalization, redaction, ordering, size bounds, and freshness.
- Context-envelope assembly for course, active run, earlier same-Practice runs, and cross-Practice takeaways.
- Teacher thread and turn verification, response extraction, timeout, interruption, and forbidden-tool rejection.
- Pending-message persistence and duplicate-free retry.
- Hương summary schema validation, source-grounding checks, fallback creation, and later refinement.
- Atomic persistence, schema migration, corruption recovery, and reset.

### Integration tests with the fake App Server

- Start Practice, observe bound Executor activity, and receive a grounded live Teacher answer.
- Emit visibly different decoy activity and prove it never enters context, persistence, or UI.
- Replace a run, generate a guarded summary, and prove the new run receives the summary plus full current context.
- Start a different Practice and prove only durable cross-Practice takeaways transfer.
- Exercise connecting, live, stale, offline, timeout, invalid response, boundary violation, retry, and memory-pending paths.
- Relaunch with the same user-data directory and prove memory rehydration.

### Electron smoke tests

- Both compact and full Teacher surfaces display truthful source and connection states.
- A failed send preserves the learner message and draft/retry affordance without duplication.
- Live history survives surface switches and application restart.
- Starting a new run exposes the prior summary after successful consolidation.
- Course reset removes all Teacher and Practice memory.

### Real Codex acceptance probe

Run a bounded manual probe against the installed Codex App Server:

1. Create and bind a dedicated Practice Executor task.
2. Submit a learner-authored scoped prompt in Codex.
3. Verify Course Companion observes only that task.
4. Ask Hương about the objective, Executor actions, constraints, changed files, and evidence.
5. Confirm the answer is grounded, current, and contains no decoy-task data.
6. Replace the run and confirm Hương generates and later receives its validated summary.
7. Disconnect App Server and confirm truthful stale/offline behavior.
8. Relaunch and confirm local memory rehydration without relying on the previous Teacher thread.

No private transcript, account identity, credential, auth URL, raw protocol payload, or hidden reasoning is committed as test evidence.

## Future work

- Direct Hương tool calling under a separately reviewed capability and approval design.
- Automatic Practice evaluation or pass/fail authority.
- Semantic retrieval and embeddings when memory volume justifies them.
- Proactive coaching based on significant Executor events.
- Learner-visible memory inspection, correction, selective deletion, and export.
- Multiple learners and encrypted or synchronized memory stores.

## Acceptance criteria

The feature is complete only when:

- real Hương replies replace fixture replies outside explicit test mode;
- every Teacher turn receives the approved layered context;
- the active Executor observer is exact-bound-task-only;
- earlier same-Practice attempts appear only as validated Hương summaries;
- other Practices contribute only durable learner-level takeaways;
- memory survives restart and clears on explicit reset;
- degraded states never claim live awareness;
- Hương remains tool-free and cannot write authoritative memory directly;
- automated tests and the bounded real-Codex probe pass.
