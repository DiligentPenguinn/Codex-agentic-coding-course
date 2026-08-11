import { createHash } from 'node:crypto'
import {
  mkdir,
  mkdtemp,
  rm,
  symlink,
  writeFile
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  MAX_PLANNING_ARTIFACT_BYTES,
  PlanningArtifactRepository
} from '../electron/main/planning-artifact-repository'

const directories: string[] = []
const observedAt = '2026-08-11T00:00:00.000Z'

async function workspace(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'planning-artifact-'))
  directories.push(directory)
  await mkdir(join(directory, 'artifacts'))
  return directory
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

describe('PlanningArtifactRepository', () => {
  it('reads bounded UTF-8, redacts credentials, and keeps the raw digest stable', async () => {
    const directory = await workspace()
    const content = '# PRD\n\nAPI_KEY=private-value\nA useful requirement.\n'
    await writeFile(join(directory, 'artifacts', 'PRD.md'), content, 'utf8')
    const repository = new PlanningArtifactRepository()

    const first = await repository.inspect(directory, 'artifacts/PRD.md', observedAt)
    expect(first.status).toBe('ready')
    if (first.status !== 'ready') return
    expect(first.artifact.content).toContain('API_KEY=[REDACTED]')
    expect(first.artifact.content).not.toContain('private-value')
    expect(first.artifact.digest).toBe(
      createHash('sha256').update(Buffer.from(content)).digest('hex')
    )

    await writeFile(join(directory, 'artifacts', 'PRD.md'), content, 'utf8')
    const second = await repository.inspect(directory, 'artifacts/PRD.md', observedAt)
    expect(second.status).toBe('ready')
    if (second.status === 'ready') {
      expect(second.artifact.digest).toBe(first.artifact.digest)
      expect(second.artifact.path).toBe('artifacts/PRD.md')
    }
  })

  it.each([
    ['missing', async () => undefined, 'missing'],
    ['empty', async (directory: string) => {
      await writeFile(join(directory, 'artifacts', 'PRD.md'), '  \n', 'utf8')
    }, 'empty'],
    ['oversized', async (directory: string) => {
      await writeFile(
        join(directory, 'artifacts', 'PRD.md'),
        Buffer.alloc(MAX_PLANNING_ARTIFACT_BYTES + 1, 65)
      )
    }, 'oversized'],
    ['directory', async (directory: string) => {
      await mkdir(join(directory, 'artifacts', 'PRD.md'))
    }, 'directory'],
    ['invalid UTF-8', async (directory: string) => {
      await writeFile(join(directory, 'artifacts', 'PRD.md'), Buffer.from([0xc3, 0x28]))
    }, 'invalid-utf8'],
    ['case-substitute', async (directory: string) => {
      await writeFile(join(directory, 'artifacts', 'prd.md'), '# Substitute\n', 'utf8')
    }, 'missing']
  ])('rejects a %s artifact', async (_label, arrange, code) => {
    const directory = await workspace()
    await arrange(directory)
    const result = await new PlanningArtifactRepository().inspect(
      directory,
      'artifacts/PRD.md',
      observedAt
    )
    expect(result).toMatchObject({ status: 'rejected', issue: { code } })
  })

  it.skipIf(process.platform === 'win32')('rejects artifact-file symlinks', async () => {
    const directory = await workspace()
    const target = join(directory, 'target.md')
    await writeFile(target, '# Outside artifact slot\n', 'utf8')
    await symlink(target, join(directory, 'artifacts', 'PRD.md'), 'file')
    await expect(new PlanningArtifactRepository().inspect(
      directory,
      'artifacts/PRD.md',
      observedAt
    )).resolves.toMatchObject({ status: 'rejected', issue: { code: 'symlink' } })
  })

  it('rejects artifact-directory symlinks', async () => {
    const directory = await workspace()
    await rm(join(directory, 'artifacts'), { recursive: true, force: true })
    const outside = await mkdtemp(join(tmpdir(), 'planning-artifact-outside-'))
    directories.push(outside)
    await writeFile(join(outside, 'PRD.md'), '# Escaping\n', 'utf8')
    await symlink(outside, join(directory, 'artifacts'), 'junction')
    await expect(new PlanningArtifactRepository().inspect(
      directory,
      'artifacts/PRD.md',
      observedAt
    )).resolves.toMatchObject({ status: 'rejected', issue: { code: 'symlink' } })
  })

  it('rejects unsupported substitute paths before filesystem access', async () => {
    const directory = await workspace()
    await expect(new PlanningArtifactRepository().inspect(
      directory,
      '../PRD.md',
      observedAt
    )).rejects.toThrow('Unsupported planning artifact path')
  })
})
