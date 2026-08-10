import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  COURSE_VERSION,
  LEARNER_STATE_SCHEMA_VERSION,
  checkpointIds,
  type AppSettings,
  type PracticeState,
  type CheckpointId,
  type LearnerProgress,
  type LessonId,
  type ProgressLoadResult,
  type ProgressUpdate,
  type RuntimeInfo,
  type SceneId
} from '../../../../shared/contracts'
import roomImage from '../../../../../prototypes/mvp-3-course-experience-companion/assets/home-base.png'
import teacherImage from '../assets/teacher-triet.png'
import { TeacherWorkspace } from '../components/TeacherWorkspace'

type EvidenceItem = {
  label: string
  value: string
  ready?: boolean
}

type Choice = {
  label: string
  next?: SceneId
  primary?: boolean
  danger?: boolean
  action?: 'practice' | 'home'
  afterSave?: 'home'
  decision?: { key: string; value: string }
}

type SceneContent = {
  lessonId: LessonId
  checkpointId: CheckpointId
  step: number
  totalSteps: number
  lessonLabel: string
  mission: string
  objective: string
  panelLabel: string
  panelStatus: string
  tone: 'neutral' | 'bad' | 'good'
  request: string
  evidence: EvidenceItem[]
  dialogue: string
  choices: Choice[]
  showTitle?: boolean
  showPanel?: boolean
}

