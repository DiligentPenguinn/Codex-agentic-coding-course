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
const learningPortfolioWorkspaceDirectory = await mkdtemp(join(tmpdir(), 'portfolio hành trình module 2-'))
const screenshotDirectory = process.env.COURSE_COMPANION_SCREENSHOT_DIR
const screenshotFilter = process.env.COURSE_COMPANION_SCREENSHOT_FILTER
const contentReviewOnly = process.env.COURSE_COMPANION_CONTENT_REVIEW_ONLY === '1'
const setupQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-1.quiz.json'), 'utf8')
)
const planningQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-2.quiz.json'), 'utf8')
)
const buildQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-3.quiz.json'), 'utf8')
)
const releaseQuiz = JSON.parse(
  await readFile(join(process.cwd(), '..', 'pilot-workspace', 'course', 'quizzes', 'module-4.quiz.json'), 'utf8')
)
const approvedModuleTwoOpening = 'Sau khi hoàn thành module 1, hy vọng các bạn đã hiểu hơn về cách sử dụng Codex. Đầu tiên, chúng ta sẽ cùng tìm hiểu về cách planning khi sử dụng Coding agents. Nhiều bạn mới bắt đầu code với AI thường bỏ qua phần lên kế hoạch mà nhảy thẳng vào phần thực thi. Các bạn ấy nghĩ rằng mình đang tiết kiệm thời gian, nhưng thực chất các bạn đang lầm. Nếu có một kế hoạch tốt trước khi bắt đầu xây sản phẩm. Bạn sẽ tiết kiệm được biết bao thời gian debug và sửa lại từ đầu vì không đúng ý. Tin mình đi, mình đã phạm phải sai lầm này và đã phải trả giá.'
const approvedImplementationPlanIntro = 'Vậy, sau khi có PRD rồi thì làm gì? Ta sẽ tạo implementation plan.\n\nImplementation plan về căn bản sẽ viết ra những bước chi tiết để coding agent có thể hiện thực hoá PRD. Bạn có thể hiểu nếu PRD là bản kế hoạch tổng quan, thì implementation plan sẽ ghi chi tiết từng bước để thực hiện kế hoạch đó.\n\nThông thường một implementation plan sẽ được chia ra thành nhiều giai đoạn. Mỗi giai đoạn sẽ có tiêu chí hoàn thành rõ ràng.\n\nThường agent tạo PRD và Implementation plan khá tốt nên bạn chỉ cần bảo nó tạo rồi duyệt là được.'
const approvedPracticeTransitionCopy = 'Okay, không để các bạn đợi lâu nữa, bây giờ các bạn có thể qua Codex để tiếp tục thực hành rồi. Trước khi bấm chuyển sang Codex để thực hành, hãy copy prompt ở gốc trên bên phải để tẹo nữa paste vào Codex nha'
const approvedPortfolioPracticePrompt = 'Tôi muốn xây dựng một portfolio cá nhân nhưng chưa biết nên bắt đầu từ đâu. Hãy giúp tôi lập kế hoạch từ đầu bằng cách phỏng vấn tôi từng câu một. Trước tiên, hãy tìm hiểu mục tiêu của portfolio, người tôi muốn thuyết phục, nội dung tôi có thể đưa vào và phiên bản đầu tiên nên gồm những gì. Nếu tôi chưa chắc về câu trả lời, hãy đưa ra một vài lựa chọn dễ hiểu để tôi cân nhắc. Sau mỗi phần quan trọng, hãy tóm tắt những gì đã thống nhất và chờ tôi xác nhận trước khi tiếp tục. Trong quá trình này, chỉ tạo hoặc cập nhật tài liệu trong thư mục planning; chưa viết code, cài gói phụ thuộc hay tạo ứng dụng.'
const approvedPortfolioMasteryTransitionCopy = 'Hãy cùng ôn tập lại kiến thức một chút nhen'
const designReferenceLinks = [
  ['Pafolios', 'https://pafolios.com/'],
  ['Awwwards', 'https://www.awwwards.com/'],
  ['Dribbble', 'https://dribbble.com/'],
  ['Mobbin', 'https://mobbin.com/'],
  ['Pinterest', 'https://www.pinterest.com/']
]
async function openModuleTwoPractice(page, stepsRemaining = 5) {
  for (let index = 0; index < stepsRemaining; index += 1) {
    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  }
  await page.getByText(approvedPracticeTransitionCopy, { exact: true }).waitFor()
}

function assessmentGroup(groupId) {
  if (groupId === 'setup-final-assessment') {
    return {
      id: groupId,
      mode: 'mastery',
      questions: setupQuiz.questions
    }
  }
  const group = [...planningQuiz.groups, ...buildQuiz.groups, ...releaseQuiz.groups]
    .find((candidate) => candidate.id === groupId)
  assert.ok(group, `Expected assessment group ${groupId}`)
  return group
}

