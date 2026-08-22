import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PortfolioPlanningEvidenceAdapter } from '../electron/main/portfolio-planning-evidence-adapter'
import { parsePracticeDefinition } from '../electron/main/practice-definition-repository'
import type { ExecutorActivitySnapshot, PracticeDefinition } from '../shared/contracts'

const temporaryDirectories: string[] = []
const observedAt = '2026-08-15T08:00:00.000Z'

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

async function temporaryWorkspace(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-planning-evidence-'))
  temporaryDirectories.push(directory)
  await mkdir(join(directory, 'planning/reference/screenshots'), { recursive: true })
  return directory
}

function definition(): PracticeDefinition {
  return parsePracticeDefinition({
    schemaVersion: 2,
    practiceId: 'm2-portfolio-planning',
    title: 'Portfolio planning',
    version: '1.0.0',
    checkpointId: 'm2-portfolio-planning',
    objective: 'Create the planning package.',
    expectedOutcome: 'Five current stage receipts.',
    workspaceKind: 'learner-portfolio',
    taskPolicy: 'safe-workspace-write',
    evidenceProfile: 'portfolio-planning',
    stages: [
      { id: 'portfolio-brief', order: 1, dependsOn: [], requiredArtifactPaths: ['planning/portfolio-brief.md'] },
      { id: 'content-evidence-inventory', order: 2, dependsOn: ['portfolio-brief'], requiredArtifactPaths: ['planning/content-evidence-inventory.md'] },
      { id: 'visual-reference', order: 3, dependsOn: ['content-evidence-inventory'], requiredArtifactPaths: ['planning/reference/reference.md'] },
      { id: 'portfolio-prd', order: 4, dependsOn: ['visual-reference'], requiredArtifactPaths: ['planning/PRD.md'] },
      { id: 'implementation-contract', order: 5, dependsOn: ['portfolio-prd'], requiredArtifactPaths: ['planning/requirement-validation-map.md', 'planning/implementation-plan.md', 'planning/first-bounded-task.md'] }
    ],
    checklist: [
      { id: 'portfolio-brief', title: 'Brief', dependsOn: [] },
      { id: 'content-evidence-inventory', title: 'Inventory', dependsOn: ['portfolio-brief'] },
      { id: 'visual-reference', title: 'Reference', dependsOn: ['content-evidence-inventory'] },
      { id: 'portfolio-prd', title: 'PRD', dependsOn: ['visual-reference'] },
      { id: 'implementation-contract', title: 'Plan', dependsOn: ['portfolio-prd'] }
    ],
    criteria: [{
      id: 'all-current',
      description: 'All artifacts are current.',
      required: true,
      checklistStepId: 'implementation-contract',
      acceptedEvidence: ['planning-artifact'],
      assertion: 'All seven artifacts are current and valid.',
      freshness: 'fresh'
    }],
    completionDestination: {
      lessonId: 'module-2',
      checkpointId: 'm2-portfolio-mastery',
      sceneId: 'module-2-portfolio-mastery',
      label: 'Mastery'
    }
  })
}

function activity(): ExecutorActivitySnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-portfolio',
    threadId: 'thread-portfolio',
    status: 'ready',
    cursor: 'cursor-1',
    learnerPrompts: [],
    executorResponses: [],
    approvalEvents: [],
    changedFiles: [],
    verificationEvidence: [],
    reportedChangedFiles: [],
    reportedVerificationEvidence: ['Executor says every artifact is valid.'],
    workspaceConfirmedChangedFiles: [],
    workspaceCommittedReportedFilesSinceRunStart: [],
    workspaceCurrentlyDirtyReportedFiles: [],
    observedAt,
    workspaceBaseline: null,
    configuration: null
  }
}

function context(workspaceRoot: string) {
  return {
    definition: definition(),
    runId: 'run-portfolio',
    generation: 1,
    workspaceRoot,
    task: { threadId: 'thread-portfolio', workspaceRoot }
  }
}

