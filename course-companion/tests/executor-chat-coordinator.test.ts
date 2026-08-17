import { describe, expect, it } from 'vitest'
import type { ApprovedCodexConfiguration, PracticeDefinition } from '../shared/contracts'
import {
  ExecutorChatCoordinator,
  type CodexRequestClient
} from '../electron/main/executor-chat-coordinator'
import type { ExecutorChatBinding } from '../electron/main/practice-run-repository'

const approved: ApprovedCodexConfiguration = {
  schemaVersion: 1,
  sourcePracticeId: 'm1-codex-safe-setup',
  sourcePracticeVersion: '2.0.0',
  model: 'gpt-5.6-sol',
  reasoningEffort: 'high',
  serviceTier: 'standard',
  approvedAt: '2026-08-10T00:00:00.000Z'
}

function definition(policy: 'inherit-configuration-only' | 'safe-workspace-write'): PracticeDefinition {
  const moduleTwo = policy === 'safe-workspace-write'
  return {
    schemaVersion: 2,
    practiceId: moduleTwo ? 'm2-planning-package' : 'm1-codex-safe-setup',
    title: moduleTwo ? 'Xây dựng planning package' : 'Thiết lập Codex an toàn',
    version: '2.0.0',
    checkpointId: moduleTwo ? 'm2-planning-package' : 'm1-setup-checklist',
    objective: 'Hoàn thành mục tiêu Practice.',
    expectedOutcome: 'Tạo kết quả có thể duyệt.',
    workspaceKind: 'pilot-workspace',
    taskPolicy: policy,
    evidenceProfile: moduleTwo ? 'planning-package' : 'codex-task-configuration',
    checklist: [{ id: 'start', title: 'Bắt đầu', dependsOn: [] }],
    criteria: [],
    completionDestination: moduleTwo
      ? { lessonId: 'module-2', checkpointId: 'm2-mastery', sceneId: 'module-2-mastery', label: 'Bài kiểm tra và hoàn thành Module 2' }
      : { lessonId: 'module-1', checkpointId: 'm1-mastery', sceneId: 'module-1-mastery', label: 'Phần tổng kết Module 1' }
  }
}

function effective(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    thread: { id: 'thread-target' },
    cwd: 'D:\\course\\pilot-workspace',
    model: 'gpt-5.6-sol',
    reasoningEffort: 'high',
    serviceTier: null,
    approvalPolicy: 'on-request',
    sandbox: { type: 'workspaceWrite', writableRoots: ['D:\\course\\pilot-workspace'] },
    ...overrides
  }
}

function binding(name = 'Practice · Module 1 · m1-codex-safe-setup · 123456'): ExecutorChatBinding {
  return {
    runId: 'run-123456',
    threadId: 'thread-target',
    name,
    workspaceRoot: 'D:\\course\\pilot-workspace',
    createdAt: '2026-08-10T00:00:00.000Z'
  }
}

function coordinator(client: CodexRequestClient): ExecutorChatCoordinator {
  return new ExecutorChatCoordinator(
    client,
    { resolve: async () => 'D:\\course\\pilot-workspace' },
    async () => undefined,
    () => new Date('2026-08-10T00:00:00.000Z'),
    { attempts: 2, intervalMs: 0, wait: async () => undefined }
  )
}

