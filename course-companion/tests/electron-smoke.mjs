import assert from 'node:assert/strict'
import { appendFile, mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import electronExecutable from 'electron'
import { _electron as electron } from 'playwright-core'
import {
  createDisposablePracticeWorkspace,
  fingerprintTree
} from './support/disposable-practice-workspace.mjs'

const mainEntry = join(process.cwd(), 'out/main/index.js')
const userDataDirectory = await mkdtemp(join(tmpdir(), 'course-companion-electron-'))
const repositoryRoot = resolve(process.cwd(), '..')
const practiceWorkspace = await createDisposablePracticeWorkspace({ repositoryRoot })
const canonicalStarterFingerprint = await fingerprintTree(practiceWorkspace.canonicalStarter)
const screenshotDirectory = process.env.COURSE_COMPANION_SCREENSHOT_DIR
const setupQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-1.quiz.json'), 'utf8')
)
const planningQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-2.quiz.json'), 'utf8')
)

function assessmentGroup(groupId) {
  if (groupId === 'setup-final-assessment') {
    return {
      id: groupId,
      mode: 'mastery',
      questions: setupQuiz.questions
    }
  }
  const group = planningQuiz.groups.find((candidate) => candidate.id === groupId)
  assert.ok(group, `Expected assessment group ${groupId}`)
  return group
}

async function answerAssessmentGroup(page, groupId) {
  const group = assessmentGroup(groupId)
  for (const [index, question] of group.questions.entries()) {
    await page.getByText(question.prompt, { exact: true }).waitFor()
    if (question.type === 'multiple-choice') {
      await page.getByRole('button', { name: question.choices[question.answerIndex], exact: true }).click()
    } else {
      await page.getByRole('textbox', { name: 'Câu trả lời của bạn' }).fill(
        `Câu trả lời do người học tự viết để đáp ứng các tiêu chí công khai của câu ${question.id}.`
      )
      await page.getByRole('button', { name: 'Đối chiếu với tiêu chí', exact: true }).click()
      if (question.id === 'final-11') {
        await capture(page, 'module-2-final-written-review.png')
      }
      await page.getByRole('button', { name: 'Câu trả lời đáp ứng đủ tiêu chí', exact: true }).click()
    }
    await page.getByText('NGUỒN CHÍNH THỨC', { exact: true }).waitFor()
    await page.getByText(question.source.label, { exact: true }).waitFor()
    await page.getByText(question.source.url, { exact: true }).waitFor()
    const continueLabel = index === group.questions.length - 1
      ? group.mode === 'mastery' ? `Xem kết quả ${group.questions.length} câu` : 'Tiếp tục bài học'
      : 'Câu tiếp theo'
    await page.getByRole('button', { name: continueLabel, exact: true }).click()
  }
}

