# Kịch bản — Module 1: Bắt đầu làm việc với Codex

## Bước 1 — Codex và coding agent (`m1-codex-orientation`)

Teacher nói: "Codex là coding agent của OpenAI. Trong bài này, bạn chỉ cần hiểu
coding agent là một trợ lý có thể thực hiện công việc liên quan đến code: tạo
ứng dụng, xây trang web, chỉnh sửa dự án và tự động hóa những việc lặp lại."

Teacher nói: "Codex không chỉ trả lời. Khi được bạn cho phép, Codex có thể đọc
tệp, dùng công cụ, chạy lệnh và kiểm tra kết quả. Bạn vẫn là người đặt mục tiêu,
chọn phạm vi và duyệt kết quả cuối cùng."

[Dùng `WORKSPACE_ROOT` để tạo link Markdown cục bộ tuyệt đối tới
`course/codex-setup/index.html` với nhãn **Mở phần giới thiệu Codex**. Không chạy
server và không yêu cầu cài dependency.]

Teacher nói: "Approval cho biết khi nào Codex cần dừng để bạn quyết định. Ask
for approval hỏi thường xuyên hơn. Approve for me tự xử lý hành động thông
thường nhưng vẫn dừng ở hành động có rủi ro. Full access gỡ bỏ các ranh giới
bảo vệ thông thường. Nếu mới bắt đầu, mình khuyên bạn dùng Approve for me và
để Full access tắt."

Teacher nói: "Ở góc dưới bên phải, ngay cạnh nút microphone, bạn sẽ thấy menu
Model, Effort và Speed. Model chọn dòng model phù hợp với công việc. Effort điều
chỉnh lượng công sức dành cho phân tích. Speed chọn tốc độ xử lý."

Teacher nói: "Trong dòng GPT-5.6, Sol có năng lực cao nhất cho công việc chuyên
môn phức tạp. Terra tiết kiệm hơn Sol nhưng vẫn đáp ứng tốt công việc hằng ngày.
Ví dụ, bạn có thể dùng Terra để trả lời tin nhắn khách hàng theo hướng dẫn đã
có."

Teacher nói: "Thông thường mình không dùng Luna quá nhiều. Theo hiểu biết của
mình, Luna có thể làm sub-agent. Đây là một agent nhỏ do agent lớn gọi ra để xử
lý phần việc ít phức tạp hơn. Chẳng hạn, khi GPT-5.6 Sol sửa một tính năng, Sol
có thể gọi Luna khảo sát codebase trước."

Teacher nói: "Light phù hợp việc nhỏ. Medium là mức cân bằng. High phù hợp việc
nhiều bước. Extra High và Ultra dành cho nhiệm vụ khó hơn. Trong những lần mình
thử, Extra High không tạo khác biệt đủ lớn cho đa số công việc hằng ngày. Tác vụ
lại mất nhiều thời gian hơn."

Teacher nói: "OpenAI cho biết Fast có thể tăng tốc 1,5 lần. Với GPT-5.6, chế độ
này dùng credit ở mức 2,5 lần Standard. Trong những lần mình thử, Fast thường
chỉ nhanh hơn Standard khoảng 0,5 giây. Vì vậy, mình không chọn Fast làm mặc
định."

[Trình bày toàn bộ phần Model, Effort, Speed và cấu hình đề xuất trên một màn
hình lớn. Đặt nội dung cạnh ảnh `model-settings.png`. Teacher Triết chỉ xuất
hiện như một nhân vật nhỏ ở góc, không có nhãn.]

[Dừng chờ Learner xem phần giới thiệu Codex và màn hình Model, Effort, Speed.
Sau đó hỏi: "Coding agent khác một chatbot chỉ trả lời ở điểm nào?" Đạt khi
Learner nêu được ít nhất một khả năng hành động như đọc tệp, dùng công cụ, chạy
lệnh hoặc kiểm tra kết quả. Checkpoint `m1-codex-orientation`.]

## Bước 2 — Harness Engineering (`m1-agents-guidance`, `m1-skills`)

Teacher nói: "Trước khi tiếp tục khóa học, mình muốn giải thích với bạn một
thuật ngữ được nhắc đến nhiều gần đây: Harness Engineering. Nghe có vẻ phức
tạp, nhưng hiểu đơn giản, đây là cách thiết kế môi trường giúp một AI agent làm
việc."

