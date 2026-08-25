import { describe, expect, it } from 'vitest'
import { splitDialogueHighlights } from '../shared/course/highlight-dialogue'

describe('splitDialogueHighlights', () => {
  it('prefers longer overlapping terms and preserves source casing', () => {
    const segments = splitDialogueHighlights(
      'Git khác GitHub. Một commit khác với nhiều commits.',
      ['Git', 'GitHub', 'commit', 'commits']
    )

    expect(segments.filter((segment) => segment.highlighted).map((segment) => segment.text))
      .toEqual(['Git', 'GitHub', 'commit', 'commits'])
    expect(segments.map((segment) => segment.text).join(''))
      .toBe('Git khác GitHub. Một commit khác với nhiều commits.')
  })

  it('matches Vietnamese terms case-insensitively without changing punctuation or line breaks', () => {
    const source = '“Phân tán” là gì?\nRepository lưu lịch sử.'
    const segments = splitDialogueHighlights(source, ['phân tán', 'repository'])

    expect(segments.filter((segment) => segment.highlighted).map((segment) => segment.text))
      .toEqual(['Phân tán', 'Repository'])
    expect(segments.map((segment) => segment.text).join('')).toBe(source)
  })
})
