# Tiêu chí đánh giá mức độ thành thạo

Bảng tiêu chí này đánh giá khả năng dùng planning để giao tiếp với coding agent,
không đánh giá kiến thức lập trình. Teacher chỉ đánh dấu hoàn thành khi Learner
có cả planning package và bằng chứng hiểu những quyết định trong đó.

## Thang điểm

- **0 - Chưa thấy bằng chứng**: Learner chưa thử hoặc câu trả lời không liên quan.
- **1 - Nhận diện có hỗ trợ**: Learner làm được khi Teacher gợi ý nhiều.
- **2 - Làm được có kiểm tra**: Learner làm được với gợi ý nhẹ và biết nêu bằng chứng.
- **3 - Tự chủ**: Learner tự đưa yêu cầu rõ, kiểm soát phạm vi, review và giải thích được.

## Kỹ năng cốt lõi của Module 1

| Kỹ năng | 0 | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| Nhận biết nhu cầu planning | Muốn code ngay trong mọi tình huống | Chấp nhận planning khi Teacher nhắc | Phân biệt được việc nhỏ với việc mơ hồ/nhiều bước | Tự giải thích được tradeoff và chọn mức planning phù hợp |
| Prompt cho cuộc phỏng vấn PRD | Đưa ý tưởng mơ hồ và chờ agent tự quyết | Có mục tiêu nhưng thiếu cách trao đổi hoặc output | Có mục tiêu, bối cảnh, một câu mỗi lượt, output và ràng buộc chưa code | Tự điều chỉnh prompt để giữ quyền quyết định và xử lý câu hỏi còn mở |
| Chất lượng PRD | Thiếu phạm vi hoặc Done When | Có phần chính nhưng còn mơ hồ | Đủ tám phần, Done When kiểm tra được, không lẫn implementation | Tự phát hiện giả định ẩn, scope creep và chỉnh PRD trước khi duyệt |
| Chất lượng implementation plan | Plan chung chung hoặc bắt đầu viết code | Có danh sách bước nhưng thiếu kết quả/cách kiểm tra | Bước nhỏ có thứ tự, mục tiêu, thành phần, kết quả và verification | Tự xem xét phụ thuộc, rủi ro, quyết định mở và kiểm tra end-to-end |
| Alignment và kiểm soát phạm vi | Không nhận ra PRD và plan lệch nhau | Nhận ra khi Teacher chỉ điểm | Map được yêu cầu với bước và Done When với verification | Tự phát hiện thiếu/thừa, quyết định sửa đúng tài liệu và review lại |
| Quyền sở hữu quyết định | Chấp nhận output mà không review | Chọn duyệt/sửa khi được nhắc | Duyệt rõ và giải thích được một quyết định phạm vi | Chủ động chất vấn đề xuất của agent bằng mục tiêu và bằng chứng |

## Tiêu chí hoàn thành Module 1

Learner pass Module 1 khi đạt tất cả điều kiện:

- Đạt mức 2 trở lên ở ít nhất 5/6 kỹ năng.
- Không kỹ năng nào ở mức 0.
- `artifacts/PRD.md` tồn tại, có nội dung, đủ tám phần và được Learner duyệt.
- `artifacts/implementation-plan.md` tồn tại, có nội dung, dùng PRD làm nguồn và
  được Learner duyệt.
- Mọi yêu cầu trong phạm vi PRD có bước tương ứng; mọi bước truy ngược về PRD.
- Nội dung ngoài phạm vi không xuất hiện trong plan.
- Mọi mục `Done When` có cách kiểm tra tương ứng.
- Learner giải thích bằng lời của mình ít nhất một quyết định phạm vi, bước triển
  khai liên quan và bằng chứng sẽ dùng để kiểm tra.
- Learner đạt ít nhất 80% bài kiểm tra cuối module.

## Feedback mẫu

### Nếu Learner đạt

"Bạn đã đạt Module 1. PRD của bạn giữ rõ sản phẩm cần làm gì và chưa làm gì;
implementation plan chia đúng phạm vi đó thành các bước có thể kiểm tra; và bạn
đã tự giải thích được vì sao hai tài liệu khớp nhau."

### Nếu Learner gần đạt

"Bạn gần hoàn thành rồi. PRD đã rõ, nhưng một mục Done When chưa có cách kiểm
tra tương ứng trong implementation plan. Ta sẽ sửa đúng mapping đó rồi review
lại planning package."

### Nếu Learner chưa đạt

"Bằng chứng hiện tại chưa đủ để hoàn thành module. Không sao. Ta quay lại một
quyết định cốt lõi: phiên bản đầu tiên cần tạo output gì, và dấu hiệu quan sát
nào cho biết output đó đạt yêu cầu?"
