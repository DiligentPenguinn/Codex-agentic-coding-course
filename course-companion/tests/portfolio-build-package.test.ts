import { mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PortfolioBuildEvidenceAdapter } from '../electron/main/portfolio-build-evidence-adapter'
import { PracticeDefinitionRepository } from '../electron/main/practice-definition-repository'
import { PracticeRunRepository, defaultPracticeWorkspaceRecord } from '../electron/main/practice-run-repository'
import { PracticeCoordinator } from '../electron/main/practice-coordinator'
import { PracticeEvidenceAdapterRegistry } from '../electron/main/practice-evidence-adapter-registry'
import { ProgressRepository } from '../electron/main/progress-repository'
import { PracticeReviewService } from '../electron/main/practice-review-service'
import { CodexConfigurationEvidenceAdapter } from '../electron/main/codex-configuration-evidence-adapter'
import { PlanningPackageEvidenceAdapter } from '../electron/main/planning-package-evidence-adapter'
import { PortfolioPlanningEvidenceAdapter } from '../electron/main/portfolio-planning-evidence-adapter'
import { buildPracticeReviewEnvelope, buildPracticeReviewPrompt, type PracticeReviewEnvelope } from '../electron/main/practice-review-context'
import { currentPortfolioPackageApproval, portfolioPackageIsReady } from '../electron/main/portfolio-package-state'
import { buildActivity, buildRun, writeBuildPackage } from './fixtures/portfolio-build-fixture'
import { portfolioPackageArtifactPaths, type PortfolioPackageHandoff } from '../shared/contracts'

const roots: string[] = []
afterEach(async () => { await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true }))) })

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'build-v2-')); roots.push(root)
  const workspace = join(root, 'portfolio'); await mkdir(workspace)
  await writeBuildPackage(workspace)
  const definitions = new PracticeDefinitionRepository(join(process.cwd(), '..', 'pilot-workspace/course/practices'))
  const definition = await definitions.load('m3-portfolio-build', '2.0.0')
  const runs = new PracticeRunRepository(join(root, 'data'))
  const run = buildRun(definition, workspace)
  await runs.save({ ...defaultPracticeWorkspaceRecord(), activeRun: run })
  const adapter = new PortfolioBuildEvidenceAdapter()
  const source = { async current() { return null } }
  const registry = new PracticeEvidenceAdapterRegistry([new CodexConfigurationEvidenceAdapter(source), new PlanningPackageEvidenceAdapter(source), new PortfolioPlanningEvidenceAdapter(), adapter])
  const progress = new ProgressRepository(join(root, 'data'))
  const learner = await progress.save({ currentLessonId: 'module-2', currentCourseLessonId: 'm2-portfolio-brief', checkpointId: 'm2-portfolio-planning', sceneId: 'module-2-portfolio-practice', sceneHistory: [], completedCheckpointIds: [], decisions: {} })
  let taskReadable = true
  const executor = {
    async createTarget() { throw new Error('Must preserve the original task') }, async prepareTarget() {}, async openTarget() {},
    async validateExistingTarget() { return taskReadable }
  }
  const coordinator = new PracticeCoordinator(runs, definitions, executor, undefined, undefined, undefined, undefined, registry)
  const envelopes: PracticeReviewEnvelope[] = []
  let verdict: 'passed' | 'needs-work' = 'passed'
  let duringReview: (() => Promise<void>) | undefined
  const activity = buildActivity()
  const service = new PracticeReviewService(definitions, runs, coordinator, progress, { async read() { return structuredClone(activity) } }, {
    async evaluate(envelope) {
      envelopes.push(envelope); await duringReview?.()
      return JSON.stringify({ schemaVersion: 1, practiceId: definition.practiceId, practiceVersion: definition.version, runId: run.runId,
        verdict, summary: 'Simulated content review for lifecycle verification.',
        criteria: definition.criteria.map((criterion) => ({ criterionId: criterion.id, status: verdict === 'passed' ? 'satisfied' : 'unsatisfied', evidenceRefs: [envelope.evidence[0]!.id], explanation: 'Simulated judgment; not live learner acceptance.' })) })
    }
  }, undefined, registry)
  const collect = async () => adapter.collect({ definition, runId: run.runId, generation: run.generation, workspaceRoot: workspace, task: { threadId: run.binding.threadId, workspaceRoot: workspace } })
  const approve = async () => {
    const view = await coordinator.loadWorkspace({ practiceId: definition.practiceId, practiceVersion: definition.version })
    const active = view.activePractice!
    return coordinator.approvePortfolioPackage({ runId: active.runId, generation: active.generation, practiceId: active.practiceId,
      practiceVersion: active.practiceVersion, courseRunId: learner.courseRunId, sourceDigest: view.portfolioPackage!.sourceDigest!, approveWebsite: true })
  }
  return { root, workspace, definitions, definition, runs, run, adapter, coordinator, executor, registry, progress, learner, service, collect, approve, envelopes, activity,
    setVerdict: (next: typeof verdict) => { verdict = next }, duringReview: (callback: () => Promise<void>) => { duringReview = callback }, setTaskReadable: (value: boolean) => { taskReadable = value } }
}

