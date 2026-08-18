# Kế hoạch bàn giao integration Teacher/Executor — Module 2

- **Trạng thái:** Nội dung và luồng review Module 2 đã hoàn thành để bàn giao;
  Practice năm tài liệu và integration Teacher/Executor chưa được triển khai.
- **Chủ sở hữu phần việc:** Người triển khai Teacher/Executor và Practice runtime.
- **Nguồn quyết định:**
  [`module-2-redesign-working-spec.md`](./module-2-redesign-working-spec.md).
- **Phạm vi của checkpoint hiện tại:** Bốn mục giải thích trong Course Companion,
  trang chuyển sang Practice và bài Mastery năm câu đã được cập nhật để duyệt
  nội dung. Toàn bộ luồng bên dưới vẫn phải được triển khai và kiểm chứng trước
  khi Module 2 mới có thể hoạt động thật.

## 0. Snapshot bàn giao ngày 18 tháng 8 năm 2026

### 0.1 Những gì đã làm được

- Giữ lại phần mở đầu gốc của tác giả và dẫn dắt người học từ lý do cần planning
  tới khái niệm PRD trước khi giới thiệu Practice.
- Rút gọn phần giải thích thành bốn mục trong outline. Trang PRD anatomy và trang
  giải thích task triển khai đầu tiên đã được loại khỏi luồng theo yêu cầu của
  chủ sở hữu.
- Thêm trang lập kế hoạch thiết kế với hai ảnh tham khảo Pafolios và Awwwards;
  ảnh nằm cạnh nhau trên desktop, xếp dọc trên màn hình hẹp và có nguồn rõ ràng.
- Thay trang chuyển sang Practice bằng prompt có thể sao chép. Prompt phỏng vấn
  người học từng câu, tóm tắt và chờ xác nhận, đồng thời giữ code, dependency và
  việc tạo ứng dụng ngoài phạm vi Module 2.
- Đơn giản hóa phần mở đầu Mastery và bỏ title/panel không cần thiết.
- Course Companion hiện toàn bộ câu hỏi của một nhóm trước khi nộp, chỉ hiện
  kết quả và nguồn sau khi nộp, cho phép sửa câu sai mà không làm mất các câu
  còn lại.
- Bài Mastery Module 2 hiện có năm câu: bốn câu trắc nghiệm và một câu trả lời
  do người học tự viết. Bốn câu bị chủ sở hữu yêu cầu xoá đã được gỡ khỏi quiz,
  scene registry, completion contract, persisted decisions và test.
- Tiến độ đang dừng ở câu hỏi đã nghỉ hưu được đưa về câu đầu của bài review;
  receipt chín hoặc mười câu đã hoàn thành trước đây vẫn đọc được.
- Đã kiểm chứng trạng thái tích hợp bằng 287 unit test, 9 startup test,
  typecheck, lint, production build, Electron smoke qua kết quả 5/5 và
  `git diff --check`.

Những thay đổi trên là nội dung và trải nghiệm review đã duyệt. Chúng không chứng
minh Practice năm tài liệu đã chạy thật và không được dùng để tuyên bố Module 2
đã hoàn tất integration.

### 0.2 Phần bàn giao cho người triển khai tiếp

Người tiếp nhận sở hữu các checkpoint I1–I6 trong tài liệu này. Ưu tiên theo
thứ tự:

1. Thay hợp đồng runtime bảy tài liệu bằng đúng năm tài liệu đã duyệt và bump
   Practice version; receipt cũ không được mở gate mới.
2. Nối Teacher, Coordinator và Executor vào một Executor task duy nhất xuyên
   suốt năm giai đoạn, kể cả resume và các vòng **Yêu cầu sửa**.
3. Triển khai evidence adapter đọc tệp thật, kiểm tra write scope, dependency,
   digest và stale cascade trước mỗi lần **Chấp nhận**.
