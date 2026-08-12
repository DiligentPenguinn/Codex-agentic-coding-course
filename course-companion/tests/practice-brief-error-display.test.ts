import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Practice brief error display', () => {
  it('shows the coordinator error after start and retry failures', async () => {
    const source = await readFile(
      join(process.cwd(), 'src/renderer/src/components/PracticeBrief.tsx'),
      'utf8'
    )

    expect(source.split("setError('')").length - 1).toBeGreaterThanOrEqual(2)
    expect(source.split('await load()').length - 1).toBeGreaterThanOrEqual(2)
    expect(source).toContain('{error || workspace.error ?')
    expect(source).not.toContain('Lần thử lại chưa thành công. Practice cũ vẫn được giữ nguyên.')
  })
})