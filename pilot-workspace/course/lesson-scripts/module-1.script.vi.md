# Kịch bản — Đọc dự án, giao việc và kiểm chứng thay đổi

## Bước 1 — Hiểu mục tiêu Module 1 (`m1-orient`)

Teacher nói: "Module này dạy một vòng agentic coding có thể dùng cho nhiều dự
án: đọc codebase, giao một việc có phạm vi, duyệt kế hoạch và kiểm chứng thay
đổi. ContentPilot là nơi chúng ta thực hành vòng đó bằng một thay đổi thật."

Teacher nói: "Trong ứng dụng này, `app/page.tsx` thường chứa nội dung màn hình
và `app/globals.css` thường chứa cách trình bày. Đây chỉ là định hướng ban đầu;
Codex vẫn phải đọc file để xác nhận. Bạn dự đoán file nào sẽ ảnh hưởng trực
tiếp hơn đến chiều rộng của nút trên màn hình hẹp?"

[Dừng chờ Learner. Đây là dự đoán; không chấm đúng sai. Sau câu trả lời,
checkpoint `m1-orient`.]

## Bước 2 — Kiểm tra trạng thái ban đầu (`m1-baseline`)

Teacher nói: "Bây giờ Codex sẽ chỉ đọc `contentpilot/README.md` và
`contentpilot/package.json` để tìm đúng lệnh cài đặt, chạy ứng dụng và kiểm tra.
Trạng thái trước khi sửa được gọi là baseline. Chúng ta cần baseline để biết lỗi
nào đã có sẵn và lỗi nào xuất hiện sau thay đổi."

[Executor inspect read-only. Báo lệnh và yêu cầu Learner xác nhận trước khi cài
dependency vì install có network và thay đổi `node_modules`. Nếu dependency đã
có, không cài lại.]

Teacher nói: "Codex sẽ kiểm tra hai bằng chứng: ứng dụng có khởi động được không
và `npm run check` có đạt không. Trước khi chạy, bạn dự đoán kết quả sẽ đạt hay
báo lỗi? Đây chỉ là dự đoán, không chấm đúng sai."

[Dừng chờ Learner. Sau đó chạy lệnh đã ghi trong repo. Khi baseline pass,
checkpoint `m1-baseline`. Nếu fail, chẩn đoán và sửa baseline trước build lab.]

## Bước 3 — Đọc và kiểm tra cấu trúc dự án (`m1-inspect`)

Teacher nói: "Bước này là chỉ đọc. Yêu cầu gửi cho Codex cần có bốn phần: mục
tiêu, file hoặc thư mục được đọc, điều không được làm và bằng chứng cần trả về.
Hãy viết yêu cầu bằng lời của bạn để Codex kiểm tra điểm vào của ứng dụng, CSS,
hướng dẫn dự án và những chức năng ContentPilot chưa có."

[Dừng chờ Learner. Dùng hint ladder; không đưa prompt hoàn chỉnh trước khi
Learner thử. Khi đạt, Executor chạy prompt nguyên văn trong cùng thread hoặc
sub-agent nếu Learner yêu cầu. Review báo cáo, rồi checkpoint `m1-inspect`.]

## Bước 4 — Chọn hướng dẫn dùng lâu dài (`m1-guidance`)

Teacher nói: "Phiếu định hướng có những thông tin Codex nên nhớ trong nhiều
công việc, chẳng hạn đối tượng, nền tảng, ngôn ngữ, giới hạn và cách kiểm tra.
Các ý này có thể kết hợp. Bạn muốn lưu những ý nào vào `AGENTS.md` để không phải
nhắc lại mỗi lần? Mình khuyến nghị lưu đối tượng, nền tảng chính và nguyên tắc
kiểm chứng; mục tiêu của một thay đổi riêng nên để trong bản mô tả công việc."

[Dừng chờ Learner. Cần audience/platform hoặc ngôn ngữ, boundaries và
verification. Sau đó đề xuất một patch nhỏ vào `contentpilot/AGENTS.md`, chờ
approval rồi mới edit. Checkpoint `m1-guidance`.]

## Bước 5 — Viết bản mô tả công việc (`m1-brief`)