4. Nối UI Mastery với Practice thật; không tạo đường tắt có thể ghi tiến độ,
   tạo receipt hoặc mở Module 3 khi chưa có bằng chứng Practice.
5. Đổi completion service và Module 3 handoff sang năm tài liệu; task triển khai
   đầu tiên chỉ được đề xuất trong Module 3 và phải chờ người học duyệt.
6. Chạy rehearsal bằng workspace dùng một lần, kiểm tra desktop và `390 × 844`,
   rồi chạy toàn bộ suite được liệt kê ở I6.

### 0.3 Vấn đề UX đã biết

Sau khi nộp nhóm Mastery, câu tự luận phải được người học tự đối chiếu trước khi
nút **Xem kết quả 5 câu** được mở. Hiện nút bị khoá nhưng lý do chưa đủ rõ; một
người dùng đã tưởng mình hoàn thành 4/5 câu mà không có đường đi tiếp. Khi nối
Practice thật, cần làm cho bước xác nhận này rõ ràng hơn hoặc đưa hành động xác
nhận vào cùng luồng tiếp tục, nhưng vẫn phải giữ bằng chứng người học đã tự đối
chiếu câu trả lời.

### 0.4 Ranh giới merge

Nội dung, tài sản, contract hiển thị, test nội dung và tài liệu bàn giao đã duyệt
được đưa sang `Triet-V2-planning`. Cơ chế content-review tạm thời, Practice
bypass, route bỏ qua, thông báo “review only” và test dành riêng cho bypass đã
được loại khỏi branch tích hợp.

## 1. Kết quả cần đạt

Sau bốn mục giải thích và trang chuyển tiếp, người học mở một Practice và làm
việc trong **một task Codex duy nhất** qua năm giai đoạn. Người học chỉ trả lời
từng câu hỏi bằng ngôn ngữ bình thường. Executor tạo hoặc sửa tài liệu. Course
Companion đọc tệp thật, hiện bản tóm tắt và chỉ ghi nhận giai đoạn khi người học
chọn **Chấp nhận**.

Module 2 chỉ hoàn thành khi năm tài liệu hiện tại, năm lần duyệt và mastery gate
đều hợp lệ. Module 2 dừng ở `planning/implementation-plan.md`; Module 3 mới đề
xuất task triển khai đầu tiên và chờ người học duyệt.

## 2. Những gì không được triển khai trong Module 2

- Không tạo ứng dụng, source code hoặc scaffold.
- Không chạy lệnh cài đặt hay chọn dependency.
- Không chốt framework, thư viện, cấu trúc tệp hoặc cách triển khai kỹ thuật.
- Không tạo task đầu tiên của Module 3.
- Không dùng lịch sử chat cũ như một đầu vào ẩn thay cho năm tài liệu đã duyệt.
- Không coi lời Executor báo trong chat là bằng chứng thay cho tệp hiện tại.
- Không dùng cơ chế content-review tạm thời để tạo receipt, mở khóa Module 3
  hoặc mô phỏng Practice đã hoàn thành.

## 3. Hợp đồng năm giai đoạn và năm tài liệu

| Giai đoạn | Tên hiển thị | Tệp chính | Điều kiện tối thiểu trước khi duyệt |
| --- | --- | --- | --- |
| 1 | Mục đích của portfolio này là gì? | `planning/portfolio-brief.md` | Mục tiêu, một người xem chính, điều họ cần hiểu/làm được, phạm vi, giả định, quyền riêng tư và xác nhận |
| 2 | Hiện tại bạn đang có những gì? | `planning/content-evidence-inventory.md` | Nội dung, vai trò thật, trạng thái bằng chứng, quyền công khai/sử dụng, khoảng trống, ưu tiên và xác nhận |
| 3 | Bạn muốn portfolio của mình trông như thế nào? | `planning/reference/reference.md` | Nguồn, điều thích/không phù hợp/chưa chắc, quyền sử dụng, ranh giới không sao chép và xác nhận |
| 4 | Hoàn thành PRD | `planning/PRD.md` | Tổng hợp ba tài liệu đã duyệt, yêu cầu, phạm vi, khả năng tiếp cận, tiêu chí chấp nhận và câu hỏi còn mở |
| 5 | Tạo kế hoạch triển khai | `planning/implementation-plan.md` | Phủ yêu cầu–tiêu chí–kiểm tra–bằng chứng, các phase, phụ thuộc, non-goals và điểm dừng trước implementation |

