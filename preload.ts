import { contextBridge, ipcRenderer } from 'electron/renderer';
import { getConfigFile, SemanticVersioning } from "./utils/config-parser";
import {getTotalIndexedMods, Mods, CLI_UTILS} from './utils/packwiz-utils';
import {WebUtils} from "./utils/web-utils";
const logger = require('./utils/logger').createNewLogger('preload', 'main')

let CONFIG = getConfigFile()

let MODS = Mods.getFromIndex()
let MODS_TABLE = () => MODS.toHTMLTable()

let TOTAL_MODS = getTotalIndexedMods()

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    ping: () => ipcRenderer.invoke('ping')
})

contextBridge.exposeInMainWorld('electronAPI', {
    setStatus: (status: any) => ipcRenderer.send('status', status)
})

contextBridge.exposeInMainWorld('packwizgui', {
    addNewMod: () => ipcRenderer.send('addNewMod')
})

const replaceInnerHTML = (selector: string, HTML: string) => {
    logger.info(`Replacing element: ${selector}'s inner html with ${HTML}`)
    const element = document.getElementById(selector)

    if (element) {
        element.innerHTML = HTML
    }
}

async function fillInstallModsTable(query: string) {
    const WEB_UTILS = new WebUtils()
    WEB_UTILS.searchForMods(query, 10, 0).then((INSTALL_MODS) => {
        logger.debug(`Install mods: ${INSTALL_MODS}`)
        logger.debug(`Install mods html: ${INSTALL_MODS.toHTMLTable()}`)
        replaceInnerHTML("installModsTableBody", INSTALL_MODS.toHTMLTable())

        const INSTALL_MOD_IDS = INSTALL_MODS.getAllModIds()

        for (let i = 0; i < INSTALL_MOD_IDS.length; i++) {
            logger.debug(`Mod ID: ${INSTALL_MOD_IDS[i]} at index ${i}`)

            if (document.querySelector(`#ADD-MOD-${INSTALL_MOD_IDS[i]}`) === null) {
                logger.error(`Could not find element: #ADD-MOD-${INSTALL_MOD_IDS[i]}`)
                continue
            }

            // @ts-ignore
            document.querySelector(`#ADD-MOD-${INSTALL_MOD_IDS[i]}`).addEventListener('click', () => {
                logger.info(`Adding mod: ${INSTALL_MOD_IDS[i]}`)
                logger.debug(CLI_UTILS.addMod(INSTALL_MOD_IDS[i]))
                CLI_UTILS.refreshPackwiz()
                MODS.addMod(INSTALL_MODS.getModFromID(INSTALL_MOD_IDS[i]))
            })
        }

        const INSTALL_MOD_CARD = <HTMLDivElement>document.querySelector("#installModCard");
        INSTALL_MOD_CARD.hidden = false
    })
}

