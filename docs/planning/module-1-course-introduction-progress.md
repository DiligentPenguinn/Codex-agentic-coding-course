# Module 1 — Giới thiệu khóa học: nội dung và tiến độ

**Cập nhật:** 9 tháng 8 năm 2026
**Trạng thái:** Ba trang giới thiệu đã được duyệt và đưa vào Course Companion; phần khái niệm và bài tập tiếp theo vẫn đang được lập kế hoạch.

## Định vị đã chốt

- Đây là khóa học dạy **agentic coding**.
- ContentPilot là dự án thực hành xuyên suốt khóa học, không phải sản phẩm chính của khóa học.
- Nội dung và bài tập phải giúp người học hình thành kỹ năng xây ứng dụng với coding agent có thể áp dụng cho những sản phẩm khác.
- Tên module hiện tại là **Module 1 — Giới thiệu khóa học**.
- Không thêm một trang lộ trình riêng sau phần giới thiệu. Sau ba trang mở đầu, người học đi thẳng vào concept đầu tiên.

## Trang 1 — Đã duyệt và đã triển khai

**Tiêu đề**

> Bạn sẽ xây gì trong khóa học này?

**Nội dung**

> Trong khoá học này, bạn sẽ được xây dựng một ứng dụng có khả năng tự động hoá quá trình sáng tạo nội dung. Nó sẽ giúp bạn lên nội dung hàng ngày cho kênh Facebook.

**Nút**

> Tiếp tục

## Trang 2 — Đã duyệt và đã triển khai

**Tiêu đề**

> Bạn sẽ xây gì trong khóa học này?

**Nội dung**

> Bạn chỉ cần nhập thông tin thương hiệu/kênh Facebook của mình, app sẽ tự động giúp bạn nghiên cứu những thông tin đang trending liên quan đến lĩnh vực của bạn, draft nội dung dựa trên giọng văn mà thương hiệu bạn theo đuổi, tạo cả hình ảnh giúp bạn, và bạn chỉ cần duyệt nội dung thôi.

**Nút**

> Bắt đầu khóa học

## Trang 3 — Đã duyệt và đã triển khai

**Tiêu đề**

> Bạn sẽ học như thế nào?

**Nội dung**

> Khoá học này sẽ không giao cho bạn ứng dụng hoàn chỉnh ngay từ đầu. Mà bạn sẽ được xây từng phần của ứng dụng. Và trong quá trình đó bạn cũng sẽ học được các nguyên tắc xây ứng dụng với AI để có thể tạo ra bất kỳ sản phẩm nào bạn muốn.

**Nút**

> Bắt đầu

## Khái niệm tiếp theo — Nội dung đã duyệt, chưa triển khai

> Đầu tiên, bạn cần xem coding agent như là một kỹ sư làm việc dưới trướng bạn. Để làm việc hiệu quả với họ thì bạn cần biết cách giao tiếp tốt.
>
> Prompt là lời bạn dùng để giao việc cho coding agent. Prompt engineering là cách bạn viết và cải thiện lời giao việc đó để agent hiểu mục tiêu, tuân thủ yêu cầu và tạo ra kết quả có thể kiểm tra.

Nguồn tham khảo chính thức: [Prompt engineering — OpenAI API](https://developers.openai.com/api/docs/guides/prompt-engineering).

## Điểm resume

Tiếp tục bằng việc chốt **tiêu đề của trang giới thiệu khái niệm**. Đề xuất đang chờ duyệt là:

> Cách làm việc với coding agent

Sau khi chốt tiêu đề, tiếp tục lập kế hoạch từng phần của prompt engineering, rồi mới thiết kế bài tập áp dụng. Không bắt đầu lập kế hoạch Module 2 cho tới khi toàn bộ Module 1 được triển khai và người dùng đã kiểm tra.

## Ghi chú triển khai

- Ba trang mở đầu dùng chung checkpoint nội bộ `intro-visual-onboarding` nhưng có scene riêng, nên ứng dụng có thể resume chính xác ở trang 1, 2 hoặc 3.
- ID lesson nội bộ vẫn là `intro` để giữ tương thích với dữ liệu Pilot 0.1 hiện tại. Việc đổi toàn bộ ID và đánh số lại các module sẽ chỉ được quyết định sau khi kế hoạch Module 1 hoàn chỉnh.
- Course Companion vẫn dùng dữ liệu Teacher/Codex mô phỏng; thay đổi này không tạo hoặc tuyên bố có tích hợp live.
