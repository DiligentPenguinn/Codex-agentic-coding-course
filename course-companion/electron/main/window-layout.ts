import type { Rectangle } from 'electron'
import type { CompanionMode } from '../../shared/contracts'

const WINDOW_SIZE: Record<CompanionMode, { width: number; height: number }> = {
  compact: { width: 168, height: 188 },
  expanded: { width: 380, height: 520 }
}

const EDGE_MARGIN = 24

export function getCompanionBounds(
  workArea: Rectangle,
  mode: CompanionMode
): Rectangle {
  const size = WINDOW_SIZE[mode]
  const width = Math.min(size.width, workArea.width - EDGE_MARGIN * 2)
  const height = Math.min(size.height, workArea.height - EDGE_MARGIN * 2)

  return {
    width,
    height,
    x: workArea.x + workArea.width - width - EDGE_MARGIN,
    y: workArea.y + workArea.height - height - EDGE_MARGIN
  }
}
