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
    dialogue: "Bạn đã làm theo video để đưa portfolio lên Vercel. Bây giờ, hãy mở đường link website của chính bạn.\n\nXem nội dung đã hiện đúng chưa, ảnh có tải được không và các liên kết chính có mở được không. Thử cả trên máy tính và điện thoại. Dòng Ready trên Vercel chỉ cho biết quá trình triển khai đã xong; bạn vẫn cần mở website để kiểm tra.\n\nLưu lại đường link này. Nếu website chưa mở được hoặc còn lỗi, nhờ agent tìm nguyên nhân trước khi thử thay đổi tiếp theo.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-access-check', primary: true }]
  },
  'module-4-access-check': {
    lessonId: 'module-4', checkpointId: 'm4-security-publication', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Ai đang xem được website của bạn?",
    objective: "Ai đang xem được website của bạn?", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'CẬP NHẬT PORTFOLIO', tone: 'neutral',
    request: "Ai đang xem được website của bạn?", evidence: [],
    dialogue: "Bản website chính trên Vercel được gọi là Production. Repo Private trên GitHub chỉ giới hạn người xem code, không quyết định ai được mở website.\n\nHãy mở địa chỉ chính trong cửa sổ riêng tư của trình duyệt. Nếu bạn muốn chia sẻ công khai, người xem cần mở được portfolio mà không phải đăng nhập. Nếu chỉ muốn tự xem, người chưa có quyền cần gặp yêu cầu đăng nhập.\n\nNếu kết quả khác với ý định của bạn, kiểm tra Settings → Deployment Protection trong project Vercel. Vercel Authentication yêu cầu đăng nhập; All Deployments bảo vệ cả địa chỉ chính, còn Standard Protection không bảo vệ địa chỉ đó. Nhờ agent giải thích nếu chưa rõ trước khi đổi quyền.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-vercel-preview', primary: true }]
  },
  'module-4-vercel-preview': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Chọn một thay đổi nhỏ",
    objective: "Chọn một thay đổi nhỏ", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'CẬP NHẬT PORTFOLIO', tone: 'neutral',
    request: "Chọn một thay đổi nhỏ", evidence: [],
    dialogue: "Portfolio đã lên mạng rồi. Bây giờ, hãy thử sửa một câu giới thiệu để học cách cập nhật website. Chọn câu muốn sửa và viết rõ nội dung mới.\n\nBạn sẽ xem thay đổi trên máy trước, sau đó xem thử trên Internet, rồi mới quyết định đưa lên website chính. Cách này giúp bạn kiểm tra bản sửa trước khi người khác nhìn thấy nó.\n\nChỉ sửa một câu trong lần thực hành này để dễ nhận ra điều gì đã thay đổi.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-update-local', primary: true }]
  },
  'module-4-update-local': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Sửa và xem trên máy",
    objective: "Sửa và xem trên máy", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'CẬP NHẬT PORTFOLIO', tone: 'neutral',
    request: "Sửa và xem trên máy", evidence: [],
    dialogue: "Nhờ agent kiểm tra Production Branch, tức branch mà Vercel dùng để cập nhật website chính. Branch này thường là main, nhưng cần xem cấu hình thực tế của project.\n\nYêu cầu agent tạo một branch khác để sửa đúng câu bạn đã chọn và giữ nguyên các phần còn lại. Sau đó, nhờ agent mở bản Local, tức website đang chạy trên máy bạn, để bạn xem. Chưa cho phép push code lên GitHub.\n\nĐọc lại câu mới trên trang. Khi bạn thấy đúng ý, hãy duyệt bản sửa để chuyển sang bước xem thử trên Internet. Việc sửa trên máy chưa làm website chính thay đổi.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-update-preview', primary: true }]
  },
  'module-4-update-preview': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Đưa bản sửa lên Preview",
    objective: "Đưa bản sửa lên Preview", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'CẬP NHẬT PORTFOLIO', tone: 'neutral',
    request: "Đưa bản sửa lên Preview", evidence: [],
    dialogue: "Preview là bản xem thử trên Internet để bạn kiểm tra trước khi cập nhật website chính.\n\nTrước khi đưa code lên, nhờ agent kiểm tra bản dựng và bảo đảm phần sắp gửi cùng lịch sử Git không chứa mật khẩu, token hay API key. Đây là các mã có thể cấp quyền dùng tài khoản hoặc dịch vụ. Nếu phát hiện mã đã lộ, dừng để thu hồi hoặc thay mã trước.\n\nKhi đã sẵn sàng, cho phép agent commit và push branch vừa sửa lên GitHub để Vercel tạo Preview. Nói rõ chỉ cho phép tạo bản xem thử, chưa được merge vào Production Branch hoặc cập nhật website chính.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-preview-review', primary: true }]
  },
  'module-4-preview-review': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Kiểm tra bản xem thử",
    objective: "Kiểm tra bản xem thử", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'CẬP NHẬT PORTFOLIO', tone: 'neutral',
    request: "Kiểm tra bản xem thử", evidence: [],
    dialogue: "Mở project trên Vercel → Deployments, tức danh sách các lần triển khai. Chọn bản mới có trạng thái Ready, môi trường Preview và đúng branch, commit vừa push. Nếu thấy Production, dừng và nhờ agent kiểm tra lại cấu hình.\n\nMở đường link của bản Preview đó. Câu mới cần giống bản bạn đã duyệt trên máy, ảnh và các liên kết liên quan vẫn phải hoạt động. Sau đó mở địa chỉ website chính để xác nhận câu cũ vẫn còn.\n\nKiểm tra quyền truy cập của Preview bằng cửa sổ riêng tư; tên Preview không có nghĩa là riêng tư. Lưu link, commit và kết quả kiểm tra. Nếu còn lỗi, sửa và kiểm tra lại Preview mới trước khi duyệt.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-production-intro', primary: true }]
  },
  'module-4-production-intro': {
    lessonId: 'module-4', checkpointId: 'm4-production-decision', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Duyệt bản cập nhật",
    objective: "Duyệt bản cập nhật", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'CẬP NHẬT PORTFOLIO', tone: 'neutral',
    request: "Duyệt bản cập nhật", evidence: [],
    dialogue: "Bạn đã kiểm tra Preview. Bây giờ, hãy quyết định có đưa câu mới lên website chính hay chưa.\n\nTrước khi duyệt, nhờ agent tóm tắt câu nào sẽ thay đổi, kết quả kiểm tra và phiên bản có thể quay lại nếu gặp lỗi. Nếu còn điều chưa đúng, giữ bản hiện tại và sửa tiếp trên branch riêng.\n\nNếu đồng ý, cho phép agent cập nhật Production bằng bản bạn vừa kiểm tra. Nếu website đang được bảo vệ, lần cập nhật này vẫn giữ quyền truy cập hiện tại. Việc mở cho mọi người xem cần quyết định riêng.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-production-publish', primary: true }]
  },
  'module-4-production-publish': {
    lessonId: 'module-4', checkpointId: 'm4-production-decision', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Đưa bản đã duyệt vào website chính",
    objective: "Đưa bản đã duyệt vào website chính", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'CẬP NHẬT PORTFOLIO', tone: 'neutral',
    request: "Đưa bản đã duyệt vào website chính", evidence: [],
    dialogue: "Nhờ agent xác nhận lại Production Branch, rồi merge thay đổi đã duyệt vào branch đó và push lên GitHub. Merge là gộp thay đổi từ branch đang sửa vào branch đích. Nếu có xung đột, agent cần giải thích để bạn chọn cách xử lý trước khi gộp.\n\nChờ bản Production mới trên Vercel đạt Ready. Đối chiếu commit rồi mở địa chỉ website chính đã lưu sau video để kiểm tra câu mới. Link Preview chưa chứng minh website chính đã cập nhật.\n\nNếu website đang giới hạn người xem, hãy giữ quyền đó trừ khi bạn đã quyết định công khai. Khi đổi quyền truy cập, chỉ đổi trong đúng project và thử lại địa chỉ chính bằng cửa sổ riêng tư.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-production-checks', primary: true }]
  },
  'module-4-production-checks': {
    lessonId: 'module-4', checkpointId: 'm4-production-decision', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Kiểm tra sau khi công bố",
    objective: "Kiểm tra sau khi công bố", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Kiểm tra sau khi công bố", evidence: [],
    dialogue: "Mở địa chỉ chính bằng cửa sổ riêng tư, nơi bạn chưa đăng nhập Vercel. Nếu muốn ai cũng xem được mà trang vẫn yêu cầu đăng nhập, hãy kiểm tra lại quyền và xem bạn có đang dùng nhầm link deployment không.\n\nThử lại ảnh, liên kết dự án, tải CV và cách liên hệ. Mở một trang con rồi tải lại trang; trang chủ chạy được chưa chứng minh mọi đường dẫn đều hoạt động. Xem trên điện thoại và thử Tab, Enter như trước.\n\nLưu địa chỉ chính cùng commit vừa phát hành vào ghi chú dự án. Chỉ đưa link vào CV hoặc hồ sơ cá nhân sau khi các bước này đạt. Nếu gặp lỗi chặn, ngừng chia sẻ thêm và xử lý hoặc khôi phục bản trước.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-share-details', primary: true }]
  },
  'module-4-share-details': {
    lessonId: 'module-4', checkpointId: 'm4-production-decision', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Để đường link sẵn sàng chia sẻ",
    objective: "Để đường link sẵn sàng chia sẻ", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Để đường link sẵn sàng chia sẻ", evidence: [],
    dialogue: "Nhờ agent đối chiếu tiêu đề tab, mô tả ngắn, biểu tượng nhỏ trên tab và ảnh đại diện khi chia sẻ link với phiên bản đã chốt. Nếu bản online hiển thị khác, kiểm tra đúng deployment và đường dẫn tệp. Ảnh hoặc mô tả cũ có thể được ứng dụng nhắn tin lưu tạm nên không phải lúc nào cũng đổi ngay.\n\nĐịa chỉ dạng tên-project.vercel.app đã đủ để bắt đầu. Tên miền riêng, chẳng hạn tên-của-bạn.com, là lựa chọn thêm và thường có phí gia hạn. Nếu mua sau này, thêm tại Settings → Domains rồi làm theo đúng hướng dẫn của Vercel và nơi mua tên miền.\n\nWebsite công khai không đồng nghĩa Google sẽ hiện ngay. Cũng đừng dùng “chưa tìm thấy trên Google” hay một đường link khó đoán để giữ bí mật nội dung.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-update-workflow', primary: true }]
  },
  'module-4-update-workflow': {
    lessonId: 'module-4', checkpointId: 'm4-production-decision', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Muốn chỉnh portfolio thì làm thế nào?",
    objective: "Muốn chỉnh portfolio thì làm thế nào?", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Muốn chỉnh portfolio thì làm thế nào?", evidence: [],
    dialogue: "Bạn có một dự án mới để thêm vào portfolio. Hãy mở đúng thư mục code trong Codex. Nếu task cũ không còn, tạo task mới ở thư mục này và cho agent đọc ghi chú dự án. Nói phần cần thêm, tư liệu thật và phần cần giữ nguyên.\n\nLàm theo vòng quen thuộc: tạo branch riêng → sửa trên Local → xem và kiểm tra → commit, push để tạo Preview → duyệt Preview → merge, push vào Production Branch → kiểm tra website chính.\n\nViệc sửa trên máy chưa làm website ngoài Internet thay đổi. Ngược lại, push vào Production Branch có thể tự cập nhật website chính. Vì vậy, đừng nói “push hết lên” khi bạn chỉ muốn thử một ý tưởng.\n\nMỗi lần chỉ nên thay một phần đủ nhỏ để bạn nhận ra điều gì đã đổi và biết quay lại đâu nếu gặp lỗi.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-update-verify', primary: true }]
  },
  'module-4-update-verify': {
    lessonId: 'module-4', checkpointId: 'm4-production-decision', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Giao một lần sửa có điểm dừng",
    objective: "Giao một lần sửa có điểm dừng", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Giao một lần sửa có điểm dừng", evidence: [],
    dialogue: "Bạn có thể nói với agent:\n\n“Thêm dự án mới từ tư liệu tôi cung cấp. Trước khi sửa, kiểm tra đúng repo và Production Branch, rồi tạo branch khác. Giữ nguyên các phần còn lại. Mở bản Local và tóm tắt thay đổi để tôi xem. Khi tôi duyệt, hãy commit và push branch này để tạo Preview. Chưa merge hoặc cập nhật Production.”\n\nỞ Preview, bạn xác nhận thay đổi đã duyệt trên Local xuất hiện đúng và các phần liên quan vẫn hoạt động. Khi đã chấp nhận, mới cho phép cập nhật Production rồi thử lại địa chỉ chính.\n\nNếu website vẫn hiện bản cũ, đối chiếu commit trên GitHub và deployment trước. Kiểm tra đúng branch, trạng thái Ready và đúng đường link; tải lại trang chưa sửa được việc chưa push code.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-deploy-errors', primary: true }]
  },
  'module-4-deploy-errors': {
    lessonId: 'module-4', checkpointId: 'm4-production-decision', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Khi Vercel báo lỗi",
    objective: "Khi Vercel báo lỗi", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Khi Vercel báo lỗi", evidence: [],
    dialogue: "Nếu deployment báo Error, mở bản bị lỗi và phần Build Logs, tức nhật ký tạo bản dựng. Gửi agent đoạn lỗi liên quan, tên branch, commit và thao tác vừa làm; che mã bí mật nếu có. Yêu cầu agent nêu nguyên nhân có bằng chứng, sửa một phần nhỏ rồi thử lại.\n\nNếu báo Ready nhưng trang trống, ảnh mất hoặc đường dẫn báo 404, hãy chụp màn hình kèm đúng URL và cách tái hiện. Agent cần so sánh với bản Local, kiểm tra cấu hình và đường dẫn tệp.\n\nNếu không thấy deployment mới, xem commit đã lên đúng branch GitHub và Vercel còn quyền đọc repo không. Không cần tạo một project mới mỗi lần lỗi. Mọi lần sửa vẫn cần kiểm tra lại bản mới trước khi chia sẻ.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-rollback', primary: true }]
  },
  'module-4-rollback': {
    lessonId: 'module-4', checkpointId: 'm4-production-decision', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Khi cần quay lại bản đang hoạt động",
    objective: "Khi cần quay lại bản đang hoạt động", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Khi cần quay lại bản đang hoạt động", evidence: [],
    dialogue: "Rollback là đưa website chính trở lại một deployment trước đó. Nếu bản mới làm nút liên hệ hỏng, bạn có thể dùng cách này để người xem tạm dùng lại bản đã ổn.\n\nMở project → Deployments, tìm bản Production đã kiểm tra trước đó. Mở menu của bản đó và chọn Instant Rollback nếu khả dụng. Kiểm tra đúng bản và xác nhận, rồi mở lại địa chỉ chính để thử. Gói Hobby chỉ cho quay lại bản Production ngay trước; nếu không có bản phù hợp, nhờ agent sửa và triển khai bản mới.\n\nRollback trên Vercel không tự sửa code trên GitHub. Nhờ agent đưa phần sửa lỗi vào code và kiểm tra lại trước lần phát hành tiếp theo, nếu không lỗi có thể quay lại. Rollback cũng không thu hồi được tệp đã bị tải về hay mã bí mật đã lộ.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-rollback-resume', primary: true }]
  },
  'module-4-rollback-resume': {
    lessonId: 'module-4', checkpointId: 'm4-production-decision', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 4 · KHÔI PHỤC', mission: "Tiếp tục phát hành sau khi khôi phục",
    objective: "Tiếp tục phát hành sau khi khôi phục", panelLabel: 'PHÁT HÀNH BẢN ĐÃ SỬA', panelStatus: 'SAU ROLLBACK', tone: 'neutral',
    request: "Tiếp tục phát hành sau khi khôi phục", evidence: [], dialogue: "Sau Instant Rollback, Vercel tạm ngừng tự gắn các bản mới vào địa chỉ Production chính. Vì vậy, push bản đã sửa chưa chắc làm địa chỉ chính đổi ngay.\n\nSửa code cùng agent, kiểm tra Local và Preview, rồi tạo bản đã sửa trên Production Branch. Khi đã sẵn sàng, mở trang tổng quan project, chọn Undo Rollback, đối chiếu và chọn đúng deployment đã sửa, rồi xác nhận. Đây là một lần thay đổi website chính nên cần bạn đồng ý.\n\nMở lại địa chỉ chính để kiểm tra. Vercel sẽ bật lại việc tự cập nhật địa chỉ Production cho những lần push tiếp theo. Ghi lại commit đã sửa và kết quả để không nhầm bản vừa khôi phục với bản đã giải quyết nguyên nhân lỗi.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-ownership-intro', primary: true }]
  },
  'module-4-ownership-intro': {
    lessonId: 'module-4', checkpointId: 'm4-ownership-transfer', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Bạn cần nắm gì về portfolio của mình?",
    objective: "Bạn cần nắm gì về portfolio của mình?", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Bạn cần nắm gì về portfolio của mình?", evidence: [],
    dialogue: "Bạn không cần tự viết mọi dòng code để làm chủ portfolio. Bạn cần chỉ được repo nằm ở đâu, website chính dùng đường link nào, bản đang chạy lấy từ commit nào và ai có quyền quản lý tài khoản GitHub và Vercel.\n\nMột quyết định phát hành cần gắn với bằng chứng, chẳng hạn giữ website được bảo vệ vì chưa muốn công khai, hoặc khôi phục bản trước vì bản mới bị lỗi đường dẫn. Phần kiểm tra cuối bài sẽ dùng quyết định và bằng chứng từ lần triển khai của bạn.\n\nLời giải thích dựa trên việc bạn đã làm có giá trị hơn một đoạn tổng kết do agent viết hộ. Giữ lại cả giới hạn chưa giải quyết để lần cập nhật sau có điểm bắt đầu rõ ràng.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-handover', primary: true }]
  },
  'module-4-handover': {
    lessonId: 'module-4', checkpointId: 'm4-ownership-transfer', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Lưu lại để lần sau tiếp tục được",
    objective: "Lưu lại để lần sau tiếp tục được", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Lưu lại để lần sau tiếp tục được", evidence: [],
    dialogue: "Tạo một ghi chú ngắn trong dự án: link repo, tên project Vercel, địa chỉ chính, Production Branch, commit đang chạy, cách mở Local, cách tạo Preview và bản có thể khôi phục.\n\nThêm những việc còn lại, nơi sửa nội dung và các lần gia hạn cần nhớ nếu bạn mua tên miền hoặc dùng gói trả phí. Ghi chú giúp cả bạn trong vài tháng tới và người hỗ trợ sau này tiếp tục được công việc.\n\nTài khoản GitHub, Vercel và tên miền nên thuộc quyền quản lý của bạn. Bật xác thực hai bước nếu có và giữ thông tin khôi phục ở nơi riêng tư. Không ghi mật khẩu, token hay mã khôi phục trong repo.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-transfer', primary: true }]
  },
  'module-4-transfer': {
    lessonId: 'module-4', checkpointId: 'm4-ownership-transfer', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Thử áp dụng cho một việc khác",
    objective: "Thử áp dụng cho một việc khác", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Thử áp dụng cho một việc khác", evidence: [],
    dialogue: "Bạn có thể áp dụng quy trình vừa học cho một ứng dụng nhỏ khác portfolio, chẳng hạn một trang giúp sắp xếp sách muốn đọc. Bước đầu là xác định người dùng, vấn đề, việc phiên bản đầu cần làm và cách quan sát kết quả.\n\nNhiệm vụ đầu tiên cho agent cần nêu rõ phạm vi, phần chưa làm, cách kiểm tra và lúc dừng để bạn duyệt. Cách xác định yêu cầu, làm từng phần và xem bằng chứng vẫn dùng được ở dự án mới.\n\nPhần kiểm tra cuối bài sẽ yêu cầu bạn tự áp dụng cách này cho một ứng dụng khác. Bạn chưa cần xây ứng dụng đó.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-portfolio-practice', primary: true }]
  },
  'module-4-portfolio-practice': {
    lessonId: 'module-4', checkpointId: 'm4-portfolio-release', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · THỰC HÀNH', mission: 'Thực hành phát hành portfolio',
    objective: 'Đọc hướng dẫn và chuẩn bị bài thực hành', panelLabel: 'BẢN DUYỆT NỘI DUNG',
    panelStatus: 'BÀI THỰC HÀNH CHƯA HOẠT ĐỘNG', tone: 'neutral',
    request: 'Xem nội dung chưa được tính là hoàn thành bài thực hành.', evidence: [],
    dialogue: 'Phiên bản này chỉ để đọc và thử câu hỏi. Bài thực hành phát hành chưa hoạt động, nên xem hết nội dung chưa được tính là hoàn thành. Khi bài thực hành được mở, bạn sẽ dùng repo, tài khoản và portfolio của chính mình để làm các bước vừa học.',
    choices: []
  },
  'module-4-portfolio-mastery': {
    lessonId: 'module-4', checkpointId: 'm4-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · LÀM CHỦ', mission: 'Kết nối kỹ năng toàn khóa',
    objective: 'Đánh giá quyết định phát hành bằng bằng chứng của chính bạn', panelLabel: 'BÀI KIỂM TRA',
    panelStatus: '6 TÌNH HUỐNG · 2 CÂU TỰ VIẾT', tone: 'good',
    request: 'Bạn có thể thử trả lời trong phiên này; kết quả chưa được tính là hoàn thành khóa học.',
    evidence: [],
    dialogue: 'Sáu tình huống kiểm tra việc phát hành, an toàn, Preview, Production, cập nhật và khôi phục. Hai câu tự viết kiểm tra quyền sở hữu phiên bản phát hành cùng khả năng chuyển quy trình sang dự án khác.',
    choices: [{ label: 'Bắt đầu kiểm tra tổng hợp', next: 'module-4-mastery-release', primary: true }]
  },
  'module-4-mastery-summary': {
    lessonId: 'module-4', checkpointId: 'm4-mastery', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · LÀM CHỦ', mission: 'Hoàn tất phần trả lời',
    objective: 'Đối chiếu kiến thức với bằng chứng phát hành và chuyển giao', panelLabel: 'KẾT QUẢ',
    panelStatus: 'CHỈ DÙNG ĐỂ DUYỆT NỘI DUNG', tone: 'neutral',
    request: 'Bài thực hành chưa hoạt động; đây mới là kết quả thử câu hỏi.',
    evidence: [], dialogue: '', choices: [], assessmentGroupId: 'm4-final-assessment', assessmentSummary: true
  },
  'module-4-complete': {
    lessonId: 'module-4', checkpointId: 'm4-complete', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · HOÀN THÀNH', mission: 'Tốt nghiệp bằng bằng chứng hiện tại',
    objective: 'Hoàn thành bài thực hành và các câu hỏi trước', panelLabel: 'TRẠNG THÁI',
    panelStatus: 'CHƯA ĐƯỢC KÍCH HOẠT', tone: 'neutral',
    request: 'Màn hình này chưa phải xác nhận bạn đã hoàn thành khóa học.',
    evidence: [], dialogue: 'Bạn chỉ hoàn thành khóa học sau khi bài thực hành được mở, kết quả thật được kiểm tra và các yêu cầu của khóa học đều đạt.', choices: []
  }
} as const satisfies Partial<Record<SceneId, RegistrySceneContent>>

export const moduleFourScenes = {
  ...instructionalScenes,
  ...assessmentScenes
} satisfies Partial<Record<SceneId, RegistrySceneContent>>
