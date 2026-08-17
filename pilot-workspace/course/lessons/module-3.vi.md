# Module 3 — Xây dựng và gỡ lỗi theo từng phần đã kiểm chứng

## Kết quả của module

Bạn sẽ dùng gói planning đã duyệt để tạo portfolio từ một thư mục chưa có ứng dụng. Sau đó, bạn hướng dẫn Codex xây phiên bản đầu tiên theo bốn phần nhỏ, cải thiện toàn trang, gỡ một lỗi từ bằng chứng và tự định hướng một cải tiến có giới hạn.

Bạn không cần đọc code hoặc diff để quyết định có chấp nhận thay đổi hay không. Codex chịu trách nhiệm kiểm tra kỹ thuật. Bạn xem kết quả thật trong trình duyệt, đọc bản tóm tắt dễ hiểu rồi chọn chấp nhận hoặc yêu cầu sửa.

## Hai vòng làm việc cần nhớ

### Vòng triển khai chuẩn

1. Codex đề xuất phạm vi, tệp dự kiến thay đổi, điều không làm và cách kiểm tra.
2. Bạn đọc hệ quả rồi duyệt hoặc yêu cầu sửa đề xuất.
3. Codex chỉ thực hiện phần đã duyệt.
4. Codex chạy kiểm tra kỹ thuật.
5. Bạn xem website ở `1440 × 900` và `390 × 844` khi phần đó ảnh hưởng giao diện.
6. Codex đưa bản tóm tắt năm phần.
7. Bạn chấp nhận hoặc yêu cầu một lần sửa có giới hạn.
8. Sau khi chấp nhận, Codex tạo một checkpoint cục bộ để có thể quay lại.

### Vòng gỡ lỗi từ bằng chứng

1. Tái hiện lỗi.
2. Nêu kết quả mong đợi và kết quả thực tế.
3. Thu thập bằng chứng trước khi đoán nguyên nhân.
4. Chọn một giả thuyết phù hợp nhất.
5. Thực hiện thay đổi nhỏ nhất có lý.
6. Chạy lại phép kiểm tra ban đầu và các kiểm tra hồi quy liên quan.

## Bản tóm tắt năm phần

Sau mỗi phần xây dựng, Codex phải nói rõ:

1. Điều đã thay đổi.
2. Điều bạn nên chú ý trong website.
3. Điều chủ động giữ nguyên.
4. Kiểm tra đã chạy và kết quả.
5. Rủi ro, giới hạn hoặc quyết định còn lại.

Nếu bản tóm tắt chỉ nói “đã xong” hoặc “mọi thứ hoạt động”, hãy yêu cầu Codex làm lại. Một lời khẳng định không thay thế kết quả kiểm tra hoặc hành vi bạn quan sát được.

## Milestone 1 — Tạo nền ứng dụng có thể kiểm chứng

Codex đọc PRD, implementation plan và first bounded task hiện tại. Trước khi ghi tệp hoặc cài dependency, Codex phải đề xuất:

- lệnh sẽ chạy;
- dependency cùng phiên bản;
- tệp sẽ tạo;
- kết quả có thể quan sát;
- cách kiểm chứng;
- nhu cầu dùng mạng hoặc quyền phê duyệt.

Sau khi bạn duyệt, Codex chỉ tạo React, TypeScript và Vite. Nền ứng dụng có trang trung tính, style dễ đọc, lockfile, `.gitignore`, `README.md`, `AGENTS.md` và các lệnh `dev`, `typecheck`, `lint`, `build`, `preview`, `check`.

Lệnh `npm run check` chạy typecheck, lint rồi build theo thứ tự. Milestone này chưa tạo Hero, dự án, About, Contact, thiết kế hoàn chỉnh, thư viện tùy chọn hoặc cấu hình deployment.

Bạn mở trang trung tính bằng `npm run dev`, xác nhận kết quả rồi kiểm tra bản build qua `npm run preview`. Báo cáo được lưu tại `evidence/module-3/scaffold-report.md`. Recovery snapshot chỉ được dùng khi đường phục hồi thông thường không giải quyết được lỗi và phải được ghi rõ.

## Milestone 2 — Làm rõ thiết kế và xây phiên bản đầu tiên

### Làm rõ hướng thiết kế

Bạn có thể bắt đầu bằng câu bình thường như “Tôi thích chữ lớn ở phần đầu”. Codex đối chiếu tham chiếu với PRD và nội dung thật, sau đó giải thích thứ tự thông tin cùng đặc điểm hình ảnh bằng lời dễ hiểu.

Codex đề xuất điều nên giữ lại, điều chỉnh, đơn giản hóa hoặc loại bỏ. Mỗi quyết định lớn được hỏi riêng. Hướng đã duyệt phải mô tả cách chuyển sang màn hình `390 × 844`; không được sao chép nội dung, thương hiệu, hình ảnh hoặc mã nguồn của trang tham chiếu.

Quyết định được lưu tại `evidence/module-3/design-direction.md` trước khi sửa ứng dụng.

### Xây theo bốn phần

