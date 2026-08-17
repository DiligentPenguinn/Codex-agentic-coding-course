import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('portfolio workspace picker', () => {
  it('uses the native folder-selection API and requires a second confirmation before planning', async () => {
    const source = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'components',
      'PortfolioWorkspacePicker.tsx'
    ), 'utf8')
    expect(source).toContain('choosePortfolioWorkspace')
    expect(source).toContain('confirmPortfolioPlanning')
    expect(source).toContain('Tạo thư mục planning')
    expect(source).toContain('Chưa có tệp ứng dụng nào được tạo.')
    expect(source).not.toContain('pilot-workspace')
  })

  it('provides distinct recovery, ready, focus, and narrow-layout states', async () => {
    const css = await readFile(join(process.cwd(), 'src', 'renderer', 'src', 'styles.css'), 'utf8')
    expect(css).toContain('.portfolio-workspace-picker.is-missing')
    expect(css).toContain('.portfolio-workspace-picker.is-permission-denied')
    expect(css).toContain('.portfolio-workspace-ready')
    expect(css).toContain('.portfolio-workspace-actions button:focus-visible')
    expect(css).toContain('@media (max-width: 640px)')
  })
})
