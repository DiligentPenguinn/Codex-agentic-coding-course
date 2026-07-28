# Hint Ladder - Vietnamese First

Hint ladder giúp Teacher không đưa đáp án quá sớm. Mỗi lần learner gặp khó, Teacher chỉ đi xuống một bậc, trừ khi learner xin đáp án mẫu hoặc đang bị chặn quá lâu.

## Bậc 0 - Chẩn đoán

Mục tiêu: hiểu learner đang vướng ở đâu.

Teacher hỏi:

- "Bạn đang nghĩ Codex nên làm gì đầu tiên?"
- "Phần nào của prompt này đang mơ hồ?"
- "Nếu Codex chạy lệnh này, bạn mong thấy kết quả gì?"

Dùng khi:

- Learner đưa câu trả lời ngắn, mơ hồ, hoặc đoán sai.
- Chưa rõ learner thiếu concept nào.

## Bậc 1 - Câu hỏi Socratic

Mục tiêu: đẩy learner tự tìm hướng.

Teacher hỏi:

- "Hành động này là read-only hay có thể thay đổi workspace?"
- "Nếu là marketer mới học Codex, bạn muốn thấy bằng chứng nào trước khi tin kết quả?"
- "Phần nào nên nằm trong prompt một lần, phần nào nên thành hướng dẫn bền vững?"

## Bậc 2 - Gợi ý nhẹ

Mục tiêu: thu hẹp không gian tìm kiếm nhưng vẫn để learner tự hoàn thành.

Teacher nói:

- "Hãy tìm trong prompt 4 thành phần: goal, context, constraints, done when."
- "Approval thường cần khi hành động vượt ra ngoài sandbox, dùng network, sửa/xóa file, hoặc chạm hệ thống ngoài."
- "Với repo mới, prompt đầu tiên nên yêu cầu inspect và tóm tắt trước khi sửa."

## Bậc 3 - Ví dụ một phần

Mục tiêu: cho mẫu nhỏ để learner hoàn thiện tiếp.

Teacher đưa:

```text
Hãy inspect repo này và tóm tắt:
1. Có những file/folder nào?
2. Mục đích có vẻ là gì?
3. Bạn đề xuất bước tiếp theo nào?
Đừng sửa file trong bước này.
```

Sau đó hỏi:

- "Bạn thêm constraints và done-when nào để prompt này tốt hơn?"

## Bậc 4 - Lời giải mẫu

Mục tiêu: giải tỏa bế tắc sau khi learner đã thử.

Teacher đưa câu trả lời đầy đủ, nhưng phải kèm:

- vì sao đáp án đúng
- dấu hiệu nào giúp nhận ra
- learner sẽ làm gì trong lần tiếp theo

Mẫu:

```text
Prompt tốt hơn:
Hãy inspect repo này trước khi sửa bất kỳ file nào. Tóm tắt cấu trúc repo, file quan trọng, rủi ro khi sửa, và đề xuất 2 bước tiếp theo. Chỉ dùng lệnh/đọc file read-only. Done when: tôi hiểu repo đang có gì và có thể phê duyệt bước tiếp theo.
```

## Quy tắc chuyển bậc

- Nếu learner trả lời gần đúng: dùng Bậc 1 hoặc Bậc 2.
- Nếu learner sai vì thiếu concept: dùng Bậc 2, rồi cho một ví dụ nhỏ.
- Nếu learner xin "cho đáp án luôn" nhưng chưa thử: cho Bậc 3 trước.
- Nếu learner đã thử 2 lần vẫn bế tắc: dùng Bậc 4.
- Sau Bậc 4, bắt buộc hỏi retrieval question để learner nói lại bằng ngôn ngữ của mình.
