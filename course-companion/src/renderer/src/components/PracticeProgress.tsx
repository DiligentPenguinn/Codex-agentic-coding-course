import { useState } from 'react'
import type {
  PlanningPracticeActionRequest,
  PortfolioStageActionRequest,
  PracticePlanningArtifactView,
  PracticeWorkspaceView
} from '../../../../shared/contracts'

type PracticeProgressProps = {
  workspace: PracticeWorkspaceView
  compact?: boolean
  returnBusy?: boolean
  onReturn?: () => void
  actionBusy?: boolean
  onPlanningAction?: (action: PlanningPracticeActionRequest['action']) => void
  onPortfolioStageAction?: (
    stageId: string,
    decision: PortfolioStageActionRequest['decision'],
    sliceId?: PortfolioStageActionRequest['sliceId']
  ) => void
  onRefresh?: () => void
}

const stepIcon = {
  completed: '✓',
  current: '→',
  pending: '·',
  stale: '!',
  upcoming: '·'
} as const

const configurationRows = [
  { key: 'model', label: 'Model', expected: 'gpt-5.6-sol', expectedLabel: '5.6 Sol' },
  { key: 'reasoningEffort', label: 'Effort', expected: 'high', expectedLabel: 'High' },
  { key: 'serviceTier', label: 'Speed', expected: 'standard', expectedLabel: 'Standard' },
  { key: 'approvalPolicy', label: 'Approval', expected: 'on-request', expectedLabel: 'Approve for me' },
  { key: 'fullAccess', label: 'Full access', expected: 'off', expectedLabel: 'Off' }
] as const

const artifactLabels = {
  'artifacts/PRD.md': 'PRD.md',
  'artifacts/implementation-plan.md': 'implementation-plan.md'
} as const

const artifactAvailability: Record<PracticePlanningArtifactView['availability'], string> = {
  available: 'Đã có',
  missing: 'Chưa có',
  invalid: 'Không hợp lệ'
}

const artifactApproval: Record<PracticePlanningArtifactView['approval'], string> = {
  approved: 'Đã duyệt',
  pending: 'Chờ duyệt',
  'revision-requested': 'Đã yêu cầu sửa',
  stale: 'Duyệt lại'
}

const portfolioStageLabels: Record<string, string> = {
  'portfolio-brief': 'Bản mô tả ngắn',
  'content-evidence-inventory': 'Nội dung và bằng chứng',
  'visual-reference': 'Tham chiếu hình ảnh',
  'portfolio-prd': 'PRD portfolio',
  'implementation-contract': 'Hợp đồng xây dựng',
  'scaffold-baseline': 'Nền ứng dụng trung tính',
  'complete-first-version': 'Phiên bản đầu tiên',
  'whole-page-revision': 'Cải thiện toàn trang',
  'evidence-debugging': 'Gỡ lỗi có bằng chứng',
  'independent-enhancement': 'Cải tiến độc lập'
}

const buildSliceLabels: Record<string, string> = {
  'foundation-hero': 'Nền trang và Hero',
  'selected-work': 'Selected Work',
  'about-contact-footer': 'About, Contact và footer',
  'responsive-accessibility': 'Responsive và accessibility'
}

const portfolioIssueLabels: Record<string, string> = {
  missing: 'Thiếu tệp',
  empty: 'Tệp trống',
  oversized: 'Tệp quá lớn',
  directory: 'Đường dẫn không phải tệp',
  symlink: 'Không chấp nhận liên kết tắt',
  escaping: 'Đường dẫn ra ngoài workspace',
  'invalid-utf8': 'Nội dung không đọc được',
  placeholder: 'Còn nội dung mẫu',
  'missing-section': 'Thiếu mục bắt buộc',
  'missing-approval': 'Thiếu xác nhận của người học',
  'invalid-evidence-label': 'Nhãn bằng chứng chưa trung thực',
  'privacy-review-incomplete': 'Chưa kiểm tra quyền riêng tư',
  'permission-metadata-missing': 'Thiếu nguồn hoặc quyền sử dụng',
  'missing-reference-screenshot': 'Thiếu ảnh chụp tham chiếu',
  'requirement-coverage': 'Requirement chưa có cách kiểm tra',
  'invalid-plan-boundary': 'Kế hoạch vượt ranh giới',
  'unexpected-workspace-change': 'Có thay đổi ngoài phạm vi'
}