async function archivedPassedFixture() {
  const f = await fixture()
  await f.approve()
  await f.service.review()
  await f.runs.closeCompletedRun({ ...f.run, updatedAt: new Date().toISOString() })
  return f
}

describe('Module 3 plan-led build package', () => {
  it('requires a fresh review if the learner withdraws acceptance after the passed review', async () => {
    const f = await fixture()
    const evidence = await f.collect()
    const artifacts = portfolioPackageArtifactPaths.map((path) => ({ path,
      digest: evidence.portfolioBuild!.artifacts.find((artifact) => artifact.path === path)!.digest }))
    const workspace = { canonicalPath: f.workspace, identityDigest: evidence.portfolioBuild!.workspaceIdentityDigest }
    const task = { ...f.run.binding, runId: 'run-simulated-module-two-prerequisite' }
    const approval = { courseRunId: f.learner.courseRunId, runId: task.runId, generation: 1,
      threadId: task.threadId, workspaceIdentityDigest: workspace.identityDigest, sourceDigest: 'a'.repeat(64),
      artifactDigests: Object.fromEntries(artifacts.map(({ path, digest }) => [path, digest])), recordedAt: f.run.startedAt }
    // Simulated prerequisite acceptance isolates this return-integrity regression;
    // the real ProgressRepository still enforces its normal Module 3 unlock gate.
    await f.progress.recordPracticeCompletion({
      schemaVersion: 1, courseRunId: f.learner.courseRunId, practiceId: 'm2-portfolio-planning', practiceVersion: '2.0.0',
      runId: task.runId, checkpointId: 'm2-portfolio-complete', status: 'completed', completedAt: f.run.startedAt,
      evidenceSummary: 'SIMULATED Module 2 prerequisite for an isolated withdrawal regression.',
      masterySummary: 'SIMULATED prerequisite; no real learner acceptance is claimed.',
      submissionDigest: 'b'.repeat(64),
      destination: { lessonId: 'module-3', checkpointId: 'm3-complete-first-version', sceneId: 'module-3-local-preview' },
      portfolioPlanningHandoff: { schemaVersion: 2, workspace, artifacts, approval, task,
        submission: { runId: task.runId, generation: approval.generation, sourceDigest: approval.sourceDigest,
          reviewDigest: 'b'.repeat(64), reviewedAt: f.run.startedAt },
        mastery: { questionIds: ['mastery-1', 'mastery-4', 'mastery-5', 'mastery-6', 'mastery-audience-choice'], answerDigest: 'c'.repeat(64) },
        summary: { learnerDecision: 'SIMULATED audience decision', evidenceBoundary: 'SIMULATED evidence boundary',
          firstBuild: 'SIMULATED first build', deliberatelyOutOfScope: 'SIMULATED scope boundary' },
        moduleThreeInput: { workspacePath: f.workspace, artifactReferences: artifacts } }
    })
    await f.progress.save({ currentLessonId: 'module-3', currentCourseLessonId: 'm3-evidence-debugging',
      checkpointId: 'm3-portfolio-build', sceneId: 'module-3-portfolio-practice', sceneHistory: [], completedCheckpointIds: [], decisions: {} })
    await f.approve()
    await f.service.review()
    f.activity.learnerAuthoredPrompts!.push('I found private project information; I withdraw acceptance until it is removed.')
    f.activity.cursor += '-withdrawn'
    await expect(f.service.returnPassedPractice()).rejects.toThrow('Task evidence changed')
    expect((await f.runs.load()).activeRun?.binding.threadId).toBe(f.run.binding.threadId)
    expect((await f.runs.load()).activeRun?.packageApproval).toBeUndefined()
    expect((await f.runs.load()).activeRun?.reviewStatus).toBe('not-reviewed')
    expect((await f.runs.load()).archivedRuns).toEqual([])
  })
  it('reads five planning inputs and three records with flexible part names and learning order; preserves v1', async () => {
    const f = await fixture(); const evidence = await f.collect()
    expect(evidence.portfolioBuild?.issues).toEqual([])
    expect(evidence.portfolioBuild?.artifacts).toHaveLength(9)
    expect(portfolioPackageIsReady({ ...f.run, evidence })).toBe(true)
    expect((await f.definitions.load(f.definition.practiceId, '1.0.0')).criteria[1]?.id).toBe('four-slices-current')
    const envelope = buildPracticeReviewEnvelope({ definition: f.definition, run: { ...f.run, evidence }, activity: f.activity, generatedAt: new Date().toISOString() })
    expect(envelope.portfolioPackage?.artifacts.find((artifact) => artifact.path.endsWith('learning-record.md'))?.content).toContain('Debugging during first part')
    expect(buildPracticeReviewPrompt(envelope)).toContain('Earlier improvement and debugging count')
    expect(buildPracticeReviewPrompt(envelope)).not.toContain('Screenshots are optional')
  })

  it('requires explicit website approval and rejects a planning approval for Module 3', async () => {
    const f = await fixture(); expect((await f.service.review()).workspace.review?.status).toBe('needs-work')
    expect(f.envelopes).toHaveLength(0)
    await expect(f.coordinator.approvePortfolioPackage({ ...f.run, courseRunId: f.learner.courseRunId, sourceDigest: (await f.collect()).sourceDigest!, approvePrd: true, approvePlan: true })).rejects.toThrow()
    await f.approve(); const result = await f.service.review()
    expect(result.workspace.review?.status).toBe('passed')
    expect(result.workspace.portfolioBuild).toBeUndefined()
    expect(result.workspace.portfolioPackage?.kind).toBe('build')
    expect(f.envelopes[0]?.portfolioPackage?.taskEvidence?.learnerPrompts).toEqual(f.activity.learnerAuthoredPrompts)
  })

  it('does not turn generated records into learner authorship or command evidence', async () => {
    const f = await fixture(); await f.approve(); f.activity.learnerAuthoredPrompts = []
    await expect(f.service.review()).rejects.toThrow('learner-authored')
    f.activity.learnerAuthoredPrompts = ['I accept']; f.activity.reportedVerificationEvidence = []
    await expect(f.service.review()).rejects.toThrow('learner-authored')
  })

  it('keeps failed reviews in the original task and invalidates approval on application-only changes', async () => {
    const f = await fixture(); await f.approve(); f.setVerdict('needs-work')
    expect((await f.service.review()).workspace.review?.status).toBe('needs-work')
    expect((await f.runs.load()).activeRun?.binding.threadId).toBe(f.run.binding.threadId)
    f.setVerdict('passed'); await f.service.review()
    await writeFile(join(f.workspace, 'src/main.tsx'), 'export const changed = true')
    const refreshed = await f.coordinator.loadWorkspace({ practiceId: f.definition.practiceId, practiceVersion: f.definition.version })
    expect(refreshed.review?.status).toBe('not-reviewed')
    expect(refreshed.completion).toBeUndefined()
    expect(currentPortfolioPackageApproval((await f.runs.load()).activeRun!)).toBeNull()
    expect((await f.service.review()).workspace.review?.status).toBe('needs-work')
  })

  it('discards an AI result if source or task evidence changes during the review', async () => {
    const f = await fixture(); await f.approve()
    f.duringReview(async () => { await writeFile(join(f.workspace, 'src/main.tsx'), 'export const concurrent = true') })
    await expect(f.service.review()).rejects.toThrow('đã thay đổi')
    expect((await f.runs.load()).activeRun?.completion).toBeUndefined()
    const other = await fixture(); await other.approve()
    other.duringReview(async () => { other.activity.learnerAuthoredPrompts!.push('I reject the latest result') })
    await expect(other.service.review()).rejects.toThrow('đã thay đổi')
  })

  it('rejects missing records, unavailable source and symlinked evidence directories', async () => {
    const f = await fixture(); await rm(join(f.workspace, 'evidence/module-3/learning-record.md'))
    expect((await f.collect()).portfolioBuild?.issues.some((issue) => issue.path.endsWith('learning-record.md'))).toBe(true)
    await rm(join(f.workspace, 'src'), { recursive: true })
    expect((await f.collect()).portfolioBuild?.issues.some((issue) => issue.path === 'application/source')).toBe(true)
    const linked = await fixture(); const outside = join(linked.root, 'outside'); await mkdir(outside)
    await rm(join(linked.workspace, 'evidence/module-3'), { recursive: true })
    await symlink(outside, join(linked.workspace, 'evidence/module-3'), 'junction')
    expect((await linked.collect()).portfolioBuild?.issues.filter((issue) => issue.path.startsWith('evidence/'))).toHaveLength(3)
  })

  it('migrates a readable legacy attempt without deleting files or granting old approvals', async () => {
    const f = await fixture(); const legacyDefinition = await f.definitions.load(f.definition.practiceId, '1.0.0')
    const prior = buildRun(legacyDefinition, f.workspace)
    await f.runs.save({ ...defaultPracticeWorkspaceRecord(), activeRun: prior })
    const before = await readFile(join(f.workspace, 'evidence/module-3/build-log.md'), 'utf8')
    f.setTaskReadable(false)
    await f.coordinator.loadWorkspace({ practiceId: f.definition.practiceId, practiceVersion: '2.0.0' })
    expect((await f.runs.load()).activeRun?.practiceVersion).toBe('1.0.0')
    f.setTaskReadable(true)
    const migrated = await f.coordinator.loadWorkspace({ practiceId: f.definition.practiceId, practiceVersion: '2.0.0' })
    expect(migrated.activePractice).toMatchObject({ runId: prior.runId, generation: 2, practiceVersion: '2.0.0' })
    const saved = await f.runs.load()
    expect(saved.archivedRuns[0]?.retainedRun?.practiceVersion).toBe('1.0.0')
    expect(saved.activeRun?.binding).toEqual(prior.binding)
    expect(saved.activeRun?.packageApproval).toBeUndefined()
    expect(await readFile(join(f.workspace, 'evidence/module-3/build-log.md'), 'utf8')).toBe(before)
  })

  it('reads an unchanged completed archive repeatedly and after coordinator restart without reopening it', async () => {
    const f = await archivedPassedFixture()
    const archived = await f.runs.load()
    const restarted = new PracticeCoordinator(new PracticeRunRepository(join(f.root, 'data')), f.definitions, f.executor,
      undefined, undefined, undefined, undefined, f.registry)
    for (const coordinator of [f.coordinator, f.coordinator, restarted]) {
      const view = await coordinator.loadWorkspace(f.run)
      expect(await f.runs.load()).toEqual(archived)
      expect(view.activePractice).toBeUndefined()
      expect(view.review).toMatchObject({ status: 'passed', canReview: false, canReturn: false })
      expect(view.portfolioPackage).toMatchObject({ approved: true, ready: true })
      expect(view.completion).toEqual(archived.archivedRuns.at(-1)?.retainedRun?.completion)
      expect(view.capabilities.canResume).toBe(false)
    }
  })

  it.each(['src/main.tsx', 'evidence/module-3/learning-record.md'])(
    'reopens the original archived task in a new generation when %s changes', async (path) => {
      const f = await archivedPassedFixture()
      const archived = await f.runs.load()
      await writeFile(join(f.workspace, path), 'Changed since the approved review')

      const view = await f.coordinator.loadWorkspace(f.run)
      const saved = await f.runs.load()

      expect(saved.activeRun).toMatchObject({ runId: f.run.runId, generation: f.run.generation + 1, binding: f.run.binding })
      expect(saved.activeRun?.packageApproval).toBeUndefined()
      expect(saved.activeRun?.completion).toBeUndefined()
      expect(saved.activeRun?.reviewResult).toBeUndefined()
      expect(saved.archivedRuns).toEqual(archived.archivedRuns)
      expect(view.review?.status).toBe('not-reviewed')
      expect(view.portfolioPackage?.approved).toBe(false)
    }
  )

  it('keeps an unavailable archived task untouched and does not show an unverified approval', async () => {
    const f = await archivedPassedFixture()
    const archived = await f.runs.load()
    f.setTaskReadable(false)
    const unavailableTask = await f.coordinator.loadWorkspace(f.run)
    expect(unavailableTask.error).toContain('Chưa đọc được task Module 3 cũ')
    expect(unavailableTask.review?.status).toBe('not-reviewed')
    expect(unavailableTask.portfolioPackage).toBeUndefined()
    expect(await f.runs.load()).toEqual(archived)

    f.setTaskReadable(true)
    await rm(f.workspace, { recursive: true })
    const unavailableWorkspace = await f.coordinator.loadWorkspace(f.run)
    expect(unavailableWorkspace.error).toContain('Chưa thể làm mới bằng chứng từ Codex')
    expect(unavailableWorkspace.portfolioPackage).toBeUndefined()
    expect(await f.runs.load()).toEqual(archived)
  })

  it('does not displace an unrelated active Practice when archived Module 3 source changes', async () => {
    const f = await archivedPassedFixture()
    const planning = await f.definitions.load('m2-portfolio-planning', '2.0.0')
    const other = {
      ...f.run, runId: 'run-other-practice', practiceId: planning.practiceId, practiceVersion: planning.version,
      evidenceProfile: planning.evidenceProfile, buildSliceReceipts: undefined,
      binding: { ...f.run.binding, runId: 'run-other-practice', threadId: 'thread-other-practice' }
    }
    await f.runs.save({ ...(await f.runs.load()), activeRun: other })
    await writeFile(join(f.workspace, 'src/main.tsx'), 'Changed archived website')

    const view = await f.coordinator.loadWorkspace(f.run)
    const saved = await f.runs.load()

    expect(saved.activeRun).toMatchObject({ runId: other.runId, generation: other.generation, binding: other.binding })
    expect(saved.archivedRuns.at(-1)?.retainedRun?.reviewStatus).toBe('passed')
    expect(view.review?.status).toBe('not-reviewed')
    expect(view.portfolioPackage).toBeUndefined()
  })

  it('retains the full previous build attempt when explicitly restarting in the same portfolio task', async () => {
    const f = await fixture()
    await f.approve()
    await f.service.review()
    const prior = (await f.runs.load()).activeRun!
    const handoff: PortfolioPackageHandoff = {
      schemaVersion: 2, task: prior.binding,
      workspace: { canonicalPath: f.workspace, identityDigest: prior.packageApproval!.workspaceIdentityDigest },
      approval: prior.packageApproval!, artifacts: [],
      submission: { runId: prior.runId, generation: prior.generation, sourceDigest: prior.evidence!.sourceDigest!, reviewDigest: prior.reviewResult!.sourceDigest, reviewedAt: prior.reviewResult!.reviewedAt },
      mastery: { questionIds: [], answerDigest: 'fixture-mastery' },
      summary: { learnerDecision: 'Fixture decision', evidenceBoundary: 'Fixture boundary', firstBuild: 'Fixture order', deliberatelyOutOfScope: 'Fixture scope' },
      moduleThreeInput: { workspacePath: f.workspace, artifactReferences: [] }
    }
    const coordinator = new PracticeCoordinator(f.runs, f.definitions, f.executor,
      undefined, undefined, undefined, undefined, f.registry, undefined, undefined, async () => handoff)

    await coordinator.startNew({ practiceId: prior.practiceId, practiceVersion: prior.practiceVersion, transfer: false })
    const saved = await f.runs.load()

    expect(saved.archivedRuns.at(-1)).toMatchObject({ outcome: 'replaced', retainedRun: prior })
    expect(saved.activeRun?.runId).not.toBe(prior.runId)
    expect(saved.activeRun?.binding.threadId).toBe(prior.binding.threadId)
    expect(saved.activeRun?.binding.workspaceRoot).toBe(prior.binding.workspaceRoot)
    expect(saved.activeRun?.packageApproval).toBeUndefined()
    expect(saved.activeRun?.reviewStatus).toBe('not-reviewed')
  })
})
