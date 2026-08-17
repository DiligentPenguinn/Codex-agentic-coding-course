import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const repositoryRoot = resolve(process.cwd(), '..')
const courseRoot = resolve(repositoryRoot, 'pilot-workspace', 'course')

async function readCourseFile(relativePath: string): Promise<string> {
  return readFile(resolve(courseRoot, relativePath), 'utf8')
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

describe('Module 2 instruction contract', () => {
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
