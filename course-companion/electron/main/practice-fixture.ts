import {
  practiceScenarios,
  type PracticeAdapter,
  type PracticeEvidence,
  type PracticeFixtureRequest,
  type PracticeScenario,
  type PracticeState,
  type PracticeStatus
} from '../../shared/contracts'
import { ProgressRepository } from './progress-repository'

const scenarioSet = new Set<string>(practiceScenarios)

const scenarioDefinition: Record<
  PracticeScenario,
  { status: Exclude<PracticeStatus, 'idle'>; summary: string; evidence?: 'current' | 'stale' }
> = {
  started: {
    status: 'active',
    summary: 'Codex mô phỏng đã bắt đầu thực hiện yêu cầu trong phạm vi đã duyệt.'
  },
  approval_required: {
    status: 'approval_required',
    summary: 'Codex mô phỏng đang chờ bạn duyệt kế hoạch trước khi thay đổi CSS.'
  },
  success: {
    status: 'completed',
    summary: 'Thay đổi mô phỏng hoàn tất và có bằng chứng mới để bạn kiểm tra.',
    evidence: 'current'
  },
  stale: {
    status: 'stale',
    summary: 'Có bằng chứng mô phỏng, nhưng nó cũ hơn thay đổi gần nhất và chưa đủ để duyệt.',
    evidence: 'stale'
  },
  offline: {
    status: 'offline',
    summary: 'Không thể nhận sự kiện mới. Trạng thái hiển thị chỉ là lần mô phỏng gần nhất.'
  },
  error: {
    status: 'error',
    summary: 'Lượt chạy mô phỏng gặp lỗi trước khi tạo được bằng chứng kiểm chứng.'
  }
}

export function isPracticeFixtureRequest(value: unknown): value is PracticeFixtureRequest {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false
  return scenarioSet.has(String((value as Record<string, unknown>).scenario))
}

export class FixturePracticeAdapter implements PracticeAdapter {
  private sequence = 0

  constructor(
    private readonly repository: ProgressRepository,
    private readonly now: () => Date = () => new Date()
  ) {}

  loadState(): Promise<PracticeState> {
    return this.repository.loadPracticeState()
  }

  async emitFixture(request: PracticeFixtureRequest): Promise<PracticeState> {
    if (!isPracticeFixtureRequest(request)) throw new Error('Invalid practice fixture request')

    const now = this.now()
    const timestamp = now.toISOString()
    const definition = scenarioDefinition[request.scenario]
    const correlationId = `fixture-m1-${timestamp}-${++this.sequence}`
    const evidence: PracticeEvidence | undefined = definition.evidence
      ? {
          viewport: '390px',
          changedScope: 'onboarding CSS',
          horizontalOverflow: definition.evidence === 'current' ? 'Không phát hiện' : 'Chưa kiểm tra lại',
          observedAt:
            definition.evidence === 'current'
              ? timestamp
              : new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          freshness: definition.evidence
        }
      : undefined

    return this.repository.savePractice({
      missionId: 'm1-verifiable-brief',
      status: definition.status,
      latestEvent: {
        id: `${correlationId}-${request.scenario}`,
        missionId: 'm1-verifiable-brief',
        scenario: request.scenario,
        status: definition.status,
        source: 'fixture',
        correlationId,
        timestamp,
        summary: definition.summary,
        evidence
      }
    })
  }
}
