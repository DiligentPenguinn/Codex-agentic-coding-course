# Bàn giao cho Duy: Practice Module 2 và Module 3

Ngày: 11/09/2026.

Tài liệu ghi lại các quyết định Triết vừa thống nhất và phần cần triển khai.
Đây chưa phải xác nhận Duy đã duyệt phương án hoặc luồng mới đã chạy được.

## 1. Module 2 kết thúc bằng implementation plan đã được duyệt

Người học dùng Codex để lập kế hoạch cho portfolio. Khi kết thúc, có đúng năm
tài liệu dưới đây và người học đã duyệt PRD cùng implementation plan.

| Tài liệu | Nội dung chính | Đường dẫn hiện có |
|---|---|---|
| Bản định hướng portfolio | Ai sẽ xem, muốn họ hiểu gì và làm gì | `planning/portfolio-brief.md` |
| Tư liệu cho portfolio | Thông tin, dự án, hình ảnh, kết quả; phần còn thiếu hoặc không được công khai | `planning/content-evidence-inventory.md` |
| Tài liệu tham khảo thiết kế | Nguồn tham khảo và những điểm muốn học theo | `planning/reference/reference.md` |
| PRD | Yêu cầu, phạm vi phiên bản đầu và tiêu chí chấp nhận | `planning/PRD.md` |
| Implementation plan | Các bước xây dựng, kết quả cần đạt, phụ thuộc và cách kiểm tra | `planning/implementation-plan.md` |

Cách kiểm chứng nằm trong implementation plan, không bắt người học nộp thêm
`requirement-validation-map.md`. Task xây dựng đầu tiên được cụ thể hóa khi
bắt đầu Module 3, không phải tài liệu bắt buộc để qua Module 2.

Module 2 chưa tạo ứng dụng, cài dependency hoặc triển khai sản phẩm.

## 2. Duyệt kết quả cuối, tránh hỏi dồn người học

Phần chấm Practice tập trung vào tài liệu cuối cùng và sự nhất quán giữa chúng.
Không yêu cầu người học trải qua một chuỗi câu hỏi kiểm tra hiểu cho từng tính
năng hoặc từng bước tạo tài liệu.

Người học vẫn quyết định mục tiêu, phạm vi và chấp nhận bản cuối. Executor có
thể hỏi khi cần thông tin hoặc một lựa chọn ảnh hưởng đến sản phẩm. Những gì
đã thống nhất trong PRD không cần hỏi lại nếu không phát hiện mâu thuẫn.

Đề xuất hai câu kiểm tra hiểu trước khi duyệt từng được thảo luận, nhưng chưa
được chốt thành yêu cầu. Không thêm chúng vào điều kiện hoàn thành.

## 3. Giữ chat Teacher tắt trong Practice

Luồng dự kiến:

1. Người học làm việc với Executor trong task Codex.
2. Khi muốn nộp, người học bấm nút duyệt trong Course Companion.
3. Hệ thống kiểm tra tệp, cấu trúc, tham chiếu và phiên bản bằng chứng.
4. AI chấm nội dung theo tiêu chí, trả kết quả đạt hoặc cần bổ sung.
5. Nếu cần sửa, người học tiếp tục với Executor rồi nộp lại.

Teacher không mở cuộc trò chuyện song song và không tự ngắt Executor để hỏi
bài. Việc gọi AI chấm khi nộp không đồng nghĩa bật lại chat Teacher.

Deterministic check phù hợp với điều kiện rõ ràng như tệp bắt buộc, mục không
trống và mã yêu cầu được tham chiếu đúng. Nó không tự chứng minh nội dung hợp
lý hoặc người học đã hiểu. AI review bổ sung đánh giá nội dung, nhưng vẫn có
thể sai. Kết quả phải chỉ rõ vấn đề và phần tài liệu liên quan.

## 4. Module 3 tiếp nối plan để xây và debugging

Module 3 tiếp tục trong task Codex của Module 2, dùng PRD và plan đã duyệt để
xây website, xem kết quả thực tế và sửa lỗi. Không bắt lập lại kế hoạch từ đầu.

Tiêu chí hiện tại còn yêu cầu bốn phần xây cố định, một lần chỉnh sửa toàn
trang, một vòng gỡ lỗi, một cải tiến độc lập và tám tài liệu bằng chứng.
Những yêu cầu này cần được rà lại cho khớp hướng mới. Danh sách tiêu chí thay
thế cụ thể chưa được chốt; tài liệu này không cho phép tự bỏ toàn bộ kiểm tra.

## 5. Đối chiếu với branch mới nhất của Duy

Đã đọc branch `feature/course-companion-practice-workflow` tại commit
`3b71da2ded516f176393790f5e2370ff3f567333`, đối chiếu remote ngày 11/09/2026.

- `TeacherService` đã chặn chat trực tiếp khi có Practice đang hoạt động.
- Module 1 kiểm tra cấu hình bằng deterministic check.
- Ngoài đường kiểm tra cấu hình, chế độ chạy thật dùng
  `LivePracticeReviewEvaluator`. Chế độ kiểm thử dùng bộ chấm deterministic.
- AI review dùng task riêng ở chế độ chỉ đọc, không tiếp quản task Executor.
- Bài `m2-planning-package` trên branch này vẫn dành cho ContentPilot với PRD
  và implementation plan, chưa phải bộ năm tài liệu portfolio ở mục 1.

Nguồn mã tại commit đã đọc:

- [Chặn chat trong Practice](https://github.com/DiligentPenguinn/codex-content-creator-course/blob/3b71da2ded516f176393790f5e2370ff3f567333/course-companion/electron/main/teacher-service.ts#L194-L198).
- [Chọn bộ chấm thật hoặc bộ chấm kiểm thử](https://github.com/DiligentPenguinn/codex-content-creator-course/blob/3b71da2ded516f176393790f5e2370ff3f567333/course-companion/electron/main/index.ts#L302-L307).
- [Bài planning cũ](https://github.com/DiligentPenguinn/codex-content-creator-course/blob/3b71da2ded516f176393790f5e2370ff3f567333/course-companion/content/practices/m2-planning-package.json).

## 6. Đã sửa và việc còn lại

Đã đổi tên hiển thị của tài liệu thứ hai thành **Tư liệu cho portfolio** trong
giao diện Module 2, checklist, mẫu tài liệu và bản thiết kế. Tên tệp kỹ thuật
được giữ nguyên. Skill cá nhân `write-natural-vietnamese` cũng đã được chỉnh
để ưu tiên từ quen thuộc, dễ hiểu với học sinh trung học. Thay đổi skill cá
nhân không tự chuyển sang máy Duy.

Chưa triển khai hoặc kiểm chứng luồng Practice mới. Trong lần xem branch Duy,
chỉ đọc mã nguồn, không merge và không chạy thử.

Phần cần triển khai tiếp là đồng bộ đầu vào, tiêu chí chấm, điều kiện hoàn
thành và bàn giao Module 2 sang đúng năm tài liệu. Sau đó chốt tiêu chí Module
3 theo hướng xây và debugging. Việc xử lý tiến độ hoặc biên nhận cũ cần được
thiết kế trước khi thay điều kiện hoàn thành.

Tài liệu này bổ sung các quyết định mới cho
[bàn giao integration Module 2](./module-2-teacher-executor-integration-handoff.md).
Các checkpoint và chi tiết runtime trong tài liệu cũ chưa được cập nhật theo
cuộc trao đổi này.
