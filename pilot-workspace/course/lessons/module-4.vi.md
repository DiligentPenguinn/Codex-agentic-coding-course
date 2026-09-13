# Module 4 — Kiểm chứng, phát hành và chứng minh quyền sở hữu

## Hosting là gì?

Bạn đã làm xong portfolio và mở được nó trên máy. Bây giờ, bạn muốn gửi cho một người bạn xem. Nhưng đường dẫn `localhost` bạn đang dùng chỉ trỏ về máy đang mở nó, nên gửi đường dẫn này chưa giúp người kia xem được portfolio.

Bạn cần đặt website ở một nơi có thể truy cập qua Internet. Dịch vụ cung cấp nơi đó được gọi là **hosting**.

Khi website đã được đưa lên đó, người khác có thể mở bằng đường link, kể cả khi bạn đã tắt máy. Trong khóa học này, chúng ta sẽ dùng Vercel để làm việc đó.

## Máy tính, GitHub và Vercel làm gì?

Trong bài thực hành này, mỗi nơi có một vai trò:

| Nơi | Vai trò trong bài thực hành |
|---|---|
| Máy tính của bạn | Nơi bạn cùng agent xây và sửa portfolio. |
| GitHub | Nơi lưu code và lịch sử thay đổi của dự án trên mạng. |
| Vercel | Lấy code của dự án và đưa website lên để người khác truy cập. |

GitHub lưu code của bạn, còn Vercel giúp người khác mở website.

## Kết quả của module

Bạn sẽ biến portfolio đã xây thành một phiên bản sẵn sàng phát hành, có thể giải thích và khôi phục. Trước tiên, bạn kiểm chứng lại yêu cầu và duyệt an toàn trước khi đưa dữ liệu ra ngoài máy. Sau đó, bạn tạo một Vercel Preview, quyết định có đưa portfolio lên Production hay không, rồi chứng minh rằng bạn hiểu và làm chủ các quyết định quan trọng.

Một URL hoạt động chưa đủ để hoàn thành module. Kết quả cần gắn đúng phiên bản nguồn, trạng thái bản dựng, phạm vi truy cập, quan sát trực tiếp và đường phục hồi. Production là lựa chọn; Preview đã được kiểm chứng mới là yêu cầu bắt buộc.

## Ba môi trường cần phân biệt

- **Local:** website chạy trên máy của bạn để xây và kiểm tra.
- **Preview:** bản triển khai trực tuyến dùng để kiểm tra trước khi ảnh hưởng website Production.
- **Production:** phiên bản người xem thật truy cập qua domain Production.

Với một project Vercel đã tồn tại, lệnh triển khai không có `--prod` thường tạo Preview. Tuy nhiên, lần kiểm chứng của khóa học cho thấy Vercel có thể gán lần triển khai đầu tiên của project mới là Production. Vì vậy, khóa học dùng một trang khởi tạo trung tính, không có danh tính hoặc nội dung portfolio, để tạo project. Portfolio thật chỉ được đưa lên sau khi bạn đã kiểm tra phạm vi truy cập.

## Milestone 1 — Kiểm chứng phiên bản phát hành

Codex đối chiếu từng tiêu chí chấp nhận trong PRD với bằng chứng hiện tại và ghi một trong ba trạng thái:

- đạt;
- chưa đạt;
- chủ động hoãn, kèm lý do và phê duyệt của bạn.

Sau đó, Codex chạy `npm run check`, mở `npm run preview` và kiểm tra lại website ở `1440 × 900` cùng `390 × 844`. Việc kiểm tra gồm nội dung, thanh điều hướng, liên kết, thao tác bàn phím, trạng thái focus, văn bản thay thế, độ tương phản, console và hành vi chính của portfolio.

Kiểm tra tự động đạt không thay thế quan sát trong trình duyệt. Nếu website sai hành vi, điều kiện phát hành vẫn chưa đạt dù lệnh tạo bản dựng đã thành công. Khi đó, bạn phải đưa lỗi chặn về vòng gỡ lỗi từ bằng chứng của Module 3.

## Milestone 2 — Duyệt an toàn và phạm vi công bố

Trước bất kỳ hành động nào đưa dữ liệu ra mạng, Codex kiểm tra và giải thích bằng ngôn ngữ dễ hiểu:

1. secret, API key, token, `.env` và cấu hình có thể lộ ở phía trình duyệt;
2. lịch sử Git, phạm vi truy cập repository và tệp thừa;
3. thông tin cá nhân, nội dung khách hàng và quyền công bố;
4. quyền sử dụng hình ảnh, tài liệu tải xuống và metadata;
5. liên kết hoặc tài nguyên bên thứ ba;
6. cảnh báo về dependency và bản dựng;
7. Preview sẽ được bảo vệ hay công khai;
8. cách xóa, hạn chế truy cập hoặc quay lại phiên bản an toàn.

Nếu phiên bản sẵn sàng phát hành có contact form phía backend, authentication, analytics, payment, database hoặc dịch vụ xử lý dữ liệu khác, luồng chuẩn phải dừng. Bạn cần mở một phạm vi bảo mật riêng hoặc loại tính năng đó khỏi phiên bản này.

Vercel Standard Protection có thể bảo vệ Preview và URL triển khai bằng Vercel Authentication. Tuy nhiên, domain Production hiện tại vẫn có thể công khai. Vì vậy, bạn phải kiểm tra đúng URL trong đúng môi trường thay vì suy ra rằng mọi URL đều riêng tư.

