import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'
import { existsSync, mkdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import type {
  CompanionMode,
  AppSettingsUpdate,
  PracticeFixtureRequest,
  PracticePanelUpdate,
  PracticeStartRequest,
  PracticeCompletionReceipt,
  ProgressUpdate,
  RuntimeInfo,
  TeacherSendRequest
} from '../../shared/contracts'
import { isProgressUpdate, ProgressRepository } from './progress-repository'
import { CodexAppServerClient } from './codex-app-server-client'
import { ExecutorActivityObserver } from './executor-activity-observer'
import { ExecutorActivityRepository } from './executor-activity-repository'
import { ExecutorChatCoordinator } from './executor-chat-coordinator'
import { PracticeCoordinator } from './practice-coordinator'
import { PracticeRunRepository } from './practice-run-repository'
import { PracticeDefinitionRepository } from './practice-definition-repository'
import {
  DeterministicPracticeReviewEvaluator,
  LivePracticeReviewEvaluator
} from './practice-review-evaluator'
import { PracticeReviewService } from './practice-review-service'
import { FixturePracticeAdapter, isPracticeFixtureRequest } from './practice-fixture'
import {
  isAppSettingsUpdate,
  isTeacherSendRequest,
  TeacherChatRepository
} from './teacher-fixture'
import { RealTeacherAdapter } from './real-teacher-adapter'
import { TeacherMemoryRepository } from './teacher-memory-repository'
import { TeacherService } from './teacher-service'
import { getCompanionBounds } from './window-layout'
import { TestCodexGateway } from './test-codex-gateway'

if (process.env.COURSE_COMPANION_USER_DATA_DIR) {
  app.setPath('userData', process.env.COURSE_COMPANION_USER_DATA_DIR)
}

let mainWindow: BrowserWindow | null = null
let companionWindow: BrowserWindow | null = null
let isQuitting = false
let companionMode: CompanionMode = 'compact'
let pendingPracticeReturn: Promise<PracticeCompletionReceipt> | null = null

function practiceDefinitionsDirectory(): string {
  const override = process.env.COURSE_COMPANION_PRACTICE_DEFINITIONS_DIR
  if (override) return resolve(override)
  const candidates = [
    join(app.getAppPath(), 'content', 'practices'),
    join(process.resourcesPath, 'content', 'practices'),
    resolve(app.getAppPath(), '..', '..', 'content', 'practices')
  ]
  return candidates.find((candidate) => existsSync(candidate)) ??
    join(app.getAppPath(), 'content', 'practices')
}

const practiceDefinitionRepository = new PracticeDefinitionRepository(
  practiceDefinitionsDirectory()
)
let companionAlwaysOnTop = true
const progressRepository = new ProgressRepository(app.getPath('userData'))
const practiceAdapter = new FixturePracticeAdapter(progressRepository)
const teacherRepository = new TeacherChatRepository(app.getPath('userData'))

const practiceRunRepository = new PracticeRunRepository(app.getPath('userData'))
const workspaceRoot = process.env.COURSE_COMPANION_WORKSPACE_ROOT || resolve(app.getAppPath(), '..')
const useTestCodexGateway = !app.isPackaged && process.env.COURSE_COMPANION_FAKE_CODEX === '1'
const presentTestTeacherAsLive = useTestCodexGateway && process.env.COURSE_COMPANION_FAKE_TEACHER_LIVE_MODE === '1'
const appServerClient = new CodexAppServerClient()
let appServerStart: Promise<void> | null = null
const executorBootstrapClient = new CodexAppServerClient()
let executorBootstrapStart: Promise<void> | null = null

async function ensureAppServer(): Promise<void> {
  if (!appServerStart) {
    appServerStart = appServerClient.start().catch((error: unknown) => {
      appServerStart = null
      throw error
    })
  }
  await appServerStart
}

async function ensureExecutorBootstrap(): Promise<void> {
  if (!executorBootstrapStart) {
    executorBootstrapStart = executorBootstrapClient.start().catch((error: unknown) => {
      executorBootstrapStart = null
      throw error
    })
  }
  await executorBootstrapStart
}

async function closeExecutorBootstrap(): Promise<void> {
  const starting = executorBootstrapStart
  executorBootstrapStart = null
  if (starting) await starting.catch(() => undefined)
  await executorBootstrapClient.stop()
}

const appServerGateway = useTestCodexGateway
  ? new TestCodexGateway(workspaceRoot)
  : {
      async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
        await ensureAppServer()
        return appServerClient.request(method, params)
      },
      onNotification(listener: Parameters<CodexAppServerClient['onNotification']>[0]) {
        return appServerClient.onNotification(listener)
      },
      onConnectionState(listener: Parameters<CodexAppServerClient['onConnectionState']>[0]) {
        return appServerClient.onConnectionState(listener)
      }
    }
