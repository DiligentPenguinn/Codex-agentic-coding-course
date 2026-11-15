# Curriculum Research Sources

Status: Research record for planning draft 0.1
Last reviewed: 2026-08-14

## Source policy

Curriculum claims should use the most authoritative source appropriate to the question:

1. Official OpenAI documentation for current Codex behavior.
2. Web standards bodies for accessibility and durable web practices.
3. Peer-reviewed research for learning and instructional design claims.
4. Institutional engineering or public-service guidance for planning, testing, and user-needs practices.

Sources do not determine every course-design choice. Exact module boundaries, duration, feature scope, and grading thresholds remain design judgments that must be tested with learners.

## Codex workflow

### OpenAI: Prompting

Source: <https://learn.chatgpt.com/docs/prompting>

Relevant guidance:

- Larger tasks benefit from a clear goal, context, output expectations, boundaries, and final checks.
- Human review remains important for consequential output.

Curriculum influence:

- Module 1 teaches a reusable task structure rather than a collection of magic prompt phrases.
- Learners must state both expected results and verification requirements.

### OpenAI: AGENTS.md

Source: <https://learn.chatgpt.com/docs/agent-configuration/agents-md>

Relevant guidance:

- Codex reads layered project instructions from `AGENTS.md` files.

Curriculum influence:

- Module 1 introduces durable repository instructions and their scope.

### OpenAI: Sandboxing

Source: <https://learn.chatgpt.com/docs/sandboxing>

Relevant guidance:

- Sandboxing provides a technical boundary around what commands can access.
- Approval policy is a separate control over when user authorization is required.

Curriculum influence:

- Permissions and approvals are taught as a decision skill, not as setup trivia.

### OpenAI: Code review

Source: <https://learn.chatgpt.com/docs/code-review>

Relevant guidance:

- Changes should be inspected before they are committed or pushed.
- Diffs provide a focused view of what changed.

Curriculum influence:

- Codex performs the technical inspection before a change is accepted or saved.
- The non-technical learner receives a fixed plain-language summary and verifies observable behavior and test evidence; direct diff reading is optional.

### OpenAI: Build a student website

Source: <https://learn.chatgpt.com/use-cases/build-student-website>

Relevant guidance:

- Scope the first version around content, design, accessibility, and success criteria.
- Test locally and review the result before publication.

Curriculum influence:

- The portfolio begins as a focused first version.
- Publishing is separated from building and requires a review gate.

### OpenAI: Build responsive front-end designs

Source: <https://learn.chatgpt.com/use-cases/frontend-designs>

Relevant guidance:

- Responsive interfaces should be verified in a real browser at multiple sizes.
- Implementation should be compared with the source brief or visual reference and iterated.

Curriculum influence:

- Browser verification is required; a successful code-generation response is not treated as completion.

### OpenAI: Idea to proof of concept

Source: <https://learn.chatgpt.com/use-cases/idea-to-proof-of-concept>

Relevant guidance:

- Move from a rough idea and visual direction to the smallest useful prototype.
- Verify the prototype in a real browser and check each adjustment before continuing.

Curriculum influence:

- Module 3 produces a focused complete first version before optional enhancement work.
- A visible milestone may contain several small implementation-and-verification checkpoints.

### OpenAI: Deploy an app or website

Source: <https://learn.chatgpt.com/use-cases/deploy-app-or-website>

Relevant guidance:

- Run the local build and verify deployment readiness before handoff.
- Preview deployment is the default; production changes should remain explicit.
- Deployment status, missing configuration, and build logs should be inspected rather than treating a URL as proof of completion.

Curriculum influence:

- Module 4 requires a verified deployed preview and keeps production publication as a separate learner-approved decision.

## Web-development and accessibility foundations

### MDN Curriculum

Source: <https://developer.mozilla.org/en-US/curriculum/about-curriculum/>

Relevant guidance:

- Durable foundations include semantic HTML, CSS, JavaScript, accessibility, responsive design, version control, and testing.
- An excessive focus on frameworks can leave gaps in semantics, accessibility, responsive design, and problem-solving.

Curriculum influence:

- React and TypeScript support the project but do not replace foundational web concepts.
- Advanced animations and APIs are deferred until the core experience works.

### W3C Web Accessibility Initiative curricula

Source: <https://www.w3.org/WAI/curricula/foundation-modules/>

Relevant guidance:

- Introductory accessibility education can serve learners with basic computer and web familiarity.
- It should include preliminary evaluation and hands-on checking.
- Duration, examples, activities, and assessment should be adapted to the audience.

Curriculum influence:

- Accessibility is introduced through concrete portfolio checks rather than a theory-only lecture.
- Course pacing and examples must be validated with the complete-beginner audience.

### W3C: Evaluating web accessibility

Source: <https://www.w3.org/WAI/test-evaluate/>

Relevant guidance:

- Accessibility should be evaluated early and throughout development.
- Evaluation tools can help, but determining accessibility still requires human evaluation.
- Beginners can perform useful preliminary checks.

