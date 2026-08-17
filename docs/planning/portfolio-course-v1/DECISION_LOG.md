# Curriculum Decision Log

Last updated: 2026-08-13

This file separates approved curriculum direction from recommendations that are still under discussion. Approval of a planning decision does not authorize implementation.

## D-001: Organize the course lifecycle-first

Status: Approved
Approved: 2026-08-13

### Problem

The course needs to help a complete beginner build a portfolio while developing skills that transfer to later software projects.

### Decision

Organize the four modules around the delivery lifecycle:

1. Operate Codex safely and understand the workspace.
2. Define, scope, and plan the portfolio.
3. Implement and debug in verified slices.
4. Test, publish, and transfer the workflow.

Teach HTML, CSS, React, TypeScript, Git, and deployment when they are needed inside that lifecycle.

### Alternatives considered

#### Technology-first

Sequence HTML, CSS, JavaScript, React, and then the portfolio project.

Tradeoff: Provides more up-front programming depth but delays the motivating result and gives less practice managing a complete agentic workflow.

#### Portfolio-first sprint

Begin immediately with visual portfolio sections and introduce process only when problems occur.

Tradeoff: Produces visible progress quickly but increases the risk of prompt copying, weak verification, and limited transfer.

### Consequences

- The portfolio is evidence of applied skill, not the sole learning objective.
- Each module requires an observable performance gate.
- Web concepts are introduced in context.
- The final assessment must include a transfer task, not only the finished portfolio.

## D-002: Keep curriculum planning portable and separate from implementation

Status: Approved
Approved: 2026-08-13

### Problem

The curriculum may later be moved into another local repository. Planning work should not become mixed with portfolio or course-application implementation.

### Decision

Store planning in the standalone `portfolio-course-planning` folder using:

- `COURSE_PLAN.md` for the canonical curriculum plan;
- `RESEARCH_SOURCES.md` for research evidence;
- `DECISION_LOG.md` for approved and pending decisions.

### Consequences

- The folder can be copied into another repository.
- No implementation code belongs in this folder.
- Proposed implementation choices must be clearly marked as unapproved.
- Future planning updates should keep the three files consistent.

## D-003: Choose the learner's starting project

Status: Superseded by D-009
Approved: 2026-08-13
Superseded: 2026-08-13

### Problem

The learner needs enough scaffolding to begin successfully without inheriting so much completed complexity that they cannot understand or debug the result.

### Decision

Provide a clean, preconfigured starter repository and retain the current advanced portfolio as a separate finished reference.

The starter would contain only the development environment, validation commands, minimal structure, and a known-working page. Portfolio features would be added through the course.

### Alternatives

#### Modify the advanced portfolio directly

Benefit: Fastest path to a sophisticated visual result.

Risk: Existing interactions and large components make change review and debugging difficult for a complete beginner.

#### Start from an empty folder

Benefit: Maximum learner ownership.

Risk: Setup complexity can overwhelm the actual agentic-coding learning objective.

#### Clean, preconfigured starter

Benefit: Balances early success, ownership, debugging clarity, and later transfer.

Risk: The starter must be carefully limited so it does not become a hidden completed solution.

### Consequences

- The starter must provide a verified environment without providing a hidden finished solution.
- The advanced portfolio is a reference destination, not the learner's working codebase.
- Complex reference features cannot silently become core graduation requirements.

### Downstream decisions

If approved, later planning must define:

- precisely what is preconfigured;
- what the learner builds in each lesson;
- how the completed reference is presented;
- whether course checkpoints use branches, copies, or saved artifacts;
- which advanced features remain optional.

## D-004: Define the exact starter contents

Status: Superseded by D-009
Approved: 2026-08-13
Superseded: 2026-08-13

### Problem

The starter must remove irrelevant setup friction while preserving the learner's ownership of the portfolio. Too little scaffolding makes Module 1 a tooling-recovery exercise; too much scaffolding turns the course into editing a finished template.

### Decision

Use a minimal verified scaffold with four layers.

#### 1. Preconfigured development environment

- React, TypeScript, and Vite configuration.
- A locked dependency manifest.
- Commands for local development, type checking, production build, and preview.
- A single aggregate validation command if it can remain simple and transparent.
- `.gitignore` and a clean initial Git history.

#### 2. Minimal known-working application

