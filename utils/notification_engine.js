"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.showNotificationWindow = exports.showNotification = void 0;
const electron_1 = require("electron");
function showNotification(title, body) {
    new electron_1.Notification({
        title: title,
        body: body
    }).show();
}
exports.showNotification = showNotification;
function showNotificationWindow(title, body, click_message, document) {
    new window.Notification(title, { body: body })
        .onclick = () => { document.getElementById('output').innerText = click_message; };
}
exports.showNotificationWindow = showNotificationWindow;
