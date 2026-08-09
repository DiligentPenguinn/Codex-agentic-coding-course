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
    summary: 'Coding agent mô phỏng đang chuyển các quyết định của bạn thành planning package.'
  },
  approval_required: {
    status: 'approval_required',
    summary: 'PRD và implementation plan đã có bản nháp; coding agent đang chờ bạn review và duyệt.'
  },
  success: {
    status: 'completed',
    summary: 'Planning package mô phỏng đã có đủ hai artifact và vượt qua alignment review.',
    evidence: 'current'
  },
  stale: {
    status: 'stale',
    summary: 'PRD đã thay đổi sau lần review gần nhất nên implementation plan cần được đối chiếu lại.',
    evidence: 'stale'
  },
  offline: {
    status: 'offline',
    summary: 'Không thể nhận sự kiện mới. Trạng thái hiển thị chỉ là lần mô phỏng gần nhất.'
  },
  error: {
    status: 'error',
    summary: 'Lượt planning mô phỏng gặp lỗi trước khi tạo đủ hai artifact.'
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
          prdArtifact: 'PRD.md · đã duyệt',
          implementationPlanArtifact: 'implementation-plan.md · đã duyệt',
          alignment: definition.evidence === 'current' ? 'Khớp PRD' : 'Cần kiểm tra lại',
          observedAt:
            definition.evidence === 'current'
              ? timestamp
              : new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
          freshness: definition.evidence
        }
      : undefined

    return this.repository.savePractice({
      missionId: 'm1-planning-package',
      status: definition.status,
      latestEvent: {
        id: `${correlationId}-${request.scenario}`,
        missionId: 'm1-planning-package',
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
