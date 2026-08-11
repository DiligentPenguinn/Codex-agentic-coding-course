import { useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  COURSE_VERSION,
  LEARNER_STATE_SCHEMA_VERSION,
  checkpointIds,
  courseLessonIdForScene,
  type AppSettings,
  type CourseLessonId,
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
import courseStructure from '../../../../../pilot-workspace/course/course-structure.json'
import setupQuiz from '../../../../../pilot-workspace/course/quizzes/module-1.quiz.json'
import planningQuiz from '../../../../../pilot-workspace/course/quizzes/module-2.quiz.json'
import teacherImage from '../assets/teacher-triet.png'
import m1ApprovalMenuImage from '../../../../../pilot-workspace/course/codex-setup/images/approval-menu.png'
import m1ModelSettingsImage from '../../../../../pilot-workspace/course/codex-setup/images/model-settings.png'
import m1ReasoningLevelsImage from '../../../../../pilot-workspace/course/codex-setup/images/reasoning-levels.png'
import m1SlashCommandsImage from '../../../../../pilot-workspace/course/codex-setup/images/slash-commands.png'
import m1UnderstandCodexImage from '../assets/lesson-visuals/m1-understand-codex.webp'
import m1AgentsGuidanceImage from '../assets/lesson-visuals/m1-agents-guidance.webp'
import m1AssessmentImage from '../assets/lesson-visuals/m1-assessment.webp'
import m2WhenToPlanImage from '../assets/lesson-visuals/m2-when-to-plan.webp'
import m2ProductRequirementsImage from '../assets/lesson-visuals/m2-product-requirements.webp'
import m2PrdPromptImage from '../assets/lesson-visuals/m2-prd-prompt.webp'
import m2PrdReviewImage from '../assets/lesson-visuals/m2-prd-review.webp'
import m2ImplementationPlanImage from '../assets/lesson-visuals/m2-implementation-plan.webp'
import m2AssessmentImage from '../assets/lesson-visuals/m2-assessment.webp'
import { TeacherWorkspace } from '../components/TeacherWorkspace'

type EvidenceItem = {
  label: string
  value: string
  ready?: boolean
}

type LessonVisual = {
  image: string
  alt: string
  fit?: 'cover' | 'contain'
}

type Choice = {
  label: string
  next?: SceneId
  primary?: boolean
  danger?: boolean
  action?: 'practice' | 'home' | 'review-module'
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
  assessmentQuestionId?: string
  assessmentGroupId?: string
  assessmentSummary?: boolean
  showTitle?: boolean
  showPanel?: boolean
}

type AssessmentSource = {
  label: string
  url: string
  basis: string
}

type ChoiceAssessmentQuestion = {
  id: string
  sceneId: SceneId
  type: 'multiple-choice'
  prompt: string
  choices: string[]
  answerIndex: number
  explanation: string
  source: AssessmentSource
}

type WrittenAssessmentQuestion = {
  id: string
  sceneId: SceneId
  type: 'short-answer' | 'artifact-answer'
  prompt: string
  criteria: string[]
  explanation: string
  source: AssessmentSource
}

type AssessmentQuestion = ChoiceAssessmentQuestion | WrittenAssessmentQuestion

type AssessmentGroup = {
  id: string
  title: string
  placement: string
  mode: 'formative' | 'mastery'
  passingScore?: number
  questions: AssessmentQuestion[]
}

const setupAssessmentGroup: AssessmentGroup = {
  id: 'setup-final-assessment',
  title: setupQuiz.title,
  placement: 'Cuối Module 1',
  mode: 'mastery',
  passingScore: setupQuiz.passingScore / setupQuiz.questions.length,
  questions: setupQuiz.questions.map((question, index) => ({
    ...question,
    sceneId: `module-1-final-${index + 1}` as SceneId,
    explanation: question.explanation ?? 'Hãy tự đối chiếu câu trả lời với các tiêu chí và nguồn chính thức.',
    ...('expectedSignals' in question ? { criteria: question.expectedSignals } : {})
  })) as AssessmentQuestion[]
}

const assessmentGroups = [
  setupAssessmentGroup,
  ...(planningQuiz.groups as AssessmentGroup[])
]
const assessmentQuestions = assessmentGroups.flatMap((group) => group.questions)
const assessmentQuestionById = new Map(assessmentQuestions.map((question) => [question.id, question]))
const assessmentGroupById = new Map(assessmentGroups.map((group) => [group.id, group]))
const assessmentDecisionKey = (questionId: string) => `assessment:${questionId}`

const staticScenes: Partial<Record<SceneId, SceneContent>> = {
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
    panelStatus: 'THIẾT LẬP CODEX',
    tone: 'neutral',
    request: 'Codex → Harness Engineering → approval → model → reasoning → Practice',
    evidence: [
      { label: 'KIẾN THỨC CODE', value: 'Chưa cần' },
      { label: 'DỮ LIỆU', value: 'Chưa cần chuẩn bị' },
      { label: 'KẾT QUẢ', value: 'Cấu hình được Triết duyệt' }
    ],
    dialogue: 'Module 1 bắt đầu bằng Codex và coding agent. Sau đó, bạn sẽ hiểu Harness Engineering, chọn quyền truy cập an toàn, tìm hiểu model và reasoning effort rồi nộp cấu hình thật để Triết duyệt.',
    choices: [{ label: 'Bắt đầu Module 1', next: 'module-1-codex-orientation', afterSave: 'home', primary: true }],
    showTitle: false,
    showPanel: false
  },
  'module-1-codex-orientation': {
    lessonId: 'module-1',
    checkpointId: 'm1-codex-orientation',
    step: 1,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Làm quen với Codex',
    objective: 'Codex là coding agent của OpenAI',
    panelLabel: 'CODING AGENT',
    panelStatus: 'LÀM VIỆC CÙNG BẠN',
    tone: 'neutral',
    request: 'Codex là coding agent của OpenAI.',
    evidence: [
      { label: 'VAI TRÒ', value: 'Coding agent' },
      { label: 'TẠO', value: 'Ứng dụng và website' },
      { label: 'TỰ ĐỘNG HÓA', value: 'Việc lặp lại' }
    ],
    dialogue: 'Codex là coding agent của OpenAI. Trong khóa học này, bạn chỉ cần hiểu coding agent là một trợ lý có thể thực hiện công việc liên quan đến code: tạo ứng dụng, xây trang web, chỉnh sửa dự án và tự động hóa những việc lặp lại.',
    choices: [{ label: 'Làm quen với giao diện Codex', next: 'module-1-codex-examples', primary: true }]
  },
  'module-1-codex-examples': {
    lessonId: 'module-1',
    checkpointId: 'm1-codex-orientation',
    step: 1,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Làm quen với giao diện Codex',
    objective: 'Bạn quyết định khi nào Codex cần xin phép',
    panelLabel: 'APPROVAL',
    panelStatus: 'BẠN GIỮ QUYỀN QUYẾT ĐỊNH',
    tone: 'neutral',
    request: 'Approval cho biết khi nào Codex cần dừng để xin phép.',
    evidence: [
      { label: 'VỊ TRÍ', value: 'Bên dưới ô soạn tin' },
      { label: 'VAI TRÒ', value: 'Kiểm soát quyền hành động' },
      { label: 'HỌC KỸ HƠN', value: 'Ở phần Approval' }
    ],
    dialogue: 'Được rồi, vậy chúng ta sẽ bắt đầu tìm hiểu Codex cùng nhau nha. Đầu tiên, hãy nhìn qua Approval. Khi nhấn vào biểu tượng Codex bên trái dấu cộng, bạn sẽ thấy một hộp gồm ba lựa chọn. Đây là phần cài đặt Approval, nơi bạn thiết lập mức độ kiểm soát đối với coding agent.\n\nTrước tiên, Ask for approval luôn hỏi bạn trước khi chỉnh sửa tệp bên ngoài dự án hoặc sử dụng Internet. Tiếp theo, Approve for me chỉ hỏi khi phát hiện một hành động có thể không an toàn. Cuối cùng, Full access cho phép Codex truy cập Internet và mọi tệp trên máy tính mà không bị giới hạn.\n\nNếu mới bắt đầu, mình khuyên bạn dùng Approve for me. Chế độ này không yêu cầu bạn duyệt mọi hành động, nhưng cũng không trao toàn bộ quyền kiểm soát cho coding agent.',
    choices: [{ label: 'Tiếp theo: Model', next: 'module-1-codex-model-intro', primary: true }]
  },
  'module-1-codex-model-intro': {
    lessonId: 'module-1',
    checkpointId: 'm1-codex-orientation',
    step: 1,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Làm quen với giao diện Codex',
    objective: 'Model và mức suy luận nằm ngay cạnh ô gửi',
    panelLabel: 'MODEL',
    panelStatus: 'CHỌN CÁCH CODEX XỬ LÝ CÔNG VIỆC',
    tone: 'neutral',
    request: 'Xem Model, Effort và Speed đang dùng cho task.',
    evidence: [
      { label: 'MODEL', value: 'Khả năng chính' },
      { label: 'EFFORT', value: 'Mức suy luận' },
      { label: 'SPEED', value: 'Tốc độ xử lý' }
    ],
    dialogue: 'Ở góc dưới bên phải, bạn có thể xem Model cùng mức suy luận đang dùng. Đây là nơi bạn thay đổi cách Codex xử lý công việc. Chúng ta sẽ tìm hiểu từng lựa chọn ở phần sau.',
    choices: [{ label: 'Tiếp theo: Lệnh /', next: 'module-1-codex-slash-commands', primary: true }]
  },
  'module-1-codex-slash-commands': {
    lessonId: 'module-1',
    checkpointId: 'm1-codex-orientation',
    step: 1,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Làm quen với giao diện Codex',
    objective: 'Nhập / để mở nhanh các chức năng',
    panelLabel: 'LỆNH /',
    panelStatus: 'MỞ NGAY TRONG Ô SOẠN TIN',
    tone: 'neutral',
    request: 'Chọn một lệnh hoặc tiếp tục gõ để lọc danh sách.',
    evidence: [
      { label: '/REVIEW', value: 'Xem xét thay đổi code' },
      { label: '/MODEL', value: 'Chọn model' },
      { label: '/MEMORIES', value: 'Quản lý bộ nhớ' }
    ],
    dialogue: 'Khi nhập / trong ô soạn tin, Codex sẽ mở danh sách lệnh. Bạn có thể chọn một lệnh hoặc tiếp tục gõ để tìm nhanh. Chẳng hạn, /review bắt đầu xem xét thay đổi code, còn /model mở phần chọn model.',
    choices: [{ label: 'Tìm hiểu Harness Engineering', next: 'module-1-agents-guidance', primary: true }]
  },
  'module-1-agents-guidance': {
    lessonId: 'module-1',
    checkpointId: 'm1-agents-guidance',
    step: 2,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Harness Engineering',
    objective: 'Vì sao agent cần một môi trường làm việc?',
    panelLabel: 'HARNESS ENGINEERING',
    panelStatus: 'CON NGƯỜI ĐỊNH HƯỚNG · AGENT THỰC THI',
    tone: 'neutral',
    request: 'Thiết kế môi trường, công cụ và vòng phản hồi để agent làm việc ổn định.',
    evidence: [
      { label: 'Ý ĐỊNH', value: 'Được mô tả rõ' },
      { label: 'CÔNG CỤ', value: 'Đủ để hành động' },
      { label: 'PHẢN HỒI', value: 'Biết đúng hay sai' }
    ],
    dialogue: 'Trước khi đi sâu vào Codex, bạn nên biết Harness Engineering. Đây là cách thiết kế môi trường xung quanh một AI agent để nó có thể làm việc ổn định. Con người định hướng, còn agent thực thi trong môi trường đó.',
    choices: [{ label: 'Harness là gì?', next: 'module-1-harness-intro', primary: true }]
  },
  'module-1-harness-intro': {
    lessonId: 'module-1',
    checkpointId: 'm1-agents-guidance',
    step: 2,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Harness Engineering',
    objective: 'Model là bộ não; harness là môi trường quanh nó',
    panelLabel: 'MỘT HARNESS',
    panelStatus: 'NƠI LÀM VIỆC + CÔNG CỤ + QUY TẮC + PHẢN HỒI',
    tone: 'neutral',
    request: 'Harness cho model nơi để hành động, điều cần tuân theo và cách biết kết quả có đạt hay không.',
    evidence: [
      { label: 'NƠI LÀM VIỆC', value: 'Workspace' },
      { label: 'RANH GIỚI', value: 'Quy tắc an toàn' },
      { label: 'KIỂM TRA', value: 'Test và diff' }
    ],
    dialogue: 'Hãy hình dung model là bộ não. Harness là nơi làm việc, công cụ, quy tắc an toàn và vòng phản hồi quanh bộ não đó. Không có harness, model có thể giải thích cách làm nhưng thiếu nơi để hành động và kiểm tra.',
    choices: [{ label: 'Xem harness của Codex', next: 'module-1-harness-codex', primary: true }]
  },
  'module-1-harness-codex': {
    lessonId: 'module-1',
    checkpointId: 'm1-agents-guidance',
    step: 2,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Harness Engineering',
    objective: 'Harness của Codex gồm những gì?',
    panelLabel: 'CODEX HARNESS',
    panelStatus: 'MODEL KHÔNG LÀM VIỆC MỘT MÌNH',
    tone: 'neutral',
    request: 'Codex kết hợp model với một hệ thống để hành động và kiểm tra.',
    evidence: [
      { label: 'DỰ ÁN', value: 'Workspace và tệp' },
      { label: 'HÀNH ĐỘNG', value: 'Terminal và công cụ' },
      { label: 'AN TOÀN', value: 'Sandbox và approval' }
    ],
    dialogue: 'Harness của Codex gồm workspace, terminal, công cụ đọc và sửa tệp, chỉ dẫn của dự án, sandbox, approval, diff và các bước kiểm tra. Những phần này biến khả năng suy luận của model thành một quy trình làm việc có ranh giới.',
    choices: [{ label: 'Khi kết quả chưa tốt thì sao?', next: 'module-1-skills', primary: true }]
  },
  'module-1-skills': {
    lessonId: 'module-1',
    checkpointId: 'm1-skills',
    step: 2,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Harness Engineering',
    objective: 'Không phải lỗi nào cũng cần đổi model',
    panelLabel: 'VÒNG PHẢN HỒI',
    panelStatus: 'TÌM PHẦN HARNESS CÒN THIẾU',
    tone: 'neutral',
    request: 'Xem lại bối cảnh, công cụ, ranh giới và cách kiểm tra trước khi kết luận model không đủ tốt.',
    evidence: [
      { label: 'BỐI CẢNH', value: 'Agent đã biết đủ chưa?' },
      { label: 'CÔNG CỤ', value: 'Có thể hành động không?' },
      { label: 'PHẢN HỒI', value: 'Có biết kết quả sai không?' }
    ],
    dialogue: 'Nếu Codex làm chưa tốt, ta không chỉ đổi model. Ta còn xem harness có thiếu bối cảnh, công cụ, giới hạn hoặc cách kiểm tra nào không. Đây là tư duy cốt lõi của Harness Engineering.',
    choices: [{ label: 'Tiếp tục đến quyền truy cập', next: 'module-1-permissions', primary: true }]
  },
  'module-1-permissions': {
    lessonId: 'module-1',
    checkpointId: 'm1-permissions',
    step: 3,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Quyền hành động và phê duyệt',
    objective: 'Sandbox và approval khác nhau thế nào?',
    panelLabel: 'RANH GIỚI VÀ QUYẾT ĐỊNH',
    panelStatus: 'SANDBOX ≠ APPROVAL',
    tone: 'neutral',
    request: 'Sandbox giới hạn khả năng kỹ thuật; approval quyết định khi nào Codex phải dừng để hỏi.',
    evidence: [
      { label: 'ASK FOR APPROVAL', value: 'Hỏi thường xuyên hơn' },
      { label: 'APPROVE FOR ME', value: 'Dừng ở hành động rủi ro' },
      { label: 'FULL ACCESS', value: 'Gỡ ranh giới bảo vệ' }
    ],
    dialogue: 'Sandbox là ranh giới kỹ thuật giới hạn những gì Codex có thể truy cập. Approval là lúc Codex phải dừng để bạn quyết định. Tự động duyệt không làm thay đổi ranh giới sandbox.',
    choices: [{ label: 'Xem thiết lập khuyên dùng', next: 'module-1-approval-choice', primary: true }]
  },
  'module-1-approval-choice': {
    lessonId: 'module-1',
    checkpointId: 'm1-permissions',
    step: 3,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Approval và quyền truy cập',
    objective: 'Người mới không nên bật Full access',
    panelLabel: 'CẤU HÌNH AN TOÀN',
    panelStatus: 'APPROVE FOR ME · FULL ACCESS TẮT',
    tone: 'neutral',
    request: 'Course Companion chỉ ghi lại lựa chọn; bạn sẽ cài thật trong Codex ở phần Practice.',
    evidence: [
      { label: 'NHỊP LÀM VIỆC', value: 'Ít bị ngắt quãng' },
      { label: 'HÀNH ĐỘNG RỦI RO', value: 'Vẫn dừng lại' },
      { label: 'FULL ACCESS', value: 'Không bật' }
    ],
    dialogue: 'Khóa học khuyên người mới dùng Approve for me và không bật Full access. Thiết lập này giữ nhịp học nhưng vẫn bảo vệ bạn trước những hành động bị phát hiện là có rủi ro.',
    choices: [{ label: 'Dùng thiết lập an toàn này', next: 'module-1-model-choice', primary: true, decision: { key: 'approvalApproach', value: 'approve-for-me-no-full-access' } }]
  },
  'module-1-model-choice': {
    lessonId: 'module-1',
    checkpointId: 'm1-model-choice',
    step: 4,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Model và mức suy luận',
    objective: 'Ba dòng model phục vụ ba nhu cầu',
    panelLabel: 'SOL · TERRA · LUNA',
    panelStatus: 'CHỌN THEO CÔNG VIỆC',
    tone: 'neutral',
    request: 'Tên model không phải cấp độ người học phải vượt qua.',
    evidence: [
      { label: 'SOL', value: 'Phức tạp hoặc mơ hồ' },
      { label: 'TERRA', value: 'Công việc hằng ngày' },
      { label: 'LUNA', value: 'Rõ và lặp lại' }
    ],
    dialogue: 'Sol là dòng mạnh nhất cho việc phức tạp hoặc còn mơ hồ. Terra cân bằng cho công việc hằng ngày. Luna nhanh và tiết kiệm cho yêu cầu rõ, lặp lại hoặc có đầu ra cố định.',
    choices: [{ label: 'Xem ví dụ dùng từng model', next: 'module-1-model-use-cases', primary: true }]
  },
  'module-1-model-use-cases': {
    lessonId: 'module-1',
    checkpointId: 'm1-model-choice',
    step: 4,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Model và mức suy luận',
    objective: 'Chọn model theo độ rõ và độ khó',
    panelLabel: 'VÍ DỤ CONTENTPILOT',
    panelStatus: 'MỘT DỰ ÁN · NHIỀU LOẠI VIỆC',
    tone: 'neutral',
    request: 'Dùng model mạnh hơn khi công việc có nhiều điều chưa rõ; dùng model gọn hơn khi đầu ra đã cố định.',
    evidence: [
      { label: 'SOL', value: 'Thiết kế luồng ứng dụng' },
      { label: 'TERRA', value: 'Sửa một tính năng đã rõ' },
      { label: 'LUNA', value: 'Phân loại danh sách nội dung' }
    ],
    dialogue: 'Với ContentPilot, Sol phù hợp khi ta còn phải quyết định kiến trúc và luồng sử dụng. Terra phù hợp khi sửa một tính năng đã có yêu cầu rõ. Luna phù hợp khi chuyển đổi hoặc phân loại một danh sách theo tiêu chí cố định.',
    choices: [{ label: 'Tìm hiểu reasoning effort', next: 'module-1-reasoning-effort', primary: true }]
  },
  'module-1-reasoning-effort': {
    lessonId: 'module-1',
    checkpointId: 'm1-model-choice',
    step: 4,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Model và mức suy luận',
    objective: 'Reasoning effort thay đổi điều gì?',
    panelLabel: 'LIGHT → MEDIUM → HIGH',
    panelStatus: 'DÙNG MỨC THẤP NHẤT VẪN ĐẠT YÊU CẦU',
    tone: 'neutral',
    request: 'Mức cao hơn dành thêm công sức cho phân tích nhưng thường chậm và tốn usage hơn.',
    evidence: [
      { label: 'LIGHT', value: 'Việc nhỏ và rõ' },
      { label: 'MEDIUM', value: 'Cân bằng' },
      { label: 'HIGH', value: 'Nhiều bước, cần kiểm tra' }
    ],
    dialogue: 'Extra High và Ultra dành cho nhiệm vụ rất khó nên thường quá nặng với người mới. Ultra có thể chia việc cho nhiều subagent. Hãy hình dung subagent như các trợ lý phụ, mỗi người xử lý một phần. Bạn chưa cần cơ chế này cho ContentPilot.',
    choices: [{ label: 'Chốt cấu hình ContentPilot', next: 'module-1-project-setup', primary: true }]
  },
  'module-1-project-setup': {
    lessonId: 'module-1',
    checkpointId: 'm1-model-choice',
    step: 4,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Model và mức suy luận',
    objective: 'Cấu hình khóa học đề xuất cho ContentPilot',
    panelLabel: 'CẤU HÌNH CONTENTPILOT',
    panelStatus: '5.6 SOL · HIGH · STANDARD',
    tone: 'good',
    request: 'Đây là cấu hình dành riêng cho dự án thực hành, không phải mặc định của mọi tài khoản.',
    evidence: [
      { label: 'MODEL', value: '5.6 Sol', ready: true },
      { label: 'EFFORT', value: 'High', ready: true },
      { label: 'SPEED', value: 'Standard', ready: true }
    ],
    dialogue: 'Khóa học chọn 5.6 Sol, High và Standard cho ContentPilot. Sol cùng High tạo thêm khoảng trống khi yêu cầu còn mới. Standard tránh đánh đổi thêm usage để lấy tốc độ.',
    choices: [{ label: 'Dùng cấu hình này cho ContentPilot', next: 'module-1-setup-checklist', primary: true, decision: { key: 'modelChoice', value: 'sol-high-standard' } }]
  },
  'module-1-setup-checklist': {
    lessonId: 'module-1',
    checkpointId: 'm1-setup-checklist',
    step: 5,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Nộp cấu hình để Triết duyệt',
    objective: 'Chứng minh cấu hình thật trong Codex',
    panelLabel: 'PRACTICE · 2 ẢNH',
    panelStatus: 'TRIẾT DUYỆT BẰNG CHỨNG',
    tone: 'neutral',
    request: 'Task Executor sẽ kiểm tra ảnh và báo cáo dưới tiêu đề Verification.',
    evidence: [
      { label: 'ẢNH 1', value: 'Model, Effort, Speed' },
      { label: 'ẢNH 2', value: 'Approval, Full access' },
      { label: 'KẾT QUẢ', value: 'Đúng task và còn mới' }
    ],
    dialogue: 'Course Companion sẽ mở một task Executor riêng. Trong task đó, hãy đính kèm hai ảnh cấu hình và yêu cầu Executor chỉ quan sát, không thay đổi cài đặt. Sau khi có báo cáo đủ năm mục, quay lại và yêu cầu Triết duyệt tiến độ.',
    choices: [{ label: 'Sang Codex nộp cấu hình', action: 'practice', primary: true }]
  },
  'module-1-mastery': {
    lessonId: 'module-1',
    checkpointId: 'm1-mastery',
    step: 6,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Triết đã duyệt cấu hình',
    objective: 'Bằng chứng thiết lập đã đạt',
    panelLabel: 'KẾT QUẢ PRACTICE',
    panelStatus: 'ĐÃ ĐẠT',
    tone: 'good',
    request: 'Kết quả được lưu từ đúng task Executor, không dựa trên lời tự xác nhận.',
    evidence: [
      { label: 'MODEL', value: '5.6 Sol · High', ready: true },
      { label: 'SPEED', value: 'Standard', ready: true },
      { label: 'QUYỀN', value: 'Approve for me · Full access tắt', ready: true }
    ],
    dialogue: 'Triết đã đối chiếu đủ năm thiết lập. Bằng chứng đến từ đúng task và còn mới. Bạn đã có cấu hình an toàn để bắt đầu dự án ContentPilot.',
    choices: [{ label: 'Hoàn thành Module 1', next: 'module-1-complete', primary: true, decision: { key: 'setupMastery', value: 'teacher-reviewed-setup' } }]
  },
  'module-1-complete': {
    lessonId: 'module-1',
    checkpointId: 'm1-complete',
    step: 7,
    totalSteps: 7,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Sẵn sàng làm việc với Codex',
    objective: 'Module 1 đã hoàn thành',
    panelLabel: 'NỀN TẢNG LÀM VIỆC',
    panelStatus: 'SẴN SÀNG CHO MODULE 2',
    tone: 'good',
    request: 'Bạn đã có ranh giới làm việc rõ trước khi bắt đầu planning.',
    evidence: [
      { label: 'CODEX', value: 'Coding agent và harness', ready: true },
      { label: 'CẤU HÌNH', value: 'Đã được Triết duyệt', ready: true },
      { label: 'BƯỚC TIẾP', value: 'Planning, PRD và prompt', ready: true }
    ],
    dialogue: 'Module 2 sẽ dùng nền tảng này để biến ý tưởng ContentPilot thành PRD và implementation plan trước khi viết code.',
    choices: [{ label: 'Mở Module 2', next: 'module-2-why-planning', afterSave: 'home', primary: true }]
  },
  'module-2-why-planning': {
    lessonId: 'module-2',
    checkpointId: 'm2-why-planning',
    step: 1,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
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
    // Keep this wording verbatim with pilot-workspace/course/lesson-scripts/module-2.script.vi.md.
    dialogue: 'Cũng giống như con người, có một kế hoạch kỹ càng trước khi xây sẽ giúp coding agent tránh phạm những sai lầm ngớ ngẩn sau này. Nó tưởng chừng tốn thời gian, nhưng thực chất planning kỹ sẽ giúp bạn đỡ phải debug và sửa một ứng dụng không vừa ý mình. Tin mình đi, sửa một ứng dụng đã đi sai hướng sẽ tốn thời gian hơn nhiều so với planning kỹ ngay từ đầu.\n\nKhông phải việc nào cũng cần planning. Bạn có thể giao trực tiếp cho coding agent nếu yêu cầu nhỏ và kết quả đã rõ. Hãy lập kế hoạch trước khi bắt đầu xây một sản phẩm mới. Bạn cũng nên planning nếu chưa xác định được hướng đi hoặc thứ tự thực hiện.',
    choices: [{ label: 'Xem khi nào cần planning', next: 'module-2-planning-example', primary: true }],
    showPanel: false
  },
  'module-2-planning-example': {
    lessonId: 'module-2',
    checkpointId: 'm2-why-planning',
    step: 1,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Planning trước khi code',
    objective: 'Nhận ra công việc nào cần planning',
    panelLabel: 'NGUỒN PHƯƠNG PHÁP · MICROSOFT',
    panelStatus: 'KHÔNG PHẢI VIỆC NÀO CŨNG CẦN PLANNING',
    tone: 'neutral',
    request: 'Planning có ích khi yêu cầu còn mơ hồ, có nhiều điều chưa biết hoặc chưa thể chỉ ra đầy đủ các bước.',
    evidence: [
      { label: 'YÊU CẦU', value: 'Còn mơ hồ' },
      { label: 'ĐIỀU CHƯA BIẾT', value: 'Còn nhiều' },
      { label: 'CÁC BƯỚC', value: 'Chưa thể liệt kê' }
    ],
    dialogue: 'Hướng dẫn thiết kế của Microsoft khuyên chỉ planning khi công việc thật sự cần. Ví dụ, tạo một ứng dụng mới từ đầu cần planning vì luồng sử dụng, đầu vào, đầu ra và phạm vi phiên bản đầu còn phải được quyết định. Ngược lại, bạn có thể giao trực tiếp việc sửa chữ hoặc màu của một nút nhỏ khi vị trí và kết quả mới đã rõ.',
    choices: [{
      label: 'Áp dụng vào ContentPilot',
      next: 'module-2-contentpilot-brief',
      primary: true,
      decision: { key: 'planningApproach', value: 'plan-first' }
    }]
  },
  'module-2-why-planning-check': {
    lessonId: 'module-2',
    checkpointId: 'm2-why-planning',
    step: 1,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Planning trước khi code',
    objective: 'Khi nào một yêu cầu nên được planning trước?',
    panelLabel: 'KIỂM TRA NHANH',
    panelStatus: 'SAU PHẦN GIẢI THÍCH VÀ VÍ DỤ',
    tone: 'neutral',
    request: 'Chọn dấu hiệu cho thấy coding agent cần làm rõ công việc trước khi viết code.',
    evidence: [
      { label: 'VIỆC NHỎ', value: 'Có thể giao trực tiếp' },
      { label: 'NHIỀU QUYẾT ĐỊNH', value: 'Nên planning' },
      { label: 'NHIỀU BƯỚC', value: 'Nên planning' }
    ],
    dialogue: 'Theo bạn, dấu hiệu nào cho thấy một yêu cầu nên được planning trước?',
    choices: [
      { label: 'Một thay đổi nhỏ, rõ ràng và dễ hoàn tác', next: 'module-2-planning-cost', danger: true },
      { label: 'Một công việc còn nhiều quyết định chưa rõ hoặc nhiều bước phụ thuộc nhau', next: 'module-2-contentpilot-brief', primary: true, decision: { key: 'planningApproach', value: 'plan-first' } }
    ]
  },
  'module-2-planning-cost': {
    lessonId: 'module-2',
    checkpointId: 'm2-why-planning',
    step: 1,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
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
    dialogue: 'Không phải việc nào cũng cần planning. Nếu yêu cầu nhỏ và dễ làm lại khi có lỗi, bạn có thể giao trực tiếp cho coding agent. Tuy nhiên, khi bắt đầu xây một sản phẩm hoặc khi công việc còn nhiều quyết định chưa rõ và nhiều bước phụ thuộc nhau, hãy lập kế hoạch trước. Nhờ đó, coding agent có thể hiểu đúng vấn đề rồi mới viết code.',
    choices: [{ label: 'Xem lại dấu hiệu cần planning', next: 'module-2-why-planning-check', primary: true }]
  },
  'module-2-contentpilot-brief': {
    lessonId: 'module-2',
    checkpointId: 'm2-contentpilot-brief',
    step: 2,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Làm rõ ý tưởng ContentPilot',
    objective: 'Nhìn ra điều còn thiếu trong một ý tưởng',
    panelLabel: 'Ý TƯỞNG CONTENTPILOT',
    panelStatus: 'MỘT CÂU KHỞI ĐẦU',
    tone: 'neutral',
    request: 'Phân tích bài viết hiện có trên profile — hoặc profile mẫu — rồi đề xuất ý tưởng có khả năng bắt kịp xu hướng.',
    evidence: [
      { label: 'ĐẦU VÀO', value: 'Cần làm rõ' },
      { label: 'ĐẦU RA', value: 'Cần làm rõ' },
      { label: 'PHẠM VI V1', value: 'Cần quyết định' }
    ],
    dialogue: 'Đây mới là ý tưởng, chưa phải kế hoạch. Ta còn cần làm rõ luồng sử dụng, đầu vào, đầu ra, phạm vi phiên bản đầu và dấu hiệu hoàn thành. PRD sẽ giữ các quyết định đó trước khi coding agent đề xuất cách xây.',
    choices: [{ label: 'Tìm hiểu PRD', next: 'module-2-prd-concept', primary: true, decision: { key: 'clarificationFocus', value: 'product-requirements' } }]
  },
  'module-2-implementation-too-soon': {
    lessonId: 'module-2',
    checkpointId: 'm2-contentpilot-brief',
    step: 2,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
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
    dialogue: 'Ở Module 2, bạn chỉ cần quyết định sản phẩm cần làm gì. Coding agent sẽ đề xuất cách xây ở implementation plan sau.',
    choices: [{ label: 'Làm rõ yêu cầu sản phẩm', next: 'module-2-prd-concept', primary: true, decision: { key: 'clarificationFocus', value: 'product-requirements' } }]
  },
  'module-2-prd-concept': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-concept',
    step: 3,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu PRD trước khi phân loại',
    objective: 'PRD giữ những quyết định nào?',
    panelLabel: 'PRD MỘT TRANG',
    panelStatus: '8 PHẦN CẦN CÓ',
    tone: 'neutral',
    request: 'Ý tưởng · luồng sử dụng · đầu vào · đầu ra · phạm vi V1 · ngoài phạm vi · Done When · câu hỏi còn mở.',
    evidence: [
      { label: 'MỤC ĐÍCH', value: 'Làm rõ sản phẩm' },
      { label: 'PHẠM VI', value: 'Trong và ngoài V1' },
      { label: 'DONE WHEN', value: 'Kiểm tra được' }
    ],
    dialogue: 'PRD mô tả sản phẩm cần đạt kết quả gì, vì sao sản phẩm cần tồn tại, phạm vi phiên bản đầu và cách nhận biết sản phẩm đã đáp ứng yêu cầu. PRD chưa quyết định code hoặc công nghệ.',
    choices: [{ label: 'Xem một ví dụ PRD', next: 'module-2-prd-example', primary: true }]
  },
  'module-2-prd-example': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-concept',
    step: 3,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu PRD trước khi phân loại',
    objective: 'Từ giả định đến yêu cầu sản phẩm',
    panelLabel: 'VÍ DỤ TỪ ATLASSIAN',
    panelStatus: 'GIẢ ĐỊNH → YÊU CẦU',
    tone: 'neutral',
    request: 'Giả định: phần lớn người dùng truy cập bằng máy tính bảng. Yêu cầu: giao diện phải hiển thị tốt trên máy tính bảng.',
    evidence: [
      { label: 'GIẢ ĐỊNH', value: 'Dùng máy tính bảng' },
      { label: 'YÊU CẦU', value: 'Hiển thị tốt' },
      { label: 'PHẠM VI', value: 'Ghi rõ giới hạn' }
    ],
    dialogue: 'Mẫu PRD của Atlassian còn dành chỗ cho câu hỏi chưa có đáp án và những gì nằm ngoài phạm vi. Nhờ vậy, nhóm biết điều gì đã được quyết định và điều gì chưa được phép tự thêm vào sản phẩm.',
    choices: [{ label: 'Cho coding agent xem ví dụ', next: 'module-2-prd-visual-examples', primary: true }]
  },
  'module-2-prd-visual-examples': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-concept',
    step: 3,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Làm PRD rõ hơn bằng ví dụ',
    objective: 'Cho coding agent xem ví dụ bằng hình ảnh',
    panelLabel: 'VÍ DỤ BẰNG HÌNH ẢNH',
    panelStatus: 'CHỌN ĐÚNG · NÓI RÕ',
    tone: 'neutral',
    request: 'Pinterest: tìm ý tưởng · Mobbin: xem màn hình và luồng thật · Dribbble: xem bản thiết kế giao diện.',
    evidence: [
      { label: 'CHỌN', value: 'Ảnh liên quan' },
      { label: 'NÓI RÕ', value: 'Điều muốn học theo' },
      { label: 'TRÁNH', value: 'Ảnh không liên quan' }
    ],
    dialogue: 'Ảnh chụp hoặc bản thiết kế giúp coding agent nhìn thấy bố cục, cách sắp xếp thông tin và luồng bạn muốn. OpenAI Docs khuyên dùng ảnh rõ ràng và đưa thêm các trạng thái thật sự cần thiết. Khi gửi ảnh, hãy nói rõ bạn muốn học theo phần nào thay vì chỉ bảo “làm giống ảnh này”.',
    choices: [{ label: 'Xem ví dụ bằng code', next: 'module-2-prd-code-examples', primary: true }]
  },
  'module-2-prd-code-examples': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-concept',
    step: 3,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Làm PRD rõ hơn bằng ví dụ',
    objective: 'Cho coding agent xem ví dụ bằng code',
    panelLabel: 'VÍ DỤ BẰNG CODE',
    panelStatus: 'CHỈ ĐÚNG PHẦN CẦN XEM',
    tone: 'neutral',
    request: 'Đoạn HTML · thành phần giao diện · repository có giấy phép phù hợp.',
    evidence: [
      { label: 'CHỈ RÕ', value: 'Tệp hoặc đoạn code' },
      { label: 'MUỐN HỌC', value: 'Cách sắp xếp, hoạt động' },
      { label: 'GIẤY PHÉP', value: 'Kiểm tra trước' }
    ],
    dialogue: 'Một đoạn HTML, một thành phần giao diện hoặc repository có thể cho coding agent thấy cách sắp xếp và cách phần đó hoạt động. Hãy chỉ đúng phần cần xem và nói rõ điều muốn học theo. Ví dụ không bắt agent dùng cùng cách xây. Với repository công khai, hãy kiểm tra giấy phép trước khi dùng lại code.',
    choices: [{ label: 'Làm 3 câu kiểm tra Planning và PRD', next: 'module-2-check-planning-prd-1', primary: true }]
  },
  'module-2-prd-check': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-concept',
    step: 3,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Phân biệt PRD và implementation plan',
    objective: 'Biết tài liệu nào giữ quyết định phạm vi',
    panelLabel: 'HAI TÀI LIỆU',
    panelStatus: 'SẢN PHẨM · CÁCH THỰC HIỆN',
    tone: 'neutral',
    request: 'PRD giữ quyết định về sản phẩm. Implementation plan giữ các bước thực hiện và kiểm tra.',
    evidence: [
      { label: 'PRD', value: 'Sản phẩm cần đạt gì?' },
      { label: 'PLAN', value: 'Thực hiện thế nào?' },
      { label: 'THỨ TỰ', value: 'PRD trước' }
    ],
    dialogue: 'Câu “Phiên bản đầu chưa tự động đăng bài” thuộc tài liệu nào?',
    choices: [
      { label: 'Implementation plan', next: 'module-2-prd-misclassification', danger: true },
      { label: 'PRD · Đây là quyết định phạm vi', next: 'module-2-prd-interview', primary: true, decision: { key: 'prdClassification', value: 'scope-in-prd' } }
    ]
  },
  'module-2-prd-misclassification': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-concept',
    step: 3,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
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
    choices: [{ label: 'Đưa vào PRD', next: 'module-2-prd-interview', primary: true, decision: { key: 'prdClassification', value: 'scope-in-prd' } }]
  },
  'module-2-prd-interview': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-interview',
    step: 4,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu prompt trước khi tự viết',
    objective: 'Một prompt planning cần nói rõ điều gì?',
    panelLabel: '5 CÂU HỎI DỄ NHỚ',
    panelStatus: 'LỜI GIAO VIỆC RÕ RÀNG',
    tone: 'neutral',
    request: 'Muốn agent làm gì? · Agent cần biết gì? · Làm việc thế nào? · Không được tự làm gì? · Kết quả cần có gì?',
    evidence: [
      { label: 'VIỆC CẦN LÀM', value: 'Nói rõ' },
      { label: 'CÁCH LÀM VIỆC', value: 'Nói rõ' },
      { label: 'KẾT QUẢ CUỐI', value: 'Nói rõ' }
    ],
    dialogue: 'Prompt là lời giao việc cho coding agent. Prompt engineering là cách làm lời giao việc đó đủ rõ để agent hiểu đúng và trả lại kết quả bạn có thể kiểm tra. Không phải prompt nào cũng cần dài; năm câu hỏi này hữu ích khi công việc có nhiều quyết định.',
    choices: [{ label: 'Xem một prompt có nguồn', next: 'module-2-prompt-example', primary: true }]
  },
  'module-2-prompt-example': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-interview',
    step: 4,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu prompt trước khi tự viết',
    objective: 'Nhìn thấy từng phần trong một prompt',
    panelLabel: 'VÍ DỤ TỪ OPENAI DOCS',
    panelStatus: 'VIỆC LÀM · BẰNG CHỨNG · KẾT QUẢ',
    tone: 'neutral',
    request: 'Xem xét kế hoạch chuyển dữ liệu · tìm nguy cơ mất dữ liệu hoặc gián đoạn · dẫn lại bước liên quan · xếp năm rủi ro quan trọng nhất.',
    evidence: [
      { label: 'VIỆC CẦN LÀM', value: 'Xem xét kế hoạch' },
      { label: 'ĐIỀU CẦN TÌM', value: 'Nguy cơ cụ thể' },
      { label: 'KẾT QUẢ', value: '5 rủi ro có thứ tự' }
    ],
    dialogue: 'Tài liệu chính thức của OpenAI dùng ví dụ này để cho thấy một prompt hướng đến kết quả: agent biết phải làm gì, cần dựa vào bằng chứng nào và phải trình bày kết quả ra sao. Khóa học chuyển nguyên tắc đó thành năm câu hỏi dành cho người mới.',
    choices: [{ label: 'Áp dụng vào ContentPilot', next: 'module-2-prompt-guided-practice', primary: true }]
  },
  'module-2-prompt-guided-practice': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-interview',
    step: 4,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu prompt trước khi tự viết',
    objective: 'Chuẩn bị prompt phỏng vấn PRD',
    panelLabel: 'CONTENTPILOT · 5 CÂU TRẢ LỜI',
    panelStatus: 'SẴN SÀNG TỰ VIẾT',
    tone: 'neutral',
    request: 'Tạo PRD · biết ý tưởng ban đầu · hỏi một câu mỗi lượt · không tự quyết định hoặc viết code · PRD một trang có tám phần.',
    evidence: [
      { label: 'CÁCH TRAO ĐỔI', value: 'Một câu mỗi lượt', ready: true },
      { label: 'KHÔNG ĐƯỢC LÀM', value: 'Tự quyết định, viết code', ready: true },
      { label: 'KẾT QUẢ CUỐI', value: 'PRD đủ 8 phần', ready: true }
    ],
    dialogue: 'Bạn đã được học khái niệm, xem ví dụ và đối chiếu năm câu hỏi với ContentPilot. Tiếp theo là ba câu kiểm tra ngắn. Sau đó, bạn mới dùng năm câu hỏi để viết prompt tạo PRD bằng lời của mình.',
    choices: [{ label: 'Làm 3 câu kiểm tra Prompt engineering', next: 'module-2-check-prompt-1', primary: true }]
  },
  'module-2-prd-approved': {
    lessonId: 'module-2',
    checkpointId: 'm2-prd-approved',
    step: 5,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Review và duyệt PRD',
    objective: 'Biết một PRD tốt trông như thế nào',
    panelLabel: 'PRD MỘT TRANG',
    panelStatus: '8 PHẦN ĐÃ REVIEW',
    tone: 'good',
    request: 'Ý tưởng · luồng sử dụng · đầu vào · đầu ra · phạm vi V1 · ngoài phạm vi · Done When · câu hỏi còn mở.',
    evidence: [
      { label: 'DONE WHEN', value: 'Kiểm tra được', ready: true },
      { label: 'CHI TIẾT CODE', value: 'Không có', ready: true },
      { label: 'QUYỀN DUYỆT', value: 'Thuộc về bạn', ready: true }
    ],
    dialogue: 'PRD tốt đủ rõ để giữ sản phẩm đi đúng hướng nhưng chưa quyết định cách viết code. Hãy duyệt sau khi bạn đã kiểm tra đủ tám phần.',
    choices: [{ label: 'Duyệt PRD đã xem xét', next: 'module-2-implementation-plan', primary: true, decision: { key: 'prdApproval', value: 'reviewed-eight-sections' } }]
  },
  'module-2-implementation-plan': {
    lessonId: 'module-2',
    checkpointId: 'm2-implementation-plan',
    step: 6,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu implementation plan trước khi tạo',
    objective: 'Plan biến PRD thành các bước như thế nào?',
    panelLabel: 'MỖI BƯỚC TRONG PLAN',
    panelStatus: '4 TRƯỜNG BẮT BUỘC',
    tone: 'neutral',
    request: 'Mục tiêu · thành phần hoặc tệp · kết quả quan sát được · cách kiểm tra.',
    evidence: [
      { label: 'NGUỒN PHẠM VI', value: 'PRD đã duyệt', ready: true },
      { label: 'THỨ TỰ', value: 'Bước nhỏ, có phụ thuộc' },
      { label: 'CODE', value: 'Chưa viết' }
    ],
    dialogue: 'PRD giữ điều sản phẩm cần đạt. Implementation plan biến yêu cầu đã duyệt thành các bước xây dựng có thứ tự. Bạn chưa cần biết tên file; coding agent phải đề xuất và giải thích bằng ngôn ngữ dành cho người mới.',
    choices: [{ label: 'Xem PRD trở thành plan', next: 'module-2-implementation-plan-example', primary: true }]
  },
  'module-2-implementation-plan-example': {
    lessonId: 'module-2',
    checkpointId: 'm2-implementation-plan',
    step: 6,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Hiểu implementation plan trước khi tạo',
    objective: 'Nối yêu cầu sản phẩm với cách kiểm tra',
    panelLabel: 'VÍ DỤ ATLASSIAN → MICROSOFT',
    panelStatus: 'YÊU CẦU → BƯỚC → KIỂM TRA',
    tone: 'neutral',
    request: 'PRD: hiển thị tốt trên máy tính bảng. Plan: chỉnh bố cục và kiểm tra ở chiều rộng máy tính bảng.',
    evidence: [
      { label: 'YÊU CẦU PRD', value: 'Hỗ trợ máy tính bảng' },
      { label: 'BƯỚC PLAN', value: 'Chỉnh bố cục' },
      { label: 'BẰNG CHỨNG', value: 'Kiểm tra chiều rộng' }
    ],
    dialogue: 'Mẫu thiết kế công việc của Microsoft tách rõ phạm vi, phương án, thành phần cần thay đổi và câu hỏi còn mở. Khóa học rút gọn thành từng bước có mục tiêu, thành phần, kết quả quan sát và cách kiểm tra.',
    choices: [{ label: 'Làm 2 câu kiểm tra Implementation plan', next: 'module-2-check-plan-1', primary: true }]
  },
  'module-2-alignment-review': {
    lessonId: 'module-2',
    checkpointId: 'm2-alignment-review',
    step: 7,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
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
      { label: 'Giữ lại vì agent đã đề xuất', next: 'module-2-alignment-mismatch', danger: true },
      { label: 'Loại bước đăng bài khỏi plan', next: 'module-2-planning-package', primary: true, decision: { key: 'alignmentDecision', value: 'remove-scope-creep' } }
    ]
  },
  'module-2-alignment-mismatch': {
    lessonId: 'module-2',
    checkpointId: 'm2-alignment-review',
    step: 7,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
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
    choices: [{ label: 'Loại scope creep', next: 'module-2-planning-package', primary: true, decision: { key: 'alignmentDecision', value: 'remove-scope-creep' } }]
  },
  'module-2-planning-package': {
    lessonId: 'module-2',
    checkpointId: 'm2-planning-package',
    step: 8,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
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
      { label: 'Xem lại Module 2', action: 'review-module' },
      { label: 'Sang Codex tạo planning package', action: 'practice', primary: true }
    ]
  },
  'module-2-mastery': {
    lessonId: 'module-2',
    checkpointId: 'm2-mastery',
    step: 9,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Kiểm tra tổng hợp Module 2',
    objective: 'Sẵn sàng cho 15 câu kiểm tra cuối',
    panelLabel: 'KIỂM TRA CUỐI MODULE',
    panelStatus: '15 CÂU · CẦN ĐẠT 80%',
    tone: 'good',
    request: 'PRD.md đã duyệt · implementation-plan.md đã duyệt · mọi Done When có cách kiểm tra tương ứng.',
    evidence: [
      { label: 'PRD', value: 'Đã duyệt', ready: true },
      { label: 'PLAN', value: 'Đã duyệt', ready: true },
      { label: 'ALIGNMENT', value: 'Khớp', ready: true }
    ],
    dialogue: 'Bạn đã học đủ bốn vùng kiến thức và hoàn thành planning package. Phần cuối gồm mười câu lựa chọn, ba câu trả lời ngắn và hai câu đối chiếu artifact của chính bạn. Nguồn cùng lời giải sẽ hiện sau mỗi câu.',
    choices: [{ label: 'Bắt đầu 15 câu kiểm tra cuối', next: 'module-2-final-1', primary: true }]
  },
  'module-2-mastery-repair': {
    lessonId: 'module-2',
    checkpointId: 'm2-mastery',
    step: 9,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
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
    choices: [{ label: 'Duyệt bằng artifact và alignment', next: 'module-2-complete', primary: true, decision: { key: 'masteryEvidence', value: 'artifacts-approved-and-aligned' } }]
  },
  'module-2-complete': {
    lessonId: 'module-2',
    checkpointId: 'm2-complete',
    step: 10,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Planning trước implementation',
    objective: 'Module 2 đã hoàn thành',
    panelLabel: 'PLANNING PACKAGE',
    panelStatus: 'SẴN SÀNG CHO MODULE 3',
    tone: 'good',
    request: 'Bạn đã biến một ý tưởng một câu thành PRD và implementation plan đủ rõ để bắt đầu xây.',
    evidence: [
      { label: 'PRD', value: 'Đã duyệt', ready: true },
      { label: 'PLAN', value: 'Đã duyệt', ready: true },
      { label: 'BƯỚC TIẾP', value: 'Implementation & debugging', ready: true }
    ],
    dialogue: 'Ở Module 3, hai tài liệu này sẽ là điểm xuất phát cho implementation và debugging. Module 2 dừng ở đây, trước khi viết code.',
    choices: [{ label: 'Về Home Base', action: 'home', primary: true }]
  }
}

