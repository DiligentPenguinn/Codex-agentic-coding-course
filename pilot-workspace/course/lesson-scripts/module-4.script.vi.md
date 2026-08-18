# Teacher Script — Module 4: Kiểm chứng, phát hành và chứng minh quyền sở hữu

## Mục tiêu điều phối

Teacher giúp Learner đi từ portfolio chạy được đến một phiên bản sẵn sàng phát hành, một Preview đã kiểm chứng, một quyết định Production có chủ đích và một gói chứng minh quyền sở hữu. Hỏi đúng một câu mỗi lượt. Không gộp phê duyệt tệp, mạng, đăng nhập, triển khai Preview và Production thành một câu hỏi chung.

Trong nhánh soạn nội dung, Teacher chỉ trình bày bài học và câu hỏi. Không mở Practice, không tạo biên nhận, không triển khai và không ghi nhận hoàn thành chính thức.

## Ranh giới cố định

- Không yêu cầu Learner đọc code hoặc diff để được công nhận.
- Không coi URL, bản dựng thành công hoặc lời báo của Codex là bằng chứng đầy đủ.
- Không đưa secret, token hoặc nội dung nhạy cảm vào cuộc trò chuyện, nhật ký hay tài liệu.
- Không thêm backend, authentication, analytics, payment, database hoặc dịch vụ xử lý dữ liệu vào phiên bản phát hành chuẩn.
- Preview đã kiểm chứng là bắt buộc; Production là lựa chọn.
- Mọi hành động mạng, đăng nhập, tạo project, thay đổi chế độ bảo vệ, triển khai, đưa lên Production, quay lại phiên bản trước hoặc xóa đều cần phê duyệt tại đúng thời điểm.

## Mở module

Teacher nói:

> “Module này không chỉ hỏi website có mở được hay không. Bạn sẽ nối đúng phiên bản nguồn với kết quả kiểm tra, phạm vi truy cập và đường phục hồi trước khi quyết định đưa nội dung ra ngoài máy.”

Teacher hỏi:

> “Bạn muốn bắt đầu bằng việc đối chiếu phiên bản sẵn sàng phát hành hiện tại với PRD không?”

[Chờ Learner. Ở chế độ duyệt nội dung, chuyển sang Milestone 1 mà không đọc workspace hoặc tạo bằng chứng thật.]

## Milestone 1 — Kiểm chứng phiên bản phát hành

Teacher giải thích ba lớp bằng chứng:

1. PRD và tiêu chí chấp nhận nói điều cần đạt.
2. Kiểm tra tự động cho biết ứng dụng có vượt qua các phép kiểm tra kỹ thuật đã cấu hình hay không.
3. Bằng chứng trình duyệt cho biết người dùng thật sự nhìn thấy và thao tác được điều gì.

Trong Practice sau này, Codex phải lập báo cáo kiểm chứng phát hành, chạy `npm run check`, mở `npm run preview` và kiểm tra `1440 × 900` cùng `390 × 844`.

Teacher hỏi:

> “Nếu `npm run check` đạt nhưng thanh điều hướng trong Preview cục bộ không đi tới Contact, điều kiện phát hành nên đạt hay chưa đạt?”

[Chờ Learner. Sau câu trả lời mới đưa phản hồi và nguồn.]

Nếu có lỗi chặn, Teacher quay lại vòng: tái hiện → mong đợi/thực tế → bằng chứng → một giả thuyết → thay đổi nhỏ nhất → kiểm tra gốc và hồi quy.

## Milestone 2 — Duyệt an toàn và phạm vi công bố

Teacher nói:

> “Trước khi đưa dữ liệu ra mạng, chúng ta kiểm tra cả điều có thể lộ và ai có thể xem. ‘Có thật’ và ‘được phép công khai’ vẫn là hai câu hỏi riêng.”

Teacher đi lần lượt qua secret, `.env`, lịch sử Git, phạm vi truy cập repository, dữ liệu cá nhân, quyền tài sản, metadata, liên kết ngoài, cảnh báo dependency, chế độ bảo vệ và đường phục hồi. Mỗi phát hiện chặn chỉ hỏi một quyết định.

Nếu xuất hiện dịch vụ xử lý dữ liệu, Teacher khuyến nghị:

> “Mình đề xuất bỏ tính năng này khỏi phiên bản phát hành hiện tại để giữ đúng phạm vi khóa học. Nếu bạn muốn giữ nó, chúng ta cần dừng và mở một phạm vi bảo mật riêng.”

Teacher hỏi:

> “Standard Protection đang bật cho Preview nhưng domain Production vẫn công khai. Bạn sẽ ghi phạm vi truy cập của hai môi trường này như thế nào?”

[Chờ Learner. Không chấp nhận câu trả lời suy ra mọi URL đều riêng tư.]

## Milestone 3 — Tạo và kiểm chứng Preview

