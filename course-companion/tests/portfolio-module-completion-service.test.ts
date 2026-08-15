import { createHash } from 'node:crypto'
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { PortfolioModuleCompletionService } from '../electron/main/portfolio-module-completion-service'
import { ProgressRepository } from '../electron/main/progress-repository'
import {
  portfolioPlanningArtifactPaths,
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
    ...Array.from({ length: 6 }, (_, index) => [`assessment:mastery-${index + 1}`, 'correct:1']),
    ['assessment:mastery-audience-choice', 'correct:self-review:Nhà tuyển dụng cần quyết định mời tôi phỏng vấn dựa trên dự án thật.'],
    ['assessment:mastery-scope-boundary', 'correct:self-review:Blog nằm ngoài phạm vi và tôi đối chiếu plan để giữ nó bên ngoài.'],
    ['assessment:mastery-evidence-gap', 'correct:self-review:Số liệu chuyển đổi còn thiếu nên tôi không trình bày như một kết quả đã kiểm chứng.'],
    ['assessment:mastery-requirement-validation', 'correct:self-review:REQ-01 được kiểm tra ở hai viewport và lưu ảnh quan sát làm bằng chứng.']
  ])
  const update: ProgressUpdate = {
    currentLessonId: 'module-2',
    currentCourseLessonId: 'm2-implementation-contract',
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

describe('PortfolioModuleCompletionService', () => {
  it('atomically saves the receipt and opens Module 3 readiness with explicit artifact inputs only', async () => {
    const test = await fixture()

    const completed = await test.service.completeModuleTwo()

    expect(completed).toMatchObject({
      currentLessonId: 'module-3',
      sceneId: 'module-3-readiness',
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
      status: 'returning', progress: { sceneId: 'module-3-readiness' }
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
      currentCourseLessonId: 'm3-scaffold-baseline',
      checkpointId: 'm3-scaffold-baseline',
      sceneId: 'module-3-readiness',
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
})
