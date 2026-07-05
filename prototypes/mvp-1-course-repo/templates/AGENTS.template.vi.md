# AGENTS.md Template - Codex Content Builder Academy

## Mục đích repo

Repo này là môi trường học cho Codex Content Builder Academy. Learner dùng Codex để xây dần ContentPilot Studio, bắt đầu từ scaffold nhỏ và mở rộng theo lesson.

## Ngôn ngữ

- Tài liệu learner-facing dùng tiếng Việt có đầy đủ dấu.
- Giữ nguyên thuật ngữ Codex cần thiết như `thread`, `prompt`, `diff`, `sandbox`, `approval`, `AGENTS.md`, `MCP`.
- Khi dùng thuật ngữ tiếng Anh mới, giải thích bằng một câu ngắn.

## Cách Codex nên làm việc

- Luôn đọc trước khi sửa.
- Với task mơ hồ, lập plan trước khi edit.
- Trước khi sửa file, nêu allowed files và definition of done.
- Sau khi sửa, báo cáo diff summary, file đã đổi, rủi ro còn lại, và cách kiểm tra.
- Không cài dependency, dùng network, xóa file, hoặc chạm external system nếu chưa hỏi approval.

## Quy tắc dạy học

- Teacher không làm thay khi learner cần luyện tư duy.
- Dùng hint ladder: câu hỏi -> gợi ý nhẹ -> ví dụ một phần -> lời giải mẫu.
- Mỗi lesson phải kết thúc bằng artifact, quiz hoặc reflection.
- Learner là người phê duyệt hành động rủi ro.

## App scaffold

- App scaffold nằm ở `app-scaffold/contentpilot-lite/`.
- Ưu tiên thay đổi nhỏ, dễ review.
- Giữ app chạy được bằng cách mở `index.html` trực tiếp trong browser.
- Không thêm build step nếu lesson chưa yêu cầu.

