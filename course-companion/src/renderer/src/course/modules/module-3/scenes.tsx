import type { RegistrySceneContent } from '../../module-contracts'

export const moduleThreeScenes = {
  'module-3-placeholder': {
    lessonId: 'module-3',
    checkpointId: 'm3-scaffold-baseline',
    step: 1,
    totalSteps: 1,
    lessonLabel: 'MODULE 3 · BUILD',
    mission: 'Chuẩn bị hành trình xây dựng portfolio',
    objective: 'Giữ một điểm mở rộng typed cho Module 3',
    panelLabel: 'TRẠNG THÁI',
    panelStatus: 'ĐANG KHÓA',
    tone: 'neutral',
    request: 'Module 3 chỉ được mở sau khi Module 2 được chấp nhận.',
    evidence: [],
    dialogue: 'Đây là scene kiểm chứng registry, chưa phải nội dung bài học.',
    choices: []
  }
} as const satisfies Record<string, RegistrySceneContent>
