# Script — Xác định quy trình nội dung hằng tuần

## Beat 1 — Định hướng (`intro-time-budget`)

Teacher nói: "Chào bạn. Trong pilot này, mình sẽ không bắt đầu bằng bài giảng về
AI. Mình sẽ bắt đầu bằng một workflow nội dung thật của bạn, rồi dùng nó để xây
ContentPilot từng bước."

Teacher nói: "Hôm nay bạn có bao nhiêu phút: 10, 20, 30, 45 hay 60?"

[Dừng chờ Learner. Ghi time budget bằng checkpoint `intro-time-budget`. Nếu
dưới 20 phút, nói rõ checkpoint phù hợp và vẫn bắt đầu Beat 2.]

Teacher nói: "Kết quả của phần mở đầu là một quest card ngắn. Nó giúp mọi quyết
định sau này phục vụ công việc của bạn thay vì một ví dụ chung chung."

## Beat 2 — Nhìn thấy đích đến (`intro-graduation`)

Teacher nói: "ContentPilot cuối khóa sẽ nhận dữ liệu thương hiệu, tạo 10 ý tưởng,
để bạn chọn 5, rồi giúp tạo, duyệt, lưu và xuất 5 gói nội dung. Một lần chạy API
thật là bằng chứng tốt nghiệp; dữ liệu mô phỏng chỉ đủ để học và sửa lỗi."

Teacher nói: "Theo bạn, phần nào trong quy trình đó nhất định phải do bạn giữ
quyền quyết định?"

[Dừng chờ Learner. Không yêu cầu một đáp án duy nhất; cần một quyết định có lý
do như chọn ý tưởng, duyệt claim, giọng viết, hình ảnh hoặc xuất bản. Khi đạt,
checkpoint `intro-graduation`.]

## Beat 3 — Vấn đề hằng tuần (`intro-problem`)

Teacher nói: "Hãy chọn một việc nội dung lặp lại mỗi tuần đang tốn thời gian,
khó giữ nhất quán hoặc bị kẹt ở khâu duyệt. Chỉ cần mô tả một việc cụ thể."

[Dừng chờ Learner. Nếu quá chung, hỏi một biến làm rõ: loại bài, người nhận,
deadline hoặc khâu duyệt. Khi đạt, checkpoint `intro-problem`.]

## Beat 4 — Nền tảng chính (`intro-platform`)

Teacher nói: "Nếu Pilot chỉ được tối ưu đầu ra cho một nền tảng trước, bạn chọn
nền tảng nào và vì sao nó quan trọng nhất lúc này?"

[Dừng chờ Learner. Khi có platform và lý do, checkpoint `intro-platform`.]

## Beat 5 — Quest card (`intro-quest-card`)

Teacher nói: "Giờ hãy viết quest card bằng nội dung của bạn. Bạn có thể dùng
khung trong `artifacts/quest-card.template.md`, nhưng câu trả lời phải có một
tiêu chí quan sát được cho 5 gói nội dung sẵn sàng để bạn duyệt."

[Dừng chờ Learner. Teacher không điền thay. Sau khi Learner trả lời đủ, xin phép
tạo `artifacts/quest-card.md` từ nội dung họ đã viết. Khi file được tạo,
checkpoint `intro-quest-card`.]

## Beat 6 — Readiness gate (`intro-readiness`)

Teacher nói: "Quest card đã đủ để dẫn đường rồi. Mình kiểm tra sẵn sàng bằng hai
câu ngắn, từng câu một nhé."

[Dùng `course/quizzes/intro.quiz.json`. Khi pass, checkpoint
`intro-readiness`.]

## Beat 7 — Chuyển sang Module 1 (`intro-complete`)

Teacher nói: "Bạn đã có đích đến và quyền quyết định rõ ràng. Module 1 sẽ dùng
chính workspace này để luyện vòng làm việc: inspect, brief, duyệt plan, build,
xem diff và kiểm chứng."

Teacher nói: "Khi sẵn sàng, dùng `$start-course-lesson module-1`."

[Đánh dấu intro complete, chuyển current lesson sang `module-1`, checkpoint
`intro-complete`.]
