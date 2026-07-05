# Module 1 - Brief Codex như một collaborator

## Outcome

Learner biết biến yêu cầu mơ hồ thành brief giao việc cho Codex rõ ràng: mục tiêu, ngữ cảnh, ràng buộc, điều kiện xong, tiêu chí chấp nhận và bằng chứng cần trả về.

## Artifact

Một task brief cho ContentPilot Lite:

```text
Mục tiêu: Đề xuất cách cải thiện Idea Lab trong ContentPilot Lite để marketer tạo ý tưởng social post tốt hơn.
Ngữ cảnh: Đọc app-scaffold/contentpilot-lite/index.html, app.js, styles.css và data sample. Không sửa file trong bước này.
Ràng buộc: Chỉ inspect và lập kế hoạch. Không cài dependency, không dùng network, không thay đổi UI ngay.
Điều kiện xong: Tôi có 3 đề xuất nhỏ, mỗi đề xuất có file có thể bị sửa, rủi ro, và cách kiểm tra thủ công.
```

## Flow 45-60 phút

| Bước | Phút | Mục tiêu | Hành động của learner |
| --- | ---: | --- | --- |
| Bad vs good tasks | 7 | Nhìn thấy prompt mơ hồ | Rewrite "make a content app" |
| Context packet | 8 | Thêm ngữ cảnh kinh doanh | Chọn audience, tone, platform, việc không làm |
| Acceptance criteria | 8 | Định nghĩa điều kiện xong quan sát được | Viết 3 tiêu chí kiểm tra |
| Plan first | 8 | Yêu cầu Codex lập plan trước khi sửa | Viết plan-first request |
| Review prompt | 8 | Chia task lớn thành 3 task nhỏ | Tạo 3 brief nhỏ |
| Controlled practice | 8 | Teacher chấm độ rõ, phạm vi và rủi ro | Sửa brief sau phản hồi |

## Script tĩnh

Teacher phải đọc script này trước khi dạy:

```text
prototypes/mvp-1-course-repo/lesson-scripts/module-1.script.vi.md
```

Khi script có dòng **Teacher nói:**, ưu tiên đọc đúng lời thoại đó. Chỉ ứng biến khi learner hỏi lệch, trả lời thiếu, hoặc cần bài sửa.

## Tóm tắt flow dạy học

1. Teacher đưa prompt xấu: "Hãy làm ContentPilot tốt hơn."
2. Teacher hỏi: "Executor sẽ thiếu thông tin gì nếu nhận prompt này?"
3. Learner điền 5 ô: mục tiêu, ngữ cảnh, ràng buộc, điều kiện xong, bằng chứng.
4. Teacher yêu cầu learner thêm ngữ cảnh kinh doanh: audience, giọng thương hiệu, platform, việc không làm.
5. Teacher cho learner viết tiêu chí chấp nhận có thể quan sát trong browser.
6. Teacher yêu cầu learner chuyển task lớn thành 3 task nhỏ:
   - inspect và plan
   - chỉnh UI hoặc copy nhỏ
   - viết checklist kiểm tra
7. Teacher dùng quiz Module 1 để kiểm tra.

## Mastery gate

Learner pass khi brief có:

- Goal cụ thể.
- Context path rõ.
- Ràng buộc chỉ đọc hoặc file được phép sửa rõ.
- Điều kiện xong đo được.
- Evidence yêu cầu Codex trả về.
