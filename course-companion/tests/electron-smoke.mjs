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
      COURSE_COMPANION_FAKE_EXECUTOR_SILENT_RESULT: '1',
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
    .getByRole('button', { name: 'Bắt đầu và mở Home Base' })
    .click()
  await firstWindows.learningPage
    .getByRole('heading', { name: 'Lộ trình khóa học' })
    .waitFor()
  await firstWindows.learningPage.getByText('TIẾN ĐỘ TOÀN KHÓA', { exact: true }).waitFor()
  await firstWindows.learningPage.getByText('BẠN ĐANG Ở ĐÂY', { exact: true }).waitFor()
  assert.equal(
    await firstWindows.learningPage
      .getByText('Chọn chặng có nhãn “Bạn đang ở đây” để tiếp tục học.', { exact: true })
      .count(),
    0
  )
  const typography = await firstWindows.learningPage.evaluate(async () => {
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
  assert.equal(await firstWindows.learningPage.locator('.pixel-app-current').count(), 0)
  assert.equal(
    await firstWindows.learningPage.getByRole('navigation', { name: 'Điều hướng Course Companion' }).count(),
    0
  )
  assert.equal(await firstWindows.learningPage.getByRole('button', { name: 'Bài học', exact: true }).count(), 0)
  await firstWindows.learningPage.getByText('ĐÃ KHÓA', { exact: true }).first().waitFor()
  await capture(firstWindows.learningPage, 'home-base.png')
  if (screenshotDirectory) {
    await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
    const narrowWidths = await firstWindows.learningPage.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(narrowWidths.body, narrowWidths.viewport)
    assert.equal(narrowWidths.document, narrowWidths.viewport)
    await capture(firstWindows.learningPage, 'home-base-390px.png')
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstWindows.learningPage
    .getByRole('button', { name: /PHẦN GIỚI THIỆU.*MỞ BÀI HỌC/ })
    .click()
  await firstWindows.learningPage
    .getByText('BÀI HỌC HIỆN TẠI · BƯỚC 1/9', { exact: true })
    .waitFor()
  await capture(firstWindows.learningPage, 'lesson-progress.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Bắt đầu bằng một vòng chỉ đọc' })
    .click()
  await firstWindows.learningPage
    .getByText('Thực hiện vòng cộng tác chỉ đọc đầu tiên', { exact: true })
    .waitFor()
  await firstLaunch.close()
  firstLaunch = undefined

  resumedLaunch = await launchCourseCompanion()
  const { learningPage, companionPage } = await loadWindows(resumedLaunch)

  await learningPage
    .getByRole('heading', { name: 'Tiếp tục đúng nơi bạn dừng lại' })
    .waitFor()
  await learningPage
    .getByText('Kiểm tra bằng chứng trước khi thay đổi', { exact: true })
    .waitFor()
  await learningPage.getByRole('button', { name: 'Bắt đầu lại' }).click()
  await learningPage
    .getByRole('heading', { name: 'Bắt đầu lại từ đầu?' })
    .waitFor()
  await learningPage.getByRole('button', { name: 'Xóa và bắt đầu lại' }).click()
  await learningPage
    .getByRole('heading', { name: 'Bắt đầu hành trình ContentPilot' })
    .waitFor()
  await learningPage.getByRole('button', { name: 'Bắt đầu và mở Home Base' }).click()
  await learningPage.getByRole('button', { name: 'Mở Hương, giáo viên đồng hành' }).click()
  await learningPage.getByText('HƯƠNG ĐÃ SẴN SÀNG', { exact: true }).waitFor()
  const teacherBounds = await learningPage.locator('.pixel-teacher-overlay').boundingBox()
  assert.ok(teacherBounds)
  assert.ok(teacherBounds.x > 1180 / 2)
  await capture(learningPage, 'teacher-overlay.png')
  await learningPage.locator('.pixel-teacher-overlay').getByRole('button', { name: 'Đóng Hương' }).click()
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
    .getByRole('button', { name: /PHẦN GIỚI THIỆU.*MỞ BÀI HỌC/ })
    .click()
  await learningPage
    .getByRole('button', { name: 'Bắt đầu bằng một vòng chỉ đọc' })
    .click()

  await learningPage.getByRole('button', { name: 'Đúng các tệp nguồn đã đọc' }).click()
  await learningPage.getByRole('button', { name: '30 phút' }).click()
  await learningPage.getByRole('button', { name: 'Duyệt nội dung và thông tin' }).click()
  await learningPage.getByRole('button', { name: 'Tạm dùng thương hiệu mẫu Mộc Học' }).click()
  await learningPage.getByRole('button', { name: 'LinkedIn' }).click()
  await learningPage.getByRole('button', { name: 'Kiểm tra mức sẵn sàng' }).click()
  await learningPage
    .getByRole('button', { name: 'Kết quả đáp ứng dấu hiệu hoàn thành đã định trước' })
    .click()
  await learningPage.getByRole('button', { name: 'Bắt đầu Module 1' }).click()

  await learningPage
    .getByRole('button', { name: 'Kết quả sẽ khó đoán và khó kiểm tra' })
    .click()
  await learningPage.getByRole('button', { name: 'Chọn một yêu cầu' }).click()
  await learningPage
    .getByRole('button', {
      name: 'C · Nút chính rộng 100% ở 390px; chỉ sửa CSS; không tràn ngang'
    })
    .click()
  await learningPage.getByRole('button', { name: 'Sang Codex để thực hành' }).click()
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
    .getByRole('heading', { name: 'Tạo một brief kiểm chứng được trước khi cho Codex thay đổi giao diện.' })
    .waitFor()
  await learningPage
    .locator('.practice-brief-card')
    .getByText('Một thay đổi CSS đúng phạm vi, có bằng chứng ở viewport 390px và không gây tràn ngang.', { exact: true })
    .waitFor()
  await capture(learningPage, 'practice-brief.png')
  await learningPage.getByRole('button', { name: 'Bắt đầu Practice mới' }).click()

  const minimized = await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected the learning window to minimize into the Teacher companion'
  )
  assert.equal(companionWindow(minimized)?.bounds.width, 72)
  assert.equal(companionWindow(minimized)?.bounds.height, 72)
  await capture(companionPage, 'practice-bubble-first-start.png')
  assert.equal(await companionPage.getByRole('button', { name: 'Mở Hương, giáo viên đồng hành' }).count(), 1)
  assert.equal(await companionPage.locator('.pixel-teacher-panel').count(), 0)
  assert.equal(await companionPage.locator('.pixel-companion-surface--compact').count(), 1)


  await companionPage
    .getByRole('button', { name: 'Mở Hương, giáo viên đồng hành' })
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
  await learningPage.getByRole('button', { name: 'Thu nhỏ Hương thành bong bóng' }).click()
  const minimizedFromFull = await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected full Teacher minimize to return directly to the bubble'
  )
  assert.equal(companionWindow(minimizedFromFull)?.bounds.width, 72)
  assert.equal(companionWindow(minimizedFromFull)?.bounds.height, 72)
  assert.equal(companionWindow(minimizedFromFull)?.alwaysOnTop, true)
  await companionPage.getByRole('button', { name: 'Mở Hương, giáo viên đồng hành' }).dblclick()
  await learningPage.locator('.pixel-teacher-overlay.is-practice-full').waitFor()
  await learningPage.locator('.pixel-teacher-overlay.is-practice-full').getByRole('button', { name: 'Đóng Hương' }).click()
  await learningPage.getByRole('button', { name: 'Sang Codex để thực hành' }).click()
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
  assert.equal(await companionPage.getByRole('button', { name: 'Mở Hương, giáo viên đồng hành' }).count(), 1)
  assert.equal(await companionPage.locator('.pixel-teacher-panel').count(), 0)
  assert.equal(await companionPage.locator('.pixel-companion-surface--compact').count(), 1)
  await companionPage
    .getByRole('button', { name: 'Mở Hương, giáo viên đồng hành' })
    .click()
  const expanded = await waitForSnapshot(
    resumedLaunch,
    (windows) => companionWindow(windows)?.bounds.width === 380,
    'Expected the Teacher companion to expand'
  )
  assert.equal(companionWindow(expanded)?.bounds.height, 520)

  await appendFile(
    join(practiceWorkspace.starterRoot, 'app', 'globals.css'),
    '\n/* Developer-only Electron smoke evidence. */\n'
  )
  await companionPage
    .getByText('HƯƠNG ĐÃ SẴN SÀNG', { exact: true })
    .waitFor()
  const composer = companionPage.getByRole('textbox', { name: 'Nhắn cho Hương' })
  assert.equal(
    await composer.evaluate((element) => element === element.ownerDocument.activeElement),
    true
  )
  await composer.fill('Tôi cần kiểm tra gì trước khi duyệt?')
  await composer.press('Enter')
  await companionPage.getByText('CHƯA GỬI', { exact: true }).waitFor()
  await companionPage.getByText('TEACHER · SẴN SÀNG', { exact: true }).waitFor()
  await companionPage.getByText(/Hương tạm thời chưa thể phản hồi/).waitFor()
  await capture(companionPage, 'teacher-error-recovery.png')
  await companionPage.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await companionPage.getByText('LIVE', { exact: true }).waitFor()
  assert.equal(await companionPage.getByText('Tôi cần kiểm tra gì trước khi duyệt?', { exact: true }).count(), 1)
  await companionPage
    .getByText(/Executor báo đã thay đổi: starters\/contentpilot\/app\/globals\.css/)
    .waitFor()
  await companionPage.getByText(/Workspace xác nhận tệp đang thay đổi: starters\/contentpilot\/app\/globals\.css/).waitFor()
  await companionPage.getByText(/chưa được Course Companion chạy lại/).waitFor()
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
  await companionPage.getByText('Mở Executor chat riêng cho Practice', { exact: true }).waitFor()
  await companionPage.getByText('DEV · BẰNG CHỨNG MÔ PHỎNG', { exact: true }).click()

  const fixtureScenarios = [
    ['Bắt đầu', 'ĐANG THỰC HIỆN · MÔ PHỎNG'],
    ['Cần phê duyệt', 'CẦN PHÊ DUYỆT · MÔ PHỎNG'],
    ['Bằng chứng cũ', 'BẰNG CHỨNG CŨ · MÔ PHỎNG'],
    ['Mất kết nối', 'MẤT KẾT NỐI · MÔ PHỎNG'],
    ['Lỗi', 'LƯỢT CHẠY LỖI · MÔ PHỎNG'],
    ['Hoàn thành', 'ĐÃ HOÀN THÀNH · MÔ PHỎNG']
  ]
  for (const [buttonName, statusText] of fixtureScenarios) {
    await companionPage.getByRole('button', { name: buttonName, exact: true }).click()
    await companionPage.getByText(statusText, { exact: true }).waitFor()
  }
  await companionPage.getByText('Không phát hiện', { exact: true }).waitFor()
  await companionPage.getByText('BẰNG CHỨNG MỚI · MÔ PHỎNG', { exact: true }).waitFor()
  await capture(companionPage, 'teacher-compact-progress.png')

  const reviewProgressButton = companionPage.getByRole('button', {
    name: 'Yêu cầu Hương duyệt tiến độ'
  })
  await reviewProgressButton.waitFor()
  assert.equal(await reviewProgressButton.getAttribute('title'), 'Yêu cầu Hương duyệt tiến độ')
  await reviewProgressButton.click()
  const returnToCourseButton = companionPage.getByRole('button', { name: 'Quay lại khóa học', exact: true })
  await returnToCourseButton.waitFor()
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

  await companionPage.getByRole('tab', { name: 'TEACHER' }).click()
  const compactDraft = 'Bản nháp từ cửa sổ thu gọn'
  await composer.fill(compactDraft)
  await companionPage.getByRole('button', { name: 'Mở Hương toàn màn hình' }).click()

  await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected the explicit expand control to open the full Teacher workspace'
  )
  await learningPage.locator('.pixel-teacher-overlay.is-practice-full').waitFor()
  const fullTeacher = learningPage.locator('.pixel-teacher-overlay.is-practice-full')
  const fullComposer = fullTeacher.getByRole('textbox', { name: 'Nhắn cho Hương' })
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

  await learningPage.getByRole('tab', { name: 'TIẾN ĐỘ' }).click()
  await learningPage.getByText('Mở Executor chat riêng cho Practice', { exact: true }).waitFor()
  await learningPage.getByRole('button', { name: 'Thu nhỏ Hương thành bong bóng' }).click()
  const minimizedAgain = await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected full Teacher to minimize directly to the bubble'
  )
  assert.equal(companionWindow(minimizedAgain)?.bounds.width, 72)
  assert.equal(companionWindow(minimizedAgain)?.bounds.height, 72)
  assert.equal(companionWindow(minimizedAgain)?.alwaysOnTop, true)
  await companionPage.getByRole('button', { name: 'Mở Hương, giáo viên đồng hành' }).click()
  await waitForSnapshot(
    resumedLaunch,
    (windows) => companionWindow(windows)?.bounds.width === 380,
    'Expected the Teacher companion to reopen for reverse draft synchronization'
  )
  assert.equal(
    await companionPage.getByRole('textbox', { name: 'Nhắn cho Hương' }).inputValue(),
    'Bản nháp được sửa ở toàn màn hình'
  )
  await companionPage.getByRole('button', { name: 'Thu nhỏ Hương', exact: true }).click()
  await waitForSnapshot(resumedLaunch, (windows) => companionWindow(windows)?.bounds.width === 72, 'Expected Teacher to return to bubble')
  await companionPage.getByRole('button', { name: 'Mở Hương, giáo viên đồng hành' }).dblclick()
  await learningPage.locator('.pixel-teacher-overlay.is-practice-full').waitFor()
  const passedPracticeTeacher = learningPage.locator('.pixel-teacher-overlay.is-practice-full')
  await passedPracticeTeacher.getByRole('tab', { name: 'TIẾN ĐỘ' }).click()
  const fullReturnButton = passedPracticeTeacher.getByRole('button', { name: 'Quay lại khóa học', exact: true })
  await fullReturnButton.waitFor()
  await capture(learningPage, 'practice-review-passed-full.png')
  await fullReturnButton.click()
  await learningPage.evaluate(() => globalThis.courseCompanion?.returnPassedPractice())

  await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected returning from a passed Practice to reveal the destination lesson'
  )

  await learningPage.getByText('Đọc bằng chứng trước khi kết luận', { exact: true }).waitFor()
  assert.equal(
    await learningPage.getByText('Không thể tải tiến trình cục bộ.', { exact: true }).count(),
    0
  )
  await capture(learningPage, 'practice-reflection.png')
  await learningPage
    .getByRole('button', { name: 'Bằng chứng mới và khớp đúng tiêu chí' })
    .click()
  await learningPage
    .getByText('Khép vòng yêu cầu → hành động → bằng chứng', { exact: true })
    .waitFor()
  await learningPage.getByRole('button', { name: 'Hoàn thành Module 1' }).click()
  await learningPage.getByText('Module 1 đã hoàn thành', { exact: true }).waitFor()
  await capture(learningPage, 'module-1-complete.png')
  await learningPage.getByRole('button', { name: 'Về Home Base', exact: true }).click()
  await learningPage.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()

  const firstPracticeRun = await companionPage.evaluate(() => globalThis.courseCompanion?.loadPracticeWorkspace())
  const secondPracticeRun = await companionPage.evaluate(() => globalThis.courseCompanion?.startPractice({ transfer: false }))
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
    .getByRole('button', { name: 'Mở Hương, giáo viên đồng hành' })
    .click()
  await companionPage.getByRole('button', { name: 'Thoát ứng dụng' }).click()
  await resumedLaunch.waitForEvent('close')
  resumedLaunch = undefined

  const persisted = JSON.parse(
    await readFile(join(userDataDirectory, 'learner-state.json'), 'utf8')
  )
  assert.equal(persisted.sceneId, 'module-1-complete')
  assert.equal(persisted.checkpointId, 'm1-complete')
  assert.equal(persisted.decisions.timeBudget, '30')
  assert.equal(persisted.decisions.evidenceReview, 'current-and-matches')
  assert.equal(persisted.practice.status, 'completed')
  assert.equal(persisted.practice.latestEvent.source, 'fixture')

  const persistedChat = (await readFile(join(userDataDirectory, 'teacher-chat.jsonl'), 'utf8'))
    .trim()
    .split('\n')
    .map((line) => JSON.parse(line))
  assert.equal(persistedChat.length, 6)
  assert.equal(persistedChat[0].deliveryStatus, 'pending')
  assert.equal(persistedChat[1].deliveryStatus, 'failed')
  assert.equal(persistedChat[2].deliveryStatus, 'pending')
  assert.equal(persistedChat[3].deliveryStatus, 'delivered')
  assert.equal(new Set(persistedChat.slice(0, 4).map((message) => message.id)).size, 1)
  assert.equal(persistedChat[4].source, 'live')
  assert.equal(persistedChat[5].role, 'teacher')
  assert.equal(persistedChat[5].source, 'live')
  assert.equal(typeof persistedChat[5].practiceRunId, 'string')

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
  const restoredTeacherTab = historyWindows.companionPage.getByRole('tab', { name: 'TEACHER' })
  await restoredTeacherTab.waitFor()
  assert.equal(await restoredTeacherTab.getAttribute('aria-selected'), 'true')
  assert.equal(
    await historyWindows.companionPage.getByText('Tôi cần kiểm tra gì trước khi duyệt?', { exact: true }).count(),
    0
  )
  assert.equal(
    await historyWindows.companionPage.getByText(/Executor báo đã thay đổi: starters\/contentpilot\/app\/globals\.css/).count(),
    0
  )
  await historyWindows.companionPage.getByRole('tab', { name: 'TIẾN ĐỘ' }).click()
  await historyWindows.companionPage.getByText('DEV · BẰNG CHỨNG MÔ PHỎNG', { exact: true }).click()
  await historyWindows.companionPage
    .getByText('ĐÃ HOÀN THÀNH · MÔ PHỎNG', { exact: true })
    .waitFor()
  await historyWindows.companionPage.getByRole('button', { name: 'Thoát ứng dụng' }).click()
  await chatHistoryLaunch.waitForEvent('close')
  chatHistoryLaunch = undefined
  assert.equal(
    await fingerprintTree(practiceWorkspace.canonicalStarter),
    canonicalStarterFingerprint
  )

  console.log(
    'Electron smoke: roadmap-first Home Base, Practice start/resume/switch dialog, fresh per-run Teacher sessions, compact and full Teacher surfaces, settings, all practice fixtures, evidence reflection, Module 1 completion, fixture chat, focus, relaunch persistence, security, and companion lifecycle passed'
  )
} finally {
  await firstLaunch?.close().catch(() => undefined)
  await resumedLaunch?.close().catch(() => undefined)
  await chatHistoryLaunch?.close().catch(() => undefined)
  await rm(userDataDirectory, { recursive: true, force: true })
  await practiceWorkspace.cleanup()
}
