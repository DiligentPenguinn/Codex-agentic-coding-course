import { execFile } from 'node:child_process'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { afterEach, describe, expect, it } from 'vitest'
import type {
  ExecutorActivitySnapshot,
  PracticeDefinition,
  WorkspaceEvidenceBaseline
} from '../shared/contracts'
import { PlanningPackageEvidenceAdapter } from '../electron/main/planning-package-evidence-adapter'
import { GitWorkspaceEvidenceProvider } from '../electron/main/workspace-evidence-provider'

const run = promisify(execFile)
const directories: string[] = []
const capturedAt = '2026-08-11T00:00:00.000Z'
const observedAt = new Date('2026-08-11T00:05:00.000Z')

const definition: PracticeDefinition = {
  schemaVersion: 2,
  practiceId: 'm2-planning-package',
  title: 'Xây dựng planning package',
  version: '2.0.0',
  checkpointId: 'm2-planning-package',
  objective: 'Tạo planning package.',
  expectedOutcome: 'PRD và implementation plan đã duyệt.',
  workspaceKind: 'pilot-workspace',
  taskPolicy: 'safe-workspace-write',
  evidenceProfile: 'planning-package',
  checklist: [
    { id: 'draft-prd', title: 'Soạn PRD', dependsOn: [] },
    { id: 'draft-plan', title: 'Soạn implementation plan', dependsOn: ['draft-prd'] }
  ],
  criteria: [{
    id: 'artifacts-ready',
    description: 'Hai artifact hợp lệ.',
    required: true,
    checklistStepId: 'draft-plan',
    acceptedEvidence: ['planning-artifact'],
    assertion: 'Both canonical planning artifacts are current.',
    freshness: 'fresh'
  }],
  completionDestination: {
    lessonId: 'module-2',
    checkpointId: 'm2-mastery',
    sceneId: 'module-2-mastery',
    label: 'Bài kiểm tra và hoàn thành Module 2'
  }
}

async function gitWorkspace(options: { preexistingDirty?: boolean; withHead?: boolean } = {}): Promise<{
  directory: string
  baseline: WorkspaceEvidenceBaseline
}> {
  const directory = await mkdtemp(join(tmpdir(), 'planning-evidence-'))
  directories.push(directory)
  await run('git', ['init'], { cwd: directory })
  await run('git', ['config', 'user.email', 'test@example.com'], { cwd: directory })
  await run('git', ['config', 'user.name', 'Test User'], { cwd: directory })
  await mkdir(join(directory, 'artifacts'))
  if (options.preexistingDirty) {
    await writeFile(join(directory, 'notes.txt'), 'preexisting dirt\n', 'utf8')
  }
  if (options.withHead) {
    await writeFile(join(directory, 'README.md'), '# Workspace\n', 'utf8')
    await run('git', ['add', 'README.md'], { cwd: directory })
    await run('git', ['commit', '-m', 'baseline'], { cwd: directory })
  }
  const baseline = await new GitWorkspaceEvidenceProvider().capture(directory, capturedAt)
  return { directory, baseline }
}

function activity(
  baseline: WorkspaceEvidenceBaseline,
  overrides: Partial<ExecutorActivitySnapshot> = {}
): ExecutorActivitySnapshot {
  return {
    schemaVersion: 1,
    runId: 'run-2',
    threadId: 'thread-2',
    status: 'response-ready',
    cursor: 'turn:item',
    learnerPrompts: [],
    executorResponses: [],
    approvalEvents: [],
    changedFiles: [],
    verificationEvidence: [],
    reportedChangedFiles: [],
    reportedVerificationEvidence: [],
    workspaceConfirmedChangedFiles: [],
    workspaceCommittedReportedFilesSinceRunStart: [],
    workspaceCurrentlyDirtyReportedFiles: [],
    observedAt: capturedAt,
    workspaceBaseline: baseline,
    configuration: null,
    ...overrides
  }
}

function adapterFor(
  directory: string,
  current: () => Promise<ExecutorActivitySnapshot | null>
): PlanningPackageEvidenceAdapter {
  return new PlanningPackageEvidenceAdapter(
    { current },
    undefined,
    undefined,
    () => observedAt
  )
}

function context(directory: string) {
  return {
    definition,
    runId: 'run-2',
    generation: 1,
    workspaceRoot: directory,
    task: { threadId: 'thread-2', workspaceRoot: directory }
  }
}

async function writePlanningPackage(directory: string): Promise<void> {
  await writeFile(
    join(directory, 'artifacts', 'PRD.md'),
    '# PRD\n\n## Vấn đề\nNgười dùng cần một workflow rõ ràng.\n',
    'utf8'
  )
  await writeFile(
    join(directory, 'artifacts', 'implementation-plan.md'),
    '# Implementation plan\n\n1. Xác nhận phạm vi.\n2. Kiểm thử kết quả.\n',
    'utf8'
  )
}

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) =>
    rm(directory, { recursive: true, force: true })))
})