function assessmentScene(question: AssessmentQuestion, group: AssessmentGroup, index: number): SceneContent {
  const isSetupFinal = group.id === 'setup-final-assessment'
  const isFinal = group.id === 'final-assessment'
  const isPlanAlignment = group.id === 'implementation-plan-check' && index === 1
  const checkpointId: CheckpointId = isSetupFinal
    ? 'm1-mastery'
    : isFinal
    ? 'm2-mastery'
    : group.id === 'planning-prd-check'
      ? 'm2-prd-concept'
      : group.id === 'prompt-check'
        ? 'm2-prd-interview'
        : isPlanAlignment
          ? 'm2-alignment-review'
          : 'm2-implementation-plan'
  const step = isSetupFinal ? 7 : isFinal ? 9 : group.id === 'planning-prd-check' ? 3 : group.id === 'prompt-check' ? 4 : 7
  const questionType = question.type === 'multiple-choice'
    ? 'Chọn một đáp án'
    : question.type === 'artifact-answer'
      ? 'Đối chiếu artifact'
      : 'Trả lời ngắn'

  return {
    lessonId: isSetupFinal ? 'module-1' : 'module-2',
    checkpointId,
    step,
    totalSteps: isSetupFinal ? 8 : 10,
    lessonLabel: isSetupFinal ? 'MODULE 1 · THIẾT LẬP CODEX' : 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: group.title,
    objective: `Câu ${index + 1}/${group.questions.length}`,
    panelLabel: group.mode === 'mastery' ? 'KIỂM TRA TỔNG HỢP' : 'KIỂM TRA THEO CỤM',
    panelStatus: `CÂU ${index + 1}/${group.questions.length}`,
    tone: 'neutral',
    request: 'Trả lời trước. Lời giải và nguồn chính thức sẽ hiện ngay sau đó.',
    evidence: [
      { label: 'HÌNH THỨC', value: questionType },
      { label: 'NGUỒN', value: 'Hiện sau khi trả lời' },
      { label: 'TIẾN ĐỘ', value: `${index + 1}/${group.questions.length}` }
    ],
    dialogue: question.prompt,
    choices: [],
    assessmentQuestionId: question.id,
    assessmentGroupId: group.id
  }
}

