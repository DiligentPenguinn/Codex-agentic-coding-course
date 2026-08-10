# Version A Curriculum Blueprint — Agentic Coding Through Practice

**Status:** Approved direction translated into a buildable course map  
**Path:** Course introduction + 6 skill-based modules with resumable chapters
**Estimated learner time:** 14 hours 20 minutes  
**Primary language:** Vietnamese, with English planning labels where useful  
**Graduation proof:** The learner can independently frame, delegate, inspect,
verify, recover, and defend agentic-coding work. A local, real-API ContentPilot
application provides the practice artifacts used as evidence.

## Purpose

This document defines the exact skill-to-practice progression for Version A.
The course teaches transferable agentic-coding skills. ContentPilot is the
continuous practice project that makes those skills observable; it is not the
course subject.

Every substantial module:

1. names one transferable agentic-coding capability,
2. introduces the mental model and decision boundary behind it,
3. uses ContentPilot as a bounded practice lab,
4. leaves behind inspectable evidence,
5. ends with an observable acceptance test, and
6. asks the learner to transfer or defend the skill in their own words.

This blueprint decides the learning sequence. The exact JSON schemas, run-state
rules, starter-repository progression, API cost-awareness policy, and
graduation assessment are locked in linked planning contracts.

## Locked curriculum rules

- Version A is the default self-paced path.
- The path contains one introduction and six skill-based modules.
- Modules represent complete learner goals; chapters provide 40–95 minute
  stopping points inside longer modules.
- Reusable teaching units last 5–10 minutes.
- Longer build labs combine those units in one applied task.
- Unit IDs describe stable learner behavior, not module position.
- Module numbers are presentation only; a manifest will control sequencing.
- Prerequisites and mastery gates attach to capabilities or artifacts.
- Foundation concepts such as briefing, `AGENTS.md`, testing, review, and safe
  approvals are taught inside real product milestones.
- Every module title and opening outcome names the agentic-coding skill before
  the ContentPilot feature used to practise it.
- Every completion gate separates transferable skill evidence from
  ContentPilot-specific product evidence.
- A learner cannot pass by producing a polished ContentPilot result without
  explaining scope, decisions, evidence, and recovery.
- The learner uses their own business and content whenever possible. A sample
  brand is the fallback, not the default experience.
- Mock data may support learning or troubleshooting, but graduation requires a
  real OpenAI API run.
- Skills, agents, MCP, scheduled automation, deployment, and automatic
  publishing remain optional advanced material.

## Learner-facing clarity standard

- A module title must name the learner's action and its observable output.
- Learner-facing copy introduces the skill first and labels ContentPilot as the
  practice project or practice lab.
- Locked quantities appear in the title or milestone when they help the learner:
  10 ideas, 5 selected packages, and 2 visual variants per package.
- Words such as “useful,” “complete,” “relevant,” “strong,” or “quality” must be
  followed by an explicit criterion rather than act as acceptance criteria by
  themselves.
- A build lab must name the artifact, interface behavior, or verification
  evidence the learner will produce.
- Any detail intentionally left for a later planning branch must be labeled as
  undecided rather than hidden behind general wording.
- Internal delivery terms such as `fixture`, `MVP`, schema IDs, and release
  gates stay in implementation documentation. Learners see plain descriptions
  such as “chế độ luyện tập” or “phần học hiện tại.”

## Authoritative foundations

The course does not treat any vendor workflow as a universal law. It combines
the following official sources into a tool-agnostic learning loop and verifies
product-specific claims against current repository or runtime evidence:

