# Beginner Agentic Portfolio Course Plan

Status: Planning draft 0.1
Last updated: 2026-08-14
Current phase: Curriculum planning only

## Purpose

This course is for a complete beginner who wants to use Codex to plan, build, debug, test, and publish a professional portfolio website.

The portfolio is the practice project. The primary learning goal is the transferable ability to direct and review an AI-assisted software project through its complete lifecycle.

## Planning boundaries

This package contains curriculum planning only. It does not create or modify:

- the learner's application repository or scaffold;
- the reference portfolio;
- course application code;
- deployment configuration;
- learner-facing lesson content.

Those decisions and artifacts require later approval.

Module 1 already exists in the course repository and is outside this planning package's curriculum scope. This package plans Modules 2-4 only. Module 1 is referenced solely to define the capabilities learners need before entering Module 2.

## Target learner

The course assumes normal computer use but does not assume prior knowledge of:

- programming;
- terminals or command-line tools;
- Git or GitHub;
- software repositories;
- web-development workflows;
- coding agents.

## Non-technical review contract

Learners are not required to read source code, interpret line-level diffs, understand staged and unstaged changes, use a code-review pane, or review a pull request.

Codex performs the technical inspection. Before the learner accepts a change, they ask Codex for a plain-language summary containing:

1. What changed.
2. What the learner should notice in the website.
3. What was intentionally not changed.
4. Which checks were run and their results.
5. Any remaining risks, limitations, or decisions.

The learner then checks the actual website and available test evidence against the acceptance criteria. They accept the change or describe what should be revised. Reading the underlying code or diff is optional enrichment, not a course requirement.

Git is introduced as a way to save a recoverable project checkpoint. Learners may ask Codex to prepare the checkpoint after approval; they are not required to operate or explain staging mechanics.

## Graduation outcome

By the end of the course, the learner should be able to:

1. Open and understand the basic structure of a small software project.
2. Give Codex a bounded task with sufficient context and clear success criteria.
3. Turn a vague product idea into requirements and an implementation plan.
4. Direct implementation in small, reviewable phases.
5. Investigate errors using observable evidence instead of repeatedly guessing.
6. Validate functionality, responsive behavior, and basic accessibility.
7. Use Codex's plain-language change summary and observable evidence before accepting or publishing changes.
8. Publish a portfolio and verify the live result.
9. Begin a different small project using the same lifecycle.

## Curriculum architecture

The approved architecture is lifecycle-first:

> Understand and set up -> plan -> implement -> debug -> test -> publish -> transfer

HTML, CSS, React, TypeScript, Git, and deployment are taught when the learner needs them within that lifecycle. They support the workflow rather than determine the module order.

## Existing Module 1 entry contract

Module 1 content, sequence, exercises, assessment, and learner-facing wording are not redesigned here.

Before beginning Module 2, the learner should already be able to:

1. Explain the difference between a coding agent and a text-only assistant.
2. Recognize the roles of the model, harness, skills, sandbox, and approval policy.
3. Apply the course-approved Codex configuration.
4. Recognize when Codex requires approval and make a deliberate approval decision.
5. Complete the existing Module 1 practice and mastery gate.

If a learner cannot yet demonstrate these prerequisites, they return to the existing Module 1 materials or support flow rather than receiving replacement Module 1 instruction from this plan.

## Module 2: Define, scope, and plan the portfolio

### Outcome

The learner can convert a vague portfolio idea into an evidence-backed, implementation-ready build contract that both the learner and Codex can follow and evaluate.

### Approved capability milestones

1. Create the portfolio brief: define the goal, select one primary viewer, identify the decision that viewer needs to make, and state what successful communication looks like.
2. Build the content and evidence inventory: gather biography, skills, project evidence, outcomes, media, and links; separate verified facts from assumptions or gaps; and check privacy and publication permission.
3. Choose and save a visual reference: find one portfolio or design reference the learner likes, save its link and useful screenshots, and record the source. Detailed design interpretation is deferred to Module 3, where Codex guides the clarification.
4. Create and review the PRD: define requirements, responsive and accessibility behavior, scope, non-goals, constraints, and acceptance criteria; then use Codex to identify ambiguity and revise the document.
5. Create the implementation and validation plan: divide the work into small phases, identify dependencies and expected change areas, connect each requirement to a validation check, write the first implementation task, and pass the Module 2 readiness gate.

### Approved readiness evidence

- Portfolio brief containing the primary viewer, viewer decision, and success statement.
- Honest content and project-evidence inventory with gaps and publication constraints identified.
- Reference packet containing one preferred reference, useful screenshots, and its source link.
- Reviewed and revised PRD.
- Requirement-to-validation traceability table.
- Phased implementation plan and first bounded implementation task.

## Module 3: Implement and debug in verified slices

### Outcome

The learner can direct Codex through small implementation phases, verify each phase, and debug failures using evidence.

### Approved starting boundary

Module 3 begins in an empty workspace, not a prepared application template. Using the approved PRD and implementation plan, the learner directs Codex to propose a minimal React, TypeScript, and Vite scaffold. Codex must show the commands, dependencies, files, and validation steps and wait for approval before creating the application.

