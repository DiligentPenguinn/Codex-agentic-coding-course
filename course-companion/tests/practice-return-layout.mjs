import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve, sep } from 'node:path'
import { pathToFileURL } from 'node:url'
import { createRequire } from 'node:module'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import ts from 'typescript'
import electronExecutable from 'electron'
import { _electron as electron } from 'playwright-core'

// Render the real component in isolation; this checks layout, not a live return.
const require = createRequire(import.meta.url)
function loadComponent(source, dependencies = {}) {
  const { outputText } = ts.transpileModule(source, { compilerOptions: {
    module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX
  } })
  const exports = {}
  new Function('require', 'exports', outputText)((id) => dependencies[id] ?? require(id), exports)
  return exports
}
const anchors = loadComponent(await readFile('src/renderer/src/components/practice-guide-anchors.ts', 'utf8'))
const { PracticeReturnAction } = loadComponent(await readFile('src/renderer/src/components/PracticeReturnAction.tsx', 'utf8'), {
  './practice-guide-anchors': anchors
})
const states = [['idle', false, false], ['disabled', false, true], ['busy', true, false]]
const markup = states.map(([id, busy, disabled]) => `<section id="${id}" class="practice-review-result is-passed">${
  renderToStaticMarkup(createElement(PracticeReturnAction, { busy, disabled, onReturn: () => {} }))
}<div class="pixel-panel-controls">${renderToStaticMarkup(createElement(PracticeReturnAction, {
  busy, disabled, quick: true, onReturn: () => {}
}))}</div></section>`).join('')
const root = await mkdtemp(join(tmpdir(), 'practice-return-layout-'))
const screenshots = resolve('../.superpowers/sdd/screenshots/practice-polish')
const main = join(root, 'main.cjs')
await writeFile(main, `const {app, BrowserWindow}=require('electron'); app.whenReady().then(() => {
  const window = new BrowserWindow({show:false, width:600, height:800, webPreferences:{contextIsolation:true, sandbox:true}});
  window.loadURL('about:blank');
});`)
await mkdir(screenshots, { recursive: true })
let app
try {
  app = await electron.launch({ executablePath: electronExecutable, args: [main] })
  const page = await app.firstWindow()
  const assets = resolve('out/renderer/assets')
  const stylesheet = (await readdir(assets)).find((name) => name.endsWith('.css'))
  assert.ok(stylesheet, 'Run the production build before this layout check')
  const fixture = join(root, 'return.html')
  await writeFile(fixture, `<meta charset="utf-8"><link rel="stylesheet" href="${pathToFileURL(join(assets, stylesheet)).href}"><main class="pixel-teacher-panel is-practice-review practice-workflow">${markup}</main>`)
  await page.goto(pathToFileURL(fixture).href)
  await page.addStyleTag({ path: resolve('src/renderer/src/styles.css') })
  await page.evaluate(() => globalThis.document.fonts.ready)
  for (const width of [560, 390, 320]) {
    await page.setViewportSize({ width, height: 800 })
    const layout = await page.evaluate(() => {
      const measure = (id) => {
        const button = globalThis.document.querySelector(`#${id} > button`)
        const bounds = button.getBoundingClientRect()
        const label = button.querySelector('strong')
        const spinner = button.querySelector('.practice-return-action__spinner')
        const visual = button.querySelector('.practice-return-action__visual').getBoundingClientRect()
        const ring = spinner?.getBoundingClientRect()
        return { height: bounds.height, width: bounds.width, color: globalThis.getComputedStyle(label).color,
          labelOverflow: label.scrollWidth > label.clientWidth,
          centered: !ring || Math.abs((ring.left + ring.width / 2) - (visual.left + visual.width / 2)) < 1 }
      }
      return { idle: measure('idle'), busy: measure('busy'), disabled: measure('disabled'),
        overflow: globalThis.document.body.scrollWidth > globalThis.innerWidth || globalThis.document.documentElement.scrollWidth > globalThis.innerWidth }
    })
    assert.equal(layout.overflow, false)
    assert.equal(layout.idle.height, layout.busy.height, `Return must not jump at ${width}px`)
    assert.equal(layout.idle.width, layout.busy.width)
    assert.equal(layout.idle.height, layout.disabled.height)
    assert.equal(layout.busy.color, 'rgb(0, 0, 0)')
    assert.equal(layout.busy.centered, true)
    assert.equal(layout.busy.labelOverflow, false)
    await page.screenshot({ path: join(screenshots, `return-states-${width}.png`) })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(await page.locator('#busy .practice-return-action__spinner').first().evaluate(
    (spinner) => globalThis.getComputedStyle(spinner).animationName), 'none')
  console.log('Practice return layout: real-component idle/disabled/busy, stable bounds at 560/390/320px, dark labels, centered spinner and reduced motion passed')
} finally {
  await app?.close()
  assert.ok(resolve(root).startsWith(resolve(tmpdir()) + sep))
  await rm(root, { recursive: true, force: true })
}