describe('PlanningPackageEvidenceAdapter', () => {
  it('returns fresh canonical artifact evidence for the bound run', async () => {
    const { directory, baseline } = await gitWorkspace()
    await writePlanningPackage(directory)
    const result = await adapterFor(
      directory,
      async () => activity(baseline)
    ).collect(context(directory))

    expect(result.freshness).toBe('fresh')
    expect(result.artifactIssues).toEqual([])
    expect(result.unexpectedChangedPaths).toEqual([])
    expect(result.planningArtifacts?.map((item) => item.path)).toEqual([
      'artifacts/PRD.md',
      'artifacts/implementation-plan.md'
    ])
    expect(result.evidence).toHaveLength(2)
    expect(result.evidence.every((item) => item.kind === 'planning-artifact')).toBe(true)
  })

  it('reports unexpected paths without reading their contents and blocks freshness', async () => {
    const { directory, baseline } = await gitWorkspace()
    await writePlanningPackage(directory)
    await writeFile(join(directory, 'private.txt'), 'TOKEN=never-expose-this', 'utf8')

    const result = await adapterFor(
      directory,
      async () => activity(baseline)
    ).collect(context(directory))

    expect(result.freshness).toBe('unverifiable')
    expect(result.unexpectedChangedPaths).toContain('private.txt')
    expect(result.evidence).toContainEqual(expect.objectContaining({
      kind: 'unexpected-workspace-change',
      text: 'private.txt'
    }))
    expect(JSON.stringify(result)).not.toContain('never-expose-this')
  })

  it('records bounded learner-authored prompt and interview provenance without the bootstrap turn', async () => {
    const { directory, baseline } = await gitWorkspace()
    await writePlanningPackage(directory)
    const result = await adapterFor(
      directory,
      async () => activity(baseline, {
        cursor: 'turn-3:item-2',
        learnerPrompts: [
          'Thực hiện Practice m2-planning-package. Mục tiêu bootstrap.',
          'Hãy phỏng vấn tôi từng câu. TOKEN=private-prompt-value',
          'Đối tượng là content creator.'
        ],
        executorResponses: ['Câu hỏi đầu tiên là gì?']
      })
    ).collect(context(directory))

    expect(result.planningActivity).toMatchObject({
      cursor: 'turn-3:item-2',
      learnerTurnCount: 2,
      executorTurnCount: 1,
      prdPrompt: {
        text: 'Hãy phỏng vấn tôi từng câu. TOKEN=[REDACTED]'
      }
    })
    expect(result.planningActivity?.prdPrompt?.digest).toMatch(/^[a-f0-9]{64}$/)
    expect(JSON.stringify(result)).not.toContain('private-prompt-value')
  })

  it('ignores unrelated dirt that existed unchanged at the Practice baseline', async () => {
    const { directory, baseline } = await gitWorkspace({ preexistingDirty: true })
    await writePlanningPackage(directory)

    const result = await adapterFor(
      directory,
      async () => activity(baseline)
    ).collect(context(directory))

    expect(result.freshness).toBe('fresh')
    expect(result.unexpectedChangedPaths).toEqual([])
  })

  it('detects canonical artifacts committed after the baseline', async () => {
    const { directory, baseline } = await gitWorkspace({ withHead: true })
    await writePlanningPackage(directory)
    await run('git', ['add', 'artifacts/PRD.md', 'artifacts/implementation-plan.md'], { cwd: directory })
    await run('git', ['commit', '-m', 'add planning package'], { cwd: directory })

    const result = await adapterFor(
      directory,
      async () => activity(baseline)
    ).collect(context(directory))

    expect(result.freshness).toBe('fresh')
    expect(result.planningArtifacts).toHaveLength(2)
  })

  it('keeps artifact and source digests stable across adapter restart', async () => {
    const { directory, baseline } = await gitWorkspace({ withHead: true })
    await writePlanningPackage(directory)
    const current = async () => activity(baseline)

    const first = await adapterFor(directory, current).collect(context(directory))
    const second = await adapterFor(directory, current).collect(context(directory))

    expect(second.sourceDigest).toBe(first.sourceDigest)
    expect(second.planningArtifacts?.map((item) => item.digest))
      .toEqual(first.planningArtifacts?.map((item) => item.digest))
  })

  it('fails closed for a missing artifact, wrong task identity, or stale connection', async () => {
    const { directory, baseline } = await gitWorkspace()
    await writeFile(join(directory, 'artifacts', 'PRD.md'), '# PRD\n', 'utf8')
    const missing = await adapterFor(
      directory,
      async () => activity(baseline)
    ).collect(context(directory))
    expect(missing.freshness).toBe('unverifiable')
    expect(missing.artifactIssues).toContainEqual(expect.objectContaining({
      path: 'artifacts/implementation-plan.md',
      code: 'missing'
    }))

    await writeFile(
      join(directory, 'artifacts', 'implementation-plan.md'),
      '# Implementation plan\n',
      'utf8'
    )
    const wrongTask = await adapterFor(
      directory,
      async () => activity(baseline, { threadId: 'thread-other' })
    ).collect(context(directory))
    expect(wrongTask.freshness).toBe('unverifiable')
    expect(wrongTask.evidence).toEqual([])

    const stale = await adapterFor(
      directory,
      async () => activity(baseline, { status: 'disconnected' })
    ).collect(context(directory))
    expect(stale.freshness).toBe('stale')
    expect(stale.evidence.every((item) => item.freshness === 'stale')).toBe(true)
  })
})
