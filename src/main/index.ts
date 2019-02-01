// const { format } = require('url')
// import { BrowserWindow, app } from 'electron'
// import isDev from 'electron-is-dev'
// const { resolve } = require('app-root-path')

// app.on('ready', async () => {
//   const mainWindow = new BrowserWindow({
//     width: 800,
//     height: 600,
//     show: true
//   })

//   mainWindow.once('ready-to-show', () => {
//     mainWindow.show()
//     if (isDev) { mainWindow.webContents.openDevTools() }
//   })

//   const devPath = 'http://localhost:1124'
//   const prodPath = format({
//     pathname: resolve('app/renderer/.parcel/production/index.html'),
//     protocol: 'file:',
//     slashes: true
//   })
//   const url = isDev ? devPath : prodPath
//   if (isDev) mainWindow.webContents.openDevTools()
//   // mainWindow.setMenu(null)
//   mainWindow.loadURL(url)

  
// })

// app.on('window-all-closed', app.quit)
import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import { format as formatUrl } from 'url'

const isDevelopment = process.env.NODE_ENV !== 'production'

// global reference to mainWindow (necessary to prevent window from being garbage collected)
let mainWindow

function createMainWindow() {
  const window = new BrowserWindow()

  if (isDevelopment) {
    window.webContents.openDevTools()
  }

  if (isDevelopment) {
    window.loadURL(`http://localhost:${process.env.ELECTRON_WEBPACK_WDS_PORT}`)
  }
  else {
    window.loadURL(formatUrl({
      pathname: path.join(__dirname, 'index.html'),
      protocol: 'file',
      slashes: true
    }))
  }

  window.on('closed', () => {
    mainWindow = null
  })

  window.webContents.on('devtools-opened', () => {
    window.focus()
    setImmediate(() => {
      window.focus()
    })
  })

  return window
}

// quit application when all windows are closed
app.on('window-all-closed', () => {
  // on macOS it is common for applications to stay open until the user explicitly quits
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // on macOS it is common to re-create a window even after all windows have been closed
  if (mainWindow === null) {
    mainWindow = createMainWindow()
  }
})

// create main BrowserWindow when electron is ready
app.on('ready', () => {
  mainWindow = createMainWindow()
})
