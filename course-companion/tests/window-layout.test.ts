import { describe, expect, it } from 'vitest'
import { getCompanionBounds } from '../electron/main/window-layout'

const workArea = { x: 0, y: 25, width: 1440, height: 875 }

describe('getCompanionBounds', () => {
  it('anchors the compact companion inside the lower-right work area', () => {
    expect(getCompanionBounds(workArea, 'compact')).toEqual({
      x: 1248,
      y: 688,
      width: 168,
      height: 188
    })
  })

  it('keeps the expanded companion on screen while preserving its lower-right anchor', () => {
    expect(getCompanionBounds(workArea, 'expanded')).toEqual({
      x: 1036,
      y: 356,
      width: 380,
      height: 520
    })
  })

  it('shrinks the expanded chat panel to fit a small work area', () => {
    expect(getCompanionBounds({ x: 0, y: 0, width: 360, height: 480 }, 'expanded')).toEqual({
      x: 24,
      y: 24,
      width: 312,
      height: 432
    })
  })

  it('accounts for displays whose work area does not begin at zero', () => {
    expect(
      getCompanionBounds({ x: -1920, y: 0, width: 1920, height: 1080 }, 'compact')
    ).toEqual({
      x: -192,
      y: 868,
      width: 168,
      height: 188
    })
  })
})
