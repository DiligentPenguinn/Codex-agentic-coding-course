import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { resolve, join } from 'node:path'
import { _electron as electron } from 'playwright-core'
import { createDisposablePracticeWorkspace } from './support/disposable-practice-workspace.mjs'
import { verifyOutlineNavigation } from './support/outline-navigation.mjs'

const require = createRequire(import.meta.url)
const cwd = process.cwd()
const workspace = await createDisposablePracticeWorkspace({ repositoryRoot: resolve(cwd, '..') })
const userData = await mkdtemp(join(tmpdir(), 'publication-content-review-'))
const output = resolve(cwd, '../tmp/publication-content-2026-09-14')
await mkdir(output, { recursive: true })
const quiz = JSON.parse(await readFile(resolve(cwd, '../pilot-workspace/course/quizzes/module-4.quiz.json'), 'utf8'))
const measurements = []
const visited = []
let app
try {
  app = await electron.launch({
    executablePath: require('electron'), args: [join(cwd, 'out/main/index.js')],
    env: { ...process.env, COURSE_COMPANION_USER_DATA_DIR: userData,
      COURSE_COMPANION_WORKSPACE_ROOT: workspace.root,
      COURSE_COMPANION_FAKE_CODEX: '1', COURSE_COMPANION_FAKE_CONFIGURATION_READY: '1' }
  })
  const page = app.windows().find((candidate) => candidate.url().includes('#/learning'))
    ?? await app.waitForEvent('window', { predicate: (candidate) => candidate.url().includes('#/learning') })
  page.setDefaultTimeout(10000)
  const wait = (id) => page.locator(`main[data-scene-id="${id}"]`).waitFor()
  const next = () => page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByRole('button', { name: 'Cùng bắt đầu nhé' }).click()
  await page.locator('.pixel-brand').click()
  await page.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  const statePath = join(userData, 'learner-state.json')
  const before = await readFile(statePath, 'utf8')

  const inspect = async (id) => {
    visited.push(id)
    for (const viewport of [{ width: 1440, height: 900 }, { width: 1180, height: 748 }]) {
      await page.setViewportSize(viewport)
      await page.evaluate(async () => {
        await globalThis.document.fonts.ready
        await Promise.all([...globalThis.document.images].map((img) => img.decode().catch(() => {})))
        globalThis.document.querySelector('.pixel-learning-shell')?.scrollTo(0, 0)
      })
      const layout = await page.evaluate(() => {
        const rect = (selector) => globalThis.document.querySelector(selector)?.getBoundingClientRect().toJSON() ?? null
        return { viewport: { width: globalThis.innerWidth, height: globalThis.innerHeight }, width: globalThis.document.documentElement.scrollWidth,
          hud: rect('.pixel-hud'), title: rect('.pixel-scene-title'), visual: rect('.pixel-lesson-visual'),
          dialogue: rect('.pixel-dialogue'), copy: rect('.pixel-dialogue > p'), actions: rect('.pixel-lesson-actions'),
          markers: [...globalThis.document.querySelectorAll('.pixel-lesson-visual .pixel-publication-marker')].map((el) => el.getAttribute('aria-label')),
          imageLoaded: [...globalThis.document.querySelectorAll('.pixel-lesson-visual img')].every((img) => img.naturalWidth > 0) }
      })
      assert.ok(layout.width <= viewport.width, `${id}: horizontal overflow`)
      assert.ok(layout.imageLoaded, `${id}: image failed to load`)
      assert.ok(layout.dialogue && layout.copy && layout.actions, `${id}: missing instructional content`)
      assert.ok(layout.copy.bottom <= layout.actions.y, `${id}: copy overlaps navigation ${JSON.stringify(layout)}`)
      assert.ok(layout.copy.y >= layout.dialogue.y && layout.copy.bottom <= layout.dialogue.bottom, `${id}: clipped copy`)
      assert.ok(layout.hud.bottom < layout.dialogue.y, `${id}: HUD overlaps dialogue ${JSON.stringify(layout)}`)
      if (layout.visual) assert.ok(layout.dialogue.bottom <= viewport.height, `${id}: visual page navigation below viewport`)
      if (layout.visual) assert.ok(layout.visual.bottom + 8 <= layout.dialogue.y, `${id}: image overlaps dialogue ${JSON.stringify(layout)}`)
      if (layout.title) assert.ok(layout.title.bottom + 8 <= layout.dialogue.y, `${id}: title overlaps dialogue ${JSON.stringify(layout)}`)
      measurements.push({ id, ...layout })
      if (layout.markers.length || /github-create|github-preflight|hosting-intro|security-intro|update-workflow|rollback-resume|portfolio-mastery/.test(id)) {
        await page.screenshot({ path: join(output, `${id}-${viewport.width}.png`) })
      }
      if (layout.markers.length) {
        await page.getByRole('button', { name: 'Phóng to ảnh minh họa', exact: true }).click()
        const modal = page.getByRole('dialog', { name: 'Ảnh minh họa phóng to' })
        assert.equal(await modal.locator('.pixel-publication-marker').count(), layout.markers.length)
        assert.match(await modal.locator('.pixel-publication-caption').textContent(), /14\/09\/2026/)
        const imageBounds = await modal.locator('.pixel-publication-image').boundingBox()
        assert.ok(imageBounds.y >= 0 && imageBounds.y + imageBounds.height <= viewport.height, `${id}: enlarged image clipped`)
        await page.locator('.pixel-visual-lightbox').evaluate(async (element) => { await Promise.all(element.getAnimations({ subtree: true }).map((animation) => animation.finished)) })
        await page.screenshot({ path: join(output, `${id}-expanded-${viewport.width}.png`) })
        await page.getByRole('button', { name: 'Đóng ảnh phóng to', exact: true }).press('Escape')
      }
    }
  }

  await page.getByRole('button', { name: 'Duyệt nội dung Module 3', exact: true }).click()
  await verifyOutlineNavigation(page, 'module-3', statePath)
  await page.locator('.pixel-outline summary').click()
  await page.locator('.pixel-outline').getByRole('button', { name: /Thực hành đưa repo lên GitHub/ }).click()
  for (const id of ['github-publish', 'github-preflight', 'github-create', 'github-push-practice', 'github-verify']) {
    await wait(`module-3-${id}`)
    await inspect(`module-3-${id}`)
    await next()
  }
  await wait('module-3-pre-practice-summary')
  await page.locator('.pixel-outline summary').click()
  await page.locator('.pixel-outline').getByRole('button', { name: /Kiểm tra cuối Module 3/ }).click()
  await wait('module-3-portfolio-mastery')
  await inspect('module-3-portfolio-mastery')
  assert.match(await page.locator('.pixel-dialogue > p').textContent(), /Trước bài tổng kết, hãy mở repo GitHub thật/)
  await page.locator('.pixel-brand').click()
  await page.getByRole('button', { name: 'Duyệt nội dung Module 4', exact: true }).click()
  await verifyOutlineNavigation(page, 'module-4', statePath)

  for (let count = 0; count < 65; count++) {
    const id = await page.locator('main[data-scene-id]').getAttribute('data-scene-id')
    if (id === 'module-4-mastery-summary') break
    const group = quiz.groups.find((g) => g.questions.some((q) => q.sceneId === id))
    if (group) {
      assert.equal(await page.locator('.pixel-assessment-question').count(), group.questions.length)
      for (const question of group.questions) {
        const card = page.locator('.pixel-assessment-question').filter({ hasText: question.prompt })
        if (question.type === 'multiple-choice') {
          await card.getByRole('button', { name: question.choices[question.answerIndex], exact: true }).click()
        } else {
          await card.getByRole('textbox', { name: 'Câu trả lời của bạn' }).fill('Dữ liệu kiểm thử giao diện trong workspace dùng một lần; không phải bằng chứng triển khai hoặc câu trả lời của người học.')
        }
      }
      await page.getByRole('button', { name: `Nộp ${group.questions.length} câu trả lời`, exact: true }).click()
      for (const question of group.questions.filter((q) => q.type !== 'multiple-choice')) {
        await page.locator('.pixel-assessment-question').filter({ hasText: question.prompt })
          .getByRole('button', { name: 'Câu trả lời đáp ứng đủ tiêu chí', exact: true }).click()
      }
      await page.getByRole('button', { name: group.mode === 'mastery' ? `Xem kết quả ${group.questions.length} câu` : 'Tiếp tục bài học', exact: true }).click()
    } else {
      await inspect(id)
      await next()
    }
  }
  await wait('module-4-mastery-summary')
  await page.getByText('Bạn đã trả lời 8/8 câu', { exact: false }).waitFor()
  await page.getByRole('button', { name: 'Kết thúc duyệt nội dung', exact: true }).click()
  await page.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  assert.equal(await readFile(statePath, 'utf8'), before)
  await writeFile(join(output, 'measurements.json'), JSON.stringify(measurements, null, 2))
  console.log(JSON.stringify({ result: 'passed', instructionalPages: visited.length,
    desktopCases: measurements.length, assessments: '5 formative + 8 final', savedProgress: 'unchanged', output }))
} catch (error) {
  const page = app?.windows().find((candidate) => candidate.url().includes('#/learning'))
  if (page) {
    await page.screenshot({ path: join(output, 'failure.png') }).catch(() => {})
    await writeFile(join(output, 'failure-dom.txt'), await page.locator('body').innerText()).catch(() => {})
  }
  throw error
} finally {
  await app?.close()
  await workspace.cleanup()
  await rm(userData, { recursive: true, force: true })
}