Ảnh chụp tham chiếu, khi thật sự cần, chỉ là bằng chứng hỗ trợ trong
`planning/reference/screenshots/`; chúng không phải tài liệu thứ sáu.

Hai hợp đồng cũ phải được loại khỏi luồng mới:

- `planning/requirement-validation-map.md`;
- `planning/first-bounded-task.md`.

## 4. Vòng đời một task Codex duy nhất

### 4.1 Tạo và gắn task

1. Course Companion tạo một Practice attempt mới sau khi người học chọn workspace.
2. Coordinator tạo đúng một Executor task và lưu `executorThreadId` cùng
   `practiceId`, `practiceVersion`, `courseRunId` và workspace canonical path.
3. Mọi giai đoạn, lần sửa và lần resume đều gửi tiếp vào task đã gắn.
4. Không được tự tạo task mới khi tệp thiếu, câu trả lời chưa đủ, người học chọn
   **Yêu cầu sửa**, app relaunch hoặc digest trở nên stale.
5. Chỉ tạo task khác sau một reset Practice rõ ràng; attempt cũ phải bị đóng và
   không còn khả năng cung cấp receipt hợp lệ.

### 4.2 Resume và mất liên kết

- Khi relaunch, Course Companion tải attempt, kiểm tra workspace và thử nối lại
  đúng `executorThreadId`.
- Nếu task còn truy cập được, tiếp tục đúng giai đoạn đang mở và gửi một tóm tắt
  trạng thái có nguồn từ tệp hiện tại; không tái phỏng vấn.
- Nếu task không còn truy cập được, dừng an toàn và giải thích rằng người học
  cần khôi phục hoặc reset Practice. Không âm thầm tạo task thay thế.
- Trạng thái “task không truy cập được” không được xóa tài liệu hay receipt cũ.

## 5. Giao thức Teacher và Executor

### 5.1 Phân vai

**Teacher** chịu trách nhiệm:

- giới thiệu mục tiêu hiện tại bằng ngôn ngữ dành cho người mới;
- giải thích vì sao câu hỏi quan trọng khi người học cần trợ giúp;
- giữ mỗi lượt chỉ có một câu hỏi;
- không tự ghi nhận hoàn thành dựa trên cuộc trò chuyện.

**Executor** chịu trách nhiệm:

- đọc các đầu vào đã duyệt và trạng thái tệp hiện tại;
- hỏi đúng một câu cần thiết mỗi lượt;
- tự tạo hoặc cập nhật tài liệu từ câu trả lời;
- không yêu cầu người học mở template hoặc điền metadata;
- trả về kết quả có cấu trúc cho Coordinator, nhưng không tự phát receipt.

**Course Companion/Coordinator** chịu trách nhiệm:

- giữ state machine, task binding và write boundary;
- yêu cầu evidence adapter đọc tệp thật;
- tạo digest và bản tóm tắt dành cho người học;
- ghi nhận **Chấp nhận** hoặc giữ giai đoạn mở khi **Yêu cầu sửa**;
- vô hiệu hóa receipt stale và thực hiện gate nguyên tử.

### 5.2 Dữ liệu tối thiểu gửi vào mỗi lượt Executor

