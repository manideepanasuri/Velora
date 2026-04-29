import { app, shell, BrowserWindow, ipcMain, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import fs from 'fs'

let mainWindow: BrowserWindow | null = null
let filesToOpen: string[] = [] // Queue for files before window is ready

// Parse open files from arguments starting with .pdf
function getPdfPathsFromArgs(args: string[]): string[] {
  return args.filter(arg => arg.toLowerCase().endsWith('.pdf') && fs.existsSync(arg))
}

function sendPdfsToWindow(win: BrowserWindow, paths: string[]) {
  paths.forEach(pdfPath => {
    win.webContents.send('open-pdf', pdfPath)
  })
}

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: 'hidden',
    ...(process.platform === 'linux' ? { icon } : {}),

    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),

      // Security
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  })

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
  })

  // Open external links in browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // Prevent external navigation inside app
  mainWindow.webContents.on('will-navigate', (event, url) => {
    const currentUrl = mainWindow.webContents.getURL()

    if (new URL(url).origin !== new URL(currentUrl).origin) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Dev / Production loading
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}


const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
  process.exit(0)
}

function getActiveOrCreateWindow(): BrowserWindow {
  const windows = BrowserWindow.getAllWindows()
  if (windows.length > 0) {
    // Return last focused window, or just the first one if none are focused
    const focused = BrowserWindow.getFocusedWindow()
    return focused || windows[windows.length - 1]
  }
  createWindow()
  return mainWindow!
}

app.on('second-instance', (_event, commandLine, workingDirectory) => {
  const win = getActiveOrCreateWindow()
  if (win.isMinimized()) win.restore()
  win.focus()
  const pdfs = getPdfPathsFromArgs(commandLine)
  if (pdfs.length > 0) {
    if (win.webContents.isLoading()) {
      win.webContents.once('did-finish-load', () => sendPdfsToWindow(win, pdfs))
    } else {
      sendPdfsToWindow(win, pdfs)
    }
  }
})

// macOS dock drag & drop or double click
app.on('open-file', (event, path) => {
  event.preventDefault()
  if (app.isReady()) {
    const win = getActiveOrCreateWindow()
    if (win.isMinimized()) win.restore()
    win.focus()
    if (win.webContents.isLoading()) {
      win.webContents.once('did-finish-load', () => sendPdfsToWindow(win, [path]))
    } else {
      sendPdfsToWindow(win, [path])
    }
  } else {
    filesToOpen.push(path)
  }
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))


  // Custom Window Controls
  ipcMain.on('window-minimize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.minimize()
  })

  ipcMain.on('window-toggle-maximize', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win?.isMaximized()) {
      win.unmaximize()
    } else {
      win?.maximize()
    }
    win?.webContents.send('window-maximized', win.isMaximized());
  })

  ipcMain.on('window-close', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    win?.close()
  })

  // File functionality
  ipcMain.handle('dialog:openFile', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Open PDF',
      properties: ['openFile'],
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
    })
    if (!canceled && filePaths.length > 0) {
      return filePaths[0]
    }
    return null
  })

  ipcMain.handle('fs:readFile', async (_, filePath) => {
    try {
      // Returns a Buffer, which is converted to Uint8Array over IPC
      console.log('Reading file:', filePath);
      return fs.readFileSync(filePath)
    } catch (e) {
      console.error('Failed to read file:', e)
      return null
    }
  })


  createWindow()

  // Handle command-line arguments on initial launch
  const initialPdfs = [...getPdfPathsFromArgs(process.argv), ...filesToOpen]
  filesToOpen = [] // clear queue

  if (initialPdfs.length > 0 && mainWindow) {
    mainWindow.webContents.once('did-finish-load', () => {
      sendPdfsToWindow(mainWindow!, initialPdfs)
    })
  }

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