async function answerAssessmentGroup(page, groupId, { retryFirstChoice = false } = {}) {
  const group = assessmentGroup(groupId)
  for (const question of group.questions) {
    await page.getByText(question.prompt, { exact: true }).waitFor()
  }
  assert.equal(await page.locator('.pixel-assessment-question').count(), group.questions.length)
  assert.equal(await page.locator('.pixel-assessment-source').count(), 0)
  assert.equal(await page.locator('.pixel-scene-title').count(), 0)
  assert.equal(await page.locator('.pixel-dialogue.has-assessment > .pixel-speaker').count(), 0)
  assert.equal(await page.locator('.pixel-dialogue.has-assessment > p').count(), 0)
  assert.equal(await page.locator('.pixel-assessment-header').count(), 0)
  assert.equal(await page.locator('.pixel-dialogue.has-assessment[aria-label^="Câu hỏi Module"]').count(), 1)
  await capture(page, `${groupId}-questions-only.png`)

  if (retryFirstChoice) {
    const assessmentLayout = await page.evaluate(() => {
      const hud = globalThis.document.querySelector('.pixel-hud')
      const dialogue = globalThis.document.querySelector('.pixel-dialogue.has-assessment.has-no-scene-title')
      const backButton = globalThis.document.querySelector('.pixel-dialogue.has-assessment > .pixel-page-back')
      const questions = [...globalThis.document.querySelectorAll('.pixel-assessment-question')]
      const firstQuestion = questions[0]
      if (!hud || !dialogue || !backButton || !firstQuestion) {
        return { backPosition: null, contentGap: null, questionGap: null, overlapsQuestion: true }
      }
      const hudBounds = hud.getBoundingClientRect()
      const dialogueBounds = dialogue.getBoundingClientRect()
      const backBounds = backButton.getBoundingClientRect()
      const firstQuestionBounds = firstQuestion.getBoundingClientRect()
      return {
        backPosition: globalThis.getComputedStyle(backButton).position,
        contentGap: dialogueBounds.top - hudBounds.bottom,
        questionGap: firstQuestionBounds.top - dialogueBounds.top,
        overlapsQuestion: questions.some((question) => {
          const questionBounds = question.getBoundingClientRect()
          return backBounds.left < questionBounds.right
            && backBounds.right > questionBounds.left
            && backBounds.top < questionBounds.bottom
            && backBounds.bottom > questionBounds.top
        })
      }
    })
    assert.equal(assessmentLayout.backPosition, 'static')
    assert.ok(assessmentLayout.contentGap !== null && assessmentLayout.contentGap <= 24)
    assert.ok(assessmentLayout.questionGap !== null && assessmentLayout.questionGap <= 24)
    assert.equal(assessmentLayout.overlapsQuestion, false)
    await capture(page, 'module-2-assessment-group.png')
    await page.setViewportSize({ width: 390, height: 844 })
    const assessmentWidths = await page.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(assessmentWidths.body, assessmentWidths.viewport)
    assert.equal(assessmentWidths.document, assessmentWidths.viewport)
    const narrowAssessmentLayout = await page.evaluate(() => {
      const hud = globalThis.document.querySelector('.pixel-hud')
      const dialogue = globalThis.document.querySelector('.pixel-dialogue.has-assessment.has-no-scene-title')
      const backButton = globalThis.document.querySelector('.pixel-dialogue.has-assessment > .pixel-page-back')
      const firstQuestion = globalThis.document.querySelector('.pixel-assessment-question')
      if (!hud || !dialogue || !backButton || !firstQuestion) {
        return { contentGap: null, questionGap: null, overlapsQuestion: true }
      }
      const hudBounds = hud.getBoundingClientRect()
      const dialogueBounds = dialogue.getBoundingClientRect()
      const backBounds = backButton.getBoundingClientRect()
      const firstQuestionBounds = firstQuestion.getBoundingClientRect()
      return {
        contentGap: dialogueBounds.top - hudBounds.bottom,
        questionGap: firstQuestionBounds.top - dialogueBounds.top,
        overlapsQuestion: [...globalThis.document.querySelectorAll('.pixel-assessment-question')].some((question) => {
          const questionBounds = question.getBoundingClientRect()
          return backBounds.left < questionBounds.right
            && backBounds.right > questionBounds.left
            && backBounds.top < questionBounds.bottom
            && backBounds.bottom > questionBounds.top
        })
      }
    })
    assert.ok(narrowAssessmentLayout.contentGap !== null && narrowAssessmentLayout.contentGap <= 24)
    assert.ok(narrowAssessmentLayout.questionGap !== null && narrowAssessmentLayout.questionGap <= 24)
    assert.equal(narrowAssessmentLayout.overlapsQuestion, false)
    await page.locator('.pixel-assessment-question').first().scrollIntoViewIfNeeded()
    await capture(page, 'module-2-assessment-group-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }

  let firstChoiceQuestion
  const answerQuestions = async (answerFirstChoiceIncorrectly) => {
    for (const question of group.questions) {
      const questionCard = page.locator('.pixel-assessment-question').filter({ hasText: question.prompt })
      if (question.type === 'multiple-choice') {
        const answerIndex = answerFirstChoiceIncorrectly && !firstChoiceQuestion
          ? (question.answerIndex + 1) % question.choices.length
          : question.answerIndex
        if (!firstChoiceQuestion) firstChoiceQuestion = question
        await questionCard.getByRole('button', { name: question.choices[answerIndex], exact: true }).click()
      } else {
        await questionCard.getByRole('textbox', { name: 'Câu trả lời của bạn' }).fill(
          `Câu trả lời do người học tự viết để đáp ứng các tiêu chí công khai của câu ${question.id}.`
        )
      }
    }
  }

  await answerQuestions(retryFirstChoice)
  await page.getByRole('button', { name: `Nộp ${group.questions.length} câu trả lời`, exact: true }).click()

  if (group.id === 'final-assessment') {
    await page.getByText(`Bạn đã trả lời ${group.questions.length}/${group.questions.length} câu`, { exact: false }).waitFor()
    assert.equal(await page.getByRole('button', { name: `Xem kết quả ${group.questions.length} câu`, exact: true }).count(), 0)
    if (retryFirstChoice) {
      await page.getByRole('button', { name: `Làm lại ${group.questions.length} câu`, exact: true }).click()
      for (const question of group.questions) {
        await page.getByText(question.prompt, { exact: true }).waitFor()
      }
      await answerQuestions(false)
      await page.getByRole('button', { name: `Nộp ${group.questions.length} câu trả lời`, exact: true }).click()
      await page.getByText(`Bạn đã trả lời ${group.questions.length}/${group.questions.length} câu`, { exact: false }).waitFor()
    }
    return
  }

  if (retryFirstChoice && firstChoiceQuestion) {
    const retryButton = page.getByRole('button', { name: 'Chọn lại câu chưa đúng', exact: true })
    await retryButton.waitFor()
    await retryButton.scrollIntoViewIfNeeded()
    await capture(page, 'module-2-assessment-feedback-retry.png')
    await retryButton.click()
    const firstQuestionCard = page.locator('.pixel-assessment-question').filter({ hasText: firstChoiceQuestion.prompt })
    await firstQuestionCard.getByRole('button', {
      name: firstChoiceQuestion.choices[firstChoiceQuestion.answerIndex],
      exact: true
    }).click()
    await page.getByRole('button', { name: `Nộp ${group.questions.length} câu trả lời`, exact: true }).click()
    assert.equal(await page.getByRole('button', { name: 'Chọn lại câu chưa đúng', exact: true }).count(), 0)
  }

  for (const question of group.questions) {
    const questionCard = page.locator('.pixel-assessment-question').filter({ hasText: question.prompt })
    const sourcePanel = questionCard.locator('.pixel-assessment-source')
    assert.equal(await sourcePanel.count(), 0)
    if (question.type !== 'multiple-choice') {
      await questionCard.getByRole('button', { name: 'Câu trả lời đáp ứng đủ tiêu chí', exact: true }).click()
    }
  }

  const continueLabel = group.mode === 'mastery'
    ? `Xem kết quả ${group.questions.length} câu`
    : 'Tiếp tục bài học'
  await page.getByRole('button', { name: continueLabel, exact: true }).click()
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
  await page.getByText('MODULE 1 · BÀI 2/3 · TRANG 1/3', { exact: true }).first().waitFor()
  const agentsBoard = page.locator('.pixel-guidance-board.is-agents')
  await agentsBoard.waitFor()
  assert.match(await agentsBoard.textContent(), /AGENTS\.md - bộ quy luật cho coding agents/)
  assert.match(await agentsBoard.textContent(), /Vậy, giả dụ có một thông tin mình muốn agent ghi nhớ/)
  assert.match(await agentsBoard.textContent(), /GLOBAL/)
  assert.match(await agentsBoard.textContent(), /CURRENT REPO/)
  assert.doesNotMatch(await agentsBoard.textContent(), /Bạn sẽ tạo Current repo AGENTS\.md.*Module 2/)
  assert.equal(await agentsBoard.locator('figure, img').count(), 0)
  const agentsCopyBounds = await agentsBoard.locator('.pixel-guidance-board__copy').boundingBox()
  const agentsLevelsBounds = await agentsBoard.locator('.pixel-agents-levels').boundingBox()
  assert.ok(agentsCopyBounds)
  assert.ok(agentsLevelsBounds)
  assert.ok(agentsLevelsBounds.y >= agentsCopyBounds.y + agentsCopyBounds.height)
  await capture(page, 'module-1-agents-introduction.png')
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const agentsNarrowWidths = await page.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(agentsNarrowWidths.body, agentsNarrowWidths.viewport)
    assert.equal(agentsNarrowWidths.document, agentsNarrowWidths.viewport)
    const agentsLevelCards = agentsBoard.locator('.pixel-agents-levels article')
    const globalLevelBounds = await agentsLevelCards.nth(0).boundingBox()
    const repoLevelBounds = await agentsLevelCards.nth(1).boundingBox()
    assert.ok(globalLevelBounds)
    assert.ok(repoLevelBounds)
    assert.ok(repoLevelBounds.y >= globalLevelBounds.y + globalLevelBounds.height)
    await capture(page, 'module-1-agents-introduction-390px.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 2/3 · TRANG 2/3', { exact: true }).first().waitFor()
  const skillBoard = page.locator('.pixel-guidance-board.is-skills')
  await skillBoard.waitFor()
  assert.equal(await skillBoard.locator('.pixel-skill-excerpt').count(), 1)
  assert.equal(await skillBoard.locator('figure, img').count(), 0)
  assert.match(await skillBoard.textContent(), /Thông thường ta dùng AGENTS\.md để dạy cho model/)
  assert.match(await skillBoard.textContent(), /Đó là lúc ta sử dụng Skill/)
  assert.match(await skillBoard.textContent(), /name: frontend-design/)
  assert.doesNotMatch(await skillBoard.textContent(), /copywriting/)
  assert.doesNotMatch(await skillBoard.textContent(), /skills\.sh/)
  assert.match(await skillBoard.textContent(), /Bạn vẫn có thể trao đổi với Codex bằng tiếng Việt/)
  const skillKickerTypography = await skillBoard.locator('.pixel-guidance-board__skill-kicker').evaluate((element) => {
    const skillName = element.querySelector('strong')
    const skillDescription = element.querySelector('span')
    if (!skillName || !skillDescription) return null
    return {
      name: Number.parseFloat(globalThis.getComputedStyle(skillName).fontSize),
      description: Number.parseFloat(globalThis.getComputedStyle(skillDescription).fontSize)
    }
  })
  assert.ok(skillKickerTypography)
  assert.ok(skillKickerTypography.name > skillKickerTypography.description)
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const skillsNarrowWidths = await page.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(skillsNarrowWidths.body, skillsNarrowWidths.viewport)
    assert.equal(skillsNarrowWidths.document, skillsNarrowWidths.viewport)
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 2/3 · TRANG 3/3', { exact: true }).first().waitFor()
  const portfolioSkillsBoard = page.locator('.pixel-guidance-board.is-skills-portfolio')
  await portfolioSkillsBoard.waitFor()
  assert.equal(await portfolioSkillsBoard.locator('.pixel-skill-excerpt').count(), 0)
  assert.match(await portfolioSkillsBoard.textContent(), /Hai skill bạn sẽ dùng để xây portfolio/)
  assert.match(await portfolioSkillsBoard.textContent(), /frontend-design/)
  assert.match(await portfolioSkillsBoard.textContent(), /copywriting/)
  assert.match(await portfolioSkillsBoard.textContent(), /skills\.sh/)
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const portfolioSkillsNarrowWidths = await page.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(portfolioSkillsNarrowWidths.body, portfolioSkillsNarrowWidths.viewport)
    assert.equal(portfolioSkillsNarrowWidths.document, portfolioSkillsNarrowWidths.viewport)
    const portfolioSkillCards = portfolioSkillsBoard.locator('.pixel-guidance-board__skills article')
    const frontendSkillBounds = await portfolioSkillCards.nth(0).boundingBox()
    const copywritingSkillBounds = await portfolioSkillCards.nth(1).boundingBox()
    assert.ok(frontendSkillBounds)
    assert.ok(copywritingSkillBounds)
    assert.ok(copywritingSkillBounds.y >= frontendSkillBounds.y + frontendSkillBounds.height)
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText('MODULE 1 · BÀI 3/3 · TRANG 1/10', { exact: true }).first().waitFor()
  assert.equal(await page.locator('.pixel-harness-board').count(), 0)
  assert.equal(await page.getByText('Dùng cấu hình đã chọn', { exact: true }).count(), 0)
  const practiceBrief = page.locator('[data-practice-id="m1-codex-safe-setup"]')
  await practiceBrief.getByRole('heading', { name: 'MỤC TIÊU', exact: true }).waitFor()
  await practiceBrief.getByRole('heading', { name: 'KẾT QUẢ CẦN NỘP', exact: true }).waitFor()
  await practiceBrief.getByRole('heading', { name: 'ĐIỀU KIỆN ĐẠT', exact: true }).waitFor()
  assert.match(await practiceBrief.textContent(), /Model5.6 Sol/)
  assert.match(await practiceBrief.textContent(), /EffortHigh/)
  assert.match(await practiceBrief.textContent(), /SpeedStandard/)
  assert.match(await practiceBrief.textContent(), /ApprovalApprove for me/)
  assert.match(await practiceBrief.textContent(), /Full accessTắt/)
  await page.getByRole('button', { name: 'Bỏ qua Practice · Duyệt bài trắc nghiệm', exact: true }).waitFor()
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
    const narrowBypassAction = page.getByRole('button', { name: 'Bỏ qua Practice · Duyệt bài trắc nghiệm', exact: true })
    await narrowBypassAction.scrollIntoViewIfNeeded()
    const narrowBypassActionBounds = await narrowBypassAction.boundingBox()
    assert.ok(narrowBypassActionBounds)
    assert.ok(narrowBypassActionBounds.y >= 0)
    assert.ok(narrowBypassActionBounds.y + narrowBypassActionBounds.height <= 844)
    await page.setViewportSize({ width: 1180, height: 780 })
  }

  const progressBeforeBypass = await page.evaluate(async () => globalThis.courseCompanion?.loadProgress())
  await page.getByRole('button', { name: 'Bỏ qua Practice · Duyệt bài trắc nghiệm', exact: true }).click()
  await page.getByText('Bây giờ hãy cùng nhau trả lời các câu hỏi ôn tập để củng cố kiến thức vừa học nhen!', { exact: true }).waitFor()
  assert.equal(await page.locator('.pixel-scene-title').count(), 0)
  assert.equal(await page.locator('.pixel-consequence').count(), 0)
  if (verifyResponsiveLayout) {
    await page.setViewportSize({ width: 390, height: 844 })
    const masteryWidths = await page.evaluate(() => ({
      viewport: globalThis.innerWidth,
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth
    }))
    assert.ok(masteryWidths.body <= masteryWidths.viewport, `Module 1 mastery body overflowed: ${JSON.stringify(masteryWidths)}`)
    assert.ok(masteryWidths.document <= masteryWidths.viewport, `Module 1 mastery document overflowed: ${JSON.stringify(masteryWidths)}`)
    await capture(page, 'module-1-mastery-narrow.png')
    await page.setViewportSize({ width: 1180, height: 780 })
  }
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  const bypassedAssessmentQuestions = page.locator('.pixel-assessment-question')
  await bypassedAssessmentQuestions.first().waitFor()
  assert.equal(await bypassedAssessmentQuestions.count(), 6)
  const moduleOneAssessment = page.getByRole('region', { name: 'Câu hỏi Module 1', exact: true })
  assert.equal(await moduleOneAssessment.locator('.pixel-speaker').count(), 0)
  assert.equal(await moduleOneAssessment.getByText('Bạn có thể xem toàn bộ câu hỏi trước khi nộp.', { exact: true }).count(), 0)
  assert.equal(await page.locator('.pixel-scene-title').count(), 0)
  assert.equal(await moduleOneAssessment.locator('.pixel-assessment-header').count(), 0)
  await capture(page, 'module-1-final-questions.png')
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
  await page.getByText('Bây giờ hãy cùng nhau trả lời các câu hỏi ôn tập để củng cố kiến thức vừa học nhen!', { exact: true }).waitFor()
  assert.equal(await page.locator('.pixel-scene-title').count(), 0)
  assert.equal(await page.locator('.pixel-consequence').count(), 0)
  await capture(page, 'module-1-codex-setup-approved.png')
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await answerAssessmentGroup(page, 'setup-final-assessment')

  await page.getByText(/Bạn đạt 6\/6 câu/).waitFor()
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
  if (!screenshotDirectory || (screenshotFilter && !filename.includes(screenshotFilter))) return
  await mkdir(screenshotDirectory, { recursive: true })
  await page.screenshot({
    animations: 'disabled',
    path: join(screenshotDirectory, filename)
  })
}

async function verifyDesignReferenceLinks(page) {
  for (const [label, href] of designReferenceLinks) {
    const link = page.getByRole('link', { name: label, exact: true })
    assert.equal(await link.count(), 1)
    assert.equal(await link.getAttribute('href'), href)
    assert.equal(await link.getAttribute('target'), '_blank')
    assert.equal(await link.getAttribute('rel'), 'noreferrer')
  }

  const firstLink = page.getByRole('link', { name: 'Pafolios', exact: true })
  const defaultColor = await firstLink.evaluate((element) => globalThis.getComputedStyle(element).color)
  await firstLink.hover()
  await page.waitForTimeout(150)
  const hoverColor = await firstLink.evaluate((element) => globalThis.getComputedStyle(element).color)
  assert.notEqual(hoverColor, defaultColor)
  await page.keyboard.press('Tab')
  await firstLink.focus()
  assert.notEqual(
    await firstLink.evaluate((element) => globalThis.getComputedStyle(element).outlineStyle),
    'none'
  )
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).focus()
}

