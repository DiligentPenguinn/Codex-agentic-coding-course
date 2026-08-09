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
import teacherImage from '../../../../../prototypes/mvp-3-course-experience-companion/assets/teacher.png'
import { PracticeBrief } from '../components/PracticeBrief'
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
}

const scenes: Record<SceneId, SceneContent> = {
  'intro-visual-onboarding': {
    lessonId: 'intro',
    checkpointId: 'intro-visual-onboarding',
    step: 1,
    totalSteps: 9,
    lessonLabel: 'PHẦN GIỚI THIỆU',
    mission: 'Hiểu mình đang xây gì và làm việc ở đâu',
    objective: 'Bắt đầu đúng sản phẩm, đúng workspace',
    panelLabel: 'ĐÍCH ĐẾN PILOT',
    panelStatus: 'INTRO + MODULE 1',
    tone: 'neutral',
    request: 'Bạn sẽ xây ContentPilot trong khóa học; Course Companion chỉ dẫn đường và lưu hành trình học.',
    evidence: [
      { label: 'SẢN PHẨM', value: 'ContentPilot' },
      { label: 'NƠI THỰC HÀNH', value: 'Codex' },
      { label: 'NGƯỜI DẪN ĐƯỜNG', value: 'Hương' }
    ],
    dialogue: 'Chào bạn. Trước khi sửa bất kỳ tệp nào, mình sẽ giúp bạn phân biệt ứng dụng đang học, ứng dụng sẽ xây và nơi Codex làm việc.',
    choices: [{ label: 'Bắt đầu bằng một vòng chỉ đọc', next: 'intro-first-safe-win', primary: true }]
  },
  'intro-first-safe-win': {
    lessonId: 'intro',
    checkpointId: 'intro-first-safe-win',
    step: 2,
    totalSteps: 9,
    lessonLabel: 'PHẦN GIỚI THIỆU',
    mission: 'Kiểm tra bằng chứng trước khi thay đổi',
    objective: 'Thực hiện vòng cộng tác chỉ đọc đầu tiên',
    panelLabel: 'BA BẰNG CHỨNG',
    panelStatus: 'KHÔNG SỬA TỆP',
    tone: 'neutral',
    request: 'Một báo cáo chỉ đọc cần xác nhận đúng dự án, đúng phạm vi Pilot và đúng các tệp nguồn đã đọc.',
    evidence: [
      { label: 'DỰ ÁN', value: 'ContentPilot', ready: true },
      { label: 'PHẠM VI', value: 'Intro + Module 1', ready: true },
      { label: 'HÀNH ĐỘNG', value: 'Chỉ đọc', ready: true }
    ],
    dialogue: 'Bạn muốn kiểm tra tín hiệu nào trước? Các lựa chọn đều đúng; điều quan trọng là dự đoán bằng chứng trước khi Codex hành động.',
    choices: [
      { label: 'Đúng dự án và phạm vi', next: 'intro-time-budget', decision: { key: 'firstEvidence', value: 'project-and-scope' } },
      { label: 'Đúng các tệp nguồn đã đọc', next: 'intro-time-budget', primary: true, decision: { key: 'firstEvidence', value: 'source-files' } }
    ]
  },
  'intro-time-budget': {
    lessonId: 'intro',
    checkpointId: 'intro-time-budget',
    step: 3,
    totalSteps: 9,
    lessonLabel: 'PHẦN GIỚI THIỆU',
    mission: 'Chọn nhịp học phù hợp',
    objective: 'Đặt thời lượng học hôm nay',
    panelLabel: 'NHỊP HỌC',
    panelStatus: 'CHỌN MỘT MỐC',
    tone: 'neutral',
    request: 'Tiến trình sẽ được lưu sau mỗi quyết định để bạn có thể thoát ứng dụng và quay lại đúng chỗ.',
    evidence: [
      { label: 'NGẮN', value: '10–20 phút' },
      { label: 'TIÊU CHUẨN', value: '30 phút' },
      { label: 'SÂU', value: '45–60 phút' }
    ],
    dialogue: 'Hôm nay bạn có bao nhiêu phút?',
    choices: [
      { label: '10 phút', next: 'intro-graduation', decision: { key: 'timeBudget', value: '10' } },
      { label: '20 phút', next: 'intro-graduation', decision: { key: 'timeBudget', value: '20' } },
      { label: '30 phút', next: 'intro-graduation', primary: true, decision: { key: 'timeBudget', value: '30' } },
      { label: '45 phút', next: 'intro-graduation', decision: { key: 'timeBudget', value: '45' } },
      { label: '60 phút', next: 'intro-graduation', decision: { key: 'timeBudget', value: '60' } }
    ]
  },
  'intro-graduation': {
    lessonId: 'intro',
    checkpointId: 'intro-graduation',
    step: 4,
    totalSteps: 9,
    lessonLabel: 'PHẦN GIỚI THIỆU',
    mission: 'Giữ quyền quyết định của con người',
    objective: 'Hiểu sản phẩm cuối khóa',
    panelLabel: 'CONTENTPILOT',
    panelStatus: 'BẠN DUYỆT CUỐI',
    tone: 'good',
    request: 'ContentPilot tạo ý tưởng và bản nháp; người học vẫn chọn ý tưởng, kiểm tra thông tin và quyết định xuất bản.',
    evidence: [
      { label: 'ĐẦU VÀO', value: 'Dữ liệu thương hiệu' },
      { label: 'ĐẦU RA', value: '5 bộ nội dung' },
      { label: 'QUYỀN DUYỆT', value: 'Thuộc về bạn', ready: true }
    ],
    dialogue: 'Bạn muốn trực tiếp giữ quyết định nào trong quy trình?',
    choices: [
      { label: 'Duyệt nội dung và thông tin', next: 'intro-problem', primary: true, decision: { key: 'humanControl', value: 'content-review' } },
      { label: 'Quyết định xuất bản', next: 'intro-problem', decision: { key: 'humanControl', value: 'publishing' } }
    ]
  },
  'intro-problem': {
    lessonId: 'intro',
    checkpointId: 'intro-problem',
    step: 5,
    totalSteps: 9,
    lessonLabel: 'PHẦN GIỚI THIỆU',
    mission: 'Gắn khóa học với một việc thật',
    objective: 'Chọn vấn đề nội dung hằng tuần',
    panelLabel: 'TÌNH HUỐNG THỰC HÀNH',
    panelStatus: 'MỘT VẤN ĐỀ CỤ THỂ',
    tone: 'neutral',
    request: 'Chọn một việc lặp lại đang tốn thời gian, khó nhất quán hoặc thường bị kẹt ở khâu duyệt.',
    evidence: [
      { label: 'TẦN SUẤT', value: 'Hằng tuần' },
      { label: 'NÚT THẮT', value: 'Tạo hoặc duyệt' },
      { label: 'NGỮ CẢNH', value: 'Thật hoặc mẫu' }
    ],
    dialogue: 'Hãy chọn ngữ cảnh khởi đầu. Bạn sẽ bổ sung mô tả chi tiết khi hoàn thiện phiếu định hướng.',
    choices: [
      { label: 'Dùng quy trình nội dung thật của tôi', next: 'intro-platform', primary: true, decision: { key: 'practiceContext', value: 'real-work' } },
      { label: 'Tạm dùng thương hiệu mẫu Mộc Học', next: 'intro-platform', decision: { key: 'practiceContext', value: 'moc-hoc' } }
    ]
  },
  'intro-platform': {
    lessonId: 'intro',
    checkpointId: 'intro-platform',
    step: 6,
    totalSteps: 9,
    lessonLabel: 'PHẦN GIỚI THIỆU',
    mission: 'Thu hẹp đầu ra đầu tiên',
    objective: 'Chọn nền tảng nội dung chính',
    panelLabel: 'MỘT NỀN TẢNG TRƯỚC',
    panelStatus: 'GIỮ PHẠM VI HẸP',
    tone: 'neutral',
    request: 'Một nền tảng rõ ràng giúp tiêu chí về độ dài, giọng điệu và định dạng có thể kiểm tra.',
    evidence: [
      { label: 'LINKEDIN', value: 'Chuyên nghiệp' },
      { label: 'FACEBOOK', value: 'Cộng đồng' },
      { label: 'INSTAGRAM', value: 'Hình ảnh' }
    ],
    dialogue: 'Nếu Pilot chỉ tối ưu cho một nền tảng trước, bạn chọn nền tảng nào?',
    choices: [
      { label: 'LinkedIn', next: 'intro-quest-card', primary: true, decision: { key: 'platform', value: 'linkedin' } },
      { label: 'Facebook', next: 'intro-quest-card', decision: { key: 'platform', value: 'facebook' } },
      { label: 'Instagram', next: 'intro-quest-card', decision: { key: 'platform', value: 'instagram' } }
    ]
  },
  'intro-quest-card': {
    lessonId: 'intro',
    checkpointId: 'intro-quest-card',
    step: 7,
    totalSteps: 9,
    lessonLabel: 'PHẦN GIỚI THIỆU',
    mission: 'Kết tinh định hướng cá nhân',
    objective: 'Chuẩn bị phiếu định hướng',
    panelLabel: 'PHIẾU ĐỊNH HƯỚNG',
    panelStatus: 'BẢN MVP ĐÃ LƯU',
    tone: 'good',
    request: 'Ứng dụng đã ghi thời lượng, quyền kiểm soát, ngữ cảnh thực hành và nền tảng bạn chọn vào tiến trình cục bộ.',
    evidence: [
      { label: 'ĐỐI TƯỢNG', value: 'Do bạn xác định', ready: true },
      { label: 'NỀN TẢNG', value: 'Đã chọn', ready: true },
      { label: 'TIÊU CHÍ DUYỆT', value: 'Cần kiểm chứng' }
    ],
    dialogue: 'Ở đây ta xác nhận cấu trúc cần có. Nội dung chi tiết sẽ được viết bằng tình huống và tiêu chí của chính bạn.',
    choices: [{ label: 'Kiểm tra mức sẵn sàng', next: 'intro-readiness', primary: true }]
  },
  'intro-readiness': {
    lessonId: 'intro',
    checkpointId: 'intro-readiness',
    step: 8,
    totalSteps: 9,
    lessonLabel: 'PHẦN GIỚI THIỆU',
    mission: 'Kiểm tra một nguyên tắc cốt lõi',
    objective: 'Sẵn sàng chuyển sang Module 1',
    panelLabel: 'CÂU KIỂM TRA',
    panelStatus: 'CHỌN BẰNG CHỨNG',
    tone: 'neutral',
    request: 'Tiêu chí nào giúp bạn biết một thay đổi của Codex đã thực sự hoàn thành?',
    evidence: [
      { label: 'CẢM GIÁC', value: '“Trông đẹp hơn”' },
      { label: 'BẰNG CHỨNG', value: 'Quan sát hoặc đo được' },
      { label: 'PHẠM VI', value: 'Tệp được phép sửa' }
    ],
    dialogue: 'Hãy chọn câu trả lời có thể kiểm chứng sau khi Codex hoàn thành.',
    choices: [
      { label: 'Codex nói rằng công việc đã xong', next: 'intro-readiness', danger: true },
      { label: 'Kết quả đáp ứng dấu hiệu hoàn thành đã định trước', next: 'intro-complete', primary: true, decision: { key: 'readiness', value: 'passed' } }
    ]
  },
  'intro-complete': {
    lessonId: 'intro',
    checkpointId: 'intro-complete',
    step: 9,
    totalSteps: 9,
    lessonLabel: 'PHẦN GIỚI THIỆU',
    mission: 'Chuyển sang quy trình an toàn',
    objective: 'Hoàn thành phần giới thiệu',
    panelLabel: 'CHECKPOINT',
    panelStatus: 'INTRO HOÀN THÀNH',
    tone: 'good',
    request: 'Bạn đã có đích đến, phạm vi Pilot và quyền quyết định rõ ràng. Tiến trình này sẽ còn nguyên sau khi thoát ứng dụng.',
    evidence: [
      { label: 'ĐỊNH HƯỚNG', value: 'Đã lưu', ready: true },
      { label: 'QUYỀN DUYỆT', value: 'Đã chọn', ready: true },
      { label: 'BÀI TIẾP THEO', value: 'Module 1', ready: true }
    ],
    dialogue: 'Module 1 bắt đầu bằng cách nhận ra rủi ro của một yêu cầu mơ hồ trước khi gửi nó cho Codex.',
    choices: [{ label: 'Bắt đầu Module 1', next: 'module-1-opening', primary: true }]
  },
  'module-1-opening': {
    lessonId: 'module-1',
    checkpointId: 'm1-orient',
    step: 1,
    totalSteps: 7,
    lessonLabel: 'BÀI HỌC CHÍNH',
    mission: 'Viết yêu cầu để Codex có thể kiểm chứng',
    objective: 'Nhận ra rủi ro của một yêu cầu mơ hồ',
    panelLabel: 'YÊU CẦU TỪ NGƯỜI DÙNG',
    panelStatus: 'CHƯA GỬI',
    tone: 'neutral',
    request: '“Làm phần giới thiệu đẹp hơn.”',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Chưa rõ' },
      { label: 'PHẠM VI', value: 'Chưa giới hạn' },
      { label: 'BẰNG CHỨNG', value: 'Chưa có' }
    ],
    dialogue: 'Bạn vừa nhận một yêu cầu: “Làm phần giới thiệu đẹp hơn.” Nếu gửi ngay cho Codex, điều gì có thể xảy ra?',
    choices: [
      { label: 'Codex sẽ tự hiểu đúng ý', next: 'module-1-bad-consequence', danger: true },
      { label: 'Kết quả sẽ khó đoán và khó kiểm tra', next: 'module-1-concept', primary: true }
    ]
  },
  'module-1-bad-consequence': {
    lessonId: 'module-1',
    checkpointId: 'm1-orient',
    step: 1,
    totalSteps: 7,
    lessonLabel: 'BÀI HỌC CHÍNH',
    mission: 'Viết yêu cầu để Codex có thể kiểm chứng',
    objective: 'Nhận ra rủi ro của một yêu cầu mơ hồ',
    panelLabel: 'KẾT QUẢ GIẢ ĐỊNH',
    panelStatus: 'KHÓ KIỂM CHỨNG',
    tone: 'bad',
    request: 'Codex thay bố cục, màu sắc và năm tệp—nhưng không biết thay đổi nào thực sự giải quyết vấn đề.',
    evidence: [
      { label: 'TỆP THAY ĐỔI', value: '5 tệp' },
      { label: 'LÝ DO', value: 'Không rõ' },
      { label: 'DONE-WHEN', value: 'Không có' }
    ],
    dialogue: 'Codex có thể làm rất nhiều, nhưng bạn không có tiêu chuẩn để biết kết quả có đúng hay không. Hãy làm rõ yêu cầu trước khi gửi.',
    choices: [{ label: 'Làm rõ yêu cầu', next: 'module-1-concept', primary: true }]
  },
  'module-1-concept': {
    lessonId: 'module-1',
    checkpointId: 'm1-inspect',
    step: 2,
    totalSteps: 7,
    lessonLabel: 'BÀI HỌC CHÍNH',
    mission: 'Viết yêu cầu để Codex có thể kiểm chứng',
    objective: 'Tìm ba phần giúp yêu cầu có thể kiểm chứng',
    panelLabel: 'BA Ô CÒN THIẾU',
    panelStatus: '0/3 SẴN SÀNG',
    tone: 'neutral',
    request: 'Một yêu cầu an toàn cần nói rõ thay đổi gì, được phép chạm vào đâu và bằng chứng nào xác nhận đã xong.',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Thay đổi gì?' },
      { label: 'PHẠM VI', value: 'Được sửa đâu?' },
      { label: 'BẰNG CHỨNG', value: 'Xong khi nào?' }
    ],
    dialogue: 'Ba phần cần có là mục tiêu, phạm vi và bằng chứng. Bây giờ hãy chọn yêu cầu mà bạn có thể kiểm tra sau khi Codex hoàn thành.',
    choices: [{ label: 'Chọn một yêu cầu', next: 'module-1-brief-choice', primary: true }]
  },
  'module-1-brief-choice': {
    lessonId: 'module-1',
    checkpointId: 'm1-brief',
    step: 3,
    totalSteps: 7,
    lessonLabel: 'BÀI HỌC CHÍNH',
    mission: 'Viết yêu cầu để Codex có thể kiểm chứng',
    objective: 'Chọn yêu cầu có giới hạn và bằng chứng rõ ràng',
    panelLabel: 'BA Ô CẦN KIỂM TRA',
    panelStatus: 'CHỌN MỘT YÊU CẦU',
    tone: 'neutral',
    request: 'Bạn sẽ gửi yêu cầu nào cho Codex?',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Cụ thể?' },
      { label: 'PHẠM VI', value: 'Giới hạn?' },
      { label: 'BẰNG CHỨNG', value: 'Đo được?' }
    ],
    dialogue: 'Bạn sẽ gửi yêu cầu nào cho Codex?',
    choices: [
      { label: 'A · Làm giao diện đẹp và hiện đại hơn', next: 'module-1-weak-brief', danger: true },
      { label: 'B · Tự quyết định mọi thứ cần sửa', next: 'module-1-weak-brief', danger: true },
      { label: 'C · Nút chính rộng 100% ở 390px; chỉ sửa CSS; không tràn ngang', next: 'module-1-success', primary: true }
    ]
  },
  'module-1-weak-brief': {
    lessonId: 'module-1',
    checkpointId: 'm1-brief',
    step: 3,
    totalSteps: 7,
    lessonLabel: 'BÀI HỌC CHÍNH',
    mission: 'Viết yêu cầu để Codex có thể kiểm chứng',
    objective: 'Chọn yêu cầu có giới hạn và bằng chứng rõ ràng',
    panelLabel: 'YÊU CẦU VẪN CÒN MƠ HỒ',
    panelStatus: '1/3 SẴN SÀNG',
    tone: 'bad',
    request: 'Có ý định thay đổi, nhưng phạm vi và bằng chứng vẫn do Codex tự đoán.',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Còn chủ quan' },
      { label: 'PHẠM VI', value: 'Không giới hạn' },
      { label: 'BẰNG CHỨNG', value: 'Không đo được' }
    ],
    dialogue: '“Đẹp” và “mọi thứ cần sửa” không tạo ra một điểm kiểm tra. Hãy chọn lại một yêu cầu có giới hạn rõ ràng.',
    choices: [{ label: 'Chọn lại', next: 'module-1-brief-choice', primary: true }]
  },
  'module-1-success': {
    lessonId: 'module-1',
    checkpointId: 'm1-plan-approval',
    step: 4,
    totalSteps: 7,
    lessonLabel: 'BÀI HỌC CHÍNH',
    mission: 'Viết yêu cầu để Codex có thể kiểm chứng',
    objective: 'Mang yêu cầu đã kiểm chứng sang Codex',
    panelLabel: 'YÊU CẦU ĐÃ SẴN SÀNG',
    panelStatus: '3/3 SẴN SÀNG',
    tone: 'good',
    request: '“Ở 390px, làm nút chính rộng 100%. Chỉ sửa CSS của onboarding. Xong khi không có tràn ngang.”',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Nút dễ chạm', ready: true },
      { label: 'PHẠM VI', value: 'Một tệp CSS', ready: true },
      { label: 'BẰNG CHỨNG', value: '390px, không tràn', ready: true }
    ],
    dialogue: 'Tốt. Bạn đã làm rõ điều gì được phép thay đổi và cách kiểm chứng kết quả. Bây giờ có thể chuyển sang thực hành trong Codex.',
    choices: [
      { label: 'Xem lại từ đầu', next: 'module-1-opening' },
      { label: 'Sang Codex để thực hành', action: 'practice', primary: true }
    ]
  },
  'module-1-reflection': {
    lessonId: 'module-1',
    checkpointId: 'm1-review',
    step: 5,
    totalSteps: 7,
    lessonLabel: 'BÀI HỌC CHÍNH',
    mission: 'Viết yêu cầu để Codex có thể kiểm chứng',
    objective: 'Đọc bằng chứng trước khi kết luận',
    panelLabel: 'BẰNG CHỨNG MÔ PHỎNG',
    panelStatus: 'MỚI · KHỚP TIÊU CHÍ',
    tone: 'good',
    request: 'Viewport 390px · chỉ CSS onboarding · không phát hiện tràn ngang.',
    evidence: [
      { label: 'VIEWPORT', value: '390px', ready: true },
      { label: 'PHẠM VI', value: 'CSS onboarding', ready: true },
      { label: 'TRÀN NGANG', value: 'Không phát hiện', ready: true }
    ],
    dialogue: 'Sự kiện này là mô phỏng, nhưng cách duyệt là thật: kết luận nào dựa trực tiếp trên bằng chứng vừa nhận?',
    choices: [
      { label: 'Chỉ cần trạng thái “hoàn thành”', next: 'module-1-reflection', danger: true },
      {
        label: 'Bằng chứng mới và khớp đúng tiêu chí',
        next: 'module-1-debrief',
        primary: true,
        decision: { key: 'evidenceReview', value: 'current-and-matches' }
      }
    ]
  },
  'module-1-debrief': {
    lessonId: 'module-1',
    checkpointId: 'm1-mastery',
    step: 6,
    totalSteps: 7,
    lessonLabel: 'BÀI HỌC CHÍNH',
    mission: 'Viết yêu cầu để Codex có thể kiểm chứng',
    objective: 'Khép vòng yêu cầu → hành động → bằng chứng',
    panelLabel: 'VÒNG KIỂM CHỨNG',
    panelStatus: 'ĐÃ KHÉP KÍN',
    tone: 'good',
    request: 'Mục tiêu cụ thể → phạm vi giới hạn → tiêu chí quan sát được → bằng chứng mới.',
    evidence: [
      { label: 'YÊU CẦU', value: 'Có thể kiểm tra', ready: true },
      { label: 'HÀNH ĐỘNG', value: 'Trong phạm vi', ready: true },
      { label: 'KẾT LUẬN', value: 'Dựa trên bằng chứng', ready: true }
    ],
    dialogue: 'Bạn không duyệt vì Codex nói “xong”. Bạn duyệt vì bằng chứng mới trả lời đúng điều kiện đã đặt ra từ đầu.',
    choices: [{ label: 'Hoàn thành Module 1', next: 'module-1-complete', primary: true }]
  },
  'module-1-complete': {
    lessonId: 'module-1',
    checkpointId: 'm1-complete',
    step: 7,
    totalSteps: 7,
    lessonLabel: 'BÀI HỌC CHÍNH',
    mission: 'Viết yêu cầu để Codex có thể kiểm chứng',
    objective: 'Module 1 đã hoàn thành',
    panelLabel: 'PILOT 0.1',
    panelStatus: 'HOÀN THÀNH',
    tone: 'good',
    request: 'Bạn đã đi hết vòng MVP: viết yêu cầu, quan sát sự kiện và duyệt bằng chứng.',
    evidence: [
      { label: 'MỤC TIÊU', value: 'Cụ thể', ready: true },
      { label: 'PHẠM VI', value: 'Giới hạn', ready: true },
      { label: 'BẰNG CHỨNG', value: 'Đã duyệt', ready: true }
    ],
    dialogue: 'Đây là điểm kết thúc có chủ ý của Pilot 0.1. Module 2 chưa nằm trong MVP hiện tại.',
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
  return { missionId: 'm1-verifiable-brief', status: 'idle' }
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
    ? 'Bắt đầu hành trình ContentPilot'
    : isConfirm
      ? 'Bắt đầu lại từ đầu?'
      : 'Tiếp tục đúng nơi bạn dừng lại'
  const description = isWelcome
    ? 'Hương sẽ dẫn bạn qua phần giới thiệu, lưu từng checkpoint và đưa bạn vào Module 1.'
    : mode === 'reset-required'
      ? 'Tiến trình hiện tại và bản khôi phục đều không đọc được. Bạn có thể xóa dữ liệu hỏng để bắt đầu an toàn.'
      : isConfirm
        ? 'Toàn bộ tiến trình và lựa chọn cục bộ của hành trình này sẽ bị xóa.'
        : `${scene?.lessonLabel ?? 'BÀI HỌC'} · ${scene?.objective ?? progress?.checkpointId}`

  return (
    <main className="pixel-learning-shell pixel-entry-shell">
      <div className="pixel-scene-world" style={sceneStyle} aria-hidden="true" />
      <div className="pixel-entry-brand">CONTENT BUILDER ACADEMY · PILOT 0.1</div>
      <img className="pixel-entry-teacher" src={teacherImage} alt="Hương, giáo viên đồng hành" />
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
            {busy ? 'Đang lưu…' : isWelcome ? 'Bắt đầu và mở Home Base' : isConfirm ? 'Xóa và bắt đầu lại' : 'Mở Course Companion'}
          </button>
        </div>
      </section>
    </main>
  )
}

