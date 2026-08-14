# Final Curriculum Plan: Beginner Agentic Portfolio Course

- Status: Approved curriculum plan v1
- Scope: Modules 2-4 only
- Last consolidated: 2026-08-14
- Artifact type: Portable curriculum planning document, not implementation

## Purpose

This course is for a complete beginner who wants to use Codex to plan, build, debug, validate, and deploy a professional portfolio website.

The portfolio is the practice project. The larger learning goal is the transferable ability to direct an AI-assisted software project through a complete lifecycle:

> Understand and set up -> plan -> implement -> debug -> validate -> deploy -> transfer

Module 1 already exists and is not redesigned here. This plan begins with the capabilities learners need before entering Module 2 and then defines the approved curriculum for Modules 2-4.

## Target learner

The learner is comfortable with ordinary computer use but is not assumed to know:

- programming;
- terminals or command-line tools;
- Git or GitHub;
- software repositories;
- web-development workflows;
- coding agents.

The course does not turn code reading into a hidden prerequisite. HTML, CSS, React, TypeScript, Git, testing, and deployment are introduced only when they support the current project decision.

## Graduation outcome

By the end of the course, the learner should be able to:

1. Give Codex a bounded task with useful context, boundaries, and success criteria.
2. Turn a vague idea into a portfolio brief, requirements, acceptance criteria, and an implementation plan.
3. Direct work through small, approved implementation phases.
4. Compare the actual website with the requirements and a chosen design reference.
5. Investigate failures using observable evidence instead of repeated guessing.
6. Check functionality, responsive behavior, content, and basic accessibility.
7. Use Codex's plain-language change summary and observable evidence before accepting work.
8. Create and verify a live deployment without being forced to publish permanently to production.
9. Explain important decisions, limitations, and one debugging investigation.
10. Begin a different small project using the same lifecycle with less guidance.

## Course-wide operating model

### Mastery-based pacing

The course does not promise a fixed number of hours. A learner advances when they can demonstrate the required capability and save the required evidence.

A polished portfolio alone is not proof of graduation. The learner must also show planning, approval, validation, debugging, deployment, ownership, and transfer evidence.

### Non-technical change review

Learners are not required to read source code, interpret line-level diffs, understand staging, use `/review`, operate a code-review pane, or review a pull request.

Codex performs the technical inspection. Before accepting a change, the learner asks Codex for a plain-language summary containing:

1. What changed.
2. What the learner should notice in the website.
3. What was intentionally not changed.
4. Which checks were run and their results.
5. Any remaining risks, limitations, or decisions.

The learner then checks the actual website and available test evidence against the acceptance criteria. They accept the change or describe what should be revised.

Git is introduced as a way to save a recoverable project checkpoint. Codex may prepare the checkpoint after learner approval. Direct code, diff, staging, and pull-request work remains optional enrichment.

### Standard implementation loop

Every implementation slice follows the same learner-visible loop:

> Inspect -> propose a plan -> approve -> implement -> run checks -> view in browser -> compare with acceptance criteria -> ask for the plain-language change summary -> accept or revise

Codex should ask only questions that materially affect the work, one at a time, and provide a recommended answer. The learner may respond in ordinary language rather than technical or design vocabulary.

### Standard debugging loop

When something fails, the learner directs Codex to use this sequence:

> Reproduce -> record expected and actual behavior -> collect evidence -> form one hypothesis -> make the smallest justified fix -> rerun the original check -> run relevant regression checks

The learner is not expected to diagnose code. They must be able to explain the visible problem, the evidence Codex used, and whether the accepted fix solved the original problem.

### Validation workflow

The project uses three memorable validation entry points:

1. `npm run dev` starts the local website for browser review.
2. `npm run check` runs type checking, linting, and the production build.
3. `npm run preview` serves the production build for final local verification.

Codex may run these commands and explain the results. The learner does not need to memorize the underlying diagnostic commands, but the individual checks remain available to Codex when a failure needs isolation.

Automated success is never the only evidence. The learner also checks the website in the browser, including the required desktop and mobile layouts, navigation, content, keyboard operation, visible focus, image alternatives, and unexplained console errors.

## Module 1 entry contract

Module 1 content, sequence, exercises, assessment, and learner-facing wording remain unchanged.

Before Module 2, the learner should already be able to:

1. Explain the difference between a coding agent and a text-only assistant.
2. Recognize the roles of the model, harness, skills, sandbox, and approval policy.
3. Apply the course-approved Codex configuration.
4. Recognize when Codex requires approval and make a deliberate approval decision.
5. Complete the existing Module 1 practice and mastery gate.

If these prerequisites are not yet demonstrated, the learner returns to the existing Module 1 support flow rather than receiving replacement Module 1 content from this plan.

