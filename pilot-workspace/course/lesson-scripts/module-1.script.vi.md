# Kịch bản — Module 1: Thiết lập môi trường làm việc với Codex

## Bước 1 — Nhận biết Codex và workspace (`m1-codex-orientation`)

Teacher nói: "Module 1 giúp bạn thiết lập môi trường làm việc trước khi giao
việc xây sản phẩm. Trước tiên, bạn sẽ xem một phần minh họa khoảng 5 phút. Phần
này giải thích Codex, workspace, model, quyền truy cập, `AGENTS.md` và Skill
bằng hình ảnh."

[Dùng `WORKSPACE_ROOT` để tạo link Markdown cục bộ tuyệt đối tới
`course/codex-setup/index.html` với nhãn **Mở hướng dẫn thiết lập Codex**. Không
chạy server và không yêu cầu cài dependency.]

Teacher nói: "Trang minh họa không thay đổi workspace. Hãy xem đến bước cuối,
rồi quay lại task này và gửi câu xác nhận mà trang đã chuẩn bị."

[Dừng chờ Learner. Chỉ đạt khi Learner xác nhận đã xem xong. Sau đó hỏi một
câu: "Workspace của khóa học là thư mục nào, và bạn nhận ra nó nhờ tệp hoặc thư
mục nào?" Cần ít nhất một dấu hiệu đúng như `START_HERE.md`, `AGENTS.md`,
`course/` hoặc `contentpilot/`. Khi đạt, checkpoint `m1-codex-orientation`.]

## Bước 2 — Chọn model làm điểm bắt đầu (`m1-model-choice`)

Teacher nói: "Model là hệ thống AI xử lý yêu cầu. Sol phù hợp với công việc
phức tạp, Terra phù hợp với công việc hằng ngày, còn Luna phù hợp với việc cụ
thể và lặp lại. OpenAI khuyên bắt đầu với thiết lập mặc định nếu bạn chưa chắc.
Mức suy luận cao hơn có thể giúp việc khó, nhưng thường mất thêm thời gian."

Teacher nói: "Bạn muốn giữ thiết lập mặc định hay chọn một model và mức suy
luận khác cho khóa học hôm nay? Mình khuyến nghị giữ mặc định trong lần thử
MVP này."

[Dừng chờ Learner. Chấp nhận giữ mặc định hoặc một lựa chọn có lý do. Không
yêu cầu model không xuất hiện trong giao diện của Learner. Ghi lựa chọn để dùng
trong checklist. Khi đạt, checkpoint `m1-model-choice`.]

## Bước 3 — Hiểu quyền truy cập (`m1-permissions`)

Teacher nói: "Sandbox là ranh giới kỹ thuật giới hạn nơi Codex có thể thao tác.
Phê duyệt là lúc Codex dừng lại để bạn quyết định có cho phép hành động hay
không. Với người mới, chế độ Ask for approval — nghĩa là hỏi trước khi hành
động — là điểm bắt đầu phù hợp."

Teacher nói: "Nếu Codex xin truy cập Internet để tải một gói mới, bạn cần kiểm
tra điều gì trước khi đồng ý? Hãy nêu một điều cụ thể."

[Mở Assessment State dạng practice. Dừng chờ Learner. Đạt khi Learner nêu được
ít nhất một yếu tố: lý do cần mạng, gói hoặc nguồn sẽ tải, phạm vi thay đổi, chi
phí, dữ liệu gửi đi hoặc phương án không cần mạng. Không buộc Learner thay đổi
chế độ quyền truy cập. Khi đạt, checkpoint `m1-permissions`.]

## Bước 4 — Cá nhân hóa phần được phép sửa trong `AGENTS.md` (`m1-agents-guidance`)

Teacher nói: "Prompt cho biết task hiện tại cần làm gì. `AGENTS.md` giữ cách
dự án luôn muốn Codex làm việc. Workspace đã có một khối mang tên
`Learner-editable preferences`; chỉ khối đó được phép sửa trong bước này."

[Đọc riêng khối `## Learner-editable preferences` trong `AGENTS.md` và báo nội
dung hiện tại. Không sửa tệp.]

Teacher nói: "Bạn muốn giữ hay thay đổi ngôn ngữ giải thích, mức chi tiết hoặc
cách Codex giải thích thuật ngữ? Hãy chọn một thay đổi hữu ích nhất. Mình
khuyến nghị giữ tiếng Việt và yêu cầu giải thích thuật ngữ trước khi dùng."

