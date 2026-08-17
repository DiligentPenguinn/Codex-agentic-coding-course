# Module 2 — Xác định, giới hạn và lập kế hoạch portfolio

## Mở đầu

Sau khi hoàn thành module 1, hy vọng các bạn đã hiểu hơn về cách sử dụng Codex. Bây giờ, chúng ta sẽ chính thức bắt tay vào tạo Portfolio. Đầu tiên, chúng ta sẽ cùng tìm hiểu về cách planning khi sử dụng Coding agents. Nhiều bạn mới bắt đầu code với AI thường bỏ qua phần lên kế hoạch mà nhảy thẳng vào phần thực thi. Các bạn ấy nghĩ rằng mình đang tiết kiệm thời gian, nhưng thực chất các bạn đang lầm. Nếu có một kế hoạch tốt trước khi bắt đầu xây sản phẩm. Bạn sẽ tiết kiệm được biết bao thời gian debug và sửa lại từ đầu vì không đúng ý. Tin mình đi, mình đã phạm phải sai lầm này và đã phải trả giá.

Vậy, như thế nào là một kế hoạch tốt?

## Kết quả của module

Bạn sẽ biến một ý tưởng portfolio còn mơ hồ thành một hợp đồng xây dựng trung
thực, có bằng chứng và đủ rõ để Codex bắt đầu triển khai ở Module 3 mà không phải
tự đoán những quyết định quan trọng.

Module này chỉ tạo nội dung trong thư mục `planning/`. Bạn chưa chọn công nghệ,
chưa cài gói phụ thuộc và chưa tạo ứng dụng.

## Cách học trong từng milestone

Mỗi milestone dùng cùng một vòng làm việc:

1. Hiểu mục đích của tài liệu cần tạo.
2. Xem một ví dụ hoàn chỉnh nhưng không thể sao chép thành câu trả lời của bạn.
3. Trả lời từng câu hỏi ngắn bằng ngôn ngữ thông thường.
4. Tự tạo hoặc sửa tài liệu trong portfolio của mình.
5. Để Codex kiểm tra bằng chứng mới nhất trên đúng phiên bản tài liệu đó.
6. Tự quyết định chấp nhận hay yêu cầu sửa.

Khi một lựa chọn có thể thay đổi phạm vi hoặc kết quả của portfolio, giáo viên sẽ
hỏi một câu mỗi lượt và đưa ra phương án đề xuất cùng hệ quả. Bạn luôn là người
quyết định cuối cùng.

## Quy ước về tính trung thực và quyền công bố

Mọi nội dung dự định đưa vào portfolio cần được phân biệt rõ:

- `đã kiểm chứng`: có nguồn phù hợp để đối chiếu;
- `lời tự khai`: đúng theo lời bạn nhưng chưa có nguồn độc lập;
- `giả định`: điều đang được dùng để lập kế hoạch nhưng chưa được xác nhận;
- `còn thiếu`: chưa có nội dung hoặc bằng chứng cần thiết;
- `riêng tư`: có thật nhưng không nên đưa vào bản công khai;
- quyền công bố: `được phép`, `không được phép` hoặc `chưa rõ`.

Trạng thái nội dung và quyền công bố là hai việc khác nhau. Một ảnh có thể là
bằng chứng thật nhưng vẫn không được phép công khai. Codex không được biến lời
tự khai, giả định hoặc khoảng trống thành sự thật chắc chắn.

## Milestone 1 — Tạo bản mô tả ngắn cho portfolio

### Điều cần hiểu

Portfolio phiên bản đầu không cần phục vụ tất cả mọi người. Chọn một nhóm người
xem chính giúp bạn quyết định thông tin nào cần nổi bật. Hãy xác định:

- portfolio cần giúp bạn đạt điều gì;
- một nhóm người xem quan trọng nhất;
- quyết định họ cần đưa ra sau khi xem;
- dấu hiệu có thể quan sát cho thấy thông điệp đã được truyền đạt;
- điều cần có, chưa làm và còn chưa chắc trong phiên bản đầu.

Đây là một giả thuyết tập trung, không phải một dự án nghiên cứu người dùng đầy
đủ. Nếu lựa chọn chỉ dựa trên mong muốn của bạn, hãy ghi rõ đó là giả định.

### Ví dụ hoàn chỉnh, không phải đáp án mẫu

