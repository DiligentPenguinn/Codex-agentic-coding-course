# Module 1 Practice Mode Guidance Design

**Date:** 17 August 2026
**Status:** Approved design, awaiting written-spec review
**Scope:** An automatically triggered, learner-controlled first-run guide for the Module 1 Practice Mode experience

## Problem

Module 1 currently teaches a useful but mechanically small skill: configure the dedicated Codex Executor task with the recommended model, reasoning effort, service tier, approval policy, and sandbox setting. Course Companion can observe and review those five values directly, so the exercise is intentionally short.

This first Practice is also the learner's first encounter with a workflow reused by later modules:

1. receive a Practice objective in the Course App;
2. work in a dedicated Executor task in Codex;
3. ask Triết for help or inspect evidence in Course Companion;
4. request a review; and
5. return to the configured course destination after passing.

The current lesson explains the configuration target but does not deliberately teach this Practice Mode loop. Learners can finish Module 1 without forming a clear mental model of the relationship between the Course App, Executor, Triết, the Progress tab, evidence review, and the return control. Module 2 then asks them to use the same mechanics for a substantially larger planning exercise.

## Decision

Module 1 will automatically start a staged first-run guide after its Practice workspace is ready. The guide will introduce Practice Mode in context, using the real Module 1 workflow and controls. It will not add assessment criteria or change the configuration exercise's completion rules.

"Automatically start" means that introductory guidance appears without the learner searching for help. It does not mean timed playback or automatic progression. The learner controls the pace, can skip the entire guide, and can replay it later.

## Goals

- Give the learner a usable mental model of Practice Mode before Module 2.
- Explain the distinct roles of the Course App, Executor, and Triết.
- Teach where to ask for help, inspect evidence, request review, and return to the course.
- Present each explanation when its corresponding UI and Practice state are available.
- Preserve learner agency, keyboard access, reduced-motion preferences, and an immediate escape path.
- Keep guidance state strictly separate from Practice evidence, review state, checklist completion, and course progress.
- Reuse a small versioned guide mechanism rather than hardcoding a sequence into the Module 1 renderer.

## Non-goals

- Lengthening the graded Module 1 configuration exercise.
- Requiring the learner to open a tab, ask Triết a question, or complete a tour step to pass Practice.
- Changing Module 1 configuration criteria or metadata evidence collection.
- Redesigning the existing Practice brief, Teacher workspace, Progress panel, review service, completion receipt, or course-return contract.
- Automatically clicking controls, editing Codex settings, submitting an Executor prompt, requesting review, or returning to the course.
- Displaying the guide in Module 2 in this iteration.
- Adding remote analytics or collecting new learner content.
- Building a general visual tour authoring product.

## Research basis

The design synthesizes guidance from mature product systems and HCI research:

- Apple recommends fast, optional onboarding; interactive learning; and context-specific tips near the interface they explain.
- Adobe Spectrum coach marks use concise copy, consistent actions, step indicators, a persistent skip path, and action-dependent advancement without asking learners to confirm actions the product can observe.
- Atlassian uses spotlights for focused feature discovery and multi-step tours.
- IBM Carbon distinguishes first-time introduction, just-in-time guidance, guided paths, progress tracking, and always-available assistance.
- Salesforce recommends a single prompt for one feature and a walkthrough for related multi-step procedures, with hands-on use as the differentiator.
- Slack recommends guiding users to a first useful action quickly, making deeper learning optional, showing clear progress and next steps, and keeping help available after onboarding.
- SAP Fiori separates context help for a current screen from guided tours for an end-to-end process.
- Autodesk's CHI research reports that trial and error remains a preferred way to learn complex software and argues for making exploration trackable and safe.
- WAI-ARIA and WCAG require predictable focus, keyboard operation, dismissal, visible focused controls, and overlays that do not obscure the active target.

These sources favor a staged, contextual guide over an up-front slideshow that asks learners to memorize controls before using them.

### References