describe('ExecutorChatCoordinator', () => {
  it('creates a Practice-aware Module 1 task without configuration overrides', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        return method === 'thread/start' ? effective({ sandbox: { type: 'dangerFullAccess' } }) : {}
      },
      async close() {}
    }

    const target = await coordinator(client).createTarget({
      runId: 'run-123456',
      definition: definition('inherit-configuration-only')
    })

    expect(target).toMatchObject(binding())
    expect(target.configuration).toMatchObject({
      runId: 'run-123456',
      threadId: 'thread-target',
      source: 'thread-start',
      fullAccess: { protocolValue: 'on', label: 'On' }
    })
    expect(calls[0]).toEqual(['thread/start', {
      cwd: 'D:\\course\\pilot-workspace',
      ephemeral: false,
      serviceName: 'content_builder_academy_practice'
    }])
    expect(calls[0]![1]).not.toHaveProperty('model')
    expect(calls[0]![1]).not.toHaveProperty('config')
    expect(calls[0]![1]).not.toHaveProperty('serviceTier')
    expect(calls[0]![1]).not.toHaveProperty('approvalPolicy')
    expect(calls[0]![1]).not.toHaveProperty('sandbox')
    expect(calls[1]).toEqual(['thread/name/set', {
      threadId: 'thread-target',
      name: 'Practice · Module 1 · m1-codex-safe-setup · 123456'
    }])
  })

  it('sends no turn while preparing an inherit-configuration-only task', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        if (method === 'thread/read') return { thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace', turns: [] } }
        return {}
      },
      async close() {}
    }

    await coordinator(client).prepareTarget(binding(), definition('inherit-configuration-only'))

    expect(calls).toEqual([['thread/read', { threadId: 'thread-target', includeTurns: false }]])
    expect(calls.map(([method]) => method)).not.toContain('turn/start')
  })

  it('creates a safe later task from the approved configuration and starts one instructional turn', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        if (method === 'thread/start') return effective()
        if (method === 'thread/read') return { thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace', turns: [] } }
        return {}
      },
      async close() {}
    }
    const instance = coordinator(client)
    const target = await instance.createTarget({
      runId: 'run-123456',
      definition: definition('safe-workspace-write'),
      approvedConfiguration: approved
    })
    await instance.prepareTarget(target, definition('safe-workspace-write'))

    expect(calls[0]).toEqual(['thread/start', {
      cwd: 'D:\\course\\pilot-workspace',
      ephemeral: false,
      serviceName: 'content_builder_academy_practice',
      model: 'gpt-5.6-sol',
      serviceTier: 'standard',
      approvalPolicy: 'on-request',
      sandbox: 'workspace-write',
      config: { model_reasoning_effort: 'high' }
    }])
    expect(target.name).toBe('Practice · Module 2 · m2-planning-package · 123456')
    expect(calls.filter(([method]) => method === 'turn/start')).toHaveLength(1)
  })

  it('blocks a safe task before thread/start when the Module 1 receipt is missing', async () => {
    const calls: string[] = []
    const client: CodexRequestClient = {
      async request(method) { calls.push(method); return {} },
      async close() {}
    }

    await expect(coordinator(client).createTarget({
      runId: 'run-123456',
      definition: definition('safe-workspace-write')
    })).rejects.toThrow('Approved Module 1 configuration is required')
    expect(calls).toEqual([])
  })

  it.each([
    ['unsafe permissions', { sandbox: { type: 'dangerFullAccess' } }],
    ['wrong approval policy', { approvalPolicy: 'never' }],
    ['wrong model', { model: 'gpt-5.6-terra' }],
    ['wrong effort', { reasoningEffort: 'medium' }],
    ['wrong workspace', { cwd: 'D:\\other' }],
  ])('rejects %s before naming or starting a turn', async (_label, overrides) => {
    const calls: string[] = []
    const client: CodexRequestClient = {
      async request(method) { calls.push(method); return effective(overrides) },
      async close() {}
    }

    await expect(coordinator(client).createTarget({
      runId: 'run-123456',
      definition: definition('safe-workspace-write'),
      approvedConfiguration: approved
    })).rejects.toThrow()
    expect(calls).toEqual(['thread/start'])
  })

  it('does not duplicate the later-task turn when retry discovers existing turns', async () => {
    const calls: string[] = []
    const client: CodexRequestClient = {
      async request(method) {
        calls.push(method)
        return { thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace', turns: [{ id: 'existing' }] } }
      },
      async close() {}
    }

    await coordinator(client).prepareTarget(
      binding('Practice · Module 2 · m2-planning-package · 123456'),
      definition('safe-workspace-write')
    )
    expect(calls).toEqual(['thread/read'])
  })

  it('bootstraps one reusable staged portfolio task without planning-package assumptions', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        if (method === 'thread/read') {
          return { thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace', turns: [] } }
        }
        return {}
      },
      async close() {}
    }
    const staged: PracticeDefinition = {
      ...definition('safe-workspace-write'),
      practiceId: 'm3-portfolio-build',
      version: '1.0.0',
      workspaceKind: 'learner-portfolio',
      evidenceProfile: 'portfolio-build',
      stages: Array.from({ length: 5 }, (_, index) => ({
        id: `stage-${index + 1}`,
        order: (index + 1) as 1 | 2 | 3 | 4 | 5,
        dependsOn: index === 0 ? [] : [`stage-${index}`],
        requiredArtifactPaths: [`evidence/module-3/stage-${index + 1}.md`]
      }))
    }

    await coordinator(client).prepareTarget(binding(), staged)

    const turn = calls.find(([method]) => method === 'turn/start')?.[1]
    expect(JSON.stringify(turn)).toContain('cả năm stage')
    expect(JSON.stringify(turn)).toContain('không tạo task mới')
    expect(JSON.stringify(turn)).not.toContain('artifacts/PRD.md')
    expect(calls.filter(([method]) => method === 'turn/start')).toHaveLength(1)
  })

  it('limits the portfolio-planning bootstrap to approved artifacts and reference screenshots', async () => {
    const calls: Array<[string, Record<string, unknown>]> = []
    const client: CodexRequestClient = {
      async request(method, params = {}) {
        calls.push([method, params])
        if (method === 'thread/read') {
          return { thread: { id: 'thread-target', cwd: 'D:\\course\\pilot-workspace', turns: [] } }
        }
        return {}
      },
      async close() {}
    }
    const paths = [
      'planning/portfolio-brief.md',
      'planning/content-evidence-inventory.md',
      'planning/reference/reference.md',
      'planning/PRD.md',
      'planning/requirement-validation-map.md',
      'planning/implementation-plan.md',
      'planning/first-task-brief.md'
    ]
    const staged: PracticeDefinition = {
      ...definition('safe-workspace-write'),
      practiceId: 'm2-portfolio-planning',
      version: '1.0.0',
      workspaceKind: 'learner-portfolio',
      evidenceProfile: 'portfolio-planning',
      stages: Array.from({ length: 5 }, (_, index) => ({
        id: `stage-${index + 1}`,
        order: (index + 1) as 1 | 2 | 3 | 4 | 5,
        dependsOn: index === 0 ? [] : [`stage-${index}`],
        requiredArtifactPaths: index < 3 ? [paths[index]!] : index === 3 ? [paths[3]!] : paths.slice(4)
      }))
    }

    await coordinator(client).prepareTarget(binding(), staged)

    const instruction = JSON.stringify(calls.find(([method]) => method === 'turn/start')?.[1])
    for (const path of paths) expect(instruction).toContain(path)
    expect(instruction).toContain('planning/reference/screenshots/')
    expect(instruction).toContain('Không tạo application code')
    expect(instruction).toContain('không tạo task mới')
    expect(calls.filter(([method]) => method === 'turn/start')).toHaveLength(1)
  })
})