const generatedAssessmentScenes = Object.fromEntries(
  assessmentGroups.flatMap((group) =>
    group.questions.map((question, index) => [question.sceneId, assessmentScene(question, group, index)])
  )
) as Partial<Record<SceneId, SceneContent>>

const scenes = {
  ...staticScenes,
  ...generatedAssessmentScenes,
  'module-1-final-summary': {
    lessonId: 'module-1',
    checkpointId: 'm1-mastery',
    step: 7,
    totalSteps: 8,
    lessonLabel: 'MODULE 1 · THIẾT LẬP CODEX',
    mission: 'Kết quả kiểm tra thiết lập Codex',
    objective: 'Đối chiếu kết quả trước khi hoàn thành',
    panelLabel: 'KẾT QUẢ',
    panelStatus: '5 CÂU · MỐC ĐẠT 4/5',
    tone: 'neutral',
    request: 'Mỗi câu đúng hoặc tự đối chiếu đạt được tính một điểm.',
    evidence: [],
    dialogue: '',
    choices: [],
    assessmentGroupId: 'setup-final-assessment',
    assessmentSummary: true
  },
  'module-2-final-summary': {
    lessonId: 'module-2',
    checkpointId: 'm2-mastery',
    step: 9,
    totalSteps: 10,
    lessonLabel: 'MODULE 2 · PLANNING, PRD VÀ PROMPT',
    mission: 'Kết quả kiểm tra tổng hợp',
    objective: 'Đối chiếu kết quả trước khi hoàn thành',
    panelLabel: 'KẾT QUẢ',
    panelStatus: '15 CÂU · MỐC ĐẠT 12/15',
    tone: 'neutral',
    request: 'Mỗi câu đúng hoặc tự đối chiếu đạt được tính một điểm.',
    evidence: [],
    dialogue: '',
    choices: [],
    assessmentGroupId: 'final-assessment',
    assessmentSummary: true
  }
} as Record<SceneId, SceneContent>

