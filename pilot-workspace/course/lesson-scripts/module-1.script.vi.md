# Kịch bản — Giao tiếp hiệu quả với coding agent: Planning, PRD và prompt

## Bước 1 — Hiểu vì sao planning quan trọng (`m1-why-planning`)

Teacher nói: "Cũng giống như con người, có một kế hoạch kỹ càng trước khi xây
sẽ giúp coding agent tránh phạm những sai lầm ngớ ngẩn sau này. Nó tưởng chừng
tốn thời gian, nhưng thực chất planning kỹ sẽ giúp bạn đỡ phải debug và sửa một
ứng dụng không vừa ý mình. Tin mình đi, sửa một ứng dụng đã đi sai hướng sẽ tốn
thời gian hơn nhiều so với planning kỹ ngay từ đầu."

Teacher nói: "Không phải việc nào cũng cần planning. Bạn có thể giao trực tiếp
cho coding agent nếu yêu cầu nhỏ và kết quả đã rõ. Hãy lập kế hoạch trước khi
bắt đầu xây một sản phẩm mới. Bạn cũng nên planning nếu chưa xác định được
hướng đi hoặc thứ tự thực hiện."

Teacher nói: "Hướng dẫn thiết kế của Microsoft cũng dùng cách phân biệt này:
không phải công việc nào cũng cần một bản thiết kế, nhưng planning có ích khi
yêu cầu còn mơ hồ, có nhiều điều chưa biết hoặc người thực hiện chưa thể chỉ ra
đầy đủ các bước cần làm. Vì vậy, trước khi planning, hãy nhìn vào độ rõ của
công việc thay vì chỉ nhìn vào độ dài của yêu cầu."

Teacher nói: "Ví dụ, tạo một ứng dụng mới từ đầu cần planning. Bạn còn phải
quyết định người dùng sẽ làm gì, dữ liệu đi vào từ đâu, kết quả nào được tạo ra
và phiên bản đầu dừng ở đâu. Ngược lại, bạn có thể giao trực tiếp việc sửa chữ
hoặc màu của một nút nhỏ nếu vị trí và kết quả mới đã rõ."

[Đây là phần dạy, không phải bài kiểm tra. Không mở Assessment State. Tiếp tục
sang ý tưởng ContentPilot và lưu checkpoint `m1-why-planning`.]

## Bước 2 — Nhìn ra điều còn thiếu trong ý tưởng ContentPilot (`m1-contentpilot-brief`)

Teacher nói: "Bây giờ ta áp dụng planning vào dự án thực hành. ContentPilot là
công cụ giúp người sáng tạo phân tích các bài viết hiện có trên profile — hoặc
một profile mẫu nếu chưa có dữ liệu — rồi đề xuất những ý tưởng nội dung có khả
năng bắt kịp xu hướng. Đây mới là ý tưởng một câu, chưa phải kế hoạch."

Teacher nói: "Một ý tưởng như vậy chưa cho ta biết luồng sử dụng, đầu vào cụ thể,
đầu ra cụ thể, phạm vi phiên bản đầu hoặc dấu hiệu hoàn thành. Bạn chưa cần biết
code hay chọn công nghệ. Trước tiên, ta cần một tài liệu giữ các quyết định về
sản phẩm. Tài liệu đó gọi là PRD."

[Đây là bước nối kiến thức, không phải bài kiểm tra. Nếu muốn Learner tham gia,
hỏi họ chọn một điểm muốn làm rõ trước và chấp nhận mọi lựa chọn liên quan đến
luồng sử dụng, đầu vào, đầu ra, phạm vi hoặc dấu hiệu hoàn thành. Không mở
Assessment State. Sau đó lưu checkpoint `m1-contentpilot-brief`.]

## Bước 3 — Hiểu PRD trước khi phân loại (`m1-prd-concept`)

Teacher nói: "PRD, viết tắt của Product Requirements Document, là tài liệu mô
tả chúng ta đang xây sản phẩm gì, vì sao sản phẩm cần tồn tại, phạm vi phiên bản
đầu và làm sao biết sản phẩm đáp ứng yêu cầu. PRD giữ các quyết định về sản phẩm
trước khi coding agent chọn cách xây."

Teacher nói: "Trong khóa học này, PRD một trang có tám phần: ý tưởng sản phẩm,
luồng sử dụng cốt lõi, đầu vào, đầu ra, phạm vi phiên bản 1, ngoài phạm vi, Done
When và câu hỏi còn mở. Khóa học chủ động chưa yêu cầu persona để bạn tập trung
vào việc làm rõ sản phẩm."

Teacher nói: "Ví dụ trong mẫu PRD của Atlassian bắt đầu từ một giả định: phần
lớn người dùng truy cập bằng máy tính bảng. Từ giả định đó, nhóm có thể ghi yêu
cầu giao diện phải hiển thị tốt trên máy tính bảng. Mẫu này cũng yêu cầu ghi câu
hỏi còn mở và những gì nằm ngoài phạm vi để tránh sản phẩm tự lớn dần ngoài ý
định ban đầu."