const futureModules = [
  'Thiết lập thương hiệu và giọng viết',
  'Nghiên cứu có bằng chứng',
  'Tạo và chọn ý tưởng',
  'Phát triển nội dung',
  'Kiểm tra và bàn giao'
]

const decisionLabels: Record<string, string> = {
  firstEvidence: 'Bằng chứng đầu tiên',
  timeBudget: 'Thời lượng học',
  humanControl: 'Quyền kiểm soát',
  practiceContext: 'Ngữ cảnh thực hành',
  platform: 'Nền tảng',
  readiness: 'Mức sẵn sàng',
  evidenceReview: 'Cách duyệt bằng chứng'
}

const decisionValues: Record<string, string> = {
  'project-and-scope': 'Dự án và phạm vi',
  'source-files': 'Các tệp nguồn',
  'content-review': 'Duyệt nội dung và thông tin',
  publishing: 'Quyết định xuất bản',
  'real-work': 'Công việc thật',
  'moc-hoc': 'Thương hiệu mẫu Mộc Học',
  linkedin: 'LinkedIn',
  facebook: 'Facebook',
  instagram: 'Instagram',
  passed: 'Đã sẵn sàng',
  'current-and-matches': 'Bằng chứng mới và khớp tiêu chí'
}

type TeacherOverlayProps = {
  onClose: () => void
  onMinimizeToBubble?: () => void
  practiceMode?: boolean
}

