import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { afterEach, describe, expect, it } from 'vitest'
import type { ExecutorActivitySnapshot, PracticeDefinition } from '../shared/contracts'
import { PortfolioBuildEvidenceAdapter } from '../electron/main/portfolio-build-evidence-adapter'

const roots: string[] = []
afterEach(async () => Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))))

const definition: PracticeDefinition = JSON.parse(await readFile(join(
  process.cwd(), '..', 'pilot-workspace', 'course', 'practices', 'm3-portfolio-build.json'
), 'utf8')) as PracticeDefinition

const approval = `
## Phê duyệt phiên bản hiện tại

- Quyết định: \`đã duyệt\`
- Người học xác nhận: Tôi đã xem bằng chứng hiện tại và chấp nhận kết quả này.
- Thời điểm: 2026-08-15T00:00:00.000Z
- Digest artifact hiện tại: sẽ do Course Companion đối chiếu
`

const artifacts: Record<string, string> = {
  'planning/PRD.md': '# PRD\n\nREQ-1 và AC-1 mô tả portfolio cho nhà tuyển dụng, gồm Hero, hai dự án, About và Contact.',
  'planning/implementation-plan.md': '# Kế hoạch\n\nXây nền trung tính trước, sau đó xây bốn phần và kiểm tra từng phần.',
  'evidence/module-3/scaffold-report.md': `# Báo cáo nền ứng dụng
## Hợp đồng đầu vào
Workspace và digest PRD cùng implementation plan đã được đọc trực tiếp.
## Đề xuất trước khi tạo
Lệnh, dependency, tệp, kết quả, kiểm chứng, mạng và quyền đã được nêu rồi duyệt.
## Phạm vi được phép
React, TypeScript, Vite, trang trung tính và các script tối thiểu.
## Ngoài phạm vi
Chưa tạo Hero, dự án, About, Contact, footer hoặc cấu hình deployment.
## Kết quả thực tế
npm run dev, npm run check và npm run preview đều được Executor báo đạt; trang trung tính đã được xem.
## Điểm khôi phục
Checkpoint cục bộ scaffold-001; dùng git revert scaffold-001 khi cần.
${approval}`,
  'evidence/module-3/design-direction.md': `# Hướng thiết kế
## Hợp đồng đầu vào
PRD, inventory và tham chiếu hiện tại.
## Điều quan sát được từ tham chiếu
Phân cấp rõ, khoảng trắng rộng và dự án là trọng tâm.
## Giữ lại, điều chỉnh, đơn giản hóa hoặc loại bỏ
Giữ phân cấp; dùng nội dung và nhận diện của người học; không sao chép code, ảnh hoặc thương hiệu.
## Cách chuyển sang màn hình mobile
Một cột, navigation ngắn, dự án xếp dọc và không cuộn ngang.
## Bốn phần xây dựng
Hero; Selected Work; About/Contact/footer; responsive/accessibility.
## Ngoài phạm vi
Không motion phức tạp, backend, analytics hoặc deployment.
${approval}`,
  'evidence/module-3/build-log.md': `# Nhật ký xây
## Hợp đồng đầu vào
Digest PRD và design direction hiện tại; desktop 1440 × 900; mobile 390 × 844.
## Phần 1 — Nền trang và Hero
Phạm vi đã duyệt: semantic foundation, navigation và Hero. Tóm tắt năm phần: thay đổi, điều cần nhìn, điều giữ nguyên, checks, rủi ro. Quyết định: \`đã duyệt\`. Checkpoint cục bộ: slice-001.
## Phần 2 — Selected Work
Phạm vi đã duyệt: hai dự án với bằng chứng được ghi nhãn. Tóm tắt năm phần: thay đổi, điều cần nhìn, điều giữ nguyên, checks, rủi ro. Quyết định: \`đã duyệt\`. Checkpoint cục bộ: slice-002.
## Phần 3 — About, Contact và footer
Phạm vi đã duyệt: câu chuyện liên quan, contact đã kiểm chứng và footer. Tóm tắt năm phần: thay đổi, điều cần nhìn, điều giữ nguyên, checks, rủi ro. Quyết định: \`đã duyệt\`. Checkpoint cục bộ: slice-003.
## Phần 4 — Tích hợp responsive và accessibility
Desktop/mobile, heading, landmark, bàn phím, focus, alt, link và console đã kiểm tra. Tóm tắt năm phần: thay đổi, điều cần nhìn, điều giữ nguyên, checks, rủi ro. Quyết định: \`đã duyệt\`. Checkpoint cục bộ: slice-004.
## Kiểm tra tính toàn vẹn
- [x] Đủ bốn phần theo đúng thứ tự.
- [x] Mỗi phần có biên nhận và checkpoint riêng.
- [x] Phần sau không tự ý viết lại nội dung đã duyệt.
- [x] Portfolio core đã đủ; cải tiến tùy chọn chưa được trộn vào.
${approval}`,
  'evidence/module-3/browser-validation.md': `# Kiểm chứng trình duyệt
## Phiên bản được kiểm chứng
Checkpoint slice-004 và digest build log hiện tại.
## Desktop — 1440 × 900
Hero và hai dự án hiển thị đúng; cuộn ngang: \`không\`.
## Mobile — 390 × 844
Một cột, navigation và link hoạt động; cuộn ngang: \`không\`.
## Kiểm tra trực tiếp
- [x] Navigation và các link chính hoạt động.
- [x] Dùng bàn phím được và luôn thấy focus.
- [x] Heading cùng landmark có thứ tự hợp lý.
- [x] Ảnh quan trọng có văn bản thay thế phù hợp.
- [x] Không có lỗi console chưa được giải thích.
## Giới hạn hoặc bằng chứng còn thiếu
Chưa kiểm tra trình đọc màn hình; không nằm trong gate pilot hiện tại.
${approval}`,
  'evidence/module-3/revision-record.md': `# Revision
## Bằng chứng trước khi sửa
Selected Work xuất hiện quá muộn ở cả hai viewport và làm người xem chậm thấy bằng chứng.
## Phản hồi bằng lời của người học
Tôi muốn người xem thấy dự án sớm hơn nhưng giữ nguyên nội dung.
## Đề xuất sửa có giới hạn
Đưa Selected Work ngay sau Hero; giữ nội dung, typography và contact; kiểm tra navigation.
## Kết quả sau khi sửa
Dự án xuất hiện sớm hơn ở hai viewport, navigation và npm run check vẫn đạt.
${approval}`,
  'evidence/module-3/debugging-report.md': `# Gỡ lỗi
## Phạm vi lỗi
Link Contact không cuộn tới section tương ứng.
## Tái hiện
Mong đợi: chọn Contact sẽ tới phần Contact. Thực tế: URL đổi nhưng vị trí không đổi. Quan sát trên cả hai viewport.
## Một giả thuyết
ID của section không khớp href của link navigation.
## Thay đổi nhỏ nhất có lý
Đồng bộ đúng một ID, không thay component hoặc thư viện.
## Kiểm chứng sau khi sửa
Kiểm tra lỗi gốc, keyboard navigation, focus, các link khác và npm run check đều đạt.
## Giải thích của người học
Bằng chứng về href và ID xác nhận giả thuyết; bản sửa giải quyết đúng nguyên nhân.
${approval}`,
  'evidence/module-3/enhancement-plan.md': `# Cải tiến
## Lựa chọn của người học
Thêm link tải CV tĩnh đã kiểm tra metadata và quyền công bố.
## Mục tiêu và tiêu chí chấp nhận
Link rõ, tải đúng PDF, dùng bàn phím được và không phá navigation.
## Kế hoạch nhỏ
Thêm asset đã duyệt và một link có nhãn rõ; giữ phần khác nguyên trạng.
## Cửa an toàn
Chỉ chạy trong trình duyệt, không xử lý hoặc gửi dữ liệu người dùng.
## Kết quả và bằng chứng chấp nhận
Link tải đúng file; keyboard, hai viewport và npm run check đạt.
${approval}`,
  'evidence/module-3/final-change-summary.md': `# Tóm tắt thay đổi
## Phiên bản được tóm tắt
Checkpoint enhancement-001 và tám artifact hiện tại.
## 1. Điều đã thay đổi
Portfolio core, một revision, một bản sửa lỗi và link CV.
## 2. Điều người học nên chú ý trong website
Hero rõ, dự án xuất hiện sớm và contact hoạt động.
## 3. Điều chủ động giữ nguyên
Nội dung đã duyệt, visual direction và ranh giới không xử lý dữ liệu.
## 4. Kiểm tra và kết quả
npm run check, hai viewport, keyboard, focus, image alt, navigation và console đạt.
## 5. Rủi ro, giới hạn hoặc quyết định còn lại
Production chưa được chọn; trình đọc màn hình chưa được kiểm tra chuyên sâu.
${approval}`
}

