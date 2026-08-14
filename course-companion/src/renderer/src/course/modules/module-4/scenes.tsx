import type { RegistrySceneContent } from '../../module-contracts'

export const moduleFourScenes = {
  'module-4-placeholder': {
    lessonId: 'module-4',
    checkpointId: 'm4-release-validation',
    step: 1,
    totalSteps: 1,
    lessonLabel: 'MODULE 4 · RELEASE',
    mission: 'Chuẩn bị hành trình phát hành portfolio',
    objective: 'Giữ một điểm mở rộng typed cho Module 4',
    panelLabel: 'TRẠNG THÁI',
    panelStatus: 'ĐANG KHÓA',
    tone: 'neutral',
    request: 'Module 4 chỉ được mở sau khi Module 3 được chấp nhận.',
    evidence: [],
    dialogue: 'Đây là scene kiểm chứng registry, chưa phải nội dung bài học.',
    choices: []
  }
} as const satisfies Record<string, RegistrySceneContent>
