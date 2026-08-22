---
goal: Xây phiên bản đầu tiên của portfolio một trang cho Mai, UX Designer
version: 1.0
date_created: 2026-08-19
last_updated: 2026-08-19
owner: Mai (nhân vật giả lập)
status: Planned
tags:
  - feature
  - portfolio
  - frontend
  - accessibility
---

# Introduction

![Status: Planned](https://img.shields.io/badge/status-Planned-blue)

Implementation plan, hay kế hoạch triển khai, này mô tả cách xây phiên bản đầu
tiên của portfolio cho Mai. Mai là một UX Designer giả lập. Portfolio giúp nhà
tuyển dụng hiểu vai trò của Mai, xem hai dự án tiêu biểu và liên hệ qua email.

Plan là tài liệu hướng dẫn thực hiện. Trạng thái `Planned` có nghĩa là chưa có
task nào được triển khai.

## 1. Requirements & Constraints

- **REQ-001**: Phần đầu trang phải hiển thị tên “Mai Nguyễn”, vai trò “UX
  Designer”, câu giới thiệu ngắn và liên kết “Xem dự án” tới phần dự án.
- **REQ-002**: Phần dự án phải hiển thị đúng hai dự án. Mỗi dự án phải có tên,
  vấn đề, vai trò của Mai, cách tiếp cận và kết quả.
- **REQ-003**: Dự án thứ nhất phải là “Đặt lịch khám dễ dàng hơn”. Nội dung mô
  tả việc đơn giản hóa luồng tìm bác sĩ, chọn giờ và xác nhận lịch.
- **REQ-004**: Dự án thứ hai phải là “Theo dõi đơn hàng rõ ràng hơn”. Nội dung
  mô tả việc gom trạng thái vận chuyển và hành động hỗ trợ vào một màn hình.
- **REQ-005**: Điều hướng phải có ba liên kết “Giới thiệu”, “Dự án” và “Liên
  hệ”. Mỗi liên kết phải đưa bàn phím hoặc con trỏ tới đúng phần trên trang.
- **REQ-006**: Phần liên hệ phải hiển thị địa chỉ `mai.ux@example.com` bằng liên
  kết `mailto:`. Không tạo biểu mẫu gửi dữ liệu.
- **REQ-007**: Trang phải hiển thị không có thanh cuộn ngang ở `1440 × 900` và
  `390 × 844`.
- **REQ-008**: Người dùng phải đi tới được mọi liên kết bằng phím `Tab`. Mỗi
  liên kết phải có trạng thái focus nhìn thấy rõ.
- **REQ-009**: Trang phải dùng đúng một thẻ `h1`. Các phần Dự án và Liên hệ phải
  có tiêu đề `h2` và nằm trong các landmark HTML có ý nghĩa.
- **REQ-010**: Tiêu đề trình duyệt phải là `Mai Nguyễn — UX Designer`. Phần mô
  tả trang phải nêu đây là portfolio gồm hai dự án UX tiêu biểu.
- **SEC-001**: Không thêm analytics, cookie theo dõi, biểu mẫu hoặc script của
  bên thứ ba.
- **SEC-002**: Không đưa số điện thoại, địa chỉ nhà hoặc dữ liệu khách hàng thật
  vào mã nguồn.
- **CON-001**: Sản phẩm là một trang tĩnh. Không tạo backend, đăng nhập, blog
  hoặc hệ thống quản trị nội dung.
- **CON-002**: Dùng React và TypeScript trong dự án Vite. Không thêm thư viện UI
  hoặc thư viện quản lý trạng thái.
- **CON-003**: Nội dung portfolio phải nằm trong một tệp dữ liệu riêng. Component
  không được chứa trực tiếp nội dung của hai dự án.
- **GUD-001**: Ưu tiên HTML semantic và CSS thuần. Chỉ dùng JavaScript cho hành
  vi mà HTML và CSS không đáp ứng được.
- **GUD-002**: Mỗi phase phải kết thúc bằng một kết quả có thể quan sát và một
  lần kiểm tra tương ứng trước khi bắt đầu phase tiếp theo.
- **PAT-001**: Component nhận nội dung qua props và chỉ chịu trách nhiệm hiển
  thị. `src/App.tsx` chịu trách nhiệm ghép các phần thành trang hoàn chỉnh.

## 2. Implementation Steps

### Implementation Phase 1 — Tạo nền dự án và dữ liệu nội dung

- **GOAL-001**: Tạo ứng dụng có thể chạy và lưu toàn bộ nội dung giả lập trong
  một nguồn dữ liệu duy nhất.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-001 | Tạo dự án Vite React TypeScript tại thư mục hiện tại bằng `npm create vite@9.1.2 . -- --template react-ts`. Chạy `npm install`. Xóa CSS và asset demo do Vite tạo nhưng giữ nguyên cấu hình TypeScript, Vite và ESLint. Phụ thuộc: DEP-001. | | |
| TASK-002 | Tạo `src/content/portfolio.ts`. Export type `PortfolioProject`, constant `profile` và mảng `projects`. `profile` chứa tên, vai trò, câu giới thiệu và email trong REQ-001, REQ-006. `projects` chứa đúng nội dung của REQ-003 và REQ-004 với các trường `title`, `problem`, `role`, `approach`, `outcome`. Phụ thuộc: TASK-001. | | |
| TASK-003 | Thay nội dung `src/App.tsx` bằng ba section rỗng có id `about`, `projects`, `contact`. Import dữ liệu từ `src/content/portfolio.ts`. Chưa thêm style chi tiết. Phụ thuộc: TASK-002. | | |
| TASK-004 | Chạy `npm run build`. Phase đạt khi build thoát với mã `0` và `src/App.tsx` không chứa nội dung trực tiếp của hai dự án. Phụ thuộc: TASK-003. | | |

### Implementation Phase 2 — Xây cấu trúc và nội dung chính

- **GOAL-002**: Hoàn thành cấu trúc semantic của trang và hiển thị đầy đủ nội
  dung theo REQ-001 đến REQ-006.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-005 | Tạo `src/components/SiteHeader.tsx`. Render tên “Mai Nguyễn” và một `nav` chứa ba anchor trỏ tới `#about`, `#projects`, `#contact`. Thêm `aria-label="Điều hướng chính"` cho `nav`. Phụ thuộc: TASK-003. | | |
| TASK-006 | Tạo `src/components/Hero.tsx`. Nhận `name`, `role`, `intro` qua props. Render đúng một `h1`, vai trò, câu giới thiệu và anchor “Xem dự án” trỏ tới `#projects`. Phụ thuộc: TASK-002. | | |
| TASK-007 | Tạo `src/components/ProjectCard.tsx`. Nhận một `PortfolioProject` qua prop `project`. Render lần lượt tên dự án, vấn đề, vai trò, cách tiếp cận và kết quả trong một `article`. Phụ thuộc: TASK-002. | | |
| TASK-008 | Tạo `src/components/ProjectList.tsx`. Nhận mảng `PortfolioProject[]`, render một `section` có id `projects`, một `h2` “Dự án tiêu biểu” và đúng hai `ProjectCard`. Dùng `project.title` làm key. Phụ thuộc: TASK-007. | | |
| TASK-009 | Tạo `src/components/Contact.tsx`. Render `section` có id `contact`, một `h2` “Liên hệ” và anchor `mailto:mai.ux@example.com`. Không render `form`. Phụ thuộc: TASK-002. | | |
| TASK-010 | Cập nhật `src/App.tsx` để render `SiteHeader`, landmark `main`, `Hero`, `ProjectList`, `Contact` và landmark `footer`. Đặt phần Hero trong section id `about`. Phụ thuộc: TASK-005, TASK-006, TASK-008, TASK-009. | | |
| TASK-011 | Cập nhật `index.html`: đặt `title` thành `Mai Nguyễn — UX Designer`; thêm `meta name="description"` với nội dung `Portfolio của Mai Nguyễn, UX Designer, gồm hai dự án UX tiêu biểu.` Phụ thuộc: TASK-001. | | |
| TASK-012 | Chạy `npm run build`. Mở trang và xác nhận bằng DOM rằng có đúng một `h1`, hai `h2`, hai `article`, ba liên kết điều hướng và một liên kết `mailto:`. Phụ thuộc: TASK-010, TASK-011. | | |

### Implementation Phase 3 — Hoàn thiện giao diện responsive và khả năng tiếp cận

- **GOAL-003**: Tạo giao diện rõ ràng ở desktop và điện thoại, đồng thời bảo đảm
  người dùng bàn phím luôn thấy vị trí focus.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-013 | Thay toàn bộ CSS demo bằng `src/styles.css`. Khai báo biến màu, khoảng cách, độ rộng nội dung tối đa `1120px` và font stack hệ thống trong `:root`. Đặt `box-sizing: border-box` cho mọi phần tử. Phụ thuộc: TASK-010. | | |
| TASK-014 | Trong `src/styles.css`, tạo layout desktop: header nằm ngang, Hero có khoảng trắng rõ, danh sách dự án dùng grid hai cột và các section có khoảng cách dọc nhất quán. Phụ thuộc: TASK-013. | | |
| TASK-015 | Trong `src/styles.css`, thêm media query `@media (max-width: 640px)`. Chuyển header và danh sách dự án thành một cột; giảm padding nhưng giữ cỡ chữ nội dung tối thiểu `16px`. Phụ thuộc: TASK-014. | | |
| TASK-016 | Trong `src/styles.css`, thêm style `:focus-visible` với outline rộng tối thiểu `3px` và độ tương phản rõ trên nền hiện tại. Không xóa outline mặc định nếu style thay thế chưa áp dụng. Phụ thuộc: TASK-013. | | |
| TASK-017 | Mở trang ở `1440 × 900` và `390 × 844`. Ở mỗi kích thước, xác nhận `document.documentElement.scrollWidth === window.innerWidth`. Dùng phím `Tab` đi qua toàn bộ liên kết theo thứ tự điều hướng, CTA và email. Phụ thuộc: TASK-015, TASK-016. | | |

### Implementation Phase 4 — Thêm kiểm thử và bằng chứng hoàn thành

- **GOAL-004**: Tự động kiểm tra các yêu cầu chính và lưu bằng chứng trực quan
  trước khi yêu cầu duyệt.

| Task | Description | Completed | Date |
|------|-------------|-----------|------|
| TASK-018 | Chạy `npm install --save-dev --save-exact vitest@4.1.11 @testing-library/react@16.3.2 @testing-library/jest-dom@7.0.1 jsdom@30.0.1 @playwright/test@1.62.1`. Thêm script `test` chạy Vitest và script `test:e2e` chạy Playwright trong `package.json`. Phụ thuộc: TASK-001. | | |
| TASK-019 | Tạo `src/test/setup.ts` để import `@testing-library/jest-dom/vitest`. Cập nhật cấu hình Vitest dùng environment `jsdom` và setup file này. Phụ thuộc: TASK-018. | | |
| TASK-020 | Tạo `src/App.test.tsx`. Kiểm tra tên, vai trò, đúng hai dự án, ba anchor điều hướng và liên kết email. Kiểm tra DOM có đúng một `h1` và không có `form`. Phụ thuộc: TASK-010, TASK-019. | | |
| TASK-021 | Tạo `src/components/ProjectCard.test.tsx`. Render một fixture và kiểm tra đủ năm trường `title`, `problem`, `role`, `approach`, `outcome`. Phụ thuộc: TASK-007, TASK-019. | | |
| TASK-022 | Tạo `e2e/portfolio.spec.ts`. Kiểm tra không cuộn ngang ở viewport `1440 × 900` và `390 × 844`; kiểm tra ba liên kết điều hướng đổi hash đúng; kiểm tra focus nhìn thấy bằng cách xác nhận `outlineStyle` khác `none` sau khi nhấn `Tab`. Phụ thuộc: TASK-017, TASK-018, DEP-002. | | |
| TASK-023 | Tạo thư mục `evidence/portfolio-v1/`. Chạy `npm run build`, `npm test` và `npm run test:e2e`. Lưu ảnh desktop thành `evidence/portfolio-v1/desktop.png` và ảnh điện thoại thành `evidence/portfolio-v1/mobile.png`. Phase đạt khi ba lệnh thoát với mã `0` và hai ảnh tồn tại. Phụ thuộc: TASK-020, TASK-021, TASK-022. | | |
| TASK-024 | Cập nhật bảng task trong plan này: chỉ đánh dấu `✅` và ghi ngày cho task đã có bằng chứng đạt. Giữ `status: Planned` cho tới khi TASK-001 bắt đầu; chuyển sang `In progress` khi có task đang thực hiện và `Completed` chỉ khi TASK-023 đạt. Phụ thuộc: TASK-023. | | |

## 3. Alternatives

- **ALT-001**: Xây portfolio nhiều trang. Không chọn vì phiên bản đầu chỉ có hai
  dự án; một trang giúp giảm điều hướng và phạm vi kiểm thử.
- **ALT-002**: Dùng CMS để Mai tự cập nhật nội dung. Không chọn vì CMS cần thêm
  backend, xác thực và bảo trì, trái với CON-001.
- **ALT-003**: Dùng thư viện UI có sẵn. Không chọn vì giao diện hiện tại chỉ cần
  các component nhỏ và CSS thuần; thêm thư viện sẽ làm tăng dependency mà không
  giải quyết yêu cầu mới.

## 4. Dependencies

- **DEP-001**: Máy thực hiện phải có Node.js `22.20.0` và npm `11.12.1`. Xác nhận bằng
  `node --version` và `npm --version` trước TASK-001.
- **DEP-002**: Trình duyệt Chromium cho Playwright phải được cài bằng
  `npx playwright install chromium` sau TASK-018 và trước TASK-022.

## 5. Files

- **FILE-001**: `package.json` — scripts và dev dependencies.
- **FILE-002**: `index.html` — title và meta description.
- **FILE-003**: `src/App.tsx` — ghép cấu trúc trang.
- **FILE-004**: `src/content/portfolio.ts` — toàn bộ nội dung giả lập.
- **FILE-005**: `src/components/SiteHeader.tsx` — tên và điều hướng.
- **FILE-006**: `src/components/Hero.tsx` — phần giới thiệu chính.
- **FILE-007**: `src/components/ProjectList.tsx` — danh sách hai dự án.
- **FILE-008**: `src/components/ProjectCard.tsx` — cấu trúc một dự án.
- **FILE-009**: `src/components/Contact.tsx` — thông tin liên hệ.
- **FILE-010**: `src/styles.css` — giao diện desktop, mobile và focus.
- **FILE-011**: `src/test/setup.ts` — cấu hình matcher cho Vitest.
- **FILE-012**: `src/App.test.tsx` — kiểm thử yêu cầu cấp trang.
- **FILE-013**: `src/components/ProjectCard.test.tsx` — kiểm thử component dự án.
- **FILE-014**: `e2e/portfolio.spec.ts` — kiểm thử trình duyệt và responsive.
- **FILE-015**: `evidence/portfolio-v1/desktop.png` — ảnh bằng chứng desktop.
- **FILE-016**: `evidence/portfolio-v1/mobile.png` — ảnh bằng chứng mobile.

## 6. Testing

- **TEST-001**: `npm run build` phải thoát với mã `0`.
- **TEST-002**: `npm test` phải thoát với mã `0`; mọi test trong
  `src/App.test.tsx` và `src/components/ProjectCard.test.tsx` phải đạt.
- **TEST-003**: `npm run test:e2e` phải thoát với mã `0` ở Chromium.
- **TEST-004**: Viewport `1440 × 900` phải không có thanh cuộn ngang và phải lưu
  được `evidence/portfolio-v1/desktop.png`.
- **TEST-005**: Viewport `390 × 844` phải không có thanh cuộn ngang và phải lưu
  được `evidence/portfolio-v1/mobile.png`.
- **TEST-006**: Thứ tự Tab phải đi qua ba liên kết điều hướng, liên kết “Xem dự
  án” và email; focus phải nhìn thấy tại từng điểm.
- **TEST-007**: DOM phải có đúng một `h1`, hai `h2`, hai `article`, không có
  `form` và không tải script theo dõi của bên thứ ba.

## 7. Risks & Assumptions

- **RISK-001**: Nội dung dự án có thể dài hơn dự kiến và làm thẻ dự án mất cân
  đối. Giảm rủi ro bằng cách kiểm tra cả hai viewport trong TEST-004, TEST-005;
  không cắt nội dung bằng CSS.
- **RISK-002**: Style focus có thể khó nhìn trên một số màu nền. Giảm rủi ro
  bằng TEST-006 và dùng outline tương phản thay vì chỉ đổi màu chữ.
- **RISK-003**: Anchor cố định có thể bị header che sau khi điều hướng. TASK-017
  phải xác nhận tiêu đề section vẫn nhìn thấy; nếu bị che, thêm
  `scroll-margin-top` vào section trong `src/styles.css`.
- **ASSUMPTION-001**: Hai dự án và toàn bộ dữ liệu trong plan là giả lập, chỉ dùng
  để minh họa format implementation plan.
- **ASSUMPTION-002**: Phiên bản đầu được triển khai trên một origin tĩnh hỗ trợ
  SPA Vite. Việc chọn nhà cung cấp hosting nằm ngoài phạm vi plan này.
- **ASSUMPTION-003**: Mai duyệt nội dung giả lập trước khi TASK-001 bắt đầu. Plan
  không yêu cầu thay đổi nội dung trong lúc triển khai.

## 8. Related Specifications / Further Reading

- Plan này là tài liệu tự chứa. REQ-001 đến REQ-010 là nguồn yêu cầu duy nhất
  cho phiên bản portfolio giả lập.
- [WAI — Keyboard accessibility](https://www.w3.org/WAI/WCAG21/Understanding/keyboard)
- [WAI — Focus visible](https://www.w3.org/WAI/WCAG21/Understanding/focus-visible)
- [Vite — Getting Started](https://vite.dev/guide/)
- [Playwright — Test assertions](https://playwright.dev/docs/test-assertions)