- The standard application entry point.
- One small `App` component displaying a neutral "starter is running" screen.
- A basic stylesheet that provides only a readable default, box sizing, and visible keyboard focus.
- No portfolio navigation, Hero, project cards, About section, Contact section, theme system, or animations.

#### 3. Learner and Codex guidance

- A short `README` with setup, run, validation, and recovery instructions.
- A project-level `AGENTS.md` containing safety, scope, and verification rules.
- A simple task brief or prompt template using goal, context, boundaries, expected output, and verification.
- A location for the learner's PRD and decision artifacts.

#### 4. Empty content and asset boundaries

- Clearly named locations for source code, public assets, and planning artifacts.
- Placeholder documentation describing acceptable image formats and privacy considerations.
- No prewritten biography, case studies, personal contact details, or final design assets.

### Learner-built work

The learner remains responsible for creating:

- the portfolio's user needs, content inventory, and PRD;
- semantic page structure and navigation;
- Hero, Selected Work, About, and Contact sections;
- reusable project data and components;
- the actual visual system and responsive behavior;
- accessibility improvements beyond the minimal safe baseline;
- the selected optional interaction;
- validation evidence and deployment configuration introduced by the course.

### Reference-only features

The finished reference may demonstrate, but the starter does not include:

- advanced motion and transitions;
- video backgrounds;
- 3D or Spline scenes;
- GitHub activity integrations;
- large galleries or complex project modals;
- production analytics or other third-party services.

### Alternatives

#### Tooling-only blank application

Benefit: Maximizes learner ownership.

Risk: Provides too little visible evidence that setup succeeded and makes early troubleshooting harder.

#### Partially completed portfolio scaffold

Benefit: Learners reach a polished layout faster.

Risk: Important structure and design decisions are already made for them, weakening transfer and ownership.

#### Minimal verified scaffold

Benefit: Gives immediate setup feedback while leaving the meaningful portfolio work to the learner.

Risk: Requires careful documentation so the neutral baseline is not mistaken for a design recommendation.

### Downstream decisions

If approved, later planning must determine:

- the exact commands and validation stack;
- how the starter is handed off after the existing Module 1 without changing that module;
- how instructor checkpoints and recovery files are distributed;
- whether deployment configuration is introduced late or partially preconfigured;
- what content is supplied for learners who do not yet have three case studies.

## D-005: Define the learner-facing validation workflow

Status: Approved
Approved: 2026-08-13

### Problem

Complete beginners need reliable evidence that their work is correct without memorizing many overlapping commands. A single successful build is not enough to prove that the portfolio works visually, responsively, or accessibly.

### Decision

Expose three primary learner-facing commands while keeping individual diagnostic commands available underneath.

#### Primary commands

1. `npm run dev` starts the local development server for implementation and browser review.
2. `npm run check` runs the complete automated quality gate before a phase is accepted.
3. `npm run preview` serves the production build for the final local verification before deployment.

#### Checks inside the aggregate quality gate

The proposed `npm run check` command should run, in a clear order:

1. TypeScript type checking.
2. ESLint static analysis.
3. Production build generation.

The individual `typecheck`, `lint`, and `build` commands should remain available so Codex and the learner can isolate a failure.

#### Manual browser evidence

Automated commands should be paired with a short checklist:

- open every navigation target and important link;
- inspect the required mobile and desktop widths;
- operate interactive elements with the keyboard;
- confirm focus remains visible;
- check that important images have meaningful alternatives;
- confirm that the browser console has no unexplained errors;
- compare the result with the current phase's acceptance criteria.

#### Automated UI tests

Do not require a unit-test framework in the initial application scaffold. Introduce focused automated tests only if the learner adds behavior whose regression risk justifies them. The final portfolio must still provide manual test evidence tied to its acceptance criteria.

### Alternatives

#### Teach every command separately from the beginning

Benefit: Learners see each tool explicitly.

Risk: Command overload distracts from the evidence each tool provides.

#### Use only one hidden validation command

Benefit: Simplest routine during the build.

Risk: Learners cannot isolate failures and may treat the command as unexplained magic.

#### Three primary commands with transparent diagnostics

Benefit: Creates a memorable routine while retaining debuggability and learner understanding.

Risk: The course must clearly explain what `check` does and when to run an individual diagnostic command.

### Downstream decisions

If approved, later planning must determine:

