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
const output = await mkdtemp(join(tmpdir(), 'publication-content-evidence-'))
await mkdir(output, { recursive: true })
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
      if (id === 'module-4-vercel-benefits') {
        const video = page.locator('video')
        await video.waitFor({ state: 'visible' })
        await page.waitForFunction(() => {
          const video = globalThis.document.querySelector('video')
          return video && video.readyState >= 1 && video.videoWidth > 0
        })
        measurements.push({ id, ...layout, videoLoaded: true })
        await page.screenshot({ path: join(output, `${id}-${viewport.width}.png`) })
        continue
      }
      assert.ok(layout.dialogue && layout.copy && layout.actions, `${id}: missing instructional content`)
      assert.ok(layout.copy.bottom <= layout.actions.y, `${id}: copy overlaps navigation ${JSON.stringify(layout)}`)
      assert.ok(layout.copy.y >= layout.dialogue.y && layout.copy.bottom <= layout.dialogue.bottom, `${id}: clipped copy`)
      assert.ok(layout.hud.bottom < layout.dialogue.y, `${id}: HUD overlaps dialogue ${JSON.stringify(layout)}`)
      // Long lesson pages intentionally scroll; verify the next action is reachable.
      await page.getByRole('button', { name: 'Tiếp tục', exact: true }).or(page.getByRole('button', { name: 'Bắt đầu ôn tập', exact: true })).or(page.getByRole('button', { name: 'Về trang đang học', exact: true })).or(page.getByRole('button', { name: '← Trang trước', exact: true })).first().scrollIntoViewIfNeeded()
      if (layout.visual) assert.ok(layout.visual.bottom + 8 <= layout.dialogue.y, `${id}: image overlaps dialogue ${JSON.stringify(layout)}`)
      if (layout.title) assert.ok(layout.title.bottom + 8 <= layout.dialogue.y, `${id}: title overlaps dialogue ${JSON.stringify(layout)}`)
      measurements.push({ id, ...layout })
      await page.screenshot({ path: join(output, `${id}-${viewport.width}.png`) })
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
  for (let count = 0; count < 30; count++) {
    const id = await page.locator('main[data-scene-id]').getAttribute('data-scene-id')
    if (id === 'module-3-pre-practice-summary') break
    await inspect(id)
    await next()
  }
  await wait('module-3-pre-practice-summary')
  await page.locator('.pixel-outline summary').click()
  await page.locator('.pixel-outline').getByRole('button', { name: /Kiểm tra cuối Module 3/ }).click()
  await wait('module-3-portfolio-mastery')
  await inspect('module-3-portfolio-mastery')
  assert.match(await page.locator('.pixel-dialogue > p').textContent(), /Trước khi kết thúc bài học, bạn hãy nhờ agent publish repo của bạn lên github/)
  await page.locator('.pixel-brand').click()
  await page.getByRole('button', { name: 'Duyệt nội dung Module 4', exact: true }).click()
  await verifyOutlineNavigation(page, 'module-4', statePath)

  const moduleFourPages = [
    'module-4-hosting-intro', 'module-4-vercel-benefits',
    'module-4-after-video', 'module-4-vercel-preview',
    'module-4-portfolio-practice', 'module-4-complete'
  ]
  for (const [index, id] of moduleFourPages.entries()) {
    await wait(id)
    await inspect(id)
    assert.equal(await page.locator('.pixel-assessment-question').count(), 0)
    assert.equal(await page.getByRole('button', { name: /Bỏ qua Practice.*ôn tập/ }).count(), 0)
    if (id === 'module-4-portfolio-practice') {
      assert.match(await page.locator('.pixel-dialogue > p').textContent(), /portfolio mở được bằng đường link/)
      assert.equal(await page.getByRole('button', { name: 'Tiếp tục', exact: true }).count(), 0)
      // Normal reading ends at Practice. The existing status page remains
      // reachable through outline review without recording completion.
      await page.locator('.pixel-outline summary').click()
      await page.locator('.pixel-outline').getByRole('button', { name: /Practice: Phát hành portfolio/ }).click()
    }
    if (index < moduleFourPages.length - 1) await next()
  }
  await page.locator('.pixel-brand').click()
  await page.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  assert.equal(await readFile(statePath, 'utf8'), before)
  await writeFile(join(output, 'measurements.json'), JSON.stringify(measurements, null, 2))
  console.log(JSON.stringify({ result: 'passed', instructionalPages: visited.length,
    desktopCases: measurements.length, moduleFourAssessments: 'none', savedProgress: 'unchanged', output }))
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
