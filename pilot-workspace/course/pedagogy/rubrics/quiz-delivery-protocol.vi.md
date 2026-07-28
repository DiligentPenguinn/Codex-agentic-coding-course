# Giao thức quiz - Vietnamese

Quiz trong khóa học này kiểm tra khả năng vận dụng, không kiểm tra trí nhớ ngắn hạn. Teacher phải hỏi từng câu một và chờ learner trả lời trước khi sang câu tiếp theo.

## Cách đưa quiz

- Không stack nhiều câu hỏi trong một lượt.
- Trước khi hỏi mỗi câu, mở Assessment State nội bộ với question id, mục đích câu hỏi, expected signals, phần không được tiết lộ và điều kiện đóng câu.
- Mỗi lượt chỉ có một câu hỏi chính.
- Với câu trắc nghiệm một đáp án, nếu giao diện hỗ trợ lựa chọn, dùng danh sách lựa chọn. Nếu không, trình bày A/B/C/D gọn và yêu cầu learner chọn một phương án.
- Với câu trắc nghiệm nhiều đáp án, trình bày các lựa chọn gọn và yêu cầu learner chọn nhiều phương án bằng ký hiệu.
- Sau khi learner trả lời, phản hồi ngắn: đúng/chưa đạt, vì sao, và câu tiếp theo.
- Không cho đáp án của câu sau trước khi learner trả lời câu hiện tại.
- Không đóng Assessment State nếu câu hiện tại còn thiếu rationale bắt buộc, thiếu evidence tự luận, hoặc cần repair.
- Nếu learner hỏi làm rõ khi state đang mở, chỉ làm rõ yêu cầu và tiêu chí; không đưa đáp án, không loại trừ hộ các lựa chọn sai theo cách làm lộ đáp án.

## Chống câu trả lời chép lại

Không chấp nhận câu trả lời tự luận nếu nó chỉ lặp lại nguyên văn lời Teacher hoặc lựa chọn vừa thấy mà không có áp dụng mới.

Nếu nghi learner chép-dán:

1. Không mắng learner.
2. Nói ngắn: "Câu này đúng hướng, nhưng mình cần thấy bạn áp dụng bằng lời của bạn."
3. Yêu cầu learner viết lại với một ví dụ riêng, một ràng buộc riêng, hoặc một tình huống mới.
4. Giữ Assessment State mở cho tới khi learner gửi lại câu trả lời đủ evidence.

## Thiết kế câu hỏi

Câu hỏi tốt nên có ít nhất một trong các yếu tố:

- Một tình huống mới chưa xuất hiện nguyên văn trong kịch bản.
- Một yêu cầu rewrite hoặc phân loại theo bối cảnh.
- Một quyết định có trade-off.
- Một artifact nhỏ learner phải tự tạo.
- Một câu giải thích bằng lời của learner.

Tránh câu hỏi mà learner có thể trả lời bằng cách chép một câu ở lượt ngay trước.

## Chấm mastery

- Chấm theo tín hiệu quan sát được, không chấm theo cảm giác.
- Với trắc nghiệm một đáp án, nếu câu quan trọng, hỏi thêm một câu lý do ngắn bằng lời của learner.
- Với tự luận, cần ít nhất một chi tiết cụ thể không có trong lời Teacher ngay trước đó.
- Nếu chưa đạt, đưa bài sửa nhỏ và hỏi lại một biến thể, không chuyển sang lesson mới.
