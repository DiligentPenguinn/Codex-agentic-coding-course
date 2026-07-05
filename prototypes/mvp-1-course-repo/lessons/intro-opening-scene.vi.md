# Mở đầu - Ca trực trước ngày ra mắt

## Outcome

Learner hiểu bối cảnh thực tế của khóa học: một team marketing đang bị quá tải workflow trong khi đối thủ đã dùng AI để nối brief, brand guideline, lịch nội dung và kiểm tra claim. Learner gặp các nhân vật chính, hiểu vì sao thử Codex là một quyết định hợp lý, và tạo quest card cá nhân trước khi vào Module 0.

## Artifact

Một quest card ngắn:

```text
Vai của tôi trong team:
Workflow nội dung đang rối nhất hiện nay:
Tôi muốn dùng Codex để cải thiện:
Tôi sẽ giữ quyền quyết định bằng cách:
Tín hiệu cho thấy hôm nay tôi học đúng:
```

## Visualization

Mở cảnh trực quan tại:

```text
prototypes/mvp-1-course-repo/visuals/opening-scene/index.html
```

Cảnh này dùng phong cách visual novel: nền cảnh thay đổi, nhân vật có avatar, hộp thoại hiển thị từng lượt. Learner gặp Mai Anh, Khánh, Linh, Hương và Codex trước khi bắt đầu Module 0.

## Script tĩnh

Teacher phải đọc script này trước khi dạy:

```text
prototypes/mvp-1-course-repo/lesson-scripts/intro.script.vi.md
```

Khi script có dòng **Teacher nói:**, ưu tiên đọc đúng lời thoại đó. Chỉ ứng biến khi learner hỏi lệch, trả lời thiếu, hoặc cần repair.

## Dàn nhân vật

| Nhân vật | Vai trò trong khóa học | Điều learner cần nhớ |
| --- | --- | --- |
| Bạn | Nhân vật chính | Quyết định mục tiêu, phê duyệt hành động, đánh giá kết quả |
| Hương | Teacher, mentor về quy trình AI | Chẩn đoán, gợi ý theo bậc, kiểm tra mastery |
| Mai Anh | Trưởng nhóm nội dung | Giữ giọng thương hiệu và chất lượng claim |
| Khánh | Phụ trách tăng trưởng | Cần tốc độ, biến thể và thử nghiệm nhưng dễ kéo phạm vi rộng |
| Linh | Creator mới | Cần workflow rõ để không bị chìm trong phản hồi |
| Codex | Cộng sự kỹ thuật khi nhiệm vụ đủ rõ | Đọc repo, lập kế hoạch, sửa file, chạy kiểm tra, báo bằng chứng |
| ContentPilot Lite | Xưởng thực hành | Nơi learner dùng Codex để biến ý tưởng thành artifact |

## Flow 15-20 phút

| Bước | Phút | Mục tiêu | Hành động của learner |
| --- | ---: | --- | --- |
| Opening scene | 4 | Tạo động lực và bối cảnh | Mở visual novel intro, đọc cảnh đầu |
| Cast briefing | 4 | Phân biệt nhân vật | Nói lại Hương, Codex và vai của mình bằng lời của mình |
| Personal quest | 6 | Gắn course với mục tiêu thật | Điền quest card |
| Readiness gate | 4 | Chuẩn bị vào Module 0 | Trả lời exit ticket ngắn |

## Tóm tắt flow dạy học

1. Teacher mở bằng câu: "Trước khi học lệnh, mình muốn đặt bạn vào một tình huống thật."
2. Teacher yêu cầu learner mở visual novel intro nếu họ muốn có phần mở đầu trực quan; nếu không, Teacher vẫn kể bối cảnh bằng văn bản.
3. Teacher giới thiệu tình huống: team marketing thấy đối thủ đã dùng AI để nối brief, brand guideline, lịch nội dung và kiểm tra claim, trong khi workflow nội bộ vẫn rời rạc.
4. Teacher giới thiệu nhân vật bằng ngôn ngữ đời thường:
   - Bạn giữ mục tiêu và quyền quyết định.
   - Hương giúp học đúng nhịp.
   - Codex làm việc trong repo khi có nhiệm vụ rõ.
   - Mai Anh, Khánh và Linh đại diện cho áp lực thật của team marketing.
5. Teacher hỏi learner: "Workflow nội dung nào của bạn đang rối nhất hiện nay?"
6. Teacher yêu cầu learner điền quest card.
7. Teacher dùng `quizzes/intro.quiz.json` làm readiness gate.
8. Nếu pass, Teacher mời learner sang `$start-course-lesson module-0`.

## Hint ladder riêng cho phần mở đầu

- Bậc 1: "Hãy nghĩ đến một việc nội dung bạn lặp lại mỗi tuần."
- Bậc 2: "Việc đó có phần nào cần đọc file, phần nào cần quyết định của bạn?"
- Bậc 3: "Thử viết một câu: Codex giúp tôi làm X, nhưng tôi vẫn quyết định Y."
- Bậc 4: Teacher cho ví dụ ngắn rồi yêu cầu learner chỉnh thành của riêng họ.

## Mastery gate

Learner pass khi:

- Nói được vì sao team quyết định thử Codex sau khi nhìn thấy workflow AI của đối thủ.
- Phân biệt được vai của bạn, Hương và Codex bằng lời của mình.
- Viết được quest card có mục tiêu thật và một ràng buộc an toàn.

## English mirror

This prologue motivates the learner before Module 0 through a realistic marketing-team scenario. A competitor has integrated AI into its content workflow, while the learner's team still works through scattered files and feedback. The learner meets Mai Anh, Khánh, Linh, Hương, and Codex, then creates a personal quest card before entering the first technical lesson.