async function moduleTwoHistoryReviewLayout(page) {
  return page.evaluate(() => {
    const dialogue = globalThis.document.querySelector('.pixel-dialogue.is-module-two-review')?.getBoundingClientRect()
    const dialogueText = globalThis.document.querySelector('.pixel-dialogue.is-module-two-review > p')?.getBoundingClientRect()
    const backButton = globalThis.document.querySelector('.pixel-dialogue.is-module-two-review > .pixel-page-back')?.getBoundingClientRect()
    const returnButton = globalThis.document.querySelector('.pixel-dialogue.is-module-two-review .pixel-review-return .pixel-choice')?.getBoundingClientRect()
    return {
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewportWidth: globalThis.innerWidth,
      viewportHeight: globalThis.innerHeight,
      dialogue: dialogue ? { top: dialogue.top, right: dialogue.right, bottom: dialogue.bottom, left: dialogue.left } : null,
      dialogueText: dialogueText ? { top: dialogueText.top, right: dialogueText.right, bottom: dialogueText.bottom, left: dialogueText.left } : null,
      backButton: backButton ? { top: backButton.top, right: backButton.right, bottom: backButton.bottom, left: backButton.left } : null,
      returnButton: returnButton ? { top: returnButton.top, right: returnButton.right, bottom: returnButton.bottom, left: returnButton.left } : null
    }
  })
}

function assertModuleTwoHistoryReviewLayout(layout, label) {
  assert.equal(layout.body, layout.viewportWidth, `${label} body should not overflow horizontally`)
  assert.equal(layout.document, layout.viewportWidth, `${label} document should not overflow horizontally`)
  assert.ok(layout.dialogue, `${label} should render the Module 2 review dialogue`)
  assert.ok(layout.dialogueText, `${label} should render the review copy`)
  assert.ok(layout.backButton, `${label} should render the previous-page control`)
  assert.ok(layout.returnButton, `${label} should render the return control`)
  assert.ok(layout.dialogue.top >= 16, `${label} should preserve visible space above the lowered dialogue: ${JSON.stringify(layout)}`)
  assert.ok(layout.dialogue.bottom <= layout.viewportHeight, `${label} dialogue should remain inside the viewport: ${JSON.stringify(layout)}`)
  assert.ok(
    Math.abs((layout.dialogueText.left - layout.dialogue.left) - (layout.dialogue.right - layout.dialogueText.right)) <= 2,
    `${label} review copy should be horizontally centered: ${JSON.stringify(layout)}`
  )
  assert.ok(
    Math.abs(layout.backButton.bottom - layout.returnButton.bottom) <= 2,
    `${label} review controls should share one bottom row: ${JSON.stringify(layout)}`
  )
  assert.ok(
    Math.min(layout.backButton.top, layout.returnButton.top) - layout.dialogueText.bottom >= 8,
    `${label} review copy should not overlap the controls: ${JSON.stringify(layout)}`
  )
  assert.ok(layout.backButton.left >= layout.dialogue.left && layout.returnButton.right <= layout.dialogue.right)
  assert.ok(layout.backButton.bottom <= layout.dialogue.bottom && layout.returnButton.bottom <= layout.dialogue.bottom)
}

async function waitForImageDecode(image) {
  await image.evaluate(async (element) => {
    if (!element.complete) {
      await new Promise((resolve, reject) => {
        element.addEventListener('load', resolve, { once: true })
        element.addEventListener('error', reject, { once: true })
      })
    }
    if (typeof element.decode === 'function') await element.decode()
  })
}

