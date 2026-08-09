import { mkdtemp, readFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { TeacherMemoryRepository } from '../electron/main/teacher-memory-repository'
import type { PracticeRunSummary } from '../shared/contracts'

const temporaryDirectories: string[] = []

async function temporaryDirectory(): Promise<string> {
  const directory = await mkdtemp(join(tmpdir(), 'course-companion-teacher-memory-'))
  temporaryDirectories.push(directory)
  return directory
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true }))
  )
})

function summary(quality: PracticeRunSummary['quality']): PracticeRunSummary {
  return {
    schemaVersion: 1,
    practiceId: 'm1-verifiable-brief',
    runId: 'run-1',
    attempt: 1,
    outcome: 'replaced',
    objective: 'Build a verifiable brief.',
    approach: 'Inspected scope before approval.',
    learnerDecisions: ['Require mobile evidence.'],
    approvals: ['Approved the scoped plan.'],
    changedFiles: ['src/lesson.tsx'],
    verificationEvidence: ['Typecheck passed.'],
    learningSignals: [{
      text: 'The learner asks for concrete verification evidence.',
      basis: 'observed',
      sourceRunId: 'run-1'
    }],
    unresolvedIssues: ['Viewport evidence is still missing.'],
    nextAttemptGuidance: ['Capture the 390px viewport.'],
    startedAt: '2026-08-08T00:00:00.000Z',
    endedAt: '2026-08-08T00:10:00.000Z',
    summarizedAt: '2026-08-08T00:11:00.000Z',
    sourceDigest: 'digest',
    model: 'Hương',
    freshness: 'current',
    quality
  }
}

describe('TeacherMemoryRepository', () => {
  it('persists one summary per run and promotes a fallback after Hương refines it', async () => {
    const directory = await temporaryDirectory()
    const repository = new TeacherMemoryRepository(
      directory,
      () => new Date('2026-08-08T00:12:00.000Z')
    )

    await repository.upsertSummary(summary('pending-refinement'))
    expect(repository.hasPending(await repository.load())).toBe(true)

    const refined = summary('live')
    refined.approach = 'Hương consolidated the verified run facts.'
    refined.learnerDecisions = ['Require desktop evidence.']
    refined.learningSignals = [{
      text: 'The learner now asks for desktop verification evidence.',
      basis: 'inferred',
      sourceRunId: 'run-1'
    }]
    refined.unresolvedIssues = []
    const memory = await repository.upsertSummary(refined)

    expect(memory.practiceSummaries['m1-verifiable-brief']).toEqual([refined])
    expect(memory.learnerDecisions).toEqual(['Require mobile evidence.', 'Require desktop evidence.'])
    expect(memory.learningSignals.map((signal) => signal.text)).toEqual(['The learner now asks for desktop verification evidence.'])
    expect(memory.unresolvedNeeds).toEqual([])
    expect(repository.hasPending(memory)).toBe(false)
    await expect(readFile(join(directory, 'teacher-memory.json'), 'utf8')).resolves.toContain('Hương')
  })

  it('clears durable Practice memory only through reset', async () => {
    const directory = await temporaryDirectory()
    const repository = new TeacherMemoryRepository(directory)
    await repository.upsertSummary(summary('live'))

    await repository.reset()

    expect((await repository.load()).practiceSummaries).toEqual({})
  })
})
