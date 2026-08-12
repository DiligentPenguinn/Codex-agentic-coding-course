import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, rm } from 'node:fs/promises'
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
const setupQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-1.quiz.json'), 'utf8')
)
const planningQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-2.quiz.json'), 'utf8')
)

function assessmentGroup(groupId) {
  if (groupId === 'setup-final-assessment') {
    return {
      id: groupId,
      mode: 'mastery',
      questions: setupQuiz.questions
    }
  }
  const group = planningQuiz.groups.find((candidate) => candidate.id === groupId)
  assert.ok(group, `Expected assessment group ${groupId}`)
  return group
}

async function answerAssessmentGroup(page, groupId) {
  const group = assessmentGroup(groupId)
  for (const [index, question] of group.questions.entries()) {
    await page.getByText(question.prompt, { exact: true }).waitFor()
    if (question.type === 'multiple-choice') {
      await page.getByRole('button', { name: question.choices[question.answerIndex], exact: true }).click()
    } else {
      await page.getByRole('textbox', { name: 'Câu trả lời của bạn' }).fill(
        `Câu trả lời do người học tự viết để đáp ứng các tiêu chí công khai của câu ${question.id}.`
      )
      await page.getByRole('button', { name: 'Đối chiếu với tiêu chí', exact: true }).click()
      if (question.id === 'final-11') {
        await capture(page, 'module-2-final-written-review.png')
      }
      await page.getByRole('button', { name: 'Câu trả lời đáp ứng đủ tiêu chí', exact: true }).click()
    }
    await page.getByText('NGUỒN CHÍNH THỨC', { exact: true }).waitFor()
    await page.getByText(question.source.label, { exact: true }).waitFor()
    await page.getByText(question.source.url, { exact: true }).waitFor()
    const continueLabel = index === group.questions.length - 1
      ? group.mode === 'mastery' ? `Xem kết quả ${group.questions.length} câu` : 'Tiếp tục bài học'
      : 'Câu tiếp theo'
    await page.getByRole('button', { name: continueLabel, exact: true }).click()
  }
}

