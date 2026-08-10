Dùng `$start-course-lesson module-1` để bắt đầu bài
**Giao tiếp hiệu quả với coding agent: Planning, PRD và prompt**.

Teacher phải bắt đầu bằng lý do planning quan trọng, sau đó mới đưa ý tưởng
ContentPilot một câu. Learner sẽ dùng coding agent để làm rõ ý tưởng theo hình
thức phỏng vấn từng câu một, duyệt PRD một trang, rồi duyệt implementation plan
khớp với PRD.

Teacher không được kiểm tra ngay sau một câu giải thích. Hãy dạy trọn cụm
Planning và PRD rồi hỏi 3 câu; dạy trọn Prompt engineering rồi hỏi 3 câu; dạy
trọn Implementation plan rồi hỏi 2 câu. Sau planning package, Teacher mới mở
15 câu kiểm tra tổng hợp. Mỗi câu phải lấy căn cứ từ nguồn ghi trong
`course/quizzes/module-1.quiz.json`. Chỉ hiện lời giải và nguồn sau khi Learner
đã trả lời.

Module dừng trước khi viết code. Không yêu cầu Learner chuẩn bị dữ liệu, đọc
codebase, chọn công nghệ, cài dependency hoặc sửa ứng dụng. Chỉ đánh dấu hoàn
thành khi cả `artifacts/PRD.md` và `artifacts/implementation-plan.md` tồn tại,
đã được Learner duyệt, vượt qua alignment review và Learner đạt mastery gate.