## Milestone 3 — Tạo và kiểm chứng Preview

Đây là luồng đã được kiểm chứng cho khóa học:

1. Codex trình bày lệnh, tệp cục bộ sẽ sinh ra, nhu cầu đăng nhập, hoạt động mạng và tác động bên ngoài.
2. Bạn duyệt riêng từng hành động có hệ quả.
3. Nếu project chưa tồn tại, Codex tạo project bằng trang khởi tạo trung tính đã duyệt.
4. Bạn kiểm tra hoặc bật Vercel Authentication với Standard Protection.
5. Codex liên kết đúng thư mục portfolio và kiểm tra các tệp Vercel sinh ra không làm lộ secret.
6. Codex triển khai portfolio thật mà không dùng `--prod`.
7. `vercel inspect` phải cho thấy đúng Preview và trạng thái `Ready`; nhật ký tạo bản dựng không có lỗi chặn.
8. Bạn mở URL, kiểm tra lại trên màn hình máy tính và điện thoại, nội dung, liên kết, bàn phím, trạng thái lấy nét và phạm vi truy cập.

Biên nhận Preview phải ghi mã nhận diện bản triển khai, thời điểm, phiên bản nguồn, trạng thái bản dựng, phạm vi truy cập đã quan sát, kiểm tra trực tiếp và sai lệch giữa Local với Preview. Chỉ có URL hoặc lời báo “đã triển khai xong” không đủ.

Nếu phiên bản nguồn thay đổi sau khi Preview được chấp nhận, bằng chứng triển khai trở nên cũ. Bạn phải tạo và kiểm chứng Preview mới hoặc quay lại đúng phiên bản đã được chấp nhận.

## Milestone 4 — Quyết định có đưa lên Production hay không

Preview không phải là phê duyệt Production. Trước quyết định này, Codex nhắc lại:

- ai có thể truy cập domain Production;
- thông tin cá nhân và tài sản nào sẽ công khai;
- phiên bản nguồn nào sẽ được phát hành;
- cách kiểm tra ngay sau phát hành;
- cách quay lại phiên bản an toàn hoặc hạn chế truy cập nếu có lỗi.

Bạn có thể chọn **chưa đưa lên Production** mà vẫn hoàn thành khóa học, miễn là Preview đã được kiểm chứng và các điều kiện bắt buộc khác đều đạt. Quyết định này phải lưu lý do cùng việc cần làm nếu sau này bạn muốn công bố.

Nếu bạn chọn Production, Codex phải chạy lại danh sách kiểm tra an toàn trên phiên bản hiện tại. Sau đó, Codex xin phê duyệt rõ cho hành động Production, kiểm tra website trực tiếp sau phát hành và ghi cách quay lại phiên bản an toàn. Không dùng phê duyệt Preview cũ để suy ra phê duyệt Production.

## Milestone 5 — Chứng minh quyền sở hữu và chuyển giao kỹ năng

Bạn trả lời từng câu một bằng bằng chứng của chính mình:

- người xem chính và phạm vi portfolio;
- cách bạn điều chỉnh tham chiếu thay vì sao chép;
- một quyết định thiết kế;
- một lần cải thiện dựa trên điều quan sát được;
- một cuộc điều tra lỗi;
- bằng chứng Preview và phạm vi truy cập;
- lựa chọn an toàn và quyết định Production;
- giới hạn hiện tại.

Sau đó bạn chọn một ứng dụng nhỏ khác, không phải thêm tính năng cho portfolio. Bạn tạo bản mô tả ngắn, yêu cầu ban đầu, cách kiểm chứng và nhiệm vụ đầu tiên có giới hạn. Khóa học không yêu cầu triển khai ứng dụng chuyển giao này.

Một câu trả lời chỉ lặp lại bài học không chứng minh quyền sở hữu. Câu trả lời đạt phải chỉ ra quyết định, tài liệu hoặc quan sát thật của bạn, rồi giải thích bằng chứng đó đã ảnh hưởng bước tiếp theo như thế nào.

## Trạng thái soạn nội dung hiện tại

Branch này cho phép duyệt nội dung và câu hỏi Module 4 mà không chạy Practice. Practice phát hành, mẫu tài liệu, bộ đọc bằng chứng và điều kiện tốt nghiệp sẽ được nối lại sau khi nội dung được duyệt. Chế độ duyệt không tạo biên nhận, không mở khóa chính thức và không được xem là hoàn thành module.

## Nguồn cập nhật

- [Vercel — Environments](https://vercel.com/docs/deployments/environments): phân biệt Local, Preview và Production; CLI không có `--prod` tạo Preview sau khi project đã tồn tại.
- [Vercel — Deployment Protection](https://vercel.com/docs/deployment-protection): phạm vi Standard Protection và giới hạn đối với Production domain.
- [Vercel — CLI](https://vercel.com/docs/cli): đăng nhập, liên kết, kiểm tra, đọc nhật ký, xóa và rollback.
- [Vercel — Rollback](https://vercel.com/docs/cli/rollback): rollback Production là hành động riêng và có giới hạn theo gói dịch vụ.
- [Lần kiểm chứng Vercel của khóa học](../../../../docs/planning/portfolio-course-vercel-rehearsal-2026-08-16.md): bằng chứng thực nghiệm cho luồng dùng trang khởi tạo trung tính và Preview được bảo vệ.
