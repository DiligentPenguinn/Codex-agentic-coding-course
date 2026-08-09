import { createHash } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { lstat, readlink } from 'node:fs/promises'
import { isAbsolute, normalize, relative, resolve } from 'node:path'
import { spawn } from 'node:child_process'
import type {
  WorkspaceEvidenceBaseline,
  WorkspaceEvidenceReconciliation
} from '../../shared/contracts'

const MAX_DIRTY_PATHS = 500
const MAX_GIT_OUTPUT = 1_000_000
const GIT_TIMEOUT_MS = 10_000

function containedRelativePath(value: string, workspaceRoot: string): string | null {
  const absolute = isAbsolute(value) ? normalize(value) : resolve(workspaceRoot, value)
  const result = relative(workspaceRoot, absolute).replaceAll('\\', '/')
  if (!result || result.startsWith('..') || isAbsolute(result) || result.split('/').includes('..')) return null
  return result.length <= 500 ? result : null
}

async function contentSignature(workspaceRoot: string, path: string): Promise<string> {
  const relativePath = containedRelativePath(path, workspaceRoot)
  if (!relativePath) return 'unsafe'
  const absolute = resolve(workspaceRoot, relativePath)
  try {
    const info = await lstat(absolute)
    if (info.isSymbolicLink()) {
      return 'symlink:' + createHash('sha256').update(await readlink(absolute)).digest('hex')
    }
    if (!info.isFile()) return ['other', info.mode, info.size, info.mtimeMs].join(':')
    const digest = createHash('sha256')
    await new Promise<void>((resolveStream, rejectStream) => {
      const stream = createReadStream(absolute)
      stream.on('data', (chunk) => digest.update(chunk))
      stream.once('end', resolveStream)
      stream.once('error', rejectStream)
    })
    return 'file:' + digest.digest('hex')
  } catch {
    return 'missing'
  }
}

function gitOutput(workspaceRoot: string, args: string[]): Promise<Buffer> {
  return new Promise((resolveOutput, rejectOutput) => {
    const child = spawn('git', args, {
      cwd: workspaceRoot,
      windowsHide: true,
      shell: false,
      stdio: ['ignore', 'pipe', 'ignore']
    })
    const chunks: Buffer[] = []
    let size = 0
    let settled = false
    const fail = (message: string): void => {
      if (settled) return
      settled = true
      child.kill()
      rejectOutput(new Error(message))
    }
    const timeout = setTimeout(() => fail('Git command timed out'), GIT_TIMEOUT_MS)
    child.stdout.on('data', (chunk: Buffer) => {
      size += chunk.length
      if (size > MAX_GIT_OUTPUT) {
        fail('Git output exceeded its safe bound')
        return
      }
      chunks.push(chunk)
    })
    child.once('error', () => fail('Git command failed'))
    child.once('exit', (code) => {
      clearTimeout(timeout)
      if (settled) return
      settled = true
      if (code !== 0) {
        rejectOutput(new Error('Git command failed'))
        return
      }
      resolveOutput(Buffer.concat(chunks))
    })
  })
}

function parseNullPaths(output: Buffer, workspaceRoot: string): string[] {
  return [...new Set(
    output.toString('utf8')
      .split('\0')
      .map((path) => containedRelativePath(path.trim(), workspaceRoot))
      .filter((path): path is string => Boolean(path))
  )].slice(0, MAX_DIRTY_PATHS)
}

async function gitStatus(workspaceRoot: string): Promise<string[]> {
  const output = await gitOutput(workspaceRoot, ['status', '--porcelain=v1', '-z', '--untracked-files=all'])
  const fields = output.toString('utf8').split('\0')
  const paths: string[] = []
  for (let index = 0; index < fields.length && paths.length < MAX_DIRTY_PATHS; index += 1) {
    const field = fields[index]
    if (!field || field.length < 4) continue
    const status = field.slice(0, 2)
    const path = containedRelativePath(field.slice(3), workspaceRoot)
    if (path) paths.push(path)
    if (status.includes('R') || status.includes('C')) index += 1
  }
  return [...new Set(paths)]
}

