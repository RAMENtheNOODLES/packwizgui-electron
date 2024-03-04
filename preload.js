const { contextBridge, ipcRenderer} = require('electron/renderer');
const { getConfigFile } = require("./utils/config-parser");
const logger = require('./utils/logger').createNewLogger('preload', 'main')

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    ping: () => ipcRenderer.invoke('ping')
})

contextBridge.exposeInMainWorld('electronAPI', {
    setStatus: (status) => ipcRenderer.send('status', status)
})

window.addEventListener('DOMContentLoaded', () => {
    console.log("In preload.js");
    const replaceText = (selector, text) => {
        logger.info(`Replacing element: ${selector}'s text with ${text}`)
        const element = document.getElementById(selector)
        if (element) if (typeof text === "string") {
            element.innerText = text
        }
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }

    replaceText('total-mods', 'This is a test!')

    const modpackVersion = getConfigFile().project_version//.toString()
    logger.info(`Modpack version: ${modpackVersion}`)

    replaceText('modpack-version', modpackVersion)
})