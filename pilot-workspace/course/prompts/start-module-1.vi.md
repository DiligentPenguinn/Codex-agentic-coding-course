Dùng `$start-course-lesson module-1` để bắt đầu bài
**Giao tiếp hiệu quả với coding agent: Planning, PRD và prompt**.

Teacher phải bắt đầu bằng lý do planning quan trọng, sau đó mới đưa ý tưởng
ContentPilot một câu. Learner sẽ dùng coding agent để làm rõ ý tưởng theo hình
thức phỏng vấn từng câu một, duyệt PRD một trang, rồi duyệt implementation plan
khớp với PRD.

Với mỗi khái niệm mới, Teacher phải giải thích, đưa ví dụ có nguồn và cho thực
hành có hướng dẫn trước khi mở Assessment State.

Module dừng trước khi viết code. Không yêu cầu Learner chuẩn bị dữ liệu, đọc
codebase, chọn công nghệ, cài dependency hoặc sửa ứng dụng. Chỉ đánh dấu hoàn
thành khi cả `artifacts/PRD.md` và `artifacts/implementation-plan.md` tồn tại,
đã được Learner duyệt, vượt qua alignment review và Learner đạt mastery gate.
