import type { Rectangle } from 'electron'
import type { CompanionMode } from '../../shared/contracts'

const WINDOW_SIZE: Record<CompanionMode, { width: number; height: number }> = {
  compact: { width: 168, height: 188 },
  expanded: { width: 344, height: 286 }
}

const EDGE_MARGIN = 24

export function getCompanionBounds(
  workArea: Rectangle,
  mode: CompanionMode
): Rectangle {
  const size = WINDOW_SIZE[mode]

  return {
    width: size.width,
    height: size.height,
    x: workArea.x + workArea.width - size.width - EDGE_MARGIN,
    y: workArea.y + workArea.height - size.height - EDGE_MARGIN
  }
}
