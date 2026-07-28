# Version A Curriculum Blueprint — Lean Product Path

**Status:** Approved direction translated into a buildable course map  
**Path:** Prologue + 6 outcome-based modules with resumable chapters  
**Estimated learner time:** 14 hours 20 minutes  
**Primary language:** Vietnamese, with English planning labels where useful  
**Graduation product:** A local, real-API ContentPilot application that generates
10 ideas and turns 5 learner-selected ideas into reviewed, archived, and
exportable weekly content packages

## Purpose

This document defines the exact curriculum-to-feature progression for Version A.
It replaces the old pattern of teaching several foundation modules before the
learner improves the application.

Every substantial module:

1. introduces one bounded Codex or OpenAI capability,
2. uses that capability to improve ContentPilot,
3. leaves behind an inspectable product artifact,
4. ends with an observable acceptance test, and
5. asks the learner to explain or defend one decision in their own words.

This blueprint decides the learning sequence. The exact JSON schemas, run-state
rules, starter-repository progression, API cost-awareness policy, and
graduation assessment are locked in linked planning contracts.

## Locked curriculum rules

- Version A is the default self-paced path.
- The path contains one prologue and six outcome-based modules.
- Modules represent complete learner goals; chapters provide 40–95 minute
  stopping points inside longer modules.
- Reusable teaching units last 5–10 minutes.
- Longer build labs combine those units in one applied task.
- Unit IDs describe stable learner behavior, not module position.
- Module numbers are presentation only; a manifest will control sequencing.
- Prerequisites and mastery gates attach to capabilities or artifacts.
- Foundation concepts such as briefing, `AGENTS.md`, testing, review, and safe
  approvals are taught inside real product milestones.
- The learner uses their own business and content whenever possible. A sample
  brand is the fallback, not the default experience.
- Mock data may support learning or troubleshooting, but graduation requires a
  real OpenAI API run.
- Skills, agents, MCP, scheduled automation, deployment, and automatic
  publishing remain optional advanced material.

## Learner-facing clarity standard

- A module title must name the learner's action and its observable output.
- Locked quantities appear in the title or milestone when they help the learner:
  10 ideas, 5 selected packages, and 2 visual variants per package.
- Words such as “useful,” “complete,” “relevant,” “strong,” or “quality” must be
  followed by an explicit criterion rather than act as acceptance criteria by
  themselves.
- A build lab must name the artifact, interface behavior, or verification
  evidence the learner will produce.
- Any detail intentionally left for a later planning branch must be labeled as
  undecided rather than hidden behind general wording.

## Progression at a glance

| Stage | Learner-facing title | Product milestone | Primary proof | Time |
|---|---|---|---|---:|
| Prologue | Xác định quy trình nội dung hằng tuần | Choose the audience, platform, cadence, and graduation target | Personal quest card with a measurable target | 20 min |
| Module 1 | Thiết lập dự án và làm việc an toàn với Codex | Run and inspect the starter, complete one bounded change, and create durable project rules | Reviewed diff, documented check, manual UI result, and `AGENTS.md` | 70 min |
| Module 2 | Thiết lập thương hiệu và hồ sơ giọng viết | Save reusable brand inputs and turn five real examples into a validated AI voice profile | Reloadable onboarding data and validated `voice` artifact | 155 min |
| Module 3 | Nghiên cứu đối thủ và rút ra mẫu nội dung có bằng chứng | Collect cited evidence, reject unsupported sources, and derive anti-copy patterns | Accepted `evidence` and traceable `patterns` artifacts | 175 min |
| Module 4 | Tạo ý tưởng và soạn 5 gói bài viết | Generate and score 10 ideas, select 5, and draft each selected package | Reviewed `ideas` artifact and 5 editable `drafts` packages | 170 min |
| Module 5 | Tạo hình ảnh, duyệt và xuất 5 gói nội dung | Generate 2 visual variants per package, then edit, approve, archive, and export | 10 stored visuals, reopenable archive, and export bundle | 170 min |
| Module 6 | Khắc phục lỗi và hoàn thành bài tốt nghiệp | Recover one failed or rejected phase and complete one real end-to-end run | Real-API graduation run and evidence bundle | 100 min |

