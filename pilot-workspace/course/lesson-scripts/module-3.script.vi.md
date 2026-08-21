# Kịch bản Teacher — Module 3: Hiện thực hoá sản phẩm cùng coding agent

## Hợp đồng điều phối

Teacher mở bài bằng đúng hai đoạn đã duyệt trong `course/lessons/module-3.vi.md`. Teacher giới thiệu nội dung theo thứ tự: thực hiện plan theo từng phần, debug, Git và GitHub, Practice, rồi năm câu hỏi tổng kết.

Trong phần giải thích, Teacher không chèn câu hỏi kiểm tra giữa các trang. Người học chỉ trả lời câu hỏi ở cuối bài.

Teacher không yêu cầu người học đọc code hoặc diff. Khi cần đánh giá kết quả, Teacher hướng người học đến hành vi có thể quan sát, phần giải thích của Codex và kết quả kiểm tra hiện tại.

## Thực hiện plan theo từng phần

Teacher giải thích rằng implementation plan đã được duyệt vẫn cần được thực hiện theo từng phần. Sau mỗi phần, Codex phải:

1. giải thích những gì đã thay đổi;
2. chạy các kiểm tra phù hợp;
3. cho người học xem kết quả thực tế;
4. chờ người học chấp nhận hoặc yêu cầu chỉnh sửa.

Chỉ sau khi người học chấp nhận kết quả hiện tại, Codex mới tiếp tục phần tiếp theo.

## Debug cùng coding agent

Teacher dùng nguyên văn nội dung ba trang debug trong lesson.

- Với lỗi nhìn thấy trên màn hình, người học gửi ảnh cùng thao tác vừa thực hiện, kết quả mong đợi và kết quả thực tế.
- Nếu ảnh chưa đủ để xác định nguyên nhân, người học yêu cầu agent thêm log, tái hiện lỗi và đọc thông tin trong terminal.
- Nếu lỗi vẫn quay lại, người học yêu cầu agent tạm dừng, nêu các nguyên nhân có thể và kiểm tra từng nguyên nhân bằng bằng chứng.

Teacher không biến phần này thành bài đọc log hoặc bài học lập trình. Coding agent thực hiện việc điều tra kỹ thuật.

## Git và GitHub

Teacher dạy từng khái niệm theo đúng thứ tự: Git, GitHub, commit, push, branch.

Teacher giải thích mục đích và hệ quả, không yêu cầu người học ghi nhớ câu lệnh. Khi nói về push, Teacher nhắc rằng đây là hành động đưa commit lên GitHub và không tự động xảy ra sau mỗi giai đoạn.

## Practice

Người học tiếp tục trong task Codex đã dùng ở Module 2. Trong lúc Practice đang hoạt động, Teacher Triết không mở chat song song. Teacher chỉ hiển thị hai hành động:

1. **Hoàn thành bài**
2. **Xem lại objective của bài**

Nút **Hoàn thành bài** yêu cầu Course Companion đọc lại bằng chứng hiện tại. Nếu còn thiếu, Teacher nêu đúng phần cần hoàn thành và đưa người học trở lại task Codex. Nếu đã đủ, Teacher yêu cầu người học xem lại website và xác nhận chấp nhận phiên bản hiện tại.

## Câu hỏi tổng kết

Sau khi Practice đạt, Teacher đưa năm câu hỏi trong `course/quizzes/module-3.quiz.json`, từng câu một. Teacher chỉ hiện lời giải sau khi người học đã trả lời.

Sau câu thứ năm, Course Companion đối chiếu kết quả câu hỏi với receipt Practice hiện tại trước khi đánh dấu Module 3 hoàn thành.
