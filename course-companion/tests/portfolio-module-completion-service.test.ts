import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PortfolioModuleCompletionService } from '../electron/main/portfolio-module-completion-service'
import { ProgressRepository } from '../electron/main/progress-repository'
import {
  portfolioPlanningArtifactPaths,
  portfolioBuildSliceIds,
  type PracticeBuildSliceReceipt,
  type PortfolioPlanningEvidenceState,
  type PracticeStageReceipt,
  type ProgressUpdate
} from '../shared/contracts'

const temporaryDirectories: string[] = []
const observedAt = '2026-08-15T10:00:00.000Z'
const stagePaths = [
  ['planning/portfolio-brief.md'],
  ['planning/content-evidence-inventory.md'],
  ['planning/reference/reference.md'],
  ['planning/PRD.md'],
  ['planning/requirement-validation-map.md', 'planning/implementation-plan.md', 'planning/first-bounded-task.md']
] as const
const stageIds = [
  'portfolio-brief',
  'content-evidence-inventory',
  'visual-reference',
  'portfolio-prd',
  'implementation-contract'
] as const

afterEach(async () => {
  await Promise.all(temporaryDirectories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'portfolio-module-completion-'))
  temporaryDirectories.push(root)
  const dataDirectory = join(root, 'data')
  const workspace = join(root, 'portfolio')
  await mkdir(join(workspace, 'planning/reference'), { recursive: true })
  const contents: Record<string, string> = {
    'planning/portfolio-brief.md': '# Brief\n\n## Người xem chính\nNhà tuyển dụng sản phẩm.\n\n## Quyết định người xem cần đưa ra\nMời tôi phỏng vấn.\n',
    'planning/content-evidence-inventory.md': '# Inventory\n\n## Khoảng trống bằng chứng\nChưa có số liệu chuyển đổi.\n\n## Nội dung không được công khai\nEmail cá nhân.\n',
    'planning/reference/reference.md': '# Reference\n',
    'planning/PRD.md': '# PRD\n\n## Ngoài phạm vi\nBlog và backend.\n',
    'planning/requirement-validation-map.md': '# Map\n',
    'planning/implementation-plan.md': '# Plan\n',
    'planning/first-bounded-task.md': '# First task\n\n## Mục tiêu duy nhất\nĐề xuất scaffold trung tính rồi dừng chờ duyệt.\n'
  }
  await Promise.all(Object.entries(contents).map(([path, content]) =>
    writeFile(join(workspace, path), content, 'utf8')))
  const digests = new Map(Object.entries(contents).map(([path, content]) => [path, sha256(content)]))
  const progressRepository = new ProgressRepository(dataDirectory, () => new Date(observedAt))
  const decisions = Object.fromEntries([
    ...[1, 4, 5, 6].map((index) => [`assessment:mastery-${index}`, 'correct:1']),
    ['assessment:mastery-audience-choice', 'correct:self-review:Nhà tuyển dụng cần quyết định mời tôi phỏng vấn dựa trên dự án thật.']
  ])
  const update: ProgressUpdate = {
    currentLessonId: 'module-2',
    currentCourseLessonId: 'm2-portfolio-brief',
    checkpointId: 'm2-portfolio-mastery',
    sceneId: 'module-2-portfolio-mastery-summary',
    sceneHistory: ['module-2-portfolio-practice'],
    completedCheckpointIds: ['m2-portfolio-planning'],
    decisions
  }
  const progress = await progressRepository.save(update)
  const workspaceDigest = sha256(workspace)
  const receipts: PracticeStageReceipt[] = stageIds.map((stageId, index) => {
    const artifactDigests = Object.fromEntries(stagePaths[index]!.map((path) => [path, digests.get(path)!]))
    return {
      schemaVersion: 1,
      courseRunId: progress.courseRunId,
      practiceId: 'm2-portfolio-planning',
      practiceVersion: '1.0.0',
      runId: 'run-portfolio',
      stageId,
      stageIndex: (index + 1) as 1 | 2 | 3 | 4 | 5,
      workspace: { canonicalPath: workspace, identityDigest: workspaceDigest },
      artifactDigests,
      approval: { approvedAt: observedAt, artifactDigests },
      evidence: { executorReportedChecks: [], corroboratedArtifacts: artifactDigests },
      status: 'completed',
      freshness: 'current',
      observedAt
    }
  })
  const planning: PortfolioPlanningEvidenceState = {
    schemaVersion: 1,
    workspaceIdentityDigest: workspaceDigest,
    artifacts: portfolioPlanningArtifactPaths.map((path) => ({
      path,
      digest: digests.get(path)!,
      byteLength: Buffer.byteLength(contents[path]!),
      modifiedAt: observedAt,
      observedAt
    })),
    issues: [],
    unexpectedPaths: [],
    stages: stageIds.map((stageId, index) => ({
      stageId,
      stageIndex: (index + 1) as 1 | 2 | 3 | 4 | 5,
      status: 'ready',
      artifactDigests: receipts[index]!.artifactDigests,
      executorReportedChecks: [],
      corroboratedArtifacts: receipts[index]!.artifactDigests,
      issueCodes: []
    }))
  }
  const active = {
    runId: 'run-portfolio',
    generation: 1,
    practiceId: 'm2-portfolio-planning',
    practiceVersion: '1.0.0',
    binding: { threadId: 'thread-portfolio', workspaceRoot: workspace },
    stageReceipts: receipts
  }
  const definition = {
    practiceId: active.practiceId,
    version: active.practiceVersion,
    stages: stageIds.map((id, index) => ({
      id,
      order: (index + 1) as 1 | 2 | 3 | 4 | 5,
      dependsOn: index === 0 ? [] : [stageIds[index - 1]!],
      requiredArtifactPaths: [...stagePaths[index]!]
    }))
  }
  const dependencies = {
    workspaceRepository: { load: async () => ({ status: 'ready', selectedPath: workspace }) },
    practiceRunRepository: { load: async () => ({ activeRun: active }) },
    definitionRepository: { load: async () => definition },
    evidenceAdapter: {
      collect: async () => ({
        freshness: 'fresh',
        portfolioPlanning: planning
      })
    }
  }
  const service = new PortfolioModuleCompletionService(
    progressRepository,
    dependencies.workspaceRepository as never,
    dependencies.practiceRunRepository as never,
    dependencies.definitionRepository as never,
    dependencies.evidenceAdapter as never,
    () => new Date(observedAt)
  )
  return { root, workspace, progressRepository, progress, planning, receipts, dependencies, service }
}

