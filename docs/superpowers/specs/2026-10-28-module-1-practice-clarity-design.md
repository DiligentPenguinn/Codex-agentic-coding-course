# Module 1 Practice: a clear introduction for beginners

Date: 28 October 2026

Status: The owner approved this direction, then explicitly requested immediate
implementation without further approval questions. The owner subsequently
extended the scope to the other modules, clarified the post-review hierarchy
with a screenshot, and requested a visual success celebration.

## Approved scope extensions

Use the same compact introduction in the current Module 2–4 Practices: one
learning goal, three instructions, one primary start/resume action and a native
disclosure for the five planning documents, three build records or single
deployment record. Preserve each module's exact task, evidence and completion
requirements. Existing theory and assessment pages remain outside this change.

After review in the compact panel, show the next action first, then a subdued
progress count, then expandable checklist/history. Remove the duplicate current
step line and move routine review history inside the disclosure; first-review
metadata does not need a visible announcement. Keep failed criteria actionable
and return the progress scroll position to the top after a successful refresh.

When the current review is passed and returning is permitted, show a gold
completion card with a check medallion, decorative stars, “Làm tốt lắm!”, a
module-specific outcome and one main save/return button. Do not celebrate a
checklist or an unreturnable stale result as passed. Use finite, local animation
and honor reduced motion. Keep full review evidence and all checklist items
available in disclosures. The upper refresh button becomes secondary after a
pass; all existing review/return and guide controls remain available.

These later owner instructions supersede Module 1-only statements below where
they concern Practice presentation. They do not authorize curriculum, courseapp
host integration, settings, assessment, evidence or persistence changes.

## Problem and outcome

The current Module 1 Practice introduction uses a long technical sentence as a
large heading. Below it, an empty configuration panel and five pending checklist
cards repeat the same settings. Before starting, a beginner sees unverifiable
values without a clear explanation of what they will learn or do next.

The revised page must let a beginner identify the learning goal, the three-part
workflow and the start action without reading runtime metadata.

## Chosen approach and scope

Use one compact introduction with an expandable settings reference. A multi-page
wizard would add navigation and state for this short exercise. A spacing-only
change would leave the technical language and duplication unresolved.

This change belongs to the Module 1 Practice interface. Keep the existing
black-and-gold rounded theme, page, close action, start/resume/retry behavior,
bound-task identity, five required values, review rules and completion route.
Keep all theory pages, assessments, other Practices and their copy unchanged.
Do not reset learner data or change Codex settings during implementation or QA.

## Introduction and exact copy

Inside the existing primary content surface, use:

- Heading: **Làm quen với cài đặt Codex**
- Purpose: **Bạn sẽ thực hành chọn cách Codex làm việc và kiểm tra các quyền
  được cấp cho task.**
- Task clarification: **Task là cuộc trò chuyện với Codex dành riêng cho bài
  thực hành này.**
- Three ordered instructions:
  1. **Mở task thực hành trong Codex.**
  2. **Kiểm tra năm cài đặt theo hướng dẫn bên dưới.**
  3. **Nhờ Triết kiểm tra kết quả. Nếu cần sửa, bạn tiếp tục trong cùng task.**
- Initial primary button: **Bắt đầu thực hành**
- Settings disclosure: **Xem năm cài đặt cần kiểm tra**

Keep the current resume and busy/error copy and behavior. When a resumable task
exists, give continuing that task visual priority; starting a new attempt stays
available with its existing confirmation and history preservation.

The settings disclosure lists each required value once, with a short explanation:

| Setting | Required value | Explanation |
|---|---|---|
| Model | 5.6 Sol | Mô hình AI được dùng trong task. |
| Effort | High | Mức độ suy luận của Codex khi xử lý yêu cầu. |
| Speed | Standard | Chế độ tốc độ xử lý của task. |
| Approval | Approve for me | Cách Codex xử lý yêu cầu phê duyệt hành động. |
| Full access | Tắt | Giữ chế độ toàn quyền ở trạng thái tắt. |

These are explanations of the existing exercise, not permission to change the
required model, permission settings or assessment standard. Use a restrained
heading size and readable body text; avoid a second hero, badge row or card for
every sentence. Keep the start action visible with the short introduction at the
observed desktop size. Use a single column at narrow widths.

## Before and after starting

Before the requested Module 1 task exists, show the introduction and collapsed
reference. Do not render detected-value errors, pending progress cards or a
completion destination as if work were already under review. Existing unrelated
active-Practice switching and transition/error states must remain available.

After the requested task exists, retain meaningful progress, actionable review
feedback and the reviewed return action. Keep fresh mismatches and connection
failures understandable and visible. Secondary raw configuration values,
timestamps and metadata explanations belong inside an accessible disclosure.
Do not repeat the generic objective and the full settings reference above the
same active checklist.

Retain every checklist item and its real status. Do not imply that inherited
settings prove the learner changed them. Keep the existing guide anchor
`configuration-evidence` targetable when its details are collapsed, and preserve
guide pause/resume/replay. The separate Teacher panel keeps its existing task,
review and hint controls.

## Implementation boundaries

Use the existing PracticeBrief loading and action handlers, with a Module 1-only
presentation branch. Keep presentation-only copy local to the approved Practice
surface instead of rewriting lesson sources or runtime evidence definitions.
If needed, extract a small pure introduction/reference component for clarity and
render verification. Scope styles to the new Module 1 presentation.

Any PracticeProgress adjustment must be restricted to Module 1 and preserve the
current compact mode, guide anchors and all Module 2–4 rendering. Do not add IPC,
dependencies, persisted presentation state or a new Practice version.

The runtime Module 1 definition currently differs from the Pilot lesson file.
Reconciliation of that older contract difference is outside this presentation
change; do not silently revive screenshot/report requirements or change gates.

## Verification and acceptance

Use focused renderer checks for the initial brief, current-task/resume state,
missing/stale metadata, a fresh mismatch and passed review. Verify that the
initial brief does not present empty telemetry as a failure and that active
review blockers remain available. Exercise native disclosure keyboard behavior
and the existing Practice guide in disposable data.

After the coherent batch, run the repository-required typecheck, lint, unit and
startup tests, build and full Electron smoke/chat/guide suite. Inspect desktop
and narrow layouts, checking horizontal overflow, clipping, action visibility
and the settings disclosure. Use disposable learner state and simulated AI only
for deterministic tests, clearly distinguished from live acceptance.

Review the scoped diff and preserve every existing page and route. Synchronize
the Foundation progress ledger with the implementation and actual verification
results. Owner visual acceptance and live learner acceptance remain separate
from automated checks.

## Self-review

The design is limited to the approved Practice page and Module 1-specific
progress disclosure. It defines the initial, active, unavailable and passed
states without changing completion rules. There are no unresolved product
choices, new services or migrations. The owner's immediate-implementation
instruction and subsequent scope extensions are recorded above.
