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
  currentCourseLessonId: 'intro-overview',
  checkpointId: 'intro-visual-onboarding',
  sceneId: 'intro-visual-onboarding',
  sceneHistory: [],
  completedCheckpointIds: [],
  decisions: {}
}

const moduleOneStart: ProgressUpdate = {
  currentLessonId: 'module-1',
  currentCourseLessonId: 'm1-understand-codex',
  checkpointId: 'm1-codex-orientation',
  sceneId: 'module-1-codex-orientation',
  sceneHistory: ['intro-visual-onboarding'],
  completedCheckpointIds: ['intro-visual-onboarding'],
  decisions: {}
}

const moduleTwoStart: ProgressUpdate = {
  currentLessonId: 'module-2',
  currentCourseLessonId: 'm2-when-to-plan',
  checkpointId: 'm2-why-planning',
  sceneId: 'module-2-why-planning',
  sceneHistory: ['intro-visual-onboarding'],
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

  it('moves retired Harness progress to the configuration lesson', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save(moduleOneStart)
    const retiredProgress = {
      ...started,
      currentCourseLessonId: 'm1-agents-guidance',
      checkpointId: 'm1-agents-guidance',
      sceneId: 'module-1-harness-codex',
      sceneHistory: [
        ...started.sceneHistory,
        'module-1-agents-guidance',
        'module-1-harness-intro'
      ],
      completedCheckpointIds: [
        ...started.completedCheckpointIds,
        'm1-agents-guidance',
        'm1-skills'
      ]
    }
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify(retiredProgress, null, 2)}\n`,
      'utf8'
    )

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        currentCourseLessonId: 'm1-skills-and-checklist',
        checkpointId: 'm1-model-choice',
        sceneId: 'module-1-model-choice',
        sceneHistory: ['intro-visual-onboarding'],
        completedCheckpointIds: ['intro-visual-onboarding']
      }
    })
    const migrated = JSON.parse(await readFile(join(directory, 'learner-state.json'), 'utf8'))
    expect(JSON.stringify(migrated)).not.toContain('harness')
    expect(JSON.stringify(migrated)).not.toContain('m1-agents-guidance')
  })

  it('moves progress paused on the retired fifth Module 1 question to the summary', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save(moduleOneStart)
    const retiredProgress = {
      ...started,
      currentCourseLessonId: 'm1-assessment',
      checkpointId: 'm1-mastery',
      sceneId: 'module-1-final-5',
      sceneHistory: [
        ...started.sceneHistory,
        'module-1-final-4',
        'module-1-final-5'
      ],
      decisions: {
        ...started.decisions,
        'assessment:m1-q1': 'correct:0',
        'assessment:m1-q2': 'correct:0',
        'assessment:m1-q3': 'correct:0',
        'assessment:m1-q4': 'correct:self-review:Câu trả lời của người học.'
      }
    }
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify(retiredProgress, null, 2)}\n`,
      'utf8'
    )

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        currentCourseLessonId: 'm1-assessment',
        checkpointId: 'm1-mastery',
        sceneId: 'module-1-final-summary',
        sceneHistory: ['intro-visual-onboarding', 'module-1-final-4']
      }
    })
  })

  it('moves progress paused on the retired PRD anatomy page to the next page', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const started = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-portfolio-brief',
      checkpointId: 'm2-portfolio-brief',
      sceneId: 'module-2-prd-introduction',
      sceneHistory: ['module-2-portfolio-workspace'],
      completedCheckpointIds: [],
      decisions: {}
    })
    const retiredProgress = {
      ...started,
      sceneId: 'module-2-prd-anatomy',
      sceneHistory: [
        ...started.sceneHistory,
        'module-2-prd-introduction',
        'module-2-prd-anatomy'
      ]
    }
    await writeFile(
      join(directory, 'learner-state.json'),
      `${JSON.stringify(retiredProgress, null, 2)}\n`,
      'utf8'
    )

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: {
        currentCourseLessonId: 'm2-portfolio-brief',
        checkpointId: 'm2-portfolio-brief',
        sceneId: 'module-2-prd-agent-workflow',
        sceneHistory: ['module-2-portfolio-workspace', 'module-2-prd-introduction']
      }
    })
    const migrated = JSON.parse(await readFile(join(directory, 'learner-state.json'), 'utf8'))
    expect(JSON.stringify(migrated)).not.toContain('module-2-prd-anatomy')
  })

  it('resumes an exact page inside the opening introduction', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    await repository.save(introStart)

    const overviewPageTwo = await repository.save({
      currentLessonId: 'intro',
      currentCourseLessonId: 'intro-overview',
      checkpointId: 'intro-visual-onboarding',
      sceneId: 'intro-course-overview-2',
      sceneHistory: ['intro-visual-onboarding'],
      completedCheckpointIds: [],
      decisions: {}
    })

    await expect(repository.load()).resolves.toEqual({
      status: 'returning',
      progress: overviewPageTwo
    })
  })

  it('resumes a source-backed teaching example inside a Module 2 checkpoint', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    const promptExample = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-prd-prompt',
      checkpointId: 'm2-prd-interview',
      sceneId: 'module-2-prompt-example',
      sceneHistory: [
        'module-2-why-planning',
        'module-2-contentpilot-brief',
        'module-2-prd-concept',
        'module-2-prd-interview'
      ],
      completedCheckpointIds: [
        'intro-visual-onboarding',
        'm2-why-planning',
        'm2-contentpilot-brief',
        'm2-prd-concept'
      ],
      decisions: {
        planningApproach: 'plan-first',
        clarificationFocus: 'product-requirements',
        prdClassification: 'scope-in-prd'
      }
    })

    await expect(repository.load()).resolves.toEqual({
      status: 'returning',
      progress: promptExample
    })
  })

  it('resumes the exact sourced assessment question and its saved result', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    const promptQuestion = await repository.save({
      currentLessonId: 'module-2',
      currentCourseLessonId: 'm2-prd-prompt',
      checkpointId: 'm2-prd-interview',
      sceneId: 'module-2-check-prompt-2',
      sceneHistory: ['module-2-prd-interview', 'module-2-check-prompt-1'],
      completedCheckpointIds: [
        'intro-visual-onboarding',
        'm2-why-planning',
        'm2-contentpilot-brief',
        'm2-prd-concept'
      ],
      decisions: {
        'assessment:planning-prd-1': 'correct:1',
        'assessment:planning-prd-2': 'correct:0',
        'assessment:planning-prd-3': 'correct:0',
        'assessment:prompt-1': 'correct:1'
      }
    })

    await expect(repository.load()).resolves.toEqual({
      status: 'returning',
      progress: promptQuestion
    })
  })

  it.each([
    { schemaVersion: 5, courseVersion: '0.2.0' },
    { schemaVersion: 2, courseVersion: '0.1.0' }
  ])(
    'silently starts a new run for obsolete state $courseVersion/schema-$schemaVersion',
    async ({ schemaVersion, courseVersion }) => {
      const directory = await temporaryDirectory()
      const oldProgress = {
        schemaVersion,
        courseVersion,
        currentLessonId: 'module-2',
        currentCourseLessonId: 'm2-assessment',
        checkpointId: 'm2-complete',
        sceneId: 'module-2-complete',
        sceneHistory: ['module-2-mastery'],
        completedCheckpointIds: ['m2-mastery'],
        decisions: { masteryEvidence: 'old-contentpilot-evidence' },
        practice: { missionId: 'm2-planning-package', status: 'completed' },
        practiceCompletions: [{ practiceId: 'm2-planning-package' }],
        courseRunId: 'old-course-run',
        startedAt: '2026-08-06T10:00:00.000Z',
        updatedAt: '2026-08-06T10:05:00.000Z'
      }
      const serialized = `${JSON.stringify(oldProgress, null, 2)}\n`
      await Promise.all([
        writeFile(join(directory, 'learner-state.json'), serialized, 'utf8'),
        writeFile(join(directory, 'learner-state.backup.json'), serialized, 'utf8')
      ])

      const repository = new ProgressRepository(directory)
      await expect(repository.load()).resolves.toEqual({ status: 'new' })
      await expect(readFile(join(directory, 'learner-state.json'), 'utf8')).resolves.toBe(serialized)
      await expect(readFile(join(directory, 'learner-state.backup.json'), 'utf8')).resolves.toBe(serialized)
      await expect(readFile(join(directory, 'activity-log.jsonl'), 'utf8')).rejects.toMatchObject({
        code: 'ENOENT'
      })
    }
  )

  it('serializes overlapping saves so atomic temporary files cannot collide', async () => {
    const repository = new ProgressRepository(await temporaryDirectory())
    await repository.save(moduleTwoStart)

    await Promise.all([
      repository.save({
        currentLessonId: 'module-2',
        currentCourseLessonId: 'm2-when-to-plan',
        checkpointId: 'm2-contentpilot-brief',
        sceneId: 'module-2-contentpilot-brief',
        sceneHistory: ['module-2-why-planning'],
        completedCheckpointIds: ['intro-visual-onboarding', 'm2-why-planning'],
        decisions: { planningApproach: 'plan-first' }
      }),
      repository.save({
        currentLessonId: 'module-2',
        currentCourseLessonId: 'm2-product-requirements',
        checkpointId: 'm2-prd-concept',
        sceneId: 'module-2-prd-concept',
        sceneHistory: ['module-2-why-planning', 'module-2-contentpilot-brief'],
        completedCheckpointIds: [
          'intro-visual-onboarding',
          'm2-why-planning',
          'm2-contentpilot-brief'
        ],
        decisions: {
          planningApproach: 'plan-first',
          clarificationFocus: 'product-requirements'
        }
      })
    ])

    await expect(repository.load()).resolves.toMatchObject({
      status: 'returning',
      progress: { sceneId: 'module-2-prd-concept' }
    })
  })

  it('recovers the last known-good state when the primary file is damaged', async () => {
    const directory = await temporaryDirectory()
    const repository = new ProgressRepository(directory)
    const first = await repository.save(introStart)
    await repository.save({
      currentLessonId: 'intro',
      currentCourseLessonId: 'intro-overview',
      checkpointId: 'intro-visual-onboarding',
      sceneId: 'intro-course-overview-2',
      sceneHistory: ['intro-visual-onboarding'],
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
