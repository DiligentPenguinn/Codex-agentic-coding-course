# Module 0 Simulation Script - Định hướng: dùng Codex như cộng sự làm việc

Mục tiêu của simulation này là chạy thử hành vi Teacher trong Codex, không phải tạo code mới. Teacher chỉ gọi Executor khi cần inspect repo hoặc minh họa command read-only.

## Đầu vào mặc định

- Learner: marketer/content creator mới dùng Codex.
- Thời gian gợi ý: 20 phút.
- Learner state: chưa có.
- Ngôn ngữ: tiếng Việt.
- Artifact cần tạo trong buổi: prompt đầu tiên yêu cầu Codex inspect repo trước khi sửa.

## Flow tổng quát

| Bước | Thời gian | Mục tiêu | Artifact |
| --- | ---: | --- | --- |
| 1. Scenario | 3 phút | Đặt bối cảnh và vai trò Teacher/Executor/Learner | Learner nói mục tiêu học |
| 2. First thread | 5 phút | Viết prompt inspect repo read-only | Prompt đầu tiên |
| 3. Safe execution | 5 phút | Phân loại approval risk | Bảng phân loại 5 hành động |
| 4. Teacher vs Executor | 4 phút | Phân biệt hỏi để hiểu và hỏi để làm | 2 request mẫu |
| 5. Exit ticket | 3 phút | Kiểm tra mastery gate nhẹ | Câu trả lời exit ticket |

## Bước 1 - Scenario

Teacher nói ngắn:

"Hôm nay mình sẽ xem Codex như một cộng sự kỹ thuật. Bạn là người ra quyết định; Teacher giúp bạn hiểu và ra lệnh rõ; Executor chỉ thực thi khi cần. Mục tiêu 20 phút: bạn viết được prompt đầu tiên yêu cầu Codex inspect repo trước khi sửa bất kỳ file nào."

Teacher hỏi:

"Nếu bạn chỉ có 20 phút, bạn muốn kết thúc buổi này với kết quả nào: hiểu repo này đang có gì, hay có prompt mẫu để dùng lại?"

Bằng chứng:

- Learner chọn mục tiêu hoặc chấp nhận mục tiêu mặc định.

## Bước 2 - First thread: repo inspection before edits

Teacher hỏi prediction:

"Trước khi để Codex làm gì với repo mới, bạn nghĩ hành động đầu tiên nên là gì?"

Nếu learner trả lời mơ hồ, dùng hint ladder Bậc 1-2.

Teacher yêu cầu learner viết prompt với 4 phần:

- Goal: muốn Codex làm gì?
- Context: repo/file nào cần đọc?
- Constraints: không được làm gì?
- Done when: khi nào xem là xong?

Prompt mẫu nếu learner cần Bậc 4:

```text
Hãy inspect repo này trước khi sửa bất kỳ file nào. Tóm tắt cấu trúc repo, file quan trọng, mục đích dự án có vẻ là gì, và 2 bước tiếp theo bạn đề xuất. Chỉ dùng hành động read-only. Done when: tôi hiểu repo đang có gì và có thể phê duyệt bước tiếp theo.
```

Nếu gọi Executor inspect repo, Teacher phải nói:

- "Hành động này read-only."
- "Rủi ro thấp: chỉ đọc file và liệt kê cấu trúc."
- "Bạn dự đoán chúng ta sẽ thấy những file nào?"
- "Tôi sẽ không sửa file trong bước này."

Bằng chứng:

- Learner tạo prompt inspect repo có goal/context/constraints/done-when.

## Bước 3 - Safe execution and approvals

Teacher đưa quiz phân loại:

"Hãy đánh dấu hành động nào cần dừng lại hỏi approval:"

1. Liệt kê file trong repo.
2. Đọc README.
3. Sửa `README.md`.
4. Cài package từ internet.
5. Xóa một folder build cũ.

Đáp án mong đợi:

- 1 read-only, thường an toàn.
- 2 read-only, thường an toàn.
- 3 file edit, cần rõ mục đích và nên được phê duyệt trong bài học.
- 4 network/dependency install, cần approval.
- 5 destructive action, cần approval rõ ràng.

Bằng chứng:

- Learner phân loại đúng ít nhất 4/5.

## Bước 4 - Teacher vs Executor

Teacher giải thích ngắn:

"Hỏi Teacher khi bạn cần hiểu, lên chiến lược, hoặc kiểm tra suy nghĩ. Hỏi Executor khi bạn muốn Codex đọc, sửa, chạy lệnh, tạo file, hoặc test."

Teacher yêu cầu:

"Viết 2 request riêng biệt:
1. Một request hỏi Teacher để giải thích.
2. Một request giao Executor làm hành động read-only."

Ví dụ đạt:

```text
Teacher: Giải thích vì sao nên inspect repo trước khi sửa file.
Executor: Hãy liệt kê file trong repo và tóm tắt README, không sửa file.
```

Bằng chứng:

- Learner viết được 2 request đúng mục đích.

## Bước 5 - Exit ticket

Teacher hỏi 3 câu:

1. Prompt inspect repo đầu tiên của bạn là gì?
2. Nếu Codex muốn cài dependency, bạn sẽ làm gì trước khi approve?
3. Sự khác nhau giữa Teacher và Executor là gì?

Pass nếu:

- Prompt có read-before-write và done-when.
- Learner nói cần hiểu mục đích, rủi ro, và approval trước dependency install.
- Learner phân biệt coach/giải thích với thực thi/đọc-sửa-chạy.

## Learner state update mẫu

```json
{
  "schemaVersion": "0.5.0",
  "course": {
    "currentModuleId": "module-0",
    "currentSubmoduleId": "module-0.exit-ticket",
    "status": "completed"
  },
  "nextRecommendedAction": {
    "moduleId": "module-1",
    "submoduleId": "module-1.brand-brain-intro",
    "title": "Tạo Brand Brain đầu tiên",
    "estimatedMinutes": 10,
    "reason": "Learner đã đạt Module 0 mastery gate và sẵn sàng dùng Codex để tạo artifact đầu tiên."
  }
}
```
