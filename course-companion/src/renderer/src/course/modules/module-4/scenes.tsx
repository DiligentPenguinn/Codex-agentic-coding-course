import type { SceneId } from '../../../../../../shared/contracts'
import type { RegistrySceneContent } from '../../module-contracts'

const instructionalScenes = {
  'module-4-hosting-intro': {
    lessonId: 'module-4', checkpointId: 'm4-release-validation', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 4 · HOSTING', mission: 'Để người khác xem được portfolio',
    objective: 'Hiểu vì sao website cần một nơi trên Internet', panelLabel: 'HOSTING LÀ GÌ?',
    panelStatus: 'TỪ MÁY CỦA BẠN RA INTERNET', tone: 'neutral',
    request: 'Website cần một nơi để người khác truy cập, kể cả khi bạn tắt máy.',
    evidence: [],
    dialogue: 'Bạn đã làm xong portfolio và mở được nó trên máy. Bây giờ, bạn muốn gửi cho một người bạn xem. Buồn một nỗi là với tình trạng hiện tại thì không thể nào gửi được, bởi vì portfolio của bạn chỉ đang trỏ đến localhost, IP mà chỉ có máy tính hiện tại của bạn kết nối được. \n\nBạn cần đặt website ở một nơi có thể truy cập qua Internet. Nói cách khác, bạn cần host portfolio của bạn trên một địa chỉ online mà ai cũng truy cập được..\n\nKhi website đã được đưa lên đó, người khác có thể mở bằng đường link, kể cả khi bạn đã tắt máy. Trong khóa học này, chúng ta sẽ dùng Vercel để làm việc đó.',
    highlightTerms: ['localhost', 'hosting', 'Vercel'],
    choices: [{ label: 'Máy tính, GitHub và Vercel làm gì?', next: 'module-4-vercel-benefits', primary: true }]
  },
  'module-4-vercel-benefits': {
    lessonId: 'module-4', checkpointId: 'm4-release-validation', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Vercel giúp bạn làm gì?",
    objective: "Vercel giúp bạn làm gì?", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Vercel giúp bạn làm gì?", evidence: [],
    dialogue: 'Hãy xem video để biết cách đưa portfolio lên Vercel.',
    choices: [{ label: 'Tiếp tục', next: 'module-4-after-video', primary: true }]
  },
  'module-4-after-video': {
    lessonId: 'module-4', checkpointId: 'm4-release-validation', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Mở portfolio vừa đưa lên mạng",
    objective: "Mở portfolio vừa đưa lên mạng", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'CẬP NHẬT PORTFOLIO', tone: 'neutral',
    request: "Mở portfolio vừa đưa lên mạng", evidence: [],
    dialogue: "Khi thực hành đưa portfolio lên Vercel, bạn hãy mở đường link mà Vercel cung cấp.\n\n Sau đó, hãy xem nội dung đã hiện đúng ý bạn chưa, ảnh có tải được không, v.v. Thử cả trên máy tính và điện thoại.\n\n Nếu website chưa mở được hoặc còn lỗi, bạn hãy nhờ agent tìm nguyên nhân và sửa nó. Thường là quá trình này khá đơn giản nên cũng sẽ không có lỗi gì nghiêm trọng xảy ra.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-vercel-preview', primary: true }]
  },
  'module-4-vercel-preview': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Chọn một thay đổi nhỏ",
    objective: "Chọn một thay đổi nhỏ", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'CẬP NHẬT PORTFOLIO', tone: 'neutral',
    request: "Chọn một thay đổi nhỏ", evidence: [],
    dialogue: "Sau khi phát hành portfolio trong Practice, bạn sẽ có một website để gửi cho người khác xem. Nếu bạn muốn dùng tên miền riêng thay cho địa chỉ có đuôi .vercel.app thì bạn có thể mua ngay trong Vercel.\n\nSau này nếu bạn muốn thay đổi bất kỳ chi tiết gì, bạn có thể sửa và kiểm tra trước ở môi trường local. Sau đó, nếu thấy ưng ý rồi thì hãy commit và push lên branch main. Nếu main là branch Vercel đang dùng để phát hành website, Vercel sẽ tự động cập nhật thay đổi của bạn sau khi triển khai thành công.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-portfolio-practice', primary: true }]
  },
  'module-4-portfolio-practice': {
    lessonId: 'module-4', checkpointId: 'm4-portfolio-release', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · THỰC HÀNH', mission: 'Thực hành phát hành portfolio',
    objective: 'Có portfolio trên mạng để chia sẻ', panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'SẴN SÀNG THỰC HÀNH', tone: 'neutral',
    request: 'Dùng portfolio và tài khoản của bạn để thực hành cùng Codex.', evidence: [],
    dialogue: 'Bây giờ, hãy chuyển sang Codex để đưa portfolio của bạn lên mạng theo hướng dẫn vừa học. Khi bạn có một portfolio mở được bằng đường link để gửi cho người khác xem, bạn đã đạt mục tiêu của Module 4 rồi. Không có bài kiểm tra cuối phần này.',
    choices: [{ label: 'Mở Practice phát hành', action: 'practice', primary: true }]
  },
  'module-4-complete': {
    lessonId: 'module-4', checkpointId: 'm4-complete', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · HOÀN THÀNH', mission: 'Tốt nghiệp bằng bằng chứng hiện tại',
    objective: 'Có portfolio trên mạng để chia sẻ', panelLabel: 'TRẠNG THÁI',
    panelStatus: 'ĐÃ HOÀN THÀNH', tone: 'neutral',
    request: 'Kết quả thực hành Module 4 đã được kiểm tra và lưu.',
    evidence: [], dialogue: 'Bạn đã có portfolio trên mạng để chia sẻ. Triết đã kiểm tra bài thực hành và ứng dụng đã lưu kết quả Module 4.', choices: []
  }
} as const satisfies Partial<Record<SceneId, RegistrySceneContent>>

export const moduleFourScenes = {
  ...instructionalScenes
} satisfies Partial<Record<SceneId, RegistrySceneContent>>
