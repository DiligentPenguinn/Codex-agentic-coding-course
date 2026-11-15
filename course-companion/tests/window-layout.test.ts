import { describe, expect, it } from 'vitest'
import { getCompanionBounds } from '../electron/main/window-layout'

const workArea = { x: 0, y: 25, width: 1440, height: 875 }

describe('getCompanionBounds', () => {
  it('preserves a user-chosen anchor across expansion and collapse', () => {
    const anchor = { right: 1050, bottom: 750 }
    expect(getCompanionBounds(workArea, 'expanded', anchor)).toEqual({ x: 670, y: 110, width: 380, height: 640 })
    expect(getCompanionBounds(workArea, 'compact', anchor)).toEqual({ x: 882, y: 562, width: 168, height: 188 })
  })

  it('clamps a chosen location to the work area without changing the anchor', () => {
    const anchor = { right: 100, bottom: 100 }
    expect(getCompanionBounds(workArea, 'expanded', anchor)).toEqual({ x: 24, y: 49, width: 380, height: 640 })
    expect(anchor).toEqual({ right: 100, bottom: 100 })
  })

  it('preserves a chosen location on a display with negative coordinates', () => {
    expect(getCompanionBounds({ x: -1920, y: 0, width: 1920, height: 1080 }, 'compact',
      { right: -500, bottom: 800 })).toEqual({ x: -668, y: 612, width: 168, height: 188 })
  })
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
      y: 236,
      width: 380,
      height: 640
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