The scaffold phase creates only the application environment and a neutral known-working page. It does not create portfolio sections, add optional libraries, or make unapproved product decisions. After creation, the learner verifies that the application runs and that the automated baseline passes. A known-good recovery snapshot may be provided only when the learner cannot recover the scaffold through the course support flow.

### Approved five-milestone structure

#### Milestone 1: Create and verify the application

The learner directs Codex to propose the constrained scaffold, reviews the proposal, approves its creation, and verifies the neutral application in both the terminal and browser. The saved checkpoint establishes a known-good baseline before portfolio work begins.

#### Milestone 2: Build the complete first version from the reference and real content

The learner gives Codex the preferred reference selected in Module 2 and may simply say that they like it. Codex interprets the reference together with the approved PRD and content, recommends an adaptation, and asks only necessary high-impact questions one at a time. The learner reviews and approves the resulting design direction before implementation.

Codex then helps build a coherent first version containing navigation, Hero, Selected Work, About, Contact, footer, initial mobile behavior, and the basic accessibility baseline. This is one learner-facing outcome, but it is not one unbounded code change. Codex must propose a small sequence of reviewable implementation slices, such as:

1. Semantic foundation, navigation, Hero, and initial visual system.
2. Selected Work using the learner's real project evidence.
3. About, Contact, and footer using the learner's real content.
4. Responsive and accessibility integration across the page.

Each slice is approved, implemented, checked in the browser, and reviewed before the next begins. These checkpoints keep the build understandable without turning each page section into a separate content-filling milestone.

The reference guides visual character and hierarchy but does not authorize copying its content, images, branding, or source code. Screenshots are preferred when the original page is animated, changes over time, or cannot be inspected reliably from its link.

#### Milestone 3: Review and improve the complete first version

The learner reviews the whole portfolio rather than treating generated code as finished. They compare it with the PRD, approved design direction, real content, and primary-viewer goal; inspect required desktop and mobile sizes; and perform the basic keyboard and accessibility checks.

The learner may respond in ordinary language, such as "the projects feel buried" or "this section is hard to read." Codex translates that feedback into a bounded revision proposal. The milestone requires at least one evidence-backed revision cycle and a fresh run of the affected checks.

#### Milestone 4: Debug from evidence

The learner investigates actual or course-controlled build, runtime, interaction, or visual failures using the same loop:

> Reproduce -> record expected and actual behavior -> collect evidence -> form one hypothesis -> make the smallest justified fix -> rerun the original check -> run relevant regression checks

The goal is not to memorize fixes. The learner must be able to explain what evidence identified the failure and why the accepted change addresses it.

#### Milestone 5: Plan and implement one independent enhancement

The learner selects one bounded enhancement, states its goal and acceptance criteria, asks Codex for a small implementation plan, reviews the plan, and directs the implementation with reduced guidance. They integrate it without breaking the core portfolio and complete the Module 3 evidence gate.

### Approved portfolio core

1. Navigation and semantic page structure.
2. Hero section.
3. Selected Work with at least two evidence-rich project cases.
4. About or professional story.
5. Contact section.
6. Responsive mobile layout.
7. One optional interaction, such as theme switching or a project-detail modal.

Advanced motion, video backgrounds, 3D scenes, GitHub activity graphs, and elaborate galleries are proposed extensions rather than core graduation requirements.

### Approved implementation loop

Every implementation slice follows the same loop:

> Inspect -> plan -> implement -> run checks -> view in browser -> compare with acceptance criteria -> ask Codex for the plain-language change summary -> accept or revise

### Approved debugging practice

- A TypeScript or build failure.
- An incorrect file or asset reference.
- A responsive visual defect.
- An interaction that runs but fails an acceptance criterion.
- A structured bug report with reproduction steps, expected behavior, actual behavior, and evidence.

### Approved evidence gate

- Working local portfolio containing the approved core and real learner content.
- Approved design direction and build log showing the reviewable implementation slices.
- Browser screenshots at required viewport sizes.
- Evidence of at least one whole-page review and bounded revision cycle.
- At least one structured debugging report explaining reproduction, evidence, hypothesis, fix, and regression checks.
- Plan and acceptance evidence for one learner-selected enhancement.
- Learner-approved final change summary covering visible changes, checks, non-goals, and remaining limitations.
- Passing build and type checks.

## Module 4: Validate, publish, and prove ownership

### Outcome

The learner can validate a release candidate, deploy and verify a live preview, make a deliberate production-publication decision, and demonstrate ownership and transfer beyond the portfolio.

### Approved five-milestone structure

#### Milestone 1: Complete the release validation report

The learner returns to the Module 2 validation plan and traces every acceptance criterion to current evidence. They run the automated quality gate and production build, then directly check content, navigation, links, required desktop and mobile layouts, keyboard operation, visible focus, image alternatives, readable contrast, and unexplained console errors.

Passing an automated command is not sufficient. The learner records the manual evidence, known limitations, and any blocking failure. A blocking failure returns to the approved evidence-first debugging loop before the release candidate can continue.

#### Milestone 2: Review and prepare the release candidate

