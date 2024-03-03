const { contextBridge, ipcRenderer } = require('electron')

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
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector)
        if (element) element.innerText = text
    }

    const loadInnerHTML = (selector, htmlLink, title) => {
        const element = document.getElementById(selector)
        if (element) element.innerHTML = `<iframe src="${htmlLink}" title="${title}"/>`
    }

    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency])
    }

    replaceText('total-mods', 'This is a test!')

    //loadInnerHTML('table-page', 'table.html', 'Mods')
})