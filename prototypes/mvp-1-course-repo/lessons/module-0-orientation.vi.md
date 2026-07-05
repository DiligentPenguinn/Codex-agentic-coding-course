# Module 0 - Định hướng: dùng Codex như cộng sự làm việc

## Outcome

Learner hiểu ba vai trò Teacher, Executor, Learner; biết bắt đầu một thread bằng yêu cầu inspect repo ở chế độ chỉ đọc; và phân loại được hành động nào cần phê duyệt.

## Artifact

Một prompt đầu tiên để dùng trong repo mới:

```text
Hãy inspect repo này trước khi sửa bất kỳ file nào. Tóm tắt cấu trúc repo, file quan trọng, mục đích dự án có vẻ là gì, rủi ro khi sửa, và 2 bước tiếp theo bạn đề xuất. Chỉ dùng hành động chỉ đọc. Điều kiện xong: tôi hiểu repo đang có gì và có thể phê duyệt bước tiếp theo.
```

## Chuẩn bị của Teacher

- Đọc `../mvp-0.5-pedagogy-kernel/teacher/teacher-system-prompt.vi.md`.
- Đọc `../mvp-0.5-pedagogy-kernel/teacher/scripted-delivery-contract.vi.md`.
- Đọc `../mvp-0.5-pedagogy-kernel/rubrics/hint-ladder.vi.md`.
- Đọc `../mvp-0.5-pedagogy-kernel/rubrics/mastery-rubric.vi.md`.
- Đọc `../mvp-0.5-pedagogy-kernel/rubrics/quiz-delivery-protocol.vi.md`.
- Đọc `lesson-scripts/module-0.script.vi.md`.
- Đọc quiz của module này trước khi bắt đầu exit ticket.

## Flow 35-45 phút

| Bước | Phút | Mục tiêu | Hành động của learner |
| --- | ---: | --- | --- |
| Scenario | 5 | Đặt vai trò Teacher, Executor, Learner | Nói mục tiêu học hôm nay |
| First thread | 7 | Tạo prompt inspect repo chỉ đọc | Viết prompt có mục tiêu, ngữ cảnh, ràng buộc và điều kiện xong |
| Safe execution | 8 | Nhận diện rủi ro phê duyệt | Phân loại chỉ đọc, sửa file, dùng mạng, hành động phá hủy |
| Teacher vs Executor | 8 | Tách hỏi để hiểu và hỏi để làm | Viết 2 request riêng |
| Exit ticket | 7 | Kiểm tra mastery gate | Trả lời 3 câu cuối |

## Script tĩnh

Teacher phải đọc script này trước khi dạy:

```text
prototypes/mvp-1-course-repo/lesson-scripts/module-0.script.vi.md
```

Khi script có dòng **Teacher nói:**, ưu tiên đọc đúng lời thoại đó. Chỉ ứng biến khi learner hỏi lệch, trả lời thiếu, hoặc cần bài sửa.

## Tóm tắt flow dạy học

1. Teacher mở bằng câu: "Hôm nay mình không học code trước; mình học cách giao việc cho Codex an toàn."
2. Teacher hỏi learner dự đoán hành động đầu tiên trong repo mới.
3. Nếu learner muốn sửa ngay, Teacher dùng hint ladder Bậc 1: "Nếu bạn giao việc cho một cộng sự kỹ thuật mới, bạn muốn họ đọc gì trước?"
4. Teacher yêu cầu learner viết prompt inspect repo với 4 phần.
5. Teacher cho quiz phân loại approval:
   - liệt kê file
   - đọc README
   - sửa README
   - cài package
   - xóa folder
6. Teacher yêu cầu learner viết một request cho Teacher và một request cho Executor.
7. Teacher dùng `quizzes/module-0.quiz.json` làm exit ticket.

## Mastery gate

Learner pass khi:

- Prompt inspect có ràng buộc chỉ đọc và điều kiện xong.
- Phân loại đúng ít nhất 4/5 approval actions.
- Giải thích được: Teacher giúp hiểu và định hướng; Executor đọc/sửa/chạy/test khi được giao việc rõ.
