# Implementation plan mẫu — Portfolio của Mai

> Đây là ví dụ giả lập để học cách đọc format. Đây không phải đáp án cho
> portfolio của bạn và bạn không cần tự điền tài liệu này.

## Mục tiêu

Xây phiên bản đầu tiên của portfolio giúp nhà tuyển dụng hiểu Mai là một UX
Designer, xem hai dự án tiêu biểu và liên hệ với Mai.

## Yêu cầu và ranh giới

- `REQ-01`: Phần đầu trang hiển thị tên, vai trò và một câu giới thiệu ngắn.
- `REQ-02`: Trang giới thiệu hai dự án. Mỗi dự án nêu vấn đề, vai trò của Mai,
  cách tiếp cận và kết quả.
- `REQ-03`: Người xem mở được thông tin liên hệ từ đầu hoặc cuối trang.
- `REQ-04`: Trang không cuộn ngang ở chiều rộng 390 px.
- `REQ-05`: Các liên kết dùng được bằng bàn phím và có trạng thái focus dễ nhìn.
- Không công khai số điện thoại, địa chỉ nhà hoặc tài liệu chưa được phép chia
  sẻ.
- Phiên bản đầu chưa có blog, đăng nhập hoặc hệ thống quản trị nội dung.

## Các giai đoạn triển khai

### Giai đoạn 1 — Chuẩn bị cấu trúc và nội dung

- Mục tiêu: tạo nền trang và lưu nội dung portfolio ở một nơi dễ cập nhật.
- Việc cần làm: tạo ba phần Giới thiệu, Dự án và Liên hệ; thêm nội dung đã được
  Mai duyệt cho hai dự án.
- Kết quả cần thấy: trang hiển thị đủ ba phần và không có nội dung giả.
- Cách kiểm tra: đối chiếu tên hai dự án với PRD và xác nhận không có dữ liệu
  riêng tư.

### Giai đoạn 2 — Xây phần giới thiệu và điều hướng

- Mục tiêu: giúp người xem hiểu Mai là ai và đi tới nội dung quan trọng.
- Việc cần làm: hiển thị tên, vai trò, lời giới thiệu và liên kết tới phần Dự án
  cùng Liên hệ.
- Kết quả cần thấy: người xem hiểu vai trò của Mai ngay ở màn hình đầu.
- Cách kiểm tra: dùng chuột và phím Tab để thử các liên kết.

### Giai đoạn 3 — Xây phần dự án

- Mục tiêu: trình bày hai dự án theo cùng một cấu trúc.
- Việc cần làm: hiển thị vấn đề, vai trò, cách tiếp cận và kết quả của từng dự
  án.
- Kết quả cần thấy: hai dự án có cùng thứ tự thông tin và không có tuyên bố vượt
  quá bằng chứng.
- Cách kiểm tra: đối chiếu từng nội dung với nguồn Mai đã cung cấp.

### Giai đoạn 4 — Hoàn thiện màn hình hẹp và khả năng tiếp cận

- Mục tiêu: bảo đảm portfolio đọc được và thao tác được ở các trạng thái chính.
- Việc cần làm: chuyển danh sách dự án thành một cột trên màn hình hẹp; thêm
  trạng thái focus; kiểm tra thứ tự tiêu đề và văn bản thay thế của ảnh.
- Kết quả cần thấy: nội dung không bị che, trang không cuộn ngang và focus luôn
  nhìn thấy.
- Cách kiểm tra: xem trang ở 1440 × 900 và 390 × 844, sau đó đi qua toàn bộ trang
  chỉ bằng bàn phím.

### Giai đoạn 5 — Kiểm tra trước khi duyệt

- Mục tiêu: xác nhận phiên bản đầu đáp ứng PRD.
- Việc cần làm: chạy kiểm tra tự động, kiểm tra trực tiếp từng yêu cầu và lưu ảnh
  ở hai kích thước màn hình.
- Kết quả cần thấy: mỗi yêu cầu đều có kết quả kiểm tra hoặc được ghi rõ là chưa
  đạt.
- Cách kiểm tra: đối chiếu kết quả với PRD rồi gửi Mai xem và yêu cầu sửa hoặc
  duyệt.

## Tệp dự kiến thay đổi

- `src/App.tsx`: cấu trúc trang.
- `src/data/projects.ts`: nội dung hai dự án.
- `src/components/Hero.tsx`: phần giới thiệu.
- `src/components/Navigation.tsx`: điều hướng.
- `src/components/ProjectCard.tsx`: cách hiển thị một dự án.
- `src/styles.css`: bố cục và các trạng thái giao diện.

## Cách kiểm tra toàn bộ plan

- Trang mở được và không có lỗi chặn hiển thị.
- Năm yêu cầu đều có kết quả kiểm tra được ghi lại.
- Trang không cuộn ngang ở 390 × 844.
- Người kiểm tra đi tới mọi liên kết bằng bàn phím và luôn nhìn thấy focus.
- Nội dung không có dữ liệu riêng tư hoặc tuyên bố vượt quá bằng chứng.

## Rủi ro và giả định

- Rủi ro: nội dung dự án có thể quá dài trên điện thoại. Cách xử lý là giới hạn
  đoạn tóm tắt và kiểm tra ở 390 px.
- Rủi ro: một số hình ảnh có thể chưa rõ quyền sử dụng. Không công khai chúng
  cho đến khi Mai xác nhận.
- Giả định: Mai đã có nội dung cơ bản cho hai dự án và có thể duyệt trước khi
  xây.
- Giả định: email là phương thức liên hệ chính của phiên bản đầu.

## Phê duyệt

- Trạng thái: chưa thực hiện.
- Người duyệt: Mai.
- Quyết định tiếp theo: yêu cầu sửa plan hoặc duyệt để Module 3 đề xuất bước xây
  đầu tiên.
