import type { RegistrySceneContent } from '../../module-contracts'

export const moduleThreeScenes = {
  'module-3-readiness': {
    lessonId: 'module-3', checkpointId: 'm3-scaffold-baseline', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 3 · THỰC HIỆN PLAN', mission: 'Bắt đầu từ plan đã duyệt',
    objective: 'Thực hiện Implementation Plan, từng bước một', panelLabel: 'ĐẦU VÀO',
    panelStatus: 'PRD · IMPLEMENTATION PLAN', tone: 'good',
    request: 'Module 2 đã chuẩn bị hai tài liệu để Codex bắt đầu xây website.',
    evidence: [
      { label: 'PRD', value: 'Đã duyệt', ready: true },
      { label: 'PLAN', value: 'Đã duyệt', ready: true }
    ],
    dialogue: 'Kết thúc module 2, chúng ta đã có một PRD và một implementation plan. Trong module 3, chúng ta sẽ cùng hiện thực hoá nó.\n\nChúng ta sẽ thực hiện từng đoạn một của implementation plan, và kiểm tra lại sau mỗi giai đoạn để chắc chắn rằng chúng ta đang đi đúng hướng. Cách này dù lâu nhưng sẽ đảm bảo về sau ta ít bị mắc lỗi hơn\n\nCodex sẽ thực hiện từng phần của implementation plan. Sau mỗi phần, Codex giải thích những gì đã thay đổi và chạy các kiểm tra phù hợp. Bạn xem kết quả thực tế, đọc phần giải thích và kết quả kiểm tra của agent, rồi quyết định chấp nhận hoặc yêu cầu chỉnh sửa.',
    choices: [{ label: 'Tìm hiểu cách xử lý lỗi', next: 'module-3-debugging-intro', primary: true }]
  },
  'module-3-debugging-intro': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 3 · DEBUG', mission: 'Chuẩn bị khi gặp bug',
    objective: 'Biết cách phối hợp với coding agent khi sản phẩm gặp lỗi', panelLabel: 'BUG',
    panelStatus: 'KHÓ TRÁNH KHỎI', tone: 'neutral',
    request: 'Planning tốt giúp giảm lỗi, nhưng không loại bỏ hoàn toàn việc debugging.',
    evidence: [],
    dialogue: 'Okay, bây giờ bạn đã có một implementation plan và bắt đầu thực hiện nó. Đến giai đoạn này, có một điều mình chắc chắn bạn sẽ không thể tránh khỏi. Đó chính là gặp bug (lỗi phần mềm). Hiện tại coding agent chưa phát triển đến mức làm hoàn hảo mọi yêu cầu của bạn mà không có tí lỗi nào.\n\nThực ra hồi mới bắt đầu code với Coding agents, đâu đó tầm 40% thời gian mình dành để lên kế hoạch và xây sản phẩm thôi, 60% thời gian còn lại mình dành cho debugging (khắc phục lỗi). Thực ra hoàn thành tốt giai đoạn planning và implementation plan đã giúp bạn giảm khá khá bugs rồi. Nhưng vẫn khó tránh khỏi việc bạn sẽ gặp bug trong quá trình xây sản phẩm.\n\nVậy khi gặp bug thì xử lý thế nào?',
    choices: [{ label: 'Khi lỗi xuất hiện trên màn hình', next: 'module-3-visible-error', primary: true }]
  },
  'module-3-visible-error': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 3 · DEBUG', mission: 'Gửi bằng chứng nhìn thấy được',
    objective: 'Mô tả lỗi đủ rõ để agent bắt đầu điều tra', panelLabel: 'ẢNH LỖI',
    panelStatus: 'THÊM BỐI CẢNH', tone: 'neutral',
    request: 'Gửi ảnh cùng thao tác, kết quả mong đợi và kết quả thực tế.',
    evidence: [
      { label: 'BẠN ĐANG LÀM GÌ', value: 'Thao tác vừa thực hiện' },
      { label: 'SO SÁNH', value: 'Mong đợi · thực tế' }
    ],
    dialogue: 'Khi gặp một bug có thể nhìn thấy trên màn hình, hãy chụp lại bug đó và gửi ảnh cho coding agent.\n\nĐừng chỉ gửi ảnh. Hãy nói thêm bạn đang làm gì, bạn mong đợi điều gì và kết quả thực tế ra sao. Từ những thông tin này, agent có thể kiểm tra code, tìm nguyên nhân và giải thích lỗi bằng ngôn ngữ dễ hiểu trước khi sửa.\n\nSau khi agent sửa xong, hãy thực hiện lại đúng thao tác đã gây lỗi. Nếu lỗi không còn xuất hiện, chúng ta có thể tiếp tục.',
    choices: [{ label: 'Xem ví dụ prompt', next: 'module-3-visible-error-prompt', primary: true }]
  },
  'module-3-visible-error-prompt': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 3 · DEBUG', mission: 'Đọc một prompt báo lỗi',
    objective: 'Hình dung cách gửi ảnh lỗi cho coding agent', panelLabel: 'PROMPT MẪU',
    panelStatus: 'ẢNH · MONG ĐỢI · THỰC TẾ', tone: 'good',
    request: 'Prompt trong hình cung cấp đủ bối cảnh để agent bắt đầu điều tra.',
    evidence: [],
    dialogue: 'Trên đây là ví dụ của một prompt bạn có thể áp dụng. Trong trường hợp này, lỗi có thể thấy ngay ở trên trang web, nên bạn chỉ việc cắt screenshot và nhắn prompt như trên là được.',
    choices: [{ label: 'Khi ảnh chưa cho thấy nguyên nhân', next: 'module-3-terminal-logs', primary: true }]
  },
  'module-3-terminal-logs': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 3 · DEBUG', mission: 'Dùng log để tìm nguyên nhân',
    objective: 'Cho agent thêm bằng chứng vào terminal', panelLabel: 'LOG TRONG TERMINAL',
    panelStatus: 'BẰNG CHỨNG', tone: 'neutral',
    request: 'Sau khi sửa xong, agent có thể xoá những đoạn log không còn cần thiết.',
    evidence: [
      { label: 'TRƯỚC KHI SỬA', value: 'Thêm log · tái hiện lỗi' },
      { label: 'SAU KHI SỬA', value: 'Xoá log không cần thiết' }
    ],
    dialogue: 'Đôi khi ảnh chụp chỉ cho thấy kết quả bị sai, nhưng chưa cho biết vì sao lỗi xảy ra.\n\nNếu bạn copy paste ảnh lỗi mà vẫn chưa sửa được, bạn có thể bảo agent add logs vào terminal để kiểm tra. Những dòng log này sẽ cho coding agent biết được tại sao app lại bị lỗi chứ không phải phỏng đoán. Và sau khi lỗi đã được khắc phục thì bạn có thể bảo coding agent xoá những đoạn logs không cần thiết',
    choices: [{ label: 'Khi lỗi vẫn quay lại', next: 'module-3-repeated-error', primary: true }]
  },
  'module-3-repeated-error': {
    lessonId: 'module-3', checkpointId: 'm3-complete-first-version', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 3 · DEBUG', mission: 'Dừng việc sửa theo phỏng đoán',
    objective: 'Kiểm tra từng nguyên nhân bằng bằng chứng', panelLabel: 'LỖI QUAY LẠI',
    panelStatus: 'TẠM DỪNG VÀ ĐIỀU TRA', tone: 'neutral',
    request: 'Nêu các nguyên nhân có thể, rồi kiểm tra nguyên nhân nào thực sự có bằng chứng.',
    evidence: [],
    dialogue: 'Nếu lỗi vẫn quay lại sau nhiều lần sửa, hãy yêu cầu AI tạm dừng và liệt kê những nguyên nhân có thể khiến lỗi xảy ra. Cách này giúp quá trình điều tra có hệ thống hơn và thường tìm ra nguyên nhân gốc, thay vì chỉ vá những biểu hiện trước mắt.\n\nSau đó, hãy yêu cầu coding agent kiểm tra từng nguyên nhân và dựa vào bằng chứng để xác định nguyên nhân nào thực sự gây ra lỗi.',
    choices: [{ label: 'Tìm hiểu Git', next: 'module-3-git-intro', primary: true }]
  },
  'module-3-git-intro': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · GIT', mission: 'Lưu lịch sử của dự án',
    objective: 'Hiểu vì sao Git giúp quá trình xây dựng an toàn hơn', panelLabel: 'GIT',
    panelStatus: 'QUẢN LÝ PHIÊN BẢN', tone: 'good',
    request: 'Bạn cần hiểu mục đích; agent sẽ xử lý các thao tác kỹ thuật.',
    evidence: [
      { label: 'REPOSITORY', value: 'Tệp dự án và lịch sử thay đổi' },
      { label: 'KHI CẦN', value: 'Quay lại một phiên bản trước' }
    ],
    dialogue: 'Trong quá trình debugging, có thể bạn sẽ cần phải khôi phục phiên bản trước khi có lỗi, để xem lỗi nằm ở đâu. Đó là lúc Git có tác dụng\n\nGit là một hệ thống quản lý phiên bản phân tán. Hệ thống quản lý phiên bản giúp ghi lại những thay đổi của dự án theo thời gian và cho phép quay lại một phiên bản trước đó khi cần.\n\nRepository, hay kho lưu trữ dự án, là nơi Git quản lý các tệp của dự án cùng lịch sử thay đổi của chúng.\n\n“Phân tán” có nghĩa là repository trên máy tính của bạn không chỉ giữ phiên bản mới nhất, mà còn có lịch sử của dự án. Bạn có thể thấy được tất cả phiên bản cũ mà bạn từng làm, cũng như các phiên bản mà hiện tại bạn đang phát triển.',
    choices: [{ label: 'Phân biệt Git và GitHub', next: 'module-3-git-github', primary: true }]
  },
  'module-3-git-github': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · GIT VÀ GITHUB', mission: 'Phân biệt hai khái niệm',
    objective: 'Biết điều gì nằm trên máy và điều gì nằm trên mạng', panelLabel: 'KHÁC NHAU',
    panelStatus: 'GIT ≠ GITHUB', tone: 'neutral',
    showTitle: false,
    request: 'Bạn có thể dùng Git mà không cần kết nối với GitHub.',
    evidence: [
      { label: 'GIT', value: 'Hoạt động trên máy tính' },
      { label: 'GITHUB', value: 'Nền tảng trực tuyến' }
    ],
    dialogue: 'Git và GitHub thường được nhắc đến cùng nhau, nhưng thực ra chúng là hai khái niệm khác nhau.\n\nGit là một hệ thống hoạt động trên máy tính của bạn. Git theo dõi các tệp trong repository và lưu lại lịch sử thay đổi của chúng. Bạn có thể dùng Git mà không cần kết nối với GitHub.\n\nGitHub là một nền tảng trực tuyến. Bạn có thể đưa repository từ máy tính lên GitHub để lưu thêm một bản trên mạng. Sau đó, bạn có thể truy cập dự án từ máy khác hoặc chia sẻ với người khác.\n\nGitHub cũng cung cấp các công cụ giúp mọi người cùng thảo luận và quản lý công việc.',
    choices: [{ label: 'Commit là gì?', next: 'module-3-git-commit', primary: true }]
  },
  'module-3-git-commit': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · COMMIT', mission: 'Lưu một phiên bản của dự án',
    objective: 'Hiểu lịch sử Git được tạo như thế nào', panelLabel: 'COMMIT',
    panelStatus: 'MỘT PHIÊN BẢN ĐÃ LƯU', tone: 'good',
    request: 'Nhiều commit nối tiếp nhau tạo thành lịch sử của dự án.',
    evidence: [
      { label: 'NƠI LƯU', value: 'Repository trên máy tính' },
      { label: 'MÔ TẢ', value: 'Một lời nhắn ngắn' }
    ],
    dialogue: 'Khi bạn thay đổi các tệp trong một repository, Git chưa tự coi những thay đổi đó là một phiên bản đã hoàn thành. Khi dự án đạt đến trạng thái mà bạn muốn lưu lại, bạn có thể tạo một commit.\n\nCommit là một phiên bản của dự án được lưu trong lịch sử Git. Nó ghi lại trạng thái của dự án tại thời điểm đó. Nhiều commit nối tiếp nhau tạo thành lịch sử của dự án.\n\nMỗi dòng trong hình là một commit. Các commit nối tiếp nhau cho thấy dự án đã được lưu lại qua nhiều phiên bản.\n\nMột commit được lưu trong repository trên máy tính của bạn. Nó không tự động xuất hiện trên GitHub.\n\nNếu muốn lưu các commit trên GitHub, bạn cần thực hiện một bước riêng. Trang tiếp theo sẽ giải thích bước đó.',
    choices: [{ label: 'Đưa commit lên GitHub', next: 'module-3-git-push', primary: true }]
  },
  'module-3-git-push': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · PUSH', mission: 'Đưa commit lên GitHub',
    objective: 'Phân biệt tạo commit và gửi commit', panelLabel: 'PUSH',
    panelStatus: 'MÁY TÍNH → GITHUB', tone: 'neutral',
    request: 'Push không tạo commit mới và không tự động xảy ra sau mỗi giai đoạn.',
    evidence: [],
    dialogue: 'Push là thao tác gửi những commit mới từ repository trên máy tính lên repository của cùng dự án trên GitHub.\n\nSau khi push thành công, các commit đó sẽ xuất hiện trong lịch sử dự án trên GitHub. Push không tạo commit mới; nó chỉ đưa những commit đã có trên máy tính lên GitHub.\n\nPhần này không giới thiệu câu lệnh, remote hoặc origin. Agent sẽ xử lý các thao tác kỹ thuật.\n\nViệc giới thiệu push không có nghĩa là sau mỗi giai đoạn đều phải đưa commit lên GitHub. Push là một hành động đưa dữ liệu ra ngoài và được xử lý riêng, thay vì tự động trở thành một bước trong mỗi vòng triển khai.',
    choices: [{ label: 'Thử nghiệm bằng branch', next: 'module-3-git-branch', primary: true }]
  },
  'module-3-git-branch': {
    lessonId: 'module-3', checkpointId: 'm3-whole-page-revision', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 3 · BRANCH', mission: 'Thử nghiệm an toàn',
    objective: 'Tách phần thử nghiệm khỏi phiên bản ổn định', panelLabel: 'BRANCH',
    panelStatus: 'HƯỚNG PHÁT TRIỂN RIÊNG', tone: 'good',
    request: 'Sau khi thử, bạn quyết định có đưa thay đổi vào phiên bản ổn định hay không.',
    evidence: [],
    dialogue: 'Bây giờ, giả sử bạn đang phát triển một tính năng mới. Bạn chưa chắc mình có muốn đưa tính năng đó vào sản phẩm hay không, nhưng vẫn muốn thử nghiệm thêm.\n\nBạn không nên thử trực tiếp trên phiên bản đang hoạt động ổn định. Những thay đổi chưa hoàn thiện có thể làm hỏng phần đang hoạt động tốt.\n\nĐây là lúc bạn có thể dùng branch. Branch là một hướng phát triển riêng trong cùng repository. Nó cho phép bạn thử nghiệm tính năng mới mà chưa làm thay đổi phiên bản ổn định.\n\nSau khi thử nghiệm, bạn xem kết quả rồi quyết định có đưa tính năng vào phiên bản ổn định hay không. Agent sẽ thực hiện phần kỹ thuật sau khi bạn lựa chọn.',
    choices: [{ label: 'Mở Practice', next: 'module-3-portfolio-practice', primary: true }]
  },
  'module-3-portfolio-practice': {
    lessonId: 'module-3', checkpointId: 'm3-portfolio-build', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 3 · PRACTICE', mission: 'Xây website cùng Codex',
    objective: 'Thực hiện plan cho đến khi website hiện tại sẵn sàng', panelLabel: 'TEACHER TRIẾT',
    panelStatus: 'HOÀN THÀNH BÀI · XEM OBJECTIVE', tone: 'good',
    request: 'Teacher Triết kiểm tra bằng chứng hiện tại khi bạn bấm Hoàn thành bài.',
    evidence: [
      { label: 'TASK', value: 'Tiếp tục từ Module 2' },
      { label: 'REVIEW', value: 'Bằng chứng hiện tại' }
    ],
    dialogue: 'Tiếp tục làm việc với Codex cho đến khi bạn hài lòng với website hiện tại. Teacher Triết không mở một cuộc điều tra lỗi song song.',
    choices: [{ label: 'Mở Practice xây portfolio', action: 'practice', primary: true }]
  },
  'module-3-portfolio-mastery': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Kiểm tra những gì bạn vừa học',
    objective: 'Phân biệt các cách làm gần giống nhau', panelLabel: 'BÀI KIỂM TRA',
    panelStatus: '5 CÂU', tone: 'good',
    request: 'Các câu hỏi được đặt cùng nhau ở cuối bài.',
    evidence: [],
    dialogue: 'Bạn sẽ trả lời năm tình huống về cách thực hiện plan, báo lỗi, dùng log, điều tra lỗi quay lại và thử nghiệm trên branch.',
    choices: [{ label: 'Bắt đầu tổng kết', next: 'module-3-mastery-plan', primary: true }]
  },
  'module-3-mastery-plan': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Thực hiện plan theo từng phần', objective: 'Kiểm tra trước khi đi tiếp',
    panelLabel: 'CÂU 1/5', panelStatus: 'TÌNH HUỐNG', tone: 'neutral', request: 'Chọn cách xử lý phù hợp nhất.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-plan', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-visible-error': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Báo lỗi bằng ảnh', objective: 'Gửi đủ bối cảnh để agent điều tra',
    panelLabel: 'CÂU 2/5', panelStatus: 'TÌNH HUỐNG', tone: 'neutral', request: 'Chọn cách xử lý phù hợp nhất.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-visible-error', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-logs': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Dùng log', objective: 'Tìm nguyên nhân trước khi sửa',
    panelLabel: 'CÂU 3/5', panelStatus: 'TÌNH HUỐNG', tone: 'neutral', request: 'Chọn cách xử lý phù hợp nhất.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-logs', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-repeated-error': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Lỗi liên tục quay lại', objective: 'Kiểm tra nguyên nhân bằng bằng chứng',
    panelLabel: 'CÂU 4/5', panelStatus: 'TÌNH HUỐNG', tone: 'neutral', request: 'Chọn cách xử lý phù hợp nhất.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-repeated-error', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-branch': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Thử nghiệm trên branch', objective: 'Giữ phiên bản ổn định an toàn',
    panelLabel: 'CÂU 5/5', panelStatus: 'TÌNH HUỐNG', tone: 'neutral', request: 'Chọn cách xử lý phù hợp nhất.', evidence: [], dialogue: '', choices: [],
    assessmentQuestionId: 'm3-mastery-branch', assessmentGroupId: 'm3-final-assessment'
  },
  'module-3-mastery-summary': {
    lessonId: 'module-3', checkpointId: 'm3-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · TỔNG KẾT', mission: 'Đối chiếu kết quả', objective: 'Kết hợp câu trả lời với Practice hiện tại',
    panelLabel: 'KẾT QUẢ', panelStatus: 'CHỜ ĐỐI CHIẾU', tone: 'neutral', request: 'Practice và phần tổng kết đều phải hoàn thành.',
    evidence: [], dialogue: '', choices: [], assessmentGroupId: 'm3-final-assessment', assessmentSummary: true
  },
  'module-3-complete': {
    lessonId: 'module-3', checkpointId: 'm3-complete', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 3 · HOÀN THÀNH', mission: 'Sẵn sàng cho Module 4', objective: 'Module 3 đã hoàn thành',
    panelLabel: 'BÀN GIAO MODULE 4', panelStatus: 'WEBSITE ĐÃ ĐƯỢC CHẤP NHẬN', tone: 'good',
    request: 'Module 4 tiếp tục từ workspace và bằng chứng hiện tại.', evidence: [],
    dialogue: 'Bạn đã hiện thực hoá implementation plan, xử lý lỗi cùng coding agent và dùng Git để làm việc an toàn hơn.', choices: []
  }
} as const satisfies Record<string, RegistrySceneContent>
