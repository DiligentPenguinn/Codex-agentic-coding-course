import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { PracticeProgress } from '../src/renderer/src/components/PracticeProgress'
import type {
  CodexTaskConfigurationSnapshot,
  PracticeWorkspaceView
} from '../shared/contracts'

const observedAt = '2026-08-11T00:00:00.000Z'

function configuration(
  overrides: Partial<CodexTaskConfigurationSnapshot> = {}
): CodexTaskConfigurationSnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-1',
    threadId: 'thread-1',
    source: 'thread-resume',
    eventTimestampMs: 1,
    observedAt,
    freshness: 'fresh',
    connection: 'connected',
    model: { protocolValue: 'gpt-5.6-sol', label: '5.6 Sol' },
    reasoningEffort: { protocolValue: 'high', label: 'High' },
    serviceTier: { protocolValue: 'standard', label: 'Standard' },
    approvalPolicy: { protocolValue: 'on-request', label: 'Approve for me' },
    fullAccess: { protocolValue: 'off', label: 'Off' },
    sandboxType: 'workspaceWrite',
    activePermissionProfile: null,
    ...overrides
  }
}

function workspace(
  config: CodexTaskConfigurationSnapshot | null = configuration()
): PracticeWorkspaceView {
  return {
    schemaVersion: 1,
    phase: 'active',
    title: 'Thiết lập Codex an toàn',
    objective: 'Thiết lập Codex an toàn.',
    expectedOutcome: 'Đủ năm giá trị.',
    checklist: [
      { id: 'set-model', title: 'Chọn Model 5.6 Sol', status: 'current' }
    ],
    review: { status: 'not-reviewed', canReview: true, canReturn: false },
    ...(config ? { configuration: config } : {}),
    activePractice: {
      runId: 'run-1',
      generation: 1,
      practiceId: 'm1-codex-safe-setup',
      practiceVersion: '2.0.0',
      executorChatName: 'Practice · Module 1',
      startedAt: observedAt
    },
    presentation: { fullPanel: 'teacher', compactPanel: 'teacher' },
    capabilities: {
      canStartNew: true,
      canResume: true,
      selectiveTransferAvailable: false,
      selectiveTransferReason: 'Không khả dụng.'
    }
  }
}

describe('Module 1 Practice renderer', () => {
  it('communicates the direct metadata flow without screenshots or an Executor report', async () => {
    const source = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'surfaces',
      'LearningWindow.tsx'
    ), 'utf8')
    expect(source).toContain('PRACTICE · METADATA TRỰC TIẾP')
    expect(source).toContain('KHÔNG CẦN ẢNH CHỤP')
    expect(source).toContain('Triết duyệt trực tiếp năm giá trị')
    expect(source).not.toContain('PRACTICE · 2 ẢNH')
  })

  it('defines an announced loading state before workspace metadata is available', async () => {
    const source = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'components',
      'PracticeBrief.tsx'
    ), 'utf8')
    expect(source).toContain('Đang đọc Practice')
    expect(source).toContain('aria-live')
  })

  it('shows all detected values and a fresh mismatch', () => {
    const html = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: workspace(configuration({
        model: { protocolValue: 'gpt-5.6-terra', label: '5.6 Terra' }
      }))
    }))
    expect(html).toContain('CẤU HÌNH TASK ĐƯỢC PHÁT HIỆN')
    expect(html).toContain('5.6 Terra')
    expect(html).toContain('Cần 5.6 Sol')
    expect(html.match(/<dt>/g)).toHaveLength(5)
  })

  it('discloses stale, disconnected, and unavailable metadata', () => {
    const stale = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: workspace(configuration({
        freshness: 'stale',
        connection: 'disconnected'
      }))
    }))
    expect(stale).toContain('CHƯA THỂ XÁC MINH')
    expect(stale).toContain('Mất kết nối')

    const unavailable = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: workspace(null)
    }))
    expect(unavailable).toContain('CHƯA CÓ DỮ LIỆU')
    expect(unavailable).toContain('Không xác minh được')
  })

  it('renders pass and native keyboard-operable return controls in full and compact modes', () => {
    const passed = {
      ...workspace(),
      review: {
        status: 'passed' as const,
        canReview: true,
        canReturn: true
      }
    }
    const full = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: passed,
      onReturn: () => undefined
    }))
    const compact = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: passed,
      compact: true,
      onReturn: () => undefined
    }))
    expect(full).toContain('ĐÃ ĐẠT')
    expect(full).toContain('Quay lại khóa học</button>')
    expect(compact).toContain('practice-progress is-compact')
  })

  it('keeps Practice animation disabled for reduced-motion users', async () => {
    const css = await readFile(join(
      process.cwd(),
      'src',
      'renderer',
      'src',
      'styles.css'
    ), 'utf8')
    expect(css).toContain('@media (prefers-reduced-motion: reduce)')
    expect(css).toContain('.practice-loading-orbit { animation: none;')
  })
})