function TeacherOverlay({ onClose, onMinimizeToBubble, practiceMode = false }: TeacherOverlayProps) {
  return (
    <aside className={'pixel-teacher-overlay' + (practiceMode ? ' is-practice-full' : '')} aria-label="Hương, giáo viên đồng hành">
      <TeacherWorkspace embedded fullScreen={practiceMode} onClose={onClose} onMinimizeToBubble={onMinimizeToBubble} />
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
  if (progress.sceneId === 'intro-complete' || progress.sceneId === 'module-1-complete') {
    completed.add(progress.checkpointId)
  }
  const progressPercent = Math.round((completed.size / checkpointIds.length) * 100)
  const introComplete = progress.currentLessonId === 'module-1' || completed.has('intro-complete')
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
          <span><strong>CONTENT BUILDER ACADEMY</strong><small>COURSE COMPANION · PILOT 0.1</small></span>
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
              {introComplete ? (
                <article className="is-complete">
                  <span>00</span><div><small>PHẦN GIỚI THIỆU</small><strong>Làm quen với Course Companion và quyền quyết định</strong><p>Đã hoàn thành</p></div><em>HOÀN THÀNH</em>
                </article>
              ) : (
                <button className="pixel-roadmap-stage is-current" type="button" onClick={() => onNavigate('lesson')}>
                  <span>00</span><div><small>PHẦN GIỚI THIỆU</small><strong>Làm quen với Course Companion và quyền quyết định</strong><p>{scene.objective}</p></div><em><span>BẠN ĐANG Ở ĐÂY</span><b>MỞ BÀI HỌC →</b></em>
                </button>
              )}
              {progress.currentLessonId === 'module-1' ? (
                <button className={`pixel-roadmap-stage is-current${moduleOneComplete ? ' is-complete' : ''}`} type="button" onClick={() => onNavigate('lesson')}>
                  <span>01</span><div><small>MODULE 1</small><strong>Viết yêu cầu để Codex có thể kiểm chứng</strong><p>{scene.objective}</p></div><em><span>BẠN ĐANG Ở ĐÂY</span><b>MỞ BÀI HỌC →</b></em>
                </button>
              ) : (
                <article>
                  <span>01</span><div><small>MODULE 1</small><strong>Viết yêu cầu để Codex có thể kiểm chứng</strong><p>Mở sau phần giới thiệu</p></div><em>TIẾP THEO</em>
                </article>
              )}
              {futureModules.map((title, index) => (
                <article className="is-locked" key={title}>
                  <span>{String(index + 2).padStart(2, '0')}</span><div><small>MODULE {index + 2}</small><strong>{title}</strong><p>Ngoài phạm vi Pilot 0.1</p></div><em>ĐÃ KHÓA</em>
                </article>
              ))}
            </div>
          </div>

          <button className="pixel-home-teacher" type="button" onClick={onOpenTeacher} aria-label="Mở Hương, giáo viên đồng hành">
            <img src={teacherImage} alt="" />
            <span><small>TEACHER</small><strong>Hương</strong><em>Hỏi khi cần</em></span>
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
                <div><small>THỰC HÀNH</small><strong>{practice.status === 'idle' ? 'Chưa bắt đầu' : practice.status}</strong><span>{practice.latestEvent ? 'Mô phỏng đã lưu' : 'Chưa có sự kiện'}</span></div>
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
                  <small>BẰNG CHỨNG THỰC HÀNH · MÔ PHỎNG</small>
                  <strong>{practice.latestEvent.summary}</strong>
                  <div><span>Viewport {practice.latestEvent.evidence.viewport}</span><span>{practice.latestEvent.evidence.changedScope}</span><span>{practice.latestEvent.evidence.horizontalOverflow}</span></div>
                </section>
              ) : null}
            </div>
          ) : null}

          {destination === 'settings' ? (
            <div className="pixel-settings">
              <section>
                <div><small>HƯƠNG NỔI</small><h2>Luôn ở phía trên cửa sổ khác</h2><p>Tắt tùy chọn này nếu Hương che khuất công việc trong Codex.</p></div>
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
                <div><small>KẾT NỐI</small><h2>Teacher và Codex</h2><p>Ứng dụng hiện chỉ dùng phản hồi và sự kiện mô phỏng cục bộ.</p></div>
                <strong className="pixel-settings-status">MÔ PHỎNG · CHƯA LIVE</strong>
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
        <TeacherOverlay onClose={onCloseTeacher} />
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
  const [practiceBriefOpen, setPracticeBriefOpen] = useState(false)
  const [practiceFullOpen, setPracticeFullOpen] = useState(false)
  const [appSettings, setAppSettings] = useState<AppSettings>(defaultAppSettings)
  const practiceAdvanceRef = useRef<Promise<LearnerProgress> | null>(null)

  const advanceFromCompletedPractice = async (current: LearnerProgress): Promise<LearnerProgress> => {
    if (current.sceneId !== 'module-1-success' || current.practice.status !== 'completed') return current
    if (practiceAdvanceRef.current) return practiceAdvanceRef.current
    const completed = new Set(current.completedCheckpointIds)
    completed.add('m1-plan-approval')
    const update: ProgressUpdate = {
      currentLessonId: 'module-1',
      checkpointId: 'm1-review',
      sceneId: 'module-1-reflection',
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

  const refreshAfterPractice = async () => {
    if (!window.courseCompanion) return
    const loadResult = await window.courseCompanion.loadProgress()
    if (loadResult.status !== 'returning' && loadResult.status !== 'recovered') return
    const updated = await advanceFromCompletedPractice(loadResult.progress)
    setProgress(updated)
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
    const unsubscribe = window.courseCompanion?.onFullTeacherRequested(() => {
      setPracticeBriefOpen(false)
      setPracticeFullOpen(true)
      setTeacherOpen(true)
    })
    return () => {
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
      setDestination('home')
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

  const updateAppSettings = async (companionAlwaysOnTop: boolean) => {
    setError('')
    try {
      const saved = window.courseCompanion
        ? await window.courseCompanion.saveAppSettings({ companionAlwaysOnTop })
        : { ...appSettings, companionAlwaysOnTop }
      setAppSettings(saved)
    } catch {
      setError('Không thể lưu cài đặt Hương nổi.')
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
      setTeacherOpen(false)
      setPracticeFullOpen(false)
      setPracticeBriefOpen(true)
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
            setDestination('home')
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
          <span><strong>CONTENT BUILDER ACADEMY</strong><small>VỀ HOME BASE</small></span>
        </button>
        <div className="pixel-mission-meta" aria-label={`Bước ${scene.step} trên ${scene.totalSteps}`}>
          <span>BÀI HỌC HIỆN TẠI · BƯỚC {scene.step}/{scene.totalSteps}</span>
          <strong>{scene.mission}</strong>
          <div className="pixel-progress" aria-hidden="true"><i style={{ width: `${(scene.step / scene.totalSteps) * 100}%` }} /></div>
        </div>
        <div className="pixel-hud-actions">
          <button className="pixel-hud-teacher" type="button" onClick={() => setTeacherOpen(true)}>HỎI HƯƠNG</button>
          <button className="pixel-quit" type="button" onClick={() => void window.courseCompanion?.quitApp()}>
            THOÁT · v{runtime?.appVersion ?? '…'}
          </button>
        </div>
      </header>

      <section className="pixel-scene-title"><small>{scene.lessonLabel}</small><strong>{scene.objective}</strong></section>
      <img className="pixel-teacher-character" src={teacherImage} alt="Hương, giáo viên đồng hành" />

      <aside className="pixel-consequence" data-tone={scene.tone} aria-live="polite">
        <header><span>{scene.panelLabel}</span><strong>{scene.panelStatus}</strong></header>
        <div className="pixel-request"><p>{scene.request}</p></div>
        <EvidenceGrid items={scene.evidence} />
      </aside>

      <section className={`pixel-dialogue${scene.choices.length > 3 ? ' has-many-choices' : ''}`} aria-labelledby="teacherName">
        <div className="pixel-speaker"><img src={teacherImage} alt="" /><span>TEACHER</span><strong id="teacherName">Hương</strong></div>
        <p>{scene.dialogue}</p>
        {error ? <div className="pixel-save-error" role="alert">{error}</div> : null}
        <div className="pixel-choices">
          {scene.choices.map((choice) => (
            <button
              className={`pixel-choice${choice.primary ? ' is-primary' : ''}${choice.danger ? ' is-danger' : ''}`}
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

      {practiceBriefOpen ? (
        <PracticeBrief onClose={() => setPracticeBriefOpen(false)} />
      ) : null}

      {teacherOpen ? (
        <TeacherOverlay
          practiceMode={practiceFullOpen}
          onClose={() => {
            const returningToLesson = practiceFullOpen
            setTeacherOpen(false)
            setPracticeFullOpen(false)
            if (returningToLesson) void refreshAfterPractice()
          }}
          onMinimizeToBubble={() => {
            setTeacherOpen(false)
            setPracticeFullOpen(false)
            void window.courseCompanion?.minimizeFullTeacher()
          }}
        />
      ) : null}
    </main>
  )
}
