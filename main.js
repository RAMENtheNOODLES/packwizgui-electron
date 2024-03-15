"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const logger = require('./utils/logger').createNewLogger();
if (require('electron-squirrel-startup'))
    electron_1.app.quit();
//@ts-nocheck
const path = require('node:path');
const notification_engine_1 = require("./utils/notification_engine");
const config_parser_1 = require("./utils/config-parser");
class Main {
    static onWindowAllClosed() {
        if (process.platform !== 'darwin')
            Main.app.quit();
    }
    static createWindow(width, height) {
        logger.info(`Preload path: ${path.join(__dirname, 'preload.js')}`);
        Main.mainWindow = new Main.BrowserWindow({
            width: width,
            height: height,
            webPreferences: {
                preload: path.join(__dirname, 'preload.js'),
                nodeIntegration: true
            }
        });
        Main.mainWindow.loadFile('index.html');
    }
    static handleSetStatus(_event, status) {
        logger.info(`Status: ${status ? "online" : "offline"}`);
        Main.OnlineStatus = status;
        if (!Main.OnlineStatus) {
            (0, notification_engine_1.showNotification)("Warning", "You are not connected to the internet! Don't expect this to work!");
        }
    }
    static onReady() {
        if (process.defaultApp) {
            if (process.argv.length >= 2) {
                electron_1.app.setAsDefaultProtocolClient('packwiz-gui', process.execPath, [path.resolve(process.argv[1])]);
            }
        }
        else {
            electron_1.app.setAsDefaultProtocolClient('packwiz-gui');
        }
        (0, config_parser_1.getConfigFile)();
        const primaryDisplay = electron_1.screen.getPrimaryDisplay();
        const { width, height } = primaryDisplay.workAreaSize;
        electron_1.ipcMain.handle('ping', () => 'pong');
        Main.createWindow(width, height);
        electron_1.app.on('activate', () => {
            if (electron_1.BrowserWindow.getAllWindows().length === 0)
                Main.createWindow(width, height);
        });
        electron_1.ipcMain.on('status', Main.handleSetStatus);
    }
    static main(app, browserWindow) {
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
Main.OnlineStatus = false;
exports.default = Main;
