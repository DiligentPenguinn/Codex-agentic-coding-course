import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(process.cwd(), '..')
const courseRoot = resolve(repositoryRoot, 'pilot-workspace', 'course')

async function readCourseFile(relativePath: string): Promise<string> {
  return readFile(resolve(courseRoot, relativePath), 'utf8')
}

async function readCourseCompanionFile(relativePath: string): Promise<string> {
  return readFile(resolve(repositoryRoot, 'course-companion', relativePath), 'utf8')
}

const milestoneHeadings = [
  'Milestone 1 — Tạo bản mô tả ngắn cho portfolio',
  'Milestone 2 — Kiểm kê nội dung và bằng chứng',
  'Milestone 3 — Chọn và lưu một tham chiếu hình ảnh',
  'Milestone 4 — Tạo và duyệt PRD portfolio',
  'Milestone 5 — Tạo hợp đồng xây dựng và kiểm chứng'
]

const artifactPaths = [
  'planning/portfolio-brief.md',
  'planning/content-evidence-inventory.md',
  'planning/reference/reference.md',
  'planning/PRD.md',
  'planning/requirement-validation-map.md',
  'planning/implementation-plan.md',
  'planning/first-bounded-task.md'
]

const approvedPlanningOpening = 'Sau khi hoàn thành module 1, hy vọng các bạn đã hiểu hơn về cách sử dụng Codex. Đầu tiên, chúng ta sẽ cùng tìm hiểu về cách planning khi sử dụng Coding agents. Nhiều bạn mới bắt đầu code với AI thường bỏ qua phần lên kế hoạch mà nhảy thẳng vào phần thực thi. Các bạn ấy nghĩ rằng mình đang tiết kiệm thời gian, nhưng thực chất các bạn đang lầm. Nếu có một kế hoạch tốt trước khi bắt đầu xây sản phẩm. Bạn sẽ tiết kiệm được biết bao thời gian debug và sửa lại từ đầu vì không đúng ý. Tin mình đi, mình đã phạm phải sai lầm này và đã phải trả giá.'
const approvedPortfolioTransition = 'Bây giờ, chúng ta sẽ chính thức bắt tay vào tạo Portfolio.'
const approvedDesignPlanningCopy = 'Ngoài nội dung ra thì bạn cũng cần lên kế hoạch cho thiết kế của ứng dụng bạn muốn tạo. Trong phần này, nếu bạn có thể tự vẽ đồ hoạ chi tiết thì quá tốt. Nhưng nếu bạn cũng hơi mù thiết kế giống như mình, bạn có thể gửi cho agent ảnh mà bạn thích và những phần cụ thể bạn muốn bắt chước trong ảnh đó. Khi thiết kế portfolio, hai trang web mình hay dùng nhất là Pafolios và Awwwards. Còn nếu thiết kế ứng dụng thì mình sẽ tìm thêm ở hai trang là Dribble và Mobbin. Hoặc bạn cũng có thể vào Pinterest để tìm cảm hứng.'
const approvedVisualPrototypeCopy = 'Trước khi bắt đầu xây sản phẩm thật, bạn cũng có thể nhờ coding agent tạo một visual prototype bằng HTML — tức là một bản mẫu giao diện có thể mở trong trình duyệt. Hãy dùng bản mẫu này để xem bố cục, thứ tự thông tin và cảm giác tổng thể có đúng với điều bạn hình dung hay chưa. Sau khi bạn góp ý và duyệt hướng thiết kế, agent mới bắt đầu xây sản phẩm. Trong khóa học này, bạn sẽ làm bước đó ở Module 3. Cách làm này giúp bạn nhìn thấy ý tưởng sớm và tránh phải sửa lại quá nhiều khi sản phẩm đã được xây.'
const approvedPracticeTransitionCopy = 'Okay, không để các bạn đợi lâu nữa, bây giờ các bạn có thể qua Codex để tiếp tục thực hành rồi. Trước khi bấm chuyển sang Codex để thực hành, hãy copy prompt ở gốc trên bên phải để tẹo nữa paste vào Codex nha'
const approvedPortfolioPracticePrompt = 'Tôi muốn xây dựng một portfolio cá nhân nhưng chưa biết nên bắt đầu từ đâu. Hãy giúp tôi lập kế hoạch từ đầu bằng cách phỏng vấn tôi từng câu một. Trước tiên, hãy tìm hiểu mục tiêu của portfolio, người tôi muốn thuyết phục, nội dung tôi có thể đưa vào và phiên bản đầu tiên nên gồm những gì. Nếu tôi chưa chắc về câu trả lời, hãy đưa ra một vài lựa chọn dễ hiểu để tôi cân nhắc. Sau mỗi phần quan trọng, hãy tóm tắt những gì đã thống nhất và chờ tôi xác nhận trước khi tiếp tục. Trong quá trình này, chỉ tạo hoặc cập nhật tài liệu trong thư mục planning; chưa viết code, cài gói phụ thuộc hay tạo ứng dụng.'
const conceptualParts = [
  'Phần 1 — Tại sao cần planning trước khi code với AI?',
  'Phần 2 — PRD là gì và dùng để làm gì?',
  'Phần 3 — Dùng coding agent để tạo, review và duyệt PRD',
  'Phần 4 — Đọc một implementation plan mẫu',
  'Phần 5 — Thực hành: Lập kế hoạch cho portfolio'
]