- the exact mobile and desktop viewport requirements;
- whether accessibility automation is added in Module 4;
- what constitutes a blocking console error;
- whether optional interactive features require targeted automated tests;
- the final evidence format saved by the learner.

## D-006: Define the required portfolio core and optional features

Status: Approved
Approved: 2026-08-13

### Problem

The learner needs a portfolio substantial enough to demonstrate professional value without making visual complexity the measure of success. Requiring every feature from the advanced reference would increase debugging risk and obscure the core agentic workflow.

### Decision

Require a focused, responsive single-page portfolio and one learner-selected enhancement.

#### Required content and structure

1. A navigation area with working links to the main sections.
2. A Hero section stating the learner's name, professional direction, short value proposition, and primary action.
3. A Selected Work section containing at least two evidence-rich project cases.
4. An About section explaining the learner's relevant story, capabilities, and direction.
5. A Contact section with at least one verified contact method and appropriate professional links.
6. A footer containing essential ownership or navigation information without duplicating the whole page.

Each required project case should communicate:

- the problem or opportunity;
- the learner's contribution;
- the approach or process;
- the result or current evidence;
- a limitation or lesson learned.

Learners without two prior projects may use the course portfolio as one case and complete one bounded supporting project or documented concept case. Invented outcomes or misleading client claims are not acceptable.

#### Required quality behavior

- Clear semantic heading and landmark structure.
- Functional keyboard navigation and visible focus.
- Meaningful text alternatives for important images.
- A usable mobile and desktop layout.
- No broken primary links or unexplained console errors.
- Content remains understandable when advanced effects are unavailable.
- The final result passes the approved validation workflow.

#### One learner-selected enhancement

The learner chooses one enhancement to plan and verify:

- light and dark theme switching;
- a project-detail modal or dedicated detail view;
- restrained entrance or transition motion;
- a downloadable resume or evidence artifact;
- another similarly bounded enhancement approved during planning.

This choice provides independent implementation practice without making every optional feature mandatory.

#### Reference-only extensions

The advanced portfolio may inspire later extensions, but the core course does not require:

- video backgrounds;
- 3D or Spline scenes;
- GitHub contribution graphs or live external integrations;
- complex galleries, carousels, or multi-stage modals;
- extensive scroll-driven animation;
- analytics, contact-form backends, or content-management systems.

### Alternatives

#### Match the advanced reference feature-for-feature

Benefit: Produces the closest visual and functional match to the existing portfolio.

Risk: Makes advanced media and integration problems part of the beginner critical path.

#### Require only a basic four-section page

Benefit: Keeps completion fast and predictable.

Risk: Provides too little space for independent planning, debugging, and evidence of professional judgment.

#### Focused core plus one chosen enhancement

Benefit: Protects a consistent graduation standard while preserving learner choice and a meaningful independent challenge.

Risk: Different learner portfolios will not have identical feature sets, so assessment must focus on requirements and evidence rather than visual sameness.

### Downstream decisions

If approved, later planning must determine:

- the minimum evidence standard for project cases;
- how learners without prior work create an honest supporting case;
- the exact required mobile and desktop widths;
- how the chosen enhancement affects assessment;
- whether a downloadable resume is appropriate for all learner profiles.

## D-007: Define course duration and lesson pacing

Status: Approved
Approved: 2026-08-13

### Problem

Complete beginners will progress at different speeds because setup, reading, content preparation, and debugging needs vary. Assigning hours before representative pilots would create false precision and could encourage learners to advance before they have demonstrated the required capability.

### Decision

Use mastery-gated milestones without publishing an estimated course duration until representative learner pilots provide evidence.

Learners advance when they demonstrate the current capability and save its required evidence. Elapsed time alone never completes a lesson or module.

#### Milestone rules

- Each lesson develops one observable capability.
- Each lesson produces or updates a saved artifact.
- Each module ends with a performance gate tied to its outcome.
- Learners who miss a gate enter a defined recovery path before continuing.
- Optional visual polish and reference-only extensions do not block core completion.
- Progress is communicated through completed capabilities and artifacts, not expected hours.

#### Pilot evidence before publishing duration

Representative beginner pilots should record:

- active lesson time;
- pauses caused by missing prerequisites or unclear instruction;
- recovery and debugging time;
- unsupported help requests;
- time spent gathering personal content separately from learning;
- the percentage of learners meeting each gate independently.