export function PracticeProgress({
  workspace,
  compact = false,
  returnBusy = false,
  onReturn,
  actionBusy = false,
  onPlanningAction,
  onPortfolioStageAction,
  onRefresh
}: PracticeProgressProps) {
  const [scopeDraft, setScopeDraft] = useState({ runId: '', value: '' })
  const reviewStatus = workspace.review?.status
  const configurationPractice = workspace.activePractice?.practiceId === 'm1-codex-safe-setup'
    || workspace.checklist.some((step) => step.id === 'set-model')
  const configuration = workspace.configuration
  const configurationFresh = configuration?.freshness === 'fresh'
    && configuration.connection === 'connected'
  const planning = workspace.planning
  const portfolioStages = workspace.portfolioPlanning ?? workspace.portfolioBuild
  const currentPlanningStep = workspace.checklist.find((step) =>
    step.status === 'current' || step.status === 'stale')
  const actionContext = planning?.actionContext
  const activeRunId = workspace.activePractice?.runId ?? ''
  const scopeDecision = scopeDraft.runId === activeRunId ? scopeDraft.value : ''
  const checklistTitle = (stepId: string) =>
    workspace.checklist.find((step) => step.id === stepId)?.title ?? 'Bước cần xem lại'

  const planningAction = (action: PlanningPracticeActionRequest['action']) => {
    if (!actionBusy) onPlanningAction?.(action)
  }
  return (
    <section className={'practice-progress' + (compact ? ' is-compact' : '')} aria-label="Tiến độ Practice">
      <div className="practice-progress__summary">
        <small>MỤC TIÊU</small>
        <strong>{workspace.objective}</strong>
        {!compact ? <p>{workspace.expectedOutcome}</p> : null}
        {workspace.completionDestination ? (
          <small className="practice-destination">
            Sau khi đạt: {workspace.completionDestination.label}
          </small>
        ) : null}
      </div>

      {configurationPractice ? (
        <section className="practice-configuration" aria-label="Cấu hình Codex được phát hiện" aria-live="polite">
          <header>
            <div>
              <small>CẤU HÌNH TASK ĐƯỢC PHÁT HIỆN</small>
              <strong>
                {!configuration
                  ? 'CHƯA CÓ DỮ LIỆU'
                  : configurationFresh ? 'DỮ LIỆU MỚI' : 'CHƯA THỂ XÁC MINH'}
              </strong>
            </div>
            <span className={configurationFresh ? 'is-fresh' : 'is-unavailable'}>
              {configurationFresh
                ? 'Mới'
                : !configuration ? 'Đang chờ'
                : configuration.connection === 'disconnected'
                  ? 'Mất kết nối'
                  : configuration.freshness === 'stale' ? 'Đã cũ' : 'Không khả dụng'}
            </span>
          </header>
          <p>
            Course Companion chỉ đọc metadata hiệu lực của task Executor đang liên kết;
            ứng dụng không tự thay đổi cài đặt của bạn.
          </p>
          <dl>
            {configurationRows.map((row) => {
              const value = configuration?.[row.key]
              const matches = configurationFresh && value?.protocolValue === row.expected
              return (
                <div className={matches ? 'is-match' : 'is-mismatch'} key={row.key}>
                  <dt>{row.label}</dt>
                  <dd>{value?.label ?? 'Không xác minh được'}</dd>
                  <small>{matches ? 'Khớp' : 'Cần ' + row.expectedLabel}</small>
                </div>
              )
            })}
          </dl>
          {configuration ? (
            <time dateTime={configuration.observedAt}>
              Ghi nhận: {new Date(configuration.observedAt).toLocaleString('vi-VN')}
            </time>
          ) : null}
        </section>
      ) : null}

      {planning ? (
        <section className="practice-planning" aria-label="Bằng chứng planning package" aria-live="polite">
          <header>
            <div>
              <small>PLANNING PACKAGE</small>
              <strong>{planning.freshness === 'fresh' ? 'BẰNG CHỨNG HIỆN TẠI' : planning.freshness === 'stale' ? 'CẦN LÀM MỚI' : 'CHƯA THỂ XÁC MINH'}</strong>
            </div>
            {onRefresh ? <button type="button" disabled={actionBusy} onClick={onRefresh}>Làm mới bằng chứng</button> : null}
          </header>
          <div className="practice-artifacts">
            {planning.artifacts.map((artifact) => (
              <article className={`is-${artifact.availability} is-${artifact.approval}`} key={artifact.path}>
                <small>{artifactLabels[artifact.path]}</small>
                <strong>{artifactAvailability[artifact.availability]}</strong>
                <span>{artifactApproval[artifact.approval]} · {artifact.freshness === 'fresh' ? 'Mới' : artifact.freshness === 'stale' ? 'Đã cũ' : 'Chưa xác minh'}</span>
                {artifact.issue ? <em>Mã trạng thái: {artifact.issue}</em> : null}
              </article>
            ))}
            <article className={`is-alignment-${planning.alignment}`}>
              <small>ALIGNMENT</small>
              <strong>{planning.alignment === 'confirmed' ? 'Đã đối chiếu' : planning.alignment === 'stale' ? 'Cần đối chiếu lại' : 'Chưa xác nhận'}</strong>
              <span>Bốn điểm phạm vi và Done When</span>
            </article>
          </div>

          {planning.unexpectedChangedPaths.length > 0 ? (
            <div className="practice-scope-warning" role="status">
              <strong>Có thay đổi ngoài hai tài liệu cho phép</strong>
              <ul>{planning.unexpectedChangedPaths.map((path) => <li key={path}>{path}</li>)}</ul>
            </div>
          ) : null}

          {planning.invalidations.map((item) => (
            <article className="practice-invalidation" key={`${item.changedInput}:${item.affectedStepIds.join(',')}`} role="status">
              <small>DEPENDENCY VỪA THAY ĐỔI</small>
              <strong>{item.changedInput}</strong>
              <p>{item.reason}</p>
              <span>Bước cần xem lại: {item.affectedStepIds.map(checklistTitle).join(', ')}</span>
              <b>Tiếp theo: {item.nextAction}</b>
            </article>
          ))}

          {onPlanningAction && workspace.activePractice && currentPlanningStep ? (
            <div className="practice-planning-actions" aria-label="Hành động xác nhận Practice">
              {currentPlanningStep.id === 'write-prd-prompt' && actionContext?.activityCursor ? (
                <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'capture-prd-prompt', expectedActivityCursor: actionContext.activityCursor! })}>Ghi nhận prompt của tôi</button>
              ) : null}
              {currentPlanningStep.id === 'complete-interview' && actionContext?.activityCursor ? (
                <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'complete-interview', expectedActivityCursor: actionContext.activityCursor! })}>Xác nhận đã hoàn thành phỏng vấn</button>
              ) : null}
              {currentPlanningStep.id === 'approve-prd' && actionContext?.prdDigest ? (
                <>
                  <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'approve-prd', expectedPrdDigest: actionContext.prdDigest! })}>Duyệt và lưu PRD</button>
                  <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'request-prd-revision', expectedPrdDigest: actionContext.prdDigest! })}>Yêu cầu sửa PRD</button>
                </>
              ) : null}
              {currentPlanningStep.id === 'reconcile-alignment' && actionContext?.prdDigest && actionContext.planDigest ? (
                <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'confirm-alignment', expectedPrdDigest: actionContext.prdDigest!, expectedPlanDigest: actionContext.planDigest! })}>Xác nhận bốn điểm alignment</button>
              ) : null}
              {currentPlanningStep.id === 'approve-plan' && actionContext?.prdDigest && actionContext.planDigest ? (
                <>
                  <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'approve-plan', expectedPrdDigest: actionContext.prdDigest!, expectedPlanDigest: actionContext.planDigest! })}>Duyệt và lưu implementation plan</button>
                  <button type="button" disabled={actionBusy} onClick={() => planningAction({ type: 'request-plan-revision', expectedPrdDigest: actionContext.prdDigest!, expectedPlanDigest: actionContext.planDigest! })}>Yêu cầu sửa plan</button>
                </>
              ) : null}
              {currentPlanningStep.id === 'explain-scope-and-review' && actionContext?.prdDigest && actionContext.planDigest ? (
                <label>
                  <span>Giải thích một quyết định phạm vi bằng lời của bạn</span>
                  <textarea
                    autoComplete="off"
                    maxLength={500}
                    name="scopeDecision"
                    value={scopeDecision}
                    onChange={(event) => setScopeDraft({
                      runId: activeRunId,
                      value: String((event.currentTarget as unknown as { value: unknown }).value ?? '')
                    })}
                  />
                  <button type="button" disabled={actionBusy || scopeDecision.trim().length === 0} onClick={() => planningAction({ type: 'record-scope-decision', value: scopeDecision.trim(), expectedPrdDigest: actionContext.prdDigest!, expectedPlanDigest: actionContext.planDigest! })}>Ghi nhận quyết định phạm vi</button>
                </label>
              ) : null}
              {currentPlanningStep.id === 'draft-plan' ? <p>Quay lại Executor để tạo implementation plan từ PRD đã duyệt, rồi chọn “Làm mới bằng chứng”.</p> : null}
              {actionBusy ? <small>Đang xác nhận bằng chứng hiện tại…</small> : null}
            </div>
          ) : null}

          {planning.observedAt ? <time dateTime={planning.observedAt}>Ghi nhận: {new Date(planning.observedAt).toLocaleString('vi-VN')}</time> : null}
        </section>
      ) : null}

      {portfolioStages ? (
        <section className="practice-portfolio-planning" aria-label={workspace.portfolioBuild ? 'Bằng chứng xây dựng portfolio' : 'Bằng chứng lập kế hoạch portfolio'} aria-live="polite">
          <header>
            <div>
              <small>{workspace.portfolioBuild ? 'XÂY DỰNG PORTFOLIO' : 'GÓI LẬP KẾ HOẠCH PORTFOLIO'}</small>
              <strong>{portfolioStages.freshness === 'fresh'
                ? 'BẰNG CHỨNG HIỆN TẠI'
                : portfolioStages.freshness === 'stale'
                  ? 'CẦN LÀM MỚI'
                  : 'CHƯA THỂ XÁC MINH'}</strong>
            </div>
            {onRefresh ? <button type="button" disabled={actionBusy} onClick={onRefresh}>Làm mới bằng chứng</button> : null}
          </header>

          {portfolioStages.unexpectedPaths.length > 0 ? (
            <div className="practice-scope-warning" role="status">
              <strong>Có tệp nằm ngoài phạm vi Practice</strong>
              <ul>{portfolioStages.unexpectedPaths.map((path) => <li key={path}>{path}</li>)}</ul>
            </div>
          ) : null}

          <ol className="practice-portfolio-stages">
            {portfolioStages.stages.map((stage) => (
              <li className={`is-${stage.status}`} key={stage.stageId}>
                <header>
                  <span>{stage.stageIndex}</span>
                  <div>
                    <small>GIAI ĐOẠN {stage.stageIndex}/5</small>
                    <strong>{portfolioStageLabels[stage.stageId] ?? stage.stageId}</strong>
                  </div>
                  <em>{stage.status === 'completed'
                    ? 'ĐÃ DUYỆT'
                    : stage.status === 'ready'
                      ? 'SẴN SÀNG DUYỆT'
                      : stage.status === 'stale'
                        ? 'CẦN DUYỆT LẠI'
                        : stage.status === 'blocked'
                          ? 'CẦN BỔ SUNG'
                          : 'CHƯA MỞ'}</em>
                </header>
                <div className="practice-portfolio-artifacts">
                  {stage.artifactPaths.map((path) => <code key={path}>{path}</code>)}
                </div>
                {workspace.portfolioBuild && stage.stageId === 'complete-first-version' ? (
                  <ol className="practice-build-slices" aria-label="Bốn phần xây dựng">
                    {workspace.portfolioBuild.slices.map((slice) => (
                      <li className={`is-${slice.status}`} key={slice.sliceId}>
                        <span>{slice.sliceIndex}/4</span>
                        <strong>{buildSliceLabels[slice.sliceId]}</strong>
                        <em>{slice.status === 'completed' ? 'ĐÃ DUYỆT' : slice.status === 'ready' ? 'SẴN SÀNG' : slice.status === 'stale' ? 'DUYỆT LẠI' : slice.status === 'blocked' ? 'CẦN BỔ SUNG' : 'CHƯA MỞ'}</em>
                        {onPortfolioStageAction && slice.status !== 'completed' && slice.status !== 'pending' ? (
                          <div className="practice-portfolio-actions">
                            {slice.status === 'ready' ? <button className="is-primary" disabled={actionBusy} type="button" onClick={() => onPortfolioStageAction(stage.stageId, 'approved', slice.sliceId)}>Chấp nhận phần này</button> : null}
                            <button disabled={actionBusy} type="button" onClick={() => onPortfolioStageAction(stage.stageId, 'revision-requested', slice.sliceId)}>Yêu cầu sửa</button>
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                ) : null}
                {stage.issueCodes.length > 0 ? (
                  <ul className="practice-portfolio-issues">
                    {stage.issueCodes.map((code) => <li key={code}>{portfolioIssueLabels[code] ?? code}</li>)}
                  </ul>
                ) : null}
                {stage.staleReason ? <p>{stage.staleReason}</p> : null}
                {onPortfolioStageAction && stage.status !== 'completed' && stage.status !== 'pending' ? (
                  <div className="practice-portfolio-actions">
                    {stage.status === 'ready' ? (
                      <button className="is-primary" disabled={actionBusy} type="button" onClick={() => onPortfolioStageAction(stage.stageId, 'approved')}>
                        Chấp nhận phiên bản hiện tại
                      </button>
                    ) : null}
                    <button disabled={actionBusy} type="button" onClick={() => onPortfolioStageAction(stage.stageId, 'revision-requested')}>
                      Yêu cầu sửa
                    </button>
                  </div>
                ) : null}
              </li>
            ))}
          </ol>
          {actionBusy ? <small>Đang đối chiếu đúng phiên bản tài liệu hiện tại…</small> : null}
        </section>
      ) : null}

      {reviewStatus === 'passed' || reviewStatus === 'needs-work' ? (
        <div className={`practice-review-result is-${reviewStatus}`} role="status">
          <div>
            <small>KẾT QUẢ DUYỆT</small>
            <strong>{reviewStatus === 'passed' ? 'ĐÃ ĐẠT' : 'CẦN BỔ SUNG'}</strong>
            <p>
              {workspace.review?.result?.summary ?? (reviewStatus === 'passed'
                ? 'Bằng chứng đáp ứng các tiêu chí bắt buộc.'
                : 'Hãy bổ sung bằng chứng theo các bước còn lại rồi yêu cầu duyệt lại.')}
            </p>
          </div>
          {reviewStatus === 'passed' && workspace.review?.canReturn && onReturn ? (
            <button type="button" disabled={returnBusy} onClick={onReturn}>
              {returnBusy ? 'ĐANG QUAY LẠI…' : 'Quay lại khóa học'}
            </button>
          ) : null}
        </div>
      ) : null}

      <ol className="practice-checklist">
        {workspace.checklist.map((step) => (
          <li className={'is-' + step.status} key={step.id}>
            <span aria-hidden="true">{stepIcon[step.status]}</span>
            <div>
              <strong>{step.title}</strong>
              <small>
                {step.status === 'completed'
                  ? 'Đã hoàn thành'
                  : step.status === 'current'
                    ? 'Bước tiếp theo'
                    : step.status === 'stale'
                      ? 'Cần xem lại'
                      : 'Sắp tới'}
              </small>
              {step.reason ? <p>{step.reason}</p> : null}
            </div>
          </li>
        ))}
      </ol>

      {workspace.activePractice ? (
        <details className="practice-receipt">
          <summary>Executor chat đang hoạt động</summary>
          <p>{workspace.activePractice.executorChatName}</p>
        </details>
      ) : null}
    </section>
  )
}
