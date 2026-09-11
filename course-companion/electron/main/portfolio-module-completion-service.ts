import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import {
  portfolioPlanningArtifactPaths,
  type LearnerProgress,
  type PortfolioPlanningArtifactPath,
  type PracticeCompletionReceipt
} from '../../shared/contracts'
import type { PortfolioPlanningEvidenceAdapter } from './portfolio-planning-evidence-adapter'
import type { PortfolioBuildEvidenceAdapter } from './portfolio-build-evidence-adapter'
import type { PortfolioWorkspaceRepository } from './portfolio-workspace-repository'
import type { PracticeDefinitionRepository } from './practice-definition-repository'
import { practiceWorkspaceIdentityDigest, type PracticeRunRepository } from './practice-run-repository'
import type { ProgressRepository } from './progress-repository'

const masteryQuestionIds = [
  'mastery-1',
  'mastery-4',
  'mastery-5',
  'mastery-6',
  'mastery-audience-choice'
] as const
const writtenQuestionIds = [
  'mastery-audience-choice'
] as const

function digest(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function bounded(value: string, maximum = 650): string {
  const compact = value.replace(/\s+/g, ' ').trim()
  return compact.length <= maximum ? compact : `${compact.slice(0, maximum - 1).trimEnd()}…`
}

function section(content: string, heading: string): string {
  const marker = `## ${heading}`
  const start = content.split('\n').findIndex((line) => line.trim() === marker)
  if (start < 0) return ''
  const lines = content.split('\n').slice(start + 1)
  const next = lines.findIndex((line) => line.startsWith('## '))
  return bounded((next < 0 ? lines : lines.slice(0, next)).join('\n'))
}

function requireText(value: string, label: string): string {
  const text = bounded(value)
  if (!text) throw new Error(`Completion summary is missing ${label}`)
  return text
}

function sameDigests(left: Record<string, string>, right: Map<string, string>): boolean {
  const entries = Object.entries(left)
  return entries.length > 0 && entries.every(([path, value]) => right.get(path) === value)
}

export class PortfolioModuleCompletionService {
  constructor(
    private readonly progressRepository: ProgressRepository,
    private readonly workspaceRepository: PortfolioWorkspaceRepository,
    private readonly practiceRunRepository: PracticeRunRepository,
    private readonly definitionRepository: PracticeDefinitionRepository,
    private readonly evidenceAdapter: PortfolioPlanningEvidenceAdapter,
    private readonly now: () => Date = () => new Date(),
    private readonly buildEvidenceAdapter?: PortfolioBuildEvidenceAdapter
  ) {}

  async completeModuleTwo(): Promise<LearnerProgress> {
    const progressResult = await this.progressRepository.load()
    if (progressResult.status !== 'returning' && progressResult.status !== 'recovered') {
      throw new Error('Learner progress is unavailable')
    }
    const progress = progressResult.progress
    if (progress.sceneId !== 'module-2-portfolio-mastery-summary') {
      throw new Error('Finish the Module 2 mastery assessment before completing the module')
    }

    const workspace = await this.workspaceRepository.load({ courseRunId: progress.courseRunId })
    if (workspace.status !== 'ready' || !workspace.selectedPath) {
      throw new Error('The selected portfolio workspace is not ready')
    }
    const canonicalPath = resolve(workspace.selectedPath)
    const record = await this.practiceRunRepository.load()
    const active = record.activeRun
    if (!active
      || active.practiceId !== 'm2-portfolio-planning'
      || active.practiceVersion !== '1.0.0'
      || resolve(active.binding.workspaceRoot) !== canonicalPath) {
      throw new Error('The active planning Practice does not match this portfolio workspace')
    }
    const definition = await this.definitionRepository.load(active.practiceId, active.practiceVersion)
    const fresh = await this.evidenceAdapter.collect({
      definition,
      runId: active.runId,
      generation: active.generation,
      workspaceRoot: canonicalPath,
      task: { threadId: active.binding.threadId, workspaceRoot: active.binding.workspaceRoot }
    })
    const planning = fresh.portfolioPlanning
    if (fresh.freshness !== 'fresh' || !planning
      || planning.issues.length > 0 || planning.unexpectedPaths.length > 0) {
      throw new Error('The current planning package has missing, invalid, or out-of-scope evidence')
    }
    if (planning.workspaceIdentityDigest !== practiceWorkspaceIdentityDigest(canonicalPath)) {
      throw new Error('The portfolio workspace identity changed')
    }
    const freshDigests = new Map(planning.artifacts.map((artifact) => [artifact.path, artifact.digest]))
    if (!portfolioPlanningArtifactPaths.every((path) => freshDigests.has(path))) {
      throw new Error('All seven current planning artifacts are required')
    }

    const receipts = active.stageReceipts ?? []
    if (receipts.length !== 5 || !definition.stages
      || !definition.stages.every((stage) => {
        const receipt = receipts.find((candidate) => candidate.stageId === stage.id)
        return receipt?.courseRunId === progress.courseRunId
          && receipt.stageIndex === stage.order
          && receipt.status === 'completed'
          && receipt.freshness === 'current'
          && receipt.workspace.identityDigest === planning.workspaceIdentityDigest
          && receipt.workspace.canonicalPath === canonicalPath
          && receipt.approval.approvedAt.length > 0
          && sameDigests(receipt.artifactDigests, freshDigests)
          && stage.requiredArtifactPaths.every((path) =>
            receipt.artifactDigests[path] === freshDigests.get(path))
      })) {
      throw new Error('Five current learner-approved stage receipts are required')
    }

    const masteryAnswers = masteryQuestionIds.map((questionId) => ({
      questionId,
      result: progress.decisions[`assessment:${questionId}`] ?? ''
    }))
    if (masteryAnswers.some(({ result }) => !result.startsWith('correct'))) {
      throw new Error('All Module 2 mastery evidence must be satisfied')
    }
    for (const questionId of writtenQuestionIds) {
      const result = progress.decisions[`assessment:${questionId}`] ?? ''
      if (!result.startsWith('correct:self-review:')
        || result.slice('correct:self-review:'.length).trim().length < 20) {
        throw new Error('Learner-owned mastery answers must be saved before completion')
      }
    }

    const contents = new Map<PortfolioPlanningArtifactPath, string>()
    await Promise.all(portfolioPlanningArtifactPaths.map(async (path) => {
      contents.set(path, await readFile(join(canonicalPath, path), 'utf8'))
    }))
    const brief = contents.get('planning/portfolio-brief.md') ?? ''
    const inventory = contents.get('planning/content-evidence-inventory.md') ?? ''
    const prd = contents.get('planning/PRD.md') ?? ''
    const firstTask = contents.get('planning/first-bounded-task.md') ?? ''
    const learnerDecision = requireText([
      section(brief, 'Người xem chính'),
      section(brief, 'Quyết định người xem cần đưa ra')
    ].filter(Boolean).join(' — '), 'learner decision')
    const evidenceBoundary = requireText([
      section(inventory, 'Khoảng trống bằng chứng'),
      section(inventory, 'Nội dung không được công khai')
    ].filter(Boolean).join(' — '), 'evidence boundary')
    const firstBuild = requireText(section(firstTask, 'Mục tiêu duy nhất'), 'first bounded build')
    const deliberatelyOutOfScope = requireText(section(prd, 'Ngoài phạm vi'), 'out-of-scope decision')
    const artifacts = portfolioPlanningArtifactPaths.map((path) => ({
      path,
      digest: freshDigests.get(path)!
    }))
    const completedAt = this.now().toISOString()
    const receipt: PracticeCompletionReceipt = {
      schemaVersion: 1,
      courseRunId: progress.courseRunId,
      practiceId: active.practiceId,
      practiceVersion: active.practiceVersion,
      runId: active.runId,
      checkpointId: 'm2-portfolio-complete',
      status: 'completed',
      completedAt,
      evidenceSummary: bounded(`Quyết định: ${learnerDecision} Bằng chứng còn thiếu hoặc bị giới hạn: ${evidenceBoundary} Xây trước: ${firstBuild} Ngoài phạm vi: ${deliberatelyOutOfScope}`, 1500),
      masterySummary: 'Đã đối chiếu 4 tình huống và lưu 1 câu trả lời do người học tự viết trên planning package hiện tại.',
      destination: {
        lessonId: 'module-3',
        checkpointId: 'm3-complete-first-version',
        sceneId: 'module-3-debugging-intro'
      },
      portfolioPlanningHandoff: {
        schemaVersion: 1,
        workspace: {
          canonicalPath,
          identityDigest: planning.workspaceIdentityDigest
        },
        artifacts,
        stageReceipts: receipts
          .sort((left, right) => left.stageIndex - right.stageIndex)
          .map((stageReceipt) => ({
            stageId: stageReceipt.stageId,
            stageIndex: stageReceipt.stageIndex,
            observedAt: stageReceipt.observedAt,
            artifactDigests: { ...stageReceipt.artifactDigests }
          })),
        mastery: {
          questionIds: [...masteryQuestionIds],
          answerDigest: digest(JSON.stringify(masteryAnswers))
        },
        summary: { learnerDecision, evidenceBoundary, firstBuild, deliberatelyOutOfScope },
        moduleThreeInput: {
          workspacePath: canonicalPath,
          artifactReferences: artifacts
        }
      }
    }
    return this.progressRepository.completePortfolioPlanning(receipt)
  }

  async completeModuleThree(): Promise<LearnerProgress> {
    if (!this.buildEvidenceAdapter) throw new Error('Module 3 evidence adapter is unavailable')
    const progressResult = await this.progressRepository.load()
    if (progressResult.status !== 'returning' && progressResult.status !== 'recovered') throw new Error('Learner progress is unavailable')
    const progress = progressResult.progress
    if (progress.sceneId !== 'module-3-mastery-summary') throw new Error('Finish Module 3 mastery before completing the module')
    const workspace = await this.workspaceRepository.load({ courseRunId: progress.courseRunId })
    if (workspace.status !== 'ready' || !workspace.selectedPath) throw new Error('The selected portfolio workspace is not ready')
    const canonicalPath = resolve(workspace.selectedPath)
    const record = await this.practiceRunRepository.load()
    const active = record.activeRun
    if (!active || active.practiceId !== 'm3-portfolio-build' || active.practiceVersion !== '1.0.0'
      || resolve(active.binding.workspaceRoot) !== canonicalPath) throw new Error('The active build Practice does not match this portfolio workspace')
    const definition = await this.definitionRepository.load(active.practiceId, active.practiceVersion)
    const fresh = await this.buildEvidenceAdapter.collect({
      definition, runId: active.runId, generation: active.generation, workspaceRoot: canonicalPath,
      task: { threadId: active.binding.threadId, workspaceRoot: active.binding.workspaceRoot }
    })
    const build = fresh.portfolioBuild
    if (fresh.freshness !== 'fresh' || !build || build.issues.length > 0 || build.unexpectedPaths.length > 0) {
      throw new Error('The current portfolio build has missing or invalid evidence')
    }
    const digests = new Map(build.artifacts.map((artifact) => [artifact.path, artifact.digest]))
    const requiredArtifacts = definition.stages?.flatMap((stage) => stage.requiredArtifactPaths) ?? []
    if (!requiredArtifacts.every((path) => digests.has(path))) throw new Error('All eight Module 3 artifacts are required')
    const receipts = active.stageReceipts ?? []
    if (receipts.length !== 5 || !definition.stages?.every((stage) => {
      const receipt = receipts.find((item) => item.stageId === stage.id)
      return receipt?.courseRunId === progress.courseRunId && receipt.freshness === 'current'
        && receipt.workspace.identityDigest === build.workspaceIdentityDigest
        && sameDigests(receipt.artifactDigests, digests)
    })) throw new Error('Five current stage receipts are required')
    const slices = active.buildSliceReceipts ?? []
    if (slices.length !== 4 || !slices.every((receipt, index) => receipt.courseRunId === progress.courseRunId
      && receipt.sliceIndex === index + 1 && receipt.freshness === 'current'
      && sameDigests(receipt.artifactDigests, digests))) throw new Error('Four current build slice receipts are required')
    const questionIds = [
      'm3-mastery-plan',
      'm3-mastery-visible-error',
      'm3-mastery-logs',
      'm3-mastery-repeated-error',
      'm3-mastery-branch'
    ]
    const answers = questionIds.map((id) => progress.decisions[`assessment:${id}`] ?? '')
    if (answers.some((answer) => !answer.startsWith('correct'))) {
      throw new Error('Module 3 mastery evidence is incomplete')
    }
    const sourceCheckpoint = receipts.find((item) => item.stageId === 'independent-enhancement')?.evidence.executorReportedChecks.find((item) => /checkpoint|commit/i.test(item))
      ?? `practice-${active.runId}`
    const completedAt = this.now().toISOString()
    return this.progressRepository.completePortfolioBuild({
      schemaVersion: 1,
      courseRunId: progress.courseRunId,
      practiceId: active.practiceId,
      practiceVersion: active.practiceVersion,
      runId: active.runId,
      checkpointId: 'm3-complete',
      status: 'completed',
      completedAt,
      evidenceSummary: 'Đã đối chiếu tám artifact, năm stage, bốn phần xây dựng, npm run check và bằng chứng trình duyệt hiện tại.',
      masterySummary: 'Đã lưu năm câu trả lời tổng kết Module 3.',
      destination: { lessonId: 'module-3', checkpointId: 'm3-complete', sceneId: 'module-3-complete' },
      portfolioBuildHandoff: {
        schemaVersion: 1,
        workspace: { canonicalPath, identityDigest: build.workspaceIdentityDigest },
        artifactDigests: Object.fromEntries(digests),
        stageReceiptIds: receipts.sort((a, b) => a.stageIndex - b.stageIndex).map((item) => item.stageId),
        buildSliceReceiptIds: slices.sort((a, b) => a.sliceIndex - b.sliceIndex).map((item) => item.sliceId),
        sourceCheckpoint,
        moduleFourInput: { workspacePath: canonicalPath, sourceCheckpoint }
      }
    })
  }
}
