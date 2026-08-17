import assert from 'node:assert/strict'
import { mkdir, mkdtemp, readFile, readdir, rm } from 'node:fs/promises'
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
const portfolioWorkspaceDirectory = await mkdtemp(join(tmpdir(), 'portfolio learner đầu tiên-'))
const learningPortfolioWorkspaceDirectory = await mkdtemp(join(tmpdir(), 'portfolio hành trình module 2-'))
const screenshotDirectory = process.env.COURSE_COMPANION_SCREENSHOT_DIR
const setupQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-1.quiz.json'), 'utf8')
)
const planningQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-2.quiz.json'), 'utf8')
)
const releaseQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-4.quiz.json'), 'utf8')
)
const approvedModuleTwoOpening = 'Sau khi hoàn thành module 1, hy vọng các bạn đã hiểu hơn về cách sử dụng Codex. Đầu tiên, chúng ta sẽ cùng tìm hiểu về cách planning khi sử dụng Coding agents. Nhiều bạn mới bắt đầu code với AI thường bỏ qua phần lên kế hoạch mà nhảy thẳng vào phần thực thi. Các bạn ấy nghĩ rằng mình đang tiết kiệm thời gian, nhưng thực chất các bạn đang lầm. Nếu có một kế hoạch tốt trước khi bắt đầu xây sản phẩm. Bạn sẽ tiết kiệm được biết bao thời gian debug và sửa lại từ đầu vì không đúng ý. Tin mình đi, mình đã phạm phải sai lầm này và đã phải trả giá.'

async function openModuleTwoPortfolioWorkspace(page, stepsRemaining = 5) {
  for (let index = 0; index < stepsRemaining; index += 1) {
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  }
  await page.getByRole('heading', { name: 'Chọn nơi lưu portfolio', exact: true }).waitFor()
}

