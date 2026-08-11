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
  courseLessonIdForScene,
  courseLessonIds,
  COURSE_VERSION,
  LEARNER_STATE_SCHEMA_VERSION,
  sceneCheckpoint,
  sceneIds,
  type CourseLessonId,
  type CheckpointId,
  type LearnerProgress,
  type LessonId,
  type PracticeCompletionReceipt,
  type PracticeEvent,
  type PracticeState,
  type ProgressLoadResult,
  type ProgressUpdate,
  type SceneId
} from '../../shared/contracts'

const checkpointSet = new Set<string>(checkpointIds)
const sceneSet = new Set<string>(sceneIds)
const SAFE_ID = /^[A-Za-z0-9_-]{1,160}$/
const courseLessonSet = new Set<string>(courseLessonIds)
const LEGACY_COURSE_VERSION = '0.1.0'

export function defaultPracticeState(): PracticeState {
  return {
    missionId: 'm2-planning-package',
    status: 'idle'
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function isLessonId(value: unknown): value is LessonId {
  return value === 'intro' || value === 'module-1' || value === 'module-2'
}

function isCheckpointId(value: unknown): value is CheckpointId {
  return typeof value === 'string' && checkpointSet.has(value)
}

function isSceneId(value: unknown): value is SceneId {
  return typeof value === 'string' && sceneSet.has(value)
}

export function isPracticeCompletionReceipt(value: unknown): value is PracticeCompletionReceipt {
  if (!isRecord(value) || value.schemaVersion !== 1 || value.status !== 'completed') return false
  const destination = value.destination
  return SAFE_ID.test(String(value.courseRunId))
    && SAFE_ID.test(String(value.practiceId))
    && typeof value.practiceVersion === 'string'
    && value.practiceVersion.length > 0
    && value.practiceVersion.length <= 40
    && SAFE_ID.test(String(value.runId))
    && isCheckpointId(value.checkpointId)
    && isIsoDate(value.completedAt)
    && typeof value.evidenceSummary === 'string'
    && value.evidenceSummary.length > 0
    && value.evidenceSummary.length <= 1500
    && typeof value.masterySummary === 'string'
    && value.masterySummary.length > 0
    && value.masterySummary.length <= 1500
    && isRecord(destination)
    && isLessonId(destination.lessonId)
    && isCheckpointId(destination.checkpointId)
    && isSceneId(destination.sceneId)
    && sceneCheckpoint[destination.sceneId] === destination.checkpointId
    && ((destination.lessonId === 'intro' && destination.sceneId.startsWith('intro-'))
      || (destination.lessonId === 'module-1' && destination.sceneId.startsWith('module-1-'))
      || (destination.lessonId === 'module-2' && destination.sceneId.startsWith('module-2-')))
}

function completionKey(receipt: PracticeCompletionReceipt): string {
  return `${receipt.courseRunId}:${receipt.practiceId}:${receipt.practiceVersion}:${receipt.runId}`
}

function courseRunId(startedAt: string): string {
  return `course-${startedAt.replace(/[^0-9]/g, '').slice(0, 17)}`
}

function isCourseLessonId(value: unknown): value is CourseLessonId {
  return typeof value === 'string' && courseLessonSet.has(value)
}

function decisionsAreValid(value: unknown): value is Record<string, string> {
  return (
    isRecord(value) &&
    Object.entries(value).every(
      ([key, decision]) => key.length <= 80 && typeof decision === 'string' && decision.length <= 500
    )
  )
}

function isPracticeEvidence(value: unknown): boolean {
  return (
    isRecord(value) &&
    value.prdArtifact === 'PRD.md · đã duyệt' &&
    value.implementationPlanArtifact === 'implementation-plan.md · đã duyệt' &&
    typeof value.alignment === 'string' &&
    isIsoDate(value.observedAt) &&
    (value.freshness === 'current' || value.freshness === 'stale')
  )
}

function isPracticeEvent(value: unknown): value is PracticeEvent {
  if (!isRecord(value)) return false
  if (typeof value.id !== 'string' || value.id.length < 1 || value.id.length > 160) return false
  if (value.missionId !== 'm2-planning-package') return false
  if (!['started', 'approval_required', 'success', 'stale', 'offline', 'error'].includes(String(value.scenario))) return false
  if (!['active', 'approval_required', 'completed', 'stale', 'offline', 'error'].includes(String(value.status))) return false
  if (value.source !== 'fixture') return false
  if (typeof value.correlationId !== 'string' || value.correlationId.length < 1 || value.correlationId.length > 160) return false
  if (!isIsoDate(value.timestamp)) return false
  if (typeof value.summary !== 'string' || value.summary.length > 500) return false
  return value.evidence === undefined || isPracticeEvidence(value.evidence)
}

export function isPracticeState(value: unknown): value is PracticeState {
  if (!isRecord(value) || value.missionId !== 'm2-planning-package') return false
  if (!['idle', 'active', 'approval_required', 'completed', 'stale', 'offline', 'error'].includes(String(value.status))) return false
  if (value.status === 'idle') return value.latestEvent === undefined
  return isPracticeEvent(value.latestEvent) && value.latestEvent.status === value.status
}

export function isProgressUpdate(value: unknown): value is ProgressUpdate {
  if (!isRecord(value)) return false
  if (!isLessonId(value.currentLessonId)) return false
  if (!isCheckpointId(value.checkpointId)) return false
  if (!isSceneId(value.sceneId)) return false
  if (sceneCheckpoint[value.sceneId] !== value.checkpointId) return false
  if (!isCourseLessonId(value.currentCourseLessonId)) return false
  if (courseLessonIdForScene(value.sceneId) !== value.currentCourseLessonId) return false
  if (value.currentLessonId === 'intro' && !value.sceneId.startsWith('intro-')) return false
  if (value.currentLessonId === 'module-1' && !value.sceneId.startsWith('module-1-')) return false
  if (value.currentLessonId === 'module-2' && !value.sceneId.startsWith('module-2-')) return false
  if (!Array.isArray(value.sceneHistory) || value.sceneHistory.length > 200) return false
  if (!value.sceneHistory.every(isSceneId)) return false
  if (!Array.isArray(value.completedCheckpointIds)) return false
  if (!value.completedCheckpointIds.every(isCheckpointId)) return false
  if (new Set(value.completedCheckpointIds).size !== value.completedCheckpointIds.length) return false
  return decisionsAreValid(value.decisions)
}

export function isLearnerProgress(value: unknown): value is LearnerProgress {
  if (!isRecord(value)) return false
  if (value.schemaVersion !== LEARNER_STATE_SCHEMA_VERSION) return false
  if (value.courseVersion !== COURSE_VERSION) return false
  if (!SAFE_ID.test(String(value.courseRunId))) return false
  if (!isIsoDate(value.startedAt) || !isIsoDate(value.updatedAt)) return false
  if (!Array.isArray(value.practiceCompletions)
    || value.practiceCompletions.length > 100
    || !value.practiceCompletions.every(isPracticeCompletionReceipt)
    || new Set(value.practiceCompletions.map(completionKey)).size !== value.practiceCompletions.length) return false
  const practice = value.practice
  if (!isProgressUpdate(value)) return false
  return isPracticeState(practice)
}

function translateLegacySceneId(value: unknown): unknown {
  return typeof value === 'string' && value.startsWith('module-1-')
    ? value.replace(/^module-1-/, 'module-2-')
    : value
}

function translateLegacyCheckpointId(value: unknown): unknown {
  return typeof value === 'string' && value.startsWith('m1-')
    ? value.replace(/^m1-/, 'm2-')
    : value
}

function translateLegacyCourseLessonId(value: unknown): unknown {
  return typeof value === 'string' && value.startsWith('m1-')
    ? value.replace(/^m1-/, 'm2-')
    : value
}

function translateLegacyPractice(value: unknown): PracticeState | null {
  if (!isRecord(value)) return null
  const translated = {
    ...value,
    missionId: value.missionId === 'm1-planning-package' ? 'm2-planning-package' : value.missionId,
    ...(isRecord(value.latestEvent)
      ? {
          latestEvent: {
            ...value.latestEvent,
            missionId: value.latestEvent.missionId === 'm1-planning-package'
              ? 'm2-planning-package'
              : value.latestEvent.missionId
          }
        }
      : {})
  }
  return isPracticeState(translated) ? translated : null
}

function migrateLegacyPlanningProgress(raw: Record<string, unknown>): LearnerProgress | null {
  const startedAt = raw.startedAt
  const updatedAt = raw.updatedAt
  const translatedSceneId = translateLegacySceneId(raw.sceneId)
  const translatedCheckpointId = translateLegacyCheckpointId(raw.checkpointId)
  const translatedCourseLessonId = translateLegacyCourseLessonId(raw.currentCourseLessonId)
  const translatedLessonId = raw.currentLessonId === 'module-1' ? 'module-2' : raw.currentLessonId
  const translatedHistory = Array.isArray(raw.sceneHistory)
    ? raw.sceneHistory.map(translateLegacySceneId)
    : []
  const translatedCompleted = Array.isArray(raw.completedCheckpointIds)
    ? raw.completedCheckpointIds.map(translateLegacyCheckpointId)
    : []
  const translatedPractice = translateLegacyPractice(raw.practice)
  if (!isIsoDate(startedAt) || !isIsoDate(updatedAt) || !translatedPractice || !decisionsAreValid(raw.decisions)) {
    return null
  }

  const update = {
    currentLessonId: translatedLessonId,
    currentCourseLessonId: translatedCourseLessonId,
    checkpointId: translatedCheckpointId,
    sceneId: translatedSceneId,
    sceneHistory: translatedHistory,
    completedCheckpointIds: translatedCompleted,
    decisions: {
      ...raw.decisions,
      ...(translatedLessonId === 'module-2'
        ? { setupModuleMigration: 'continued-existing-planning-progress' }
        : {})
    }
  }
  if (!isProgressUpdate(update)) return null

  return {
    ...update,
    schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
    courseVersion: COURSE_VERSION,
    practice: translatedPractice,
    courseRunId: courseRunId(startedAt),
    practiceCompletions: [],
    startedAt,
    updatedAt
  }
}

function migrateLearnerProgress(value: unknown): LearnerProgress | null {
  if (!isRecord(value)) return null
  const raw = value as Record<string, unknown>
  const schemaVersion = raw.schemaVersion
  const courseVersion = raw.courseVersion
  const startedAt = raw.startedAt
  const updatedAt = raw.updatedAt
  if (!isIsoDate(startedAt) || !isIsoDate(updatedAt)) return null

  if (schemaVersion === LEARNER_STATE_SCHEMA_VERSION && isLearnerProgress(raw)) {
    return raw as unknown as LearnerProgress
  }

  if ((schemaVersion === 3 || schemaVersion === 4) && courseVersion === LEGACY_COURSE_VERSION) {
    const translatedSceneId = translateLegacySceneId(raw.sceneId)
    if (!isSceneId(translatedSceneId)) return null
    const legacyRaw = schemaVersion === 3
      ? { ...raw, currentCourseLessonId: courseLessonIdForScene(translatedSceneId) }
      : raw
    return migrateLegacyPlanningProgress(legacyRaw)
  }

  if (
    (schemaVersion === 1 || schemaVersion === 2) &&
    courseVersion === LEGACY_COURSE_VERSION &&
    decisionsAreValid(raw.decisions)
  ) {
    const oldSceneId = typeof raw.sceneId === 'string' ? raw.sceneId : ''
    const resumeOnboarding = [
      'intro-visual-onboarding',
      'intro-course-overview-2',
      'intro-learning-method'
    ].includes(oldSceneId)
    const update: ProgressUpdate = resumeOnboarding
      ? {
          currentLessonId: 'intro',
          currentCourseLessonId: 'intro-overview',
          checkpointId: 'intro-visual-onboarding',
          sceneId: oldSceneId as ProgressUpdate['sceneId'],
          sceneHistory: [],
          completedCheckpointIds: [],
          decisions: raw.decisions
        }
      : {
          currentLessonId: 'module-2',
          currentCourseLessonId: 'm2-when-to-plan',
          checkpointId: 'm2-why-planning',
          sceneId: 'module-2-why-planning',
          sceneHistory: [],
          completedCheckpointIds: ['intro-visual-onboarding'],
          decisions: {
            ...raw.decisions,
            setupModuleMigration: 'continued-existing-planning-progress'
          }
        }
    return {
      ...update,
      schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
      courseVersion: COURSE_VERSION,
      practice: defaultPracticeState(),
      courseRunId: courseRunId(startedAt),
      startedAt,
      practiceCompletions: [],
      updatedAt
    }
  }

  return null
}

type ReadResult =
  | { status: 'missing' }
  | { status: 'invalid' }
  | { status: 'valid'; progress: LearnerProgress; migrated: boolean }

export class ProgressRepository {
  private readonly statePath: string
  private readonly stateTempPath: string
  private readonly backupPath: string
  private readonly backupTempPath: string
  private readonly activityPath: string
  private operationQueue: Promise<void> = Promise.resolve()

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

  load(): Promise<ProgressLoadResult> {
    return this.runExclusive(() => this.loadUnlocked())
  }

  private async loadUnlocked(): Promise<ProgressLoadResult> {
    const primary = await this.readProgress(this.statePath)
    if (primary.status === 'valid') {
      if (primary.migrated) {
        await this.writeAtomic(this.statePath, this.stateTempPath, primary.progress)
        await this.writeAtomic(this.backupPath, this.backupTempPath, primary.progress)
        await this.appendActivity('progress_migrated', primary.progress)
      }
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

  save(update: ProgressUpdate): Promise<LearnerProgress> {
    if (!isProgressUpdate(update)) {
      return Promise.reject(new Error('Invalid learner progress update'))
    }
    return this.runExclusive(() => this.saveUnlocked(update))
  }

  private async saveUnlocked(update: ProgressUpdate): Promise<LearnerProgress> {
    const current = await this.readProgress(this.statePath)
    const timestamp = this.now().toISOString()
    const progress: LearnerProgress = {
      ...update,
      schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
      courseVersion: COURSE_VERSION,
      practice: current.status === 'valid' ? current.progress.practice : defaultPracticeState(),
      courseRunId: current.status === 'valid'
        ? current.progress.courseRunId
        : courseRunId(timestamp),
      startedAt: current.status === 'valid' ? current.progress.startedAt : timestamp,
      practiceCompletions: current.status === 'valid' ? current.progress.practiceCompletions : [],
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

  async loadPracticeState(): Promise<PracticeState> {
    const result = await this.load()
    if (result.status === 'new') return defaultPracticeState()
    if (result.status === 'reset-required') throw new Error(result.reason)
    return result.progress.practice
  }

  savePractice(practice: PracticeState): Promise<PracticeState> {
    if (!isPracticeState(practice)) return Promise.reject(new Error('Invalid practice state'))
    return this.runExclusive(() => this.savePracticeUnlocked(practice))
  }

  recordPracticeCompletion(receipt: PracticeCompletionReceipt): Promise<LearnerProgress> {
    if (!isPracticeCompletionReceipt(receipt)) {
      return Promise.reject(new Error('Invalid Practice completion receipt'))
    }
    return this.runExclusive(async () => {
      const current = await this.readProgress(this.statePath)
      if (current.status !== 'valid') throw new Error('Learner progress is required')
      if (receipt.courseRunId !== current.progress.courseRunId) {
        throw new Error('Practice completion belongs to another course run')
      }
      const key = completionKey(receipt)
      if (current.progress.practiceCompletions.some((item) => completionKey(item) === key)) {
        return current.progress
      }
      const progress: LearnerProgress = {
        ...current.progress,
        practiceCompletions: [...current.progress.practiceCompletions, structuredClone(receipt)].slice(-100),
        updatedAt: this.now().toISOString()
      }
      await this.writeAtomic(this.backupPath, this.backupTempPath, current.progress)
      await this.writeAtomic(this.statePath, this.stateTempPath, progress)
      await this.appendActivity('practice_completion_recorded', progress)
      return progress
    })
  }

  returnFromPractice(receipt: PracticeCompletionReceipt): Promise<LearnerProgress> {
    if (!isPracticeCompletionReceipt(receipt)) {
      return Promise.reject(new Error('Invalid Practice completion receipt'))
    }
    return this.runExclusive(async () => {
      const current = await this.readProgress(this.statePath)
      if (current.status !== 'valid') throw new Error('Learner progress is required')
      if (receipt.courseRunId !== current.progress.courseRunId) {
        throw new Error('Practice completion belongs to another course run')
      }
      const stored = current.progress.practiceCompletions.find((item) =>
        completionKey(item) === completionKey(receipt))
      if (!stored || JSON.stringify(stored) !== JSON.stringify(receipt)) {
        throw new Error('Practice completion receipt is not authoritative')
      }
      if (current.progress.completedCheckpointIds.includes(receipt.checkpointId)
        && current.progress.checkpointId !== receipt.checkpointId) {
        return current.progress
      }
      if (current.progress.checkpointId !== receipt.checkpointId) {
        throw new Error('Practice completion does not match the current course checkpoint')
      }
      const completedCheckpointIds = [...new Set([
        ...current.progress.completedCheckpointIds,
        receipt.checkpointId
      ])]
      const progress: LearnerProgress = {
        ...current.progress,
        currentLessonId: receipt.destination.lessonId,
        checkpointId: receipt.destination.checkpointId,
        sceneId: receipt.destination.sceneId,
        completedCheckpointIds,
        updatedAt: this.now().toISOString()
      }
      await this.writeAtomic(this.backupPath, this.backupTempPath, current.progress)
      await this.writeAtomic(this.statePath, this.stateTempPath, progress)
      await this.appendActivity('practice_return_applied', progress)
      return progress
    })
  }

  private async savePracticeUnlocked(practice: PracticeState): Promise<PracticeState> {
    const current = await this.readProgress(this.statePath)
    if (current.status !== 'valid') {
      throw new Error('Learner progress is required before practice can start')
    }

    const progress: LearnerProgress = {
      ...current.progress,
      practice,
      schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
      updatedAt: this.now().toISOString()
    }
    await this.writeAtomic(this.backupPath, this.backupTempPath, current.progress)
    await this.writeAtomic(this.statePath, this.stateTempPath, progress)
    await this.appendActivity(
      practice.latestEvent ? `practice_fixture_${practice.latestEvent.scenario}` : 'practice_reset',
      progress
    )
    return practice
  }

  reset(): Promise<void> {
    return this.runExclusive(async () => {
      await Promise.all([
        rm(this.statePath, { force: true }),
        rm(this.stateTempPath, { force: true }),
        rm(this.backupPath, { force: true }),
        rm(this.backupTempPath, { force: true }),
        rm(this.activityPath, { force: true })
      ])
    })
  }

  private runExclusive<T>(operation: () => Promise<T>): Promise<T> {
    const result = this.operationQueue.then(operation, operation)
    this.operationQueue = result.then(
      () => undefined,
      () => undefined
    )
    return result
  }

  private async readProgress(path: string): Promise<ReadResult> {
    try {
      const parsed: unknown = JSON.parse(await readFile(path, 'utf8'))
      const progress = migrateLearnerProgress(parsed)
      return progress
        ? {
            status: 'valid',
            progress,
            migrated:
              isRecord(parsed) && (
                parsed.schemaVersion !== LEARNER_STATE_SCHEMA_VERSION ||
                parsed.courseVersion !== COURSE_VERSION
              )
          }
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
        moduleId: progress.currentLessonId,
        lessonId: progress.currentCourseLessonId,
        checkpointId: progress.checkpointId,
        sceneId: progress.sceneId,
        timestamp: this.now().toISOString()
      })}\n`,
      'utf8'
    )
  }
}
