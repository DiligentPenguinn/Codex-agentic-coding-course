import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'node:path'
import type {
  CompanionMode,
  PracticeFixtureRequest,
  ProgressUpdate,
  RuntimeInfo,
  TeacherSendRequest
} from '../../shared/contracts'
import { isProgressUpdate, ProgressRepository } from './progress-repository'
import { FixturePracticeAdapter, isPracticeFixtureRequest } from './practice-fixture'
import {
  FixtureTeacherAdapter,
  isTeacherSendRequest,
  TeacherChatRepository
} from './teacher-fixture'
import { getCompanionBounds } from './window-layout'

if (process.env.COURSE_COMPANION_USER_DATA_DIR) {
  app.setPath('userData', process.env.COURSE_COMPANION_USER_DATA_DIR)
}

let mainWindow: BrowserWindow | null = null
let companionWindow: BrowserWindow | null = null
let isQuitting = false
let companionMode: CompanionMode = 'compact'
const progressRepository = new ProgressRepository(app.getPath('userData'))
const practiceAdapter = new FixturePracticeAdapter(progressRepository)
const teacherRepository = new TeacherChatRepository(app.getPath('userData'))
const teacherAdapter = new FixtureTeacherAdapter(teacherRepository)

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
    alwaysOnTop: true,
    hasShadow: false,
    webPreferences: {
      preload: rendererPreloadPath(),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  window.setAlwaysOnTop(true, 'floating')
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
    await Promise.all([progressRepository.reset(), teacherAdapter.reset()])
    companionMode = 'compact'
    positionCompanion(companionMode, false)
  })

  ipcMain.handle('course:load-companion-state', async () => ({
    mode: companionMode,
    conversation: await teacherAdapter.loadConversation()
  }))

  ipcMain.handle('course:load-practice-state', () => practiceAdapter.loadState())

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
  companionMode = await teacherRepository.loadMode()
  companionWindow = createCompanionWindow(companionMode)
  mainWindow = createMainWindow()
})
