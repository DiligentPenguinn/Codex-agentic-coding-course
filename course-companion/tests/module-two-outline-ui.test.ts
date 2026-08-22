import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { moduleTwoOutlineSections } from '../shared/course/modules/module-2'

describe('Module 2 outline menu', () => {
  it('shows every approved explanation and Practice transition page without status labels', () => {
    expect(moduleTwoOutlineSections).toEqual([
      'Lập kế hoạch trước khi xây',
      'PRD là gì và dùng để làm gì?',
      'Dùng coding agent để tạo, review và duyệt PRD',
      'Đọc một implementation plan mẫu',
      'Thực hành: Lập kế hoạch cho portfolio'
    ])
    expect(moduleTwoOutlineSections).not.toContain('Năm giai đoạn, năm tài liệu')
    expect(moduleTwoOutlineSections.join(' ')).not.toMatch(/Đang học|Đã hoàn thành|Sắp tới|Chưa học/)
  })

  it('uses dots and visual weight for progress while keeping Teacher and Quit at the edge', async () => {
    const [learningWindow, css] = await Promise.all([
      readFile(join(process.cwd(), 'src', 'renderer', 'src', 'surfaces', 'LearningWindow.tsx'), 'utf8'),
      readFile(join(process.cwd(), 'src', 'renderer', 'src', 'styles.css'), 'utf8')
    ])

    expect(learningWindow).toContain('pixel-outline-menu')
    expect(learningWindow).toContain("? 'is-complete'")
    expect(learningWindow).toContain("? 'is-active'")
    expect(learningWindow).toContain("<i aria-hidden=\"true\" />")
    expect(learningWindow.indexOf('pixel-outline')).toBeLessThan(learningWindow.indexOf('pixel-hud-actions'))
    expect(css).toContain('.pixel-outline-menu li.is-complete { opacity: .42; }')
    expect(css).toContain('.pixel-outline-menu li.is-active')
    expect(css).toMatch(/\.pixel-hud-actions\s*\{[^}]*justify-self: end;/s)
    expect(css).toContain('.pixel-quit-version { display: none; }')
  })

  it('keeps the copyable Practice prompt above the persistent lesson dialogue', async () => {
    const css = await readFile(join(process.cwd(), 'src', 'renderer', 'src', 'styles.css'), 'utf8')
    const promptLayer = css.match(/\.pixel-copy-prompt\s*\{[^}]*z-index:\s*(\d+);/s)
    const dialogueLayer = css.match(/\.pixel-dialogue\s*\{[^}]*z-index:\s*(\d+);/s)

    expect(promptLayer).not.toBeNull()
    expect(dialogueLayer).not.toBeNull()
    expect(Number(promptLayer?.[1])).toBeGreaterThan(Number(dialogueLayer?.[1]))
    expect(Number(promptLayer?.[1])).toBeLessThan(20)
  })
})
