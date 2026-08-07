# Module 1 — Thiết lập dự án và làm việc an toàn với Codex

## Kết quả

Sau khoảng 70 phút, bạn có thể:

- chạy ứng dụng ContentPilot ban đầu rồi đọc và kiểm tra cấu trúc của nó,
- phân biệt hướng dẫn dùng lâu dài với yêu cầu chỉ dùng cho một công việc,
- viết bản mô tả công việc có phạm vi và tiêu chí hoàn thành,
- xem và duyệt kế hoạch trước khi Codex sửa file,
- xem phần so sánh thay đổi (`diff`), chạy kiểm tra và quan sát giao diện, và
- giải thích vì sao thay đổi an toàn để chấp nhận.

## Ứng dụng dùng để thực hành

Ứng dụng nằm trong `contentpilot/`. Trạng thái ban đầu (`baseline`) là một ứng
dụng chạy được nhưng chưa có quy trình tạo nội dung. Module này không thêm AI,
nghiên cứu, tạo bản nháp, đăng bài hoặc kết nối hệ thống bên ngoài.

## Bài thực hành chỉnh sửa giao diện

Cải thiện nút hành động chính trên màn hình chào mừng khi xem bằng màn hình hẹp:

- phạm vi cho phép: `contentpilot/app/page.tsx` và
  `contentpilot/app/globals.css`,
- khi khung hiển thị rộng tối đa 640px, nút phải chiếm toàn bộ chiều rộng của
  cột nội dung, có vùng chạm cao ít nhất 54px và giữ mũi tên ở mép phải,
- trên máy tính, nút vẫn chỉ rộng vừa đủ nội dung như trạng thái ban đầu,
- trang không bị tràn ngang,
- không đổi route đích `/setup`,
- không sửa file ngoài phạm vi.

Trạng thái ban đầu phải vượt qua kiểm tra trước khi bạn cho phép sửa file. Sau
khi sửa, `npm run check` phải đạt; bạn cũng cần xem phần thay đổi và kiểm tra
giao diện trên máy tính lẫn màn hình hẹp.

## Bản ghi bằng chứng

Sao chép `artifacts/module-1-evidence.template.md` thành
`artifacts/module-1-evidence.md`. File này ghi lại lệnh đã chạy, bản mô tả công
việc, file đã thay đổi, kết quả kiểm tra, quan sát giao diện, quyết định chấp
nhận và rủi ro còn lại.

## Tiêu chí hoàn thành

Module hoàn thành khi:

- app chạy bằng lệnh được ghi trong README,
- `npm run check` đạt,
- giao diện đúng bản mô tả công việc trên máy tính và màn hình hẹp,
- phần so sánh thay đổi chỉ chứa file đã được phê duyệt,
- `contentpilot/AGENTS.md` có lựa chọn dự án riêng của Learner,
- bạn phân biệt đúng hành động chỉ đọc, sửa file, dùng mạng hoặc cài đặt, xóa dữ
  liệu và xuất bản ra bên ngoài, và
- bạn giải thích được vì sao bằng chứng đủ để chấp nhận thay đổi.