window.addEventListener('DOMContentLoaded', () => {
    logger.debug("In preload.js");

    MODS.fillFromModsFolder()

    const replaceText = (selector: string, text: string | undefined) => {
        logger.info(`Replacing element: ${selector}'s text with ${text}`)
        const element = document.getElementById(selector)
        if (element) if (typeof text === "string") {
            element.innerText = text
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
    replaceInnerHTML('dataTableBody', MODS_TABLE())

    let inOverview = true

    try {
        // @ts-ignore
        document.querySelector("#refresh-btn-1").addEventListener('click', () => {
            MODS.refreshModHTMLTable();
            replaceInnerHTML('dataTableBody', MODS.toHTMLTable())
            MODS.index()
        })
    }
    catch (error) {
        logger.error(`Error when adding event listener for refresh button: ${error}`)
        inOverview = false
    }

    try {
        //@ts-ignore
        document.querySelector("#close-install-mods-btn").addEventListener('click', () => {
            const INSTALL_MOD_CARD = <HTMLDivElement>document.querySelector("#installModCard");
            INSTALL_MOD_CARD.hidden = true
        })
    }
    catch (error) {
        logger.error(`Error when adding event listener for close install mods button: ${error}`)
    }

    try {
        // @ts-ignore
        document.querySelector("#add-new-mod-btn-1").addEventListener('click', () => {
            fillInstallModsTable("")
                .finally(() => logger.info("Finished showing install mods table"))
        })
    }
    catch (error) {
        logger.error(`Error when adding event listener for add mod button: ${error}`)
    }

    try {
        // @ts-ignore
        document.querySelector("#installModsSearch").addEventListener('change', (event) => {
            logger.info(`Updating search query to: ${(<HTMLInputElement>event.target).value}`)
            fillInstallModsTable((<HTMLInputElement>event.target).value)
                .finally(() => logger.info("Finished searching for mods"))
        })
    }
    catch (error) {
        logger.error(`Error when adding event listener for install mods search: ${error}`)
    }

    replaceText("modpack-name-dropdown", CONFIG.project_name)

    try {
        logger.info("Adding event listener for save settings button")
        const SAVE_SETTINGS_BTN = "#save-settings-btn"

        const MODPACK_NAME = <HTMLInputElement>document.getElementById("modpack-name")
        const PACKWIZ_FILE_LOC = <HTMLInputElement>document.getElementById("packwiz-file-loc")
        const MODPACK_VERSION = <HTMLInputElement>document.getElementById("modpack-version")
        const PROJECT_DIRECTORY = <HTMLInputElement>document.getElementById("project-directory")

        // @ts-ignore
        document.querySelector(SAVE_SETTINGS_BTN).addEventListener('click', () => {
            logger.debug("Saving settings")

            if ((MODPACK_NAME === null || PACKWIZ_FILE_LOC === null || MODPACK_VERSION === null || PROJECT_DIRECTORY === null)
                || MODPACK_NAME.value === "" || MODPACK_VERSION.value === "") {
                logger.error("One of the settings fields is null!")
            }
            else {
                CONFIG.project_version = SemanticVersioning.fromString(MODPACK_VERSION.value)
                const PROJECT_DIR = (<FileList>PROJECT_DIRECTORY.files)[0]
                CONFIG.project_dir = PROJECT_DIR.path.replace(`\\${PROJECT_DIR.name}`, "")
                const EXE_FILE = (<FileList>PACKWIZ_FILE_LOC.files)[0]
                CONFIG.packwiz_exe_file = EXE_FILE.path
                CONFIG.project_name = MODPACK_NAME.value
                CONFIG.write()
                logger.info("Saved settings")
                Mods.resetIndexFile()
            }
        })

        MODPACK_NAME.value = CONFIG.project_name
        MODPACK_VERSION.value = CONFIG.project_version.toString()
    }
    catch (error) {
        logger.error(`Error when saving settings, or not in settings.html: ${error}`)
    }

    logger.debug(`In overview: ${inOverview}`)

    if (!inOverview) {
        return
    }

    const MOD_IDS = MODS.getAllModIds()

    logger.info(`Adding event listeners for ${MOD_IDS.length} mods`)

    for (let i = 0; i < MOD_IDS.length; i++) {
        logger.debug(`Mod ID: ${MOD_IDS[i]} at index ${i}`)

        if (document.querySelector(`#REMOVE-MOD-${MOD_IDS[i]}`) === null) {
            logger.error(`Could not find element: #REMOVE-MOD-${MOD_IDS[i]}`)
            continue
        }

        // @ts-ignore
        document.querySelector(`#REMOVE-MOD-${MOD_IDS[i]}`).addEventListener('click', () => {
            logger.info(`Removing mod: ${MOD_IDS[i]}`)
            logger.debug(CLI_UTILS.removeMod(MODS.getSlugFromID(MOD_IDS[i])))
            CLI_UTILS.refreshPackwiz()
            MODS.removeMod(MODS.getModFromID(MOD_IDS[i]))
        })
    }
    /*
    MODS.refreshModHTMLTable()

    replaceInnerHTML('dataTableBody', MODS.toHTMLTable())
    MODS.index()

     */
})