type CourseLessonDefinition = {
  id: CourseLessonId
  titleVi: string
}

type LearningPosition = {
  lessonId: CourseLessonId
  lessonTitle: string
  lessonIndex: number
  totalLessons: number
  page: number
  totalPages: number
}

const introModule = courseStructure.modules.find((module) => module.id === 'intro')
const setupModule = courseStructure.modules.find((module) => module.id === 'module-1')
const planningModule = courseStructure.modules.find((module) => module.id === 'module-2')

const courseLessonDefinitions: CourseLessonDefinition[] = [
  ...(introModule?.lessons ?? []).map((lesson) => ({
    id: lesson.id as CourseLessonId,
    titleVi: lesson.titleVi
  })),
  ...(setupModule?.lessons ?? []).map((lesson) => ({
    id: lesson.id as CourseLessonId,
    titleVi: lesson.titleVi
  })),
  ...(planningModule?.lessons ?? []).map((lesson) => ({
    id: lesson.id as CourseLessonId,
    titleVi: lesson.titleVi
  }))
]
const courseLessonTitle = new Map(
  courseLessonDefinitions.map((lesson) => [lesson.id, lesson.titleVi])
)
const moduleLessonIds: Record<'module-1' | 'module-2', CourseLessonId[]> = {
  'module-1': setupModule?.lessons?.map((lesson) => lesson.id as CourseLessonId) ?? [],
  'module-2': planningModule?.lessons?.map((lesson) => lesson.id as CourseLessonId) ?? []
}

