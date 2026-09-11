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

Codex cho bạn chọn các model ngôn ngữ lớn, thường được gọi là LLM:

| Model | Điểm mạnh | Ví dụ phù hợp |
|---|---|---|
| **GPT-6 Astra** | Dòng có năng lực cao nhất cho công việc chuyên môn phức tạp | Lên kiến trúc ứng dụng, nghiên cứu sâu, xử lý yêu cầu còn mơ hồ |
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

## Lệnh `/` và `@`: mở nhanh chức năng cần dùng

Trong ô soạn tin, bạn có thể gõ `/` để mở danh sách lệnh nhanh. Hai lệnh hữu
ích khi làm việc với Codex là:

- `/status` để xem mức sử dụng context của cuộc trò chuyện; và
- `/goal` để đặt một mục tiêu bền vững mà Codex tiếp tục theo đuổi qua nhiều
  lượt.

Dấu `@` mở thêm các nguồn và công cụ mà bạn có thể đưa vào cuộc trò chuyện.
Chẳng hạn, bạn có thể chọn một skill hoặc một đoạn chat liên quan.

[OpenAI Docs — Slash commands](https://learn.chatgpt.com/docs/reference/slash-commands)
giải thích cách mở danh sách lệnh và chức năng của `/status` cùng `/goal`.

## Làm sao để agent ghi nhớ một thông tin?

Vậy, giả dụ có một thông tin mình muốn agent ghi nhớ mà không cần phải nhắc đi
nhắc lại thì mình sẽ làm gì?

Bạn có thể lưu thông tin đó trong `AGENTS.md`. Đây là một tệp văn bản chứa các
quy tắc và thông tin coding agent cần biết trước khi bắt đầu công việc. Codex
đọc tệp này để hiểu cách bạn muốn dự án được xử lý.

### Hai level `AGENTS.md` bạn cần biết

- Global `AGENTS.md` nằm trong thư mục cấu hình Codex trên máy tính. Những quy
  tắc trong tệp này được áp dụng cho mọi repo bạn mở bằng Codex. Triết dùng
  level này để kiểm tra nguồn trước khi làm, hỏi một quyết định chính mỗi lượt
  và không đưa thay đổi lên mạng khi chưa được yêu cầu.
- Current repo `AGENTS.md` nằm trong repo bạn đang mở. Những quy tắc trong tệp
  này chỉ áp dụng cho repo đó. Repo khóa học của Triết yêu cầu Codex giữ nguyên
  những trang chưa được yêu cầu thay đổi và viết nội dung dành cho người học
  bằng tiếng Việt tự nhiên.

Codex đọc cả hai level. Global `AGENTS.md` đặt ra những nguyên tắc chung. Current
repo `AGENTS.md` bổ sung những quy tắc cụ thể hơn cho dự án đang mở.

[OpenAI Docs — AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
giải thích cách Codex tìm và kết hợp các tệp hướng dẫn.

## Skill là gì?

Thông thường ta dùng `AGENTS.md` để dạy cho model làm theo những hành động ta
muốn mà ta không cần phải nhắc đi nhắc lại.

Nhưng giả dụ ta muốn nó làm những tác vụ cụ thể như viết lách, thì sao? Chả lẽ
ta viết hết tất cả những mẹo viết hay vào `AGENTS.md`? Và giả dụ ta có 100 kỹ
năng muốn agents học thì sao?

Ta không thể dùng một file `AGENTS.md` để dạy coding agents tất cả kỹ năng mà ta
muốn nó học. Đó là lúc ta sử dụng Skill.

Mỗi skill có một tệp chính tên là `SKILL.md`. Tệp này mô tả khi nào nên dùng
skill, các bước cần thực hiện và những điều cần kiểm tra trước khi hoàn thành.

## Hai skill bạn sẽ dùng để xây portfolio

- `frontend-design` dùng khi thiết kế hoặc chỉnh sửa giao diện portfolio. Skill
  giúp Codex xác định mục tiêu của trang, chọn hướng thiết kế, xây giao diện
  responsive và kiểm tra kết quả thực tế.
- `copywriting` dùng khi viết nội dung cho portfolio. Skill giúp Codex viết tiêu
  đề, phần giới thiệu, mô tả dự án và lời kêu gọi hành động dựa trên thông tin
  thật của bạn.

Phần ví dụ trong ứng dụng học được viết bằng tiếng Anh. Theo kinh nghiệm của
mình, agent thường xử lý chỉ dẫn kỹ thuật bằng tiếng Anh ổn định hơn. Vì vậy,
trong khóa học này, phần hướng dẫn dành cho agent sẽ ưu tiên tiếng Anh. Bạn vẫn
có thể trao đổi với Codex bằng tiếng Việt.

Bạn có thể vào [skills.sh](https://skills.sh/) để khám phá thêm các skill do
cộng đồng chia sẻ. Bạn chưa cần cài thêm skill trong Module 1. Khóa học sẽ giới
thiệu skill phù hợp khi bạn cần dùng đến nó.

[OpenAI Docs — Skills](https://learn.chatgpt.com/docs/build-skills) giải thích
cấu trúc và cách Codex dùng skill.

## Cấu hình mình đề xuất cho ContentPilot

Mình chọn cấu hình này cho dự án thực hành ContentPilot. Đây không phải thiết
lập mặc định của mọi tài khoản Codex:

- Model: **GPT-6 Astra**, có thể dùng **GPT-5.6 Sol** nếu lo tốn token
- Effort: **High**
- Speed: **Standard**
- Approval: **Approve for me**
- Full access: **Tắt**

Astra và High cho người học thêm khoảng trống khi yêu cầu còn mới. Standard giữ
mức sử dụng hợp lý trong quá trình học. Approve for me giữ nhịp học. Việc tắt
Full access giữ ranh giới an toàn.

## Practice cuối Module 1

Bạn sẽ mở một task Codex riêng và chỉnh trực tiếp năm thiết lập
của task: Model, Effort, Speed, Approval và Full access. Bạn không cần chụp ảnh,
đính kèm tệp hay yêu cầu Codex lập báo cáo.

Course Companion chỉ đọc metadata cấu hình hiệu lực của đúng task Codex đang
được liên kết. Ứng dụng hiển thị năm giá trị được phát hiện, độ mới và mục nào
chưa khớp; ứng dụng không tự thay đổi cài đặt của bạn.

Course Companion không gửi task hay lệnh nào vào Codex trước khi cấu hình
đạt. Cơ chế này không chặn việc bạn tự nhập vào Codex, vì vậy ở bước thiết lập
hãy chỉ đổi năm cài đặt rồi quay lại chọn **Yêu cầu Triết duyệt tiến độ**.

> Hãy kiểm tra cấu hình trong hai ảnh. Chỉ quan sát, không thay đổi cài đặt.
> Báo cáo dưới tiêu đề `Verification`, gồm Model, Effort, Speed, Approval và
> trạng thái Full access. Cảnh báo nếu có mục nào khác cấu hình Triết khuyên dùng.

Sau đó, quay lại Course Companion và chọn **Yêu cầu Triết duyệt tiến độ**.
Mình chỉ xác nhận đạt khi bằng chứng đến từ đúng task, còn mới và đủ năm mục.
Nếu chưa đạt, mình sẽ chỉ rõ mục cần sửa để bạn nộp lại.

## Bài ôn tập cuối Module 1

Sau khi Practice được duyệt, bạn sẽ trả lời sáu câu ôn tập. Các câu hỏi yêu cầu
bạn giải thích, áp dụng hoặc phân tích kiến thức trong một tình huống cụ thể.
Mỗi lượt chỉ hiện một câu. Lời giải và nguồn sẽ xuất hiện sau khi bạn trả lời.

Bạn cần đạt ít nhất 5/6 câu để hoàn thành Module 1. Nếu chưa đạt, bạn có thể làm
lại bài ôn tập sau khi xem phản hồi.

## Tiêu chí hoàn thành

Bạn hoàn thành Module 1 khi:

- mô tả được Codex là coding agent của OpenAI,
- dùng `/status` để xem mức sử dụng context và `/goal` để tạo mục tiêu bền vững,
- chọn Approve for me và không bật Full access,
- dùng cấu hình Sol, High và Standard cho ContentPilot,
- nộp đủ hai ảnh trong đúng task Codex, và
- được mình duyệt bằng chứng, và
- đạt ít nhất 5/6 câu trong bài ôn tập cuối Module 1.

## Nguồn và lựa chọn mình đưa ra

Khái niệm Codex, approval, model và reasoning effort dựa trên các nguồn được
liên kết tại từng phần. Việc chọn Sol, High, Standard và Approve for me là lựa
chọn sư phạm mình đưa ra cho dự án ContentPilot.
