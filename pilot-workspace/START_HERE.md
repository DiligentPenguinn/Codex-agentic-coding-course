# Vibecoding 101 — Học agentic coding cùng Codex

Bạn sẽ học cách giao việc, kiểm soát phạm vi và kiểm chứng kết quả khi làm việc
cùng coding agent. ContentPilot là dự án thực hành xuyên suốt để bạn áp dụng
những kỹ năng đó vào một ứng dụng thật. Bạn không cần biết lập trình trước.

## Bạn sẽ bắt đầu như thế nào?

1. Tải và giải nén toàn bộ workspace này.
2. Mở **thư mục gốc của workspace** trong Codex.
3. Nhập:

   ```text
   $start-course-lesson intro
   ```

4. Teacher sẽ mở một phần giới thiệu trực quan khoảng 3 phút. Trang HTML này
   giải thích cách học, vai trò của dự án thực hành và bốn khu vực chính trong
   Codex. Nó không thể đọc, sửa hoặc chạy bất kỳ thứ gì trong workspace.
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

Bạn chưa cần OpenAI API key trong phần học hiện tại. Khi một bài sau cần dùng
API thật, khóa học sẽ giải thích mục đích, ước tính chi phí và chờ bạn quyết
định trước khi chạy.

## Bạn sẽ luyện những gì?

- Bắt đầu và tiếp tục bài học đúng chỗ.
- Đọc dự án và kiểm tra giả định trước khi yêu cầu thay đổi.
- Biến một yêu cầu mơ hồ thành bản mô tả công việc có phạm vi và tiêu chí rõ.
- Cho phép một thay đổi nhỏ sau khi hiểu kế hoạch và rủi ro.
- Xem phần so sánh thay đổi (`diff`), kết quả kiểm tra và giao diện thực tế
  trước khi chấp nhận.
- Áp dụng lại cùng quy trình cho một dự án khác, không chỉ ContentPilot.

Workspace này hiện có phần giới thiệu và bài học đầu tiên. Các phần tiếp theo
sẽ tiếp tục dùng ContentPilot để luyện những kỹ năng agentic coding nâng cao
hơn.
