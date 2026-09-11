export type DialogueHighlightSegment = {
  text: string
  highlighted: boolean
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function normalized(value: string): string {
  return value.toLocaleLowerCase('vi')
}

export function splitDialogueHighlights(
  dialogue: string,
  highlightTerms: readonly string[]
): DialogueHighlightSegment[] {
  const terms = [...new Map(
    highlightTerms
      .map((term) => term.trim())
      .filter(Boolean)
      .map((term) => [normalized(term), term])
  ).values()].sort((left, right) => right.length - left.length)

  if (terms.length === 0) return [{ text: dialogue, highlighted: false }]

  const normalizedTerms = new Set(terms.map(normalized))
  const matcher = new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'giu')
  return dialogue
    .split(matcher)
    .filter(Boolean)
    .map((text) => ({ text, highlighted: normalizedTerms.has(normalized(text)) }))
}
