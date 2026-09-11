import { createHash } from 'node:crypto'
import { lstat, readFile, readdir, realpath } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import {
  portfolioPlanningArtifactPaths,
  type ExecutorActivitySnapshot,
  type PortfolioPlanningArtifactSnapshot,
  type PortfolioPlanningIssue,
  type PortfolioPlanningStageEvidence,
  type PracticeAdapterEvidenceState,
  type PracticeAdapterStepState,
  type PracticeEvidenceReference
} from '../../shared/contracts'
import { practiceWorkspaceIdentityDigest } from './practice-run-repository'
import { collectPortfolioPackage } from './portfolio-package-evidence'
import type {
  PracticeEvidenceAdapter,
  PracticeEvidenceAdapterContext
} from './practice-evidence-adapter'

type ActivitySource = {
  current: () => Promise<ExecutorActivitySnapshot | null>
}

type InspectedArtifact = PortfolioPlanningArtifactSnapshot & { content: string }

const maximumArtifactBytes = 256 * 1024
const maximumScreenshotBytes = 12 * 1024 * 1024
const maximumWorkspaceEntries = 500
const screenshotPath = /^planning\/reference\/screenshots\/[A-Za-z0-9][A-Za-z0-9 ._-]*\.(?:png|jpe?g|webp)$/i
const allowedDirectories = new Set([
  'planning',
  'planning/reference',
  'planning/reference/screenshots'
])

function sha256(value: string | Uint8Array): string {
  return createHash('sha256').update(value).digest('hex')
}

function contained(root: string, candidate: string): boolean {
  const fromRoot = relative(root, candidate)
  return fromRoot === '' || (
    fromRoot !== '..'
    && !fromRoot.startsWith(`..${sep}`)
    && !isAbsolute(fromRoot)
  )
}

function initialSteps(context: Readonly<PracticeEvidenceAdapterContext>): PracticeAdapterStepState[] {
  return context.definition.checklist.map((step, index) => ({
    stepId: step.id,
    status: index === 0 ? 'current' : 'pending',
    dependencyInputs: {}
  }))
}

function issue(
  stageId: string,
  path: string,
  code: PortfolioPlanningIssue['code'],
  message: string
): PortfolioPlanningIssue {
  return { stageId, path, code, message }
}

function stageForPath(path: string): string {
  if (path === 'planning/portfolio-brief.md') return 'portfolio-brief'
  if (path === 'planning/content-evidence-inventory.md') return 'content-evidence-inventory'
  if (path === 'planning/reference/reference.md' || screenshotPath.test(path)) return 'visual-reference'
  if (path === 'planning/PRD.md') return 'portfolio-prd'
  return 'implementation-contract'
}

function hasAllHeadings(content: string, headings: readonly string[]): string[] {
  return headings.filter((heading) => !content.includes(`## ${heading}`))
}

function hasPlaceholder(content: string): boolean {
  return /`chưa duyệt`|_Mã từ PRD_|_Điền|_Nêu|_Mô tả|_Kết quả|_Cách kiểm tra|_Artifact hoặc báo cáo_/i.test(content)
}

function approved(content: string): boolean {
  return /Quyết định:\s*`(?:đã duyệt|chấp nhận)`/i.test(content)
    && /Người học xác nhận:\s*\S+/i.test(content)
}

function allChecksComplete(content: string, expectedMinimum: number): boolean {
  const checks = content.match(/^- \[[ xX]\]/gm) ?? []
  return checks.length >= expectedMinimum && checks.every((check) => /\[[xX]\]/.test(check))
}

