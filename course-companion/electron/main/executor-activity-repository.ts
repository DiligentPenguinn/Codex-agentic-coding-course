import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { ExecutorActivitySnapshot } from '../../shared/contracts'

type ActivityDocument = {
  schemaVersion: 1
  snapshots: Record<string, ExecutorActivitySnapshot>
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isStringArray(value: unknown, maximum = 100): value is string[] {
  return Array.isArray(value) && value.length <= maximum && value.every((item) => typeof item === 'string' && item.length <= 4_000)
}

function validBaseline(value: unknown): boolean {
  if (value === null) return true
  if (!isRecord(value) || value.schemaVersion !== 1 || typeof value.gitAvailable !== 'boolean') return false
  if (typeof value.capturedAt !== 'string' || Number.isNaN(Date.parse(value.capturedAt))) return false
  if (value.head !== undefined && value.head !== null && (typeof value.head !== 'string' || !/^[0-9a-f]{40,64}$/i.test(value.head))) return false
  if (!isRecord(value.entries) || Object.keys(value.entries).length > 500) return false
  return Object.entries(value.entries).every(([path, signature]) => (
    path.length > 0 && path.length <= 500 && typeof signature === 'string' && signature.length <= 200
  ))
}

function normalizeSnapshot(value: unknown): ExecutorActivitySnapshot | null {
  if (!isRecord(value) || value.schemaVersion !== 1) return null
  if (typeof value.runId !== 'string' || typeof value.threadId !== 'string') return null
  if (!['ready', 'working', 'waiting-for-learner', 'response-ready', 'stale', 'disconnected'].includes(String(value.status))) return null
  if (typeof value.cursor !== 'string' || value.cursor.length > 500) return null
  if (!isStringArray(value.learnerPrompts, 50) || !isStringArray(value.executorResponses, 50)) return null
  if (!isStringArray(value.approvalEvents, 50) || !isStringArray(value.changedFiles, 100)) return null
  if (!isStringArray(value.verificationEvidence, 100)) return null
  if (typeof value.observedAt !== 'string' || Number.isNaN(Date.parse(value.observedAt))) return null
  const reportedChangedFiles = value.reportedChangedFiles ?? []
  const reportedVerificationEvidence = value.reportedVerificationEvidence ?? []
  const workspaceConfirmedChangedFiles = value.workspaceConfirmedChangedFiles ?? []
  const workspaceCommittedReportedFilesSinceRunStart = value.workspaceCommittedReportedFilesSinceRunStart ?? []
  const workspaceCurrentlyDirtyReportedFiles = value.workspaceCurrentlyDirtyReportedFiles ?? []
  const rawWorkspaceBaseline = value.workspaceBaseline ?? null
  const workspaceBaseline = isRecord(rawWorkspaceBaseline) && rawWorkspaceBaseline.head === undefined
    ? { ...rawWorkspaceBaseline, head: null }
    : rawWorkspaceBaseline
  if (!isStringArray(reportedChangedFiles, 100) || !isStringArray(reportedVerificationEvidence, 100)) return null
  if (!isStringArray(workspaceConfirmedChangedFiles, 100) || !isStringArray(workspaceCommittedReportedFilesSinceRunStart, 100)) return null
  if (!isStringArray(workspaceCurrentlyDirtyReportedFiles, 100)) return null
  if (!validBaseline(workspaceBaseline)) return null
  return {
    ...(value as Omit<ExecutorActivitySnapshot, 'reportedChangedFiles' | 'reportedVerificationEvidence' | 'workspaceConfirmedChangedFiles' | 'workspaceCommittedReportedFilesSinceRunStart' | 'workspaceCurrentlyDirtyReportedFiles' | 'workspaceBaseline'>),
    reportedChangedFiles,
    reportedVerificationEvidence,
    workspaceConfirmedChangedFiles,
    workspaceCommittedReportedFilesSinceRunStart,
    workspaceCurrentlyDirtyReportedFiles,
    workspaceBaseline: workspaceBaseline as ExecutorActivitySnapshot['workspaceBaseline']
  }
}

export function isExecutorActivitySnapshot(value: unknown): value is ExecutorActivitySnapshot {
  if (!isRecord(value) || value.reportedChangedFiles === undefined || value.workspaceCommittedReportedFilesSinceRunStart === undefined || value.workspaceCurrentlyDirtyReportedFiles === undefined || value.workspaceBaseline === undefined) return false
  return normalizeSnapshot(value) !== null
}

export class ExecutorActivityRepository {
  private readonly statePath: string
  private readonly temporaryPath: string
  private queue: Promise<void> = Promise.resolve()

  constructor(private readonly dataDirectory: string) {
    this.statePath = join(dataDirectory, 'executor-activity.json')
    this.temporaryPath = join(dataDirectory, 'executor-activity.json.tmp')
  }

  async load(runId: string): Promise<ExecutorActivitySnapshot | null> {
    const document = await this.loadDocument()
    return document.snapshots[runId] ? structuredClone(document.snapshots[runId]) : null
  }

  save(snapshot: ExecutorActivitySnapshot): Promise<ExecutorActivitySnapshot> {
    if (!isExecutorActivitySnapshot(snapshot)) return Promise.reject(new Error('Invalid Executor activity snapshot'))
    return this.runExclusive(async () => {
      const document = await this.loadDocumentDirect()
      document.snapshots[snapshot.runId] = structuredClone(snapshot)
      const entries = Object.entries(document.snapshots).slice(-100)
      document.snapshots = Object.fromEntries(entries)
      await mkdir(this.dataDirectory, { recursive: true })
      await writeFile(this.temporaryPath, `${JSON.stringify(document, null, 2)}\n`, 'utf8')
      await rename(this.temporaryPath, this.statePath)
      return structuredClone(snapshot)
    })
  }

  reset(): Promise<void> {
    return this.runExclusive(async () => {
      await Promise.all([rm(this.statePath, { force: true }), rm(this.temporaryPath, { force: true })])
    })
  }

  private loadDocument(): Promise<ActivityDocument> {
    return this.runExclusive(() => this.loadDocumentDirect())
  }

  private async loadDocumentDirect(): Promise<ActivityDocument> {
    try {
      const parsed: unknown = JSON.parse(await readFile(this.statePath, 'utf8'))
      if (isRecord(parsed) && parsed.schemaVersion === 1 && isRecord(parsed.snapshots)) {
        const snapshots: Record<string, ExecutorActivitySnapshot> = {}
        for (const [runId, value] of Object.entries(parsed.snapshots)) {
          const normalized = normalizeSnapshot(value)
          if (!normalized) throw new Error('Invalid Executor activity snapshot')
          snapshots[runId] = normalized
        }
        return { schemaVersion: 1, snapshots }
      }
    } catch {
      // Missing or malformed activity is recovered as an empty observation store.
    }
    return { schemaVersion: 1, snapshots: {} }
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.queue.then(operation, operation)
    this.queue = result.then(() => undefined, () => undefined)
    return result
  }
}