async function completeSetupModule(page, companionPage, electronApp, verifyResponsiveLayout = false) {
  await page.getByRole('button', { name: /MODULE 1.*MỞ BÀI HỌC/ }).click()
  await page.getByText('MODULE 1 · BÀI 1/4 · TRANG 1/4', { exact: true }).first().waitFor()
  assert.equal(
    await page.locator('.pixel-dialogue > p').textContent(),
    'Codex là coding agent của OpenAI. Ở bài này, mình chỉ cần bạn hiểu coding agent là một trợ lý có thể thực hiện công việc liên quan đến code: tạo ứng dụng, xây trang web, chỉnh sửa dự án và tự động hóa những việc lặp lại.'
  )
  assert.equal(await page.getByText('pilot-workspace/', { exact: true }).count(), 0)
  assert.equal(await page.locator('.pixel-lesson-visual').count(), 1)
  assert.equal(await page.locator('.pixel-lesson-visual figcaption').count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Phóng to ảnh minh họa', exact: true }).count(), 1)
  await capture(page, 'module-1-codex-introduction.png')

  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const introductionNarrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(introductionNarrowWidths.body, introductionNarrowWidths.viewport)
    assert.equal(introductionNarrowWidths.document, introductionNarrowWidths.viewport)
    const lessonVisualBounds = await page.locator('.pixel-lesson-visual').boundingBox()
    assert.ok(lessonVisualBounds)
    assert.ok(lessonVisualBounds.width <= introductionNarrowWidths.viewport)
    await capture(page, 'module-1-codex-introduction-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }

  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 1/4 · TRANG 2/4', { exact: true }).first().waitFor()
  assert.equal(await page.locator('.pixel-lesson-visual').count(), 1)
  assert.equal(await page.locator('.pixel-lesson-visual img').getAttribute('data-fit'), 'contain')
  assert.match(await page.locator('.pixel-dialogue > p').textContent(), /Được rồi, vậy chúng ta sẽ bắt đầu tìm hiểu Codex cùng nhau nha/)
  assert.match(await page.locator('.pixel-dialogue > p').textContent(), /Ask for approval luôn hỏi bạn trước khi chỉnh sửa tệp bên ngoài dự án hoặc sử dụng Internet/)
  assert.match(await page.locator('.pixel-dialogue > p').textContent(), /mình khuyên bạn dùng Approve for me/)
  assert.equal(await page.locator('.pixel-approval-focus').count(), 3)
  assert.equal(await page.locator('.pixel-approval-term').count(), 4)
  const approvalFocus = (focus) => page.locator(`.pixel-approval-focus[data-approval-focus="${focus}"]`)
  const approvalTerm = (focus) => page.locator(`.pixel-approval-term[data-approval-focus="${focus}"]`)
  await approvalTerm('ask').click()
  assert.equal(await approvalTerm('ask').getAttribute('aria-pressed'), 'true')
  assert.equal(await approvalFocus('ask').evaluate((element) => element.classList.contains('is-active')), true)
  assert.equal(await approvalFocus('approve').evaluate((element) => element.classList.contains('is-active')), false)
  await approvalTerm('full').focus()
  await approvalTerm('full').press('Enter')
  assert.equal(await approvalTerm('full').getAttribute('aria-pressed'), 'true')
  assert.equal(await approvalFocus('full').evaluate((element) => element.classList.contains('is-active')), true)
  await approvalTerm('approve').last().click()
  assert.equal(await approvalTerm('approve').last().getAttribute('aria-pressed'), 'true')
  assert.equal(await approvalFocus('approve').evaluate((element) => element.classList.contains('is-active')), true)
  assert.equal(await page.locator('.pixel-approval-frame').evaluate((element) => element.classList.contains('is-manual')), true)
  assert.equal(await page.locator('.pixel-lesson-visual figcaption').count(), 0)
  const expandVisualButton = page.getByRole('button', { name: 'Phóng to ảnh minh họa', exact: true })
  await expandVisualButton.click()
  const visualLightbox = page.getByRole('dialog', { name: 'Ảnh minh họa phóng to', exact: true })
  await visualLightbox.waitFor()
  assert.equal(
    await visualLightbox.locator('.pixel-approval-focus[data-approval-focus="approve"]').evaluate((element) => element.classList.contains('is-active')),
    true
  )
  assert.equal(
    await page.getByRole('button', { name: 'Đóng ảnh phóng to', exact: true }).evaluate((element) => element === globalThis.document.activeElement),
    true
  )
  await capture(page, 'module-1-codex-approval-expanded.png')
  await page.keyboard.press('Escape')
  assert.equal(await visualLightbox.count(), 0)
  const approvalVisualBounds = await page.locator('.pixel-lesson-visual').boundingBox()
  const approvalDialogueBounds = await page.locator('.pixel-dialogue').boundingBox()
  assert.ok(approvalVisualBounds)
  assert.ok(approvalDialogueBounds)
  assert.ok(approvalVisualBounds.y + approvalVisualBounds.height < approvalDialogueBounds.y)
  await capture(page, 'module-1-codex-approval-intro.png')
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const approvalNarrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(approvalNarrowWidths.body, approvalNarrowWidths.viewport)
    assert.equal(approvalNarrowWidths.document, approvalNarrowWidths.viewport)
    const approvalNarrowVisualBounds = await page.locator('.pixel-lesson-visual').boundingBox()
    assert.ok(approvalNarrowVisualBounds)
    assert.ok(approvalNarrowVisualBounds.width <= approvalNarrowWidths.viewport)
    assert.ok(approvalNarrowVisualBounds.width >= approvalNarrowWidths.viewport - 24)
    await expandVisualButton.click()
    await visualLightbox.waitFor()
    const approvalNarrowLightboxBounds = await visualLightbox.boundingBox()
    assert.ok(approvalNarrowLightboxBounds)
    assert.ok(approvalNarrowLightboxBounds.width <= approvalNarrowWidths.viewport)
    await capture(page, 'module-1-codex-approval-expanded-390px.png')
    await page.getByRole('button', { name: 'Đóng ảnh phóng to', exact: true }).click()
    await capture(page, 'module-1-codex-approval-intro-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 1/4 · TRANG 3/4', { exact: true }).first().waitFor()
  const modelIntroBoard = page.locator('.pixel-model-board')
  await modelIntroBoard.waitFor()
  assert.equal(await page.locator('.pixel-lesson-visual').count(), 0)
  assert.equal(await page.locator('.pixel-consequence').count(), 0)
  assert.equal(await page.getByText('Triết giải thích', { exact: true }).count(), 0)
  const modelIntroTeacherBounds = await page.locator('.pixel-model-board__teacher').boundingBox()
  assert.ok(modelIntroTeacherBounds)
  assert.ok(modelIntroTeacherBounds.width <= 110)
  const modelIntroText = await modelIntroBoard.textContent()
  assert.match(modelIntroText, /GPT-5.6 Sol/)
  assert.match(modelIntroText, /GPT-5.6 Terra/)
  assert.match(modelIntroText, /GPT-5.6 Luna/)
  assert.match(modelIntroText, /trả lời tin nhắn khách hàng/)
  assert.match(modelIntroText, /Luna có thể làm sub-agent/)
  assert.match(modelIntroText, /Sol có thể gọi Luna khảo sát codebase trước/)
  assert.match(modelIntroText, /Extra High/)
  assert.match(modelIntroText, /chỉ nhanh hơn Standard khoảng 0,5 giây/)
  assert.match(modelIntroText, /GPT-5.6 Sol · High · Standard/)
  await capture(page, 'module-1-codex-model-intro.png')
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const modelNarrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(modelNarrowWidths.body, modelNarrowWidths.viewport)
    assert.equal(modelNarrowWidths.document, modelNarrowWidths.viewport)
    const modelNarrowBoardBounds = await modelIntroBoard.boundingBox()
    const modelNarrowHudBounds = await page.locator('.pixel-hud').boundingBox()
    assert.ok(modelNarrowBoardBounds)
    assert.ok(modelNarrowHudBounds)
    assert.ok(modelNarrowBoardBounds.width <= modelNarrowWidths.viewport)
    assert.ok(modelNarrowBoardBounds.width >= modelNarrowWidths.viewport - 24)
    assert.ok(modelNarrowBoardBounds.y >= modelNarrowHudBounds.y + modelNarrowHudBounds.height)
    assert.equal(await page.locator('.pixel-model-board__teacher').isVisible(), false)
    await capture(page, 'module-1-codex-model-intro-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 1/4 · TRANG 4/4', { exact: true }).first().waitFor()
  const commandVisuals = page.locator('.pixel-lesson-visual-group .pixel-lesson-visual')
  assert.equal(await commandVisuals.count(), 2)
  const commandDialogueText = await page.locator('.pixel-dialogue > p').textContent()
  assert.match(commandDialogueText, /\/status/)
  assert.match(commandDialogueText, /\/goal/)
  assert.match(commandDialogueText, /150\.000 token/)
  assert.match(commandDialogueText, /một đoạn chat trong tài khoản ChatGPT/)
  const slashExpandButton = page.getByRole('button', { name: 'Phóng to ảnh minh họa lệnh /', exact: true })
  const atExpandButton = page.getByRole('button', { name: 'Phóng to ảnh minh họa dấu @', exact: true })
  await slashExpandButton.click()
  await visualLightbox.waitFor()
  assert.match(await visualLightbox.locator('img').getAttribute('alt'), /dấu gạch chéo/)
  await page.getByRole('button', { name: 'Đóng ảnh phóng to', exact: true }).click()
  await atExpandButton.click()
  await visualLightbox.waitFor()
  assert.match(await visualLightbox.locator('img').getAttribute('alt'), /dấu @/)
  await page.keyboard.press('Escape')
  await capture(page, 'module-1-codex-slash-commands.png')
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const commandNarrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(commandNarrowWidths.body, commandNarrowWidths.viewport)
    assert.equal(commandNarrowWidths.document, commandNarrowWidths.viewport)
    const firstCommandVisualBounds = await commandVisuals.nth(0).boundingBox()
    const secondCommandVisualBounds = await commandVisuals.nth(1).boundingBox()
    assert.ok(firstCommandVisualBounds)
    assert.ok(secondCommandVisualBounds)
    assert.ok(firstCommandVisualBounds.width <= commandNarrowWidths.viewport)
    assert.ok(secondCommandVisualBounds.width <= commandNarrowWidths.viewport)
    assert.ok(secondCommandVisualBounds.y >= firstCommandVisualBounds.y + firstCommandVisualBounds.height)
    await capture(page, 'module-1-codex-slash-commands-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 2/4 · TRANG 1/1', { exact: true }).first().waitFor()
  const harnessBoard = page.locator('.pixel-harness-board')
  await harnessBoard.waitFor()
  const harnessText = await harnessBoard.textContent()
  assert.match(harnessText, /Harness Engineering thực ra là gì/)
  assert.match(harnessText, /Model là bộ não của agent/)
  assert.match(harnessText, /Workspace, tệp và chỉ dẫn/)
  assert.match(harnessText, /Sandbox và approval/)
  assert.match(harnessText, /Đừng chỉ đổi model/)
  assert.equal(await page.getByRole('button', { name: 'Harness là gì?', exact: true }).count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Xem harness của Codex', exact: true }).count(), 0)
  await capture(page, 'module-1-harness-engineering.png')
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const harnessNarrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(harnessNarrowWidths.body, harnessNarrowWidths.viewport)
    assert.equal(harnessNarrowWidths.document, harnessNarrowWidths.viewport)
    const harnessNarrowBoardBounds = await harnessBoard.boundingBox()
    assert.ok(harnessNarrowBoardBounds)
    assert.ok(harnessNarrowBoardBounds.width <= harnessNarrowWidths.viewport)
    assert.ok(harnessNarrowBoardBounds.width >= harnessNarrowWidths.viewport - 24)
    await capture(page, 'module-1-harness-engineering-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('Dùng cấu hình đã chọn', { exact: true }).waitFor()
  assert.equal(await page.locator('.pixel-model-board').count(), 1)
  assert.match(await page.locator('.pixel-model-board').textContent(), /Túm cái quần lại, dưới đây là những setup mình khuyên bạn nên thiết lập cho Codex/)
  assert.equal(await page.getByText('Triết giải thích', { exact: true }).count(), 0)
  await capture(page, 'module-1-model-application.png')
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('Nộp bằng chứng cấu hình Codex', { exact: true }).waitFor()
  const practiceBrief = page.locator('[data-practice-id="m1-codex-safe-setup"]')
  await practiceBrief.getByRole('heading', { name: 'MỤC TIÊU', exact: true }).waitFor()
  await practiceBrief.getByRole('heading', { name: 'KẾT QUẢ CẦN NỘP', exact: true }).waitFor()
  await practiceBrief.getByRole('heading', { name: 'ĐIỀU KIỆN ĐẠT', exact: true }).waitFor()
  assert.match(await practiceBrief.textContent(), /Model5.6 Sol/)
  assert.match(await practiceBrief.textContent(), /EffortHigh/)
  assert.match(await practiceBrief.textContent(), /SpeedStandard/)
  assert.match(await practiceBrief.textContent(), /ApprovalApprove for me/)
  assert.match(await practiceBrief.textContent(), /Full accessTắt/)
  await capture(page, 'module-1-codex-setup-practice.png')

  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const narrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(narrowWidths.body, narrowWidths.viewport)
    assert.equal(narrowWidths.document, narrowWidths.viewport)
    await capture(page, 'module-1-codex-setup-390px.png')
    const narrowPracticeAction = page.getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true })
    await narrowPracticeAction.scrollIntoViewIfNeeded()
    const narrowPracticeActionBounds = await narrowPracticeAction.boundingBox()
    assert.ok(narrowPracticeActionBounds)
    assert.ok(narrowPracticeActionBounds.y >= 0)
    assert.ok(narrowPracticeActionBounds.y + narrowPracticeActionBounds.height <= 844)
    await page.setViewportSize({ width: 1180, height: 780 })
  }

  await page.getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true }).click()
  await page.getByText('Sẵn sàng cho 5 câu ôn tập', { exact: true }).waitFor()
  await capture(page, 'module-1-codex-setup-approved.png')
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()

  await page.getByText(/Dấu hiệu nào cho thấy Codex đang hoạt động như một coding agent/).waitFor()
  await page.getByRole('button', { name: /Codex đọc các tệp liên quan/ }).click()
  await page.getByRole('button', { name: 'Câu tiếp theo', exact: true }).click()

  await page.getByText(/workspace thiếu chỉ dẫn dự án và không có cách kiểm tra kết quả/).waitFor()
  await page.getByRole('button', { name: /Bổ sung chỉ dẫn cùng cách kiểm tra rõ ràng/ }).click()
  await page.getByRole('button', { name: 'Câu tiếp theo', exact: true }).click()

  await page.getByText(/task Executor chỉ cần đọc hai ảnh/).waitFor()
  await page.getByRole('button', { name: /Giữ Full access tắt/ }).click()
  await page.getByRole('button', { name: 'Câu tiếp theo', exact: true }).click()

  await page.getByText(/Bạn có hai việc: thiết kế một luồng ContentPilot/).waitFor()
  await page.getByLabel('Câu trả lời của bạn').fill('Dùng Sol và High cho việc còn mơ hồ; dùng lựa chọn tiết kiệm hơn cho việc theo mẫu đã duyệt.')
  await page.getByRole('button', { name: 'Đối chiếu với tiêu chí', exact: true }).click()
  await page.getByRole('button', { name: 'Câu trả lời đáp ứng đủ tiêu chí', exact: true }).click()
  await page.getByRole('button', { name: 'Câu tiếp theo', exact: true }).click()

  await page.getByText(/Báo cáo Verification ghi 5.6 Sol/).waitFor()
  await page.getByLabel('Câu trả lời của bạn').fill('Chưa thể duyệt. Cần thêm ảnh Approval–Full access và xác nhận Full access đang tắt rồi mới kiểm tra lại.')
  await page.getByRole('button', { name: 'Đối chiếu với tiêu chí', exact: true }).click()
  await page.getByRole('button', { name: 'Câu trả lời đáp ứng đủ tiêu chí', exact: true }).click()
  await page.getByRole('button', { name: 'Xem kết quả 5 câu', exact: true }).click()

  await page.getByText(/Bạn đạt 5\/5 câu/).waitFor()
  await capture(page, 'module-1-final-review.png')
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('Module 1 đã hoàn thành', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  await page.getByText('HOÀN THÀNH', { exact: true }).first().waitFor()
}

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