Teacher trình bày luồng đã duyệt nhưng chưa thực hiện:

1. kiểm tra phát hành và riêng tư trên máy;
2. phê duyệt tác động bên ngoài;
3. trang khởi tạo trung tính cho lần tạo project đầu;
4. kiểm tra Vercel Authentication và Standard Protection;
5. liên kết đúng portfolio, kiểm tra tệp sinh ra và quy tắc bỏ qua tệp;
6. triển khai portfolio thật không có `--prod`;
7. `vercel inspect` xác nhận Preview và `Ready`, rồi đọc nhật ký;
8. mở URL, kiểm tra trực tiếp và xác nhận phạm vi truy cập.

Teacher nói rõ: lần kiểm chứng cho thấy lần triển khai đầu của project mới có thể trở thành Production dù không dùng `--prod`. Trang khởi tạo phải không có tên, nội dung portfolio, secret hoặc tài sản riêng tư.

Teacher hỏi:

> “Sau khi có URL Preview, bạn cần thêm bằng chứng nào trước khi chấp nhận bản triển khai?”

[Câu trả lời cần nêu phiên bản nguồn, môi trường đích, trạng thái, nhật ký, kiểm tra trực tiếp và phạm vi truy cập đã quan sát.]

Nếu phiên bản nguồn thay đổi, Teacher đánh dấu bằng chứng triển khai là cũ. Sau đó, Teacher hỏi Learner muốn triển khai lại hay quay về phiên bản đã chấp nhận.

## Milestone 4 — Quyết định Production

Teacher tách Preview khỏi Production:

> “Preview đã đạt không cấp quyền đưa portfolio lên Production. Production có thể làm nội dung truy cập được qua domain thật và cần một quyết định mới.”

Teacher hỏi đúng một lựa chọn:

> “Với phiên bản phát hành và phạm vi truy cập hiện tại, bạn chọn chưa đưa lên Production hay muốn bắt đầu danh sách kiểm tra Production mới?”

Nếu Learner chọn chưa đưa lên Production, lưu lý do và việc cần làm sau này. Lựa chọn này không làm mất khả năng đạt điều kiện tốt nghiệp.

Nếu Learner muốn Production, chạy lại danh sách kiểm tra an toàn trên phiên bản hiện tại và trình bày hành động chính xác. Sau khi được phê duyệt, kiểm tra trực tiếp và ghi đường phục hồi. Không tự dùng `--prod`, đưa bản Preview lên Production hoặc quay lại phiên bản trước.

## Milestone 5 — Quyền sở hữu và chuyển giao

Teacher hỏi từng câu, không xếp chồng:

1. “Người xem chính của bạn là ai và quyết định nào trong portfolio phục vụ họ?”
2. “Bạn đã điều chỉnh tham chiếu thế nào để không sao chép?”
3. “Lần cải thiện nào bắt đầu từ một điều bạn quan sát được?”
4. “Trong lần gỡ lỗi, bằng chứng nào làm bạn chọn giả thuyết?”
5. “Preview nào gắn với phiên bản nguồn nào và bạn đã kiểm tra phạm vi truy cập ra sao?”
6. “Bạn chọn gì cho Production và vì sao?”
7. “Giới hạn nào của portfolio vẫn còn?”

Sau mỗi câu, Teacher yêu cầu dẫn chiếu tài liệu hoặc quan sát thật. Nếu Learner chỉ lặp lại bài, dùng gợi ý nhỏ nhất để họ tìm về bằng chứng của mình.

Cuối cùng Teacher hỏi:

> “Bạn muốn áp dụng cùng quy trình cho một ứng dụng nhỏ nào khác portfolio?”

[Ứng dụng chuyển giao phải là dự án khác. Chỉ cần bản mô tả ngắn, yêu cầu ban đầu, cách kiểm chứng và nhiệm vụ đầu tiên có giới hạn; không triển khai.]

## Phần ôn tập

Đọc `course/quizzes/module-4.quiz.json`. Hỏi từng câu và chờ Learner trả lời trước khi hiện giải thích hoặc nguồn. Câu tự viết phải dùng tài liệu và quan sát của Learner; ví dụ trong bài không được tính là bằng chứng đạt.

Trong chế độ duyệt nội dung, cho phép đi hết câu hỏi nhưng không tạo biên nhận làm chủ, biên nhận tốt nghiệp hoặc checkpoint hoàn thành. Khi Practice được nối lại, biên nhận Practice và biên nhận làm chủ vẫn là hai điều kiện riêng.

## Nguồn Teacher phải đối chiếu trước triển khai thật

- `docs/planning/portfolio-course-vercel-rehearsal-2026-08-16.md`
- [Vercel Environments](https://vercel.com/docs/deployments/environments)
- [Vercel Deployment Protection](https://vercel.com/docs/deployment-protection)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Vercel Rollback](https://vercel.com/docs/cli/rollback)
