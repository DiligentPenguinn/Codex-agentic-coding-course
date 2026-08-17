import { resolve } from 'node:path'
import type {
  ApprovedCodexConfiguration,
  PracticeDefinition
} from '../../shared/contracts'
import type { ExecutorChatBinding } from './practice-run-repository'
import {
  buildPracticeTaskStartPlan,
  parseEffectivePracticeTask,
  validateEffectivePracticeTask
} from './practice-task-policy'
import type { PracticeWorkspaceResolverPort } from './practice-workspace-resolver'
import { normalizeCodexTaskConfiguration } from './codex-configuration-normalizer'

export type CodexRequestClient = {
  request: (method: string, params?: Record<string, unknown>) => Promise<unknown>
  close?: () => Promise<void>
}

type OpenExternal = (url: string) => Promise<void>
type DiscoveryOptions = {
  attempts?: number
  intervalMs?: number
  wait?: (milliseconds: number) => Promise<void>
}

const THREAD_ID = /^[A-Za-z0-9_-]{1,160}$/
const defaultWait = (milliseconds: number): Promise<void> => new Promise((resolve) => {
  setTimeout(resolve, milliseconds)
})

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function samePath(left: unknown, right: string): boolean {
  if (typeof left !== 'string') return false
  return resolve(left).replaceAll('/', '\\').toLocaleLowerCase('en-US') ===
    resolve(right).replaceAll('/', '\\').toLocaleLowerCase('en-US')
}

export class ExecutorChatCoordinator {
  constructor(
    private readonly client: CodexRequestClient,
    private readonly workspaces: PracticeWorkspaceResolverPort,
    private readonly openExternal: OpenExternal,
    private readonly now: () => Date = () => new Date(),
    private readonly discovery: DiscoveryOptions = {}
  ) {}

  async createTarget(input: {
    runId: string
    definition: PracticeDefinition
    approvedConfiguration?: ApprovedCodexConfiguration
  }): Promise<ExecutorChatBinding> {
    const workspaceRoot = await this.workspaces.resolve(input.definition.workspaceKind)
    const plan = buildPracticeTaskStartPlan({
      ...input,
      workspaceRoot
    })
    return this.withBootstrap(async () => {
      const started = await this.client.request('thread/start', plan.startParams)
      const effective = parseEffectivePracticeTask(started)
      if (!THREAD_ID.test(effective.threadId)) {
        throw new Error('Codex created an invalid Executor chat')
      }
      validateEffectivePracticeTask({
        effective,
        plan,
        workspaceRoot,
        samePath,
        approvedConfiguration: input.approvedConfiguration
      })
      const threadId = effective.threadId
      const name = plan.name
      await this.client.request('thread/name/set', { threadId, name })
      const observed = this.now()
      return {
        runId: input.runId,
        threadId,
        name,
        workspaceRoot,
        createdAt: observed.toISOString(),
        configuration: normalizeCodexTaskConfiguration({
          runId: input.runId,
          threadId,
          source: 'thread-start',
          payload: started,
          observedAt: observed.toISOString(),
          eventTimestampMs: observed.getTime()
        })
      }
    })
  }

  async prepareTarget(
    binding: ExecutorChatBinding,
    definition: PracticeDefinition
  ): Promise<void> {
    const workspaceRoot = await this.workspaces.resolve(definition.workspaceKind)
    if (!THREAD_ID.test(binding.threadId) || !samePath(binding.workspaceRoot, workspaceRoot)) {
      throw new Error('Invalid Executor chat binding')
    }
    await this.withBootstrap(async () => {
      const thread = await this.waitUntilReadable(
        binding.threadId,
        workspaceRoot,
        definition.taskPolicy === 'safe-workspace-write'
      )
      if (definition.taskPolicy === 'safe-workspace-write') {
        const turns = Array.isArray(thread.turns) ? thread.turns : []
        if (turns.length === 0) {
          await this.client.request('turn/start', {
            threadId: binding.threadId,
            input: [{
              type: 'text',
              text: [
                'Thực hiện Practice ' + definition.practiceId + '.',
                'Mục tiêu: ' + definition.objective,
                'Kết quả cần đạt: ' + definition.expectedOutcome,
                'Chỉ làm trong phạm vi Practice và dừng tại mọi điểm cần người học duyệt.',
                ...(definition.evidenceProfile === 'planning-package'
                  ? [
                      'Chỉ được thay đổi artifacts/PRD.md và artifacts/implementation-plan.md; không viết implementation code.',
                      'Dùng chính task này cho toàn bộ Practice, phỏng vấn từng câu một, và chờ các nút phê duyệt trong Course Companion. Tin nhắn trong chat không thay thế phê duyệt của người học.'
                    ]
                  : definition.stages
                    ? [
                        'Dùng chính task này cho cả năm stage; không tạo task mới cho từng milestone.',
                        'Dừng sau mỗi stage để Course Companion đối chiếu artifact hiện tại và ghi nhận phê duyệt. Kết quả do Codex tự báo cáo không thay thế bằng chứng tệp được kiểm tra độc lập.',
                        ...(definition.evidenceProfile === 'portfolio-planning'
                          ? [
                              `Chỉ được tạo hoặc sửa các tệp sau: ${definition.stages.flatMap((stage) => stage.requiredArtifactPaths).join(', ')}; ảnh chụp tham chiếu chỉ được lưu dưới planning/reference/screenshots/.`,
                              'Không tạo application code, package manifest, dependency, build output, cấu hình deployment hoặc tệp nào khác. Nếu cần việc ngoài phạm vi, hãy dừng và báo cho người học.'
                            ]
                          : [])
                      ]
                    : [])
              ].join('\n\n')
            }]
          })
        }
      }
    })
  }

  private async waitUntilReadable(
    threadId: string,
    workspaceRoot: string,
    includeTurns: boolean
  ): Promise<Record<string, unknown>> {
    const attempts = Math.max(1, this.discovery.attempts ?? 30)
    const intervalMs = Math.max(0, this.discovery.intervalMs ?? 100)
    const wait = this.discovery.wait ?? defaultWait
    for (let attempt = 0; attempt < attempts; attempt += 1) {
      try {
        const read = await this.client.request('thread/read', {
          threadId,
          includeTurns
        })
        if (isRecord(read) && isRecord(read.thread) && read.thread.id === threadId &&
          samePath(read.thread.cwd, workspaceRoot)) return read.thread
      } catch {
        // State persistence can briefly lag process startup; retry the exact read only.
      }
      if (attempt + 1 < attempts) await wait(intervalMs)
    }
    throw new Error('Codex could not read the Executor chat after creation')
  }

  async openTarget(binding: ExecutorChatBinding): Promise<void> {
    if (!THREAD_ID.test(binding.threadId)) throw new Error('Invalid Executor chat ID')
    await this.openExternal(`codex://threads/${encodeURIComponent(binding.threadId)}`)
  }

  private async withBootstrap<T>(operation: () => Promise<T>): Promise<T> {
    let result: T | undefined
    let operationFailed = false
    let operationError: unknown
    try {
      result = await operation()
    } catch (error) {
      operationFailed = true
      operationError = error
    }
    let closeError: unknown
    try {
      await this.client.close?.()
    } catch (error) {
      closeError = error
    }
    if (operationFailed) throw operationError
    if (closeError !== undefined) {
      throw new Error('Codex Executor bootstrap did not close', { cause: closeError })
    }
    return result as T
  }
}