const lessonVisuals: Partial<Record<CourseLessonId, LessonVisual>> = {
  'm1-understand-codex': {
    image: m1UnderstandCodexImage,
    alt: 'Giao diện Codex hiển thị danh sách công việc, dự án đang mở và ô nhập yêu cầu'
  },
  'm1-workspace-permissions': {
    image: m1ApprovalMenuImage,
    alt: 'Menu approval của Codex hiển thị Ask for approval, Approve for me và Full access'
  },
  'm1-agents-guidance': {
    image: m1AgentsGuidanceImage,
    alt: 'Tài liệu OpenAI minh họa một lớp chỉ dẫn mà Codex dùng khi làm việc trong dự án'
  },
  'm1-skills-and-checklist': {
    image: m1ModelSettingsImage,
    alt: 'Menu Codex hiển thị model 5.6 Sol, Effort High và Speed Standard'
  },
  'm1-assessment': {
    image: m1AssessmentImage,
    alt: 'Giao diện Codex hiển thị kết quả, các tệp đã tạo và những điểm cần người dùng kiểm tra'
  },
  'm2-when-to-plan': {
    image: m2WhenToPlanImage,
    alt: 'Codex trình bày cách tiếp cận và những nguồn sẽ kiểm tra trước khi hành động'
  },
  'm2-product-requirements': {
    image: m2ProductRequirementsImage,
    alt: 'Một yêu cầu tạo PRD nêu vấn đề, người dùng, phạm vi, rủi ro và câu hỏi còn mở'
  },
  'm2-prd-prompt': {
    image: m2PrdPromptImage,
    alt: 'Codex giải thích kế hoạch thu thập bằng chứng trước khi soạn tài liệu PRD'
  },
  'm2-prd-review': {
    image: m2PrdReviewImage,
    alt: 'Tài liệu PRD được mở cạnh cuộc trao đổi với Codex để người dùng xem xét'
  },
  'm2-implementation-plan': {
    image: m2ImplementationPlanImage,
    alt: 'Tài liệu hiển thị bảng mốc triển khai, quyết định và nội dung cần kiểm tra'
  },
  'm2-assessment': {
    image: m2AssessmentImage,
    alt: 'Codex và tài liệu hoàn chỉnh được đặt cạnh nhau để người dùng đối chiếu trước khi duyệt'
  }
}

const sceneVisuals: Partial<Record<SceneId, LessonVisual>> = {
  'module-1-codex-examples': {
    image: m1ApprovalMenuImage,
    alt: 'Menu Approval của Codex hiển thị Ask for approval, Approve for me và Full access',
    fit: 'contain'
  },
  'module-1-codex-model-intro': {
    image: m1ModelSettingsImage,
    alt: 'Menu Codex hiển thị Model 5.6 Sol, Effort High và Speed Standard'
  },
  'module-1-codex-slash-commands': {
    image: m1SlashCommandsImage,
    alt: 'Danh sách lệnh mở trong Codex sau khi người dùng nhập dấu gạch chéo vào ô soạn tin'
  },
  'module-1-reasoning-effort': {
    image: m1ReasoningLevelsImage,
    alt: 'Menu Effort của Codex hiển thị Light, Medium, High, Extra High và Ultra'
  }
}

