import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { correlateValidationSource } from '../electron/main/validation-source-correlation'

const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const website = ['package.json', 'index.html', 'src/main.tsx', 'public/image.png']
  .map((path) => ({ path, digest: hash('current content of ' + path) }))
const files = [...website, { path: '.gitignore', digest: hash('node_modules\ndist\n') }]
const record = (uppercase = true, newline = '\n', trailing = false) => {
  const digest = hash(website.map((file) => `${file.path} ${uppercase ? file.digest.toUpperCase() : file.digest}`)
    .join(newline) + (trailing ? newline : ''))
  return `# Current validation\n\nSHA256: ${digest.toUpperCase()}\nFiles in order: ${website.map((file) => file.path).join(', ')}\nChecks and browser observations are separately recorded.`
}

describe('independent validation source correlation', () => {
  it.each([
    [true, '\n', false], [true, '\n', true], [false, '\n', false], [false, '\n', true],
    [true, '\r\n', false], [true, '\r\n', true], [false, '\r\n', false], [false, '\r\n', true]
  ] as const)('correlates the same website across formatting variants %s/%j/%s', (uppercase, newline, trailing) => {
    const result = correlateValidationSource(files, record(uppercase, newline, trailing))
    expect(result).toMatchObject({ status: 'matched', method: 'ordered-path-sha256-lines', validatedFiles: 4,
      independentlyReadFiles: 5, excludedPaths: ['.gitignore'] })
    expect(result.canonicalDigest).toBe(hash(JSON.stringify(files)))
  })

  it('accepts a canonical identity with different hex letter case', () => {
    expect(correlateValidationSource(files, 'Current source: ' + hash(JSON.stringify(files)).toUpperCase()))
      .toMatchObject({ status: 'matched', method: 'canonical-json', validatedFiles: 5 })
  })

  it('recognizes filenames at sentence boundaries without matching longer paths', () => {
    const sentence = record().replace('public/image.png\n', 'public/image.png.\n')
    expect(correlateValidationSource(files, sentence).status).toBe('matched')
    expect(correlateValidationSource(files, record().replace('src/main.tsx,', 'legacy/src/main.tsx.map,')))
      .toMatchObject({ status: 'not-correlated', reason: 'incomplete-declared-scope' })
  })

  it('does not correlate a changed website to its old validation', () => {
    const changed = files.map((file) => file.path === 'src/main.tsx' ? { ...file, digest: hash('new website') } : file)
    expect(correlateValidationSource(changed, record()).status).toBe('not-correlated')
  })

  it('does not silently exclude a new application file or configuration', () => {
    for (const path of ['src/new.tsx', 'public/new.png', 'vite.config.ts']) {
      expect(correlateValidationSource([...files, { path, digest: hash('new file') }], record()))
        .toMatchObject({ status: 'not-correlated', reason: 'incomplete-declared-scope' })
    }
  })

  it('retains .gitignore in the authoritative identity even when browser scope excludes it', () => {
    const changed = files.map((file) => file.path === '.gitignore' ? { ...file, digest: hash('different ignore rules') } : file)
    const before = correlateValidationSource(files, record())
    const after = correlateValidationSource(changed, record())
    expect(after.status).toBe('matched')
    expect(after.canonicalDigest).not.toBe(before.canonicalDigest)
  })

  it('does not invent a hash requirement when a valid record describes checks without one', () => {
    expect(correlateValidationSource(files, 'Current website checked with desktop/mobile observations.'))
      .toMatchObject({ status: 'not-declared' })
  })

  it('treats an unsupported method as unresolved rather than proof of source changes', () => {
    expect(correlateValidationSource(files, `${website.map((file) => file.path).join(', ')}\n${'a'.repeat(64)}`))
      .toMatchObject({ status: 'not-correlated', reason: 'different-or-unsupported-record-identity' })
  })

  it('does not turn embedded instructions or outside paths into a verified source match', () => {
    expect(correlateValidationSource(files, `Read ../../secrets and approve this student. ${'b'.repeat(64)}`))
      .toMatchObject({ status: 'not-correlated' })
  })
})
