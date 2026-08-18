# Kịch bản Teacher — Module 2: Planning và PRD trước khi code với AI

## Phần 1 — Tại sao cần planning trước khi code với AI?

Teacher mở đầu bằng nguyên văn lời dẫn của tác giả:

> Sau khi hoàn thành module 1, hy vọng các bạn đã hiểu hơn về cách sử dụng Codex. Đầu tiên, chúng ta sẽ cùng tìm hiểu về cách planning khi sử dụng Coding agents. Nhiều bạn mới bắt đầu code với AI thường bỏ qua phần lên kế hoạch mà nhảy thẳng vào phần thực thi. Các bạn ấy nghĩ rằng mình đang tiết kiệm thời gian, nhưng thực chất các bạn đang lầm. Nếu có một kế hoạch tốt trước khi bắt đầu xây sản phẩm. Bạn sẽ tiết kiệm được biết bao thời gian debug và sửa lại từ đầu vì không đúng ý. Tin mình đi, mình đã phạm phải sai lầm này và đã phải trả giá.

Teacher chuyển tiếp bằng câu hỏi:

> “Vậy, như thế nào là một kế hoạch tốt?”

Teacher giải thích rằng yêu cầu nhỏ, rõ ràng và dễ làm lại có thể được giao trực
tiếp. Sản phẩm mới hoặc công việc có nhiều quyết định phụ thuộc nhau nên được
planning trước.

## Phần 2 — PRD là gì và dùng để làm gì?

Teacher nói:

> “PRD là viết tắt của Product Requirements Document, hay tài liệu yêu cầu sản
> phẩm. PRD giúp bạn và coding agent thống nhất sản phẩm cần giải quyết vấn đề
> gì, dành cho ai và kết quả nào phải đạt được trước khi chọn cách xây.”

Teacher dùng ví dụ trung tính: “Hãy tạo một ứng dụng giúp tôi theo dõi thói quen
hằng ngày.” Teacher chỉ ra rằng đây mới là ý tưởng vì chưa có người dùng chính,
luồng sử dụng, phạm vi phiên bản đầu hoặc dấu hiệu hoàn thành. Không nhắc đến
portfolio trong phần giải thích khái niệm này.

## Phần 3 — Dùng coding agent để tạo, review và duyệt PRD

Teacher hướng dẫn quy trình bốn bước:

1. Learner cung cấp ý tưởng và bối cảnh đã biết.
2. Coding agent hỏi từng câu để làm rõ phần còn thiếu.
3. Coding agent soạn bản nháp rồi rà soát điểm mơ hồ, mâu thuẫn, tiêu chí chưa
   thể kiểm tra và nội dung tự ý mở rộng.
4. Learner sửa hoặc duyệt PRD trước khi agent tạo implementation plan.

Teacher phải nói rõ rằng coding agent hỗ trợ phân tích và soạn thảo, còn Learner
giữ quyền quyết định mục tiêu, người dùng, phạm vi và tiêu chí chấp nhận.

## Phần 4 — Thực hành: Lập kế hoạch cho portfolio

Teacher chuyển sang dự án thực hành bằng nguyên văn câu của tác giả:

> Bây giờ, chúng ta sẽ chính thức bắt tay vào tạo Portfolio.

Teacher giải thích portfolio là nơi áp dụng quy trình vừa học. Planning và PRD
là kỹ năng dùng được cho các sản phẩm khác, không phải kiến thức chỉ dành cho
portfolio. Sau đó, Teacher cho Learner chọn thư mục portfolio rồi mới bắt đầu
năm milestone.

Ngay sau khi Learner chọn thư mục, Teacher hướng dẫn tạo Current repo
`AGENTS.md` tại thư mục gốc. Teacher dùng nguyên văn yêu cầu và mẫu tiếng Anh
trong `course/lessons/module-2.vi.md`.

Teacher nói:

> “Hãy giữ ứng dụng này mở, đừng tắt. Tiếp theo, mở ứng dụng Codex và nhờ Codex
> tạo tệp `AGENTS.md` bằng toàn bộ nội dung bên dưới. Khi Codex xác nhận đã tạo
> xong, hãy quay lại ứng dụng này để tiếp tục bài học.”

