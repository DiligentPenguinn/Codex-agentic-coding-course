import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { TeacherMarkdown } from '../src/renderer/src/components/TeacherMarkdown'

const render = (content: string) => renderToStaticMarkup(createElement(TeacherMarkdown, { content }))

describe('Teacher Markdown replies', () => {
  it('renders Vietnamese emphasis and paragraphs without showing the Markdown markers', () => {
    const html = render('Hãy tìm phương án cho thấy Codex **thực sự hành động**.\n\nBạn chọn *A, B, C hay D*?')
    expect(html).toContain('<strong>thực sự hành động</strong>')
    expect(html).toContain('<em>A, B, C hay D</em>')
    expect(html.match(/<p>/g)).toHaveLength(2)
    expect(html).not.toContain('**')
  })

  it('supports headings, nested lists, quotes, literal code and GFM tables and tasks', () => {
    const html = render('# Kiểm tra\n\n1. Đọc\n   - Phạm vi\n2. Duyệt\n\n> Bằng chứng\n\n`<input>`\n\n```js\nconst x = "**literal**"\n```\n\n| Mục | Kết quả |\n| --- | --- |\n| Tệp | Đạt |\n\n- [x] Đã xem\n\n~~Cũ~~')
    for (const tag of ['h1', 'ol', 'ul', 'blockquote', 'table', 'del']) expect(html).toContain(`<${tag}`)
    expect(html).toContain('<pre tabindex="0"><code class="language-js">')
    expect(html).toContain('**literal**')
    expect(html).toContain('<code>&lt;input&gt;</code>')
    expect(html).toContain('disabled=""')
    expect(html).toContain('checked=""')
  })

  it('opens HTTPS links through the existing shell policy and leaves unsupported destinations inert', () => {
    const html = render('[Tài liệu](https://example.com/docs) [Script](javascript:alert%281%29) [Local](file:///C:/secret) [Relative](./lesson) [HTTP](http://example.com)')
    expect(html).toContain('href="https://example.com/docs" target="_blank" rel="noopener noreferrer"')
    expect(html.match(/<a /g)).toHaveLength(1)
    expect(html).not.toContain('javascript:')
    expect(html).not.toContain('file:///')
  })

  it('escapes raw HTML and shows image descriptions without executing markup or fetching media', () => {
    const html = render('<script>alert(1)</script>\n\n<img src="https://example.com/pixel" onerror="alert(1)">\n\n![Sơ đồ](https://example.com/diagram.png)')
    expect(html).not.toContain('<script>')
    expect(html).not.toContain('<img')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('Sơ đồ')
  })
})