async function moduleTwoVisualLayout(page) {
  await waitForImageDecode(page.locator('.pixel-lesson-visual img'))
  return page.evaluate(() => {
    const shell = globalThis.document.querySelector('.pixel-learning-shell')
    const hud = globalThis.document.querySelector('.pixel-hud')?.getBoundingClientRect()
    const title = globalThis.document.querySelector('.pixel-scene-title')?.getBoundingClientRect()
    const titleContent = globalThis.document.querySelector('.pixel-scene-title > strong')?.getBoundingClientRect()
    const titleElement = globalThis.document.querySelector('.pixel-scene-title')
    const titleStyle = titleElement ? globalThis.getComputedStyle(titleElement) : null
    const visual = globalThis.document.querySelector('.pixel-lesson-visual')?.getBoundingClientRect()
    const teacher = globalThis.document.querySelector('.pixel-teacher-character')?.getBoundingClientRect()
    const dialogue = globalThis.document.querySelector('.pixel-dialogue')?.getBoundingClientRect()
    const dialogueText = globalThis.document.querySelector('.pixel-dialogue > p')?.getBoundingClientRect()
    const actions = globalThis.document.querySelector('.pixel-lesson-actions.is-paired')?.getBoundingClientRect()
    return {
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth,
      viewportHeight: globalThis.innerHeight,
      hasSharedGrid: shell?.classList.contains('has-module-two-visual-dialogue') ?? false,
      titleTrailingSpace: title && titleContent ? title.bottom - titleContent.bottom : null,
      titleExpectedTrailingSpace: titleStyle
        ? Number.parseFloat(titleStyle.paddingBottom) + Number.parseFloat(titleStyle.borderBottomWidth)
        : null,
      titleToVisualGap: title && visual ? visual.top - title.bottom : null,
      visualToDialogueGap: visual && dialogue ? dialogue.top - visual.bottom : null,
      teacherToDialogueGap: teacher && dialogue ? dialogue.top - teacher.bottom : null,
      topWhitespace: hud && title && teacher ? Math.min(title.top, teacher.top) - hud.bottom : null,
      bottomWhitespace: dialogue ? globalThis.innerHeight - dialogue.bottom : null,
      dialogueTextLeftInset: dialogue && dialogueText ? dialogueText.left - dialogue.left : null,
      dialogueTextRightInset: dialogue && dialogueText ? dialogue.right - dialogueText.right : null,
      dialogueActionGap: dialogueText && actions ? actions.top - dialogueText.bottom : null,
      shellClientHeight: shell?.clientHeight ?? null,
      shellScrollHeight: shell?.scrollHeight ?? null
    }
  })
}

