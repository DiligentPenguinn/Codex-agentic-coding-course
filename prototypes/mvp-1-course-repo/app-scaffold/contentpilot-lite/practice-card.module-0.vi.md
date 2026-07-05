# Practice Card - Module 0: inspect ContentPilot Lite

## Bối cảnh

Em đang chuẩn bị cải thiện ContentPilot Lite thành một content creator tool mà team có thể dùng chung: lưu Brand Brain, gợi ý ý tưởng, soạn draft và lên lịch xuất bản nhất quán hơn.

Trước khi giao việc sửa app, em cần hiểu repo nhỏ này đang có gì và phần nào có thể phát triển tiếp. Trong SDLC, đây là bước **analysis**: đọc hiện trạng trước khi chọn design hoặc implementation tiếp theo. Mục tiêu không phải đọc cho biết; mục tiêu là xem nền hiện tại có đủ để build lên một workflow content thật không.

## Đường dẫn thực hành

```text
prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite/
```

## Mục tiêu của prompt

Viết một prompt yêu cầu Codex inspect folder này ở chế độ chỉ đọc, rồi trả lại cấu trúc, file quan trọng, rủi ro khi sửa, và 2 bước SDLC tiếp theo nên cân nhắc để tiến gần hơn tới content creator tool cho team.

Khi prompt, em nên dùng `@` để cite folder/file nếu giao diện hỗ trợ, ví dụ:

```text
@prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite/
```

## Được phép trong Module 0

- Liệt kê thư mục và file trong folder thực hành.
- Đọc các file như `README.vi.md`, `AGENTS.md`, `index.html`, `styles.css`, `app.js`, `data/*.json`, và `specs/*.md`.
- Tóm tắt mục đích app, bề mặt UI, dữ liệu mẫu, ràng buộc an toàn, và câu hỏi còn mở.

## Chưa được phép trong Module 0

- Sửa, tạo, xóa, hoặc di chuyển file.
- Cài package hoặc thêm dependency.
- Dùng network, API key, hoặc dịch vụ ngoài.
- Chạy lệnh có thể thay đổi workspace.

## Done-when

Em có đủ thông tin để nói: folder này gồm những phần nào, file nào quan trọng nhất, sửa nhầm có thể gây rủi ro gì, và 2 bước tiếp theo nào đáng phê duyệt.

Sau khi đọc report Executor, em cũng cần nói lại bằng lời của mình:

- ContentPilot Lite hiện có 2-3 phần chính nào.
- Một file quan trọng và vì sao nó quan trọng.
- Một rủi ro nếu sửa sai.
- Inspect repo thuộc bước nào trong SDLC.
- Một lát cắt nhỏ em muốn phát triển tiếp, ví dụ Idea Lab, Draft Studio hoặc Calendar Board, và bước tiếp theo nên là requirements, design hay implementation.