describe('Module 2 instruction contract', () => {
  it('keeps the current Teacher integration baseline without the retired PRD anatomy page', async () => {
    const [lesson, script, prompt, moduleTwoScenes] = await Promise.all([
      readCourseFile('lessons/module-2.vi.md'),
      readCourseFile('lesson-scripts/module-2.script.vi.md'),
      readCourseFile('prompts/start-module-2.vi.md'),
      readCourseCompanionFile('src/renderer/src/course/modules/module-2/scenes.tsx')
    ])

    for (const content of [lesson, script]) {
      expect(content).toContain(approvedPlanningOpening)
      expect(content).toContain(approvedPortfolioTransition)
      expect(content.replace(/\s*>\s*/g, ' ').replace(/\s+/g, ' ')).toContain(approvedVisualPrototypeCopy)
      expect(content.indexOf(approvedPlanningOpening)).toBeLessThan(content.indexOf('PRD là gì'))
      expect(content.indexOf('PRD là gì')).toBeLessThan(content.indexOf(approvedPortfolioTransition))
    }
    expect(moduleTwoScenes).toContain(`dialogue: '${approvedPlanningOpening}'`)
    for (const part of conceptualParts) expect(lesson).toContain(part)
    const normalizedPrompt = prompt.replace(/\s+/g, ' ')
    expect(prompt).toMatch(/dạy đủ ba phần kiến\s+thức tổng quát/)
    expect(normalizedPrompt).toContain(approvedPortfolioTransition)
    expect(normalizedPrompt).toContain('Không rút gọn hoặc viết lại giọng kể')
    for (const page of [
      'Lập kế hoạch trước khi xây',
      'PRD là gì?',
      'Tạo và review PRD cùng coding agent',
      'Năm giai đoạn, năm tài liệu'
    ]) expect(moduleTwoScenes).toContain(page)
    expect(moduleTwoScenes).not.toContain("'module-2-prd-anatomy': {")
    expect(moduleTwoScenes).not.toContain('Một PRD tốt làm rõ bối cảnh')
    expect(moduleTwoScenes).not.toContain("'module-2-prd-introduction': {")
    expect(moduleTwoScenes).not.toContain('Cả năm giai đoạn diễn ra trong cùng một task Codex')
    expect(moduleTwoScenes).toContain("panelStatus: '9 TRANG · 1 PRACTICE'")
    expect(moduleTwoScenes).toContain("request: 'Chín trang giải thích dẫn tới một Practice duy nhất.'")
    expect(moduleTwoScenes).toContain("next: 'module-2-prd-definition'")
    expect(moduleTwoScenes).toContain("next: 'module-2-prd-review-workflow'")
    expect(moduleTwoScenes).toContain("next: 'module-2-prd-agent-workflow'")
    expect(moduleTwoScenes).toContain("next: 'module-2-plan-example'")
    expect(moduleTwoScenes).toContain("next: 'module-2-plan-requirements'")
    expect(moduleTwoScenes).toContain("next: 'module-2-plan-steps'")
    expect(moduleTwoScenes).toContain("next: 'module-2-plan-testing'")
    expect(moduleTwoScenes).toContain("next: 'module-2-plan-risks'")
    expect(moduleTwoScenes).toContain("next: 'module-2-portfolio-practice-intro'")
    expect(moduleTwoScenes).toContain('Pafolios')
    expect(moduleTwoScenes).toContain('Awwwards')
    expect(moduleTwoScenes).toContain(`dialogue: '${approvedDesignPlanningCopy}\\n\\n${approvedVisualPrototypeCopy}'`)
    expect(moduleTwoScenes).toContain("'module-2-prd-agent-workflow': {")
    expect(moduleTwoScenes).toContain("'module-2-plan-example': {")
    expect(moduleTwoScenes).toContain('Implementation plan, hay kế hoạch triển khai')
    expect(moduleTwoScenes).toContain('Ví dụ giúp bạn học format. Đây không phải đáp án cho portfolio của bạn.')
    expect(moduleTwoScenes).toContain('showTitle: false')
    expect(moduleTwoScenes).toContain('showPanel: false')
    expect(moduleTwoScenes).toContain(`dialogue: '${approvedPracticeTransitionCopy}'`)
    expect(moduleTwoScenes).toContain(`copyPrompt: '${approvedPortfolioPracticePrompt}'`)
    expect(moduleTwoScenes).toContain("'module-2-portfolio-agents-setup': {")
    expect(moduleTwoScenes).toContain('Create an AGENTS.md file at the root of the current workspace.')
    expect(moduleTwoScenes).toContain('Never invent personal experience, clients, roles, outcomes, metrics, testimonials, or evidence.')
    expect(moduleTwoScenes).toContain("decision: { key: 'portfolioAgentsSetup', value: 'learner-confirmed' }")
    expect(moduleTwoScenes).toContain('Ứng dụng chỉ lưu lời xác nhận của bạn; không đọc hoặc chấm nội dung AGENTS.md.')
    expect(lesson).toContain('# Portfolio Project Working Agreements')
    expect(script).toContain('Đây chỉ là lời tự xác nhận')
    expect(prompt.replace(/\s+/g, ' ')).toContain('Chỉ lưu lời tự xác nhận của Learner')
  })

  it('includes a learner-safe fictional implementation plan example', async () => {
    const example = await readCourseFile('examples/module-2-portfolio-implementation-plan.md')
    const normalizedExample = example.replace(/\s*>\s*/g, ' ').replace(/\s+/g, ' ')

    for (const heading of [
      '## Mục tiêu',
      '## Yêu cầu và ranh giới',
      '## Các giai đoạn triển khai',
      '## Tệp dự kiến thay đổi',
      '## Cách kiểm tra toàn bộ plan',
      '## Rủi ro và giả định',
      '## Phê duyệt'
    ]) expect(example).toContain(heading)

    expect(example).toContain('Đây là ví dụ giả lập để học cách đọc format.')
    expect(normalizedExample).toContain('Đây không phải đáp án cho portfolio của bạn')
    expect(example).toContain('390 × 844')
    expect(example).toContain('chưa thực hiện')
  })

  it('keeps all five milestones once and in the approved order', async () => {
    const [lesson, script] = await Promise.all([
      readCourseFile('lessons/module-2.vi.md'),
      readCourseFile('lesson-scripts/module-2.script.vi.md')
    ])

    for (const content of [lesson, script]) {
      let previousIndex = -1
      for (const heading of milestoneHeadings) {
        expect(content.split(heading)).toHaveLength(2)
        const currentIndex = content.indexOf(heading)
        expect(currentIndex).toBeGreaterThan(previousIndex)
        previousIndex = currentIndex
      }
    }

    for (const phase of [
      '### Explain',
      '### Ví dụ hoàn chỉnh nhưng không thể sao chép',
      '### Guided application',
      '### Learner artifact',
      '### Fresh evidence và accept/revise'
    ]) {
      expect(script.split(phase)).toHaveLength(6)
    }
  })

  it('aligns the instruction and start prompt with all seven planning artifacts', async () => {
    const [lesson, script, prompt] = await Promise.all([
      readCourseFile('lessons/module-2.vi.md'),
      readCourseFile('lesson-scripts/module-2.script.vi.md'),
      readCourseFile('prompts/start-module-2.vi.md')
    ])

    for (const artifactPath of artifactPaths) {
      expect(lesson).toContain(artifactPath)
      expect(script).toContain(artifactPath)
      expect(prompt).toContain(artifactPath)
    }
  })

  it('teaches evidence status, privacy, permission, and reference boundaries consistently', async () => {
    const files = await Promise.all([
      readCourseFile('lessons/module-2.vi.md'),
      readCourseFile('lesson-scripts/module-2.script.vi.md'),
      readCourseFile('prompts/start-module-2.vi.md')
    ])

    for (const content of files) {
      const normalized = content.replace(/\s*>\s*/g, ' ').replace(/\s+/g, ' ')
      for (const term of [
        'đã kiểm chứng',
        'lời tự khai',
        'giả định',
        'còn thiếu',
        'riêng tư',
        'được phép',
        'không được phép',
        'chưa rõ'
      ]) {
        expect(content).toContain(term)
      }
      for (const prohibitedCopy of ['nội dung', 'thương hiệu', 'hình ảnh', 'mã nguồn']) {
        expect(normalized).toMatch(
          new RegExp(`không (?:được |cấp quyền )?sao chép[^.]{0,160}${prohibitedCopy}`, 'i')
        )
      }
    }
  })

  it('stays source-first, mastery-gated, and outside implementation work', async () => {
    const [lesson, script, prompt] = await Promise.all([
      readCourseFile('lessons/module-2.vi.md'),
      readCourseFile('lesson-scripts/module-2.script.vi.md'),
      readCourseFile('prompts/start-module-2.vi.md')
    ])
    const combined = `${lesson}\n${script}\n${prompt}`

    for (const source of [
      'https://learn.chatgpt.com/docs/prompting',
      'https://www.gov.uk/service-manual/user-research/start-by-learning-user-needs',
      'https://microsoft.github.io/code-with-engineering-playbook/design/design-reviews/recipes/templates/template-task-design-review/',
      'https://microsoft.github.io/code-with-engineering-playbook/automated-testing/test-planning/',
      'https://www.w3.org/WAI/test-evaluate/'
    ]) {
      expect(combined).toContain(source)
    }

    expect(combined).toMatch(/hỏi\s+đúng một câu mỗi lượt/i)
    expect(combined).toContain('digest hiện tại')
    expect(combined).toContain('chưa chọn công nghệ')
    expect(combined).toContain('chưa tạo ứng dụng')
    expect(combined).not.toMatch(/ước tính.*(?:phút|giờ)|hoàn thành trong \d+/i)
    expect(combined).not.toMatch(/npm (?:install|create)|pnpm|yarn|create-vite/i)
    expect(combined).toMatch(/[ăâđêôơưĂÂĐÊÔƠƯ]/)
  })
})
