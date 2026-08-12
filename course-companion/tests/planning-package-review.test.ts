import { createHash } from 'node:crypto'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import {
  buildPracticeReviewEnvelope,
  type PracticeReviewEnvelope
} from '../electron/main/practice-review-context'
import { parsePracticeReviewResult } from '../electron/main/practice-review-contracts'
import { DeterministicPracticeReviewEvaluator } from '../electron/main/practice-review-evaluator'
import { planningPracticeStepIds } from '../electron/main/practice-step-state'
import type { PracticeRunRecord } from '../electron/main/practice-run-repository'
import type {
  PlanningArtifactSnapshot,
  PracticeAdapterEvidenceState,
  PracticeDefinition
} from '../shared/contracts'

const timestamp = '2026-08-11T00:00:00.000Z'
const definitions = new PracticeDefinitionRepository(join(process.cwd(), 'content', 'practices'))

const strongPrd = `# PRD — ContentPilot

## 1. Ý tưởng sản phẩm
ContentPilot giúp content creator biến dữ liệu bài viết thành gợi ý nội dung có thể xem xét.

## 2. Luồng sử dụng cốt lõi
Người dùng chọn profile, xem phân tích, chọn một gợi ý và nhận brief.

## 3. Input
URL profile hoặc profile mẫu cùng mục tiêu nội dung.

## 4. Output
Danh sách gợi ý có lý do và một brief cho gợi ý được chọn.

## 5. Phạm vi phiên bản 1
- Nhận một profile.
- Trả tối đa năm gợi ý.
- Cho phép chọn một gợi ý để tạo brief.

## 6. Ngoài phạm vi
- Không tự động xuất bản.
- Không lập lịch nội dung.

## 7. Done When
- Người dùng nhập profile và quan sát được tối đa năm gợi ý.
- Người dùng chọn một gợi ý và nhận được brief có tiêu đề, góc tiếp cận và dàn ý.

## 8. Câu hỏi còn mở
- Không còn.

## Phê duyệt
- Trạng thái: Đã duyệt
`

const strongPlan = `# Implementation plan — ContentPilot

> Nguồn duy nhất cho phạm vi sản phẩm: artifacts/PRD.md. Plan chưa chứa code.

## 1. Cách tiếp cận tổng thể
Đi từ input profile đến phân tích, gợi ý và brief theo từng kết quả nhỏ có thể kiểm tra.

## 2. Các bước triển khai

### Bước 1 — Nhận profile
- Mục tiêu: Nhận URL hoặc profile mẫu.
- Thành phần hoặc file dự kiến: Màn hình nhập và lớp dữ liệu profile.
- Kết quả có thể quan sát: Profile hợp lệ được hiển thị.
- Cách kiểm tra: Nhập URL và profile mẫu rồi quan sát trạng thái.
- Phụ thuộc: Không có.
- Yêu cầu PRD liên quan: Input; phạm vi phiên bản 1.

### Bước 2 — Tạo gợi ý và brief
- Mục tiêu: Trả tối đa năm gợi ý và brief cho lựa chọn.
- Thành phần hoặc file dự kiến: Luồng phân tích, danh sách gợi ý và màn hình brief.
- Kết quả có thể quan sát: Có tối đa năm gợi ý; lựa chọn trả về brief.
- Cách kiểm tra: Chạy toàn bộ luồng từ profile đến brief và đối chiếu Done When.
- Phụ thuộc: Bước 1.
- Yêu cầu PRD liên quan: Output; Done When.

## 3. Giả định, rủi ro và quyết định kỹ thuật còn mở
- Giả định: Profile mẫu luôn sẵn có.
- Rủi ro: Dữ liệu profile có thể thiếu.
- Quyết định còn mở: Cách lấy dữ liệu profile thật.

## 4. Kiểm tra toàn bộ luồng
- Nhập profile, quan sát tối đa năm gợi ý, chọn một gợi ý và xác nhận brief.

## 5. Kiểm tra khớp với PRD
- [x] Mọi yêu cầu trong phạm vi PRD đều có bước triển khai.
- [x] Mọi bước đều truy ngược được về một yêu cầu trong PRD.
- [x] Không có nội dung thuộc phần ngoài phạm vi.
- [x] Mọi mục \`Done When\` của PRD đều có cách kiểm tra tương ứng.

## Phê duyệt
- Trạng thái: Đã duyệt
`

