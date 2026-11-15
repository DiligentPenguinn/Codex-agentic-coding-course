import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const designReferenceLinks = [
  { label: 'Pafolios', href: 'https://pafolios.com/' },
  { label: 'Awwwards', href: 'https://www.awwwards.com/' },
  { label: 'Dribbble', href: 'https://dribbble.com/' },
  { label: 'Mobbin', href: 'https://mobbin.com/' },
  { label: 'Pinterest', href: 'https://www.pinterest.com/' }
]

describe('Module 2 design-reference links', () => {
  it('renders all five approved destinations without changing their visible labels', async () => {
    const component = await readFile(
      resolve(process.cwd(), 'src/renderer/src/components/DesignReferenceDialogue.tsx'),
      'utf8'
    )

    for (const { href, label } of designReferenceLinks) {
      expect(component).toContain(`{ label: '${label}', href: '${href}' }`)
    }
    expect(component).toContain('className="pixel-dialogue-link"')
    expect(component).toContain('target="_blank"')
    expect(component).toContain('rel="noreferrer"')
  })

  it('routes HTTPS links to the default browser and keeps Course Companion in place', async () => {
    const mainProcess = await readFile(resolve(process.cwd(), 'electron/main/index.ts'), 'utf8')

    expect(mainProcess).toContain('setWindowOpenHandler')
    expect(mainProcess).toContain("destination.protocol === 'https:'")
    expect(mainProcess).toContain('shell.openExternal(destination.toString())')
    expect(mainProcess).toContain("return { action: 'deny' }")
  })
})
