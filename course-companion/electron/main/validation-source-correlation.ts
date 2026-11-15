import { createHash } from 'node:crypto'

type SourceFile = { path: string; digest: string }
const hash = (value: string) => createHash('sha256').update(value).digest('hex')
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Recompute supported record identities from independently read bytes only.
 * Record text selects candidates; it cannot supply file hashes or execute a recipe.
 * An unknown recipe is not evidence that the student's source changed.
 */
export function correlateValidationSource(files: readonly SourceFile[], record: string) {
  const declared = new Set([...record.matchAll(/\b[a-f0-9]{64}\b/gi)].map((match) => match[0].toLowerCase()))
  const canonicalDigest = hash(JSON.stringify(files))
  const base = { canonicalDigest, independentlyReadFiles: files.length }
  if (!declared.size) return { ...base, status: 'not-declared' as const }
  if (declared.has(canonicalDigest)) {
    return { ...base, status: 'matched' as const, method: 'canonical-json', validatedFiles: files.length, excludedPaths: [] }
  }

  const mentioned = files.map((file) => ({ ...file,
    index: record.search(new RegExp(`(?<![A-Za-z0-9_./-])${escape(file.path)}(?![A-Za-z0-9_/-]|\\.[A-Za-z0-9])`))
  })).filter((file) => file.index >= 0).sort((a, b) => a.index - b.index)
  const covered = new Set(mentioned.map((file) => file.path))
  const excluded = files.filter((file) => !covered.has(file.path)).map((file) => file.path)
  // .gitignore is still covered by the canonical approval/source digest. Its
  // absence from a browser-validation recipe does not change website behavior.
  if (!mentioned.some((file) => file.path === 'index.html')
    || !mentioned.some((file) => file.path.startsWith('src/'))
    || excluded.some((path) => path !== '.gitignore')) {
    return { ...base, status: 'not-correlated' as const, reason: 'incomplete-declared-scope' }
  }
  for (const uppercase of [false, true]) {
    for (const newline of ['\n', '\r\n']) {
      for (const trailingNewline of [false, true]) {
        const aggregate = mentioned.map((file) => `${file.path} ${uppercase ? file.digest.toUpperCase() : file.digest}`)
          .join(newline) + (trailingNewline ? newline : '')
        if (declared.has(hash(aggregate))) {
          return { ...base, status: 'matched' as const, method: 'ordered-path-sha256-lines',
            validatedFiles: mentioned.length, excludedPaths: excluded }
        }
      }
    }
  }
  return { ...base, status: 'not-correlated' as const, reason: 'different-or-unsupported-record-identity' }
}
