import type { ExecutorActivitySnapshot } from '../../shared/contracts'
import type { PracticeRunRecord } from './practice-run-repository'

export function portfolioActivityUnavailable(
  activity: ExecutorActivitySnapshot,
  run: PracticeRunRecord
): boolean {
  if (activity.runId !== run.runId || activity.threadId !== run.binding.threadId
    || activity.status === 'disconnected' || activity.status === 'working') return true
  if (activity.status !== 'stale') return false
  const configuration = activity.configuration
  // The snapshot reader has read and verified the bound task. Optional Git
  // evidence can mark it stale; unknown model/settings labels are not a lost
  // connection. Module 1 configuration assessment keeps its stricter checks.
  return activity.workspaceEvidenceStatus !== 'git-unavailable'
    || !configuration
    || configuration.runId !== run.runId || configuration.threadId !== run.binding.threadId
    || configuration.freshness === 'stale'
    || configuration.connection !== 'connected'
}
