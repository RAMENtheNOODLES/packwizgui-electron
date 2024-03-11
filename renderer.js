//const logger = require('./utils/logger').createNewLogger('renderer', 'main')


const updateOnlineStatus = () => {
    //document.getElementById('status').innerHTML = navigator.onLine ? 'online' : 'offline'
    window.electronAPI.setStatus(navigator.onLine)
}

window.addEventListener('online', updateOnlineStatus)
window.addEventListener('offline', updateOnlineStatus)

updateOnlineStatus()