import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import electronExecutable from 'electron'
import { _electron as electron } from 'playwright-core'

// Live mode sends only course sources and this disposable profile's synthetic
// questions to the signed-in Codex service. Never load personal learner data.
const live = process.argv.includes('--live')
const directory = await mkdtemp(join(tmpdir(), 'course-teacher-chat-'))
let app
try {
  app = await electron.launch({ executablePath: electronExecutable, args: [join(process.cwd(), 'out/main/index.js')],
    env: { ...process.env, COURSE_COMPANION_USER_DATA_DIR: directory,
      COURSE_COMPANION_FAKE_CODEX: live ? '0' : '1',
      COURSE_COMPANION_FAKE_TEACHER_LIVE_MODE: '0',
      COURSE_COMPANION_FAKE_TEACHER_FAIL_ONCE: live ? '0' : '1' } })
  let page = app.windows().find((candidate) => candidate.url().includes('#/learning'))
  if (!page) page = await app.waitForEvent('window', { predicate: (candidate) => candidate.url().includes('#/learning') })
  page.setDefaultTimeout(live ? 90_000 : 15_000)
  await page.waitForFunction(() => Boolean(globalThis.courseCompanion))
  await page.evaluate(async () => {
    await globalThis.courseCompanion.saveProgress({ currentLessonId: 'module-2', currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-brief', sceneId: 'module-2-portfolio-workspace', sceneHistory: [],
      completedCheckpointIds: [], decisions: {} })
  })
  await page.reload()
  await page.getByRole('button', { name: 'Mở Course Companion', exact: true }).click()
  await page.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành', exact: true }).click()
  const panel = page.locator('.pixel-teacher-overlay')
  const composer = panel.getByRole('textbox', { name: 'Nhắn cho Triết' })
  const prompt = 'Tại sao cần lập kế hoạch trước khi nhờ coding agent xây portfolio? Giải thích ngắn gọn cho người mới.'
  const before = await page.evaluate(() => globalThis.courseCompanion.loadProgress())
  await composer.fill(prompt)
  await composer.press('Enter')
  if (!live) {
    await panel.getByRole('button', { name: 'Thử lại', exact: true }).waitFor()
    await panel.getByRole('button', { name: 'Thử lại', exact: true }).click()
  }
  const answer = panel.locator('.pixel-chat-message.is-teacher').last()
  await answer.waitFor()
  const content = await answer.locator('p').innerText()
  assert.ok(content.trim().length > 20)
  assert.equal(await panel.locator('.pixel-chat-message.is-learner').count(), 1)
  assert.equal(await composer.inputValue(), '')
  assert.deepEqual(await page.evaluate(() => globalThis.courseCompanion.loadProgress()), before)
  await panel.getByRole('button', { name: 'Đóng Triết', exact: true }).click()
  await page.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành', exact: true }).click()
  assert.equal(await panel.locator('.pixel-chat-message.is-teacher p').last().innerText(), content)
  await panel.getByRole('button', { name: 'Đóng Triết', exact: true }).click()
  await page.locator('button.pixel-roadmap-stage.is-current').click()
  await page.getByRole('button', { name: 'HỎI TRIẾT', exact: true }).click()
  assert.equal(await panel.locator('.pixel-chat-message.is-teacher p').last().innerText(), content)
  await page.setViewportSize({ width: 390, height: 844 })
  assert.equal(await page.evaluate(() => globalThis.document.documentElement.scrollWidth > globalThis.innerWidth), false)
  await composer.fill('Một câu hỏi khác\nvới hai dòng')
  await composer.press('Shift+Enter')
  assert.equal(await panel.locator('.pixel-chat-message.is-learner').count(), 1)
  if (process.env.COURSE_COMPANION_SCREENSHOT_DIR) {
    await page.screenshot({ path: join(process.env.COURSE_COMPANION_SCREENSHOT_DIR, `teacher-chat-${live ? 'live' : 'fixture'}-narrow.png`) })
    await page.setViewportSize({ width: 1180, height: 780 })
    await page.screenshot({ path: join(process.env.COURSE_COMPANION_SCREENSHOT_DIR, `teacher-chat-${live ? 'live' : 'fixture'}-desktop.png`) })
  }
  const state = await page.evaluate(() => globalThis.courseCompanion.loadCompanionState())
  assert.equal(state.conversation.messages.at(-1).source, live ? 'live' : 'fixture')
  console.log(JSON.stringify({ mode: live ? 'live' : 'fixture', status: 'passed', answer: content }))
} finally {
  await app?.close()
  // Only this mkdtemp-created test profile is removed.
  await rm(directory, { recursive: true, force: true, maxRetries: 10, retryDelay: 200 })
}
