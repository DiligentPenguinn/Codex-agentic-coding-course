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
  'module-4-hosting-intro': {
    lessonId: 'module-4', checkpointId: 'm4-release-validation', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 4 · HOSTING', mission: 'Để người khác xem được portfolio',
    objective: 'Hiểu vì sao website cần một nơi trên Internet', panelLabel: 'HOSTING LÀ GÌ?',
    panelStatus: 'TỪ MÁY CỦA BẠN RA INTERNET', tone: 'neutral',
    request: 'Website cần một nơi để người khác truy cập, kể cả khi bạn tắt máy.',
    evidence: [],
    dialogue: 'Bạn đã làm xong portfolio và mở được nó trên máy. Bây giờ, bạn muốn gửi cho một người bạn xem. Nhưng đường dẫn localhost bạn đang dùng chỉ trỏ về máy đang mở nó, nên gửi đường dẫn này chưa giúp người kia xem được portfolio.\n\nBạn cần đặt website ở một nơi có thể truy cập qua Internet. Dịch vụ cung cấp nơi đó được gọi là hosting.\n\nKhi website đã được đưa lên đó, người khác có thể mở bằng đường link, kể cả khi bạn đã tắt máy. Trong khóa học này, chúng ta sẽ dùng Vercel để làm việc đó.',
    highlightTerms: ['localhost', 'hosting', 'Vercel'],
    choices: [{ label: 'Máy tính, GitHub và Vercel làm gì?', next: 'module-4-hosting-roles', primary: true }]
  },
  'module-4-hosting-roles': {
    lessonId: 'module-4', checkpointId: 'm4-release-validation', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 4 · HOSTING', mission: 'Phân biệt nơi sửa code, lưu code và mở website',
    objective: 'Hiểu vai trò của máy tính, GitHub và Vercel', panelLabel: 'BA NƠI, BA VAI TRÒ',
    panelStatus: 'MÁY TÍNH · GITHUB · VERCEL', tone: 'neutral',
    request: 'GitHub lưu code của bạn, còn Vercel giúp người khác mở website.',
    evidence: [],
    dialogue: 'Trong bài thực hành này, mỗi nơi có một vai trò:\n\nMáy tính của bạn là nơi bạn cùng agent xây và sửa portfolio.\n\nGitHub là nơi lưu code và lịch sử thay đổi của dự án trên mạng.\n\nVercel lấy code của dự án và đưa website lên để người khác truy cập.',
    highlightTerms: ['Máy tính của bạn', 'GitHub', 'Vercel'],
    choices: [{ label: 'Kiểm chứng trước khi đưa website lên mạng', next: 'module-4-vercel-benefits', primary: true }]
  },
  'module-4-vercel-benefits': {
    lessonId: 'module-4', checkpointId: 'm4-release-validation', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Vercel giúp bạn làm gì?",
    objective: "Vercel giúp bạn làm gì?", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Vercel giúp bạn làm gì?", evidence: [],
    dialogue: "Ở Module 3, bạn đã đưa code lên GitHub. Vercel có thể lấy code từ đó, chuẩn bị website và cấp cho bạn một đường link để mở trên Internet. Bạn không phải tự vận hành một máy tính luôn bật để phục vụ người xem.\n\nĐiểm tiện là GitHub và Vercel có thể nối với nhau: khi bạn push một bản sửa, Vercel tạo bản triển khai mới. Bạn cũng có thể xem thử thay đổi trên một đường link riêng trước khi đưa vào website chính.\n\nTrong module này, bạn sẽ nối repo, đưa portfolio lên Vercel, kiểm tra đường link và thử cập nhật một chi tiết nhỏ.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-vercel-limits', primary: true }]
  },
  'module-4-vercel-limits': {
    lessonId: 'module-4', checkpointId: 'm4-release-validation', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Tiện, nhưng cần hiểu giới hạn",
    objective: "Tiện, nhưng cần hiểu giới hạn", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Tiện, nhưng cần hiểu giới hạn", evidence: [],
    dialogue: "Vercel có gói Hobby miễn phí cho mục đích cá nhân, phi thương mại. Đừng mặc định mọi portfolio đều phù hợp với gói này: nếu website dùng để bán dịch vụ hay phục vụ khách hàng, hãy nhờ agent đối chiếu mục đích sử dụng với điều kiện hiện tại trước khi chọn gói.\n\nMiễn phí vẫn có giới hạn sử dụng. Khi chạm giới hạn, một số tính năng có thể phải chờ chu kỳ tiếp theo. Với gói trả phí, bạn cần xem mục Usage và chi phí trước khi bật thêm dịch vụ.\n\nBạn cũng phụ thuộc vào dịch vụ và cách cấu hình của Vercel. Giữ code trên GitHub giúp bạn có bản để chuyển sang nơi khác, nhưng việc chuyển có thể cần chỉnh lại cấu hình. Khóa học chưa cần bạn mua tên miền hay thêm dịch vụ trả phí.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-environments', primary: true }]
  },
  'module-4-environments': {
    lessonId: 'module-4', checkpointId: 'm4-release-validation', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Một portfolio, ba nơi để xem",
    objective: "Một portfolio, ba nơi để xem", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Một portfolio, ba nơi để xem", evidence: [],
    dialogue: "Local là bản đang chạy trên máy bạn, thường mở bằng địa chỉ localhost. Bạn sửa và thử ở đây trước.\n\nPreview là bản xem thử trên Internet. Ví dụ, bạn đổi phần giới thiệu trên một branch riêng rồi mở đường link Preview để kiểm tra.\n\nProduction là bản chính mà bạn muốn người xem sử dụng lâu dài. Khi bản mới được đưa vào Production, nội dung ở địa chỉ chính có thể thay đổi.\n\nBa tên này nói về vai trò của bản website. Chúng chưa cho biết ai được xem. Preview vẫn cần cài đặt quyền truy cập; Production cũng có thể được bảo vệ. Bạn sẽ chọn quyền này trước khi triển khai.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-release-intro', primary: true }]
  },
  'module-4-release-intro': {
    lessonId: 'module-4', checkpointId: 'm4-release-validation', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Trước khi đưa website lên mạng",
    objective: "Trước khi đưa website lên mạng", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Trước khi đưa website lên mạng", evidence: [],
    dialogue: "Trước hết, mở lại portfolio trên máy và bản yêu cầu đã duyệt ở Module 2. Website đã có đủ những phần bạn đồng ý làm chưa? Nội dung còn dòng mẫu, ảnh tạm hay kết quả chưa có bằng chứng không?\n\nNhờ agent chạy các kiểm tra của đúng dự án và giải thích kết quả. Với starter của khóa học, có thể dùng npm run check, rồi npm run preview để mở bản đã được chuẩn bị cho phát hành trên máy.\n\nChữ preview trong câu lệnh này vẫn chỉ bản trên máy, chưa phải Vercel Preview. Bạn không cần nhớ lệnh; hãy yêu cầu agent mở đúng bản để bạn xem.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-release-checklist', primary: true }]
  },
  'module-4-release-checklist': {
    lessonId: 'module-4', checkpointId: 'm4-release-validation', step: 1, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Thử như một người lần đầu ghé xem",
    objective: "Thử như một người lần đầu ghé xem", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Thử như một người lần đầu ghé xem", evidence: [],
    dialogue: "Mở từng dự án, bấm các liên kết, xem ảnh và thử nút tải CV nếu có. Đọc lại tên, vai trò và thông tin liên hệ. Nếu nút Contact chỉ mở ứng dụng email, nó chưa gửi email thay bạn; nếu là biểu mẫu, cần kiểm tra việc nhận thư thật trước khi nói rằng nó hoạt động.\n\nXem portfolio ở cửa sổ máy tính và màn hình điện thoại. Thử dùng phím Tab để đi qua các liên kết, rồi Enter để mở. Chú ý chữ bị cắt, nút khó bấm và thứ tự di chuyển khó hiểu.\n\nGhi lại phần đã thử, lỗi còn lại và phần bạn chủ động chưa làm. Lỗi khiến người xem không hoàn thành việc chính cần được sửa và thử lại trước khi đưa lên mạng.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-check-release-evidence', primary: true }]
  },
  'module-4-security-intro': {
    lessonId: 'module-4', checkpointId: 'm4-security-publication', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Nội dung nào được phép đưa lên mạng?",
    objective: "Nội dung nào được phép đưa lên mạng?", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Nội dung nào được phép đưa lên mạng?", evidence: [],
    dialogue: "Hãy xem cả những tệp đi kèm website: CV có số điện thoại hoặc địa chỉ bạn không muốn công khai không? Ảnh dự án có thông tin khách hàng chưa được phép chia sẻ không? Một tệp không xuất hiện trong menu vẫn có thể được mở bằng đường link trực tiếp.\n\nNhờ agent kiểm tra code, các tệp sắp đưa lên và lịch sử Git xem có mật khẩu, token hay API key không. Token và API key là những mã có thể cho phép người khác sử dụng tài khoản hoặc dịch vụ của bạn; đừng dán chúng vào chat hay chụp trong ảnh hướng dẫn.\n\nNếu có mã đã bị lộ, dừng công bố và nhờ agent hướng dẫn thu hồi hoặc thay mã. Chỉ xóa tệp hiện tại hay thêm vào .gitignore chưa xóa được bản đã lưu trước đó.\n\nNếu portfolio có thêm đăng nhập, thanh toán, thu thập thông tin người xem hoặc biểu mẫu gửi dữ liệu đến một dịch vụ, hãy dừng để xem xét riêng cách xử lý dữ liệu và chi phí. Luồng cơ bản của bài này chưa bao gồm các tính năng đó.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-security-access', primary: true }]
  },
  'module-4-security-access': {
    lessonId: 'module-4', checkpointId: 'm4-security-publication', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Repo riêng tư không làm website riêng tư",
    objective: "Repo riêng tư không làm website riêng tư", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Repo riêng tư không làm website riêng tư", evidence: [],
    dialogue: "Private trên GitHub quyết định ai được xem repo. Quyền xem website được đặt riêng ở Vercel. Repo Private vẫn có thể tạo ra một website công khai.\n\nTrong Vercel, Deployment Protection là phần giới hạn người truy cập. Vercel Authentication yêu cầu người xem đăng nhập bằng tài khoản có quyền phù hợp.\n\nStandard Protection bảo vệ các bản triển khai, trừ địa chỉ Production chính. All Deployments bảo vệ cả địa chỉ đó. Nếu bạn chỉ muốn tự kiểm tra, hãy dùng Vercel Authentication với All Deployments.\n\nSau khi đặt quyền, luôn thử chính đường link định chia sẻ trong cửa sổ riêng tư của trình duyệt. Đừng suy ra website đã riêng tư chỉ từ tên cài đặt.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-security-setup', primary: true }]
  },
  'module-4-security-setup': {
    lessonId: 'module-4', checkpointId: 'm4-security-publication', step: 2, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Đặt quyền trước lần triển khai đầu",
    objective: "Đặt quyền trước lần triển khai đầu", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Đặt quyền trước lần triển khai đầu", evidence: [],
    dialogue: "Đăng nhập Vercel bằng tài khoản của bạn. Chọn đúng khu vực quản lý dự án, được Vercel gọi là team. Trước khi tạo project mới, mở Settings của team, tìm Deployment Protection và phần Default Protection.\n\nTrong hình: ① bật Vercel Authentication, ② chọn All Deployments, ③ bấm Save. Đây là quyền mặc định cho các project tạo sau đó; hãy kiểm tra lại trong project sau khi tạo.\n\nLần triển khai đầu tiên của project mới là Production, kể cả khi bạn định làm bản xem thử. Vì vậy, đừng bấm Deploy rồi mới đặt quyền. Nếu không thấy cài đặt như hình hoặc không có quyền đổi, dừng ở đây và nhờ agent đối chiếu màn hình của bạn.",
    showTitle: false,
    choices: [{ label: 'Tiếp tục', next: 'module-4-check-protection-scope', primary: true }]
  },
  'module-4-preview-intro': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Chuẩn bị lần triển khai đầu",
    objective: "Chuẩn bị lần triển khai đầu", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Chuẩn bị lần triển khai đầu", evidence: [],
    dialogue: "Deploy nghĩa là đưa một phiên bản website lên dịch vụ hosting. Trên Vercel, mỗi lần như vậy tạo một deployment, tức một bản triển khai có thông tin riêng về code nguồn và kết quả.\n\nLần đầu, bạn sẽ tạo project từ repo GitHub và giữ Production được bảo vệ. Sau đó, bạn dùng một branch khác để tạo Preview và tập kiểm tra trước khi cập nhật website chính.\n\nChuẩn bị đường link repo ở Module 3, tên branch chứa bản đã kiểm tra và commit gần nhất. Nhờ agent tóm tắt thêm thư mục chứa website cùng cài đặt Vercel phù hợp. Nếu repo chưa có code trên GitHub, quay lại bài đưa repo lên GitHub trước.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-vercel-import', primary: true }]
  },
  'module-4-vercel-import': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Mở trang tạo project",
    objective: "Mở trang tạo project", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Mở trang tạo project", evidence: [],
    dialogue: "Mở vercel.com/new. Nếu chưa đăng nhập, chọn Continue with GitHub như vị trí ② trong hình, rồi tự đăng nhập trên trang của dịch vụ.\n\nNếu đã đăng nhập, tìm Import Git Repository ở vị trí ①. Đây là nơi lấy dự án có sẵn từ GitHub. Bạn không cần chọn một mẫu website mới ở bên phải vì đã có portfolio của mình.\n\nKhi GitHub hỏi quyền kết nối, kiểm tra đúng tài khoản và chỉ chọn repo cần dùng nếu có lựa chọn đó. Không gửi mật khẩu hay mã xác nhận cho agent. Sau khi quay lại Vercel, tìm repo portfolio để tiếp tục.",
    showTitle: false,
    choices: [{ label: 'Tiếp tục', next: 'module-4-vercel-repository', primary: true }]
  },
  'module-4-vercel-repository': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Chọn đúng repo",
    objective: "Chọn đúng repo", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Chọn đúng repo", evidence: [],
    dialogue: "Trong danh sách Import Git Repository, tìm tên repo và tên tài khoản sở hữu đã ghi ở Module 3. Chọn Import bên cạnh đúng repo đó.\n\nNếu không thấy repo, kiểm tra bạn đang đăng nhập đúng tài khoản GitHub chưa. Sau đó, tìm Configure GitHub App để xem Vercel đã được phép truy cập repo này chưa. Không cần đổi repo thành Public chỉ để nó xuất hiện.\n\nỞ màn hình tạo project, kiểm tra lại tài khoản Vercel, tên project và repo nguồn. Tên project có thể ảnh hưởng đến địa chỉ Vercel cấp cho website. Đặt tên dễ nhận biết; bạn chưa cần mua tên miền riêng.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-vercel-prepare', primary: true }]
  },
  'module-4-vercel-prepare': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · CÀI ĐẶT', mission: 'Để agent chuẩn bị cài đặt',
    objective: 'Chỉ đúng thư mục portfolio', panelLabel: 'CHUẨN BỊ CÙNG AGENT', panelStatus: 'ĐỐI CHIẾU TRƯỚC KHI DEPLOY', tone: 'neutral',
    request: 'Để agent chuẩn bị cài đặt', evidence: [], dialogue: "Trước khi điền cài đặt, nhờ agent đọc dự án và ghi rõ giá trị phù hợp cho từng mục trên Vercel. Bạn chỉ cần đối chiếu với màn hình, không phải tự nhớ hay đoán.\n\nRoot Directory là thư mục bắt đầu của ứng dụng trong repo. Nếu repo còn chứa tài liệu khóa học hay nhiều ứng dụng, nhờ agent chỉ đúng thư mục portfolio.\n\nNếu Environment Variables xuất hiện, đó là phần cài đặt riêng cho ứng dụng. Portfolio đơn giản thường không cần thêm mã bí mật; hãy hỏi agent trước khi điền.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-vercel-config', primary: true }]
  },
  'module-4-vercel-config': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Đối chiếu cài đặt với agent",
    objective: "Đối chiếu cài đặt với agent", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Đối chiếu cài đặt với agent", evidence: [],
    dialogue: "Framework Preset là loại công cụ mà dự án dùng để tạo website. Build Command là lệnh chuẩn bị website để phát hành. Output Directory là thư mục chứa kết quả của lệnh đó. Ba vị trí tương ứng được đánh số trong hình.\n\nBạn không cần tự chọn theo trí nhớ. Nhờ agent đọc dự án và ghi rõ giá trị cần dùng cho từng mục, rồi đối chiếu với màn hình Vercel. Hình dùng một dự án ví dụ trong tài liệu; đừng chép các giá trị trong hình.",
    showTitle: false,
    choices: [{ label: 'Tiếp tục', next: 'module-4-vercel-deploy', primary: true }]
  },
  'module-4-vercel-deploy': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Bấm Deploy và đọc kết quả",
    objective: "Bấm Deploy và đọc kết quả", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Bấm Deploy và đọc kết quả", evidence: [],
    dialogue: "Trước nút Deploy, xác nhận đúng repo, cấu hình, phiên bản và quyền All Deployments đã lưu. Chỉ tiếp tục khi bạn đồng ý đưa các tệp đã kiểm tra lên Vercel.\n\nBấm Deploy. Vercel sẽ lấy code và tạo bản dựng, tức chuẩn bị các tệp để website chạy. Ready nghĩa là quá trình triển khai đã sẵn sàng; Error nghĩa là cần xem lỗi. Ready chưa chứng minh nội dung và mọi nút đều đúng.\n\nMở trang chi tiết bản triển khai. Đối chiếu branch và commit với bản bạn muốn đưa lên, rồi ghi lại đường link cùng môi trường Production. Kiểm tra lại Settings → Deployment Protection của project và thử quyền truy cập bằng cửa sổ riêng tư. Khi đã nối GitHub, những lần push tiếp theo cũng có thể tự tạo deployment.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-vercel-preview', primary: true }]
  },
  'module-4-vercel-preview': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Tạo một Preview để tập cập nhật",
    objective: "Tạo một Preview để tập cập nhật", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Tạo một Preview để tập cập nhật", evidence: [],
    dialogue: "Giờ hãy thử một thay đổi nhỏ, chẳng hạn sửa một câu giới thiệu. Trước khi sửa, nhờ agent xem Production Branch của project, tức branch Vercel dùng để cập nhật website chính. Branch này thường là main nhưng cần kiểm tra thực tế.\n\nYêu cầu agent tạo một branch khác, sửa đúng câu đó và mở bản Local cho bạn xem. Khi đã đồng ý, cho agent commit và push branch mới. Nêu rõ lần push này được phép tạo một Preview, chưa được merge vào Production Branch.\n\nMở project trên Vercel → Deployments. Chọn bản mới có môi trường Preview, đúng branch và commit. Nếu thấy Production, dừng để kiểm tra lại cấu hình trước khi tiếp tục. Tên branch mới không tự bảo đảm đó là Preview.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-preview-review', primary: true }]
  },
  'module-4-preview-review': {
    lessonId: 'module-4', checkpointId: 'm4-preview-deployment', step: 3, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Mở đúng bản rồi mới chấp nhận",
    objective: "Mở đúng bản rồi mới chấp nhận", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Mở đúng bản rồi mới chấp nhận", evidence: [],
    dialogue: "Trong trang chi tiết deployment, kiểm tra ba điều: trạng thái Ready, môi trường Preview và commit đúng với bản vừa push. Sau đó mở đường link của chính deployment này.\n\nĐọc lại câu vừa sửa và thử các phần liên quan. Kiểm tra trên máy tính, điện thoại và cửa sổ riêng tư như lúc kiểm tra Local. Nếu Preview được bảo vệ, người chưa có quyền phải gặp yêu cầu đăng nhập thay vì thấy nội dung.\n\nGhi đường link, commit, ngày kiểm tra, điều đã thử và lỗi còn lại. Một ảnh trang đầu hoặc câu “đã deploy xong” của agent chưa đủ. Nếu sửa tiếp và tạo commit mới, bạn cần kiểm tra Preview mới; kết quả của bản cũ không chứng minh bản mới.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-check-preview-evidence', primary: true }]
  },
  'module-4-production-intro': {
    lessonId: 'module-4', checkpointId: 'm4-production-decision', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Bạn quyết định lúc nào công khai",
    objective: "Bạn quyết định lúc nào công khai", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Bạn quyết định lúc nào công khai", evidence: [],
    dialogue: "Preview đã ổn chưa có nghĩa bạn phải công khai ngay. Bạn có thể giữ All Deployments để tiếp tục sửa, ghi lý do chưa công bố và việc cần làm tiếp.\n\nNếu muốn chia sẻ rộng rãi, hãy đọc bản tóm tắt ngắn: phiên bản nào sẽ lên website chính, nội dung gì được công khai, những gì đã kiểm tra, giới hạn còn lại và cách quay lại bản an toàn.\n\nBạn là người quyết định. Agent có thể đề xuất và làm phần kỹ thuật sau khi bạn đồng ý. Việc chuyển một bản sửa vào Production và việc mở quyền xem công khai là hai quyết định cần nói rõ.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-production-publish', primary: true }]
  },
  'module-4-production-publish': {
    lessonId: 'module-4', checkpointId: 'm4-production-decision', step: 4, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Đưa bản đã duyệt vào website chính",
    objective: "Đưa bản đã duyệt vào website chính", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Đưa bản đã duyệt vào website chính", evidence: [],
    dialogue: "Với project nối GitHub, hãy nhờ agent xác nhận lại Production Branch. Sau khi bạn duyệt Preview, cho phép merge thay đổi vào branch đó và push. Nếu có xung đột, agent cần giải thích phần khác nhau để bạn chọn trước khi gộp.\n\nChờ deployment Production mới đạt Ready rồi kiểm tra commit và mở địa chỉ chính của project. Đừng chỉ xem lại link Preview. Nếu chưa muốn công khai, giữ All Deployments.\n\nKhi đã quyết định cho mọi người xem, vào Settings → Deployment Protection của project và chọn phạm vi phù hợp, chẳng hạn Standard Protection để địa chỉ Production chính không yêu cầu đăng nhập. Chỉ thay quyền của đúng project, rồi kiểm tra đường link chính trong cửa sổ riêng tư.",
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
    dialogue: "Nhờ agent kiểm tra tiêu đề tab, mô tả ngắn, biểu tượng nhỏ trên tab và ảnh đại diện khi dán link vào ứng dụng nhắn tin. Dùng thông tin thật, không để tên mẫu. Ảnh hoặc mô tả cũ có thể được ứng dụng nhắn tin lưu tạm nên không phải lúc nào cũng đổi ngay.\n\nĐịa chỉ dạng tên-project.vercel.app đã đủ để bắt đầu. Tên miền riêng, chẳng hạn tên-của-bạn.com, là lựa chọn thêm và thường có phí gia hạn. Nếu mua sau này, thêm tại Settings → Domains rồi làm theo đúng hướng dẫn của Vercel và nơi mua tên miền.\n\nWebsite công khai không đồng nghĩa Google sẽ hiện ngay. Cũng đừng dùng “chưa tìm thấy trên Google” hay một đường link khó đoán để giữ bí mật nội dung.",
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
    dialogue: "Bạn có thể nói với agent:\n\n“Thêm dự án mới từ tư liệu tôi cung cấp. Trước khi sửa, kiểm tra đúng repo và Production Branch, rồi tạo branch khác. Giữ nguyên các phần còn lại. Mở bản Local và tóm tắt thay đổi để tôi xem. Khi tôi duyệt, hãy commit và push branch này để tạo Preview. Chưa merge hoặc cập nhật Production.”\n\nỞ Preview, bạn kiểm tra nội dung mới và những phần có thể bị ảnh hưởng. Khi đã chấp nhận, mới cho phép cập nhật Production rồi thử lại địa chỉ chính.\n\nNếu website vẫn hiện bản cũ, đối chiếu commit trên GitHub và deployment trước. Kiểm tra đúng branch, trạng thái Ready và đúng đường link; tải lại trang chưa sửa được việc chưa push code.",
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
    choices: [{ label: 'Tiếp tục', next: 'module-4-check-production-choice', primary: true }]
  },
  'module-4-ownership-intro': {
    lessonId: 'module-4', checkpointId: 'm4-ownership-transfer', step: 5, totalSteps: 5,
    lessonLabel: 'MODULE 4 · PHÁT HÀNH PORTFOLIO', mission: "Bạn cần nắm gì về portfolio của mình?",
    objective: "Bạn cần nắm gì về portfolio của mình?", panelLabel: 'CÙNG THỰC HÀNH',
    panelStatus: 'TỪ CODE ĐẾN WEBSITE', tone: 'neutral',
    request: "Bạn cần nắm gì về portfolio của mình?", evidence: [],
    dialogue: "Bạn không cần tự viết mọi dòng code để làm chủ portfolio. Bạn cần chỉ được repo nằm ở đâu, website chính dùng đường link nào, bản đang chạy lấy từ commit nào và ai có quyền quản lý tài khoản GitHub và Vercel.\n\nHãy tự giải thích một quyết định của bạn: vì sao chọn nội dung đó, bạn đã kiểm tra bằng cách nào, hoặc bằng chứng nào khiến bạn yêu cầu agent sửa lại. Nếu chưa biết câu trả lời, mở lại dự án và xem cùng agent.\n\nLời giải thích dựa trên việc bạn đã làm có giá trị hơn một đoạn tổng kết do agent viết hộ. Giữ lại cả giới hạn chưa giải quyết để lần cập nhật sau có điểm bắt đầu rõ ràng.",
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
    dialogue: "Chọn một ứng dụng nhỏ khác portfolio, chẳng hạn một trang giúp bạn sắp xếp sách muốn đọc. Chưa cần xây ứng dụng đó.\n\nViết bằng lời của bạn: ai sẽ dùng, họ đang gặp khó khăn gì, phiên bản đầu cần giúp họ làm được một việc nào và bạn sẽ thử để biết nó hoạt động ra sao.\n\nSau đó, giao cho agent một nhiệm vụ đầu tiên có giới hạn: tìm hiểu dự án và đề xuất cách làm, nêu phần chưa làm, cách kiểm tra và lúc phải dừng để bạn duyệt. Dùng cùng cách xác định yêu cầu, làm từng phần và xem bằng chứng mà bạn đã áp dụng cho portfolio.",
    choices: [{ label: 'Tiếp tục', next: 'module-4-check-transfer-boundary', primary: true }]
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
