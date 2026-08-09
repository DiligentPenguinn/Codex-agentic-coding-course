# Kịch bản — Giao tiếp hiệu quả với coding agent: Planning và PRD

## Bước 1 — Hiểu vì sao planning quan trọng (`m1-why-planning`)

Teacher nói: "Cũng giống như con người, có một kế hoạch kỹ càng trước khi xây
sẽ giúp coding agent tránh phạm những sai lầm ngớ ngẩn sau này. Nó tưởng chừng
tốn thời gian, nhưng thực chất planning kỹ sẽ giúp bạn đỡ phải debug và sửa một
ứng dụng không vừa ý mình. Tin mình đi, sửa một ứng dụng đã đi sai hướng sẽ tốn
thời gian hơn nhiều so với planning kỹ ngay từ đầu."

Teacher nói: "Planning không cần thiết cho mọi việc. Một thay đổi nhỏ, rõ ràng
và dễ hoàn tác có thể giao trực tiếp. Nhưng khi xây từ đầu, còn nhiều quyết định
chưa rõ hoặc có nhiều bước phụ thuộc nhau, planning giúp coding agent hiểu đúng
vấn đề trước khi viết code. Theo bạn, dấu hiệu nào cho thấy một yêu cầu nên được
planning trước?"

[Dừng chờ Learner nêu ít nhất một dấu hiệu bằng lời của họ. Dùng ví dụ ngoài
ContentPilot nếu cần repair. Sau khi đạt, lưu checkpoint `m1-why-planning`.]

## Bước 2 — Chuyển ý tưởng ContentPilot thành bài toán planning (`m1-contentpilot-brief`)

Teacher nói: "Bây giờ ta áp dụng planning vào dự án thực hành. ContentPilot là
công cụ giúp người sáng tạo phân tích các bài viết hiện có trên profile — hoặc
một profile mẫu nếu chưa có dữ liệu — rồi đề xuất những ý tưởng nội dung có khả
năng bắt kịp xu hướng. Đây mới là ý tưởng một câu, chưa phải kế hoạch."

Teacher nói: "Bạn không cần chuẩn bị dữ liệu, biết code hay chọn công nghệ.
Việc đầu tiên là làm rõ sản phẩm cần làm gì. Trong ý tưởng một câu này, điều gì
bạn thấy cần quyết định rõ hơn trước khi xây?"

[Dừng chờ Learner nêu một điểm chưa rõ liên quan đến workflow, input, output,
phạm vi hoặc dấu hiệu hoàn thành. Không dẫn sang persona. Sau khi đạt, lưu
checkpoint `m1-contentpilot-brief`.]

## Bước 3 — Phân biệt PRD và implementation plan (`m1-prd-concept`)

Teacher nói: "PRD, viết tắt của Product Requirements Document, mô tả chúng ta
đang xây sản phẩm gì, phạm vi phiên bản đầu tiên và làm sao biết sản phẩm đáp ứng
yêu cầu. Implementation plan mô tả coding agent sẽ biến PRD đã duyệt thành các
bước xây dựng như thế nào. Nói ngắn gọn: PRD là ‘xây cái gì’; implementation
plan là ‘xây như thế nào’."

Teacher nói: "Module này sẽ tạo cả hai tài liệu nhưng dừng trước khi code. Nếu
một câu nói ‘phiên bản đầu chưa tự động đăng bài’, theo bạn câu đó thuộc PRD hay
implementation plan? Vì sao?"

[Dừng chờ Learner. Cần nhận ra đây là quyết định phạm vi sản phẩm, nên thuộc
PRD. Cho repair bằng tình huống tương tự khác nếu cần. Sau khi đạt, lưu
checkpoint `m1-prd-concept`.]

## Bước 4 — Viết prompt để coding agent phỏng vấn (`m1-prd-interview`)

Teacher nói: "Thay vì cố tự viết toàn bộ PRD ngay, bạn có thể yêu cầu coding
agent phỏng vấn mình từng câu một. Một prompt tốt ở đây cần nêu: mục tiêu là làm
rõ PRD cho ContentPilot; bối cảnh là ý tưởng một câu vừa có; agent chỉ hỏi một
câu mỗi lượt; PRD phải đủ tám phần; dùng ngôn ngữ dành cho người mới; chưa bàn
code; và chỉ soạn bản nháp khi đã đủ thông tin."

Teacher nói: "Hãy viết prompt đó bằng lời của bạn để gửi cho coding agent."

[Mở Assessment State. Dừng chờ Learner tự viết. Dùng hint ladder, không đưa
prompt hoàn chỉnh trước khi Learner thử. Prompt đạt khi có mục tiêu, bối cảnh,
quy trình một câu mỗi lượt, output PRD một trang, tám phần bắt buộc và ràng buộc
chưa code/không persona. Sau khi đạt, chuyển ngắn sang Executor và dùng nguyên
văn prompt của Learner. Executor hỏi đúng một câu mỗi lượt; không tự trả lời
thay Learner. Tiếp tục cho tới khi đủ thông tin, rồi đưa bản nháp PRD. Lưu
checkpoint `m1-prd-interview`.]

## Bước 5 — Review, duyệt và lưu PRD (`m1-prd-approved`)

