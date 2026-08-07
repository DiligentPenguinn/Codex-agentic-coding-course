import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { test } from 'node:test'

import {
  buildInstallPlan,
  detectSetup,
  executeInstallPlan,
  formatInstallPlan,
  nodeMajor,
  startupNpmArgs
} from '../../scripts/macos-course-startup-core.mjs'

const lockContents = '{"lockfileVersion":3}'
const lockFingerprint = createHash('sha256').update(lockContents).digest('hex')

function setupDependencies(overrides = {}) {
  return {
    platform: 'darwin',
    nodeVersion: 'v22.20.0',
    commandSucceeds: async () => true,
    fileExists: async () => true,
    appRoot: '/course/course-companion',
    lockPath: '/course/course-companion/package-lock.json',
    stampPath: '/course/course-companion/node_modules/.course-lock.sha256',
    electronRuntimePath:
      '/course/course-companion/node_modules/electron/dist/Electron.app/Contents/MacOS/Electron',
    readFile: async (targetPath) =>
      targetPath.endsWith('.course-lock.sha256') ? lockFingerprint : lockContents,
    ...overrides
  }
}

test('recognizes supported and unsupported Node.js versions', () => {
  assert.equal(nodeMajor('v22.20.0'), 22)
  assert.equal(nodeMajor('21.7.3'), 21)
  assert.equal(nodeMajor('invalid'), 0)
})

test('reports a ready macOS installation when the lock stamp and runtime match', async () => {
  const report = await detectSetup(setupDependencies())

  assert.equal(report.platformSupported, true)
  assert.equal(report.nodeCompatible, true)
  assert.equal(report.npmAvailable, true)
  assert.equal(report.lockMatches, true)
  assert.equal(report.electronRuntimeAvailable, true)
  assert.deepEqual(buildInstallPlan(report), [])
})

test('rejects non-macOS and old-Node environments', async () => {
  const report = await detectSetup(
    setupDependencies({ platform: 'win32', nodeVersion: 'v20.19.0' })
  )

  assert.equal(report.platformSupported, false)
  assert.equal(report.nodeCompatible, false)
})

test('proposes one permission-gated local plan when dependencies are not stamped', async () => {
  const missingStamp = Object.assign(new Error('missing'), { code: 'ENOENT' })
  const report = await detectSetup(
    setupDependencies({
      fileExists: async () => false,
      readFile: async (targetPath) => {
        if (targetPath.endsWith('.course-lock.sha256')) throw missingStamp
        return lockContents
      }
    })
  )
  const plan = buildInstallPlan(report)

  assert.equal(plan.length, 2)
  assert.equal(plan[0].command, 'npm')
  assert.deepEqual(plan[0].args, ['ci'])
  assert.equal(plan[0].cwd, '/course/course-companion')
  assert.equal(plan[1].command, 'node')
  assert.deepEqual(plan[1].args, ['node_modules/electron/install.js'])
  assert.match(formatInstallPlan(plan), /Command: npm ci/u)
  assert.match(formatInstallPlan(plan), /Command: node node_modules\/electron\/install\.js/u)
  assert.match(formatInstallPlan(plan), /Stored only inside the course-companion folder/u)
})

test('repairs only the Electron runtime when the stamped packages still match', async () => {
  const report = await detectSetup(setupDependencies({ fileExists: async () => false }))
  const plan = buildInstallPlan(report)

  assert.equal(plan.length, 1)
  assert.equal(plan[0].id, 'electron-runtime')
})

test('does not run the preparation plan after permission is declined', async () => {
  let ran = false

  await assert.rejects(
    executeInstallPlan(
      [
        {
          id: 'course-companion-packages',
          command: 'npm',
          args: ['ci'],
          cwd: '/course/course-companion',
          stampPath: '/course/stamp',
          fingerprint: lockFingerprint
        }
      ],
      {
        confirm: async () => false,
        run: async () => {
          ran = true
          return { exitCode: 0 }
        },
        writeFile: async () => undefined
      }
    ),
    { code: 'INSTALL_DECLINED' }
  )
  assert.equal(ran, false)
})

test('writes the lock stamp only after the final preparation action succeeds', async () => {
  const writes = []
  await executeInstallPlan(
    [
      {
        id: 'electron-runtime',
        command: 'node',
        args: ['node_modules/electron/install.js'],
        cwd: '/course/course-companion',
        stampPath: '/course/stamp',
        fingerprint: lockFingerprint
      }
    ],
    {
      confirm: async () => true,
      run: async () => ({ exitCode: 0 }),
      writeFile: async (...args) => writes.push(args)
    }
  )

  assert.deepEqual(writes, [['/course/stamp', `${lockFingerprint}\n`, 'utf8']])
})

test('uses the real app command normally and the full Electron test for rehearsals', () => {
  assert.deepEqual(startupNpmArgs(), ['start'])
  assert.deepEqual(startupNpmArgs({ smoke: true }), ['run', 'test:electron'])
})