const courseLessonPages: Record<CourseLessonId, SceneId[][]> = {
  'intro-overview': [
    ['intro-visual-onboarding'],
    ['intro-course-overview-2'],
    ['intro-learning-method']
  ],
  'm1-understand-codex': [
    ['module-1-codex-orientation'],
    ['module-1-codex-examples'],
    ['module-1-codex-model-intro'],
    ['module-1-codex-slash-commands']
  ],
  'm1-workspace-permissions': [
    ['module-1-permissions'],
    ['module-1-approval-choice']
  ],
  'm1-agents-guidance': [
    ['module-1-agents-guidance'],
    ['module-1-harness-intro'],
    ['module-1-harness-codex'],
    ['module-1-skills']
  ],
  'm1-skills-and-checklist': [
    ['module-1-model-choice'],
    ['module-1-model-use-cases'],
    ['module-1-reasoning-effort'],
    ['module-1-project-setup']
  ],
  'm1-assessment': [
    ['module-1-setup-checklist'],
    ['module-1-mastery'],
    ['module-1-complete']
  ],
  'm2-when-to-plan': [
    ['module-2-why-planning'],
    ['module-2-planning-example'],
    ['module-2-why-planning-check', 'module-2-planning-cost'],
    ['module-2-contentpilot-brief', 'module-2-implementation-too-soon']
  ],
  'm2-product-requirements': [
    ['module-2-prd-concept'],
    ['module-2-prd-example'],
    ['module-2-prd-visual-examples'],
    ['module-2-prd-code-examples'],
    ['module-2-check-planning-prd-1'],
    ['module-2-check-planning-prd-2'],
    ['module-2-check-planning-prd-3'],
    ['module-2-prd-check', 'module-2-prd-misclassification']
  ],
  'm2-prd-prompt': [
    ['module-2-prd-interview'],
    ['module-2-prompt-example'],
    ['module-2-prompt-guided-practice'],
    ['module-2-check-prompt-1'],
    ['module-2-check-prompt-2'],
    ['module-2-check-prompt-3']
  ],
  'm2-prd-review': [['module-2-prd-approved']],
  'm2-implementation-plan': [
    ['module-2-implementation-plan'],
    ['module-2-implementation-plan-example'],
    ['module-2-check-plan-1'],
    ['module-2-check-plan-2'],
    ['module-2-alignment-review', 'module-2-alignment-mismatch'],
    ['module-2-planning-package']
  ],
  'm2-assessment': [
    ['module-2-mastery'],
    ['module-2-final-1'],
    ['module-2-final-2'],
    ['module-2-final-3'],
    ['module-2-final-4'],
    ['module-2-final-5'],
    ['module-2-final-6'],
    ['module-2-final-7'],
    ['module-2-final-8'],
    ['module-2-final-9'],
    ['module-2-final-10'],
    ['module-2-final-11'],
    ['module-2-final-12'],
    ['module-2-final-13'],
    ['module-2-final-14'],
    ['module-2-final-15'],
    ['module-2-final-summary', 'module-2-mastery-repair'],
    ['module-2-complete']
  ]
}

const learningPositionByScene = Object.fromEntries(
  Object.entries(courseLessonPages).flatMap(([lessonId, pages]) => {
    const typedLessonId = lessonId as CourseLessonId
    const moduleId = typedLessonId.startsWith('m1-') ? 'module-1' : 'module-2'
    const lessonIds = typedLessonId === 'intro-overview' ? ['intro-overview'] : moduleLessonIds[moduleId]
    const lessonIndex = lessonIds.indexOf(typedLessonId) + 1
    const totalLessons = lessonIds.length
    return pages.flatMap((scenePage, pageIndex) =>
      scenePage.map((sceneId) => [sceneId, {
        lessonId: typedLessonId,
        lessonTitle: courseLessonTitle.get(typedLessonId) ?? scenes[sceneId].mission,
        lessonIndex,
        totalLessons,
        page: pageIndex + 1,
        totalPages: pages.length
      } satisfies LearningPosition])
    )
  })
) as Record<SceneId, LearningPosition>

type View = 'loading' | 'welcome' | 'resume' | 'app' | 'reset-confirm' | 'reset-required' | 'error'
type AppDestination = 'home' | 'lesson' | 'progress' | 'settings'
type ApprovalFocus = 'ask' | 'approve' | 'full'

const sceneStyle = { '--pixel-room-image': `url("${roomImage}")` } as CSSProperties

function initialUpdate(): ProgressUpdate {
  return {
    currentLessonId: 'intro',
    currentCourseLessonId: 'intro-overview',
    checkpointId: 'intro-visual-onboarding',
    sceneId: 'intro-visual-onboarding',
    sceneHistory: [],
    completedCheckpointIds: [],
    decisions: {}
  }
}

function emptyPracticeState(): PracticeState {
  return { missionId: 'm2-planning-package', status: 'idle' }
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

function ApprovalTerm({
  activeFocus,
  children,
  focus,
  onSelect
}: {
  activeFocus: ApprovalFocus | null
  children: string
  focus: ApprovalFocus
  onSelect: (focus: ApprovalFocus) => void
}) {
  return (
    <button
      aria-label={`Làm nổi bật ${children} trong ảnh minh họa`}
      aria-pressed={activeFocus === focus}
      className={`pixel-approval-term${activeFocus === focus ? ' is-active' : ''}`}
      data-approval-focus={focus}
      type="button"
      onClick={() => onSelect(focus)}
    >
      {children}
    </button>
  )
}

function ApprovalTourDialogue({
  activeFocus,
  onSelect
}: {
  activeFocus: ApprovalFocus | null
  onSelect: (focus: ApprovalFocus) => void
}) {
  return (
    <>
      Được rồi, vậy chúng ta sẽ bắt đầu tìm hiểu Codex cùng nhau nha. Đầu tiên, hãy nhìn qua Approval. Khi nhấn vào biểu tượng Codex bên trái dấu cộng, bạn sẽ thấy một hộp gồm ba lựa chọn. Đây là phần cài đặt Approval, nơi bạn thiết lập mức độ kiểm soát đối với coding agent.
      <br /><br />
      Trước tiên, <ApprovalTerm activeFocus={activeFocus} focus="ask" onSelect={onSelect}>Ask for approval</ApprovalTerm> luôn hỏi bạn trước khi chỉnh sửa tệp bên ngoài dự án hoặc sử dụng Internet. Tiếp theo, <ApprovalTerm activeFocus={activeFocus} focus="approve" onSelect={onSelect}>Approve for me</ApprovalTerm> chỉ hỏi khi phát hiện một hành động có thể không an toàn. Cuối cùng, <ApprovalTerm activeFocus={activeFocus} focus="full" onSelect={onSelect}>Full access</ApprovalTerm> cho phép Codex truy cập Internet và mọi tệp trên máy tính mà không bị giới hạn.
      <br /><br />
      Nếu mới bắt đầu, mình khuyên bạn dùng <ApprovalTerm activeFocus={activeFocus} focus="approve" onSelect={onSelect}>Approve for me</ApprovalTerm>. Chế độ này không yêu cầu bạn duyệt mọi hành động, nhưng cũng không trao toàn bộ quyền kiểm soát cho coding agent.
    </>
  )
}

function LessonVisualMedia({
  activeFocus,
  isApprovalTour,
  visual
}: {
  activeFocus: ApprovalFocus | null
  isApprovalTour: boolean
  visual: LessonVisual
}) {
  if (!isApprovalTour) {
    return (
      <img
        src={visual.image}
        alt={visual.alt}
        data-fit={visual.fit ?? 'cover'}
        decoding="async"
        fetchPriority="high"
      />
    )
  }

  return (
    <div className={`pixel-approval-frame${activeFocus ? ' is-manual' : ''}`}>
      <img
        src={visual.image}
        alt={visual.alt}
        data-fit={visual.fit ?? 'cover'}
        decoding="async"
        fetchPriority="high"
      />
      <span className={`pixel-approval-focus${activeFocus === 'ask' ? ' is-active' : ''}`} data-approval-focus="ask" aria-hidden="true"><small>1/3</small></span>
      <span className={`pixel-approval-focus${activeFocus === 'approve' ? ' is-active' : ''}`} data-approval-focus="approve" aria-hidden="true"><small>2/3</small></span>
      <span className={`pixel-approval-focus${activeFocus === 'full' ? ' is-active' : ''}`} data-approval-focus="full" aria-hidden="true"><small>3/3</small></span>
    </div>
  )
}

function LessonVisualLightbox({
  activeFocus,
  isApprovalTour,
  onClose,
  visual
}: {
  activeFocus: ApprovalFocus | null
  isApprovalTour: boolean
  onClose: () => void
  visual: LessonVisual
}) {
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
        return
      }
      if (event.key === 'Tab') {
        event.preventDefault()
        closeButtonRef.current?.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    closeButtonRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      previousFocus?.focus()
    }
  }, [])

  return (
    <div className="pixel-visual-lightbox" onClick={onClose}>
      <section
        aria-label="Ảnh minh họa phóng to"
        aria-modal="true"
        className="pixel-visual-lightbox__panel"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          aria-label="Đóng ảnh phóng to"
          className="pixel-visual-lightbox__close"
          type="button"
          onClick={onClose}
        >
          ĐÓNG
        </button>
        <div className="pixel-visual-lightbox__media">
          <LessonVisualMedia
            activeFocus={activeFocus}
            isApprovalTour={isApprovalTour}
            visual={visual}
          />
        </div>
      </section>
    </div>
  )
}