function semanticIssues(
  artifacts: Map<string, InspectedArtifact>,
  screenshots: PortfolioPlanningArtifactSnapshot[]
): PortfolioPlanningIssue[] {
  const issues: PortfolioPlanningIssue[] = []
  const checkCommon = (path: string, headings: readonly string[]) => {
    const artifact = artifacts.get(path)
    if (!artifact) return null
    for (const heading of hasAllHeadings(artifact.content, headings)) {
      issues.push(issue(stageForPath(path), path, 'missing-section', `Thiếu mục bắt buộc: ${heading}.`))
    }
    if (hasPlaceholder(artifact.content)) {
      issues.push(issue(stageForPath(path), path, 'placeholder', 'Artifact vẫn còn nội dung hướng dẫn chưa được thay bằng quyết định của Learner.'))
    }
    if (!approved(artifact.content)) {
      issues.push(issue(stageForPath(path), path, 'missing-approval', 'Artifact chưa có lời duyệt và xác nhận của Learner.'))
    }
    return artifact
  }

  const brief = checkCommon('planning/portfolio-brief.md', [
    'Mục đích',
    'Người xem chính',
    'Quyết định người xem cần đưa ra',
    'Dấu hiệu truyền đạt thành công',
    'Ranh giới phiên bản đầu tiên',
    'Kiểm tra tính trung thực và quyền riêng tư',
    'Phê duyệt phiên bản hiện tại'
  ])
  if (brief && !allChecksComplete(brief.content, 3)) {
    issues.push(issue('portfolio-brief', brief.path, 'privacy-review-incomplete', 'Kiểm tra trung thực, riêng tư và quyền sử dụng chưa hoàn tất.'))
  }

  const inventory = checkCommon('planning/content-evidence-inventory.md', [
    'Quy ước trạng thái',
    'Nội dung dự kiến',
    'Khoảng trống bằng chứng',
    'Nội dung không được công khai',
    'Kiểm tra trước khi duyệt',
    'Phê duyệt phiên bản hiện tại'
  ])
  if (inventory) {
    const rows = inventory.content.split('\n').filter((line) => line.trim().startsWith('|'))
    const dataRows = rows.filter((line) => !/Mã \||---/.test(line))
    if (dataRows.length < 1 || !/(đã kiểm chứng|lời tự khai|giả định|còn thiếu)/i.test(dataRows.join('\n'))) {
      issues.push(issue('content-evidence-inventory', inventory.path, 'invalid-evidence-label', 'Inventory cần ít nhất một hàng dùng đúng nhãn bằng chứng.'))
    }
    if (!allChecksComplete(inventory.content, 4)) {
      issues.push(issue('content-evidence-inventory', inventory.path, 'privacy-review-incomplete', 'Kiểm tra bằng chứng, riêng tư và quyền sử dụng chưa hoàn tất.'))
    }
  }

  const reference = checkCommon('planning/reference/reference.md', [
    'Nguồn chính',
    'Ảnh chụp đã lưu',
    'Điều tôi thích bằng lời của mình',
    'Ranh giới sử dụng',
    'Phê duyệt phiên bản hiện tại'
  ])
  if (reference) {
    if (!/URL nguồn:\s*https?:\/\/\S+/i.test(reference.content)) {
      issues.push(issue('visual-reference', reference.path, 'permission-metadata-missing', 'Tham chiếu chưa có URL nguồn hợp lệ.'))
    }
    if (screenshots.length === 0) {
      issues.push(issue('visual-reference', reference.path, 'missing-reference-screenshot', 'Cần ít nhất một ảnh chụp hữu ích trong thư mục screenshots.'))
    }
    for (const screenshot of screenshots) {
      const row = reference.content.split('\n').find((line) => line.includes(screenshot.path))
      if (!row || !/(Có|Được phép|Chưa rõ)/i.test(row)) {
        issues.push(issue('visual-reference', screenshot.path, 'permission-metadata-missing', 'Ảnh chụp chưa được liệt kê cùng metadata nguồn/quyền sử dụng.'))
      }
    }
    if (!allChecksComplete(reference.content, 3)) {
      issues.push(issue('visual-reference', reference.path, 'permission-metadata-missing', 'Ranh giới không sao chép chưa được xác nhận đầy đủ.'))
    }
  }

  const prd = checkCommon('planning/PRD.md', [
    'Mục đích và người xem chính',
    'Nội dung và bằng chứng đầu vào',
    'Yêu cầu sản phẩm',
    'Hành vi trên màn hình rộng và hẹp',
    'Khả năng tiếp cận cơ bản',
    'Phạm vi phiên bản đầu tiên',
    'Ràng buộc',
    'Tiêu chí chấp nhận',
    'Câu hỏi còn mở',
    'Phê duyệt phiên bản hiện tại'
  ])
  const requirementIds = new Set(prd?.content.match(/\bREQ-[A-Za-z0-9_-]+\b/g) ?? [])
  if (prd && (requirementIds.size === 0 || !/\bAC-[A-Za-z0-9_-]+\b/.test(prd.content))) {
    issues.push(issue('portfolio-prd', prd.path, 'requirement-coverage', 'PRD cần requirement ID ổn định và acceptance criterion có mã.'))
  }

  const map = checkCommon('planning/requirement-validation-map.md', [
    'Mapping hiện tại',
    'Kiểm tra độ bao phủ',
    'Phê duyệt phiên bản hiện tại'
  ])
  if (map) {
    const mappedIds = map.content.match(/\bREQ-[A-Za-z0-9_-]+\b/g) ?? []
    const mappedSet = new Set(mappedIds)
    const exactCoverage = requirementIds.size > 0
      && mappedSet.size === requirementIds.size
      && [...requirementIds].every((id) => mappedIds.filter((candidate) => candidate === id).length === 1)
      && [...mappedSet].every((id) => requirementIds.has(id))
    if (!exactCoverage || !allChecksComplete(map.content, 4)) {
      issues.push(issue('implementation-contract', map.path, 'requirement-coverage', 'Bản đồ phải chứa mỗi requirement hiện tại đúng một lần và hoàn tất kiểm tra độ bao phủ.'))
    }
    if (prd && !map.content.includes(prd.digest)) {
      issues.push(issue('implementation-contract', map.path, 'requirement-coverage', 'Bản đồ chưa ghi đúng digest PRD hiện tại.'))
    }
  }

  const plan = checkCommon('planning/implementation-plan.md', [
    'Hợp đồng đầu vào',
    'Các giai đoạn',
    'Phi mục tiêu',
    'Quyết định được hoãn sang Module 3',
    'Kiểm tra tính nhất quán',
    'Phê duyệt phiên bản hiện tại'
  ])
  if (plan && (!allChecksComplete(plan.content, 3)
    || !/\|\s*\d+\s*\|/.test(plan.content)
    || !/Công nghệ, dependency, lệnh tạo scaffold và cấu trúc code chỉ được đề xuất ở Module 3/i.test(plan.content))) {
    issues.push(issue('implementation-contract', plan.path, 'invalid-plan-boundary', 'Kế hoạch chưa có phase hợp lệ hoặc chưa giữ ranh giới công nghệ và triển khai ở Module 3.'))
  }

  const firstTask = checkCommon('planning/first-bounded-task.md', [
    'Mục tiêu duy nhất',
    'Bối cảnh được phép dùng',
    'Trong phạm vi',
    'Ngoài phạm vi',
    'Kết quả có thể quan sát',
    'Kiểm tra bắt buộc',
    'Điểm dừng và quyền duyệt',
    'Phê duyệt phiên bản hiện tại'
  ])
  if (firstTask && !/chưa được (?:chạy|thực hiện|tạo ứng dụng)|dừng trước/i.test(firstTask.content)) {
    issues.push(issue('implementation-contract', firstTask.path, 'invalid-plan-boundary', 'Tác vụ đầu tiên chưa có điểm dừng rõ trước khi tạo ứng dụng.'))
  }

  return issues
}