Mai đang điều phối một nhóm phục hồi rạn san hô và cần một trang giới thiệu cho
các trường học. Mục đích là giúp giáo viên đánh giá liệu chương trình tham quan
có phù hợp với học sinh 12–15 tuổi hay không. Người xem chính là giáo viên phụ
trách hoạt động ngoại khóa. Quyết định cần đưa ra là có yêu cầu một buổi tư vấn
hay không. Dấu hiệu thành công là người xem tìm được mục tiêu học tập, yêu cầu an
toàn và cách liên hệ mà không phải hỏi lại thông tin cơ bản. Phiên bản đầu không
có đăng ký hay thanh toán trực tuyến.

Ví dụ này hoàn chỉnh vì các quyết định liên kết với nhau. Bạn không thể sao chép
nó vì người xem, bằng chứng và mục tiêu của bạn khác Mai.

### Áp dụng vào portfolio của bạn

Giáo viên bắt đầu bằng câu hỏi: “Bạn muốn portfolio này giúp mình đạt điều gì?”
Sau mỗi câu trả lời, giáo viên chỉ hỏi câu tiếp theo cần thiết. Khi phải chọn giữa
nhiều người xem, giáo viên đề xuất một nhóm chính dựa trên mục tiêu đã nêu và giải
thích điều gì sẽ được ưu tiên hoặc hoãn lại.

Bạn hoàn thành `planning/portfolio-brief.md`, rồi tự kiểm tra:

- mục đích, người xem và quyết định của họ có khớp nhau không;
- dấu hiệu thành công có thể quan sát được không;
- ranh giới phiên bản đầu có ngăn phạm vi tự mở rộng không;
- giả định và nội dung riêng tư đã được đánh dấu chưa.

Codex kiểm tra đúng mã nhận diện nội dung mới nhất của tài liệu. Bạn đọc bản tóm tắt bằng ngôn
ngữ thông thường, sau đó chọn chấp nhận hoặc yêu cầu sửa. Milestone chỉ đạt khi
bạn duyệt phiên bản hiện tại.

## Milestone 2 — Kiểm kê nội dung và bằng chứng

### Điều cần hiểu

Một portfolio đáng tin không chỉ cần câu chữ hay. Mỗi tuyên bố quan trọng cần có
trạng thái, nguồn nếu có, quyền công bố và việc tiếp theo. Hãy kiểm kê tiểu sử,
kỹ năng, dự án, vai trò, kết quả, hình ảnh, tài liệu và liên kết trước khi viết
nội dung trang.

Không có bằng chứng không có nghĩa là nội dung chắc chắn sai. Điều đó chỉ có
nghĩa bạn phải gọi đúng tên trạng thái hiện tại và tránh trình bày nó như một sự
thật đã được kiểm chứng.

### Ví dụ hoàn chỉnh, không phải đáp án mẫu

Trong bản kiểm kê của Mai:

| Nội dung | Trạng thái | Bằng chứng | Công khai | Quyền sử dụng | Việc tiếp theo |
| --- | --- | --- | --- | --- | --- |
| Điều phối 18 buổi học ngoài trời | đã kiểm chứng | Báo cáo hoạt động 2025 | Có | Tự sở hữu | Trích đúng phạm vi và năm |
| “Học sinh tự tin hơn sau chuyến đi” | lời tự khai | Ghi chú quan sát cá nhân | Có | Tự sở hữu | Không trình bày như kết quả nghiên cứu |
| Ảnh học sinh trên thuyền | đã kiểm chứng | Kho ảnh nội bộ | Không | Chưa rõ | Xin quyền hoặc thay ảnh khác |
| Tỉ lệ hài lòng 95% | còn thiếu | Chưa tìm thấy khảo sát gốc | Không | Chưa rõ | Không dùng cho đến khi có nguồn |

Ví dụ cho thấy trạng thái bằng chứng không thay thế kiểm tra quyền riêng tư và
quyền sử dụng.

### Áp dụng vào portfolio của bạn

Bạn hoàn thành `planning/content-evidence-inventory.md`. Giáo viên chỉ hỏi về một
nhóm nội dung mỗi lượt, bắt đầu từ những nội dung cần để người xem chính đưa ra
quyết định. Nếu một tuyên bố định lượng chưa có nguồn, phương án đề xuất là đánh
dấu `còn thiếu` và chưa đưa vào phạm vi công khai.

Codex kiểm tra tài liệu mới nhất, chỉ ra:

- hàng chưa có trạng thái rõ ràng;
- tuyên bố quan trọng thiếu nguồn hoặc bị trình bày quá chắc chắn;
- dữ liệu cá nhân, tài liệu mật hoặc thông tin liên hệ cần cân nhắc;
- hình ảnh và nội dung chưa rõ quyền sở hữu hoặc quyền sử dụng.

