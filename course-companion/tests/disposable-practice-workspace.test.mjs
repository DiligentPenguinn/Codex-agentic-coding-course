import assert from 'node:assert/strict'
import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import test from 'node:test'
import {
  createDisposablePracticeWorkspace,
  fingerprintTree
} from './support/disposable-practice-workspace.mjs'

const exec = promisify(execFile)

test('developer Practice workspace is isolated, clean, excluded, unique, and removable', async () => {
  const repository = await mkdtemp(join(tmpdir(), 'course-companion-source-'))
  const starter = join(repository, 'pilot-workspace', 'contentpilot')
  await mkdir(join(starter, 'app'), { recursive: true })
  await mkdir(join(starter, 'node_modules', 'ignored'), { recursive: true })
  await writeFile(join(starter, 'app', 'globals.css'), 'body { color: black; }\n')
  await writeFile(join(starter, '.env'), 'TOKEN=secret\n')
  await writeFile(join(starter, 'node_modules', 'ignored', 'index.js'), 'ignored\n')
  const before = await fingerprintTree(starter)

  const first = await createDisposablePracticeWorkspace({ repositoryRoot: repository })
  const second = await createDisposablePracticeWorkspace({ repositoryRoot: repository })
  try {
    assert.notEqual(first.root, second.root)
    assert.equal(first.workspaceRoot, join(first.root, 'pilot-workspace'))
    assert.equal(first.starterRoot, join(first.workspaceRoot, 'contentpilot'))
    assert.equal(await readFile(join(first.starterRoot, 'app', 'globals.css'), 'utf8'), 'body { color: black; }\n')
    await assert.rejects(stat(join(first.starterRoot, '.env')))
    await assert.rejects(stat(join(first.starterRoot, 'node_modules')))
    const { stdout } = await exec('git', ['status', '--porcelain'], { cwd: first.root, windowsHide: true })
    assert.equal(stdout, '')
    await writeFile(join(first.starterRoot, 'app', 'globals.css'), 'body { color: blue; }\n')
    assert.equal(await fingerprintTree(starter), before)
  } finally {
    await first.cleanup()
    await first.cleanup()
    await second.cleanup()
    await rm(repository, { recursive: true, force: true })
  }
  await assert.rejects(stat(first.root))
  await assert.rejects(stat(second.root))
})
