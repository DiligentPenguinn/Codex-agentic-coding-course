import type { CheckpointId, CourseLessonId, SceneId } from '../../../../../../shared/contracts'
import releaseQuiz from '../../../../../../../pilot-workspace/course/quizzes/module-4.quiz.json'
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
  'release-validation-retrieval': { checkpointId: 'm4-release-validation', courseLessonId: 'm4-release-validation', step: 1 },
  'security-publication-retrieval': { checkpointId: 'm4-security-publication', courseLessonId: 'm4-security-publication', step: 2 },
  'preview-deployment-retrieval': { checkpointId: 'm4-preview-deployment', courseLessonId: 'm4-preview-deployment', step: 3 },
  'production-decision-retrieval': { checkpointId: 'm4-production-decision', courseLessonId: 'm4-production-decision', step: 4 },
  'ownership-transfer-retrieval': { checkpointId: 'm4-ownership-transfer', courseLessonId: 'm4-ownership-transfer', step: 5 },
  'm4-final-assessment': { checkpointId: 'm4-mastery', courseLessonId: 'm4-ownership-transfer', step: 5 }
}

const quizGroups = releaseQuiz.groups as QuizGroup[]
const assessmentScenes = Object.fromEntries(quizGroups.flatMap((group) => {
  const route = groupRoute[group.id]
  if (!route) throw new Error(`Nhóm câu hỏi Module 4 chưa có tuyến hiển thị: ${group.id}`)
  return group.questions.map((question, index) => [question.sceneId, {
    lessonId: 'module-4',
    checkpointId: route.checkpointId,
    step: route.step,
    totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH VÀ QUYỀN SỞ HỮU',
    mission: group.title,
    objective: `Câu ${index + 1}/${group.questions.length}`,
    panelLabel: group.mode === 'mastery' ? 'KIỂM TRA TỔNG HỢP' : 'KIỂM TRA NHANH',
    panelStatus: `CÂU ${index + 1}/${group.questions.length}`,
    tone: 'neutral',
    request: 'Trả lời trước. Lời giải và nguồn sẽ hiện sau khi bạn trả lời.',
    evidence: [
      { label: 'HÌNH THỨC', value: question.type === 'multiple-choice' ? 'Chọn một đáp án' : 'Dùng bằng chứng của bạn' },
      { label: 'TIẾN ĐỘ', value: `${index + 1}/${group.questions.length}` }
    ],
    dialogue: question.prompt,
    choices: [],
    assessmentQuestionId: question.id,
    assessmentGroupId: group.id
  } satisfies RegistrySceneContent])
})) as Partial<Record<SceneId, RegistrySceneContent>>

