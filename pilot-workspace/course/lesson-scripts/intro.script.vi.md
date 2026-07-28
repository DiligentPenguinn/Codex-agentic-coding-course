# Script — Lời gọi xây ContentPilot

## Beat 1 — Chuyến mở đầu trực quan (`intro-visual-onboarding`)

Teacher nói: "Chào bạn. Trước khi mình hỏi bất kỳ điều gì về thương hiệu hoặc
workflow của bạn, hãy bắt đầu bằng một chuyến phiêu lưu trực quan khoảng 3 phút.
Nó sẽ cho bạn thấy khóa học này xây gì, vai trò của bạn và bốn nơi cần biết
trong Codex."

[Dùng `WORKSPACE_ROOT` để tạo link Markdown cục bộ tuyệt đối tới
`course/onboarding/index.html` với nhãn **Mở chuyến phiêu lưu ContentPilot**.
Không chạy server, không yêu cầu cài dependency và không mở ứng dụng bên ngoài
thay Learner.]

Teacher nói: "Mở chuyến phiêu lưu, đi đến checkpoint cuối rồi quay lại gửi cho
mình câu mà trang đã chuẩn bị."

[Dừng chờ Learner. Chỉ đạt khi Learner quay lại sau trải nghiệm và gửi câu xác
nhận, hoặc nói rõ họ đã hoàn thành. Sau đó checkpoint
`intro-visual-onboarding`.]

## Beat 2 — Nhiệm vụ chỉ đọc đầu tiên (`intro-first-safe-win`)

Teacher nói: "Checkpoint đầu tiên đã mở. Bây giờ ta thử một việc thật trong
Codex, nhưng chưa sửa bất kỳ file nào. Dự đoán trước nhé: khi gặp một workspace
mới, vì sao Codex nên đọc bối cảnh trước khi bắt đầu chỉnh sửa?"

[Mở Assessment State dạng prediction. Dừng chờ Learner. Cần ý riêng cho thấy
đọc trước giúp hiểu bối cảnh, tránh đoán sai hoặc giảm rủi ro sửa nhầm. Dùng hint
ladder nếu cần.]

[Khi prediction đạt, nói ngắn rằng Executor sẽ chỉ đọc. Trong cùng thread, đọc
`START_HERE.md`, `course/course-structure.json` và liệt kê các thư mục cấp cao
của workspace. Không sửa file, không cài dependency, không dùng network. Báo
ba bằng chứng: tên workspace, phạm vi Pilot hiện có, và các đường dẫn đã đọc.]

Teacher nói: "Executor vừa quan sát workspace mà không thay đổi gì. Trong báo
cáo đó, chi tiết nào giúp bạn tin rằng nó đã đọc đúng dự án?"

[Dừng chờ Learner. Chấp nhận một bằng chứng cụ thể từ output như tên
ContentPilot, intro + Module 1 hoặc đường dẫn file. Khi đạt, checkpoint
`intro-first-safe-win`.]

## Beat 3 — Chọn nhịp học (`intro-time-budget`)

Teacher nói: "Bạn vừa hoàn thành vòng cộng tác đầu tiên: dự đoán, cho Executor
đọc và kiểm tra bằng chứng. Tiếp theo, chúng ta sẽ gắn hành trình này với một
workflow nội dung thật của bạn."

Teacher nói: "Hôm nay bạn có bao nhiêu phút: 10, 20, 30, 45 hay 60?"

[Dừng chờ Learner. Ghi time budget bằng checkpoint `intro-time-budget`. Nếu
dưới 20 phút, nói rõ checkpoint phù hợp và vẫn bắt đầu Beat 4.]

Teacher nói: "Kết quả của phần mở đầu là một quest card ngắn. Nó giúp mọi quyết
định sau này phục vụ công việc của bạn thay vì một ví dụ chung chung."

## Beat 4 — Nhìn thấy đích đến (`intro-graduation`)

Teacher nói: "ContentPilot cuối khóa sẽ nhận dữ liệu thương hiệu, tạo 10 ý tưởng,
để bạn chọn 5, rồi giúp tạo, duyệt, lưu và xuất 5 gói nội dung. Một lần chạy API
thật là bằng chứng tốt nghiệp; dữ liệu mô phỏng chỉ đủ để học và sửa lỗi."

Teacher nói: "Theo bạn, phần nào trong quy trình đó nhất định phải do bạn giữ
quyền quyết định?"

[Dừng chờ Learner. Không yêu cầu một đáp án duy nhất; cần một quyết định có lý
do như chọn ý tưởng, duyệt claim, giọng viết, hình ảnh hoặc xuất bản. Khi đạt,
checkpoint `intro-graduation`.]

## Beat 5 — Vấn đề hằng tuần (`intro-problem`)

Teacher nói: "Hãy chọn một việc nội dung lặp lại mỗi tuần đang tốn thời gian,
khó giữ nhất quán hoặc bị kẹt ở khâu duyệt. Chỉ cần mô tả một việc cụ thể."

[Dừng chờ Learner. Nếu quá chung, hỏi một biến làm rõ: loại bài, người nhận,
deadline hoặc khâu duyệt. Khi đạt, checkpoint `intro-problem`.]

## Beat 6 — Nền tảng chính (`intro-platform`)

Teacher nói: "Nếu Pilot chỉ được tối ưu đầu ra cho một nền tảng trước, bạn chọn
nền tảng nào và vì sao nó quan trọng nhất lúc này?"

[Dừng chờ Learner. Khi có platform và lý do, checkpoint `intro-platform`.]

## Beat 7 — Quest card (`intro-quest-card`)

Teacher nói: "Giờ hãy viết quest card bằng nội dung của bạn. Bạn có thể dùng
khung trong `artifacts/quest-card.template.md`, nhưng câu trả lời phải có một
tiêu chí quan sát được cho 5 gói nội dung sẵn sàng để bạn duyệt."

[Dừng chờ Learner. Teacher không điền thay. Sau khi Learner trả lời đủ, xin phép
tạo `artifacts/quest-card.md` từ nội dung họ đã viết. Khi file được tạo,
checkpoint `intro-quest-card`.]

## Beat 8 — Readiness gate (`intro-readiness`)

Teacher nói: "Quest card đã đủ để dẫn đường rồi. Mình kiểm tra sẵn sàng bằng hai
câu ngắn, từng câu một nhé."

[Dùng `course/quizzes/intro.quiz.json`. Khi pass, checkpoint
`intro-readiness`.]

## Beat 9 — Chuyển sang Module 1 (`intro-complete`)

Teacher nói: "Bạn đã có đích đến và quyền quyết định rõ ràng. Module 1 sẽ dùng
chính workspace này để luyện vòng làm việc: inspect, brief, duyệt plan, build,
xem diff và kiểm chứng."

Teacher nói: "Khi sẵn sàng, dùng `$start-course-lesson module-1`."

[Đánh dấu intro complete, chuyển current lesson sang `module-1`, checkpoint
`intro-complete`.]
