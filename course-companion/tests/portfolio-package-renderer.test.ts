import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { portfolioBuildRecordPaths, portfolioPackageArtifactPaths, type PracticeWorkspaceView } from '../shared/contracts'
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
  it.each([false, true])('uses website acceptance and three supporting records for build v2 in compact=%s', (compact) => {
    const view = workspace()
    view.activePractice!.practiceId = 'm3-portfolio-build'
    view.portfolioPackage!.kind = 'build'
    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: view, compact }))
    expect(html.match(/type="checkbox"/g)).toHaveLength(1)
    for (const path of portfolioBuildRecordPaths) expect(html.split(path)).toHaveLength(2)
    expect(html).toContain('Chấp nhận website và nộp bài')
    expect(html).not.toContain('Duyệt và nộp gói planning')
    expect(html).not.toContain('Tôi đã đọc và duyệt PRD')
    expect(html).not.toContain('Chấp nhận phần này')
    expect(html).not.toContain('checked=""')
  })
  it.each([false, true])('shows every required path once while preserving distinct issues in compact=%s', (compact) => {
    const view = workspace()
    view.portfolioPackage!.ready = false
    view.portfolioPackage!.issues = [
      'planning/PRD.md: Chưa có tài liệu bắt buộc.',
      'planning/PRD.md: Chưa có tài liệu bắt buộc.',
      'planning/PRD.md: Thiếu mục bắt buộc.',
      'Cần làm mới bằng chứng.'
    ]
    const html = renderToStaticMarkup(createElement(PracticeProgress, { workspace: view, compact, showObjective: false }))
    for (const path of portfolioPackageArtifactPaths) expect(html.split(path)).toHaveLength(2)
    expect(html.split('Chưa có tài liệu bắt buộc.')).toHaveLength(2)
    expect(html).toContain('Thiếu mục bắt buộc.')
    expect(html).toContain('Cần làm mới bằng chứng.')
    expect(html).not.toContain('practice-package-documents')
    expect(html).not.toContain('>Năm tài liệu</strong>')
    if (!compact) {
      expect(html).toContain('<details class="practice-package-progress">')
      expect(html).toContain('Xem tiến độ chi tiết')
      expect(html).not.toContain('<details class="practice-package-progress" open')
    }
    if (compact) expect(html).toContain('Hoàn thành bước hiện tại: Bản mô tả.')
    else expect(html).not.toContain('Hoàn thành bước hiện tại: Bản mô tả.')
  })
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