function assessmentGroup(groupId) {
  if (groupId === 'setup-final-assessment') {
    return {
      id: groupId,
      mode: 'mastery',
      questions: setupQuiz.questions
    }
  }
  const group = [...planningQuiz.groups, ...releaseQuiz.groups]
    .find((candidate) => candidate.id === groupId)
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
    await page.getByText(
      question.source.kind === 'curriculum-judgment'
        ? 'QUYẾT ĐỊNH CHƯƠNG TRÌNH'
        : 'NGUỒN PHƯƠNG PHÁP',
      { exact: true }
    ).waitFor()
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
  await page.getByText('MODULE 1 · BÀI 1/3 · TRANG 1/4', { exact: true }).first().waitFor()
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
  await page.getByText('MODULE 1 · BÀI 1/3 · TRANG 2/4', { exact: true }).first().waitFor()
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
  await page.getByText('MODULE 1 · BÀI 1/3 · TRANG 3/4', { exact: true }).first().waitFor()
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
  await page.getByText('MODULE 1 · BÀI 1/3 · TRANG 4/4', { exact: true }).first().waitFor()
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
  await page.getByText('MODULE 1 · BÀI 2/3 · TRANG 1/1', { exact: true }).first().waitFor()
  assert.equal(await page.locator('.pixel-harness-board').count(), 0)
  await page.getByText('Dùng cấu hình đã chọn', { exact: true }).waitFor()
  assert.equal(await page.locator('.pixel-model-board').count(), 1)
  assert.match(await page.locator('.pixel-model-board').textContent(), /Túm cái quần lại, dưới đây là những setup mình khuyên bạn nên thiết lập cho Codex/)
  assert.equal(await page.getByText('Triết giải thích', { exact: true }).count(), 0)
  await capture(page, 'module-1-model-application.png')
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 3/3 · TRANG 1/8', { exact: true }).first().waitFor()
  const practiceBrief = page.locator('[data-practice-id="m1-codex-safe-setup"]')
  await practiceBrief.getByRole('heading', { name: 'MỤC TIÊU', exact: true }).waitFor()
  await practiceBrief.getByRole('heading', { name: 'KẾT QUẢ CẦN NỘP', exact: true }).waitFor()
  await practiceBrief.getByRole('heading', { name: 'ĐIỀU KIỆN ĐẠT', exact: true }).waitFor()
  assert.match(await practiceBrief.textContent(), /Model5.6 Sol/)
  assert.match(await practiceBrief.textContent(), /EffortHigh/)
  assert.match(await practiceBrief.textContent(), /SpeedStandard/)
  assert.match(await practiceBrief.textContent(), /ApprovalApprove for me/)
  assert.match(await practiceBrief.textContent(), /Full accessTắt/)
  await page.getByRole('button', { name: 'Bỏ qua Practice · Duyệt Module 2', exact: true }).waitFor()
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
    const narrowBypassAction = page.getByRole('button', { name: 'Bỏ qua Practice · Duyệt Module 2', exact: true })
    await narrowBypassAction.scrollIntoViewIfNeeded()
    const narrowBypassActionBounds = await narrowBypassAction.boundingBox()
    assert.ok(narrowBypassActionBounds)
    assert.ok(narrowBypassActionBounds.y >= 0)
    assert.ok(narrowBypassActionBounds.y + narrowBypassActionBounds.height <= 844)
    await page.setViewportSize({ width: 1180, height: 780 })
  }

  const progressBeforeBypass = await page.evaluate(async () => globalThis.courseCompanion?.loadProgress())
  await page.getByRole('button', { name: 'Bỏ qua Practice · Duyệt Module 2', exact: true }).click()
  await page.getByText('MODULE 2 · PHẦN 1/5', { exact: true }).first().waitFor()
  assert.equal(await page.locator('.pixel-dialogue > p').textContent(), approvedModuleTwoOpening)
  assert.equal(await page.locator('.pixel-content-review-notice, .pixel-review-notice, .pixel-content-review-exit').count(), 0)
  await page.locator('.pixel-brand').click()
  await page.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  assert.deepEqual(await page.evaluate(async () => globalThis.courseCompanion?.loadProgress()), progressBeforeBypass)
  await page.getByRole('button', { name: /MODULE 1.*MỞ BÀI HỌC/ }).click()
  await practiceBrief.getByRole('heading', { name: 'MỤC TIÊU', exact: true }).waitFor()

  await page.getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true }).click()
  await page.locator('.practice-brief-overlay').waitFor()
  await page.getByRole('button', { name: 'Bắt đầu Practice mới', exact: true }).click()
  await waitForSnapshot(
    electronApp,
    (windows) => learningWindow(windows)?.visible === false && companionWindow(windows)?.visible === true,
    'Expected Module 1 Practice to leave the lesson and open the Codex companion'
  )
  await companionPage.getByRole('button', { name: 'Mở Triết, giáo viên đồng hành', exact: true }).click()
  await companionPage.getByRole('tab', { name: 'TIẾN ĐỘ', exact: true }).waitFor()
  await companionPage.getByRole('button', { name: 'Yêu cầu Triết duyệt tiến độ', exact: true }).click()
  await companionPage.getByText('ĐÃ ĐẠT', { exact: true }).waitFor()
  await companionPage.getByRole('button', { name: 'Quay lại khóa học', exact: true }).click()
  await waitForSnapshot(
    electronApp,
    (windows) => learningWindow(windows)?.visible === true && companionWindow(windows)?.visible === false,
    'Expected the passed Module 1 Practice to return to the lesson'
  )
  await companionPage.evaluate(() => globalThis.courseCompanion?.setCompanionMode('compact'))
  await page.getByText('Sẵn sàng cho 4 câu ôn tập', { exact: true }).waitFor()
  await capture(page, 'module-1-codex-setup-approved.png')
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()

  await page.getByText(/Dấu hiệu nào cho thấy Codex đang hoạt động như một coding agent/).waitFor()
  await page.getByRole('button', { name: /Codex đọc các tệp liên quan/ }).click()
  await page.getByRole('button', { name: 'Câu tiếp theo', exact: true }).click()

  await page.getByText(/xem cuộc trò chuyện đã dùng bao nhiêu context/).waitFor()
  await page.getByRole('button', { name: /Dùng \/status để xem mức sử dụng context/ }).click()
  await page.getByRole('button', { name: 'Câu tiếp theo', exact: true }).click()

  await page.getByText(/task Codex chỉ cần đọc hai ảnh/).waitFor()
  await page.getByRole('button', { name: /Giữ Full access tắt/ }).click()
  await page.getByRole('button', { name: 'Câu tiếp theo', exact: true }).click()

  await page.getByText(/Bạn cần chọn giữa 5.6 Sol và 5.6 Luna cho hai nhiệm vụ/).waitFor()
  await page.getByLabel('Câu trả lời của bạn').fill('Dùng 5.6 Sol cho portfolio còn mơ hồ vì cần phân tích và phán đoán; dùng 5.6 Luna cho 100 mô tả theo mẫu vì công việc rõ, lặp lại và có khối lượng lớn.')
  await page.getByRole('button', { name: 'Đối chiếu với tiêu chí', exact: true }).click()
  await page.getByRole('button', { name: 'Câu trả lời đáp ứng đủ tiêu chí', exact: true }).click()
  await page.getByRole('button', { name: 'Xem kết quả 4 câu', exact: true }).click()

  await page.getByText(/Bạn đạt 4\/4 câu/).waitFor()
  await capture(page, 'module-1-final-review.png')
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('Module 1 đã hoàn thành', { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  await page.getByText('HOÀN THÀNH', { exact: true }).first().waitFor()
}

async function capture(page, filename) {
  const palette = await page.evaluate(() => {
    const colorProperties = [
      'color',
      'backgroundColor',
      'borderTopColor',
      'borderRightColor',
      'borderBottomColor',
      'borderLeftColor',
      'outlineColor'
    ]
    const samples = new Map()

    const parseColor = (value) => {
      const match = value.match(/^rgba?\(\s*(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)\D+(\d+(?:\.\d+)?)(?:\D+(\d+(?:\.\d+)?))?\s*\)$/)
      if (!match) return null
      const alpha = match[4] === undefined ? 1 : Number(match[4])
      if (alpha < 0.05) return null
      return [Number(match[1]), Number(match[2]), Number(match[3])]
    }

    const classify = ([red, green, blue]) => {
      const maximum = Math.max(red, green, blue)
      const minimum = Math.min(red, green, blue)
      const relativeChroma = maximum === 0 ? 0 : (maximum - minimum) / maximum
      if (maximum < 72 || relativeChroma < 0.22) return 'neutral'
      if (red > 185 && green > 170 && blue > 155) return 'neutral'
      if (red > 190 && green > 145 && blue < 170) return 'yellow'
      if (green > red + 28 && green > blue + 18) return 'success'
      if (red > green + 34 && red > blue + 22) return 'danger'
      if (blue > red + 22 || (green > red + 28 && blue >= green - 22)) return 'information'
      return 'other'
    }

    for (const element of globalThis.document.querySelectorAll('body *')) {
      if (element.closest('img, picture, video, canvas')) continue
      const style = globalThis.getComputedStyle(element)
      const rect = element.getBoundingClientRect()
      if (
        style.display === 'none'
        || style.visibility === 'hidden'
        || Number(style.opacity) < 0.05
        || rect.width < 1
        || rect.height < 1
      ) continue

      for (const property of colorProperties) {
        const value = style[property]
        const parsed = parseColor(value)
        if (!parsed) continue
        const family = classify(parsed)
        const familySamples = samples.get(family) ?? new Set()
        if (familySamples.size < 5) familySamples.add(value)
        samples.set(family, familySamples)
      }
    }

    return Object.fromEntries(
      [...samples.entries()].map(([family, values]) => [family, [...values]])
    )
  })
  const families = Object.keys(palette)
  const unexpectedFamilies = families.filter((family) => !['neutral', 'yellow'].includes(family))
  assert.deepEqual(
    unexpectedFamilies,
    [],
    `${filename} uses colors outside neutral and yellow: ${JSON.stringify(palette)}`
  )
  if (!screenshotDirectory) return
  await mkdir(screenshotDirectory, { recursive: true })
  await page.screenshot({
    animations: 'disabled',
    path: join(screenshotDirectory, filename)
  })
}

async function launchCourseCompanion(environment = {}) {
  return electron.launch({
    executablePath: electronExecutable,
    args: [mainEntry],
    env: {
      ...process.env,
      COURSE_COMPANION_USER_DATA_DIR: userDataDirectory,
      COURSE_COMPANION_WORKSPACE_ROOT: practiceWorkspace.root,
      COURSE_COMPANION_FAKE_CODEX: '1',
      COURSE_COMPANION_FAKE_CONFIGURATION_READY: '1',
      COURSE_COMPANION_FAKE_TEACHER_LIVE_MODE: '1',
      COURSE_COMPANION_FAKE_TEACHER_FAIL_ONCE: '1',
      ...environment
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
    .getByText('Planning và PRD trước khi code với AI', { exact: true })
    .waitFor()
  await page.getByText('MODULE 1 · 3 BÀI HỌC', { exact: true }).waitFor()
  await page.getByText('MODULE 2 · 5 BÀI HỌC', { exact: true }).waitFor()
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

async function verifyContentReviewMode(page) {
  const statePath = join(userDataDirectory, 'learner-state.json')
  const before = await readFile(statePath, 'utf8')
  await page.getByRole('button', { name: 'Duyệt nội dung Module 4', exact: true }).click()
  await page.getByText('MODULE 4 · BÀI 1/5 · TRANG 1/2', { exact: true }).first().waitFor()
  assert.equal(await page.locator('.pixel-content-review-notice, .pixel-review-notice, .pixel-content-review-exit').count(), 0)
  assert.equal(await page.getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true }).count(), 0)
  await capture(page, 'module-4-content-review.png')

  await page.setViewportSize({ width: 390, height: 844 })
  const narrowWidths = await page.evaluate(() => ({
    body: globalThis.document.body.scrollWidth,
    document: globalThis.document.documentElement.scrollWidth,
    viewport: globalThis.innerWidth
  }))
  assert.equal(narrowWidths.body, narrowWidths.viewport)
  assert.equal(narrowWidths.document, narrowWidths.viewport)
  await capture(page, 'module-4-content-review-390px.png')
  await page.setViewportSize({ width: 1180, height: 780 })

  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await answerAssessmentGroup(page, 'release-validation-retrieval')
  await page.getByText('KIỂM TRA TRƯỚC MỌI HÀNH ĐỘNG MẠNG', { exact: true }).waitFor()
  await page.locator('.pixel-brand').click()
  await page.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  assert.equal(await readFile(statePath, 'utf8'), before)
}

let firstLaunch
let resumedLaunch
let chatHistoryLaunch
let portfolioLaunch

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
  assert.equal(welcomeSurface.panelBackground, 'rgba(0, 0, 0, 0.97)')
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
    .getByRole('button', { name: 'Quay lại trang đang học', exact: true })
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-review-notice').count(), 0)
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
    .getByRole('button', { name: 'Bắt đầu Module 1', exact: true })
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(
    await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(),
    'Khóa học này dành cho người mới muốn học cách làm việc cùng coding agent, kể cả khi bạn chưa biết lập trình. Sau khi học, bạn sẽ được thực hành bằng cách xây dựng Portfolio cá nhân. Trong quá trình xây dựng Portfolio, bạn cũng sẽ được học những kỹ năng chuyển đổi để có thể áp dụng cho bất kỳ coding agents nào, với bất kỳ ứng dụng nào bạn muốn.'
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
      .getByRole('button', { name: 'Bắt đầu Module 1', exact: true })
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
    .getByRole('button', { name: 'Bắt đầu Module 1', exact: true })
    .click()
  await verifyHomeBase(firstWindows.learningPage)
  await completeSetupModule(firstWindows.learningPage, firstWindows.companionPage, firstLaunch, true)
  assert.equal(await fingerprintTree(practiceWorkspace.canonicalStarter), canonicalStarterFingerprint)
  await verifyHomeBase(firstWindows.learningPage)
  await verifyContentReviewMode(firstWindows.learningPage)
  await firstWindows.learningPage
    .getByRole('button', { name: /MODULE 2.*MỞ BÀI HỌC/ })
    .click()
  await firstWindows.learningPage
    .getByText('Vì sao cần planning trước khi bắt tay vào xây?', { exact: true })
    .waitFor()
  await firstWindows.learningPage
    .getByText('MODULE 2 · PHẦN 1/5', { exact: true })
    .first()
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(), approvedModuleTwoOpening)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.portfolio-workspace-picker').count(), 0)
  const desktopHudBounds = await firstWindows.learningPage.locator('.pixel-hud').boundingBox()
  const desktopOutlineBounds = await firstWindows.learningPage.locator('.pixel-outline').boundingBox()
  const desktopActionsBounds = await firstWindows.learningPage.locator('.pixel-hud-actions').boundingBox()
  assert.ok(desktopHudBounds)
  assert.ok(desktopOutlineBounds)
  assert.ok(desktopActionsBounds)
  assert.ok(desktopActionsBounds.x > desktopOutlineBounds.x + desktopOutlineBounds.width)
  assert.ok(Math.abs((desktopActionsBounds.x + desktopActionsBounds.width) - (desktopHudBounds.x + desktopHudBounds.width - 22)) <= 2)
  await firstWindows.learningPage.locator('.pixel-outline summary').click()
  assert.equal(await firstWindows.learningPage.locator('.pixel-outline-menu li').count(), 5)
  assert.equal(await firstWindows.learningPage.locator('.pixel-outline-menu li.is-active').count(), 1)
  await capture(firstWindows.learningPage, 'module-2-opening.png')
  await firstWindows.learningPage.locator('.pixel-outline summary').click()
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
    const narrowOutlineBounds = await firstWindows.learningPage.locator('.pixel-outline').boundingBox()
    const narrowActionsBounds = await firstWindows.learningPage.locator('.pixel-hud-actions').boundingBox()
    assert.ok(narrowOutlineBounds)
    assert.ok(narrowActionsBounds)
    assert.ok(narrowActionsBounds.x > narrowOutlineBounds.x)
    assert.equal(await firstWindows.learningPage.getByRole('button', { name: 'HỎI TRIẾT', exact: true }).isVisible(), true)
    assert.equal(await firstWindows.learningPage.getByRole('button', { name: 'THOÁT', exact: true }).isVisible(), true)
    await firstWindows.learningPage.locator('.pixel-outline summary').click()
    await capture(firstWindows.learningPage, 'module-2-opening-390px.png')
    await firstWindows.learningPage.locator('.pixel-outline summary').click()
    const narrowContinueButton = firstWindows.learningPage
      .getByRole('button', { name: 'Tiếp tục', exact: true })
    await narrowContinueButton.scrollIntoViewIfNeeded()
    const narrowContinueBounds = await narrowContinueButton.boundingBox()
    assert.ok(narrowContinueBounds)
    assert.ok(narrowContinueBounds.y >= 0)
    assert.ok(
      narrowContinueBounds.y + narrowContinueBounds.height <= 845,
      `Expected Module 2 continue button inside 390 × 844 viewport, got ${JSON.stringify(narrowContinueBounds)}`
    )
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await firstWindows.learningPage.getByText('Giữ quyết định về sản phẩm trước khi chọn cách xây', { exact: true }).waitFor()
  await firstWindows.learningPage.locator('.pixel-outline summary').click()
  assert.equal(await firstWindows.learningPage.locator('.pixel-outline-menu li.is-complete').count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.pixel-outline-menu li.is-active').count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.pixel-outline-menu li.is-upcoming').count(), 3)
  await capture(firstWindows.learningPage, 'module-2-part-2-outline.png')
  await firstWindows.learningPage.locator('.pixel-outline summary').click()
  await openModuleTwoPortfolioWorkspace(firstWindows.learningPage, 4)
  await firstWindows.learningPage.getByText('MODULE 2 · PHẦN 5/5', { exact: true }).first().waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-dialogue > p').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.portfolio-workspace-picker').count(), 1)
  await capture(firstWindows.learningPage, 'module-2-portfolio-workspace-entry.png')
  await firstLaunch.close()
  firstLaunch = undefined

  resumedLaunch = await launchCourseCompanion({
    COURSE_COMPANION_TEST_PORTFOLIO_WORKSPACE: learningPortfolioWorkspaceDirectory
  })
  const { learningPage, companionPage } = await loadWindows(resumedLaunch)

  await learningPage
    .getByRole('heading', { name: 'Tiếp tục đúng nơi bạn dừng lại' })
    .waitFor()
  await learningPage
    .getByText('Tạo bản mô tả ngắn cho portfolio', { exact: true })
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
  await learningPage.getByRole('button', { name: 'Bắt đầu Module 1', exact: true }).click()
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
    .getByText('Vì sao cần planning trước khi bắt tay vào xây?', { exact: true })
    .waitFor()
  assert.equal(await learningPage.locator('.pixel-dialogue > p').textContent(), approvedModuleTwoOpening)
  await openModuleTwoPortfolioWorkspace(learningPage)
  assert.equal(await learningPage.locator('.pixel-scene-title').count(), 1)
  assert.equal(await learningPage.locator('.pixel-consequence').count(), 0)

  await learningPage.getByRole('button', { name: 'Chọn thư mục', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Tạo thư mục planning', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục với thư mục này', exact: true }).click()

  await learningPage.getByText('MỤC TIÊU → NGƯỜI XEM → HÀNH ĐỘNG', { exact: true }).waitFor()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByText('VÍ DỤ · MAI', { exact: true }).waitFor()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await answerAssessmentGroup(learningPage, 'brief-retrieval')

  await learningPage.getByText('CÓ THẬT? · CÓ ĐƯỢC CÔNG KHAI?', { exact: true }).waitFor()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await answerAssessmentGroup(learningPage, 'evidence-retrieval')

  await learningPage.getByText('URL · ẢNH CHỤP · RANH GIỚI', { exact: true }).waitFor()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await answerAssessmentGroup(learningPage, 'reference-retrieval')

  await learningPage.getByText('YÊU CẦU · RANH GIỚI · TIÊU CHÍ', { exact: true }).waitFor()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await answerAssessmentGroup(learningPage, 'prd-retrieval')

  await learningPage.getByText('MAP · PLAN · FIRST TASK', { exact: true }).waitFor()
  await capture(learningPage, 'module-2-implementation-contract.png')
  if (screenshotDirectory) {
    await learningPage.setViewportSize({ width: 390, height: 844 })
    const moduleTwoNarrowWidths = await learningPage.evaluate(() => {
      const browserDocument = globalThis.document
      return {
        body: browserDocument.body.scrollWidth,
        document: browserDocument.documentElement.scrollWidth,
        viewport: globalThis.innerWidth
      }
    })
    assert.equal(moduleTwoNarrowWidths.body, moduleTwoNarrowWidths.viewport)
    assert.equal(moduleTwoNarrowWidths.document, moduleTwoNarrowWidths.viewport)
    await capture(learningPage, 'module-2-implementation-contract-390px.png')
    await learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await answerAssessmentGroup(learningPage, 'planning-retrieval')

  await learningPage
    .getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true })
    .click()
  await learningPage.locator('.practice-brief-overlay').waitFor()
  await learningPage.getByRole('heading', { name: /Dùng một task Codex duy nhất/ }).waitFor()
  await learningPage.getByRole('button', { name: 'Bắt đầu Practice mới', exact: true }).waitFor()
  await capture(learningPage, 'module-2-portfolio-practice-brief.png')
  await learningPage.getByRole('button', { name: 'Đóng trang Practice', exact: true }).click()

  await learningPage.evaluate(async () => {
    const loaded = await globalThis.courseCompanion?.loadProgress()
    if (!loaded || (loaded.status !== 'returning' && loaded.status !== 'recovered')) {
      throw new Error('Expected current progress before mastery seed')
    }
    await globalThis.courseCompanion?.saveProgress({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-implementation-contract',
      checkpointId: 'm2-portfolio-mastery',
      sceneId: 'module-2-portfolio-mastery',
      sceneHistory: [...loaded.progress.sceneHistory, loaded.progress.sceneId].slice(-200),
      completedCheckpointIds: [...new Set([
        ...loaded.progress.completedCheckpointIds,
        'm2-portfolio-brief',
        'm2-content-evidence-inventory',
        'm2-visual-reference',
        'm2-portfolio-prd',
        'm2-implementation-contract',
        'm2-portfolio-planning'
      ])],
      decisions: {
        ...loaded.progress.decisions,
        portfolioPlanningPractice: 'five-current-stage-receipts'
      }
    })
  })
  await learningPage.reload()
  await learningPage.getByRole('heading', { name: 'Tiếp tục đúng nơi bạn dừng lại' }).waitFor()
  await learningPage.getByRole('button', { name: 'Mở Course Companion', exact: true }).click()
  await learningPage.getByRole('button', { name: /MODULE 2.*MỞ BÀI HỌC/ }).click()
  await learningPage.getByText('6 TÌNH HUỐNG · 4 CÂU TỪ ARTIFACT', { exact: true }).waitFor()
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await answerAssessmentGroup(learningPage, 'final-assessment')
  await learningPage.getByText('Bạn đã trả lời 10/10 câu.', { exact: false }).waitFor()
  await capture(learningPage, 'module-2-portfolio-mastery-summary.png')

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
  assert.equal(persisted.sceneId, 'module-2-portfolio-mastery-summary')
  assert.equal(persisted.checkpointId, 'm2-portfolio-mastery')
  assert.equal(persisted.schemaVersion, 6)
  assert.equal(persisted.courseVersion, '0.3.0')
  assert.equal(persisted.currentCourseLessonId, 'm2-implementation-contract')
  assert.ok(persisted.sceneHistory.length > 10)
  assert.equal(persisted.decisions.portfolioPlanningPractice, 'five-current-stage-receipts')
  assert.equal(persisted.decisions.setupPractice, 'teacher-reviewed-setup')
  assert.equal(persisted.decisions.setupMastery, 'passed-three-of-four')
  assert.equal(persisted.decisions.masteryEvidence, undefined)
  assert.equal(
    Object.entries(persisted.decisions).filter(
      ([key, value]) => key.startsWith('assessment:mastery-') && String(value).startsWith('correct')
    ).length,
    10
  )
  assert.equal(persisted.practice.status, 'idle')

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
  await historyWindows.learningPage.evaluate(async () => {
    await globalThis.courseCompanion?.resetProgress()
    await globalThis.courseCompanion?.saveProgress({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-brief',
      sceneId: 'module-2-portfolio-workspace',
      sceneHistory: [],
      completedCheckpointIds: [],
      decisions: {}
    })
  })
  await historyWindows.companionPage.getByRole('button', { name: 'Thoát ứng dụng' }).click()
  await chatHistoryLaunch.waitForEvent('close')
  chatHistoryLaunch = undefined
  assert.equal(
    await fingerprintTree(practiceWorkspace.canonicalStarter),
    canonicalStarterFingerprint
  )

  portfolioLaunch = await launchCourseCompanion({
    COURSE_COMPANION_TEST_PORTFOLIO_WORKSPACE: portfolioWorkspaceDirectory
  })
  const portfolioWindows = await loadWindows(portfolioLaunch)
  await portfolioWindows.learningPage
    .getByRole('heading', { name: 'Tiếp tục đúng nơi bạn dừng lại' })
    .waitFor()
  await portfolioWindows.learningPage
    .getByRole('button', { name: 'Mở Course Companion', exact: true })
    .click()
  await portfolioWindows.learningPage
    .getByRole('button', { name: /MODULE 2.*MỞ BÀI HỌC/ })
    .click()
  await portfolioWindows.learningPage
    .getByText('Vì sao cần planning trước khi bắt tay vào xây?', { exact: true })
    .waitFor()
  assert.equal(await portfolioWindows.learningPage.locator('.pixel-dialogue > p').textContent(), approvedModuleTwoOpening)
  await openModuleTwoPortfolioWorkspace(portfolioWindows.learningPage)
  assert.deepEqual(await readdir(portfolioWorkspaceDirectory), [])
  await capture(portfolioWindows.learningPage, 'portfolio-workspace-unselected.png')

  await portfolioWindows.learningPage
    .getByRole('button', { name: 'Chọn thư mục', exact: true })
    .click()
  await portfolioWindows.learningPage
    .getByRole('button', { name: 'Tạo thư mục planning', exact: true })
    .waitFor()
  assert.deepEqual(await readdir(portfolioWorkspaceDirectory), [])
  await capture(portfolioWindows.learningPage, 'portfolio-workspace-confirmation.png')

  await portfolioWindows.learningPage.setViewportSize({ width: 390, height: 844 })
  const portfolioNarrowWidths = await portfolioWindows.learningPage.evaluate(() => ({
    body: globalThis.document.body.scrollWidth,
    document: globalThis.document.documentElement.scrollWidth,
    viewport: globalThis.innerWidth
  }))
  assert.equal(portfolioNarrowWidths.body, portfolioNarrowWidths.viewport)
  assert.equal(portfolioNarrowWidths.document, portfolioNarrowWidths.viewport)
  await capture(portfolioWindows.learningPage, 'portfolio-workspace-confirmation-390px.png')
  await portfolioWindows.learningPage.setViewportSize({ width: 1180, height: 780 })

  await portfolioWindows.learningPage
    .getByRole('button', { name: 'Tạo thư mục planning', exact: true })
    .click()
  await portfolioWindows.learningPage
    .getByRole('heading', { name: 'Thư mục portfolio đã sẵn sàng', exact: true })
    .waitFor()
  assert.deepEqual(await readdir(portfolioWorkspaceDirectory), ['planning'])
  await capture(portfolioWindows.learningPage, 'portfolio-workspace-ready.png')
  await portfolioLaunch.close()
  portfolioLaunch = undefined

  console.log(
    'Electron smoke: frozen course regression, portfolio workspace consent, responsive layout, review-safe back navigation, roadmap entry, Teacher overlay, settings, journey resume/reset, in-app mock Practice, mastery, persistence, security, and companion lifecycle passed'
  )
} finally {
  await firstLaunch?.close().catch(() => undefined)
  await resumedLaunch?.close().catch(() => undefined)
  await chatHistoryLaunch?.close().catch(() => undefined)
  await portfolioLaunch?.close().catch(() => undefined)
  await rm(userDataDirectory, { recursive: true, force: true })
  await rm(portfolioWorkspaceDirectory, { recursive: true, force: true })
  await rm(learningPortfolioWorkspaceDirectory, { recursive: true, force: true })
  await practiceWorkspace.cleanup()
}
