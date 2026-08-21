import type { PracticeCriterionReview } from '../../shared/contracts'
import type { PracticeReviewEnvelope } from './practice-review-context'
import { buildPracticeReviewPrompt } from './practice-review-context'

export type PracticeReviewEvaluator = {
  evaluate: (envelope: PracticeReviewEnvelope) => Promise<string>
}

export type TeacherResponder = {
  respond: (input: string) => Promise<string>
  review?: (input: string) => Promise<string>
}

export class LivePracticeReviewEvaluator implements PracticeReviewEvaluator {
  constructor(private readonly responder: TeacherResponder) {}

  evaluate(envelope: PracticeReviewEnvelope): Promise<string> {
    const prompt = buildPracticeReviewPrompt(envelope)
    return this.responder.review?.(prompt) ?? this.responder.respond(prompt)
  }
}

export class DeterministicPracticeReviewEvaluator implements PracticeReviewEvaluator {
  async evaluate(envelope: PracticeReviewEnvelope): Promise<string> {
    if (envelope.definition.evidenceProfile === 'planning-package') {
      return this.evaluatePlanning(envelope)
    }
    if (envelope.definition.evidenceProfile === 'portfolio-build') {
      return this.evaluatePortfolioBuild(envelope)
    }
    const nonTeacher = envelope.definition.criteria.filter((criterion) =>
      !criterion.acceptedEvidence.includes('teacher-assessment'))
    const initial = nonTeacher.map((criterion): PracticeCriterionReview => {
      const candidates = envelope.evidence.filter((evidence) =>
        criterion.acceptedEvidence.includes(evidence.kind))
      const usable = candidates.filter((evidence) =>
        criterion.freshness === 'any' || evidence.freshness === 'fresh')
      return {
        criterionId: criterion.id,
        status: usable.length > 0
          ? 'satisfied'
          : candidates.length > 0 ? 'unverifiable' : 'unsatisfied',
        evidenceRefs: usable.map((evidence) => evidence.id),
        explanation: usable.length > 0
          ? 'C\u00f3 b\u1eb1ng ch\u1ee9ng ph\u00f9 h\u1ee3p v\u1edbi ti\u00eau ch\u00ed.'
          : candidates.length > 0
            ? 'B\u1eb1ng ch\u1ee9ng hi\u1ec7n c\u00f3 ch\u01b0a \u0111\u1ee7 m\u1edbi \u0111\u1ec3 ki\u1ec3m ch\u1ee9ng.'
            : 'Ch\u01b0a c\u00f3 b\u1eb1ng ch\u1ee9ng ph\u00f9 h\u1ee3p v\u1edbi ti\u00eau ch\u00ed.'
      }
    })
    const allRequiredInputsSatisfied = nonTeacher
      .filter((criterion) => criterion.required)
      .every((criterion) => initial.find((result) => result.criterionId === criterion.id)?.status === 'satisfied')
    const teacherCriteria = envelope.definition.criteria
      .filter((criterion) => criterion.acceptedEvidence.includes('teacher-assessment'))
      .map((criterion): PracticeCriterionReview => ({
        criterionId: criterion.id,
        status: allRequiredInputsSatisfied ? 'satisfied' : 'unsatisfied',
        evidenceRefs: allRequiredInputsSatisfied ? ['teacher-assessment:1'] : [],
        explanation: allRequiredInputsSatisfied
          ? 'H\u01b0\u01a1ng \u0111\u00e3 \u0111\u1ed1i chi\u1ebfu to\u00e0n b\u1ed9 ti\u00eau ch\u00ed b\u1eaft bu\u1ed9c.'
          : 'C\u1ea7n b\u1ed5 sung b\u1eb1ng ch\u1ee9ng b\u1eaft bu\u1ed9c tr\u01b0\u1edbc khi H\u01b0\u01a1ng c\u00f3 th\u1ec3 k\u1ebft lu\u1eadn.'
      }))
    const criteria = [...initial, ...teacherCriteria]
    const byId = new Map(criteria.map((criterion) => [criterion.criterionId, criterion.status]))
    const passed = envelope.definition.criteria
      .filter((criterion) => criterion.required)
      .every((criterion) => byId.get(criterion.id) === 'satisfied')
    return JSON.stringify({
      schemaVersion: 1,
      practiceId: envelope.definition.practiceId,
      practiceVersion: envelope.definition.version,
      runId: envelope.run.runId,
      verdict: passed ? 'passed' : 'needs-work',
      criteria,
      summary: passed
        ? 'B\u1ea1n \u0111\u00e3 \u0111\u00e1p \u1ee9ng to\u00e0n b\u1ed9 ti\u00eau ch\u00ed b\u1eaft bu\u1ed9c c\u1ee7a Practice.'
        : 'Practice ch\u01b0a \u0111\u1ee7 b\u1eb1ng ch\u1ee9ng \u0111\u1ec3 ho\u00e0n th\u00e0nh.'
    })
  }