async function moduleThreeFixture() {
  const base = await fixture()
  const moduleThreeReady = await base.service.completeModuleTwo()
  const decisions = {
    ...moduleThreeReady.decisions,
    'assessment:m3-mastery-plan': 'correct:1',
    'assessment:m3-mastery-visible-error': 'correct:2',
    'assessment:m3-mastery-logs': 'correct:3',
    'assessment:m3-mastery-repeated-error': 'correct:0',
    'assessment:m3-mastery-branch': 'correct:1'
  }
  const practiceCompletion = {
    schemaVersion: 1 as const,
    courseRunId: moduleThreeReady.courseRunId,
    practiceId: 'm3-portfolio-build',
    practiceVersion: '1.0.0',
    runId: 'run-build',
    checkpointId: 'm3-portfolio-build' as const,
    status: 'completed' as const,
    completedAt: observedAt,
    evidenceSummary: 'Các phần bắt buộc và kết quả kiểm tra hiện tại đã đầy đủ.',
    masterySummary: 'Triết đã duyệt bằng chứng hiện tại của website.',
    destination: {
      lessonId: 'module-3' as const,
      checkpointId: 'm3-mastery' as const,
      sceneId: 'module-3-portfolio-mastery' as const
    }
  }
  await base.progressRepository.recordPracticeCompletion(practiceCompletion)
  const mastery = await base.progressRepository.save({
    currentLessonId: 'module-3',
    currentCourseLessonId: 'm3-independent-enhancement',
    checkpointId: 'm3-mastery',
    sceneId: 'module-3-mastery-summary',
    sceneHistory: ['module-3-portfolio-practice'],
    completedCheckpointIds: [...moduleThreeReady.completedCheckpointIds, 'm3-portfolio-build'],
    decisions
  })
  const stageIds = ['scaffold-baseline', 'complete-first-version', 'whole-page-revision', 'evidence-debugging', 'independent-enhancement'] as const
  const stageArtifactPaths = [
    ['evidence/module-3/scaffold-report.md'],
    ['evidence/module-3/design-direction.md', 'evidence/module-3/build-log.md', 'evidence/module-3/browser-validation.md'],
    ['evidence/module-3/revision-record.md'],
    ['evidence/module-3/debugging-report.md'],
    ['evidence/module-3/enhancement-plan.md', 'evidence/module-3/final-change-summary.md']
  ] as const
  const allPaths = [
    'planning/PRD.md', 'planning/implementation-plan.md',
    ...stageArtifactPaths.flat(),
    ...portfolioBuildSliceIds.map((id) => `evidence/module-3/build-log.${id}`)
  ]
  const digestMap = new Map(allPaths.map((path) => [path, sha256(`current:${path}`)]))
  const workspaceDigest = sha256(base.workspace)
  const receipts: PracticeStageReceipt[] = stageIds.map((stageId, index) => {
    const artifactDigests = Object.fromEntries([
      'planning/PRD.md', 'planning/implementation-plan.md', ...stageArtifactPaths[index]!
    ].map((path) => [path, digestMap.get(path)!]))
    return {
      schemaVersion: 1, courseRunId: mastery.courseRunId, practiceId: 'm3-portfolio-build', practiceVersion: '1.0.0',
      runId: 'run-build', stageId, stageIndex: (index + 1) as 1 | 2 | 3 | 4 | 5,
      workspace: { canonicalPath: base.workspace, identityDigest: workspaceDigest }, artifactDigests,
      approval: { approvedAt: observedAt, artifactDigests },
      evidence: { executorReportedChecks: ['npm run check passed', 'checkpoint commit-build'], corroboratedArtifacts: artifactDigests },
      status: 'completed', freshness: 'current', observedAt
    }
  })
  const slices: PracticeBuildSliceReceipt[] = portfolioBuildSliceIds.map((sliceId, index) => {
    const artifactDigests = Object.fromEntries([
      ['planning/PRD.md', digestMap.get('planning/PRD.md')!],
      ['evidence/module-3/design-direction.md', digestMap.get('evidence/module-3/design-direction.md')!],
      [`evidence/module-3/build-log.${sliceId}`, digestMap.get(`evidence/module-3/build-log.${sliceId}`)!]
    ])
    return {
      schemaVersion: 1, courseRunId: mastery.courseRunId, practiceId: 'm3-portfolio-build', practiceVersion: '1.0.0', runId: 'run-build',
      stageId: 'complete-first-version', stageIndex: 2, sliceId, sliceIndex: (index + 1) as 1 | 2 | 3 | 4,
      workspace: { canonicalPath: base.workspace, identityDigest: workspaceDigest }, artifactDigests,
      approval: { approvedAt: observedAt, artifactDigests }, evidence: { executorReportedChecks: ['npm run check passed'], corroboratedArtifacts: artifactDigests },
      status: 'completed', freshness: 'current', observedAt
    }
  })
  const build = {
    schemaVersion: 1 as const,
    workspaceIdentityDigest: workspaceDigest,
    artifacts: allPaths.map((path) => ({ path, digest: digestMap.get(path)!, byteLength: 100, modifiedAt: observedAt, observedAt })),
    issues: [], unexpectedPaths: [],
    stages: stageIds.map((stageId, index) => ({
      stageId, stageIndex: (index + 1) as 1 | 2 | 3 | 4 | 5, status: 'ready' as const,
      artifactDigests: receipts[index]!.artifactDigests, executorReportedChecks: ['npm run check passed'],
      corroboratedArtifacts: receipts[index]!.artifactDigests, issueCodes: []
    }))
  }
  const definition = {
    practiceId: 'm3-portfolio-build', version: '1.0.0',
    stages: stageIds.map((id, index) => ({ id, order: (index + 1) as 1 | 2 | 3 | 4 | 5, dependsOn: index ? [stageIds[index - 1]!] : [], requiredArtifactPaths: [...stageArtifactPaths[index]!] }))
  }
  const active = {
    runId: 'run-build', generation: 1, practiceId: 'm3-portfolio-build', practiceVersion: '1.0.0',
    binding: { threadId: 'thread-build', workspaceRoot: base.workspace }, stageReceipts: receipts, buildSliceReceipts: slices,
    reviewStatus: 'passed', completion: practiceCompletion
  }
  const service = new PortfolioModuleCompletionService(
    base.progressRepository,
    { load: async () => ({ status: 'ready', selectedPath: base.workspace }) } as never,
    { load: async () => ({ activeRun: active }) } as never,
    { load: async () => definition } as never,
    base.dependencies.evidenceAdapter as never,
    () => new Date(observedAt),
    { collect: async () => ({ freshness: 'fresh', portfolioBuild: build }) } as never
  )
  return { ...base, mastery, receipts, slices, build, active, service }
}

