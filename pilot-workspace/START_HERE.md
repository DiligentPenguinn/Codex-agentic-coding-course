# Codex Content Builder Academy — Pilot 0.1

Bạn sẽ học cách cộng tác an toàn với Codex bằng cách cải thiện một ứng dụng thật
tên là ContentPilot. Pilot này gồm phần mở đầu và Module 1. Bạn không cần biết
lập trình trước.

## Trải nghiệm dự kiến

1. Tải và giải nén toàn bộ workspace này.
2. Mở **thư mục gốc của workspace** trong Codex.
3. Nhập:

   ```text
   $start-course-lesson intro
   ```

4. Teacher sẽ hỏi từng câu một, lưu checkpoint cục bộ và dẫn bạn vào Module 1.
5. Khi quay lại sau, nhập:

   ```text
   $start-course-lesson resume
   ```

Course skill, bài học và ứng dụng đều nằm trong cùng workspace. Bạn không cần
cài một skill toàn cục hoặc sao chép prompt dài.

## Yêu cầu cho Module 1

- Node.js 20.19 trở lên
- npm 10.9 trở lên
- Codex có thể đọc workspace này

Bạn chỉ cần cài dependency khi Teacher dẫn đến bước đó:

```bash
cd contentpilot
npm install
```

Không cần OpenAI API key trong Pilot 0.1. Những module sau mới dùng API thật.
Khi đến đó, khóa học sẽ ước tính chi phí và cảnh báo trước; Learner tự quyết
định có chạy hay không.

## Pilot này kiểm tra điều gì?

- Người mới có hiểu cách bắt đầu và tiếp tục bài học không?
- Một cuộc trò chuyện có giúp họ biến yêu cầu mơ hồ thành task brief kiểm chứng
  được không?
- Họ có thể phê duyệt một thay đổi nhỏ, đọc diff và xác nhận bằng chứng không?
- Workspace tải về có đủ thuận tiện để học mà không cần một nền tảng course
  riêng không?

Pilot 0.1 chưa đại diện cho toàn bộ khóa học sáu module. Nó kiểm tra format và
trải nghiệm cốt lõi trước khi mở rộng nội dung.