describe('Module 2 Practice renderer', () => {
  const planningWorkspace: PracticeWorkspaceView = {
    schemaVersion: 1,
    phase: 'active',
    title: 'Xây dựng planning package',
    objective: 'Tạo planning package.',
    expectedOutcome: 'Hai artifact đã duyệt và khớp nhau.',
    checklist: [
      { id: 'approve-prd', title: 'Duyệt PRD', status: 'completed' },
      {
        id: 'reconcile-alignment',
        title: 'Đối chiếu alignment',
        status: 'stale',
        reason: 'PRD đã thay đổi sau lần đối chiếu trước.'
      },
      { id: 'approve-plan', title: 'Duyệt plan', status: 'pending' }
    ],
    review: { status: 'needs-work', canReview: false, canReturn: false },
    completionDestination: {
      lessonId: 'module-2',
      checkpointId: 'm2-mastery',
      sceneId: 'module-2-mastery',
      label: 'Bài kiểm tra và hoàn thành Module 2'
    },
    planning: {
      freshness: 'fresh',
      observedAt,
      artifacts: [
        {
          path: 'artifacts/PRD.md',
          availability: 'available',
          approval: 'stale',
          freshness: 'fresh'
        },
        {
          path: 'artifacts/implementation-plan.md',
          availability: 'available',
          approval: 'approved',
          freshness: 'stale'
        }
      ],
      alignment: 'stale',
      unexpectedChangedPaths: ['app/globals.css'],
      invalidations: [{
        changedInput: 'artifacts/PRD.md',
        affectedStepIds: ['reconcile-alignment', 'approve-plan'],
        reason: 'PRD đã thay đổi sau khi plan được duyệt.',
        nextAction: 'Đối chiếu lại PRD và plan.'
      }],
      actionContext: {
        generation: 2,
        prdDigest: 'prd-current',
        planDigest: 'plan-current'
      }
    },
    activePractice: {
      runId: 'run-2',
      generation: 2,
      practiceId: 'm2-planning-package',
      practiceVersion: '2.0.0',
      executorChatName: 'Practice · Module 2',
      startedAt: observedAt
    },
    presentation: { fullPanel: 'teacher', compactPanel: 'teacher' },
    capabilities: {
      canStartNew: true,
      canResume: true,
      selectiveTransferAvailable: false,
      selectiveTransferReason: 'Không khả dụng.'
    }
  }

  it('shows artifact, alignment, scope, invalidation, recovery, and destination state', () => {
    const html = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: planningWorkspace,
      onPlanningAction: () => undefined,
      onRefresh: () => undefined
    }))
    expect(html).toContain('PLANNING PACKAGE')
    expect(html).toContain('PRD.md')
    expect(html).toContain('implementation-plan.md')
    expect(html).toContain('Cần đối chiếu lại')
    expect(html).toContain('app/globals.css')
    expect(html).toContain('DEPENDENCY VỪA THAY ĐỔI')
    expect(html).toContain('Bước cần xem lại: Đối chiếu alignment, Duyệt plan')
    expect(html).not.toContain('reconcile-alignment, approve-plan')
    expect(html).toContain('Tiếp theo: Đối chiếu lại PRD và plan.')
    expect(html).toContain('Xác nhận bốn điểm alignment')
    expect(html).toContain('Làm mới bằng chứng')
    expect(html).toContain('Sau khi đạt: Bài kiểm tra và hoàn thành Module 2')
    expect(html).not.toContain('m2-mastery')
    expect(html).not.toContain('m2-planning-package')
  })

  it('uses the same evidence projection in compact mode', () => {
    const html = renderToStaticMarkup(createElement(PracticeProgress, {
      workspace: planningWorkspace,
      compact: true
    }))
    expect(html).toContain('practice-progress is-compact')
    expect(html).toContain('DEPENDENCY VỪA THAY ĐỔI')
    expect(html).toContain('CẦN BỔ SUNG')
  })
})
