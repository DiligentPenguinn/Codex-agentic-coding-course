# Script tĩnh - Module 1: brief Codex như một cộng sự

## Cách dùng

- Đọc các dòng **Teacher nói:** gần như nguyên văn.
- Giọng của Teacher thân thiện, gần gũi, đi thẳng vào việc — không sáo rỗng, không nói như máy.
- Không đưa mẫu hoàn chỉnh trước khi learner thử viết.
- Khi learner trả lời mơ hồ, sửa bằng một câu hỏi hẹp hơn.

## Beat 1 - Vấn đề của prompt mơ hồ

Teacher nói: "Chào bạn quay lại. Module 1 bắt đầu bằng một câu rất dễ viết nhưng khó dùng: `Hãy làm ContentPilot tốt hơn`."

Teacher nói: "Dự đoán trước nhé: nếu Executor nhận câu đó, họ sẽ thiếu thông tin gì?"

[Dừng chờ learner]

Teacher nói: "Đúng hướng rồi. Một brief tốt không chỉ nói muốn gì. Nó cho Codex biết mục tiêu, file hoặc ngữ cảnh cần đọc, ràng buộc, điều kiện xong, và bằng chứng cần trả lại. Hương từng nói mình sẽ bắt đầu chậm hơn em nghĩ — đây chính là lý do."

## Beat 2 - Khung brief

Teacher nói: "Mình dùng năm ô thôi: mục tiêu, ngữ cảnh, ràng buộc, điều kiện xong, bằng chứng. Bạn sẽ điền từng ô cho một task nhỏ: cải thiện Idea Lab trong ContentPilot Lite."

Teacher nói: "Trước tiên, hãy viết một câu mục tiêu thật cụ thể. Chỉ viết mục tiêu thôi, chưa cần viết cả brief."

[Dừng chờ learner]

[Nếu mục tiêu quá rộng, hỏi nhẹ nhàng: "Gần đúng rồi, thu hẹp thêm chút nhé: phần nào của Idea Lab sẽ thay đổi, và người dùng sẽ nhận ra bằng cách nào?"]

## Beat 3 - Ngữ cảnh và ràng buộc

Teacher nói: "Giờ thêm ngữ cảnh: Codex cần đọc file nào để hiểu Idea Lab? Nếu chưa chắc, cứ đoán từ scaffold hiện có."

[Dừng chờ learner]

Teacher nói: "Tiếp theo là ràng buộc. Ở bước đầu, bạn muốn Codex chỉ inspect và lập kế hoạch, hay để nó sửa file luôn?"

[Dừng chờ learner]

Teacher nói: "Nếu còn đang khám phá, chọn inspect và lập kế hoạch trước — đúng luật đầu tiên mình đã học ở Module 0: đọc trước khi sửa."

## Beat 4 - Điều kiện xong và bằng chứng

Teacher nói: "Giờ viết điều kiện xong (`done-when`): bạn sẽ biết task này xong bằng dấu hiệu quan sát được nào?"

[Dừng chờ learner]

Teacher nói: "Cuối cùng, yêu cầu bằng chứng. Ví dụ: file đã đọc, đề xuất theo từng file, rủi ro, và cách kiểm tra thủ công."

Teacher nói: "Giờ ghép năm ô lại thành một brief hoàn chỉnh nhé. Dùng lời của bạn, đừng chép lại nguyên văn câu mẫu của chị."

[Dừng chờ learner]

## Beat 5 - Chia nhỏ task

Teacher nói: "Một brief tốt vẫn có thể quá lớn. Hãy chia brief vừa viết thành ba task nhỏ: inspect và lập kế hoạch; chỉnh một phần nhỏ; kiểm tra kết quả."

[Dừng chờ learner]

[Nếu learner tạo task quá lớn, nói: "Task này vẫn hơi to. Thử chia sao cho mỗi task chỉ có một kết quả quan sát được thôi nhé."]

## Beat 6 - Quiz

Teacher nói: "Giờ mình kiểm tra bằng tình huống mới nhé. Mỗi câu hỏi đi một lượt, và với câu tự luận chị cần ví dụ thật của bạn."

[Dùng `quizzes/module-1.quiz.json`. Hỏi từng câu một.]

## Beat 7 - Kết thúc

Teacher nói: "Bạn pass Module 1 khi brief có mục tiêu rõ, ngữ cảnh đúng file, ràng buộc an toàn, điều kiện xong đo được và bằng chứng để review. Xong phần này, bạn đã có công cụ để giao việc rõ ràng hơn nhiều rồi đó."
