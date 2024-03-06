const { contextBridge, ipcRenderer} = require('electron/renderer');
const { getConfigFile } = require("./utils/config-parser");
const { getTotalIndexedMods, Mods} = require('./utils/packwiz-utils')
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

contextBridge.exposeInMainWorld('packwizgui', {
    addNewMod: () => ipcRenderer.send('addNewMod')
})

window.addEventListener('DOMContentLoaded', () => {
    logger.debug("In preload.js");

    const CONFIG = getConfigFile()
    const TOTAL_MODS = getTotalIndexedMods()
    const MODS = new Mods()
    MODS.fillFromModsFolder()
    const MODS_TABLE = MODS.toHTMLTable()

    const replaceText = (selector, text) => {
        logger.info(`Replacing element: ${selector}'s text with ${text}`)
        const element = document.getElementById(selector)
        if (element) if (typeof text === "string") {
            element.innerText = text
        }
    }

    const replaceInnerHTML = (selector, HTML) => {
        logger.info(`Replacing element: ${selector}'s inner html with ${HTML}`)
        const element = document.getElementById(selector)

        if (element) if (typeof HTML === "string") {
            element.innerHTML = HTML
        }
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }

    replaceText('total-mods', `${TOTAL_MODS} mods`)

    const modpackVersion = CONFIG.project_version.toString()

    if (modpackVersion === undefined) logger.warn("Something went wrong when attempting to get the config file...")

    logger.info(`Modpack version: ${modpackVersion}`)

    replaceText('modpack-version', modpackVersion)
    replaceInnerHTML('dataTableBody', MODS_TABLE)
})