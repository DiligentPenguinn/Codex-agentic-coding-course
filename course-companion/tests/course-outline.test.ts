import { describe, expect, it } from 'vitest'
import type { LessonId, SceneId } from '../shared/contracts'
import { adjacentOutlinePage, courseOutline, outlineSectionIndex } from '../shared/course/outline'
import { portfolioModuleDefinitions } from '../shared/course/registry'

describe('course outline coverage and reading order', () => {
  for (const module of portfolioModuleDefinitions) {
    it(`covers every ${module.id} page with ordered, unique section starts`, () => {
      const pages = module.scenes.map((scene) => scene.id) as SceneId[]
      const sections = courseOutline[module.id]
      const starts = sections.map((section) => pages.indexOf(section.startSceneId))
      expect(starts[0]).toBe(0)
      expect(starts.every((index) => index >= 0)).toBe(true)
      expect(new Set(starts).size).toBe(starts.length)
      expect(starts).toEqual([...starts].sort((a, b) => a - b))
      for (const [index, page] of pages.entries()) {
        const sectionIndex = outlineSectionIndex(sections, pages, page)
        expect(sectionIndex).toBeGreaterThanOrEqual(0)
        expect(starts[sectionIndex]).toBeLessThanOrEqual(index)
        expect(starts[sectionIndex + 1] ?? pages.length).toBeGreaterThan(index)
        expect(adjacentOutlinePage(pages, page, -1)).toBe(pages[index - 1])
        expect(adjacentOutlinePage(pages, page, 1)).toBe(pages[index + 1])
      }
    })
  }

  it('provides distinct Practice, assessment and summary destinations in all numbered modules', () => {
    for (const moduleId of ['module-1', 'module-2', 'module-3', 'module-4'] as const) {
      const sections = courseOutline[moduleId]
      expect(sections.filter((section) => /^(Thực hành|Practice):/.test(section.title))).toHaveLength(1)
      expect(sections.filter((section) => section.title.startsWith('Kiểm tra cuối'))).toHaveLength(1)
      expect(sections.filter((section) => section.title.startsWith('Tổng kết'))).toHaveLength(1)
    }
  })

  it('keeps destinations in their own module and does not invent progress for unknown pages', () => {
    for (const [moduleId, sections] of Object.entries(courseOutline)) {
      expect(sections.every((section) => section.startSceneId.startsWith(`${moduleId}-`))).toBe(true)
      expect(new Set(sections.map((section) => section.title)).size).toBe(sections.length)
    }
    const pages = ['module-3-git-intro', 'module-3-git-github'] as const
    expect(adjacentOutlinePage(pages, 'module-4-release-intro', 1)).toBeUndefined()
    expect(outlineSectionIndex(courseOutline['module-3' satisfies LessonId], pages, 'module-4-release-intro')).toBe(-1)
  })
})