- ID và tên giai đoạn hiện tại;
- workspace canonical path;
- đường dẫn tệp được phép sửa ở giai đoạn đó;
- digest và nội dung cần thiết của các tài liệu đầu vào đã duyệt;
- bản tóm tắt các quyết định đã xác nhận trong task;
- câu trả lời mới nhất của người học, nếu có;
- ranh giới Module 2 và các quy tắc quyền riêng tư/quyền sử dụng;
- lý do revision nếu người học vừa chọn **Yêu cầu sửa**.

Không gửi một transcript dài không giới hạn. Task history giúp duy trì hội thoại,
nhưng quyết định chính thức phải truy ngược được về tài liệu hiện tại và receipt.

### 5.3 Kết quả tối thiểu từ Executor

- `stageId`;
- trạng thái `needs-answer`, `artifact-updated`, `blocked` hoặc `failed`;
- đúng một câu hỏi dành cho người học khi `needs-answer`;
- đường dẫn tệp đã sửa khi `artifact-updated`;
- danh sách ngắn điều đã thay đổi và điều còn chưa chắc;
- không chứa tuyên bố “đã duyệt” hoặc “đã hoàn thành Module 2”.

Coordinator phải từ chối kết quả sai giai đoạn, sai task, sai workspace hoặc yêu
cầu sửa ngoài write scope.

## 6. Hành vi chi tiết theo giai đoạn

### Giai đoạn 1 — Mục đích của portfolio này là gì?

Executor hỏi lần lượt để xác định mục tiêu, một người xem chính, điều họ cần
hiểu hoặc làm được, phạm vi phiên bản đầu, điều chưa chắc và giả định. Câu hỏi
về kết quả truyền đạt phải dùng nguyên văn:

> Sau khi xem portfolio, người xem cần hiểu hoặc làm được điều gì để bạn biết
> trang đã truyền đạt đúng thông điệp?

Không dùng cụm “dấu hiệu thành công có thể quan sát”. Executor tạo
`planning/portfolio-brief.md`, tự kiểm tra sự trung thực, quyền riêng tư và
những giả định đang được sử dụng.

### Giai đoạn 2 — Hiện tại bạn đang có những gì?

Executor hỏi về dự án/kinh nghiệm, vai trò thật, bằng chứng, khoảng trống, quyền
công khai, quyền dùng hình ảnh/tài liệu và việc tiếp theo. Giao diện và tài liệu
dùng đúng bốn nhãn:

- **Có bằng chứng**;
- **Do bạn xác nhận**;
- **Đang giả định**;
- **Còn thiếu**.

Trạng thái bằng chứng và quyền công bố là hai trường độc lập. Một nội dung có
bằng chứng vẫn có thể bị chặn khỏi portfolio công khai.

### Giai đoạn 3 — Bạn muốn portfolio của mình trông như thế nào?

