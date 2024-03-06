import * as http from "http"
const keepAliveAgent = new http.Agent({ keepAlive: true })

const HEADERS = {
    'User-Agent': '(RAMENtheNOODLES/PackwizGUI [contact@cookiejar499.me])',
    'x-api-key': ''
}

const options = {
    "modrinth": {
        host: "api.modrinth.com",
        path: "/v2/search",
        method: "GET",
        headers: HEADERS
    },
    "curseforge": {
        host: "api.curseforge.com"
    }
}