The learner asks Codex to inspect the complete change set technically and report the result through the approved plain-language summary. The summary must state whether the implementation matches the PRD, identify unexplained or unnecessary changes, report the repository visibility and publication boundary, and flag possible credentials, private project material, or personal information that should not be published.

The learner verifies the website behavior and test evidence, then accepts or requests a revision. After acceptance, they may ask Codex to create a clean release checkpoint. They need to understand that this is a recoverable saved version; reading the code, diff, staging area, or pull request is not required.

#### Milestone 3: Create and verify a deployed preview

The learner directs Codex to propose the deployment steps and waits to approve any external state change. They create a preview deployment, inspect its build status and logs, open the deployed URL, and repeat the critical functional, responsive, content, and accessibility checks against the live result.

A verified deployed preview is required for graduation. The learner must resolve or document discrepancies between the local build and the deployed result rather than treating a generated URL as proof of success.

#### Milestone 4: Make the production-publication decision

Before sharing any unprotected URL, the learner completes a privacy and publication check covering personal details, contact information, project permissions, repository visibility, assets, and credentials.

A protected preview counts when the hosting workflow supports access protection. A public preview also counts after the learner approves its exposure and passes the privacy check. Production publication is optional and requires an explicit learner decision; declining production does not block graduation.

If the learner publishes to production, they promote or create the approved production deployment, verify the production URL, inspect relevant status or logs, and record the available rollback or recovery path. If they do not publish, they save the reason and the steps they would use later.

#### Milestone 5: Prove ownership and transfer

The learner presents the portfolio and explains the primary viewer, PRD, reference adaptation, one consequential design decision, one revision, one debugging investigation, deployment evidence, and known limitations. Codex may ask clarification questions, but the learner must provide the explanation.

The learner then begins a different small project with reduced guidance by creating its brief, initial requirements, validation approach, and first bounded implementation plan. The portfolio alone is not sufficient graduation evidence because it does not show that the lifecycle can be applied in a new context.

### Approved graduation evidence

- Learner-approved plain-language release summary and clean release-candidate checkpoint.
- Verified deployed preview URL, which may be protected or deliberately public.
- Test report traced to PRD acceptance criteria.
- Mobile and desktop verification evidence.
- Basic accessibility checklist.
- Privacy and publication checklist.
- Deployment status or log evidence and live-result verification.
- Production decision record; production verification and recovery evidence when publication is chosen.
- Explanation of consequential design, revision, and debugging decisions.
- Known limitations.
- Initial brief, requirements, validation approach, and first bounded implementation plan for a different small project.

## Assessment model

The proposed assessment system has four layers:

1. Short retrieval questions after lessons and again after a delay.
2. Observable performance gates at the end of every module.
3. Saved planning, implementation, debugging, and testing artifacts.
4. A final walkthrough and transfer task that reveal learner ownership.

A polished portfolio by itself is not sufficient evidence of course completion because the learner may not understand or be able to reproduce the workflow.

## Current decisions

Approved:

- Four-module lifecycle-first architecture.
- Portfolio as a bounded practice project for transferable agentic-coding skills.
- Planning documents kept in a portable, implementation-free folder.
- From-scratch application creation: the learner directs Codex to scaffold a constrained React, TypeScript, and Vite application from an empty workspace, with a recovery snapshot available only as fallback.
- Three-command validation workflow supported by transparent diagnostic commands and manual browser evidence.
- Focused professional portfolio core plus one learner-selected enhancement; advanced reference effects remain optional.
- Mastery-gated pacing based on demonstrated capabilities and saved evidence, with no public duration estimate before learner pilots.
- Curriculum-planning scope limited to Modules 2-4, with the existing Module 1 represented only through its entry contract.
- Module 2 named "Define, scope, and plan the portfolio" with five approved capability milestones ending in an implementation-readiness gate.
- Reference-first, agent-guided design clarification for Module 3 Milestone 2; the learner chooses a reference while Codex helps interpret and adapt it before implementation.
- Module 3 uses five learner-facing milestones: verified scaffold, complete first version built through reviewable slices, whole-page review and revision, evidence-first debugging, and one independently directed enhancement.
- Module 4 uses five learner-facing milestones: release validation, reviewed release candidate, verified deployed preview, explicit production decision, and ownership plus transfer evidence.
- Graduation requires a verified deployed preview; a protected preview counts, a public preview requires a privacy check, and production publication remains optional and learner-approved.
- Technical code and diff inspection is delegated to Codex; learners approve work through a fixed plain-language summary, observable website behavior, and test evidence.

Superseded:

- Clean, preconfigured learner starter strategy.
- Minimal verified starter-template boundary.

Not yet approved:

- Learner-facing lesson breakdown inside the approved Module 3 milestones.
- Learner-facing lesson breakdown inside the approved Module 4 milestones.
- Assessment thresholds.
- Hosting platform.
- Public course wording and presentation.

## Next planning decision

Consolidate the approved Module 2-4 decisions into the final portable curriculum plan, while leaving learner-facing lesson scripts, assessment thresholds, and hosting-provider selection for later approval.
