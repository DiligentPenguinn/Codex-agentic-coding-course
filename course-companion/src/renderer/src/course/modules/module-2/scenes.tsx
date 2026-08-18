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
    assessmentGroupId: group.id
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
  'module-2-prd-introduction': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Một task Codex, năm lần duyệt',
    objective: 'Bạn quyết định; Executor soạn; Course Companion kiểm tra', panelLabel: 'AI HỖ TRỢ, BẠN LÀM CHỦ',
    panelStatus: 'TRẢ LỜI · XEM LẠI · CHẤP NHẬN', tone: 'neutral',
    request: 'Bạn chỉ cần trả lời từng câu bằng lời bình thường. Bạn không phải mở biểu mẫu hoặc điền thông tin kỹ thuật.',
    evidence: [
      { label: 'BẠN', value: 'Trả lời từng câu và giữ quyền quyết định' },
      { label: 'EXECUTOR', value: 'Tạo và cập nhật năm tài liệu planning' },
      { label: 'COURSE COMPANION', value: 'Kiểm tra tệp thật trước khi bạn duyệt' }
    ],
    dialogue: 'Cả năm giai đoạn diễn ra trong cùng một task Codex để Executor luôn có các quyết định trước đó. Sau mỗi giai đoạn, Course Companion đọc tài liệu thật trên máy và tóm tắt điều đã chốt, điều còn thiếu và ranh giới cần giữ. Bạn chọn Chấp nhận để đi tiếp hoặc Yêu cầu sửa để tiếp tục trao đổi trong chính task đó. PRD và kế hoạch triển khai được tạo từ những câu trả lời đã duyệt, không phải từ một biểu mẫu bạn tự điền.',
    choices: [{ label: 'Tìm hiểu về PRD', next: 'module-2-prd-agent-workflow', primary: true }]
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
    dialogue: 'PRD là viết tắt của Product Requirements Document, hay tài liệu yêu cầu sản phẩm. Tài liệu này giúp bạn và coding agent thống nhất sản phẩm cần làm gì trước khi bàn đến framework, thư viện hoặc cấu trúc code. PRD không phải một bản mô tả kỹ thuật và cũng không phải lời nhắc để AI xây toàn bộ ứng dụng ngay lập tức.',
    choices: [{ label: 'Xem một PRD tốt cần có gì', next: 'module-2-prd-anatomy', primary: true }]
  },
  'module-2-prd-anatomy': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · PLANNING VÀ PRD', mission: 'Một PRD tốt cần có gì?',
    objective: 'Biến một ý tưởng mơ hồ thành yêu cầu có thể kiểm tra', panelLabel: 'CẤU TRÚC PRD',
    panelStatus: 'MỤC TIÊU → YÊU CẦU → TIÊU CHÍ', tone: 'neutral',
    request: '“Hãy tạo một ứng dụng giúp tôi theo dõi thói quen” mới chỉ là ý tưởng ban đầu.',
    evidence: [
      { label: 'BỐI CẢNH', value: 'Vấn đề · người dùng · mục tiêu' },
      { label: 'PHẠM VI', value: 'Yêu cầu · ngoài phạm vi · ràng buộc' },
      { label: 'HOÀN THÀNH', value: 'Tiêu chí chấp nhận có thể quan sát' }
    ],
    dialogue: 'Một PRD tốt làm rõ bối cảnh, người dùng, mục tiêu, yêu cầu, điều ngoài phạm vi, ràng buộc và câu hỏi còn mở. Mỗi yêu cầu quan trọng cần đi cùng tiêu chí chấp nhận. Nhờ đó, bạn có thể kiểm tra sản phẩm bằng hành vi quan sát được thay vì chỉ hỏi coding agent rằng mọi thứ đã xong chưa.',
    choices: [{ label: 'Xem cách làm PRD cùng coding agent', next: 'module-2-prd-review-workflow', primary: true }]
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
    choices: [{ label: 'Xem năm giai đoạn', next: 'module-2-prd-introduction', primary: true }]
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
    dialogue: 'Ở Giai đoạn 3, bạn có thể tìm portfolio đẹp trên Pafolios hoặc xem Awwwards để mở rộng ý tưởng. Hãy nói rõ điều bạn thích và điều không phù hợp; bạn không cần bắt chước hiệu ứng phức tạp. Nguồn tham khảo không cho phép sao chép chữ, hình ảnh, thương hiệu, mã nguồn hoặc toàn bộ cách thể hiện. Giai đoạn 4 tổng hợp PRD; Giai đoạn 5 tạo kế hoạch triển khai có cách kiểm tra từng yêu cầu. Module 2 vẫn chưa thiết kế giao diện hoặc viết code.',
    choices: [{ label: 'Xem phạm vi Practice', next: 'module-2-portfolio-practice-intro', primary: true }]
  },
  'module-2-portfolio-practice-intro': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Sẵn sàng vào Practice',
    objective: 'Chọn nơi lưu các tài liệu planning', panelLabel: 'BƯỚC TIẾP THEO',
    panelStatus: '6 TRANG · 1 PRACTICE', tone: 'good',
    request: 'Sáu trang giải thích dẫn tới một Practice duy nhất.',
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
    dialogue: 'Course Companion sẽ mở một Practice duy nhất. Sau mỗi giai đoạn, hãy làm mới bằng chứng, đọc các điểm còn thiếu và tự chọn chấp nhận hoặc yêu cầu sửa. Lời báo cáo trong chat không thay thế kiểm tra tệp hiện tại.',
    choices: [{ label: 'Mở Practice lập kế hoạch', action: 'practice', primary: true }]
  },
  'module-2-portfolio-mastery': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Chứng minh bạn sở hữu kế hoạch',
    objective: 'Mastery là một gate riêng với Practice', panelLabel: 'BẰNG CHỨNG HỌC TẬP',
    panelStatus: '6 TÌNH HUỐNG · 4 CÂU TỪ ARTIFACT', tone: 'good',
    request: 'Bạn cần áp dụng nguyên tắc và dẫn chiếu các quyết định thật trong planning package của mình.',
    evidence: [
      { label: 'PRACTICE', value: 'Năm giai đoạn đã được duyệt', ready: true },
      { label: 'ARTIFACT', value: 'Năm phiên bản hiện tại', ready: true },
      { label: 'MASTERY', value: 'Không được thay bằng receipt Practice' }
    ],
    dialogue: 'Phần cuối không yêu cầu bạn đọc mã nguồn. Sáu câu tình huống kiểm tra cách áp dụng; bốn câu còn lại yêu cầu bạn dùng chính tài liệu hiện tại thay vì lặp lại ví dụ Mai.',
    choices: [{ label: 'Bắt đầu kiểm tra tổng hợp', next: 'module-2-mastery-scenario-viewer', primary: true }]
  },
  'module-2-portfolio-mastery-summary': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Hoàn tất phần trả lời',
    objective: 'Đối chiếu mastery với tài liệu hiện tại', panelLabel: 'KẾT QUẢ',
    panelStatus: 'CHỜ GATE HOÀN THÀNH', tone: 'neutral', request: 'Ngưỡng mastery không được công bố trong bản pilot.',
    evidence: [], dialogue: '', choices: [], assessmentGroupId: 'final-assessment', assessmentSummary: true
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