Curriculum influence:

- Semantic structure, keyboard behavior, focus, alternatives, and responsive usability begin during the first-version build rather than being postponed to publication.
- Module 3 combines automated checks with direct browser and keyboard review.

### MDN: Semantic HTML

Source: <https://developer.mozilla.org/en-US/curriculum/core/semantic-html/>

Relevant guidance:

- Semantic elements, headings, and landmarks communicate page structure to browsers and assistive technologies.
- Semantic HTML supports accessibility and other browser features.

Curriculum influence:

- The first portfolio implementation slice establishes a meaningful page structure instead of using visually styled generic containers alone.

### MDN: Testing

Source: <https://developer.mozilla.org/en-US/curriculum/extensions/testing/>

Relevant guidance:

- Testing includes expected visual behavior as well as functionality.
- Results should be recorded, failures fixed, and relevant tests rerun to detect regressions.
- Some usability and accessibility concerns require manual testing.

Curriculum influence:

- Module 3 includes a whole-page review, a bounded revision cycle, and evidence-first debugging with regression checks.
- Passing an automated build is necessary but not sufficient evidence.

## Planning and requirements

### GOV.UK: Learning about users and their needs

Source: <https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs>

Relevant guidance:

- Product work begins by understanding likely users, their goals, current behavior, and frustrations.
- Suggestions unsupported by user evidence should be treated as assumptions.
- User stories should connect to needs and include acceptance criteria and dependencies.

Curriculum influence:

- Module 2 begins with audience evidence rather than visual preferences.
- Requirements remain traceable to user needs and validation checks.

### Microsoft Engineering Playbook: Task design review

Source: <https://microsoft.github.io/code-with-engineering-playbook/design/design-reviews/recipes/templates/template-task-design-review/>

Relevant guidance:

- A reviewable task design records the problem, goals, in-scope work, acceptance criteria, non-goals, options, technical choices, and open questions.

Curriculum influence:

- The beginner PRD and implementation plan explicitly record scope, non-goals, acceptance criteria, and unresolved decisions.

### Microsoft Engineering Playbook: Test planning

Source: <https://microsoft.github.io/code-with-engineering-playbook/automated-testing/test-planning/>

Relevant guidance:

- Tests should be derived from acceptance criteria.
- Test planning can expose ambiguity before implementation.

Curriculum influence:

- Module 2 creates a validation plan before building.
- Module 4 traces test evidence back to the PRD.

### Google Engineering Practices: Small changes

Source: <https://google.github.io/eng-practices/review/developer/small-cls.html>

Relevant guidance:

- Small, self-contained changes are easier to review, reason about, polish, and recover than large changes.
- A change should address one self-contained concern.

Curriculum influence:

- Module 3 can describe a complete first version as one learner-facing milestone, but Codex must build it through several small, approved, verified slices.
- Codex summarizes each slice in plain language, and the learner verifies its visible result and evidence rather than accepting one large unexplained change.

### GitHub Education: Introduction to GitHub

Source: <https://education.github.com/experiences/intro_to_github>

Relevant guidance:

- Branches, commits, and pull requests can be introduced in a bounded beginner exercise without prior prerequisites.

Curriculum influence:

- Git is introduced as a recoverable project-checkpoint mechanism, not as an extensive prerequisite module.
- Branch, staging, diff, and pull-request mechanics remain optional enrichment for this non-technical audience.

### GitHub: Reviewing your proposed changes

Source: <https://docs.github.com/en/get-started/start-your-journey/reviewing-your-proposed-changes>

Relevant guidance:

- Review the pull-request diff before merging to find bugs, missing error handling, accessibility problems, and unclear changes.
- The author remains responsible for deciding which AI review suggestions improve the work.

Curriculum influence:

- Module 4 asks Codex to inspect the complete release-candidate diff and translate the findings into the approved plain-language summary.
- The learner retains ownership by comparing that summary, the website, and the test evidence with the acceptance criteria before accepting or revising.

### GitHub: Repository visibility and sensitive data

Sources:

- <https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories>
- <https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/removing-sensitive-data-from-a-repository>

Relevant guidance:

- Public repositories are accessible to everyone on the internet.
- Sensitive data can persist in clones, forks, cached views, or repository history even after cleanup attempts.
- Staged changes should be reviewed explicitly, and credentials should not be hardcoded.

Curriculum influence:

- Codex checks repository visibility, secrets, project permissions, and publication rights before an unprotected preview or production publication and reports the result in plain language.

## Deployment and publication

### Vercel: Deployment environments and generated URLs

Sources:

- <https://vercel.com/docs/deployments/environments>
- <https://vercel.com/docs/deployments/generated-urls>
- <https://vercel.com/docs/deployments/promote-preview-to-production>

Relevant guidance:

