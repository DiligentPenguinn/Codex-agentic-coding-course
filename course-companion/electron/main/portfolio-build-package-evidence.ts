import { createHash } from 'node:crypto'
import { lstat, readFile, readdir, realpath } from 'node:fs/promises'
import { relative, resolve, sep } from 'node:path'
import { portfolioBuildRecordPaths, portfolioPackageArtifactPaths, type PortfolioPlanningArtifactSnapshot, type PortfolioPlanningIssue, type PracticeAdapterEvidenceState } from '../../shared/contracts'
import type { PracticeEvidenceAdapterContext } from './practice-evidence-adapter'
import { correlateValidationSource } from './validation-source-correlation'

const hash = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')
const documents = [...portfolioPackageArtifactPaths, ...portfolioBuildRecordPaths]
const ignoredDirectories = new Set(['node_modules', '.git', 'dist', 'out', 'coverage', 'planning', 'evidence', '.codex', '.agents', '.openai', '.vercel'])

// The digest covers application files, including assets and configuration. It never
// sends application source to the reviewer. Evidence documents are hashed separately.
export async function applicationSnapshot(root: string, verifyInventory?: (files: readonly { path: string; digest: string }[]) => Promise<void>, validationRecord?: string): Promise<PortfolioPlanningArtifactSnapshot> {
  const files: Array<{ path: string; digest: string }> = []
  let totalBytes = 0
  let visitedEntries = 0
  let latestSourceChange = 0
  const visit = async (directory: string): Promise<void> => {
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))) {
      const path = resolve(directory, entry.name)
      if (entry.isDirectory() && directory === root && ignoredDirectories.has(entry.name)) continue
      if (entry.isFile() && entry.name === '.DS_Store') continue
      if (++visitedEntries > 5000) throw new Error('Ứng dụng có quá nhiều mục để kiểm chứng trong một lần đọc.')
      if (entry.isSymbolicLink()) throw new Error('Ứng dụng có liên kết tệp chưa thể kiểm chứng an toàn.')
      if (entry.isDirectory()) { await visit(path); continue }
      if (!entry.isFile()) throw new Error('Ứng dụng có mục chưa thể đọc như tệp thông thường.')
      const info = await lstat(path)
      latestSourceChange = Math.max(latestSourceChange, info.mtimeMs)
      totalBytes += info.size
      if (info.size > 25 * 1024 * 1024 || totalBytes > 100 * 1024 * 1024 || files.length >= 3000) {
        throw new Error('Ứng dụng vượt giới hạn đọc hiện tại; cần kiểm tra lại phạm vi tệp trước khi nộp.')
      }
      await containedFile(root, path)
      files.push({ path: relative(root, path).split(sep).join('/'), digest: hash(await readFile(path)) })
    }
  }
  await visit(root)
  if (!files.some((file) => file.path.startsWith('src/')) || !files.some((file) => file.path === 'index.html')) {
    throw new Error('Chưa tìm thấy mã ứng dụng trong src/ và trang index.html.')
  }
  await verifyInventory?.(files)
  const correlation = validationRecord === undefined ? ''
    : '\nValidation source correlation independently recomputed by Course Companion: ' + JSON.stringify(correlateValidationSource(files, validationRecord))
  const content = `Application source fingerprint: ${hash(JSON.stringify(files))}; ${files.length} files independently read. Browser and command results remain Codex-reported until corroborated.${correlation}`
  return { path: 'application/source', digest: hash(JSON.stringify(files)), content, byteLength: totalBytes, modifiedAt: new Date(latestSourceChange).toISOString(), observedAt: '' }
}

export async function containedFile(root: string, path: string): Promise<void> {
  const parts = relative(root, path).split(sep)
  if (parts.includes('..')) throw new Error('Đường dẫn thoát khỏi thư mục portfolio.')
  let current = root
  for (const part of parts) {
    current = resolve(current, part)
    if ((await lstat(current)).isSymbolicLink()) throw new Error('Tệp hoặc thư mục cha là liên kết chưa được kiểm chứng.')
  }
  const canonical = await realpath(path)
  if (canonical !== root && !canonical.startsWith(root + sep)) throw new Error('Đường dẫn thoát khỏi thư mục portfolio.')
}

