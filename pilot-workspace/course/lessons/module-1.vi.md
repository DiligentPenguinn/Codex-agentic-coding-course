# Module 1 — Bắt đầu làm việc với Codex

## Codex là gì?

Codex là coding agent của OpenAI. Ở bài này, mình chỉ cần bạn hiểu coding agent
là một trợ lý có thể thực hiện công việc liên quan đến code: tạo ứng dụng, xây
trang web, chỉnh sửa dự án và tự động hóa những việc lặp lại.

Codex không chỉ đưa ra câu trả lời. Khi được bạn cho phép, Codex có thể đọc tệp,
dùng công cụ, chạy lệnh và kiểm tra kết quả trong một workspace. Bạn vẫn là
người đặt mục tiêu, chọn phạm vi và duyệt kết quả cuối cùng.

[OpenAI Docs — Codex app](https://learn.chatgpt.com/docs/app) giới thiệu Codex
là coding agent của OpenAI. [The Codex Handbook của
FreeCodeCamp](https://www.freecodecamp.org/news/the-codex-handbook-a-practical-guide-to-openai-s-coding-platform/)
phân biệt Codex với một chatbot chỉ trả lời bằng văn bản.

## Trước Codex: Harness Engineering

Harness Engineering là cách thiết kế môi trường xung quanh một AI agent để nó
có thể làm việc ổn định. OpenAI mô tả sự thay đổi vai trò như sau: con người
định hướng, còn agent thực thi. Công việc của đội ngũ là làm rõ ý định, xây
công cụ và tạo vòng phản hồi để agent biết kết quả có đạt hay không.

### Harness là gì?

Bạn có thể hình dung model là bộ não, còn harness là toàn bộ môi trường giúp bộ
não đó làm việc:

- workspace chứa dự án,
- công cụ để đọc, sửa và chạy code,
- chỉ dẫn và giới hạn cần tuân theo,
- sandbox cùng cơ chế approval,
- bài kiểm tra, diff và báo cáo để phản hồi kết quả.

Không có harness, model có thể giải thích cách làm nhưng thiếu nơi để hành động
và kiểm tra. Harness biến khả năng suy luận thành một quy trình làm việc có
ranh giới.

### Harness của Codex

Trong Codex, model không làm việc một mình. Codex kết hợp model với workspace,
terminal, công cụ đọc và sửa tệp, chỉ dẫn của dự án, sandbox, approval và các
bước kiểm tra. Khi một kết quả chưa tốt, ta không chỉ đổi model. Ta cũng xem
harness còn thiếu bối cảnh, công cụ, giới hạn hay phản hồi nào.

Khái niệm này dựa trên [bài Harness Engineering bằng tiếng Việt của
OpenAI](https://openai.com/vi-VN/index/harness-engineering/). [Bài giải thích
nhập môn trên Viblo](https://viblo.asia/p/agent-harness-la-gi-tai-sao-ai-agent-can-harness-de-hoat-dong-hieu-qua-bA468BMMLKv)
được dùng để diễn đạt các thành phần của harness theo cách gần gũi hơn.

## Approval: Codex được phép làm đến đâu?

Sandbox là ranh giới kỹ thuật giới hạn những gì Codex có thể truy cập. Approval
là thời điểm Codex phải dừng để bạn quyết định.

Trong menu approval của Codex:

- **Ask for approval** hỏi trước khi sửa tệp bên ngoài hoặc dùng Internet.
- **Approve for me** tự xử lý hành động thông thường nhưng vẫn dừng ở hành động
  bị phát hiện là có rủi ro.
- **Full access** mở quyền truy cập Internet và tệp trên máy tính mà không giữ
  các ranh giới bảo vệ thông thường.

Mình khuyên bạn dùng **Approve for me** và chưa bật **Full access**. Thiết lập
này giúp quá trình học ít bị ngắt quãng nhưng vẫn giữ lớp bảo vệ trước những
hành động có rủi ro. Tự động duyệt không làm thay đổi ranh giới sandbox.

[OpenAI Docs — Sandboxing and approvals](https://learn.chatgpt.com/docs/sandboxing)
giải thích sự khác nhau giữa ranh giới truy cập và chính sách xin phép.

## Model: chọn theo loại công việc

Trong dòng GPT-5.6, Codex cho bạn chọn ba model ngôn ngữ lớn, thường được gọi
là LLM:

| Model | Điểm mạnh | Ví dụ phù hợp |
|---|---|---|
| **Sol** | Dòng có năng lực cao nhất cho công việc chuyên môn phức tạp | Lên kiến trúc ứng dụng, nghiên cứu sâu, xử lý yêu cầu còn mơ hồ |
| **Terra** | Tiết kiệm hơn Sol nhưng vẫn đáp ứng tốt công việc hằng ngày | Trả lời tin nhắn khách hàng theo hướng dẫn đã có |
| **Luna** | Thông thường mình không dùng trực tiếp; theo hiểu biết của mình, model này có thể làm sub-agent | GPT-5.6 Sol gọi Luna khảo sát codebase trước khi sửa một tính năng |

Tên model không phải cấp độ mà người học phải vượt qua. Bạn chọn model theo độ
khó, độ rõ của yêu cầu và chi phí chấp nhận được.

OpenAI mô tả Terra là lựa chọn cân bằng giữa năng lực và chi phí. Luna hướng đến
các tác vụ cần tiết kiệm chi phí hoặc xử lý số lượng lớn. Tài liệu cũng cho biết
GPT-5.6 có thể điều phối nhiều sub-agent. Tuy nhiên, ví dụ Sol gọi Luna khảo sát
codebase là cách mình hiểu và minh họa cơ chế này. OpenAI Docs không nêu riêng
quy trình đó.

[OpenAI Docs — GPT-5.6 Terra](https://developers.openai.com/api/docs/models/gpt-5.6-terra),
[GPT-5.6 Luna](https://developers.openai.com/api/docs/models/gpt-5.6-luna) và
[hướng dẫn chọn model](https://developers.openai.com/api/docs/guides/latest-model)
cung cấp mô tả chính thức.

## Reasoning effort: model dành bao nhiêu công sức để suy luận?

Reasoning effort điều chỉnh lượng công sức model dành cho việc phân tích trước
khi trả lời:

- **Light** phù hợp với việc nhỏ và đã rõ.
- **Medium** cân bằng tốc độ với độ sâu.
- **High** phù hợp với việc có nhiều bước hoặc cần kiểm tra kỹ.
- **Extra High** và **Ultra** dành cho những nhiệm vụ rất khó. Chúng thường mất
  nhiều thời gian hơn.

Ultra có thể chia việc cho nhiều subagent. Hãy hình dung subagent như các thành
viên phụ trong một nhóm: mỗi người xử lý một phần rồi tổng hợp lại. Người mới
chưa cần dùng cách này cho ContentPilot.

Trong những lần mình thử nghiệm, Extra High không tạo khác biệt đủ lớn cho đa
số công việc hằng ngày. Tác vụ lại mất nhiều thời gian hơn. Vì vậy, mình không
khuyên bạn dùng Extra High hoặc Ultra trong Module 1.

[OpenAI Docs — Model guidance](https://developers.openai.com/api/docs/guides/latest-model)
khuyên dùng High hoặc Extra High khi thử nghiệm cho thấy chất lượng tăng rõ.

## Speed: Standard hay Fast?

OpenAI cho biết Fast có thể tăng tốc 1,5 lần. Với GPT-5.6, chế độ này dùng
credit ở mức 2,5 lần Standard khi bạn đăng nhập Codex bằng ChatGPT.

Trong những lần mình thử nghiệm, Fast thường chỉ nhanh hơn Standard khoảng
0,5 giây. Mức chênh này không đủ lớn để mình chọn Fast làm mặc định.

[OpenAI Docs — Speed](https://learn.chatgpt.com/docs/agent-configuration/speed)
giải thích tốc độ và mức dùng credit của hai chế độ.

## Cấu hình mình đề xuất cho ContentPilot

Mình chọn cấu hình này cho dự án thực hành ContentPilot. Đây không phải thiết
lập mặc định của mọi tài khoản Codex:

- Model: **5.6 Sol**
- Effort: **High**
- Speed: **Standard**
- Approval: **Approve for me**
- Full access: **Tắt**

Sol và High cho người học thêm khoảng trống khi yêu cầu còn mới. Standard giữ
mức sử dụng hợp lý trong quá trình học. Approve for me giữ nhịp học. Việc tắt
Full access giữ ranh giới an toàn.

## Practice cuối Module 1

Bạn sẽ mở một task Executor riêng trong Codex và nộp hai ảnh:

1. Ảnh hiển thị Model, Effort và Speed.
2. Ảnh hiển thị Approval và trạng thái Full access.

Trong task đó, gửi yêu cầu:

> Hãy kiểm tra cấu hình trong hai ảnh. Chỉ quan sát, không thay đổi cài đặt.
> Báo cáo dưới tiêu đề `Verification`, gồm Model, Effort, Speed, Approval và
> trạng thái Full access. Cảnh báo nếu có mục nào khác cấu hình Triết khuyên dùng.

Sau đó, quay lại Course Companion và chọn **Yêu cầu Triết duyệt tiến độ**.
Mình chỉ xác nhận đạt khi bằng chứng đến từ đúng task, còn mới và đủ năm mục.
Nếu chưa đạt, mình sẽ chỉ rõ mục cần sửa để bạn nộp lại.

## Tiêu chí hoàn thành

Bạn hoàn thành Module 1 khi:

- mô tả được Codex là coding agent của OpenAI,
- giải thích được model và harness giữ hai vai trò khác nhau,
- chọn Approve for me và không bật Full access,
- dùng cấu hình Sol, High và Standard cho ContentPilot,
- nộp đủ hai ảnh trong đúng task Executor, và
- được mình duyệt bằng chứng.

## Nguồn và lựa chọn mình đưa ra

Khái niệm Codex, Harness Engineering, approval, model và reasoning effort dựa
trên các nguồn được liên kết tại từng phần. Việc chọn Sol, High, Standard và
Approve for me là lựa chọn sư phạm mình đưa ra cho dự án ContentPilot.
