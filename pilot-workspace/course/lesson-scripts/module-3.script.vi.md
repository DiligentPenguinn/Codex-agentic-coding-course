# Kịch bản Teacher — Module 3: Xây dựng và gỡ lỗi theo từng phần đã kiểm chứng

## Hợp đồng điều phối

Teacher mở module bằng cách xác nhận receipt Module 2 và nói:

> “Chúng ta sẽ tạo ứng dụng từ chính thư mục portfolio đã chọn. Codex chỉ nhận đường dẫn cùng các artifact planning hiện tại; nội dung chat cũ không được dùng làm bối cảnh ẩn.”

Trong toàn module, Teacher phải:

1. Hỏi đúng một câu mỗi lượt và không hỏi điều có thể đọc từ artifact.
2. Giải thích thuật ngữ ngay khi Learner cần dùng để quyết định.
3. Yêu cầu đề xuất rồi chờ duyệt trước mỗi thay đổi.
4. Không bắt Learner đọc code, diff, vùng stage hoặc pull request.
5. Yêu cầu Codex kiểm tra kỹ thuật và đưa bản tóm tắt năm phần.
6. Để Learner xem hành vi thật ở `1440 × 900` và `390 × 844`.
7. Chỉ cấp biên nhận khi bằng chứng hiện tại, phép kiểm tra và lời duyệt cùng trỏ tới một phiên bản.
8. Đánh dấu phần phụ thuộc là cũ nếu PRD, design direction hoặc thay đổi đã duyệt bị sửa.

## Milestone 1 — Nền ứng dụng

Teacher nói:

> “Trước khi tạo tệp, Codex sẽ đề xuất lệnh, dependency, tệp, kết quả, kiểm tra, nhu cầu mạng và quyền cần thiết. Nền ứng dụng chỉ chứng minh môi trường hoạt động; chưa phải portfolio.”

Teacher hỏi:

> “Bạn có muốn Codex đọc ba tài liệu planning hiện tại và đưa đề xuất scaffold để bạn duyệt không?”

[Chờ Learner. Executor phải dừng sau đề xuất. Chỉ khi Learner duyệt mới được chạy lệnh tạo ứng dụng. Nếu cần mạng hoặc cài package, xin approval tại đúng thời điểm.]

Sau khi tạo, Codex chạy `npm run check`, mở `npm run dev`, kiểm tra trang trung tính, rồi kiểm tra `npm run preview`. Teacher yêu cầu tóm tắt năm phần và hỏi:

> “Bạn chấp nhận nền ứng dụng hiện tại làm điểm khôi phục, hay muốn sửa một sai lệch so với đề xuất?”

[Lưu `scaffold-report.md` và checkpoint sau khi chấp nhận.]

## Milestone 2 — Hướng thiết kế và bốn phần xây dựng

Teacher hỏi câu đầu tiên:

> “Nhìn vào ảnh tham chiếu đã lưu, điều gì khiến bạn thích trang này nhất?”

[Chấp nhận lời bình thường. Codex đọc PRD, inventory và reference để giải thích hierarchy. Với mỗi lựa chọn ảnh hưởng lớn, đưa một khuyến nghị cùng hệ quả rồi hỏi một câu.]

Trước khi duyệt `design-direction.md`, Teacher hỏi:

> “Hướng này có giữ đúng điều bạn thích, đồng thời đủ khác để không sao chép nội dung hoặc cách thể hiện của nguồn không?”

Sau đó thực hiện bốn phần theo đúng thứ tự. Trước mỗi phần, Teacher hỏi:

> “Bạn có duyệt phạm vi, điều không làm và các phép kiểm tra của phần này không?”

[Mỗi phần: đề xuất → duyệt → triển khai → kiểm tra tự động → xem desktop/mobile khi phù hợp → tóm tắt năm phần → chấp nhận/sửa → checkpoint. Không cho qua phần tiếp theo nếu phần hiện tại chưa có receipt.]

Sau Phần 4, Teacher hỏi:

> “Phiên bản đầu đã đủ navigation, Hero, hai dự án, About, Contact, footer và nền accessibility chưa?”

[Đối chiếu `build-log.md` và `browser-validation.md`; không tính cải tiến tùy chọn vào portfolio core.]

## Milestone 3 — Cải thiện toàn trang

Teacher yêu cầu Learner xem cả hai viewport rồi hỏi:

> “Nếu chỉ sửa một điểm để người xem chính hiểu bạn nhanh hơn, bạn muốn thay đổi điều gì?”

[Codex chuyển lời phản hồi thành một đề xuất có mục tiêu, tệp, non-goals, kết quả và hồi quy. Chờ duyệt trước khi sửa.]

Sau khi kiểm tra, Teacher hỏi:

> “Kết quả mới có giải quyết điều bạn vừa nêu mà vẫn giữ những phần đã duyệt không?”

[Lưu `revision-record.md` trên checkpoint mới.]

## Milestone 4 — Gỡ lỗi từ bằng chứng

Teacher ưu tiên lỗi thật. Nếu không có, Teacher nói rõ sẽ dùng lỗi course-controlled và hỏi:

> “Bạn có đồng ý tạo một lỗi nhỏ, dễ đảo ngược để luyện quy trình gỡ lỗi không?”

[Sau khi đồng ý: tái hiện → mong đợi/thực tế → bằng chứng → một giả thuyết. Chỉ sau đó mới đề xuất bản sửa nhỏ nhất.]

Teacher hỏi Learner trước khi sửa:

> “Bằng chứng hiện tại có đủ để thử giả thuyết này bằng thay đổi nhỏ nhất chưa?”

Sau sửa, chạy lại phép kiểm tra gốc và hồi quy. Teacher hỏi:

> “Lỗi nhìn thấy đã biến mất vì bản sửa này, hay chúng ta vẫn thiếu bằng chứng?”

[Lưu `debugging-report.md`; loại bỏ hoàn toàn fault course-controlled.]

## Milestone 5 — Cải tiến độc lập và gate

Teacher hỏi:

> “Bạn muốn thêm một cải tiến nhỏ nào, và người xem sẽ nhận được lợi ích gì?”

[Learner tự nêu mục tiêu và acceptance criteria. Chỉ dùng hint tăng dần. Nếu đề xuất thêm dịch vụ xử lý dữ liệu, khuyến nghị chọn cải tiến không có backend hoặc dừng để mở phạm vi bảo mật riêng.]

Codex đưa kế hoạch nhỏ. Teacher hỏi một câu duyệt rồi thực hiện vòng triển khai chuẩn. Cuối cùng, Learner giải thích vì sao cải tiến đạt và phê duyệt `enhancement-plan.md`.

Teacher yêu cầu Codex tạo `final-change-summary.md`, đối chiếu tám artifact, năm milestone, bốn phần xây dựng, check hiện tại, browser evidence và mastery. Nếu thiếu, mở lại đúng phần bị thiếu hoặc cũ. Chỉ mở Module 4 sau khi receipt hoàn thành được lưu nguyên tử.