export class PortfolioPlanningEvidenceAdapter implements PracticeEvidenceAdapter {
  readonly evidenceProfile = 'portfolio-planning' as const

  constructor(
    private readonly source?: ActivitySource,
    private readonly now: () => Date = () => new Date()
  ) {}

  async collect(
    context: Readonly<PracticeEvidenceAdapterContext>
  ): Promise<PracticeAdapterEvidenceState> {
    if (context.definition.version === '2.0.0') return collectPortfolioPackage(context, this.now)
    const observedAt = this.now().toISOString()
    const canonicalRoot = await realpath(resolve(context.workspaceRoot))
    const issues: PortfolioPlanningIssue[] = []
    const artifacts = new Map<string, InspectedArtifact>()
    const screenshots: PortfolioPlanningArtifactSnapshot[] = []
    const unexpectedPaths = await this.scanWorkspace(canonicalRoot, issues)

    for (const path of portfolioPlanningArtifactPaths) {
      const inspected = await this.inspectTextArtifact(canonicalRoot, path, observedAt)
      if ('issue' in inspected) issues.push(inspected.issue)
      else artifacts.set(path, inspected.artifact)
    }
    for (const path of await this.screenshotPaths(canonicalRoot)) {
      const inspected = await this.inspectBinaryArtifact(canonicalRoot, path, observedAt)
      if ('issue' in inspected) issues.push(inspected.issue)
      else screenshots.push(inspected.artifact)
    }
    issues.push(...semanticIssues(artifacts, screenshots))
    for (const path of unexpectedPaths) {
      issues.push(issue('implementation-contract', path, 'unexpected-workspace-change', 'Đường dẫn nằm ngoài phạm vi ghi được phép của Practice.'))
    }

    const activity = await this.source?.current() ?? null
    const activityMatches = Boolean(activity
      && activity.runId === context.runId
      && activity.threadId === context.task?.threadId
      && resolve(context.task.workspaceRoot) === resolve(context.workspaceRoot))
    const reportedChecks = activityMatches
      ? (activity?.reportedVerificationEvidence ?? []).slice(-12).map((check) => check.slice(0, 500))
      : []
    const snapshots = [...artifacts.values()].map((artifact): PortfolioPlanningArtifactSnapshot => ({
      path: artifact.path,
      digest: artifact.digest,
      byteLength: artifact.byteLength,
      modifiedAt: artifact.modifiedAt,
      observedAt: artifact.observedAt
    }))
    const allSnapshots = [...snapshots, ...screenshots]
    const stageEvidence: PortfolioPlanningStageEvidence[] = (context.definition.stages ?? []).map((stage) => {
      const paths = stage.id === 'visual-reference'
        ? [...stage.requiredArtifactPaths, ...screenshots.map((item) => item.path)]
        : stage.requiredArtifactPaths
      const stageIssues = issues.filter((item) => item.stageId === stage.id)
      const artifactDigests = Object.fromEntries(paths.flatMap((path) => {
        const artifact = allSnapshots.find((candidate) => candidate.path === path)
        return artifact ? [[path, artifact.digest]] : []
      }))
      return {
        stageId: stage.id,
        stageIndex: stage.order,
        status: stageIssues.length === 0
          && stage.requiredArtifactPaths.every((path) => artifactDigests[path])
          ? 'ready'
          : 'blocked',
        artifactDigests,
        executorReportedChecks: [...reportedChecks],
        corroboratedArtifacts: { ...artifactDigests },
        issueCodes: [...new Set(stageIssues.map((item) => item.code))]
      }
    })
    const evidence: PracticeEvidenceReference[] = [
      ...allSnapshots.map((artifact) => ({
        id: `portfolio-artifact-${sha256(artifact.path).slice(0, 12)}`,
        kind: 'planning-artifact' as const,
        text: `${artifact.path} | sha256=${artifact.digest} | bytes=${artifact.byteLength}`,
        freshness: 'fresh' as const
      })),
      ...reportedChecks.map((check, index) => ({
        id: `executor-reported-check-${index + 1}`,
        kind: 'executor-reported-verification' as const,
        text: check,
        freshness: 'fresh' as const
      })),
      ...unexpectedPaths.slice(0, 100).map((path, index) => ({
        id: `unexpected-portfolio-path-${index + 1}`,
        kind: 'unexpected-workspace-change' as const,
        text: path,
        freshness: 'fresh' as const
      }))
    ]
    const sourceDigest = sha256(JSON.stringify({
      artifacts: allSnapshots.map(({ path, digest, byteLength }) => ({ path, digest, byteLength })),
      issues: issues.map(({ stageId, path, code }) => ({ stageId, path, code })),
      unexpectedPaths
    }))

    return {
      schemaVersion: 1,
      practiceId: context.definition.practiceId,
      practiceVersion: context.definition.version,
      runId: context.runId,
      evidenceProfile: this.evidenceProfile,
      observedAt,
      freshness: issues.length === 0 ? 'fresh' : 'unverifiable',
      sourceDigest,
      evidence,
      steps: initialSteps(context),
      invalidations: [],
      portfolioPlanning: {
        schemaVersion: 1,
        workspaceIdentityDigest: practiceWorkspaceIdentityDigest(canonicalRoot),
        artifacts: allSnapshots,
        issues,
        unexpectedPaths,
        stages: stageEvidence
      }
    }
  }