## Module 2: Define, scope, and plan the portfolio

### Outcome

The learner can convert a vague portfolio idea into an evidence-backed, implementation-ready build contract that both the learner and Codex can follow and evaluate.

### Milestone 1: Create the portfolio brief

The learner defines:

- the purpose of the portfolio;
- one primary viewer;
- the decision that viewer should be able to make;
- what successful communication looks like.

This is a narrow audience decision, not a separate user-research project. The learner is not required to create personas or conduct extensive interviews.

### Milestone 2: Build the content and evidence inventory

The learner gathers:

- biography and professional direction;
- skills and capabilities;
- project evidence and outcomes;
- images, media, and links;
- contact methods and professional profiles.

They distinguish verified facts from assumptions or gaps and check privacy, ownership, and publication permission. Invented outcomes or misleading claims are not acceptable.

### Milestone 3: Choose and save one visual reference

The learner finds one portfolio or general design reference they like and saves:

- the source link;
- useful screenshots;
- any obvious reason they like it, if they can express one.

Suggested discovery sources include [Pafolios](https://pafolios.com/), [Awwwards](https://www.awwwards.com/), [Pinterest](https://www.pinterest.com/), and portfolios from people in the learner's intended field.

The learner does not need to analyze typography, spacing, hierarchy, or interaction patterns. Detailed interpretation is deferred to Module 3, where Codex guides the clarification.

### Milestone 4: Create and review the PRD

The learner works with Codex to define:

- requirements;
- responsive and accessibility behavior;
- scope and non-goals;
- constraints;
- acceptance criteria;
- unresolved questions.

Codex identifies ambiguity in plain language. The learner revises and approves the PRD before implementation planning.

### Milestone 5: Create the implementation and validation plan

The learner directs Codex to:

- divide the work into small phases;
- identify dependencies and expected change areas;
- connect each requirement to a validation check;
- write the first bounded implementation task.

### Module 2 evidence gate

The learner saves:

- the portfolio brief;
- the honest content and project-evidence inventory;
- the preferred reference link and screenshots;
- the reviewed PRD;
- the requirement-to-validation table;
- the phased implementation plan;
- the first bounded implementation task.

The learner does not advance until the required content, boundaries, acceptance criteria, and first task are clear enough for Codex to act without inventing high-impact requirements.

## Module 3: Implement and debug in verified slices

### Outcome

The learner can direct Codex through bounded implementation phases, verify each visible result, request revisions in ordinary language, and debug failures from evidence.

### Milestone 1: Create and verify the application

Module 3 begins in an empty workspace rather than a prepared portfolio template.

Using the approved PRD and implementation plan, the learner asks Codex to propose a minimal React, TypeScript, and Vite scaffold. Codex must show the commands, dependencies, expected files, and validation steps and wait for approval before creating it.

The scaffold contains only the application environment and a neutral known-working page. It does not create portfolio sections, add optional libraries, or make unapproved product decisions.

After creation, the learner confirms that the neutral page opens and that the automated baseline passes. A known-good recovery snapshot is available only when the scaffold cannot be recovered through the course support flow; it is not the normal starting point.

### Milestone 2: Build the complete first version from the reference and real content

The learner gives Codex the reference selected in Module 2 and may begin with a simple statement such as, "I like this design."

Codex:

1. Interprets the reference together with the PRD and real content.
2. Explains the apparent visual character and hierarchy in plain language.
3. Recommends what to retain, adapt, simplify, or exclude.
4. Asks only necessary high-impact questions, one at a time.
5. Drafts a short design direction for learner approval.

The learner is not required to use professional design vocabulary. They may respond with comments such as, "I like the large text," "this feels too plain," or "I want the projects to appear sooner."

After approval, Codex helps build a coherent first version containing:

- semantic page structure and navigation;
- Hero;
- Selected Work;
- About;
- Contact;
- footer;
- initial mobile behavior;
- the basic accessibility baseline.

This is one learner-facing milestone, not one large code change. Codex divides the work into small internal slices, such as foundation and Hero, Selected Work, About and Contact, and responsive-accessibility integration. Each slice follows the standard implementation loop before the next begins.

The reference guides visual character and hierarchy. It does not authorize copying another portfolio's content, images, branding, or source code.

### Milestone 3: Review and improve the complete first version

The learner reviews the whole website in the browser and compares it with:

- the PRD;
- the approved design direction;
- the real content;
- the primary-viewer goal;
- the required desktop and mobile layouts;
- the basic keyboard and accessibility checks.

The learner gives feedback in ordinary language. Codex translates that feedback into a bounded revision proposal and waits for approval. At least one evidence-backed revision cycle is required.

### Milestone 4: Debug from evidence

The learner investigates at least one actual or course-controlled build, runtime, interaction, or visual failure through the standard debugging loop.

The saved report includes:

- reproduction steps;
- expected behavior;
- actual behavior;
- evidence collected by Codex;
- the tested hypothesis;
- the accepted fix;
- the original and regression check results.

The learner explains the visible failure, the evidence used, and whether the fix solved the original problem. Memorizing code-level fixes is not required.

### Milestone 5: Plan and implement one independent enhancement

With reduced guidance, the learner selects one bounded enhancement, states its goal and acceptance criteria, reviews Codex's small implementation plan, and directs the implementation.

Possible enhancements include:

- light and dark theme switching;
- a project-detail modal or dedicated view;
- restrained entrance or transition motion;
- a downloadable resume or evidence artifact;
- another similarly bounded enhancement approved during planning.

The enhancement must not break the core portfolio.

### Required portfolio core

The working portfolio contains:

1. Navigation with working links to the main sections.
2. A Hero stating the learner's name, professional direction, short value proposition, and primary action.
3. Selected Work with at least two evidence-rich project cases.
4. An About section explaining the learner's relevant story, capabilities, and direction.
5. A Contact section with at least one verified contact method and appropriate professional links.
6. A focused footer.
7. A usable mobile and desktop layout.
8. Semantic headings and landmarks, keyboard operation, visible focus, and meaningful alternatives for important images.
9. No broken primary links or unexplained console errors.
10. One learner-selected enhancement.

Each project case communicates the problem or opportunity, the learner's contribution, the approach, the result or current evidence, and a limitation or lesson learned.

Learners without two prior projects may use the course portfolio as one case and complete one bounded supporting project or documented concept case. Invented results are not permitted.

### Module 3 evidence gate

The learner saves:

- the verified scaffold baseline;
- the reference and approved design direction;
- the build log showing the internal implementation slices;
- browser evidence at the required desktop and mobile sizes;
- at least one whole-page revision cycle;
- at least one structured debugging report;
- the enhancement plan and acceptance evidence;
- the learner-approved plain-language final change summary;
- passing automated checks.

If the gate fails, the learner returns to the most recent accepted checkpoint and uses the standard debugging or revision loop. They do not add more features to hide an unresolved core failure.

## Module 4: Validate, publish, and prove ownership

### Outcome

The learner can validate a release candidate, deploy and verify a live preview, make a deliberate production-publication decision, and demonstrate ownership and transfer beyond the portfolio.

### Milestone 1: Complete the release validation report

The learner returns to the Module 2 validation plan and traces every acceptance criterion to current evidence.

Codex runs the automated quality gate and production build. The learner directly checks content, navigation, links, required desktop and mobile layouts, keyboard operation, visible focus, image alternatives, readable contrast, and unexplained console errors.

Passing an automated command is not sufficient. Blocking failures return to the standard debugging loop before the release candidate continues.

### Milestone 2: Review and prepare the release candidate

The learner asks Codex to inspect the complete technical change set and provide the five-part plain-language release summary.

The summary also states:

- whether the implementation matches the PRD;
- whether unexplained or unnecessary changes were found;
- the repository visibility and publication boundary;
- whether possible credentials, private project material, unapproved assets, or personal information were found.

The learner verifies the website behavior and test evidence, then accepts or requests a revision. After acceptance, they may ask Codex to create the clean release checkpoint.

### Milestone 3: Create and verify a deployed preview

The learner asks Codex to propose the deployment steps and waits to approve any external state change.

After approval, they create a preview deployment, inspect its build status and logs with Codex, open the deployed URL, and repeat the critical functional, responsive, content, and accessibility checks against the live result.

A generated URL is not proof of completion. The learner must resolve or document discrepancies between the local and deployed results.

### Milestone 4: Make the production-publication decision

A verified deployed preview is required for graduation. Production publication is optional.

Before sharing an unprotected URL, the learner completes a privacy and publication check covering:

- personal details and contact information;
- project confidentiality and publication permission;
- repository visibility;
- asset ownership;
- credentials and private configuration.

A protected preview counts when the hosting workflow supports protection. A public preview counts only after the learner approves the exposure and passes the privacy check.

If the learner chooses production, they approve the production action, verify the production URL and relevant logs or status, and record the available rollback or recovery path.

If the learner declines production, they record the reason and the steps they would use later. Declining production does not block graduation.

### Milestone 5: Prove ownership and transfer

The learner presents the portfolio and explains:

- the primary viewer and goal;
- the PRD and important scope boundary;
- how the reference was adapted rather than copied;
- one consequential design decision;
- one revision prompted by visible evidence;
- one debugging investigation;
- deployment evidence;
- known limitations.

Codex may ask clarification questions, but the learner provides the explanation.

The learner then begins a different small project with reduced guidance by producing:

- its brief;
- initial requirements;
- a validation approach;
- the first bounded implementation plan.

The learner explains why the lifecycle applies to the new project instead of mechanically repeating portfolio-specific steps.

### Module 4 and graduation evidence gate

The learner saves:

- the release validation report traced to the PRD;
- the learner-approved plain-language release summary;
- the clean release checkpoint;
- the verified deployed preview URL, protected or deliberately public;
- desktop and mobile verification evidence;
- the basic accessibility checklist;
- the privacy and publication checklist;
- deployment status or log evidence;
- the production decision record;
- production verification and recovery evidence when production is chosen;
- the ownership walkthrough;
- known limitations;
- the different-project brief, requirements, validation approach, and first bounded plan.

## Assessment model

Assessment has four layers:

1. Short retrieval questions after instruction and again after a delay.
2. Observable capability gates at the end of each module.
3. Saved planning, implementation, debugging, validation, and deployment artifacts.
4. A final ownership walkthrough and different-project transfer task.

The exact passing thresholds remain deferred until representative learner pilots provide evidence. Course duration also remains unspecified until those pilots measure actual beginner progress and recovery needs.

## Features outside the required core

The following may appear in an advanced reference or later extension but are not required for graduation:

- video backgrounds;
- 3D or Spline scenes;
- GitHub activity graphs or live external integrations;
- large galleries, carousels, or complex multi-stage modals;
- extensive scroll-driven animation;
- analytics;
- contact-form backends;
- content-management systems;
- custom-domain configuration.

## Deferred implementation decisions

This approved curriculum plan does not yet determine:

- learner-facing lesson scripts and exact lesson boundaries;
- assessment passing thresholds;
- required desktop and mobile viewport values;
- the hosting provider;
- public course wording and presentation;
- course application or Course Companion implementation;
- deployment configuration;
- learner repository files or recovery artifacts.

These decisions require later approval and must not be inferred from this plan.

## Research basis

The curriculum uses authoritative sources for workflow and learning claims while keeping course-specific judgments explicit.

Key sources include:

- [OpenAI: Prompting](https://learn.chatgpt.com/docs/prompting) for goal, context, boundaries, expected output, and final checks.
- [OpenAI: Code review](https://learn.chatgpt.com/docs/code-review) for technical inspection before accepting or publishing changes. This course delegates that inspection to Codex and gives the learner a plain-language summary.
- [OpenAI: Build a student website](https://learn.chatgpt.com/use-cases/build-student-website) for a focused first version tied to content, design, accessibility, and local testing.
- [OpenAI: Build responsive front-end designs](https://learn.chatgpt.com/use-cases/frontend-designs) for visual references, real-browser comparison, multiple sizes, and iteration.
- [OpenAI: Deploy an app or website](https://learn.chatgpt.com/use-cases/deploy-app-or-website) for preview-first deployment, explicit production intent, readiness checks, and deployment logs.
- [GitHub: Repository visibility](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories) and [removing sensitive data](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository) for public-exposure and credential safeguards.
- [Vercel: Deployment environments](https://vercel.com/docs/deployments/environments) and [generated URLs](https://vercel.com/docs/deployments/generated-urls) for the distinction between preview and production and the fact that preview URLs may be public unless protected. These sources support the workflow but do not select Vercel as the course host.
- [W3C: Evaluating web accessibility](https://www.w3.org/WAI/test-evaluate/) for early and repeated accessibility evaluation and the limits of automated tools.
- [MDN: Semantic HTML](https://developer.mozilla.org/en-US/curriculum/core/semantic-html/) and [MDN: Testing](https://developer.mozilla.org/en-US/curriculum/extensions/testing/) for semantic structure, visual and functional testing, manual checks, and regression evidence.
- [Microsoft Engineering Playbook: Test planning](https://microsoft.github.io/code-with-engineering-playbook/automated-testing/test-planning/) for deriving checks from acceptance criteria.
- [Google Engineering Practices: Small changes](https://google.github.io/eng-practices/review/developer/small-cls.html) for small, self-contained implementation slices.
- [Atkinson, Derry, Renkl, and Wortham: Worked examples](https://asu.elsevierpure.com/en/publications/learning-from-examples-instructional-principles-from-the-worked-e/) for stronger early scaffolding followed by matched practice.
- [National Academies: Learning and transfer](https://www.nationalacademies.org/read/9853/chapter/15) for testing application in a different context rather than assuming transfer from the portfolio alone.

These sources do not prescribe four modules, five milestones per module, React with TypeScript and Vite, optional production publication, or the plain-language learner review contract. Those are approved curriculum judgments for this audience and must be validated through learner pilots.
