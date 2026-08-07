# Codex Content Builder Academy — Pilot 0.1

Bạn sẽ học cách cộng tác an toàn với Codex bằng cách cải thiện một ứng dụng thật
tên là ContentPilot. Pilot này gồm phần mở đầu và Module 1. Bạn không cần biết
lập trình trước.

## Bạn sẽ bắt đầu như thế nào?

1. Tải và giải nén toàn bộ workspace này.
2. Mở **thư mục gốc của workspace** trong Codex.
3. Nhập:

   ```text
   $start-course-lesson intro
   ```

4. Teacher sẽ mở một phần giới thiệu trực quan khoảng 3 phút. Trang HTML này
   giải thích mục tiêu khóa học và bốn khu vực chính trong Codex. Nó không thể
   đọc, sửa hoặc chạy bất kỳ thứ gì trong workspace.
5. Khi trang hướng dẫn yêu cầu, quay lại chính task Codex đang mở. Tại đây bạn
   sẽ làm bài thực hành đầu tiên: cho Codex đọc workspace mà không sửa file.
6. Sau đó Teacher sẽ hỏi từng câu cần thiết để tạo phiếu định hướng cá nhân,
   lưu tiến độ cục bộ và dẫn bạn vào Module 1.
7. Khi quay lại sau, nhập:

   ```text
   $start-course-lesson resume
   ```

Kỹ năng hướng dẫn, bài học và ứng dụng đều nằm trong cùng workspace. Bạn không
cần cài thêm skill toàn cục hoặc sao chép một prompt dài.

## Trước khi vào Module 1

- Node.js 20.19 trở lên
- npm 10.9 trở lên
- Codex có thể đọc workspace này

Bạn chỉ cần cài các gói phụ thuộc khi Teacher giải thích mục đích và dẫn đến
bước đó:

```bash
cd contentpilot
npm install
```

Không cần OpenAI API key trong Pilot 0.1. Những module sau mới dùng API thật.
Khi đến đó, khóa học sẽ ước tính chi phí và báo trước; bạn tự quyết định có
chạy hay không.

## Bạn sẽ luyện những gì?

- Bắt đầu và tiếp tục bài học đúng chỗ.
- Biến một yêu cầu mơ hồ thành bản mô tả công việc có phạm vi và tiêu chí rõ.
- Cho phép một thay đổi nhỏ sau khi hiểu kế hoạch và rủi ro.
- Xem phần so sánh thay đổi (`diff`), kết quả kiểm tra và giao diện thực tế
  trước khi chấp nhận.

Pilot 0.1 chỉ gồm phần giới thiệu và Module 1; năm module còn lại chưa có trong
workspace này.