- Local, Preview, and Production are separate environments.
- Preview supports testing and collaboration without changing the production site.
- Generated preview URLs are public by default unless deployment protection is configured.
- A preview should be inspected and tested before production promotion; production should be verified afterward and can require rollback.

Curriculum influence:

- A protected or deliberately public verified preview satisfies the deployment requirement.
- Production publication is a separate, explicit learner decision with post-publication verification and recovery evidence.

Limitation:

- These sources validate the workflow but do not establish Vercel as the required course hosting provider.

## Learning and instructional design

### University of Rochester: Backward design

Source: <https://www.rochester.edu/college/teaching/teaching-online/backward-design.html>

Relevant guidance:

- Begin with learning outcomes, decide what evidence demonstrates those outcomes, and then design learning activities and feedback.

Curriculum influence:

- Every module is defined by an observable outcome and evidence gate before lessons are finalized.

### Atkinson, Derry, Renkl, and Wortham: Worked examples

Source: <https://asu.elsevierpure.com/en/publications/learning-from-examples-instructional-principles-from-the-worked-e/>

Publication: *Review of Educational Research*, 70(2), 181-214, 2000. DOI: 10.3102/00346543070002181

Relevant findings:

- Worked examples are especially relevant to early skill development.
- Examples should be close to matched practice and should encourage learner self-explanation.

Curriculum influence:

- Module 3 moves from a complete worked example to guided completion and then independent work.

### Roediger and Karpicke: Test-enhanced learning

Source: <https://www.psychologicalscience.org/journals/psychological-science/j.1467-9280.2006.01693.x/>

Publication: *Psychological Science*, 17(3), 249-255, 2006.

Relevant finding:

- Retrieval practice improves delayed retention compared with repeated study alone.

Curriculum influence:

- Important concepts reappear in short retrieval questions after a delay rather than being assessed only immediately after instruction.

### Project-based learning meta-analysis

Source: <https://pubmed.ncbi.nlm.nih.gov/37564309/>

Publication: 2023 meta-analysis covering 66 studies and 190 effect sizes.

Relevant finding:

- Project-based learning showed positive effects across academic achievement, attitudes, and thinking skills, with results moderated by implementation choices.

Curriculum influence and limitation:

- A real portfolio is an appropriate integrating project.
- The evidence does not justify leaving complete beginners to complete an unguided project; the course retains worked examples, checkpoints, and feedback.

### National Academies: Learning and transfer

Sources:

- <https://www.nationalacademies.org/read/9853/chapter/15>
- <https://www.nationalacademies.org/read/10019/chapter/6>

Relevant guidance:

- Transfer means applying learning in a new context and should not be assumed from performance in the original learning context.
- Transfer is more likely when learners understand underlying principles and the conditions in which they apply.

Curriculum influence:

- Graduation includes a different small project brief and implementation plan, not only a polished portfolio walkthrough.
- The learner must explain why the lifecycle applies to the new project rather than repeat portfolio-specific steps mechanically.

## Design judgments still requiring validation

The sources above do not directly establish:

- that four modules are optimal;
- that a particular course duration is sufficient;
- that React, TypeScript, and Vite are the best starter stack for every learner;
- that three case studies are the correct portfolio requirement;
- which grading threshold predicts independent transfer;
- which hosting provider should be used.

These choices must remain explicit hypotheses until approved and tested with representative learners.

## Module 3 source-audit conclusion

The evidence supports this workflow: establish a verified baseline, use the approved content and visual direction to build a focused first version, implement it through small reviewable changes, inspect it in a real browser, revise it from human evidence, debug failures systematically, and only then add an enhancement.

The sources do **not** prescribe five milestones. Grouping that workflow into five learner-facing milestones is a design judgment intended to keep the course coherent for complete beginners while retaining the engineering safeguards inside each milestone. It should be validated through learner pilots and revised if learners cannot explain, review, or recover the implementation slices.

## Module 4 source-audit conclusion

The evidence supports a release sequence that traces validation to requirements, has Codex inspect the complete technical change set, communicates the result in plain language, checks privacy and sensitive data, verifies a deployed preview, keeps production explicit, and assesses transfer in a different context.

The sources do **not** prescribe five milestones, protected-preview equivalence, or optional production publication. Those are approved curriculum judgments that separate demonstrated deployment capability from involuntary public exposure. Learner pilots should test whether graduates can interpret deployment evidence, make a deliberate publication decision, and begin a second project with materially less guidance.

## Non-technical review adaptation

OpenAI and GitHub sources establish that code changes should be technically inspected before they are committed, merged, or published. They do not establish that a complete beginner must personally interpret source code or a line-level diff.

For this audience, the course delegates technical inspection to Codex and requires a five-part plain-language summary, direct browser verification, test evidence, and an explicit learner accept-or-revise decision. This is an audience-specific curriculum judgment, supported by the course's non-technical entry contract and the worked-example principle of providing stronger scaffolding during early skill development. It must be tested in learner pilots to ensure that summaries remain understandable without becoming vague assurances.
