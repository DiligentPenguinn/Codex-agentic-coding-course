# Tiêu chí đánh giá mức độ thành thạo

Bảng tiêu chí này đánh giá năng lực cộng tác với Codex, không đánh giá kiến
thức lập trình thuần túy. Teacher dùng bảng để quyết định learner đã hoàn thành
module hay cần luyện thêm.

## Thang điểm

- **0 - Chưa thấy bằng chứng**: learner chưa thử hoặc câu trả lời không liên quan.
- **1 - Nhận diện có hỗ trợ**: learner làm được khi Teacher gợi ý nhiều.
- **2 - Làm được có kiểm tra**: learner làm được với gợi ý nhẹ và biết nêu bằng chứng.
- **3 - Tự chủ**: learner tự đưa yêu cầu rõ, phân loại rủi ro, kiểm tra kết quả, và giải thích được.

## Kỹ năng agentic coding cốt lõi của Module 1

| Skill | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| Repo inspection before edits | Yêu cầu sửa ngay hoặc không biết cần inspect | Chấp nhận inspect khi Teacher nhắc | Viết được prompt inspect read-only có done-when | Tự yêu cầu inspect, giới hạn phạm vi, và nêu bằng chứng cần thấy |
| Prompt structure | Prompt mơ hồ, thiếu mục tiêu | Có goal nhưng thiếu context/constraints | Có goal, context, constraints, done-when | Tự chia task lớn thành prompt nhỏ để review được |
| Approval awareness | Không phân biệt hành động rủi ro | Nhận ra một vài hành động cần approval | Phân loại được read-only, edit, network, destructive | Tự dừng lại và hỏi approval trước hành động rủi ro |
| Teacher vs Executor | Lẫn lộn hỏi để hiểu và hỏi để làm | Phân biệt khi có ví dụ | Viết được 2 request: explain và action | Biết lúc nào cần Teacher coach, lúc nào cần Executor thực thi |
| Evidence review | Tin vào tóm tắt chung chung | Hỏi lại Teacher "đã xong chưa" | Kiểm tra file/log/diff/test theo hướng dẫn | Tự nêu bằng chứng cần có và tóm tắt kết quả |
| Reflection and transfer | Không nói lại được bài học | Lặp lại định nghĩa | Giải thích được bằng ví dụ của lesson | Chuyển kỹ năng sang tình huống marketing/content khác |

## Tiêu chí hoàn thành Module 1

Learner pass Module 1 khi đạt tất cả điều kiện:

- Đạt mức 2 trở lên ở 4/6 skill.
- Không skill nào ở mức 0.
- Viết được prompt đầu tiên yêu cầu Codex inspect repo trước khi sửa.
- Phân loại đúng ít nhất 4/5 hành động: read-only, file edit, network, dependency install, destructive action.
- Giải thích bằng một đoạn ngắn sự khác nhau giữa Teacher và Executor.
- Nêu được một tình huống ngoài ContentPilot có thể dùng lại cùng vòng làm việc
  và ít nhất một bằng chứng cần kiểm tra.

## Feedback mẫu

### Nếu learner đạt

"Bạn đã đạt Module 1. Bằng chứng là: yêu cầu inspect của bạn có mục tiêu, bối
cảnh, ràng buộc và dấu hiệu hoàn thành; bạn phân loại đúng các rủi ro cần phê
duyệt; bạn dùng diff, kiểm tra tự động cùng quan sát giao diện để quyết định;
và bạn đã chuyển được quy trình sang một tình huống khác."

### Nếu learner gần đạt

"Bạn gần hoàn thành rồi. Điểm cần luyện là nhận diện hành động cần phê duyệt:
bạn đã nhận ra việc sửa file, nhưng chưa nhận ra dùng mạng và cài gói phụ thuộc
cũng cần dừng lại. Ta sẽ làm một bài phân loại 3 phút rồi kiểm tra lại."

### Nếu learner chưa đạt

"Bằng chứng hiện tại chưa đủ để hoàn thành module. Không sao. Ta quay lại yêu
cầu đầu tiên: Codex nên đọc gì, không được làm gì và cần báo bằng chứng nào sau
khi kiểm tra xong?"
