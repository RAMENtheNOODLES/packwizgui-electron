import { app, BrowserWindow, ipcMain , screen} from 'electron'
const logger = require('./utils/logger').createNewLogger()

if (require('electron-squirrel-startup')) app.quit()

//@ts-nocheck
const path = require('node:path')

import { showNotification } from './utils/notification_engine'

import {getConfigFile} from './utils/config-parser'
import * as Electron from "electron";

export default class Main {
    static mainWindow: BrowserWindow;
    static OnlineStatus: Boolean = false;
    static app: Electron.App;
    static BrowserWindow: any;

    private static onWindowAllClosed() {
        if (process.platform !== 'darwin') Main.app.quit();
    }

    private static createWindow(width: number, height: number) {
        logger.info(`Preload path: ${path.join(__dirname, 'preload.js')}`)
        Main.mainWindow = new Main.BrowserWindow({
            width: width,
            height: height,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: true
            }
        })

        Main.mainWindow.loadFile('index.html')
    }

    private static handleSetStatus(_event: any, status: boolean) {
        logger.info(`Status: ${status ? "online" : "offline"}`)
        Main.OnlineStatus = status

        if (!Main.OnlineStatus) {
            showNotification("Warning", "You are not connected to the internet! Don't expect this to work!")
        }
    }

    private static onReady() {
        if (process.defaultApp) {
            if (process.argv.length >= 2) {
                app.setAsDefaultProtocolClient('packwiz-gui', process.execPath, [path.resolve(process.argv[1])])
            }
        } else {
            app.setAsDefaultProtocolClient('packwiz-gui')
        }

        getConfigFile()
        const primaryDisplay = screen.getPrimaryDisplay()
        const { width, height } = primaryDisplay.workAreaSize

        ipcMain.handle('ping', () => 'pong')

        Main.createWindow(width, height)

        app.on('activate', () => {
            if (BrowserWindow.getAllWindows().length === 0) Main.createWindow(width, height)
        })

        ipcMain.on('status', Main.handleSetStatus)
    }

    static main(app: Electron.App, browserWindow: typeof BrowserWindow) {
        // we pass the Electron.App object and the
        // Electron.BrowserWindow into this function
        // so this class has no dependencies. This
        // makes the code easier to write tests for
        Main.BrowserWindow = browserWindow;
        Main.app = app;
        Main.app.on('window-all-closed', Main.onWindowAllClosed);
        Main.app.on('ready', Main.onReady);
    }
}