import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const lifecycleFiles = [
  'practice-coordinator.ts',
  'practice-run-repository.ts',
  'practice-review-service.ts',
  'teacher-context-broker.ts',
  'teacher-service.ts'
]

describe('current Practice identity regression', () => {
  it('contains no historical Practice ID fallback in lifecycle services', async () => {
    const sources = await Promise.all(
      lifecycleFiles.map((file) => readFile(
        join(process.cwd(), 'electron', 'main', file),
        'utf8'
      ))
    )

    for (const source of sources) {
      expect(source).not.toContain('m1-verifiable-brief')
    }
  })
})