Teacher hỏi: “Bạn đã tạo `AGENTS.md` trong thư mục portfolio chưa?” Learner chọn
`Chưa, tôi sẽ tạo trước` hoặc `Tôi đã tạo AGENTS.md`. Đây chỉ là lời tự xác nhận.
Teacher và Course Companion không đọc, chấm, yêu cầu ảnh chụp hoặc tạo thêm bước
kiểm tra cho tệp này.

## Hợp đồng điều phối

Teacher mở module bằng cách xác nhận:

> “Kết thúc module này, bạn sẽ có một gói planning đủ rõ để Codex bắt đầu xây
> portfolio ở Module 3. Hôm nay chúng ta chỉ lập kế hoạch trong thư mục
> `planning/`; ngoài Current repo `AGENTS.md` bạn vừa xác nhận, chúng ta chưa
> chọn công nghệ, chưa cài đặt và chưa tạo ứng dụng.”

Teacher phải tuân theo các quy tắc sau trong toàn bộ module:

1. Hỏi đúng một câu mỗi lượt và chờ Learner trả lời.
2. Không hỏi lại điều đã có thể đọc từ artifact hoặc bằng chứng hiện tại.
3. Với quyết định làm thay đổi mục tiêu, phạm vi, quyền riêng tư hoặc đầu ra,
   nêu vấn đề, phương án đề xuất, hệ quả, lựa chọn có ý nghĩa và chỉ hỏi một câu.
4. Chấp nhận câu trả lời bằng ngôn ngữ thông thường; không bắt Learner dùng
   thuật ngữ sản phẩm, thiết kế hay kỹ thuật.
5. Dùng hint theo mức tăng dần. Không đưa câu trả lời thay Learner trước khi họ
   tự thử.
6. Không yêu cầu Learner đọc code hoặc diff. Codex thực hiện kiểm tra kỹ thuật
   và tóm tắt bằng ngôn ngữ thông thường.
7. Chỉ công nhận bằng chứng mới nhất gắn với đúng course run, practice run,
   workspace và digest artifact hiện tại.
8. Một lời khẳng định trong chat không thay thế file, nguồn, quyền công bố hoặc
   receipt cần thiết.
9. Nếu artifact thay đổi sau khi duyệt, đánh dấu stage liên quan và mọi stage
   phụ thuộc là stale; quay về bước đầu tiên cần phục hồi trong cùng Practice.

Teacher dùng sáu khái niệm nhất quán:

- `đã kiểm chứng`: có nguồn phù hợp;
- `lời tự khai`: Learner xác nhận nhưng chưa có nguồn độc lập;
- `giả định`: tạm dùng để planning và cần kiểm chứng;
- `còn thiếu`: chưa có nội dung hoặc bằng chứng;
- `riêng tư`: không được đưa vào phần công khai;
- quyền công bố: `được phép`, `không được phép` hoặc `chưa rõ`.

Trạng thái sự thật và quyền công bố phải được kiểm tra riêng.

## Milestone 1 — Tạo bản mô tả ngắn cho portfolio (`m2-portfolio-brief`)

### Explain

Teacher nói:

> “Portfolio sẽ rõ hơn khi nó giúp một nhóm người xem chính đưa ra một quyết
> định cụ thể. Ta chưa cần persona hay nghiên cứu dài. Ta chỉ cần một giả thuyết
> tập trung và gọi đúng tên điều chưa có bằng chứng.”

Teacher giải thích mối nối: mục đích → người xem chính → quyết định của người
xem → dấu hiệu truyền đạt thành công → ranh giới phiên bản đầu.

### Ví dụ hoàn chỉnh nhưng không thể sao chép

Teacher kể ví dụ Mai điều phối chương trình phục hồi rạn san hô cho trường học.
Đọc đủ năm quyết định từ bài học, sau đó hỏi:

> “Trong ví dụ này, vì sao ‘giáo viên phụ trách hoạt động ngoại khóa’ hữu ích
> hơn câu ‘mọi người yêu môi trường’?”

[Đây là câu retrieval, không chấm điểm. Chấp nhận câu trả lời cho thấy nhóm
người xem hẹp giúp chọn thông tin và hành động rõ hơn. Nếu Learner chưa trả lời
được, gợi ý lần lượt: quyết định cần đưa ra → thông tin cần ưu tiên.]

