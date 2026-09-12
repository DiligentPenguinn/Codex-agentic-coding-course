import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import electronExecutable from 'electron'
import { _electron as electron } from 'playwright-core'
import { createDisposablePracticeWorkspace } from './support/disposable-practice-workspace.mjs'

// Disposable simulated Practice: verify guide interactions, never learner acceptance.
const root = await mkdtemp(join(tmpdir(), 'practice-guide-electron-'))
const workspace = await createDisposablePracticeWorkspace({ repositoryRoot: resolve('..') })
const screenshots = resolve('../.superpowers/sdd/screenshots/practice-guide')
await mkdir(screenshots, { recursive: true })
let app
async function screenshot(page, name) {
  assert.equal(await page.evaluate(() => globalThis.document.body.scrollWidth > globalThis.innerWidth
    || globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
  const primary = page.locator('.practice-guide [data-guide-primary]')
  await primary.scrollIntoViewIfNeeded()
  const bounds = await primary.boundingBox()
  assert.ok(bounds && bounds.y >= 0 && bounds.y + bounds.height <= (await page.evaluate(() => globalThis.innerHeight)))
  await page.screenshot({ path: join(screenshots, name), animations: 'disabled' })
}
try {
  app = await electron.launch({ executablePath: electronExecutable, args: [resolve('out/main/index.js')], env: {
    ...process.env, COURSE_COMPANION_USER_DATA_DIR: root, COURSE_COMPANION_WORKSPACE_ROOT: workspace.root,
    COURSE_COMPANION_FAKE_CODEX: '1', COURSE_COMPANION_FAKE_CONFIGURATION_READY: '0'
  } })
  const page = app.windows().find((window) => window.url().includes('#/learning'))
    ?? await app.waitForEvent('window', { predicate: (window) => window.url().includes('#/learning') })
  page.on('pageerror', (error) => console.error('Learning renderer:', error.message))
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(() => globalThis.courseCompanion.saveProgress({ currentLessonId: 'module-1', currentCourseLessonId: 'm1-agents-and-skills',
    checkpointId: 'm1-agents-and-skills', sceneId: 'module-1-skills-intro', sceneHistory: [], completedCheckpointIds: [], decisions: {} }))
  await page.reload()
  await page.getByRole('button', { name: 'Mở Course Companion', exact: true }).click()
  await page.evaluate(async () => {
    await globalThis.courseCompanion.startPractice({ practiceId: 'm1-codex-safe-setup', practiceVersion: '2.0.0', transfer: false })
    await globalThis.courseCompanion.setCompanionMode('expanded')
  })
  const compact = app.windows().find((window) => window.url().includes('#/companion'))
    ?? await app.waitForEvent('window', { predicate: (window) => window.url().includes('#/companion') })
  compact.on('pageerror', (error) => console.error('Compact renderer:', error.message))
  await compact.setViewportSize({ width: 390, height: 640 })
  await compact.getByRole('button', { name: 'Hướng dẫn Practice', exact: true }).click()
  const guide = compact.locator('.practice-guide')
  await guide.getByText('Làm quen với Practice Mode', { exact: true }).waitFor()
  assert.equal(await guide.getAttribute('role'), 'region')
  for (const [width, height] of [[380, 500], [320, 500], [390, 640]]) {
    await compact.setViewportSize({ width, height })
    await screenshot(compact, `guide-compact-${width}x${height}.png`)
  }
  await guide.getByRole('button', { name: 'Bắt đầu hướng dẫn', exact: true }).click()
  await guide.getByText('Task Codex là nơi bạn thực hành', { exact: true }).waitFor()
  await compact.getByRole('button', { name: 'Mở Triết toàn màn hình', exact: true }).click()
  const fullGuide = page.locator('.practice-guide')
  await fullGuide.getByText('Task Codex là nơi bạn thực hành', { exact: true }).waitFor()
  await screenshot(page, 'guide-full-orientation.png')
  await fullGuide.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await fullGuide.getByText('Triết duyệt tiến độ Practice', { exact: true }).waitFor()
  await page.setViewportSize({ width: 390, height: 640 })
  await screenshot(page, 'guide-full-narrow.png')
  await page.locator('[data-practice-guide-anchor="review-progress"]').evaluate((anchor) => { anchor.hidden = true; anchor.style.display = 'none' })
  await page.locator('.practice-guide.is-fallback').waitFor()
  await screenshot(page, 'guide-missing-anchor.png')
  await page.locator('[data-practice-guide-anchor="review-progress"]').evaluate((anchor) => { anchor.hidden = false; anchor.style.removeProperty('display') })
  await fullGuide.getByRole('button', { name: 'Tạm dừng', exact: true }).click()
  await page.getByRole('button', { name: 'Đóng Triết', exact: true }).click()
  await compact.evaluate(() => globalThis.courseCompanion.setCompanionMode('expanded'))
  await compact.getByRole('button', { name: 'Hướng dẫn Practice', exact: true }).click()
  await guide.getByText('Triết duyệt tiến độ Practice', { exact: true }).waitFor()
  await guide.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await guide.getByText('Bằng chứng cập nhật từ đúng task', { exact: true }).waitFor()
  await guide.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await guide.getByText('Cập nhật và duyệt bằng chứng', { exact: true }).waitFor()
  await guide.getByRole('button', { name: 'Cập nhật và kiểm tra ngay', exact: true }).click()
  await guide.locator('.practice-guide-warning').waitFor()
  assert.ok(['not-reviewed', 'needs-work'].includes((await compact.evaluate(() => globalThis.courseCompanion.loadPracticeWorkspace())).review.status))
  await screenshot(compact, 'guide-needs-work.png')
  assert.equal(await guide.getByRole('button', { name: 'Cập nhật và kiểm tra ngay', exact: true }).isEnabled(), true)
  await guide.getByRole('button', { name: 'Bỏ qua hướng dẫn', exact: true }).click()
  await compact.getByRole('button', { name: 'Xem lại hướng dẫn Practice', exact: true }).waitFor()
  const durableBefore = await readFile(join(root, 'practice-guide-state.json'), 'utf8')
  const practiceBefore = await readFile(join(root, 'practice-runs.json'), 'utf8')
  await compact.getByRole('button', { name: 'Xem lại hướng dẫn Practice', exact: true }).click()
  const replayTitles = ['Làm quen với Practice Mode', 'Task Codex là nơi bạn thực hành', 'Triết duyệt tiến độ Practice',
    'Bằng chứng cập nhật từ đúng task', 'Cập nhật và duyệt bằng chứng', 'Quay lại đúng phần tiếp theo', 'Bạn đã xem lại hướng dẫn Practice']
  for (const [index, title] of replayTitles.entries()) {
    await guide.getByText(title, { exact: true }).waitFor()
    if (index === 1) {
      await guide.getByRole('button', { name: 'Tạm dừng', exact: true }).click()
      await compact.getByRole('button', { name: 'Tiếp tục hướng dẫn', exact: true }).click()
      await guide.getByText(title, { exact: true }).waitFor()
    }
    if (index === 5) await screenshot(compact, 'guide-replay-return.png')
    await guide.locator('[data-guide-primary]').click()
  }
  await compact.getByRole('button', { name: 'Xem lại hướng dẫn Practice', exact: true }).waitFor()
  assert.equal(await readFile(join(root, 'practice-guide-state.json'), 'utf8'), durableBefore)
  assert.equal(await readFile(join(root, 'practice-runs.json'), 'utf8'), practiceBefore)
  console.log('Practice guide: compact entry, cross-window resume, full/narrow reachable actions, unsuccessful review recovery, replay pause and complete walkthrough without Practice mutations passed')
} catch (error) {
  for (const [index, page] of (app?.windows() ?? []).entries()) {
    console.error(page.url(), await page.locator('body').innerText().catch(() => 'unavailable'))
    await page.screenshot({ path: join(screenshots, `failure-${index}.png`), timeout: 3000 }).catch(() => {})
  }
  throw error
} finally {
  await app?.close()
  await workspace.cleanup()
  assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep))
  await rm(root, { recursive: true, force: true })
}
