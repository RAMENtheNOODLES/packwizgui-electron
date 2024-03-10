const logger = require('./utils/logger').createNewLogger('renderer', 'main')

const func = async () => {
    const response = await window.versions.ping()
    logger.debug(response) // prints out 'pong'
}

const updateOnlineStatus = () => {
    document.getElementById('status').innerHTML = navigator.onLine ? 'online' : 'offline'
    window.electronAPI.setStatus(navigator.onLine)
}

window.addEventListener('online', updateOnlineStatus)
window.addEventListener('offline', updateOnlineStatus)


updateOnlineStatus()

func()