Teacher nói: "Bản mô tả công việc giúp Codex biết chính xác được làm gì và khi
nào được xem là xong. Bài thực hành này chỉ được sửa `app/page.tsx` và
`app/globals.css`. Hãy viết bằng lời của bạn năm phần: mục tiêu, phạm vi, ràng
buộc, điều không làm và dấu hiệu hoàn thành có thể quan sát."

[Dừng chờ Learner. Brief phải giữ route `/setup`, mobile action full-width với
tap target ít nhất 54px và mũi tên ở mép phải, desktop giữ content-width, không
overflow, không sửa file khác. Không đưa nguyên brief hoàn chỉnh trước khi
Learner thử. Khi đạt, checkpoint `m1-brief`.]

## Bước 6 — Xem và duyệt kế hoạch (`m1-plan-approval`)

Teacher nói: "Codex sẽ đề xuất kế hoạch trước khi sửa. Khi đọc kế hoạch, hãy
kiểm tra bốn phần: file nào sẽ đổi, thay đổi gì, rủi ro nào có thể xảy ra và kết
quả sẽ được kiểm chứng ra sao. Sau khi xem, bạn chỉ cần nói rõ: duyệt, yêu cầu
điều chỉnh hoặc từ chối."

[Executor inspect hai file và đề xuất plan, chưa edit. Dừng chờ Learner quyết
định. Chỉ khi approved mới checkpoint `m1-plan-approval`.]

## Bước 7 — Thực hiện thay đổi (`m1-build`)

[Executor thực hiện đúng brief đã duyệt. Không mở rộng scope. Sau edit, báo file
đã đổi nhưng chưa tuyên bố hoàn thành.]

Teacher nói: "Thay đổi đã được thực hiện trong phạm vi đã duyệt. Trước khi xem
kết quả kiểm tra, bạn dự đoán rủi ro nào cần chú ý nhất: kiểm tra code báo lỗi,
giao diện máy tính bị ảnh hưởng, màn hình hẹp bị tràn ngang hay đường dẫn nút bị
sai? Đây là dự đoán để chọn nơi kiểm tra trước, không phải câu hỏi đúng sai."

[Dừng chờ Learner. Sau đó chạy `npm run check` và kiểm tra UI desktop/mobile.
Checkpoint `m1-build` khi evidence đã có.]

## Bước 8 — Kiểm tra bằng chứng và quyết định (`m1-review`)

Teacher nói: "Hãy kiểm tra ba lớp bằng chứng: phần so sánh thay đổi có đúng phạm
vi không, kiểm tra tự động có đạt không và giao diện trên máy tính lẫn màn hình
hẹp có đúng yêu cầu không. Sau đó, hãy chọn chấp nhận hoặc yêu cầu sửa và nêu
một lý do."

Teacher nói: "Bằng chứng nào trong ba lớp trên khiến bạn tin kết quả này, và
bằng chứng nào còn thiếu nếu bạn chưa muốn chấp nhận?"

[Dừng chờ Learner. Ghi evidence vào `artifacts/module-1-evidence.md` sau khi
Learner cho phép. Khi quyết định có bằng chứng, checkpoint `m1-review`.]

## Bước 9 — Kiểm tra cuối Module 1 (`m1-mastery`)

Teacher nói: "Phần kiểm tra cuối giúp bạn áp dụng quy trình vừa học vào tình
huống khác. Có năm câu ngắn về đọc dự án, phê duyệt rủi ro, tiêu chí hoàn thành,
kiểm tra giao diện và hướng dẫn dùng lâu dài. Mình sẽ hỏi từng câu một."

[Dùng `course/quizzes/module-1.quiz.json`. Khi pass, checkpoint `m1-mastery`.]

## Bước 10 — Hoàn thành Module 1 (`m1-complete`)

Teacher nói: "Bạn đã hoàn thành vòng agentic coding đầu tiên. Nút mobile chỉ là
bài thực hành; kỹ năng bạn vừa học là đọc dự án, mô tả công việc, duyệt kế
hoạch, giới hạn thực thi, kiểm chứng và tự quyết định chấp nhận. Hãy nêu một
thay đổi nhỏ trong dự án khác mà bạn có thể áp dụng cùng quy trình."

[Dừng chờ Learner nêu một tình huống chuyển giao và ít nhất một bằng chứng cần
kiểm tra. Sau đó đánh dấu Module 1 complete và checkpoint `m1-complete`. Không
hứa Module 2 đã có trong workspace này.]
