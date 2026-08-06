import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { _electron as electron } from 'playwright-core'

const electronExecutable = join(
  process.cwd(),
  'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'
)
const mainEntry = join(process.cwd(), 'out/main/index.js')
const userDataDirectory = await mkdtemp(join(tmpdir(), 'course-companion-electron-'))

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
    .getByRole('button', { name: 'Bắt đầu phần giới thiệu' })
    .click()
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
  await learningPage.getByRole('button', { name: 'Bắt đầu phần giới thiệu' }).click()
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
  await learningPage.getByRole('button', { name: 'Thu nhỏ để thực hành' }).click()

  const minimized = await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected the learning window to minimize into the Teacher companion'
  )
  assert.equal(companionWindow(minimized)?.bounds.width, 168)
  assert.equal(companionWindow(minimized)?.bounds.height, 188)

  await companionPage
    .getByRole('button', { name: 'Mở Hương, giáo viên đồng hành' })
    .click()
  const expanded = await waitForSnapshot(
    resumedLaunch,
    (windows) => companionWindow(windows)?.bounds.width === 380,
    'Expected the Teacher companion to expand'
  )
  assert.equal(companionWindow(expanded)?.bounds.height, 520)

  await companionPage
    .getByText('CHƯA KẾT NỐI TEACHER LIVE', { exact: true })
    .waitFor()
  const composer = companionPage.getByRole('textbox', { name: 'Nhắn cho Hương' })
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
      'Bạn đang ở bước duyệt kế hoạch. Hãy kiểm tra bốn điểm: tệp sẽ đổi, thay đổi dự kiến, rủi ro và cách kiểm chứng trước khi chấp thuận.',
      { exact: true }
    )
    .waitFor()

  await companionPage.getByRole('button', { name: 'Mở lại bài học' }).click()
  await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected the learning window to restore and hide the companion'
  )

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
  assert.equal(persisted.sceneId, 'module-1-success')
  assert.equal(persisted.checkpointId, 'm1-plan-approval')
  assert.equal(persisted.decisions.timeBudget, '30')

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
      'Bạn đang ở bước duyệt kế hoạch. Hãy kiểm tra bốn điểm: tệp sẽ đổi, thay đổi dự kiến, rủi ro và cách kiểm chứng trước khi chấp thuận.',
      { exact: true }
    )
    .waitFor()
  await historyWindows.companionPage.getByRole('button', { name: 'Thoát ứng dụng' }).click()
  await chatHistoryLaunch.waitForEvent('close')
  chatHistoryLaunch = undefined

  console.log(
    'Electron smoke: journey resume, reset, persisted Module 1 checkpoint, fixture chat, focus, expanded mode, history relaunch, security, and companion lifecycle passed'
  )
} finally {
  await firstLaunch?.close().catch(() => undefined)
  await resumedLaunch?.close().catch(() => undefined)
  await chatHistoryLaunch?.close().catch(() => undefined)
  await rm(userDataDirectory, { recursive: true, force: true })
}
