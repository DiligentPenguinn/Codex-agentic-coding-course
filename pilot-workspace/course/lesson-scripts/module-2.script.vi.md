# Kịch bản — Giao tiếp hiệu quả với coding agent: Planning, PRD và prompt

## Bước 1 — Hiểu vì sao planning quan trọng (`m2-why-planning`)

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
sang ý tưởng ContentPilot và lưu checkpoint `m2-why-planning`.]

## Bước 2 — Nhìn ra điều còn thiếu trong ý tưởng ContentPilot (`m2-contentpilot-brief`)

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
Assessment State. Sau đó lưu checkpoint `m2-contentpilot-brief`.]

## Bước 3 — Hiểu PRD trước khi phân loại (`m2-prd-concept`)

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

Teacher nói: "Để coding agent bớt phải đoán, hãy cho nó xem một vài ví dụ phù
hợp. Không cần gom thật nhiều. Mỗi ví dụ cần đi cùng lời giải thích về điều bạn
muốn học theo."

Teacher nói: "Dạng đầu tiên là ví dụ bằng hình ảnh. Bạn có thể dùng ảnh chụp
giao diện hoặc bản thiết kế để cho thấy bố cục và luồng mong muốn. Pinterest
giúp tìm ý tưởng. Mobbin có màn hình và luồng từ sản phẩm thật. Dribbble có các
bản thiết kế giao diện. OpenAI Docs cũng khuyên dùng ảnh rõ ràng và đưa thêm
những trạng thái thật sự cần thiết."

Teacher nói: "Dạng thứ hai là ví dụ bằng code. Đó có thể là một đoạn HTML, một
thành phần giao diện hoặc repository có cách làm gần với điều bạn muốn. Hãy chỉ
đúng tệp hoặc đoạn cần xem. Sau đó, nói rõ bạn muốn học theo cách sắp xếp hay
cách phần đó hoạt động. Ví dụ này không bắt coding agent dùng cùng cách xây.
Repository công khai không tự động có nghĩa là được phép sao chép code, vì vậy
hãy kiểm tra giấy phép trước khi dùng lại."

Teacher nói: "Bạn có thể đặt ảnh hoặc đường dẫn ngay dưới yêu cầu liên quan
trong PRD. Ví dụ giúp làm rõ yêu cầu; ví dụ không thay thế cho việc nói rõ mục
tiêu, phạm vi và Done When."

Teacher nói: "Ta đã học xong hai vùng kiến thức đầu tiên: khi nào cần planning
và cách làm PRD rõ hơn. Bây giờ mới đến ba câu kiểm tra ngắn."

[Dùng nhóm `planning-prd-check` trong
`course/quizzes/module-2.quiz.json`. Mở Assessment State cho từng câu và hỏi
đúng một câu mỗi lượt. Sau khi Learner trả lời, đưa lời giải cùng nguồn của câu
đó rồi mới tiếp tục. Đây là ba câu kiểm tra đầu tiên của module. Khi hoàn tất,
lưu checkpoint `m2-prd-concept`.]

## Bước 4 — Hiểu prompt trước khi tự viết (`m2-prd-interview`)

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

[Dùng nhóm `prompt-check` trong `course/quizzes/module-2.quiz.json`. Mở
Assessment State cho từng câu và hỏi đúng một câu mỗi lượt. Sau mỗi câu, đưa
lời giải cùng nguồn. Khi hoàn tất ba câu, lưu checkpoint `m2-prd-interview`.
Chưa yêu cầu Learner viết prompt, chưa mở cuộc phỏng vấn và chưa tạo artifact;
các hành động đó thuộc Practice duy nhất ở Bước 6.]

## Bước 5 — Hiểu implementation plan trước khi yêu cầu tạo plan
(`m2-implementation-plan`)

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

Teacher nói: "Khi đối chiếu hai tài liệu, hãy kiểm tra bốn điều: mọi yêu cầu
trong phạm vi PRD đều có bước tương ứng; mọi bước đều truy ngược về PRD; nội
dung ngoài phạm vi không quay trở lại; và mỗi Done When đều trở thành một phép
kiểm tra trong plan. Trong Practice, chính bạn sẽ dùng bốn điều này để quyết
định sửa PRD hay sửa plan nếu hai tài liệu lệch nhau."

[Dùng nhóm `implementation-plan-check` trong
`course/quizzes/module-2.quiz.json`. Mở Assessment State cho từng câu. Sau mỗi
câu, đưa lời giải cùng nguồn. Khi hoàn tất hai câu, lưu checkpoint
`m2-implementation-plan`. Chưa yêu cầu tạo plan hoặc sửa file; mọi thao tác với
artifact thuộc Practice ở bước tiếp theo.]

## Bước 6 — Hoàn thành một Practice planning package (`m2-planning-package`)

Teacher nói: "Bạn đã học xong cả ba phần và hoàn thành đủ 3 + 3 + 2 câu kiểm
tra. Bây giờ ta chuyển sang một Practice duy nhất, có thể tạm dừng và tiếp tục.
Trong Practice này, bạn sẽ biến ý tưởng ContentPilot thành PRD và implementation
plan đã duyệt mà chưa viết code."