async function workspace(): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-build-adapter-'))
  roots.push(root)
  for (const [path, content] of Object.entries(artifacts)) {
    await mkdir(join(root, path, '..'), { recursive: true })
    await writeFile(join(root, path), content, 'utf8')
  }
  await writeFile(join(root, 'package.json'), JSON.stringify({
    scripts: {
      dev: 'vite', typecheck: 'tsc --noEmit', lint: 'eslint .', build: 'vite build', preview: 'vite preview',
      check: 'npm run typecheck && npm run lint && npm run build'
    },
    dependencies: { react: '19.0.0' },
    devDependencies: { vite: '7.0.0', typescript: '6.0.0' }
  }), 'utf8')
  return root
}

function activity(): ExecutorActivitySnapshot {
  return {
    schemaVersion: 1, runId: 'run-m3', threadId: 'thread-m3', status: 'response-ready', cursor: 'cursor-1',
    learnerPrompts: [], executorResponses: [], approvalEvents: [], changedFiles: [], verificationEvidence: [], reportedChangedFiles: [],
    reportedVerificationEvidence: ['Executor reported: npm run check passed', 'Executor reported: npm run preview served the build'],
    workspaceConfirmedChangedFiles: [], workspaceCommittedReportedFilesSinceRunStart: [], workspaceCurrentlyDirtyReportedFiles: [],
    observedAt: '2026-08-15T00:00:00.000Z', workspaceBaseline: null, configuration: null
  }
}

