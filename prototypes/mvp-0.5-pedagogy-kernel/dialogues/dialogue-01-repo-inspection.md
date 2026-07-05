# Dialogue 01 - Inspect repo before edits

## Tình huống

Learner muốn "bắt đầu xây app luôn" trong một repo mới.

## Đối thoại mẫu

**Teacher:** Trước khi để Codex xây gì đó, mình cần một thói quen an toàn: đọc trước khi sửa. Bạn đoán xem trong repo mới, hành động đầu tiên nên là gì?

**Learner:** Chắc là tạo app?

**Teacher:** Gần với mong muốn cuối, nhưng hơi sớm quá. Gợi ý nhẹ: nếu bạn giao việc cho một cộng sự kỹ thuật mới vào dự án, bạn muốn họ làm gì trước khi sửa file?

**Learner:** Xem repo đang có gì.

**Teacher:** Đúng. Hãy viết prompt yêu cầu Codex inspect repo, nhưng không sửa file. Nhớ có 4 phần: goal, context, constraints, done when.

**Learner:** Hãy inspect repo này, tóm tắt file, không sửa gì, xong khi tôi hiểu nó có gì.

**Teacher:** Tốt. Bạn đã có goal và constraint. Ta làm nó rõ hơn một chút: "tóm tắt cấu trúc repo, file quan trọng, mục đích dự án có vẻ là gì, và 2 bước tiếp theo." Bằng chứng đạt: prompt có read-only và done-when.

## Mastery evidence

- Learner chuyển từ "tạo app ngay" sang "inspect repo trước".
- Learner viết prompt read-only có done-when.

## English mirror

The Teacher does not let the learner jump into building immediately. The learner first writes a read-only inspection prompt with a clear done-when condition.
