const { app, BrowserWindow, ipcMain , screen} = require('electron')

if (require('electron-squirrel-startup')) app.quit()

const path = require('node:path')

const { showNotification, showNotificationWindow } = require('./utils/notification_engine')
const { createNewLogger } = require('./utils/logger')
const logger = createNewLogger()

let OnlineStatus = false

const createWindow = (width, height) => {
    const win = new BrowserWindow({
        width: width,
        height: height,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js')
        }
    })

    win.loadFile('index.html')
}

function handleSetStatus(event, status) {
    logger.info(`Status: ${status ? "online" : "offline"}`)
    OnlineStatus = status

    if (!OnlineStatus) {
        showNotification("Warning", "You are not connected to the internet! Don't expect this to work!")
    }
}

app.whenReady().then(() => {
    const primaryDisplay = screen.getPrimaryDisplay()
    const { width, height } = primaryDisplay.workAreaSize

    ipcMain.handle('ping', () => 'pong')

    createWindow(width, height)

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow()
    })

    ipcMain.on('status', handleSetStatus)
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})