describe('PortfolioBuildEvidenceAdapter', () => {
  it('corroborates eight artifacts, five stages and four independent build slice digests', async () => {
    const root = await workspace()
    const adapter = new PortfolioBuildEvidenceAdapter({ current: () => Promise.resolve(activity()) }, () => new Date('2026-08-15T00:00:00.000Z'))
    const result = await adapter.collect({ definition, runId: 'run-m3', generation: 1, workspaceRoot: root, task: { threadId: 'thread-m3', workspaceRoot: root } })
    expect(result.freshness).toBe('fresh')
    expect(result.portfolioBuild?.stages).toHaveLength(5)
    expect(result.portfolioBuild?.stages.every((stage) => stage.status === 'ready')).toBe(true)
    expect(result.portfolioBuild?.artifacts.filter((item) => item.path.startsWith('evidence/module-3/build-log.') && item.path !== 'evidence/module-3/build-log.md')).toHaveLength(4)
    expect(result.evidence.some((item) => item.kind === 'executor-reported-verification' && item.text.includes('npm run check'))).toBe(true)
  })

  it('blocks the affected stage when an artifact loses current learner approval', async () => {
    const root = await workspace()
    const path = join(root, 'evidence/module-3/revision-record.md')
    await writeFile(path, (await readFile(path, 'utf8')).replace('`đã duyệt`', '`chưa duyệt`'), 'utf8')
    const result = await new PortfolioBuildEvidenceAdapter({ current: () => Promise.resolve(activity()) }).collect({ definition, runId: 'run-m3', generation: 1, workspaceRoot: root, task: { threadId: 'thread-m3', workspaceRoot: root } })
    expect(result.portfolioBuild?.stages.find((stage) => stage.stageId === 'whole-page-revision')?.status).toBe('blocked')
    expect(result.portfolioBuild?.stages.find((stage) => stage.stageId === 'complete-first-version')?.status).toBe('ready')
  })

  it('rejects data-processing dependencies from the standard Module 3 boundary', async () => {
    const root = await workspace()
    const packagePath = join(root, 'package.json')
    const pkg = JSON.parse(await readFile(packagePath, 'utf8')) as { dependencies: Record<string, string> }
    pkg.dependencies['@supabase/supabase-js'] = '2.0.0'
    await writeFile(packagePath, JSON.stringify(pkg), 'utf8')
    const result = await new PortfolioBuildEvidenceAdapter({ current: () => Promise.resolve(activity()) }).collect({ definition, runId: 'run-m3', generation: 1, workspaceRoot: root, task: { threadId: 'thread-m3', workspaceRoot: root } })
    expect(result.portfolioBuild?.issues).toContainEqual(expect.objectContaining({ stageId: 'independent-enhancement', code: 'invalid-plan-boundary' }))
  })
})
