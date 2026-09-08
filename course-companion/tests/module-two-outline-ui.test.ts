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
      'Tham khảo thiết kế cho portfolio',
      'Đọc một implementation plan mẫu',
      'Thực hành: Lập kế hoạch cho portfolio',
      'Kiểm tra cuối Module 2',
      'Tổng kết Module 2'
    ])
    expect(moduleTwoOutlineSections).not.toContain('Năm giai đoạn, năm tài liệu')
    expect(moduleTwoOutlineSections.join(' ')).not.toMatch(/Đang học|Đã hoàn thành|Sắp tới|Chưa học/)
  })

  it('highlights the displayed section without implying completion while keeping Teacher and Quit at the edge', async () => {
    const [learningWindow, css] = await Promise.all([
      readFile(join(process.cwd(), 'src', 'renderer', 'src', 'surfaces', 'LearningWindow.tsx'), 'utf8'),
      readFile(join(process.cwd(), 'src', 'renderer', 'src', 'styles.css'), 'utf8')
    ])

    expect(learningWindow).toContain('pixel-outline-menu')
    const menu = learningWindow.slice(learningWindow.indexOf('<details className="pixel-outline"'), learningWindow.indexOf('<div className="pixel-hud-actions">'))
    expect(menu).not.toContain("? 'is-complete'")
    expect(learningWindow).toContain("? 'is-active'")
    expect(learningWindow).toContain("<i aria-hidden=\"true\" />")
    expect(learningWindow.indexOf('pixel-outline')).toBeLessThan(learningWindow.indexOf('pixel-hud-actions'))
    expect(css).toContain('.pixel-outline-menu li > button:focus-visible')
    expect(css).toContain('.pixel-outline-menu li.is-active')
    expect(css).toMatch(/\.pixel-hud-actions\s*\{[^}]*justify-self: end;/s)
    expect(css).toContain('.pixel-quit-version { display: none; }')
  })
})