**Total:** 860 minutes, or 14 hours 20 minutes.

## Artifact spine

The course follows one visible chain of truth:

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

The Teacher asks quiz and reflection questions one at a time. Written answers
must include a learner-owned example rather than repeating course wording.

---

## Prologue — Xác định quy trình nội dung hằng tuần

**English label:** Define your weekly content workflow  
**Time:** 20 minutes  
**Product state after the prologue:** The learner has recorded their niche,
audience, primary platform, cadence, available examples, and a measurable target
for a weekly batch.

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

## Module 1 — Thiết lập dự án và làm việc an toàn với Codex

**English label:** Set up the project and work safely with Codex  
**Time:** 70 minutes: 45 minutes of reusable units + 25-minute build lab  
**Module achievement:** The starter runs locally; the learner completes one
course-supplied interface task, reviews every changed file, and verifies the
named UI behavior before acceptance. `AGENTS.md` records the project's purpose,
commands, boundaries, language rules, and verification expectations.  
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

- The starter runs using the documented command.
- The visible change satisfies the learner's brief.
- The learner has reviewed the diff and verification output.
- No unrelated files or external systems were changed.
- The learner can explain why the change was safe to approve.
- `AGENTS.md` gives future Codex tasks durable, repository-specific guidance.

---

## Module 2 — Thiết lập thương hiệu và hồ sơ giọng viết

**English label:** Set up the brand and voice profile  
**Time:** 155 minutes across two resumable chapters  
**Module achievement:** ContentPilot saves the learner's reusable brand and
workflow inputs, then uses five or more real writing examples and the real
OpenAI API to create a validated voice profile.

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

- The saved onboarding inputs and writing examples survive a reload.
- The learner can edit an input and intentionally rerun voice analysis.
- The real API produces a validated voice profile from at least five real
  writing examples.
- Invalid analysis output cannot replace the last valid profile.
- The learner can trace at least one voice observation back to their submitted
  writing.

---

## Module 3 — Nghiên cứu đối thủ và rút ra mẫu nội dung có bằng chứng

**English label:** Research competitors and derive evidence-backed content patterns  
**Time:** 175 minutes across two resumable chapters  
**Module achievement:** ContentPilot expands beyond optional known competitors,
saves cited evidence, lets the learner reject unsupported sources, and derives
traceable content patterns without copying competitor wording or layouts.

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

## Module 4 — Tạo ý tưởng và soạn 5 gói bài viết

**English label:** Generate ideas and draft 5 copy packages  
**Time:** 170 minutes across two resumable chapters  
**Module achievement:** ContentPilot generates 10 traceable ideas, shows the
selection evidence, records 5 learner choices, and turns each choice into an
editable copy package.

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

- The learner reviews 10 distinct ideas using visible platform-fit, voice-fit,
  evidence-support, and variety criteria.
- Exactly 5 learner-selected ideas advance to drafting.
- Each selection has a primary post, alternate hook, call to action, and a
  clearly marked optional short-video script.
- Direct edits and bounded revisions persist without overwriting other packages.
- Every draft retains its source notes for later review.

---

## Module 5 — Tạo hình ảnh, duyệt và xuất 5 gói nội dung

**English label:** Create visuals, review, and export 5 content packages  
**Time:** 170 minutes across two resumable chapters  
**Module achievement:** Each selected package receives two stored visual
variants; the learner edits the copy, chooses one image, approves the package,
reopens it from the archive, and inspects the exported files.

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

- Every selected package has two visually distinct variants stored under the
  correct package ID.
- A learner likeness is never used without explicit approval.
- Learner copy edits and the chosen image survive navigation and reload.
- Only approved packages appear in the approved archive.
- The learner can reopen each approved package and export final copy, the
  selected image, source notes, and a suggested publishing date.
- Nothing is scheduled or published automatically.

---

## Module 6 — Khắc phục lỗi và hoàn thành bài tốt nghiệp

**English label:** Recover from failures and complete graduation  
**Time:** 100 minutes across two resumable chapters  
**Module achievement:** The learner diagnoses failures, reruns bounded phases,
controls API use, and produces 10 ideas plus 5 reviewed, archived, and exportable
packages in one real-API weekly run.  
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
