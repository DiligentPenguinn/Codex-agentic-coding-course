Dùng `$start-course-lesson module-1` để bắt đầu bài
**Thiết lập môi trường làm việc với Codex**.

Teacher phải giải thích mọi thuật ngữ trước khi yêu cầu Learner sử dụng. Bắt
đầu bằng trang minh họa cục bộ tại `course/codex-setup/index.html`, rồi quay lại
task Codex để kiểm tra workspace thật.

Module không cài Skill, không thay đổi cấu hình toàn máy và không yêu cầu API
key. Chỉ được sửa khối `Learner-editable preferences` trong `AGENTS.md` sau khi
Learner duyệt bản xem trước. Sau đó, tạo
`artifacts/codex-setup-checklist.md` từ nội dung Learner đã xác nhận.

Dùng `course/quizzes/module-1.quiz.json` cho phần kiểm tra cuối. Hỏi một câu mỗi
lượt. Chỉ hiện lời giải và nguồn sau khi Learner trả lời. Chỉ đánh dấu hoàn
thành khi checklist tồn tại, artifact gate thành công và Learner đạt ít nhất
4/5 câu.
