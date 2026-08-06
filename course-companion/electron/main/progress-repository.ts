import {
  appendFile,
  mkdir,
  readFile,
  rename,
  rm,
  writeFile
} from 'node:fs/promises'
import { join } from 'node:path'
import {
  checkpointIds,
  COURSE_VERSION,
  LEARNER_STATE_SCHEMA_VERSION,
  sceneIds,
  type CheckpointId,
  type LearnerProgress,
  type LessonId,
  type ProgressLoadResult,
  type ProgressUpdate,
  type SceneId
} from '../../shared/contracts'

const checkpointSet = new Set<string>(checkpointIds)
const sceneSet = new Set<string>(sceneIds)

const sceneCheckpoint: Record<SceneId, CheckpointId> = {
  'intro-visual-onboarding': 'intro-visual-onboarding',
  'intro-first-safe-win': 'intro-first-safe-win',
  'intro-time-budget': 'intro-time-budget',
  'intro-graduation': 'intro-graduation',
  'intro-problem': 'intro-problem',
  'intro-platform': 'intro-platform',
  'intro-quest-card': 'intro-quest-card',
  'intro-readiness': 'intro-readiness',
  'intro-complete': 'intro-complete',
  'module-1-opening': 'm1-orient',
  'module-1-bad-consequence': 'm1-orient',
  'module-1-concept': 'm1-inspect',
  'module-1-brief-choice': 'm1-brief',
  'module-1-weak-brief': 'm1-brief',
  'module-1-success': 'm1-plan-approval'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function isLessonId(value: unknown): value is LessonId {
  return value === 'intro' || value === 'module-1'
}

function isCheckpointId(value: unknown): value is CheckpointId {
  return typeof value === 'string' && checkpointSet.has(value)
}

function isSceneId(value: unknown): value is SceneId {
  return typeof value === 'string' && sceneSet.has(value)
}

function decisionsAreValid(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([key, decision]) => key.length <= 80 && typeof decision === 'string' && decision.length <= 500
    )
  )
}

export function isProgressUpdate(value: unknown): value is ProgressUpdate {
  if (!isRecord(value)) return false
  if (!isLessonId(value.currentLessonId)) return false
  if (!isCheckpointId(value.checkpointId)) return false
  if (!isSceneId(value.sceneId)) return false
  if (sceneCheckpoint[value.sceneId] !== value.checkpointId) return false
  if (value.currentLessonId === 'intro' && !value.sceneId.startsWith('intro-')) return false
  if (value.currentLessonId === 'module-1' && !value.sceneId.startsWith('module-1-')) return false
  if (!Array.isArray(value.completedCheckpointIds)) return false
  if (!value.completedCheckpointIds.every(isCheckpointId)) return false
  if (new Set(value.completedCheckpointIds).size !== value.completedCheckpointIds.length) return false
  return decisionsAreValid(value.decisions)
}

export function isLearnerProgress(value: unknown): value is LearnerProgress {
  if (!isRecord(value)) return false
  if (value.schemaVersion !== LEARNER_STATE_SCHEMA_VERSION) return false
  if (value.courseVersion !== COURSE_VERSION) return false
  if (!isIsoDate(value.startedAt) || !isIsoDate(value.updatedAt)) return false
  if (!isProgressUpdate(value)) return false
  return true
}

type ReadResult =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'valid'; progress: LearnerProgress }

export class ProgressRepository {
  private readonly statePath: string
  private readonly stateTempPath: string
  private readonly backupPath: string
  private readonly backupTempPath: string
  private readonly activityPath: string

  constructor(
    private readonly dataDirectory: string,
    private readonly now: () => Date = () => new Date()
  ) {
    this.statePath = join(dataDirectory, 'learner-state.json')
    this.stateTempPath = join(dataDirectory, 'learner-state.json.tmp')
    this.backupPath = join(dataDirectory, 'learner-state.backup.json')
    this.backupTempPath = join(dataDirectory, 'learner-state.backup.json.tmp')
    this.activityPath = join(dataDirectory, 'activity-log.jsonl')
  }

  async load(): Promise<ProgressLoadResult> {
    const primary = await this.readProgress(this.statePath)
    if (primary.status === 'valid') {
      return { status: 'returning', progress: primary.progress }
    }

    const backup = await this.readProgress(this.backupPath)
    if (backup.status === 'valid') {
      await this.writeAtomic(this.statePath, this.stateTempPath, backup.progress)
      await this.appendActivity('progress_recovered', backup.progress)
      return { status: 'recovered', progress: backup.progress }
    }

    if (primary.status === 'missing' && backup.status === 'missing') {
      return { status: 'new' }
    }

    return {
      status: 'reset-required',
      reason: 'Không thể đọc tiến trình hiện tại hoặc bản sao khôi phục.'
    }
  }

  async save(update: ProgressUpdate): Promise<LearnerProgress> {
    if (!isProgressUpdate(update)) {
      throw new Error('Invalid learner progress update')
    }

    const current = await this.readProgress(this.statePath)
    const timestamp = this.now().toISOString()
    const progress: LearnerProgress = {
      ...update,
      schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
      courseVersion: COURSE_VERSION,
      startedAt: current.status === 'valid' ? current.progress.startedAt : timestamp,
      updatedAt: timestamp
    }

    await mkdir(this.dataDirectory, { recursive: true })
    if (current.status === 'valid') {
      await this.writeAtomic(this.backupPath, this.backupTempPath, current.progress)
    }

    await this.writeAtomic(this.statePath, this.stateTempPath, progress)

    if (current.status !== 'valid') {
      await this.writeAtomic(this.backupPath, this.backupTempPath, progress)
    }

    await this.appendActivity('progress_saved', progress)
    return progress
  }

  async reset(): Promise<void> {
    await Promise.all([
      rm(this.statePath, { force: true }),
      rm(this.stateTempPath, { force: true }),
      rm(this.backupPath, { force: true }),
      rm(this.backupTempPath, { force: true }),
      rm(this.activityPath, { force: true })
    ])
  }

  private async readProgress(path: string): Promise<ReadResult> {
    try {
      const parsed: unknown = JSON.parse(await readFile(path, 'utf8'))
      return isLearnerProgress(parsed)
        ? { status: 'valid', progress: parsed }
        : { status: 'invalid' }
    } catch (error) {
      if (isRecord(error) && error.code === 'ENOENT') return { status: 'missing' }
      return { status: 'invalid' }
    }
  }

  private async writeAtomic(path: string, temporaryPath: string, progress: LearnerProgress): Promise<void> {
    await mkdir(this.dataDirectory, { recursive: true })
    await writeFile(temporaryPath, `${JSON.stringify(progress, null, 2)}\n`, 'utf8')
    await rename(temporaryPath, path)
  }

  private async appendActivity(event: string, progress: LearnerProgress): Promise<void> {
    await mkdir(this.dataDirectory, { recursive: true })
    await appendFile(
      this.activityPath,
      `${JSON.stringify({
        event,
        lessonId: progress.currentLessonId,
        checkpointId: progress.checkpointId,
        sceneId: progress.sceneId,
        timestamp: this.now().toISOString()
      })}\n`,
      'utf8'
    )
  }
}