const executorBootstrapGateway = useTestCodexGateway
  ? {
      request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
        return appServerGateway.request(method, params)
      },
      async close(): Promise<void> {}
    }
  : {
      async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
        await ensureExecutorBootstrap()
        return executorBootstrapClient.request(method, params)
      },
      close: closeExecutorBootstrap
    }
const openExecutorChat = useTestCodexGateway
  ? async (): Promise<void> => undefined
  : (url: string): Promise<void> => shell.openExternal(url)
const executorChatCoordinator = new ExecutorChatCoordinator(
  executorBootstrapGateway,
  workspaceRoot,
  openExecutorChat
)
const activityRepository = new ExecutorActivityRepository(app.getPath('userData'))
const activityObserver = new ExecutorActivityObserver(appServerGateway, activityRepository)
const practiceCoordinator = new PracticeCoordinator(
  practiceRunRepository,
  practiceDefinitionRepository,
  executorChatCoordinator,
  undefined,
  undefined,
  (binding, captureBaseline) => activityObserver.bind(binding, { captureBaseline }).then(() => undefined)
)
const memoryRepository = new TeacherMemoryRepository(app.getPath('userData'))
const teacherRuntimeDirectory = join(app.getPath('userData'), 'teacher-runtime')
mkdirSync(teacherRuntimeDirectory, { recursive: true })
const realTeacherAdapter = new RealTeacherAdapter(appServerGateway, teacherRuntimeDirectory)
const realTeacherSummaryAdapter = new RealTeacherAdapter(appServerGateway, teacherRuntimeDirectory)
const realTeacherReviewAdapter = new RealTeacherAdapter(appServerGateway, teacherRuntimeDirectory)
const practiceReviewEvaluator = useTestCodexGateway
  ? new DeterministicPracticeReviewEvaluator()
  : new LivePracticeReviewEvaluator(realTeacherReviewAdapter)
const practiceReviewService = new PracticeReviewService(
  practiceDefinitionRepository,
  practiceRunRepository,
  practiceCoordinator,
  progressRepository,
  activityObserver,
  practiceReviewEvaluator,
  teacherRepository,
  useTestCodexGateway && !presentTestTeacherAsLive
)
const teacherService = new TeacherService(
  teacherRepository,
  progressRepository,
  practiceRunRepository,
  practiceDefinitionRepository,
  activityRepository,
  activityObserver,
  memoryRepository,
  realTeacherSummaryAdapter,
  realTeacherAdapter,
  useTestCodexGateway && !presentTestTeacherAsLive
)
const removeTeacherConnection = appServerGateway.onConnectionState((state) => {
  if (state === 'disconnected') {
    appServerStart = null
    void realTeacherAdapter.resetTransport()
    void realTeacherSummaryAdapter.resetTransport()
    void realTeacherReviewAdapter.resetTransport()
  }
  teacherService.onConnectionState(state)
})


function rendererPreloadPath(): string {
  return join(__dirname, '../preload/index.js')
}

async function loadSurface(
  targetWindow: BrowserWindow,
  surface: 'learning' | 'companion'
): Promise<void> {
  if (process.env.ELECTRON_RENDERER_URL) {
    await targetWindow.loadURL(`${process.env.ELECTRON_RENDERER_URL}#/${surface}`)
    return
  }

  await targetWindow.loadFile(join(__dirname, '../renderer/index.html'), {
    hash: `/${surface}`
  })
}

function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1180,
    height: 780,
    minWidth: 760,
    minHeight: 620,
    show: false,
    title: 'Course Companion',
    backgroundColor: '#f4efe5',
    webPreferences: {
      preload: rendererPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  window.once('ready-to-show', () => window.show())

  window.on('close', (event) => {
    if (isQuitting) return

    event.preventDefault()
    window.hide()
    companionWindow?.show()
  })

  void loadSurface(window, 'learning')
  return window
}