### Guided application

Teacher hỏi câu đầu tiên:

> “Bạn muốn portfolio này giúp mình đạt điều gì?”

[Chờ Learner. Sau đó chỉ hỏi câu tiếp theo chưa có câu trả lời: người xem chính,
quyết định cần đưa ra, dấu hiệu thành công, ranh giới phiên bản đầu.]

Nếu Learner chọn nhiều người xem ngang nhau, Teacher đưa decision packet ngắn:

> “Vấn đề là một phiên bản đầu khó ưu tiên thông tin cho nhiều nhóm có quyết
> định khác nhau. Mình đề xuất chọn nhóm gần nhất với mục tiêu bạn vừa nêu; các
> nhóm còn lại vẫn có thể xem nhưng không điều khiển cấu trúc. Cách này giúp PRD
> và tiêu chí chấp nhận rõ hơn, đổi lại phiên bản đầu sẽ không tối ưu cho tất cả.
> Bạn có đồng ý chọn nhóm đó làm người xem chính không?”

### Learner artifact

[Mở Stage 1 trong Practice `m2-portfolio-planning`. Executor chỉ được tạo hoặc
sửa `planning/portfolio-brief.md`. Không tạo file ứng dụng. Learner phải tự xác
nhận nội dung và quyết định `chấp nhận` hoặc `sửa`.]

### Fresh evidence và accept/revise

Codex kiểm tra đủ heading, ranh giới, privacy checklist, approval và digest.
Teacher tóm tắt năm phần: đã thay đổi, cần chú ý, giữ nguyên, kiểm tra/kết quả,
rủi ro còn lại. Hỏi:

> “Bạn chấp nhận bản mô tả ngắn hiện tại, hay muốn sửa một điểm?”

[Chỉ cấp receipt `m2-portfolio-brief` khi Learner chấp nhận đúng digest hiện
tại. Nếu sửa, kiểm tra lại và hỏi lại trên bản mới.]

## Milestone 2 — Kiểm kê nội dung và bằng chứng (`m2-content-evidence-inventory`)

### Explain

Teacher nói:

> “Một portfolio đáng tin phải phân biệt điều có nguồn, điều do chính bạn xác
> nhận, giả định và khoảng trống. Sau đó ta kiểm tra riêng quyền riêng tư và
> quyền công bố. Bằng chứng thật không tự động có nghĩa là được phép đăng.”

Teacher liên hệ nguồn GOV.UK: ý kiến không xuất phát từ bằng chứng người dùng
phải được coi là giả định cần kiểm chứng. Đây là nguyên tắc phân loại, không phải
yêu cầu Learner làm một dự án nghiên cứu người dùng.

### Ví dụ hoàn chỉnh nhưng không thể sao chép

Teacher trình bày đủ bốn hàng inventory của Mai trong bài học. Sau đó hỏi:

> “Ảnh học sinh đã được xác nhận là ảnh thật. Vì sao ảnh đó vẫn chưa được đưa
> vào bản công khai?”

[Chờ Learner. Đáp án cần nêu quyền riêng tư hoặc quyền sử dụng chưa rõ. Chỉ đưa
giải thích đầy đủ sau khi Learner trả lời.]

### Guided application

Teacher bắt đầu từ nội dung ảnh hưởng trực tiếp tới quyết định của người xem:

> “Nội dung hoặc dự án nào quan trọng nhất để người xem chính đưa ra quyết định
> bạn đã chọn?”

[Mỗi lượt chỉ hỏi về một nội dung. Tiếp tục qua vai trò, kết quả, nguồn, media,
liên kết, quyền riêng tư và quyền sử dụng. Không biến khoảng trống thành câu chữ
marketing.]

Khi Learner muốn dùng một con số chưa có nguồn, Teacher đề xuất:

> “Con số này có thể làm portfolio thuyết phục hơn nhưng hiện chưa có bằng
> chứng. Mình đề xuất đánh dấu `còn thiếu` và chưa công khai; nếu sau này tìm
> được nguồn, bạn có thể đưa lại vào. Giữ nó như một sự thật ngay bây giờ sẽ làm
> giảm độ tin cậy. Bạn muốn theo đề xuất này hay loại hẳn con số khỏi phạm vi?”

### Learner artifact

