# MVP 1 - Course repo chạy trong Codex

MVP 1 biến pedagogy kernel thành một course repo có thể chạy trực tiếp trong Codex. Mục tiêu không phải là web app học tập riêng, mà là chứng minh learner có thể mở repo, dùng prompt bắt đầu lesson, làm bài tập nhỏ, nhận quiz, và tạo artifact thật trong scaffold ContentPilot Lite.

Ngôn ngữ chính là tiếng Việt có đầy đủ dấu. Tiếng Anh chỉ là lớp companion để đối chiếu.

## Có gì trong MVP 1

- `course-structure.json`: bản đồ course, lesson path, quiz path, prompt path và artifact cần tạo.
- `lessons/`: phần Mở đầu và 4 lesson đầu, từ Module 0 đến Module 3.
- `lesson-scripts/`: kịch bản tĩnh đã đánh bóng; Teacher đọc theo script và chỉ ứng biến khi learner đi lệch.
- `codex-prompts/`: prompt copy-paste để bắt đầu từng module trong Codex.
- `quizzes/`: quiz JSON theo tình huống, hỏi từng câu một, có rule chống câu trả lời chỉ chép lại lời Teacher.
- `visuals/opening-scene/`: cảnh mở đầu kiểu RPG để giới thiệu bối cảnh, nhân vật và động lực học Codex.
- `templates/`: AGENTS.md template cho course repo và app scaffold.
- `app-scaffold/contentpilot-lite/`: practice repo/folder chính cho Module 0-3; scaffold app tĩnh, không cần dependency, để learner inspect và mở rộng.

## Cách bắt đầu khóa học

Cách dễ nhất: mở một thread mới ở root repo, bảo đảm Codex đã thấy repo skills trong `.agents/skills`, rồi gõ:

```text
$start-course-lesson intro
```

Lệnh này dùng skill repo-scoped tại:

```text
.agents/skills/start-course-lesson/SKILL.md
```

Skill sẽ đọc `course-structure.json`, tìm đúng lesson/quiz/prompt, load pedagogy kernel khi cần, rồi giao phần dạy cho skill Teacher:

```text
.agents/skills/course-teacher/SKILL.md
```

Nếu skill chưa xuất hiện trong Codex, hãy mở thread mới hoặc restart Codex để repo skills được quét lại.

Prompt dài vẫn được giữ làm fallback/reference tại:

```text
prototypes/mvp-1-course-repo/codex-prompts/start-intro.vi.md
```

Các invocation khuyến nghị:

```text
$start-course-lesson intro
$start-course-lesson module-0
$start-course-lesson module-1
$start-course-lesson module-2
$start-course-lesson module-3
$course-teacher
```

Nếu muốn bỏ qua phần mở đầu và vào thẳng lesson kỹ thuật đầu tiên, dùng `$start-course-lesson module-0`.

## Cách xem cảnh mở đầu

Mở file này trực tiếp trong browser:

```text
prototypes/mvp-1-course-repo/visuals/opening-scene/index.html
```

Cảnh mở đầu giới thiệu scenario, dàn nhân vật và lý do học Codex trước khi learner bước vào Module 0.

## Cách tạo ảnh nền cho cảnh mở đầu

Thêm OpenAI API key của bạn tại:

```text
prototypes/mvp-1-course-repo/visuals/opening-scene/scripts/.env.openai
```

Sau đó chạy lệnh này từ root repo:

```powershell
node scripts\generate-images.mjs
```

Tạo avatar nhân vật bằng lệnh riêng:

```powershell
node scripts\generate-avatars.mjs
```

Các script sẽ lưu ảnh nền và avatar đã tạo vào:

```text
prototypes/mvp-1-course-repo/visuals/opening-scene/images/
```

## Cách thử app scaffold

ContentPilot Lite là practice repo/folder chính của MVP 1:

```text
prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite/
```

Mở file này trực tiếp trong browser:

```text
prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite/index.html
```

Scaffold này là môi trường thực hành cho Module 0-3. Module 0 dùng nó để viết prompt inspect chỉ đọc; Module 1 dùng nó để brief một cải tiến nhỏ; Module 2 dùng nó để thực hành `AGENTS.md` và Brand Brain; Module 3 dùng nó để viết mini PRD trước khi sửa. Nó có Brand Brain, Idea Lab, Draft Studio và Calendar Board phiên bản nhẹ.

Practice card cho Module 0 nằm tại:

```text
prototypes/mvp-1-course-repo/app-scaffold/contentpilot-lite/practice-card.module-0.vi.md
```

## Tiêu chí thành công của MVP 1

- Người học có thể bắt đầu từ phần Mở đầu hoặc Module 0-3 bằng repo skill, không cần web shell.
- Phần Mở đầu tạo được động lực, giới thiệu nhân vật và dẫn learner vào quest card cá nhân.
- Teacher đọc theo script tĩnh trước, chỉ ứng biến ngắn khi learner hỏi lệch hoặc cần repair.
- Quiz được hỏi từng câu một; MCQ dùng lựa chọn gọn và tự luận phải có áp dụng riêng của learner.
- Mỗi lesson có outcome, artifact, practice, quiz và mastery gate.
- ContentPilot Lite đủ nhỏ để Codex inspect nhanh nhưng đủ thật để dạy repo/file/code workflow.
- AGENTS template giúp learner hiểu durable project guidance trước khi sang Module 2.
- Không yêu cầu network, package install, Supabase, Next.js, hay external integration.
