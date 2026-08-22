---
goal: Xoá slide chuyển tiếp Practice bị trùng trong Module 3
version: 1.0
date_created: 2026-08-21
last_updated: 2026-08-21
owner: Course owner
status: In progress
tags:
  - refactor
  - curriculum
  - module-3
  - practice
---

# Introduction

![Status: In progress](https://img.shields.io/badge/status-In%20progress-yellow)

Plan này xoá đúng một slide hướng dẫn cách làm Practice của Module 3,
`module-3-practice-intro`, rồi nối slide kiến thức cuối cùng về branch trực tiếp
đến trang Practice thật. Mục tiêu là để Course Companion dạy kiến thức, còn
Practice/Executor hướng dẫn và điều phối việc xây portfolio.

Plan không xoá kiến thức về thực hiện implementation plan, debugging, Git,
GitHub, commit, push hoặc branch; không xoá trang Practice thật; và không thay
đổi bài tổng kết cuối Module 3.

## 1. Requirements & Constraints

- **REQ-001**: Xoá duy nhất scene `module-3-practice-intro` khỏi đồ thị scene,
  nội dung renderer và danh mục trang của Module 3.
- **REQ-002**: Đổi đích tiếp theo của `module-3-git-branch` thành
  `module-3-portfolio-practice` trong cả định nghĩa dùng chung và choice của
  renderer.
- **REQ-003**: Giữ nguyên toàn bộ 11 scene kiến thức đứng trước Practice:
  `module-3-readiness`, `module-3-debugging-intro`, `module-3-visible-error`,
  `module-3-visible-error-prompt`, `module-3-terminal-logs`,
  `module-3-repeated-error`, `module-3-git-intro`, `module-3-git-github`,
  `module-3-git-commit`, `module-3-git-push` và `module-3-git-branch`.
- **REQ-004**: Giữ nguyên scene `module-3-portfolio-practice`, checkpoint
  `m3-portfolio-build`, lesson `m3-evidence-debugging`, năm câu hỏi mastery,
  scene tổng kết và scene hoàn thành Module 3.
- **REQ-005**: Chuyển saved progress đang trỏ tới
  `module-3-practice-intro` sang `module-3-portfolio-practice`; chuyển hai scene
  cũ `module-3-enhancement-intro` và
  `module-3-check-enhancement-boundary` thẳng tới cùng đích; loại các scene đã
  nghỉ khỏi `sceneHistory`.
- **REQ-006**: Giữ các hướng dẫn vận hành Practice trong
  `pilot-workspace/course/lessons/module-3.vi.md`,
  `pilot-workspace/course/lesson-scripts/module-3.script.vi.md` và
  `pilot-workspace/course/prompts/start-module-3.vi.md` để Practice/Executor có
  nguồn điều phối; không render chúng thành một slide setup riêng.
- **SEC-001**: Migration chỉ được thay đổi các ID scene Module 3 đã nêu trong
  REQ-005; không thay đổi receipt, bằng chứng, checkpoint hoàn thành hoặc trạng
  thái mở khoá của người học.
- **CON-001**: Không thay đổi runtime Practice/Executor, giao thức Teacher ↔
  Executor, artifact contract hoặc completion service trong phạm vi này.
- **CON-002**: Không xoá quiz group `m3-final-assessment` hoặc bất kỳ câu hỏi
  mastery nào; Module 3 hiện không có formative quiz group dành riêng cho setup
  Practice.
- **CON-003**: Không đổi wording, dấu câu hoặc hình minh hoạ của các scene được
  giữ lại.
- **GUD-001**: Sau thay đổi, luồng learner-facing phải là
  `module-3-git-branch` → `module-3-portfolio-practice` →
  `module-3-portfolio-mastery`.
- **PAT-001**: Mọi scene bị xoá phải được đồng bộ giữa shared definition,
  renderer content, registry, progress migration, focused tests, Electron smoke
  và implementation ledger trước khi commit.

## 2. Implementation Steps

### Implementation Phase 1 — Xoá slide và nối trực tiếp vào Practice

- **GOAL-001**: Tạo một đồ thị Module 3 hợp lệ, trong đó kiến thức về branch đi
  thẳng vào trang Practice thật mà không qua slide setup trung gian.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Trong `course-companion/shared/course/modules/module-3.ts`, xoá record scene có `id: 'module-3-practice-intro'`; đổi `nextSceneId` của record `module-3-git-branch` từ `module-3-practice-intro` thành `module-3-portfolio-practice`. Phụ thuộc: không có. | ✅ | 2026-08-21 |
| TASK-002 | Trong `course-companion/src/renderer/src/course/modules/module-3/scenes.tsx`, xoá key `module-3-practice-intro` và toàn bộ object của key đó; đổi choice của `module-3-git-branch` thành `{ label: 'Mở Practice', next: 'module-3-portfolio-practice', primary: true }`. Không sửa object của 11 scene trong REQ-003 ngoài choice cuối của `module-3-git-branch`. Phụ thuộc: TASK-001. | ✅ | 2026-08-21 |
| TASK-003 | Trong `course-companion/src/renderer/src/course/registry.ts`, xoá hàng `['module-3-practice-intro']` khỏi `lessonPages['m3-evidence-debugging']`; giữ `['module-3-portfolio-practice']` để lesson vẫn có một trang và vẫn xuất hiện trong outline. Phụ thuộc: TASK-001. | ✅ | 2026-08-21 |
| TASK-004 | Chạy focused registry validation hiện có. Phase đạt khi shared module validation không báo dangling destination, registry vẫn có đủ năm lesson Module 3, và `m3-evidence-debugging` chỉ chứa `module-3-portfolio-practice`. Phụ thuộc: TASK-001, TASK-002, TASK-003. | ✅ | 2026-08-21 |

### Implementation Phase 2 — Bảo toàn saved progress và contract nội dung

- **GOAL-002**: Mọi trạng thái học cũ liên quan tới slide bị xoá tiếp tục ở
  trang Practice thật, trong khi nội dung kiến thức và mastery không đổi.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005 | Trong `RETIRED_MODULE_THREE_SCENE_DESTINATIONS` của `course-companion/electron/main/progress-repository.ts`, thêm mapping `module-3-practice-intro` → `module-3-portfolio-practice`; đổi destination của `module-3-enhancement-intro` và `module-3-check-enhancement-boundary` thành `module-3-portfolio-practice`. Giữ cơ chế lọc retired scene khỏi `sceneHistory`. Phụ thuộc: TASK-001. | ✅ | 2026-08-21 |
| TASK-006 | Trong `course-companion/tests/progress-repository.test.ts`, thêm hoặc cập nhật fixture để xác nhận cả ba ID trong REQ-005 đều migrate current scene tới `module-3-portfolio-practice`, không còn trong `sceneHistory`, và không làm mất checkpoint/receipt hợp lệ. Phụ thuộc: TASK-005. | ✅ | 2026-08-21 |
| TASK-007 | Trong `course-companion/tests/course-registry.test.ts`, thêm assertion cho tuyến `module-3-git-branch` → `module-3-portfolio-practice` và xác nhận `module-3-practice-intro` không còn trong inventory. Trong `course-companion/tests/module-three-content-contract.test.ts`, giữ các assertion về năm section, thứ tự kiến thức, sáu hình minh hoạ và năm câu mastery; thêm assertion rằng scene setup đã nghỉ không còn trong renderer source. Phụ thuộc: TASK-002, TASK-003. | ✅ | 2026-08-21 |
| TASK-008 | Không sửa `pilot-workspace/course/lessons/module-3.vi.md`, `pilot-workspace/course/lesson-scripts/module-3.script.vi.md`, `pilot-workspace/course/prompts/start-module-3.vi.md`, `pilot-workspace/course/course-structure.json` hoặc `pilot-workspace/course/quizzes/module-3.quiz.json` trừ khi focused tests chứng minh có tham chiếu trực tiếp tới ID đã xoá. Nếu có tham chiếu ID, chỉ thay ID đích; giữ nguyên copy và cấu trúc lesson/quiz. Phụ thuộc: TASK-007. | ✅ | 2026-08-21 |

### Implementation Phase 3 — Kiểm tra luồng và đồng bộ hồ sơ triển khai

- **GOAL-003**: Chứng minh việc xoá không làm mất kiến thức, Practice, mastery,
  saved progress hoặc khả năng duyệt nội dung.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-009 | Cập nhật `course-companion/tests/electron-smoke.mjs` nếu journey hiện tại đi qua `module-3-practice-intro`: thay expectation bằng việc từ `module-3-git-branch` mở trực tiếp `module-3-portfolio-practice`. Giữ nguyên content-review bypass tại Practice thật. Phụ thuộc: TASK-004, TASK-007. | ✅ | 2026-08-21 |
| TASK-010 | Từ `course-companion/`, chạy `npm run typecheck`, `npm run lint`, focused Vitest cho registry/progress/Module 3 content, `npm test`, `npm run build` và `git diff --check`. Mọi lệnh phải thoát mã `0`. Phụ thuộc: TASK-006, TASK-007, TASK-009. | Blocked — unrelated Module 2 assertion | 2026-08-21 |
| TASK-011 | Chạy Electron content-review ở một kích thước desktop được hỗ trợ. Bắt đầu trước `module-3-git-branch`, bấm CTA và xác nhận trang kế tiếp có scene ID `module-3-portfolio-practice`; xác nhận không có slide `module-3-practice-intro`, không có clipping, overlap hoặc horizontal overflow. Phụ thuộc: TASK-010. | ✅ | 2026-08-21 |
| TASK-012 | Chạy full Electron smoke. Nếu journey vẫn dừng tại blocker Module 1 đã biết trước khi tới Module 3, ghi riêng kết quả đó là blocker upstream và không trình bày như lỗi do refactor này; focused Module 3 evidence trong TASK-011 vẫn là điều kiện bắt buộc. Phụ thuộc: TASK-011. | ✅ — upstream blocker recorded | 2026-08-21 |
| TASK-013 | Đọc lại checkpoint Module 3 trong `docs/planning/portfolio-course-implementation-plan.md`, rồi cập nhật implementation ledger bằng inventory sau thay đổi, kết quả của TASK-010 đến TASK-012, remaining gaps và next permitted action. Không thay đổi owner approval hoặc pilot acceptance nếu chưa có bằng chứng tương ứng. Phụ thuộc: TASK-010, TASK-011, TASK-012. | ✅ | 2026-08-21 |
| TASK-014 | So sánh inventory Module 3 trước/sau. Phase đạt khi chênh lệch duy nhất là `module-3-practice-intro`, tuyến trực tiếp trong GUD-001 hoạt động, và không có trang/quiz/illustration nào khác bị xoá hoặc unreachable. Chỉ tạo checkpoint commit nếu các hunk liên quan có thể tách khỏi thay đổi đang có trong worktree và mọi verification bắt buộc đã đạt. Phụ thuộc: TASK-013. | ✅ — commit deferred | 2026-08-21 |

## 3. Alternatives

- **ALT-001**: Giữ `module-3-practice-intro`. Không khuyến nghị vì scene này
  lặp lại cách phối hợp trong Practice ngay trước trang Practice thật, trái với
  hướng để Executor điều phối thao tác.
- **ALT-002**: Xoá thêm 11 scene trước Practice. Không chọn vì các scene đó dạy
  kiến thức cần thiết về triển khai plan, debugging và Git/GitHub; chúng không
  phải slide setup môi trường hoặc hướng dẫn chuyển sang Executor.
- **ALT-003**: Gộp nội dung `module-3-practice-intro` vào một scene kiến thức.
  Không chọn vì sẽ giữ lại hướng dẫn vận hành Practice trong luồng slide và tạo
  thêm copy cần duy trì đồng bộ.

## 4. Dependencies

- **DEP-001**: Scene `module-3-portfolio-practice` phải tiếp tục là Practice
  entry chính và giữ checkpoint `m3-portfolio-build`.
- **DEP-002**: Progress migration hiện có phải tiếp tục hỗ trợ các ID Module 3
  đã nghỉ từ những phiên bản trước.
- **DEP-003**: Content-review mode phải tiếp tục cho phép duyệt từ
  `module-3-portfolio-practice` tới phần mastery mà không tạo receipt hoặc thay
  trạng thái hoàn thành thật.

## 5. Files

- **FILE-001**: `course-companion/shared/course/modules/module-3.ts` — đồ thị
  scene dùng chung và destination sau branch.
- **FILE-002**:
  `course-companion/src/renderer/src/course/modules/module-3/scenes.tsx` — nội
  dung scene và CTA learner-facing.
- **FILE-003**: `course-companion/src/renderer/src/course/registry.ts` — danh mục
  trang của lesson `m3-evidence-debugging`.
- **FILE-004**: `course-companion/electron/main/progress-repository.ts` — mapping
  saved progress cho scene đã nghỉ.
- **FILE-005**: `course-companion/tests/progress-repository.test.ts` — kiểm thử
  migration và scene history.
- **FILE-006**: `course-companion/tests/course-registry.test.ts` — kiểm thử
  inventory và route Module 3.
- **FILE-007**: `course-companion/tests/module-three-content-contract.test.ts` —
  kiểm thử bảo toàn kiến thức, hình ảnh, lesson và mastery.
- **FILE-008**: `course-companion/tests/electron-smoke.mjs` — hành trình Electron
  qua biên knowledge → Practice.
- **FILE-009**: `docs/planning/portfolio-course-implementation-plan.md` — trạng
  thái, bằng chứng và remaining gaps của Module 3.

## 6. Testing

- **TEST-001**: Shared definition và registry không chứa
  `module-3-practice-intro`; `module-3-git-branch.nextSceneId` là
  `module-3-portfolio-practice`.
- **TEST-002**: Migration của `module-3-practice-intro`,
  `module-3-enhancement-intro` và `module-3-check-enhancement-boundary` đều kết
  thúc ở `module-3-portfolio-practice`, đồng thời retired IDs không còn trong
  `sceneHistory`.
- **TEST-003**: Inventory vẫn chứa đủ 11 scene kiến thức trong REQ-003, Practice
  thật, toàn bộ mastery và completion; chỉ thiếu đúng một scene setup.
- **TEST-004**: `npm run typecheck`, `npm run lint`, `npm test`,
  `npm run build` và `git diff --check` đều thoát mã `0`.
- **TEST-005**: Electron content-review trên desktop chuyển trực tiếp từ branch
  sang Practice thật và không có clipping, overlap hoặc horizontal overflow.
- **TEST-006**: Full Electron smoke đi qua Module 3 hoặc ghi nhận chính xác
  blocker upstream xảy ra trước Module 3; không được tuyên bố full smoke đạt khi
  journey chưa tới tuyến vừa sửa.

## 7. Risks & Assumptions

- **RISK-001**: Người học có thể thiếu ngữ cảnh về cách bắt đầu Practice sau khi
  xoá slide. Giảm rủi ro bằng cách giữ Practice entry, objective và nguồn điều
  phối trong Pilot; TASK-011 phải xác nhận CTA trực tiếp vẫn dễ hiểu.
- **RISK-002**: Saved progress cũ có thể trỏ vào scene bị xoá và làm resume thất
  bại. Giảm rủi ro bằng mapping và test bắt buộc trong TASK-005, TASK-006.
- **RISK-003**: Worktree hiện có thay đổi chưa commit trong các file Module 3;
  implementation phải bảo toàn các hunk hiện hữu và chỉ commit khi có thể stage
  chính xác phần refactor.
- **ASSUMPTION-001**: `module-3-practice-intro` là slide setup duy nhất của
  Module 3 vì nội dung của nó chỉ mô tả cách làm việc trong Practice và nằm ngay
  trước `module-3-portfolio-practice`.
- **ASSUMPTION-002**: Practice/Executor hiện tại hoặc phiên bản được nối sau sẽ
  chịu trách nhiệm hướng dẫn thao tác; refactor này không thay đổi runtime đó.
- **ASSUMPTION-003**: Lesson `m3-evidence-debugging` vẫn hợp lệ khi chỉ còn trang
  `module-3-portfolio-practice`, nên không cần gộp hoặc xoá lesson/outline entry.

## 8. Related Specifications / Further Reading

- `docs/planning/portfolio-course-implementation-plan.md` — implementation
  ledger và acceptance status của Module 3.
- `pilot-workspace/course/lessons/module-3.vi.md` — nguồn nội dung và thứ tự dạy
  Module 3.
- `pilot-workspace/course/lesson-scripts/module-3.script.vi.md` — contract điều
  phối Teacher trong Practice.
- `pilot-workspace/course/prompts/start-module-3.vi.md` — prompt bắt đầu Module
  3 và ranh giới Teacher/Practice.
