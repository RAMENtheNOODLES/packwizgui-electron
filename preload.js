"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const config_parser_1 = __importDefault(require("./utils/config-parser"));
electron_1.contextBridge.exposeInMainWorld('versions', {
    node: () => process.versions.node,
    chrome: () => process.versions.chrome,
    electron: () => process.versions.electron,
    ping: () => electron_1.ipcRenderer.invoke('ping')
});
electron_1.contextBridge.exposeInMainWorld('electronAPI', {
    setStatus: (status) => electron_1.ipcRenderer.send('status', status)
});
window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element)
            if (typeof text === "string") {
                element.innerText = text;
            }
    };
    const loadInnerHTML = (selector, htmlLink, title) => {
        const element = document.getElementById(selector);
        if (element)
            element.innerHTML = `<iframe src="${htmlLink}" title="${title}"/>`;
    };
    for (const dependency of ['chrome', 'node', 'electron']) {
        replaceText(`${dependency}-version`, process.versions[dependency]);
    }
    replaceText('total-mods', 'This is a test!');
    const modpackVersion = (0, config_parser_1.default)().project_version.toString();
    replaceText('modpack-version', modpackVersion);
    //loadInnerHTML('table-page', 'table.html', 'Mods')
});