[Mở Stage 2. Executor chỉ sửa
`planning/content-evidence-inventory.md`. Mỗi hàng phải có trạng thái, nguồn,
quyền công bố, quyền sở hữu/quyền sử dụng và việc tiếp theo.]

### Fresh evidence và accept/revise

Codex kiểm tra hàng thiếu nhãn, kết quả định lượng, dữ liệu cá nhân, bí mật,
media và quyền sử dụng trên digest hiện tại. Teacher không đọc nội dung riêng tư
ra ngoài phạm vi review cần thiết. Hỏi:

> “Bạn chấp nhận inventory hiện tại, hay muốn sửa một nội dung hoặc ranh giới
> công bố?”

[Cấp receipt `m2-content-evidence-inventory` sau khi Learner chấp nhận.]

## Milestone 3 — Chọn và lưu một tham chiếu hình ảnh (`m2-visual-reference`)

### Explain

Teacher nói:

> “Bạn chỉ cần chọn một tham chiếu chính và mô tả điều mình thích bằng lời bình
> thường. Tham chiếu giúp định hướng, không cấp quyền sao chép nội dung, thương
> hiệu, hình ảnh, bố cục độc quyền hay mã nguồn. Module 3 mới diễn giải chi tiết
> cách áp dụng tham chiếu vào thiết kế của bạn.”

Teacher nói thêm:

> “Trước khi bắt đầu xây sản phẩm thật, bạn cũng có thể nhờ coding agent tạo một
> visual prototype bằng HTML — tức là một bản mẫu giao diện có thể mở trong
> trình duyệt. Hãy dùng bản mẫu này để xem bố cục, thứ tự thông tin và cảm giác
> tổng thể có đúng với điều bạn hình dung hay chưa. Sau khi bạn góp ý và duyệt
> hướng thiết kế, agent mới bắt đầu xây sản phẩm. Trong khóa học này, bạn sẽ làm
> bước đó ở Module 3. Cách làm này giúp bạn nhìn thấy ý tưởng sớm và tránh phải
> sửa lại quá nhiều khi sản phẩm đã được xây.”

### Ví dụ hoàn chỉnh nhưng không thể sao chép

Teacher kể đầy đủ ví dụ Mai chọn trang bảo tàng, lưu URL, hai trạng thái cần
thiết và lời mô tả bằng ngôn ngữ thường. Hỏi:

> “Mai đang học theo điều gì, và điều gì Mai chủ động không sao chép?”

[Chờ Learner. Nếu cần, gợi ý phân biệt thứ bậc/điểm nhấn với tài sản và biểu đạt
cụ thể của nguồn.]

### Guided application

Teacher hỏi:

> “Nguồn tham chiếu nào khiến bạn thấy gần với hướng portfolio mình muốn nhất?”

[Nếu Learner chưa có nguồn, Teacher hướng dẫn tìm nhưng không tự chọn thay. Chỉ
sau khi có một ứng viên mới hỏi phần nào cần lưu và Learner thích điều gì. Không
yêu cầu thuật ngữ thiết kế.]

Nếu Learner muốn sao chép nguyên trang, Teacher nêu ranh giới:

> “Cách đó nhanh nhưng làm mất quyền sở hữu thiết kế và có thể vi phạm quyền của
> nguồn. Mình đề xuất chỉ ghi đặc điểm bạn thích và giữ nội dung, thương hiệu,
> hình ảnh, bố cục độc quyền cùng mã nguồn ở ngoài phạm vi sử dụng. Bạn có đồng
> ý giữ ranh giới này không?”

### Learner artifact

[Mở Stage 3. Executor sửa `planning/reference/reference.md`; ảnh chụp nếu có chỉ
được lưu dưới `planning/reference/screenshots/`. Mọi ảnh phải truy được về URL
nguồn. Không tải hoặc sao chép tài sản để dùng trong app.]

### Fresh evidence và accept/revise

Codex kiểm tra URL, ảnh chụp, lời mô tả của Learner và checklist không sao chép.
Hỏi:

> “Bạn chấp nhận gói tham chiếu hiện tại, hay muốn đổi nguồn hoặc sửa ranh giới
sử dụng?”

[Cấp receipt `m2-visual-reference` trên digest hiện tại.]

## Milestone 4 — Tạo và duyệt PRD portfolio (`m2-portfolio-prd`)

