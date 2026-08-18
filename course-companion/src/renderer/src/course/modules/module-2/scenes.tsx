import type { CheckpointId, CourseLessonId, SceneId } from '../../../../../../shared/contracts'
import planningQuiz from '../../../../../../../pilot-workspace/course/quizzes/module-2.quiz.json'
import type { RegistrySceneContent } from '../../module-contracts'

type QuizGroup = {
  id: string
  title: string
  mode: 'formative' | 'mastery'
  questions: Array<{ id: string; sceneId: string; prompt: string; type: string }>
}

const groupRoute: Record<string, {
  checkpointId: CheckpointId
  courseLessonId: CourseLessonId
  step: number
}> = {
  'brief-retrieval': { checkpointId: 'm2-portfolio-brief', courseLessonId: 'm2-portfolio-brief', step: 1 },
  'evidence-retrieval': { checkpointId: 'm2-content-evidence-inventory', courseLessonId: 'm2-content-evidence-inventory', step: 2 },
  'reference-retrieval': { checkpointId: 'm2-visual-reference', courseLessonId: 'm2-visual-reference', step: 3 },
  'prd-retrieval': { checkpointId: 'm2-portfolio-prd', courseLessonId: 'm2-portfolio-prd', step: 4 },
  'planning-retrieval': { checkpointId: 'm2-implementation-contract', courseLessonId: 'm2-implementation-contract', step: 5 },
  'final-assessment': { checkpointId: 'm2-portfolio-mastery', courseLessonId: 'm2-implementation-contract', step: 5 }
}

const quizGroups = planningQuiz.groups as QuizGroup[]

const portfolioAgentsPrompt = `Create an AGENTS.md file at the root of the current workspace.

Use the content below exactly as written. Do not change any other files.

After creating it, tell me the file path.

# Portfolio Project Working Agreements

## Decisions and communication

- For multi-step or consequential work, inspect the available source and state the proposed direction before execution.
- Resolve small, reversible details from evidence or a safe default instead of asking unnecessary questions.
- Group linked consequential choices into one decision. Explain the recommendation, alternatives, tradeoffs, and downstream effects.
- Ask one focused question at a time when the answer would materially change scope, privacy, publishing, external effects, or a difficult-to-reverse choice.

## Ownership and truthfulness

- The user owns the audience, content, scope, approval, acceptance, and publishing decisions.
- Never invent personal experience, clients, roles, outcomes, metrics, testimonials, or evidence.
- Clearly distinguish verified facts, personal claims, assumptions, and missing information.
- Ask before changing the agreed scope or presenting an assumption as fact.

## Safety and external actions

- Preserve unrelated work and keep changes small and recoverable.
- Never expose or commit secrets.
- Never publish, deploy, send, delete, push, or make another external change unless the user explicitly requests it.
- Ask before installing dependencies or introducing a service that sends data outside the workspace.

## Review and verification

- After making changes, explain what changed, what was checked, and what remains uncertain in plain language.
- Provide test results and visible behavior the user can review.
- Do not require the user to read source code or diffs to approve the result.
- Stop and ask one focused question when a consequential choice cannot be resolved safely from existing evidence.`

const assessmentScenes = Object.fromEntries(quizGroups.flatMap((group) => {
  const route = groupRoute[group.id]
  if (!route) throw new Error(`Nhóm câu hỏi Module 2 chưa có tuyến hiển thị: ${group.id}`)
  return group.questions.map((question, index) => [question.sceneId, {
    lessonId: 'module-2',
    checkpointId: route.checkpointId,
    step: route.step,
    totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO',
    mission: group.title,
    objective: `Câu ${index + 1}/${group.questions.length}`,
    panelLabel: group.mode === 'mastery' ? 'KIỂM TRA TỔNG HỢP' : 'KIỂM TRA NHANH',
    panelStatus: `CÂU ${index + 1}/${group.questions.length}`,
    tone: 'neutral',
    request: 'Trả lời trước. Lời giải và nguồn sẽ hiện sau khi bạn trả lời.',
    evidence: [
      { label: 'HÌNH THỨC', value: question.type === 'multiple-choice' ? 'Chọn một đáp án' : 'Trả lời bằng tài liệu của bạn' },
      { label: 'TIẾN ĐỘ', value: `${index + 1}/${group.questions.length}` }
    ],
    dialogue: question.prompt,
    choices: [],
    assessmentQuestionId: question.id,
    assessmentGroupId: group.id,
    showTitle: false
  } satisfies RegistrySceneContent])
})) as Partial<Record<SceneId, RegistrySceneContent>>

