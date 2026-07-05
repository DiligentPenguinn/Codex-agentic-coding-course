# Module 0 - Định hướng: dùng Codex như cộng sự làm việc

## Outcome

Learner hiểu ba vai trò Teacher, Executor, Learner; biết viết yêu cầu inspect repo ở chế độ chỉ đọc cho một Executor sub-agent thật; biết đọc report inspect để nắm repo có gì; biết xem inspect repo như bước analysis trong SDLC; biết liên hệ repo mẫu với mục tiêu xây content creator tool cho team; biết prompt được chuyển sang Executor thread riêng như thế nào; và phân loại được hành động nào cần phê duyệt.

## Artifact

Một prompt đầu tiên để inspect folder thực hành ContentPilot Lite, kèm handoff flow sang Executor thread riêng:

```text
Hãy inspect folder `prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite/` trước khi sửa bất kỳ file nào.
Bối cảnh: em muốn hiểu ContentPilot Lite như nền móng cho một content creator tool mà team có thể dùng chung để giữ Brand Brain, tạo ý tưởng, soạn draft và lên lịch xuất bản.
Tóm tắt cấu trúc folder, file quan trọng, mục đích app có vẻ là gì, rủi ro khi sửa, và 2 bước tiếp theo chị/em nên cân nhắc.
Chỉ dùng hành động chỉ đọc: liệt kê thư mục và đọc file. Không sửa file, cài package, dùng network, xóa hoặc di chuyển file.
Điều kiện xong: em hiểu folder đang có gì, rủi ro chính là gì, và có thể chọn một lát cắt nhỏ tiếp theo để phê duyệt.
```

## Chuẩn bị của Teacher

- Đọc `../mvp-0.5-pedagogy-kernel/teacher/teacher-system-prompt.vi.md`.
- Đọc `../mvp-0.5-pedagogy-kernel/teacher/scripted-delivery-contract.vi.md`.
- Đọc `../mvp-0.5-pedagogy-kernel/rubrics/hint-ladder.vi.md`.
- Đọc `../mvp-0.5-pedagogy-kernel/rubrics/mastery-rubric.vi.md`.
- Đọc `../mvp-0.5-pedagogy-kernel/rubrics/quiz-delivery-protocol.vi.md`.
- Đọc `lesson-scripts/module-0.script.vi.md`.
- Đọc `app-scaffold/contentpilot-lite/practice-card.module-0.vi.md`.
- Đọc quiz của module này trước khi bắt đầu exit ticket.

## Flow 35-45 phút

| Bước | Phút | Mục tiêu | Hành động của learner |
| --- | ---: | --- | --- |
| Scenario | 5 | Đặt vai trò Teacher, Executor, Learner | Nói mục tiêu học hôm nay |
| First thread | 7 | Tạo prompt inspect ContentPilot Lite chỉ đọc | Viết prompt gửi cho Executor sub-agent, có mục tiêu, path, ràng buộc và điều kiện xong |
| Executor handoff | 5 | Thấy prompt của mình được chuyển nguyên văn sang Executor thread riêng và thực thi read-only | Dùng `/agent` nếu muốn xem Executor, đọc report và nói lại repo có gì |
| SDLC next step | 6 | Hiểu vòng SDLC nhỏ: requirements, analysis, design, implementation, testing, feedback | Chọn bước SDLC tiếp theo sau khi inspect repo |
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
3. Nếu learner muốn sửa ngay, Teacher dùng hint ladder Bậc 1: "Nếu em giao việc cho một cộng sự kỹ thuật mới, trước khi họ sửa, em muốn họ đọc gì trước?"
4. Teacher giới thiệu ContentPilot Lite là nền móng cho content creator tool của team: Brand Brain, Idea Lab, Draft Studio và Calendar Board.
5. Teacher dạy learner dùng `@` để cite đúng folder/file khi prompt cho Executor.
6. Teacher yêu cầu learner viết prompt inspect cho Executor sub-agent, không đưa prompt mẫu trước khi learner thử.
7. Teacher tạo Executor thread riêng bằng `course-executor` nếu có, fallback sang `worker` nếu cần, chuyển nguyên văn prompt đã đạt của learner, hướng dẫn dùng `/agent`, rồi yêu cầu learner đọc report và nói lại repo có gì, rủi ro nào nổi bật, bước nào đáng cân nhắc.
8. Teacher dạy mini-lesson về SDLC: requirements, analysis, design, implementation, testing, feedback. Áp vào ContentPilot Lite: inspect repo là bước analysis; sau đó learner cần quay lại requirements/design cho một lát cắt nhỏ trước khi giao Executor sửa.
9. Teacher cho quiz phân loại approval:
   - liệt kê file
   - đọc README
   - sửa README
   - cài package
   - xóa folder
