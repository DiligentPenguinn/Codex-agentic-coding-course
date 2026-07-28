# Mastery Rubric - Vietnamese First

Rubric này đánh giá năng lực cộng tác với Codex, không đánh giá kiến thức lập trình thuần túy. Teacher dùng rubric để quyết định learner có thể sang submodule tiếp theo hay cần luyện thêm.

## Thang điểm

- **0 - Chưa thấy bằng chứng**: learner chưa thử hoặc câu trả lời không liên quan.
- **1 - Nhận diện có hỗ trợ**: learner làm được khi Teacher gợi ý nhiều.
- **2 - Làm được có kiểm tra**: learner làm được với gợi ý nhẹ và biết nêu bằng chứng.
- **3 - Tự chủ**: learner tự đưa yêu cầu rõ, phân loại rủi ro, kiểm tra kết quả, và giải thích được.

## Kỹ năng cốt lõi của Module 0

| Skill | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| Repo inspection before edits | Yêu cầu sửa ngay hoặc không biết cần inspect | Chấp nhận inspect khi Teacher nhắc | Viết được prompt inspect read-only có done-when | Tự yêu cầu inspect, giới hạn phạm vi, và nêu bằng chứng cần thấy |
| Prompt structure | Prompt mơ hồ, thiếu mục tiêu | Có goal nhưng thiếu context/constraints | Có goal, context, constraints, done-when | Tự chia task lớn thành prompt nhỏ để review được |
| Approval awareness | Không phân biệt hành động rủi ro | Nhận ra một vài hành động cần approval | Phân loại được read-only, edit, network, destructive | Tự dừng lại và hỏi approval trước hành động rủi ro |
| Teacher vs Executor | Lẫn lộn hỏi để hiểu và hỏi để làm | Phân biệt khi có ví dụ | Viết được 2 request: explain và action | Biết lúc nào cần Teacher coach, lúc nào cần Executor thực thi |
| Evidence review | Tin vào tóm tắt chung chung | Hỏi lại Teacher "đã xong chưa" | Kiểm tra file/log/diff/test theo hướng dẫn | Tự nêu bằng chứng cần có và tóm tắt kết quả |
| Reflection and transfer | Không nói lại được bài học | Lặp lại định nghĩa | Giải thích được bằng ví dụ của lesson | Chuyển kỹ năng sang tình huống marketing/content khác |

## Mastery gate cho Module 0

Learner pass Module 0 khi đạt tất cả điều kiện:

- Đạt mức 2 trở lên ở 4/6 skill.
- Không skill nào ở mức 0.
- Viết được prompt đầu tiên yêu cầu Codex inspect repo trước khi sửa.
- Phân loại đúng ít nhất 4/5 hành động: read-only, file edit, network, dependency install, destructive action.
- Giải thích bằng một đoạn ngắn sự khác nhau giữa Teacher và Executor.

## Feedback mẫu

### Nếu learner đạt

"Bạn đã đạt Module 0. Bằng chứng là: prompt inspect của bạn có goal/context/constraint/done-when, bạn phân loại đúng các approval risk chính, và bạn giải thích được lúc nào cần Teacher vs Executor. Bước tiếp theo là Module 1: tạo Brand Brain đầu tiên."

### Nếu learner gần đạt

"Bạn gần đạt rồi. Điểm cần luyện là approval awareness: bạn nhận ra file edit, nhưng chưa nhận ra network và dependency install cũng cần dừng lại. Ta sẽ làm một bài phân loại 3 phút trước khi sang Module 1."

### Nếu learner chưa đạt

"Mình chưa sang module tiếp theo với tâm lý an toàn được. Không sao. Ta quay lại prompt đầu tiên: Codex nên đọc gì, không được làm gì, và bằng chứng nào sẽ cho thấy nó đã inspect xong?"
