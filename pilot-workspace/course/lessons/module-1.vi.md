# Module 1 — Thiết lập môi trường làm việc với Codex

## Vì sao cần thiết lập trước khi giao việc?

Codex có thể đọc tệp, sửa mã và chạy lệnh trong thư mục bạn mở. Khả năng đó
giúp bạn chuyển từ một cuộc trò chuyện sang công việc có thể kiểm tra. Tuy
nhiên, Codex cần biết đúng thư mục, đúng chỉ dẫn và đúng giới hạn hành động
trước khi bắt đầu.

Module này giúp bạn chuẩn bị những yếu tố đó. Bạn chưa cần biết lập trình và
chưa cần cài thêm công cụ từ Internet.

## Kết quả của module

Trong khoảng 50 phút, bạn sẽ:

- hiểu Codex là gì và phân biệt Codex với một cuộc trò chuyện thông thường,
- nhận biết task, workspace và terminal trong môi trường làm việc,
- chọn model cùng mức suy luận phù hợp với một công việc,
- hiểu vì sao Codex có thể dừng lại để xin phép,
- đọc và cá nhân hóa phần được phép sửa trong `AGENTS.md`,
- hiểu Skill là gì và gọi một Skill đã có trong workspace, và
- tạo `artifacts/codex-setup-checklist.md` để chứng minh thiết lập đã sẵn sàng.

## Codex là gì?

Codex là coding agent của OpenAI. Coding agent là hệ thống AI có thể làm việc
với một dự án phần mềm, thay vì chỉ trả lời bằng văn bản. Trong phạm vi bạn cho
phép, Codex có thể đọc tệp, đề xuất kế hoạch, sửa tệp, chạy lệnh và báo lại bằng
chứng.

Bạn có thể dùng Codex trong ứng dụng ChatGPT trên máy tính, dòng lệnh hoặc tiện
ích trong trình soạn thảo mã. Khóa học dùng Codex trong ứng dụng ChatGPT trên
máy tính vì Learner có thể xem cuộc trao đổi, tệp thay đổi và terminal trong
cùng một nơi.

