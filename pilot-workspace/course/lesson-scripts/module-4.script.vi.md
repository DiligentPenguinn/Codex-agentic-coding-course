# Kịch bản Teacher — Module 4

## Cách dạy và ranh giới hiện tại

Dùng nội dung trong `course/lessons/module-4.vi.md` theo thứ tự bên dưới. Đối tượng là người chỉ biết dùng máy tính, chưa có nền tảng kỹ thuật. Đọc từng trang, cho người học làm một bước hoặc trả lời một câu rồi mới đi tiếp. Không yêu cầu người học đọc code, ghi nhớ lệnh hoặc tự đoán cấu hình.

Giữ nguyên hai đoạn mở đầu về hosting và ba vai trò. Chỉ giới thiệu Local, Preview, Production sau đó. Trong bài này, agent kiểm tra kỹ thuật và giải thích; người học sở hữu nội dung, tài khoản, việc cấp quyền và quyết định push/deploy/công khai. Người học tự nhập mật khẩu và mã xác nhận trên dịch vụ.

Dùng repo thật đã được đưa lên GitHub ở Module 3. Nếu chỉ có bản Local, quay lại phần thực hành GitHub và đối chiếu repo, branch, commit, Private/Public trước khi import. Nhánh hiện tại chỉ duyệt nội dung trong phiên; không tạo biên nhận Practice hoặc tốt nghiệp, không lấy thao tác bấm tiếp làm bằng chứng.

## Milestone 1 — Hosting, Vercel và bản chuẩn bị phát hành

Giải thích hosting từ vấn đề gửi link localhost. Dùng cùng portfolio để phân biệt nơi sửa, nơi lưu code và nơi mở website. Nêu lợi ích Vercel, điều kiện Hobby và giới hạn sử dụng trước khi chọn gói. Dạy Local/Preview/Production rồi cho người học kiểm tra yêu cầu, nội dung, thao tác, desktop và mobile của portfolio. `npm run preview` vẫn là bản cục bộ. Dùng câu `release-validation-retrieval` sau toàn bộ phần này.

Các trang theo thứ tự:

- Vercel giúp bạn làm gì?
- Tiện, nhưng cần hiểu giới hạn
- Một portfolio, ba nơi để xem
- Trước khi đưa website lên mạng
- Thử như một người lần đầu ghé xem

## Milestone 2 — Nội dung và quyền truy cập

Rà tệp có thể truy cập trực tiếp, quyền dùng tư liệu và mã bí mật trong cả lịch sử trước hành động mạng. Dạy Private/Public của repo khác quyền website. Hướng dẫn team Default Protection: Vercel Authentication + All Deployments trước import, kiểm tra lại ở project sau đó. Standard Protection không bảo vệ địa chỉ Production chính. Nếu không xác định được quyền trước Deploy, dừng và xem màn hình hiện tại; không tự hạ bảo vệ. Dùng `security-publication-retrieval`.

Các trang theo thứ tự:

- Nội dung nào được phép đưa lên mạng?
- Repo riêng tư không làm website riêng tư
- Đặt quyền trước lần triển khai đầu

## Milestone 3 — Đưa portfolio lên Vercel và tạo Preview

Hướng dẫn bằng trình duyệt: New Project → Import Git Repository → cấp quyền đúng repo → Import → đối chiếu cài đặt → Deploy → đọc kết quả. Lần đầu luôn là Production nhưng phải giữ được bảo vệ. Sau đó tạo một thay đổi nhỏ trên branch khác Production Branch để có Preview thật. Kiểm tra Ready, môi trường, commit, URL, hành vi và quyền truy cập. Cho người học ghi bằng chứng của chính họ. Không bắt buộc CLI `inspect`; dashboard có thể cung cấp thông tin tương đương. Dùng `preview-deployment-retrieval`.

Các trang theo thứ tự:

- Chuẩn bị lần triển khai đầu
- Mở trang tạo project
- Chọn đúng repo
- Để agent chuẩn bị cài đặt
- Đối chiếu cài đặt với agent
- Bấm Deploy và đọc kết quả
- Tạo một Preview để tập cập nhật
- Mở đúng bản rồi mới chấp nhận

