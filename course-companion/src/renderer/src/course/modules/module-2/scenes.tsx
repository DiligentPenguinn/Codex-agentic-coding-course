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
  },
  'module-2-portfolio-mastery': {
    lessonId: 'module-2',
    checkpointId: 'm2-portfolio-mastery',
    step: 5,
    totalSteps: 5,
    lessonLabel: 'MODULE 2 · PORTFOLIO',
    mission: 'Kiểm tra mức độ sẵn sàng',
    objective: 'Hoàn thành mastery độc lập với bằng chứng Practice',
    panelLabel: 'TRẠNG THÁI',
    panelStatus: 'CHỜ NỘI DUNG M2.5',
    tone: 'neutral',
    request: 'M2.5 sẽ gắn assessment portfolio vào scene này.',
    evidence: [],
    dialogue: 'Năm stage planning đã hoàn thành. Mastery vẫn là một gate riêng và chưa được thay thế bởi Practice receipt.',
    choices: []
  }
} as const satisfies Record<string, RegistrySceneContent>
