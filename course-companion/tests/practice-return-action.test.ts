import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PracticeReturnAction } from '../src/renderer/src/components/PracticeReturnAction'

describe('Practice return state', () => {
  it.each([false, true])('does not announce returning during an unrelated action (quick=%s)', (quick) => {
    const html = renderToStaticMarkup(createElement(PracticeReturnAction, {
      busy: false, disabled: true, quick, onReturn: () => {}
    }))
    expect(html).toContain('disabled=""')
    expect(html).toContain('aria-busy="false"')
    expect(html).not.toContain('practice-return-action__spinner')
    expect(html).not.toContain('Đang lưu kết quả')
  })

  it.each([false, true])('disables repeated return and exposes progress while returning (quick=%s)', (quick) => {
    const html = renderToStaticMarkup(createElement(PracticeReturnAction, {
      busy: true, quick, onReturn: () => {}
    }))
    expect(html).toContain('disabled=""')
    expect(html).toContain('aria-busy="true"')
    expect(html).toContain('practice-return-action__spinner')
    if (!quick) expect(html).toContain('Kết quả đạt đã được lưu.')
  })
})
