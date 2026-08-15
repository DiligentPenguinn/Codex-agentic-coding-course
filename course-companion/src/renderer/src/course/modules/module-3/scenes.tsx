import type { RegistrySceneContent } from '../../module-contracts'

export const moduleThreeScenes = {
  'module-3-readiness': {
    lessonId: 'module-3',
    checkpointId: 'm3-scaffold-baseline',
    step: 1,
    totalSteps: 1,
    lessonLabel: 'MODULE 3 · BUILD',
    mission: 'Xác nhận đầu vào trước khi bắt đầu xây',
    objective: 'Module 3 đã nhận đúng thư mục portfolio và bộ tài liệu planning hiện tại',
    panelLabel: 'BÀN GIAO TỪ MODULE 2',
    panelStatus: 'SẴN SÀNG',
    tone: 'good',
    request: 'Chỉ đường dẫn thư mục portfolio và danh sách bảy tệp được bàn giao; nội dung chat cũ không phải đầu vào ẩn.',
    evidence: [
      { label: 'THƯ MỤC', value: 'Đúng portfolio đã chọn', ready: true },
      { label: 'TỆP', value: '7 phiên bản planning hiện tại', ready: true },
      { label: 'CHAT CŨ', value: 'Không được chuyển tiếp', ready: true }
    ],
    dialogue: 'Bạn đã hoàn thành Module 2. Course Companion sẽ giữ điểm sẵn sàng này cho tới khi nội dung xây dựng của Module 3 được mở.',
    choices: []
  }
} as const satisfies Record<string, RegistrySceneContent>