Bạn quyết định bổ sung, loại bỏ, giữ riêng tư hoặc chấp nhận khoảng trống đã được
ghi rõ. Milestone chỉ đạt sau khi bạn duyệt bản kiểm kê hiện tại.

## Milestone 3 — Chọn và lưu một tham chiếu hình ảnh

### Điều cần hiểu

Một tham chiếu tốt giúp bạn diễn đạt cảm giác, thứ tự thông tin hoặc điểm nhấn
mà không cần biết thuật ngữ thiết kế. Chọn một nguồn chính, lưu URL và chỉ chụp
những trạng thái thật sự hữu ích. Nếu trang thay đổi, có chuyển động hoặc khó
kiểm tra lại, ảnh chụp giúp giữ bằng chứng về điều bạn đã xem.

Tham chiếu không cấp quyền sao chép. Bạn không được sao chép nội dung, thương
hiệu, hình ảnh, bố cục độc quyền hoặc mã nguồn. Module 2 cũng chưa yêu cầu bạn
giải thích chi tiết cách chuyển tham chiếu thành thiết kế; việc đó thuộc Module
3.

### Ví dụ hoàn chỉnh, không phải đáp án mẫu

Mai chọn một trang bảo tàng làm tham chiếu, lưu URL nguồn và hai ảnh chụp: màn
hình mở đầu trên máy tính và danh sách chương trình trên điện thoại. Mai ghi:
“Tôi thích việc trang cho biết đối tượng và hành động tiếp theo ngay ở phần đầu;
trên điện thoại, các chương trình vẫn dễ phân biệt.” Mai không tải ảnh của bảo
tàng để dùng lại, không sao chép chữ và không yêu cầu Codex làm giao diện giống
hệt.

### Áp dụng vào portfolio của bạn

Bạn chọn đúng một tham chiếu chính và hoàn thành
`planning/reference/reference.md`. Ảnh chụp, nếu cần, chỉ được lưu trong
`planning/reference/screenshots/` và phải đi kèm URL nguồn.

Giáo viên hỏi một câu mỗi lượt: nguồn nào bạn thích, phần nào đáng lưu và bạn
thích điều gì bằng lời của mình. Nếu nguồn không rõ hoặc quyền sử dụng gây nhầm
lẫn, phương án đề xuất là chỉ lưu liên kết cùng ảnh chụp phục vụ phân tích nội
bộ, không đưa tài sản của nguồn vào portfolio công khai.

Codex kiểm tra nguồn, đường dẫn ảnh và ranh giới sử dụng trên tài liệu mới nhất.
Bạn chấp nhận hoặc sửa trước khi qua milestone tiếp theo.

## Milestone 4 — Tạo và duyệt PRD portfolio

### Điều cần hiểu

PRD giữ các quyết định về sản phẩm trước khi Codex quyết định cách xây. PRD của
portfolio cần nêu:

- mục đích, người xem và nội dung đầu vào;
- yêu cầu có mã ổn định;
- hành vi cần đạt trên màn hình rộng và hẹp;
- khả năng dùng bằng bàn phím, focus hiển thị, cấu trúc nội dung và văn bản thay
  thế phù hợp;
- phạm vi, ngoài phạm vi, ràng buộc và câu hỏi còn mở;
- tiêu chí chấp nhận có thể quan sát và truy ngược về yêu cầu.

Một yêu cầu nói về kết quả người xem cần nhận được, không khóa trước công nghệ,
thư viện hay cấu trúc mã nguồn. Những lựa chọn kỹ thuật thuộc Module 3.

### Ví dụ hoàn chỉnh, không phải đáp án mẫu

PRD của Mai có yêu cầu `REQ-03`: “Trên màn hình hẹp, giáo viên vẫn đọc được mục
tiêu, độ tuổi phù hợp và yêu cầu an toàn của từng chương trình mà không cuộn
ngang.” Tiêu chí `AC-03` yêu cầu kiểm tra ba thông tin đó ở chiều rộng điện
thoại và xác nhận không có nội dung tràn ngang. PRD ghi form đăng ký và thanh
toán là ngoài phạm vi. Cách dựng bố cục và thư viện giao diện vẫn là câu hỏi của
giai đoạn triển khai.

### Áp dụng vào portfolio của bạn

Codex đọc ba tài liệu đã duyệt làm nguồn, rồi hỏi từng câu cần thiết để tạo bản
nháp `planning/PRD.md`. Với mỗi quyết định hệ trọng, Codex đưa ra phương án đề
xuất, hệ quả và một câu hỏi. Codex không tự điền khoảng trống bằng chứng hay tự
chọn công nghệ.