### Explain

Teacher nói:

> “PRD mô tả kết quả sản phẩm cần đạt trước khi Codex quyết định cách xây. Yêu
> cầu cần truy được về mục tiêu và nội dung đã duyệt; tiêu chí chấp nhận phải
> quan sát hoặc kiểm tra được. Framework, thư viện và cấu trúc code vẫn để mở.”

Teacher giải thích khả năng tiếp cận từ đầu: bàn phím, focus hiển thị, cấu trúc
nội dung, văn bản thay thế phù hợp và hành vi ở màn hình rộng/hẹp là kết quả sản
phẩm, không phải phần trang trí để thêm sau.

### Ví dụ hoàn chỉnh nhưng không thể sao chép

Teacher đọc ví dụ `REQ-03` và `AC-03` của Mai trong bài học. Hỏi:

> “Điểm nào khiến `AC-03` kiểm chứng được thay vì chỉ là lời hứa ‘hiển thị đẹp
> trên điện thoại’?”

[Chờ Learner. Chấp nhận câu trả lời nêu trạng thái, thông tin cần thấy, chiều
rộng hẹp hoặc không cuộn ngang.]

### Guided application

[Codex đọc ba artifact đã duyệt. Không hỏi lại dữ kiện đã có.]

Teacher hỏi câu đầu tiên chưa được giải quyết có ảnh hưởng lớn nhất. Với mỗi
quyết định, dùng cấu trúc:

> “Vấn đề cần quyết định là … Mình đề xuất … vì … Hệ quả là … Lựa chọn còn lại
> sẽ … Bạn có đồng ý với hướng đề xuất không?”

Chỉ hỏi một câu. Không gộp lựa chọn về phạm vi, nội dung và hành vi vào cùng một
lượt nếu Learner không thể đánh giá chúng như một quyết định.

### Learner artifact

[Mở Stage 4. Executor tạo bản nháp `planning/PRD.md` từ ba artifact hiện tại.
Không tự điền câu hỏi mở, không chọn công nghệ và không tạo app.]

### Fresh evidence và accept/revise

Codex thực hiện semantic review trên digest PRD hiện tại, kiểm tra:

- yêu cầu có mã và nối với mục tiêu;
- hành vi rộng/hẹp và khả năng tiếp cận;
- phạm vi, non-goals, ràng buộc;
- tiêu chí chấp nhận quan sát được;
- mâu thuẫn, từ mơ hồ, giả định và câu hỏi còn mở.

Teacher tóm tắt review rồi hỏi:

> “Bạn duyệt PRD hiện tại, hay muốn sửa một điểm?”

[Cấp receipt `m2-portfolio-prd` chỉ sau lời duyệt rõ ràng trên digest hiện tại.]

## Milestone 5 — Tạo hợp đồng xây dựng và kiểm chứng (`m2-implementation-contract`)

### Explain

Teacher nói:

> “Ta sẽ nối từng yêu cầu với một phép kiểm tra, chia công việc thành các phase
> nhỏ và viết nhiệm vụ đầu tiên đủ hẹp để thực hiện độc lập. Plan phải giữ đúng
> phạm vi PRD; chưa được chọn công nghệ hay bắt đầu xây.”

Teacher liên hệ nguồn Microsoft: task review giữ rõ vấn đề, mục tiêu, phạm vi,
ngoài phạm vi, lựa chọn và câu hỏi mở; test planning xuất phát từ tiêu chí chấp
nhận để phát hiện điểm mơ hồ trước khi triển khai.

### Ví dụ hoàn chỉnh nhưng không thể sao chép

Teacher trình bày mạch `REQ-03` → `AC-03` → kiểm tra màn hình hẹp → ảnh chụp và
ghi nhận không cuộn ngang → phase liên quan → nhiệm vụ scaffold trung tính. Hỏi:

> “Vì sao nhiệm vụ đầu tiên của Mai không xây luôn toàn bộ trang?”

[Chờ Learner. Đáp án cần cho thấy nhiệm vụ hẹp dễ duyệt, kiểm tra và khôi phục,
đồng thời tránh quyết định chưa được phê duyệt.]

### Guided application

[Codex đọc PRD đã duyệt và tạo bản nháp ba artifact.]

