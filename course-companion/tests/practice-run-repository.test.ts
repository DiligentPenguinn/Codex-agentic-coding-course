import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import {
  defaultPracticeWorkspaceRecord,
  PracticeRunRepository,
  type PracticeWorkspaceRecord
} from '../electron/main/practice-run-repository'

const temporaryDirectories: string[] = []

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'course-companion-practice-runs-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

function activeRecord(): PracticeWorkspaceRecord {
  return {
    ...defaultPracticeWorkspaceRecord(),
    activeRun: {
      runId: 'run-1',
      generation: 1,
      status: 'active',
      binding: {
        runId: 'run-1',
        threadId: 'thread-1',
        name: 'Practice · Module 1',
        workspaceRoot: 'D:\\course',
        createdAt: '2026-08-08T00:00:00.000Z'
      },
      startedAt: '2026-08-08T00:00:00.000Z',
      updatedAt: '2026-08-08T00:00:00.000Z',
      checklist: [
        { id: 'review', title: 'Review objective', status: 'completed' },
        { id: 'open', title: 'Open Executor chat', status: 'current' }
      ]
    }
  }
}

describe('PracticeRunRepository', () => {
  it('starts with no active Practice and Teacher selected on both surfaces', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    await expect(repository.load()).resolves.toEqual(defaultPracticeWorkspaceRecord())
  })

  it('writes one validated active Practice atomically', async () => {
    const directory = await temporaryDirectory()
    const repository = new PracticeRunRepository(directory)
    const record = activeRecord()

    await expect(repository.save(record)).resolves.toEqual(record)
    await expect(repository.load()).resolves.toEqual(record)
    expect(JSON.parse(await readFile(join(directory, 'practice-runs.json'), 'utf8'))).toEqual(record)
  })

  it('quarantines invalid state instead of inventing an active Practice', async () => {
    const directory = await temporaryDirectory()
    await writeFile(join(directory, 'practice-runs.json'), '{"schemaVersion":1,"activeRun":{}}', 'utf8')
    const repository = new PracticeRunRepository(directory)

    await expect(repository.load()).resolves.toEqual(defaultPracticeWorkspaceRecord())
    await expect(readFile(join(directory, 'practice-runs.corrupt.json'), 'utf8')).resolves.toContain('activeRun')
  })

  it('rejects mismatched binding identity and more than one current checklist step', async () => {
    const repository = new PracticeRunRepository(await temporaryDirectory())
    const record = activeRecord()
    if (!record.activeRun) throw new Error('fixture missing active run')
    record.activeRun.binding.runId = 'another-run'
    record.activeRun.checklist.push({ id: 'second-current', title: 'Second', status: 'current' })

    await expect(repository.save(record)).rejects.toThrow('Invalid Practice workspace record')
  })
})