describe('PortfolioModuleCompletionService', () => {
  it('atomically saves the receipt and opens Module 3 debugging with explicit artifact inputs only', async () => {
    const test = await fixture()

    const completed = await test.service.completeModuleTwo()

    expect(completed).toMatchObject({
      currentLessonId: 'module-3',
      sceneId: 'module-3-debugging-intro',
      completedCheckpointIds: expect.arrayContaining([
        'm2-portfolio-planning', 'm2-portfolio-mastery', 'm2-portfolio-complete'
      ])
    })
    const receipt = completed.practiceCompletions.at(-1)!
    expect(receipt.portfolioPlanningHandoff).toMatchObject({
      workspace: { canonicalPath: test.workspace },
      moduleThreeInput: { workspacePath: test.workspace }
    })
    expect(receipt.portfolioPlanningHandoff?.artifacts).toEqual(
      expect.arrayContaining([expect.objectContaining({ path: 'planning/PRD.md' })]))
    expect(receipt.portfolioPlanningHandoff?.stageReceipts).toEqual(
      expect.arrayContaining([expect.objectContaining({ stageId: 'implementation-contract' })]))
    expect(JSON.stringify(receipt)).not.toMatch(/thread|chat|transcript/i)
    await expect(new ProgressRepository(join(test.root, 'data')).load()).resolves.toMatchObject({
      status: 'returning', progress: { sceneId: 'module-3-debugging-intro' }
    })
  })

  it('rejects a stale stage digest without moving the learner checkpoint', async () => {
    const test = await fixture()
    test.planning.artifacts[0]!.digest = 'f'.repeat(64)

    await expect(test.service.completeModuleTwo()).rejects.toThrow('stage receipts')
    await expect(test.progressRepository.load()).resolves.toMatchObject({
      status: 'returning', progress: { sceneId: 'module-2-portfolio-mastery-summary' }
    })
  })

  it.each([
    ['incomplete validation mapping', 'requirement-coverage'],
    ['hidden implementation', 'unexpected-workspace-change']
  ])('rejects %s reported by the independent adapter', async (_label, code) => {
    const test = await fixture()
    test.planning.issues.push({
      stageId: 'implementation-contract',
      path: code === 'requirement-coverage' ? 'planning/requirement-validation-map.md' : 'src/App.tsx',
      code: code as 'requirement-coverage' | 'unexpected-workspace-change',
      message: 'Blocked fixture'
    })

    await expect(test.service.completeModuleTwo()).rejects.toThrow('missing, invalid, or out-of-scope')
  })

  it('rejects a missing learner approval and prevents ordinary progress writes from bypassing the gate', async () => {
    const test = await fixture()
    test.receipts[0]!.approval.approvedAt = ''
    await expect(test.service.completeModuleTwo()).rejects.toThrow('learner-approved')

    await expect(test.progressRepository.save({
      currentLessonId: 'module-3',
      currentCourseLessonId: 'm3-complete-first-version',
      checkpointId: 'm3-complete-first-version',
      sceneId: 'module-3-debugging-intro',
      sceneHistory: ['module-2-portfolio-mastery-summary'],
      completedCheckpointIds: ['m2-portfolio-planning', 'm2-portfolio-mastery'],
      decisions: test.progress.decisions
    })).rejects.toThrow('atomic Module 2 completion receipt')
  })

  it('reset removes the receipt and the unlocked destination', async () => {
    const test = await fixture()
    await test.service.completeModuleTwo()
    await test.progressRepository.reset()

    await expect(test.progressRepository.load()).resolves.toEqual({ status: 'new' })
    await expect(readFile(join(test.root, 'data', 'learner-state.json'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('atomically completes Module 3 with a passed Practice review and five current answers', async () => {
    const test = await moduleThreeFixture()
    const completed = await test.service.completeModuleThree()
    expect(completed).toMatchObject({ sceneId: 'module-3-complete', completedCheckpointIds: expect.arrayContaining(['m3-portfolio-build', 'm3-mastery', 'm3-complete']) })
    expect(completed.practiceCompletions.at(-1)?.portfolioBuildHandoff).toMatchObject({
      workspace: { canonicalPath: test.workspace },
      stageReceiptIds: [],
      buildSliceReceiptIds: []
    })
  })

  it('keeps Module 3 locked when the current Practice review is not passed', async () => {
    const test = await moduleThreeFixture()
    test.active.reviewStatus = 'needs-work'
    await expect(test.service.completeModuleThree()).rejects.toThrow('passed current Practice review')
    await expect(test.progressRepository.load()).resolves.toMatchObject({ status: 'returning', progress: { sceneId: 'module-3-mastery-summary' } })
  })
})