async function gitHead(workspaceRoot: string): Promise<string | null> {
  try {
    const head = (await gitOutput(workspaceRoot, ['rev-parse', '--verify', 'HEAD'])).toString('utf8').trim()
    return /^[0-9a-f]{40,64}$/i.test(head) ? head : null
  } catch {
    return null
  }
}

async function changedFromHead(workspaceRoot: string, head: string): Promise<string[]> {
  return parseNullPaths(
    await gitOutput(workspaceRoot, ['diff', '--name-only', '-z', head]),
    workspaceRoot
  )
}

async function committedPathsSince(
  workspaceRoot: string,
  runStartedAt: string | undefined,
  reportedPaths: string[]
): Promise<string[]> {
  if (!runStartedAt || Number.isNaN(Date.parse(runStartedAt)) || reportedPaths.length === 0) return []
  const output = await gitOutput(workspaceRoot, [
    'log',
    '--since=' + runStartedAt,
    '--name-only',
    '-z',
    '--format=',
    '--',
    ...reportedPaths.slice(0, 100)
  ])
  const reported = new Set(reportedPaths)
  return parseNullPaths(output, workspaceRoot).filter((path) => reported.has(path)).slice(0, 100)
}

async function snapshotEntries(workspaceRoot: string): Promise<Record<string, string>> {
  const paths = await gitStatus(workspaceRoot)
  const signatures = await Promise.all(paths.map(async (path) => [path, await contentSignature(workspaceRoot, path)] as const))
  return Object.fromEntries(signatures)
}

export type WorkspaceEvidenceProvider = {
  capture: (workspaceRoot: string, capturedAt: string) => Promise<WorkspaceEvidenceBaseline>
  reconcile: (
    workspaceRoot: string,
    baseline: WorkspaceEvidenceBaseline | null,
    reportedPaths?: string[],
    runStartedAt?: string
  ) => Promise<WorkspaceEvidenceReconciliation>
}

export class GitWorkspaceEvidenceProvider implements WorkspaceEvidenceProvider {
  async capture(workspaceRoot: string, capturedAt: string): Promise<WorkspaceEvidenceBaseline> {
    try {
      const [entries, head] = await Promise.all([
        snapshotEntries(workspaceRoot),
        gitHead(workspaceRoot)
      ])
      return {
        schemaVersion: 1,
        capturedAt,
        gitAvailable: true,
        head,
        entries
      }
    } catch {
      return { schemaVersion: 1, capturedAt, gitAvailable: false, head: null, entries: {} }
    }
  }

  async reconcile(
    workspaceRoot: string,
    baseline: WorkspaceEvidenceBaseline | null,
    reportedPaths: string[] = [],
    runStartedAt?: string
  ): Promise<WorkspaceEvidenceReconciliation> {
    if (baseline && !baseline.gitAvailable) throw new Error('Workspace Git evidence is unavailable')

    const current = await snapshotEntries(workspaceRoot)

    const reported = new Set(
      reportedPaths
        .map((path) => containedRelativePath(path.trim(), workspaceRoot))
        .filter((path): path is string => Boolean(path))
    )
    if (!baseline) {
      const normalizedReported = [...reported]
      return {
        changedSinceBaseline: [],
        committedReportedFilesSinceRunStart: await committedPathsSince(workspaceRoot, runStartedAt, normalizedReported),
        currentlyDirtyReportedFiles: Object.keys(current)
          .filter((path) => reported.has(path))
          .slice(0, 100)
      }
    }

    const candidatePaths = new Set(Object.keys(current))
    if (baseline.head) {
      for (const path of await changedFromHead(workspaceRoot, baseline.head)) candidatePaths.add(path)
    }

    const changedSinceBaseline: string[] = []
    for (const path of candidatePaths) {
      if (changedSinceBaseline.length >= 100) break
      const baselineSignature = baseline.entries[path]
      if (baselineSignature === undefined) {
        changedSinceBaseline.push(path)
        continue
      }
      if (await contentSignature(workspaceRoot, path) !== baselineSignature) {
        changedSinceBaseline.push(path)
      }
    }
    return { changedSinceBaseline, committedReportedFilesSinceRunStart: [], currentlyDirtyReportedFiles: [] }
  }
}