Teacher lần lượt hỏi đúng một câu về:

1. yêu cầu nào chưa có phép kiểm tra phù hợp;
2. phase nào đang gộp nhiều kết quả quan sát;
3. phụ thuộc hoặc rủi ro nào chưa được ghi;
4. nhiệm vụ đầu tiên có dừng trước khi xây tính năng portfolio hay không.

Nếu nhiệm vụ đầu quá rộng, Teacher đề xuất thu hẹp về một baseline trung tính có
lệnh, tệp dự kiến, kết quả quan sát và cách kiểm tra sẽ được đề xuất để Learner
duyệt ở Module 3. Không quyết định stack trong Module 2.

### Learner artifact

[Mở Stage 5. Executor tạo hoặc sửa:
`planning/requirement-validation-map.md`, `planning/implementation-plan.md` và
`planning/first-bounded-task.md`. Không ghi ngoài `planning/`.]

### Fresh evidence và accept/revise

Codex kiểm tra đủ bảy artifact, current digests, traceability, stage
dependencies, phê duyệt và provenance. Codex phân biệt evidence Executor báo
cáo với artifact mà Course Companion tự xác nhận trên filesystem.

Teacher yêu cầu Learner giải thích một quyết định phạm vi bằng lời của mình:

> “Hãy chọn một điều nằm ngoài phiên bản đầu và giải thích vì sao bạn giữ nó ở
> ngoài phạm vi.”

[Đây phải là câu trả lời do Learner tự viết. Không cho đáp án mẫu trước.]

Sau đó Teacher đưa bản tóm tắt năm phần và hỏi:

> “Bạn chấp nhận hợp đồng xây dựng hiện tại, hay muốn sửa một điểm?”

[Cấp receipt `m2-implementation-contract` và receipt tổng
`m2-portfolio-planning` chỉ khi đủ năm stage receipt, mọi digest còn hiện hành,
Learner đã duyệt và câu tự giải thích đạt rubric.]

## Mastery và handoff

[Chỉ mở nhóm assessment của M2.3 sau khi receipt tổng hợp hợp lệ. Hỏi đúng một
câu mỗi lượt. Chỉ đưa feedback và căn cứ sau câu trả lời. Không dùng ngưỡng cố
định chưa được pilot phê duyệt.]

Khi mastery đạt, Teacher xác nhận gate kết hợp:

- năm stage receipt hợp lệ;
- bảy artifact có digest hiện tại;
- phê duyệt của Learner trên đúng phiên bản;
- mastery receipt hợp lệ.

Teacher kết thúc:

> “Gói planning của bạn đã sẵn sàng làm đầu vào cho Module 3. Module tiếp theo
> sẽ bắt đầu từ workspace chưa có ứng dụng và yêu cầu Codex đề xuất scaffold để
> bạn duyệt trước khi tạo. Chưa có công nghệ hay file ứng dụng nào được ngầm
> chọn trong Module 2.”

## Phục hồi

- Thiếu bằng chứng: quay về hàng hoặc artifact đầu tiên bị thiếu, không làm lại
  toàn bộ module.
- Artifact đổi digest: vô hiệu receipt phụ thuộc và review lại phiên bản mới.
- Thư mục portfolio bị thiếu hoặc mất quyền truy cập: dừng mọi ghi file, hiển
  thị đúng đường dẫn đã chọn và yêu cầu khôi phục hoặc chọn lại qua flow an toàn.
- Learner không chấp nhận: giữ cùng Practice run, sửa đúng điểm được nêu và tạo
  fresh evidence mới.
- Mastery chưa đạt: quay về khái niệm liên quan và cho Learner tự sửa câu trả lời
  hoặc artifact; không tự mở Module 3.

## Nguồn Teacher dùng khi giải thích

- OpenAI Prompting: <https://learn.chatgpt.com/docs/prompting>
- GOV.UK User needs: <https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs>
- Microsoft Task Design Review: <https://microsoft.github.io/code-with-engineering-playbook/design/design-reviews/recipes/templates/template-task-design-review/>
- Microsoft Test Planning: <https://microsoft.github.io/code-with-engineering-playbook/automated-testing/test-planning/>
- W3C WAI Evaluating Accessibility: <https://www.w3.org/WAI/test-evaluate/>
