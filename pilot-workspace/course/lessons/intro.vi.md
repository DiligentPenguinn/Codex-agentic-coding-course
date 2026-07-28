# Phần mở đầu — Xác định quy trình nội dung hằng tuần

## Kết quả

Trong khoảng 20 phút, Learner tạo một quest card gắn khóa học với công việc thật:

- nhóm người cần phục vụ,
- một nền tảng nội dung chính,
- vấn đề nội dung lặp lại mỗi tuần,
- nhịp xuất bản,
- nguồn ví dụ đang có,
- tiêu chí quan sát được cho 5 gói nội dung sẵn sàng để duyệt, và
- cách Learner giữ quyền quyết định.

## Bối cảnh sản phẩm

ContentPilot cuối khóa là một ứng dụng cục bộ giúp Learner đi từ dữ liệu thương
hiệu đến 10 ý tưởng, chọn 5 ý tưởng, tạo 5 gói bài viết, duyệt, lưu trữ và xuất.
Tốt nghiệp yêu cầu ít nhất một lần chạy OpenAI API thật. Dữ liệu mô phỏng chỉ
dùng để học hoặc xử lý lỗi.

Pilot 0.1 không xây toàn bộ workflow đó. Pilot kiểm tra xem Learner có thể bắt
đầu, quay lại và hoàn thành một vòng cộng tác an toàn với Codex hay không.

## Artifact

Sao chép `artifacts/quest-card.template.md` thành
`artifacts/quest-card.md`, rồi điền bằng nội dung của Learner. Nếu Learner chưa
có thương hiệu thật, dùng sample brand trong
`contentpilot/samples/sample-brand.json`.

## Mastery gate

Learner đạt phần mở đầu khi có thể nói bằng lời của mình:

- nội dung dành cho ai,
- nền tảng nào là mục tiêu chính,
- điều gì làm 5 gói nội dung đủ sẵn sàng để Learner duyệt, và
- vì sao chỉ dùng output mô phỏng chưa đủ để tốt nghiệp.

