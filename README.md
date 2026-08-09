# Vibecoding 101

> Học cách làm việc cùng coding agent để biến ý tưởng thành phần mềm có thể chạy
> và kiểm chứng.

Chào mừng bạn đến với khóa học agentic coding dành cho người chưa có nền tảng
lập trình. Bạn sẽ học cách hiểu một codebase, giao việc rõ ràng, kiểm soát phạm
vi, duyệt kế hoạch và kiểm chứng kết quả khi làm việc cùng Codex.

ContentPilot là dự án thực hành xuyên suốt. Bạn sẽ xây ứng dụng này từng phần
để tạo bằng chứng cho kỹ năng, nhưng mục tiêu khóa học là giúp bạn áp dụng cùng
quy trình cho những sản phẩm khác.

> [!NOTE]
> **Về chế độ luyện tập:** Course Companion hiện dùng kịch bản lưu trên máy cho
> phản hồi của Teacher và các tình huống thực hành. Ứng dụng sẽ nói rõ khi dữ
> liệu chưa đến trực tiếp từ Codex.

## Bạn sẽ học được gì?

- **Hiểu trước khi sửa.** Đọc dự án và kiểm tra giả định trước khi yêu cầu thay
  đổi.
- **Giao việc có thể kiểm chứng.** Nêu mục tiêu, bối cảnh, phạm vi, ràng buộc và
  dấu hiệu hoàn thành.
- **Giữ quyền quyết định.** Xem kế hoạch, nhận diện rủi ro và chỉ cho phép hành
  động khi đã hiểu tác động.
- **Đọc bằng chứng.** Kiểm tra file, phần thay đổi, log, test và giao diện thay
  vì chỉ tin câu “đã xong”.
- **Sửa sai có kiểm soát.** Chẩn đoán từ bằng chứng và chạy lại đúng phần bị lỗi
  mà không làm mất công việc đã đạt.
- **Chuyển giao kỹ năng.** Dùng cùng quy trình cho một dự án khác ngoài
  ContentPilot.

## Khóa học này phù hợp với ai?

Khóa học được thiết kế cho marketer, creator, product builder và những người
muốn tự tạo công cụ hữu ích cùng AI, kể cả khi chưa từng viết code.

Bạn sẽ phù hợp nếu thích học qua từng bước nhỏ, muốn hiểu mình đang giao gì cho
coding agent và muốn kết thúc với một ứng dụng thật có thể tự kiểm tra.

## Trước khi bắt đầu

Bạn cần:

- máy tính Windows hoặc macOS;
- [Git](https://git-scm.com/downloads);
- tài khoản ChatGPT có quyền dùng Codex;
- kết nối internet; và
- Node.js 22 trở lên nếu dùng macOS.

**Bạn không cần có kinh nghiệm lập trình.** Trình khởi động sẽ kiểm tra công cụ
cần thiết và giải thích phần còn thiếu trước khi thực hiện thay đổi.

## Bắt đầu trên Windows

Mở **Command Prompt** hoặc **PowerShell** trong thư mục bạn muốn lưu khóa học.
Chạy lần lượt:

```bat
git clone https://github.com/DiligentPenguinn/codex-content-creator-course.git
cd codex-content-creator-course
.\start-course.cmd
```

## Bắt đầu trên macOS

Mở **Terminal** trong thư mục bạn muốn lưu khóa học. Chạy lần lượt:

```bash
git clone https://github.com/DiligentPenguinn/codex-content-creator-course.git
cd codex-content-creator-course
./start-course.command
```

Sau khi tải repository, bạn cũng có thể nhấp đúp `start-course.command` trong
Finder.

## Sau đó sẽ diễn ra như thế nào?

1. Bạn nhận lời chào và phần giải thích ngắn về quá trình chuẩn bị.
2. Trình khởi động kiểm tra các công cụ cần thiết.
3. Nếu cần cài gói phụ thuộc, bạn sẽ thấy lệnh và mục đích trước khi chạy.
4. **Không có gì được cài nếu bạn chưa đồng ý.**
5. Course Companion mở và khôi phục tiến độ đã lưu trên máy nếu có.
6. Bạn bắt đầu bài học và dự án thực hành tại đúng bước đang học.

Bạn có thể từ chối cài đặt. Trình khởi động sẽ dừng và giải thích bước tiếp theo
bạn có thể tự thực hiện.

## Tài khoản và tiến độ

- Luồng thiết lập Windows dùng trang đăng nhập ChatGPT chính thức của Codex và
  không đọc hoặc lưu mật khẩu hay token đăng nhập của bạn.
- Course Companion trên macOS hiện dùng chế độ luyện tập và chưa quan sát trực
  tiếp task Codex; ứng dụng ghi rõ nguồn của phản hồi.
- Cấu hình không chứa bí mật và tiến độ học được lưu trên máy của bạn.
- Khi mở lại, ứng dụng kiểm tra bản lưu và đưa bạn về đúng bước đang học.

## Khi cần trợ giúp

- Với Windows, xem [hướng dẫn khởi động và xử lý lỗi](prototypes/app-startup-electron-mock/README.md).
- Với macOS, xem [hướng dẫn Course Companion](course-companion/README.md).

## For contributors

The links below are for people developing the course itself. Learners do not
need to read them to begin.

<details>
<summary>Open contributor resources and authority map</summary>

### Current authority

- [Pilot 0.1 workspace](pilot-workspace/START_HERE.md) is the runnable
  Codex-native course authority for `intro`, `module-1`, and `resume`.
- [Course Companion](course-companion/README.md) is the implemented desktop-app
  package; its Teacher and practice adapters are currently fixture-backed.
- [ContentPilot learner starter](starters/contentpilot/README.md) is the
  validated application baseline that learners extend.
- [Planning handoff](docs/planning/content-automation-course-handoff.md) and its
  linked contracts define the approved public-course direction.
- [UI, UX, and interaction review](docs/planning/ui-ux-interaction-review-index.md)
  maps current behavior, planned behavior, and historical references.
- [Interactive team workload map](docs/planning/team-workload-map.html) records
  the current collaboration boundaries.

From the repository root, `$start-course-lesson` and `$course-teacher` delegate
to the skills inside `pilot-workspace/`. They do not fall back to historical
prototype curricula.

### Historical references

- [Windows startup mock technical design](docs/superpowers/specs/2026-07-30-electron-startup-mock-design.md)
- [MVP 0.5 pedagogy kernel](prototypes/mvp-0.5-pedagogy-kernel/README.vi.md)
- [MVP 1 course repository prototype](prototypes/mvp-1-course-repo/README.vi.md)
- [MVP 2 workflow prototype](prototypes/mvp-2-content-workflow-prototype/README.md)
- [MVP 3 course experience visual prototype](prototypes/mvp-3-course-experience-companion/README.md)
- `codex_content_creator_course_plan_v8.html`, the original 13-module strategy

</details>