Only after this evidence is reviewed should the course publish a duration range or suggested calendar.

### Alternatives considered

#### Publish an estimated duration immediately

Benefit: Gives prospective learners a simple planning number.

Risk: The number is not supported by learner evidence and may hide substantial content or recovery work.

#### Provide no pacing structure

Benefit: Allows maximum self-paced flexibility.

Risk: Learners cannot tell whether they are making progress or ready to continue.

#### Mastery-gated milestones with later time evidence

Benefit: Gives learners visible progress and clear continuation criteria without inventing a duration promise.

Risk: Public scheduling and marketing language must wait until pilot data exists.

### Consequences

- Course planning must define artifacts and pass conditions before lesson length.
- Learner progress displays should emphasize capabilities rather than time spent.
- Recovery is part of the planned learning system, not treated as learner failure.
- Optional work must remain visibly separate from graduation requirements.
- Any future duration claim must cite pilot evidence and identify what work it includes.

### Downstream decisions

The next planning work must determine for Modules 2-4:

- the exact capability milestones inside each module;
- the artifact saved at each milestone;
- module-gate pass conditions;
- the recovery path for each gate;
- the pilot measurement method.

## D-008: Define the capability milestones within Modules 2-4

Status: Approved
Approved: Module 2 and Module 3 milestone structures on 2026-08-13; Module 4 milestone structure on 2026-08-14

### Problem

The four-module architecture is approved and Module 1 already exists. Modules 2-4 need lesson-sized capability boundaries. The milestones must be small enough for a complete beginner to understand and review without fragmenting the lifecycle into disconnected micro-tasks.

### Approved Module 2 decision

Name the module **Define, scope, and plan the portfolio** and use five capability milestones:

1. Create the portfolio brief: define the goal, one primary viewer, the decision that viewer needs to make, and the success statement.
2. Build an honest content and project-evidence inventory, distinguishing verified facts from assumptions, gaps, privacy risks, and publication constraints.
3. Choose and save one preferred visual reference with useful screenshots and its source link; detailed interpretation is deferred to Module 3.
4. Create and review the PRD, including requirements, responsive and accessibility behavior, scope, non-goals, constraints, and acceptance criteria; use Codex to identify and revise ambiguity.
5. Create the phased implementation and validation plan, trace requirements to checks, write the first bounded implementation task, and pass the readiness gate.

The primary-viewer activity is deliberately narrow and sits inside the portfolio brief. It does not require personas, extensive interviews, or a separate research project.

#### Approved Module 2 evidence

- Portfolio brief with the viewer decision and success statement.
- Content and evidence inventory.
- Reference packet containing the preferred reference, screenshots, and source link.
- Reviewed and revised PRD.
- Requirement-to-validation traceability table.
- Phased implementation plan and first bounded implementation task.

### Approved Module 3 decision

#### Module 3: Implement and debug in verified slices

1. Create and verify the minimal application from an empty workspace using the approved D-009 scaffold workflow.
2. Give Codex the preferred reference, complete the approved D-010 agent-guided clarification, approve the generated design direction, and build the complete first version with real content through small, reviewed implementation slices.
3. Review the complete first version against the PRD, design direction, content, responsive behavior, and accessibility baseline, then complete at least one evidence-backed revision cycle.
4. Diagnose and document actual or course-controlled failures using reproduction evidence, one hypothesis, the smallest justified fix, and regression checks.
5. Plan and implement one learner-selected enhancement with reduced guidance, integrate it without breaking the core, and pass the Module 3 gate.

Milestone 2 is one coherent learner-facing outcome, not one large change. Its implementation is divided into reviewable checkpoints for the foundation and Hero, Selected Work, About and Contact, and responsive-accessibility integration. See D-011 for the source audit and rationale.

### Approved Module 4 decision

#### Module 4: Validate, publish, and prove ownership

1. Complete a release validation report traced to the PRD and resolve blocking failures through the approved debugging loop.
2. Ask Codex to inspect the complete change set, review its plain-language release summary and observable evidence, check privacy and publication boundaries, and prepare a clean release-candidate checkpoint after learner approval.
3. Create a deployed preview, inspect its build evidence, and verify the live result rather than treating the URL alone as completion.
4. Make an explicit production-publication decision and record production verification and recovery evidence when publication is chosen.
5. Defend the portfolio decisions, begin a different small project plan with reduced guidance, and pass the graduation gate.

