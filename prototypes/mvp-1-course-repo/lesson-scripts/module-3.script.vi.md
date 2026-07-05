# Script tĩnh - Module 3: spec trước khi code

## Cách dùng

- Đọc các dòng **Teacher nói:** gần như nguyên văn.
- Giọng của Teacher thân thiện, gần gũi, đi thẳng vào việc — không sáo rỗng, không nói như máy.
- Không để learner approve sửa code trước khi có spec tối thiểu.
- Với mọi ý tưởng quá lớn, kéo về một lát cắt nhỏ có thể kiểm tra.

## Beat 1 - Lý do cần spec

Teacher nói: "Chào bạn quay lại. Module 3 quay lại đúng khoảnh khắc ở cảnh mở đầu: bạn hỏi chị 'Không xây tính năng ngay?', và chị trả lời 'Chưa.' Hôm nay mình học cách trả lời câu đó bằng một plan thật, không phải bằng cảm giác."

Teacher nói: "Dự đoán trước nhé: nếu bảo Codex `thêm trạng thái Approved cho ideas` mà không nói gì thêm, phần nào dễ bị hiểu sai?"

[Dừng chờ learner]

Teacher nói: "Đúng đó — dễ sai ở dữ liệu, giao diện, điều kiện hoàn thành và phạm vi. Vì vậy trước khi code, mình viết mini PRD."

## Beat 2 - Mini PRD

Teacher nói: "Mini PRD của chị có năm phần: mục tiêu, việc không làm (`non-goals`), câu chuyện người dùng, tiêu chí chấp nhận và kiểm tra thủ công. Việc không làm là phần mình cố ý loại khỏi phạm vi."

Teacher nói: "Hãy viết mục tiêu một câu cho cải tiến nhỏ bạn muốn làm trong ContentPilot Lite."

[Dừng chờ learner]

Teacher nói: "Giờ viết thêm hai việc không làm. Đây là phần giữ cho task không biến thành thiết kế lại toàn bộ app."

[Dừng chờ learner]

## Beat 3 - Acceptance criteria

Teacher nói: "Tiếp theo là tiêu chí chấp nhận: điều kiện để bạn nhìn vào app hoặc file và nói `đúng, việc này xong`."

Teacher nói: "Hãy viết hai tiêu chí chấp nhận cho cải tiến của bạn. Mỗi tiêu chí phải quan sát hoặc kiểm tra được."

[Dừng chờ learner]

[Nếu tiêu chí mơ hồ, hỏi: "Còn hơi mơ hồ đó. Bạn sẽ kiểm tra tiêu chí đó ở đâu: màn hình, file dữ liệu, hay hành vi khi bấm?"]

## Beat 4 - Implementation slices

Teacher nói: "Giờ mới đến kế hoạch code. Hãy yêu cầu Codex đề xuất các lát cắt triển khai theo file, nhưng chưa sửa file gì cả — đúng luật đầu tiên: đọc và lập kế hoạch trước."

Teacher nói: "Viết một câu yêu cầu gồm: file list dự kiến, rủi ro, thứ tự làm, và cách kiểm tra."

[Dừng chờ learner]

## Beat 5 - Approval gate

Teacher nói: "Trước khi approve Executor sửa code, bạn cần nhìn thấy ba thứ: phạm vi file, rủi ro chính và cách rollback hoặc kiểm tra lại."

Teacher nói: "Với kế hoạch vừa có, bạn sẽ phê duyệt ngay, yêu cầu sửa lại plan, hay từ chối? Nói lý do bằng một câu thôi."

[Dừng chờ learner]

## Beat 6 - Quiz

Teacher nói: "Giờ mình kiểm tra bằng tình huống mới nhé. Mỗi câu đi một lượt; câu tự luận cần quyết định thật của bạn, không cần dài."

[Dùng `quizzes/module-3.quiz.json`. Hỏi từng câu một.]

## Beat 7 - Kết thúc

Teacher nói: "Bạn pass Module 3 khi biết viết spec đủ nhỏ, có việc không làm, có tiêu chí kiểm tra, và chưa cho Executor sửa code trước khi kế hoạch đủ rõ. Từ đây, mỗi lần có ý tưởng mới, bạn đã có cách giữ nó trong tầm kiểm soát."
