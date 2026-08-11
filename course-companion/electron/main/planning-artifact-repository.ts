import { createHash } from 'node:crypto'
import {
  lstat,
  readFile,
  readdir,
  realpath
} from 'node:fs/promises'
import {
  basename,
  dirname,
  isAbsolute,
  relative,
  resolve
} from 'node:path'
import {
  planningArtifactPaths,
  type PlanningArtifactIssue,
  type PlanningArtifactPath,
  type PlanningArtifactSnapshot
} from '../../shared/contracts'

export const MAX_PLANNING_ARTIFACT_BYTES = 64 * 1024
const permittedPaths = new Set<string>(planningArtifactPaths)

export function redactPlanningEvidence(value: string): string {
  return value
    .replace(/-----BEGIN [^-\r\n]*PRIVATE KEY-----[\s\S]*?-----END [^-\r\n]*PRIVATE KEY-----/gi, '[REDACTED PRIVATE KEY]')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+/gi, 'Bearer [REDACTED]')
    .replace(/\b(token|password|secret|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, '$1=[REDACTED]')
}

function issue(
  path: PlanningArtifactPath,
  code: PlanningArtifactIssue['code'],
  message: string
): PlanningArtifactIssue {
  return { path, code, message }
}

function isContained(root: string, candidate: string): boolean {
  const child = relative(root, candidate)
  return child.length > 0
    && !child.startsWith('..')
    && !isAbsolute(child)
    && !child.split(/[\\/]/).includes('..')
}

export type PlanningArtifactInspection =
  | { status: 'ready'; artifact: PlanningArtifactSnapshot }
  | { status: 'rejected'; issue: PlanningArtifactIssue }

export class PlanningArtifactRepository {
  async inspect(
    workspaceRoot: string,
    artifactPath: string,
    observedAt: string
  ): Promise<PlanningArtifactInspection> {
    if (!permittedPaths.has(artifactPath)) {
      throw new Error('Unsupported planning artifact path')
    }
    const path = artifactPath as PlanningArtifactPath
    const absolute = resolve(workspaceRoot, path)
    if (!isContained(resolve(workspaceRoot), absolute)) {
      return { status: 'rejected', issue: issue(path, 'escaping', 'Đường dẫn artifact thoát khỏi workspace.') }
    }

    let rootReal: string
    try {
      const rootInfo = await lstat(workspaceRoot)
      if (!rootInfo.isDirectory() || rootInfo.isSymbolicLink()) {
        return { status: 'rejected', issue: issue(path, 'escaping', 'Workspace không phải thư mục thật đã xác minh.') }
      }
      rootReal = await realpath(workspaceRoot)
    } catch {
      return { status: 'rejected', issue: issue(path, 'missing', 'Workspace hoặc artifact không tồn tại.') }
    }

    try {
      const artifactDirectory = dirname(absolute)
      const directoryInfo = await lstat(artifactDirectory)
      if (directoryInfo.isSymbolicLink()) {
        return { status: 'rejected', issue: issue(path, 'symlink', 'Thư mục artifact không được là symlink.') }
      }
      if (!directoryInfo.isDirectory()) {
        return { status: 'rejected', issue: issue(path, 'directory', 'Đường dẫn artifacts không phải thư mục.') }
      }
      const names = await readdir(artifactDirectory)
      if (!names.includes(basename(path))) {
        return { status: 'rejected', issue: issue(path, 'missing', 'Không tìm thấy đúng artifact bắt buộc.') }
      }

      const info = await lstat(absolute)
      if (info.isSymbolicLink()) {
        return { status: 'rejected', issue: issue(path, 'symlink', 'Artifact không được là symlink.') }
      }
      if (!info.isFile()) {
        return { status: 'rejected', issue: issue(path, 'directory', 'Artifact phải là một tệp thường.') }
      }
      const fileReal = await realpath(absolute)
      if (!isContained(rootReal, fileReal)) {
        return { status: 'rejected', issue: issue(path, 'escaping', 'Artifact được phân giải ra ngoài workspace.') }
      }
      if (info.size > MAX_PLANNING_ARTIFACT_BYTES) {
        return { status: 'rejected', issue: issue(path, 'oversized', 'Artifact vượt quá giới hạn kích thước an toàn.') }
      }

      const bytes = await readFile(absolute)
      if (bytes.byteLength > MAX_PLANNING_ARTIFACT_BYTES) {
        return { status: 'rejected', issue: issue(path, 'oversized', 'Artifact vượt quá giới hạn kích thước an toàn.') }
      }
      let content: string
      try {
        content = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
      } catch {
        return { status: 'rejected', issue: issue(path, 'invalid-utf8', 'Artifact không phải văn bản UTF-8 hợp lệ.') }
      }
      if (content.trim().length === 0) {
        return { status: 'rejected', issue: issue(path, 'empty', 'Artifact đang trống.') }
      }
      return {
        status: 'ready',
        artifact: {
          schemaVersion: 1,
          path,
          content: redactPlanningEvidence(content),
          digest: createHash('sha256').update(bytes).digest('hex'),
          byteLength: bytes.byteLength,
          modifiedAt: info.mtime.toISOString(),
          observedAt
        }
      }
    } catch {
      return { status: 'rejected', issue: issue(path, 'missing', 'Không tìm thấy đúng artifact bắt buộc.') }
    }
  }
}