Teacher nói: "Ở phần trước, bạn đã tìm hiểu model và approval. Model là bộ não
của agent, còn approval là một phần của harness. Harness còn gồm workspace,
công cụ đọc và sửa tệp, terminal, chỉ dẫn của dự án, sandbox, test và diff."

Teacher nói: "Các thành phần này cho model nơi hành động, ranh giới cần tuân
theo và cách kiểm tra kết quả. Vì vậy, khi Codex làm chưa tốt, bạn đừng chỉ đổi
model. Hãy xem agent có thiếu bối cảnh, công cụ, quyền truy cập hoặc cách kiểm
tra hay không."

[Trình bày toàn bộ phần Harness Engineering trên một màn hình. Dừng chờ Learner.
Hỏi một câu: "Nếu model là bộ não, hãy nêu hai phần thuộc harness của Codex."
Đạt khi Learner nêu đúng hai thành phần. Ghi checkpoint `m1-agents-guidance`,
sau đó `m1-skills`.]

## Bước 3 — Áp dụng cấu hình Codex (`m1-model-choice`)

Teacher nói: "Với ContentPilot, mình khuyên bạn dùng 5.6 Sol, High, Standard và
Approve for me. Hãy để Full access tắt. Đây là cấu hình mình chọn cho dự án thực
hành, không phải thiết lập mặc định của mọi tài khoản Codex."

[Chỉ hiện một màn hình áp dụng cấu hình, không lặp lại phần giải thích. Ghi quyết
định `modelChoice=sol-high-standard`. Checkpoint `m1-model-choice`.]

## Bước 4 — Nộp cấu hình để Triết duyệt (`m1-setup-checklist`)

Teacher nói: "Bây giờ bạn sẽ cài cấu hình thật và nộp bằng chứng. Course
Companion sẽ mở một task Executor riêng trong Codex."

Teacher nói: "Trong task đó, hãy đính kèm hai ảnh: một ảnh Model, Effort và
Speed; một ảnh Approval cùng trạng thái Full access. Sau đó gửi yêu cầu sau:"

> Hãy kiểm tra cấu hình trong hai ảnh. Chỉ quan sát, không thay đổi cài đặt.
> Báo cáo dưới tiêu đề `Verification`, gồm Model, Effort, Speed, Approval và
> trạng thái Full access. Cảnh báo nếu có mục nào khác cấu hình Triết khuyên dùng.

[Mở Practice `m1-codex-safe-setup`. Chỉ dùng đúng task Executor được liên kết.
Checkpoint `m1-setup-checklist` khi task đã mở và có hoạt động mới.]

## Bước 5 — Triết duyệt bằng chứng

[Khi Learner chọn **Yêu cầu Triết duyệt tiến độ**, đối chiếu bằng chứng theo
Practice definition. Không nhận lời tự xác nhận thay cho báo cáo từ đúng task.
Nếu thiếu hoặc sai một mục, nêu đúng mục cần sửa và cho nộp lại.]

Teacher nói khi đạt: "Mình đã duyệt đủ năm mục: 5.6 Sol, High, Standard,
Approve for me và Full access đang tắt. Bằng chứng đến từ đúng task và còn mới."

[Lưu kết quả Practice đạt. Chưa hoàn thành checkpoint `m1-mastery`.]

## Bước 6 — Ôn tập cuối Module 1 (`m1-mastery`)

Teacher nói: "Bạn đã thiết lập Codex và kiểm tra bằng chứng thật. Bây giờ, năm
câu ôn tập sẽ giúp bạn giải thích, áp dụng và phân tích những gì vừa học. Bạn
cần đạt ít nhất bốn câu để hoàn thành Module 1."

[Dùng đủ năm câu trong `course/quizzes/module-1.quiz.json`. Mở Assessment State
cho từng câu và hỏi từng câu một. Chỉ hiện phản hồi, lời giải cùng nguồn sau khi
Learner đã trả lời. Nếu chưa đạt 4/5, cho làm lại bài ôn tập. Khi đạt, lưu
checkpoint `m1-mastery`.]

## Bước 7 — Hoàn thành Module 1 (`m1-complete`)

Teacher nói: "Bạn đã có cấu hình an toàn để bắt đầu ContentPilot. Quan trọng
hơn, bạn hiểu model là bộ não còn harness là môi trường giúp coding agent hành
động và kiểm tra kết quả."

Teacher nói: "Khi sẵn sàng, dùng `$start-course-lesson module-2`."

[Chạy lệnh complete cho `module-1`. Chỉ báo hoàn thành khi lệnh thành công và
state chuyển sang `module-2`.]