Bạn xem bản tóm tắt gồm yêu cầu, điều ngoài phạm vi, câu hỏi còn mở và cách kiểm
tra. Sau đó Codex rà soát mâu thuẫn, từ ngữ mơ hồ và tiêu chí không thể kiểm
chứng trên đúng mã nhận diện nội dung hiện tại. Bạn yêu cầu sửa hoặc duyệt PRD.

## Milestone 5 — Tạo hợp đồng xây dựng và kiểm chứng

### Điều cần hiểu

Milestone cuối biến PRD đã duyệt thành ba tài liệu liên kết:

- `planning/requirement-validation-map.md`: mỗi yêu cầu nối với tiêu chí chấp
  nhận, cách kiểm tra và bằng chứng cần lưu;
- `planning/implementation-plan.md`: các giai đoạn nhỏ có mục tiêu, phụ thuộc, vùng
  dự kiến thay đổi, kết quả quan sát và cách kiểm tra;
- `planning/first-bounded-task.md`: một nhiệm vụ đầu tiên đủ nhỏ để phê duyệt,
  triển khai, kiểm tra và khôi phục độc lập ở Module 3.

Plan không được đưa nội dung ngoài phạm vi trở lại, không bỏ sót yêu cầu và
không bắt đầu tạo ứng dụng. Nếu một lựa chọn kỹ thuật chưa được duyệt, hãy ghi
nó là câu hỏi mở.

### Ví dụ hoàn chỉnh, không phải đáp án mẫu

Trong bản đồ của Mai, `REQ-03` nối với `AC-03`, kiểm tra trực tiếp ở màn hình
hẹp và bằng chứng là ảnh chụp cùng ghi nhận không cuộn ngang. Phase liên quan
chỉ nói “xây phần danh sách chương trình đáp ứng trạng thái rộng và hẹp”; chưa
chọn thư viện. Nhiệm vụ đầu tiên của Mai là đề xuất và xác minh scaffold trung
tính, không phải xây luôn trang hoàn chỉnh.

### Áp dụng vào portfolio của bạn

Codex tạo bản nháp ba tài liệu từ PRD hiện tại. Bạn đối chiếu từng yêu cầu với
một phép kiểm tra, xem thứ tự các giai đoạn và chọn nhiệm vụ đầu tiên. Khi một giai đoạn quá
lớn hoặc trộn nhiều kết quả, phương án đề xuất là tách theo một kết quả có thể
quan sát và kiểm chứng độc lập.

Codex kiểm tra bằng chứng mới trên đúng bảy tài liệu hiện tại và báo bằng ngôn
ngữ thông thường:

- điều đã thay đổi;
- điều cần chú ý;
- điều vẫn giữ nguyên;
- kiểm tra và kết quả;
- rủi ro hoặc khoảng trống còn lại.

Bạn giải thích bằng lời của mình một quyết định phạm vi, rồi chấp nhận hoặc yêu
cầu sửa. Module 3 chỉ mở khi đủ dấu xác nhận của năm giai đoạn, các mã nhận diện nội dung vẫn còn hiện hành,
bạn đã duyệt toàn bộ gói planning và mastery receipt đạt.

## Nguồn phương pháp

- [OpenAI — Prompting](https://learn.chatgpt.com/docs/prompting): mục tiêu, bối
  cảnh, ràng buộc, kết quả mong đợi và kiểm tra cuối cần được nói rõ cho công
  việc lớn.
- [GOV.UK — Learning about users and their needs](https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs): bắt đầu từ người dùng và mục tiêu; ý kiến chưa có bằng chứng phải được coi là giả định.
- [Microsoft Engineering Playbook — Task Design Review](https://microsoft.github.io/code-with-engineering-playbook/design/design-reviews/recipes/templates/template-task-design-review/): giữ rõ vấn đề, mục tiêu, phạm vi, ngoài phạm vi, lựa chọn và câu hỏi mở.
- [Microsoft Engineering Playbook — Test planning](https://microsoft.github.io/code-with-engineering-playbook/automated-testing/test-planning/): phép kiểm tra cần xuất phát từ tiêu chí chấp nhận và có thể làm lộ điểm mơ hồ trước khi triển khai.
- [W3C WAI — Evaluating Web Accessibility](https://www.w3.org/WAI/test-evaluate/): đánh giá khả năng tiếp cận cần bắt đầu sớm, kết hợp công cụ với kiểm tra của con người.

Các nguồn trên hỗ trợ cách làm. Cấu trúc năm milestone và bảy tài liệu là quyết
định chương trình cần tiếp tục được kiểm chứng qua pilot với người học.