## Milestone 4 — Công bố, cập nhật và khôi phục

Phân biệt tạo deployment Production với công khai website. Công khai Production là lựa chọn; người học được giữ bảo vệ và ghi việc cần làm tiếp. Nếu đồng ý cập nhật, merge/push branch đã kiểm tra vào Production Branch, kiểm tra deployment mới và địa chỉ chính. Chỉ đổi quyền của đúng project khi có quyết định công khai. Dạy kiểm tra sau công bố, cách chia sẻ, tên miền tùy chọn, cập nhật nhỏ, lỗi build, rollback và Undo Rollback. Sau rollback, push mới không tự thay địa chỉ chính cho đến khi khôi phục cơ chế phát hành. Không yêu cầu gây lỗi trên website thật. Dùng `production-decision-retrieval`.

Các trang theo thứ tự:

- Bạn quyết định lúc nào công khai
- Đưa bản đã duyệt vào website chính
- Kiểm tra sau khi công bố
- Để đường link sẵn sàng chia sẻ
- Muốn chỉnh portfolio thì làm thế nào?
- Giao một lần sửa có điểm dừng
- Khi Vercel báo lỗi
- Khi cần quay lại bản đang hoạt động
- Tiếp tục phát hành sau khi khôi phục

## Milestone 5 — Làm chủ portfolio và áp dụng cho dự án khác

Người học tự giải thích một quyết định dựa trên bằng chứng thật, rồi lưu ghi chú quản lý repo, Vercel, phiên bản, cập nhật và khôi phục. Bài chuyển giao chỉ lập kế hoạch cho ứng dụng khác, không mở thêm một lần xây ứng dụng. Dùng `ownership-transfer-retrieval`, rồi Practice khi được nối lại, sau đó tám câu cuối bài từng câu một. Preview đã kiểm chứng là điều kiện bắt buộc của Practice dự kiến; lựa chọn chưa công khai không làm mất kết quả này.

Các trang theo thứ tự:

- Bạn cần nắm gì về portfolio của mình?
- Lưu lại để lần sau tiếp tục được
- Thử áp dụng cho một việc khác

## Ảnh, nguồn và bằng chứng

Ba ảnh tham chiếu được chụp qua trình duyệt ngày 14/09/2026: trang New Project chưa đăng nhập và hai hình giao diện trong tài liệu Vercel. Course Companion đặt các số chú thích trên ảnh gốc và giữ chúng khi phóng to. Các ảnh cài đặt không phải ảnh tài khoản người học và không xác nhận hành động đã thành công. Nếu màn hình khác, đối chiếu tài liệu chính thức trong cuối lesson thay vì đoán vị trí nút.

Luồng CLI dùng trang khởi tạo trung tính đã được thử trước đây chỉ là bằng chứng lịch sử. Nó không còn là luồng bắt buộc của bài trình duyệt này và không chứng minh luồng mới đã được diễn tập với tài khoản thật. Không mô tả Production đầu tiên là bắt buộc công khai.

## Đánh giá

Năm câu nhanh và tám câu cuối bài nằm trong `course/quizzes/module-4.quiz.json`. Chỉ hiện đáp án, lời giải và nguồn sau câu trả lời hiện tại. Câu tự viết dựa trên bằng chứng hiện tại của người học; thiếu bằng chứng thì hướng dẫn họ bổ sung, không đưa câu trả lời mẫu để chép.

Practice và bài kiểm tra là hai điều kiện độc lập. Giữ Practice/evidence adapters, receipt và tốt nghiệp ở trạng thái hoãn trong nhánh soạn nội dung. Không ghi nhận hoàn thành chính thức hoặc suy ra chấp nhận từ việc duyệt hết các trang.

Trong Course Companion hiện tại, bản duyệt nội dung hiển thị cả nhóm câu hỏi trên một trang. Quy tắc từng câu một áp dụng khi Teacher dạy trực tiếp; chưa mô tả giao diện duyệt hiện tại là đã thực hiện quy tắc đó.
