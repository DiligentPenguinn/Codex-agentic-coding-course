# Module 1 — Giao tiếp hiệu quả với coding agent: Planning và PRD

## Vì sao planning lại quan trọng?

Cũng giống như con người, có một kế hoạch kỹ càng trước khi xây sẽ giúp coding
agent tránh phạm những sai lầm ngớ ngẩn sau này. Nó tưởng chừng tốn thời gian,
nhưng thực chất planning kỹ sẽ giúp bạn đỡ phải debug và sửa một ứng dụng không
vừa ý mình. Tin mình đi, sửa một ứng dụng đã đi sai hướng sẽ tốn thời gian hơn
nhiều so với planning kỹ ngay từ đầu.

Planning không có nghĩa là viết một tài liệu dài cho mọi việc. Một thay đổi nhỏ,
rõ ràng và dễ hoàn tác có thể được giao trực tiếp. Nhưng khi bạn đang xây một
sản phẩm từ đầu, còn nhiều lựa chọn chưa rõ hoặc cần nhiều bước liên quan, hãy
lập kế hoạch trước khi yêu cầu coding agent viết code.

## Kết quả của module

Sau khoảng 45 phút, bạn có thể:

- giải thích khi nào cần planning và khi nào một yêu cầu trực tiếp là đủ,
- dùng coding agent như một người phỏng vấn để làm rõ ý tưởng sản phẩm,
- tạo và duyệt một PRD một trang bằng ngôn ngữ dễ hiểu,
- yêu cầu coding agent chuyển PRD thành implementation plan theo từng bước, và
- kiểm tra PRD và implementation plan có khớp nhau trước khi bắt đầu code.

Module này dừng ở planning. Bạn chưa cần đọc code, chọn công nghệ, cài gói phụ
thuộc hay xây giao diện. Implementation và debugging sẽ được học ở bước tiếp
theo của khóa học.

## Ý tưởng thực hành: ContentPilot

Khóa học cung cấp điểm bắt đầu sau:

> ContentPilot là công cụ giúp người sáng tạo phân tích các bài viết hiện có
> trên profile — hoặc một profile mẫu nếu chưa có dữ liệu — rồi đề xuất những ý
> tưởng nội dung có khả năng bắt kịp xu hướng.

Đây mới là ý tưởng, chưa phải kế hoạch. Coding agent sẽ hỏi từng câu một để bạn
quyết định phiên bản đầu tiên thực sự làm gì.

## Cấu trúc prompt để planning với coding agent

Bạn không cần viết một “câu lệnh thần kỳ”. Một prompt planning hữu ích chỉ cần
làm rõ năm phần:

1. **Mục tiêu:** bạn muốn agent giúp hoàn thành kết quả gì.
2. **Bối cảnh:** ý tưởng và những điều đã biết.
3. **Cách trao đổi:** chẳng hạn hỏi một câu mỗi lượt thay vì tự điền chỗ trống.
4. **Output:** tài liệu hoặc kế hoạch bạn muốn nhận để review.
5. **Ranh giới và tiêu chí đạt:** điều chưa được làm, phần bắt buộc và dấu hiệu
   cho biết output đã đủ tốt.

Bạn giữ quyền quyết định sản phẩm. Coding agent giúp đặt câu hỏi, phát hiện điểm
mơ hồ và tổ chức câu trả lời thành tài liệu rõ ràng.

## PRD là gì?

PRD, viết tắt của *Product Requirements Document*, là tài liệu mô tả sản phẩm
cần đạt kết quả gì, phạm vi phiên bản đầu tiên và cách nhận biết sản phẩm đã đáp
ứng yêu cầu. PRD trả lời câu hỏi **“Chúng ta đang xây cái gì và vì sao?”**, không
đi sâu vào code hoặc công nghệ.

PRD một trang của bạn cần có:

1. Ý tưởng sản phẩm.
2. Luồng sử dụng cốt lõi.
3. Input.
4. Output.
5. Phạm vi phiên bản 1.
6. Ngoài phạm vi.
7. `Done When` — các dấu hiệu hoàn thành cụ thể, quan sát và kiểm tra được.
8. Câu hỏi còn mở.

Khóa học không yêu cầu phần persona. Mục tiêu ở đây là luyện cách làm rõ sản
phẩm và giao tiếp với coding agent, không phải hoàn thành mọi loại tài liệu
product.

## Implementation plan là gì?

Implementation plan là kế hoạch biến PRD đã duyệt thành những bước xây dựng có
thứ tự. Nó trả lời câu hỏi **“Coding agent sẽ xây sản phẩm này như thế nào?”**

Bạn chưa cần biết tên file hay cách viết code. Coding agent có trách nhiệm đề
xuất và giải thích các thành phần kỹ thuật bằng ngôn ngữ dành cho người mới. Mỗi
bước trong plan cần nêu:

- mục tiêu của bước,
- thành phần hoặc file dự kiến liên quan,
- kết quả có thể quan sát sau bước đó, và
- cách kiểm tra kết quả.

Plan cũng phải nêu thứ tự phụ thuộc, giả định, rủi ro, quyết định kỹ thuật còn
mở và cách kiểm tra toàn bộ luồng từ đầu đến cuối. Plan không được tự thêm tính
năng nằm ngoài PRD và chưa được phép chứa code triển khai.

## Checkpoint hoàn thành

Bạn hoàn thành Module 1 khi có một **planning package** gồm:

- `artifacts/PRD.md`, và
- `artifacts/implementation-plan.md`.

PRD đạt khi đủ tám phần ở trên, ngắn gọn trong khoảng một trang, không chứa chi
tiết triển khai và đã được bạn duyệt rõ ràng.

Implementation plan đạt khi:

- dùng `PRD.md` đã duyệt làm nguồn,
- có cách tiếp cận tổng thể bằng ngôn ngữ dễ hiểu,
- chia công việc thành các bước nhỏ có thứ tự,
- mỗi bước có mục tiêu, thành phần/file, kết quả quan sát và cách kiểm tra,
- nêu phụ thuộc, giả định, rủi ro và câu hỏi kỹ thuật còn mở,
- có kiểm tra toàn bộ luồng từ đầu đến cuối, và
- không mở rộng phạm vi hoặc bắt đầu viết code.

Hai tài liệu khớp nhau khi mọi yêu cầu trong phạm vi PRD đều xuất hiện trong
plan, mọi bước của plan đều truy ngược được về PRD, phần ngoài phạm vi không bị
đưa trở lại và các mục `Done When` trở thành bằng chứng kiểm tra trong plan.

Trước khi qua module tiếp theo, bạn cần duyệt cả hai tài liệu và giải thích bằng
lời của mình ít nhất một quyết định về phạm vi.

## Nguồn phương pháp

Nội dung module được xây dựng từ hướng dẫn chính thức về prompt và coding agent
của [OpenAI](https://learn.chatgpt.com/docs/prompting),
[OpenAI Developers](https://developers.openai.com/api/docs/guides/latest-model),
[Anthropic](https://code.claude.com/docs/en/best-practices) và
[Anthropic API](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview),
cùng hướng dẫn PRD của
[Atlassian](https://www.atlassian.com/agile/product-management/requirements),
hướng dẫn thiết kế task của
[Microsoft](https://microsoft.github.io/code-with-engineering-playbook/design/design-reviews/recipes/templates/template-task-design-review/)
và thực hành chia thay đổi nhỏ của
[Google](https://google.github.io/eng-practices/review/developer/small-cls.html).
Yêu cầu một trang, bỏ persona và cách chia checkpoint là lựa chọn sư phạm riêng
của khóa học này.