Teacher nói: "Trước khi duyệt PRD, hãy kiểm tra: có đủ ý tưởng, core workflow,
input, output, phạm vi phiên bản 1, ngoài phạm vi, Done When và câu hỏi còn mở
không; Done When có quan sát và kiểm tra được không; tài liệu có tránh chi tiết
code không. Bạn muốn duyệt, yêu cầu điều chỉnh hay từ chối bản nháp này?"

[Dừng chờ quyết định. Nếu Learner yêu cầu sửa, Executor chỉ sửa nội dung được
nêu rồi quay lại review. Không chấp nhận một PRD có câu hỏi quan trọng bị giấu
trong giả định. Khi nội dung đạt, yêu cầu Learner dùng lời rõ ràng “Duyệt và lưu
PRD” để cho phép tạo `artifacts/PRD.md` từ mẫu
`artifacts/PRD.template.md`. Kiểm tra file sau khi ghi. Lưu checkpoint
`m1-prd-approved`.]

## Bước 6 — Tạo implementation plan từ PRD (`m1-implementation-plan`)

Teacher nói: "Bây giờ PRD đã là nguồn duy nhất cho phạm vi sản phẩm. Coding
agent sẽ đọc PRD và đề xuất implementation plan bằng ngôn ngữ dễ hiểu. Mỗi bước
phải có mục tiêu, thành phần hoặc file dự kiến, kết quả quan sát được và cách
kiểm tra. Plan cũng phải nêu phụ thuộc, giả định, rủi ro, quyết định kỹ thuật còn
mở và kiểm tra toàn bộ luồng. Chưa viết code."

Teacher nói: "Hãy viết yêu cầu của bạn để coding agent tạo plan từ
`artifacts/PRD.md` mà không mở rộng phạm vi."

[Mở Assessment State. Dừng chờ Learner tự viết. Prompt đạt khi chỉ định PRD là
nguồn, yêu cầu các trường bắt buộc của plan, ngôn ngữ cho người mới, traceability
và ràng buộc chưa code. Dùng hint ladder nếu cần. Sau khi đạt, Executor đọc PRD
và đưa bản nháp plan trong hội thoại; chưa lưu file. Lưu checkpoint
`m1-implementation-plan`.]

## Bước 7 — Kiểm tra PRD và plan có khớp nhau (`m1-alignment-review`)

Teacher nói: "Một plan có vẻ chi tiết vẫn có thể sai nếu nó xây thiếu hoặc tự
thêm tính năng. Hãy kiểm tra bốn điều: mọi yêu cầu trong phạm vi PRD đều có bước
tương ứng; mọi bước đều truy ngược về PRD; nội dung ngoài phạm vi không quay trở
lại; và mỗi Done When đều trở thành một phép kiểm tra trong plan."

Teacher nói: "Hãy chọn một mục Done When trong PRD và chỉ ra bước cùng cách
kiểm tra tương ứng trong plan."

[Dừng chờ Learner tự đối chiếu một mapping cụ thể. Nếu phát hiện lệch, yêu cầu
Learner quyết định sửa PRD hay sửa plan; không âm thầm chọn thay. Khi cả bốn điều
đạt, lưu checkpoint `m1-alignment-review`.]

## Bước 8 — Duyệt planning package (`m1-planning-package`)

Teacher nói: "Planning package chỉ hoàn thành khi cả PRD và implementation plan
đều rõ, khớp nhau và do bạn quyết định. Nếu plan hiện tại đúng ý, hãy trả lời
‘Duyệt và lưu implementation plan’, đồng thời nêu một quyết định phạm vi bạn có
thể giải thích bằng lời của mình."

[Dừng chờ Learner. Chỉ sau lời duyệt rõ ràng mới tạo
`artifacts/implementation-plan.md` từ mẫu
`artifacts/implementation-plan.template.md`. Kiểm tra cả hai artifact tồn tại,
không rỗng, có trạng thái đã duyệt và không chứa code triển khai. Khi Learner
giải thích được một quyết định phạm vi, lưu checkpoint `m1-planning-package`.]

## Bước 9 — Kiểm tra cuối Module 1 (`m1-mastery`)

Teacher nói: "Phần kiểm tra cuối giúp bạn phân biệt planning, PRD và
implementation plan trong những tình huống mới. Mình sẽ hỏi từng câu một; một
số câu yêu cầu bạn dùng chính planning package vừa tạo."

[Dùng `course/quizzes/module-1.quiz.json`. Khi pass theo
`course/pedagogy/rubrics/mastery-rubric.vi.md`, lưu checkpoint `m1-mastery`.]

## Bước 10 — Hoàn thành Module 1 (`m1-complete`)

Teacher nói: "Bạn đã biến một ý tưởng một câu thành hai tài liệu đủ rõ để coding
agent bắt đầu xây mà chưa cần bạn biết lập trình. PRD giữ sản phẩm đi đúng hướng;
implementation plan biến hướng đó thành các bước có thể thực hiện và kiểm tra.
Ở module tiếp theo, hai tài liệu này sẽ là điểm xuất phát cho implementation và
debugging."

[Xác nhận lại hai artifact và mastery gate. Chạy lệnh complete; hard gate trong
state helper sẽ từ chối nếu thiếu hoặc rỗng một artifact. Chỉ sau khi lệnh thành
công mới thông báo hoàn thành. Không tuyên bố Module 2 đã có trong workspace
nếu course map chưa chứa module đó.]