function AssessmentControls({
  question,
  result,
  busy,
  continueLabel,
  onConfirmWritten,
  onChoose,
  onContinue
}: {
  question: AssessmentQuestion
  result?: string
  busy: boolean
  continueLabel: string
  onConfirmWritten: () => void
  onChoose: (index: number) => void
  onContinue: () => void
}) {
  const [draft, setDraft] = useState('')
  const [reviewing, setReviewing] = useState(false)
  const answered = Boolean(result)
  const correct = result?.startsWith('correct') ?? false
  const showFeedback = answered || reviewing

  return (
    <div className="pixel-assessment">
      {question.type === 'multiple-choice' && !answered ? (
        <div className="pixel-assessment-options">
          {question.choices.map((choice, index) => (
            <button disabled={busy} key={choice} type="button" onClick={() => onChoose(index)}>
              <span aria-hidden="true">{String.fromCharCode(65 + index)}</span>{choice}
            </button>
          ))}
        </div>
      ) : null}

      {question.type !== 'multiple-choice' && !answered ? (
        <div className="pixel-assessment-written">
          <label htmlFor={`assessment-${question.id}`}>Câu trả lời của bạn</label>
          <textarea
            id={`assessment-${question.id}`}
            disabled={busy || reviewing}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Viết bằng lời của bạn trước khi xem tiêu chí…"
            rows={4}
            value={draft}
          />
          {!reviewing ? (
            <button disabled={busy || draft.trim().length < 20} type="button" onClick={() => setReviewing(true)}>
              Đối chiếu với tiêu chí
            </button>
          ) : null}
        </div>
      ) : null}

      {showFeedback ? (
        <section className="pixel-assessment-feedback" data-result={answered ? (correct ? 'correct' : 'incorrect') : 'review'}>
          <strong>
            {answered
              ? correct
                ? 'Đã đáp ứng'
                : 'Chưa đúng ở lần trả lời này'
              : 'Tự đối chiếu trước khi tiếp tục'}
          </strong>
          <p>{question.explanation}</p>
          {question.type !== 'multiple-choice' ? (
            <ul>
              {question.criteria.map((criterion) => <li key={criterion}>{criterion}</li>)}
            </ul>
          ) : null}
          <div className="pixel-assessment-source">
            <small>NGUỒN CHÍNH THỨC</small>
            <strong>{question.source.label}</strong>
            <p>{question.source.basis}</p>
            <code>{question.source.url}</code>
          </div>
          {answered ? (
            <button className="is-primary" disabled={busy} type="button" onClick={onContinue}>
              {continueLabel}
            </button>
          ) : (
            <div className="pixel-assessment-review-actions">
              <button disabled={busy} type="button" onClick={() => setReviewing(false)}>Viết lại</button>
              <button className="is-primary" disabled={busy} type="button" onClick={onConfirmWritten}>
                Câu trả lời đáp ứng đủ tiêu chí
              </button>
            </div>
          )}
        </section>
      ) : null}
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
  const learningPosition = progress ? learningPositionByScene[progress.sceneId] : null
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
        : `${learningPosition?.lessonTitle ?? scene?.lessonLabel ?? 'BÀI HỌC'} · ${scene?.objective ?? progress?.checkpointId}`

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
            <span>{progress.currentLessonId === 'intro'
              ? 'PHẦN GIỚI THIỆU'
              : `${progress.currentLessonId === 'module-1' ? 'MODULE 1' : 'MODULE 2'} · BÀI ${learningPosition?.lessonIndex}/${learningPosition?.totalLessons}`}</span>
            <strong>{learningPosition?.lessonTitle ?? scene?.mission}</strong>
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
  modelChoice: 'Cấu hình ContentPilot',
  approvalApproach: 'Thiết lập approval',
  guidanceBoundary: 'Ranh giới hướng dẫn',
  skillBoundary: 'Cách dùng Skill',
  setupChecklist: 'Checklist thiết lập',
  setupMastery: 'Kết quả Module 1',
  setupModuleMigration: 'Module 1',
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
  'sol-high-standard': '5.6 Sol · High · Standard',
  'approve-for-me-no-full-access': 'Approve for me · Full access tắt',
  'teacher-reviewed-setup': 'Triết đã duyệt bằng chứng cấu hình',
  'recommended-default': 'Giữ thiết lập được đề xuất',
  'learner-selected': 'Dùng thiết lập do người học chọn',
  'review-purpose-source-impact': 'Xem mục đích, nguồn và tác động trước khi duyệt',
  'durable-vs-task-specific': 'AGENTS.md cho quy tắc bền vững; prompt cho task hiện tại',
  'repeatable-workflow': 'Skill cho quy trình có thể tái sử dụng',
  'reviewed-in-companion': 'Đã xem lại trong Course Companion',
  'passed-four-of-five': 'Đạt ít nhất 4/5 câu',
  'continued-existing-planning-progress': 'Đã chuyển tiếp từ lộ trình Planning cũ',
  'plan-first': 'Planning trước khi code',
  'product-requirements': 'Luồng sử dụng, đầu vào, đầu ra và phạm vi V1',
  'scope-in-prd': 'Quyết định phạm vi thuộc PRD',
  'one-question-at-a-time': 'Một câu hỏi mỗi lượt',
  'reviewed-eight-sections': 'Đã xem xét đủ tám phần',
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
  const learningPosition = learningPositionByScene[progress.sceneId]
  const completed = new Set(progress.completedCheckpointIds)
  if (progress.sceneId === 'module-1-complete' || progress.sceneId === 'module-2-complete') {
    completed.add(progress.checkpointId)
  }
  const progressPercent = Math.round((completed.size / checkpointIds.length) * 100)
  const currentModuleId = progress.currentLessonId === 'intro' ? 'module-1' : progress.currentLessonId
  const moduleOneComplete = completed.has('m1-complete')
  const moduleOneMigrated = progress.decisions.setupModuleMigration === 'continued-existing-planning-progress'
  const moduleTwoComplete = completed.has('m2-complete')
  const moduleOneLessonCount = setupModule?.lessons?.length ?? 5
  const moduleTwoLessonCount = planningModule?.lessons?.length ?? 6
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
              {currentModuleId === 'module-1' ? (
                <button className={`pixel-roadmap-stage is-current${moduleOneComplete ? ' is-complete' : ''}`} type="button" onClick={() => onNavigate('lesson')}>
                  <span>01</span><div><small>MODULE 1 · {moduleOneLessonCount} BÀI HỌC</small><strong>{setupModule?.titleVi ?? 'Bắt đầu làm việc với Codex'}</strong><p>Bài {learningPosition.lessonIndex}/{moduleOneLessonCount} · {learningPosition.lessonTitle} · Trang {learningPosition.page}/{learningPosition.totalPages}</p></div><em>{moduleOneComplete ? 'HOÀN THÀNH' : <><span>BẠN ĐANG Ở ĐÂY</span><b>MỞ BÀI HỌC →</b></>}</em>
                </button>
              ) : (
                <article className={moduleOneMigrated ? 'is-migrated' : 'is-complete'}>
                  <span>01</span><div><small>MODULE 1 · {moduleOneLessonCount} BÀI HỌC</small><strong>{setupModule?.titleVi ?? 'Bắt đầu làm việc với Codex'}</strong><p>{moduleOneMigrated ? 'Tiến độ Planning cũ được giữ nguyên; học phần setup không được tự đánh dấu hoàn thành.' : 'Bạn đã hoàn tất nền tảng làm việc với Codex.'}</p></div><em>{moduleOneMigrated ? 'ĐÃ CHUYỂN TIẾP' : 'HOÀN THÀNH'}</em>
                </article>
              )}
              {currentModuleId === 'module-2' ? (
                <button className={`pixel-roadmap-stage is-current${moduleTwoComplete ? ' is-complete' : ''}`} type="button" onClick={() => onNavigate('lesson')}>
                  <span>02</span><div><small>MODULE 2 · {moduleTwoLessonCount} BÀI HỌC</small><strong>{planningModule?.titleVi ?? 'Giao tiếp hiệu quả với coding agent: Planning, PRD và prompt'}</strong><p>Bài {learningPosition.lessonIndex}/{moduleTwoLessonCount} · {learningPosition.lessonTitle} · Trang {learningPosition.page}/{learningPosition.totalPages}</p></div><em>{moduleTwoComplete ? 'HOÀN THÀNH' : <><span>BẠN ĐANG Ở ĐÂY</span><b>MỞ BÀI HỌC →</b></>}</em>
                </button>
              ) : (
                <article className="is-locked">
                  <span>02</span><div><small>MODULE 2 · {moduleTwoLessonCount} BÀI HỌC</small><strong>{planningModule?.titleVi ?? 'Giao tiếp hiệu quả với coding agent: Planning, PRD và prompt'}</strong><p>Hoàn thành Module 1 để mở phần Planning.</p></div><em>SẮP TỚI</em>
                </article>
              )}
              {futureModules.map((title, index) => (
                <article className="is-locked" key={title}>
                  <span>{String(index + 3).padStart(2, '0')}</span><div><small>MODULE {index + 3}</small><strong>{title}</strong><p>Sẽ mở trong phần học tiếp theo</p></div><em>SẮP TỚI</em>
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
                <div><small>BÀI HIỆN TẠI</small><strong>{learningPosition.lessonIndex}/{learningPosition.totalLessons}</strong><span>{learningPosition.lessonTitle}</span></div>
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
  const [reviewHistoryIndex, setReviewHistoryIndex] = useState<number | null>(null)
  const [approvalFocus, setApprovalFocus] = useState<ApprovalFocus | null>(null)
  const [visualExpanded, setVisualExpanded] = useState(false)
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings)
  const practiceAdvanceRef = useRef<Promise<LearnerProgress> | null>(null)

  const advanceFromCompletedPractice = async (current: LearnerProgress): Promise<LearnerProgress> => {
    if (current.sceneId !== 'module-2-planning-package' || current.practice.status !== 'completed') return current
    if (practiceAdvanceRef.current) return practiceAdvanceRef.current
    const completed = new Set(current.completedCheckpointIds)
    completed.add('m2-planning-package')
    const update: ProgressUpdate = {
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-assessment',
      checkpointId: 'm2-mastery',
      sceneId: 'module-2-mastery',
      sceneHistory: [...current.sceneHistory, current.sceneId].slice(-200),
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
      setReviewHistoryIndex(null)
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
      setReviewHistoryIndex(null)
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

  const advanceToScene = async (nextSceneId: SceneId, decisions: Record<string, string>) => {
    if (!progress) return
    const currentScene = scenes[progress.sceneId]
    const nextScene = scenes[nextSceneId]
    const completed = new Set(progress.completedCheckpointIds)
    if (currentScene.checkpointId !== nextScene.checkpointId) {
      completed.add(currentScene.checkpointId)
    }
    await persist({
      currentLessonId: nextScene.lessonId,
      currentCourseLessonId: courseLessonIdForScene(nextSceneId),
      checkpointId: nextScene.checkpointId,
      sceneId: nextSceneId,
      sceneHistory: [...progress.sceneHistory, progress.sceneId].slice(-200),
      completedCheckpointIds: [...completed],
      decisions
    })
  }

  const saveAssessmentResult = async (question: AssessmentQuestion, result: string) => {
    if (!progress || busy) return
    setBusy(true)
    setError('')
    try {
      await persist({
        currentLessonId: progress.currentLessonId,
        currentCourseLessonId: progress.currentCourseLessonId,
        checkpointId: progress.checkpointId,
        sceneId: progress.sceneId,
        sceneHistory: progress.sceneHistory,
        completedCheckpointIds: progress.completedCheckpointIds,
        decisions: {
          ...progress.decisions,
          [assessmentDecisionKey(question.id)]: result
        }
      })
    } catch {
      setError('Không thể lưu câu trả lời này. Hãy thử lại trước khi tiếp tục.')
    } finally {
      setBusy(false)
    }
  }

  const continueAssessment = async (question: AssessmentQuestion, group: AssessmentGroup) => {
    if (!progress || busy) return
    const questionIndex = group.questions.findIndex((candidate) => candidate.id === question.id)
    const nextQuestion = group.questions[questionIndex + 1]
    const exitScene: Record<string, SceneId> = {
      'setup-final-assessment': 'module-1-final-summary',
      'planning-prd-check': 'module-2-prd-interview',
      'prompt-check': 'module-2-prd-approved',
      'implementation-plan-check': 'module-2-planning-package',
      'final-assessment': 'module-2-final-summary'
    }
    const nextSceneId = nextQuestion?.sceneId ?? exitScene[group.id]
    if (!nextSceneId) return

    setBusy(true)
    setError('')
    try {
      const decisions = { ...progress.decisions }
      if (!nextQuestion && group.id === 'prompt-check') {
        decisions.promptMethod = 'one-question-at-a-time'
      }
      if (!nextQuestion && group.id === 'implementation-plan-check') {
        decisions.planStructure = 'observable-and-verifiable'
        decisions.alignmentDecision = 'remove-scope-creep'
      }
      await advanceToScene(nextSceneId, decisions)
    } catch {
      setError('Không thể mở câu tiếp theo. Hãy thử lại trước khi tiếp tục.')
    } finally {
      setBusy(false)
    }
  }

  const retryFinalAssessment = async () => {
    if (!progress || busy) return
    const finalGroupId = scenes[progress.sceneId].assessmentGroupId ?? 'final-assessment'
    const finalGroup = assessmentGroupById.get(finalGroupId)
    const firstQuestion = finalGroup?.questions[0]
    if (!finalGroup || !firstQuestion) return

    setBusy(true)
    setError('')
    try {
      const finalQuestionIds = new Set(finalGroup.questions.map((question) => assessmentDecisionKey(question.id)))
      const decisions = Object.fromEntries(
        Object.entries(progress.decisions).filter(([key]) => !finalQuestionIds.has(key))
      )
      await advanceToScene(firstQuestion.sceneId, decisions)
    } catch {
      setError('Không thể bắt đầu lại phần kiểm tra. Hãy thử lại.')
    } finally {
      setBusy(false)
    }
  }

  const choose = async (choice: Choice) => {
    if (!progress || busy) return
    if (choice.action === 'home') {
      setTeacherOpen(false)
      setReviewHistoryIndex(null)
      setDestination('home')
      return
    }
    if (choice.action === 'review-module') {
      const firstModuleSceneIndex = progress.sceneHistory.findIndex((sceneId) => sceneId.startsWith('module-2-'))
      if (firstModuleSceneIndex >= 0) setReviewHistoryIndex(firstModuleSceneIndex)
      return
    }
    if (choice.action === 'practice') {
      await minimizeToTeacher()
      return
    }
    if (!choice.next) return

    setBusy(true)
    setReviewHistoryIndex(null)
    setError('')
    try {
      const decisions = choice.decision
        ? { ...progress.decisions, [choice.decision.key]: choice.decision.value }
        : progress.decisions
      await advanceToScene(choice.next, decisions)
      setApprovalFocus(null)
      setVisualExpanded(false)
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
            setReviewHistoryIndex(null)
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

  const reviewingSceneId = reviewHistoryIndex === null
    ? undefined
    : progress.sceneHistory[reviewHistoryIndex]
  const isReviewing = reviewingSceneId !== undefined
  const currentReviewIndex = reviewHistoryIndex ?? progress.sceneHistory.length
  const displayedSceneId = reviewingSceneId ?? progress.sceneId
  const scene = scenes[displayedSceneId]
  const learningPosition = learningPositionByScene[displayedSceneId]
  const canOpenPreviousPage = isReviewing
    ? currentReviewIndex > 0
    : progress.sceneHistory.length > 0
  const openPreviousPage = () => {
    if (!canOpenPreviousPage) return
    setApprovalFocus(null)
    setVisualExpanded(false)
    setReviewHistoryIndex(isReviewing ? currentReviewIndex - 1 : progress.sceneHistory.length - 1)
  }
  const lessonContextLabel = scene.lessonId === 'intro'
    ? `GIỚI THIỆU KHÓA HỌC · TRANG ${learningPosition.page}/${learningPosition.totalPages}`
    : `${scene.lessonId === 'module-1' ? 'MODULE 1' : 'MODULE 2'} · BÀI ${learningPosition.lessonIndex}/${learningPosition.totalLessons} · TRANG ${learningPosition.page}/${learningPosition.totalPages}`
  const assessmentQuestion = scene.assessmentQuestionId
    ? assessmentQuestionById.get(scene.assessmentQuestionId)
    : undefined
  const assessmentGroup = scene.assessmentGroupId
    ? assessmentGroupById.get(scene.assessmentGroupId)
    : undefined
  const assessmentResult = assessmentQuestion
    ? progress.decisions[assessmentDecisionKey(assessmentQuestion.id)]
    : undefined
  const assessmentQuestionIndex = assessmentQuestion && assessmentGroup
    ? assessmentGroup.questions.findIndex((question) => question.id === assessmentQuestion.id)
    : -1
  const assessmentContinueLabel = assessmentGroup && assessmentQuestionIndex === assessmentGroup.questions.length - 1
    ? assessmentGroup.mode === 'mastery'
      ? `Xem kết quả ${assessmentGroup.questions.length} câu`
      : 'Tiếp tục bài học'
    : 'Câu tiếp theo'
  const finalAssessment = scene.assessmentSummary && scene.assessmentGroupId
    ? assessmentGroupById.get(scene.assessmentGroupId)
    : assessmentGroupById.get('final-assessment')
  const finalQuestionCount = finalAssessment?.questions.length ?? 0
  const finalCorrectCount = finalAssessment?.questions.filter((question) =>
    progress.decisions[assessmentDecisionKey(question.id)]?.startsWith('correct')
  ).length ?? 0
  const finalPassingCount = finalAssessment
    ? Math.ceil(finalAssessment.questions.length * (finalAssessment.passingScore ?? 0.8))
    : 0
  const finalPassed = finalCorrectCount >= finalPassingCount
  const lessonVisual = sceneVisuals[displayedSceneId] ?? (learningPosition.page === 1
    ? lessonVisuals[learningPosition.lessonId]
    : undefined)
  const isApprovalTour = displayedSceneId === 'module-1-codex-examples'
  const canExpandLessonVisual = scene.lessonId !== 'intro'
  const canShowSceneMedia = !assessmentQuestion && !scene.assessmentSummary
  const shouldShowScenePanel = scene.showPanel !== false && canShowSceneMedia
  const usesPairedLessonNavigation = !isReviewing
    && !assessmentQuestion
    && !scene.assessmentSummary
    && scene.choices.length === 1
  const pageBackControl = (
    <button
      className="pixel-page-back"
      disabled={!canOpenPreviousPage}
      type="button"
      onClick={openPreviousPage}
    >
      ← Trang trước
    </button>
  )

  return (
    <main className="pixel-learning-shell">
      <div className="pixel-scene-world" style={sceneStyle} aria-hidden="true" />

      <header className="pixel-hud">
        <button className="pixel-brand pixel-brand--button" type="button" onClick={() => {
          setApprovalFocus(null)
          setVisualExpanded(false)
          setTeacherOpen(false)
          setReviewHistoryIndex(null)
          setDestination('home')
        }}>
          <span className="pixel-brand__mark" aria-hidden="true">C</span>
          <span><strong>VIBECODING 101</strong><small>VỀ HOME BASE</small></span>
        </button>
        <div className="pixel-mission-meta" aria-label={lessonContextLabel}>
          <span>{lessonContextLabel}</span>
          <strong>{learningPosition.lessonTitle}</strong>
          <div className="pixel-progress" aria-hidden="true"><i style={{ width: `${(learningPosition.page / learningPosition.totalPages) * 100}%` }} /></div>
        </div>
        <div className="pixel-hud-actions">
          <button className="pixel-hud-teacher" type="button" onClick={() => setTeacherOpen(true)}>HỎI TRIẾT</button>
          <button className="pixel-quit" type="button" onClick={() => void window.courseCompanion?.quitApp()}>
            THOÁT · v{runtime?.appVersion ?? '…'}
          </button>
        </div>
      </header>

      {scene.showTitle === false ? null : (
        <section className="pixel-scene-title"><small>{lessonContextLabel}</small><strong>{scene.objective}</strong></section>
      )}
      {assessmentQuestion || scene.assessmentSummary
        ? null
        : <img className="pixel-teacher-character" src={teacherImage} alt="Triết, giáo viên đồng hành" />}

      {canShowSceneMedia && lessonVisual
        ? (
            <figure className={`pixel-lesson-visual${isApprovalTour ? ' is-approval-tour' : ''}`}>
              <LessonVisualMedia
                activeFocus={approvalFocus}
                isApprovalTour={isApprovalTour}
                visual={lessonVisual}
              />
              {canExpandLessonVisual ? (
                <button
                  aria-label="Phóng to ảnh minh họa"
                  className="pixel-visual-expand"
                  type="button"
                  onClick={() => setVisualExpanded(true)}
                >
                  PHÓNG TO
                </button>
              ) : null}
            </figure>
          )
        : shouldShowScenePanel
          ? (
              <aside className="pixel-consequence" data-tone={scene.tone} aria-live="polite">
                <header><span>{scene.panelLabel}</span><strong>{scene.panelStatus}</strong></header>
                <div className="pixel-request"><p>{scene.request}</p></div>
                <EvidenceGrid items={scene.evidence} />
              </aside>
            )
          : null}

      {visualExpanded && lessonVisual && canExpandLessonVisual ? (
        <LessonVisualLightbox
          activeFocus={approvalFocus}
          isApprovalTour={isApprovalTour}
          visual={lessonVisual}
          onClose={() => setVisualExpanded(false)}
        />
      ) : null}

      <section className={`pixel-dialogue${scene.choices.length === 1 ? ' has-single-choice' : ''}${scene.choices.length > 3 ? ' has-many-choices' : ''}${assessmentQuestion || scene.assessmentSummary ? ' has-assessment' : ''}${displayedSceneId === 'module-1-codex-examples' ? ' has-approval-tour' : ''}${approvalFocus ? ' has-manual-approval-focus' : ''}`} aria-labelledby="teacherName">
        <div className="pixel-speaker"><img src={teacherImage} alt="" /><span>TEACHER</span><strong id="teacherName">Triết</strong></div>
        <p>{scene.assessmentSummary
          ? finalPassed
            ? `Bạn đạt ${finalCorrectCount}/${finalQuestionCount} câu. Kết quả này đạt mốc ${finalPassingCount}/${finalQuestionCount} để hoàn thành ${scene.lessonId === 'module-1' ? 'Module 1' : 'Module 2'}.`
            : `Bạn đạt ${finalCorrectCount}/${finalQuestionCount} câu. Hãy làm lại phần kiểm tra để đạt ít nhất ${finalPassingCount}/${finalQuestionCount}.`
          : displayedSceneId === 'module-1-codex-examples'
            ? <ApprovalTourDialogue activeFocus={approvalFocus} onSelect={setApprovalFocus} />
            : scene.dialogue}</p>
        {isReviewing ? <div className="pixel-review-notice">ĐANG XEM LẠI · TIẾN ĐỘ VẪN ĐƯỢC GIỮ NGUYÊN</div> : null}
        {error ? <div className="pixel-save-error" role="alert">{error}</div> : null}
        {isReviewing ? (
          <div className="pixel-review-return">
            <button className="pixel-choice is-primary" type="button" onClick={() => {
              setApprovalFocus(null)
              setVisualExpanded(false)
              setReviewHistoryIndex(null)
            }}>
              Quay lại trang đang học
            </button>
          </div>
        ) : assessmentQuestion && assessmentGroup ? (
          <AssessmentControls
            busy={busy}
            continueLabel={assessmentContinueLabel}
            key={assessmentQuestion.id}
            question={assessmentQuestion}
            result={assessmentResult}
            onChoose={(index) => {
              if (assessmentQuestion.type !== 'multiple-choice') return
              void saveAssessmentResult(
                assessmentQuestion,
                index === assessmentQuestion.answerIndex ? `correct:${index}` : `incorrect:${index}`
              )
            }}
            onConfirmWritten={() => void saveAssessmentResult(assessmentQuestion, 'correct:self-review')}
            onContinue={() => void continueAssessment(assessmentQuestion, assessmentGroup)}
          />
        ) : scene.assessmentSummary ? (
          <div className="pixel-assessment-summary" data-result={finalPassed ? 'pass' : 'retry'}>
            <strong>{finalPassed ? 'ĐẠT' : 'CHƯA ĐẠT'}</strong>
            <span>{finalCorrectCount}/{finalQuestionCount} câu</span>
            <button
              className="pixel-choice is-primary"
              disabled={busy}
              type="button"
              onClick={() => finalPassed
                ? void choose({
                    label: scene.lessonId === 'module-1' ? 'Hoàn thành Module 1' : 'Hoàn thành Module 2',
                    next: scene.lessonId === 'module-1' ? 'module-1-complete' : 'module-2-complete',
                    decision: scene.lessonId === 'module-1'
                      ? { key: 'setupMastery', value: 'passed-four-of-five' }
                      : { key: 'masteryEvidence', value: 'artifacts-approved-and-aligned' }
                  })
                : void retryFinalAssessment()}
            >
              {busy
                ? 'Đang lưu…'
                : finalPassed
                  ? `Hoàn thành ${scene.lessonId === 'module-1' ? 'Module 1' : 'Module 2'}`
                  : `Làm lại ${finalQuestionCount} câu`}
            </button>
          </div>
        ) : (
          <div className={`pixel-lesson-actions${usesPairedLessonNavigation ? ' is-paired' : ''}`}>
            {usesPairedLessonNavigation ? pageBackControl : null}
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
          </div>
        )}
        {usesPairedLessonNavigation ? null : pageBackControl}
      </section>

      {teacherOpen ? (
        <TeacherOverlay onClose={() => setTeacherOpen(false)} onOpenLesson={() => setTeacherOpen(false)} />
      ) : null}
    </main>
  )
}