const instructionalScenes = {
  'module-4-release-intro': {
    lessonId: 'module-4', checkpointId: 'm4-release-validation', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHIÊN BẢN PHÁT HÀNH', mission: 'Kiểm chứng trước khi đưa ra ngoài máy',
    objective: 'Nối PRD, kiểm tra tự động và hành vi thật', panelLabel: 'BA LỚP BẰNG CHỨNG',
    panelStatus: 'PRD · KIỂM TRA · TRÌNH DUYỆT', tone: 'neutral',
    request: 'Một lớp đạt không thay thế hai lớp còn lại.',
    evidence: [
      { label: 'PRD', value: 'Mỗi tiêu chí có trạng thái' },
      { label: 'LỆNH', value: 'npm run check · npm run preview' },
      { label: 'TRÌNH DUYỆT', value: '1440 × 900 · 390 × 844' }
    ],
    dialogue: 'Phiên bản sẵn sàng phát hành chỉ đạt khi yêu cầu, kiểm tra kỹ thuật và hành vi quan sát được cùng trỏ tới một trạng thái hiện tại. Nếu còn lỗi chặn, bạn phải quay lại vòng gỡ lỗi trước khi triển khai.',
    choices: [{ label: 'Kiểm tra bằng chứng phát hành', next: 'module-4-check-release-evidence', primary: true }]
  },
  'module-4-security-intro': {
    lessonId: 'module-4', checkpointId: 'm4-security-publication', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 4 · AN TOÀN', mission: 'Duyệt điều có thể lộ và ai có thể xem',
    objective: 'Chặn secret, dữ liệu riêng tư và phạm vi công bố mơ hồ', panelLabel: 'CỬA KIỂM TRA CÔNG BỐ',
    panelStatus: 'KIỂM TRA TRƯỚC MỌI HÀNH ĐỘNG MẠNG', tone: 'neutral',
    request: 'Chế độ bảo vệ không sửa secret đã commit hoặc tự cấp quyền dùng tài sản.',
    evidence: [
      { label: 'DỮ LIỆU', value: 'Secret · cá nhân · khách hàng' },
      { label: 'QUYỀN', value: 'Ảnh · tài liệu · metadata' },
      { label: 'TRUY CẬP', value: 'Đúng URL · đúng môi trường' }
    ],
    dialogue: 'Standard Protection có thể bảo vệ Preview, trong khi domain Production vẫn có thể công khai. Vì vậy, bạn phải quan sát phạm vi truy cập trên đúng URL thay vì suy ra từ tên cài đặt.',
    choices: [{ label: 'Kiểm tra phạm vi bảo vệ', next: 'module-4-check-protection-scope', primary: true }]
  },
  'module-4-preview-intro': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PREVIEW', mission: 'Triển khai đúng phiên bản và kiểm chứng trực tiếp',
    objective: 'Phân biệt một URL với bằng chứng triển khai', panelLabel: 'LUỒNG ĐÃ KIỂM CHỨNG',
    panelStatus: 'TRANG KHỞI TẠO → BẢO VỆ → PREVIEW', tone: 'good',
    request: 'Project mới dùng trang khởi tạo trung tính trước khi đưa portfolio thật lên.',
    evidence: [
      { label: 'VERCEL INSPECT', value: 'đích Preview · Ready' },
      { label: 'PHIÊN BẢN', value: 'Nguồn hiện tại' },
      { label: 'TRỰC TIẾP', value: 'Hành vi · truy cập · nhật ký' }
    ],
    dialogue: 'Lần triển khai đầu khi tạo project mới có thể trở thành Production. Trang khởi tạo trung tính giúp portfolio thật không xuất hiện trong lần công khai bắt buộc đó. Sau đó, Preview của portfolio vẫn cần kết quả `inspect`, nhật ký và kiểm tra trực tiếp.',
    choices: [{ label: 'Kiểm tra bằng chứng Preview', next: 'module-4-check-preview-evidence', primary: true }]
  },
  'module-4-production-intro': {
    lessonId: 'module-4', checkpointId: 'm4-production-decision', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PRODUCTION', mission: 'Ra quyết định xuất bản có chủ đích',
    objective: 'Không biến phê duyệt Preview thành phê duyệt Production', panelLabel: 'QUYỀN QUYẾT ĐỊNH',
    panelStatus: 'PRODUCTION LÀ LỰA CHỌN', tone: 'neutral',
    request: 'Bạn vẫn có thể đạt nếu chọn chưa công bố, miễn là Preview và các điều kiện bắt buộc đều đạt.',
    evidence: [
      { label: 'NẾU CHƯA', value: 'Lưu lý do và bước sau' },
      { label: 'NẾU CÓ', value: 'Danh sách mới · phê duyệt mới' },
      { label: 'SAU ĐÓ', value: 'Kiểm tra thực tế · phục hồi' }
    ],
    dialogue: 'Production có thể thay đổi nội dung người xem truy cập qua domain thật. Bạn sở hữu quyết định này; Codex chỉ đề xuất và thực hiện phần kỹ thuật sau khi được phê duyệt rõ ràng.',
    choices: [{ label: 'Kiểm tra lựa chọn Production', next: 'module-4-check-production-choice', primary: true }]
  },
  'module-4-ownership-intro': {
    lessonId: 'module-4', checkpointId: 'm4-ownership-transfer', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · QUYỀN SỞ HỮU', mission: 'Giải thích quyết định bằng bằng chứng của bạn',
    objective: 'Chuyển quy trình sang một ứng dụng khác', panelLabel: 'CHỨNG MINH LÀM CHỦ',
    panelStatus: 'BẰNG CHỨNG THẬT · DỰ ÁN KHÁC', tone: 'good',
    request: 'Lặp lại câu chữ của bài không thay thế quyết định và quan sát thật.',
    evidence: [
      { label: 'PORTFOLIO', value: 'Phạm vi · phiên bản · gỡ lỗi' },
      { label: 'PHÁT HÀNH', value: 'Preview · phạm vi truy cập · lựa chọn Production' },
      { label: 'CHUYỂN GIAO', value: 'Mô tả ngắn · yêu cầu · nhiệm vụ đầu' }
    ],
    dialogue: 'Bạn không phải tự viết code. Bạn cần giải thích điều mình đã quyết định, bằng chứng nào làm thay đổi bước tiếp theo và cách bắt đầu một ứng dụng nhỏ khác với ít hướng dẫn hơn.',
    choices: [{ label: 'Kiểm tra ranh giới transfer', next: 'module-4-check-transfer-boundary', primary: true }]
  },
  'module-4-portfolio-practice': {
    lessonId: 'module-4', checkpointId: 'm4-portfolio-release', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PRACTICE', mission: 'Phát hành có kiểm chứng trong một nhiệm vụ Codex xuyên suốt',
    objective: 'Hoàn thành năm cột mốc phát hành và quyền sở hữu', panelLabel: 'TRẠNG THÁI KẾT NỐI',
    panelStatus: 'ĐANG HOÃN TRONG NHÁNH SOẠN NỘI DUNG', tone: 'neutral',
    request: 'Nguồn Practice và điều kiện thật không bị xóa; chúng sẽ được nối lại sau khi nội dung được duyệt.',
    evidence: [
      { label: 'NỘI DUNG', value: 'Có thể duyệt trong phiên', ready: true },
      { label: 'BIÊN NHẬN', value: 'Không được tạo' },
      { label: 'HOÀN THÀNH', value: 'Không được ghi nhận' }
    ],
    dialogue: 'Chế độ duyệt nội dung đi thẳng tới câu hỏi ôn tập. Nút Practice chỉ được dùng sau khi bộ đọc bằng chứng và điều kiện tốt nghiệp được nối lại.',
    choices: [{ label: 'Mở Practice phát hành', action: 'practice', primary: true }]
  },
  'module-4-portfolio-mastery': {
    lessonId: 'module-4', checkpointId: 'm4-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · LÀM CHỦ', mission: 'Kết nối kỹ năng toàn khóa',
    objective: 'Đánh giá quyết định phát hành bằng bằng chứng của chính bạn', panelLabel: 'BÀI KIỂM TRA',
    panelStatus: '4 TÌNH HUỐNG · 2 CÂU TỰ VIẾT', tone: 'good',
    request: 'Chế độ duyệt nội dung giữ câu trả lời trong phiên nhưng không cấp biên nhận làm chủ.',
    evidence: [],
    dialogue: 'Bốn tình huống kiểm tra việc phát hành, an toàn, Preview và Production. Hai câu tự viết kiểm tra quyền sở hữu phiên bản phát hành cùng khả năng chuyển quy trình sang dự án khác.',
    choices: [{ label: 'Bắt đầu kiểm tra tổng hợp', next: 'module-4-mastery-release', primary: true }]
  },
  'module-4-mastery-summary': {
    lessonId: 'module-4', checkpointId: 'm4-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · LÀM CHỦ', mission: 'Hoàn tất phần trả lời',
    objective: 'Đối chiếu kiến thức với bằng chứng phát hành và chuyển giao', panelLabel: 'KẾT QUẢ',
    panelStatus: 'CHỈ DÙNG ĐỂ DUYỆT NỘI DUNG', tone: 'neutral',
    request: 'Practice và điều kiện tốt nghiệp chưa được nối trong nhánh này.',
    evidence: [], dialogue: '', choices: [], assessmentGroupId: 'm4-final-assessment', assessmentSummary: true
  },
  'module-4-complete': {
    lessonId: 'module-4', checkpointId: 'm4-complete', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · HOÀN THÀNH', mission: 'Tốt nghiệp bằng bằng chứng hiện tại',
    objective: 'Màn hình đích dành cho lần kết nối sau', panelLabel: 'TRẠNG THÁI',
    panelStatus: 'CHƯA ĐƯỢC KÍCH HOẠT', tone: 'neutral',
    request: 'Chế độ duyệt nội dung không được phép mở màn hình này như một kết quả hoàn thành.',
    evidence: [], dialogue: 'Kết quả tốt nghiệp chỉ được cấp sau khi Practice, bài kiểm tra làm chủ, Preview, quyền sở hữu và điều kiện chuyển giao thật được nối rồi kiểm chứng.', choices: []
  }
} as const satisfies Partial<Record<SceneId, RegistrySceneContent>>

export const moduleFourScenes = {
  ...instructionalScenes,
  ...assessmentScenes
} satisfies Partial<Record<SceneId, RegistrySceneContent>>
