import assert from 'node:assert/strict'
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
let app
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
    COURSE_COMPANION_TEST_PORTFOLIO_WORKSPACE: portfolio
  } })
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
    await page.getByText('Năm tài liệu cần nộp', { exact: true }).click()
    const widths = await page.evaluate(() => ({ body: globalThis.document.body.scrollWidth, document: globalThis.document.documentElement.scrollWidth, viewport: globalThis.innerWidth }))
    assert.equal(widths.body, widths.viewport)
    assert.equal(widths.document, widths.viewport)
    await approval.scrollIntoViewIfNeeded()
    await page.screenshot({ path: join(screenshots, name), fullPage: true, animations: 'disabled', timeout: 10000 })
    await page.getByText('Năm tài liệu cần nộp', { exact: true }).click()
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
  await page.evaluate(() => globalThis.courseCompanion.startPractice({ practiceId: 'm3-portfolio-build', practiceVersion: '1.0.0', transfer: false }))
  const continued = JSON.parse(await readFile(join(userData, 'practice-runs.json'), 'utf8'))
  assert.equal(continued.activeRun.binding.threadId, originalTask)
  console.log('Portfolio rehearsal: explicit approval, five-document simulated review, desktop/narrow no-overflow, archived same-task revision, completion, and same-task Module 3 handoff passed')
} catch (error) {
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
