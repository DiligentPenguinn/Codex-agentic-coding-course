import type { RegistrySceneContent } from '../../module-contracts'

export const moduleThreeScenes = {
  'module-3-readiness': {
    lessonId: 'module-3', checkpointId: 'm3-scaffold-baseline', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 3 · XÂY DỰNG', mission: 'Xác nhận đầu vào',
    objective: 'Bắt đầu từ đúng workspace và planning package hiện tại', panelLabel: 'BÀN GIAO MODULE 2',
    panelStatus: 'SẴN SÀNG', tone: 'good',
    request: 'Course Companion chỉ bàn giao đường dẫn portfolio và tám tham chiếu planning; nội dung chat cũ không phải đầu vào ẩn.',
    evidence: [
      { label: 'THƯ MỤC', value: 'Đúng portfolio đã chọn', ready: true },
      { label: 'PLANNING', value: '7 digest hiện tại', ready: true },
      { label: 'VIEWPORT', value: '1440 × 900 · 390 × 844', ready: true }
    ],
    dialogue: 'Bạn sẽ tạo ứng dụng từ đầu. Trước mọi thay đổi, Codex phải đưa đề xuất có phạm vi và chờ bạn duyệt.',
    choices: [{ label: 'Tìm hiểu nền ứng dụng', next: 'module-3-scaffold-intro', primary: true }]
  },
  'module-3-scaffold-intro': {
    lessonId: 'module-3', checkpointId: 'm3-scaffold-baseline', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 3 · NỀN ỨNG DỤNG', mission: 'Tạo một baseline trung tính',
    objective: 'Duyệt đề xuất trước khi tạo ứng dụng', panelLabel: 'RANH GIỚI SCAFFOLD',
    panelStatus: 'CHƯA CÓ PORTFOLIO SECTION', tone: 'neutral',
    request: 'Đề xuất phải nêu lệnh, dependency, tệp, kết quả, kiểm tra, mạng và quyền cần thiết.',
    evidence: [
      { label: 'ĐƯỢC TẠO', value: 'React · TypeScript · Vite' },
      { label: 'PHẢI ĐẠT', value: 'dev · check · preview' },
      { label: 'CHƯA LÀM', value: 'Hero · dự án · deployment' }
    ],
    dialogue: 'Trang trung tính chứng minh môi trường hoạt động. Nó chưa được phép tự quyết định nội dung hoặc thiết kế portfolio.',
    choices: [{ label: 'Kiểm tra ranh giới scaffold', next: 'module-3-check-scaffold-boundary', primary: true }]
  },
  'module-3-check-scaffold-boundary': {
    lessonId: 'module-3', checkpointId: 'm3-scaffold-baseline', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 3 · NỀN ỨNG DỤNG', mission: 'Kiểm tra ranh giới', objective: 'Nhận ra scaffold tối thiểu',
    panelLabel: 'CÂU KIỂM TRA', panelStatus: '1 CÂU', tone: 'neutral', request: 'Trả lời trước khi xem phản hồi.',
    evidence: [], dialogue: '', choices: [], assessmentQuestionId: 'scaffold-retrieval-1', assessmentGroupId: 'scaffold-retrieval'
  },
  'module-3-first-version-intro': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 3 · PHIÊN BẢN ĐẦU', mission: 'Xây theo bốn phần', objective: 'Một kết quả hoàn chỉnh, bốn thay đổi có thể khôi phục',
    panelLabel: 'THỨ TỰ', panelStatus: '4 PHẦN · 4 LẦN DUYỆT', tone: 'good',
    request: 'Mỗi phần phải có phạm vi, kiểm tra, quan sát trình duyệt, tóm tắt năm phần và checkpoint riêng.',
    evidence: [
      { label: '01', value: 'Nền trang và Hero' },
      { label: '02', value: 'Selected Work' },
      { label: '03–04', value: 'About/Contact · responsive/accessibility' }
    ],
    dialogue: 'Tên “phiên bản đầu hoàn chỉnh” mô tả kết quả cho người xem. Nó không cho phép Codex tạo toàn trang trong một thay đổi lớn.',
    choices: [{ label: 'Kiểm tra gate từng phần', next: 'module-3-check-slice-gate', primary: true }]
  },
  'module-3-check-slice-gate': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 3 · PHIÊN BẢN ĐẦU', mission: 'Giữ gate từng phần', objective: 'Không đi vòng qua phần chưa đạt',
    panelLabel: 'CÂU KIỂM TRA', panelStatus: '1 CÂU', tone: 'neutral', request: 'Trả lời trước khi xem phản hồi.',
    evidence: [], dialogue: '', choices: [], assessmentQuestionId: 'first-version-retrieval-1', assessmentGroupId: 'first-version-retrieval'
  },
  'module-3-revision-intro': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · CẢI THIỆN', mission: 'Sửa một điều quan sát được', objective: 'Chuyển phản hồi thông thường thành đề xuất có giới hạn',
    panelLabel: 'ĐẦU VÀO', panelStatus: 'PRD · THIẾT KẾ · HAI VIEWPORT', tone: 'neutral',
    request: 'Đề xuất phải nêu mục tiêu, tệp, điều giữ nguyên, kết quả mong đợi và kiểm tra hồi quy.',
    evidence: [{ label: 'TRƯỚC', value: 'Quan sát thật' }, { label: 'SAU', value: 'Kết quả đối chiếu được' }],
    dialogue: 'Bạn không cần nói bằng thuật ngữ thiết kế. Một câu như “dự án xuất hiện quá muộn” đã đủ để Codex đề xuất một thay đổi nhỏ.',
    choices: [{ label: 'Kiểm tra phạm vi sửa', next: 'module-3-check-revision-scope', primary: true }]
  },
  'module-3-check-revision-scope': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · CẢI THIỆN', mission: 'Giới hạn thay đổi', objective: 'Phân biệt sửa có bằng chứng với thiết kế lại tùy ý',
    panelLabel: 'CÂU KIỂM TRA', panelStatus: '1 CÂU', tone: 'neutral', request: 'Trả lời trước khi xem phản hồi.',
    evidence: [], dialogue: '', choices: [], assessmentQuestionId: 'revision-retrieval-1', assessmentGroupId: 'revision-retrieval'
  },
  'module-3-debugging-intro': {
    lessonId: 'module-3', checkpointId: 'm3-evidence-debugging', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 3 · GỠ LỖI', mission: 'Điều tra trước khi sửa', objective: 'Dùng bằng chứng để chọn một giả thuyết',
    panelLabel: 'VÒNG GỠ LỖI', panelStatus: '6 BƯỚC', tone: 'neutral',
    request: 'Tái hiện → mong đợi/thực tế → bằng chứng → một giả thuyết → bản sửa nhỏ nhất → kiểm tra lại.',
    evidence: [{ label: 'LỖI', value: 'Thật hoặc course-controlled' }, { label: 'KẾT THÚC', value: 'Gốc + hồi quy đều đạt' }],
    dialogue: 'Sửa ngay khi chưa có bằng chứng thường tạo thêm thay đổi mà không chứng minh được nguyên nhân.',
    choices: [{ label: 'Kiểm tra thứ tự gỡ lỗi', next: 'module-3-check-debug-order', primary: true }]
  },
  'module-3-check-debug-order': {
    lessonId: 'module-3', checkpointId: 'm3-evidence-debugging', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 3 · GỠ LỖI', mission: 'Điều tra có thứ tự', objective: 'Biết việc cần làm trước khi sửa',
    panelLabel: 'CÂU KIỂM TRA', panelStatus: '1 CÂU', tone: 'neutral', request: 'Trả lời trước khi xem phản hồi.',
    evidence: [], dialogue: '', choices: [], assessmentQuestionId: 'debugging-retrieval-1', assessmentGroupId: 'debugging-retrieval'
  },
  'module-3-enhancement-intro': {
    lessonId: 'module-3', checkpointId: 'm3-independent-enhancement', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · CẢI TIẾN ĐỘC LẬP', mission: 'Tự định hướng một thay đổi nhỏ', objective: 'Nêu mục tiêu và tiêu chí với ít hướng dẫn hơn',
    panelLabel: 'RANH GIỚI', panelStatus: '1 CẢI TIẾN', tone: 'good',
    request: 'Cải tiến không được phá portfolio core hoặc thêm backend và dịch vụ xử lý dữ liệu.',
    evidence: [{ label: 'BẠN CHỌN', value: 'Mục tiêu và tiêu chí' }, { label: 'CODEX', value: 'Kế hoạch nhỏ và kiểm tra' }],
    dialogue: 'Thành công không nằm ở số tính năng. Bạn cần giải thích vì sao chọn cải tiến và dùng bằng chứng nào để nghiệm thu.',
    choices: [{ label: 'Kiểm tra ranh giới cải tiến', next: 'module-3-check-enhancement-boundary', primary: true }]
  },
  'module-3-check-enhancement-boundary': {
    lessonId: 'module-3', checkpointId: 'm3-independent-enhancement', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · CẢI TIẾN ĐỘC LẬP', mission: 'Giữ cửa an toàn', objective: 'Nhận ra thay đổi cần phạm vi bảo mật riêng',
    panelLabel: 'CÂU KIỂM TRA', panelStatus: '1 CÂU', tone: 'neutral', request: 'Trả lời trước khi xem phản hồi.',
    evidence: [], dialogue: '', choices: [], assessmentQuestionId: 'enhancement-retrieval-1', assessmentGroupId: 'enhancement-retrieval'
  },
  'module-3-portfolio-practice': {
    lessonId: 'module-3', checkpointId: 'm3-portfolio-build', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · PRACTICE', mission: 'Xây portfolio trong một task xuyên suốt', objective: 'Hoàn thành năm milestone và bốn phần xây dựng',
    panelLabel: 'BẰNG CHỨNG', panelStatus: '8 TỆP · 5 STAGE · 4 PHẦN', tone: 'good',
    request: 'Course Companion đọc lại filesystem, lệnh, browser evidence và lời duyệt trước khi cấp từng biên nhận.',
    evidence: [{ label: 'TASK', value: 'Một Executor task' }, { label: 'CHECKPOINT', value: 'Có thể khôi phục' }, { label: 'REVIEW', value: 'Tóm tắt năm phần' }],
    dialogue: 'Mở Practice để thực hiện hành trình thật trong thư mục portfolio đã chọn. Lời báo cáo của Executor không tự trở thành bằng chứng đã kiểm chứng.',
    choices: [{ label: 'Mở Practice xây portfolio', action: 'practice', primary: true }]
  },
  'module-3-portfolio-mastery': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · MASTERY', mission: 'Chứng minh bạn sở hữu vòng triển khai', objective: 'Áp dụng nguyên tắc và giải thích bằng chứng của mình',
    panelLabel: 'BÀI KIỂM TRA', panelStatus: '3 TÌNH HUỐNG · 2 CÂU TỪ ARTIFACT', tone: 'good',
    request: 'Practice và mastery là hai điều kiện riêng; không điều kiện nào thay thế điều còn lại.',
    evidence: [], dialogue: 'Ba tình huống kiểm tra cách xử lý gate. Hai câu tự viết dùng revision và enhancement thật của bạn.',
    choices: [{ label: 'Bắt đầu kiểm tra', next: 'module-3-mastery-scaffold', primary: true }]
  },
  'module-3-mastery-scaffold': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · MASTERY', mission: 'Baseline thật', objective: 'Phân biệt automated check và runtime evidence',
    panelLabel: 'CÂU 1/5', panelStatus: 'TÌNH HUỐNG', tone: 'neutral', request: 'Trả lời trước khi xem phản hồi.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-1', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-slice': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · MASTERY', mission: 'Gate từng phần', objective: 'Không chấp nhận một lần sinh code lớn',
    panelLabel: 'CÂU 2/5', panelStatus: 'TÌNH HUỐNG', tone: 'neutral', request: 'Trả lời trước khi xem phản hồi.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-2', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-debug': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · MASTERY', mission: 'Kiểm tra hồi quy', objective: 'Nhận ra bản sửa gây tác dụng phụ',
    panelLabel: 'CÂU 3/5', panelStatus: 'TÌNH HUỐNG', tone: 'neutral', request: 'Trả lời trước khi xem phản hồi.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-3', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-owned-revision': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · MASTERY', mission: 'Giải thích lần cải thiện', objective: 'Dẫn chiếu revision thật của bạn',
    panelLabel: 'CÂU 4/5', panelStatus: 'TỰ VIẾT', tone: 'neutral', request: 'Dùng revision-record hiện tại.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-owned-revision', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-owned-enhancement': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · MASTERY', mission: 'Giải thích cải tiến', objective: 'Dẫn chiếu tiêu chí và bằng chứng thật của bạn',
    panelLabel: 'CÂU 5/5', panelStatus: 'TỰ VIẾT', tone: 'neutral', request: 'Dùng enhancement-plan hiện tại.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-owned-enhancement', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-summary': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · MASTERY', mission: 'Đối chiếu kết quả', objective: 'Kết hợp mastery với bằng chứng sản phẩm hiện tại',
    panelLabel: 'KẾT QUẢ', panelStatus: 'CHỜ GATE HOÀN THÀNH', tone: 'neutral', request: 'Ngưỡng mastery không được công bố trong bản pilot.',
    evidence: [], dialogue: '', choices: [], assessmentGroupId: 'm3-final-assessment', assessmentSummary: true
  },
  'module-3-complete': {
    lessonId: 'module-3', checkpointId: 'm3-complete', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · HOÀN THÀNH', mission: 'Sẵn sàng kiểm chứng bản phát hành', objective: 'Module 3 đã hoàn thành',
    panelLabel: 'BÀN GIAO MODULE 4', panelStatus: 'ĐÃ LƯU AN TOÀN', tone: 'good',
    request: 'Module 4 chỉ nhận workspace, checkpoint và tham chiếu bằng chứng hiện tại.', evidence: [],
    dialogue: 'Portfolio core, lần cải thiện, báo cáo gỡ lỗi và cải tiến độc lập đã có bằng chứng hiện tại.', choices: []
  }
} as const satisfies Record<string, RegistrySceneContent>