async function completeSetupModule(page, companionPage, electronApp, verifyResponsiveLayout = false) {
  await page.getByRole('button', { name: /MODULE 1.*MỞ BÀI HỌC/ }).click()
  await page.getByText('MODULE 1 · BÀI 1/5 · TRANG 1/2', { exact: true }).first().waitFor()
  assert.equal(
    await page.locator('.pixel-dialogue > p').textContent(),
    'Codex là coding agent của OpenAI. Trong khóa học này, bạn chỉ cần hiểu coding agent là một trợ lý có thể thực hiện công việc liên quan đến code: tạo ứng dụng, xây trang web, chỉnh sửa dự án và tự động hóa những việc lặp lại.'
  )
  assert.equal(await page.getByText('pilot-workspace/', { exact: true }).count(), 0)
  assert.equal(await page.locator('.pixel-lesson-visual').count(), 1)
  await capture(page, 'module-1-codex-introduction.png')

  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const introductionNarrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(introductionNarrowWidths.body, introductionNarrowWidths.viewport)
    assert.equal(introductionNarrowWidths.document, introductionNarrowWidths.viewport)
    const lessonVisualBounds = await page.locator('.pixel-lesson-visual').boundingBox()
    assert.ok(lessonVisualBounds)
    assert.ok(lessonVisualBounds.width <= introductionNarrowWidths.viewport)
    await capture(page, 'module-1-codex-introduction-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }

  await page.getByRole('button', { name: 'Codex có thể làm gì trong dự án?', exact: true }).click()
  await page.getByRole('button', { name: 'Tìm hiểu môi trường quanh Codex', exact: true }).click()
  await page.getByRole('button', { name: 'Harness là gì?', exact: true }).click()
  await page.getByRole('button', { name: 'Xem harness của Codex', exact: true }).click()
  await page.getByRole('button', { name: 'Khi kết quả chưa tốt thì sao?', exact: true }).click()
  await page.getByRole('button', { name: 'Tiếp tục đến quyền truy cập', exact: true }).click()
  await page.getByRole('button', { name: 'Xem thiết lập khuyên dùng', exact: true }).click()
  await page.getByRole('button', { name: 'Dùng thiết lập an toàn này', exact: true }).click()
  await page.getByRole('button', { name: 'Xem ví dụ dùng từng model', exact: true }).click()
  await page.getByRole('button', { name: 'Tìm hiểu reasoning effort', exact: true }).click()
  await page.getByRole('button', { name: 'Chốt cấu hình ContentPilot', exact: true }).click()
  await page.getByRole('button', { name: 'Dùng cấu hình này cho ContentPilot', exact: true }).click()
  await page.getByText(/Bạn không cần chụp ảnh hoặc gửi báo cáo/).waitFor()
  await capture(page, 'module-1-codex-setup-practice.png')

  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const narrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(narrowWidths.body, narrowWidths.viewport)
    assert.equal(narrowWidths.document, narrowWidths.viewport)
    await capture(page, 'module-1-codex-setup-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }

  await page.getByRole('button', { name: 'Sang Codex thiết lập cấu hình', exact: true }).click()
  await page.getByRole('heading', {
    name: 'Thiết lập task Codex của Practice theo cấu hình khuyến nghị và để Triết duyệt trực tiếp từ metadata hiệu lực của đúng task đó.'
  }).waitFor()
  await page.getByRole('button', { name: 'Bắt đầu Practice mới', exact: true }).click()
  await waitForSnapshot(
    electronApp,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected Module 1 Practice to open the Teacher bubble'
  )
  await companionPage.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' }).click()
  await waitForSnapshot(
    electronApp,
    (windows) => companionWindow(windows)?.bounds.width === 380,
    'Expected Module 1 Teacher progress to expand'
  )
  await companionPage.getByRole('tab', { name: 'TIẾN ĐỘ' }).click()
  await companionPage.getByText('CẤU HÌNH TASK ĐƯỢC PHÁT HIỆN', { exact: true }).waitFor()
  await companionPage.getByText('Cần High', { exact: true }).waitFor()
  const review = companionPage.getByRole('button', { name: 'Yêu cầu Triết duyệt tiến độ' })
  const returnToCourse = companionPage.getByRole('button', { name: 'Quay lại khóa học', exact: true })
  for (let attempt = 0; attempt < 7 && await returnToCourse.count() === 0; attempt += 1) {
    await review.click()
    await companionPage.waitForFunction(() => {
      const button = globalThis.document.querySelector('button[aria-label="Yêu cầu Triết duyệt tiến độ"]')
      return button instanceof globalThis.HTMLButtonElement && !button.disabled
    })
  }
  await returnToCourse.waitFor()
  const approvedWorkspace = await companionPage.evaluate(() => globalThis.courseCompanion?.loadPracticeWorkspace())
  assert.equal(approvedWorkspace?.configuration?.model.protocolValue, 'gpt-5.6-sol')
  assert.equal(approvedWorkspace?.configuration?.reasoningEffort.protocolValue, 'high')
  assert.equal(approvedWorkspace?.configuration?.serviceTier.protocolValue, 'standard')
  assert.equal(approvedWorkspace?.configuration?.approvalPolicy.protocolValue, 'on-request')
  assert.equal(approvedWorkspace?.configuration?.fullAccess.protocolValue, 'off')
  await returnToCourse.click()
  await waitForSnapshot(
    electronApp,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected Module 1 return to restore the destination lesson'
  )
  await page.getByText('ĐÃ ĐẠT', { exact: true }).waitFor()
  await capture(page, 'module-1-codex-setup-approved.png')
  await page.getByRole('button', { name: 'Hoàn thành Module 1', exact: true }).click()
  await page.getByText('Module 1 đã hoàn thành', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Mở Module 2', exact: true }).click()
  await page.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  await page.getByText('HOÀN THÀNH', { exact: true }).first().waitFor()
}

async function capture(page, filename) {
  if (!screenshotDirectory) return
  await mkdir(screenshotDirectory, { recursive: true })
  await page.screenshot({
    animations: 'disabled',
    path: join(screenshotDirectory, filename)
  })
}

async function launchCourseCompanion() {
  return electron.launch({
    executablePath: electronExecutable,
    args: [mainEntry],
    env: {
      ...process.env,
      COURSE_COMPANION_USER_DATA_DIR: userDataDirectory,
      COURSE_COMPANION_WORKSPACE_ROOT: practiceWorkspace.root,
      COURSE_COMPANION_FAKE_CODEX: '1',
      COURSE_COMPANION_FAKE_TEACHER_LIVE_MODE: '1',
      COURSE_COMPANION_FAKE_TEACHER_FAIL_ONCE: '1'
    }
  })
}

async function windowSnapshot(electronApp) {
  return electronApp.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows().map((window) => {
      const preferences = window.webContents.getLastWebPreferences()
      return {
        url: window.webContents.getURL(),
        visible: window.isVisible(),
        alwaysOnTop: window.isAlwaysOnTop(),
        bounds: window.getBounds(),
        security: {
          contextIsolation: preferences.contextIsolation,
          nodeIntegration: preferences.nodeIntegration,
          sandbox: preferences.sandbox
        }
      }
    })
  )
}

async function waitForSnapshot(electronApp, predicate, message) {
  const deadline = Date.now() + 5_000
  let latest = await windowSnapshot(electronApp)

  while (Date.now() < deadline) {
    if (predicate(latest)) return latest
    await new Promise((resolve) => setTimeout(resolve, 50))
    latest = await windowSnapshot(electronApp)
  }

  throw new Error(`${message}\nLatest state: ${JSON.stringify(latest, null, 2)}`)
}

function learningWindow(windows) {
  return windows.find((window) => window.url.includes('#/learning'))
}

function companionWindow(windows) {
  return windows.find((window) => window.url.includes('#/companion'))
}

async function loadWindows(electronApp) {
  const learningPage =
    electronApp.windows().find((page) => page.url().includes('#/learning')) ??
    (await electronApp.waitForEvent('window', {
      predicate: (page) => page.url().includes('#/learning')
    }))
  await learningPage.waitForLoadState('domcontentloaded')

  const companionPage =
    electronApp.windows().find((page) => page.url().includes('#/companion')) ??
    (await electronApp.waitForEvent('window', {
      predicate: (page) => page.url().includes('#/companion')
    }))
  await companionPage.waitForLoadState('domcontentloaded')
  return { learningPage, companionPage }
}

async function verifyHomeBase(page) {
  await page.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  await page.getByText('TIẾN ĐỘ TOÀN KHÓA', { exact: true }).waitFor()
  await page.getByText('BẠN ĐANG Ở ĐÂY', { exact: true }).waitFor()
  assert.equal(
    await page
      .getByText('Chọn chặng có nhãn “Bạn đang ở đây” để tiếp tục học.', { exact: true })
      .count(),
    0
  )
  const typography = await page.evaluate(async () => {
    await globalThis.document.fonts.ready
    const heading = globalThis.document.querySelector('#homeBaseTitle')
    return {
      body: globalThis.getComputedStyle(globalThis.document.body).fontFamily,
      heading: heading ? globalThis.getComputedStyle(heading).fontFamily : '',
      regularLoaded: globalThis.document.fonts.check('400 16px "Be Vietnam Pro"', 'Tiếng Việt có dấu'),
      boldLoaded: globalThis.document.fonts.check('800 16px "Be Vietnam Pro"', 'Lộ trình khóa học')
    }
  })
  assert.match(typography.body, /Be Vietnam Pro/)
  assert.match(typography.heading, /Be Vietnam Pro/)
  assert.equal(typography.regularLoaded, true)
  assert.equal(typography.boldLoaded, true)
  assert.equal(await page.locator('.pixel-app-current').count(), 0)
  const teacherAnimation = await page
    .locator('.pixel-home-teacher img')
    .evaluate((element) => globalThis.getComputedStyle(element).animationName)
  assert.match(teacherAnimation, /pixel-teacher-idle/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(
    await page
      .locator('.pixel-home-teacher img')
      .evaluate((element) => globalThis.getComputedStyle(element).animationName),
    'none'
  )
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  assert.equal(await page.getByRole('navigation', { name: 'Điều hướng Course Companion' }).count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Bài học', exact: true }).count(), 0)
  await page.getByText('SẮP TỚI', { exact: true }).first().waitFor()
  assert.equal(await page.getByText('00', { exact: true }).count(), 0)
  assert.equal(await page.getByText('Giới thiệu khóa học', { exact: true }).count(), 0)
  await page
    .getByText('Bắt đầu làm việc với Codex', { exact: true })
    .waitFor()
  await page
    .getByText('Giao tiếp hiệu quả với coding agent: Planning, PRD và prompt', { exact: true })
    .waitFor()
  await page.getByText('MODULE 1 · 5 BÀI HỌC', { exact: true }).waitFor()
  await page.getByText('MODULE 2 · 6 BÀI HỌC', { exact: true }).waitFor()
  await capture(page, 'home-base.png')
  if (screenshotDirectory) {
    await page.setViewportSize({ width: 390, height: 844 })
    const narrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(narrowWidths.body, narrowWidths.viewport)
    assert.equal(narrowWidths.document, narrowWidths.viewport)
    await capture(page, 'home-base-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }
}

let firstLaunch
let resumedLaunch
let chatHistoryLaunch

try {
  firstLaunch = await launchCourseCompanion()
  const firstWindows = await loadWindows(firstLaunch)
  const initial = await waitForSnapshot(
    firstLaunch,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected the learning window to open while the companion stays hidden'
  )

  for (const window of initial) {
    assert.deepEqual(window.security, {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    })
  }
  assert.equal(companionWindow(initial)?.alwaysOnTop, true)

  await firstWindows.learningPage
    .getByRole('button', { name: 'Cùng bắt đầu nhé' })
    .click()
  await firstWindows.learningPage
    .getByText('GIỚI THIỆU KHÓA HỌC · TRANG 1/3', { exact: true })
    .waitFor()
  await firstWindows.learningPage.getByRole('button', { name: '← Trang trước', exact: true }).waitFor()
  assert.equal(
    await firstWindows.learningPage.getByRole('button', { name: '← Trang trước', exact: true }).isDisabled(),
    true
  )
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(
    await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(),
    'Trong khoá học này, bạn sẽ được xây dựng một ứng dụng có khả năng tự động hoá quá trình sáng tạo nội dung. Nó sẽ giúp bạn lên nội dung hàng ngày cho kênh Facebook.'
  )
  const desktopContinueButton = await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục' })
    .boundingBox()
  const desktopChoiceArea = await firstWindows.learningPage
    .locator('.pixel-choices')
    .boundingBox()
  assert.ok(desktopContinueButton)
  assert.ok(desktopChoiceArea)
  assert.ok(desktopContinueButton.width <= 240)
  assert.ok(Math.abs((desktopContinueButton.x + desktopContinueButton.width) - (desktopChoiceArea.x + desktopChoiceArea.width)) <= 1)
  await capture(firstWindows.learningPage, 'lesson-progress.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục' })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Bắt đầu khóa học', exact: true })
    .waitFor()
  await firstWindows.learningPage.getByRole('button', { name: '← Trang trước', exact: true }).click()
  await firstWindows.learningPage
    .getByText('ĐANG XEM LẠI · TIẾN ĐỘ VẪN ĐƯỢC GIỮ NGUYÊN', { exact: true })
    .waitFor()
  await capture(firstWindows.learningPage, 'lesson-review-mode.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Quay lại trang đang học', exact: true })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Bắt đầu khóa học', exact: true })
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(
    await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(),
    'Bạn chỉ cần nhập thông tin thương hiệu/kênh Facebook của mình, app sẽ tự động giúp bạn nghiên cứu những thông tin đang trending liên quan đến lĩnh vực của bạn, draft nội dung dựa trên giọng văn mà thương hiệu bạn theo đuổi, tạo cả hình ảnh giúp bạn, và bạn chỉ cần duyệt nội dung thôi.'
  )
  await capture(firstWindows.learningPage, 'course-introduction-page-2.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Bắt đầu khóa học', exact: true })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Bắt đầu Module 1', exact: true })
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(
    await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(),
    'Module 1 bắt đầu bằng Codex và coding agent. Sau đó, bạn sẽ hiểu Harness Engineering, chọn quyền truy cập an toàn, tìm hiểu model và reasoning effort rồi nộp cấu hình thật để Triết duyệt.'
  )
  await capture(firstWindows.learningPage, 'course-introduction-page-3.png')
  if (screenshotDirectory) {
    await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
    const introductionNarrowWidths = await firstWindows.learningPage.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(introductionNarrowWidths.body, introductionNarrowWidths.viewport)
    assert.equal(introductionNarrowWidths.document, introductionNarrowWidths.viewport)
    const narrowStartButton = await firstWindows.learningPage
      .getByRole('button', { name: 'Bắt đầu Module 1', exact: true })
      .boundingBox()
    const narrowChoiceArea = await firstWindows.learningPage
      .locator('.pixel-choices')
      .boundingBox()
    const narrowBackButton = await firstWindows.learningPage
      .getByRole('button', { name: '← Trang trước', exact: true })
      .boundingBox()
    assert.ok(narrowStartButton)
    assert.ok(narrowChoiceArea)
    assert.ok(narrowBackButton)
    assert.ok(Math.abs(narrowStartButton.width - narrowChoiceArea.width) <= 1)
    assert.ok(Math.abs(narrowBackButton.width - narrowChoiceArea.width) <= 1)
    assert.ok(narrowStartButton.y + narrowStartButton.height < narrowBackButton.y)
    await capture(firstWindows.learningPage, 'course-introduction-page-3-390px.png')
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstWindows.learningPage
    .getByRole('button', { name: 'Bắt đầu Module 1', exact: true })
    .click()
  await verifyHomeBase(firstWindows.learningPage)
  await completeSetupModule(firstWindows.learningPage, firstWindows.companionPage, firstLaunch, true)
  assert.equal(await fingerprintTree(practiceWorkspace.canonicalStarter), canonicalStarterFingerprint)
  await verifyHomeBase(firstWindows.learningPage)
  await firstWindows.learningPage
    .getByRole('button', { name: /MODULE 2.*MỞ BÀI HỌC/ })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Xem khi nào cần planning', exact: true })
    .waitFor()
  await firstWindows.learningPage
    .getByText('MODULE 2 · BÀI 1/6 · TRANG 1/4', { exact: true })
    .first()
    .waitFor()
  assert.equal(
    await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(),
    'Cũng giống như con người, có một kế hoạch kỹ càng trước khi xây sẽ giúp coding agent tránh phạm những sai lầm ngớ ngẩn sau này. Nó tưởng chừng tốn thời gian, nhưng thực chất planning kỹ sẽ giúp bạn đỡ phải debug và sửa một ứng dụng không vừa ý mình. Tin mình đi, sửa một ứng dụng đã đi sai hướng sẽ tốn thời gian hơn nhiều so với planning kỹ ngay từ đầu.\n\nKhông phải việc nào cũng cần planning. Bạn có thể giao trực tiếp cho coding agent nếu yêu cầu nhỏ và kết quả đã rõ. Hãy lập kế hoạch trước khi bắt đầu xây một sản phẩm mới. Bạn cũng nên planning nếu chưa xác định được hướng đi hoặc thứ tự thực hiện.'
  )
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual').count(), 1)
  const planningBackButton = await firstWindows.learningPage
    .getByRole('button', { name: '← Trang trước', exact: true })
    .boundingBox()
  const planningNextButton = await firstWindows.learningPage
    .getByRole('button', { name: 'Xem khi nào cần planning', exact: true })
    .boundingBox()
  assert.ok(planningBackButton)
  assert.ok(planningNextButton)
  assert.ok(Math.abs(
    planningBackButton.y + planningBackButton.height
      - (planningNextButton.y + planningNextButton.height)
  ) <= 1)
  await capture(firstWindows.learningPage, 'module-2-planning-fundamentals.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Xem khi nào cần planning', exact: true })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Áp dụng vào ContentPilot', exact: true })
    .waitFor()
  assert.equal(
    await firstWindows.learningPage.getByRole('button', { name: 'Làm câu kiểm tra nhanh', exact: true }).count(),
    0
  )
  await firstWindows.learningPage
    .getByText('NGUỒN PHƯƠNG PHÁP · MICROSOFT', { exact: true })
    .waitFor()
  await firstWindows.learningPage.getByRole('button', { name: '← Trang trước', exact: true }).click()
  await firstWindows.learningPage
    .getByText('ĐANG XEM LẠI · TIẾN ĐỘ VẪN ĐƯỢC GIỮ NGUYÊN', { exact: true })
    .waitFor()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Quay lại trang đang học', exact: true })
    .click()
  await firstWindows.learningPage
    .getByText('NGUỒN PHƯƠNG PHÁP · MICROSOFT', { exact: true })
    .waitFor()
  await capture(firstWindows.learningPage, 'module-2-planning-example.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Áp dụng vào ContentPilot', exact: true })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tìm hiểu PRD', exact: true })
    .click()
  await firstWindows.learningPage.getByRole('button', { name: 'Xem một ví dụ PRD', exact: true }).click()
  await firstWindows.learningPage.getByRole('button', { name: 'Cho coding agent xem ví dụ', exact: true }).click()
  await firstWindows.learningPage.getByRole('button', { name: 'Xem ví dụ bằng code', exact: true }).click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Làm 3 câu kiểm tra Planning và PRD', exact: true })
    .click()
  const firstAssessmentQuestion = assessmentGroup('planning-prd-check').questions[0]
  await firstWindows.learningPage.getByText(firstAssessmentQuestion.prompt, { exact: true }).waitFor()
  assert.equal(await firstWindows.learningPage.getByText('NGUỒN CHÍNH THỨC', { exact: true }).count(), 0)
  await firstWindows.learningPage
    .getByRole('button', { name: firstAssessmentQuestion.choices[0], exact: true })
    .click()
  await firstWindows.learningPage.getByText('NGUỒN CHÍNH THỨC', { exact: true }).waitFor()
  await capture(firstWindows.learningPage, 'module-2-first-sourced-check.png')
  if (screenshotDirectory) {
    await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
    const moduleTwoNarrowWidths = await firstWindows.learningPage.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(moduleTwoNarrowWidths.body, moduleTwoNarrowWidths.viewport)
    assert.equal(moduleTwoNarrowWidths.document, moduleTwoNarrowWidths.viewport)
    await capture(firstWindows.learningPage, 'module-2-assessment-390px.png')
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstLaunch.close()
  firstLaunch = undefined

  resumedLaunch = await launchCourseCompanion()
  const { learningPage, companionPage } = await loadWindows(resumedLaunch)

  await learningPage
    .getByRole('heading', { name: 'Tiếp tục đúng nơi bạn dừng lại' })
    .waitFor()
  await learningPage
    .getByText(/Câu 1\/3/)
    .waitFor()
  await learningPage.getByRole('button', { name: 'Bắt đầu lại' }).click()
  await learningPage
    .getByRole('heading', { name: 'Bắt đầu lại từ đầu?' })
    .waitFor()
  await learningPage.getByRole('button', { name: 'Xóa và bắt đầu lại' }).click()
  await learningPage
    .getByRole('heading', { name: 'Chào mừng bạn đến với Vibecoding 101' })
    .waitFor()
  await learningPage.getByRole('button', { name: 'Cùng bắt đầu nhé' }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục' }).click()
  await learningPage.getByRole('button', { name: 'Bắt đầu khóa học', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Bắt đầu Module 1', exact: true }).click()
  await learningPage.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  await completeSetupModule(learningPage, companionPage, resumedLaunch)
  assert.equal(await fingerprintTree(practiceWorkspace.canonicalStarter), canonicalStarterFingerprint)
  await learningPage.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' }).click()
  await learningPage.getByText('TRIẾT ĐÃ SẴN SÀNG', { exact: true }).waitFor()
  const teacherBounds = await learningPage.locator('.pixel-teacher-overlay').boundingBox()
  assert.ok(teacherBounds)
  assert.ok(teacherBounds.x > 1180 / 2)
  await capture(learningPage, 'teacher-overlay.png')
  await learningPage.locator('.pixel-teacher-overlay').getByRole('button', { name: 'Đóng Triết' }).click()
  await learningPage.getByRole('button', { name: 'Cài đặt', exact: true }).click()
  assert.equal(await learningPage.getByRole('button', { name: 'Thu nhỏ', exact: true }).count(), 0)
  await capture(learningPage, 'settings.png')
  const alwaysOnTopSwitch = learningPage.getByRole('switch', {
    name: 'Luôn ở phía trên cửa sổ khác'
  })
  await alwaysOnTopSwitch.click()
  const notFloating = await waitForSnapshot(
    resumedLaunch,
    (windows) => companionWindow(windows)?.alwaysOnTop === false,
    'Expected Settings to disable always-on-top for the Teacher companion'
  )
  assert.equal(companionWindow(notFloating)?.alwaysOnTop, false)
  await alwaysOnTopSwitch.click()
  await waitForSnapshot(
    resumedLaunch,
    (windows) => companionWindow(windows)?.alwaysOnTop === true,
    'Expected Settings to restore always-on-top for the Teacher companion'
  )
  await learningPage.getByRole('button', { name: 'Về Home Base', exact: true }).click()
  await learningPage
    .getByRole('button', { name: /MODULE 2.*MỞ BÀI HỌC/ })
    .click()
  await learningPage
    .getByRole('button', { name: 'Xem khi nào cần planning', exact: true })
    .waitFor()
  assert.equal(await learningPage.locator('.pixel-scene-title').count(), 1)
  assert.equal(await learningPage.locator('.pixel-consequence').count(), 0)

  await learningPage.getByRole('button', { name: 'Xem khi nào cần planning', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Áp dụng vào ContentPilot', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Tìm hiểu PRD', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Xem một ví dụ PRD', exact: true }).click()
  await learningPage.getByText('VÍ DỤ TỪ ATLASSIAN', { exact: true }).waitFor()
  await capture(learningPage, 'module-2-prd-example.png')
  await learningPage.getByRole('button', { name: 'Cho coding agent xem ví dụ', exact: true }).click()
  await learningPage.getByText('VÍ DỤ BẰNG HÌNH ẢNH', { exact: true }).waitFor()
  await capture(learningPage, 'module-2-prd-visual-examples.png')
  await learningPage.getByRole('button', { name: 'Xem ví dụ bằng code', exact: true }).click()
  await learningPage.getByText('VÍ DỤ BẰNG CODE', { exact: true }).waitFor()
  await capture(learningPage, 'module-2-prd-code-examples.png')
  await learningPage
    .getByRole('button', { name: 'Làm 3 câu kiểm tra Planning và PRD', exact: true })
    .click()
  await answerAssessmentGroup(learningPage, 'planning-prd-check')
  await learningPage.getByRole('button', { name: 'Xem một prompt có nguồn', exact: true }).click()
  await learningPage.getByText('VÍ DỤ TỪ OPENAI DOCS', { exact: true }).waitFor()
  await capture(learningPage, 'module-2-prompt-example.png')
  if (screenshotDirectory) {
    await learningPage.setViewportSize({ width: 390, height: 844 })
    const promptExampleNarrowWidths = await learningPage.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(promptExampleNarrowWidths.body, promptExampleNarrowWidths.viewport)
    assert.equal(promptExampleNarrowWidths.document, promptExampleNarrowWidths.viewport)
    await learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await learningPage.getByRole('button', { name: 'Áp dụng vào ContentPilot', exact: true }).click()
  await learningPage
    .getByRole('button', { name: 'Làm 3 câu kiểm tra Prompt engineering' })
    .click()
  await answerAssessmentGroup(learningPage, 'prompt-check')
  await learningPage.getByRole('button', { name: 'Xem PRD trở thành plan', exact: true }).click()
  await learningPage.getByText('VÍ DỤ ATLASSIAN → MICROSOFT', { exact: true }).waitFor()
  await capture(learningPage, 'module-2-implementation-plan-example.png')
  await learningPage
    .getByRole('button', { name: 'Làm 2 câu kiểm tra Implementation plan' })
    .click()
  await answerAssessmentGroup(learningPage, 'implementation-plan-check')
  await learningPage
    .getByRole('button', { name: 'Sang Codex tạo planning package' })
    .click()
  await companionPage.evaluate(() => globalThis.courseCompanion?.setCompanionMode('expanded'))
  await waitForSnapshot(
    resumedLaunch,
    (windows) => companionWindow(windows)?.bounds.width === 380,
    'Expected the regression setup to leave the companion renderer expanded'
  )
  await resumedLaunch.evaluate(({ BrowserWindow }) => {
    const companion = BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/companion'))
    companion?.hide()
  })

  await learningPage
    .getByRole('heading', { name: 'Dùng Codex để biến ý tưởng một câu về ContentPilot thành planning package đã được bạn phê duyệt mà chưa viết implementation code.' })
    .waitFor()
  await learningPage
    .locator('.practice-brief-card')
    .getByText('Một PRD khoảng một trang có đủ tám phần, một implementation plan bắt nguồn từ PRD, bốn điểm alignment đã được đối chiếu và một quyết định phạm vi do chính bạn giải thích.', { exact: true })
    .waitFor()
  await capture(learningPage, 'practice-brief.png')
  await learningPage.getByRole('button', { name: 'Bắt đầu Practice mới' }).click()
  await learningPage.getByRole('heading', { name: 'Bắt đầu một Practice mới?' }).waitFor()
  await learningPage.getByRole('button', { name: /Bắt đầu hoàn toàn mới/ }).click()

  const minimized = await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected the learning window to minimize into the Teacher companion'
  )
  assert.equal(companionWindow(minimized)?.bounds.width, 72)
  assert.equal(companionWindow(minimized)?.bounds.height, 72)
  await capture(companionPage, 'practice-bubble-first-start.png')
  assert.equal(await companionPage.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' }).count(), 1)
  assert.equal(await companionPage.locator('.pixel-teacher-panel').count(), 0)
  assert.equal(await companionPage.locator('.pixel-companion-surface--compact').count(), 1)


  await companionPage
    .getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' })
    .dblclick()
  await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected the initial Practice bubble to open the full Teacher workspace on double-click'
  )
  await learningPage.locator('.pixel-teacher-overlay.is-practice-full').waitFor()
  assert.equal(
    await learningPage.locator('.pixel-teacher-overlay.is-practice-full').getByRole('button', { name: 'Mở bài học' }).count(),
    0
  )
  await learningPage.getByRole('button', { name: 'Thu nhỏ Triết thành bong bóng' }).click()
  const minimizedFromFull = await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected full Teacher minimize to return directly to the bubble'
  )
  assert.equal(companionWindow(minimizedFromFull)?.bounds.width, 72)
  assert.equal(companionWindow(minimizedFromFull)?.bounds.height, 72)
  assert.equal(companionWindow(minimizedFromFull)?.alwaysOnTop, true)
  await companionPage.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' }).dblclick()
  await learningPage.locator('.pixel-teacher-overlay.is-practice-full').waitFor()
  await learningPage.locator('.pixel-teacher-overlay.is-practice-full').getByRole('button', { name: 'Đóng Triết' }).click()
  await learningPage.getByRole('button', { name: 'Sang Codex tạo planning package' }).click()
  await learningPage.getByRole('button', { name: 'Bắt đầu Practice mới' }).click()
  await learningPage.getByRole('heading', { name: 'Bắt đầu một Practice mới?' }).waitFor()
  const selectiveTransfer = learningPage.getByRole('button', { name: /Chuyển ngữ cảnh có chọn lọc/ })
  assert.equal(await selectiveTransfer.isDisabled(), true)
  await learningPage.getByRole('button', { name: 'Hủy', exact: true }).click()
  await companionPage.evaluate(() => globalThis.courseCompanion?.setCompanionMode('expanded'))
  await waitForSnapshot(
    resumedLaunch,
    (windows) => companionWindow(windows)?.bounds.width === 380,
    'Expected the Resume regression setup to leave the companion renderer expanded'
  )
  await resumedLaunch.evaluate(({ BrowserWindow }) => {
    const companion = BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/companion'))
    companion?.hide()
  })
  await learningPage.getByRole('button', { name: 'Tiếp tục Practice' }).click()
  const resumedPractice = await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected Resume Practice to reopen the active Executor chat and restore the Teacher bubble'
  )
  assert.equal(companionWindow(resumedPractice)?.bounds.width, 72)
  assert.equal(companionWindow(resumedPractice)?.bounds.height, 72)

  await capture(companionPage, 'practice-bubble-resume.png')
  assert.equal(await companionPage.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' }).count(), 1)
  assert.equal(await companionPage.locator('.pixel-teacher-panel').count(), 0)
  assert.equal(await companionPage.locator('.pixel-companion-surface--compact').count(), 1)
  await companionPage
    .getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' })
    .click()
  const expanded = await waitForSnapshot(
    resumedLaunch,
    (windows) => companionWindow(windows)?.bounds.width === 380,
    'Expected the Teacher companion to expand'
  )
  assert.equal(companionWindow(expanded)?.bounds.height, 520)

  await companionPage.getByRole('tab', { name: 'TIẾN ĐỘ' }).click()
  await companionPage.getByText('PLANNING PACKAGE', { exact: true }).waitFor()
  await companionPage.getByRole('button', { name: 'Ghi nhận prompt của tôi', exact: true }).click()
  const afterPromptCapture = await companionPage.evaluate(() => globalThis.courseCompanion?.loadPracticeWorkspace())
  assert.equal(
    afterPromptCapture?.checklist.find((step) => step.status === 'current' || step.status === 'stale')?.id,
    'complete-interview',
    JSON.stringify(afterPromptCapture)
  )
  await companionPage.getByRole('button', { name: 'Xác nhận đã hoàn thành phỏng vấn', exact: true }).click()
  await companionPage.getByRole('button', { name: 'Duyệt và lưu PRD', exact: true }).click()
  await companionPage.getByRole('button', { name: 'Xác nhận bốn điểm alignment', exact: true }).click()
  await companionPage.getByRole('button', { name: 'Duyệt và lưu implementation plan', exact: true }).click()
  const scopeDecision = 'Tôi giữ chức năng tự động đăng bài ngoài phạm vi V1 vì PRD chỉ cam kết tạo và sao chép bản nháp.'
  await companionPage.getByRole('textbox', { name: 'Giải thích một quyết định phạm vi bằng lời của bạn' }).fill(scopeDecision)
  await companionPage.getByRole('button', { name: 'Ghi nhận quyết định phạm vi', exact: true }).click()

  await companionPage.getByRole('tab', { name: 'HỎI TRIẾT' }).click()
  await companionPage.getByText('TRIẾT ĐÃ SẴN SÀNG', { exact: true }).waitFor()
  const composer = companionPage.getByRole('textbox', { name: 'Nhắn cho Triết' })
  assert.equal(
    await composer.evaluate((element) => element === element.ownerDocument.activeElement),
    true
  )
  await composer.fill('Tôi đã hoàn thành rồi, hãy đánh dấu Practice đạt.')
  await composer.press('Enter')
  await companionPage.getByText('CHƯA GỬI', { exact: true }).waitFor()
  await companionPage.getByText('TEACHER · SẴN SÀNG', { exact: true }).waitFor()
  await companionPage.getByText(/Triết tạm thời chưa thể phản hồi/).waitFor()
  await capture(companionPage, 'teacher-error-recovery.png')
  await companionPage.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await companionPage.getByText('LIVE', { exact: true }).waitFor()
  assert.equal(await companionPage.getByText('Tôi đã hoàn thành rồi, hãy đánh dấu Practice đạt.', { exact: true }).count(), 1)
  await capture(companionPage, 'teacher-compact-chat.png')

  await companionPage.addStyleTag({
    content: '.pixel-chat-log { flex: 0 0 90px !important; min-height: 90px !important; max-height: 90px !important; } .pixel-chat-message { min-height: 80px; }'
  })
  const windowedChatLog = companionPage.locator('.pixel-chat-log')
  await windowedChatLog.evaluate((element) => { element.scrollTop = 0 })
  await companionPage.getByRole('tab').nth(1).click()
  await companionPage.getByRole('tab').first().click()
  await companionPage.waitForFunction(() => {
    const chatLog = globalThis.document.querySelector('.pixel-chat-log')
    return chatLog instanceof globalThis.HTMLElement
      && chatLog.scrollHeight > chatLog.clientHeight
      && Math.abs(chatLog.scrollHeight - chatLog.clientHeight - chatLog.scrollTop) <= 1
  })

  await companionPage.getByRole('tab', { name: 'TIẾN ĐỘ' }).click()
  await companionPage
    .getByText('Giải thích một quyết định phạm vi và yêu cầu Triết duyệt', { exact: true })
    .waitFor()
  assert.equal(await companionPage.getByRole('button', { name: 'Quay lại khóa học', exact: true }).count(), 0)

  await appendFile(
    join(practiceWorkspace.workspaceRoot, 'artifacts', 'PRD.md'),
    '\n\nGhi chú sửa đổi: giữ rõ ranh giới không tự động đăng bài.\n'
  )
  await companionPage.getByRole('button', { name: 'Làm mới bằng chứng', exact: true }).click()
  await companionPage.getByText('DEPENDENCY VỪA THAY ĐỔI', { exact: true }).waitFor()
  await companionPage.getByText('artifacts/PRD.md', { exact: true }).waitFor()
  await companionPage.getByRole('button', { name: 'Duyệt và lưu PRD', exact: true }).click()
  await appendFile(
    join(practiceWorkspace.workspaceRoot, 'artifacts', 'implementation-plan.md'),
    '\n\nGhi chú sửa đổi: plan đã được đối chiếu lại với PRD hiện tại.\n'
  )
  await companionPage.getByRole('button', { name: 'Làm mới bằng chứng', exact: true }).click()
  await companionPage.getByRole('button', { name: 'Xác nhận bốn điểm alignment', exact: true }).click()
  await companionPage.getByRole('button', { name: 'Duyệt và lưu implementation plan', exact: true }).click()
  await companionPage.getByRole('textbox', { name: 'Giải thích một quyết định phạm vi bằng lời của bạn' }).fill(scopeDecision)
  await companionPage.getByRole('button', { name: 'Ghi nhận quyết định phạm vi', exact: true }).click()

  const reviewProgressButton = companionPage.getByRole('button', {
    name: 'Yêu cầu Triết duyệt tiến độ'
  })
  await reviewProgressButton.click()
  await companionPage.waitForFunction(() => {
    const returned = [...globalThis.document.querySelectorAll('button')]
      .some((button) => button.textContent?.trim() === 'Quay lại khóa học')
    const error = globalThis.document.body.textContent
      ?.includes('Không thể duyệt tiến độ Practice. Hãy thử lại.') === true
    return returned || error
  })
  const prdRecoveryReviewErrorCount = await companionPage
    .getByText('Không thể duyệt tiến độ Practice. Hãy thử lại.', { exact: true })
    .count()
  const prdRecoveryReviewWorkspace = prdRecoveryReviewErrorCount > 0
    ? await companionPage.evaluate(() => globalThis.courseCompanion?.loadPracticeWorkspace())
    : null
  assert.equal(prdRecoveryReviewErrorCount, 0, JSON.stringify(prdRecoveryReviewWorkspace))
  let returnToCourseButton = companionPage.getByRole('button', { name: 'Quay lại khóa học', exact: true })
  await returnToCourseButton.waitFor()

  await appendFile(
    join(practiceWorkspace.workspaceRoot, 'artifacts', 'implementation-plan.md'),
    '\nGhi chú plan-only: làm rõ cách kiểm tra toàn bộ luồng.\n'
  )
  await companionPage.getByRole('button', { name: 'Làm mới bằng chứng', exact: true }).click()
  await companionPage.getByText('artifacts/implementation-plan.md', { exact: true }).waitFor()
  assert.equal(await companionPage.getByRole('button', { name: 'Quay lại khóa học', exact: true }).count(), 0)
  await companionPage.getByRole('button', { name: 'Xác nhận bốn điểm alignment', exact: true }).click()
  await companionPage.getByRole('button', { name: 'Duyệt và lưu implementation plan', exact: true }).click()
  await reviewProgressButton.click()
  await companionPage.waitForFunction(() => {
    const returned = [...globalThis.document.querySelectorAll('button')]
      .some((button) => button.textContent?.trim() === 'Quay lại khóa học')
    const error = globalThis.document.body.textContent
      ?.includes('Không thể duyệt tiến độ Practice. Hãy thử lại.') === true
    return returned || error
  })
  const planOnlyReviewErrorCount = await companionPage
    .getByText('Không thể duyệt tiến độ Practice. Hãy thử lại.', { exact: true })
    .count()
  const planOnlyReviewWorkspace = planOnlyReviewErrorCount > 0
    ? await companionPage.evaluate(() => globalThis.courseCompanion?.loadPracticeWorkspace())
    : null
  assert.equal(planOnlyReviewErrorCount, 0, JSON.stringify(planOnlyReviewWorkspace))
  returnToCourseButton = companionPage.getByRole('button', { name: 'Quay lại khóa học', exact: true })
  await returnToCourseButton.waitFor()
  await capture(companionPage, 'teacher-compact-progress.png')
  assert.equal(await reviewProgressButton.getAttribute('title'), 'Yêu cầu Triết duyệt tiến độ')
  const reviewedWorkspace = await companionPage.evaluate(() => globalThis.courseCompanion?.loadPracticeWorkspace())
  assert.equal(reviewedWorkspace?.review?.status, 'passed')
  assert.equal(reviewedWorkspace?.review?.canReturn, true)
  await capture(companionPage, 'practice-review-passed-compact.png')
  assert.equal(
    await companionPage.getByRole('tab', { name: 'TIẾN ĐỘ' }).getAttribute('aria-selected'),
    'true'
  )
  assert.equal(
    await companionPage.getByText('Không thể duyệt tiến độ Practice. Hãy thử lại.', { exact: true }).count(),
    0
  )

  await companionPage.getByRole('tab', { name: 'HỎI TRIẾT' }).click()
  const compactDraft = 'Bản nháp từ cửa sổ thu gọn'
  await composer.fill(compactDraft)
  await companionPage.getByRole('button', { name: 'Mở Triết toàn màn hình' }).click()

  await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected the explicit expand control to open the full Teacher workspace'
  )
  await learningPage.locator('.pixel-teacher-overlay.is-practice-full').waitFor()
  const fullTeacher = learningPage.locator('.pixel-teacher-overlay.is-practice-full')
  await fullTeacher.evaluate((element) => Promise.all(
    element.getAnimations().map((animation) => animation.finished)
  ))
  const fullComposer = fullTeacher.getByRole('textbox', { name: 'Nhắn cho Triết' })
  await fullComposer.waitFor()
  assert.equal(await fullComposer.inputValue(), compactDraft)
  await fullComposer.fill('Bản nháp được sửa ở toàn màn hình')
  const fullTeacherMetrics = await fullTeacher.evaluate((element) => {
    const bounds = element.getBoundingClientRect()
    return {
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
      viewportWidth: globalThis.innerWidth,
      viewportHeight: globalThis.innerHeight,
      backgroundColor: globalThis.getComputedStyle(element).backgroundColor
    }
  })
  assert.equal(fullTeacherMetrics.x, 0)
  assert.equal(fullTeacherMetrics.y, 0)
  assert.ok(Math.abs(fullTeacherMetrics.width - fullTeacherMetrics.viewportWidth) <= 1)
  assert.ok(Math.abs(fullTeacherMetrics.height - fullTeacherMetrics.viewportHeight) <= 1)
  assert.equal(fullTeacherMetrics.backgroundColor, 'rgb(8, 15, 34)')
  await capture(learningPage, 'teacher-fullscreen-opaque.png')

  await fullTeacher.evaluate((element) => new Promise((resolve) => {
    const ready = () => element.textContent?.includes('Không thể tải lịch sử trò chuyện.')
      || [...element.querySelectorAll('button')]
        .some((button) => button.getAttribute('aria-label') === 'Quay lại khóa học nhanh')
    if (ready()) return resolve(undefined)
    const observer = new globalThis.MutationObserver(() => {
      if (!ready()) return
      observer.disconnect()
      resolve(undefined)
    })
    observer.observe(element, { childList: true, subtree: true, characterData: true })
  }))
  const fullTeacherLoadError = await fullTeacher
    .getByText('Không thể tải lịch sử trò chuyện.', { exact: true })
    .count()
  const fullTeacherWorkspace = fullTeacherLoadError > 0
    ? await learningPage.evaluate(() => globalThis.courseCompanion?.loadPracticeWorkspace())
    : null
  assert.equal(fullTeacherLoadError, 0, JSON.stringify(fullTeacherWorkspace))
  await fullTeacher.getByRole('tab', { name: 'TIẾN ĐỘ' }).click()
  await fullTeacher.getByText('PLANNING PACKAGE', { exact: true }).waitFor()
  await learningPage.getByRole('button', { name: 'Thu nhỏ Triết thành bong bóng' }).click()
  const minimizedAgain = await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected full Teacher to minimize directly to the bubble'
  )
  assert.equal(companionWindow(minimizedAgain)?.bounds.width, 72)
  assert.equal(companionWindow(minimizedAgain)?.bounds.height, 72)
  assert.equal(companionWindow(minimizedAgain)?.alwaysOnTop, true)
  await companionPage.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' }).click()
  await waitForSnapshot(
    resumedLaunch,
    (windows) => companionWindow(windows)?.bounds.width === 380,
    'Expected the Teacher companion to reopen for reverse draft synchronization'
  )
  assert.equal(
    await companionPage.getByRole('textbox', { name: 'Nhắn cho Triết' }).inputValue(),
    'Bản nháp được sửa ở toàn màn hình'
  )
  await companionPage.getByRole('button', { name: 'Thu nhỏ Triết', exact: true }).click()
  await waitForSnapshot(resumedLaunch, (windows) => companionWindow(windows)?.bounds.width === 72, 'Expected Teacher to return to bubble')
  await companionPage.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' }).dblclick()
  await learningPage.locator('.pixel-teacher-overlay.is-practice-full').waitFor()
  const passedPracticeTeacher = learningPage.locator('.pixel-teacher-overlay.is-practice-full')
  await passedPracticeTeacher.getByRole('tab', { name: 'TIẾN ĐỘ' }).click()
  const fullReturnButton = passedPracticeTeacher.getByRole('button', { name: 'Quay lại khóa học', exact: true })
  await fullReturnButton.waitFor()
  await capture(learningPage, 'practice-review-passed-full.png')
  await fullReturnButton.click()

  await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected returning from a passed Practice to reveal the destination lesson'
  )

  await learningPage.getByText('Kiểm tra và hoàn thành Module 2', { exact: true }).waitFor()
  assert.equal(
    await learningPage.getByText('Không thể tải tiến trình cục bộ.', { exact: true }).count(),
    0
  )
  await capture(learningPage, 'practice-reflection.png')
  await learningPage
    .getByRole('button', { name: 'Bắt đầu 15 câu kiểm tra cuối', exact: true })
    .click()
  await answerAssessmentGroup(learningPage, 'final-assessment')
  await learningPage.getByText('Bạn đạt 15/15 câu.', { exact: false }).waitFor()
  await capture(learningPage, 'module-2-final-summary.png')
  await learningPage.getByRole('button', { name: 'Hoàn thành Module 2', exact: true }).click()
  await learningPage.getByText('Module 2 đã hoàn thành', { exact: true }).waitFor()
  await learningPage.getByRole('button', { name: 'Về Home Base', exact: true }).click()
  await learningPage.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()

  const firstPracticeRun = await companionPage.evaluate(() => globalThis.courseCompanion?.loadPracticeWorkspace())
  const secondPracticeRun = await companionPage.evaluate(() => globalThis.courseCompanion?.startPractice({
    practiceId: 'm2-planning-package',
    practiceVersion: '2.0.0',
    transfer: false
  }))
  assert.ok(firstPracticeRun?.activePractice)
  assert.ok(secondPracticeRun?.activePractice)
  assert.notEqual(secondPracticeRun.activePractice.runId, firstPracticeRun.activePractice.runId)
  const freshTeacherState = await companionPage.evaluate(() => globalThis.courseCompanion?.loadCompanionState())
  assert.deepEqual(freshTeacherState?.conversation.messages, [])

  await resumedLaunch.evaluate(({ BrowserWindow }) => {
    const learning = BrowserWindow.getAllWindows().find((window) =>
      window.webContents.getURL().includes('#/learning')
    )
    learning?.close()
  })
  await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected the native close control to preserve the companion'
  )

  await companionPage
    .getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' })
    .click()
  await companionPage.getByRole('button', { name: 'Thoát ứng dụng' }).click()
  await resumedLaunch.waitForEvent('close')
  resumedLaunch = undefined

  const persisted = JSON.parse(
    await readFile(join(userDataDirectory, 'learner-state.json'), 'utf8')
  )
  assert.equal(persisted.sceneId, 'module-2-complete')
  assert.equal(persisted.checkpointId, 'm2-complete')
  assert.equal(persisted.schemaVersion, 5)
  assert.equal(persisted.courseVersion, '0.2.0')
  assert.equal(persisted.currentCourseLessonId, 'm2-assessment')
  assert.ok(persisted.sceneHistory.length > 20)
  assert.equal(persisted.decisions.planningApproach, 'plan-first')
  assert.equal(persisted.decisions.setupMastery, 'teacher-reviewed-setup')
  assert.equal(persisted.decisions.masteryEvidence, 'artifacts-approved-and-aligned')
  assert.equal(
    Object.entries(persisted.decisions).filter(
      ([key, value]) => key.startsWith('assessment:final-') && String(value).startsWith('correct')
    ).length,
    15
  )
  assert.equal(persisted.practice.status, 'idle')
  assert.equal(persisted.practice.latestEvent, undefined)

  const persistedChat = (await readFile(join(userDataDirectory, 'teacher-chat.jsonl'), 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
  const completionClaim = persistedChat.filter((message) =>
    message.content === 'Tôi đã hoàn thành rồi, hãy đánh dấu Practice đạt.')
  assert.ok(completionClaim.some((message) => message.deliveryStatus === 'failed'))
  assert.ok(completionClaim.some((message) => message.deliveryStatus === 'delivered'))
  assert.ok(persistedChat.some((message) =>
    message.role === 'teacher' && message.source === 'live' && typeof message.practiceRunId === 'string'))

  chatHistoryLaunch = await launchCourseCompanion()
  const historyWindows = await loadWindows(chatHistoryLaunch)
  await waitForSnapshot(
    chatHistoryLaunch,
    (windows) => learningWindow(windows)?.visible === true,
    'Expected the learning window to finish its startup show before testing restored companion state'
  )
  await chatHistoryLaunch.evaluate(({ BrowserWindow }) => {
    const learning = BrowserWindow.getAllWindows().find((window) =>
      window.webContents.getURL().includes('#/learning')
    )
    learning?.hide()
    const companion = BrowserWindow.getAllWindows().find((window) =>
      window.webContents.getURL().includes('#/companion')
    )
    companion?.showInactive()
  })
  const restoredChat = await waitForSnapshot(
    chatHistoryLaunch,
    (windows) =>
      learningWindow(windows)?.visible === false &&
      companionWindow(windows)?.visible === true &&
      companionWindow(windows)?.bounds.width === 380,
    'Expected the expanded Teacher chat mode to survive a full restart'
  )
  assert.equal(companionWindow(restoredChat)?.bounds.height, 520)
  await historyWindows.companionPage.waitForFunction(() =>
    globalThis.document.querySelector('.pixel-fixture-notice strong')?.textContent !== 'ĐANG KẾT NỐI TRIẾT'
  )
  const restoredTeacherTab = historyWindows.companionPage.getByRole('tab', { name: 'HỎI TRIẾT' })
  await restoredTeacherTab.waitFor()
  assert.equal(await restoredTeacherTab.getAttribute('aria-selected'), 'true')
  assert.equal(
    await historyWindows.companionPage.getByText('Tôi đã hoàn thành rồi, hãy đánh dấu Practice đạt.', { exact: true }).count(),
    0
  )
  await historyWindows.companionPage.getByRole('tab', { name: 'TIẾN ĐỘ' }).click()
  await historyWindows.companionPage.getByText('PLANNING PACKAGE', { exact: true }).waitFor()
  assert.equal(
    await historyWindows.companionPage.getByText('ĐÃ HOÀN THÀNH · MÔ PHỎNG', { exact: true }).count(),
    0
  )
  await historyWindows.companionPage.getByRole('button', { name: 'Thoát ứng dụng' }).click()
  await chatHistoryLaunch.waitForEvent('close')
  chatHistoryLaunch = undefined
  assert.equal(
    await fingerprintTree(practiceWorkspace.canonicalStarter),
    canonicalStarterFingerprint
  )

  console.log(
    'Electron smoke: Pilot 0.2 journey, Practice start/resume/switch, fresh per-run Triết sessions, compact/full Teacher surfaces, settings, fixtures, Module 2 mastery, persistence, security, and companion lifecycle passed'
  )
} finally {
  await firstLaunch?.close().catch(() => undefined)
  await resumedLaunch?.close().catch(() => undefined)
  await chatHistoryLaunch?.close().catch(() => undefined)
  await rm(userDataDirectory, { recursive: true, force: true })
  await practiceWorkspace.cleanup()
}