const instructionalScenes = {
  'module-2-portfolio-workspace': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Lập kế hoạch trước khi xây',
    objective: 'Chốt điều cần làm trước khi Codex chọn cách làm', panelLabel: 'RANH GIỚI MODULE 2',
    panelStatus: 'KẾ HOẠCH TRƯỚC · CODE SAU', tone: 'neutral',
    request: 'Module 2 kết thúc ở kế hoạch triển khai. Module 3 mới bắt đầu xây.',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Portfolio cần truyền đạt điều gì' },
      { label: 'PHẠM VI', value: 'Điều thuộc và chưa thuộc phiên bản đầu' },
      { label: 'KIỂM CHỨNG', value: 'Cách biết từng yêu cầu đã đạt' }
    ],
    dialogue: 'Sau khi hoàn thành module 1, hy vọng các bạn đã hiểu hơn về cách sử dụng Codex. Đầu tiên, chúng ta sẽ cùng tìm hiểu về cách planning khi sử dụng Coding agents. Nhiều bạn mới bắt đầu code với AI thường bỏ qua phần lên kế hoạch mà nhảy thẳng vào phần thực thi. Các bạn ấy nghĩ rằng mình đang tiết kiệm thời gian, nhưng thực chất các bạn đang lầm. Nếu có một kế hoạch tốt trước khi bắt đầu xây sản phẩm. Bạn sẽ tiết kiệm được biết bao thời gian debug và sửa lại từ đầu vì không đúng ý. Tin mình đi, mình đã phạm phải sai lầm này và đã phải trả giá.',
    choices: [{ label: 'Xem cách Module 2 diễn ra', next: 'module-2-prd-definition', primary: true }]
  },
  'module-2-prd-definition': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · PLANNING VÀ PRD', mission: 'PRD là gì?',
    objective: 'Giữ quyết định về sản phẩm trước khi chọn cách xây', panelLabel: 'PRD',
    panelStatus: 'PRODUCT REQUIREMENTS DOCUMENT', tone: 'neutral',
    request: 'PRD mô tả sản phẩm cần giải quyết vấn đề gì và kết quả nào phải đạt được.',
    evidence: [
      { label: 'VẤN ĐỀ', value: 'Vì sao sản phẩm cần tồn tại' },
      { label: 'KẾT QUẢ', value: 'Người dùng cần làm được gì' },
      { label: 'RANH GIỚI', value: 'Điều thuộc và không thuộc phiên bản đầu' }
    ],
    dialogue: 'Để lên được một kế hoạch tốt, mình sẽ giới thiệu cho các bạn một khái niệm thường được dùng trong quá trình phát triển phần mềm - PRD. PRD là viết tắt của Product Requirements Document, hay tài liệu yêu cầu sản phẩm. Tài liệu này giúp bạn và coding agent thống nhất sản phẩm cần làm gì trước khi bàn đến framework, thư viện hoặc cấu trúc code. PRD không phải một bản mô tả kỹ thuật và cũng không phải lời nhắc để AI xây toàn bộ ứng dụng ngay lập tức.',
    choices: [{ label: 'Xem một PRD tốt cần có gì', next: 'module-2-prd-review-workflow', primary: true }]
  },
  'module-2-prd-review-workflow': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · PLANNING VÀ PRD', mission: 'Tạo và review PRD cùng coding agent',
    objective: 'Để AI hỗ trợ mà không giao luôn quyền quyết định', panelLabel: 'QUY TRÌNH 4 BƯỚC',
    panelStatus: 'BỐI CẢNH · HỎI · REVIEW · DUYỆT', tone: 'neutral',
    request: 'Coding agent soạn bản nháp; bạn giữ quyền quyết định mục tiêu, phạm vi và tiêu chí chấp nhận.',
    evidence: [
      { label: '1 · BỐI CẢNH', value: 'Nêu ý tưởng và thông tin đã biết' },
      { label: '2 · LÀM RÕ', value: 'Yêu cầu hỏi từng câu còn thiếu' },
      { label: '3 · REVIEW', value: 'Tìm điểm mơ hồ, mâu thuẫn và tự ý mở rộng' },
      { label: '4 · DUYỆT', value: 'Chỉ chuyển sang plan khi bạn đồng ý' }
    ],
    dialogue: 'Bạn có thể yêu cầu coding agent phỏng vấn mình từng câu, soạn bản nháp PRD rồi tự rà soát những điểm còn mơ hồ. Tuy nhiên, agent không được tự quyết định mục tiêu, người dùng hoặc phạm vi thay bạn. Sau khi PRD được duyệt, agent mới chuyển từng yêu cầu thành các bước triển khai nhỏ có cách kiểm tra.',
    choices: [{ label: 'Xem năm giai đoạn', next: 'module-2-prd-agent-workflow', primary: true }]
  },
  'module-2-prd-agent-workflow': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Năm giai đoạn, năm tài liệu',
    objective: 'Từ mục đích đến kế hoạch triển khai', panelLabel: 'LỘ TRÌNH MODULE 2',
    panelStatus: '5 GIAI ĐOẠN · 5 TÀI LIỆU', tone: 'neutral',
    request: 'Sau Giai đoạn 5, Module 2 dừng. Module 3 mới đề xuất task đầu tiên.',
    evidence: [
      { label: '1 · MỤC ĐÍCH', value: 'Bản định hướng portfolio' },
      { label: '2 · HIỆN CÓ', value: 'Những gì bạn đang có' },
      { label: '3 · THAM KHẢO', value: 'Nguồn tham khảo cho portfolio' },
      { label: '4 · PRD', value: 'PRD của portfolio' },
      { label: '5 · KẾ HOẠCH', value: 'Kế hoạch triển khai' }
    ],
    dialogue: 'Ngoài nội dung ra thì bạn cũng cần lên kế hoạch cho thiết kế của ứng dụng bạn muốn tạo. Trong phần này, nếu bạn có thể tự vẽ đồ hoạ chi tiết thì quá tốt. Nhưng nếu bạn cũng hơi mù thiết kế giống như mình, bạn có thể gửi cho agent ảnh mà bạn thích và những phần cụ thể bạn muốn bắt chước trong ảnh đó. Khi thiết kế portfolio, hai trang web mình hay dùng nhất là Pafolios và Awwwards. Còn nếu thiết kế ứng dụng thì mình sẽ tìm thêm ở hai trang là Dribble và Mobbin. Hoặc bạn cũng có thể vào Pinterest để tìm cảm hứng.',
    choices: [{ label: 'Xem phạm vi Practice', next: 'module-2-portfolio-practice-intro', primary: true }],
    showTitle: false,
    showPanel: false
  },
  'module-2-portfolio-practice-intro': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Sẵn sàng vào Practice',
    objective: 'Chọn nơi lưu các tài liệu planning', panelLabel: 'BƯỚC TIẾP THEO',
    panelStatus: '4 TRANG · 1 PRACTICE', tone: 'good',
    request: 'Bốn trang giải thích dẫn tới một Practice duy nhất.',
    evidence: [
      { label: 'ĐẦU RA', value: 'Năm tài liệu trong planning/' },
      { label: 'CÁCH LÀM', value: 'Một task Codex xuyên suốt' },
      { label: 'CHƯA LÀM', value: 'Chưa chọn công nghệ hoặc viết ứng dụng' }
    ],
    dialogue: 'Tiếp theo, bạn sẽ chọn thư mục portfolio. Course Companion dùng đúng thư mục đó để kiểm tra tài liệu qua năm giai đoạn. Bạn vẫn chỉ trả lời trong task Codex; không phải tự mở hay điền các tệp planning.',
    choices: [{ label: 'Chọn thư mục portfolio', next: 'module-2-portfolio-folder', primary: true }]
  },
  'module-2-portfolio-folder': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Chọn nơi làm portfolio',
    objective: 'Dành một thư mục trống cho hành trình của bạn', panelLabel: 'KHÔNG GIAN LÀM VIỆC',
    panelStatus: 'CHỜ BẠN CHỌN', tone: 'neutral',
    request: 'Course Companion sẽ dùng đúng thư mục này trong Modules 2–4.', evidence: [],
    dialogue: 'Chúng ta sẽ bắt đầu từ một thư mục trống do bạn chọn. Module này chỉ tạo tài liệu trong thư mục planning; chưa cài đặt, chưa tạo ứng dụng và chưa xuất bản.',
    choices: [], showPanel: false
  },
  'module-2-portfolio-agents-setup': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Tạo quy tắc cho portfolio',
    objective: 'Tạo bộ quy luật cho dự án của bạn', panelLabel: 'AGENTS.md',
    panelStatus: 'BỘ QUY LUẬT CHO PORTFOLIO', tone: 'neutral',
    request: 'Tạo Current repo AGENTS.md tại thư mục gốc của workspace portfolio.',
    evidence: [],
    dialogue: 'Bạn đã chọn nơi sẽ lưu toàn bộ portfolio. Bây giờ, hãy tạo Current repo AGENTS.md tại thư mục gốc của workspace này. Tệp này chỉ áp dụng cho dự án portfolio. Nó giúp Codex biết cách làm việc với bạn, bảo vệ nội dung thật và giữ bạn là người quyết định.\n\nHãy giữ ứng dụng này mở, đừng tắt. Tiếp theo, mở ứng dụng Codex và nhờ Codex tạo tệp AGENTS.md bằng toàn bộ nội dung bên dưới. Khi Codex xác nhận đã tạo xong, hãy quay lại ứng dụng này để tiếp tục bài học.\n\nNội dung dành cho coding agent được viết bằng tiếng Anh. Bạn vẫn có thể trao đổi với Codex bằng tiếng Việt. Ứng dụng chỉ lưu lời xác nhận của bạn; không đọc hoặc chấm nội dung AGENTS.md.\n\nBạn đã tạo AGENTS.md trong thư mục portfolio chưa?',
    choices: [
      { label: 'Chưa, tôi sẽ tạo trước' },
      { label: 'Tôi đã tạo AGENTS.md', next: 'module-2-portfolio-brief', primary: true, preservePrimaryLabel: true, decision: { key: 'portfolioAgentsSetup', value: 'learner-confirmed' } }
    ],
    copyPrompt: portfolioAgentsPrompt,
    copyPromptLabel: 'YÊU CẦU ĐỂ DÁN VÀO CODEX',
    copyPromptTitle: 'Tạo AGENTS.md cho portfolio',
    showPanel: false
  },
  'module-2-portfolio-brief': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Tập trung thông điệp',
    objective: 'Chọn một mục tiêu và một nhóm người xem chính', panelLabel: 'CHUỖI QUYẾT ĐỊNH',
    panelStatus: 'MỤC TIÊU → NGƯỜI XEM → HÀNH ĐỘNG', tone: 'neutral',
    request: 'Portfolio phiên bản đầu không cần phục vụ tất cả mọi người.',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Điều portfolio cần giúp bạn đạt được' },
      { label: 'NGƯỜI XEM', value: 'Một nhóm quan trọng nhất' },
      { label: 'SAU KHI XEM', value: 'Điều họ cần hiểu hoặc làm được' }
    ],
    dialogue: 'Một nhóm người xem chính giúp bạn biết nội dung nào cần nổi bật và nội dung nào nên hoãn. Đây là giả thuyết tập trung cho phiên bản đầu, không phải lời khẳng định rằng bạn đã nghiên cứu đầy đủ mọi người dùng.',
    choices: [{ label: 'Xem một ví dụ khác portfolio của tôi', next: 'module-2-portfolio-brief-example', primary: true }]
  },
  'module-2-portfolio-brief-example': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Nhìn mối nối giữa các quyết định',
    objective: 'Ví dụ hoàn chỉnh nhưng không phải đáp án mẫu', panelLabel: 'VÍ DỤ · MAI',
    panelStatus: 'MỘT NGƯỜI XEM · MỘT QUYẾT ĐỊNH', tone: 'good',
    request: 'Giáo viên phụ trách hoạt động ngoại khóa cần quyết định có yêu cầu tư vấn hay không.',
    evidence: [
      { label: 'MỤC ĐÍCH', value: 'Giới thiệu chương trình phục hồi san hô' },
      { label: 'DẤU HIỆU', value: 'Tìm được mục tiêu, an toàn và cách liên hệ' },
      { label: 'NGOÀI V1', value: 'Đăng ký và thanh toán trực tuyến' }
    ],
    dialogue: 'Ví dụ rõ vì mục đích, người xem, quyết định và ranh giới liên kết với nhau. Bạn không thể sao chép câu trả lời này vì mục tiêu, nội dung và bằng chứng của bạn khác Mai.',
    choices: [{ label: 'Kiểm tra nhanh', next: 'module-2-check-brief-viewer', primary: true }]
  },
  'module-2-content-evidence-inventory': {
    lessonId: 'module-2', checkpointId: 'm2-content-evidence-inventory', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Giữ portfolio trung thực',
    objective: 'Tách trạng thái bằng chứng khỏi quyền công bố', panelLabel: 'HAI CÂU HỎI RIÊNG',
    panelStatus: 'CÓ THẬT? · CÓ ĐƯỢC CÔNG KHAI?', tone: 'neutral',
    request: 'Một nội dung có thật vẫn có thể chứa dữ liệu riêng tư hoặc chưa có quyền sử dụng.',
    evidence: [
      { label: 'TRẠNG THÁI', value: 'Có bằng chứng · Do bạn xác nhận · Đang giả định · Còn thiếu' },
      { label: 'CÔNG BỐ', value: 'Được phép · không được phép · chưa rõ' },
      { label: 'VIỆC TIẾP', value: 'Bổ sung · giữ riêng · loại bỏ' }
    ],
    dialogue: 'Mỗi tuyên bố, hình ảnh và liên kết quan trọng cần có trạng thái hiện tại, nguồn nếu có, quyền công bố và việc tiếp theo. Thiếu bằng chứng không tự động có nghĩa là sai; điều quan trọng là không trình bày quá chắc chắn.',
    choices: [{ label: 'Xem một bản kiểm kê mẫu', next: 'module-2-content-evidence-example', primary: true }]
  },
  'module-2-content-evidence-example': {
    lessonId: 'module-2', checkpointId: 'm2-content-evidence-inventory', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Đọc trạng thái đúng nghĩa',
    objective: 'Bằng chứng thật không xóa rủi ro riêng tư', panelLabel: 'VÍ DỤ · MAI',
    panelStatus: 'BẰNG CHỨNG VÀ QUYỀN KHÁC NHAU', tone: 'good',
    request: 'Ảnh học sinh có thể là bằng chứng thật nhưng vẫn chưa được phép công khai.',
    evidence: [
      { label: 'KẾT QUẢ 95%', value: 'Còn thiếu nguồn khảo sát' },
      { label: 'ẢNH HỌC SINH', value: 'Có thật · quyền chưa rõ' },
      { label: 'HÀNH ĐỘNG', value: 'Không dùng cho đến khi đủ điều kiện' }
    ],
    dialogue: 'Bản kiểm kê đáng tin không cố làm mọi hàng trông hoàn hảo. Nó giúp bạn nhìn rõ điều có thể dùng ngay, điều cần xử lý và điều phải giữ khỏi bản công khai.',
    choices: [{ label: 'Kiểm tra nhanh', next: 'module-2-check-evidence-status', primary: true }]
  },
  'module-2-visual-reference': {
    lessonId: 'module-2', checkpointId: 'm2-visual-reference', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Lưu hướng hình ảnh có nguồn',
    objective: 'Mô tả điều bạn thích mà không sao chép', panelLabel: 'MỘT THAM CHIẾU CHÍNH',
    panelStatus: 'URL · ẢNH CHỤP · RANH GIỚI', tone: 'neutral',
    request: 'Tham chiếu giúp diễn đạt thứ tự và cảm giác; nó không cấp quyền sao chép.',
    evidence: [
      { label: 'NGUỒN', value: 'URL có thể kiểm tra lại' },
      { label: 'TRẠNG THÁI', value: 'Ảnh chụp phần thật sự hữu ích' },
      { label: 'RANH GIỚI', value: 'Không sao chép chữ, ảnh, thương hiệu hoặc mã' }
    ],
    dialogue: 'Bạn chỉ cần chọn một nguồn chính và giải thích bằng lời của mình điều gì đáng học theo. Cách chuyển tham chiếu thành thiết kế riêng sẽ được quyết định ở Module 3.',
    choices: [{ label: 'Xem cách lưu tham chiếu', next: 'module-2-visual-reference-example', primary: true }]
  },
  'module-2-visual-reference-example': {
    lessonId: 'module-2', checkpointId: 'm2-visual-reference', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Giữ đúng ranh giới tham chiếu',
    objective: 'Lưu đặc điểm, không lấy tài sản', panelLabel: 'VÍ DỤ · MAI',
    panelStatus: 'HỌC CÁCH ƯU TIÊN THÔNG TIN', tone: 'good',
    request: 'Mai thích việc trang bảo tàng nêu đối tượng và hành động tiếp theo ngay ở phần đầu.',
    evidence: [
      { label: 'ĐÃ LƯU', value: 'URL và hai trạng thái màn hình' },
      { label: 'ĐÃ MÔ TẢ', value: 'Thứ tự thông tin dễ hiểu' },
      { label: 'KHÔNG LẤY', value: 'Ảnh, chữ, thương hiệu và mã nguồn' }
    ],
    dialogue: 'Mai lưu bằng chứng về điều mình đã xem và mô tả nguyên tắc muốn học. Mai không yêu cầu Codex làm giao diện giống hệt nguồn tham chiếu.',
    choices: [{ label: 'Kiểm tra nhanh', next: 'module-2-check-reference-boundary', primary: true }]
  },
  'module-2-portfolio-prd': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-prd', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Giữ quyết định sản phẩm trước khi xây',
    objective: 'Viết yêu cầu theo kết quả có thể quan sát', panelLabel: 'PRD PORTFOLIO',
    panelStatus: 'YÊU CẦU · RANH GIỚI · TIÊU CHÍ', tone: 'neutral',
    request: 'PRD nói sản phẩm cần đạt điều gì; chưa khóa framework, thư viện hoặc cấu trúc mã.',
    evidence: [
      { label: 'YÊU CẦU', value: 'Có mã ổn định và kết quả quan sát được' },
      { label: 'TRẠNG THÁI', value: 'Màn hình rộng, hẹp và bàn phím' },
      { label: 'TIÊU CHÍ', value: 'Có thể kiểm tra và truy ngược' }
    ],
    dialogue: 'PRD nối mục tiêu, người xem và nội dung thật với hành vi cần đạt. Nó cũng giữ rõ điều ngoài phạm vi, ràng buộc và câu hỏi còn mở để Codex không tự điền khoảng trống.',
    choices: [{ label: 'Xem một requirement có thể kiểm tra', next: 'module-2-portfolio-prd-example', primary: true }]
  },
  'module-2-portfolio-prd-example': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-prd', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Từ yêu cầu đến phép kiểm tra',
    objective: 'Nói rõ hành vi thay vì chọn công nghệ', panelLabel: 'VÍ DỤ · REQ-03',
    panelStatus: 'MÀN HÌNH HẸP · KHÔNG CUỘN NGANG', tone: 'good',
    request: 'Người xem vẫn đọc được mục tiêu, độ tuổi và yêu cầu an toàn ở màn hình hẹp.',
    evidence: [
      { label: 'AC-03', value: 'Ba thông tin vẫn đọc được' },
      { label: 'KIỂM TRA', value: 'Xác nhận ở chiều rộng điện thoại' },
      { label: 'CHƯA CHỌN', value: 'Framework và cách dựng bố cục' }
    ],
    dialogue: 'Tiêu chí tốt mô tả điều một người có thể nhìn hoặc thao tác để xác nhận. Tên thư viện hay trạng thái build không tự chứng minh hành vi đó.',
    choices: [{ label: 'Kiểm tra nhanh', next: 'module-2-check-prd-requirement', primary: true }]
  },
  'module-2-implementation-contract': {
    lessonId: 'module-2', checkpointId: 'm2-implementation-contract', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Tạo kế hoạch triển khai',
    objective: 'Nối mỗi yêu cầu với cách kiểm tra và các giai đoạn triển khai', panelLabel: 'MỘT TÀI LIỆU LIÊN KẾT',
    panelStatus: 'YÊU CẦU · KIỂM CHỨNG · GIAI ĐOẠN', tone: 'neutral',
    request: 'Kế hoạch không được đưa nội dung ngoài phạm vi trở lại hoặc bắt đầu tạo ứng dụng.',
    evidence: [
      { label: 'KIỂM CHỨNG', value: 'Requirement → tiêu chí → kiểm tra → bằng chứng' },
      { label: 'GIAI ĐOẠN', value: 'Thứ tự, phụ thuộc và điều không làm' },
      { label: 'ĐIỂM DỪNG', value: 'Chưa tạo task triển khai hoặc viết code' }
    ],
    dialogue: 'Kế hoạch cuối Module 2 phải đủ rõ để Module 3 có thể đề xuất bước xây đầu tiên mà không tự đoán phạm vi. Mọi lựa chọn kỹ thuật chưa được duyệt vẫn là câu hỏi mở.',
    choices: [{ label: 'Xem một lát cắt kiểm chứng', next: 'module-2-implementation-contract-example', primary: true }]
  },
  'module-2-implementation-contract-example': {
    lessonId: 'module-2', checkpointId: 'm2-implementation-contract', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Giữ kế hoạch truy vết được',
    objective: 'Một requirement chỉ đạt khi có cách chứng minh', panelLabel: 'VÍ DỤ · MAI',
    panelStatus: 'REQ-03 ↔ AC-03 ↔ BẰNG CHỨNG', tone: 'good',
    request: 'Kiểm tra trực tiếp ở màn hình hẹp và lưu ảnh chụp cùng ghi nhận không cuộn ngang.',
    evidence: [
      { label: 'PHASE', value: 'Xây danh sách chương trình ở trạng thái rộng và hẹp' },
      { label: 'CHƯA CHỌN', value: 'Thư viện giao diện' },
      { label: 'ĐIỂM DỪNG', value: 'Module 3 mới đề xuất task đầu tiên' }
    ],
    dialogue: 'Kế hoạch tốt giữ được đường nối từ yêu cầu đến phép kiểm tra và bằng chứng. Module 2 dừng tại đây; Module 3 mới đọc kế hoạch, đề xuất task đầu tiên và chờ bạn duyệt.',
    choices: [{ label: 'Kiểm tra trước khi thực hành', next: 'module-2-check-delayed-scope', primary: true }]
  },
  'module-2-portfolio-practice': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-planning', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Hoàn thành năm tài liệu planning',
    objective: 'Dùng một task Codex qua năm giai đoạn', panelLabel: 'PHẠM VI ĐƯỢC PHÉP',
    panelStatus: '5 TÀI LIỆU · 1 TASK · 5 LẦN DUYỆT', tone: 'good',
    request: 'Executor tạo và cập nhật tài liệu; Course Companion kiểm tra tệp thật trước mỗi lần bạn duyệt.',
    evidence: [
      { label: 'TASK', value: 'Một task xuyên suốt năm giai đoạn', ready: true },
      { label: 'ỨNG DỤNG', value: 'Chưa được tạo', ready: true },
      { label: 'PHÊ DUYỆT', value: 'Bạn duyệt từng phiên bản hiện tại' }
    ],
    dialogue: 'Okay, không để các bạn đợi lâu nữa, bây giờ các bạn có thể qua Codex để tiếp tục thực hành rồi. Trước khi bấm chuyển sang Codex để thực hành, hãy copy prompt ở gốc trên bên phải để tẹo nữa paste vào Codex nha',
    choices: [{ label: 'Mở Practice lập kế hoạch', action: 'practice', primary: true }],
    copyPrompt: 'Tôi muốn xây dựng một portfolio cá nhân nhưng chưa biết nên bắt đầu từ đâu. Hãy giúp tôi lập kế hoạch từ đầu bằng cách phỏng vấn tôi từng câu một. Trước tiên, hãy tìm hiểu mục tiêu của portfolio, người tôi muốn thuyết phục, nội dung tôi có thể đưa vào và phiên bản đầu tiên nên gồm những gì. Nếu tôi chưa chắc về câu trả lời, hãy đưa ra một vài lựa chọn dễ hiểu để tôi cân nhắc. Sau mỗi phần quan trọng, hãy tóm tắt những gì đã thống nhất và chờ tôi xác nhận trước khi tiếp tục. Trong quá trình này, chỉ tạo hoặc cập nhật tài liệu trong thư mục planning; chưa viết code, cài gói phụ thuộc hay tạo ứng dụng.',
    showTitle: false,
    showPanel: false
  },
  'module-2-portfolio-mastery': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Chứng minh bạn sở hữu kế hoạch',
    objective: 'Mastery là một gate riêng với Practice', panelLabel: 'BẰNG CHỨNG HỌC TẬP',
    panelStatus: '5 TÌNH HUỐNG · 4 CÂU TỪ ARTIFACT', tone: 'good',
    request: 'Bạn cần áp dụng nguyên tắc và dẫn chiếu các quyết định thật trong planning package của mình.',
    evidence: [
      { label: 'PRACTICE', value: 'Năm giai đoạn đã được duyệt', ready: true },
      { label: 'ARTIFACT', value: 'Năm phiên bản hiện tại', ready: true },
      { label: 'MASTERY', value: 'Không được thay bằng receipt Practice' }
    ],
    dialogue: 'Hãy cùng ôn tập lại kiến thức một chút nhen',
    choices: [{ label: 'Bắt đầu kiểm tra tổng hợp', next: 'module-2-mastery-scenario-viewer', primary: true }],
    showTitle: false,
    showPanel: false
  },
  'module-2-portfolio-mastery-summary': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Hoàn tất phần trả lời',
    objective: 'Đối chiếu mastery với tài liệu hiện tại', panelLabel: 'KẾT QUẢ',
    panelStatus: 'CHỜ GATE HOÀN THÀNH', tone: 'neutral', request: 'Ngưỡng mastery không được công bố trong bản pilot.',
    evidence: [], dialogue: '', choices: [], assessmentGroupId: 'final-assessment', assessmentSummary: true, showTitle: false
  },
  'module-2-portfolio-complete': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-complete', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Sẵn sàng bắt đầu xây',
    objective: 'Module 2 đã hoàn thành', panelLabel: 'ĐẦU VÀO MODULE 3',
    panelStatus: 'ĐÃ LƯU AN TOÀN', tone: 'good', request: 'Biên nhận hoàn thành gắn đúng thư mục, năm tệp, năm lần duyệt và kết quả làm chủ hiện tại.',
    evidence: [
      { label: 'THƯ MỤC', value: 'Đã gắn đúng đường dẫn', ready: true },
      { label: 'TỆP', value: '5 phiên bản hiện tại', ready: true },
      { label: 'BÀN GIAO', value: 'Không chứa lịch sử chat', ready: true }
    ], dialogue: 'Cửa kiểm tra đã lưu biên nhận hoàn thành trước khi mở điểm sẵn sàng của Module 3.', choices: []
  }
} as const satisfies Partial<Record<SceneId, RegistrySceneContent>>

export const moduleTwoScenes = {
  ...instructionalScenes,
  ...assessmentScenes
} satisfies Partial<Record<SceneId, RegistrySceneContent>>