Một tham chiếu chính là đủ. Course Companion hoặc Teacher có thể gợi ý
[Pafolios](https://pafolios.com/) trước; [Awwwards](https://www.awwwards.com/)
là nguồn mở rộng và phải đi cùng cảnh báo rằng người học không cần bắt chước
hiệu ứng phức tạp.

Executor hỏi điều người học thích, lý do, điều không phù hợp và điều muốn để
Module 3 đề xuất. Executor lưu nguồn và chỉ lưu ảnh chụp cần thiết. Quyền chưa
rõ phải được ghi là chưa rõ; ảnh phân tích nội bộ không mặc nhiên trở thành tài
sản được phép công khai. Tài liệu phải cấm sao chép chữ, hình ảnh, tài liệu,
thương hiệu, mã nguồn và toàn bộ cách thể hiện đặc trưng.

### Giai đoạn 4 — Hoàn thành PRD

Executor đọc ba tài liệu đã duyệt rồi **soạn trước, hỏi sau**. Chỉ hỏi khi có
một khoảng trống hoặc mâu thuẫn ảnh hưởng lớn tới mục tiêu, phạm vi, quyền riêng
tư, quyền sử dụng hoặc hành động chính của người xem. Không hỏi lại dữ kiện đã
được xác nhận. Nếu đầu vào đủ rõ, giai đoạn này không cần câu hỏi mới.

PRD tự bao gồm các yêu cầu nền tảng về màn hình hẹp, bàn phím, focus, văn bản
thay thế và không công khai nội dung chưa rõ quyền. PRD không chọn công nghệ.

### Giai đoạn 5 — Tạo kế hoạch triển khai

Executor đọc PRD và bốn tài liệu đã duyệt rồi **soạn trước, hỏi sau**. Mỗi yêu
cầu phải nối tới tiêu chí chấp nhận, cách kiểm tra và bằng chứng dự kiến ngay
trong `planning/implementation-plan.md`. Plan tổ chức các phase theo phụ thuộc,
ghi non-goals và câu hỏi kỹ thuật còn mở.

Plan không chứa task triển khai đầu tiên, lệnh, dependency, framework, tên tệp
source hoặc hành động tạo app. Sau khi tài liệu được chấp nhận, Practice chuyển
tới mastery; không mở thẳng Module 3.

## 7. Chu trình kiểm tra, digest và Chấp nhận/Yêu cầu sửa

Sau mỗi lần Executor báo đã cập nhật tài liệu:

1. Coordinator đóng băng stage transition và gọi evidence adapter.
2. Adapter đọc tệp từ canonical workspace, kiểm tra đường dẫn, cấu trúc, nội
   dung cấm, đầu vào phụ thuộc và write scope.
3. Adapter tính digest từ bytes hiện tại; không nhận digest do Executor cung cấp.
4. Course Companion hiển thị bản tóm tắt ngắn gồm:
   - điều người học đã quyết định;
   - điều còn thiếu, đang giả định hoặc chưa rõ quyền;
   - ranh giới quan trọng;
   - lỗi phải sửa trước khi có thể duyệt.
5. Nếu evidence chưa hợp lệ, chỉ hiện hành động quay lại cùng task để sửa.
6. Nếu evidence hợp lệ, hiện **Chấp nhận** và **Yêu cầu sửa**.
7. **Yêu cầu sửa** lưu lý do, giữ nguyên task/stage và không tạo receipt.
8. **Chấp nhận** đọc lại tệp, tính lại digest, ghi stage receipt rồi mới mở giai
   đoạn kế tiếp. Nếu bytes đã đổi, từ chối và yêu cầu làm mới bản tóm tắt.

Receipt tối thiểu phải gắn với `courseRunId`, Practice ID/version, workspace,
Executor task ID, stage ID, artifact digest, digest các đầu vào phụ thuộc và thời
điểm người học chấp nhận. Thời điểm và digest là dữ liệu hệ thống; người học
không điền chúng.

## 8. Freshness và invalidation

- Sửa tài liệu của Giai đoạn 1 làm stale receipts 1–5.
- Sửa Giai đoạn 2 làm stale receipts 2–5.
- Sửa Giai đoạn 3 làm stale receipts 3–5.
- Sửa Giai đoạn 4 làm stale receipts 4–5.
- Sửa Giai đoạn 5 chỉ làm stale receipt 5.
- Xóa, đổi tên hoặc thay workspace làm gate thất bại.
- Ảnh chụp được liệt kê trong reference record phải tham gia digest của Giai
  đoạn 3; ảnh không được tham chiếu không được tự động mở rộng write scope.
- Một receipt của Practice version bảy-tệp cũ không được migrate thành receipt
  năm-tệp mới.

## 9. Completion gate và bàn giao sang Module 3

Completion service chỉ ghi receipt Module 2 sau khi xác nhận đồng thời:

- đúng Practice version mới và đúng task binding;
- đủ năm tài liệu, năm stage receipts hiện tại và mastery evidence;
- mọi digest vẫn fresh;
- không có hai tệp cũ trong artifact contract;
- không có app/source/dependency/task triển khai được tạo trong Module 2;
- completion receipt được lưu nguyên tử trước khi Module 3 được mở.

Handoff sang Module 3 chỉ gồm workspace, năm artifact references, digest hiện
tại và một tóm tắt ngắn về mục tiêu, khoảng trống/ràng buộc, thứ tự triển khai
và non-goals. Không bàn giao transcript như nguồn quyết định chính thức.

Hành động đầu tiên của Module 3:

1. đọc năm tài liệu hiện tại;
2. đề xuất một task triển khai có phạm vi nhỏ;
3. giải thích lựa chọn công nghệ, dependency, lệnh, tệp và cách kiểm tra;
4. chờ người học duyệt;
5. chỉ sau đó mới được tạo hoặc sửa application code.

## 10. Bản đồ tệp người triển khai cần sở hữu

| Nhóm | Tệp/surface chính | Thay đổi bắt buộc |
| --- | --- | --- |
| Course authority | `pilot-workspace/course/course-structure.json` | Năm stage, năm tài liệu, Practice version mới, boundary Module 2/3 |
| Teacher | `pilot-workspace/course/lessons/module-2.vi.md`, `lesson-scripts/module-2.script.vi.md`, `prompts/start-module-2.vi.md` | Thay route dạy milestone cũ bằng giao thức một task/năm lần duyệt |
| Practice contract | `pilot-workspace/course/practices/m2-portfolio-planning.json`, rubric liên quan | State machine năm stage, write scope, output và approval contract |
| Templates | `pilot-workspace/course/templates/portfolio-planning/` | Chỉ năm tài liệu, không chứa đáp án hoặc task triển khai |
| Shared types | `course-companion/shared/contracts.ts` | Types cho task binding, five-stage receipt, digest dependencies và handoff mới |
| Shared registry | `course-companion/shared/course/modules/module-2.ts` | Artifact paths, Practice version, scene/progress redirects; giữ ba trang đã duyệt |
| Coordinator/UI | `course-companion/src/renderer/src/surfaces/LearningWindow.tsx` và Practice coordinator | Launch/resume/revise/accept, summaries, stale state, mastery transition |
| Evidence | `course-companion/electron/main/portfolio-planning-evidence-adapter.ts` | Semantic checks cho năm tài liệu và bounded screenshots |
| Completion | `course-companion/electron/main/portfolio-module-completion-service.ts` | Atomic five-document gate và Module 3 handoff không có `firstBuild` cũ |
| Progress | Practice/progress repositories và migration helpers | Version invalidation, exact resume, reset và stale cascade |
| Module 3 boundary | Module 3 readiness/coordinator | Đọc năm tài liệu và đề xuất task đầu tiên tại Module 3 |
| Tests | Unit, contract, coordinator, progress, Electron smoke và fixtures | Thay mọi giả định bảy tệp; chứng minh một task và năm lần duyệt |

Không cherry-pick toàn bộ `LearningWindow.tsx` từ branch content review nếu việc
đó mang theo bypass tạm thời. Chỉ lấy nội dung đã duyệt và nối lại với Practice
thật.

## 11. Thứ tự checkpoint đề xuất

### I1 — Khóa hợp đồng năm tài liệu

Đổi manifest, types, templates, Practice version và fixtures. Thêm migration
không cho receipt cũ mở gate mới. Chưa nối UI.

**Kiểm tra:** parser, unique path, template audit, old-receipt rejection,
`git diff --check`.

### I2 — Triển khai state machine và task binding

Tạo attempt/task một lần, resume đúng task, giữ stage khi revise và chặn write
ngoài scope.

**Kiểm tra:** coordinator unit tests cho create/resume/revise/reset, task-ID
stability và failure recovery.

### I3 — Triển khai evidence adapter năm giai đoạn

Thêm semantic validation, digest dependencies, screenshot boundaries và stale
cascade. Giai đoạn 4–5 phải chứng minh synthesize-first.

**Kiểm tra:** fixtures hợp lệ/thiếu/malformed/stale, quyền chưa rõ, sửa upstream,
unexpected app file và no-first-task assertions.

### I4 — Nối Course Companion review loop

Nối ba trang tới workspace selection và Practice thật; hiển thị digest summary,
Chấp nhận/Yêu cầu sửa, lỗi và resume. Loại route milestone cũ khỏi tiến trình mới.

**Kiểm tra:** desktop, `390 × 844`, keyboard/focus, exact resume ở cả năm stage,
không yêu cầu người học mở template.

### I5 — Nối mastery, completion và Module 3 handoff

Đổi completion service sang năm tài liệu, giữ mastery độc lập, lưu receipt nguyên
tử và chuyển task đầu tiên sang Module 3.

**Kiểm tra:** gate matrix, relaunch, reset, stale-before-complete, exactly-five
handoff và Module 3 wait-for-approval.

### I6 — Rehearsal và cleanup

Xóa/redirect identity cũ, loại mọi review bypass khỏi nhánh tích hợp, chạy toàn
bộ suite và rehearsal bằng workspace dùng một lần.

**Kiểm tra đầy đủ:** `npm test`, `npm run typecheck`, `npm run lint`,
`npm run build`, `npm run test:electron`, `git diff --check`, cùng kiểm tra trực
quan desktop và màn hình `390 × 844`.

Sau mỗi checkpoint được chủ sở hữu chấp nhận, triển khai phải tuân thủ quy tắc
automatic major-decision commits trong `AGENTS.md`: chỉ stage đúng tệp liên
quan, commit local sau focused verification, không push.

## 12. Ma trận tình huống bắt buộc

| Tình huống | Kết quả mong đợi |
| --- | --- |
| Lần đầu mở Practice | Chọn workspace, tạo một attempt và một Executor task |
| Trả lời chưa đủ | Executor hỏi đúng một câu tiếp theo trong cùng task |
| Executor sửa đúng tệp | Adapter đọc lại tệp và tạo summary mới |
| Người học chọn Yêu cầu sửa | Không receipt; cùng task, cùng stage |
| Người học chọn Chấp nhận | Re-read + digest match rồi mới tạo receipt |
| Relaunch giữa stage | Trở lại đúng stage và đúng task |
| Sửa tệp upstream | Downstream receipts stale theo dependency chain |
| Thêm source/app file | Scope violation; không thể duyệt |
| Reference có quyền chưa rõ | Được ghi nhận có ranh giới, không cấp quyền công khai |
| Stage 4 đầu vào đủ | Executor soạn PRD mà không hỏi lại |
| Stage 5 hoàn tất | Đi tới mastery, không tạo task triển khai |
| Receipt bảy-tệp cũ | Không mở gate năm-tệp mới |
| Mastery đạt nhưng artifact stale | Module 3 vẫn khóa |
| Năm stage hợp lệ nhưng mastery thiếu | Module 3 vẫn khóa |
| Completion hợp lệ | Lưu nguyên tử rồi bàn giao đúng năm references |
| Module 3 bắt đầu | Đề xuất task đầu tiên và chờ duyệt trước khi viết code |

## 13. Definition of done cho phần bàn giao

Phần Teacher/Executor chỉ được coi là hoàn tất khi:

- mọi mục I1–I6 đã triển khai và có verification tương ứng;
- full suite và disposable-workspace rehearsal đều pass;
- lịch sử cho thấy cùng một Executor task qua năm stage và các vòng sửa;
- không có cơ chế review-only nào tạo tiến độ chính thức;
- owner review riêng phần implementation đã được ghi nhận;
- pilot acceptance vẫn để `pending` cho tới khi có bằng chứng từ người học theo
  acceptance gate của kế hoạch tổng.