const scenes: Record<SceneId, SceneContent> = {
  'intro-visual-onboarding': {
    lessonId: 'intro',
    checkpointId: 'intro-visual-onboarding',
    step: 1,
    totalSteps: 1,
    lessonLabel: 'GIỚI THIỆU KHÓA HỌC',
    mission: 'Giới thiệu khóa học',
    objective: 'Bạn sẽ xây gì trong khóa học này?',
    panelLabel: 'CONTENTPILOT',
    panelStatus: 'TRANG 1/2',
    tone: 'neutral',
    request: 'Ứng dụng bạn sẽ xây trong khóa học',
    evidence: [
      { label: 'ỨNG DỤNG', value: 'ContentPilot' },
      { label: 'ĐẦU VÀO', value: 'Bài viết hoặc profile mẫu' },
      { label: 'ĐẦU RA', value: 'Ý tưởng nội dung' }
    ],
    dialogue: 'Trong khoá học này, bạn sẽ được xây dựng một ứng dụng có khả năng tự động hoá quá trình sáng tạo nội dung. Nó sẽ giúp bạn lên nội dung hàng ngày cho kênh Facebook.',
    choices: [{ label: 'Tiếp tục', next: 'intro-course-overview-2', primary: true }],
    showTitle: false,
    showPanel: false
  },
  'intro-course-overview-2': {
    lessonId: 'intro',
    checkpointId: 'intro-visual-onboarding',
    step: 1,
    totalSteps: 1,
    lessonLabel: 'GIỚI THIỆU KHÓA HỌC',
    mission: 'Giới thiệu khóa học',
    objective: 'Bạn sẽ xây gì trong khóa học này?',
    panelLabel: 'CÁCH HỌC',
    panelStatus: 'XÂY TỪNG PHẦN',
    tone: 'neutral',
    request: 'Học agentic coding thông qua một dự án thực tế',
    evidence: [
      { label: 'DỰ ÁN', value: 'ContentPilot' },
      { label: 'CÁCH HỌC', value: 'Từng quyết định nhỏ' },
      { label: 'QUYỀN DUYỆT', value: 'Thuộc về bạn' }
    ],
    dialogue: 'Bạn chỉ cần nhập thông tin thương hiệu/kênh Facebook của mình, app sẽ tự động giúp bạn nghiên cứu những thông tin đang trending liên quan đến lĩnh vực của bạn, draft nội dung dựa trên giọng văn mà thương hiệu bạn theo đuổi, tạo cả hình ảnh giúp bạn, và bạn chỉ cần duyệt nội dung thôi.',
    choices: [{ label: 'Bắt đầu khóa học', next: 'intro-learning-method', primary: true }],
    showTitle: false,
    showPanel: false
  },
  'intro-learning-method': {
    lessonId: 'intro',
    checkpointId: 'intro-visual-onboarding',
    step: 1,
    totalSteps: 1,
    lessonLabel: 'GIỚI THIỆU KHÓA HỌC',
    mission: 'Giới thiệu khóa học',
    objective: 'Bạn sẽ học như thế nào?',
    panelLabel: 'MODULE 1',
    panelStatus: 'PLANNING TRƯỚC CODE',
    tone: 'neutral',
    request: 'Ý tưởng → PRD → implementation plan',
    evidence: [
      { label: 'KIẾN THỨC CODE', value: 'Chưa cần' },
      { label: 'DỮ LIỆU', value: 'Chưa cần chuẩn bị' },
      { label: 'KẾT QUẢ', value: 'Planning package' }
    ],
    dialogue: 'Khoá học này sẽ không giao cho bạn ứng dụng hoàn chỉnh ngay từ đầu. Mà bạn sẽ được xây từng phần của ứng dụng. Và trong quá trình đó bạn cũng sẽ học được các nguyên tắc xây ứng dụng với AI để có thể tạo ra bất kỳ sản phẩm nào bạn muốn.',
    choices: [{ label: 'Bắt đầu', next: 'module-1-why-planning', afterSave: 'home', primary: true }],
    showTitle: false,
    showPanel: false
  },
  'module-1-why-planning': {
    lessonId: 'module-1',
    checkpointId: 'm1-why-planning',
    step: 1,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Planning trước khi code',
    objective: 'Vì sao planning giúp bạn tiết kiệm thời gian?',
    panelLabel: 'Ý TƯỞNG BAN ĐẦU',
    panelStatus: 'CÒN NHIỀU ĐIỂM MƠ HỒ',
    tone: 'neutral',
    request: '“Hãy xây cho tôi một ứng dụng tạo ý tưởng nội dung.”',
    evidence: [
      { label: 'WORKFLOW', value: 'Chưa rõ' },
      { label: 'PHẠM VI V1', value: 'Chưa rõ' },
      { label: 'DONE WHEN', value: 'Chưa có' }
    ],
    // Keep this wording verbatim with pilot-workspace/course/lesson-scripts/module-1.script.vi.md.
    dialogue: 'Cũng giống như con người, có một kế hoạch kỹ càng trước khi xây sẽ giúp coding agent tránh phạm những sai lầm ngớ ngẩn sau này. Nó tưởng chừng tốn thời gian, nhưng thực chất planning kỹ sẽ giúp bạn đỡ phải debug và sửa một ứng dụng không vừa ý mình. Tin mình đi, sửa một ứng dụng đã đi sai hướng sẽ tốn thời gian hơn nhiều so với planning kỹ ngay từ đầu.\n\nPlanning không cần thiết cho mọi việc. Một thay đổi nhỏ, rõ ràng và dễ hoàn tác có thể giao trực tiếp. Nhưng khi xây từ đầu, còn nhiều quyết định chưa rõ hoặc có nhiều bước phụ thuộc nhau, planning giúp coding agent hiểu đúng vấn đề trước khi viết code.',
    choices: [{ label: 'Tiếp tục', next: 'module-1-why-planning-check', primary: true }],
    showPanel: false
  },
  'module-1-why-planning-check': {
    lessonId: 'module-1',
    checkpointId: 'm1-why-planning',
    step: 1,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Planning trước khi code',
    objective: 'Khi nào một yêu cầu nên được planning trước?',
    panelLabel: 'NGUỒN PHƯƠNG PHÁP',
    panelStatus: 'OPENAI · ANTHROPIC',
    tone: 'neutral',
    // Source translations: https://learn.chatgpt.com/docs/prompting and
    // https://code.claude.com/docs/en/best-practices.
    request: 'OpenAI: Với công việc nhiều bước, hãy để Codex điều tra và đề xuất cách tiếp cận trước khi chỉnh sửa. Anthropic: Khám phá trước, sau đó lập kế hoạch, rồi mới viết code.',
    evidence: [
      { label: 'VIỆC NHỎ', value: 'Có thể giao trực tiếp' },
      { label: 'NHIỀU QUYẾT ĐỊNH', value: 'Nên planning' },
      { label: 'NHIỀU BƯỚC', value: 'Nên planning' }
    ],
    dialogue: 'Theo bạn, dấu hiệu nào cho thấy một yêu cầu nên được planning trước?',
    choices: [
      { label: 'Một thay đổi nhỏ, rõ ràng và dễ hoàn tác', next: 'module-1-planning-cost', danger: true },
      { label: 'Một công việc còn nhiều quyết định chưa rõ hoặc nhiều bước phụ thuộc nhau', next: 'module-1-contentpilot-brief', primary: true, decision: { key: 'planningApproach', value: 'plan-first' } }
    ]
  },
  'module-1-planning-cost': {
    lessonId: 'module-1',
    checkpointId: 'm1-why-planning',
    step: 1,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Planning trước khi code',
    objective: 'Phân biệt việc nhỏ với việc cần planning',
    panelLabel: 'YÊU CẦU NHỎ',
    panelStatus: 'CÓ THỂ GIAO TRỰC TIẾP',
    tone: 'neutral',
    request: 'Một thay đổi nhỏ, rõ ràng và dễ hoàn tác có thể giao trực tiếp.',
    evidence: [
      { label: 'PHẠM VI', value: 'Nhỏ' },
      { label: 'YÊU CẦU', value: 'Rõ ràng' },
      { label: 'HOÀN TÁC', value: 'Dễ' }
    ],
    dialogue: 'Planning không cần thiết cho mọi việc. Một thay đổi nhỏ, rõ ràng và dễ hoàn tác có thể giao trực tiếp. Nhưng khi xây từ đầu, còn nhiều quyết định chưa rõ hoặc có nhiều bước phụ thuộc nhau, planning giúp coding agent hiểu đúng vấn đề trước khi viết code.',
    choices: [{ label: 'Xem lại dấu hiệu cần planning', next: 'module-1-why-planning-check', primary: true }]
  },
  'module-1-contentpilot-brief': {
    lessonId: 'module-1',
    checkpointId: 'm1-contentpilot-brief',
    step: 2,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Làm rõ ý tưởng ContentPilot',
    objective: 'Tách ý tưởng khỏi kế hoạch triển khai',
    panelLabel: 'Ý TƯỞNG CONTENTPILOT',
    panelStatus: 'MỘT CÂU KHỞI ĐẦU',
    tone: 'neutral',
    request: 'Phân tích bài viết hiện có trên profile — hoặc profile mẫu — rồi đề xuất ý tưởng có khả năng bắt kịp xu hướng.',
    evidence: [
      { label: 'INPUT', value: 'Cần làm rõ' },
      { label: 'OUTPUT', value: 'Cần làm rõ' },
      { label: 'PHẠM VI V1', value: 'Cần quyết định' }
    ],
    dialogue: 'Đây mới là ý tưởng, chưa phải kế hoạch. Điều gì nên được làm rõ trước?',
    choices: [
      { label: 'Framework, database và thư viện', next: 'module-1-implementation-too-soon', danger: true },
      { label: 'Workflow, input, output và phạm vi V1', next: 'module-1-prd-concept', primary: true, decision: { key: 'clarificationFocus', value: 'product-requirements' } }
    ]
  },
  'module-1-implementation-too-soon': {
    lessonId: 'module-1',
    checkpointId: 'm1-contentpilot-brief',
    step: 2,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Làm rõ ý tưởng ContentPilot',
    objective: 'Chưa vội chọn cách xây',
    panelLabel: 'QUYẾT ĐỊNH QUÁ SỚM',
    panelStatus: 'BIẾT CÁCH XÂY · CHƯA BIẾT XÂY GÌ',
    tone: 'bad',
    request: 'Chọn công nghệ không thể thay thế quyết định về sản phẩm cần tạo ra kết quả gì.',
    evidence: [
      { label: 'WORKFLOW', value: 'Vẫn chưa rõ' },
      { label: 'OUTPUT', value: 'Vẫn chưa rõ' },
      { label: 'DONE WHEN', value: 'Vẫn chưa có' }
    ],
    dialogue: 'Ở Module 1, bạn chỉ cần quyết định sản phẩm cần làm gì. Coding agent sẽ đề xuất cách xây ở implementation plan sau.',
    choices: [{ label: 'Làm rõ yêu cầu sản phẩm', next: 'module-1-prd-concept', primary: true, decision: { key: 'clarificationFocus', value: 'product-requirements' } }]
  },
  'module-1-prd-concept': {
    lessonId: 'module-1',
    checkpointId: 'm1-prd-concept',
    step: 3,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Phân biệt PRD và implementation plan',
    objective: 'Biết tài liệu nào trả lời câu hỏi nào',
    panelLabel: 'HAI TÀI LIỆU',
    panelStatus: 'XÂY GÌ · XÂY NHƯ THẾ NÀO',
    tone: 'neutral',
    request: 'PRD giữ quyết định sản phẩm. Implementation plan chuyển PRD đã duyệt thành các bước xây dựng.',
    evidence: [
      { label: 'PRD', value: 'Xây cái gì?' },
      { label: 'PLAN', value: 'Xây như thế nào?' },
      { label: 'THỨ TỰ', value: 'PRD trước' }
    ],
    dialogue: 'Câu “Phiên bản đầu chưa tự động đăng bài” thuộc tài liệu nào?',
    choices: [
      { label: 'Implementation plan', next: 'module-1-prd-misclassification', danger: true },
      { label: 'PRD · Đây là quyết định phạm vi', next: 'module-1-prd-interview', primary: true, decision: { key: 'prdClassification', value: 'scope-in-prd' } }
    ]
  },
  'module-1-prd-misclassification': {
    lessonId: 'module-1',
    checkpointId: 'm1-prd-concept',
    step: 3,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Phân biệt PRD và implementation plan',
    objective: 'Đưa quyết định phạm vi về đúng tài liệu',
    panelLabel: 'PHÂN LOẠI CHƯA ĐÚNG',
    panelStatus: 'ĐÂY LÀ PHẠM VI SẢN PHẨM',
    tone: 'bad',
    request: '“Chưa tự động đăng bài” mô tả điều phiên bản đầu chủ động không làm, không phải một bước kỹ thuật.',
    evidence: [
      { label: 'LOẠI QUYẾT ĐỊNH', value: 'Ngoài phạm vi' },
      { label: 'TÀI LIỆU', value: 'PRD', ready: true },
      { label: 'LÝ DO', value: 'Xác định xây gì' }
    ],
    dialogue: 'Hãy ghi quyết định này trong phần ngoài phạm vi của PRD.',
    choices: [{ label: 'Đưa vào PRD', next: 'module-1-prd-interview', primary: true, decision: { key: 'prdClassification', value: 'scope-in-prd' } }]
  },
  'module-1-prd-interview': {
    lessonId: 'module-1',
    checkpointId: 'm1-prd-interview',
    step: 4,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Prompt để coding agent phỏng vấn',
    objective: 'Giữ quyền quyết định trong cuộc hội thoại',
    panelLabel: 'PROMPT PLANNING',
    panelStatus: '5 PHẦN CẦN CÓ',
    tone: 'neutral',
    request: 'Mục tiêu · bối cảnh · hỏi một câu mỗi lượt · output PRD một trang · chưa viết code.',
    evidence: [
      { label: 'CÁCH HỎI', value: 'Một câu mỗi lượt', ready: true },
      { label: 'OUTPUT', value: 'PRD một trang', ready: true },
      { label: 'RANH GIỚI', value: 'Chưa code', ready: true }
    ],
    dialogue: 'Agent giúp đặt câu hỏi và tổ chức câu trả lời; bạn vẫn là người quyết định. Hãy dùng cấu trúc này để bắt đầu cuộc phỏng vấn PRD.',
    choices: [{ label: 'Phỏng vấn tôi từng câu một', next: 'module-1-prd-approved', primary: true, decision: { key: 'promptMethod', value: 'one-question-at-a-time' } }]
  },
  'module-1-prd-approved': {
    lessonId: 'module-1',
    checkpointId: 'm1-prd-approved',
    step: 5,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Review và duyệt PRD',
    objective: 'Biết một PRD tốt trông như thế nào',
    panelLabel: 'PRD MỘT TRANG',
    panelStatus: '8 PHẦN ĐÃ REVIEW',
    tone: 'good',
    request: 'Ý tưởng · workflow · input · output · phạm vi V1 · ngoài phạm vi · Done When · câu hỏi còn mở.',
    evidence: [
      { label: 'DONE WHEN', value: 'Kiểm tra được', ready: true },
      { label: 'CHI TIẾT CODE', value: 'Không có', ready: true },
      { label: 'QUYỀN DUYỆT', value: 'Thuộc về bạn', ready: true }
    ],
    dialogue: 'PRD tốt đủ rõ để giữ sản phẩm đi đúng hướng nhưng chưa quyết định cách viết code. Hãy duyệt sau khi bạn đã kiểm tra đủ tám phần.',
    choices: [{ label: 'Duyệt PRD đã review', next: 'module-1-implementation-plan', primary: true, decision: { key: 'prdApproval', value: 'reviewed-eight-sections' } }]
  },
  'module-1-implementation-plan': {
    lessonId: 'module-1',
    checkpointId: 'm1-implementation-plan',
    step: 6,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Tạo implementation plan từ PRD',
    objective: 'Chia cách xây thành các bước có thể kiểm tra',
    panelLabel: 'MỖI BƯỚC TRONG PLAN',
    panelStatus: '4 TRƯỜNG BẮT BUỘC',
    tone: 'neutral',
    request: 'Mục tiêu · thành phần hoặc tệp · kết quả quan sát được · cách kiểm tra.',
    evidence: [
      { label: 'NGUỒN PHẠM VI', value: 'PRD đã duyệt', ready: true },
      { label: 'THỨ TỰ', value: 'Bước nhỏ, có phụ thuộc' },
      { label: 'CODE', value: 'Chưa viết' }
    ],
    dialogue: 'Bạn chưa cần biết tên tệp. Coding agent phải đề xuất và giải thích bằng ngôn ngữ dành cho người mới.',
    choices: [{ label: 'Tạo plan có kết quả và cách kiểm tra', next: 'module-1-alignment-review', primary: true, decision: { key: 'planStructure', value: 'observable-and-verifiable' } }]
  },
  'module-1-alignment-review': {
    lessonId: 'module-1',
    checkpointId: 'm1-alignment-review',
    step: 7,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Đối chiếu PRD và implementation plan',
    objective: 'Phát hiện scope creep trước khi code',
    panelLabel: 'ALIGNMENT REVIEW',
    panelStatus: 'PHÁT HIỆN MỘT ĐIỂM LỆCH',
    tone: 'neutral',
    request: 'PRD: chưa tự động đăng bài. Plan: Bước 6 — tự động đăng bài lên Facebook.',
    evidence: [
      { label: 'PRD', value: 'Ngoài phạm vi' },
      { label: 'PLAN', value: 'Đang thêm vào' },
      { label: 'KẾT LUẬN', value: 'Chưa khớp' }
    ],
    dialogue: 'Bạn sẽ xử lý điểm lệch này thế nào trước khi duyệt planning package?',
    choices: [
      { label: 'Giữ lại vì agent đã đề xuất', next: 'module-1-alignment-mismatch', danger: true },
      { label: 'Loại bước đăng bài khỏi plan', next: 'module-1-planning-package', primary: true, decision: { key: 'alignmentDecision', value: 'remove-scope-creep' } }
    ]
  },
  'module-1-alignment-mismatch': {
    lessonId: 'module-1',
    checkpointId: 'm1-alignment-review',
    step: 7,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Đối chiếu PRD và implementation plan',
    objective: 'Không để agent tự mở rộng phạm vi',
    panelLabel: 'SCOPE CREEP',
    panelStatus: 'PLAN KHÔNG CÒN THEO PRD',
    tone: 'bad',
    request: 'Một đề xuất kỹ thuật không tự động trở thành yêu cầu sản phẩm đã được duyệt.',
    evidence: [
      { label: 'NGUỒN PHẠM VI', value: 'PRD' },
      { label: 'BƯỚC THỪA', value: 'Tự động đăng bài' },
      { label: 'HÀNH ĐỘNG', value: 'Loại hoặc sửa PRD' }
    ],
    dialogue: 'Nếu muốn thêm đăng bài, bạn phải sửa và duyệt lại PRD. Với phạm vi hiện tại, hãy loại bước đó khỏi plan.',
    choices: [{ label: 'Loại scope creep', next: 'module-1-planning-package', primary: true, decision: { key: 'alignmentDecision', value: 'remove-scope-creep' } }]
  },
  'module-1-planning-package': {
    lessonId: 'module-1',
    checkpointId: 'm1-planning-package',
    step: 8,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Hoàn thiện planning package',
    objective: 'Tạo hai artifact trước khi implementation',
    panelLabel: 'CHECKPOINT BẮT BUỘC',
    panelStatus: 'CHỜ THỰC HÀNH TRONG CODEX',
    tone: 'good',
    request: 'Planning package = PRD.md đã duyệt + implementation-plan.md đã duyệt và khớp PRD.',
    evidence: [
      { label: 'PRD.md', value: 'Cần tạo' },
      { label: 'IMPLEMENTATION PLAN', value: 'Cần tạo' },
      { label: 'CODE', value: 'Chưa bắt đầu', ready: true }
    ],
    dialogue: 'Bây giờ hãy sang Codex để tạo planning package. Course Companion sẽ chờ bằng chứng mô phỏng của cả hai artifact.',
    choices: [
      { label: 'Xem lại từ đầu', next: 'module-1-why-planning' },
      { label: 'Sang Codex tạo planning package', action: 'practice', primary: true }
    ]
  },
  'module-1-mastery': {
    lessonId: 'module-1',
    checkpointId: 'm1-mastery',
    step: 9,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Kiểm tra planning package',
    objective: 'Chọn bằng chứng đủ để qua Module 1',
    panelLabel: 'BẰNG CHỨNG MÔ PHỎNG',
    panelStatus: '2 ARTIFACT · ĐÃ ALIGN',
    tone: 'good',
    request: 'PRD.md đã duyệt · implementation-plan.md đã duyệt · mọi Done When có cách kiểm tra tương ứng.',
    evidence: [
      { label: 'PRD', value: 'Đã duyệt', ready: true },
      { label: 'PLAN', value: 'Đã duyệt', ready: true },
      { label: 'ALIGNMENT', value: 'Khớp', ready: true }
    ],
    dialogue: 'Điều gì chứng minh planning package này đã sẵn sàng cho implementation?',
    choices: [
      { label: 'Coding agent nói rằng đã xong', next: 'module-1-mastery-repair', danger: true },
      { label: 'Hai artifact tồn tại, đã duyệt và khớp nhau', next: 'module-1-complete', primary: true, decision: { key: 'masteryEvidence', value: 'artifacts-approved-and-aligned' } }
    ]
  },
  'module-1-mastery-repair': {
    lessonId: 'module-1',
    checkpointId: 'm1-mastery',
    step: 9,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Kiểm tra planning package',
    objective: 'Dựa vào artifact thay vì lời khẳng định',
    panelLabel: 'BẰNG CHỨNG CHƯA ĐỦ',
    panelStatus: 'LỜI NÓI KHÔNG PHẢI CHECKPOINT',
    tone: 'bad',
    request: 'Trạng thái “đã xong” không chứng minh PRD và plan tồn tại, được duyệt hoặc khớp nhau.',
    evidence: [
      { label: 'ARTIFACT', value: 'Cần kiểm tra' },
      { label: 'PHÊ DUYỆT', value: 'Cần xác nhận' },
      { label: 'ALIGNMENT', value: 'Cần đối chiếu' }
    ],
    dialogue: 'Hãy quay lại bằng chứng có thể quan sát: hai artifact, trạng thái duyệt và mapping giữa PRD với plan.',
    choices: [{ label: 'Duyệt bằng artifact và alignment', next: 'module-1-complete', primary: true, decision: { key: 'masteryEvidence', value: 'artifacts-approved-and-aligned' } }]
  },
  'module-1-complete': {
    lessonId: 'module-1',
    checkpointId: 'm1-complete',
    step: 10,
    totalSteps: 10,
    lessonLabel: 'MODULE 1 · PLANNING VÀ PRD',
    mission: 'Planning trước implementation',
    objective: 'Module 1 đã hoàn thành',
    panelLabel: 'PLANNING PACKAGE',
    panelStatus: 'SẴN SÀNG CHO MODULE 2',
    tone: 'good',
    request: 'Bạn đã biến một ý tưởng một câu thành PRD và implementation plan đủ rõ để bắt đầu xây.',
    evidence: [
      { label: 'PRD', value: 'Đã duyệt', ready: true },
      { label: 'PLAN', value: 'Đã duyệt', ready: true },
      { label: 'BƯỚC TIẾP', value: 'Implementation & debugging', ready: true }
    ],
    dialogue: 'Ở Module 2, hai tài liệu này sẽ là điểm xuất phát cho implementation và debugging. Module 1 dừng ở đây, trước khi viết code.',
    choices: [{ label: 'Về Home Base', action: 'home', primary: true }]
  }
}
type View = 'loading' | 'welcome' | 'resume' | 'app' | 'reset-confirm' | 'reset-required' | 'error'
type AppDestination = 'home' | 'lesson' | 'progress' | 'settings'

