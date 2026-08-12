import { mkdtemp, mkdir, realpath, rm, symlink } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PracticeWorkspaceResolver } from '../electron/main/practice-workspace-resolver'

const roots: string[] = []

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })))
})

describe('PracticeWorkspaceResolver', () => {
  it('resolves pilot-workspace below a canonical course root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'course-root-'))
    roots.push(root)
    const expected = join(root, 'pilot-workspace')
    await mkdir(expected)

    await expect(new PracticeWorkspaceResolver(root).resolve('pilot-workspace')).resolves.toBe(await realpath(expected))
  })

  it('rejects unknown workspace kinds and missing Pilot workspaces', async () => {
    const root = await mkdtemp(join(tmpdir(), 'course-root-'))
    roots.push(root)
    const resolver = new PracticeWorkspaceResolver(root)

    await expect(resolver.resolve('../other' as never)).rejects.toThrow('Unsupported Practice workspace kind')
    await expect(resolver.resolve('pilot-workspace')).rejects.toThrow()
  })

  it('rejects a pilot-workspace link that escapes the validated course root', async () => {
    const root = await mkdtemp(join(tmpdir(), 'course-root-'))
    const outside = await mkdtemp(join(tmpdir(), 'outside-workspace-'))
    roots.push(root, outside)
    await symlink(outside, join(root, 'pilot-workspace'), 'junction')

    await expect(new PracticeWorkspaceResolver(root).resolve('pilot-workspace'))
      .rejects.toThrow('escapes the validated course root')
  })
})