function createCompanionWindow(mode: CompanionMode): BrowserWindow {
  const display = screen.getPrimaryDisplay()
  const initialBounds = getCompanionBounds(display.workArea, mode)
  const window = new BrowserWindow({
    ...initialBounds,
    show: false,
    frame: false,
    transparent: true,
    resizable: false,
    maximizable: false,
    minimizable: false,
    fullscreenable: false,
    skipTaskbar: true,
    alwaysOnTop: companionAlwaysOnTop,
    hasShadow: false,
    webPreferences: {
      preload: rendererPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  applyCompanionTopmost(window)
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false })

  window.on('show', () => applyCompanionTopmost(window))
  window.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
  })

  void loadSurface(window, 'companion')
  return window
}

function applyCompanionTopmost(target: BrowserWindow | null = companionWindow): void {
  if (!target) return
  if (!companionAlwaysOnTop) {
    target.setAlwaysOnTop(false)
    return
  }
  target.setAlwaysOnTop(true, 'screen-saver')
  if (target.isVisible()) target.moveTop()
}

function positionCompanion(mode: CompanionMode, show = true): void {
  if (!companionWindow) return

  const display = screen.getDisplayMatching(companionWindow.getBounds())
  companionWindow.setBounds(getCompanionBounds(display.workArea, mode), true)
  applyCompanionTopmost()
  if (show) {
    companionWindow.showInactive()
    applyCompanionTopmost()
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPracticeStartRequest(value: unknown): value is PracticeStartRequest {
  return isRecord(value)
    && Object.keys(value).length === 3
    && /^[A-Za-z0-9_-]{1,160}$/.test(String(value.practiceId))
    && /^[0-9]+.[0-9]+.[0-9]+$/.test(String(value.practiceVersion))
    && typeof value.transfer === 'boolean'
}

function isPracticePanelUpdate(value: unknown): value is PracticePanelUpdate {
  return (
    isRecord(value) &&
    Object.keys(value).length === 2 &&
    (value.surface === 'full' || value.surface === 'compact') &&
    (value.panel === 'teacher' || value.panel === 'progress')
  )
}

async function enterPracticeCompanion(): Promise<void> {
  companionMode = 'compact'
  await teacherRepository.saveMode(companionMode)
  mainWindow?.hide()
  companionWindow?.webContents.send('course:companion-mode-changed', companionMode)
  positionCompanion(companionMode)
}

function registerIpcHandlers(): void {
  ipcMain.handle('course:get-runtime-info', (): RuntimeInfo => ({
    appVersion: app.getVersion(),
    platform: process.platform,
    packaged: app.isPackaged
  }))

  ipcMain.handle('course:load-progress', () => progressRepository.load())

  ipcMain.handle('course:save-progress', (_event, update: ProgressUpdate) => {
    if (!isProgressUpdate(update)) throw new Error('Invalid learner progress update')
    return progressRepository.save(update)
  })

  ipcMain.handle('course:reset-progress', async () => {
    await Promise.all([progressRepository.reset(), teacherService.reset(), practiceCoordinator.reset()])
    companionMode = 'compact'
    companionAlwaysOnTop = true
    applyCompanionTopmost()
    positionCompanion(companionMode, false)
  })

  ipcMain.handle('course:load-companion-state', async () => {
    if (!useTestCodexGateway) await ensureAppServer().catch(() => undefined)
    return teacherService.loadState(companionMode)
  })

  ipcMain.handle('course:load-practice-state', () => practiceAdapter.loadState())

  ipcMain.handle('course:load-app-settings', () => teacherRepository.loadSettings())

  ipcMain.handle('course:load-practice-workspace', (_event, identity) => (
    practiceCoordinator.loadWorkspace(isRecord(identity) ? {
      practiceId: String(identity.practiceId),
      practiceVersion: String(identity.practiceVersion)
    } : undefined)
  ))

  ipcMain.handle('course:start-practice', async (_event, request: PracticeStartRequest) => {
    const previousRun = (await practiceRunRepository.load()).activeRun
    if (!isPracticeStartRequest(request)) throw new Error('Invalid Practice start request')
    const view = await practiceCoordinator.startNew(request)
    const activeRun = (await practiceRunRepository.load()).activeRun
    if (activeRun) await teacherService.activatePracticeRun(activeRun.runId)
    if (previousRun && previousRun.runId !== activeRun?.runId) {
      void teacherService.summarizeReplacedRun(previousRun)
    }
    await enterPracticeCompanion()
    return view
  })

  ipcMain.handle('course:resume-practice', async (_event, identity) => {
    const view = await practiceCoordinator.resume(isRecord(identity) ? {
      practiceId: String(identity.practiceId),
      practiceVersion: String(identity.practiceVersion)
    } : undefined)
    const activeRun = (await practiceRunRepository.load()).activeRun
    if (activeRun) await teacherService.activatePracticeRun(activeRun.runId)
    await enterPracticeCompanion()
    return view
  })

  ipcMain.handle('course:retry-practice-switch', async () => {
    const previousRun = (await practiceRunRepository.load()).activeRun
    const view = await practiceCoordinator.retry()
    const activeRun = (await practiceRunRepository.load()).activeRun
    if (activeRun) await teacherService.activatePracticeRun(activeRun.runId)
    if (previousRun && previousRun.runId !== activeRun?.runId) {
      void teacherService.summarizeReplacedRun(previousRun)
    }
    await enterPracticeCompanion()
    return view
  })

  ipcMain.handle('course:cancel-practice-switch', () => practiceCoordinator.cancel())

  ipcMain.handle('course:select-practice-panel', (_event, update: PracticePanelUpdate) => {
    if (!isPracticePanelUpdate(update)) throw new Error('Invalid Practice panel update')
    return practiceCoordinator.selectPanel(update)
  })
  ipcMain.handle('course:review-practice', async () => {
    if (!useTestCodexGateway) await ensureAppServer()
    return practiceReviewService.review()
  })

  ipcMain.handle('course:return-passed-practice', async () => {
    if (pendingPracticeReturn) return pendingPracticeReturn
    const operation = (async () => {
      const receipt = await practiceReviewService.returnPassedPractice()
      mainWindow?.show()
      mainWindow?.focus()
      companionWindow?.hide()
      mainWindow?.webContents.send('course:practice-returned', receipt)
      return receipt
    })().finally(() => {
      if (pendingPracticeReturn === operation) pendingPracticeReturn = null
    })
    pendingPracticeReturn = operation
    return operation
  })

  ipcMain.handle('course:save-app-settings', async (_event, update: AppSettingsUpdate) => {
    if (!isAppSettingsUpdate(update)) throw new Error('Invalid app settings update')
    companionAlwaysOnTop = update.companionAlwaysOnTop
    applyCompanionTopmost()
    return teacherRepository.saveSettings({
      companionMode,
      companionAlwaysOnTop
    })
  })

  ipcMain.handle(
    'course:emit-practice-fixture',
    (_event, request: PracticeFixtureRequest) => {
      if (!isPracticeFixtureRequest(request)) throw new Error('Invalid practice fixture request')
      return practiceAdapter.emitFixture(request)
    }
  )

  ipcMain.handle(
    'course:send-teacher-message',
    async (_event, request: TeacherSendRequest) => {
      if (!isTeacherSendRequest(request)) throw new Error('Invalid teacher message request')
      return teacherService.sendMessage({ content: request.content })
    }
  )

  ipcMain.handle('course:show-full-teacher', async () => {
    companionMode = 'compact'
    await teacherRepository.saveMode(companionMode)
    mainWindow?.show()
    mainWindow?.focus()
    mainWindow?.webContents.send('course:full-teacher-requested')
    companionWindow?.hide()
    companionWindow?.webContents.send('course:companion-mode-changed', companionMode)
  })

  ipcMain.handle('course:minimize-full-teacher', async () => {
    companionMode = 'compact'
    await teacherRepository.saveMode(companionMode)
    companionWindow?.webContents.send('course:companion-mode-changed', companionMode)
    positionCompanion(companionMode)
    mainWindow?.hide()
  })

  ipcMain.handle('course:set-companion-mode', async (_event, mode: CompanionMode) => {
    if (mode !== 'compact' && mode !== 'expanded') {
      throw new Error('Unsupported companion mode')
    }
    companionMode = mode
    positionCompanion(companionMode)
    companionWindow?.webContents.send('course:companion-mode-changed', companionMode)
    await teacherRepository.saveMode(companionMode)
  })

  ipcMain.handle('course:quit', () => app.quit())
}

app.on('before-quit', () => {
  isQuitting = true
  void appServerClient.stop()
  void closeExecutorBootstrap()
  removeTeacherConnection()
  void teacherService.dispose()
  void realTeacherReviewAdapter.dispose()
})

app.on('activate', () => {
  if (!mainWindow) {
    mainWindow = createMainWindow()
  } else {
    mainWindow.show()
  }
})

app.whenReady().then(async () => {
  registerIpcHandlers()
  const settings = await teacherRepository.loadSettings()
  companionMode = settings.companionMode
  companionAlwaysOnTop = settings.companionAlwaysOnTop
  companionWindow = createCompanionWindow(companionMode)
  mainWindow = createMainWindow()
})
