import { app, BrowserWindow, ipcMain, screen, shell } from 'electron'
import { join, resolve } from 'node:path'
import type {
  CompanionMode,
  AppSettingsUpdate,
  PracticeFixtureRequest,
  PracticePanelUpdate,
  PracticeStartRequest,
  ProgressUpdate,
  RuntimeInfo,
  TeacherSendRequest
} from '../../shared/contracts'
import { isProgressUpdate, ProgressRepository } from './progress-repository'
import { CodexAppServerClient } from './codex-app-server-client'
import { ExecutorChatCoordinator } from './executor-chat-coordinator'
import { PracticeCoordinator } from './practice-coordinator'
import { PracticeRunRepository } from './practice-run-repository'
import { FixturePracticeAdapter, isPracticeFixtureRequest } from './practice-fixture'
import {
  FixtureTeacherAdapter,
  isAppSettingsUpdate,
  isTeacherSendRequest,
  TeacherChatRepository
} from './teacher-fixture'
import { getCompanionBounds } from './window-layout'
import { TestCodexGateway } from './test-codex-gateway'

if (process.env.COURSE_COMPANION_USER_DATA_DIR) {
  app.setPath('userData', process.env.COURSE_COMPANION_USER_DATA_DIR)
}

let mainWindow: BrowserWindow | null = null
let companionWindow: BrowserWindow | null = null
let isQuitting = false
let companionMode: CompanionMode = 'compact'
let companionAlwaysOnTop = true
const progressRepository = new ProgressRepository(app.getPath('userData'))
const practiceAdapter = new FixturePracticeAdapter(progressRepository)
const teacherRepository = new TeacherChatRepository(app.getPath('userData'))
const teacherAdapter = new FixtureTeacherAdapter(teacherRepository)

const practiceRunRepository = new PracticeRunRepository(app.getPath('userData'))
const workspaceRoot = process.env.COURSE_COMPANION_WORKSPACE_ROOT || resolve(app.getAppPath(), '..')
const useTestCodexGateway = !app.isPackaged && process.env.COURSE_COMPANION_FAKE_CODEX === '1'
const appServerClient = new CodexAppServerClient()
let appServerStart: Promise<void> | null = null

async function ensureAppServer(): Promise<void> {
  if (!appServerStart) {
    appServerStart = appServerClient.start().catch((error: unknown) => {
      appServerStart = null
      throw error
    })
  }
  await appServerStart
}

const appServerGateway = useTestCodexGateway
  ? new TestCodexGateway(workspaceRoot)
  : {
      async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
        await ensureAppServer()
        return appServerClient.request(method, params)
      }
    }
const openExecutorChat = useTestCodexGateway
  ? async (): Promise<void> => undefined
  : (url: string): Promise<void> => shell.openExternal(url)
const executorChatCoordinator = new ExecutorChatCoordinator(appServerGateway, workspaceRoot, openExecutorChat)
const practiceCoordinator = new PracticeCoordinator(practiceRunRepository, executorChatCoordinator)
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

  window.setAlwaysOnTop(companionAlwaysOnTop, 'floating')
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false })

  window.on('close', (event) => {
    if (isQuitting) return
    event.preventDefault()
  })

  void loadSurface(window, 'companion')
  return window
}

function positionCompanion(mode: CompanionMode, show = true): void {
  if (!companionWindow) return

  const display = screen.getDisplayMatching(companionWindow.getBounds())
  companionWindow.setBounds(getCompanionBounds(display.workArea, mode), true)
  if (show) companionWindow.showInactive()
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isPracticeStartRequest(value: unknown): value is PracticeStartRequest {
  return isRecord(value) && Object.keys(value).length === 1 && typeof value.transfer === 'boolean'
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
    await Promise.all([progressRepository.reset(), teacherAdapter.reset(), practiceCoordinator.reset()])
    companionMode = 'compact'
    companionAlwaysOnTop = true
    companionWindow?.setAlwaysOnTop(true, 'floating')
    positionCompanion(companionMode, false)
  })

  ipcMain.handle('course:load-companion-state', async () => ({
    mode: companionMode,
    conversation: await teacherAdapter.loadConversation()
  }))

  ipcMain.handle('course:load-practice-state', () => practiceAdapter.loadState())

  ipcMain.handle('course:load-app-settings', () => teacherRepository.loadSettings())

  ipcMain.handle('course:load-practice-workspace', () => practiceCoordinator.loadWorkspace())

  ipcMain.handle('course:start-practice', async (_event, request: PracticeStartRequest) => {
    if (!isPracticeStartRequest(request)) throw new Error('Invalid Practice start request')
    const view = await practiceCoordinator.startNew(request)
    await enterPracticeCompanion()
    return view
  })

  ipcMain.handle('course:resume-practice', async () => {
    const view = await practiceCoordinator.resume()
    await enterPracticeCompanion()
    return view
  })

  ipcMain.handle('course:retry-practice-switch', async () => {
    const view = await practiceCoordinator.retry()
    await enterPracticeCompanion()
    return view
  })

  ipcMain.handle('course:cancel-practice-switch', () => practiceCoordinator.cancel())

  ipcMain.handle('course:select-practice-panel', (_event, update: PracticePanelUpdate) => {
    if (!isPracticePanelUpdate(update)) throw new Error('Invalid Practice panel update')
    return practiceCoordinator.selectPanel(update)
  })

  ipcMain.handle('course:save-app-settings', async (_event, update: AppSettingsUpdate) => {
    if (!isAppSettingsUpdate(update)) throw new Error('Invalid app settings update')
    companionAlwaysOnTop = update.companionAlwaysOnTop
    companionWindow?.setAlwaysOnTop(companionAlwaysOnTop, companionAlwaysOnTop ? 'floating' : 'normal')
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
      const progressResult = await progressRepository.load()
      const progress =
        progressResult.status === 'returning' || progressResult.status === 'recovered'
          ? progressResult.progress
          : undefined
      return teacherAdapter.sendMessage({
        content: request.content,
        context: progress
          ? {
              lessonId: progress.currentLessonId,
              checkpointId: progress.checkpointId,
              sceneId: progress.sceneId
            }
          : undefined
      })
    }
  )

  ipcMain.handle('course:show-learning-window', () => {
    companionWindow?.hide()
    mainWindow?.show()
    mainWindow?.focus()
    mainWindow?.webContents.send('course:learning-window-shown')
  })

  ipcMain.handle('course:hide-learning-window', () => {
    mainWindow?.hide()
    companionWindow?.showInactive()
  })

  ipcMain.handle('course:set-companion-mode', async (_event, mode: CompanionMode) => {
    if (mode !== 'compact' && mode !== 'expanded') {
      throw new Error('Unsupported companion mode')
    }
    companionMode = mode
    positionCompanion(companionMode)
    await teacherRepository.saveMode(companionMode)
  })

  ipcMain.handle('course:quit', () => app.quit())
}

app.on('before-quit', () => {
  isQuitting = true
  void appServerClient.stop()
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
