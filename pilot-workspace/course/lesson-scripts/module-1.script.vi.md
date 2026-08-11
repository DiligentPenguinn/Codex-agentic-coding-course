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

[Dừng chờ Learner xem hai trang đầu. Sau đó hỏi: "Coding agent khác một chatbot
chỉ trả lời ở điểm nào?" Đạt khi Learner nêu được ít nhất một khả năng hành động
như đọc tệp, dùng công cụ, chạy lệnh hoặc kiểm tra kết quả. Checkpoint
`m1-codex-orientation`.]

## Bước 2 — Harness Engineering (`m1-agents-guidance`, `m1-skills`)

Teacher nói: "Trước khi đi sâu vào Codex, ta cần hiểu Harness Engineering. Đây
là cách thiết kế môi trường xung quanh agent để nó có thể làm việc ổn định. Con
người định hướng, còn agent thực thi trong môi trường đó."

Teacher nói: "Hãy hình dung model là bộ não. Harness là nơi làm việc, công cụ,
quy tắc an toàn và vòng phản hồi quanh bộ não đó. Trong Codex, harness gồm
workspace, terminal, công cụ đọc và sửa tệp, chỉ dẫn dự án, sandbox, approval,
diff và các bước kiểm tra."

Teacher nói: "Nếu Codex làm chưa tốt, ta không chỉ đổi model. Ta còn xem harness
có thiếu bối cảnh, công cụ, giới hạn hoặc cách kiểm tra nào không."

[Dừng chờ Learner. Hỏi một câu: "Nếu model là bộ não, hãy nêu hai phần thuộc
harness của Codex." Đạt khi Learner nêu đúng hai thành phần. Checkpoint
`m1-agents-guidance`, sau đó `m1-skills`.]

## Bước 3 — Approval và quyền truy cập (`m1-permissions`)

Teacher nói: "Sandbox là ranh giới kỹ thuật. Approval là lúc Codex phải dừng để
bạn quyết định. Ask for approval hỏi thường xuyên hơn. Approve for me tự xử lý
hành động thông thường nhưng vẫn dừng ở hành động có rủi ro. Full access gỡ bỏ
các ranh giới bảo vệ thông thường."

Teacher nói: "Khóa học khuyên người mới dùng Approve for me và không bật Full
access. Course Companion chỉ ghi lại lựa chọn này; bạn sẽ cài thật trong Codex
ở phần Practice."

[Hiện ảnh `course/codex-setup/images/approval-menu.png`. Dừng chờ Learner xác
nhận đã tìm thấy menu approval trong Codex. Ghi quyết định
`approvalApproach=approve-for-me-no-full-access`. Checkpoint `m1-permissions`.]

## Bước 4 — Model và reasoning effort (`m1-model-choice`)

Teacher nói: "Trong dòng GPT-5.6, Codex cho bạn chọn ba model ngôn ngữ lớn,
thường được gọi là LLM. Sol có năng lực cao nhất cho công việc chuyên môn phức
tạp. Terra cân bằng giữa năng lực và chi phí. Luna dành cho công việc cần tiết
kiệm chi phí hoặc xử lý số lượng lớn."

Teacher nói: "Reasoning effort là lượng công sức model dành cho phân tích. Light
phù hợp việc nhỏ. Medium là mức cân bằng. High phù hợp việc nhiều bước. Extra
High và Ultra dành cho nhiệm vụ khó hơn."

Teacher nói: "Trong những lần mình thử, Extra High không tạo khác biệt đủ lớn
cho đa số công việc hằng ngày. Tác vụ lại mất nhiều thời gian hơn. Vì vậy, bạn
chưa cần dùng Extra High hoặc Ultra cho ContentPilot."

Teacher nói: "OpenAI cho biết Fast có thể tăng tốc 1,5 lần, nhưng GPT-5.6 dùng
credit ở mức 2,5 lần Standard. Trong những lần mình thử, Fast thường chỉ nhanh
hơn Standard khoảng 0,5 giây. Mức chênh này không đủ lớn để mình chọn Fast làm
mặc định."

Teacher nói: "Cấu hình khóa học đề xuất là 5.6 Sol, High, Standard và Approve
for me. Full access để tắt. Đây là cấu hình của khóa học, không phải thiết lập
mặc định của mọi tài khoản Codex."

[Trình bày phần này trên hai trang lớn. Trang đầu đặt ba model cạnh ảnh
`model-settings.png`. Trang sau đặt Effort, Speed và cấu hình đề xuất cạnh ảnh
`reasoning-levels.png`. Teacher Triết chỉ xuất hiện như một nhân vật nhỏ ở góc,
không có nhãn. Ghi quyết định `modelChoice=sol-high-standard`. Checkpoint
`m1-model-choice`.]

## Bước 5 — Nộp cấu hình để Triết duyệt (`m1-setup-checklist`)

Teacher nói: "Bây giờ bạn sẽ cài cấu hình thật và nộp bằng chứng. Course
Companion sẽ mở một task Executor riêng trong Codex."

Teacher nói: "Trong task đó, hãy đính kèm hai ảnh: một ảnh Model, Effort và
Speed; một ảnh Approval cùng trạng thái Full access. Sau đó gửi yêu cầu sau:"

> Hãy kiểm tra cấu hình trong hai ảnh. Chỉ quan sát, không thay đổi cài đặt.
> Báo cáo dưới tiêu đề `Verification`, gồm Model, Effort, Speed, Approval và
> trạng thái Full access. Cảnh báo nếu có mục nào khác cấu hình khóa học đề xuất.

[Mở Practice `m1-codex-safe-setup`. Chỉ dùng đúng task Executor được liên kết.
Checkpoint `m1-setup-checklist` khi task đã mở và có hoạt động mới.]

## Bước 6 — Triết duyệt bằng chứng (`m1-mastery`)

[Khi Learner chọn **Yêu cầu Triết duyệt tiến độ**, đối chiếu bằng chứng theo
Practice definition. Không nhận lời tự xác nhận thay cho báo cáo từ đúng task.
Nếu thiếu hoặc sai một mục, nêu đúng mục cần sửa và cho nộp lại.]

Teacher nói khi đạt: "Mình đã duyệt đủ năm mục: 5.6 Sol, High, Standard,
Approve for me và Full access đang tắt. Bằng chứng đến từ đúng task và còn mới."

[Lưu kết quả đạt và checkpoint `m1-mastery`.]

## Bước 7 — Hoàn thành Module 1 (`m1-complete`)

Teacher nói: "Bạn đã có cấu hình an toàn để bắt đầu ContentPilot. Quan trọng
hơn, bạn hiểu model là bộ não còn harness là môi trường giúp coding agent hành
động và kiểm tra kết quả."

Teacher nói: "Khi sẵn sàng, dùng `$start-course-lesson module-2`."

[Chạy lệnh complete cho `module-1`. Chỉ báo hoàn thành khi lệnh thành công và
state chuyển sang `module-2`.]
