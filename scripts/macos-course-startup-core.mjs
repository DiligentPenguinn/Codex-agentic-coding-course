import { createHash } from 'node:crypto'
import { readFile as readFileDefault } from 'node:fs/promises'

export const minimumNodeMajor = 22

export function nodeMajor(version) {
  const match = String(version ?? '').match(/^v?(\d+)/)
  return match ? Number(match[1]) : 0
}

async function readOptional(targetPath, readFile) {
  try {
    return await readFile(targetPath, 'utf8')
  } catch (error) {
    if (error?.code === 'ENOENT') return null
    throw error
  }
}

export async function packageLockFingerprint(
  lockPath,
  { readFile = readFileDefault } = {}
) {
  const contents = await readFile(lockPath)
  return createHash('sha256').update(contents).digest('hex')
}

export async function detectSetup({
  platform,
  nodeVersion,
  commandSucceeds,
  fileExists,
  appRoot,
  lockPath,
  stampPath,
  electronRuntimePath,
  readFile
}) {
  const [npmAvailable, lockFingerprint, electronRuntimeAvailable] = await Promise.all([
    commandSucceeds('npm', ['--version']),
    packageLockFingerprint(lockPath, { readFile }),
    fileExists(electronRuntimePath)
  ])
  const installedFingerprint = await readOptional(stampPath, readFile)

  return Object.freeze({
    platformSupported: platform === 'darwin',
    nodeMajor: nodeMajor(nodeVersion),
    nodeCompatible: nodeMajor(nodeVersion) >= minimumNodeMajor,
    npmAvailable,
    electronRuntimeAvailable,
    electronRuntimePath,
    lockFingerprint,
    installedFingerprint: installedFingerprint?.trim() ?? null,
    lockMatches: installedFingerprint?.trim() === lockFingerprint,
    appRoot,
    lockPath,
    stampPath
  })
}

export function buildInstallPlan(report) {
  if (report.lockMatches && report.electronRuntimeAvailable) return []

  const actions = []
  if (!report.lockMatches) {
    actions.push({
      id: 'course-companion-packages',
      title: 'Course Companion files',
      reason: 'Installs the exact desktop-app dependencies recorded by the course.',
      scope: 'Stored only inside the course-companion folder',
      command: 'npm',
      args: ['ci'],
      cwd: report.appRoot
    })
  }

  actions.push({
    id: 'electron-runtime',
    title: 'Electron desktop runtime',
    reason: 'Verifies or downloads the pinned macOS runtime used to open the app.',
    scope: 'Stored only inside course-companion/node_modules',
    command: 'node',
    args: ['node_modules/electron/install.js'],
    cwd: report.appRoot,
    fingerprint: report.lockFingerprint,
    stampPath: report.stampPath
  })

  return actions
}

function displayCommand(action) {
  return [action.command, ...action.args].join(' ')
}

export function formatInstallPlan(actions) {
  const lines = ['Course Companion needs this local preparation plan:']

  for (const action of actions) {
    lines.push(
      '',
      `[${action.title ?? action.id}]`,
      `Why: ${action.reason}`,
      `Scope: ${action.scope}`,
      `Command: ${displayCommand(action)}`,
      `Directory: ${action.cwd}`
    )
  }

  return lines.join('\n')
}

export async function executeInstallPlan(
  actions,
  { confirm, run, writeFile }
) {
  if (actions.length === 0) return

  const approved = await confirm(formatInstallPlan(actions))
  if (!approved) {
    const error = new Error('Installation declined.')
    error.code = 'INSTALL_DECLINED'
    throw error
  }

  for (const action of actions) {
    let result
    try {
      result = await run(action.command, action.args, {
        cwd: action.cwd,
        stdio: 'inherit'
      })
    } catch {
      const error = new Error(`Installation action failed: ${action.id}`)
      error.code = 'INSTALL_FAILED'
      error.actionId = action.id
      throw error
    }

    if (result?.exitCode !== 0) {
      const error = new Error(`Installation action failed: ${action.id}`)
      error.code = 'INSTALL_FAILED'
      error.actionId = action.id
      throw error
    }

    if (action.stampPath && action.fingerprint) {
      await writeFile(action.stampPath, `${action.fingerprint}\n`, 'utf8')
    }
  }
}

export function startupNpmArgs({ smoke = false } = {}) {
  return smoke ? ['run', 'test:electron'] : ['start']
}