A verified deployed preview is required. A protected preview counts when supported. A public preview counts only after the learner completes and approves the privacy and publication check. Production publication remains optional and declining it does not prevent graduation. See D-012 for the source audit and detailed consequences.

### Lesson contract

Every milestone should eventually define:

- the capability being developed;
- prerequisite evidence;
- a short worked or guided input;
- the learner action;
- the saved artifact;
- verification steps;
- retrieval or self-explanation;
- pass and recovery conditions.

### Alternatives

#### Fewer broad lessons

Benefit: Produces a shorter and simpler table of contents.

Risk: Implementation and debugging lessons become large, difficult-to-resume assignments with unclear failure locations.

#### Many tool-specific micro-lessons

Benefit: Makes individual commands and concepts easy to isolate.

Risk: Recreates a technology-first syllabus and disconnects tools from the lifecycle outcome.

#### Capability milestones

Benefit: Keeps lessons focused while ensuring that each one advances a meaningful project outcome.

Risk: Some milestones may still need to be split or combined after learner pilots.

### Downstream decisions

Later planning must define:

- the exact evidence artifact for each milestone;
- module-gate rubrics and thresholds;
- recovery lessons and hint progression;
- how reference examples are distributed;
- the final learner-facing lesson titles and wording.

## D-009: Create the learner application from scratch with Codex

Status: Approved
Approved: 2026-08-13
Supersedes: D-003 and D-004

### Problem

A prepared starter removes setup friction, but it also hides consequential application-structure and dependency decisions from the learner. A basic portfolio is bounded enough for the learner to direct Codex through project creation while practising the full idea-to-application lifecycle.

### Decision

Begin Module 3 in an empty workspace. The learner uses the approved PRD and implementation plan to direct Codex to create a minimal React, TypeScript, and Vite application.

Before executing any scaffold command, Codex must present:

- the proposed commands;
- the dependencies and why each is required;
- the files and folders that will be created;
- the expected observable result;
- the automated and browser verification steps;
- any approval or network access required.

The learner reviews and approves this proposal before Codex changes the workspace.

### Scaffold boundary

The scaffold may include only:

- React, TypeScript, and Vite application configuration;
- a dependency manifest and lockfile;
- development, type-checking, linting, build, and preview commands required by the approved validation workflow;
- `.gitignore` and ordinary application entry files;
- a neutral known-working page and minimal readable baseline styles.

The scaffold must not include:

- navigation, Hero, Selected Work, About, Contact, or footer sections;
- portfolio content, case studies, personal contact information, or final assets;
- animation, component, icon, theme, analytics, backend, or integration libraries unless a later approved requirement justifies them;
- design decisions copied from the advanced reference;
- deployment configuration.

### Verification and evidence

After Codex creates the application, the learner must verify:

- the development application opens successfully;
- the neutral page appears in the browser;
- the aggregate automated baseline passes;
- created files and installed dependencies match the approved proposal;
- no portfolio feature was implemented early;
- any deviation is explained and approved or removed.

The saved scaffold evidence records the approved proposal, commands executed, dependencies created, observed browser result, automated results, and any deviation.

### Recovery boundary

A known-good recovery snapshot may exist for learners blocked by an unrecoverable scaffold or environment problem. It is fallback-only and must not be the normal starting point. Using it must be recorded so later pilot review can distinguish curriculum difficulty from environment failure.

### Alternatives considered

#### Preconfigured starter application

Benefit: Minimizes environment and dependency failures.

Risk: Hides the first application-creation decisions and weakens learner ownership and transfer.

#### Unconstrained from-scratch generation

Benefit: Gives Codex freedom to choose any architecture or tools.

Risk: Produces inconsistent projects, unnecessary dependencies, and debugging problems that distract from the portfolio lifecycle.

#### Constrained from-scratch scaffold

Benefit: Preserves application ownership and agentic practice while keeping the technical surface predictable enough to teach and support.

Risk: Scaffolding can still fail because of local tooling or network conditions, requiring an explicit recovery path.

### Consequences

- Module 3 begins with application creation and baseline verification.
- The course no longer distributes a starter application as the default learner workspace.
- The advanced portfolio remains a visual and structural reference, not source code for the learner to modify.
- Module 1 is not expanded; application creation occurs only after Module 2 approves the build contract.
- The validation workflow remains applicable, but its scripts are created during scaffolding rather than supplied in advance.
- Future implementation work must save and review the scaffold evidence before adding portfolio sections.