const sceneStyle = { '--pixel-room-image': `url("${roomImage}")` } as CSSProperties

function initialUpdate(): ProgressUpdate {
  return {
    currentLessonId: 'intro',
    checkpointId: 'intro-visual-onboarding',
    sceneId: 'intro-visual-onboarding',
    completedCheckpointIds: [],
    decisions: {}
  }
}

function emptyPracticeState(): PracticeState {
  return { missionId: 'm1-planning-package', status: 'idle' }
}

const defaultAppSettings: AppSettings = {
  companionMode: 'compact',
  companionAlwaysOnTop: true
}

function previewProgress(update: ProgressUpdate, previous?: LearnerProgress): LearnerProgress {
  const timestamp = new Date().toISOString()
  return {
    ...update,
    schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
    courseVersion: COURSE_VERSION,
    practice: previous?.practice ?? emptyPracticeState(),
    startedAt: previous?.startedAt ?? timestamp,
    updatedAt: timestamp
  }
}

function EvidenceGrid({ items }: { items: EvidenceItem[] }) {
  return (
    <div className="pixel-evidence-grid">
      {items.map((item) => (
        <div className={item.ready ? 'is-ready' : ''} key={item.label}>
          <small>{item.label}</small>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  )
}

function EntryScreen({
  mode,
  progress,
  recovered,
  busy,
  onPrimary,
  onReset,
  onCancelReset
}: {
  mode: 'welcome' | 'resume' | 'reset-confirm' | 'reset-required'
  progress: LearnerProgress | null
  recovered: boolean
  busy: boolean
  onPrimary: () => void
  onReset: () => void
  onCancelReset: () => void
}) {
  const scene = progress ? scenes[progress.sceneId] : null
  const isWelcome = mode === 'welcome'
  const isConfirm = mode === 'reset-confirm' || mode === 'reset-required'
  const title = isWelcome
    ? 'Chào mừng bạn đến với Vibecoding 101'
    : isConfirm
      ? 'Bắt đầu lại từ đầu?'
      : 'Tiếp tục đúng nơi bạn dừng lại'
  const description = isWelcome
    ? 'Khoá học này sẽ giúp bạn biết cách sử dụng Coding agent để tạo ra những công cụ hữu ích cho công việc. Chúng mình sẽ không chỉ dạy cho bạn lý thuyết, mà sẽ đồng hành cùng bạn để xây dựng một ứng dụng thực tế.'
    : mode === 'reset-required'
      ? 'Tiến trình hiện tại và bản khôi phục đều không đọc được. Bạn có thể xóa dữ liệu hỏng để bắt đầu an toàn.'
      : isConfirm
        ? 'Toàn bộ tiến trình và lựa chọn cục bộ của hành trình này sẽ bị xóa.'
        : `${scene?.lessonLabel ?? 'BÀI HỌC'} · ${scene?.objective ?? progress?.checkpointId}`

  return (
    <main className="pixel-learning-shell pixel-entry-shell">
      <div className="pixel-scene-world" style={sceneStyle} aria-hidden="true" />
      <div className="pixel-entry-brand">VIBECODING 101 · TRIẾT &amp; DUY</div>
      <img className="pixel-entry-teacher" src={teacherImage} alt="Triết, giáo viên đồng hành" />
      <section className="pixel-entry-panel" aria-live="polite">
        <small>{recovered ? 'ĐÃ KHÔI PHỤC BẢN LƯU GẦN NHẤT' : isWelcome ? 'HÀNH TRÌNH MỚI' : 'CHECKPOINT ĐÃ LƯU'}</small>
        <h1>{title}</h1>
        <p>{description}</p>
        {progress && !isConfirm ? (
          <div className="pixel-entry-checkpoint">
            <span>{progress.currentLessonId === 'intro' ? 'PHẦN GIỚI THIỆU' : 'MODULE 1'}</span>
            <strong>{scene?.mission}</strong>
            <em>Cập nhật {new Date(progress.updatedAt).toLocaleString('vi-VN')}</em>
          </div>
        ) : null}
        <div className="pixel-entry-actions">
          {mode === 'reset-confirm' ? (
            <button type="button" className="pixel-entry-secondary" disabled={busy} onClick={onCancelReset}>
              Giữ tiến trình
            </button>
          ) : progress ? (
            <button type="button" className="pixel-entry-secondary" disabled={busy} onClick={onReset}>
              Bắt đầu lại
            </button>
          ) : null}
          <button type="button" className="pixel-entry-primary" disabled={busy} onClick={onPrimary}>
            {busy ? 'Đang lưu…' : isWelcome ? 'Cùng bắt đầu nhé' : isConfirm ? 'Xóa và bắt đầu lại' : 'Mở Course Companion'}
          </button>
        </div>
      </section>
    </main>
  )
}

const futureModules = [
  'Implementation và debugging',
  'Dùng công cụ và đánh giá bằng chứng',
  'Chia nhỏ việc và kiểm soát đầu ra',
  'Làm việc đa phương thức và giữ quyền duyệt',
  'Chẩn đoán lỗi và chứng minh kết quả'
]

const decisionLabels: Record<string, string> = {
  planningApproach: 'Cách bắt đầu',
  clarificationFocus: 'Điều cần làm rõ',
  prdClassification: 'Phân loại yêu cầu',
  promptMethod: 'Cách phỏng vấn',
  prdApproval: 'Duyệt PRD',
  planStructure: 'Cấu trúc plan',
  alignmentDecision: 'Xử lý scope creep',
  masteryEvidence: 'Bằng chứng hoàn thành'
}

const decisionValues: Record<string, string> = {
  'plan-first': 'Planning trước khi code',
  'product-requirements': 'Workflow, input, output và phạm vi V1',
  'scope-in-prd': 'Quyết định phạm vi thuộc PRD',
  'one-question-at-a-time': 'Một câu hỏi mỗi lượt',
  'reviewed-eight-sections': 'Đã review đủ tám phần',
  'observable-and-verifiable': 'Có kết quả và cách kiểm tra',
  'remove-scope-creep': 'Loại nội dung ngoài PRD',
  'artifacts-approved-and-aligned': 'Hai artifact đã duyệt và khớp nhau'
}

type TeacherOverlayProps = {
  onClose: () => void
  onOpenLesson: () => void
}

function TeacherOverlay({ onClose, onOpenLesson }: TeacherOverlayProps) {
  return (
    <aside className="pixel-teacher-overlay" aria-label="Triết, giáo viên đồng hành">
      <TeacherWorkspace embedded onClose={onClose} onOpenLesson={onOpenLesson} />
    </aside>
  )
}

type PixelAppShellProps = {
  progress: LearnerProgress
  runtime: RuntimeInfo | null
  destination: AppDestination
  settings: AppSettings
  teacherOpen: boolean
  onNavigate: (destination: AppDestination) => void
  onOpenTeacher: () => void
  onCloseTeacher: () => void
  onQuit: () => void
  onReset: () => void
  onSettingsChange: (alwaysOnTop: boolean) => void
}

function PixelAppShell({
  progress,
  runtime,
  destination,
  settings,
  teacherOpen,
  onNavigate,
  onOpenTeacher,
  onCloseTeacher,
  onQuit,
  onReset,
  onSettingsChange
}: PixelAppShellProps) {
  const [confirmReset, setConfirmReset] = useState(false)
  const scene = scenes[progress.sceneId]
  const completed = new Set(progress.completedCheckpointIds)
  if (progress.sceneId === 'module-1-complete') {
    completed.add(progress.checkpointId)
  }
  const progressPercent = Math.round((completed.size / checkpointIds.length) * 100)
  const moduleOneComplete = progress.sceneId === 'module-1-complete'
  const practice = progress.practice

  const surfaceCopy: Record<Exclude<AppDestination, 'home' | 'lesson'>, { kicker?: string; title: string; description?: string }> = {
    progress: {
      title: 'Hồ sơ học tập'
    },
    settings: {
      kicker: 'CÀI ĐẶT',
      title: 'Điều khiển hành vi ứng dụng và dữ liệu cục bộ',
      description: 'Chỉ các cài đặt đang hoạt động thật mới xuất hiện ở đây.'
    }
  }

  return (
    <main className="pixel-course-app">
      <div className="pixel-scene-world" style={sceneStyle} aria-hidden="true" />

      <header className="pixel-app-header">
        <button className="pixel-app-brand" type="button" onClick={() => onNavigate('home')}>
          <span>C</span>
          <span><strong>VIBECODING 101</strong><small>COURSE COMPANION · TRIẾT &amp; DUY</small></span>
        </button>
        <div className="pixel-app-actions">
          <button
            aria-current={destination === 'progress' ? 'page' : undefined}
            className={destination === 'progress' ? 'is-active' : ''}
            type="button"
            onClick={() => onNavigate('progress')}
          >Hồ sơ học tập</button>
          <button
            aria-current={destination === 'settings' ? 'page' : undefined}
            className={destination === 'settings' ? 'is-active' : ''}
            type="button"
            onClick={() => onNavigate('settings')}
          >Cài đặt</button>
          <button type="button" onClick={onQuit}>Thoát · v{runtime?.appVersion ?? '…'}</button>
        </div>
      </header>

      {destination === 'home' ? (
        <section className="pixel-home-base" aria-labelledby="homeBaseTitle">
          <div className="pixel-home-roadmap-shell">
            <div className="pixel-home-heading">
              <div>
                <small>HOME BASE · LỘ TRÌNH</small>
                <h1 id="homeBaseTitle">Lộ trình khóa học</h1>
              </div>
              <div className="pixel-course-progress">
                <small>TIẾN ĐỘ TOÀN KHÓA</small>
                <strong>{completed.size}/{checkpointIds.length} checkpoint · {progressPercent}%</strong>
              </div>
            </div>

            <div className="pixel-roadmap" aria-label="Lộ trình học">
              <button className={`pixel-roadmap-stage is-current${moduleOneComplete ? ' is-complete' : ''}`} type="button" onClick={() => onNavigate('lesson')}>
                <span>01</span><div><small>MODULE 1</small><strong>Giao tiếp hiệu quả với coding agent: Planning và PRD</strong><p>{scene.objective}</p></div><em>{moduleOneComplete ? 'HOÀN THÀNH' : <><span>BẠN ĐANG Ở ĐÂY</span><b>MỞ BÀI HỌC →</b></>}</em>
              </button>
              {futureModules.map((title, index) => (
                <article className="is-locked" key={title}>
                  <span>{String(index + 2).padStart(2, '0')}</span><div><small>MODULE {index + 2}</small><strong>{title}</strong><p>Sẽ mở trong phần học tiếp theo</p></div><em>SẮP TỚI</em>
                </article>
              ))}
            </div>
          </div>

          <button className="pixel-home-teacher" type="button" onClick={onOpenTeacher} aria-label="Mở Triết, giáo viên đồng hành">
            <img src={teacherImage} alt="" />
            <span><small>TEACHER</small><strong>Triết</strong><em>Hỏi khi cần</em></span>
          </button>
        </section>
      ) : destination === 'lesson' ? null : (
        <section className={`pixel-app-surface is-${destination}`}>
          <header className="pixel-surface-heading">
            <div>
              {surfaceCopy[destination].kicker ? <small>{surfaceCopy[destination].kicker}</small> : null}
              <h1>{surfaceCopy[destination].title}</h1>
              {surfaceCopy[destination].description ? <p>{surfaceCopy[destination].description}</p> : null}
            </div>
            <button type="button" onClick={() => onNavigate('home')}>Về Home Base</button>
          </header>

          {destination === 'progress' ? (
            <div className="pixel-progress-surface">
              <section className="pixel-progress-summary">
                <div><small>CHECKPOINT</small><strong>{completed.size}/{checkpointIds.length}</strong><span>Đã ghi nhận</span></div>
                <div><small>BÀI HIỆN TẠI</small><strong>{scene.step}/{scene.totalSteps}</strong><span>{scene.lessonLabel}</span></div>
                <div><small>THỰC HÀNH</small><strong>{practice.status === 'idle' ? 'Chưa bắt đầu' : practice.status}</strong><span>{practice.latestEvent ? 'Bài luyện tập đã lưu' : 'Chưa có kết quả'}</span></div>
              </section>
              <section className="pixel-progress-detail">
                <div>
                  <small>CHECKPOINT HIỆN TẠI</small>
                  <h2>{scene.objective}</h2>
                  <p>{scene.mission}</p>
                  <button type="button" onClick={() => onNavigate('lesson')}>Mở bài học</button>
                </div>
                <div>
                  <small>QUYẾT ĐỊNH ĐÃ LƯU</small>
                  {Object.keys(progress.decisions).length === 0 ? <p>Chưa có quyết định nào.</p> : (
                    <dl>
                      {Object.entries(progress.decisions).map(([key, value]) => (
                        <div key={key}><dt>{decisionLabels[key] ?? key}</dt><dd>{key === 'timeBudget' ? `${value} phút` : decisionValues[value] ?? value}</dd></div>
                      ))}
                    </dl>
                  )}
                </div>
              </section>
              {practice.latestEvent?.evidence ? (
                <section className="pixel-evidence-receipt">
                  <small>BẰNG CHỨNG TỪ BÀI LUYỆN TẬP</small>
                  <strong>{practice.latestEvent.summary}</strong>
                  <div><span>{practice.latestEvent.evidence.prdArtifact}</span><span>{practice.latestEvent.evidence.implementationPlanArtifact}</span><span>{practice.latestEvent.evidence.alignment}</span></div>
                </section>
              ) : null}
            </div>
          ) : null}

          {destination === 'settings' ? (
            <div className="pixel-settings">
              <section>
                <div><small>TRIẾT NỔI</small><h2>Luôn ở phía trên cửa sổ khác</h2><p>Tắt tùy chọn này nếu Triết che khuất công việc trong Codex.</p></div>
                <button
                  aria-label="Luôn ở phía trên cửa sổ khác"
                  aria-checked={settings.companionAlwaysOnTop}
                  className={settings.companionAlwaysOnTop ? 'is-on' : ''}
                  role="switch"
                  type="button"
                  onClick={() => onSettingsChange(!settings.companionAlwaysOnTop)}
                ><span>{settings.companionAlwaysOnTop ? 'BẬT' : 'TẮT'}</span></button>
              </section>
              <section>
                <div><small>KẾT NỐI</small><h2>Teacher và Codex</h2><p>Phần luyện tập hiện dùng kịch bản cục bộ và chưa quan sát trực tiếp Codex.</p></div>
                <strong className="pixel-settings-status">CHẾ ĐỘ LUYỆN TẬP</strong>
              </section>
              <section className="is-danger-zone">
                <div><small>DỮ LIỆU CỤC BỘ</small><h2>Xóa hành trình và bắt đầu lại</h2><p>Xóa checkpoint, quyết định, chat, thực hành và cài đặt trên máy này.</p></div>
                {confirmReset ? (
                  <div className="pixel-settings-confirm"><button type="button" onClick={() => setConfirmReset(false)}>Hủy</button><button type="button" onClick={onReset}>Xóa toàn bộ dữ liệu</button></div>
                ) : <button type="button" onClick={() => setConfirmReset(true)}>Bắt đầu lại</button>}
              </section>
            </div>
          ) : null}
        </section>
      )}

      {teacherOpen ? (
        <TeacherOverlay onClose={onCloseTeacher} onOpenLesson={() => onNavigate('lesson')} />
      ) : null}
    </main>
  )
}

export function LearningWindow() {
  const [runtime, setRuntime] = useState<RuntimeInfo | null>(null)
  const [view, setView] = useState<View>('loading')
  const [progress, setProgress] = useState<LearnerProgress | null>(null)
  const [recovered, setRecovered] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [destination, setDestination] = useState<AppDestination>('home')
  const [teacherOpen, setTeacherOpen] = useState(false)
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings)
  const practiceAdvanceRef = useRef<Promise<LearnerProgress> | null>(null)

  const advanceFromCompletedPractice = async (current: LearnerProgress): Promise<LearnerProgress> => {
    if (current.sceneId !== 'module-1-planning-package' || current.practice.status !== 'completed') return current
    if (practiceAdvanceRef.current) return practiceAdvanceRef.current
    const completed = new Set(current.completedCheckpointIds)
    completed.add('m1-planning-package')
    const update: ProgressUpdate = {
      currentLessonId: 'module-1',
      checkpointId: 'm1-mastery',
      sceneId: 'module-1-mastery',
      completedCheckpointIds: [...completed],
      decisions: current.decisions
    }
    const advance = window.courseCompanion
      ? window.courseCompanion.saveProgress(update)
      : Promise.resolve(previewProgress(update, current))
    practiceAdvanceRef.current = advance
    try {
      return await advance
    } finally {
      practiceAdvanceRef.current = null
    }
  }

  useEffect(() => {
    const load = async () => {
      try {
        const api = window.courseCompanion
        const [runtimeInfo, loadResult, loadedSettings]: [RuntimeInfo | null, ProgressLoadResult, AppSettings] = await Promise.all([
          api?.getRuntimeInfo() ?? Promise.resolve(null),
          api?.loadProgress() ?? Promise.resolve({ status: 'new' as const }),
          api?.loadAppSettings() ?? Promise.resolve(defaultAppSettings)
        ])
        setRuntime(runtimeInfo)
        setAppSettings(loadedSettings)

        if (loadResult.status === 'new') {
          setView('welcome')
          return
        }
        if (loadResult.status === 'reset-required') {
          setError(loadResult.reason)
          setView('reset-required')
          return
        }

        const loadedProgress = await advanceFromCompletedPractice(loadResult.progress)
        setProgress(loadedProgress)
        setRecovered(loadResult.status === 'recovered')
        setView('resume')
      } catch {
        setError('Không thể tải tiến trình cục bộ.')
        setView('error')
      }
    }

    void load()
  }, [])

  useEffect(() => {
    const refreshAfterPractice = async () => {
      if (!window.courseCompanion) return
      const loadResult = await window.courseCompanion.loadProgress()
      if (loadResult.status !== 'returning' && loadResult.status !== 'recovered') return
      const updated = await advanceFromCompletedPractice(loadResult.progress)
      setProgress(updated)
    }
    const refreshWhenVisible = () => {
      if (!document.hidden) void refreshAfterPractice()
    }
    window.addEventListener('focus', refreshAfterPractice)
    document.addEventListener('visibilitychange', refreshWhenVisible)
    const unsubscribe = window.courseCompanion?.onLearningWindowShown(() => {
      void refreshAfterPractice()
    })
    return () => {
      window.removeEventListener('focus', refreshAfterPractice)
      document.removeEventListener('visibilitychange', refreshWhenVisible)
      unsubscribe?.()
    }
  })

  const persist = async (update: ProgressUpdate): Promise<LearnerProgress> => {
    const saved = window.courseCompanion
      ? await window.courseCompanion.saveProgress(update)
      : previewProgress(update, progress ?? undefined)
    setProgress(saved)
    return saved
  }

  const startNew = async () => {
    setBusy(true)
    setError('')
    try {
      await persist(initialUpdate())
      setRecovered(false)
      setDestination('lesson')
      setTeacherOpen(false)
      setView('app')
    } catch {
      setError('Không thể tạo tiến trình mới.')
      setView('error')
    } finally {
      setBusy(false)
    }
  }

  const reset = async () => {
    setBusy(true)
    try {
      await window.courseCompanion?.resetProgress()
      setProgress(null)
      setAppSettings(defaultAppSettings)
      setDestination('home')
      setTeacherOpen(false)
      setRecovered(false)
      setView('welcome')
    } catch {
      setError('Không thể xóa tiến trình cục bộ.')
      setView('error')
    } finally {
      setBusy(false)
    }
  }

  const minimizeToTeacher = async () => {
    await window.courseCompanion?.setCompanionMode('compact')
    await window.courseCompanion?.hideLearningWindow()
  }

  const updateAppSettings = async (companionAlwaysOnTop: boolean) => {
    setError('')
    try {
      const saved = window.courseCompanion
        ? await window.courseCompanion.saveAppSettings({ companionAlwaysOnTop })
        : { ...appSettings, companionAlwaysOnTop }
      setAppSettings(saved)
    } catch {
      setError('Không thể lưu cài đặt Triết nổi.')
    }
  }

  const choose = async (choice: Choice) => {
    if (!progress || busy) return
    if (choice.action === 'home') {
      setTeacherOpen(false)
      setDestination('home')
      return
    }
    if (choice.action === 'practice') {
      await minimizeToTeacher()
      return
    }
    if (!choice.next) return

    setBusy(true)
    setError('')
    try {
      const currentScene = scenes[progress.sceneId]
      const nextScene = scenes[choice.next]
      const completed = new Set(progress.completedCheckpointIds)
      if (currentScene.checkpointId !== nextScene.checkpointId) {
        completed.add(currentScene.checkpointId)
      }
      const decisions = choice.decision
        ? { ...progress.decisions, [choice.decision.key]: choice.decision.value }
        : progress.decisions

      await persist({
        currentLessonId: nextScene.lessonId,
        checkpointId: nextScene.checkpointId,
        sceneId: choice.next,
        completedCheckpointIds: [...completed],
        decisions
      })
      if (choice.afterSave === 'home') {
        setTeacherOpen(false)
        setDestination('home')
      }
    } catch {
      setError('Không thể lưu checkpoint này. Hãy thử lại trước khi tiếp tục.')
    } finally {
      setBusy(false)
    }
  }

  if (view === 'loading') {
    return <main className="pixel-loading">ĐANG ĐỌC TIẾN TRÌNH…</main>
  }

  if (view === 'welcome' || view === 'resume' || view === 'reset-confirm' || view === 'reset-required') {
    return (
      <EntryScreen
        mode={view}
        progress={progress}
        recovered={recovered}
        busy={busy}
        onPrimary={() => {
          if (view === 'resume') {
            setDestination(progress?.currentLessonId === 'intro' ? 'lesson' : 'home')
            setTeacherOpen(false)
            setView('app')
            return
          }
          void (view === 'welcome' ? startNew() : reset())
        }}
        onReset={() => setView('reset-confirm')}
        onCancelReset={() => setView(progress ? 'resume' : 'welcome')}
      />
    )
  }

  if (view === 'error' || !progress) {
    return (
      <main className="pixel-loading pixel-loading--error">
        <strong>KHÔNG THỂ TIẾP TỤC</strong>
        <span>{error || 'Không tìm thấy checkpoint.'}</span>
        <button type="button" onClick={() => setView(progress ? 'resume' : 'welcome')}>Quay lại</button>
      </main>
    )
  }

  if (destination !== 'lesson') {
    return (
      <PixelAppShell
        progress={progress}
        runtime={runtime}
        destination={destination}
        settings={appSettings}
        teacherOpen={teacherOpen}
        onNavigate={(nextDestination) => {
          setTeacherOpen(false)
          setDestination(nextDestination)
        }}
        onOpenTeacher={() => setTeacherOpen(true)}
        onCloseTeacher={() => setTeacherOpen(false)}
        onQuit={() => void window.courseCompanion?.quitApp()}
        onReset={() => void reset()}
        onSettingsChange={(alwaysOnTop) => void updateAppSettings(alwaysOnTop)}
      />
    )
  }

  const scene = scenes[progress.sceneId]

  return (
    <main className="pixel-learning-shell">
      <div className="pixel-scene-world" style={sceneStyle} aria-hidden="true" />

      <header className="pixel-hud">
        <button className="pixel-brand pixel-brand--button" type="button" onClick={() => {
          setTeacherOpen(false)
          setDestination('home')
        }}>
          <span className="pixel-brand__mark" aria-hidden="true">C</span>
          <span><strong>VIBECODING 101</strong><small>VỀ HOME BASE</small></span>
        </button>
        <div className="pixel-mission-meta" aria-label={`Bước ${scene.step} trên ${scene.totalSteps}`}>
          <span>BÀI HỌC HIỆN TẠI · BƯỚC {scene.step}/{scene.totalSteps}</span>
          <strong>{scene.mission}</strong>
          <div className="pixel-progress" aria-hidden="true"><i style={{ width: `${(scene.step / scene.totalSteps) * 100}%` }} /></div>
        </div>
        <div className="pixel-hud-actions">
          <button className="pixel-hud-teacher" type="button" onClick={() => setTeacherOpen(true)}>HỎI TRIẾT</button>
          <button className="pixel-quit" type="button" onClick={() => void window.courseCompanion?.quitApp()}>
            THOÁT · v{runtime?.appVersion ?? '…'}
          </button>
        </div>
      </header>

      {scene.showTitle === false ? null : (
        <section className="pixel-scene-title"><small>{scene.lessonLabel}</small><strong>{scene.objective}</strong></section>
      )}
      <img className="pixel-teacher-character" src={teacherImage} alt="Triết, giáo viên đồng hành" />

      {scene.showPanel === false ? null : (
        <aside className="pixel-consequence" data-tone={scene.tone} aria-live="polite">
          <header><span>{scene.panelLabel}</span><strong>{scene.panelStatus}</strong></header>
          <div className="pixel-request"><p>{scene.request}</p></div>
          <EvidenceGrid items={scene.evidence} />
        </aside>
      )}

      <section className={`pixel-dialogue${scene.choices.length === 1 ? ' has-single-choice' : ''}${scene.choices.length > 3 ? ' has-many-choices' : ''}`} aria-labelledby="teacherName">
        <div className="pixel-speaker"><img src={teacherImage} alt="" /><span>TEACHER</span><strong id="teacherName">Triết</strong></div>
        <p>{scene.dialogue}</p>
        {error ? <div className="pixel-save-error" role="alert">{error}</div> : null}
        <div className="pixel-choices">
          {scene.choices.map((choice) => (
            <button
              className={`pixel-choice${scene.choices.length === 1 && choice.primary ? ' is-primary' : ''}${scene.choices.length === 1 && choice.danger ? ' is-danger' : ''}`}
              disabled={busy}
              key={choice.label}
              type="button"
              onClick={() => void choose(choice)}
            >
              {busy ? 'Đang lưu checkpoint…' : choice.label}
            </button>
          ))}
        </div>
      </section>

      {teacherOpen ? (
        <TeacherOverlay onClose={() => setTeacherOpen(false)} onOpenLesson={() => setTeacherOpen(false)} />
      ) : null}
    </main>
  )
}