function approvedFooter(): string {
  return [
    '## Phê duyệt phiên bản hiện tại',
    '- Quyết định: `đã duyệt`',
    '- Người học xác nhận: Triết',
    '- Thời điểm: 2026-08-15',
    '- Digest artifact hiện tại: do Course Companion xác nhận'
  ].join('\n')
}

async function writeValidArtifacts(workspace: string): Promise<void> {
  const prd = [
    '# PRD portfolio',
    '## Mục đích và người xem chính',
    'Người tuyển dụng sản phẩm.',
    '## Nội dung và bằng chứng đầu vào',
    'Dùng inventory đã duyệt.',
    '## Yêu cầu sản phẩm',
    'REQ-01: Người xem tìm được dự án chính.',
    '## Hành vi trên màn hình rộng và hẹp',
    'Không cuộn ngang.',
    '## Khả năng tiếp cận cơ bản',
    'Bàn phím và focus hiển thị.',
    '## Phạm vi phiên bản đầu tiên',
    '### Trong phạm vi',
    'Một trang portfolio.',
    '### Ngoài phạm vi',
    'Blog.',
    '## Ràng buộc',
    'Không dùng nội dung chưa có quyền.',
    '## Tiêu chí chấp nhận',
    'AC-01: Tìm được dự án chính trên màn hình rộng và hẹp.',
    '## Câu hỏi còn mở',
    'Không còn.',
    approvedFooter()
  ].join('\n\n')
  const prdDigest = createHash('sha256').update(prd).digest('hex')
  const files: Record<string, string> = {
    'planning/portfolio-brief.md': [
      '# Bản mô tả ngắn cho portfolio',
      '## Mục đích',
      'Xin việc sản phẩm.',
      '## Người xem chính',
      'Người tuyển dụng sản phẩm.',
      '## Quyết định người xem cần đưa ra',
      'Mời phỏng vấn.',
      '## Dấu hiệu truyền đạt thành công',
      'Tìm được vai trò, hai dự án và cách liên hệ.',
      '## Ranh giới phiên bản đầu tiên',
      '- Cần có: dự án',
      '- Chưa làm: blog',
      '- Còn chưa chắc: tên miền',
      '## Kiểm tra tính trung thực và quyền riêng tư',
      '- [x] Không bịa đặt.',
      '- [x] Không có dữ liệu riêng tư.',
      '- [x] Đã kiểm tra quyền sử dụng.',
      approvedFooter()
    ].join('\n\n'),
    'planning/content-evidence-inventory.md': [
      '# Kiểm kê nội dung và bằng chứng',
      '## Quy ước trạng thái',
      'Dùng nhãn đã kiểm chứng, lời tự khai, giả định hoặc còn thiếu.',
      '## Nội dung dự kiến',
      '| Mã | Nội dung hoặc tuyên bố | Trạng thái | Bằng chứng hoặc nguồn | Có thể công khai? | Quyền sở hữu/quyền sử dụng | Việc cần làm |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| P-01 | Dẫn dắt dự án A | đã kiểm chứng | Báo cáo A | Có | Tự sở hữu | Trích nguồn |',
      '## Khoảng trống bằng chứng',
      'Chưa có số liệu chuyển đổi.',
      '## Nội dung không được công khai',
      'Email cá nhân.',
      '## Kiểm tra trước khi duyệt',
      '- [x] Mỗi tuyên bố có trạng thái.',
      '- [x] Kết quả định lượng có nguồn.',
      '- [x] Media có quyền sử dụng.',
      '- [x] Dữ liệu cá nhân đã kiểm tra.',
      approvedFooter()
    ].join('\n\n'),
    'planning/reference/reference.md': [
      '# Tham chiếu hình ảnh',
      '## Nguồn chính',
      '- Tên trang hoặc tác giả: Example Studio',
      '- URL nguồn: https://example.com/portfolio',
      '- Ngày truy cập: 2026-08-15',
      '## Ảnh chụp đã lưu',
      '| Đường dẫn ảnh | Phần giao diện được tham chiếu | Nguồn/quyền sử dụng đã ghi nhận? |',
      '| --- | --- | --- |',
      '| planning/reference/screenshots/home.png | Thứ bậc phần mở đầu | Có |',
      '## Điều tôi thích bằng lời của mình',
      'Tôi thích thông tin quan trọng xuất hiện trước.',
      '## Ranh giới sử dụng',
      '- [x] Chỉ định hướng đặc điểm hình ảnh.',
      '- [x] Không sao chép nội dung, thương hiệu, hình ảnh hoặc mã nguồn.',
      '- [x] Ảnh có URL nguồn.',
      approvedFooter()
    ].join('\n\n'),
    'planning/PRD.md': prd,
    'planning/requirement-validation-map.md': [
      '# Bản đồ yêu cầu và cách kiểm chứng',
      '## Mapping hiện tại',
      '| Mã yêu cầu | Kết quả cần quan sát | Cách kiểm chứng dự kiến | Bằng chứng sẽ lưu | Trạng thái |',
      '| --- | --- | --- | --- | --- |',
      '| REQ-01 | Thấy dự án chính | Kiểm tra rộng và hẹp | Ảnh và báo cáo | chưa kiểm chứng |',
      '## Kiểm tra độ bao phủ',
      '- [x] Không thiếu yêu cầu.',
      '- [x] Không thêm yêu cầu.',
      '- [x] Không chỉ dựa vào Executor.',
      '- [x] Có bằng chứng cho responsive, bàn phím, focus, nội dung và riêng tư.',
      approvedFooter(),
      `- Digest PRD được đối chiếu: ${prdDigest}`
    ].join('\n\n'),
    'planning/implementation-plan.md': [
      '# Kế hoạch triển khai theo giai đoạn',
      '## Hợp đồng đầu vào',
      '- Digest PRD đã duyệt: hiện tại',
      '- Digest bản đồ yêu cầu–kiểm chứng: hiện tại',
      '- Digest tham chiếu hình ảnh: hiện tại',
      '## Các giai đoạn',
      '| Giai đoạn | Mục tiêu | Phụ thuộc | Khu vực dự kiến thay đổi | Kết quả có thể quan sát | Cách kiểm chứng | Điểm dừng để duyệt |',
      '| --- | --- | --- | --- | --- | --- | --- |',
      '| 1 | Baseline trung tính | Không | Môi trường ứng dụng | Trang trung tính chạy | Build và trình duyệt | Duyệt baseline |',
      '## Phi mục tiêu',
      'Không có blog.',
      '## Quyết định được hoãn sang Module 3',
      'Công nghệ, dependency, lệnh tạo scaffold và cấu trúc code chỉ được đề xuất ở Module 3 rồi chờ người học duyệt.',
      '## Kiểm tra tính nhất quán',
      '- [x] Mỗi giai đoạn truy ngược về PRD.',
      '- [x] Phụ thuộc xuất hiện trước.',
      '- [x] Chưa triển khai, cài dependency hoặc deployment.',
      approvedFooter()
    ].join('\n\n'),
    'planning/first-bounded-task.md': [
      '# Tác vụ giới hạn đầu tiên',
      '## Mục tiêu duy nhất',
      'Đề xuất baseline trung tính.',
      '## Bối cảnh được phép dùng',
      'PRD, map và plan đã duyệt.',
      '## Trong phạm vi',
      'Chỉ đề xuất scaffold.',
      '## Ngoài phạm vi',
      'Chưa xây nội dung portfolio.',
      '## Kết quả có thể quan sát',
      'Một đề xuất có lệnh, tệp và kiểm tra.',
      '## Kiểm tra bắt buộc',
      'Review đề xuất trước khi chạy.',
      '## Điểm dừng và quyền duyệt',
      'Codex phải dừng trước mọi thay đổi; tác vụ chưa được chạy để tạo ứng dụng.',
      approvedFooter()
    ].join('\n\n')
  }
  await Promise.all(Object.entries(files).map(([path, content]) =>
    writeFile(join(workspace, path), content, 'utf8')))
  await writeFile(join(workspace, 'planning/reference/screenshots/home.png'), Buffer.from([1, 2, 3]))
}

