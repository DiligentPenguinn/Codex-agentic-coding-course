# MVP 0.5 - Pedagogy Kernel

Nguyên mẫu này kiểm tra hành vi dạy học của Teacher trước khi xây web app, capstone ContentPilot Studio, hoặc tích hợp hệ thống thật. Trong giai đoạn này, Codex vẫn là môi trường học chính: Teacher hướng dẫn, Executor thực thi, và người học tập dần cách giao việc an toàn.

Tài liệu ưu tiên tiếng Việt. Mỗi artifact quan trọng có bản tiếng Anh đi kèm để sau này dễ dịch, đối chiếu, hoặc dùng cho learner khác.

## Mục tiêu

- Biến kế hoạch khóa học thành một prototype có thể chạy trong Codex.
- Kiểm tra xem Teacher có dạy theo vòng: chẩn đoán -> mục tiêu -> gợi ý -> hành động -> phản hồi -> mastery gate.
- Giữ người học ở vai trò chủ động: dự đoán, kiểm tra, phê duyệt, giải thích.
- Tạo bộ mẫu cho Module 0 trước khi mở rộng sang lesson repo đầy đủ.

## Thành phần

- `teacher/teacher-system-prompt.vi.md`: prompt hệ thống cho Teacher.
- `teacher/scripted-delivery-contract.vi.md`: quy tắc đọc kịch bản tĩnh và ứng biến khi learner đi lệch.
- `rubrics/hint-ladder.vi.md`: thang gợi ý từ Socratic question đến worked solution.
- `rubrics/mastery-rubric.vi.md`: rubric đánh giá năng lực người học.
- `rubrics/quiz-delivery-protocol.vi.md`: giao thức hỏi quiz từng câu một và kiểm tra vận dụng thật.
- `schemas/learner-state.schema.json`: trạng thái người học để Teacher resume và cá nhân hóa.
- `schemas/xapi-event.schema.json`: event học tập kiểu xAPI nhẹ.
- `dialogues/`: 10 đối thoại mẫu, tiếng Việt trước, kèm tóm tắt tiếng Anh.
- `simulations/module-0-simulation.vi.md`: kịch bản chạy thử Module 0 trong Codex.

## Cách chạy simulation trong Codex

Bắt đầu một thread mới tại root repo và dùng prompt sau:

```text
Hãy đóng vai Teacher của Codex Content Builder Academy.

Trước khi dạy, hãy đọc:
- prototypes/mvp-0.5-pedagogy-kernel/teacher/teacher-system-prompt.vi.md
- prototypes/mvp-0.5-pedagogy-kernel/rubrics/hint-ladder.vi.md
- prototypes/mvp-0.5-pedagogy-kernel/rubrics/mastery-rubric.vi.md
- prototypes/mvp-0.5-pedagogy-kernel/simulations/module-0-simulation.vi.md

Sau đó bắt đầu Module 0 bằng tiếng Việt. Chỉ dạy từng bước ngắn. Khi cần Executor inspect repo, hãy yêu cầu tôi dự đoán trước, nói rõ lệnh/hành động nào an toàn, và hỏi phê duyệt trước mỗi hành động có thể sửa file, dùng network, cài dependency, hoặc chạm vào hệ thống ngoài.
```

## Tiêu chí thành công

- Teacher không nhảy vào sửa file ngay khi người học còn cần hiểu vấn đề.
- Teacher ưu tiên đọc kịch bản tĩnh đã viết sẵn; chỉ ứng biến khi learner đi lệch hoặc cần repair.
- Mỗi bước học có một artifact nhỏ: câu trả lời, phân loại rủi ro, prompt mẫu, hoặc exit ticket.
- Gợi ý đi theo thang: câu hỏi -> gợi ý nhẹ -> ví dụ một phần -> lời giải mẫu.
- Quiz hỏi từng câu một, không stack câu hỏi, và không chấp nhận tự luận chỉ chép lại lời Teacher.
- Mastery gate đo được hành vi thật: người học biết yêu cầu inspect, phân biệt explain/action, nhận diện approval, và tóm tắt việc Codex đã làm.
- Learner state có thể cập nhật sau mỗi lesson và dùng được để resume.

## Không nằm trong MVP 0.5

- Chưa xây web shell Teacher-Executor.
- Chưa xây Next.js, Supabase, hay ContentPilot Studio.
- Chưa kết nối MCP, Postiz, Sheets, n8n, hoặc automation thật.
- Chưa dùng scoring tự động bằng LLM. Rubric hiện tại dành cho dry run và review thủ công.
