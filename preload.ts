import {contextBridge, ipcRenderer} from 'electron';
import getConfigFile from "./utils/config-parser";

contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    ping: () => ipcRenderer.invoke('ping')
})

contextBridge.exposeInMainWorld('electronAPI', {
    setStatus: (status: boolean) => ipcRenderer.send('status', status)
})

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector: string, text: string | undefined) => {
        const element = document.getElementById(selector)
        if (element) if (typeof text === "string") {
            element.innerText = text
        }
    }

    const loadInnerHTML = (selector: string, htmlLink: string, title: string) => {
        const element = document.getElementById(selector)
        if (element) element.innerHTML = `<iframe src="${htmlLink}" title="${title}"/>`
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }

    replaceText('total-mods', 'This is a test!')

    const modpackVersion = getConfigFile().project_version.toString()

    replaceText('modpack-version', modpackVersion)

    //loadInnerHTML('table-page', 'table.html', 'Mods')
})