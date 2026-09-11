import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { portfolioPackageArtifactPaths } from '../shared/contracts'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { currentPortfolioPackageApproval, legacyPortfolioPackagePaths, portfolioPackageIsReady } from '../electron/main/portfolio-package-state'
import {
  defaultPracticeWorkspaceRecord,
  practiceWorkspaceIdentityDigest,
  PracticeRunRepository,
  selectPortfolioPackageMigrationRecovery,
  type ArchivedPracticeReceipt,
  type PracticeRunRecord
} from '../electron/main/practice-run-repository'

const directories: string[] = []
const timestamp = '2026-09-11T00:00:00.000Z'
const definitions = new PracticeDefinitionRepository(resolve('../pilot-workspace/course/practices'))

async function setup() {
  const directory = await mkdtemp(join(tmpdir(), 'portfolio-package-state-'))
  directories.push(directory)
  const definition = await definitions.load('m2-portfolio-planning', '2.0.0')
  const run: PracticeRunRecord = {
    runId: 'portfolio-1', generation: 1, status: 'active', practiceId: definition.practiceId,
    practiceVersion: '1.0.0', workspaceKind: 'learner-portfolio', taskPolicy: 'safe-workspace-write',
    evidenceProfile: 'portfolio-planning',
    binding: { runId: 'portfolio-1', threadId: 'same-task', workspaceRoot: directory, name: 'Portfolio', createdAt: timestamp },
    startedAt: timestamp, updatedAt: timestamp, checklist: definition.checklist.map((step, index) => ({
      id: step.id, title: step.title, status: index === 0 ? 'current' : 'pending'
    })), learnerDecisions: { audience: 'A recruiter' }, learnerApprovals: {}, evidence: null,
    stageReceipts: [], invalidations: [], reviewStatus: 'not-reviewed', reviewHistory: []
  }
  const repository = new PracticeRunRepository(directory)
  await repository.save({ ...defaultPracticeWorkspaceRecord(), activeRun: run })
  return { repository, directory, run, definition }
}

function evidenceFor(run: PracticeRunRecord) {
  return {
    schemaVersion: 1 as const,
    practiceId: run.practiceId, practiceVersion: run.practiceVersion, runId: run.runId,
    evidenceProfile: run.evidenceProfile, observedAt: timestamp, freshness: 'fresh' as const,
    sourceDigest: 'a'.repeat(64), evidence: [], steps: [], invalidations: [],
    portfolioPlanning: {
      schemaVersion: 1 as const, workspaceIdentityDigest: practiceWorkspaceIdentityDigest(run.binding.workspaceRoot),
      artifacts: portfolioPackageArtifactPaths.map((path) => ({ path, digest: 'b'.repeat(64), content: '# Document\n\n## Scope\nEvidence.', byteLength: 32, modifiedAt: timestamp, observedAt: timestamp })),
      issues: [], unexpectedPaths: [], stages: run.checklist.map((step, i) => ({
        stageId: step.id, stageIndex: (i + 1) as 1 | 2 | 3 | 4 | 5,
        artifactDigests: { [portfolioPackageArtifactPaths[i]!]: 'b'.repeat(64) }, issueCodes: [], status: 'ready' as const,
        executorReportedChecks: [], corroboratedArtifacts: { [portfolioPackageArtifactPaths[i]!]: 'b'.repeat(64) }
      }))
    }
  }
}

function recovery(runId: string, workspaceRoot: string, validateTask = vi.fn(async () => true)) {
  return { courseRunId: 'course-1', runId, workspaceRoot, validateTask }
}

async function writeLegacyFiles(workspaceRoot: string): Promise<void> {
  await mkdir(join(workspaceRoot, 'planning'), { recursive: true })
  await Promise.all(legacyPortfolioPackagePaths.map((path) =>
    writeFile(join(workspaceRoot, path), `Historical ${path}`, 'utf8')))
}

afterEach(async () => { await Promise.all(directories.splice(0).map((path) => rm(path, { recursive: true, force: true }))) })

