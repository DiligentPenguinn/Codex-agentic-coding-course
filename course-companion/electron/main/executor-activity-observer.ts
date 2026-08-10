import { isAbsolute, normalize, relative, resolve } from 'node:path'
import type { ExecutorActivitySnapshot, WorkspaceEvidenceBaseline } from '../../shared/contracts'
import type { CodexConnectionState, CodexNotification } from './codex-app-server-client'
import type { ExecutorChatBinding } from './practice-run-repository'
import { ExecutorActivityRepository } from './executor-activity-repository'
import { GitWorkspaceEvidenceProvider, type WorkspaceEvidenceProvider } from './workspace-evidence-provider'

export type ObservationClient = {
  request: (method: string, params?: Record<string, unknown>) => Promise<unknown>
  onNotification: (listener: (notification: CodexNotification) => void) => () => void
  onConnectionState: (listener: (state: CodexConnectionState) => void) => () => void
}

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value) ? value as Record<string, unknown> : null
}

function bounded(value: unknown, maximum = 4_000): string {
  const normalized = typeof value === 'string' ? value.replaceAll(/\s+/g, ' ').trim() : ''
  const points = [...normalized]
  return points.length <= maximum ? normalized : `${points.slice(0, maximum - 1).join('')}…`
}

function appendUnique(items: string[], value: string, maximum = 50): string[] {
  if (!value) return items
  return [...new Set([...items, value])].slice(-maximum)
}

function mergeUnique(first: string[], second: string[], maximum: number): string[] {
  return [...new Set([...first, ...second])].slice(-maximum)
}

