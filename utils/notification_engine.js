const { Notification } = require('electron')

function showNotification(title, body) {
    new Notification({
        title: title,
        body: body
    }).show()
}

function showNotificationWindow(title, body, click_message, document) {
    new window.Notification(title, { body: body })
        .onclick = () => { document.getElementById('output').innerText = click_message }
}

module.exports = {
    showNotification,
    showNotificationWindow
}