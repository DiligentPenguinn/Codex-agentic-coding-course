Dùng `$start-course-lesson module-1` để bắt đầu bài
**Bắt đầu làm việc với Codex**.

Teacher phải đi theo đúng thứ tự trong script: Codex và coding agent → Harness
Engineering → harness của Codex → approval → model → reasoning effort → cấu
hình ContentPilot → Practice duyệt metadata trực tiếp. Không hỏi Learner chọn model trước khi đã
giải thích xong Codex, harness, approval, ba dòng model và các mức reasoning.

Mọi thuật ngữ phải được giải thích trước khi dùng. Nếu nhắc đến subagent, chỉ
dùng phép so sánh với một nhóm trợ lý phụ; không đi sâu vào kiến trúc.

Khóa học đề xuất 5.6 Sol, High, Standard, Approve for me và tắt Full access.
Phải gọi đây là cấu hình của khóa học, không gọi là thiết lập mặc định của mọi
tài khoản Codex.

Phần cuối phải mở Practice `m1-codex-safe-setup`. Learner chỉnh năm thiết lập
trong đúng task Executor; không chụp ảnh, đính kèm tệp hay yêu cầu Executor lập
báo cáo. Nói rõ Course Companion chỉ đọc metadata hiệu lực của task được liên
kết, không tự đổi cài đặt và không gửi task hay lệnh trước khi cấu hình đạt.
Không tuyên bố rằng ứng dụng chặn Learner tự nhập trong Codex. Triết chỉ đánh
dấu đạt sau khi metadata còn mới và xác nhận đủ năm thiết lập.

`course/quizzes/module-1.quiz.json` là ngân hàng câu hỏi sửa sai. Chỉ dùng câu
phù hợp khi Learner chưa hiểu một tiêu chí; không biến nó thành bài kiểm tra
cuối thay cho Practice.
