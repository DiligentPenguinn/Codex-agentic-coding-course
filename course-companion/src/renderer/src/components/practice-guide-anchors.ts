import type { PracticeGuideAnchorId } from '../../../../shared/contracts'

export const PRACTICE_GUIDE_ANCHOR_ATTRIBUTE = 'data-practice-guide-anchor'

export function practiceGuideAnchor(id: PracticeGuideAnchorId) {
  return { [PRACTICE_GUIDE_ANCHOR_ATTRIBUTE]: id }
}

export function findPracticeGuideAnchor(id: PracticeGuideAnchorId): HTMLElement | null {
  return document.querySelector<HTMLElement>(`[${PRACTICE_GUIDE_ANCHOR_ATTRIBUTE}="${id}"]`)
}