- [Apple Human Interface Guidelines: Onboarding](https://developer.apple.com/design/human-interface-guidelines/onboarding)
- [Apple Human Interface Guidelines: Offering help](https://developer.apple.com/design/human-interface-guidelines/offering-help)
- [Adobe Spectrum: Coach mark](https://spectrum.adobe.com/page/coach-mark/)
- [Atlassian Design System: Spotlight](https://atlassian.design/components/spotlight/)
- [IBM Carbon: Tools for designing onboarding experiences](https://preview.carbondesignsystem.com/articles/tools-for-designing-onboarding-experiences)
- [Salesforce Trailhead: Improve User Engagement with In-App Prompts](https://trailhead.salesforce.com/content/learn/modules/user-engagement/promote-feature-adoption-and-discovery)
- [Slack: Onboarding users to your app](https://api.slack.com/start/designing/onboarding)
- [SAP Fiori: SAP Companion](https://experience.sap.com/fiori-design-web/web-assistant/)
- [Autodesk Research: Supercharging Trial-and-Error for Learning Complex Software Applications](https://www.research.autodesk.com/publications/supercharging-trial-and-error-for-learning-complex-software-applications/)
- [WAI-ARIA Authoring Practices: Dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/)
- [WCAG 2.2: Focus Not Obscured](https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum)
- [USWDS: Tooltip accessibility tests](https://designsystem.digital.gov/components/tooltip/accessibility-tests/)

## Experience architecture

The guide has three presentation forms, each matched to its job:

1. **Introductory dialog:** a small modal shown automatically once the Module 1 Practice workspace and full Teacher surface are stable. It explains why the guide exists and offers `Bắt đầu hướng dẫn` and `Bỏ qua`.
2. **Contextual coach marks:** non-modal, anchored messages that introduce a visible control or evidence region. They do not dim the entire interface or block the highlighted target.
3. **Completion confirmation:** a short message in the Module 1 mastery scene that names the reusable Practice loop the learner just completed.

The introductory dialog is the only automatically opened modal. After the learner chooses to begin, guide stages become eligible from real Practice state and visible UI. There is no timer and no synthetic playback.

## Learner flow

### Stage 1: Practice Mode introduction

**Eligibility:** Module 1 Practice has an active run, its full-screen Teacher workspace is mounted, and no higher-priority dialog or transition is active.

**Presentation:** introductory dialog.

**Learner-facing copy:**

> **Làm quen với Practice Mode**
>
> Practice Mode kết nối ba phần: bài học giao mục tiêu, Executor thực hiện công việc trong Codex, còn Triết theo dõi tiến độ và duyệt bằng chứng.

**Actions:** `Bắt đầu hướng dẫn` and `Bỏ qua`.

### Stage 2: Dedicated Executor task

**Eligibility:** the learner started the guide and the bound Module 1 Executor task exists.

**Presentation:** an orientation coach mark within the Teacher workspace. It is not anchored to the external Codex application because Course Companion cannot reliably position an overlay over another application's UI.

**Learner-facing copy:**

> **Executor là nơi bạn thực hành**
>
> Course Companion đã tạo và liên kết một task Codex riêng cho bài này. Bạn đổi cấu hình trong task đó; ứng dụng chỉ quan sát đúng task đã liên kết và không tự gửi prompt thay bạn.

**Action:** `Tiếp`.

### Stage 3: Ask Triết

**Eligibility:** the full Teacher workspace and `Hỏi Triết` tab are available.

**Presentation:** coach mark anchored to the `Hỏi Triết` tab.

**Learner-facing copy:**

> **Hỏi Triết khi cần làm rõ**
>
> Triết biết bài Practice và hoạt động gần nhất của Executor. Bạn có thể hỏi về yêu cầu, lỗi đang gặp hoặc bước nên làm tiếp theo.

**Advancement:** selecting the real `Hỏi Triết` tab advances the guide. If it is already selected, the coach mark provides `Tiếp` so the learner is not forced to toggle away and back.

### Stage 4: Inspect Progress

**Eligibility:** the `Tiến độ` tab is available.

**Presentation:** coach mark anchored to the `Tiến độ` tab.

**Learner-facing copy:**

> **Xem bằng chứng trong Tiến độ**
>
> Mở Tiến độ để xem Course Companion đã quan sát được gì, bước nào đã khớp và điều gì còn cần sửa.

**Advancement:** selecting the real `Tiến độ` tab advances the guide. The guide does not mark any Practice checklist item complete.

### Stage 5: Live configuration evidence

**Eligibility:** the Module 1 configuration evidence panel is rendered. The panel may show waiting, mismatched, stale, disconnected, or matching values; fresh success is not required to teach what the panel means.

**Presentation:** coach mark anchored to the configuration evidence panel.

**Learner-facing copy:**

> **Bằng chứng cập nhật từ đúng task**
>
> Course Companion đọc năm thiết lập hiệu lực của Executor task đang liên kết. Các dòng ở đây thay đổi khi cấu hình trong Codex thay đổi; bạn không cần chụp màn hình hay tự báo cáo kết quả.

**Action:** `Tiếp`.

### Stage 6: Request review

**Eligibility:** the review control is available and no review request is busy.

**Presentation:** coach mark anchored to the existing review control.

**Learner-facing copy:**

> **Nhờ Triết duyệt bằng chứng**
>
> Khi đã sẵn sàng, dùng nút này để yêu cầu duyệt. Nếu chưa đạt, Practice vẫn được giữ nguyên và Triết sẽ chỉ ra thiết lập cần sửa.

**Advancement:** invoking the real review control completes this guide stage. The guide never invokes review itself. Skipping or pausing the guide leaves the review control fully usable.

### Stage 7: Return to the course

**Eligibility:** the persisted review result is `passed` and the existing return-to-course control is available.

**Presentation:** coach mark anchored to the return control.

**Learner-facing copy:**

> **Quay lại đúng phần tiếp theo**
>
> Practice đã đạt. Dùng nút này để lưu kết quả và quay lại phần tổng kết của Module 1.

**Advancement:** invoking the real return control completes the active guide. The guide never returns to the course automatically.

### Stage 8: Practice loop confirmation

**Eligibility:** the course has accepted the Module 1 completion receipt and is showing the existing `module-1-mastery` destination.

**Presentation:** concise, dismissible confirmation integrated with the mastery scene rather than another blocking modal.

**Learner-facing copy:**

> Bạn vừa hoàn thành toàn bộ vòng Practice: nhận nhiệm vụ → làm trong Executor → xem bằng chứng → nhờ Triết duyệt → quay lại bài học. Module 2 sẽ dùng lại vòng này cho một nhiệm vụ lớn hơn.

The confirmation is informational and does not delay the existing Module 1 completion action.

## Guide definition

Guide content and progression rules will be declared in a versioned definition separate from the graded Practice definition. The definition will be stored at `course-companion/content/practice-guides/m1-practice-mode-first-run.json`.

The definition contains:

- a stable guide ID and version;
- the eligible Practice ID and version range;
- replay policy;
- ordered stage IDs;
- stage presentation type;
- anchor identity, when applicable;
- eligibility event or workspace predicate;
- localized title and body copy;
- primary and secondary action labels; and
- advancement mode: explicit continue, observed UI action, review action, or course return.

The guide definition must not contain selectors coupled to generated CSS class names. Renderer components expose stable semantic anchor IDs through a small guide-anchor registry. Unknown guide IDs, stage types, advancement modes, or duplicate stage IDs fail validation before presentation.

## Components and boundaries

### Practice guide definition repository

Loads and validates immutable guide content. It knows nothing about React, Electron windows, Practice review evaluation, or course persistence.

### Practice guide state repository

Persists only presentation progress:

- guide ID and version;
- course run identity;
- Practice ID and Practice run identity;
- status: `not-started`, `in-progress`, `paused`, `skipped`, or `completed`;
- last reached stage ID; and
- updated timestamp.

It cannot mutate Practice checklists, evidence, review results, completion receipts, or learner assessment state.

### Practice guide coordinator

Combines the validated guide definition, persisted guide state, active Practice workspace, course destination, and visible renderer capabilities to derive one of four outputs:

- no guide presentation;
- introductory dialog;
- contextual coach mark for a specific anchor; or
- mastery confirmation.

All stage transitions pass through this coordinator. Renderer components report semantic UI events, such as `teacher-tab-selected`, `progress-tab-selected`, `review-requested`, and `course-return-requested`; they do not decide guide completion themselves.

### Guide presentation layer

Renders the dialog, coach marks, progress label, skip action, and completion confirmation in the existing pixel-art visual system. It consumes a derived view model and emits semantic guide actions. It cannot call Practice lifecycle or review APIs.

### Guide anchor registry

Maps stable semantic anchor IDs to mounted elements. Initial anchors are:

- `teacher-tab`;
- `progress-tab`;
- `configuration-evidence`;
- `review-progress`; and
- `return-to-course`.

The registry keeps positioning concerns out of the guide definition and permits component internals to change without rewriting guide state logic.

## Data flow

1. Module 1 starts `m1-codex-safe-setup` through the existing Practice flow.
2. The Practice coordinator creates or resumes the bound Executor task and projects the existing `PracticeWorkspaceView`.
3. The guide coordinator receives Practice workspace state, guide state, course progress, and available semantic anchors.
4. It selects the earliest eligible, unfinished stage and emits a guide view model.
5. The renderer presents the dialog or coach mark without mutating Practice.
6. A learner action or existing lifecycle event is reported to the guide coordinator.
7. The guide state repository atomically persists the new presentation state.
8. Existing Practice, review, and course-return services continue independently.

Guide events may observe lifecycle actions, but they never become prerequisites for those actions. If guide persistence fails, Practice must remain fully usable.

## Trigger, pause, skip, resume, and replay

- The introduction auto-triggers only for Module 1's `m1-codex-safe-setup` Practice.
- It auto-triggers once per course run. A guide content-version change does not replay an already completed or skipped guide within that course run.
- `Bỏ qua hướng dẫn` marks the whole guide skipped. It never appears automatically again in that course run.
- Closing a contextual coach mark or pressing Escape pauses the guide at its current stage. It does not mark the whole guide skipped.
- A paused guide resumes when the next eligible full Teacher surface is stable.
- Minimizing to the compact Teacher bubble pauses anchored guidance. Coach marks are not squeezed into the compact viewport.
- Switching away from the Module 1 Practice pauses the guide. Resuming the same Practice resumes the guide from current persisted state.
- Relaunching Course Companion recovers the earliest unfinished eligible stage rather than restarting the sequence.
- `Xem lại hướng dẫn Practice` is available from the existing Teacher/help surface. Replay creates an in-memory presentation session beginning at Stage 1 while leaving the durable completed or skipped record, Practice state, and course state unchanged. An interrupted replay does not resume after relaunch.

## Presentation and interaction rules

- Show a visible step indicator for the active guided sequence, consistently formatted across every coach mark.
- Use concise sentence-case titles and no more than two short body sentences per coach mark.
- Use `Tiếp` for informational stages and a single final `Hoàn tất` label where an explicit final action is needed.
- Keep `Bỏ qua hướng dẫn` visually secondary but available throughout the sequence until completion.
- Never use a countdown, automatic dismissal, or timed advancement.
- Do not dim or disable the target of an action-dependent coach mark.
- Do not display multiple coach marks, Teacher dialogs, switch dialogs, or review overlays simultaneously. Higher-priority product dialogs defer guide presentation.
- Use only opacity and transform for motion. Honor reduced-motion preferences with immediate state changes.
- Preserve the current retro pixel-art language without making the guide look like a warning, error, or graded checklist.

## Accessibility

### Introductory dialog

- Use an accessible modal dialog with a visible title and programmatic label.
- Move focus into the dialog when it opens and keep focus within it until the learner starts or pauses the guide.
- Escape closes the dialog and records the guide as paused, not skipped.
- Return focus to the logical Practice control or Teacher heading after close.

### Contextual coach marks

- Use a non-modal dialog or popover with a programmatic name and description.
- Announce newly eligible guidance without repeatedly interrupting screen-reader output during live configuration updates.
- Keep the anchor and its visible focus indicator unobscured.
- Maintain logical keyboard order between the coach mark actions and the target.
- Provide keyboard access to every target-dependent advancement action.
- Escape pauses the current guide presentation.
- Keep text readable and controls operable at 200% zoom and in the supported minimum full-Teacher viewport.
- Do not communicate target, state, progress, or completion through color alone.

## Failure and recovery

- **Definition invalid:** do not start guidance; log a bounded diagnostic and leave Practice fully operational.
- **Expected anchor not mounted:** defer the stage. If its surface is visible but the anchor remains unavailable, show the same content as a non-anchored card and allow the learner to continue or skip.
- **External Codex window unavailable:** preserve the existing Practice error path. The guide does not hide, replace, or reinterpret the failure.
- **Guide persistence failure:** keep Practice usable, show a non-blocking guidance warning, and hold guide progress in memory for the session.
- **Practice persistence or review failure:** preserve guide state and expose the existing Practice recovery behavior.
- **Review passes before earlier guide stages finish:** reconcile forward and show the return-control stage; do not force the learner backward through stale tips.
- **Course return occurs while guidance is paused or skipped:** accept the normal completion receipt and never block course advancement.
- **Active Practice is replaced:** pause the old guide. A late event carrying the replaced run identity cannot advance the guide.
- **Duplicate UI or lifecycle event:** make stage transitions idempotent.

## Privacy and security

- Persist only guide identity, presentation status, stage identity, run provenance, and timestamps.
- Do not store Teacher messages, Executor transcripts, configuration values, or artifact content in guide state.
- Do not send new telemetry or remote analytics in this scope.
- Treat definition copy as untrusted bounded content: validate lengths and known enum values before renderer delivery.
- Guide actions cannot obtain tools, bypass approvals, submit Executor turns, or mutate Codex settings.

## Testing strategy

### Definition and state tests

- Accept the canonical Module 1 guide definition.
- Reject duplicate stages, unknown presentation or advancement modes, missing localized copy, unsupported Practice identity, and unknown anchor IDs.
- Prove start, pause, resume, skip, complete, replay, relaunch, duplicate-event, and replaced-run transitions.
- Prove guide state serialization and recovery cannot be mistaken for Practice or course progress.

### Coordinator tests

- Derive Stage 1 only after the full Teacher workspace is stable.
- Defer stages behind Practice switch, transition, review, and error dialogs.
- Advance action-dependent stages only from the matching active run and semantic UI event.
- Reconcile directly to the return stage after an early pass.
- Never emit Module 1 guidance for Module 2.
- Never call a Practice, review, Executor, or course-return mutation API.

### Renderer and accessibility tests

- Verify modal focus containment and focus restoration.
- Verify non-modal coach-mark keyboard order, Escape pause, visible skip action, and unobscured targets.
- Verify semantic labels and screen-reader announcements.
- Verify 200% zoom, minimum supported full-screen viewport, high contrast, and reduced motion.
- Verify anchored fallback cards when a target is unavailable.
- Verify no guide appears in the compact Teacher bubble.

### End-to-end tests

- Complete a clean Module 1 run with every guide stage.
- Skip at the introduction and complete Practice normally.
- Pause midway, minimize or restart, resume, and complete normally.
- Observe mismatched configuration evidence without prematurely completing the evidence stage or Practice.
- Request a needs-work review, correct settings, request another review, pass, and return.
- Pass quickly with earlier tips unfinished and confirm forward reconciliation.
- Switch Practices and reject late events from the replaced run.
- Replay the guide without resetting Practice or course progress.
- Start Module 2 and confirm no automatic guide appears.

### Visual QA

Capture and inspect at least:

- introductory dialog;
- Executor orientation;
- Teacher-tab coach mark;
- Progress-tab coach mark;
- configuration evidence in waiting, mismatch, and fresh states;
- review-control coach mark;
- return-control coach mark;
- mastery confirmation;
- missing-anchor fallback;
- reduced-motion state; and
- 200% zoom at the minimum supported full-Teacher viewport.

## Acceptance criteria

1. Starting the Module 1 Practice automatically offers the guide after the full Teacher workspace is stable.
2. The learner can start, pause, skip, resume, and replay guidance without affecting Practice completion.
3. Guidance explains the Course App, Executor, Triết, Progress, evidence review, and course-return loop at contextually relevant moments.
4. The guide never submits an Executor prompt, changes a Codex setting, requests review, or returns to the course on the learner's behalf.
5. Module 1 still passes only from the five existing fresh configuration criteria and the existing review service.
6. Guide state is versioned, persisted, run-scoped, idempotent, and isolated from Practice and course progress.
7. Missing guide state, invalid guide content, an unavailable anchor, or guide persistence failure cannot block Practice.
8. The guide meets the documented keyboard, focus, screen-reader, zoom, contrast, and reduced-motion behavior.
9. The guide auto-triggers only for Module 1 in this iteration.
10. Module 1 mastery names the reusable Practice loop before the learner proceeds to Module 2.

## Explicitly deferred

- Automatic guidance for Module 2 or later modules.
- Learner-personalized guide branches based on expertise.
- Guide analytics, completion dashboards, or remote experimentation.
- Video, narration, voice guidance, or animated cursor demonstrations.
- Overlays positioned inside the external Codex application.
- A no-code guide editor or arbitrary author-defined CSS selectors.
- Making guide interactions part of assessment or mastery evidence.