function safeRelativePath(value: unknown, workspaceRoot: string): string | null {
  if (typeof value !== 'string' || !value.trim()) return null
  const withoutLocation = value.trim().replace(/^['"`]|['"`,.;]$/g, '').replace(/:\d+(?::\d+)?$/, '')
  if (!withoutLocation || withoutLocation.length > 500) return null
  const absolute = isAbsolute(withoutLocation) ? normalize(withoutLocation) : resolve(workspaceRoot, withoutLocation)
  const result = relative(workspaceRoot, absolute).replaceAll('\\', '/')
  if (!result || result.startsWith('..') || isAbsolute(result) || result.split('/').includes('..')) return null
  return result.length <= 500 ? result : null
}

function textContent(item: Record<string, unknown>): string {
  const content = Array.isArray(item.content) ? item.content : []
  return bounded(content.map((entry) => record(entry)).filter(Boolean).filter((entry) => entry?.type === 'text').map((entry) => entry?.text).join(' '))
}

function deniesChangedFileClaim(line: string): boolean {
  const normalized = line.toLowerCase().replace(/[’]/g, "'")
  return (
    /\bno files? (?:were )?(?:changed|updated|modified)\b/.test(normalized)
    || /\b(?:did|does|was|were|is|are|have|has) not (?:been )?(?:change|changed|modify|modified|update|updated)\b/.test(normalized)
    || /\bnot (?:been )?(?:changed|updated|modified)\b/.test(normalized)
    || /\b(?:didn't|doesn't|wasn't|weren't|isn't|aren't|haven't|hasn't)\b.*\b(?:change|changed|modify|modified|update|updated)\b/.test(normalized)
    || /\bwithout changing\b/.test(normalized)
    || /\bunchanged\b/.test(normalized)
    || /\b(?:only|just|merely) (?:reviewed|inspected|read|opened)\b/.test(normalized)
    || /\b(?:reviewed|inspected|read|opened)\b.*\bonly\b/.test(normalized)
    || /^[-*]?\s*(?:planned|proposed|intended|future|next)\b/.test(normalized)
    || /\b(?:plan(?:ned)?|propose(?:d)?|intend(?:ed)?|will|would)\b.*\b(?:change|changed|modify|modified|update|updated|create|created|add|added|delete|deleted|remove|removed|rename|renamed|move|moved)\b/.test(normalized)
  )
}

function reportFacts(text: string, workspaceRoot: string): { changedFiles: string[]; evidence: string[] } {
  const changedFiles: string[] = []
  const evidence: string[] = []
  let section: 'changed' | 'verification' | null = null
  for (const sourceLine of text.split(/\r?\n/)) {
    const line = sourceLine.trim()
    if (!line) continue
    const heading = line.replace(/^#{1,6}\s*/, '').replaceAll('*', '').replaceAll('_', '').replace(/:$/, '').trim().toLowerCase()
    if (/^(changed|changed files?|files? changed)$/.test(heading)) {
      section = 'changed'
      continue
    }
    if (/^(verification|validation|checks?|evidence)$/.test(heading)
      || (/\b390\s*px\b/.test(heading) && /\b(?:audit|viewport|overflow)\b/.test(heading))) {
      section = 'verification'
      continue
    }
    if (/^#{1,6}\s/.test(line) || /^\*\*[^*]+\*\*$/.test(line)) section = null

    const pathOnlyChangedLine = section === 'changed' && /^[-*]\s*(?:`[^`\r\n]{1,500}`|[A-Za-z]:[\\/][^\s"'<>|]{1,500}|(?:[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.-]+\.[A-Za-z0-9]{1,16})(?:[.,;:]?)$/.test(line)
    const changedLine = pathOnlyChangedLine || /\b(?:changed|updated|modified|created|added|deleted|removed|renamed|moved)\b/i.test(line)
    if (changedLine && !deniesChangedFileClaim(line)) {
      const candidates = [
        ...line.matchAll(/`([^`\r\n]{1,500})`/g),
        ...line.matchAll(/([A-Za-z]:[\\/][^\s`"'<>|]{1,500}|(?:[A-Za-z0-9_.-]+[\\/])+[A-Za-z0-9_.-]+\.[A-Za-z0-9]{1,16}(?::\d+(?::\d+)?)?)/g)
      ].map((match) => match[1] ?? match[0])
      for (const candidate of candidates) {
        const cleaned = candidate.trim().replace(/:\d+(?::\d+)?$/, '')
        if (!/[\\/]/.test(cleaned) && !/\.[A-Za-z0-9]{1,16}$/.test(cleaned) && !/^(?:Dockerfile|Makefile|LICENSE)$/i.test(cleaned)) continue
        const path = safeRelativePath(candidate, workspaceRoot)
        if (path) changedFiles.push(path)
      }
    }

    if (
      section === 'verification'
      || (/\b(?:npm|pnpm|yarn|test|lint|build|typecheck|viewport|overflow|scrollWidth|innerWidth)\b/i.test(line)
        && /\b(?:pass(?:ed)?|fail(?:ed)?|false|true|\d+px|\d+\s+tests?)\b/i.test(line))
    ) {
      const value = bounded(line.replace(/^[-*]\s*/, ''), 500)
      if (value) evidence.push(value)
    }
  }
  return {
    changedFiles: [...new Set(changedFiles)].slice(-100),
    evidence: [...new Set(evidence)].slice(-100)
  }
}

export function initialActivity(
  binding: ExecutorChatBinding,
  now = () => new Date(),
  workspaceBaseline: WorkspaceEvidenceBaseline | null = null
): ExecutorActivitySnapshot {
  return {
    schemaVersion: 1,
    runId: binding.runId,
    threadId: binding.threadId,
    status: 'ready',
    cursor: 'initial',
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
    observedAt: now().toISOString(),
    workspaceBaseline
  }
}

export function reduceExecutorActivity(
  snapshot: ExecutorActivitySnapshot,
  notification: CodexNotification,
  binding: ExecutorChatBinding,
  now = () => new Date()
): ExecutorActivitySnapshot {
  const params = record(notification.params)
  if (!params || params.threadId !== binding.threadId) return snapshot
  const next = structuredClone(snapshot)
  if (notification.method === 'turn/started' || notification.method === 'item/started') next.status = 'working'
  if (notification.method === 'thread/closed' || notification.method === 'thread/archived') next.status = 'disconnected'
  if (notification.method === 'thread/status/changed') {
    const status = record(params.status)
    const flags = status && Array.isArray(status.activeFlags) ? status.activeFlags : []
    if (flags.includes('waitingOnApproval') || flags.includes('waitingOnUserInput')) {
      next.status = 'waiting-for-learner'
      next.approvalEvents = appendUnique(next.approvalEvents, 'Executor is waiting for learner approval or input.')
    } else if (status?.type === 'active') next.status = 'working'
    else if (status?.type === 'systemError') next.status = 'disconnected'
  }
  if (notification.method === 'turn/completed') {
    const turn = record(params.turn)
    next.status = turn?.status === 'completed' ? 'response-ready' : 'ready'
  }
  if (notification.method === 'item/completed') {
    const item = record(params.item)
    if (item) {
      next.cursor = `${String(params.turnId ?? '')}:${String(item.id ?? '')}`.slice(0, 500)
      if (item.type === 'userMessage') next.learnerPrompts = appendUnique(next.learnerPrompts, textContent(item))
      if (item.type === 'agentMessage' && (item.phase === 'final_answer' || item.phase === undefined)) {
        const answer = bounded(item.text)
        next.executorResponses = appendUnique(next.executorResponses, answer)
        const facts = reportFacts(typeof item.text === 'string' ? item.text : '', binding.workspaceRoot)
        next.reportedChangedFiles = mergeUnique(next.reportedChangedFiles, facts.changedFiles, 100)
        next.reportedVerificationEvidence = mergeUnique(next.reportedVerificationEvidence, facts.evidence, 100)
        next.status = 'response-ready'
      }
      if (item.type === 'fileChange' && Array.isArray(item.changes)) {
        for (const change of item.changes) {
          const changedPath = safeRelativePath(record(change)?.path, binding.workspaceRoot)
          if (changedPath) next.changedFiles = appendUnique(next.changedFiles, changedPath, 100)
        }
      }
      if (item.type === 'commandExecution') {
        const command = Array.isArray(item.command) ? item.command.join(' ') : typeof item.command === 'string' ? item.command : ''
        const output = typeof item.aggregatedOutput === 'string' ? item.aggregatedOutput : ''
        const receipt = bounded([command, output].filter(Boolean).join(' — '), 500)
        if (/test|lint|build|typecheck|viewport|overflow|scrollWidth|innerWidth/i.test(receipt)) {
          next.verificationEvidence = appendUnique(next.verificationEvidence, receipt, 100)
        }
      }
    }
  }
  next.observedAt = now().toISOString()
  return next
}

function mergeActivity(
  previous: ExecutorActivitySnapshot,
  projected: ExecutorActivitySnapshot
): ExecutorActivitySnapshot {
  return {
    ...projected,
    cursor: projected.cursor === 'initial' ? previous.cursor : projected.cursor,
    learnerPrompts: mergeUnique(previous.learnerPrompts, projected.learnerPrompts, 50),
    executorResponses: mergeUnique(previous.executorResponses, projected.executorResponses, 50),
    approvalEvents: mergeUnique(previous.approvalEvents, projected.approvalEvents, 50),
    changedFiles: mergeUnique(previous.changedFiles, projected.changedFiles, 100),
    verificationEvidence: mergeUnique(previous.verificationEvidence, projected.verificationEvidence, 100),
    reportedChangedFiles: mergeUnique(previous.reportedChangedFiles, projected.reportedChangedFiles, 100),
    reportedVerificationEvidence: mergeUnique(previous.reportedVerificationEvidence, projected.reportedVerificationEvidence, 100),
    workspaceConfirmedChangedFiles: mergeUnique(previous.workspaceConfirmedChangedFiles, projected.workspaceConfirmedChangedFiles, 100),
    workspaceCommittedReportedFilesSinceRunStart: mergeUnique(previous.workspaceCommittedReportedFilesSinceRunStart, projected.workspaceCommittedReportedFilesSinceRunStart, 100),
    workspaceCurrentlyDirtyReportedFiles: mergeUnique(previous.workspaceCurrentlyDirtyReportedFiles, projected.workspaceCurrentlyDirtyReportedFiles, 100),
    workspaceBaseline: previous.workspaceBaseline ?? projected.workspaceBaseline
  }
}

export class ExecutorActivityObserver {
  private binding: ExecutorChatBinding | null = null
  private snapshot: ExecutorActivitySnapshot | null = null
  private generation = 0
  private disposed = false
  private updates: Promise<void> = Promise.resolve()
  private readonly removeNotification: () => void
  private readonly removeConnection: () => void

  constructor(
    private readonly client: ObservationClient,
    private readonly repository: ExecutorActivityRepository,
    private readonly now: () => Date = () => new Date(),
    private readonly workspaceEvidence: WorkspaceEvidenceProvider = new GitWorkspaceEvidenceProvider()
  ) {
    this.removeNotification = client.onNotification((notification) => void this.enqueue(() => this.onNotification(notification)))
    this.removeConnection = client.onConnectionState((state) => void this.enqueue(() => this.onConnection(state)))
  }

  bind(binding: ExecutorChatBinding, options: { captureBaseline?: boolean } = {}): Promise<ExecutorActivitySnapshot> {
    return this.enqueue(() => this.bindDirect(binding, options.captureBaseline === true))
  }

  private async bindDirect(binding: ExecutorChatBinding, captureBaseline: boolean): Promise<ExecutorActivitySnapshot> {
    if (this.disposed) throw new Error('Executor activity observer is disposed')
    const generation = ++this.generation
    this.binding = structuredClone(binding)
    this.snapshot = await this.repository.load(binding.runId) ?? initialActivity(binding, this.now)
    if (captureBaseline && !this.snapshot.workspaceBaseline) {
      const capturedAt = this.now().toISOString()
      const workspaceBaseline = await this.workspaceEvidence.capture(binding.workspaceRoot, capturedAt)
      if (!this.disposed && generation === this.generation) {
        this.snapshot = await this.repository.save({ ...this.snapshot, workspaceBaseline, observedAt: capturedAt })
      }
    }
    return this.refreshDirect(binding, generation)
  }

  refresh(): Promise<ExecutorActivitySnapshot | null> {
    return this.enqueue(async () => {
      if (!this.binding || !this.snapshot || this.disposed) return null
      return this.refreshDirect(this.binding, this.generation)
    })
  }

  private async refreshDirect(binding: ExecutorChatBinding, generation: number): Promise<ExecutorActivitySnapshot> {
    const previous = this.snapshot ?? await this.repository.load(binding.runId) ?? initialActivity(binding, this.now)
    try {
      const result = record(await this.client.request('thread/read', { threadId: binding.threadId, includeTurns: true }))
      const thread = record(result?.thread)
      if (!thread || thread.id !== binding.threadId) throw new Error('Executor thread verification failed')
      let rebuilt = initialActivity(binding, this.now, previous.workspaceBaseline)
      const turns = Array.isArray(thread.turns) ? thread.turns : []
      for (const turnValue of turns) {
        const turn = record(turnValue)
        if (!turn) continue
        rebuilt = reduceExecutorActivity(rebuilt, { method: 'turn/started', params: { threadId: binding.threadId, turn } }, binding, this.now)
        for (const item of Array.isArray(turn.items) ? turn.items : []) {
          rebuilt = reduceExecutorActivity(rebuilt, { method: 'item/completed', params: { threadId: binding.threadId, turnId: turn.id, item } }, binding, this.now)
        }
        if (turn.status === 'completed' || turn.status === 'failed' || turn.status === 'interrupted') {
          rebuilt = reduceExecutorActivity(rebuilt, { method: 'turn/completed', params: { threadId: binding.threadId, turn } }, binding, this.now)
        } else if (turn.status === 'inProgress') {
          rebuilt = { ...rebuilt, status: 'working', observedAt: this.now().toISOString() }
        }
      }
      const merged = mergeActivity(previous, rebuilt)
      let reconciled: ExecutorActivitySnapshot
      try {
        const reconciliation = await this.workspaceEvidence.reconcile(
          binding.workspaceRoot,
          merged.workspaceBaseline,
          merged.reportedChangedFiles,
          binding.createdAt
        )
        reconciled = {
          ...merged,
          workspaceConfirmedChangedFiles: [...new Set(reconciliation.changedSinceBaseline)].slice(-100),
          workspaceCommittedReportedFilesSinceRunStart: [...new Set(reconciliation.committedReportedFilesSinceRunStart)].slice(-100),
          workspaceCurrentlyDirtyReportedFiles: [...new Set(reconciliation.currentlyDirtyReportedFiles)].slice(-100)
        }
      } catch {
        reconciled = {
          ...merged,
          status: 'stale',
          workspaceConfirmedChangedFiles: previous.workspaceConfirmedChangedFiles,
          workspaceCommittedReportedFilesSinceRunStart: previous.workspaceCommittedReportedFilesSinceRunStart,
          workspaceCurrentlyDirtyReportedFiles: previous.workspaceCurrentlyDirtyReportedFiles
        }
      }
      if (!this.disposed && generation === this.generation) this.snapshot = await this.repository.save(reconciled)
    } catch {
      if (this.snapshot && !this.disposed && generation === this.generation) {
        this.snapshot = await this.repository.save({ ...this.snapshot, status: 'stale', observedAt: this.now().toISOString() })
      }
    }
    return structuredClone(this.snapshot ?? previous)
  }

  async current(): Promise<ExecutorActivitySnapshot | null> {
    await this.updates
    if (this.snapshot) return structuredClone(this.snapshot)
    if (!this.binding) return null
    return this.repository.load(this.binding.runId)
  }

  markStale(): Promise<void> {
    return this.enqueue(async () => {
      if (!this.snapshot || this.snapshot.status === 'disconnected') return
      this.snapshot = await this.repository.save({ ...this.snapshot, status: 'stale' })
    })
  }

  reset(): Promise<void> {
    return this.enqueue(async () => {
      this.generation += 1
      this.binding = null
      this.snapshot = null
    })
  }

  dispose(): void {
    this.disposed = true
    this.generation += 1
    this.removeNotification()
    this.removeConnection()
    this.binding = null
    this.snapshot = null
  }

  private async onNotification(notification: CodexNotification): Promise<void> {
    if (this.disposed || !this.binding || !this.snapshot) return
    const next = reduceExecutorActivity(this.snapshot, notification, this.binding, this.now)
    if (next === this.snapshot) return
    this.snapshot = await this.repository.save(next)
  }

  private async onConnection(state: CodexConnectionState): Promise<void> {
    if (!this.snapshot) return
    if (state === 'disconnected') {
      this.snapshot = await this.repository.save({ ...this.snapshot, status: 'disconnected', observedAt: this.now().toISOString() })
      return
    }
    if (state === 'connected' && this.binding && this.snapshot.status === 'disconnected') {
      await this.refreshDirect(this.binding, this.generation)
    }
  }

  private enqueue<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.updates.then(operation, operation)
    this.updates = result.then(() => undefined, () => undefined)
    return result
  }
}
