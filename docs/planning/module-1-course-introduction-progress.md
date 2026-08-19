# Module 1 — Giới thiệu khóa học: nội dung và tiến độ

**Cập nhật:** 19 tháng 8 năm 2026
**Trạng thái:** Ba trang giới thiệu đã được mở lại theo yêu cầu ngày 19 tháng 8
năm 2026. Nội dung mới thống nhất Portfolio cá nhân là dự án thực hành và giữ
nguyên thứ tự, nút cùng hành vi điều hướng hiện tại.

## Định vị đã chốt

- Đây là khóa học dạy **agentic coding**.
- Portfolio cá nhân là dự án thực hành xuyên suốt khóa học.
- Cuối khóa, người học có một web portfolio thật để gửi cho nhà tuyển dụng.
- Kỹ năng trong khóa học phải giúp người học có thể tạo những công cụ khác với AI.
- Tên module hiện tại là **Module 1 — Giới thiệu khóa học**.
- Không thêm một trang lộ trình riêng sau phần giới thiệu. Sau ba trang mở đầu, người học đi thẳng vào concept đầu tiên.

## Trang 1 — Đã duyệt và đã triển khai

**Tiêu đề**

> Bạn sẽ xây gì trong khóa học này?

**Nội dung**

> Trong khoá học này, bạn sẽ được học cách dùng coding agents thông qua một dự án thực hành: Xây Portfolio cá nhân.

**Nút**

> Tiếp tục

## Trang 2 — Đã duyệt và đã triển khai

**Tiêu đề**

> Bạn sẽ xây gì trong khóa học này?

**Nội dung**

> Cuối khoá này, bạn sẽ có một web portfolio thật để có thể gửi cho nhà tuyển dụng.

**Nút**

> Bắt đầu khóa học

## Trang 3 — Đã duyệt và đã triển khai

**Tiêu đề**

> Bạn sẽ học như thế nào?

**Nội dung**

> Những kỹ năng bạn học được trong khoá này không chỉ giúp bạn xây Portfolio, mà còn trang bị cho bạn kiến thức để tạo bất kỳ công cụ nào bạn muốn với AI

**Nút**

> Bắt đầu Module 1

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