## D-010: Use reference-first, agent-guided design clarification

Status: Approved
Approved: 2026-08-13

### Problem

A visual reference gives Codex information that a PRD usually cannot communicate efficiently, but requiring a complete beginner to classify typography, hierarchy, layout, and interaction patterns creates unnecessary design homework. The learner should be able to begin with a natural preference and use the agent to clarify it.

### Decision

Split reference work across Modules 2 and 3:

- In Module 2, the learner chooses and saves one portfolio or general design reference they like, with useful screenshots and the source link.
- In Module 3 Milestone 2, the learner gives that reference to Codex and may initially say only that they like it.
- Codex interprets the reference together with the approved PRD and content, recommends an adaptation, and asks one necessary high-impact question at a time.
- Codex turns the conversation into a short design direction for learner review.
- The learner approves the design direction before Codex implements the first portfolio slice.

The learner is not required to complete an adopt/adapt/exclude worksheet or use professional design vocabulary. Codex may organize the final summary using those concepts, but the agent creates the summary from the conversation.

### Reference discovery

Suggested discovery sources include:

- [Pafolios](https://pafolios.com/) for portfolio structures and case-study presentation;
- [Awwwards](https://www.awwwards.com/) for expressive visual and interaction ideas that may need simplification;
- [Pinterest](https://www.pinterest.com/) for broader typography, color, composition, and mood references;
- portfolios from people working in the learner's intended field.

One strong primary reference is enough. A second reference should be added only when it resolves a specific gap, such as mobile behavior or project-card presentation. Screenshots are preferred when a linked page is animated, changes over time, requires access, or cannot be inspected reliably.

### Agent-guided clarification

Before editing, Codex should:

1. Explain in plain language what appears to define the reference's visual character and hierarchy.
2. Compare that interpretation with the learner's PRD, content, scope, and accessibility requirements.
3. Recommend what can be retained, what needs adaptation, and what should be simplified or excluded.
4. Ask only questions that materially affect the implementation, one at a time, while providing a recommended answer.
5. Draft a concise design direction and first-slice scope.
6. Wait for explicit learner approval.

The learner may respond using ordinary preference language such as "I like the large text," "this feels too plain," or "I want my projects to appear sooner." Codex is responsible for translating that feedback into a reviewable design decision.

### Historical first implementation slice

This was the initially approved boundary for Milestone 2. D-011 later expands the learner-facing outcome to a complete first version while retaining this work as the first internal implementation slice.

After approval, Codex builds:

- the semantic page foundation;
- navigation;
- Hero content from the approved portfolio artifacts;
- the initial typography, color, spacing, and layout system;
- required mobile behavior and visible keyboard focus.

Selected Work, About, Contact, optional interactions, advanced media, and reference-only effects remain outside this slice except for empty semantic targets needed by navigation.

### Review evidence

The saved record contains:

- the reference link and screenshots;
- Codex's approved design direction;
- the approved first-slice scope and non-goals;
- automated and browser evidence;
- comparison with both the PRD and design direction;
- the learner's accept-or-revise decision and reason.

### Guardrails

- The reference does not override the PRD or accessibility requirements.
- Do not copy another portfolio's written content, images, branding, or source code.
- Do not infer mobile behavior solely from a desktop screenshot; identify the gap and recommend a simple adaptation.
- Do not add animation or complex interactions only because they appear in the reference.
- Do not demand additional references when the first reference provides enough direction.

### Consequences

- Module 2 reference work becomes lightweight collection rather than detailed analysis.
- Module 3 Milestone 2 combines design clarification with the first worked implementation loop.
- The learner practises directing and approving design decisions without needing prior design terminology.
- Codex carries more responsibility for interpretation, recommendation, and progressive clarification.
- The later D-011 decision expands this first slice into a complete-first-version milestone while preserving these clarification and approval requirements.

## D-011: Use five source-audited milestones for Module 3

Status: Approved
Approved: 2026-08-13

### Problem

The seven-milestone proposal treated Selected Work, About, Contact, and page integration as separate curriculum milestones. For the learner, that made the middle of the module sound like filling content into a layout that already existed. Combining everything into a single unreviewed build, however, would make the change difficult for a beginner to understand, verify, or recover.

### Decision

Use five learner-facing milestones:

1. Create and verify the application scaffold.
2. Clarify the visual reference and build a complete first version using the learner's real content.
3. Review and improve that complete first version.
4. Debug actual or controlled failures from evidence.
5. Plan and implement one independent enhancement.

The phrase **complete first version** describes the learner-visible outcome, not the size of a Codex task or code change. Within Milestone 2, Codex proposes several small implementation slices, states acceptance checks for each, waits for approval, and verifies each slice in the browser before continuing.

Accessibility is not postponed until the end. Semantic structure, keyboard operation, visible focus, image alternatives, and usable responsive behavior are introduced while the first version is built and are checked again during the whole-page review.

### Source audit

- OpenAI's student-website workflow moves from content and design inputs to a focused first version, local testing, responsive and accessibility checks, and review before publication.
- OpenAI's responsive-frontend workflow uses screenshots or visual references, real-browser comparison at multiple sizes, and iteration.
- Google's engineering guidance recommends small, self-contained changes because they are easier to review, reason about, polish, and recover. This is why the complete-first-version milestone contains multiple implementation checkpoints.
- W3C recommends evaluating accessibility early and throughout development and notes that tools alone cannot replace human evaluation.
- MDN treats visual behavior, manual usability, accessibility checks, documented results, fixes, and regression reruns as parts of testing.
- Worked-example research supports stronger guidance early, followed by matched practice and increasing learner responsibility. Module 3 therefore moves from a guided build to a reviewed revision, evidence-first debugging, and an independently directed enhancement.

The sources support the workflow constraints; they do not prescribe exactly five milestones. The five-milestone grouping is a curriculum-design judgment that should be tested with complete-beginner pilots.

### Alternatives

#### Keep seven section-based milestones

Benefit: Each implementation area is visibly isolated.

Risk: The learner experiences the module as a list of page sections rather than a coherent build-review-debug-transfer lifecycle.

#### Generate the whole first version in one task

Benefit: Produces a visible portfolio quickly.

Risk: The resulting change is too large for a beginner to inspect, approve, debug, or explain.

#### Five milestones with internal implementation slices

Benefit: Keeps the learner-facing journey coherent while preserving small changes, approval gates, visual checks, and recovery points.

Risk: Lesson authoring must make the difference between a milestone and an implementation slice explicit.

### Consequences

- Selected Work, About, and Contact are part of the complete-first-version outcome rather than independent curriculum milestones.
- Real learner content is used during the build; Module 3 is not a placeholder-layout exercise followed by content entry.
- Whole-page evaluation and revision become a distinct capability after the first version exists.
- Accessibility checks occur during implementation and review, not only in Module 4.
- Module 4 milestone structure was resolved by D-012.

## D-012: Use a preview-first release and transfer gate for Module 4

Status: Approved
Approved: 2026-08-14

### Problem

The learner needs evidence that the portfolio is genuinely release-ready and that the agentic-coding lifecycle transfers beyond one project. Requiring only a local build would omit deployment evidence. Requiring every learner to publish publicly to production would create avoidable privacy, permission, and repository-visibility risks.

### Decision

Use five learner-facing milestones:

1. Complete the release validation report.
2. Review and prepare the release candidate.
3. Create and verify a deployed preview.
4. Make the production-publication decision.
5. Prove ownership and transfer.

Graduation requires a deployed preview that the learner has opened and verified. A protected preview counts when the hosting workflow supports it. A public preview requires a completed privacy and publication check. Production publication is optional, must be explicitly approved by the learner, and is not required for graduation.

The privacy and publication check covers personal details, contact information, project permissions, repository visibility, assets, and credentials. A learner who chooses production must verify the production result and record a rollback or recovery path. A learner who declines production records the reason and the later publication steps.

### Source audit

- Official OpenAI documentation recommends preview deployment by default, keeping production changes explicit, running the local build, verifying deployment readiness, and reading deployment logs when failures occur.
- Official OpenAI code-review guidance recommends inspecting the repository diff before committing or pushing and supports reviews scoped to a branch, commit, or working tree. In this course, Codex performs that technical inspection and translates it for the learner.
- GitHub's review guidance treats the diff as the basis for checking bugs, missing error handling, accessibility, and readability before merging. This establishes the engineering check, not a requirement that non-technical learners interpret the diff themselves.
- GitHub documents that public repositories are accessible to everyone and that removing sensitive data from repository history is difficult and may not remove it from existing clones or forks.
- W3C states that accessibility should be evaluated throughout development and that automated tools alone cannot establish accessibility.
- Vercel distinguishes local, preview, and production environments; previews support testing without changing production, but generated preview URLs are publicly accessible by default unless protection is configured.
- National Academies guidance treats applying learning in a new context as transfer and warns that transfer should not be assumed from performance in the original context alone.

The sources support preview-first verification, deliberate public exposure, direct human review, and a separate transfer task. They do not prescribe exactly five milestones or make production optional; those are approved curriculum judgments for this complete-beginner course.

### Alternatives

#### Require production publication for every learner

Benefit: Every graduate leaves with a stable public portfolio URL.

Risk: Learners may expose personal information, restricted project material, repository history, or unfinished work merely to pass the course.

#### Require only a local production build

Benefit: Avoids accounts, hosting configuration, and public exposure.

Risk: Does not demonstrate that the learner can interpret deployment logs or verify a result outside the local environment.

#### Require a verified preview and make production explicit

Benefit: Preserves authentic deployment evidence and learner agency while separating technical readiness from the decision to publish publicly.

Risk: The course must explain that some preview URLs are public by default and must not describe preview as synonymous with private.

### Consequences

- The graduation gate requires live deployment evidence but not mandatory production exposure.
- Privacy review occurs before any unprotected URL is shared.
- Repository visibility and secret checking become release-readiness capabilities rather than optional warnings.
- Production publication includes post-publication verification and recovery evidence.
- The transfer task uses a different small project and reduced guidance; a polished portfolio alone cannot prove graduation.
- Hosting-provider selection remains a separate decision because the curriculum requirements are provider-neutral.

## D-013: Replace learner code review with a plain-language change review

Status: Approved
Approved: 2026-08-14

### Problem

The course targets learners who are not assumed to know programming, Git, repositories, or codebases. Requiring them to interpret source code, line-level diffs, staging state, or pull requests would test technical reading skills that the course does not teach and could create false confidence that an unreadable diff had been meaningfully reviewed.

Removing review entirely would also be unsafe. Learners still need enough information and evidence to decide whether generated work should be accepted, revised, saved, or published.

### Decision

Use a fixed plain-language review contract throughout Modules 3 and 4.

Codex performs the technical code and diff inspection. Before acceptance, the learner asks Codex to summarize:

1. What changed.
2. What the learner should notice in the website.
3. What was intentionally not changed.
4. Which checks were run and their results.
5. Any remaining risks, limitations, or decisions.

The learner verifies the actual website and available test evidence against the acceptance criteria, then accepts the change or describes a revision. They are not required to read code, inspect a diff, understand staged and unstaged changes, use `/review`, operate a code-review pane, or review a pull request.

Git is taught only at the level needed for this course: a checkpoint is a recoverable saved version. Codex may prepare the checkpoint after learner approval. Code and diff review remain optional enrichment for learners who want a more technical path.

### Alternatives

#### Require direct code and diff review

Benefit: Mirrors professional engineering review more closely.

Risk: Misaligns with the learner prerequisites and turns acceptance into a technical ritual that beginners cannot perform meaningfully.

#### Remove review and rely on Codex completely

Benefit: Produces the simplest learner flow.

Risk: The learner has no structured basis for understanding or approving what changed.

#### Plain-language summary plus observable evidence

Benefit: Preserves learner agency while matching the review evidence to what a non-technical learner can understand and verify.

Risk: Learners rely on Codex for technical inspection, so the course must pair the summary with browser checks, test results, clear non-goals, and explicit limitations.

### Consequences

- Every implementation slice ends with the same five-part plain-language summary.
- The learner's acceptance decision relies on the summary, acceptance criteria, browser behavior, and test evidence.
- Codex remains responsible for technical inspection and for flagging unexplained changes, secrets, privacy risks, and limitations.
- Required graduation evidence includes the learner-approved summary, not a learner-reviewed diff.
- Git terminology is limited to recoverable checkpoints; staging and pull-request mechanics are optional.
- Existing source guidance about reviewing diffs is retained as engineering evidence but is no longer represented as a learner task.
