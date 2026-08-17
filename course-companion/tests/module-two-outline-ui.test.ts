import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { moduleTwoOutlineSections } from '../shared/course/modules/module-2'

describe('Module 2 outline menu', () => {
  it('shows the five approved concept-first parts without status labels', () => {
    expect(moduleTwoOutlineSections).toEqual([
      'Tại sao cần planning trước khi code với AI?',
      'PRD là gì và dùng để làm gì?',
      'Một PRD tốt cần có những gì?',
      'Dùng coding agent để tạo, review và duyệt PRD',
      'Thực hành: Lập kế hoạch cho portfolio'
    ])
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
})
