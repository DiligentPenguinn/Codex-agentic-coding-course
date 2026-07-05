# Script tĩnh - Module 0: định hướng dùng Codex như cộng sự làm việc

## Cách dùng

- Đọc các dòng **Teacher nói:** gần như nguyên văn.
- Mỗi lần chỉ hỏi một câu hoặc giao một hành động.
- Với câu dự đoán, nói rõ đó là dự đoán; không chấm như kiến thức đã học.

## Beat 1 - Khởi động

Teacher nói: "Nhớ luật đầu tiên ở cảnh mở đầu không? Đọc trước khi sửa. Hôm nay mình biến luật đó thành một thao tác thật: bước vào một repo mới mà vẫn giữ quyền kiểm soát."

Teacher nói: "Bạn có bao nhiêu phút cho Module 0: 20, 30 hay 45?"

[Dừng chờ learner]

Teacher nói: "Mục tiêu của Module 0 rất cụ thể: cuối bài, bạn viết được một prompt yêu cầu Codex inspect repo ở chế độ chỉ đọc trước khi sửa bất kỳ file nào."

## Beat 2 - Dự đoán trước khi inspect

Teacher nói: "Dự đoán trước nhé: khi mở một repo lạ, hành động đầu tiên của Executor nên là gì?"

[Dừng chờ learner]

[Nếu learner muốn sửa ngay, dùng gợi ý: "Nếu bạn giao việc cho một cộng sự kỹ thuật mới, trước khi họ sửa, bạn muốn họ đọc hoặc kiểm tra gì?"]

Teacher nói: "Hướng đúng là đọc trước khi sửa. Trong Codex, mình gọi bước này là inspect repo ở chế độ chỉ đọc: liệt kê cấu trúc, đọc file quan trọng và tóm tắt rủi ro mà không thay đổi gì."

## Beat 3 - Prompt inspect repo

Teacher nói: "Bây giờ bạn viết prompt đầu tiên. Prompt cần có bốn phần: mục tiêu, ngữ cảnh, ràng buộc chỉ đọc, và điều kiện xong. Trong nhiều tài liệu, điều kiện xong còn được gọi là `done-when`."

Teacher nói: "Hãy viết phiên bản của bạn trong 4-6 dòng. Đừng chép câu mẫu; hãy dùng lời của bạn."

[Dừng chờ learner]

[Nếu learner thiếu ràng buộc chỉ đọc, hỏi: "Dòng nào trong prompt của bạn ngăn Executor sửa file quá sớm?"]

## Beat 4 - Approval

Teacher nói: "Tiếp theo là phê duyệt, hay `approval`. Một hành động chỉ đọc thường an toàn hơn. Một hành động sửa file, cài gói phụ thuộc, dùng mạng hoặc xóa dữ liệu cần dừng lại và hỏi bạn trước."

Teacher nói: "Mình hỏi từng tình huống. Hành động `đọc README` cần phê duyệt trước không?"

[Dừng chờ learner]

Teacher nói: "Hành động `sửa README` cần phê duyệt trước không?"

[Dừng chờ learner]

Teacher nói: "Hành động `cài package từ internet` cần phê duyệt trước không?"

[Dừng chờ learner]

## Beat 5 - Teacher và Executor

Teacher nói: "Ở cảnh mở đầu, chị đã tách hai vai: chị là Teacher, Codex là Executor, còn bạn giữ mục tiêu. Bây giờ mình thực hành tách đó bằng hai request thật."

Teacher nói: "Hãy viết một request cho Teacher và một request cho Executor cho cùng tình huống: bạn muốn cải thiện ContentPilot Lite nhưng chưa biết bắt đầu từ đâu."

[Dừng chờ learner]

[Nếu hai request giống nhau, yêu cầu learner sửa Executor request để có file, hành động được phép và điều kiện kiểm tra.]

## Beat 6 - Exit ticket

Teacher nói: "Mình sẽ kiểm tra mastery bằng từng câu một. Mục tiêu không phải nhớ câu chữ của mình, mà là áp dụng vào tình huống mới."

[Dùng `quizzes/module-0.quiz.json`. Hỏi từng câu một. Nếu câu tự luận giống hệt lời Teacher trước đó, yêu cầu learner viết lại bằng repo hoặc tình huống riêng.]

## Beat 7 - Kết thúc

Teacher nói: "Bạn pass Module 0 khi làm được ba việc: yêu cầu inspect chỉ đọc, nhận diện hành động cần phê duyệt, và tách được Teacher khỏi Executor. Nếu phần nào chưa chắc, mình sẽ cho một bài sửa ngắn trước khi sang Module 1."
