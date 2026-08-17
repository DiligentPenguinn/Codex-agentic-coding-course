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
    lessonLabel: 'MODULE 2 · PLANNING VÀ PRD', mission: 'Planning trước khi code với AI',
    objective: 'Vì sao cần planning trước khi bắt tay vào xây?', panelLabel: 'MỘT KẾ HOẠCH TỐT',
    panelStatus: 'MỤC TIÊU · PHẠM VI · CÁCH KIỂM TRA', tone: 'neutral',
    request: 'Vậy, như thế nào là một kế hoạch tốt?',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Sản phẩm cần giúp bạn đạt điều gì' },
      { label: 'RANH GIỚI', value: 'Điều sẽ làm và chưa làm' },
      { label: 'KIỂM CHỨNG', value: 'Dấu hiệu cho thấy kết quả đúng' }
    ],
    dialogue: 'Sau khi hoàn thành module 1, hy vọng các bạn đã hiểu hơn về cách sử dụng Codex. Đầu tiên, chúng ta sẽ cùng tìm hiểu về cách planning khi sử dụng Coding agents. Nhiều bạn mới bắt đầu code với AI thường bỏ qua phần lên kế hoạch mà nhảy thẳng vào phần thực thi. Các bạn ấy nghĩ rằng mình đang tiết kiệm thời gian, nhưng thực chất các bạn đang lầm. Nếu có một kế hoạch tốt trước khi bắt đầu xây sản phẩm. Bạn sẽ tiết kiệm được biết bao thời gian debug và sửa lại từ đầu vì không đúng ý. Tin mình đi, mình đã phạm phải sai lầm này và đã phải trả giá.',
    choices: [{ label: 'Tìm hiểu về PRD', next: 'module-2-prd-introduction', primary: true }]
  },
  'module-2-prd-introduction': {
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
    dialogue: 'Để có một plan tốt, chúng ta sẽ cùng nhau tìm hiểu một khái niệm mới, đó là PRD. PRD là viết tắt của Product Requirements Document, hay tài liệu yêu cầu sản phẩm. Tài liệu này giúp bạn và coding agent thống nhất sản phẩm cần làm gì trước khi bàn đến chi tiết như framework, thư viện hoặc cấu trúc code.',
    choices: [{ label: 'Xem cách làm PRD cùng coding agent', next: 'module-2-prd-agent-workflow', primary: true }]
  },
  'module-2-prd-agent-workflow': {
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
    choices: [{ label: 'Áp dụng vào dự án thực hành', next: 'module-2-portfolio-practice-intro', primary: true }]
  },
  'module-2-portfolio-practice-intro': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-brief', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 2 · THỰC HÀNH', mission: 'Lập kế hoạch cho portfolio',
    objective: 'Áp dụng quy trình PRD vào một sản phẩm thật', panelLabel: 'DỰ ÁN THỰC HÀNH',
    panelStatus: 'PORTFOLIO CỦA BẠN', tone: 'good',
    request: 'Portfolio là nơi bạn thực hành quy trình planning, không phải kiến thức duy nhất của module.',
    evidence: [
      { label: 'ÁP DỤNG', value: 'Planning và PRD vừa học' },
      { label: 'ĐẦU RA', value: 'Bảy tài liệu trong planning/' },
      { label: 'CHƯA LÀM', value: 'Chưa chọn công nghệ hoặc viết ứng dụng' }
    ],
    dialogue: 'Bây giờ, chúng ta sẽ chính thức bắt tay vào tạo Portfolio. Bạn sẽ dùng portfolio làm dự án thực hành để áp dụng quy trình planning và PRD vừa học. Những kỹ năng này không chỉ dành cho portfolio; bạn có thể dùng lại khi làm việc với coding agent trên các sản phẩm khác.',
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
      { label: 'THÀNH CÔNG', value: 'Một dấu hiệu có thể quan sát' }
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
      { label: 'TRẠNG THÁI', value: 'Đã kiểm chứng · lời tự khai · giả định · còn thiếu' },
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
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Chuyển PRD thành hợp đồng xây dựng',
    objective: 'Nối mỗi yêu cầu với cách kiểm tra và một nhiệm vụ đầu tiên', panelLabel: 'BA TÀI LIỆU LIÊN KẾT',
    panelStatus: 'MAP · PLAN · FIRST TASK', tone: 'neutral',
    request: 'Plan không được đưa nội dung ngoài phạm vi trở lại hoặc bắt đầu tạo ứng dụng.',
    evidence: [
      { label: 'MAP', value: 'Requirement → tiêu chí → kiểm tra → bằng chứng' },
      { label: 'PLAN', value: 'Giai đoạn nhỏ, phụ thuộc và điều không làm' },
      { label: 'FIRST TASK', value: 'Đủ nhỏ để duyệt, kiểm tra và khôi phục' }
    ],
    dialogue: 'Hợp đồng cuối Module 2 phải đủ rõ để Codex đề xuất bước xây đầu tiên mà không tự đoán phạm vi. Mọi lựa chọn kỹ thuật chưa được duyệt vẫn là câu hỏi mở.',
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
      { label: 'NHIỆM VỤ ĐẦU', value: 'Đề xuất scaffold trung tính rồi dừng chờ duyệt' }
    ],
    dialogue: 'Kế hoạch tốt giữ được đường nối từ yêu cầu đến phép kiểm tra và bằng chứng. Nhiệm vụ đầu tiên không xây luôn toàn bộ portfolio; nó tạo một điểm bắt đầu nhỏ và có thể phục hồi.',
    choices: [{ label: 'Kiểm tra trước khi thực hành', next: 'module-2-check-delayed-scope', primary: true }]
  },
  'module-2-portfolio-practice': {
    lessonId: 'module-2', checkpointId: 'm2-portfolio-planning', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 2 · LẬP KẾ HOẠCH PORTFOLIO', mission: 'Tạo gói planning của bạn',
    objective: 'Hoàn thành năm giai đoạn trong một Practice', panelLabel: 'PHẠM VI ĐƯỢC PHÉP',
    panelStatus: '7 TÀI LIỆU · 1 THƯ MỤC ẢNH', tone: 'good',
    request: 'Codex chỉ được sửa bảy tài liệu planning và ảnh chụp tham chiếu.',
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
      { label: 'ARTIFACT', value: 'Bảy phiên bản hiện tại', ready: true },
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
    panelStatus: 'ĐÃ LƯU AN TOÀN', tone: 'good', request: 'Biên nhận hoàn thành gắn đúng thư mục, bảy tệp, năm lần duyệt và kết quả làm chủ hiện tại.',
    evidence: [
      { label: 'THƯ MỤC', value: 'Đã gắn đúng đường dẫn', ready: true },
      { label: 'TỆP', value: '7 phiên bản hiện tại', ready: true },
      { label: 'BÀN GIAO', value: 'Không chứa lịch sử chat', ready: true }
    ], dialogue: 'Cửa kiểm tra đã lưu biên nhận hoàn thành trước khi mở điểm sẵn sàng của Module 3.', choices: []
  }
} as const satisfies Partial<Record<SceneId, RegistrySceneContent>>

export const moduleTwoScenes = {
  ...instructionalScenes,
  ...assessmentScenes
} satisfies Partial<Record<SceneId, RegistrySceneContent>>
