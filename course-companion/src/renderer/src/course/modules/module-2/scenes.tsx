import type { RegistrySceneContent } from '../../module-contracts'

export const moduleTwoScenes = {
  'module-2-portfolio-placeholder': {
    lessonId: 'module-2',
    checkpointId: 'm2-portfolio-brief',
    step: 1,
    totalSteps: 1,
    lessonLabel: 'MODULE 2 · PORTFOLIO',
    mission: 'Chuẩn bị hành trình lập kế hoạch portfolio',
    objective: 'Xác nhận registry mới có thể hiển thị một scene độc lập',
    panelLabel: 'TRẠNG THÁI',
    panelStatus: 'CHƯA MỞ NỘI DUNG',
    tone: 'neutral',
    request: 'Nội dung học Module 2 sẽ được thêm sau khi Foundation được chấp nhận.',
    evidence: [],
    dialogue: 'Registry cho khóa Portfolio đã sẵn sàng. Scene này chỉ kiểm chứng điểm mở rộng và chưa phải nội dung bài học.',
    choices: []
  }
} as const satisfies Record<string, RegistrySceneContent>