10. Teacher yêu cầu learner viết một request cho Teacher và một request cho Executor, giải thích rõ ý nghĩa: Teacher giúp định hướng khi việc còn mơ hồ; Executor làm/inspect khi việc đã đủ rõ.
11. Teacher dùng `quizzes/module-0.quiz.json` làm exit ticket.

## SDLC ngắn cho Module 0

Module 0 không dạy full software engineering, nhưng cần một khung đủ nhỏ để learner hiểu sau inspect repo thì làm gì. Theo CS2103/T, phát triển phần mềm đi qua các stage như requirements, analysis, design, implementation và testing; các process model là roadmap mô tả mục tiêu, outcome và workflow giữa các stage. Với app content creator tool, Teacher dùng bản rút gọn này:

1. **Requirements**: team content cần tool giải quyết vấn đề gì, user nào dùng, outcome mong muốn là gì.
2. **Analysis**: đọc repo hiện tại để hiểu app đang có gì, file nào quan trọng, ràng buộc và rủi ro nào tồn tại.
3. **Design**: chọn một lát cắt nhỏ và quyết định cách thay đổi trước khi sửa code.
4. **Implementation**: giao Executor sửa file theo plan đã được phê duyệt.
5. **Testing**: kiểm tra app vẫn chạy, tính năng mới đạt điều kiện xong, không phá workflow cũ.
6. **Feedback/next iteration**: dùng kết quả test hoặc feedback của team để chọn vòng SDLC tiếp theo.

Vì ContentPilot Lite còn là repo mẫu nhỏ và yêu cầu thật còn thay đổi khi learner hiểu thêm, Module 0 nên dạy theo tinh thần iterative model: mỗi vòng có thể đi qua nhiều stage SDLC, tạo một phiên bản mới, rồi dùng feedback để điều chỉnh vòng sau. Tránh dạy learner theo waterfall cứng vì lúc này requirements chưa ổn định.

Áp dụng vào Module 0:

- Learner inspect repo = đang làm **analysis**.
- Sau report inspect, learner chọn Idea Lab/Draft Studio/Calendar Board = quay lại **requirements/design** cho slice tiếp theo.
- Chỉ khi slice đủ rõ và đã phê duyệt, Executor mới sang **implementation**.
- Sau khi sửa, learner phải yêu cầu bằng chứng **testing**.

Nguồn tham khảo chính để Teacher giữ đúng tinh thần:

- NUS CS2103/T adapted SE book, "SDLC process models": SDLC gồm các stage như requirements, analysis, design, implementation, testing; process model là roadmap của stages, outcomes và workflow; iterative model tạo phiên bản mới qua nhiều iteration và dùng feedback cho iteration sau.

## Mastery gate

Learner pass khi:

- Prompt inspect có ràng buộc chỉ đọc và điều kiện xong.
- Prompt inspect nêu đúng folder thực hành `prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite/`.
- Learner dùng hoặc hiểu cách dùng `@` để cite file/folder cho Executor.
- Learner đọc report Executor và nêu được folder có gì, ít nhất một file quan trọng, một rủi ro, và một bước tiếp theo.
- Learner giải thích được inspect repo là bước analysis trong SDLC và chọn được bước SDLC tiếp theo cho một lát cắt nhỏ gắn với mục tiêu xây content creator tool cho team.
- Learner biết prompt được viết trong Teacher thread, được chuyển nguyên văn sang Executor thread riêng, và có thể dùng `/agent` để xem hoặc nói trực tiếp với Executor.
- Phân loại đúng ít nhất 4/5 approval actions.
- Giải thích được: Teacher giúp hiểu và định hướng; Executor đọc/sửa/chạy/test khi được giao việc rõ.
