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

const moduleOneStart: ProgressUpdate = {
  currentLessonId: 'module-1',
  checkpointId: 'm1-why-planning',
  sceneId: 'module-1-why-planning',
  completedCheckpointIds: ['intro-visual-onboarding'],
  decisions: { planningApproach: 'plan-first' }
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
    const resumed = await repository.save(moduleOneStart)

    expect(resumed.startedAt).toBe(started.startedAt)
    await expect(repository.load()).resolves.toEqual({ status: 'returning', progress: resumed })
    const activity = await readFile(join(directory, 'activity-log.jsonl'), 'utf8')
    expect(activity.trim().split('\n')).toHaveLength(2)
  })

  it('resumes an exact page inside the opening introduction', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    await repository.save(introStart)

    const overviewPageTwo = await repository.save({
      currentLessonId: 'intro',
      checkpointId: 'intro-visual-onboarding',
      sceneId: 'intro-course-overview-2',
      completedCheckpointIds: [],
      decisions: {}
    })

    await expect(repository.load()).resolves.toEqual({
      status: 'returning',
      progress: overviewPageTwo
    })
  })

  it('migrates schema-v2 Module 0 progress to the new Module 1 opening', async () => {
    const directory = await temporaryDirectory()
    const oldProgress = {
      schemaVersion: 2,
      courseVersion: '0.1.0',
      currentLessonId: 'intro',
      checkpointId: 'intro-time-budget',
      sceneId: 'intro-time-budget',
      completedCheckpointIds: ['intro-visual-onboarding', 'intro-first-safe-win'],
      decisions: { timeBudget: '30' },
      practice: { missionId: 'm1-verifiable-brief', status: 'idle' },
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
        schemaVersion: 3,
        currentLessonId: 'module-1',
        checkpointId: 'm1-why-planning',
        sceneId: 'module-1-why-planning',
        completedCheckpointIds: ['intro-visual-onboarding'],
        practice: { missionId: 'm1-planning-package', status: 'idle' }
      }
    })
    const migrated = JSON.parse(await readFile(join(directory, 'learner-state.json'), 'utf8'))
    expect(migrated.schemaVersion).toBe(3)
    expect(migrated.startedAt).toBe(oldProgress.startedAt)
  })

  it('serializes overlapping saves so atomic temporary files cannot collide', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    await repository.save(moduleOneStart)

    await Promise.all([
      repository.save({
        currentLessonId: 'module-1',
        checkpointId: 'm1-contentpilot-brief',
        sceneId: 'module-1-contentpilot-brief',
        completedCheckpointIds: ['intro-visual-onboarding', 'm1-why-planning'],
        decisions: { planningApproach: 'plan-first' }
      }),
      repository.save({
        currentLessonId: 'module-1',
        checkpointId: 'm1-prd-concept',
        sceneId: 'module-1-prd-concept',
        completedCheckpointIds: [
          'intro-visual-onboarding',
          'm1-why-planning',
          'm1-contentpilot-brief'
        ],
        decisions: {
          planningApproach: 'plan-first',
          clarificationFocus: 'product-requirements'
        }
      })
    ])

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: { sceneId: 'module-1-prd-concept' }
    })
  })

  it('recovers the last known-good state when the primary file is damaged', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const first = await repository.save(introStart)
    await repository.save({
      currentLessonId: 'intro',
      checkpointId: 'intro-visual-onboarding',
      sceneId: 'intro-course-overview-2',
      completedCheckpointIds: [],
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
