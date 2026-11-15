import { createHash } from 'node:crypto'
import { execFile } from 'node:child_process'
import { cp, mkdtemp, readdir, readFile, rm, stat } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, join, relative, resolve, sep } from 'node:path'
import { promisify } from 'node:util'

const exec = promisify(execFile)
const WORKSPACE_PREFIX = 'course-companion-practice-'
const excludedNames = new Set(['.git', 'node_modules', 'out', 'dist', '.next'])

function shouldCopy(source) {
  const name = basename(source)
  if (excludedNames.has(name)) return false
  if (name === '.env' || name.startsWith('.env.')) return false
  return true
}

async function git(root, args) {
  return exec('git', args, { cwd: root, windowsHide: true })
}

async function filesUnder(root, current = root) {
  const entries = await readdir(current, { withFileTypes: true })
  const files = []
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const path = join(current, entry.name)
    if (!shouldCopy(path)) continue
    if (entry.isDirectory()) files.push(...await filesUnder(root, path))
    else if (entry.isFile()) files.push(path)
  }
  return files
}

export async function fingerprintTree(root) {
  const hash = createHash('sha256')
  for (const path of await filesUnder(root)) {
    hash.update(relative(root, path).replaceAll('\\', '/'))
    hash.update('\0')
    hash.update(await readFile(path))
    hash.update('\0')
  }
  return hash.digest('hex')
}

export async function createDisposablePracticeWorkspace({ repositoryRoot }) {
  const canonicalWorkspace = resolve(repositoryRoot, 'pilot-workspace')
  const canonicalStarter = join(canonicalWorkspace, 'contentpilot')
  if (!(await stat(canonicalWorkspace)).isDirectory() || !(await stat(canonicalStarter)).isDirectory()) {
    throw new Error('Canonical Pilot workspace is unavailable')
  }

  const root = await mkdtemp(join(tmpdir(), WORKSPACE_PREFIX))
  const workspaceRoot = join(root, 'pilot-workspace')
  const starterRoot = join(workspaceRoot, 'contentpilot')
  try {
    await cp(canonicalWorkspace, workspaceRoot, {
      recursive: true,
      errorOnExist: true,
      force: false,
      filter: shouldCopy
    })
    await git(root, ['init', '--quiet'])
    await git(root, ['config', 'user.name', 'Course Companion Test'])
    await git(root, ['config', 'user.email', 'course-companion-test@localhost'])
    await git(root, ['add', '--all'])
    await git(root, ['commit', '--quiet', '-m', 'Practice test baseline'])
  } catch (error) {
    await rm(root, { recursive: true, force: true })
    throw error
  }

  let cleaned = false
  return Object.freeze({
    root,
    workspaceRoot,
    starterRoot,
    canonicalWorkspace,
    canonicalStarter,
    async cleanup() {
      if (cleaned) return
      const resolvedRoot = resolve(root)
      const temporaryRoot = resolve(tmpdir()) + sep
      if (!resolvedRoot.startsWith(temporaryRoot)
        || !basename(resolvedRoot).startsWith(WORKSPACE_PREFIX)) {
        throw new Error('Refusing to remove an unowned Practice test workspace')
      }
      cleaned = true
      await rm(resolvedRoot, { recursive: true, force: true })
    }
  })
}
