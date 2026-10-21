import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import type { PracticeWorkspaceView } from '../shared/contracts'
import { PortfolioPackageSubmission } from '../src/renderer/src/components/PortfolioPackageSubmission'

const workspace: PracticeWorkspaceView = {
  schemaVersion: 1, phase: 'active', title: 'Release', objective: 'Share portfolio', expectedOutcome: 'Online portfolio', checklist: [],
  presentation: { fullPanel: 'progress', compactPanel: 'progress' }, capabilities: { canStartNew: false, canResume: true, selectiveTransferAvailable: false, selectiveTransferReason: 'Unavailable' },
  activePractice: { runId: 'release', generation: 1, practiceId: 'm4-portfolio-release', practiceVersion: '1.0.0', executorChatName: 'Portfolio', startedAt: '2026-10-22T00:00:00.000Z' },
  portfolioPackage: { kind: 'release', sourceDigest: 'a'.repeat(64), ready: true, approved: false, artifactPaths: ['evidence/module-4/deployment-record.json'], issues: [], unexpectedPaths: [],
    deployment: { url: 'https://portfolio.vercel.app/', finalUrl: 'https://portfolio.vercel.app/', reachable: true, status: 200, checkedAt: '2026-10-22T00:00:00.000Z' } }
}

describe('Module 4 Practice submission', () => {
  it('uses one release record and explicit online acceptance without reintroducing planning or quizzes', () => {
    const html = renderToStaticMarkup(createElement(PortfolioPackageSubmission, { workspace }))
    expect(html).toContain('Nộp bài phát hành portfolio')
    expect(html).toContain('deployment-record.json')
    expect(html).toContain('https://portfolio.vercel.app/')
    expect(html).toContain('chưa đăng nhập')
    expect(html).not.toContain('planning/PRD.md')
    expect(html).not.toContain('Năm tài liệu cần nộp')
    expect(html).not.toContain('type="radio"')
    expect(html).not.toContain('checked=""')
  })

  it('keeps missing evidence unavailable and shows retry guidance', () => {
    const html = renderToStaticMarkup(createElement(PortfolioPackageSubmission, { workspace: { ...workspace,
      portfolioPackage: { ...workspace.portfolioPackage!, ready: false, deployment: undefined, issues: ['deployment/public-url: Chưa mở được website.'] } } }))
    expect(html).toContain('Chưa mở được website.')
    expect(html).toMatch(/type="checkbox"[^>]*disabled=""/)
    expect(html).not.toContain('href=')
  })
})
