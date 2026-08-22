import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PracticeGuideStateRepository } from '../electron/main/practice-guide-state-repository'

const directories: string[] = []
const identity = {
  guideId: 'm1-practice-mode-first-run', guideVersion: '1.0.0',
  courseRunId: 'course-1', practiceId: 'm1-codex-safe-setup', practiceRunId: 'run-1'
}

afterEach(async () => Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))))

async function createRepository() {
  const directory = await mkdtemp(join(tmpdir(), 'practice-guide-state-'))
  directories.push(directory)
  return { directory, repository: new PracticeGuideStateRepository(directory, () => new Date('2026-08-17T00:00:00.000Z')) }
}

describe('PracticeGuideStateRepository', () => {
  it('persists isolated idempotent transitions', async () => {
    const { repository } = await createRepository()
    const started = await repository.start(identity, 'practice-introduction')
    expect(started.status).toBe('in-progress')
    const advanced = await repository.advance(identity, 'practice-introduction', 'executor-orientation')
    expect(advanced.lastStageId).toBe('executor-orientation')
    expect(await repository.advance(identity, 'practice-introduction', 'executor-orientation')).toEqual(advanced)
    expect((await repository.pause(identity, 'executor-orientation')).status).toBe('paused')
    expect((await repository.skip(identity, 'executor-orientation')).status).toBe('skipped')
  })

  it('rejects events from a replaced Practice run', async () => {
    const { repository } = await createRepository()
    await repository.start(identity, 'practice-introduction')
    await expect(repository.advance({ ...identity, practiceRunId: 'run-2' }, 'practice-introduction', 'executor-orientation'))
      .rejects.toThrow('identity')
  })

  it('completes and dismisses mastery confirmation', async () => {
    const { repository } = await createRepository()
    await repository.start(identity, 'return-to-course')
    expect((await repository.complete(identity, 'return-to-course')).masteryConfirmation).toBe('pending')
    expect((await repository.dismissConfirmation(identity)).masteryConfirmation).toBe('dismissed')
  })

  it('preserves completed first-run state across guide versions', async () => {
    const { repository } = await createRepository()
    await repository.start(identity, 'return-to-course')
    await repository.complete(identity, 'return-to-course')
    const next = await repository.start({ ...identity, guideVersion: '1.1.0' }, 'practice-introduction')
    expect(next.status).toBe('completed')
    expect(next.guideVersion).toBe('1.0.0')
  })

  it('recovers malformed state without touching other files', async () => {
    const { directory, repository } = await createRepository()
    await writeFile(join(directory, 'practice-guide-state.json'), '{broken', 'utf8')
    await writeFile(join(directory, 'learner-progress.json'), 'keep', 'utf8')
    expect(await repository.load(identity.courseRunId, identity.guideId)).toBeNull()
    expect(await readFile(join(directory, 'learner-progress.json'), 'utf8')).toBe('keep')
  })

  it('resets only guide state', async () => {
    const { directory, repository } = await createRepository()
    await repository.start(identity, 'practice-introduction')
    await writeFile(join(directory, 'learner-progress.json'), 'keep', 'utf8')
    await repository.reset()
    expect(await repository.load(identity.courseRunId, identity.guideId)).toBeNull()
    expect(await readFile(join(directory, 'learner-progress.json'), 'utf8')).toBe('keep')
  })
})