[Dừng chờ Learner. Nếu Learner muốn thay đổi, làm rõ đúng một lựa chọn mỗi lượt.
Sau khi đủ thông tin, đưa bản xem trước chỉ cho khối Learner-editable. Nêu rõ
file được phép sửa là `AGENTS.md`, không thay đổi phần khác và sẽ kiểm tra diff.
Xin phê duyệt trước khi viết.]

[Sau phê duyệt, chỉ sửa khối Learner-editable. Đọc `git diff -- AGENTS.md` và
báo bằng chứng rằng không có phần khác thay đổi. Nếu Learner chọn giữ nguyên,
ghi lại lựa chọn đó mà không tạo thay đổi giả. Sau đó checkpoint
`m1-agents-guidance`.]

Teacher nói: "Codex nạp `AGENTS.md` khi bắt đầu task. Để kiểm tra khả năng tiếp
tục, hãy mở một task Codex mới trong cùng workspace và nhập
`$start-course-lesson resume`. Task là một cuộc làm việc riêng trong Codex;
workspace vẫn là thư mục khóa học này."

[Dừng. Learner có thể tiếp tục ngay trong task hiện tại nếu không muốn đổi task
trong lần thử MVP. Khi resume, bắt đầu ở Bước 5 và không hỏi lại các lựa chọn đã
lưu trong state.]

## Bước 5 — Nhận biết và gọi Skill (`m1-skills`)

Teacher nói: "Skill là hướng dẫn cho một quy trình có thể dùng lại. Bạn vừa gọi
`start-course-lesson` bằng cách gõ tên Skill sau dấu `$`. Workspace còn có
`course-teacher`, là Skill giữ nhịp dạy và đánh giá của khóa học."

Teacher nói: "Hãy giải thích bằng lời của bạn: một quy tắc lâu dài nên nằm
trong `AGENTS.md`, còn loại công việc nào phù hợp để đóng gói thành Skill?"

[Mở Assessment State dạng short answer. Dừng chờ Learner. Đạt khi phân biệt
được quy tắc dự án với quy trình lặp lại. Cho hint nếu Learner chỉ nhắc lại định
nghĩa. Không yêu cầu cài thêm Skill. Khi đạt, checkpoint `m1-skills`.]

## Bước 6 — Tạo checklist thiết lập (`m1-setup-checklist`)

Teacher nói: "Bây giờ mình sẽ tổng hợp bằng chứng thiết lập vào một checklist.
Checklist ghi workspace, cách bạn đang dùng Codex, lựa chọn model, quyền truy
cập, chỉ dẫn Learner và hai Skill đã xác nhận. Đây là bằng chứng để bạn xem
lại, không phải một chứng nhận tự động."

[Đọc `artifacts/codex-setup-checklist.template.md`. Dùng thông tin Learner đã
cung cấp để soạn bản xem trước trong cuộc trò chuyện. Không tự suy đoán cách
dùng Codex, model hoặc chế độ quyền chưa được Learner xác nhận.]

[Dừng chờ Learner duyệt. Sau phê duyệt, tạo
`artifacts/codex-setup-checklist.md`, đọc lại tệp và checkpoint
`m1-setup-checklist`. Artifact gate phải thành công.]

## Bước 7 — Kiểm tra cuối module (`m1-mastery`)

Teacher nói: "Thiết lập đã có bằng chứng. Tiếp theo là 5 câu kiểm tra ngắn về
Codex, model, quyền truy cập, `AGENTS.md` và Skill. Mình sẽ hỏi từng câu một.
Bạn cần đạt ít nhất 4/5 câu."

[Dùng `course/quizzes/module-1.quiz.json`. Mở Assessment State cho từng câu.
Không hiện đáp án hoặc căn cứ trước khi Learner trả lời. Nếu Learner đạt 4/5,
checkpoint `m1-mastery`. Nếu chưa đạt, chỉ dạy lại phần còn thiếu rồi dùng câu
sửa chữa tương đương; không lặp nguyên đáp án.]

## Bước 8 — Hoàn thành và chuyển sang Module 2 (`m1-complete`)

Teacher nói: "Bạn đã thiết lập xong môi trường làm việc: đúng workspace, có
giới hạn hành động, có chỉ dẫn lâu dài và biết cách gọi Skill. Module 2 sẽ dùng
nền tảng này để biến ý tưởng ContentPilot thành PRD và implementation plan."

Teacher nói: "Khi sẵn sàng, dùng `$start-course-lesson module-2`."

[Chạy lệnh complete cho `module-1`. Chỉ báo hoàn thành khi lệnh thành công và
state chuyển sang `module-2`.]
