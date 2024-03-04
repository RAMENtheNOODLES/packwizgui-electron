import {Notification} from 'electron'

export function showNotification(title: string, body: string) {
    new Notification({
        title: title,
        body: body
    }).show()
}

export function showNotificationWindow(title: string, body: string, click_message: string, document: { getElementById: (arg0: string) => { (): any; new(): any; innerText: any } }) {
    new window.Notification(title, { body: body })
        .onclick = () => { document.getElementById('output').innerText = click_message }
}