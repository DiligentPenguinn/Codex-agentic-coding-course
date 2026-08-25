import { splitDialogueHighlights } from '../../../../shared/course/highlight-dialogue'

export function HighlightedDialogue({
  dialogue,
  highlightTerms
}: {
  dialogue: string
  highlightTerms: readonly string[]
}) {
  return (
    <>
      {splitDialogueHighlights(dialogue, highlightTerms).map((segment, index) => segment.highlighted
        ? <mark className="pixel-keyword-highlight" key={`${index}-${segment.text}`}>{segment.text}</mark>
        : segment.text)}
    </>
  )
}