[OpenAI Docs — Quickstart](https://learn.chatgpt.com/docs/quickstart) mô tả
Codex là lựa chọn dành cho công việc phát triển phần mềm có bối cảnh codebase
và công cụ dành cho lập trình viên.

### Task là gì?

Task là một cuộc làm việc với Codex có mục tiêu và bối cảnh riêng. Trong giao
diện, task có thể trông giống một cuộc trò chuyện. Điểm khác biệt là Codex có
thể dùng tệp và công cụ của workspace để thực hiện công việc.

### Workspace là gì?

Workspace là thư mục dự án bạn cho Codex làm việc cùng. Khi mở khóa học này,
workspace đúng là thư mục chứa `START_HERE.md`, `AGENTS.md`, thư mục `course/`
và thư mục `contentpilot/`.

### Terminal là gì?

Terminal là nơi chạy các lệnh bằng văn bản. Codex có thể dùng terminal để xem
cấu trúc dự án hoặc chạy kiểm tra. Bạn không cần nhớ lệnh ngay từ đầu; điều
quan trọng là đọc lệnh Codex định chạy và xem kết quả nó báo lại.

## Model và mức suy luận

Model là hệ thống AI xử lý yêu cầu của bạn. Codex hiện cung cấp ba model GPT-5.6
được đề xuất cho các kiểu công việc khác nhau:

| Model | Phù hợp nhất khi | Ví dụ trong khóa học |
|---|---|---|
| **Sol** | Công việc phức tạp hoặc còn nhiều điều chưa rõ | Làm rõ một ý tưởng sản phẩm và xem xét nhiều đánh đổi |
| **Terra** | Công việc hằng ngày cần suy luận và dùng công cụ | Sửa một phần ứng dụng theo yêu cầu đã được duyệt |
| **Luna** | Công việc cụ thể, lặp lại và có đầu ra rõ | Chuyển một danh sách đã duyệt sang một định dạng khác |

Nếu chưa chắc nên chọn gì, hãy giữ thiết lập mặc định. OpenAI hiện khuyên bắt
đầu với Sol và mức suy luận trung bình. Những model bạn thấy trong giao diện có
thể khác theo tài khoản, môi trường làm việc hoặc thời điểm sử dụng.

Mức suy luận cho biết model dành bao nhiêu công sức cho việc phân tích trước
khi trả lời. Mức cao hơn có thể phù hợp với việc khó, nhưng thường chậm hơn.
Hãy bắt đầu với mức mặc định và chỉ tăng khi công việc cần thêm planning hoặc
kiểm tra.

[OpenAI Docs — Models](https://learn.chatgpt.com/docs/models) là nguồn hiện hành
cho tên model, cách chọn và mức suy luận. Module này chỉ giúp bạn chọn điểm bắt
đầu; nó không yêu cầu ghi nhớ toàn bộ danh sách.

## Quyền truy cập và phê duyệt

Quyền truy cập xác định Codex có thể làm gì với tệp, lệnh và Internet. Sandbox
là ranh giới kỹ thuật giới hạn nơi Codex có thể thao tác. Phê duyệt là bước
Codex dừng lại để bạn quyết định có cho phép một hành động hay không.

Với người mới, thiết lập **Ask for approval** là điểm bắt đầu phù hợp. Codex có
thể làm việc trong workspace nhưng sẽ dừng trước những hành động vượt qua ranh
giới hiện tại.

Bạn vẫn cần đọc yêu cầu phê duyệt. Không chấp nhận một hành động nếu chưa hiểu
nó sẽ thay đổi gì. Những việc như truy cập mạng, sửa tệp ngoài workspace, xóa
dữ liệu hoặc xuất bản ra bên ngoài cần được xem xét riêng.

[OpenAI Docs — Permissions](https://learn.chatgpt.com/docs/permission-modes) và
[Agent approvals & security](https://learn.chatgpt.com/docs/agent-approvals-security)
giải thích cách sandbox và phê duyệt phối hợp với nhau.

## `AGENTS.md` là gì?

`AGENTS.md` là tệp chứa chỉ dẫn lâu dài cho Codex. Codex đọc tệp này trước khi
bắt đầu công việc. Nhờ đó, bạn không phải lặp lại những yêu cầu chung trong mỗi
task.

Ví dụ, `AGENTS.md` của khóa học cho Codex biết:

- dạy bằng tiếng Việt có dấu,
- hỏi một câu chính mỗi lượt,
- không sửa tệp khi Learner chưa duyệt phạm vi, và
- không tự xuất bản hoặc xóa dữ liệu.

Prompt của task vẫn giữ mục tiêu riêng cho lần làm việc hiện tại. Nói ngắn gọn:

- prompt cho biết **lần này cần làm gì**,
- `AGENTS.md` cho biết **dự án luôn muốn làm việc như thế nào**.

Trong module này, bạn chỉ được sửa phần `Learner-editable preferences` trong
`AGENTS.md`. Các quy tắc còn lại bảo vệ luồng học và không thuộc phạm vi chỉnh
sửa.

Codex đọc chuỗi chỉ dẫn khi bắt đầu một task mới. Vì vậy, sau khi sửa
`AGENTS.md`, bạn sẽ mở một task mới trong cùng workspace và dùng
`$start-course-lesson resume` để tiếp tục. Đây là cách kiểm tra chỉ dẫn có thể
được dùng lại qua nhiều task.

[OpenAI Docs — AGENTS.md](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
giải thích phạm vi toàn cục, phạm vi dự án và thứ tự Codex nạp chỉ dẫn.

## Skill là gì?

Skill là một thư mục chứa hướng dẫn cho một quy trình có thể dùng lại. Tệp
chính của mỗi Skill có tên `SKILL.md`. Skill có thể kèm theo tài liệu, mẫu hoặc
script nếu quy trình cần chúng.

Khóa học này đã có hai Skill trong `.agents/skills/`:

- `start-course-lesson` tìm bài học và tiến độ cần tiếp tục,
- `course-teacher` hướng dẫn cách dạy, hỏi và đánh giá từng bước.

Khi bạn gõ `$start-course-lesson`, bạn gọi Skill bằng tên. Đây được gọi là gọi
trực tiếp. Codex cũng có thể tự chọn Skill khi yêu cầu khớp với phần mô tả,
nhưng khóa học ưu tiên gọi trực tiếp để bạn thấy rõ quy trình nào đang được sử
dụng.

Không phải công việc nào cũng cần Skill. Lệnh kiểm tra có sẵn hoặc một chỉ dẫn
ngắn trong prompt thường đã đủ cho việc nhỏ. Các module sau chỉ giới thiệu thêm
Skill khi tác vụ thật sự cần đến.

[OpenAI Docs — Build skills](https://learn.chatgpt.com/docs/build-skills) giải
thích cấu trúc Skill, cách gọi trực tiếp và vị trí `.agents/skills` trong dự án.

## Bài thực hành thiết lập

Bạn sẽ hoàn thành bốn việc theo hướng dẫn của Teacher:

1. Xác nhận đúng workspace và cách bạn đang dùng Codex, chẳng hạn trong ứng
   dụng trên máy tính hay ở dòng lệnh.
2. Ghi model cùng mức suy luận bạn chọn làm điểm bắt đầu.
3. Duyệt một thay đổi nhỏ trong phần Learner được phép sửa của `AGENTS.md`.
4. Xác nhận hai Skill của khóa học và tạo checklist thiết lập.

Checklist dùng mẫu `artifacts/codex-setup-checklist.template.md`. Teacher chỉ
được tạo tệp hoàn chỉnh sau khi bạn xem và duyệt nội dung.

## Tiêu chí hoàn thành

Bạn hoàn thành Module 1 khi:

- chỉ ra đúng workspace của khóa học,
- giải thích vì sao model mặc định là điểm bắt đầu hợp lý,
- phân biệt sandbox với bước phê duyệt,
- phân biệt prompt với `AGENTS.md`,
- giải thích Skill dùng cho loại công việc nào,
- phần Learner được phép sửa trong `AGENTS.md` phản ánh lựa chọn của bạn,
- `artifacts/codex-setup-checklist.md` tồn tại và có nội dung do bạn duyệt, và
- bạn đạt ít nhất 4/5 câu kiểm tra cuối module.

## Nguồn và lựa chọn sư phạm

Các mô tả về Codex, model, quyền truy cập, `AGENTS.md` và Skill dựa trên OpenAI
Docs được liên kết tại từng phần. Việc dùng một checklist, yêu cầu 4/5 câu đúng
và giới hạn chỉnh sửa vào một khối trong `AGENTS.md` là lựa chọn sư phạm của
khóa học.