export async function collectPortfolioBuildPackage(context: Readonly<PracticeEvidenceAdapterContext>, observedAt: string): Promise<PracticeAdapterEvidenceState> {
  const root = await realpath(resolve(context.workspaceRoot))
  const artifacts: PortfolioPlanningArtifactSnapshot[] = []
  const issues: PortfolioPlanningIssue[] = []
  const problem = (path: string, message: string, code: PortfolioPlanningIssue['code'] = 'missing-section') => {
    issues.push({ stageId: 'final-validation', path, code, message })
  }
  for (const path of documents) {
    try {
      const absolute = resolve(root, path)
      await containedFile(root, absolute)
      const info = await lstat(absolute)
      if (!info.isFile() || info.size === 0 || info.size > 128 * 1024) throw new Error('Cần một tệp văn bản không trống, tối đa 128 KB.')
      const bytes = await readFile(absolute)
      const content = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      artifacts.push({ path, content, digest: hash(bytes), byteLength: bytes.length, modifiedAt: info.mtime.toISOString(), observedAt })
      const sections = content.split(/^#{1,6}\s+.+$/m).slice(1)
      if (sections.filter((section) => section.trim()).length < 2) problem(path, 'Cần ít nhất hai mục có nội dung thực tế; Codex có thể ghi lại từ công việc và quyết định của bạn.')
      if (/(?:\[điền[^\]]*\]|\[insert[^\]]*\]|\bTODO\b|\bTBD\b)/i.test(content)) problem(path, 'Còn chỗ giữ chỗ chưa được thay bằng bằng chứng thực tế.', 'placeholder')
    } catch (error) {
      problem(path, (error as NodeJS.ErrnoException).code === 'ENOENT' ? 'Chưa tìm thấy tài liệu; tiếp tục trong task Codex để ghi lại bằng chứng.' : 'Không thể đọc tài liệu an toàn; kiểm tra loại tệp, kích thước, UTF-8 và đường dẫn.', 'missing')
    }
  }
  try {
    await containedFile(root, resolve(root, 'package.json'))
    const info = await lstat(resolve(root, 'package.json'))
    if (info.size > 128 * 1024) throw new Error('package.json quá lớn.')
    const pkg = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8')) as { scripts?: Record<string, string>; dependencies?: Record<string, string>; devDependencies?: Record<string, string> }
    const scripts = pkg.scripts ?? {}
    if (!['dev', 'typecheck', 'lint', 'build', 'preview', 'check'].every((key) => typeof scripts[key] === 'string' && scripts[key].trim())) problem('package.json', 'Codex cần chuẩn bị đủ lệnh dev, typecheck, lint, build, preview và check.')
    if (!/typecheck.*lint.*build/.test(scripts.check ?? '')) problem('package.json', 'Lệnh check cần chạy typecheck, lint và build theo thứ tự.')
    const dependencies = { ...pkg.dependencies, ...pkg.devDependencies }
    if (!['react', 'typescript', 'vite'].every((name) => dependencies[name])) problem('package.json', 'Ứng dụng cần giữ nền React, TypeScript và Vite của bài thực hành.')
    if (Object.keys(dependencies).some((name) => /firebase|supabase|prisma|mongoose|stripe|auth0|analytics/i.test(name))) problem('package.json', 'Có dịch vụ xử lý dữ liệu ngoài phạm vi bài thực hành.', 'invalid-plan-boundary')
    const validation = artifacts.find((artifact) => artifact.path === 'evidence/module-3/browser-validation.md')
    let validatedSourceMatches = false
    const source = await applicationSnapshot(root, async (files) => {
      validatedSourceMatches = validation?.content !== undefined
        && correlateValidationSource(files, validation.content).status === 'matched'
    }, validation?.content)
    artifacts.push({ ...source, observedAt })
    if (validation && !validatedSourceMatches && Date.parse(validation.modifiedAt) < Date.parse(source.modifiedAt)) {
      problem(validation.path, 'Mã nguồn đã đổi sau hồ sơ kiểm tra. Hãy kiểm tra lại website và cập nhật kết quả hiện tại trước khi nộp.')
    }
  } catch {
    problem('application/source', 'Chưa thể kiểm chứng toàn bộ tệp ứng dụng. Kiểm tra package.json, src/, index.html, liên kết tệp và giới hạn kích thước.', 'missing')
  }
  const sourceDigest = hash(JSON.stringify({ artifacts: artifacts.map(({ path, digest }) => ({ path, digest })), issues }))
  return {
    schemaVersion: 1, practiceId: context.definition.practiceId, practiceVersion: context.definition.version,
    runId: context.runId, evidenceProfile: 'portfolio-build', observedAt, freshness: 'fresh', sourceDigest,
    evidence: artifacts.map((artifact, index) => ({ id: `build-record-${index + 1}`, kind: 'artifact', text: `${artifact.path} | sha256=${artifact.digest}`, freshness: 'fresh' })),
    steps: context.definition.checklist.map((step, index) => ({ stepId: step.id, status: index === 0 ? 'current' : 'pending', dependencyInputs: {} })),
    invalidations: [],
    portfolioBuild: { schemaVersion: 1, workspaceIdentityDigest: hash(resolve(context.workspaceRoot)), artifacts, issues, unexpectedPaths: [],
      stages: (context.definition.stages ?? []).map((stage) => {
        const digests = Object.fromEntries(artifacts.filter((artifact) => stage.requiredArtifactPaths.includes(artifact.path)).map(({ path, digest }) => [path, digest]))
        return { stageId: stage.id, stageIndex: stage.order, status: issues.length ? 'blocked' : 'ready',
          artifactDigests: digests, corroboratedArtifacts: { ...digests }, executorReportedChecks: [], issueCodes: [...new Set(issues.map((issue) => issue.code))] }
      }) }
  }
}
