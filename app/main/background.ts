import { app, Tray, screen, ipcMain, autoUpdater } from 'electron'
import serve from 'electron-serve'
import { createWindow } from './helpers'
const nativeImage = require('electron').nativeImage

import { autoUpdater as updater } from 'electron-updater'
const log = require('electron-log')
log.transports.file.level = 'debug'
updater.logger = log
updater.checkForUpdatesAndNotify()

// const server = 'https://hazel3.vercel.app'
// const feed = `${server}/update/${
//   process.platform
// }/${app.getVersion()}` as string

// console.log(feed)

// try {
//   autoUpdater.setFeedURL({ url: feed })
// } catch (e) {
//   console.log('Something went wrong setting feed URL', e)
// }

// autoUpdater.on('error', message => {
//   console.error('There was a problem updating the application')
//   console.error(message)
// })

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

  // Can't figure out path of icon in production
  // so we use the data url instead
  const dataURL =
    'data:image/png;base64, iVBORw0KGgoAAAANSUhEUgAAABUAAAASCAYAAAC0EpUuAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAADYSURBVHgB3ZTBEYIwEEUX9G5KSAmWQAmWYAfqzZspASsAK6AES9AO0AqCN2+6GX/UySRBws0/8w7sZz8LCcnIrwWzorjOzMZn5IEGwRTAlUQ9owQ1TOup14yONeYR7xbxOkoMTdZ/hM4CdfM9BRikHfNgSo9XwKsoIbCO3KOGBMcC7Q+xBqdfgm2gRrNEXcLT8H1UfYGhxiMeJpypG1/w8uuV3QYFv2+llRtsJmhpvEoEC7NP7b4bq/e+njJ7ep2fZtoLpckMNUdWN0HQlT6rnaI7c2C25uIJn69A++DBpPIAAAAASUVORK5CYII='
  const icon = nativeImage.createFromDataURL(dataURL)
  appTry = new Tray(icon)
  //appTry = new Tray(__dirname + '/../resources/icon.png')
  //if (app.dock) app.dock.hide()
  appTry.setToolTip('ankor')
  appTry.on('click', clicked)

  mainWindow = createWindow('main', {
    /* width: 450, */
    /* height: 600, */
    //show: false
    /* resizable: false */
  })

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
