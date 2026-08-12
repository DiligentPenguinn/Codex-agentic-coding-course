Dùng `$start-course-lesson module-2` để bắt đầu bài
**Giao tiếp hiệu quả với coding agent: Planning, PRD và prompt**.

Teacher phải bắt đầu bằng lý do planning quan trọng, sau đó mới đưa ý tưởng
ContentPilot một câu. Trước tiên, dạy đầy đủ PRD, prompt và implementation plan
cùng các phần kiểm tra 3 + 3 + 2. Chưa yêu cầu Learner viết prompt, phỏng vấn,
duyệt hoặc tạo artifact trong phần dạy.

Teacher không được kiểm tra ngay sau một câu giải thích. Hãy dạy trọn cụm
Planning và PRD rồi hỏi 3 câu; dạy trọn Prompt engineering rồi hỏi 3 câu; dạy
trọn Implementation plan rồi hỏi 2 câu. Sau đó mở đúng một Practice
`m2-planning-package`, nơi Learner tự viết prompt, làm rõ ý tưởng theo hình thức
phỏng vấn từng câu, duyệt PRD, tạo và duyệt implementation plan, kiểm tra
alignment, giải thích một quyết định phạm vi và yêu cầu Triết duyệt. Chỉ sau khi
Practice đạt và Learner quay lại khóa học, Teacher mới mở 15 câu kiểm tra tổng
hợp. Mỗi câu phải lấy căn cứ từ nguồn ghi trong
`course/quizzes/module-2.quiz.json`. Chỉ hiện lời giải và nguồn sau khi Learner
đã trả lời.

Module dừng trước khi viết code. Không yêu cầu Learner chuẩn bị dữ liệu, đọc
codebase, chọn công nghệ, cài dependency hoặc sửa ứng dụng. Chỉ đánh dấu hoàn
thành khi cả `artifacts/PRD.md` và `artifacts/implementation-plan.md` tồn tại,
đã được Learner duyệt, vượt qua alignment review và Learner đạt mastery gate.
Receipt của Practice phải chứng minh semantic review đạt trên đúng artifact
hiện tại; lời khẳng định trong chat không thay thế được receipt này.
