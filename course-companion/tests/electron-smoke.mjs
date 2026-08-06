import assert from 'node:assert/strict'
import { join } from 'node:path'
import { _electron as electron } from 'playwright-core'

const electronExecutable = join(
  process.cwd(),
  'node_modules/electron/dist/Electron.app/Contents/MacOS/Electron'
)
const mainEntry = join(process.cwd(), 'out/main/index.js')

const electronApp = await electron.launch({
  executablePath: electronExecutable,
  args: [mainEntry]
})

async function windowSnapshot() {
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

async function waitForSnapshot(predicate, message) {
  const deadline = Date.now() + 5_000
  let latest = await windowSnapshot()

  while (Date.now() < deadline) {
    if (predicate(latest)) return latest
    await new Promise((resolve) => setTimeout(resolve, 50))
    latest = await windowSnapshot()
  }

  throw new Error(`${message}\nLatest state: ${JSON.stringify(latest, null, 2)}`)
}

function learningWindow(windows) {
  return windows.find((window) => window.url.includes('#/learning'))
}

function companionWindow(windows) {
  return windows.find((window) => window.url.includes('#/companion'))
}

try {
  const learningPage = await electronApp.firstWindow()
  await learningPage.waitForLoadState('domcontentloaded')

  const companionPage =
    electronApp.windows().find((page) => page.url().includes('#/companion')) ??
    (await electronApp.waitForEvent('window', {
      predicate: (page) => page.url().includes('#/companion')
    }))
  await companionPage.waitForLoadState('domcontentloaded')

  const initial = await waitForSnapshot(
    (windows) =>
      learningWindow(windows)?.visible === true &&
      companionWindow(windows)?.visible === false,
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
    (windows) =>
      learningWindow(windows)?.visible === false &&
      companionWindow(windows)?.visible === true,
    'Expected the learning window to minimize into the Teacher companion'
  )
  assert.equal(companionWindow(minimized)?.bounds.width, 168)
  assert.equal(companionWindow(minimized)?.bounds.height, 188)

  await companionPage
    .getByRole('button', { name: 'Mở Hương, giáo viên đồng hành' })
    .click()
  const expanded = await waitForSnapshot(
    (windows) => companionWindow(windows)?.bounds.width === 344,
    'Expected the Teacher companion to expand'
  )
  assert.equal(companionWindow(expanded)?.bounds.height, 286)

  await companionPage.getByRole('button', { name: 'Mở lại bài học' }).click()
  await waitForSnapshot(
    (windows) =>
      learningWindow(windows)?.visible === true &&
      companionWindow(windows)?.visible === false,
    'Expected the learning window to restore and hide the companion'
  )

  await electronApp.evaluate(({ BrowserWindow }) => {
    const learning = BrowserWindow.getAllWindows().find((window) =>
      window.webContents.getURL().includes('#/learning')
    )
    learning?.close()
  })
  await waitForSnapshot(
    (windows) =>
      learningWindow(windows)?.visible === false &&
      companionWindow(windows)?.visible === true,
    'Expected the native close control to preserve the companion'
  )

  await companionPage
    .getByRole('button', { name: 'Mở Hương, giáo viên đồng hành' })
    .click()
  await companionPage.getByRole('button', { name: 'Thoát ứng dụng' }).click()
  await electronApp.waitForEvent('close')

  console.log('Electron smoke: launch, security, minimize, expand, restore, close, and quit passed')
} finally {
  await electronApp.close().catch(() => undefined)
}