  private async evaluatePortfolioBuild(envelope: PracticeReviewEnvelope): Promise<string> {
    const build = envelope.portfolioBuild
    const stageById = new Map(build?.stages.map((stage) => [stage.stageId, stage]))
    const clean = Boolean(build && build.issues.length === 0 && build.unexpectedPaths.length === 0)
    const criteria = envelope.definition.criteria.map((criterion): PracticeCriterionReview => {
      const stage = stageById.get(criterion.checklistStepId)
      const evidenceRefs = stage
        ? envelope.evidence
            .filter((item) => item.freshness === 'fresh')
            .map((item) => item.id)
            .slice(0, 12)
        : []
      const satisfied = clean && stage?.status === 'ready'
      return {
        criterionId: criterion.id,
        status: satisfied ? 'satisfied' : build ? 'unsatisfied' : 'unverifiable',
        evidenceRefs,
        explanation: satisfied
          ? 'Bằng chứng hiện tại của phần này đã đầy đủ và không có lỗi kiểm chứng.'
          : stage?.issueCodes.length
            ? `Còn thiếu bằng chứng hoặc kiểm tra chưa đạt: ${stage.issueCodes.join(', ')}.`
            : 'Chưa có đủ bằng chứng hiện tại để xác nhận phần này.'
      }
    })
    const passed = envelope.definition.criteria
      .filter((criterion) => criterion.required)
      .every((criterion) => criteria.find((item) =>
        item.criterionId === criterion.id)?.status === 'satisfied')
    return JSON.stringify({
      schemaVersion: 1,
      practiceId: envelope.definition.practiceId,
      practiceVersion: envelope.definition.version,
      runId: envelope.run.runId,
      verdict: passed ? 'passed' : 'needs-work',
      criteria,
      summary: passed
        ? 'Các phần bắt buộc và kết quả kiểm tra hiện tại đã đầy đủ.'
        : 'Website hiện tại vẫn còn một phần cần hoàn thành.'
    })
  }

