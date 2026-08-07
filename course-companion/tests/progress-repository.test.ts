import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { ProgressRepository } from '../electron/main/progress-repository'
import type { ProgressUpdate } from '../shared/contracts'

const temporaryDirectories: string[] = []

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'course-companion-progress-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

const introStart: ProgressUpdate = {
  currentLessonId: 'intro',
  checkpointId: 'intro-visual-onboarding',
  sceneId: 'intro-visual-onboarding',
  completedCheckpointIds: [],
  decisions: {}
}

describe('ProgressRepository', () => {
  it('reports a new journey when no local state exists', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    await expect(repository.load()).resolves.toEqual({ status: 'new' })
  })

  it('saves an exact checkpoint and preserves the original start time', async () => {
    const directory = await temporaryDirectory()
    const timestamps = [
      new Date('2026-08-06T10:00:00.000Z'),
      new Date('2026-08-06T10:00:01.000Z'),
      new Date('2026-08-06T10:05:00.000Z'),
      new Date('2026-08-06T10:05:01.000Z')
    ]
    const repository = new ProgressRepository(directory, () => timestamps.shift() ?? new Date())

    const started = await repository.save(introStart)
    const resumed = await repository.save({
      currentLessonId: 'intro',
      checkpointId: 'intro-first-safe-win',
      sceneId: 'intro-first-safe-win',
      completedCheckpointIds: ['intro-visual-onboarding'],
      decisions: { firstEvidence: 'project-and-scope' }
    })

    expect(resumed.startedAt).toBe(started.startedAt)
    await expect(repository.load()).resolves.toEqual({ status: 'returning', progress: resumed })
    const activity = await readFile(join(directory, 'activity-log.jsonl'), 'utf8')
    expect(activity.trim().split('\n')).toHaveLength(2)
  })

  it('migrates a schema-v1 save to schema v2 without losing journey progress', async () => {
    const directory = await temporaryDirectory()
    const oldProgress = {
      ...introStart,
      schemaVersion: 1,
      courseVersion: '0.1.0',
      startedAt: '2026-08-06T10:00:00.000Z',
      updatedAt: '2026-08-06T10:05:00.000Z'
    }
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify(oldProgress, null, 2)}\n`,
      'utf8'
    )

    const repository = new ProgressRepository(directory)
    const result = await repository.load()

    expect(result).toMatchObject({
      status: 'returning',
      progress: {
        schemaVersion: 2,
        sceneId: 'intro-visual-onboarding',
        practice: { missionId: 'm1-verifiable-brief', status: 'idle' }
      }
    })
    const migrated = JSON.parse(await readFile(join(directory, 'learner-state.json'), 'utf8'))
    expect(migrated.schemaVersion).toBe(2)
    expect(migrated.startedAt).toBe(oldProgress.startedAt)
  })

  it('serializes overlapping saves so atomic temporary files cannot collide', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    await repository.save(introStart)

    await Promise.all([
      repository.save({
        currentLessonId: 'intro',
        checkpointId: 'intro-first-safe-win',
        sceneId: 'intro-first-safe-win',
        completedCheckpointIds: ['intro-visual-onboarding'],
        decisions: {}
      }),
      repository.save({
        currentLessonId: 'intro',
        checkpointId: 'intro-time-budget',
        sceneId: 'intro-time-budget',
        completedCheckpointIds: ['intro-visual-onboarding', 'intro-first-safe-win'],
        decisions: { timeBudget: '30' }
      })
    ])

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: { sceneId: 'intro-time-budget' }
    })
  })

  it('recovers the last known-good state when the primary file is damaged', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const first = await repository.save(introStart)
    await repository.save({
      currentLessonId: 'intro',
      checkpointId: 'intro-first-safe-win',
      sceneId: 'intro-first-safe-win',
      completedCheckpointIds: ['intro-visual-onboarding'],
      decisions: {}
    })
    await writeFile(join(directory, 'learner-state.json'), '{damaged', 'utf8')

    await expect(repository.load()).resolves.toEqual({ status: 'recovered', progress: first })
    expect(JSON.parse(await readFile(join(directory, 'learner-state.json'), 'utf8'))).toEqual(first)
  })

  it('requires reset when neither the primary nor backup state is valid', async () => {
    const directory = await temporaryDirectory()
    await writeFile(join(directory, 'learner-state.json'), '{}', 'utf8')
    await writeFile(join(directory, 'learner-state.backup.json'), '[]', 'utf8')
    const repository = new ProgressRepository(directory)

    await expect(repository.load()).resolves.toMatchObject({ status: 'reset-required' })
  })

  it('removes journey and activity data on reset', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    await repository.save(introStart)
    await repository.reset()
    await expect(repository.load()).resolves.toEqual({ status: 'new' })
  })
})
