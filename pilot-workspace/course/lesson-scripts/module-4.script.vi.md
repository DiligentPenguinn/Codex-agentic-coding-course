# Kịch bản Teacher — Module 4

## Cách dạy và ranh giới hiện tại

Dùng nội dung trong `course/lessons/module-4.vi.md` theo thứ tự bên dưới. Đối tượng là người chỉ biết dùng máy tính, chưa có nền tảng kỹ thuật. Đọc từng trang và hướng dẫn từng bước. Không đặt câu hỏi kiểm tra giữa bài; chỉ đánh giá sau khi học hết phần hướng dẫn. Không yêu cầu người học đọc code, ghi nhớ lệnh hoặc tự đoán cấu hình.

Giữ nguyên hai đoạn mở đầu về hosting và ba vai trò. Chỉ giới thiệu Local, Preview, Production sau đó. Trong bài này, agent kiểm tra kỹ thuật và giải thích; người học sở hữu nội dung, tài khoản, việc cấp quyền và quyết định push/deploy/công khai. Người học tự nhập mật khẩu và mã xác nhận trên dịch vụ.

Dùng repo thật đã được đưa lên GitHub ở Module 3. Nếu chỉ có bản Local, quay lại phần thực hành GitHub và đối chiếu repo, branch, commit, Private/Public trước khi import. Nhánh hiện tại chỉ duyệt nội dung trong phiên; không tạo biên nhận Practice hoặc tốt nghiệp, không lấy thao tác bấm tiếp làm bằng chứng.

## Milestone 1 — Hosting, video và kiểm tra website

Giữ phần mở đầu hiện có. Dùng video để hướng dẫn đăng portfolio lần đầu, không đọc lại từng thao tác import và cấu hình bằng các trang chữ. Sau video, người học mở website của chính mình, thử nội dung, ảnh và liên kết rồi lưu địa chỉ chính. Nếu chưa mở được website, xử lý lỗi trước bài cập nhật.

Nếu đang hướng dẫn người học chưa deploy, kiểm tra đúng repo từ Module 3, bản dựng, mã bí mật và quyền truy cập trước khi họ làm theo video. Nhờ agent đối chiếu điều kiện gói với mục đích sử dụng hiện tại. Video không thay thế quyết định cấp quyền hoặc bằng chứng của người học.

Các trang theo thứ tự:

- Vercel giúp bạn làm gì?
- Mở portfolio vừa đưa lên mạng

## Milestone 2 — Bảo mật và quyền truy cập

Giới thiệu Production qua website chính vừa mở. Cho người học kiểm tra quyền truy cập bằng cửa sổ riêng tư. Giải thích repo Private khác quyền xem website và chỉ đổi quyền khi người học đồng ý. Nếu muốn giữ website riêng tư, kiểm tra All Deployments với Vercel Authentication trên đúng project.

Các trang theo thứ tự:

- Ai đang xem được website của bạn?

## Milestone 3 — Thực hành cập nhật một thay đổi nhỏ

Người học chọn đúng một câu để sửa và tự viết nội dung mới. Agent kiểm tra Production Branch rồi tạo branch khác, sửa và mở Local. Chờ người học duyệt Local trước khi commit và push tạo Preview. Kiểm tra bản dựng và mã bí mật trước khi gửi code. Chưa được merge hoặc cập nhật Production.

Trên Vercel, đối chiếu Ready, Preview, branch và commit. Người học mở Preview để thấy câu mới rồi mở địa chỉ chính để xác nhận câu cũ vẫn còn. Nếu môi trường hoặc nội dung không đúng dự kiến, dừng và tìm nguyên nhân. Kiểm tra riêng quyền truy cập của Preview, không suy ra quyền từ tên môi trường.

Các trang theo thứ tự:

- Chọn một thay đổi nhỏ
- Sửa và xem trên máy
- Đưa bản sửa lên Preview
- Kiểm tra bản xem thử

## Milestone 4 — Công bố, cập nhật và khôi phục

Phân biệt tạo deployment Production với công khai website. Công khai Production là lựa chọn; người học được giữ bảo vệ và ghi việc cần làm tiếp. Nếu đồng ý cập nhật, merge/push branch đã kiểm tra vào Production Branch, kiểm tra deployment mới và địa chỉ chính. Chỉ đổi quyền của đúng project khi có quyết định công khai. Dạy kiểm tra sau công bố, cách chia sẻ, tên miền tùy chọn, cập nhật nhỏ, lỗi build, rollback và Undo Rollback. Sau rollback, push mới không tự thay địa chỉ chính cho đến khi khôi phục cơ chế phát hành. Không yêu cầu gây lỗi trên website thật.

Các trang theo thứ tự:

- Duyệt bản cập nhật
- Đưa bản đã duyệt vào website chính
- Kiểm tra sau khi công bố
- Để đường link sẵn sàng chia sẻ
- Muốn chỉnh portfolio thì làm thế nào?
- Giao một lần sửa có điểm dừng
- Khi Vercel báo lỗi
- Khi cần quay lại bản đang hoạt động
- Tiếp tục phát hành sau khi khôi phục

## Milestone 5 — Làm chủ portfolio và áp dụng cho dự án khác

Giải thích cách lưu bằng chứng quyết định phát hành và ghi chú quản lý repo, Vercel, phiên bản, cập nhật, khôi phục. Giới thiệu cách chuyển quy trình sang ứng dụng khác; để yêu cầu tự viết ở bài kiểm tra cuối. Sau phần hướng dẫn là Practice khi được nối lại, rồi tám câu cuối bài từng câu một. Preview đã kiểm chứng là điều kiện bắt buộc của Practice dự kiến; lựa chọn chưa công khai không làm mất kết quả này.

Các trang theo thứ tự:

- Bạn cần nắm gì về portfolio của mình?
- Lưu lại để lần sau tiếp tục được
- Thử áp dụng cho một việc khác

## Ảnh, nguồn và bằng chứng

Video và ảnh minh họa không phải bằng chứng triển khai của người học. Các trang ảnh hướng dẫn import và cấu hình đã được bỏ khỏi mạch sau video. Nếu màn hình khác với video, đối chiếu tài liệu chính thức trong cuối lesson thay vì đoán vị trí nút.

Luồng CLI dùng trang khởi tạo trung tính đã được thử trước đây chỉ là bằng chứng lịch sử. Nó không còn là luồng bắt buộc của bài trình duyệt này và không chứng minh luồng mới đã được diễn tập với tài khoản thật. Không mô tả Production đầu tiên là bắt buộc công khai.

## Đánh giá

Chỉ dùng tám câu cuối bài trong `course/quizzes/module-4.quiz.json`. Chỉ hiện đáp án, lời giải và nguồn sau câu trả lời hiện tại. Câu tự viết dựa trên bằng chứng hiện tại của người học; thiếu bằng chứng thì hướng dẫn họ bổ sung, không đưa câu trả lời mẫu để chép.

Practice và bài kiểm tra là hai điều kiện độc lập. Giữ Practice/evidence adapters, receipt và tốt nghiệp ở trạng thái hoãn trong nhánh soạn nội dung. Không ghi nhận hoàn thành chính thức hoặc suy ra chấp nhận từ việc duyệt hết các trang.

Trong Course Companion hiện tại, bản duyệt nội dung hiển thị cả nhóm câu hỏi trên một trang. Quy tắc từng câu một áp dụng khi Teacher dạy trực tiếp; chưa mô tả giao diện duyệt hiện tại là đã thực hiện quy tắc đó.