function digest(content: string): string {
  return createHash('sha256').update(content).digest('hex')
}

function artifact(
  path: PlanningArtifactSnapshot['path'],
  content: string
): PlanningArtifactSnapshot {
  return {
    schemaVersion: 1,
    path,
    content,
    digest: digest(content),
    byteLength: Buffer.byteLength(content),
    modifiedAt: timestamp,
    observedAt: timestamp
  }
}

function run(
  definition: PracticeDefinition,
  options: {
    prd?: string
    plan?: string
    approvals?: boolean
    alignment?: boolean
    scopeDecision?: string
    unexpected?: string[]
    freshness?: PracticeAdapterEvidenceState['freshness']
  } = {}
): PracticeRunRecord {
  const prd = options.prd ?? strongPrd
  const plan = options.plan ?? strongPlan
  const prdDigest = digest(prd)
  const planDigest = digest(plan)
  const prompt = 'Hãy phỏng vấn tôi từng câu để tạo PRD một trang có đủ tám phần.'
  const promptDigest = digest(prompt)
  const planningArtifacts = [
    artifact('artifacts/PRD.md', prd),
    artifact('artifacts/implementation-plan.md', plan)
  ]
  return {
    runId: 'run-2',
    generation: 1,
    status: 'active',
    practiceId: definition.practiceId,
    practiceVersion: definition.version,
    workspaceKind: definition.workspaceKind,
    taskPolicy: definition.taskPolicy,
    evidenceProfile: definition.evidenceProfile,
    binding: {
      runId: 'run-2',
      threadId: 'thread-2',
      name: 'Practice · Module 2',
      workspaceRoot: 'D:\\course',
      createdAt: timestamp
    },
    startedAt: timestamp,
    updatedAt: timestamp,
    checklist: definition.checklist.map((step, index) => ({
      id: step.id,
      title: step.title,
      status: index < 6 ? 'completed' : index === 6 ? 'current' : 'pending',
      dependencyInputs: {}
    })),
    learnerDecisions: {
      'prd-prompt': prompt,
      'prd-prompt-digest': promptDigest,
      'interview-completion': '{"learnerTurnCount":5,"executorTurnCount":4}',
      ...(options.alignment === false
        ? {}
        : { 'alignment-confirmed': prdDigest + ':' + planDigest }),
      'scope-decision': options.scopeDecision
        ?? 'Tôi giữ xuất bản thủ công trong phạm vi để phiên bản đầu tập trung vào chất lượng gợi ý.'
    },
    learnerApprovals: options.approvals === false
      ? {}
      : {
          'prd-approval': {
            decision: 'approved',
            recordedAt: timestamp,
            artifactDigests: { 'artifacts/PRD.md': prdDigest }
          },
          'plan-approval': {
            decision: 'approved',
            recordedAt: timestamp,
            artifactDigests: {
              'artifacts/PRD.md': prdDigest,
              'artifacts/implementation-plan.md': planDigest
            }
          }
        },
    evidence: {
      schemaVersion: 1,
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      runId: 'run-2',
      evidenceProfile: 'planning-package',
      observedAt: timestamp,
      freshness: options.freshness ?? 'fresh',
      sourceDigest: 'e'.repeat(64),
      evidence: [],
      steps: [],
      invalidations: [],
      planningArtifacts,
      artifactIssues: [],
      unexpectedChangedPaths: options.unexpected ?? [],
      planningActivity: {
        schemaVersion: 1,
        cursor: 'turn-5:item-2',
        observedAt: timestamp,
        learnerTurnCount: 5,
        executorTurnCount: 4,
        prdPrompt: { text: prompt, digest: promptDigest }
      }
    },
    invalidations: [],
    reviewStatus: 'not-reviewed'
  }
}

async function envelope(options: Parameters<typeof run>[1] = {}): Promise<{
  definition: PracticeDefinition
  envelope: PracticeReviewEnvelope
}> {
  const definition = await definitions.load('m2-planning-package', '2.0.0')
  const active = run(definition, options)
  return {
    definition,
    envelope: buildPracticeReviewEnvelope({
      definition,
      run: active,
      activity: null,
      decisions: active.learnerDecisions,
      generatedAt: timestamp
    })
  }
}

