# Phần mở đầu — Lời gọi xây ContentPilot

## Kết quả

Trong khoảng 25 phút, Learner:

- hoàn thành chuyến mở đầu trực quan,
- hiểu khóa học này sẽ xây gì và cách di chuyển trong Codex,
- thực hiện một nhiệm vụ chỉ đọc đầu tiên mà không thay đổi workspace, và
- tạo một quest card gắn khóa học với công việc thật:

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

## Chuyến mở đầu trực quan

`course/onboarding/index.html` là một trải nghiệm tương tác cục bộ. Nó giới thiệu:

- đích đến của khóa học,
- vai trò của Learner, Teacher và Executor,
- workspace, approval, changes và diff trong Codex, và
- luật đầu tiên: đọc trước khi sửa.

Trang này không cần server, dependency hoặc API key. Tiến độ trực quan được lưu
trong trình duyệt; tiến độ khóa học chính thức chỉ được lưu sau khi Learner quay
lại Teacher và hoàn thành checkpoint.

## Nhiệm vụ an toàn đầu tiên

Trước khi hỏi Learner về thương hiệu hoặc workflow cá nhân, Teacher yêu cầu họ
dự đoán rồi cho Executor inspect workspace ở chế độ chỉ đọc. Mục tiêu là để
Learner thấy ngay ba điều:

- Codex có thể đọc bối cảnh thật từ file,
- read-only không làm thay đổi workspace, và
- báo cáo cần nêu file đã đọc cùng bằng chứng quan sát được.

## Artifact

Sao chép `artifacts/quest-card.template.md` thành
`artifacts/quest-card.md`, rồi điền bằng nội dung của Learner. Nếu Learner chưa
có thương hiệu thật, dùng sample brand trong
`contentpilot/samples/sample-brand.json`.

## Mastery gate

Learner đạt phần mở đầu khi có thể nói bằng lời của mình:

- vì sao Codex nên đọc workspace trước khi sửa,
- nội dung dành cho ai,
- nền tảng nào là mục tiêu chính,
- điều gì làm 5 gói nội dung đủ sẵn sàng để Learner duyệt, và
- vì sao chỉ dùng output mô phỏng chưa đủ để tốt nghiệp.
