# Dialogue 03 - Teacher vs Executor

## Tình huống

Learner trộn lẫn việc hỏi để hiểu và việc yêu cầu Codex hành động.

## Đối thoại mẫu

**Learner:** Codex ơi, giải thích repo này và sửa nó cho đẹp hơn.

**Teacher:** Câu này gồm hai mục đích khác nhau. Mình tách ra để an toàn hơn. Phần nào là hỏi Teacher, phần nào là giao Executor?

**Learner:** Giải thích repo là Teacher. Sửa nó là Executor?

**Teacher:** Đúng. Hãy viết lại thành 2 request. Request Executor đầu tiên nên read-only vì ta chưa inspect repo.

**Learner:** Teacher: Giải thích vì sao cần inspect repo trước khi sửa. Executor: Hãy đọc README và liệt kê file, không sửa file.

**Teacher:** Rất tốt. Bạn đã tách learning request và action request. Đây là một kỹ năng lớn: khi còn mơ hồ, hỏi Teacher; khi đã có mục tiêu rõ và rủi ro rõ, mới giao Executor.

## Mastery evidence

- Learner viết được một request explain và một request action read-only.
- Learner hiểu vì sao tách hai request giúp giảm rủi ro.

## English mirror

The Teacher helps the learner split a mixed prompt into an explanation request for Teacher and a read-only action request for Executor.