  private async inspectTextArtifact(
    root: string,
    path: string,
    observedAt: string
  ): Promise<{ artifact: InspectedArtifact } | { issue: PortfolioPlanningIssue }> {
    const stageId = stageForPath(path)
    try {
      const candidate = resolve(root, path)
      const info = await lstat(candidate)
      if (info.isSymbolicLink()) return { issue: issue(stageId, path, 'symlink', 'Artifact không được là symlink.') }
      if (!info.isFile()) return { issue: issue(stageId, path, 'directory', 'Artifact phải là tệp Markdown.') }
      if (info.size === 0) return { issue: issue(stageId, path, 'empty', 'Artifact đang trống.') }
      if (info.size > maximumArtifactBytes) return { issue: issue(stageId, path, 'oversized', 'Artifact vượt giới hạn kích thước an toàn.') }
      const canonical = await realpath(candidate)
      if (!contained(root, canonical)) return { issue: issue(stageId, path, 'escaping', 'Artifact thoát khỏi portfolio workspace.') }
      const bytes = await readFile(canonical)
      let content: string
      try {
        content = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      } catch {
        return { issue: issue(stageId, path, 'invalid-utf8', 'Artifact không phải UTF-8 hợp lệ.') }
      }
      return {
        artifact: {
          path,
          content,
          digest: sha256(bytes),
          byteLength: bytes.byteLength,
          modifiedAt: info.mtime.toISOString(),
          observedAt
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return { issue: issue(stageId, path, 'missing', 'Chưa có artifact bắt buộc.') }
      }
      return { issue: issue(stageId, path, 'escaping', 'Không thể đọc artifact an toàn.') }
    }
  }

  private async inspectBinaryArtifact(
    root: string,
    path: string,
    observedAt: string
  ): Promise<{ artifact: PortfolioPlanningArtifactSnapshot } | { issue: PortfolioPlanningIssue }> {
    try {
      const candidate = resolve(root, path)
      const info = await lstat(candidate)
      if (info.isSymbolicLink()) return { issue: issue('visual-reference', path, 'symlink', 'Ảnh chụp không được là symlink.') }
      if (!info.isFile()) return { issue: issue('visual-reference', path, 'directory', 'Ảnh chụp phải là tệp.') }
      if (info.size === 0 || info.size > maximumScreenshotBytes) {
        return { issue: issue('visual-reference', path, info.size === 0 ? 'empty' : 'oversized', 'Ảnh chụp trống hoặc vượt giới hạn kích thước.') }
      }
      const canonical = await realpath(candidate)
      if (!contained(root, canonical)) return { issue: issue('visual-reference', path, 'escaping', 'Ảnh chụp thoát khỏi portfolio workspace.') }
      const bytes = await readFile(canonical)
      return { artifact: { path, digest: sha256(bytes), byteLength: bytes.byteLength, modifiedAt: info.mtime.toISOString(), observedAt } }
    } catch {
      return { issue: issue('visual-reference', path, 'missing', 'Không thể đọc ảnh chụp tham chiếu.') }
    }
  }

  private async screenshotPaths(root: string): Promise<string[]> {
    try {
      return (await readdir(resolve(root, 'planning/reference/screenshots'), { withFileTypes: true }))
        .filter((entry) => entry.isFile() || entry.isSymbolicLink())
        .map((entry) => `planning/reference/screenshots/${entry.name}`)
        .filter((path) => screenshotPath.test(path))
        .sort()
    } catch {
      return []
    }
  }

  private async scanWorkspace(root: string, issues: PortfolioPlanningIssue[]): Promise<string[]> {
    const unexpected = new Set<string>()
    let count = 0
    const visit = async (relativeDirectory: string): Promise<void> => {
      const directory = resolve(root, relativeDirectory)
      for (const entry of await readdir(directory, { withFileTypes: true })) {
        count += 1
        const path = relativeDirectory ? `${relativeDirectory}/${entry.name}` : entry.name
        if (count > maximumWorkspaceEntries) {
          unexpected.add(path)
          return
        }
        if (entry.isSymbolicLink()) {
          unexpected.add(path)
          continue
        }
        if (entry.isDirectory()) {
          if (!allowedDirectories.has(path)) unexpected.add(path)
          else await visit(path)
          continue
        }
        if (!portfolioPlanningArtifactPaths.includes(path as never) && !screenshotPath.test(path)) {
          unexpected.add(path)
        }
      }
    }
    try {
      await visit('')
    } catch {
      issues.push(issue('portfolio-brief', 'planning', 'missing', 'Không thể đọc portfolio workspace hiện tại.'))
    }
    return [...unexpected].sort().slice(0, maximumWorkspaceEntries)
  }
}