  private async evaluatePlanning(envelope: PracticeReviewEnvelope): Promise<string> {
    const planning = envelope.planning
    const prd = planning?.artifacts.find((artifact) =>
      artifact.path === 'artifacts/PRD.md')?.content ?? ''
    const plan = planning?.artifacts.find((artifact) =>
      artifact.path === 'artifacts/implementation-plan.md')?.content ?? ''
    const noCode = (value: string) => !/```|\b(?:function|class|const|let|var)\s+[A-Za-z_$]|\bimport\s+.+\bfrom\b|<\/?[A-Za-z][^>]*>|\bnpm\s+(?:install|run)\b/i.test(value)
    const hasAll = (value: string, patterns: RegExp[]) => patterns.every((pattern) => pattern.test(value))
    const prdStrong = hasAll(prd, [
      /##\s*1\.\s*Ý tưởng sản phẩm/i,
      /##\s*2\.\s*Luồng sử dụng cốt lõi/i,
      /##\s*3\.\s*Input/i,
      /##\s*4\.\s*Output/i,
      /##\s*5\.\s*Phạm vi phiên bản 1/i,
      /##\s*6\.\s*Ngoài phạm vi/i,
      /##\s*7\.\s*Done When/i,
      /##\s*8\.\s*Câu hỏi còn mở/i
    ]) && /(?:quan sát|hiển thị|tạo|trả|nhận|không có|không còn)/i.test(prd)
      && noCode(prd)
    const planStrong = hasAll(plan, [
      /Nguồn duy nhất[^\n]*artifacts\/PRD\.md/i,
      /##\s*1\.\s*Cách tiếp cận tổng thể/i,
      /##\s*2\.\s*Các bước triển khai/i,
      /Mục tiêu\s*:/i,
      /Thành phần hoặc file dự kiến\s*:/i,
      /Kết quả có thể quan sát\s*:/i,
      /Cách kiểm tra\s*:/i,
      /Phụ thuộc\s*:/i,
      /Yêu cầu PRD liên quan\s*:/i,
      /Giả định, rủi ro và quyết định kỹ thuật còn mở/i,
      /Kiểm tra toàn bộ luồng/i
    ]) && noCode(plan)
    const aligned = hasAll(plan, [
      /Mọi yêu cầu trong phạm vi PRD đều có bước triển khai/i,
      /Mọi bước đều truy ngược được về một yêu cầu trong PRD/i,
      /Không có nội dung thuộc phần ngoài phạm vi/i,
      /Mọi mục `Done When` của PRD đều có cách kiểm tra tương ứng/i
    ]) && Boolean(planning?.alignment)
    const noUnexpected = (planning?.unexpectedChangedPaths.length ?? 1) === 0
    const fresh = planning?.freshness === 'fresh'
      && planning.artifacts.length === 2
      && envelope.evidence
        .filter((item) => [
          'planning-artifact',
          'learner-approval',
          'scope-decision',
          'artifact-alignment'
        ].includes(item.kind))
        .every((item) => item.freshness === 'fresh')
    const ownership = Boolean(
      planning?.prdPrompt
      && planning.scopeDecision
      && envelope.evidence.some((item) => item.id === 'learner-approval:prd'
        && item.freshness === 'fresh')
      && envelope.evidence.some((item) => item.id === 'learner-approval:plan'
        && item.freshness === 'fresh')
    )
    const results = new Map<string, {
      satisfied: boolean
      evidenceRefs: string[]
      explanation: string
    }>([
      ['prd-quality', {
        satisfied: prdStrong,
        evidenceRefs: prd ? ['planning-artifact:prd'] : [],
        explanation: prdStrong
          ? 'PRD có đủ tám phần, ranh giới phạm vi và Done When có thể kiểm tra.'
          : 'PRD thiếu phần bắt buộc, còn mơ hồ hoặc chứa chi tiết implementation.'
      }],
      ['plan-quality', {
        satisfied: planStrong,
        evidenceRefs: plan ? ['planning-artifact:plan'] : [],
        explanation: planStrong
          ? 'Plan có nguồn phạm vi, cách tiếp cận, bước có cấu trúc và kiểm tra toàn bộ luồng.'
          : 'Plan thiếu cấu trúc bước, truy vết, kiểm tra, rủi ro hoặc đang chứa implementation code.'
      }],
      ['artifact-alignment', {
        satisfied: aligned,
        evidenceRefs: [
          ...(prd ? ['planning-artifact:prd'] : []),
          ...(plan ? ['planning-artifact:plan'] : []),
          ...(planning?.alignment ? ['artifact-alignment:1'] : [])
        ],
        explanation: aligned
          ? 'Bốn điểm alignment giữa PRD và plan đã được thể hiện và xác nhận.'
          : 'Chưa đủ bằng chứng cho cả bốn điểm alignment giữa PRD và plan.'
      }],
      ['scope-control', {
        satisfied: noUnexpected && noCode(prd) && noCode(plan),
        evidenceRefs: [
          ...(prd ? ['planning-artifact:prd'] : []),
          ...(plan ? ['planning-artifact:plan'] : []),
          ...envelope.evidence
            .filter((item) => item.kind === 'unexpected-workspace-change')
            .map((item) => item.id)
        ],
        explanation: noUnexpected && noCode(prd) && noCode(plan)
          ? 'Chỉ hai artifact chuẩn thay đổi và không có implementation code.'
          : 'Có thay đổi ngoài phạm vi hoặc implementation code trong planning package.'
      }],
      ['learner-ownership', {
        satisfied: ownership,
        evidenceRefs: [
          'learner-decision:prd-prompt',
          'learner-approval:prd',
          'learner-approval:plan',
          'scope-decision:1'
        ].filter((id) => envelope.evidence.some((item) => item.id === id)),
        explanation: ownership
          ? 'Prompt, hai phê duyệt và quyết định phạm vi đều thuộc về người học.'
          : 'Thiếu prompt, phê duyệt hiện hành hoặc lời giải thích quyết định phạm vi của người học.'
      }],
      ['evidence-freshness', {
        satisfied: fresh,
        evidenceRefs: envelope.evidence
          .filter((item) => [
            'planning-artifact',
            'learner-approval',
            'artifact-alignment',
            'scope-decision'
          ].includes(item.kind))
          .map((item) => item.id),
        explanation: fresh
          ? 'Toàn bộ bằng chứng bắt buộc khớp hai digest hiện tại của run.'
          : 'Có bằng chứng thiếu, cũ hoặc không khớp digest hiện tại.'
      }]
    ])
    const criteria = envelope.definition.criteria.map((criterion): PracticeCriterionReview => {
      const result = results.get(criterion.id)
      const referencesAreFresh = criterion.freshness === 'any'
        || (result?.evidenceRefs ?? []).every((id) =>
          envelope.evidence.find((item) => item.id === id)?.freshness === 'fresh')
      return {
        criterionId: criterion.id,
        status: result?.satisfied && referencesAreFresh
          ? 'satisfied'
          : result?.satisfied ? 'unverifiable' : 'unsatisfied',
        evidenceRefs: result?.evidenceRefs ?? [],
        explanation: result?.explanation ?? 'Không có bộ đánh giá xác định cho tiêu chí này.'
      }
    })
    const passed = envelope.definition.criteria
      .filter((criterion) => criterion.required)
      .every((criterion) => criteria.find((item) =>
        item.criterionId === criterion.id)?.status === 'satisfied')
    return JSON.stringify({
      schemaVersion: 1,
      practiceId: envelope.definition.practiceId,
      practiceVersion: envelope.definition.version,
      runId: envelope.run.runId,
      verdict: passed ? 'passed' : 'needs-work',
      criteria,
      summary: passed
        ? 'Triết đã đối chiếu PRD, implementation plan, alignment, phạm vi và quyền sở hữu của người học.'
        : 'Planning package chưa đáp ứng đầy đủ các tiêu chí semantic bắt buộc.'
    })
  }
}
