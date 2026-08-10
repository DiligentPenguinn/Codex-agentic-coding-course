# Module 2 — Giao tiếp hiệu quả với coding agent: Planning, PRD và prompt

## Vì sao planning lại quan trọng?

Cũng giống như con người, có một kế hoạch kỹ càng trước khi xây sẽ giúp coding
agent tránh phạm những sai lầm ngớ ngẩn sau này. Nó tưởng chừng tốn thời gian,
nhưng thực chất planning kỹ sẽ giúp bạn đỡ phải debug và sửa một ứng dụng không
vừa ý mình. Tin mình đi, sửa một ứng dụng đã đi sai hướng sẽ tốn thời gian hơn
nhiều so với planning kỹ ngay từ đầu.

Không phải việc nào cũng cần planning. Nếu yêu cầu nhỏ và dễ làm lại khi có lỗi,
bạn có thể giao trực tiếp cho coding agent. Tuy nhiên, khi bắt đầu xây một sản
phẩm hoặc khi công việc còn nhiều quyết định chưa rõ và nhiều bước phụ thuộc
nhau, hãy lập kế hoạch trước. Nhờ đó, coding agent có thể hiểu đúng vấn đề rồi
mới viết code.

[Microsoft Engineering Fundamentals](https://microsoft.github.io/code-with-engineering-playbook/design/design-reviews/recipes/engagement-process/)
cũng khuyên chỉ xem xét thiết kế khi cần. Những dấu hiệu đáng planning gồm yêu
cầu còn mơ hồ, có nhiều điều chưa biết hoặc người thực hiện chưa thể chỉ ra đầy
đủ các bước cần làm.

Ví dụ, tạo một ứng dụng mới từ đầu cần planning. Bạn còn phải quyết định luồng
sử dụng, đầu vào, đầu ra và phạm vi phiên bản đầu. Trong khi đó, bạn có thể giao
trực tiếp việc sửa chữ hoặc màu của một nút nhỏ nếu vị trí và kết quả mới đã
rõ.

## Kết quả của module

Module này kéo dài khoảng 90–120 phút và có thể tạm dừng giữa các checkpoint. Khi
hoàn thành, bạn có thể:

- giải thích khi nào cần planning và khi nào một yêu cầu trực tiếp là đủ,
- giải thích PRD giữ những quyết định nào,
- dùng hình ảnh hoặc code để làm yêu cầu trong PRD rõ hơn,
- dùng năm câu hỏi đơn giản để viết prompt planning,
- dùng coding agent như một người phỏng vấn để làm rõ ý tưởng sản phẩm,
- tạo và duyệt một PRD một trang,
- yêu cầu coding agent chuyển PRD thành implementation plan, và
- kiểm tra PRD với implementation plan có khớp nhau trước khi bắt đầu code.

Module này dừng ở planning. Bạn chưa cần đọc code, chọn công nghệ, cài gói phụ
thuộc hay xây giao diện. Implementation và debugging sẽ được học ở bước tiếp
theo của khóa học.

## Ý tưởng thực hành: ContentPilot

Khóa học cung cấp điểm bắt đầu sau:

> ContentPilot là công cụ giúp người sáng tạo phân tích các bài viết hiện có
> trên profile — hoặc một profile mẫu nếu chưa có dữ liệu — rồi đề xuất những ý
> tưởng nội dung có khả năng bắt kịp xu hướng.

Đây mới là ý tưởng, chưa phải kế hoạch. Ý tưởng chưa xác định luồng sử dụng,
đầu vào, đầu ra, phạm vi phiên bản đầu hoặc dấu hiệu hoàn thành. PRD sẽ giữ những
quyết định này trước khi coding agent đề xuất cách xây.

## PRD là gì?

PRD, viết tắt của *Product Requirements Document*, là tài liệu mô tả sản phẩm
cần đạt kết quả gì, vì sao sản phẩm cần tồn tại, phạm vi phiên bản đầu và cách
nhận biết sản phẩm đã đáp ứng yêu cầu. PRD tập trung vào quyết định về sản phẩm,
không đi sâu vào code hoặc công nghệ.

PRD một trang của bạn cần có:

1. Ý tưởng sản phẩm.
2. Luồng sử dụng cốt lõi.
3. Đầu vào.
4. Đầu ra.
5. Phạm vi phiên bản 1.
6. Ngoài phạm vi.
7. `Done When` — các dấu hiệu hoàn thành có thể quan sát và kiểm tra.
8. Câu hỏi còn mở.

Khóa học chưa yêu cầu phần persona. Mục tiêu ở đây là luyện cách làm rõ sản phẩm
và giao tiếp với coding agent, không phải hoàn thành mọi loại tài liệu product.

Mẫu PRD của
[Atlassian](https://www.atlassian.com/software/confluence/templates/product-requirements?category=services)
đưa ra một ví dụ: nếu nhóm giả định phần lớn người dùng truy cập bằng máy tính
bảng, một yêu cầu có thể là giao diện phải hiển thị tốt trên máy tính bảng. Mẫu
cũng dành riêng chỗ cho câu hỏi còn mở và phần ngoài phạm vi nhằm hạn chế phạm
vi tự phình ra ngoài ý định ban đầu.

## Cho coding agent xem ví dụ

Ví dụ phù hợp giúp coding agent bớt phải đoán. Bạn không cần gom thật nhiều ví
dụ. Hãy chọn ví dụ liên quan và nói rõ điều bạn muốn học theo.

### Ví dụ bằng hình ảnh

Ảnh chụp hoặc bản thiết kế có thể cho thấy bố cục, cách sắp xếp thông tin và
luồng bạn muốn. Bạn có thể dùng:

- [Pinterest](https://help.pinterest.com/en/guide/all-about-pinterest) để tìm ý
  tưởng bằng hình ảnh,
- [Mobbin](https://mobbin.com/) để xem màn hình và luồng từ sản phẩm thật, hoặc
- [Dribbble](https://dribbble.com/shots/popular/web-design) để xem bản thiết kế
  giao diện.

[OpenAI Docs](https://learn.chatgpt.com/use-cases/frontend-designs) khuyên dùng
những ảnh rõ nhất cho giao diện mong muốn. Một ảnh có thể đủ cho thay đổi nhỏ.
Với một luồng lớn hơn, bạn có thể thêm bố cục trên máy tính và điện thoại. Bạn
cũng có thể thêm trạng thái trống hoặc đang tải nếu chúng thật sự quan trọng.

Khi đưa ảnh, hãy nói rõ phần muốn học theo. Đó có thể là bố cục, cách sắp xếp
thông tin hoặc thứ tự các bước. Đừng chỉ nói “làm giống ảnh này”.

### Ví dụ bằng code

Bạn cũng có thể đưa một đoạn HTML, một thành phần giao diện hoặc repository có
cách làm gần với điều bạn muốn. Hãy chỉ đúng tệp hoặc đoạn cần xem. Sau đó, nói
rõ bạn muốn học theo cách sắp xếp hay cách phần đó hoạt động. Ví dụ không bắt
coding agent dùng cùng cách xây.

Repository công khai không tự động có nghĩa là bạn được sao chép code. Theo
[GitHub Docs](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/licensing-a-repository),
nếu repository không có giấy phép thì luật bản quyền vẫn bảo vệ code.
Vì vậy, hãy kiểm tra tệp giấy phép trước khi dùng lại code.

Bạn có thể đặt ảnh hoặc đường dẫn ngay dưới yêu cầu liên quan trong PRD. Ví dụ
giúp làm rõ yêu cầu. Nó không thay thế mục tiêu, phạm vi hoặc `Done When`.

## Prompt engineering là gì?

Prompt là lời giao việc cho coding agent. Prompt engineering là cách làm lời
giao việc đó đủ rõ để agent hiểu đúng và trả lại kết quả bạn có thể kiểm tra.
Với một việc planning, hãy trả lời năm câu hỏi:

1. **Bạn muốn coding agent giúp làm việc gì?**
2. **Coding agent cần biết những thông tin nào?**
3. **Coding agent nên làm việc với bạn như thế nào?**
4. **Coding agent không được tự làm điều gì?**
5. **Kết quả cuối cùng cần có những gì?**

Không phải prompt nào cũng cần viết dài. Một yêu cầu nhỏ có thể chỉ cần một câu.
Năm câu hỏi trên hữu ích khi công việc còn nhiều quyết định hoặc cần nhiều lượt
trao đổi.

[Tài liệu chính thức của OpenAI](https://developers.openai.com/api/docs/guides/latest-model)
khuyên prompt hướng đến kết quả nên nêu mục tiêu, bối cảnh, ràng buộc, bằng chứng
cần có, tiêu chí thành công và định dạng đầu ra. Một ví dụ trong tài liệu yêu
cầu agent xem xét kế hoạch chuyển dữ liệu, tìm nguy cơ mất dữ liệu hoặc gián
đoạn, dẫn lại bước liên quan và xếp năm rủi ro quan trọng nhất theo thứ tự.

Năm câu hỏi của khóa học là cách diễn đạt lại hướng dẫn đó cho người mới. Khi áp
dụng vào ContentPilot:

- việc cần làm là hỗ trợ tạo PRD,
- thông tin ban đầu là ý tưởng một câu,
- cách làm việc là hỏi một câu mỗi lượt,
- coding agent không được tự quyết định thay bạn hoặc viết code, và
- kết quả cuối là PRD một trang có đủ tám phần.

Bạn giữ quyền quyết định sản phẩm. Coding agent giúp đặt câu hỏi, phát hiện điểm
mơ hồ và tổ chức câu trả lời thành tài liệu.

## Implementation plan là gì?

Implementation plan là kế hoạch biến PRD đã duyệt thành những bước xây dựng có
thứ tự. PRD giữ quyết định về sản phẩm; implementation plan giữ cách thực hiện
và kiểm tra.

Bạn chưa cần biết tên file hay cách viết code. Coding agent có trách nhiệm đề
xuất và giải thích các thành phần kỹ thuật bằng ngôn ngữ dành cho người mới. Mỗi
bước trong plan cần nêu:

- mục tiêu của bước,
- thành phần hoặc file dự kiến liên quan,
- kết quả có thể quan sát sau bước đó, và
- cách kiểm tra kết quả.

Plan cũng phải nêu thứ tự phụ thuộc, giả định, rủi ro, quyết định kỹ thuật còn
mở và cách kiểm tra toàn bộ luồng. Plan không được tự thêm tính năng nằm ngoài
PRD và chưa được phép chứa code triển khai.

[Mẫu Task Design Review của Microsoft](https://microsoft.github.io/code-with-engineering-playbook/design/design-reviews/recipes/templates/template-task-design-review/)
tách rõ mục tiêu, trong phạm vi, ngoài phạm vi, phương án, thành phần cần thay
đổi và câu hỏi còn mở. Khóa học dùng phiên bản ngắn hơn cho người mới nhưng vẫn
giữ nguyên mục đích: mỗi bước phải gắn với một yêu cầu và một cách kiểm tra.

Quay lại ví dụ máy tính bảng của Atlassian: PRD có thể yêu cầu giao diện hiển
thị tốt trên máy tính bảng. Implementation plan sẽ nêu bước chỉnh bố cục và
cách kiểm tra ở chiều rộng máy tính bảng. Đây là mối liên hệ giữa điều sản phẩm
cần đạt và cách chứng minh điều đó đã được thực hiện.

## Các phần kiểm tra

Module không kiểm tra ngay sau từng câu giải thích. Mỗi phần kiểm tra chỉ xuất
hiện sau khi bạn đã học xong một cụm kiến thức:

- 3 câu sau Planning và PRD.
- 3 câu sau Prompt engineering.
- 2 câu sau Implementation plan.
- 15 câu tổng hợp sau khi bạn hoàn thành planning package.

Tám câu đầu giúp bạn kiểm tra từng cụm kiến thức. Phần cuối gồm mười câu lựa
chọn, ba câu trả lời ngắn và hai câu đối chiếu artifact của chính bạn. Bạn cần
đạt ít nhất 12/15 câu cuối.

Mỗi câu hỏi đều ghi căn cứ và đường dẫn đến nguồn chính thức. Khóa học biên soạn
câu hỏi bằng tiếng Việt dựa trên các nguồn đó; câu hỏi không được trình bày như
một trích dẫn nguyên văn. Lời giải và nguồn chỉ hiện sau khi bạn trả lời.

## Checkpoint hoàn thành

Bạn hoàn thành Module 2 khi có một **planning package** gồm:

- `artifacts/PRD.md`, và
- `artifacts/implementation-plan.md`.

PRD đạt khi đủ tám phần ở trên, ngắn gọn trong khoảng một trang, không chứa chi
tiết triển khai và đã được bạn duyệt rõ ràng.

Implementation plan đạt khi:

- dùng `PRD.md` đã duyệt làm nguồn,
- có cách tiếp cận tổng thể bằng ngôn ngữ dễ hiểu,
- chia công việc thành các bước nhỏ có thứ tự,
- mỗi bước có mục tiêu, thành phần hoặc file, kết quả quan sát và cách kiểm tra,
- nêu phụ thuộc, giả định, rủi ro và câu hỏi kỹ thuật còn mở,
- có kiểm tra toàn bộ luồng từ đầu đến cuối, và
- không mở rộng phạm vi hoặc bắt đầu viết code.

Hai tài liệu khớp nhau khi mọi yêu cầu trong phạm vi PRD đều xuất hiện trong
plan, mọi bước của plan đều truy ngược được về PRD, phần ngoài phạm vi không bị
đưa trở lại và các mục `Done When` trở thành bằng chứng kiểm tra trong plan.

Trước khi qua module tiếp theo, bạn cần duyệt cả hai tài liệu và giải thích bằng
lời của mình ít nhất một quyết định về phạm vi.

## Nguồn và lựa chọn sư phạm

Các nguyên tắc về planning, PRD, prompt và thiết kế công việc trong module dựa
trên các nguồn chính thức được liên kết ngay tại phần liên quan. Yêu cầu PRD một
trang, tám phần, chưa dùng persona, năm câu hỏi dành cho người mới và cách chia
checkpoint là lựa chọn sư phạm riêng của khóa học này. Cấu trúc 3 + 3 + 2 + 15
cũng là lựa chọn sư phạm; căn cứ và đáp án của từng câu nằm trong ngân hàng câu
hỏi có nguồn.
