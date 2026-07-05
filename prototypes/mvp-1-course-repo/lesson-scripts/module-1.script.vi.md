# Script tĩnh - Module 1: brief Codex như một cộng sự

## Cách dùng

- Đọc các dòng **Teacher nói:** gần như nguyên văn.
- Không đưa mẫu hoàn chỉnh trước khi learner thử viết.
- Khi learner trả lời mơ hồ, sửa bằng một câu hỏi hẹp hơn.

## Beat 1 - Vấn đề của prompt mơ hồ

Teacher nói: "Module 1 bắt đầu bằng một câu rất dễ viết nhưng khó dùng: `Hãy làm ContentPilot tốt hơn`."

Teacher nói: "Dự đoán trước nhé: nếu Executor nhận câu đó, họ sẽ thiếu thông tin gì?"

[Dừng chờ learner]

Teacher nói: "Đúng hướng. Một brief tốt không chỉ nói muốn gì. Nó cho Codex biết mục tiêu, file hoặc ngữ cảnh cần đọc, ràng buộc, điều kiện xong, và bằng chứng cần trả lại. Hương từng nói mình sẽ bắt đầu chậm hơn em nghĩ — đây là lý do."

## Beat 2 - Khung brief

Teacher nói: "Mình dùng năm ô: mục tiêu, ngữ cảnh, ràng buộc, điều kiện xong, bằng chứng. Bạn sẽ điền từng ô cho một task nhỏ: cải thiện Idea Lab trong ContentPilot Lite."

Teacher nói: "Trước tiên, hãy viết một câu mục tiêu cụ thể. Chỉ viết mục tiêu, chưa viết cả brief."

[Dừng chờ learner]

[Nếu mục tiêu quá rộng, hỏi: "Phần nào của Idea Lab sẽ thay đổi, và người dùng sẽ nhận ra bằng cách nào?"]

## Beat 3 - Ngữ cảnh và ràng buộc

Teacher nói: "Bây giờ thêm ngữ cảnh: Codex cần đọc file nào để hiểu Idea Lab? Nếu chưa chắc, hãy đoán từ scaffold hiện có."

[Dừng chờ learner]

Teacher nói: "Tiếp theo là ràng buộc. Ở bước đầu, bạn muốn Codex chỉ inspect và lập kế hoạch, hay được sửa file luôn?"

[Dừng chờ learner]

Teacher nói: "Nếu còn đang khám phá, chọn inspect và lập kế hoạch trước — đúng luật đầu tiên mình đã học ở Module 0: đọc trước khi sửa."

## Beat 4 - Điều kiện xong và bằng chứng

Teacher nói: "Bây giờ viết điều kiện xong (`done-when`): bạn sẽ biết task này xong bằng dấu hiệu quan sát được nào?"

[Dừng chờ learner]

Teacher nói: "Cuối cùng, yêu cầu bằng chứng. Ví dụ: file đã đọc, đề xuất theo từng file, rủi ro, và cách kiểm tra thủ công."

Teacher nói: "Hãy ghép năm ô thành một brief hoàn chỉnh. Dùng lời của bạn, không chép lại nguyên văn câu mẫu."

[Dừng chờ learner]

## Beat 5 - Chia nhỏ task

Teacher nói: "Một brief tốt vẫn có thể quá lớn. Hãy chia brief vừa viết thành ba task nhỏ: inspect và lập kế hoạch; chỉnh một phần nhỏ; kiểm tra kết quả."

[Dừng chờ learner]

[Nếu learner tạo task quá lớn, yêu cầu mỗi task chỉ có một kết quả quan sát được.]

## Beat 6 - Quiz

Teacher nói: "Mình sẽ kiểm tra bằng tình huống mới. Mỗi câu hỏi sẽ đi một lượt, và với câu tự luận mình cần ví dụ của bạn."

[Dùng `quizzes/module-1.quiz.json`. Hỏi từng câu một.]

## Beat 7 - Kết thúc

Teacher nói: "Bạn pass Module 1 khi brief có mục tiêu rõ, ngữ cảnh đúng file, ràng buộc an toàn, điều kiện xong đo được và bằng chứng để review."