Teacher nói: "Ta đã học xong hai vùng kiến thức đầu tiên: khi nào cần planning
và PRD giữ những quyết định nào. Bây giờ mới đến ba câu kiểm tra ngắn."

[Dùng nhóm `planning-prd-check` trong
`course/quizzes/module-1.quiz.json`. Mở Assessment State cho từng câu và hỏi
đúng một câu mỗi lượt. Sau khi Learner trả lời, đưa lời giải cùng nguồn của câu
đó rồi mới tiếp tục. Đây là ba câu kiểm tra đầu tiên của module. Khi hoàn tất,
lưu checkpoint `m1-prd-concept`.]

## Bước 4 — Hiểu prompt trước khi tự viết (`m1-prd-interview`)

Teacher nói: "Bây giờ bạn đã biết PRD cần làm rõ điều gì. Bước tiếp theo là
viết prompt để coding agent giúp bạn tạo PRD. Prompt là lời giao việc cho coding
agent. Prompt engineering là cách làm lời giao việc đó đủ rõ để agent hiểu đúng
và trả lại kết quả bạn có thể kiểm tra."

Teacher nói: "Thay vì nhớ các nhãn khó hiểu, hãy trả lời năm câu hỏi:

1. Bạn muốn coding agent giúp làm việc gì?
2. Coding agent cần biết những thông tin nào?
3. Coding agent nên làm việc với bạn như thế nào?
4. Coding agent không được tự làm điều gì?
5. Kết quả cuối cùng cần có những gì?"

Teacher nói: "Tài liệu chính thức của OpenAI cũng khuyên prompt nên nêu rõ mục
tiêu, bối cảnh, ràng buộc, bằng chứng cần có, tiêu chí thành công và định dạng
đầu ra. Một ví dụ chính thức yêu cầu agent xem xét kế hoạch chuyển dữ liệu, tìm
nguy cơ gây mất dữ liệu hoặc gián đoạn, dẫn lại bước liên quan và trả về năm rủi
ro quan trọng nhất theo thứ tự. Ví dụ đó cho thấy agent biết việc cần làm, điều
cần tìm và kết quả phải trình bày ra sao. Năm câu hỏi của khóa học là cách diễn
đạt lại nguyên tắc này cho người mới."

Teacher nói: "Áp dụng vào ContentPilot: việc cần làm là hỗ trợ tạo PRD. Thông
tin ban đầu là ý tưởng một câu. Cách làm việc là hỏi một câu mỗi lượt. Agent
không được tự quyết định thay bạn hoặc viết code. Kết quả cuối là PRD một trang
có đủ tám phần."

Teacher nói: "Bạn đã học xong prompt engineering. Bây giờ là ba câu kiểm tra
ngắn trước khi bạn tự viết prompt cho ContentPilot."

[Dùng nhóm `prompt-check` trong `course/quizzes/module-1.quiz.json`. Mở
Assessment State cho từng câu và hỏi đúng một câu mỗi lượt. Sau mỗi câu, đưa
lời giải cùng nguồn. Khi hoàn tất ba câu, yêu cầu Learner tự viết prompt bằng
lời của họ. Dùng hint ladder, không đưa prompt hoàn chỉnh trước khi Learner
thử. Prompt đạt khi nói rõ việc cần làm, thông tin agent cần biết, cách làm việc
một câu mỗi lượt, điều agent không được tự làm và kết quả PRD một trang có tám
phần. Sau khi đạt, Executor dùng nguyên văn prompt của Learner và hỏi đúng một
câu mỗi lượt. Tiếp tục cho tới khi đủ thông tin rồi đưa bản nháp PRD. Lưu
checkpoint `m1-prd-interview`.]

## Bước 5 — Xem xét, duyệt và lưu PRD (`m1-prd-approved`)

Teacher nói: "Trước khi duyệt PRD, hãy kiểm tra: có đủ ý tưởng, luồng sử dụng,
đầu vào, đầu ra, phạm vi phiên bản 1, ngoài phạm vi, Done When và câu hỏi còn mở
không; Done When có quan sát và kiểm tra được không; tài liệu có tránh chi tiết
code không. Bạn muốn duyệt, yêu cầu điều chỉnh hay từ chối bản nháp này?"

[Dừng chờ quyết định. Nếu Learner yêu cầu sửa, Executor chỉ sửa nội dung được
nêu rồi quay lại bước xem xét. Không chấp nhận một PRD có câu hỏi quan trọng bị
giấu trong giả định. Khi nội dung đạt, yêu cầu Learner dùng lời rõ ràng “Duyệt
và lưu PRD” để cho phép tạo `artifacts/PRD.md` từ mẫu
`artifacts/PRD.template.md`. Kiểm tra file sau khi ghi. Lưu checkpoint
`m1-prd-approved`.]

## Bước 6 — Hiểu implementation plan trước khi yêu cầu tạo plan
(`m1-implementation-plan`)