async function evaluate(options: Parameters<typeof run>[1] = {}) {
  const input = await envelope(options)
  const text = await new DeterministicPracticeReviewEvaluator().evaluate(input.envelope)
  return {
    ...input,
    result: parsePracticeReviewResult({
      text,
      definition: input.definition,
      runId: 'run-2',
      evidence: input.envelope.evidence,
      reviewedAt: timestamp,
      planningEvidenceDigest: input.envelope.planning?.evidenceDigest
    })
  }
}

describe('Module 2 planning-package semantic review', () => {
  it('loads the approved eight-step definition and deterministically passes a strong package', async () => {
    const { definition, envelope: frozen, result } = await evaluate()

    expect(definition.checklist.map((step) => step.id)).toEqual(planningPracticeStepIds)
    expect(definition.criteria).toHaveLength(6)
    expect(frozen.planning?.artifacts).toHaveLength(2)
    expect(result.verdict).toBe('passed')
    expect(result.criteria.every((criterion) => criterion.status === 'satisfied')).toBe(true)
  })

  it.each([
    ['weak PRD', { prd: '# PRD\nÝ tưởng còn mơ hồ.' }],
    ['weak plan', { plan: '# Plan\nLàm ứng dụng.' }],
    ['alignment gap', { alignment: false }],
    ['implementation code', { plan: strongPlan + '\n```ts\nconst secret = 1\n```' }],
    ['absent approvals', { approvals: false }],
    ['stale evidence', { freshness: 'stale' as const }]
  ])('returns needs-work for %s', async (_label, options) => {
    expect((await evaluate(options)).result.verdict).toBe('needs-work')
  })

  it('blocks a pass when any unexpected workspace path changed without exposing its content', async () => {
    const { envelope: frozen, result } = await evaluate({
      unexpected: ['src/private.ts']
    })

    expect(result.verdict).toBe('needs-work')
    expect(frozen.evidence).toContainEqual(expect.objectContaining({
      kind: 'unexpected-workspace-change',
      text: 'src/private.ts'
    }))
    expect(JSON.stringify(frozen)).not.toContain('contents of src/private.ts')
  })

  it('keeps the frozen evidence digest stable across timestamps and changes it with artifact content', async () => {
    const first = await envelope()
    const active = run(first.definition)
    const second = buildPracticeReviewEnvelope({
      definition: first.definition,
      run: active,
      activity: null,
      generatedAt: '2026-08-11T01:00:00.000Z'
    })
    const changed = await envelope({ prd: strongPrd + '\nThay đổi phạm vi.' })

    expect(second.planning?.evidenceDigest).toBe(first.envelope.planning?.evidenceDigest)
    expect(changed.envelope.planning?.evidenceDigest)
      .not.toBe(first.envelope.planning?.evidenceDigest)
  })

  it('rejects malformed output and a fabricated pass without complete current ownership evidence', async () => {
    const { definition, envelope: frozen } = await envelope({ approvals: false })
    expect(() => parsePracticeReviewResult({
      text: '{"verdict":"passed"}',
      definition,
      runId: 'run-2',
      evidence: frozen.evidence,
      reviewedAt: timestamp,
      planningEvidenceDigest: frozen.planning?.evidenceDigest
    })).toThrow()

    const fabricated = JSON.stringify({
      schemaVersion: 1,
      practiceId: definition.practiceId,
      practiceVersion: definition.version,
      runId: 'run-2',
      verdict: 'passed',
      criteria: definition.criteria.map((criterion) => ({
        criterionId: criterion.id,
        status: 'satisfied',
        evidenceRefs: frozen.evidence
          .filter((item) => criterion.acceptedEvidence.includes(item.kind))
          .slice(0, 1)
          .map((item) => item.id),
        explanation: 'Đạt.'
      })),
      summary: 'Đạt.'
    })
    expect(() => parsePracticeReviewResult({
      text: fabricated,
      definition,
      runId: 'run-2',
      evidence: frozen.evidence,
      reviewedAt: timestamp,
      planningEvidenceDigest: frozen.planning?.evidenceDigest
    })).toThrow()
  })
})
