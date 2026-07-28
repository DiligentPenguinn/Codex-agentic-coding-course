# Script — Thiết lập dự án và làm việc an toàn với Codex

## Beat 1 — Định hướng (`m1-orient`)

Teacher nói: "Module này kết thúc bằng một thay đổi thật trong ContentPilot,
nhưng mình sẽ không nhảy thẳng vào sửa code. Bạn sẽ quyết định dựa trên bằng
chứng ở từng bước."

Teacher nói: "Trước khi đọc repo, hãy dự đoán: file nào có thể điều khiển nội
dung welcome screen, và file nào có thể điều khiển cách nó hiển thị trên mobile?"

[Dừng chờ Learner. Đây là prediction; không chấm đúng sai. Sau câu trả lời,
checkpoint `m1-orient`.]

## Beat 2 — Baseline (`m1-baseline`)

Teacher nói: "Bây giờ Codex sẽ chỉ đọc `contentpilot/README.md` và
`contentpilot/package.json` để tìm đúng lệnh cài đặt, chạy app và kiểm tra. Chưa
sửa file."

[Executor inspect read-only. Báo lệnh và yêu cầu Learner xác nhận trước khi cài
dependency vì install có network và thay đổi `node_modules`. Nếu dependency đã
có, không cài lại.]

Teacher nói: "Trước khi chạy check, bạn dự đoán thế nào là baseline đủ an toàn
để bắt đầu sửa?"

[Dừng chờ Learner. Sau đó chạy lệnh đã ghi trong repo. Khi baseline pass,
checkpoint `m1-baseline`. Nếu fail, chẩn đoán và sửa baseline trước build lab.]

## Beat 3 — Inspect repo (`m1-inspect`)

Teacher nói: "Hãy viết một yêu cầu read-only cho Codex: inspect entry point,
CSS, hướng dẫn dự án và những stage ContentPilot chưa có. Yêu cầu phải nói rõ
phạm vi và bằng chứng cần trả về."

[Dừng chờ Learner. Dùng hint ladder; không đưa prompt hoàn chỉnh trước khi
Learner thử. Khi đạt, Executor chạy prompt nguyên văn trong cùng thread hoặc
sub-agent nếu Learner yêu cầu. Review báo cáo, rồi checkpoint `m1-inspect`.]

## Beat 4 — Hướng dẫn bền vững (`m1-guidance`)

Teacher nói: "Quest card chứa điều nào Codex nên nhớ trong mọi task tương lai,
thay vì bạn phải nhắc lại mỗi lần?"

[Dừng chờ Learner. Cần audience/platform hoặc ngôn ngữ, boundaries và
verification. Sau đó đề xuất một patch nhỏ vào `contentpilot/AGENTS.md`, chờ
approval rồi mới edit. Checkpoint `m1-guidance`.]

## Beat 5 — Task brief (`m1-brief`)

Teacher nói: "Build lab có phạm vi cố định: `app/page.tsx` và
`app/globals.css`. Hãy viết brief bằng lời của bạn với goal, phạm vi, ràng buộc,
non-goal và dấu hiệu quan sát được khi hoàn thành."

[Dừng chờ Learner. Brief phải giữ route `/setup`, mobile action full-width với
tap target ít nhất 54px và mũi tên ở mép phải, desktop giữ content-width, không
overflow, không sửa file khác. Không đưa nguyên brief hoàn chỉnh trước khi
Learner thử. Khi đạt, checkpoint `m1-brief`.]

## Beat 6 — Duyệt plan (`m1-plan-approval`)

Teacher nói: "Codex sẽ đề xuất plan trước khi sửa. Khi đọc plan, bạn cần kiểm
tra bốn thứ: file, thao tác, rủi ro và cách kiểm chứng. Sau khi xem plan, hãy nói
rõ bạn duyệt, yêu cầu sửa plan hay từ chối."

[Executor inspect hai file và đề xuất plan, chưa edit. Dừng chờ Learner quyết
định. Chỉ khi approved mới checkpoint `m1-plan-approval`.]

## Beat 7 — Build (`m1-build`)

[Executor thực hiện đúng brief đã duyệt. Không mở rộng scope. Sau edit, báo file
đã đổi nhưng chưa tuyên bố hoàn thành.]

Teacher nói: "Thay đổi đã được thực hiện trong phạm vi đã duyệt. Trước khi xem
kết quả kiểm tra, bạn dự đoán lỗi nào dễ xuất hiện nhất: type/check, desktop
regression, mobile overflow hay route sai?"

[Dừng chờ Learner. Sau đó chạy `npm run check` và kiểm tra UI desktop/mobile.
Checkpoint `m1-build` khi evidence đã có.]

## Beat 8 — Review và quyết định (`m1-review`)

Teacher nói: "Hãy review ba lớp bằng chứng: diff có đúng scope không, automated
check có pass không, và hành vi desktop/mobile có đúng brief không. Bạn chấp
nhận thay đổi hay yêu cầu sửa? Nêu một lý do."

[Dừng chờ Learner. Ghi evidence vào `artifacts/module-1-evidence.md` sau khi
Learner cho phép. Khi quyết định có bằng chứng, checkpoint `m1-review`.]

## Beat 9 — Mastery gate (`m1-mastery`)

Teacher nói: "Câu cuối kiểm tra việc chuyển kỹ năng sang task khác. Mình sẽ hỏi
từng câu một, không cần trả lời dài."

[Dùng `course/quizzes/module-1.quiz.json`. Khi pass, checkpoint `m1-mastery`.]

## Beat 10 — Hoàn thành pilot (`m1-complete`)

Teacher nói: "Bạn đã hoàn thành Pilot 0.1. Bạn không chỉ làm nút mobile tốt hơn;
bạn đã thực hiện trọn vòng inspect → brief → duyệt → build → kiểm chứng → chấp
nhận. Đó là format mà các module sau sẽ dùng để xây ContentPilot."

[Đánh dấu Module 1 complete và checkpoint `m1-complete`. Không hứa Module 2 đã
có trong workspace này.]
