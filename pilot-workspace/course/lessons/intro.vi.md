# Phần mở đầu — Giới thiệu khóa học

## Kết quả

Trong khoảng 25 phút, bạn sẽ:

- xem phần giới thiệu trực quan,
- hiểu cách khóa học giúp bạn làm việc cùng coding agent và vai trò của dự án
  thực hành ContentPilot,
- nhận ra phần việc bạn quyết định và phần việc coding agent có thể thực thi,
- hoàn thành một bài thực hành chỉ đọc mà không thay đổi workspace, và
- tạo một phiếu định hướng để gắn khóa học với công việc thật:

  - nhóm người cần phục vụ,
  - một nền tảng nội dung chính,
  - vấn đề nội dung lặp lại mỗi tuần,
  - nhịp xuất bản,
  - nguồn ví dụ đang có,
  - tiêu chí quan sát được để 5 bộ nội dung sẵn sàng cho bạn duyệt, và
  - những quyết định bạn luôn muốn tự mình giữ lại.

## Dự án dùng để thực hành

ContentPilot không phải nội dung học chính. Đây là dự án xuyên suốt để bạn luyện
cách đọc một codebase, giao việc có phạm vi, cho phép hành động, dùng công cụ,
kiểm tra bằng chứng và phục hồi khi kết quả chưa đạt.

Khi hoàn thành toàn bộ khóa học, dự án thực hành này sẽ trở thành một ứng dụng
cục bộ. Ứng dụng nhận dữ liệu thương hiệu, đề xuất 10 ý tưởng, giúp bạn chọn 5
ý tưởng rồi tạo 5 bộ nội dung để duyệt, lưu và xuất. Mỗi mốc sản phẩm là một
tình huống để luyện kỹ năng agentic coding có thể dùng cho dự án khác.

Để chứng minh một tích hợp AI hoạt động thật, bạn cần chạy OpenAI API thật ít
nhất một lần. Dữ liệu mô phỏng chỉ dùng để học hoặc xử lý lỗi. Phần hiện tại
tập trung vào vòng làm việc nền tảng: đọc, làm rõ, duyệt, thực thi và kiểm chứng.

## Phần giới thiệu trực quan

`course/onboarding/index.html` là một trang hướng dẫn tương tác chạy ngay trên
máy. Trang dùng ảnh giao diện Codex để giới thiệu:

- kỹ năng bạn sẽ học và dự án dùng để thực hành,
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

Đây là kỹ năng có thể chuyển sang bất kỳ codebase nào, không phụ thuộc vào
ContentPilot.

## Phiếu định hướng cá nhân

Sao chép `artifacts/quest-card.template.md` thành
`artifacts/quest-card.md`, rồi điền bằng nội dung của bạn. Tên file này được giữ
nguyên để bạn có thể dừng và tiếp tục đúng chỗ. Nếu chưa có thương hiệu thật, bạn có
thể dùng thương hiệu mẫu trong
`contentpilot/samples/sample-brand.json`.

## Tiêu chí hoàn thành

Bạn hoàn thành phần mở đầu khi có thể giải thích bằng lời của mình:

- vì sao Codex nên đọc workspace trước khi sửa,
- đâu là quyết định của bạn và đâu là phần Codex có thể thực thi,
- nội dung dành cho ai,
- nền tảng nào là mục tiêu chính,
- điều gì làm 5 gói nội dung đủ sẵn sàng để Learner duyệt, và
- vì sao chỉ dùng kết quả mô phỏng chưa đủ để chứng minh một tích hợp AI hoạt
  động thật.
