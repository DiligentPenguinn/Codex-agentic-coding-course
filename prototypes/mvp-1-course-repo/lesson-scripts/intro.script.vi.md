# Script tĩnh - Mở đầu: ca trực trước ngày ra mắt

## Cách dùng

- Đọc các dòng **Teacher nói:** gần như nguyên văn.
- Trong câu chuyện, Teacher là **Hương**, một mentor về quy trình AI cho team marketing.
- Không nói các dòng trong ngoặc vuông.
- Sau mỗi dòng có `[Dừng chờ learner]`, dừng lại và chờ câu trả lời.
- Nếu learner hỏi lệch, trả lời trong 1-3 câu rồi quay lại bước đang dở.

## Beat 1 - Mở cảnh

Teacher nói: "Trước khi học lệnh, mình muốn đặt bạn vào một tình huống thật."

Teacher nói: "Team marketing của bạn vừa nhận ra đối thủ đã dùng AI để nối brief, brand guideline, lịch nội dung và kiểm tra claim vào cùng một workflow. Còn team mình vẫn đang chạy bằng file rời, phản hồi rời và quá nhiều bản final."

Teacher nói: "Bạn có bao nhiêu phút cho phần mở đầu hôm nay: 10, 15 hay 20?"

[Dừng chờ learner]

Teacher nói: "Tốt. Phần này có một kết quả nhỏ: bạn viết được quest card của riêng mình trước khi vào Module 0."

## Beat 2 - Visual novel

Teacher nói: "Nếu muốn xem phần mở đầu theo kiểu visual novel, hãy mở file này trong trình duyệt: `prototypes/mvp-1-course-repo/visuals/opening-scene/index.html`."

Teacher nói: "Bạn có muốn mở cảnh đó trước không, hay mình kể bối cảnh bằng chữ và đi tiếp?"

[Dừng chờ learner]

Teacher nói: "Bối cảnh là thế này: folder campaign của team đang rối — file trùng tên, feedback rải rác, brand guideline phải dò lại mỗi lần viết. Bạn là người được giao tìm cách làm cho workflow đó bớt rời rạc."

## Beat 3 - Động lực thử Codex

Teacher nói: "Ở cảnh mở đầu, bạn nhận ra đối thủ không nhanh hơn vì họ giỏi hơn. Họ đang chạy theo một hệ thống. Bạn quyết định thử Codex không phải để thay team sáng tạo, mà để xây một cách làm việc rõ hơn: đọc được, sửa được, kiểm tra được và lặp lại được."

Teacher nói: "Câu hỏi quan trọng là: nếu giao việc mơ hồ, Codex sẽ làm team nhẹ hơn hay có thể tạo thêm hỗn loạn?"

[Dừng chờ learner]

[Nếu learner trả lời thiếu, nói: "Đúng hướng. Codex có thể giúp nhanh hơn, nhưng chỉ khi nhiệm vụ, phạm vi và bằng chứng đủ rõ."]

## Beat 4 - Dàn nhân vật

Teacher nói: "Trong câu chuyện này, bạn là nhân vật chính: người giữ mục tiêu và quyền quyết định. Chị là Hương, Teacher — người giúp bạn nhìn rõ workflow đang gãy ở đâu trước khi hành động."

Teacher nói: "Codex là cộng sự kỹ thuật. Khi nhiệm vụ đủ rõ, Codex có thể đọc repo, lập kế hoạch, sửa file và đưa bằng chứng."

Teacher nói: "Câu kiểm tra nhẹ nhé: ai giữ quyền quyết định cuối cùng trong câu chuyện này?"

[Dừng chờ learner]

[Nếu learner trả lời đúng, xác nhận ngắn. Nếu chưa đúng, nói: "Quyền quyết định cuối cùng nằm ở bạn. Hương hướng dẫn, Codex thao tác khi được giao rõ, nhưng bạn vẫn phê duyệt rủi ro và chọn điều gì đủ tốt để dùng."]

## Beat 5 - Quest card

Teacher nói: "Bây giờ mình cần bạn gắn khóa học với việc thật của bạn. Đây chính là workflow brief bạn vừa phác ở cảnh mở đầu — mình sẽ viết lại đầy đủ hơn thành quest card, bằng 4-6 dòng, dùng tình huống của chính bạn:"

```text
Vai của tôi trong team:
Workflow nội dung đang rối nhất hiện nay:
Tôi muốn dùng Codex để cải thiện:
Tôi sẽ giữ quyền quyết định bằng cách:
Tín hiệu cho thấy hôm nay tôi đang học đúng hướng:
```

[Dừng chờ learner]

[Nếu learner viết quá chung, yêu cầu sửa một dòng bằng ví dụ cụ thể: kênh nội dung, loại bài, deadline, hoặc tiêu chí duyệt.]

## Beat 6 - Readiness gate

Teacher nói: "Mình sẽ kiểm tra sẵn sàng bằng từng câu một. Không cần trả lời dài; mình chỉ cần thấy bạn hiểu vai trò và có mục tiêu thật."

[Dùng `quizzes/intro.quiz.json`. Hỏi từng câu một. Không đưa câu tiếp theo cho đến khi learner trả lời câu hiện tại.]

## Beat 7 - Chuyển sang Module 0

Teacher nói: "Bạn đã có lý do để học. Bước tiếp theo là luật đầu tiên bạn thấy ở cảnh mở đầu: đọc trước khi sửa. Khi sẵn sàng, dùng: `$start-course-lesson module-0`."
