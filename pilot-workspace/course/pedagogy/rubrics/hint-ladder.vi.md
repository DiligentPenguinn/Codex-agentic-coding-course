# Các mức gợi ý — Ưu tiên tiếng Việt

Các mức gợi ý giúp Teacher hỗ trợ đúng lúc mà vẫn để learner tự áp dụng. Trước
khi hỏi mở, Teacher cần chắc rằng khái niệm đã được giới thiệu rõ. Nếu learner
chưa quen với quyết định, hãy đưa lựa chọn thực tế và một khuyến nghị trước.

## Bậc 0 - Chẩn đoán

Mục tiêu: hiểu learner đang vướng ở đâu.

Teacher hỏi:

- "Bạn đang muốn coding agent giúp làm rõ điều gì trước?"
- "Phần nào của prompt này đang mơ hồ?"
- "Sau cuộc phỏng vấn, bạn muốn nhận tài liệu gì?"

Dùng khi:

- Learner đưa câu trả lời ngắn, mơ hồ, hoặc đoán sai.
- Chưa rõ learner thiếu concept nào.

## Bậc 1 - Câu hỏi định hướng

Mục tiêu: giúp learner tự tìm hướng từ thông tin đã được giới thiệu.

Teacher hỏi:

- "Điều này mô tả sản phẩm cần làm gì hay mô tả cách xây sản phẩm?"
- "Tiêu chí này có thể quan sát và kiểm tra được chưa?"
- "Bước này truy ngược về yêu cầu nào trong PRD?"

## Bậc 2 - Gợi ý nhẹ

Mục tiêu: thu hẹp phạm vi suy nghĩ nhưng vẫn để learner tự hoàn thành.

Teacher nói:

- "Hãy tìm trong prompt 4 thành phần: mục tiêu, bối cảnh, cách trao đổi và output cần nhận."
- "Ở bước PRD, hãy yêu cầu agent hỏi một câu mỗi lượt và chưa bàn cách viết code."
- "Ở bước implementation plan, hãy chỉ định PRD là nguồn phạm vi và yêu cầu cách kiểm tra cho từng bước."

## Bậc 3 - Ví dụ một phần

Mục tiêu: cho mẫu nhỏ để learner hoàn thiện tiếp.

Teacher đưa:

```text
Hãy giúp tôi làm rõ ý tưởng sản phẩm [tên sản phẩm].
Hãy hỏi tôi [cách trao đổi] và sau đó tạo [output cần nhận].
Trong bước này, chưa [điều không được làm].
```

Sau đó hỏi:

- "Bạn sẽ thêm bối cảnh và các phần bắt buộc nào để output đủ rõ?"

## Bậc 4 - Lời giải mẫu

Mục tiêu: giải tỏa bế tắc sau khi learner đã thử.

Teacher đưa câu trả lời đầy đủ, nhưng phải kèm:

- vì sao đáp án đúng
- dấu hiệu nào giúp nhận ra
- learner sẽ làm gì trong lần tiếp theo

Mẫu:

```text
Prompt tốt hơn cho một ví dụ khác:
Tôi muốn làm một ứng dụng lên thực đơn từ nguyên liệu có sẵn. Hãy phỏng vấn tôi
từng câu một để làm rõ PRD. Hỏi về luồng chính, input, output, phạm vi phiên bản
đầu, ngoài phạm vi, Done When và câu hỏi còn mở. Dùng ngôn ngữ dành cho người
mới, chưa bàn code. Khi đủ thông tin, hãy soạn PRD một trang để tôi review.
```

## Quy tắc chuyển bậc

- Nếu learner trả lời gần đúng: dùng Bậc 1 hoặc Bậc 2.
- Nếu learner sai vì thiếu concept: dùng Bậc 2, rồi cho một ví dụ nhỏ.
- Nếu learner xin "cho đáp án luôn" nhưng chưa thử: cho Bậc 3 trước.
- Nếu learner đã thử 2 lần vẫn bế tắc: dùng Bậc 4.
- Sau Bậc 4, hỏi learner nhắc lại ý chính bằng ngôn ngữ của mình.