- [OpenAI Codex prompting](https://learn.chatgpt.com/docs/prompting): provide
  relevant context and constraints, name the desired output, and define how the
  result will be verified.
- [OpenAI `AGENTS.md` guidance](https://learn.chatgpt.com/docs/agent-configuration/agents-md):
  keep durable repository expectations in scoped project instructions.
- [Anthropic research on agentic coding in practice](https://www.anthropic.com/research/claude-code-expertise):
  people make most planning decisions while the coding agent makes most
  execution decisions; domain understanding and verifiable outcomes matter.
- [Anthropic Claude Code best practices](https://www.anthropic.com/engineering/claude-code-best-practices):
  explore before editing, plan complex work, keep project guidance, and use
  tests and review loops.
- [Google Gemini CLI plan mode](https://developers.googleblog.com/plan-mode-now-available-in-gemini-cli/):
  investigate code and dependencies in a read-only mode, clarify consequential
  choices, and review the strategy before implementation.
- [Google Cloud best practices for AI coding assistants](https://cloud.google.com/blog/topics/developers-practitioners/five-best-practices-for-using-ai-coding-assistants/):
  document context, refine requirements, plan file changes, define tests, break
  large work into manageable parts, and keep approval milestones.
- [DeepLearning.AI: Claude Code — A Highly Agentic Coding Assistant](https://www.deeplearning.ai/courses/claude-code-a-highly-agentic-coding-assistant):
  learn through codebase exploration, feature work, testing, debugging, and
  several different project contexts.
- [DeepLearning.AI: Spec-Driven Development with Coding Agents](https://www.deeplearning.ai/courses/spec-driven-development-with-coding-agents/):
  use a repeatable specify → plan → implement → verify loop and preserve
  project intent across sessions.

Together these sources support the course loop:

```text
understand the problem
  → inspect the real context
  → specify scope and done conditions
  → review the plan and risks
  → let the agent execute within boundaries
  → inspect fresh evidence
  → accept, revise, or recover
  → transfer the skill to another task
```

## Progression at a glance

| Stage | Learner-facing skill | ContentPilot practice milestone | Primary proof | Time |
|---|---|---|---|---:|
| Introduction | Xác định mục tiêu và quyền quyết định | Name the real problem, the human decisions, and observable success | Personal orientation card with a measurable target | 20 min |
| Module 1 | Đọc dự án, giao việc và kiểm chứng thay đổi | Inspect a codebase, specify one bounded change, approve a plan, and verify the result | Reviewed diff, documented check, manual UI result, and `AGENTS.md` | 70 min |
| Module 2 | Giữ bối cảnh và tích hợp AI an toàn | Preserve durable context, define a typed contract, protect secrets, and handle failures | Reloadable inputs and validated `voice` artifact | 155 min |
| Module 3 | Dùng công cụ nghiên cứu và đánh giá bằng chứng | Use web tools, distinguish source roles, handle uncertainty, and ground synthesis | Accepted `evidence` and traceable `patterns` artifacts | 175 min |
| Module 4 | Chia nhỏ công việc và kiểm soát đầu ra có cấu trúc | Define output contracts, review options, preserve decisions, and request bounded revisions | Reviewed `ideas` artifact and 5 editable `drafts` packages | 170 min |
| Module 5 | Làm việc đa phương thức và giữ quyền duyệt | Brief image work, manage files and consent, preserve edits, and gate external output | 10 stored visuals, reopenable archive, and export bundle | 170 min |
| Module 6 | Chẩn đoán lỗi, phục hồi và chứng minh kết quả | Debug from evidence, rerun bounded phases, control cost, and defend a real workflow | Real-API graduation run and evidence bundle | 100 min |

**Total:** 860 minutes, or 14 hours 20 minutes.

## Practice artifact spine

ContentPilot supplies one visible chain of practice evidence:

```text
onboarding data
    → voice
    → evidence
    → patterns
    → ideas
    → drafts
    → visuals
    → approved archive and export
```

Names in this blueprint describe artifact responsibilities. Exact filenames,
fields, versions, validation rules, dependencies, and transition behavior are
locked in:

- [Artifact schema and run-state contract v1](./artifact-schema-and-run-state-v1.md)
- [Starter repository progression v1](./starter-repository-progression-v1.md)

## Module, chapter, and unit pattern

Each level has one responsibility:

- **Module:** one complete learner goal and one combined completion test.
- **Chapter:** one resumable build milestone with an inspectable checkpoint.
- **Unit:** one reusable 5–10 minute behavior identified by a semantic ID.

Every chapter follows the same learner rhythm:

1. **Orient:** inspect the current product state and name the next user problem.
2. **Brief:** ask Codex for a bounded plan with a clear done condition.
3. **Build:** let Codex implement one bounded feature slice named in the brief.
4. **Inspect:** review changed files, structured artifacts, and interface state.
5. **Verify:** run the starter's documented automated check for that slice and
   exercise the changed interface behavior manually.
6. **Reflect:** explain one tradeoff or acceptance decision in the learner's own
   words.
7. **Transfer:** name how the same skill would apply outside ContentPilot.

The Teacher asks quiz and reflection questions one at a time. Written answers
must include a learner-owned example rather than repeating course wording.

---

## Introduction — Xác định mục tiêu và quyền quyết định

**English label:** Define your weekly content workflow  
**Time:** 20 minutes  
**Transferable skill:** Frame a real problem, name observable success, and keep
consequential decisions with the human before delegating implementation.
**ContentPilot practice state:** The learner has recorded their niche, audience,
primary platform, cadence, available examples, and a measurable target for a
weekly batch.

### Reusable units

| Stable unit ID | Time | Learner action and output |
|---|---:|---|
| `course-see-graduation-workflow` | 5 min | Inspect the complete onboarding-to-export journey and distinguish the real graduation app from the simulated prototype. |
| `course-name-weekly-content-problem` | 5 min | Describe the learner's actual weekly content bottleneck using their own business or the sample brand. |
| `course-choose-primary-platform` | 5 min | Choose one primary publishing platform and explain why it is the graduation target. |
| `course-write-personal-quest-card` | 5 min | Record niche, audience, platform, cadence, available examples, and one measurable target such as five review-ready packages per week. |

### Completion test

The learner can state:

- who the content is for,
- which platform the final output targets,
- what would make a batch of 5 packages ready for their review, and
- why simulated output alone would not satisfy graduation.

---

## Module 1 — Đọc dự án, giao việc và kiểm chứng thay đổi

**English label:** Inspect a project, delegate work, and verify changes
**Time:** 70 minutes: 45 minutes of reusable units + 25-minute build lab  
**Transferable skill:** The learner can inspect an unfamiliar codebase, write a
bounded task, review an implementation plan, control approval boundaries, and
accept or revise work from fresh evidence.
**ContentPilot practice achievement:** The starter runs locally; the learner
completes one course-supplied interface task, reviews every changed file, and
verifies the named UI behavior before acceptance. `AGENTS.md` records the
project's purpose, commands, boundaries, language rules, and verification
expectations.
**Codex capability thread:** inspect, brief, plan, durable guidance, approve,
review, verify.

### Reusable units

| Stable unit ID | Time | Learner action and output |
|---|---:|---|
| `codex-inspect-starter-repository` | 5 min | Ask Codex to identify the app entry points, documented commands, course guidance, and which graduation stages are not yet implemented, without editing files. |
| `project-write-durable-agents-guidance` | 10 min | Adapt `AGENTS.md` with product purpose, boundaries, commands, language rules, and verification expectations. |
| `codex-write-bounded-task-brief` | 10 min | Write a task with goal, affected file or interface area, allowed scope, constraints, and observable done conditions. |
| `codex-review-implementation-plan` | 5 min | Check the proposed files, operations, risks, and verification plan before authorizing work. |
| `codex-review-diff-and-checks` | 10 min | Inspect the changed files, run the starter's documented check for the changed layer, and exercise the named UI behavior. |
| `codex-handle-approval-boundaries` | 5 min | Distinguish safe local work from actions that require explicit approval, such as deleting data, exposing secrets, or publishing externally. |

### Build lab

The learner completes a course-supplied responsive-interface task in
`app/page.tsx` and `app/globals.css`: make the welcome screen's primary action
easy to use at narrow mobile widths without changing desktop behavior. The
learner reviews the diff, runs the complete documented check, compares desktop
and mobile behavior, and accepts or revises the change. No automated test begins
in a failing state.

### Module 1 completion test

- The learner can describe the same inspect → specify → plan → execute → verify
  loop for one bounded change outside ContentPilot.
- The starter runs using the documented command.
- The visible change satisfies the learner's brief.
- The learner has reviewed the diff and verification output.
- No unrelated files or external systems were changed.
- The learner can explain why the change was safe to approve.
- `AGENTS.md` gives future Codex tasks durable, repository-specific guidance.

---

## Module 2 — Giữ bối cảnh và tích hợp AI an toàn

**English label:** Preserve context and integrate AI safely
**Time:** 155 minutes across two resumable chapters  
**Transferable skill:** The learner can decide what context should persist,
define and validate an AI output contract, protect secrets, distinguish real
from simulated execution, and recover from a failed or invalid response.
**ContentPilot practice achievement:** ContentPilot saves the learner's reusable
brand and workflow inputs, then uses five or more real writing examples and the
real OpenAI API to create a validated voice profile.

### Chapter 2.1 — Lưu dữ liệu thương hiệu để tái sử dụng

**English label:** Save reusable brand data  
**Time:** 70 minutes: 35 minutes of reusable units + 35-minute build lab  
**Chapter milestone:** ContentPilot saves and reloads the brand name, niche,
audience, primary platform, cadence, optional known competitors, and at least
five writing examples.  
**Codex capability thread:** explicit onboarding fields, form validation, and
local JSON persistence.

#### Reusable units

| Stable unit ID | Time | Learner action and output |
|---|---:|---|
| `onboarding-map-required-inputs` | 5 min | Mark brand name, niche, audience, primary platform, cadence, and five writing examples as required; mark known competitors as optional. |
| `onboarding-build-brand-form` | 10 min | Add brand name, niche, audience, primary platform, cadence, and optional known-competitor fields. |
| `onboarding-collect-voice-examples` | 10 min | Collect at least five distinct real writing examples and explain why one example is insufficient. |
| `onboarding-save-local-data` | 10 min | Save the brand and workflow inputs to local JSON, reload the app, and verify that each field returns without requiring an account. |

#### Build lab

The learner completes every required field with their own brand or the sample
brand, saves the form, reloads the application, edits one saved value, and asks
Codex to diagnose any field that is missing, stale, or invalid.

#### Chapter checkpoint

- Brand name, niche, audience, primary platform, cadence, and five writing
  examples are required; known competitors are optional.
- Fewer than five voice examples cannot complete voice onboarding.
- Every saved input survives a reload and remains editable.
- No OpenAI call is required yet.

### Chapter 2.2 — Phân tích và lưu hồ sơ giọng viết bằng AI

**English label:** Analyze and save a voice profile with AI  
**Time:** 85 minutes: 50 minutes of reusable units + 35-minute build lab  
**Chapter milestone:** The application makes its first real OpenAI API call and
saves a validated, reusable voice profile.  
**Codex capability thread:** server-only secrets, Responses API, Zod, Structured
Outputs, error inspection.

#### Reusable units

| Stable unit ID | Time | Learner action and output |
|---|---:|---|
| `api-protect-server-side-key` | 5 min | Configure the API key on the server and verify it is absent from client code, logs, and committed files. |
| `voice-design-analysis-contract` | 10 min | Define what the voice analysis must describe and what it must not infer. |
| `voice-build-zod-schema` | 10 min | Use Zod to make the voice artifact inspectable and reject malformed output. |
| `voice-call-responses-api` | 10 min | Implement the first real server-side voice-analysis call with the approved model defaults. |
| `voice-save-validated-profile` | 10 min | Persist only validated output and render a concise learner-facing summary. |
| `voice-handle-analysis-failure` | 5 min | Show a recoverable error when the key is missing, the request fails, or output does not validate. |

#### Build lab

The learner analyzes at least five real examples, traces one voice observation
back to the submitted writing, identifies one unsupported or inaccurate
observation if present, and reruns the analysis after revising the input or
analysis brief.

#### Chapter checkpoint

- The request uses the real API rather than hard-coded output.
- The API key remains server-side.
- The stored voice artifact passes validation.
- Invalid output does not overwrite the last valid profile.
- The learner can locate and interpret the saved artifact.
- Voice analysis is reusable and does not rerun automatically for every batch.

### Module 2 completion test

- The learner can identify durable context, one-time task context, the secret
  boundary, the validation contract, and the recovery path for a different AI
  feature.
- The saved onboarding inputs and writing examples survive a reload.
- The learner can edit an input and intentionally rerun voice analysis.
- The real API produces a validated voice profile from at least five real
  writing examples.
- Invalid analysis output cannot replace the last valid profile.
- The learner can trace at least one voice observation back to their submitted
  writing.

---

## Module 3 — Dùng công cụ nghiên cứu và đánh giá bằng chứng

**English label:** Use research tools and evaluate evidence
**Time:** 175 minutes across two resumable chapters  
**Transferable skill:** The learner can delegate web research, distinguish
direct from supporting evidence, review uncertainty and freshness, reject weak
sources, and require every synthesis claim to remain traceable.
**ContentPilot practice achievement:** ContentPilot expands beyond optional
known competitors, saves cited evidence, lets the learner reject unsupported
sources, and derives traceable content patterns without copying competitor
wording or layouts.

### Chapter 3.1 — Thu thập bằng chứng có trích dẫn từ web

**English label:** Collect cited evidence from the web  
**Time:** 95 minutes: 55 minutes of reusable units + 40-minute build lab  
**Chapter milestone:** A weekly run expands beyond optional known competitors and
saves inspectable evidence with visible source citations.  
**Codex capability thread:** current web research, explicit evidence, uncertainty,
and traceable source handling.

#### Reusable units

| Stable unit ID | Time | Learner action and output |
|---|---:|---|
| `research-start-schedule-aware-run` | 10 min | Start a batch using saved niche, platform, and cadence inputs while preserving reusable onboarding data. |
| `research-expand-competitor-set` | 10 min | Use niche terms and optional known competitors to find additional competitors that match the saved niche and primary platform, plus supporting sources. |
| `research-run-web-search` | 10 min | Make a real cited web-search request and keep source information attached to each research claim. |
| `research-separate-source-roles` | 10 min | Distinguish verified competitor examples from supporting research, commentary, or general guidance. |
| `research-save-evidence` | 10 min | Save an inspectable evidence artifact instead of relying on hidden conversation history. |
| `research-render-visible-citations` | 5 min | Show source links near the claims they support so the learner can review them. |

#### Build lab

The learner runs research for their niche, opens multiple cited sources, flags
one result that lacks direct support or does not match the saved niche/platform,
captures the minimum text or visual proof needed for at least one accepted
result, and verifies that the evidence remains inspectable after a reload.

#### Chapter checkpoint

- Research works with niche terms even when no competitor is supplied.
- Optional known competitors seed rather than limit discovery.
- Every saved claim retains a visible source reference.
- Competitor examples and supporting sources are not conflated.
- A competitor example opens the directly attributable post, video,
  advertisement, landing page, or official profile. A secondary article may
  guide discovery or provide context but cannot prove a named competitor's
  behavior by itself.
- Accepted text claims preserve a short supporting excerpt. Accepted visual
  claims preserve a local screenshot; mixed claims preserve both.
- If a source becomes inaccessible and the required capture is missing, it is
  marked unverifiable and cannot support a pattern.
- Full-page copies are not required.
- Uncertain results are visible rather than silently presented as facts.
- The evidence artifact survives reload and can be used by the next phase.

### Chapter 3.2 — Lọc nguồn và rút ra mẫu nội dung

**English label:** Accept sources and extract content patterns  
**Time:** 80 minutes: 45 minutes of reusable units + 35-minute build lab  
**Chapter milestone:** The application excludes weak sources and derives
traceable patterns without copying competitor language or layouts.  
**Codex capability thread:** acceptance criteria, grounded synthesis, evaluation,
and explicit anti-copy constraints.

#### Reusable units

| Stable unit ID | Time | Learner action and output |
|---|---:|---|
| `research-define-source-acceptance` | 5 min | Define the minimum evidence needed before a source may influence pattern extraction. |
| `research-review-sources` | 10 min | Accept, reject, or flag sources with a learner-visible reason. |
| `patterns-define-anti-copy-rules` | 10 min | Translate inspiration into abstract tactics and prohibit reused wording, claims, or distinctive layouts. |
| `patterns-extract-from-evidence` | 10 min | Generate patterns only from accepted evidence and link each pattern back to its support. |
| `patterns-review-traceability` | 10 min | Keep a pattern only when accepted evidence supports it, the learner can adapt it to their own brand, and it does not reuse competitor wording or a distinctive layout. |

#### Build lab

The learner rejects at least one source that fails the acceptance rules, keeps
enough direct examples to support at least one pattern, and rewrites or removes
any extracted pattern that lacks support or stays too close to a competitor
example.

#### Chapter checkpoint

- Rejected sources do not influence pattern extraction.
- Unverifiable sources do not influence pattern extraction.
- Every retained pattern points to accepted evidence.
- A pattern about a named competitor references accepted direct competitor
  evidence; supporting research alone is insufficient.
- A single-competitor pattern requires two distinct direct examples from that
  competitor.
- A cross-competitor pattern requires direct evidence from at least two
  competitors, with at least one distinct example from each.
- One direct example remains an observation and is not labeled a pattern.
- Research prioritizes the preceding 12 months. Older or undated evidence needs
  a relevance reason and cannot support a high-confidence pattern.
- Only high- and medium-confidence findings become patterns.
- A valid patterns artifact contains 3–5 retained patterns.
- If fewer than 3 patterns qualify, the interface shows
  `needs_more_research`; it does not weaken the evidence rules.
- The artifact separates observation from recommendation.
- Anti-copy rules are visible in the task and review criteria.
- The learner can cite the evidence for one pattern and explain how they would
  adapt it without reproducing the competitor's wording or layout.

### Module 3 completion test

- Given a different research task, the learner can state the required source
  role, capture, freshness rule, uncertainty treatment, and acceptance decision.
- Research expands from the saved niche and any optional known competitors.
- Every saved claim retains a visible source reference.
- Rejected sources cannot influence the resulting patterns.
- Sources that become unverifiable cannot influence a new active patterns
  revision.
- Every retained pattern links to accepted evidence.
- Secondary sources may support discovery and context but cannot independently
  prove a competitor-specific pattern.
- Every retained pattern passes the single-competitor or cross-competitor
  direct-evidence minimum.
- The active artifact contains 3–5 high- or medium-confidence patterns.
- Fewer than 3 qualified patterns produces `needs_more_research`, not invented
  filler.
- The learner can explain how one pattern transfers to their own brand without
  copying competitor wording or a distinctive layout.

---

## Module 4 — Chia nhỏ công việc và kiểm soát đầu ra có cấu trúc

**English label:** Decompose work and control structured outputs
**Time:** 170 minutes across two resumable chapters  
**Transferable skill:** The learner can define a structured output contract,
split generation into reviewable phases, compare options, preserve intentional
decisions, and request a bounded revision without overwriting accepted work.
**ContentPilot practice achievement:** ContentPilot generates 10 traceable
ideas, shows the selection evidence, records 5 learner choices, and turns each
choice into an editable copy package.

### Chapter 4.1 — Tạo 10 ý tưởng và chọn 5

**English label:** Generate 10 ideas and select 5  
**Time:** 80 minutes: 45 minutes of reusable units + 35-minute build lab  
**Chapter milestone:** ContentPilot generates 10 traceable ideas, displays
platform fit, voice fit, evidence support, and variety for each idea, and records
5 learner-approved selections.  
**Codex capability thread:** structured generation, transparent evaluation,
human choice, and bounded reruns.

#### Reusable units

| Stable unit ID | Time | Learner action and output |
|---|---:|---|
| `ideas-define-generation-contract` | 5 min | Specify quantity, platform fit, voice fit, evidence use, variety, and prohibited duplication. |
| `ideas-generate-ten-options` | 10 min | Generate exactly 10 distinct ideas grounded in the saved voice and patterns. |
| `ideas-score-visible-criteria` | 10 min | Show platform fit, voice fit, evidence support, and variety with a short reason for each score rather than a hidden ranking. |
| `ideas-select-five-options` | 10 min | Let the learner choose 5 ideas without allowing the model to silently finalize the choice. |
| `ideas-rerun-with-preserved-decisions` | 10 min | Replace only ideas the learner marks for replacement without discarding selections they intentionally kept. |

#### Build lab

The learner compares the 10 ideas, challenges at least one model score, selects
5 ideas, and explains why one lower-ranked idea may still fit their audience.

#### Chapter checkpoint

- The artifact contains exactly 10 distinct ideas.
- Each idea uses the saved voice profile and primary platform and links to at
  least one accepted pattern or evidence item.
- Scores and short reasons are visible and editable or contestable.
- Exactly 5 selections are recorded for drafting.
- Rerunning learner-marked options does not silently remove kept selections.

### Chapter 4.2 — Soạn và chỉnh sửa 5 gói bài viết

**English label:** Draft and revise 5 copy packages  
**Time:** 90 minutes: 50 minutes of reusable units + 40-minute build lab  
**Chapter milestone:** Each selected idea becomes an editable, review-ready copy
package.  
**Codex capability thread:** typed multi-item generation, platform adaptation,
revision briefs, and preservation of provenance.

#### Reusable units

| Stable unit ID | Time | Learner action and output |
|---|---:|---|
| `drafts-define-package-contract` | 10 min | Define the required primary post, alternate hook, call to action, and optional short-video script. |
| `drafts-generate-five-packages` | 10 min | Generate a primary post, alternate hook, call to action, and optional short-video script for each of the 5 selected ideas. |
| `drafts-adapt-primary-platform` | 10 min | Apply the primary platform's format and audience expectations without teaching automatic publishing. |
| `drafts-edit-copy-directly` | 10 min | Let the learner edit generated copy without losing the underlying idea or source notes. |
| `drafts-request-bounded-revision` | 10 min | Revise one package from a specific learner brief while preserving approved parts. |

#### Build lab

The learner edits one package directly, requests one bounded revision, compares
the results, and chooses which wording better matches their voice.

#### Chapter checkpoint

- All 5 selected ideas have a primary post, alternate hook, call to action, and
  a clearly marked optional short-video script.
- Drafts reflect the saved voice and primary platform.
- Unsupported factual claims are not introduced.
- Direct edits persist.
- A revision can target one package without overwriting the others.
- Source notes remain attached for later review and export.

### Module 4 completion test

- For a different multi-output task, the learner can define the schema, review
  criteria, preserved decisions, and bounded rerun scope before execution.
- The learner reviews 10 distinct ideas using visible platform-fit, voice-fit,
  evidence-support, and variety criteria.
- Exactly 5 learner-selected ideas advance to drafting.
- Each selection has a primary post, alternate hook, call to action, and a
  clearly marked optional short-video script.
- Direct edits and bounded revisions persist without overwriting other packages.
- Every draft retains its source notes for later review.

---

## Module 5 — Làm việc đa phương thức và giữ quyền duyệt

**English label:** Work across modalities and retain approval control
**Time:** 170 minutes across two resumable chapters  
**Transferable skill:** The learner can brief visual work, control input consent,
inspect generated files and metadata, handle partial failures, preserve human
edits, and explicitly approve material before an external handoff.
**ContentPilot practice achievement:** Each selected package receives two stored
visual variants; the learner edits the copy, chooses one image, approves the
package, reopens it from the archive, and inspects the exported files.

### Chapter 5.1 — Tạo 2 phương án hình ảnh cho mỗi gói

**English label:** Create 2 visual variants for each package  
**Time:** 90 minutes: 50 minutes of reusable units + 40-minute build lab  
**Chapter milestone:** Each selected idea receives two stored visual variants
that respect the learner's approved visual inputs.  
**Codex capability thread:** visual briefs, real image generation or editing,
consent boundaries, file handling, and partial-failure recovery.

#### Reusable units

| Stable unit ID | Time | Learner action and output |
|---|---:|---|
| `visuals-define-creative-brief` | 10 min | Convert each content package into subject, composition, mood, text, brand constraints, and an avoid list. |
| `visuals-check-likeness-consent` | 10 min | Require explicit learner approval before using an uploaded likeness and preserve an illustration-only path. |
| `visuals-generate-first-variant` | 10 min | Make a real image-generation or editing request from the approved brief and inputs. |
| `visuals-generate-distinct-alternative` | 10 min | Produce a second variant that changes at least one major dimension—composition, format, or visual concept—instead of making a near duplicate. |
| `visuals-save-files-and-metadata` | 10 min | Store each generated file with its package ID, variant label, local path, brief reference, and generation status. |

#### Build lab

The learner generates variants for at least one package, compares each result
against the brief, revises one result that violates a named brief constraint,
and then completes the remaining packages.

#### Chapter checkpoint

- Every selected idea has two visually distinct variants.
- A learner likeness is never used without explicit approval.
- Illustration-only and brand/product-image paths remain available.
- Generated files survive reload and stay attached to the correct package.
- Failure for one image does not erase successful copy or other images.
- The learner can explain why the selected variant supports the content.

### Chapter 5.2 — Duyệt, lưu trữ và xuất 5 gói nội dung

**English label:** Review, archive, and export 5 packages  
**Time:** 80 minutes: 45 minutes of reusable units + 35-minute build lab  
**Chapter milestone:** The learner can review, edit, approve, archive, reopen, and
export final packages without automatic publishing.  
**Codex capability thread:** human-in-the-loop workflow, progressive disclosure,
local archive behavior, and end-user acceptance checks.

#### Reusable units

| Stable unit ID | Time | Learner action and output |
|---|---:|---|
| `review-compose-package-view` | 5 min | Present copy, two visual options, sources, and approval status for one package on a single review screen. |
| `review-preserve-human-edits` | 10 min | Ensure direct edits and chosen visual variants survive navigation and reload. |
| `review-approve-or-request-revision` | 10 min | Keep approval, revision, and archive states explicit and learner-controlled. |
| `archive-save-approved-package` | 10 min | Save only approved final material to a reopenable local archive. |
| `export-build-content-bundle` | 10 min | Export final copy, selected image, source notes, and suggested publishing date. |

#### Build lab

The learner reviews all 5 packages, revises at least one, approves the final
set, reopens an archived package, and inspects the exported bundle.

#### Chapter checkpoint

- Learner edits and visual selections persist.
- Unapproved work cannot be represented as approved.
- Approved packages reopen from the local archive.
- Export includes final copy, selected image, source notes, and suggested date.
- No content is automatically scheduled or published.
- The interface maintains one obvious primary action with secondary controls
  revealed only when needed.

### Module 5 completion test

- For a different image or file workflow, the learner can name consent,
  provenance, storage, partial-failure, approval, and external-action boundaries.
- Every selected package has two visually distinct variants stored under the
  correct package ID.
- A learner likeness is never used without explicit approval.
- Learner copy edits and the chosen image survive navigation and reload.
- Only approved packages appear in the approved archive.
- The learner can reopen each approved package and export final copy, the
  selected image, source notes, and a suggested publishing date.
- Nothing is scheduled or published automatically.

---

## Module 6 — Chẩn đoán lỗi, phục hồi và chứng minh kết quả

**English label:** Diagnose failures, recover, and prove the result
**Time:** 100 minutes across two resumable chapters  
**Transferable skill:** The learner can diagnose from logs and artifacts, rerun
only the affected phase, preserve valid work, control API cost and duplicate
actions, and defend a completion claim with evidence.
**ContentPilot practice achievement:** The learner produces 10 ideas plus 5
reviewed, archived, and exportable packages in one real-API weekly run.
**Codex capability thread:** testing, debugging from evidence, failure recovery,
cost awareness, security review, and product demonstration.

### Chapter 6.1 — Kiểm thử và khôi phục một giai đoạn bị lỗi

**English label:** Test and recover a failed phase  
**Time:** 50 minutes  
**Chapter milestone:** The application derives progress from artifacts, exposes
recoverable API failures, prevents accidental duplicate runs, and passes every
automated check documented by the starter.

#### Reusable units

| Stable unit ID | Time | Learner action and output |
|---|---:|---|
| `reliability-derive-progress-from-artifacts` | 10 min | Verify that the interface reflects saved artifacts rather than a separate stale progress story. |
| `reliability-rerun-bounded-phase` | 10 min | Rerun one failed phase or one output the learner explicitly rejected without overwriting unrelated approved work. |
| `reliability-handle-api-failures` | 10 min | Exercise missing-key, network, invalid-output, and partial-generation failures with actionable recovery. |
| `reliability-apply-cost-awareness` | 10 min | Show estimated cost ranges before a run and visual generation, then prevent accidental duplicate runs without imposing a mandatory spending ceiling. |
| `reliability-run-product-checks` | 10 min | Use Codex to run every automated check documented by the starter and complete the module's manual end-to-end checklist. |

#### Chapter checkpoint

- Interface progress matches the stored artifacts.
- A failed or learner-rejected phase can rerun without overwriting unrelated
  approved work.
- Missing-key, network, invalid-output, and partial-generation failures show an
  actionable recovery path.
- The learner sees an estimated cost range before a run and before visual
  generation; the application does not impose a mandatory spending ceiling.
- Duplicate submissions and expensive reruns require an intentional learner
  action.
- Every automated check documented by the starter passes.

### Chapter 6.2 — Hoàn thành một quy trình thật

**English label:** Complete one real graduation workflow  
**Time:** 50 minutes: 10-minute evidence unit + 40-minute graduation run  
**Chapter milestone:** The learner completes the onboarding-to-export workflow
with real inputs and the real OpenAI API, then submits the artifacts and
verification evidence.

#### Reusable unit

| Stable unit ID | Time | Learner action and output |
|---|---:|---|
| `graduation-document-real-workflow` | 10 min | Assemble the real inputs, saved artifacts, 5 reviewed packages, exported bundle, check output, and learner reflection. |

#### Graduation run

Using real onboarding material and the real OpenAI API, the learner completes:

```text
onboarding
    → voice analysis
    → cited research
    → accepted evidence
    → patterns
    → 10 ideas
    → 5 selected packages
    → copy and visual variants
    → human review
    → approval, archive, and export
```

The learner captures the input, resulting artifacts, verification output, one
failure or revision they handled, and a short reflection on whether the final
batch is genuinely usable.

The evidence gates, six-dimension mastery rubric, passing rule, learner defense,
and targeted resubmission policy are defined in:

- [Graduation assessment v1](./graduation-assessment-v1.md)

### Module 6 completion test

- The learner can apply the same diagnosis and bounded-recovery reasoning to a
  failure outside ContentPilot.
- At least one graduation run uses the real API from start to finish.
- Mock mode is clearly distinguishable and is not submitted as graduation work.
- A failed phase can be retried without destroying unrelated accepted work.
- Missing keys, invalid output, and partial failures lead to actionable states.
- Expensive or duplicate operations require an intentional learner action.
- Every automated check documented by the starter passes, and the learner
  manually reviews all 5 packages.
- The export contains final copy, the selected image, source notes, and a
  suggested publishing date for each approved package.
- The learner can explain one tradeoff, one revision, and one remaining
  limitation in their own words.

## Manifest and stable-ID contract

The eventual course manifest should group semantic units into paths without
changing the units' identities:

```text
Version A / Module 3 / Chapter 3.1
  - research-start-schedule-aware-run
  - research-expand-competitor-set
  - research-run-web-search
  - research-separate-source-roles
  - research-save-evidence
  - research-render-visible-citations

Version A / Module 3 / Chapter 3.2
  - research-define-source-acceptance
  - research-review-sources
  - patterns-define-anti-copy-rules
  - patterns-extract-from-evidence
  - patterns-review-traceability

Version B / Web research lesson group
  - research-start-schedule-aware-run
  - research-expand-competitor-set
  - research-run-web-search
  - research-render-visible-citations

Version B / Evidence handling lesson group
  - research-separate-source-roles
  - research-save-evidence
  - research-define-source-acceptance
  - research-review-sources
```

Rules:

- IDs must not contain module numbers.
- IDs should use `<domain>-<observable-action>`.
- Vietnamese and English titles may change without changing the ID.
- A unit may move between modules or paths without losing progress records.
- A unit's prerequisite should name a capability or artifact, not “Module N.”
- Assessment records should reference the unit ID and product evidence.

## What this blueprint replaces

The existing MVP 1 course front-loads orientation, briefing, project memory, and
specification before the learner builds a working onboarding or generation
feature. Its explanations and practice patterns remain reusable, but Version A
redistributes them:

| Existing foundation | New location |
|---|---|
| Codex orientation and briefing | Module 1, inside the first safe app change |
| `AGENTS.md` | Module 1, as durable project guidance |
| Brand Brain and voice examples | Module 2, inside brand and voice setup |
| Specification before code | Repeated brief-and-plan step in every chapter |
| Research and citations | Module 3, Chapter 3.1 |
| Source review and pattern extraction | Module 3, Chapter 3.2 |
| Screenshot and image workflow | Module 5, Chapter 5.1 |
| Review and export | Module 5, Chapter 5.2 |
| Testing and debugging | Repeated in every chapter, consolidated in Module 6 |
| Skills, MCP, automation, and specialized agents | Optional advanced path after graduation |

## Locked starter progression

The initial starter repository, chapter-by-chapter file additions, milestone
checks, and graduation repository are fixed in:

- [Starter repository progression v1](./starter-repository-progression-v1.md)

The initial starter provides generic infrastructure and honest empty states.
Learners build every ContentPilot-specific schema, route, artifact, and workflow
behavior during Modules 2–6.

## Next execution decision

Before implementation, choose where the learner starter lives, how learners
receive it, when it becomes a standalone repository, and which package and API
model versions are pinned for the first validated release.

## Future Skill backlog

- Sau khi Pilot MVP đã được kiểm thử với người học, đánh giá việc bổ sung một
  Skill `verify-before-accepting`. Skill này sẽ buộc Codex nêu bằng chứng kiểm
  tra trước khi Learner chấp nhận kết quả. Chưa đưa Skill này vào Module 1 vì
  verification đã được dạy tại các checkpoint của từng bài, còn việc cài thêm
  Skill sẽ làm tăng tải thiết lập ban đầu.
- Khi đánh giá, so sánh nhu cầu của khóa học với các Skill cộng đồng có cùng
  mục đích (đặc biệt là `verification-before-completion`) trước khi quyết định
  dùng nguyên bản, điều chỉnh hay tự viết.