Teacher nói: "Course Companion sẽ tạo task Executor với model, mức suy luận và
speed đã được Triết duyệt ở Module 1. Task này dùng approval `on-request`, chỉ
được ghi trong workspace và không bật Full access. Bạn không cần chụp ảnh hay
nhập lại cấu hình. Nếu chưa có receipt cấu hình Module 1 hoặc metadata hiệu lực
không an toàn, Course Companion sẽ dừng trước khi gửi bất kỳ prompt nào và hướng
bạn quay lại bước thiết lập."

Teacher nói: "Practice có tám bước nối tiếp nhau: tự viết prompt tạo PRD; hoàn
thành phỏng vấn từng câu; xem xét, duyệt và lưu PRD; yêu cầu tạo plan từ PRD;
đối chiếu bốn điểm alignment; duyệt và lưu plan; giải thích một quyết định phạm
vi rồi yêu cầu Triết duyệt; cuối cùng quay lại khóa học. Course Companion giữ
trạng thái từng bước, nên nếu tạm dừng bạn sẽ tiếp tục tại bước chưa hoàn thành
đầu tiên."

[Mở Practice `m2-planning-package` phiên bản `2.0.0`. Không thực hiện các hành
động dưới đây trong thread dạy học. Bên trong đúng Practice run hiện tại:

1. Learner tự viết prompt tạo PRD bằng lời của họ. Dùng hint ladder, không đưa
   prompt hoàn chỉnh trước khi Learner thử. Prompt đạt khi nói rõ việc cần làm,
   thông tin agent cần biết, cách làm việc một câu mỗi lượt, điều agent không
   được tự làm và kết quả PRD một trang có tám phần.
2. Executor dùng nguyên văn prompt của Learner và hỏi đúng một câu mỗi lượt.
   Tiếp tục tới khi đủ thông tin rồi đưa bản nháp PRD để review.
3. Learner kiểm tra đủ tám phần, Done When, câu hỏi còn mở và ràng buộc chưa
   code. Chỉ sau lời duyệt rõ ràng “Duyệt và lưu PRD” mới tạo
   `artifacts/PRD.md`. Nếu Learner yêu cầu sửa, chỉ sửa nội dung họ nêu rồi quay
   lại review.
4. Learner yêu cầu Executor đọc PRD đã duyệt làm nguồn phạm vi duy nhất và tạo
   bản nháp implementation plan. Mỗi bước phải có mục tiêu, thành phần hoặc file
   dự kiến, kết quả quan sát, cách kiểm tra, phụ thuộc và yêu cầu PRD liên quan;
   plan phải nêu rủi ro, giả định, câu hỏi mở, kiểm tra end-to-end và chưa code.
5. Learner đối chiếu bốn điểm alignment. Nếu lệch, Learner quyết định sửa đúng
   tài liệu; Executor không được âm thầm chọn thay.
6. Chỉ sau lời duyệt rõ ràng “Duyệt và lưu implementation plan” mới tạo
   `artifacts/implementation-plan.md`.
7. Learner giải thích bằng lời của mình ít nhất một quyết định phạm vi rồi yêu
   cầu Triết duyệt. Triết chỉ đọc gói bằng chứng đã giới hạn gồm hai artifact,
   digest hiện tại, phê duyệt, alignment, quyết định phạm vi và provenance của
   task; Triết không dùng công cụ và không sửa file. Nếu review chưa đạt hoặc
   artifact thay đổi, giữ cùng run và quay lại bước đầu tiên bị stale.
8. Chỉ khi review semantic đạt trên đúng hai digest hiện tại mới cho phép quay
   lại khóa học. Khi quay lại, lưu checkpoint `m2-planning-package` và mở phần
   kiểm tra cuối.]

## Bước 7 — Kiểm tra cuối Module 2 (`m2-mastery`)

Teacher nói: "Phần kiểm tra cuối giúp bạn vận dụng planning, PRD, prompt và
implementation plan trong những tình huống mới. Phần này có 15 câu: mười câu
lựa chọn, ba câu trả lời ngắn và hai câu dùng chính planning package vừa tạo."

[Dùng nhóm `final-assessment` trong `course/quizzes/module-2.quiz.json`. Hỏi
đúng một câu mỗi lượt. Chỉ hiện lời giải, căn cứ và nguồn sau khi Learner đã trả
lời. Với câu tự luận, yêu cầu Learner viết trước rồi tự đối chiếu với tiêu chí
công khai. Learner cần đạt ít nhất 12/15 câu. Khi pass theo
`course/pedagogy/rubrics/mastery-rubric.vi.md`, lưu checkpoint `m2-mastery`.]

## Bước 8 — Hoàn thành Module 2 (`m2-complete`)

Teacher nói: "Bạn đã biến một ý tưởng một câu thành hai tài liệu đủ rõ để coding
agent bắt đầu xây mà chưa cần bạn biết lập trình. PRD giữ sản phẩm đi đúng
hướng; prompt giúp bạn giao việc rõ ràng; implementation plan biến hướng đó
thành các bước có thể thực hiện và kiểm tra. Ở module tiếp theo, hai tài liệu
này sẽ là điểm xuất phát cho implementation và debugging."

[Xác nhận receipt của Practice chứng minh hai artifact, phê duyệt, alignment,
quyết định phạm vi và semantic review đều đạt trên đúng run hiện tại. Xác nhận
Learner đạt ít nhất 12/15 câu và checkpoint `m2-mastery`. Chạy lệnh complete;
hard gate trong progress repository sẽ từ chối nếu thiếu Practice pass hoặc
mastery score. Chỉ sau khi lệnh thành công mới thông báo hoàn thành.]