describe('versioned portfolio package persistence', () => {
  it('selects a receipt-free active v1 draft from the current selected workspace', async () => {
    const { directory, run } = await setup()
    const record = { ...defaultPracticeWorkspaceRecord(), activeRun: run }

    expect(selectPortfolioPackageMigrationRecovery({
      courseRunId: 'course-1', selectedWorkspaceRoot: directory, record, completions: []
    })).toEqual({ courseRunId: 'course-1', runId: run.runId, workspaceRoot: resolve(directory) })
    expect(selectPortfolioPackageMigrationRecovery({
      courseRunId: 'course-1', selectedWorkspaceRoot: resolve(directory, 'other'), record, completions: []
    })).toBeNull()
  })

  it('selects an unambiguous replaced v1 archive without a final receipt and rejects ambiguity', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'portfolio-package-recovery-selection-'))
    directories.push(directory)
    const archive: ArchivedPracticeReceipt = {
      runId: 'replaced-v1', generation: 2, practiceId: 'm2-portfolio-planning', practiceVersion: '1.0.0',
      threadId: 'portfolio-task', name: 'Portfolio task', outcome: 'replaced', archivedAt: timestamp, reviewHistory: []
    }
    const record = { ...defaultPracticeWorkspaceRecord(), archivedRuns: [archive] }

    expect(selectPortfolioPackageMigrationRecovery({
      courseRunId: 'course-1', selectedWorkspaceRoot: directory, record, completions: []
    })).toEqual({ courseRunId: 'course-1', runId: archive.runId, workspaceRoot: resolve(directory) })
    expect(selectPortfolioPackageMigrationRecovery({
      courseRunId: 'course-1', selectedWorkspaceRoot: directory,
      record: {
        ...record,
        archivedRuns: [archive, { ...archive, runId: 'other-v1', threadId: 'other-task' }]
      },
      completions: []
    })).toBeNull()
  })

  it('uses the current same-workspace task to disambiguate a receipt-free v1 archive', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'portfolio-package-task-selection-'))
    directories.push(directory)
    const definition = await definitions.load('m3-portfolio-build', '1.0.0')
    const active: PracticeRunRecord = {
      runId: 'build-run', generation: 4, status: 'active', practiceId: definition.practiceId,
      practiceVersion: definition.version, workspaceKind: definition.workspaceKind,
      taskPolicy: definition.taskPolicy, evidenceProfile: definition.evidenceProfile,
      binding: { runId: 'build-run', threadId: 'portfolio-task', name: 'Build', workspaceRoot: directory, createdAt: timestamp },
      startedAt: timestamp, updatedAt: timestamp,
      checklist: definition.checklist.map((step, index) => ({ ...step, status: index === 0 ? 'current' : 'pending' })),
      learnerDecisions: {}, learnerApprovals: {}, evidence: null, invalidations: [], stageReceipts: [],
      buildSliceReceipts: [], reviewStatus: 'not-reviewed', reviewHistory: []
    }
    const archives: ArchivedPracticeReceipt[] = [
      { runId: 'selected-v1', generation: 1, practiceId: 'm2-portfolio-planning', practiceVersion: '1.0.0',
        threadId: active.binding.threadId, name: 'Selected', outcome: 'replaced', archivedAt: timestamp },
      { runId: 'other-v1', generation: 2, practiceId: 'm2-portfolio-planning', practiceVersion: '1.0.0',
        threadId: 'other-task', name: 'Other', outcome: 'completed', archivedAt: timestamp }
    ]

    expect(selectPortfolioPackageMigrationRecovery({
      courseRunId: 'course-1', selectedWorkspaceRoot: directory,
      record: { ...defaultPracticeWorkspaceRecord(), activeRun: active, archivedRuns: archives }, completions: []
    })).toEqual({ courseRunId: 'course-1', runId: 'selected-v1', workspaceRoot: resolve(directory) })
  })

  it('loads legacy definitions and migrates once without changing files, task or original record', async () => {
    const { repository, directory, run, definition } = await setup()
    await writeLegacyFiles(directory)
    const validateTask = vi.fn(async () => true)
    expect((await definitions.load(run.practiceId, '1.0.0')).version).toBe('1.0.0')
    const migrated = await repository.migratePortfolioPackage(
      definition, timestamp, recovery(run.runId, directory, validateTask))
    expect(migrated.activeRun).toMatchObject({ runId: run.runId, generation: 2, practiceVersion: '2.0.0', binding: run.binding, learnerDecisions: run.learnerDecisions, reviewStatus: 'not-reviewed' })
    expect(migrated.archivedRuns[0]!.retainedRun).toEqual(run)
    expect(migrated.activeRun?.allowedLegacyArtifactPaths).toEqual(legacyPortfolioPackagePaths)
    expect(migrated.activeRun?.packageApproval).toBeUndefined()
    expect(await new PracticeRunRepository(directory).migratePortfolioPackage(
      definition, timestamp, recovery(run.runId, directory, validateTask))).toEqual(migrated)
    expect(validateTask).toHaveBeenCalledTimes(1)
  })

  it('requires exact current evidence and explicit approval; invalidates changed evidence across relaunch', async () => {
    const { repository, directory, definition } = await setup()
    const run = (await repository.migratePortfolioPackage(
      definition, timestamp, recovery('portfolio-1', directory))).activeRun!
    const evidence = evidenceFor(run)
    await repository.saveEvidence({ ...run, evidence, updatedAt: timestamp })
    expect(portfolioPackageIsReady((await repository.load()).activeRun!)).toBe(true)
    expect(currentPortfolioPackageApproval((await repository.load()).activeRun!)).toBeNull()
    await expect(repository.approvePortfolioPackage({ ...run, courseRunId: 'course-1', sourceDigest: 'c'.repeat(64), updatedAt: timestamp })).rejects.toThrow('changed')
    await expect(repository.approvePortfolioPackage({ ...run, generation: 1, courseRunId: 'course-1', sourceDigest: evidence.sourceDigest, updatedAt: timestamp })).rejects.toThrow('changed')
    const approved = await repository.approvePortfolioPackage({ ...run, courseRunId: 'course-1', sourceDigest: evidence.sourceDigest, updatedAt: timestamp })
    expect(currentPortfolioPackageApproval(approved.activeRun!, 'course-1')).not.toBeNull()
    expect(currentPortfolioPackageApproval(approved.activeRun!, 'other-course')).toBeNull()
    expect(currentPortfolioPackageApproval((await new PracticeRunRepository(directory).load()).activeRun!)).not.toBeNull()
    const changed = await repository.saveEvidence({ ...run, evidence: { ...evidence, sourceDigest: 'c'.repeat(64) }, updatedAt: timestamp })
    expect(changed.activeRun?.packageApproval).toBeUndefined()
    expect(changed.activeRun?.reviewStatus).toBe('not-reviewed')
  })

  it('recovers the actual v1 archive-only shape and preserves the original archive byte-for-byte', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'portfolio-package-archive-'))
    directories.push(directory)
    await writeLegacyFiles(directory)
    const definition = await definitions.load('m2-portfolio-planning', '2.0.0')
    const repository = new PracticeRunRepository(directory)
    const historicalReview = {
      schemaVersion: 1 as const,
      practiceId: definition.practiceId,
      practiceVersion: '1.0.0',
      runId: 'legacy-run',
      verdict: 'passed' as const,
      criteria: [],
      summary: 'Historical seven-document review remains historical.',
      reviewedAt: timestamp,
      sourceDigest: 'f'.repeat(64)
    }
    const originalArchive = {
      runId: 'legacy-run', generation: 4, practiceId: definition.practiceId, practiceVersion: '1.0.0',
      threadId: 'legacy-task', name: 'Historical portfolio task', outcome: 'completed' as const,
      archivedAt: timestamp, reviewHistory: [historicalReview]
    }
    await repository.save({ ...defaultPracticeWorkspaceRecord(), archivedRuns: [originalArchive] })
    const validateTask = vi.fn(async () => true)

    const migrated = await repository.migratePortfolioPackage(
      definition, timestamp, recovery(originalArchive.runId, directory, validateTask))

    expect(migrated.archivedRuns[0]).toEqual(originalArchive)
    expect(migrated.archivedRuns[1]).toMatchObject({
      ...originalArchive,
      outcome: 'historical',
      retainedRun: { runId: originalArchive.runId, binding: { threadId: originalArchive.threadId, workspaceRoot: directory } }
    })
    expect(migrated.activeRun).toMatchObject({
      runId: originalArchive.runId,
      generation: 5,
      practiceVersion: '2.0.0',
      binding: { threadId: originalArchive.threadId, workspaceRoot: directory },
      learnerDecisions: {},
      learnerApprovals: {},
      reviewStatus: 'not-reviewed'
    })
    expect(validateTask).toHaveBeenCalledTimes(1)
  })

  it('retains an active Module 3 run while reopening the exact archived Module 2 task monotonically', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'portfolio-package-module-three-'))
    directories.push(directory)
    await writeLegacyFiles(directory)
    const definition = await definitions.load('m2-portfolio-planning', '2.0.0')
    const buildDefinition = await definitions.load('m3-portfolio-build', '1.0.0')
    const repository = new PracticeRunRepository(directory)
    const originalArchive = {
      runId: 'legacy-run', generation: 2, practiceId: definition.practiceId, practiceVersion: '1.0.0',
      threadId: 'legacy-task', name: 'Historical portfolio task', outcome: 'completed' as const,
      archivedAt: timestamp, reviewHistory: []
    }
    const activeBuild: PracticeRunRecord = {
      runId: 'build-run', generation: 7, status: 'active', practiceId: buildDefinition.practiceId,
      practiceVersion: buildDefinition.version, workspaceKind: buildDefinition.workspaceKind,
      taskPolicy: buildDefinition.taskPolicy, evidenceProfile: buildDefinition.evidenceProfile,
      binding: { runId: 'build-run', threadId: 'build-task', name: 'Module 3', workspaceRoot: directory, createdAt: timestamp },
      startedAt: timestamp, updatedAt: timestamp,
      checklist: buildDefinition.checklist.map((step, index) => ({ ...step, status: index === 0 ? 'current' : 'pending' })),
      learnerDecisions: { preserved: 'yes' }, learnerApprovals: {}, evidence: null, invalidations: [],
      stageReceipts: [], buildSliceReceipts: [], reviewStatus: 'not-reviewed', reviewHistory: []
    }
    await repository.save({ ...defaultPracticeWorkspaceRecord(), activeRun: activeBuild, archivedRuns: [originalArchive] })

    const migrated = await repository.migratePortfolioPackage(
      definition, timestamp, recovery(originalArchive.runId, directory))

    expect(migrated.activeRun).toMatchObject({ runId: originalArchive.runId, generation: 8, practiceVersion: '2.0.0' })
    expect(migrated.archivedRuns[0]).toEqual(originalArchive)
    expect(migrated.archivedRuns.at(-1)).toMatchObject({
      runId: activeBuild.runId,
      outcome: 'historical',
      retainedRun: activeBuild
    })
  })

  it.each(['wrong workspace', 'unreadable task'])('fails closed for an archive-only recovery with %s', async () => {
    const directory = await mkdtemp(join(tmpdir(), 'portfolio-package-closed-'))
    directories.push(directory)
    const definition = await definitions.load('m2-portfolio-planning', '2.0.0')
    const repository = new PracticeRunRepository(directory)
    const archive = {
      runId: 'legacy-run', generation: 1, practiceId: definition.practiceId, practiceVersion: '1.0.0',
      threadId: 'legacy-task', name: 'Historical portfolio task', outcome: 'replaced' as const,
      archivedAt: timestamp, reviewHistory: []
    }
    const original = { ...defaultPracticeWorkspaceRecord(), archivedRuns: [archive] }
    await repository.save(original)
    const validateTask = vi.fn(async () => false)

    await expect(repository.migratePortfolioPackage(
      definition, timestamp, recovery(archive.runId, directory, validateTask))).resolves.toEqual(original)
    await expect(new PracticeRunRepository(directory).load()).resolves.toEqual(original)
  })
})
