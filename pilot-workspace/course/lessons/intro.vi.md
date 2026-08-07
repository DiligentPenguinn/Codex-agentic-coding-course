# Phần mở đầu — Bắt đầu với ContentPilot

## Kết quả

Trong khoảng 25 phút, bạn sẽ:

- xem phần giới thiệu trực quan,
- hiểu sản phẩm sẽ được xây và bốn khu vực chính trong Codex,
- hoàn thành một bài thực hành chỉ đọc mà không thay đổi workspace, và
- tạo một phiếu định hướng để gắn khóa học với công việc thật:

  - nhóm người cần phục vụ,
  - một nền tảng nội dung chính,
  - vấn đề nội dung lặp lại mỗi tuần,
  - nhịp xuất bản,
  - nguồn ví dụ đang có,
  - tiêu chí quan sát được để 5 bộ nội dung sẵn sàng cho bạn duyệt, và
  - những quyết định bạn luôn muốn tự mình giữ lại.

## Bối cảnh sản phẩm

Khi hoàn thành toàn bộ khóa học, ContentPilot sẽ là một ứng dụng cục bộ. Ứng
dụng nhận dữ liệu thương hiệu, đề xuất 10 ý tưởng, giúp bạn chọn 5 ý tưởng rồi
tạo 5 bộ nội dung để duyệt, lưu và xuất. Mỗi bộ gồm bài viết cùng các phần hỗ
trợ như câu mở đầu, lời kêu gọi hành động và gợi ý hình ảnh.

Để hoàn thành toàn bộ khóa học, bạn cần chạy OpenAI API thật ít nhất một lần.
Dữ liệu mô phỏng chỉ dùng để học hoặc xử lý lỗi. Pilot 0.1 chưa xây toàn bộ quy
trình trên; phần hiện tại giúp bạn luyện một vòng làm việc an toàn với Codex.

## Phần giới thiệu trực quan

`course/onboarding/index.html` là một trang hướng dẫn tương tác chạy ngay trên
máy. Trang dùng ảnh giao diện Codex để giới thiệu:

- sản phẩm bạn sẽ xây,
- ranh giới giữa phần hướng dẫn bằng HTML và công việc thật trong Codex,
- nơi giao yêu cầu, theo dõi tiến độ, review thay đổi và xem terminal, và
- luật đầu tiên: đọc trước khi sửa.

Trang này không đóng vai Teacher hoặc Executor và không thể đọc, sửa hay chạy
bất kỳ thứ gì trong workspace. Nó không cần máy chủ, gói phụ thuộc hoặc API
key. Tiến độ của trang được lưu trong trình duyệt; tiến độ khóa học chỉ được lưu
sau khi bạn quay lại task Codex và hoàn thành từng bước.

## Bài thực hành chỉ đọc đầu tiên

Sau khi rời trang hướng dẫn và quay lại task Codex, bạn sẽ dự đoán kết quả rồi
cho Executor đọc và kiểm tra workspace ở chế độ chỉ đọc. Mục tiêu là giúp bạn
thấy ngay ba điều:

- Codex có thể đọc bối cảnh thật từ file,
- read-only không làm thay đổi workspace, và
- báo cáo cần nêu file đã đọc và bằng chứng cụ thể.

## Phiếu định hướng cá nhân

Sao chép `artifacts/quest-card.template.md` thành
`artifacts/quest-card.md`, rồi điền bằng nội dung của bạn. Tên file nội bộ được
giữ nguyên để hệ thống theo dõi tiến độ. Nếu chưa có thương hiệu thật, bạn có
thể dùng thương hiệu mẫu trong
`contentpilot/samples/sample-brand.json`.

## Tiêu chí hoàn thành

Bạn hoàn thành phần mở đầu khi có thể giải thích bằng lời của mình:

- vì sao Codex nên đọc workspace trước khi sửa,
- nội dung dành cho ai,
- nền tảng nào là mục tiêu chính,
- điều gì làm 5 gói nội dung đủ sẵn sàng để Learner duyệt, và
- vì sao chỉ dùng kết quả mô phỏng chưa đủ để hoàn thành toàn bộ khóa học.
