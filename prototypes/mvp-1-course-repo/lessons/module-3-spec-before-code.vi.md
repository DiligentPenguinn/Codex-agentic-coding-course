# Module 3 - Spec trước khi code

## Outcome

Learner biết yêu cầu Codex lập mini PRD, mô hình dữ liệu, lát cắt triển khai, kiểm tra rủi ro và checklist kiểm tra trước khi cho Executor sửa code.

## Artifact

Một mini PRD cho một cải tiến nhỏ của ContentPilot Lite, ví dụ: thêm trạng thái "Approved" cho content ideas.

## Flow 50-65 phút

| Bước | Phút | Mục tiêu | Hành động của learner |
| --- | ---: | --- | --- |
| User journey | 7 | Map hành trình onboard brand -> plan -> draft -> calendar | Vẽ journey bằng bullet |
| Mini PRD | 8 | Viết mục tiêu, việc không làm, câu chuyện người dùng | Tạo PRD 1 trang |
| Data model | 8 | Định nghĩa Campaign, Idea, Draft, CalendarItem | Chọn fields tối thiểu |
| Implementation slices | 8 | Chia thành 4-6 task nhỏ | Viết slices theo file |
| Risk check | 8 | Hỏi rủi ro và cách quay lại | Tạo checklist rủi ro |
| Quiz | 8 | Nhận diện requirement mơ hồ | Chọn yêu cầu chưa đủ rõ |

## Script tĩnh

Teacher phải đọc script này trước khi dạy:

```text
prototypes/mvp-1-course-repo/lesson-scripts/module-3.script.vi.md
```

Khi script có dòng **Teacher nói:**, ưu tiên đọc đúng lời thoại đó. Chỉ ứng biến khi learner hỏi lệch, trả lời thiếu, hoặc cần bài sửa.

## Tóm tắt flow dạy học

1. Teacher hỏi: "Nếu sửa code ngay, chúng ta dễ sai ở đâu?"
2. Learner chọn một cải tiến nhỏ cho ContentPilot Lite.
3. Teacher yêu cầu mini PRD:
   - mục tiêu
   - việc không làm
   - câu chuyện người dùng
   - tiêu chí chấp nhận
   - kiểm tra thủ công
4. Learner yêu cầu Codex đề xuất lát cắt triển khai nhưng chưa sửa code.
5. Teacher yêu cầu learner duyệt file list và rủi ro trước khi phê duyệt.
6. Teacher dùng quiz Module 3.

## Mastery gate

Learner pass khi:

- PRD đủ rõ để Executor lập plan.
- Có việc không làm để chặn lan phạm vi.
- Có data model tối thiểu.
- Có tiêu chí chấp nhận và kiểm tra thủ công.
- Learner chưa cho sửa code trước khi review plan.
