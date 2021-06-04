import { app, Tray, screen, ipcMain } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'

let bounds: any
let cachedBounds: any
let mainWindow: Electron.BrowserWindow
let appTry: Tray | null
const isProd: boolean = process.env.NODE_ENV === 'production'

if (isProd) {
  serve({ directory: 'app' })
} else {
  app.setPath('userData', `${app.getPath('userData')} (development)`)
}

ipcMain.on('DONE', (event, arg) => {
  console.log('recieved', arg) // prints "ping"
  //event.reply('asynchronous-reply', 'pong');
  mainWindow && mainWindow.show()
})
;(async () => {
  await app.whenReady()

  //if (app.dock) app.dock.hide()
  // appTry = new Tray(__dirname + '/IconTemplate.png')
  // appTry.setToolTip('Youtube Music Player')
  // appTry.on('click', clicked)

  mainWindow = createWindow('main', {
    width: 1000,
    height: 600
  })

  //app.dock.hide()

  if (isProd) {
    await mainWindow.loadURL('app://./home.html')
  } else {
    const port = process.argv[2]
    await mainWindow.loadURL(`http://localhost:${port}/home`)
    mainWindow.webContents.openDevTools()
  }
})()

app.on('window-all-closed', () => {
  app.quit()
})

function clicked(e: any, bounds: any): void {
  if (mainWindow && mainWindow.isVisible()) return hideWindow()

  // workarea takes the taskbar/menubar height in consideration
  var size = screen.getDisplayNearestPoint(
    screen.getCursorScreenPoint()
  ).workArea

  if (bounds) cachedBounds = bounds

  // ensure bounds is an object
  bounds = bounds || { x: 0, y: 0 }

  // bounds may not be populated on all OSes
  if (bounds.x === 0 && bounds.y === 0) {
    // default to bottom on windows
    bounds.x = size.width + size.x - 340 / 2 // default to right
    cachedBounds = bounds
  }

  showWindow(bounds)
}

function showWindow(trayPos: any): void {
  var x = Math.floor(trayPos.x - (340 / 2 || 200) + trayPos.width / 2)
  var y = process.platform === 'win32' ? trayPos.y - 600 : trayPos.y
  if (!mainWindow) {
    createWindow(true, x, y)
  }

  if (mainWindow) {
    mainWindow.show()
    //mainWindow.openDevTools();
    mainWindow.setPosition(x, y)
  }
}

function hideWindow() {
  if (!mainWindow) return
  mainWindow.hide()
}
