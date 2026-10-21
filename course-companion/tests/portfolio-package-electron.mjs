import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import electronExecutable from 'electron'
import { _electron as electron } from 'playwright-core'
import ts from 'typescript'
import { setTimeout as delay } from 'node:timers/promises'
import { createDisposablePracticeWorkspace } from './support/disposable-practice-workspace.mjs'

// A disposable, explicitly simulated rehearsal, not native AI or pilot evidence.
const root = await mkdtemp(join(tmpdir(), 'portfolio-package-electron-'))
const portfolio = join(root, 'portfolio')
const userData = join(root, 'data')
const screenshots = resolve('../.superpowers/sdd/screenshots')
const course = await createDisposablePracticeWorkspace({ repositoryRoot: resolve('..') })
await Promise.all([mkdir(portfolio), mkdir(userData), mkdir(screenshots, { recursive: true })])
const fixtureSource = await readFile('tests/fixtures/portfolio-package-fixture.ts', 'utf8')
const fixtureCode = fixtureSource.slice(fixtureSource.indexOf('export const portfolioPackageDocuments'), fixtureSource.indexOf('export async function writePortfolioPackage'))
const compiled = ts.transpileModule(fixtureCode, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { portfolioPackageDocuments } = await import('data:text/javascript;base64,' + Buffer.from(compiled).toString('base64'))
const buildFixtureSource = await readFile('tests/fixtures/portfolio-build-fixture.ts', 'utf8')
const buildFixtureCode = `const portfolioPackageDocuments = ${JSON.stringify(portfolioPackageDocuments)};\n`
  + buildFixtureSource.slice(buildFixtureSource.indexOf('export const buildDocuments'), buildFixtureSource.indexOf('export async function writeBuildPackage'))
const buildCompiled = ts.transpileModule(buildFixtureCode, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText
const { buildDocuments } = await import('data:text/javascript;base64,' + Buffer.from(buildCompiled).toString('base64'))
let app
let runtimeErrors = ''
async function waitForPracticeState(predicate, description) {
  let state
  for (let attempt = 0; attempt < 60; attempt += 1) {
    state = JSON.parse(await readFile(join(userData, 'practice-runs.json'), 'utf8'))
    if (predicate(state)) return state
    await delay(250)
  }
  assert.fail(description)
}
try {
  app = await electron.launch({ executablePath: electronExecutable, args: [resolve('out/main/index.js')], env: {
    ...process.env, COURSE_COMPANION_USER_DATA_DIR: userData, COURSE_COMPANION_WORKSPACE_ROOT: course.root,
    COURSE_COMPANION_FAKE_CODEX: '1', COURSE_COMPANION_FAKE_CONFIGURATION_READY: '1',
    COURSE_COMPANION_FAKE_RELEASE_EVIDENCE: '1',
    COURSE_COMPANION_TEST_PUBLIC_PORTFOLIO_URL: 'https://disposable-portfolio.vercel.app/',
    COURSE_COMPANION_FAKE_BUILD_EVIDENCE: '1',
    COURSE_COMPANION_TEST_PORTFOLIO_WORKSPACE: portfolio
  } })
  app.process().stderr?.on('data', (chunk) => { runtimeErrors = (runtimeErrors + chunk.toString()).slice(-12000) })
  const page = app.windows().find((window) => window.url().includes('#/learning'))
    ?? await app.waitForEvent('window', { predicate: (window) => window.url().includes('#/learning') })
  await page.waitForLoadState('domcontentloaded')
  await page.evaluate(async () => {
    const api = globalThis.courseCompanion
    await api.saveProgress({ currentLessonId: 'module-1', currentCourseLessonId: 'm1-assessment',
      checkpointId: 'm1-setup-checklist', sceneId: 'module-1-setup-checklist', sceneHistory: [], completedCheckpointIds: [], decisions: {} })
    await api.startPractice({ practiceId: 'm1-codex-safe-setup', practiceVersion: '2.0.0', transfer: false })
    const reviewed = await api.reviewPractice()
    if ('error' in reviewed || reviewed.workspace.review?.status !== 'passed') throw new Error('Simulated Module 1 setup did not pass')
    await api.returnPassedPractice()
    await api.saveProgress({ currentLessonId: 'module-2', currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-planning', sceneId: 'module-2-portfolio-practice', sceneHistory: [],
      completedCheckpointIds: ['m1-setup-checklist', 'm1-complete'], decisions: {} })
    const loaded = await api.loadProgress()
    const request = { courseRunId: loaded.progress.courseRunId }
    await api.choosePortfolioWorkspace(request)
    await api.confirmPortfolioPlanning(request)
  })
  await page.reload()
  await page.getByRole('button', { name: 'Mở Course Companion', exact: true }).click()
  await page.getByRole('button', { name: /MODULE 2.*MỞ BÀI HỌC/ }).click()
  await page.getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true }).click()
  await page.getByRole('button', { name: 'Bắt đầu Practice mới', exact: true }).click()
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/learning'))?.show())
  const submit = page.getByRole('button', { name: 'Duyệt và nộp gói planning', exact: true })
  await submit.waitFor()
  await app.evaluate(({ BrowserWindow }) => {
    const learning = BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/learning'))
    learning?.restore()
    learning?.show()
    learning?.focus()
  })
  await page.bringToFront()
  assert.equal(await submit.isDisabled(), true)
  const missingIssues = await page.evaluate(async () =>
    (await globalThis.courseCompanion.loadPracticeWorkspace()).portfolioPackage.issues)
  await page.evaluate(() => globalThis.courseCompanion.setCompanionMode('expanded'))
  const compact = app.windows().find((window) => window.url().includes('#/companion'))
    ?? await app.waitForEvent('window', { predicate: (window) => window.url().includes('#/companion') })
  await compact.locator('.practice-package-issues').waitFor()
  await compact.evaluate(() => globalThis.document.fonts.ready)
  for (const width of [360, 320]) {
    await compact.setViewportSize({ width, height: 640 })
    assert.equal(await compact.locator('.practice-package-submission details').count(), 0)
    assert.equal(await compact.locator('.practice-package-issues > li').count(), 5)
    assert.equal(await compact.locator('.practice-package-document-icon').count(), 5)
    assert.equal(await compact.locator('.practice-package-issues').evaluate((list) =>
      globalThis.getComputedStyle(list).paddingLeft), '0px')
    assert.equal(await compact.locator('.practice-package-issues strong').first().evaluate((text) =>
      globalThis.getComputedStyle(text).fontSize), '11.5px')
    assert.equal(await compact.getByRole('button', { name: 'Duyệt và nộp gói planning', exact: true }).evaluate((button) =>
      globalThis.getComputedStyle(button).cursor), 'default')
    assert.deepEqual((await compact.locator('.practice-package-issues > li').allTextContents()).sort(), [...missingIssues].sort())
    const overflow = await compact.evaluate(() => ({
      page: globalThis.document.body.scrollWidth > globalThis.innerWidth
        || globalThis.document.documentElement.scrollWidth > globalThis.innerWidth,
      rows: [...globalThis.document.querySelectorAll('.practice-package-issues li')]
        .some((row) => row.scrollWidth > row.clientWidth)
    }))
    assert.deepEqual(overflow, { page: false, rows: false })
    await compact.locator('.pixel-practice').evaluate((element) => { element.scrollTop = element.scrollHeight })
    const taskLink = compact.getByRole('button', { name: 'Mở lại task Codex của Practice này', exact: true })
    assert.equal(await taskLink.evaluate((button) => {
      const bounds = button.getBoundingClientRect()
      return bounds.top >= 0 && bounds.bottom <= globalThis.innerHeight && bounds.height >= 44
    }), true, 'Task navigation stays reachable while Practice details scroll')
    await compact.locator('.pixel-practice').evaluate((element) => { element.scrollTop = 0 })
    await compact.screenshot({ path: join(screenshots, `portfolio-missing-compact-${width}.png`), animations: 'disabled' })
  }
  await page.setViewportSize({ width: 1180, height: 780 })
  const taskBefore = JSON.parse(await readFile(join(userData, 'practice-runs.json'), 'utf8')).activeRun
  await compact.getByRole('button', { name: 'Mở lại task Codex của Practice này', exact: true }).focus()
  await compact.keyboard.press('Enter')
  await compact.locator('.pixel-teacher-launcher').waitFor()
  await compact.setViewportSize({ width: 168, height: 188 })
  const launcher = compact.getByRole('button', { name: 'Mở cửa sổ Triết', exact: true })
  assert.equal(await launcher.innerText(), 'Mở Triết')
  assert.equal(await compact.locator('.pixel-teacher-drag-handle').evaluate((handle) => globalThis.getComputedStyle(handle).getPropertyValue('-webkit-app-region')), 'drag')
  assert.equal(await launcher.evaluate((button) => globalThis.getComputedStyle(button).getPropertyValue('-webkit-app-region')), 'no-drag')
  await compact.locator('.pixel-teacher-drag-handle').dispatchEvent('click')
  assert.equal((await compact.evaluate(() => globalThis.courseCompanion.loadCompanionState())).mode, 'compact')
  // Simulate the OS move event; the portrait uses Electron's native drag region.
  const draggedBounds = await app.evaluate(({ BrowserWindow, screen }) => {
    const window = BrowserWindow.getAllWindows().find((candidate) => candidate.webContents.getURL().includes('#/companion'))
    const area = screen.getDisplayMatching(window.getBounds()).workArea
    const bounds = { ...window.getBounds(), x: area.x + 80, y: area.y + 100 }
    window.emit('will-move', {}, bounds)
    window.setBounds(bounds)
    return window.getBounds()
  })
  await compact.screenshot({ path: join(screenshots, 'teacher-movable-launcher.png'), animations: 'disabled' })
  await launcher.focus()
  await compact.keyboard.press('Enter')
  await compact.setViewportSize({ width: 380, height: 640 })
  await compact.getByRole('button', { name: 'Thu nhỏ Triết', exact: true }).click()
  await launcher.waitFor()
  assert.deepEqual(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/companion')).getBounds()), draggedBounds)
  assert.equal(await app.evaluate(({ BrowserWindow }) =>
    BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/learning')).isVisible()), false)
  await compact.evaluate(() => globalThis.courseCompanion.setCompanionMode('expanded'))
  await compact.getByRole('button', { name: 'Mở Triết toàn màn hình', exact: true }).click()
  const fullTaskLink = page.getByRole('button', { name: 'Mở lại task Codex của Practice này', exact: true })
  await fullTaskLink.waitFor()
  assert.equal(await page.getByRole('button', { name: 'Thu nhỏ Triết thành bong bóng', exact: true }).count(), 0)
  for (let cycle = 0; cycle < 2; cycle += 1) {
    await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/learning')).minimize())
    await compact.locator('.practice-package-heading').waitFor()
    assert.equal(await app.evaluate(({ BrowserWindow }) => {
      const windows = BrowserWindow.getAllWindows()
      return !windows.find((window) => window.webContents.getURL().includes('#/learning')).isVisible()
        && windows.find((window) => window.webContents.getURL().includes('#/companion')).isVisible()
    }), true, 'Native minimize opens the expanded Teacher panel')
    await compact.getByRole('button', { name: 'Mở Triết toàn màn hình', exact: true }).click()
    await fullTaskLink.waitFor()
    assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/learning')).isMinimized()), false)
  }
  await page.screenshot({ path: join(screenshots, 'practice-task-link-desktop.png'), animations: 'disabled' })
  await fullTaskLink.click()
  await compact.locator('.pixel-teacher-launcher').waitFor()
  const taskAfter = JSON.parse(await readFile(join(userData, 'practice-runs.json'), 'utf8')).activeRun
  for (const field of ['runId', 'generation', 'binding', 'reviewStatus', 'packageApproval', 'completion']) {
    assert.deepEqual(taskAfter[field], taskBefore[field], `Reopening the task preserves ${field}`)
  }
  await page.evaluate(() => globalThis.courseCompanion.showFullTeacher())
  await page.getByRole('button', { name: 'Đóng Triết', exact: true }).click()
  await app.evaluate(({ BrowserWindow }) => {
    BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/companion')).hide()
    BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/learning')).minimize()
  })
  assert.equal(await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/companion')).isVisible()), false,
    'Minimizing the course without Teacher open does not open the Teacher panel')
  await app.evaluate(({ BrowserWindow }) => {
    const learning = BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/learning'))
    learning.restore()
    learning.show()
    learning.focus()
  })
  await page.getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true }).click()
  const restart = page.getByRole('button', { name: 'Bắt đầu Practice mới', exact: true })
  const beforeRestart = JSON.parse(await readFile(join(userData, 'practice-runs.json'), 'utf8')).activeRun
  await restart.click()
  const confirmation = page.getByRole('dialog', { name: 'Bắt đầu một Practice mới?', exact: true })
  await confirmation.waitFor()
  assert.equal(await confirmation.getByRole('button').count(), 2)
  assert.equal(await confirmation.getByText('Chuyển ngữ cảnh có chọn lọc').count(), 0)
  assert.equal(await confirmation.getByRole('button', { name: 'Hủy', exact: true }).evaluate((button) => button === globalThis.document.activeElement), true)
  await page.keyboard.press('Shift+Tab')
  assert.equal(await confirmation.getByRole('button', { name: 'Bắt đầu hoàn toàn mới', exact: true }).evaluate((button) => button === globalThis.document.activeElement), true)
  await page.keyboard.press('Escape')
  await confirmation.waitFor({ state: 'hidden' })
  assert.equal(await restart.evaluate((button) => button === globalThis.document.activeElement), true)
  assert.equal(JSON.parse(await readFile(join(userData, 'practice-runs.json'), 'utf8')).activeRun.runId, beforeRestart.runId)
  await restart.click()
  await confirmation.getByRole('button', { name: 'Hủy', exact: true }).click()
  assert.equal(JSON.parse(await readFile(join(userData, 'practice-runs.json'), 'utf8')).activeRun.runId, beforeRestart.runId)
  await restart.click()
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await confirmation.evaluate((dialog) => globalThis.getComputedStyle(dialog).animationName), 'none')
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  for (const width of [1180, 390]) {
    await page.setViewportSize({ width, height: 780 })
    assert.equal(await confirmation.evaluate((dialog) => dialog.scrollWidth > dialog.clientWidth), false)
    await page.screenshot({ path: join(screenshots, `practice-restart-confirm-${width}.png`), animations: 'disabled' })
  }
  await confirmation.getByRole('button', { name: 'Bắt đầu hoàn toàn mới', exact: true }).click()
  await confirmation.waitFor({ state: 'hidden' })
  const restarted = await waitForPracticeState((record) => record.activeRun?.runId !== beforeRestart.runId,
    'Only confirmation creates the replacement Practice')
  assert.notEqual(restarted.activeRun.binding.threadId, beforeRestart.binding.threadId)
  assert.ok(restarted.archivedRuns.some((run) => run.retainedRun?.runId === beforeRestart.runId))
  await app.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/learning')).show())
  await page.setViewportSize({ width: 1180, height: 780 })
  await page.locator('.practice-package-submission').scrollIntoViewIfNeeded()
  await page.screenshot({ path: join(screenshots, 'portfolio-missing-desktop.png'), fullPage: true, animations: 'disabled' })
  for (const [path, content] of Object.entries(portfolioPackageDocuments)) {
    await mkdir(dirname(join(portfolio, path)), { recursive: true })
    await writeFile(join(portfolio, path), content, 'utf8')
  }
  await submit.scrollIntoViewIfNeeded()
  await page.getByRole('button', { name: 'Làm mới bằng chứng', exact: true }).click()
  const approval = page.getByRole('checkbox', { name: 'Tôi đã đọc và duyệt PRD cùng kế hoạch triển khai hiện tại.' })
  await approval.waitFor()
  await page.waitForFunction(() => globalThis.document.querySelector('section[aria-label="Nộp gói planning"] input')?.disabled === false)
  await approval.focus()
  await page.keyboard.press('Space')
  assert.equal(await approval.isChecked(), true)
  assert.equal(await submit.isEnabled(), true)
  for (const [width, height, name] of [[1180, 780, 'portfolio-package-desktop.png'], [390, 844, 'portfolio-package-narrow.png']]) {
    await page.setViewportSize({ width, height })
    assert.equal(await page.locator('.practice-package-issues > li').count(), 5)
    const widths = await page.evaluate(() => ({ body: globalThis.document.body.scrollWidth, document: globalThis.document.documentElement.scrollWidth, viewport: globalThis.innerWidth }))
    assert.equal(widths.body, widths.viewport)
    assert.equal(widths.document, widths.viewport)
    await approval.scrollIntoViewIfNeeded()
    await page.screenshot({ path: join(screenshots, name), fullPage: true, animations: 'disabled', timeout: 10000 })
  }
  await page.setViewportSize({ width: 1180, height: 780 })
  await submit.click()
  const state = await waitForPracticeState((record) => record.activeRun?.reviewStatus === 'passed',
    'The persisted current submission must pass before return')
  const originalTask = state.activeRun.binding.threadId
  assert.equal(Object.keys(state.activeRun.packageApproval.artifactDigests).length, 5)
  for (const width of [1180, 390]) {
    await page.setViewportSize({ width, height: 844 })
    const returnAction = page.getByRole('button', { name: 'Lưu kết quả và quay lại khóa học', exact: true })
    await returnAction.scrollIntoViewIfNeeded()
    const layout = await returnAction.evaluate((button) => {
      const label = button.querySelector('strong')
      return { foreground: globalThis.getComputedStyle(label).color, background: globalThis.getComputedStyle(button).backgroundColor,
        margin: globalThis.getComputedStyle(label).marginTop, fontSize: parseFloat(globalThis.getComputedStyle(label).fontSize),
        overflow: globalThis.document.documentElement.scrollWidth > globalThis.innerWidth }
    })
    assert.equal(layout.foreground, 'rgb(0, 0, 0)')
    assert.equal(layout.background, 'rgb(255, 214, 102)')
    assert.equal(layout.margin, '0px')
    assert.ok(layout.fontSize >= 13)
    assert.equal(layout.overflow, false)
    await page.screenshot({ path: join(screenshots, `practice-return-passed-${width}.png`), animations: 'disabled' })
  }
  await page.setViewportSize({ width: 1180, height: 780 })
  await page.getByRole('button', { name: 'Lưu kết quả và quay lại khóa học', exact: true }).click()
  const archived = await waitForPracticeState((record) => record.activeRun === null, 'Return must archive the passed submission')
  assert.equal(archived.activeRun, null)
  assert.equal(archived.archivedRuns.at(-1).retainedRun.binding.threadId, originalTask)
  const saveMasteryAnswers = () => page.evaluate(async () => {
    const api = globalThis.courseCompanion
    const { progress } = await api.loadProgress()
    await api.saveProgress({ currentLessonId: 'module-2', currentCourseLessonId: 'm2-portfolio-brief', checkpointId: 'm2-portfolio-mastery',
      sceneId: 'module-2-portfolio-mastery-summary', sceneHistory: progress.sceneHistory, completedCheckpointIds: progress.completedCheckpointIds,
      decisions: Object.fromEntries([...['mastery-1', 'mastery-4', 'mastery-5', 'mastery-6'].map((id) => ['assessment:' + id, 'correct:1']),
        ['assessment:mastery-audience-choice', 'correct:self-review:Nhà tuyển dụng cần xem dự án thật trước khi mời tôi phỏng vấn.']]) })
  })
  await saveMasteryAnswers()
  await writeFile(join(portfolio, 'planning/portfolio-brief.md'),
    portfolioPackageDocuments['planning/portfolio-brief.md'] + '\nAdditional learner revision after returning to the course.\n', 'utf8')
  await assert.rejects(page.evaluate(() => globalThis.courseCompanion.completePortfolioPlanningModule()), /package changed/)
  const reopened = await page.evaluate(() => globalThis.courseCompanion.loadPracticeWorkspace({ practiceId: 'm2-portfolio-planning', practiceVersion: '2.0.0' }))
  assert.equal(reopened.activePractice.runId, state.activeRun.runId)
  assert.ok(reopened.activePractice.generation > state.activeRun.generation)
  const revision = JSON.parse(await readFile(join(userData, 'practice-runs.json'), 'utf8'))
  assert.equal(revision.activeRun.binding.threadId, originalTask)
  assert.equal(revision.activeRun.packageApproval, undefined)
  assert.equal(revision.activeRun.completion, undefined)
  const rereviewed = await page.evaluate(async () => {
    const api = globalThis.courseCompanion
    const workspace = await api.loadPracticeWorkspace({ practiceId: 'm2-portfolio-planning', practiceVersion: '2.0.0' })
    const { progress } = await api.loadProgress()
    const active = workspace.activePractice
    await api.approvePortfolioPackage({ runId: active.runId, generation: active.generation,
      practiceId: active.practiceId, practiceVersion: active.practiceVersion, courseRunId: progress.courseRunId,
      sourceDigest: workspace.portfolioPackage.sourceDigest, approvePrd: true, approvePlan: true })
    return api.reviewPractice()
  })
  assert.equal(rereviewed.workspace?.review?.status, 'passed')
  await page.evaluate(() => globalThis.courseCompanion.returnPassedPractice())
  await saveMasteryAnswers()
  const handoff = await page.evaluate(async () => {
    const completed = await globalThis.courseCompanion.completePortfolioPlanningModule()
    return completed.practiceCompletions.at(-1).portfolioPlanningHandoff
  })
  assert.equal(handoff.schemaVersion, 2)
  assert.equal(handoff.artifacts.length, 5)
  assert.equal(handoff.task.threadId, originalTask)
  const moduleThreeOpening = await page.evaluate(() => globalThis.courseCompanion.loadProgress())
  assert.equal(moduleThreeOpening.progress.sceneId, 'module-3-local-preview')
  await page.reload()
  await page.getByRole('button', { name: 'Mở Course Companion', exact: true }).click()
  await page.getByRole('button', { name: /MODULE 3.*MỞ BÀI HỌC/ }).click()
  await page.locator('main[data-scene-id="module-3-local-preview"]').waitFor()
  for (const width of [1180, 390]) {
    await page.setViewportSize({ width, height: 780 })
    assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
    await page.screenshot({ path: join(screenshots, `module-3-local-preview-${width}.png`), animations: 'disabled' })
  }
  await page.setViewportSize({ width: 1180, height: 780 })
  await page.evaluate(() => globalThis.courseCompanion.startPractice({ practiceId: 'm3-portfolio-build', practiceVersion: '2.0.0', transfer: false }))
  const continued = JSON.parse(await readFile(join(userData, 'practice-runs.json'), 'utf8'))
  assert.equal(continued.activeRun.binding.threadId, originalTask)
  for (const [path, content] of Object.entries(buildDocuments)) {
    // Keep the already approved planning documents unchanged in this handoff rehearsal.
    if (path.startsWith('planning/')) continue
    await mkdir(dirname(join(portfolio, path)), { recursive: true })
    await writeFile(join(portfolio, path), content, 'utf8')
  }
  await page.evaluate(async () => {
    const { progress } = await globalThis.courseCompanion.loadProgress()
    await globalThis.courseCompanion.saveProgress({ ...progress, currentLessonId: 'module-3', currentCourseLessonId: 'm3-evidence-debugging', checkpointId: 'm3-portfolio-build', sceneId: 'module-3-portfolio-practice' })
  })
  await page.reload()
  await page.getByRole('button', { name: 'Mở Course Companion', exact: true }).click()
  await page.getByRole('button', { name: /MODULE 3.*MỞ BÀI HỌC/ }).click()
  await page.getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true }).click()
  const buildSubmit = page.getByRole('button', { name: 'Chấp nhận website và nộp bài', exact: true })
  await buildSubmit.waitFor()
  assert.equal(await buildSubmit.isDisabled(), true)
  await page.getByRole('button', { name: 'Làm mới bằng chứng', exact: true }).click()
  await app.evaluate(({ BrowserWindow }) => {
    const learning = BrowserWindow.getAllWindows().find((window) => window.webContents.getURL().includes('#/learning'))
    learning?.restore()
    learning?.show()
    learning?.focus()
  })
  await page.bringToFront()
  for (const width of [1180, 360, 320]) {
    await page.setViewportSize({ width, height: 780 })
    assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
    await page.screenshot({ path: join(screenshots, `module-3-build-v2-${width}.png`), animations: 'disabled' })
  }
  await page.setViewportSize({ width: 1180, height: 780 })
  await page.getByRole('checkbox', { name: 'Tôi đã xem website, đối chiếu kết quả kiểm tra và chấp nhận phiên bản hiện tại.' }).check()
  await buildSubmit.click()
  await page.getByRole('button', { name: 'Lưu kết quả và quay lại khóa học', exact: true }).waitFor()
  const passedBuild = await waitForPracticeState((record) => record.activeRun?.reviewStatus === 'passed', 'Module 3 v2 simulated review must pass')
  assert.equal(passedBuild.activeRun.stageReceipts.length, 0)
  assert.equal(passedBuild.activeRun.buildSliceReceipts.length, 0)
  await page.getByRole('button', { name: 'Lưu kết quả và quay lại khóa học', exact: true }).click()
  await waitForPracticeState((record) => record.activeRun === null, 'Build review must archive with its original task')
  const completedBuild = await page.evaluate(async () => {
    const api = globalThis.courseCompanion
    const { progress } = await api.loadProgress()
    await api.saveProgress({ ...progress, currentLessonId: 'module-3', currentCourseLessonId: 'm3-independent-enhancement', checkpointId: 'm3-mastery', sceneId: 'module-3-mastery-summary',
      decisions: { ...progress.decisions, ...Object.fromEntries(['m3-mastery-plan', 'm3-mastery-visible-error', 'm3-mastery-logs', 'm3-mastery-repeated-error', 'm3-mastery-branch'].map((id) => ['assessment:' + id, 'correct:1'])) } })
    return api.completePortfolioBuildModule()
  })
  assert.equal(completedBuild.sceneId, 'module-3-complete')
  assert.equal(completedBuild.practiceCompletions.at(-1).portfolioBuildHandoff.schemaVersion, 2)
  // The courseapp owner wires its entry page separately. Exercise the public
  // Practice API and actual companion controls without editing that host page.
  const releaseUrl = 'https://disposable-portfolio.vercel.app/'
  const git = (...args) => execFileSync('git', args, { cwd: portfolio, encoding: 'utf8', windowsHide: true }).trim()
  git('init', '-b', 'main')
  await writeFile(join(portfolio, '.gitignore'), 'node_modules/\ndist/\n', 'utf8')
  git('add', '--', '.')
  git('-c', 'user.name=Disposable Practice', '-c', 'user.email=practice@example.invalid', 'commit', '-m', 'Disposable release candidate')
  const releaseRevision = git('rev-parse', 'HEAD')
  await page.evaluate(async () => {
    const api = globalThis.courseCompanion
    const { progress } = await api.loadProgress()
    await api.saveProgress({ ...progress, currentLessonId: 'module-4', currentCourseLessonId: 'm4-ownership-transfer', checkpointId: 'm4-portfolio-release', sceneId: 'module-4-portfolio-practice' })
  })
  await assert.rejects(page.evaluate(async () => {
    const { progress } = await globalThis.courseCompanion.loadProgress()
    return globalThis.courseCompanion.saveProgress({ ...progress, checkpointId: 'm4-complete', sceneId: 'module-4-complete' })
  }), /reviewed Practice/)
  await page.evaluate(() => globalThis.courseCompanion.startPractice({ practiceId: 'm4-portfolio-release', practiceVersion: '1.0.0', transfer: false }))
  const releaseState = await waitForPracticeState((record) => record.activeRun?.practiceId === 'm4-portfolio-release', 'Release must continue the original task')
  assert.equal(releaseState.activeRun.binding.threadId, originalTask)
  const deployedAt = new Date(Date.now() - 1000).toISOString()
  const deploymentRecord = { schemaVersion: 1,
    moduleThreeSourceCheckpoint: completedBuild.practiceCompletions.at(-1).portfolioBuildHandoff.sourceCheckpoint,
    sourceRevision: releaseRevision,
    deployment: { url: releaseUrl, provider: 'vercel', deploymentId: 'disposable-provider-fixture', sourceRevision: releaseRevision, buildStatus: 'ready', deployedAt },
    validation: { checkedAt: new Date().toISOString(), command: 'npm run check', passed: true,
      desktop: { url: releaseUrl, observations: 'Disposable simulated desktop observations: projects and contact links work, images appear and no horizontal overflow.' },
      mobile: { url: releaseUrl, observations: 'Disposable simulated mobile observations: images fit, navigation and contact links work, text stays readable.' }, limitations: ['Provider, commands and online browser results are simulated, not a live learner acceptance run.'] },
    publication: { learnerApproved: true, observedPublicAccess: true } }
  await mkdir(join(portfolio, 'evidence/module-4'), { recursive: true })
  await writeFile(join(portfolio, 'evidence/module-4/deployment-record.json'), JSON.stringify(deploymentRecord), 'utf8')
  const releaseView = await page.evaluate(() => globalThis.courseCompanion.loadPracticeWorkspace({ practiceId: 'm4-portfolio-release', practiceVersion: '1.0.0' }))
  assert.equal(releaseView.portfolioPackage.kind, 'release')
  assert.equal(releaseView.portfolioPackage.ready, true, JSON.stringify(releaseView.portfolioPackage.issues))
  await page.evaluate(() => globalThis.courseCompanion.setCompanionMode('expanded'))
  await compact.reload()
  const onlineApproval = compact.getByRole('checkbox', { name: 'Tôi đã mở đường link khi chưa đăng nhập, kiểm tra trên máy tính và điện thoại, và chấp nhận portfolio hiện tại.' })
  await onlineApproval.waitFor()
  for (const width of [1024, 360, 320]) {
    await compact.setViewportSize({ width, height: 780 })
    assert.equal(await compact.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
    await onlineApproval.scrollIntoViewIfNeeded()
    await compact.screenshot({ path: join(screenshots, `module-4-release-${width}.png`), animations: 'disabled' })
  }
  await compact.setViewportSize({ width: 1024, height: 780 })
  await onlineApproval.check()
  await compact.getByRole('button', { name: 'Chấp nhận portfolio trên mạng và nộp bài', exact: true }).click()
  await compact.getByRole('button', { name: 'Lưu kết quả và quay lại khóa học', exact: true }).waitFor()
  await compact.getByRole('button', { name: 'Lưu kết quả và quay lại khóa học', exact: true }).click()
  const released = await waitForPracticeState((record) => record.activeRun === null, 'Release return must archive the reviewed attempt')
  assert.equal(released.archivedRuns.at(-1).retainedRun.binding.threadId, originalTask)
  const finalReleaseProgress = await page.evaluate(() => globalThis.courseCompanion.loadProgress())
  assert.equal(finalReleaseProgress.progress.sceneId, 'module-4-complete')
  assert.equal(finalReleaseProgress.progress.practiceCompletions.at(-1).practiceId, 'm4-portfolio-release')
  console.log('Module 4 Practice rehearsal: same task, real local Git revision, one record, simulated public URL/review, explicit approval, atomic return and desktop/narrow controls passed; courseapp host wiring remains separate')
  console.log('Module 3 v2 rehearsal: three records, one website approval, simulated content review, original task, archived completion, five mastery answers and desktop/narrow layouts passed')
  console.log('Portfolio rehearsal: explicit approval, five-document simulated review, desktop/narrow no-overflow, archived same-task revision, completion, and same-task Module 3 handoff passed')
} catch (error) {
  console.error(runtimeErrors)
  for (const [index, page] of (app?.windows() ?? []).entries()) {
    console.error(page.url(), await page.locator('body').innerText().catch(() => 'unavailable'))
    await page.screenshot({ path: join(screenshots, `portfolio-package-failure-${index}.png`), timeout: 3000 }).catch(() => {})
  }
  throw error
} finally {
  await app?.close()
  await course.cleanup()
  await rm(root, { recursive: true, force: true })
}
