import { execFile } from 'node:child_process'
import { mkdtemp, mkdir, rm, writeFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { GitWorkspaceEvidenceProvider } from '../electron/main/workspace-evidence-provider'

const run = promisify(execFile)
const directories: string[] = []

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })))
})

describe('GitWorkspaceEvidenceProvider', () => {
  it('attributes new and newly modified dirty files while excluding unchanged baseline dirt', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'workspace-evidence-'))
    directories.push(directory)
    await run('git', ['init'], { cwd: directory })
    await mkdir(join(directory, 'src'))
    await writeFile(join(directory, 'src', 'preexisting.css'), 'before\n', 'utf8')
    await writeFile(join(directory, 'src', 'unrelated.css'), 'unchanged\n', 'utf8')

    const provider = new GitWorkspaceEvidenceProvider()
    const baseline = await provider.capture(directory, '2026-08-09T00:00:00.000Z')
    expect(baseline.gitAvailable).toBe(true)

    await writeFile(join(directory, 'src', 'preexisting.css'), 'after\n', 'utf8')
    await writeFile(join(directory, 'src', 'practice.css'), 'new\n', 'utf8')
    const confirmed = await provider.reconcile(directory, baseline)

    expect(confirmed.changedSinceBaseline).toEqual(expect.arrayContaining(['src/preexisting.css', 'src/practice.css']))
    expect(confirmed.changedSinceBaseline).not.toContain('src/unrelated.css')
  })

  it('corroborates only explicitly reported dirty paths when a legacy run has no baseline', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'workspace-evidence-legacy-'))
    directories.push(directory)
    await run('git', ['init'], { cwd: directory })
    await mkdir(join(directory, 'app'))
    await writeFile(join(directory, 'app', 'globals.css'), 'changed\n', 'utf8')
    await writeFile(join(directory, 'unrelated.txt'), 'dirty\n', 'utf8')

    const confirmed = await new GitWorkspaceEvidenceProvider().reconcile(
      directory,
      null,
      ['app/globals.css', 'missing.css']
    )

    expect(confirmed).toEqual({ changedSinceBaseline: [], committedReportedFilesSinceRunStart: [], currentlyDirtyReportedFiles: ['app/globals.css'] })
  })

  it('corroborates a reported file committed after a legacy Practice began', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'workspace-evidence-legacy-commit-'))
    directories.push(directory)
    await run('git', ['init'], { cwd: directory })
    await run('git', ['config', 'user.email', 'test@example.com'], { cwd: directory })
    await run('git', ['config', 'user.name', 'Test User'], { cwd: directory })
    await writeFile(join(directory, 'tracked.txt'), 'committed\n', 'utf8')
    await run('git', ['add', 'tracked.txt'], { cwd: directory })
    await run('git', ['commit', '-m', 'practice result'], { cwd: directory })

    const result = await new GitWorkspaceEvidenceProvider().reconcile(
      directory,
      null,
      ['tracked.txt'],
      '2000-01-01T00:00:00.000Z'
    )

    expect(result).toEqual({
      changedSinceBaseline: [],
      committedReportedFilesSinceRunStart: ['tracked.txt'],
      currentlyDirtyReportedFiles: []
    })
  })

  it('detects a file changed and committed after the Practice baseline', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'workspace-evidence-commit-'))
    directories.push(directory)
    await run('git', ['init'], { cwd: directory })
    await run('git', ['config', 'user.email', 'test@example.com'], { cwd: directory })
    await run('git', ['config', 'user.name', 'Test User'], { cwd: directory })
    await writeFile(join(directory, 'tracked.txt'), 'before\n', 'utf8')
    await run('git', ['add', 'tracked.txt'], { cwd: directory })
    await run('git', ['commit', '-m', 'baseline'], { cwd: directory })

    const provider = new GitWorkspaceEvidenceProvider()
    const baseline = await provider.capture(directory, '2026-08-09T00:00:00.000Z')
    expect(baseline.head).toMatch(/^[0-9a-f]{40}$/)

    await writeFile(join(directory, 'tracked.txt'), 'after\n', 'utf8')
    await run('git', ['add', 'tracked.txt'], { cwd: directory })
    await run('git', ['commit', '-m', 'practice change'], { cwd: directory })

    const result = await provider.reconcile(directory, baseline, ['tracked.txt'])
    expect(result.changedSinceBaseline).toContain('tracked.txt')
  })

  it('removes workspace confirmation when a file returns to its baseline content', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'workspace-evidence-revert-'))
    directories.push(directory)
    await run('git', ['init'], { cwd: directory })
    await run('git', ['config', 'user.email', 'test@example.com'], { cwd: directory })
    await run('git', ['config', 'user.name', 'Test User'], { cwd: directory })
    await writeFile(join(directory, 'tracked.txt'), 'before\n', 'utf8')
    await run('git', ['add', 'tracked.txt'], { cwd: directory })
    await run('git', ['commit', '-m', 'baseline'], { cwd: directory })

    const provider = new GitWorkspaceEvidenceProvider()
    const baseline = await provider.capture(directory, '2026-08-09T00:00:00.000Z')
    await writeFile(join(directory, 'tracked.txt'), 'after\n', 'utf8')
    expect((await provider.reconcile(directory, baseline, ['tracked.txt'])).changedSinceBaseline).toContain('tracked.txt')

    await writeFile(join(directory, 'tracked.txt'), 'before\n', 'utf8')
    expect((await provider.reconcile(directory, baseline, ['tracked.txt'])).changedSinceBaseline).not.toContain('tracked.txt')
  })})
