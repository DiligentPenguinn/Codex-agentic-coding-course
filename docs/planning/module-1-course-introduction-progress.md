# Module 1 — Giới thiệu khóa học: nội dung và tiến độ

**Cập nhật:** 9 tháng 8 năm 2026
**Trạng thái:** Ba trang giới thiệu được giữ nguyên theo quyết định ngày 9 tháng
8 năm 2026. Từ màn hình tiếp theo, curriculum và copy chuyển sang cấu trúc
kỹ năng agentic coding trước, ContentPilot là dự án thực hành.

## Định vị đã chốt

- Đây là khóa học dạy **agentic coding**.
- ContentPilot là dự án thực hành xuyên suốt khóa học, không phải sản phẩm chính của khóa học.
- Nội dung và bài tập phải giúp người học hình thành kỹ năng xây ứng dụng với coding agent có thể áp dụng cho những sản phẩm khác.
- Tên module hiện tại là **Module 1 — Giới thiệu khóa học**.
- Không thêm một trang lộ trình riêng sau phần giới thiệu. Sau ba trang mở đầu, người học đi thẳng vào concept đầu tiên.
- Ngoại lệ đã chốt: không sửa nội dung, thứ tự hoặc nút của ba trang mở đầu bên
  dưới. Việc định vị skill-first bắt đầu ở màn hình kế tiếp và được củng cố ở
  lộ trình, bài học, quiz và đánh giá tốt nghiệp.

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

## Khái niệm tiếp theo — Hướng nội dung skill-first

> Coding agent là người cộng tác có thể đọc dự án, lập kế hoạch, sửa file và
> chạy kiểm tra. Bạn giữ mục tiêu, phạm vi, quyết định quan trọng và tiêu chí để
> biết công việc đã thực sự hoàn thành.
>
> Một yêu cầu tốt không cần dùng từ kỹ thuật phức tạp. Nó cần nói rõ vấn đề,
> bối cảnh, phạm vi, điều không được làm và bằng chứng bạn muốn xem. Với thay đổi
> phức tạp, hãy để agent đọc và đề xuất kế hoạch trước khi cho phép sửa.

Nguồn tham khảo chính thức:

- [OpenAI Codex prompting](https://learn.chatgpt.com/docs/prompting)
- [Anthropic — Agentic coding and persistent returns to expertise](https://www.anthropic.com/research/claude-code-expertise)
- [Google Gemini CLI — Plan mode](https://developers.googleblog.com/plan-mode-now-available-in-gemini-cli/)
- [DeepLearning.AI — Spec-Driven Development with Coding Agents](https://www.deeplearning.ai/courses/spec-driven-development-with-coding-agents/)

## Điểm resume

Tiếp tục từ bài học **Giao việc để coding agent có thể kiểm chứng**. Bài học dùng
vòng `hiểu vấn đề → giới hạn phạm vi → giao việc → đọc bằng chứng → quyết định`
và yêu cầu người học chuyển vòng này sang một dự án khác trước khi hoàn thành.
Không bắt đầu Module 2 cho tới khi toàn bộ Module 1 được triển khai và người
dùng đã kiểm tra.

## Ghi chú triển khai

- Ba trang mở đầu dùng chung checkpoint nội bộ `intro-visual-onboarding` nhưng có scene riêng, nên ứng dụng có thể resume chính xác ở trang 1, 2 hoặc 3.
- ID lesson nội bộ vẫn là `intro` để giữ tương thích với dữ liệu Pilot 0.1 hiện tại. Việc đổi toàn bộ ID và đánh số lại các module sẽ chỉ được quyết định sau khi kế hoạch Module 1 hoàn chỉnh.
- Course Companion vẫn dùng dữ liệu Teacher/Codex mô phỏng; thay đổi này không tạo hoặc tuyên bố có tích hợp live.
