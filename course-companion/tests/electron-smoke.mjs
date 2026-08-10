import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import electronExecutable from 'electron'
import { _electron as electron } from 'playwright-core'

const mainEntry = join(process.cwd(), 'out/main/index.js')
const userDataDirectory = await mkdtemp(join(tmpdir(), 'course-companion-electron-'))
const screenshotDirectory = process.env.COURSE_COMPANION_SCREENSHOT_DIR

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
      COURSE_COMPANION_USER_DATA_DIR: userDataDirectory
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
    .getByText('Giao tiếp hiệu quả với coding agent: Planning và PRD', { exact: true })
    .waitFor()
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
    .getByText('BÀI HỌC HIỆN TẠI · BƯỚC 1/1', { exact: true })
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
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
    .getByRole('button', { name: 'Tiếp tục' })
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  await capture(firstWindows.learningPage, 'course-introduction-page-2.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục' })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Bắt đầu Module 1', exact: true })
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
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
    assert.ok(narrowStartButton)
    assert.ok(narrowChoiceArea)
    assert.ok(Math.abs(narrowStartButton.width - narrowChoiceArea.width) <= 1)
    await capture(firstWindows.learningPage, 'course-introduction-page-3-390px.png')
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstWindows.learningPage
    .getByRole('button', { name: 'Bắt đầu Module 1', exact: true })
    .click()
  await verifyHomeBase(firstWindows.learningPage)
  await firstWindows.learningPage
    .getByRole('button', { name: /MODULE 1.*MỞ BÀI HỌC/ })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .waitFor()
  assert.equal(
    await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(),
    'Cũng giống như con người, có một kế hoạch kỹ càng trước khi xây sẽ giúp coding agent tránh phạm những sai lầm ngớ ngẩn sau này. Nó tưởng chừng tốn thời gian, nhưng thực chất planning kỹ sẽ giúp bạn đỡ phải debug và sửa một ứng dụng không vừa ý mình. Tin mình đi, sửa một ứng dụng đã đi sai hướng sẽ tốn thời gian hơn nhiều so với planning kỹ ngay từ đầu.\n\nPlanning không cần thiết cho mọi việc. Một thay đổi nhỏ, rõ ràng và dễ hoàn tác có thể giao trực tiếp. Nhưng khi xây từ đầu, còn nhiều quyết định chưa rõ hoặc có nhiều bước phụ thuộc nhau, planning giúp coding agent hiểu đúng vấn đề trước khi viết code.'
  )
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  await capture(firstWindows.learningPage, 'module-1-planning-fundamentals.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Một công việc còn nhiều quyết định chưa rõ hoặc nhiều bước phụ thuộc nhau' })
    .waitFor()
  await firstWindows.learningPage
    .getByText('OpenAI: Với công việc nhiều bước, hãy để Codex điều tra và đề xuất cách tiếp cận trước khi chỉnh sửa. Anthropic: Khám phá trước, sau đó lập kế hoạch, rồi mới viết code.', { exact: true })
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-choice.is-primary').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-choice.is-danger').count(), 0)
  await capture(firstWindows.learningPage, 'module-1-planning-check.png')
  if (screenshotDirectory) {
    await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
    const moduleOneNarrowWidths = await firstWindows.learningPage.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(moduleOneNarrowWidths.body, moduleOneNarrowWidths.viewport)
    assert.equal(moduleOneNarrowWidths.document, moduleOneNarrowWidths.viewport)
    await capture(firstWindows.learningPage, 'module-1-planning-390px.png')
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstWindows.learningPage
    .getByRole('button', { name: 'Một thay đổi nhỏ, rõ ràng và dễ hoàn tác' })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Xem lại dấu hiệu cần planning' })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Một công việc còn nhiều quyết định chưa rõ hoặc nhiều bước phụ thuộc nhau' })
    .waitFor()
  await firstLaunch.close()
  firstLaunch = undefined

  resumedLaunch = await launchCourseCompanion()
  const { learningPage, companionPage } = await loadWindows(resumedLaunch)

  await learningPage
    .getByRole('heading', { name: 'Tiếp tục đúng nơi bạn dừng lại' })
    .waitFor()
  await learningPage
    .getByText(/Khi nào một yêu cầu nên được planning trước/)
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
  await learningPage.getByRole('button', { name: 'Tiếp tục' }).click()
  await learningPage.getByRole('button', { name: 'Bắt đầu Module 1', exact: true }).click()
  await learningPage.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  await learningPage.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' }).click()
  await learningPage.getByText('PHẢN HỒI LUYỆN TẬP', { exact: true }).waitFor()
  const teacherBounds = await learningPage.locator('.pixel-teacher-overlay').boundingBox()
  assert.ok(teacherBounds)
  assert.ok(teacherBounds.x > 1180 / 2)
  await capture(learningPage, 'teacher-overlay.png')
  await learningPage.locator('.pixel-teacher-overlay .pixel-panel-minimize').click()
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
    .getByRole('button', { name: /MODULE 1.*MỞ BÀI HỌC/ })
    .click()
  await learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .waitFor()
  assert.equal(await learningPage.locator('.pixel-scene-title').count(), 1)
  assert.equal(await learningPage.locator('.pixel-consequence').count(), 0)

  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage
    .getByRole('button', { name: 'Một công việc còn nhiều quyết định chưa rõ hoặc nhiều bước phụ thuộc nhau' })
    .click()
  await learningPage
    .getByRole('button', { name: 'Workflow, input, output và phạm vi V1' })
    .click()
  await learningPage
    .getByRole('button', { name: 'PRD · Đây là quyết định phạm vi' })
    .click()
  await learningPage
    .getByRole('button', { name: 'Phỏng vấn tôi từng câu một' })
    .click()
  await learningPage.getByRole('button', { name: 'Duyệt PRD đã review' }).click()
  await learningPage
    .getByRole('button', { name: 'Tạo plan có kết quả và cách kiểm tra' })
    .click()
  await learningPage
    .getByRole('button', { name: 'Loại bước đăng bài khỏi plan' })
    .click()
  await learningPage
    .getByRole('button', { name: 'Sang Codex tạo planning package' })
    .click()

  const minimized = await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected the learning window to minimize into the Teacher companion'
  )
  assert.equal(companionWindow(minimized)?.bounds.width, 168)
  assert.equal(companionWindow(minimized)?.bounds.height, 188)

  await companionPage
    .getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' })
    .click()
  const expanded = await waitForSnapshot(
    resumedLaunch,
    (windows) => companionWindow(windows)?.bounds.width === 380,
    'Expected the Teacher companion to expand'
  )
  assert.equal(companionWindow(expanded)?.bounds.height, 520)

  await companionPage.getByText('PHẢN HỒI LUYỆN TẬP', { exact: true }).waitFor()
  const composer = companionPage.getByRole('textbox', { name: 'Nhắn cho Triết' })
  assert.equal(
    await composer.evaluate((element) => element === element.ownerDocument.activeElement),
    true
  )
  await composer.fill('Tôi cần kiểm tra gì trước khi duyệt?')
  await composer.press('Enter')
  await companionPage
    .getByText('Tôi cần kiểm tra gì trước khi duyệt?', { exact: true })
    .waitFor()
  await companionPage
    .getByText(
      'Hãy đối chiếu bốn điểm: đủ yêu cầu trong phạm vi, không có scope creep, mỗi bước truy ngược về PRD và mỗi Done When có cách kiểm tra.',
      { exact: true }
    )
    .waitFor()

  await companionPage.getByRole('tab', { name: 'THỰC HÀNH' }).click()
  await companionPage.getByText('CHƯA BẮT ĐẦU · LUYỆN TẬP', { exact: true }).waitFor()
  await companionPage.getByText('CÁC TÌNH HUỐNG LUYỆN TẬP', { exact: true }).click()

  const fixtureScenarios = [
    ['Bắt đầu', 'ĐANG THỰC HIỆN · LUYỆN TẬP'],
    ['Cần phê duyệt', 'CẦN PHÊ DUYỆT · LUYỆN TẬP'],
    ['Bằng chứng cũ', 'BẰNG CHỨNG CŨ · LUYỆN TẬP'],
    ['Mất kết nối', 'MẤT KẾT NỐI · LUYỆN TẬP'],
    ['Lỗi', 'LƯỢT CHẠY LỖI · LUYỆN TẬP'],
    ['Hoàn thành', 'ĐÃ HOÀN THÀNH · LUYỆN TẬP']
  ]
  for (const [buttonName, statusText] of fixtureScenarios) {
    await companionPage.getByRole('button', { name: buttonName, exact: true }).click()
    await companionPage.getByText(statusText, { exact: true }).waitFor()
  }
  await companionPage.getByText('Khớp PRD', { exact: true }).waitFor()
  await companionPage.getByText('BẰNG CHỨNG MỚI · BÀI LUYỆN TẬP', { exact: true }).waitFor()

  await companionPage.getByRole('button', { name: 'Mở bài học' }).click()
  await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected the learning window to restore and hide the companion'
  )

  await learningPage.getByText('Kiểm tra planning package', { exact: true }).waitFor()
  assert.equal(
    await learningPage.getByText('Không thể tải tiến trình cục bộ.', { exact: true }).count(),
    0
  )
  await learningPage
    .getByRole('button', { name: 'Hai artifact tồn tại, đã duyệt và khớp nhau' })
    .click()
  await learningPage.getByText('Module 1 đã hoàn thành', { exact: true }).waitFor()
  await learningPage.getByRole('button', { name: 'Về Home Base', exact: true }).click()
  await learningPage.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()

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
  assert.equal(persisted.sceneId, 'module-1-complete')
  assert.equal(persisted.checkpointId, 'm1-complete')
  assert.equal(persisted.decisions.planningApproach, 'plan-first')
  assert.equal(persisted.decisions.masteryEvidence, 'artifacts-approved-and-aligned')
  assert.equal(persisted.practice.status, 'completed')
  assert.equal(persisted.practice.latestEvent.source, 'fixture')

  const persistedChat = (await readFile(join(userDataDirectory, 'teacher-chat.jsonl'), 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
  assert.equal(persistedChat.length, 2)
  assert.equal(persistedChat[1].source, 'fixture')

  chatHistoryLaunch = await launchCourseCompanion()
  const historyWindows = await loadWindows(chatHistoryLaunch)
  await chatHistoryLaunch.evaluate(({ BrowserWindow }) => {
    const learning = BrowserWindow.getAllWindows().find((window) =>
      window.webContents.getURL().includes('#/learning')
    )
    learning?.close()
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
  await historyWindows.companionPage
    .getByText('Tôi cần kiểm tra gì trước khi duyệt?', { exact: true })
    .waitFor()
  await historyWindows.companionPage
    .getByText(
      'Hãy đối chiếu bốn điểm: đủ yêu cầu trong phạm vi, không có scope creep, mỗi bước truy ngược về PRD và mỗi Done When có cách kiểm tra.',
      { exact: true }
    )
    .waitFor()
  await historyWindows.companionPage.getByRole('tab', { name: 'THỰC HÀNH' }).click()
  await historyWindows.companionPage
    .getByText('ĐÃ HOÀN THÀNH · LUYỆN TẬP', { exact: true })
    .waitFor()
  await historyWindows.companionPage.getByRole('button', { name: 'Thoát ứng dụng' }).click()
  await chatHistoryLaunch.waitForEvent('close')
  chatHistoryLaunch = undefined

  console.log(
    'Electron smoke: Module 0 removal, planning-first Module 1, roadmap entry, Teacher overlay, settings, journey resume/reset, planning-package fixtures, mastery, persistence, security, and companion lifecycle passed'
  )
} finally {
  await firstLaunch?.close().catch(() => undefined)
  await resumedLaunch?.close().catch(() => undefined)
  await chatHistoryLaunch?.close().catch(() => undefined)
  await rm(userDataDirectory, { recursive: true, force: true })
}
