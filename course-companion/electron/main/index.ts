import { app, BrowserWindow, ipcMain, screen } from 'electron'
import { join } from 'node:path'
import type { CompanionMode, ProgressUpdate, RuntimeInfo } from '../../shared/contracts'
import { isProgressUpdate, ProgressRepository } from './progress-repository'
import { getCompanionBounds } from './window-layout'

if (process.env.COURSE_COMPANION_USER_DATA_DIR) {
  app.setPath('userData', process.env.COURSE_COMPANION_USER_DATA_DIR)
}

let mainWindow: BrowserWindow | null = null
let companionWindow: BrowserWindow | null = null
let isQuitting = false
const progressRepository = new ProgressRepository(app.getPath('userData'))

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

function createCompanionWindow(): BrowserWindow {
  const display = screen.getPrimaryDisplay()
  const initialBounds = getCompanionBounds(display.workArea, 'compact')
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

function positionCompanion(mode: CompanionMode): void {
  if (!companionWindow) return

  const display = screen.getDisplayMatching(companionWindow.getBounds())
  companionWindow.setBounds(getCompanionBounds(display.workArea, mode), true)
  companionWindow.showInactive()
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

  ipcMain.handle('course:reset-progress', () => progressRepository.reset())

  ipcMain.handle('course:show-learning-window', () => {
    companionWindow?.hide()
    mainWindow?.show()
    mainWindow?.focus()
  })

  ipcMain.handle('course:hide-learning-window', () => {
    mainWindow?.hide()
    companionWindow?.showInactive()
  })

  ipcMain.handle('course:set-companion-mode', (_event, mode: CompanionMode) => {
    if (mode !== 'compact' && mode !== 'expanded') {
      throw new Error('Unsupported companion mode')
    }
    positionCompanion(mode)
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

app.whenReady().then(() => {
  registerIpcHandlers()
  companionWindow = createCompanionWindow()
  mainWindow = createMainWindow()
})