async function verifyHomeBase(page) {
  await page.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  await page.getByText('TIẾN ĐỘ TOÀN KHÓA', { exact: true }).waitFor()
  await page.getByText('BẠN ĐANG Ở ĐÂY', { exact: true }).waitFor()
  assert.equal(
    await page
      .getByText('Chọn chặng có nhãn “Bạn đang ở đây” để tiếp tục học.', { exact: true })
      .count(),
    0
  )
  const typography = await page.evaluate(async () => {
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
  assert.equal(await page.locator('.pixel-app-current').count(), 0)
  const teacherAnimation = await page
    .locator('.pixel-home-teacher img')
    .evaluate((element) => globalThis.getComputedStyle(element).animationName)
  assert.match(teacherAnimation, /pixel-teacher-idle/)
  await page.emulateMedia({ reducedMotion: 'reduce' })
  assert.equal(
    await page
      .locator('.pixel-home-teacher img')
      .evaluate((element) => globalThis.getComputedStyle(element).animationName),
    'none'
  )
  await page.emulateMedia({ reducedMotion: 'no-preference' })
  assert.equal(await page.getByRole('navigation', { name: 'Điều hướng Course Companion' }).count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Bài học', exact: true }).count(), 0)
  await page.getByText('SẮP TỚI', { exact: true }).first().waitFor()
  assert.equal(await page.getByText('00', { exact: true }).count(), 0)
  assert.equal(await page.getByText('Giới thiệu khóa học', { exact: true }).count(), 0)
  await page
    .getByText('Bắt đầu làm việc với Codex', { exact: true })
    .waitFor()
  await page
    .getByText('Giao tiếp hiệu quả với coding agent: Planning, PRD và prompt', { exact: true })
    .waitFor()
  await page.getByText('MODULE 1 · 4 BÀI HỌC', { exact: true }).waitFor()
  await page.getByText('MODULE 2 · 6 BÀI HỌC', { exact: true }).waitFor()
  await capture(page, 'home-base.png')
  if (screenshotDirectory) {
    await page.setViewportSize({ width: 390, height: 844 })
    const narrowWidths = await page.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(narrowWidths.body, narrowWidths.viewport)
    assert.equal(narrowWidths.document, narrowWidths.viewport)
    await capture(page, 'home-base-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }
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
    .getByRole('heading', { name: 'Chào mừng bạn đến với Vibecoding 101' })
    .waitFor()
  assert.equal(await firstWindows.learningPage.getByText('HÀNH TRÌNH MỚI', { exact: true }).count(), 0)
  const welcomeSurface = await firstWindows.learningPage.evaluate(() => {
    const panel = globalThis.document.querySelector('.pixel-entry-panel')
    const primary = globalThis.document.querySelector('.pixel-entry-primary')
    const world = globalThis.document.querySelector('.pixel-scene-world')
    return {
      shellIsWelcome: globalThis.document.querySelector('.pixel-entry-shell')?.classList.contains('is-welcome'),
      panelBackground: panel ? globalThis.getComputedStyle(panel).backgroundColor : '',
      panelBorderRadius: panel ? globalThis.getComputedStyle(panel).borderRadius : '',
      primaryBorderRadius: primary ? globalThis.getComputedStyle(primary).borderRadius : '',
      worldFilter: world ? globalThis.getComputedStyle(world).filter : ''
    }
  })
  assert.equal(welcomeSurface.shellIsWelcome, true)
  assert.equal(welcomeSurface.panelBackground, 'rgba(6, 6, 6, 0.97)')
  assert.equal(welcomeSurface.panelBorderRadius, '16px')
  assert.equal(welcomeSurface.primaryBorderRadius, '10px')
  assert.match(welcomeSurface.worldFilter, /saturate\(0\.66\)/)
  assert.match(welcomeSurface.worldFilter, /brightness\(0\.5\)/)
  await capture(firstWindows.learningPage, 'welcome-obsidian.png')
  await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
  const welcomeNarrowWidths = await firstWindows.learningPage.evaluate(() => ({
    body: globalThis.document.body.scrollWidth,
    document: globalThis.document.documentElement.scrollWidth,
    viewport: globalThis.innerWidth
  }))
  assert.equal(welcomeNarrowWidths.body, welcomeNarrowWidths.viewport)
  assert.equal(welcomeNarrowWidths.document, welcomeNarrowWidths.viewport)
  await capture(firstWindows.learningPage, 'welcome-obsidian-390px.png')
  await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })

  await firstWindows.learningPage
    .getByRole('button', { name: 'Cùng bắt đầu nhé' })
    .click()
  await firstWindows.learningPage
    .getByText('GIỚI THIỆU KHÓA HỌC · TRANG 1/3', { exact: true })
    .waitFor()
  await firstWindows.learningPage.getByRole('button', { name: '← Trang trước', exact: true }).waitFor()
  assert.equal(
    await firstWindows.learningPage.getByRole('button', { name: '← Trang trước', exact: true }).isDisabled(),
    true
  )
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(
    await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(),
    'Trong khoá học này, bạn sẽ được xây dựng một ứng dụng có khả năng tự động hoá quá trình sáng tạo nội dung. Nó sẽ giúp bạn lên nội dung hàng ngày cho kênh Facebook.'
  )
  const desktopContinueButton = await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục' })
    .boundingBox()
  const desktopChoiceArea = await firstWindows.learningPage
    .locator('.pixel-choices')
    .boundingBox()
  assert.ok(desktopContinueButton)
  assert.ok(desktopChoiceArea)
  assert.ok(desktopContinueButton.width <= 240)
  assert.ok(Math.abs((desktopContinueButton.x + desktopContinueButton.width) - (desktopChoiceArea.x + desktopChoiceArea.width)) <= 1)
  await capture(firstWindows.learningPage, 'lesson-progress.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục' })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .waitFor()
  await firstWindows.learningPage.getByRole('button', { name: '← Trang trước', exact: true }).click()
  await firstWindows.learningPage
    .getByText('ĐANG XEM LẠI · TIẾN ĐỘ VẪN ĐƯỢC GIỮ NGUYÊN', { exact: true })
    .waitFor()
  await capture(firstWindows.learningPage, 'lesson-review-mode.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Quay lại trang đang học', exact: true })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(
    await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(),
    'Bạn chỉ cần nhập thông tin thương hiệu/kênh Facebook của mình, app sẽ tự động giúp bạn nghiên cứu những thông tin đang trending liên quan đến lĩnh vực của bạn, draft nội dung dựa trên giọng văn mà thương hiệu bạn theo đuổi, tạo cả hình ảnh giúp bạn, và bạn chỉ cần duyệt nội dung thôi.'
  )
  await capture(firstWindows.learningPage, 'course-introduction-page-2.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(
    await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(),
    'Khóa học này không chỉ dành cho content creator. Content automation app chỉ là một dự án trong khóa học. Sau khi hoàn thành dự án này, bạn sẽ có bộ kỹ năng và hiểu biết cần thiết để xây dựng bất kỳ ứng dụng nào bạn mong muốn.'
  )
  await capture(firstWindows.learningPage, 'course-introduction-page-3.png')
  if (screenshotDirectory) {
    await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
    const introductionNarrowWidths = await firstWindows.learningPage.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(introductionNarrowWidths.body, introductionNarrowWidths.viewport)
    assert.equal(introductionNarrowWidths.document, introductionNarrowWidths.viewport)
    const narrowStartButton = await firstWindows.learningPage
      .getByRole('button', { name: 'Tiếp tục', exact: true })
      .boundingBox()
    const narrowChoiceArea = await firstWindows.learningPage
      .locator('.pixel-choices')
      .boundingBox()
    const narrowBackButton = await firstWindows.learningPage
      .getByRole('button', { name: '← Trang trước', exact: true })
      .boundingBox()
    assert.ok(narrowStartButton)
    assert.ok(narrowChoiceArea)
    assert.ok(narrowBackButton)
    assert.ok(Math.abs(narrowStartButton.width - narrowChoiceArea.width) <= 1)
    assert.ok(Math.abs(narrowBackButton.width - narrowChoiceArea.width) <= 1)
    assert.ok(narrowStartButton.y + narrowStartButton.height < narrowBackButton.y)
    await capture(firstWindows.learningPage, 'course-introduction-page-3-390px.png')
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .click()
  await verifyHomeBase(firstWindows.learningPage)
  await completeSetupModule(firstWindows.learningPage, firstWindows.companionPage, firstLaunch, true)
  assert.equal(await fingerprintTree(practiceWorkspace.canonicalStarter), canonicalStarterFingerprint)
  await verifyHomeBase(firstWindows.learningPage)
  await firstWindows.learningPage
    .getByRole('button', { name: /MODULE 2.*MỞ BÀI HỌC/ })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .waitFor()
  await firstWindows.learningPage
    .getByText('MODULE 2 · BÀI 1/6 · TRANG 1/4', { exact: true })
    .first()
    .waitFor()
  assert.equal(
    await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(),
    'Cũng giống như con người, có một kế hoạch kỹ càng trước khi xây sẽ giúp coding agent tránh phạm những sai lầm ngớ ngẩn sau này. Nó tưởng chừng tốn thời gian, nhưng thực chất planning kỹ sẽ giúp bạn đỡ phải debug và sửa một ứng dụng không vừa ý mình. Tin mình đi, sửa một ứng dụng đã đi sai hướng sẽ tốn thời gian hơn nhiều so với planning kỹ ngay từ đầu.\n\nKhông phải việc nào cũng cần planning. Bạn có thể giao trực tiếp cho coding agent nếu yêu cầu nhỏ và kết quả đã rõ. Hãy lập kế hoạch trước khi bắt đầu xây một sản phẩm mới. Bạn cũng nên planning nếu chưa xác định được hướng đi hoặc thứ tự thực hiện.'
  )
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual').count(), 1)
  const planningBackButton = await firstWindows.learningPage
    .getByRole('button', { name: '← Trang trước', exact: true })
    .boundingBox()
  const planningNextButton = await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .boundingBox()
  assert.ok(planningBackButton)
  assert.ok(planningNextButton)
  assert.ok(Math.abs(
    planningBackButton.y + planningBackButton.height
      - (planningNextButton.y + planningNextButton.height)
  ) <= 1)
  await capture(firstWindows.learningPage, 'module-2-planning-fundamentals.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .waitFor()
  assert.equal(
    await firstWindows.learningPage.getByRole('button', { name: 'Làm câu kiểm tra nhanh', exact: true }).count(),
    0
  )
  await firstWindows.learningPage
    .getByText('NGUỒN PHƯƠNG PHÁP · MICROSOFT', { exact: true })
    .waitFor()
  await firstWindows.learningPage.getByRole('button', { name: '← Trang trước', exact: true }).click()
  await firstWindows.learningPage
    .getByText('ĐANG XEM LẠI · TIẾN ĐỘ VẪN ĐƯỢC GIỮ NGUYÊN', { exact: true })
    .waitFor()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Quay lại trang đang học', exact: true })
    .click()
  await firstWindows.learningPage
    .getByText('NGUỒN PHƯƠNG PHÁP · MICROSOFT', { exact: true })
    .waitFor()
  await capture(firstWindows.learningPage, 'module-2-planning-example.png')
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .click()
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await firstWindows.learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .click()
  const firstAssessmentQuestion = assessmentGroup('planning-prd-check').questions[0]
  await firstWindows.learningPage.getByText(firstAssessmentQuestion.prompt, { exact: true }).waitFor()
  assert.equal(await firstWindows.learningPage.getByText('NGUỒN CHÍNH THỨC', { exact: true }).count(), 0)
  await firstWindows.learningPage
    .getByRole('button', { name: firstAssessmentQuestion.choices[0], exact: true })
    .click()
  await firstWindows.learningPage.getByText('NGUỒN CHÍNH THỨC', { exact: true }).waitFor()
  await capture(firstWindows.learningPage, 'module-2-first-sourced-check.png')
  if (screenshotDirectory) {
    await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
    const moduleTwoNarrowWidths = await firstWindows.learningPage.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(moduleTwoNarrowWidths.body, moduleTwoNarrowWidths.viewport)
    assert.equal(moduleTwoNarrowWidths.document, moduleTwoNarrowWidths.viewport)
    await capture(firstWindows.learningPage, 'module-2-assessment-390px.png')
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstLaunch.close()
  firstLaunch = undefined

  resumedLaunch = await launchCourseCompanion()
  const { learningPage, companionPage } = await loadWindows(resumedLaunch)

  await learningPage
    .getByRole('heading', { name: 'Tiếp tục đúng nơi bạn dừng lại' })
    .waitFor()
  await learningPage
    .getByText(/Câu 1\/3/)
    .waitFor()
  await learningPage.getByRole('button', { name: 'Bắt đầu lại' }).click()
  await learningPage
    .getByRole('heading', { name: 'Bắt đầu lại từ đầu?' })
    .waitFor()
  await learningPage.getByRole('button', { name: 'Xóa và bắt đầu lại' }).click()
  await learningPage
    .getByRole('heading', { name: 'Chào mừng bạn đến với Vibecoding 101' })
    .waitFor()
  await learningPage.getByRole('button', { name: 'Cùng bắt đầu nhé' }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục' }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  await completeSetupModule(learningPage, companionPage, resumedLaunch)
  assert.equal(await fingerprintTree(practiceWorkspace.canonicalStarter), canonicalStarterFingerprint)
  await learningPage.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' }).click()
  await learningPage.getByText('TRIẾT ĐÃ SẴN SÀNG', { exact: true }).waitFor()
  const teacherBounds = await learningPage.locator('.pixel-teacher-overlay').boundingBox()
  assert.ok(teacherBounds)
  assert.ok(teacherBounds.x > 1180 / 2)
  await capture(learningPage, 'teacher-overlay.png')
  await learningPage.locator('.pixel-teacher-overlay').getByRole('button', { name: 'Đóng Triết' }).click()
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
    .getByRole('button', { name: /MODULE 2.*MỞ BÀI HỌC/ })
    .click()
  await learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .waitFor()
  assert.equal(await learningPage.locator('.pixel-scene-title').count(), 1)
  assert.equal(await learningPage.locator('.pixel-consequence').count(), 0)

  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByText('VÍ DỤ TỪ ATLASSIAN', { exact: true }).waitFor()
  await capture(learningPage, 'module-2-prd-example.png')
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByText('VÍ DỤ BẰNG HÌNH ẢNH', { exact: true }).waitFor()
  await capture(learningPage, 'module-2-prd-visual-examples.png')
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByText('VÍ DỤ BẰNG CODE', { exact: true }).waitFor()
  await capture(learningPage, 'module-2-prd-code-examples.png')
  await learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .click()
  await answerAssessmentGroup(learningPage, 'planning-prd-check')
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByText('VÍ DỤ TỪ OPENAI DOCS', { exact: true }).waitFor()
  await capture(learningPage, 'module-2-prompt-example.png')
  if (screenshotDirectory) {
    await learningPage.setViewportSize({ width: 390, height: 844 })
    const promptExampleNarrowWidths = await learningPage.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(promptExampleNarrowWidths.body, promptExampleNarrowWidths.viewport)
    assert.equal(promptExampleNarrowWidths.document, promptExampleNarrowWidths.viewport)
    await learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .click()
  await answerAssessmentGroup(learningPage, 'prompt-check')
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByText('VÍ DỤ ATLASSIAN → MICROSOFT', { exact: true }).waitFor()
  await capture(learningPage, 'module-2-implementation-plan-example.png')
  await learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .click()
  await answerAssessmentGroup(learningPage, 'implementation-plan-check')
  await learningPage
    .getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true })
    .click()
  await learningPage.getByText('Kiểm tra và hoàn thành Module 2', { exact: true }).waitFor()
  await waitForSnapshot(
    resumedLaunch,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected the mock Practice to keep the learning window visible'
  )
  assert.equal(
    await learningPage.getByText('Không thể tải tiến trình cục bộ.', { exact: true }).count(),
    0
  )
  await capture(learningPage, 'practice-reflection.png')
  await learningPage
    .getByRole('button', { name: 'Tiếp tục', exact: true })
    .click()
  await answerAssessmentGroup(learningPage, 'final-assessment')
  await learningPage.getByText('Bạn đạt 15/15 câu.', { exact: false }).waitFor()
  await capture(learningPage, 'module-2-final-summary.png')
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByText('Module 2 đã hoàn thành', { exact: true }).waitFor()
  await learningPage.getByRole('button', { name: 'Về Home Base', exact: true }).click()
  await learningPage.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()

  const firstPracticeRun = await companionPage.evaluate(() => globalThis.courseCompanion?.loadPracticeWorkspace())
  const secondPracticeRun = await companionPage.evaluate(() => globalThis.courseCompanion?.startPractice({
    practiceId: 'm2-planning-package',
    practiceVersion: '2.0.0',
    transfer: false
  }))
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
    .getByRole('button', { name: 'Mở Triết, giáo viên đồng hành' })
    .click()
  await companionPage.getByRole('button', { name: 'Thoát ứng dụng' }).click()
  await resumedLaunch.waitForEvent('close')
  resumedLaunch = undefined

  const persisted = JSON.parse(
    await readFile(join(userDataDirectory, 'learner-state.json'), 'utf8')
  )
  assert.equal(persisted.sceneId, 'module-2-complete')
  assert.equal(persisted.checkpointId, 'm2-complete')
  assert.equal(persisted.schemaVersion, 5)
  assert.equal(persisted.courseVersion, '0.2.0')
  assert.equal(persisted.currentCourseLessonId, 'm2-assessment')
  assert.ok(persisted.sceneHistory.length > 20)
  assert.equal(persisted.decisions.planningApproach, 'plan-first')
  assert.equal(persisted.decisions.setupPractice, 'teacher-reviewed-setup')
  assert.equal(persisted.decisions.setupMastery, 'passed-four-of-five')
  assert.equal(persisted.decisions.masteryEvidence, 'artifacts-approved-and-aligned')
  assert.equal(
    Object.entries(persisted.decisions).filter(
      ([key, value]) => key.startsWith('assessment:final-') && String(value).startsWith('correct')
    ).length,
    15
  )
  assert.equal(persisted.practice.status, 'idle')
  assert.equal(persisted.practice.latestEvent, undefined)

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
  await historyWindows.companionPage.getByRole('tab', { name: 'THỰC HÀNH' }).click()
  await historyWindows.companionPage
    .getByText('ĐÃ HOÀN THÀNH · LUYỆN TẬP', { exact: true })
    .waitFor()
  await historyWindows.companionPage.getByRole('button', { name: 'Thoát ứng dụng' }).click()
  await chatHistoryLaunch.waitForEvent('close')
  chatHistoryLaunch = undefined
  assert.equal(
    await fingerprintTree(practiceWorkspace.canonicalStarter),
    canonicalStarterFingerprint
  )

  console.log(
    'Electron smoke: introduction separation, six-lesson Module 2, review-safe back navigation, roadmap entry, Teacher overlay, settings, journey resume/reset, in-app mock Practice, mastery, persistence, security, and companion lifecycle passed'
  )
} finally {
  await firstLaunch?.close().catch(() => undefined)
  await resumedLaunch?.close().catch(() => undefined)
  await chatHistoryLaunch?.close().catch(() => undefined)
  await rm(userDataDirectory, { recursive: true, force: true })
  await practiceWorkspace.cleanup()
}