1. **Nền trang và Hero:** cấu trúc trang, navigation, Hero, kiểu chữ, màu, khoảng cách, mobile cơ bản và focus hiển thị.
2. **Selected Work:** ít nhất hai dự án có vấn đề, vai trò, cách làm, kết quả hoặc bằng chứng hiện tại, cùng một giới hạn hay bài học.
3. **About, Contact và footer:** câu chuyện liên quan, năng lực, hướng đi, phương thức liên hệ đã kiểm chứng và liên kết nghề nghiệp phù hợp.
4. **Tích hợp responsive và accessibility:** desktop/mobile, heading, landmark, bàn phím, focus, văn bản thay thế, link chính và console.

Mỗi phần phải đi hết vòng triển khai chuẩn. Phần chưa đạt sẽ chặn phần tiếp theo. Nhật ký tại `evidence/module-3/build-log.md` giữ bốn biên nhận riêng; kiểm chứng trực tiếp được lưu ở `evidence/module-3/browser-validation.md`.

Portfolio core là phần bắt buộc. Chuyển động, theme, modal hoặc tính năng bổ sung vẫn là phần tùy chọn.

## Milestone 3 — Xem lại và cải thiện toàn trang

Bạn xem toàn bộ website theo PRD, hướng thiết kế, nội dung thật và mục tiêu của người xem chính. Bạn có thể phản hồi bằng câu như “các dự án xuất hiện quá muộn” hoặc “phần đầu chưa nói rõ tôi làm gì”.

Codex chuyển phản hồi đó thành một đề xuất sửa duy nhất. Đề xuất phải nói rõ điều sẽ đổi, điều giữ nguyên, kết quả mong đợi và kiểm tra hồi quy. Sau khi bạn duyệt, Codex sửa, kiểm tra và lưu kết quả tại `evidence/module-3/revision-record.md`.

Milestone này không phải một vòng làm đẹp tùy ý. Mọi sửa đổi phải xuất phát từ điều quan sát được hoặc tiêu chí đã duyệt.

## Milestone 4 — Gỡ một lỗi từ bằng chứng

Ưu tiên dùng lỗi thật. Nếu chưa có lỗi phù hợp, khóa học có thể tạo một lỗi nhỏ, dễ đảo ngược và được kiểm soát. Codex không được sửa trước khi tái hiện lỗi và thu thập bằng chứng.

Báo cáo tại `evidence/module-3/debugging-report.md` ghi bước tái hiện, mong đợi, thực tế, bằng chứng, một giả thuyết, bản sửa nhỏ nhất, kiểm tra gốc và kiểm tra hồi quy. Bạn giải thích lỗi nhìn thấy, bằng chứng đã dùng và việc bản sửa có giải quyết đúng lỗi hay không.

Nếu lỗi do khóa học tạo ra, dấu vết của lỗi phải được loại bỏ trước khi milestone đạt.

## Milestone 5 — Tự định hướng một cải tiến nhỏ

Bạn chọn một cải tiến có giới hạn rồi tự nêu mục tiêu và tiêu chí chấp nhận. Codex đề xuất kế hoạch nhỏ và chờ bạn duyệt. Ví dụ phù hợp gồm đổi theme, mở chi tiết dự án, chuyển động tiết chế hoặc tải CV đã được kiểm tra.

Cải tiến không được thêm backend, authentication, analytics, payment, database hoặc dịch vụ xử lý dữ liệu nếu chưa có phạm vi bảo mật riêng. Kế hoạch và bằng chứng được lưu tại `evidence/module-3/enhancement-plan.md`.

Cuối module, Codex tạo `evidence/module-3/final-change-summary.md`. Module 4 chỉ mở khi đủ tám artifact hiện tại, năm biên nhận milestone, bốn biên nhận phần xây dựng, `npm run check` đạt, kiểm chứng trình duyệt đạt, mastery đạt và bạn đã duyệt phiên bản hiện tại.

## Nguồn phương pháp

- [Google Engineering Practices — Small CLs](https://google.github.io/eng-practices/review/developer/small-cls.html): thay đổi nhỏ giúp dễ hiểu, kiểm tra và khôi phục hơn.
- [W3C WAI — Evaluating Web Accessibility](https://www.w3.org/WAI/test-evaluate/): kiểm tra accessibility cần bắt đầu sớm và kết hợp công cụ với đánh giá của con người.
- [MDN — Testing](https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Testing): kiểm tra gồm hành vi, khả năng sử dụng, accessibility, ghi nhận kết quả và kiểm tra hồi quy.
- [Microsoft Engineering Playbook — Debugging](https://microsoft.github.io/code-with-engineering-playbook/automated-testing/debugging/): điều tra lỗi cần dựa trên tái hiện, bằng chứng và giả thuyết có thể kiểm tra.
- [Quyết định chương trình D-011 và D-013](../../../../docs/planning/portfolio-course-v1/DECISION_LOG.md): Module 3 dùng năm milestone, bốn phần xây dựng và bản tóm tắt năm phần dành cho người mới.