Teacher nói: "PRD đã duyệt là nguồn giữ phạm vi sản phẩm. Implementation plan
biến phạm vi đó thành những bước xây dựng có thứ tự. Mỗi bước trong plan của
khóa học cần có bốn điều: mục tiêu, thành phần hoặc file dự kiến, kết quả có thể
quan sát và cách kiểm tra kết quả."

Teacher nói: "Mẫu Task Design Review của Microsoft tách rõ phần trong phạm vi,
ngoài phạm vi, phương án thực hiện, thành phần cần thay đổi và câu hỏi còn mở.
Khóa học dùng phiên bản ngắn hơn cho người mới, nhưng giữ nguyên mục đích: mỗi
bước phải giải thích nó phục vụ yêu cầu nào và sẽ được kiểm tra ra sao."

Teacher nói: "Quay lại ví dụ máy tính bảng của Atlassian: nếu PRD yêu cầu giao
diện hiển thị tốt trên máy tính bảng, plan có thể có một bước chỉnh bố cục và
một phép kiểm tra ở chiều rộng máy tính bảng. PRD nói kết quả sản phẩm cần đạt;
plan nói cách tạo và kiểm tra kết quả đó."

Teacher nói: "Bạn đã học xong implementation plan. Bây giờ là hai câu kiểm tra
ngắn về phạm vi và cách đối chiếu plan với PRD."

[Dùng nhóm `implementation-plan-check` trong
`course/quizzes/module-1.quiz.json`. Mở Assessment State cho từng câu. Sau mỗi
câu, đưa lời giải cùng nguồn. Khi hoàn tất hai câu, yêu cầu Learner viết prompt
để coding agent đọc `artifacts/PRD.md` và tạo implementation plan. Prompt phải
dùng PRD làm nguồn. Mỗi bước cần có mục tiêu, thành phần, kết quả quan sát và
cách kiểm tra. Prompt cũng phải yêu cầu nêu phụ thuộc, rủi ro, câu hỏi còn mở và
giữ ràng buộc chưa code. Sau khi đạt, Executor đưa bản nháp plan trong hội
thoại; chưa lưu file. Lưu checkpoint `m1-implementation-plan`.]

## Bước 7 — Kiểm tra PRD và plan có khớp nhau (`m1-alignment-review`)

Teacher nói: "Một plan có vẻ chi tiết vẫn có thể sai nếu nó xây thiếu hoặc tự
thêm tính năng. Hãy kiểm tra bốn điều: mọi yêu cầu trong phạm vi PRD đều có bước
tương ứng; mọi bước đều truy ngược về PRD; nội dung ngoài phạm vi không quay trở
lại; và mỗi Done When đều trở thành một phép kiểm tra trong plan."

Teacher nói: "Bây giờ hãy dùng bốn điều trên như một danh sách xem xét. Nếu có
điểm lệch, bạn quyết định sửa PRD hay sửa plan. Coding agent không được âm thầm
chọn thay bạn."

[Đây là bước thực hành có hướng dẫn trên artifact, không phải một câu kiểm tra
thứ ba. Yêu cầu Learner đối chiếu từng mục và tự quyết định cách sửa nếu phát
hiện lệch. Khi cả bốn điều đạt, lưu checkpoint `m1-alignment-review`.]

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

Teacher nói: "Phần kiểm tra cuối giúp bạn vận dụng planning, PRD, prompt và
implementation plan trong những tình huống mới. Phần này có 15 câu: mười câu
lựa chọn, ba câu trả lời ngắn và hai câu dùng chính planning package vừa tạo."

[Dùng nhóm `final-assessment` trong `course/quizzes/module-1.quiz.json`. Hỏi
đúng một câu mỗi lượt. Chỉ hiện lời giải, căn cứ và nguồn sau khi Learner đã trả
lời. Với câu tự luận, yêu cầu Learner viết trước rồi tự đối chiếu với tiêu chí
công khai. Learner cần đạt ít nhất 12/15 câu. Khi pass theo
`course/pedagogy/rubrics/mastery-rubric.vi.md`, lưu checkpoint `m1-mastery`.]

## Bước 10 — Hoàn thành Module 1 (`m1-complete`)

Teacher nói: "Bạn đã biến một ý tưởng một câu thành hai tài liệu đủ rõ để coding
agent bắt đầu xây mà chưa cần bạn biết lập trình. PRD giữ sản phẩm đi đúng
hướng; prompt giúp bạn giao việc rõ ràng; implementation plan biến hướng đó
thành các bước có thể thực hiện và kiểm tra. Ở module tiếp theo, hai tài liệu
này sẽ là điểm xuất phát cho implementation và debugging."

[Xác nhận lại hai artifact và mastery gate. Chạy lệnh complete; hard gate trong
state helper sẽ từ chối nếu thiếu hoặc rỗng một artifact. Chỉ sau khi lệnh thành
công mới thông báo hoàn thành. Không tuyên bố Module 2 đã có trong workspace nếu
course map chưa chứa module đó.]
