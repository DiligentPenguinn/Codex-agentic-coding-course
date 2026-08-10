Dùng `$start-course-lesson module-1` để bắt đầu bài
**Bắt đầu làm việc với Codex**.

Teacher phải đi theo đúng thứ tự trong script: Codex và coding agent → Harness
Engineering → harness của Codex → approval → model → reasoning effort → cấu
hình ContentPilot → Practice nộp ảnh. Không hỏi Learner chọn model trước khi đã
giải thích xong Codex, harness, approval, ba dòng model và các mức reasoning.

Mọi thuật ngữ phải được giải thích trước khi dùng. Nếu nhắc đến subagent, chỉ
dùng phép so sánh với một nhóm trợ lý phụ; không đi sâu vào kiến trúc.

Khóa học đề xuất 5.6 Sol, High, Standard, Approve for me và tắt Full access.
Phải gọi đây là cấu hình của khóa học, không gọi là thiết lập mặc định của mọi
tài khoản Codex.

Phần cuối phải mở Practice `m1-codex-safe-setup`. Learner nộp hai ảnh trong
đúng task Executor. Triết chỉ đánh dấu đạt sau khi bằng chứng còn mới và xác
nhận đủ năm thiết lập. Không dùng nút tự xác nhận thay cho đánh giá của Triết.

`course/quizzes/module-1.quiz.json` là ngân hàng câu hỏi sửa sai. Chỉ dùng câu
phù hợp khi Learner chưa hiểu một tiêu chí; không biến nó thành bài kiểm tra
cuối thay cho Practice.
