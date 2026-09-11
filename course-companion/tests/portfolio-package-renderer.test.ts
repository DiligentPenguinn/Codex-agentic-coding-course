import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { portfolioPackageArtifactPaths, type PracticeWorkspaceView } from '../shared/contracts'
import { PracticeProgress } from '../src/renderer/src/components/PracticeProgress'

function workspace(): PracticeWorkspaceView {
  return { schemaVersion: 1, phase: 'active', title: 'Planning', objective: 'Năm tài liệu', expectedOutcome: 'Gói được duyệt',
    checklist: [{ id: 'portfolio-brief', title: 'Bản mô tả', status: 'current' }],
    review: { status: 'not-reviewed', canReview: true, canReturn: false },
    portfolioPackage: { ready: true, approved: true, sourceDigest: 'a'.repeat(64), artifactPaths: [...portfolioPackageArtifactPaths], issues: [], unexpectedPaths: [] },
    activePractice: { runId: 'run-1', generation: 2, practiceId: 'm2-portfolio-planning', practiceVersion: '2.0.0', executorChatName: 'Portfolio', startedAt: '2026-09-11T00:00:00.000Z' },
    presentation: { fullPanel: 'teacher', compactPanel: 'teacher' },
    capabilities: { canStartNew: true, canResume: true, selectiveTransferAvailable: false, selectiveTransferReason: '' }
  }
}

describe('five-document Practice submission surface', () => {
  it.each([false, true])('shows one explicit, initially unchecked approval in compact=%s', (compact) => {
    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: workspace(), compact }))
    expect(html.match(/type="checkbox"/g)).toHaveLength(1)
    expect(html).not.toContain('checked=""')
    expect(html).toContain('Tôi đã đọc và duyệt PRD cùng kế hoạch triển khai hiện tại.')
    expect(html).toMatch(/disabled=""[^>]*>Duyệt và nộp gói planning/)
    for (const path of portfolioPackageArtifactPaths) expect(html).toContain(path)
    expect(html).not.toContain('first-bounded-task.md')
    expect(html).not.toContain('requirement-validation-map.md')
  })

  it.each([false, true])('keeps one refresh action available until submission is busy in compact=%s', (compact) => {
    const props = { workspace: workspace(), compact, onRefresh: () => {} }
    const available = renderToStaticMarkup(createElement(PracticeProgress, props))
    expect(available.match(/>Làm mới bằng chứng<\/button>/g)).toHaveLength(1)
    expect(available).not.toMatch(/disabled=""[^>]*>Làm mới bằng chứng/)
    const busy = renderToStaticMarkup(createElement(PracticeProgress, { ...props, actionBusy: true }))
    expect(busy).toMatch(/disabled=""[^>]*>Làm mới bằng chứng/)
  })
})
