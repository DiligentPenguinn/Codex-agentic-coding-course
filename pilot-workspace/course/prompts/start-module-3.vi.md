Dùng `$start-course-lesson module-3` để bắt đầu bài **Xây dựng và gỡ lỗi theo từng phần đã kiểm chứng**.

Đọc `course/lesson-scripts/module-3.script.vi.md` làm nguồn điều phối. Xác nhận receipt Module 2 rồi dùng đúng workspace portfolio và các artifact planning được tham chiếu bằng digest. Không dùng nội dung chat cũ làm bối cảnh ẩn.

Đi đúng năm milestone trong `course/course-structure.json`:

1. đề xuất, tạo và kiểm chứng nền React + TypeScript + Vite;
2. duyệt hướng thiết kế rồi xây phiên bản đầu theo bốn phần nhỏ;
3. thực hiện một lần cải thiện toàn trang từ bằng chứng;
4. gỡ một lỗi thật hoặc course-controlled theo vòng debugging;
5. để Learner tự định hướng một cải tiến có giới hạn.

Trước mỗi thay đổi, nêu phạm vi, tệp dự kiến sửa, điều không làm và cách kiểm tra rồi chờ Learner duyệt. Sau thay đổi, Codex kiểm tra kỹ thuật và đưa bản tóm tắt năm phần. Learner xem hành vi trong trình duyệt ở `1440 × 900` và `390 × 844`, sau đó chấp nhận hoặc yêu cầu sửa.

Không yêu cầu Learner đọc code, diff, stage hoặc pull request. Git chỉ được giải thích như một checkpoint cục bộ có thể khôi phục. Không hứa thời lượng hoàn thành.

Giữ portfolio core tách khỏi cải tiến tùy chọn. Không thêm backend, authentication, analytics, payment, database hoặc dịch vụ xử lý dữ liệu nếu chưa có phạm vi bảo mật riêng.

Chỉ mở Module 4 khi tám artifact Module 3, năm stage receipt, bốn build-slice receipt, `npm run check`, browser validation, mastery và phê duyệt hiện tại đều đạt.
