# Module 2 - Project memory: AGENTS.md và Brand Brain

## Outcome

Learner hiểu khi nào dùng prompt một lần, khi nào dùng `AGENTS.md`, và cách tạo Brand Brain như bộ nhớ dự án để Codex đọc trước khi generate content.

## Artifact

- Một draft `AGENTS.md` cho ContentPilot Lite.
- Một Brand Brain JSON có voice, persona, product facts, forbidden claims, content pillars.

## Flow 60-75 phút

| Bước | Phút | Mục tiêu | Hành động của learner |
| --- | ---: | --- | --- |
| Why memory matters | 7 | So sánh prompt một lần với project guidance | Phân loại instruction |
| Initialize rules | 8 | Soạn AGENTS.md draft | Chọn rules từ template |
| Instruction scope | 8 | Hướng dẫn ở root hay trong app | Quyết định rule đặt ở đâu |
| Brand Brain schema | 8 | Thiết kế fields | Viết schema nháp |
| Memory cards | 8 | Tạo sample memory | Chỉnh brand sample |
| Evidence habit | 8 | Yêu cầu Codex liệt kê ngữ cảnh đã dùng | Viết yêu cầu bằng chứng |
| Practice | 8 | Update instruction an toàn | Thêm persona mới |

## Script tĩnh

Teacher phải đọc script này trước khi dạy:

```text
prototypes/mvp-1-course-repo/lesson-scripts/module-2.script.vi.md
```

Khi script có dòng **Teacher nói:**, ưu tiên đọc đúng lời thoại đó. Chỉ ứng biến khi learner hỏi lệch, trả lời thiếu, hoặc cần bài sửa.

## Tóm tắt flow dạy học

1. Teacher hỏi: "Điều gì nên lặp lại ở mọi lesson, và điều gì chỉ dùng cho task này?"
2. Teacher giới thiệu `AGENTS.md` như hướng dẫn bền vững trong repo.
3. Learner đọc `templates/AGENTS.template.vi.md` và chọn 5 rule phù hợp cho ContentPilot Lite.
4. Teacher cho learner thiết kế Brand Brain bằng JSON:
   - `brandVoice`
   - `audiencePersonas`
   - `productFacts`
   - `forbiddenClaims`
   - `contentPillars`
5. Learner yêu cầu Executor inspect Brand Brain trước khi tạo content idea.
6. Teacher yêu cầu bằng chứng: "Hãy liệt kê thẻ nhớ nào bạn đã dùng."
7. Teacher dùng quiz Module 2.

## Mastery gate

Learner pass khi:

- Phân biệt prompt một lần và durable guidance.
- Biết rule nào thuộc root `AGENTS.md`, rule nào thuộc app scaffold.
- Tạo hoặc chỉnh Brand Brain mà không làm mất fields cũ.
- Yêu cầu Codex nêu bằng chứng về ngữ cảnh đã đọc.