function assertModuleTwoVisualLayout(layout, label, minimumGap, { expectBalanced = false } = {}) {
  assert.equal(layout.body, layout.viewport, `${label} body should not overflow horizontally`)
  assert.equal(layout.document, layout.viewport, `${label} document should not overflow horizontally`)
  assert.equal(layout.hasSharedGrid, true, `${label} should use the shared visual/dialogue grid`)
  assert.ok(
    layout.titleTrailingSpace !== null
      && layout.titleExpectedTrailingSpace !== null
      && Math.abs(layout.titleTrailingSpace - layout.titleExpectedTrailingSpace) <= 1,
    `${label} title should end at its intended bottom padding, got ${JSON.stringify(layout)}`
  )
  assert.ok(
    layout.titleToVisualGap !== null && layout.titleToVisualGap >= minimumGap,
    `${label} title/visual gap should be at least ${minimumGap}px, got ${JSON.stringify(layout)}`
  )
  assert.ok(
    layout.visualToDialogueGap !== null && layout.visualToDialogueGap >= minimumGap,
    `${label} visual/dialogue gap should be at least ${minimumGap}px, got ${JSON.stringify(layout)}`
  )
  if (layout.viewport > 820) {
    assert.ok(
      layout.teacherToDialogueGap !== null && layout.teacherToDialogueGap >= minimumGap,
      `${label} Teacher/dialogue gap should be at least ${minimumGap}px, got ${JSON.stringify(layout)}`
    )
  }
  assert.ok(
    layout.dialogueTextLeftInset !== null
      && layout.dialogueTextRightInset !== null
      && Math.abs(layout.dialogueTextLeftInset - layout.dialogueTextRightInset) <= 2,
    `${label} Teacher copy should have balanced horizontal insets, got ${JSON.stringify(layout)}`
  )
  assert.ok(
    layout.dialogueActionGap !== null && layout.dialogueActionGap >= 10,
    `${label} Teacher copy should not overlap its actions, got ${JSON.stringify(layout)}`
  )
  if (expectBalanced) {
    assert.ok(
      layout.topWhitespace !== null && layout.topWhitespace >= 16,
      `${label} should preserve breathing room below the HUD, got ${JSON.stringify(layout)}`
    )
    assert.ok(
      layout.bottomWhitespace !== null && layout.bottomWhitespace >= 16,
      `${label} should preserve breathing room below the dialogue, got ${JSON.stringify(layout)}`
    )
    assert.ok(
      Math.abs(layout.topWhitespace - layout.bottomWhitespace) <= 40,
      `${label} should balance top and bottom whitespace, got ${JSON.stringify(layout)}`
    )
  }
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
  await page.getByText('MODULE 2 · 1 BÀI HỌC', { exact: true }).waitFor()
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
  await page.getByRole('button', { name: 'Duyệt nội dung Module 2', exact: true }).click()
  await page.getByText('Chốt điều cần làm trước khi Codex chọn cách làm', { exact: true }).waitFor()

  const openingRegularLayout = await moduleTwoVisualLayout(page)
  assertModuleTwoVisualLayout(openingRegularLayout, 'Module 2 opening at 1180 × 780', 16)

  await page.setViewportSize({ width: 1512, height: 982 })
  const moduleTwoVisualPages = [
    {
      objective: 'Chốt điều cần làm trước khi Codex chọn cách làm',
      screenshot: 'module-2-opening-1512x982.png'
    },
    {
      objective: 'Giữ quyết định về sản phẩm trước khi chọn cách xây',
      screenshot: 'module-2-prd-definition-1512x982.png'
    },
    {
      objective: 'Để AI hỗ trợ mà không giao luôn quyền quyết định',
      screenshot: 'module-2-prd-review-workflow-1512x982.png'
    }
  ]

  for (const [pageIndex, visualPage] of moduleTwoVisualPages.entries()) {
    await page.locator('.pixel-scene-title strong').getByText(visualPage.objective, { exact: true }).waitFor()
    const fullscreenLayout = await moduleTwoVisualLayout(page)
    assertModuleTwoVisualLayout(fullscreenLayout, `${visualPage.objective} at 1512 × 982`, 16, { expectBalanced: true })
    await capture(page, visualPage.screenshot)

    if (pageIndex === 1) {
      await page.getByRole('button', { name: '← Trang trước', exact: true }).click()
      await page.getByRole('button', { name: 'Quay lại trang đang học', exact: true }).waitFor()
      await page.setViewportSize({ width: 1180, height: 780 })
      assertModuleTwoHistoryReviewLayout(
        await moduleTwoHistoryReviewLayout(page),
        'Module 2 review at 1180 × 780'
      )
      await capture(page, 'module-2-opening-review-1180x780.png')
      await page.setViewportSize({ width: 1512, height: 982 })
      assertModuleTwoHistoryReviewLayout(
        await moduleTwoHistoryReviewLayout(page),
        'Module 2 review at 1512 × 982'
      )
      await capture(page, 'module-2-opening-review-1512x982.png')
      await page.getByRole('button', { name: 'Quay lại trang đang học', exact: true }).click()
      await page.locator('.pixel-scene-title strong').getByText(visualPage.objective, { exact: true }).waitFor()
    }

    if (pageIndex === 0) {
      await page.locator('.pixel-scene-title strong').evaluate((element) => { element.style.fontSize = '24px' })
      await page.locator('.pixel-dialogue > p').evaluate((element) => { element.style.fontSize = '22px' })
      const increasedTextLayout = await moduleTwoVisualLayout(page)
      assertModuleTwoVisualLayout(increasedTextLayout, 'Module 2 opening with increased text', 16)
      assert.ok(
        increasedTextLayout.shellClientHeight !== null
          && increasedTextLayout.shellScrollHeight !== null
          && increasedTextLayout.shellScrollHeight >= increasedTextLayout.shellClientHeight,
        `Module 2 opening should remain scrollable with increased text, got ${JSON.stringify(increasedTextLayout)}`
      )
      await capture(page, 'module-2-opening-1512x982-increased-text.png')
      await page.locator('.pixel-scene-title strong').evaluate((element) => { element.style.fontSize = '' })
      await page.locator('.pixel-dialogue > p').evaluate((element) => { element.style.fontSize = '' })

      await page.setViewportSize({ width: 390, height: 844 })
      const narrowLayout = await moduleTwoVisualLayout(page)
      assertModuleTwoVisualLayout(narrowLayout, 'Module 2 opening at 390 × 844', 8)
      await capture(page, 'module-2-opening-grid-390x844.png')
      await page.setViewportSize({ width: 1512, height: 982 })
    }

    await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  }

  await page.getByLabel('Hai nguồn tham khảo thiết kế', { exact: true }).waitFor()
  for (const galleryImage of await page.locator('.pixel-lesson-visual-group img').all()) {
    await waitForImageDecode(galleryImage)
  }
  const moduleTwoGalleryLayout = await page.evaluate(() => {
    const shell = globalThis.document.querySelector('.pixel-learning-shell')
    const hud = globalThis.document.querySelector('.pixel-hud')?.getBoundingClientRect()
    const gallery = globalThis.document.querySelector('.pixel-lesson-visual-group')?.getBoundingClientRect()
    const galleryPanels = [...globalThis.document.querySelectorAll('.pixel-lesson-visual-group > .pixel-lesson-visual')]
      .map((panel) => panel.getBoundingClientRect())
    const teacher = globalThis.document.querySelector('.pixel-teacher-character')?.getBoundingClientRect()
    const dialogue = globalThis.document.querySelector('.pixel-dialogue')?.getBoundingClientRect()
    return {
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth,
      hasSharedGrid: shell?.classList.contains('has-module-two-visual-dialogue') ?? false,
      hasGalleryGrid: shell?.classList.contains('has-module-two-visual-gallery') ?? false,
      galleryHeight: gallery?.height ?? null,
      teacherHeight: teacher?.height ?? null,
      dialogueHeight: dialogue?.height ?? null,
      galleryPanelCount: galleryPanels.length,
      galleryPanelGap: galleryPanels.length === 2 ? galleryPanels[1].left - galleryPanels[0].right : null,
      galleryToDialogueGap: gallery && dialogue ? dialogue.top - gallery.bottom : null,
      teacherToDialogueGap: teacher && dialogue ? dialogue.top - teacher.bottom : null,
      topWhitespace: hud && gallery && teacher ? Math.min(gallery.top, teacher.top) - hud.bottom : null,
      bottomWhitespace: dialogue ? globalThis.innerHeight - dialogue.bottom : null
    }
  })
  assert.equal(moduleTwoGalleryLayout.body, moduleTwoGalleryLayout.viewport)
  assert.equal(moduleTwoGalleryLayout.document, moduleTwoGalleryLayout.viewport)
  assert.equal(moduleTwoGalleryLayout.hasSharedGrid, true)
  assert.equal(moduleTwoGalleryLayout.hasGalleryGrid, true)
  assert.equal(moduleTwoGalleryLayout.galleryPanelCount, 2)
  assert.ok(
    moduleTwoGalleryLayout.galleryPanelGap !== null && moduleTwoGalleryLayout.galleryPanelGap >= 14,
    `Module 2 reference images should remain separate columns, got ${JSON.stringify(moduleTwoGalleryLayout)}`
  )
  assert.ok(
    moduleTwoGalleryLayout.galleryToDialogueGap !== null && moduleTwoGalleryLayout.galleryToDialogueGap >= 16,
    `Module 2 reference gallery should not overlap the Teacher panel, got ${JSON.stringify(moduleTwoGalleryLayout)}`
  )
  assert.ok(
    moduleTwoGalleryLayout.teacherToDialogueGap !== null && moduleTwoGalleryLayout.teacherToDialogueGap >= 16,
    `Module 2 reference gallery Teacher should not overlap the dialogue, got ${JSON.stringify(moduleTwoGalleryLayout)}`
  )
  assert.ok(
    moduleTwoGalleryLayout.topWhitespace !== null && moduleTwoGalleryLayout.topWhitespace >= 16,
    `Module 2 reference gallery should preserve space below the HUD, got ${JSON.stringify(moduleTwoGalleryLayout)}`
  )
  assert.ok(
    moduleTwoGalleryLayout.bottomWhitespace !== null && moduleTwoGalleryLayout.bottomWhitespace >= 16,
    `Module 2 reference gallery should preserve space below the dialogue, got ${JSON.stringify(moduleTwoGalleryLayout)}`
  )
  assert.ok(
    Math.abs(moduleTwoGalleryLayout.topWhitespace - moduleTwoGalleryLayout.bottomWhitespace) <= 40,
    `Module 2 reference gallery should balance top and bottom whitespace, got ${JSON.stringify(moduleTwoGalleryLayout)}`
  )
  await capture(page, 'module-2-reference-gallery-1512x982.png')
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()

  const implementationPlanBoard = page.locator('.pixel-plan-board')
  await implementationPlanBoard.waitFor()
  await implementationPlanBoard.getByRole('heading', { name: 'Implementation plan là gì?', exact: true }).waitFor()
  assert.deepEqual(
    await implementationPlanBoard.locator('.pixel-plan-board__lesson-copy p').allTextContents(),
    approvedImplementationPlanIntro.split('\n\n')
  )
  assert.equal(await implementationPlanBoard.locator('.pixel-plan-document > section').count(), 4)
  assert.equal(await implementationPlanBoard.locator('.pixel-plan-phase__criteria:visible').count(), 4)
  assert.match(await implementationPlanBoard.textContent(), /Portfolio mở được trong trình duyệt/)
  assert.match(await implementationPlanBoard.textContent(), /Ảnh giao diện desktop và điện thoại đã được lưu/)
  assert.equal(await implementationPlanBoard.getByText('Chia việc xây sản phẩm thành nhiều phase', { exact: true }).count(), 0)
  assert.equal(await implementationPlanBoard.getByText('Biết khi nào một phase đã hoàn thành', { exact: true }).count(), 0)
  const implementationPlanDesktopLayout = await page.evaluate(() => {
    const lesson = globalThis.document.querySelector('.pixel-plan-board__lesson')?.getBoundingClientRect()
    const plan = globalThis.document.querySelector('.pixel-plan-document')?.getBoundingClientRect()
    return {
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth,
      lessonToPlanGap: lesson && plan ? plan.left - lesson.right : null
    }
  })
  assert.equal(implementationPlanDesktopLayout.body, implementationPlanDesktopLayout.viewport)
  assert.equal(implementationPlanDesktopLayout.document, implementationPlanDesktopLayout.viewport)
  assert.ok((implementationPlanDesktopLayout.lessonToPlanGap ?? -1) >= 0)
  await capture(page, 'module-2-implementation-plan-combined-content-review-1512x982.png')
  await page.setViewportSize({ width: 390, height: 844 })
  const implementationPlanNarrowLayout = await page.evaluate(() => ({
    body: globalThis.document.body.scrollWidth,
    document: globalThis.document.documentElement.scrollWidth,
    viewport: globalThis.innerWidth
  }))
  assert.equal(implementationPlanNarrowLayout.body, implementationPlanNarrowLayout.viewport)
  assert.equal(implementationPlanNarrowLayout.document, implementationPlanNarrowLayout.viewport)
  await capture(page, 'module-2-implementation-plan-combined-content-review-390x844.png')
  await page.setViewportSize({ width: 1180, height: 780 })

  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByText(approvedPracticeTransitionCopy, { exact: true }).waitFor()
  assert.equal(await page.getByText('Chọn nơi lưu các tài liệu planning', { exact: true }).count(), 0)
  assert.equal(await page.getByText('Tạo bộ quy luật cho dự án của bạn', { exact: true }).count(), 0)
  const moduleTwoPracticeEntryLayout = await page.evaluate(() => ({
    body: globalThis.document.body.scrollWidth,
    document: globalThis.document.documentElement.scrollWidth,
    viewport: globalThis.innerWidth
  }))
  assert.equal(moduleTwoPracticeEntryLayout.body, moduleTwoPracticeEntryLayout.viewport)
  assert.equal(moduleTwoPracticeEntryLayout.document, moduleTwoPracticeEntryLayout.viewport)
  assert.equal(await page.getByRole('button', { name: 'Chuyển sang Codex để thực hành', exact: true }).count(), 1)
  await capture(page, 'module-2-practice-direct-content-review-1180x780.png')
  await page.getByRole('button', { name: 'Bỏ qua Practice · Duyệt bài ôn tập', exact: true }).click()
  await page.getByText(approvedPortfolioMasteryTransitionCopy, { exact: true }).waitFor()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await answerAssessmentGroup(page, 'final-assessment', { retryFirstChoice: true })
  await page.getByText('Bạn đã trả lời 5/5 câu', { exact: false }).waitFor()
  await capture(page, 'module-2-direct-summary-content-review-1180x780.png')
  await page.getByRole('button', { name: 'Duyệt nội dung Module 3', exact: true }).click()
  await page.locator('.pixel-scene-title strong').getByText('Biết cách phối hợp với coding agent khi sản phẩm gặp lỗi', { exact: true }).waitFor()
  const moduleThreeOutline = page.locator('.pixel-outline')
  await moduleThreeOutline.locator('summary').click()
  await moduleThreeOutline.getByText('Debug cùng coding agent', { exact: true }).waitFor()
  await moduleThreeOutline.locator('summary').click()
  assert.equal(
    await page.locator('.pixel-scene-title strong').textContent(),
    'Biết cách phối hợp với coding agent khi sản phẩm gặp lỗi'
  )
  assert.equal(await page.locator('.pixel-consequence').count(), 0)
  await page.setViewportSize({ width: 1440, height: 900 })
  await capture(page, 'module-3-debugging-intro-1440x900.png')
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await waitForImageDecode(page.getByAltText('Nút Xem dự án che lên phần giới thiệu của một website portfolio'))
  assert.equal(await page.locator('.pixel-consequence').count(), 0)
  assert.equal(await page.locator('.pixel-lesson-visual').count(), 1)
  await capture(page, 'module-3-visible-error-1440x900.png')
  await page.setViewportSize({ width: 390, height: 844 })
  const moduleThreeNarrowWidths = await page.evaluate(() => ({
    body: globalThis.document.body.scrollWidth,
    document: globalThis.document.documentElement.scrollWidth,
    viewport: globalThis.innerWidth
  }))
  assert.equal(moduleThreeNarrowWidths.body, moduleThreeNarrowWidths.viewport)
  assert.equal(moduleThreeNarrowWidths.document, moduleThreeNarrowWidths.viewport)
  await capture(page, 'module-3-visible-error-390x844.png')
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await waitForImageDecode(page.getByAltText('Ảnh lỗi giao diện được gửi cùng prompt mô tả kết quả mong đợi và kết quả thực tế'))
  await page.getByText('Trên đây là ví dụ của một prompt bạn có thể áp dụng. Trong trường hợp này, lỗi có thể thấy ngay ở trên trang web, nên bạn chỉ việc cắt screenshot và nhắn prompt như trên là được.', { exact: true }).waitFor()
  const promptVisualWidth = await page.locator('.pixel-lesson-visual.is-featured-example').evaluate((element) => element.getBoundingClientRect().width)
  assert.ok(promptVisualWidth >= 500 && promptVisualWidth <= 520)
  await capture(page, 'module-3-error-prompt-1440x900.png')
  await page.setViewportSize({ width: 390, height: 844 })
  const promptNarrowWidths = await page.evaluate(() => ({
    body: globalThis.document.body.scrollWidth,
    document: globalThis.document.documentElement.scrollWidth,
    viewport: globalThis.innerWidth
  }))
  assert.equal(promptNarrowWidths.body, promptNarrowWidths.viewport)
  assert.equal(promptNarrowWidths.document, promptNarrowWidths.viewport)
  await capture(page, 'module-3-error-prompt-390x844.png')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await waitForImageDecode(page.getByAltText('Terminal hiển thị một dòng log được làm nổi bật để coding agent điều tra lỗi'))
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.locator('.pixel-scene-title strong').getByText('Liệt kê các lỗi có thể xảy ra trước khi sửa tiếp', { exact: true }).waitFor()
  await waitForImageDecode(page.getByAltText('Codex nhận yêu cầu dừng sửa, liệt kê các nguyên nhân có thể và kiểm tra từng nguyên nhân bằng bằng chứng'))
  assert.equal(await page.locator('.pixel-consequence').count(), 0)
  assert.equal(await page.locator('.pixel-lesson-visual').count(), 1)
  const repeatedErrorDesktopLayout = await page.evaluate(() => {
    const title = globalThis.document.querySelector('.pixel-scene-title')?.getBoundingClientRect()
    const visual = globalThis.document.querySelector('.pixel-lesson-visual')?.getBoundingClientRect()
    const dialogue = globalThis.document.querySelector('.pixel-dialogue')?.getBoundingClientRect()
    return {
      visualWidth: visual?.width,
      titleToVisualGap: title && visual ? visual.top - title.bottom : null,
      visualToDialogueGap: visual && dialogue ? dialogue.top - visual.bottom : null
    }
  })
  assert.ok(repeatedErrorDesktopLayout.visualWidth >= 500 && repeatedErrorDesktopLayout.visualWidth <= 520)
  assert.ok(repeatedErrorDesktopLayout.titleToVisualGap >= 4)
  assert.ok(repeatedErrorDesktopLayout.visualToDialogueGap >= 12)
  await capture(page, 'module-3-repeated-error-codex-prompt-1440x900.png')
  await page.setViewportSize({ width: 390, height: 844 })
  const repeatedErrorNarrowWidths = await page.evaluate(() => ({
    body: globalThis.document.body.scrollWidth,
    document: globalThis.document.documentElement.scrollWidth,
    viewport: globalThis.innerWidth
  }))
  assert.equal(repeatedErrorNarrowWidths.body, repeatedErrorNarrowWidths.viewport)
  assert.equal(repeatedErrorNarrowWidths.document, repeatedErrorNarrowWidths.viewport)
  assert.equal(await page.locator('.pixel-consequence').count(), 0)
  assert.equal(await page.locator('.pixel-lesson-visual').count(), 1)
  const repeatedErrorNarrowLayout = await page.evaluate(() => {
    const title = globalThis.document.querySelector('.pixel-scene-title')?.getBoundingClientRect()
    const visual = globalThis.document.querySelector('.pixel-lesson-visual')?.getBoundingClientRect()
    const dialogue = globalThis.document.querySelector('.pixel-dialogue')?.getBoundingClientRect()
    return {
      titleToVisualGap: title && visual ? visual.top - title.bottom : null,
      visualToDialogueGap: visual && dialogue ? dialogue.top - visual.bottom : null
    }
  })
  assert.ok(repeatedErrorNarrowLayout.titleToVisualGap >= 8)
  assert.ok(repeatedErrorNarrowLayout.visualToDialogueGap >= 8)
  await capture(page, 'module-3-repeated-error-codex-prompt-390x844.png')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  const gitGithubVisual = page.getByAltText('Logo Git và GitHub được đặt cạnh nhau để minh hoạ hai khái niệm khác nhau')
  await waitForImageDecode(gitGithubVisual)
  assert.equal(await page.locator('.pixel-scene-title').count(), 0)
  const gitGithubDesktopLayout = await page.locator('.pixel-lesson-visual.is-title-replacement').evaluate((element) => {
    const image = element.querySelector('img')
    const bounds = element.getBoundingClientRect()
    return {
      top: bounds.top,
      width: bounds.width,
      naturalWidth: image?.naturalWidth,
      naturalHeight: image?.naturalHeight
    }
  })
  assert.equal(gitGithubDesktopLayout.top, 100)
  assert.ok(gitGithubDesktopLayout.width >= 500 && gitGithubDesktopLayout.width <= 520)
  assert.equal(gitGithubDesktopLayout.naturalWidth, 1200)
  assert.equal(gitGithubDesktopLayout.naturalHeight, 600)
  await capture(page, 'module-3-git-github-1440x900.png')
  await page.setViewportSize({ width: 390, height: 844 })
  const gitGithubNarrowLayout = await page.evaluate(() => {
    const visual = globalThis.document.querySelector('.pixel-lesson-visual.is-title-replacement')
    const bounds = visual?.getBoundingClientRect()
    return {
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth,
      visualLeft: bounds?.left,
      visualRight: bounds?.right
    }
  })
  assert.equal(gitGithubNarrowLayout.body, gitGithubNarrowLayout.viewport)
  assert.equal(gitGithubNarrowLayout.document, gitGithubNarrowLayout.viewport)
  assert.ok((gitGithubNarrowLayout.visualLeft ?? -1) >= 0)
  assert.ok((gitGithubNarrowLayout.visualRight ?? 391) <= gitGithubNarrowLayout.viewport)
  assert.equal(await page.locator('.pixel-scene-title').count(), 0)
  await capture(page, 'module-3-git-github-390x844.png')
  await page.setViewportSize({ width: 1440, height: 900 })
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await waitForImageDecode(page.getByAltText('Danh sách nhiều commit nối tiếp nhau trong lịch sử Git'))
  const resetCommitScroll = async () => page.locator('.pixel-learning-shell').evaluate((element) => { element.scrollTop = 0 })
  const commitLayout = async () => page.evaluate(() => {
    const visual = globalThis.document.querySelector('.pixel-lesson-visual')?.getBoundingClientRect()
    const dialogue = globalThis.document.querySelector('.pixel-dialogue')?.getBoundingClientRect()
    const dialogueText = globalThis.document.querySelector('.pixel-dialogue > p')?.getBoundingClientRect()
    const actions = globalThis.document.querySelector('.pixel-lesson-actions.is-paired')?.getBoundingClientRect()
    const shell = globalThis.document.querySelector('.pixel-learning-shell')
    return {
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth,
      gap: visual && dialogue ? dialogue.top - visual.bottom : -1,
      visualHeight: visual?.height ?? -1,
      actionGap: dialogueText && actions ? actions.top - dialogueText.bottom : -1,
      shellClientHeight: shell?.clientHeight ?? -1,
      shellScrollHeight: shell?.scrollHeight ?? -1
    }
  })
  await resetCommitScroll()
  const commitDesktopLayout = await commitLayout()
  assert.equal(commitDesktopLayout.body, commitDesktopLayout.viewport)
  assert.equal(commitDesktopLayout.document, commitDesktopLayout.viewport)
  assert.ok(commitDesktopLayout.gap >= 16, `Expected commit illustration/dialogue gap >= 16px, got ${JSON.stringify(commitDesktopLayout)}`)
  assert.ok(commitDesktopLayout.visualHeight >= 100, `Expected visible commit illustration, got ${JSON.stringify(commitDesktopLayout)}`)
  assert.ok(commitDesktopLayout.actionGap >= 10, `Expected commit dialogue/action gap >= 10px, got ${JSON.stringify(commitDesktopLayout)}`)
  await capture(page, 'module-3-commit-1440x900.png')

  await page.setViewportSize({ width: 1180, height: 664 })
  await resetCommitScroll()
  const commitShortDesktopLayout = await commitLayout()
  assert.equal(commitShortDesktopLayout.body, commitShortDesktopLayout.viewport)
  assert.equal(commitShortDesktopLayout.document, commitShortDesktopLayout.viewport)
  assert.ok(commitShortDesktopLayout.gap >= 16, `Expected short commit illustration/dialogue gap >= 16px, got ${JSON.stringify(commitShortDesktopLayout)}`)
  assert.ok(commitShortDesktopLayout.visualHeight >= 100, `Expected visible short-desktop commit illustration, got ${JSON.stringify(commitShortDesktopLayout)}`)
  assert.ok(commitShortDesktopLayout.actionGap >= 10, `Expected short commit dialogue/action gap >= 10px, got ${JSON.stringify(commitShortDesktopLayout)}`)
  assert.ok(commitShortDesktopLayout.shellScrollHeight > commitShortDesktopLayout.shellClientHeight, `Expected short commit page to scroll, got ${JSON.stringify(commitShortDesktopLayout)}`)
  await capture(page, 'module-3-commit-1180x664.png')

  await page.locator('.pixel-dialogue > p').evaluate((element) => { element.style.fontSize = '22px' })
  await resetCommitScroll()
  const commitIncreasedTextLayout = await commitLayout()
  assert.equal(commitIncreasedTextLayout.body, commitIncreasedTextLayout.viewport)
  assert.equal(commitIncreasedTextLayout.document, commitIncreasedTextLayout.viewport)
  assert.ok(commitIncreasedTextLayout.gap >= 16, `Expected increased-text commit illustration/dialogue gap >= 16px, got ${JSON.stringify(commitIncreasedTextLayout)}`)
  assert.ok(commitIncreasedTextLayout.visualHeight >= 100, `Expected visible increased-text commit illustration, got ${JSON.stringify(commitIncreasedTextLayout)}`)
  assert.ok(commitIncreasedTextLayout.actionGap >= 10, `Expected increased-text commit dialogue/action gap >= 10px, got ${JSON.stringify(commitIncreasedTextLayout)}`)
  assert.ok(commitIncreasedTextLayout.shellScrollHeight > commitIncreasedTextLayout.shellClientHeight, `Expected increased-text commit page to scroll, got ${JSON.stringify(commitIncreasedTextLayout)}`)
  await capture(page, 'module-3-commit-1180x664-increased-text.png')
  await page.locator('.pixel-dialogue > p').evaluate((element) => { element.style.fontSize = '' })

  await page.setViewportSize({ width: 390, height: 844 })
  await resetCommitScroll()
  const commitNarrowLayout = await commitLayout()
  assert.equal(commitNarrowLayout.body, commitNarrowLayout.viewport)
  assert.equal(commitNarrowLayout.document, commitNarrowLayout.viewport)
  assert.ok(commitNarrowLayout.gap >= 10, `Expected narrow commit illustration/dialogue gap >= 10px, got ${JSON.stringify(commitNarrowLayout)}`)
  assert.ok(commitNarrowLayout.visualHeight >= 100, `Expected visible narrow commit illustration, got ${JSON.stringify(commitNarrowLayout)}`)
  assert.ok(commitNarrowLayout.actionGap >= 10, `Expected narrow commit dialogue/action gap >= 10px, got ${JSON.stringify(commitNarrowLayout)}`)
  await capture(page, 'module-3-commit-390x844.png')
  await page.setViewportSize({ width: 1440, height: 900 })

  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByRole('button', { name: 'Bỏ qua Practice · Duyệt câu hỏi cuối bài', exact: true }).waitFor()
  const moduleThreePracticeWidths = await page.evaluate(() => ({
    body: globalThis.document.body.scrollWidth,
    document: globalThis.document.documentElement.scrollWidth,
    viewport: globalThis.innerWidth
  }))
  assert.equal(moduleThreePracticeWidths.body, moduleThreePracticeWidths.viewport)
  assert.equal(moduleThreePracticeWidths.document, moduleThreePracticeWidths.viewport)
  await capture(page, 'module-3-practice-direct-1440x900.png')
  await page.getByRole('button', { name: 'Bỏ qua Practice · Duyệt câu hỏi cuối bài', exact: true }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await answerAssessmentGroup(page, 'm3-final-assessment')
  await page.getByText('Bạn đã trả lời 5/5 câu', { exact: false }).waitFor()
  await capture(page, 'module-3-summary-1440x900.png')
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
  await page.locator('.pixel-scene-title strong').getByText('Chặn secret, dữ liệu riêng tư và phạm vi công bố mơ hồ', { exact: true }).waitFor()
  assert.equal(await page.locator('.pixel-consequence').count(), 0)
  await page.locator('.pixel-brand').click()
  await page.getByRole('heading', { name: 'Lộ trình khóa học' }).waitFor()
  assert.equal(await readFile(statePath, 'utf8'), before)
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
    'Trong khoá học này, bạn sẽ được học cách dùng coding agents thông qua một dự án thực hành: Xây Portfolio cá nhân.'
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
    'Cuối khoá này, bạn sẽ có một web portfolio thật để có thể gửi cho nhà tuyển dụng.'
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
    'Những kỹ năng bạn học được trong khoá này không chỉ giúp bạn xây Portfolio, mà còn trang bị cho bạn kiến thức để tạo bất kỳ công cụ nào bạn muốn với AI'
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
  if (contentReviewOnly) {
    await verifyContentReviewMode(firstWindows.learningPage)
    console.log('Electron smoke: focused content-review journey passed')
  } else {
  await completeSetupModule(firstWindows.learningPage, firstWindows.companionPage, firstLaunch, true)
  assert.equal(await fingerprintTree(practiceWorkspace.canonicalStarter), canonicalStarterFingerprint)
  await verifyHomeBase(firstWindows.learningPage)
  await verifyContentReviewMode(firstWindows.learningPage)
  await firstWindows.learningPage
    .getByRole('button', { name: /MODULE 2.*MỞ BÀI HỌC/ })
    .click()
  await firstWindows.learningPage
    .getByText('Chốt điều cần làm trước khi Codex chọn cách làm', { exact: true })
    .waitFor()
  await firstWindows.learningPage
    .getByText('MODULE 2 · PHẦN 1/5', { exact: true })
    .first()
    .waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-dialogue > p').textContent(), approvedModuleTwoOpening)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual').count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual img').getAttribute('data-fit'), 'contain')
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
  assert.equal(await firstWindows.learningPage.getByText('Năm giai đoạn, năm tài liệu', { exact: true }).count(), 0)
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
  await firstWindows.learningPage.getByRole('button', { name: '← Trang trước', exact: true }).click()
  await firstWindows.learningPage.getByRole('button', { name: 'Quay lại trang đang học', exact: true }).waitFor()
  assertModuleTwoHistoryReviewLayout(
    await moduleTwoHistoryReviewLayout(firstWindows.learningPage),
    'Module 2 review at 1180 × 780'
  )
  await capture(firstWindows.learningPage, 'module-2-opening-review-1180x780.png')
  await firstWindows.learningPage.setViewportSize({ width: 1512, height: 982 })
  assertModuleTwoHistoryReviewLayout(
    await moduleTwoHistoryReviewLayout(firstWindows.learningPage),
    'Module 2 review at 1512 × 982'
  )
  await capture(firstWindows.learningPage, 'module-2-opening-review-1512x982.png')
  await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  await firstWindows.learningPage.getByRole('button', { name: 'Quay lại trang đang học', exact: true }).click()
  await firstWindows.learningPage.getByText('Giữ quyết định về sản phẩm trước khi chọn cách xây', { exact: true }).waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual').count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual img').getAttribute('data-fit'), 'contain')
  await firstWindows.learningPage.locator('.pixel-outline summary').click()
  assert.equal(await firstWindows.learningPage.locator('.pixel-outline-menu li.is-complete').count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.pixel-outline-menu li.is-active').count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.pixel-outline-menu li.is-upcoming').count(), 3)
  await capture(firstWindows.learningPage, 'module-2-part-2-outline.png')
  await firstWindows.learningPage.locator('.pixel-outline summary').click()
  await capture(firstWindows.learningPage, 'module-2-prd-definition.png')
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await firstWindows.learningPage.getByText('Để AI hỗ trợ mà không giao luôn quyền quyết định', { exact: true }).waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual').count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual img').getAttribute('data-fit'), 'contain')
  await capture(firstWindows.learningPage, 'module-2-prd-review-workflow.png')
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await firstWindows.learningPage.getByLabel('Hai nguồn tham khảo thiết kế', { exact: true }).waitFor()
  assert.equal(await firstWindows.learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await firstWindows.learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(await firstWindows.learningPage.getByLabel('Hai nguồn tham khảo thiết kế', { exact: true }).count(), 1)
  assert.equal(await firstWindows.learningPage.locator('.pixel-lesson-visual-group img').count(), 2)
  assert.equal(await firstWindows.learningPage.getByText('Pafolios', { exact: true }).count(), 1)
  assert.equal(await firstWindows.learningPage.getByText('Awwwards', { exact: true }).count(), 1)
  await verifyDesignReferenceLinks(firstWindows.learningPage)
  assert.equal(await firstWindows.learningPage.getByText('Trước khi bắt đầu xây sản phẩm thật, bạn cũng có thể nhờ coding agent tạo một visual prototype bằng HTML — tức là một bản mẫu giao diện có thể mở trong trình duyệt.', { exact: false }).count(), 1)
  await capture(firstWindows.learningPage, 'module-2-five-stage-map.png')
  if (screenshotDirectory) {
    await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
    const moduleTwoMapNarrowWidths = await firstWindows.learningPage.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(moduleTwoMapNarrowWidths.body, moduleTwoMapNarrowWidths.viewport)
    assert.equal(moduleTwoMapNarrowWidths.document, moduleTwoMapNarrowWidths.viewport)
    const mapContinueButton = firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true })
    await mapContinueButton.scrollIntoViewIfNeeded()
    await capture(firstWindows.learningPage, 'module-2-five-stage-map-390px.png')
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  const implementationPlanBoard = firstWindows.learningPage.locator('.pixel-plan-board')
  await implementationPlanBoard.waitFor()
  await implementationPlanBoard.getByRole('heading', { name: 'Implementation plan là gì?', exact: true }).waitFor()
  assert.deepEqual(
    await implementationPlanBoard.locator('.pixel-plan-board__lesson-copy p').allTextContents(),
    approvedImplementationPlanIntro.split('\n\n')
  )
  assert.equal(await implementationPlanBoard.locator('.pixel-plan-document > section').count(), 4)
  assert.equal(await implementationPlanBoard.locator('.pixel-plan-phase__criteria:visible').count(), 4)
  assert.match(await implementationPlanBoard.textContent(), /Portfolio mở được trong trình duyệt/)
  assert.match(await implementationPlanBoard.textContent(), /Ảnh giao diện desktop và điện thoại đã được lưu/)
  assert.equal(await implementationPlanBoard.getByText('Chia việc xây sản phẩm thành nhiều phase', { exact: true }).count(), 0)
  assert.equal(await implementationPlanBoard.getByText('Biết khi nào một phase đã hoàn thành', { exact: true }).count(), 0)
  await capture(firstWindows.learningPage, 'module-2-implementation-plan-combined.png')
  if (screenshotDirectory) {
    await firstWindows.learningPage.setViewportSize({ width: 390, height: 844 })
    const planNarrowWidths = await firstWindows.learningPage.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(planNarrowWidths.body, planNarrowWidths.viewport)
    assert.equal(planNarrowWidths.document, planNarrowWidths.viewport)
    await capture(firstWindows.learningPage, 'module-2-implementation-plan-combined-390px.png')
    await firstWindows.learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await firstWindows.learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await firstWindows.learningPage.getByText('MODULE 2 · PHẦN 5/5', { exact: true }).first().waitFor()
  await firstWindows.learningPage.getByText(approvedPracticeTransitionCopy, { exact: true }).waitFor()
  await capture(firstWindows.learningPage, 'module-2-portfolio-practice-entry.png')
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
    .getByText('Mục đích của portfolio này là gì?', { exact: true })
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
    .getByText('Chốt điều cần làm trước khi Codex chọn cách làm', { exact: true })
    .waitFor()
  assert.equal(await learningPage.locator('.pixel-dialogue > p').textContent(), approvedModuleTwoOpening)
  await openModuleTwoPractice(learningPage)
  await learningPage.locator('.pixel-copy-prompt').waitFor()
  const promptBounds = await learningPage.locator('.pixel-copy-prompt').boundingBox()
  const promptDialogueBounds = await learningPage.locator('.pixel-dialogue').boundingBox()
  assert.ok(promptBounds)
  assert.ok(promptDialogueBounds)
  assert.ok(
    promptDialogueBounds.y - (promptBounds.y + promptBounds.height) >= 16,
    `Expected at least 16px between the portfolio prompt and Teacher panel, got ${JSON.stringify({ promptBounds, promptDialogueBounds })}`
  )
  assert.equal(await learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(await learningPage.locator('.pixel-dialogue > p').textContent(), approvedPracticeTransitionCopy)
  assert.equal(await learningPage.locator('.pixel-copy-prompt > p').textContent(), approvedPortfolioPracticePrompt)
  await learningPage.getByRole('button', { name: 'SAO CHÉP PROMPT', exact: true }).click()
  await learningPage.getByRole('button', { name: 'ĐÃ SAO CHÉP', exact: true }).waitFor()
  assert.equal(await learningPage.evaluate(() => navigator.clipboard.readText()), approvedPortfolioPracticePrompt)
  await capture(learningPage, 'module-2-portfolio-practice-prompt.png')
  if (screenshotDirectory) {
    await learningPage.setViewportSize({ width: 390, height: 844 })
    const promptNarrowWidths = await learningPage.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(promptNarrowWidths.body, promptNarrowWidths.viewport)
    assert.equal(promptNarrowWidths.document, promptNarrowWidths.viewport)
    const promptNarrowBounds = await learningPage.locator('.pixel-copy-prompt').boundingBox()
    const promptNarrowDialogueBounds = await learningPage.locator('.pixel-dialogue').boundingBox()
    assert.ok(promptNarrowBounds)
    assert.ok(promptNarrowDialogueBounds)
    assert.ok(
      promptNarrowDialogueBounds.y - (promptNarrowBounds.y + promptNarrowBounds.height) >= 10,
      `Expected at least 10px between the narrow portfolio prompt and Teacher panel, got ${JSON.stringify({ promptNarrowBounds, promptNarrowDialogueBounds })}`
    )
    await learningPage.locator('.pixel-copy-prompt').scrollIntoViewIfNeeded()
    await capture(learningPage, 'module-2-portfolio-practice-prompt-390px.png')
    await learningPage.setViewportSize({ width: 1180, height: 780 })
  }
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
      currentCourseLessonId: 'm2-portfolio-brief',
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
  await learningPage.getByRole('button', { name: /MODULE 2.*MỞ BÀI HỌC/ }).click({ force: true })
  await learningPage.getByText(approvedPortfolioMasteryTransitionCopy, { exact: true }).waitFor()
  assert.equal(await learningPage.locator('.pixel-scene-title').count(), 0)
  assert.equal(await learningPage.locator('.pixel-consequence').count(), 0)
  assert.equal(await learningPage.locator('.pixel-dialogue > p').textContent(), approvedPortfolioMasteryTransitionCopy)
  await capture(learningPage, 'module-2-portfolio-mastery-intro.png')
  if (screenshotDirectory) {
    await learningPage.setViewportSize({ width: 390, height: 844 })
    const masteryIntroNarrowWidths = await learningPage.evaluate(() => ({
      body: globalThis.document.body.scrollWidth,
      document: globalThis.document.documentElement.scrollWidth,
      viewport: globalThis.innerWidth
    }))
    assert.equal(masteryIntroNarrowWidths.body, masteryIntroNarrowWidths.viewport)
    assert.equal(masteryIntroNarrowWidths.document, masteryIntroNarrowWidths.viewport)
    await learningPage.locator('.pixel-dialogue').scrollIntoViewIfNeeded()
    await capture(learningPage, 'module-2-portfolio-mastery-intro-390px.png')
    await learningPage.setViewportSize({ width: 1180, height: 780 })
  }
  await learningPage.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await answerAssessmentGroup(learningPage, 'final-assessment', { retryFirstChoice: true })
  await learningPage.getByText('Bạn đã trả lời 5/5 câu.', { exact: false }).waitFor()
  assert.equal(await learningPage.locator('.pixel-scene-title').count(), 0)
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
  assert.equal(persisted.currentCourseLessonId, 'm2-portfolio-brief')
  assert.ok(persisted.sceneHistory.length > 10)
  assert.equal(persisted.decisions.portfolioPlanningPractice, 'five-current-stage-receipts')
  assert.equal(persisted.decisions.setupPractice, 'teacher-reviewed-setup')
  assert.equal(persisted.decisions.setupMastery, 'passed-five-of-six')
  assert.equal(persisted.decisions.masteryEvidence, undefined)
  assert.equal(
    Object.entries(persisted.decisions).filter(
      ([key, value]) => key.startsWith('assessment:mastery-') && String(value).startsWith('correct')
    ).length,
    5
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

  console.log(
    'Electron smoke: frozen course regression, responsive layout, review-safe back navigation, roadmap entry, Teacher overlay, settings, journey resume/reset, in-app mock Practice, mastery, persistence, security, and companion lifecycle passed'
  )
  }
} finally {
  await firstLaunch?.close().catch(() => undefined)
  await resumedLaunch?.close().catch(() => undefined)
  await chatHistoryLaunch?.close().catch(() => undefined)
  await rm(userDataDirectory, { recursive: true, force: true })
  await rm(learningPortfolioWorkspaceDirectory, { recursive: true, force: true })
  await practiceWorkspace.cleanup()
}
