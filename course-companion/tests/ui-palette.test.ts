import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const allowedRgb = new Set([
  '0,0,0',
  '255,255,255',
  '255,214,102'
])

function rgbFromHex(token: string): string {
  let value = token.slice(1)
  if (value.length === 3 || value.length === 4) {
    value = [...value].map((digit) => digit + digit).join('')
  }
  return [0, 2, 4]
    .map((offset) => Number.parseInt(value.slice(offset, offset + 2), 16))
    .join(',')
}

describe('Course Companion UI palette', () => {
  it('limits CSS colors to yellow, white, black, and neutral opacity', async () => {
    const css = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'styles.css'
    ), 'utf8')

    const violations = new Set<string>()
    for (const token of css.match(/#[0-9a-f]{3,8}\b/gi) ?? []) {
      if (!allowedRgb.has(rgbFromHex(token))) violations.add(token)
    }
    for (const token of css.match(/rgba?\([^)]*\)/gi) ?? []) {
      const channels = token.match(/^rgba?\(\s*(\d+)\D+(\d+)\D+(\d+)/i)
      if (!channels) {
        violations.add(token)
        continue
      }
      const rgb = channels.slice(1, 4).map(Number).join(',')
      if (!allowedRgb.has(rgb)) violations.add(token)
    }

    expect([...violations]).toEqual([])
    expect(css).not.toMatch(/--pixel-(?:sky|cyan|violet|mint|danger|cream)/)
  })
})
