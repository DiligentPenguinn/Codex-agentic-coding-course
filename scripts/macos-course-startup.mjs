import { spawn } from 'node:child_process'
import { access, mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import readline from 'node:readline/promises'
import { fileURLToPath, pathToFileURL } from 'node:url'

import {
  buildInstallPlan,
  detectSetup,
  executeInstallPlan,
  minimumNodeMajor,
  startupNpmArgs
} from './macos-course-startup-core.mjs'

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const appRoot = path.join(repositoryRoot, 'course-companion')

function runProcess(command, args, { cwd, stdio = 'ignore', env } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: env ?? process.env,
      shell: false,
      stdio
    })
    child.once('error', reject)
    child.once('exit', (exitCode) => resolve({ exitCode: exitCode ?? 1 }))
  })
}

async function commandSucceeds(command, args) {
  try {
    const result = await runProcess(command, args)
    return result.exitCode === 0
  } catch {
    return false
  }
}

async function fileExists(targetPath) {
  try {
    await access(targetPath)
    return true
  } catch {
    return false
  }
}

async function confirmInstall(formattedPlan) {
  const terminal = readline.createInterface({ input: process.stdin, output: process.stdout })
  try {
    process.stdout.write(`${formattedPlan}\n\n`)
    const answer = await terminal.question('Run this exact preparation plan? [y/N] ')
    return /^(y|yes)$/i.test(answer.trim())
  } finally {
    terminal.close()
  }
}

function printWelcome() {
  process.stdout.write(
    [
      '',
      'CONTENT BUILDER ACADEMY',
      'Preparing your Course Companion on macOS.',
      '',
      'Nothing will be installed without your approval.',
      ''
    ].join('\n')
  )
}

export async function main({ smoke = process.argv.includes('--smoke') } = {}) {
  printWelcome()

  const lockPath = path.join(appRoot, 'package-lock.json')
  const stampPath = path.join(appRoot, 'node_modules', '.course-lock.sha256')
  const electronRuntimePath = path.join(
    appRoot,
    'node_modules',
    'electron',
    'dist',
    'Electron.app',
    'Contents',
    'MacOS',
    'Electron'
  )

  const setupDependencies = {
    platform: process.platform,
    nodeVersion: process.versions.node,
    commandSucceeds,
    fileExists,
    appRoot,
    lockPath,
    stampPath,
    electronRuntimePath,
    readFile
  }
  const report = await detectSetup(setupDependencies)

  if (!report.platformSupported) {
    throw Object.assign(new Error('This launcher supports macOS only.'), {
      code: 'UNSUPPORTED_PLATFORM',
      layer: 'macOS compatibility'
    })
  }
  if (!report.nodeCompatible) {
    throw Object.assign(new Error(`Node.js ${minimumNodeMajor}+ is required.`), {
      code: 'PREREQUISITE_MISSING',
      layer: 'Node.js prerequisite'
    })
  }
  if (!report.npmAvailable) {
    throw Object.assign(new Error('npm is required.'), {
      code: 'PREREQUISITE_MISSING',
      layer: 'npm prerequisite'
    })
  }

  process.stdout.write(`Found Node.js ${process.versions.node} and npm.\n`)
  const plan = buildInstallPlan(report)
  if (plan.length > 0) {
    await executeInstallPlan(plan, {
      confirm: confirmInstall,
      run: runProcess,
      writeFile: async (targetPath, contents, encoding) => {
        await mkdir(path.dirname(targetPath), { recursive: true })
        await writeFile(targetPath, contents, encoding)
      }
    })
    const finalReport = await detectSetup(setupDependencies)
    if (!finalReport.lockMatches || !finalReport.electronRuntimeAvailable) {
      throw Object.assign(new Error('The Electron runtime is still incomplete.'), {
        code: 'INSTALL_FAILED',
        actionId: 'electron-runtime'
      })
    }
  } else {
    process.stdout.write('Course Companion dependencies already match the lockfile.\n')
  }

  process.stdout.write(
    smoke
      ? 'Running the complete Electron startup rehearsal...\n\n'
      : 'Everything is ready. Opening Course Companion...\n\n'
  )
  const result = await runProcess('npm', startupNpmArgs({ smoke }), {
    cwd: appRoot,
    stdio: 'inherit'
  })
  if (result.exitCode !== 0) {
    throw Object.assign(new Error('Course Companion exited unexpectedly.'), {
      code: 'APP_FAILED',
      layer: smoke ? 'Electron rehearsal' : 'Course Companion'
    })
  }

  process.stdout.write(
    smoke
      ? '\nThe macOS startup rehearsal passed.\n'
      : '\nCourse Companion closed. Your local progress is saved.\n'
  )
}

function safeFailure(error) {
  if (error?.code === 'INSTALL_DECLINED') {
    return {
      exitCode: 2,
      layer: 'course files',
      recovery: 'Run start-course.command again when you are ready to approve the displayed plan.'
    }
  }
  if (error?.code === 'INSTALL_FAILED') {
    return {
      exitCode: 4,
      layer: 'course files',
      recovery: 'Check the npm error above, then run start-course.command again.'
    }
  }
  if (error?.code === 'APP_FAILED') {
    return {
      exitCode: 5,
      layer: error.layer,
      recovery: 'Check the app error above, then run start-course.command again.'
    }
  }
  return {
    exitCode: 3,
    layer: error?.layer ?? 'prerequisite',
    recovery: `Install Node.js ${minimumNodeMajor}+ with npm, then run start-course.command again.`
  }
}

const isDirect =
  process.argv[1] && pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url

if (isDirect) {
  main().catch((error) => {
    const failure = safeFailure(error)
    process.stderr.write(
      `\nStartup failed in ${failure.layer}.\n${error.message}\nRecovery: ${failure.recovery}\n`
    )
    process.exitCode = failure.exitCode
  })
}