function adapter(): PortfolioPlanningEvidenceAdapter {
  return new PortfolioPlanningEvidenceAdapter(
    { current: async () => activity() },
    () => new Date(observedAt)
  )
}

describe('PortfolioPlanningEvidenceAdapter', () => {
  it('blocks missing artifacts by matching stage without trusting Executor claims', async () => {
    const workspace = await temporaryWorkspace()
    const evidence = await adapter().collect(context(workspace))

    expect(evidence.freshness).toBe('unverifiable')
    expect(evidence.portfolioPlanning?.stages.map((stage) => stage.status))
      .toEqual(['blocked', 'blocked', 'blocked', 'blocked', 'blocked'])
    expect(evidence.portfolioPlanning?.issues.filter((item) => item.code === 'missing')).toHaveLength(7)
    expect(evidence.evidence.some((item) => item.kind === 'executor-reported-verification')).toBe(true)
    expect(evidence.portfolioPlanning?.stages[0]?.corroboratedArtifacts).toEqual({})
  })

  it('corroborates seven current artifacts and sourced screenshots across five stages', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidArtifacts(workspace)
    const evidence = await adapter().collect(context(workspace))

    expect(evidence.freshness).toBe('fresh')
    expect(evidence.portfolioPlanning?.issues).toEqual([])
    expect(evidence.portfolioPlanning?.stages.map((stage) => stage.status))
      .toEqual(['ready', 'ready', 'ready', 'ready', 'ready'])
    expect(evidence.portfolioPlanning?.artifacts).toHaveLength(8)
    expect(evidence.portfolioPlanning?.stages[2]?.artifactDigests)
      .toHaveProperty('planning/reference/screenshots/home.png')
    expect(evidence.portfolioPlanning?.stages[2]?.executorReportedChecks)
      .toEqual(['Executor says every artifact is valid.'])
    expect(evidence.portfolioPlanning?.stages[2]?.corroboratedArtifacts)
      .toEqual(evidence.portfolioPlanning?.stages[2]?.artifactDigests)
  })

  it('fails scope control for application files and fails reference screenshots without metadata', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidArtifacts(workspace)
    await writeFile(join(workspace, 'package.json'), '{}\n', 'utf8')
    await writeFile(join(workspace, 'planning/reference/screenshots/unlisted.png'), Buffer.from([4, 5, 6]))
    const evidence = await adapter().collect(context(workspace))

    expect(evidence.portfolioPlanning?.unexpectedPaths).toContain('package.json')
    expect(evidence.portfolioPlanning?.issues).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'unexpected-workspace-change', path: 'package.json' }),
      expect.objectContaining({ code: 'permission-metadata-missing', path: 'planning/reference/screenshots/unlisted.png' })
    ]))
    expect(evidence.portfolioPlanning?.stages[2]?.status).toBe('blocked')
    expect(evidence.portfolioPlanning?.stages[4]?.status).toBe('blocked')
  })

  it('rejects symlink artifacts and one-to-one requirement coverage mismatches', async () => {
    const workspace = await temporaryWorkspace()
    await writeValidArtifacts(workspace)
    await rm(join(workspace, 'planning/portfolio-brief.md'))
    let symlinkCreated = true
    try {
      await symlink(resolve(workspace, 'planning/PRD.md'), join(workspace, 'planning/portfolio-brief.md'))
    } catch (error) {
      if (process.platform !== 'win32'
        || !(error instanceof Error)
        || !('code' in error)
        || error.code !== 'EPERM') throw error
      symlinkCreated = false
    }
    const mapPath = join(workspace, 'planning/requirement-validation-map.md')
    await writeFile(mapPath, (await readFile(mapPath, 'utf8')).replace('REQ-01', 'REQ-99'), 'utf8')
    const evidence = await adapter().collect(context(workspace))

    const expectedIssues = [
      expect.objectContaining({ code: 'requirement-coverage', path: 'planning/requirement-validation-map.md' })
    ]
    if (symlinkCreated) {
      expectedIssues.push(expect.objectContaining({ code: 'symlink', path: 'planning/portfolio-brief.md' }))
    }
    expect(evidence.portfolioPlanning?.issues).toEqual(expect.arrayContaining(expectedIssues))
  })
})
