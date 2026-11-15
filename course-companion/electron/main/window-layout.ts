import type { Rectangle } from 'electron'
import type { CompanionMode } from '../../shared/contracts'

const WINDOW_SIZE: Record<CompanionMode, { width: number; height: number }> = {
  compact: { width: 168, height: 188 },
  expanded: { width: 380, height: 640 }
}

const EDGE_MARGIN = 24

export function getCompanionBounds(
  workArea: Rectangle,
  mode: CompanionMode,
  anchor?: { right: number; bottom: number }
): Rectangle {
  const size = WINDOW_SIZE[mode]
  const width = Math.min(size.width, workArea.width - EDGE_MARGIN * 2)
  const height = Math.min(size.height, workArea.height - EDGE_MARGIN * 2)

  return {
    width,
    height,
    x: Math.max(workArea.x + EDGE_MARGIN, Math.min(
      (anchor?.right ?? workArea.x + workArea.width - EDGE_MARGIN) - width,
      workArea.x + workArea.width - width - EDGE_MARGIN)),
    y: Math.max(workArea.y + EDGE_MARGIN, Math.min(
      (anchor?.bottom ?? workArea.y + workArea.height - EDGE_MARGIN) - height,
      workArea.y + workArea.height - height - EDGE_MARGIN))
  }
}
