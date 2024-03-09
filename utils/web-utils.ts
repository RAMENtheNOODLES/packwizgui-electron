import * as http from "http"
import axios from 'axios'
import {Mod, Mods} from "./packwiz-utils"
import {CurseForgeMod, ModrinthMod} from "./ModTypes";
const logger = require('./logger').createNewLogger('web-utils')

const CURSEFORGE_API_KEY: string = "JDJhJDEwJGNCWTRncy5tUkVWRHNyT3J6dG0uV083MEgvTzhTM211ZXhlNDBZcDlHcFpwSlQzc2ozRTFp"

const HEADERS = {
    'HTTP-Axios-Headers': 'RAMENtheNOODLES/PackwizGUI (contact@cookiejar499.me)',
    'x-api-key': Buffer.from(CURSEFORGE_API_KEY, 'base64').toString("utf-8")
}

const MODRINTH_URL = {
    "search": "https://api.modrinth.com/v2/search",
    "lookup": "https://api.modrinth.com/v2/project/"
}

const CURSEFORGE_URL = {
    "search": "https://api.curseforge.com/v1/mods/search",
    "lookup": "https://api.curseforge.com/v1/mods/"
}

enum ProviderTypes {
    CURSEFORGE,
    MODRINTH,
    ANY
}

export class WebUtils {
    private PROVIDER: ProviderTypes
    private MinecraftVersion: string

    constructor()
    constructor(provider?: ProviderTypes, minecraft_version?: string) {
        this.PROVIDER = provider ? provider : ProviderTypes.ANY
        this.MinecraftVersion = minecraft_version ? minecraft_version : "1.20.1"
    }

    convertToMods(json_data: any, isCurseForge = false): Mod[] {
        let out: Mod[] = []

        if (!isCurseForge) {
            for (let i = 0; i < json_data.hits.length; i++) {
                let mod = ModrinthMod.fromJSON(json_data.hits[i])
                logger.debug(`Modrinth Mod: ${mod.title}`)
                out.push(mod.toMod())
            }
        }
        else {
            for (let i = 0; i < json_data.data.length; i++) {
                let mod = CurseForgeMod.fromJSON(json_data.data[i])
                logger.debug(`CurseForge Mod: ${mod.name}`)
                out.push(mod.toMod())
            }
        }

        logger.debug(`Converted Mods: ${out.toString()}`)

        return out
    }

    async lookupModrinthMod(ModID: string): Promise<Mod> {
        let out: Mod = new Mod()
        try {
            out = ModrinthMod.fromJSON((await axios.get(MODRINTH_URL.lookup + ModID, { headers: HEADERS })).data).toMod()
        }
        catch (error) {
            logger.error(`Error trying to lookup mod: ${ModID}`, error)
        }
        finally {
            logger.debug(`Modrinth Mod: ${out.toString()}`)
        }

        return out
    }

    async lookupCurseForgeMod(ModID: string): Promise<Mod> {
        let out: Mod = new Mod()
        try {
            out = CurseForgeMod.fromJSON((await axios.get(CURSEFORGE_URL.lookup + ModID, { headers: HEADERS })).data).toMod()
        }
        catch (error) {
            logger.error(`Error trying to lookup mod: ${ModID}`, error)
        }
        finally {
            logger.debug(`CurseForge Mod: ${out.toString()}`)
        }
        return out
    }

    async searchForModrinthMods(SearchQuery: string = "", Limit = 10, Offset = 0): Promise<Mod[]> {
        let out: Mod[] = []
        try {
            out = this.convertToMods((await axios.get(MODRINTH_URL.search, {
                headers: HEADERS,
                params: {
                    query: SearchQuery,
                    limit: Limit,
                    offset: Offset,
                    facets: [["project_type:mod"], [`versions:${this.MinecraftVersion}`]]
                }
            })).data)
        }
        catch (error) {
            logger.error(`Error trying to search for mods with query: ${SearchQuery}`, error)
        }
        finally {
            logger.debug(`Modrinth Mods: ${out.toString()}`)
        }
        return out
    }

    async searchForCurseForgeMods(SearchQuery: string = "test", Limit = 10, Offset = 0): Promise<Mod[]> {
        logger.debug(`Api Key: ${HEADERS["x-api-key"]}`)
        let out: Mod[] = []
        try {
            out = this.convertToMods((await axios.get(CURSEFORGE_URL.search, {
                headers: HEADERS,
                params: {
                    gameId: 432,
                    classId: 6,
                    searchFilter: SearchQuery,
                    pageSize: Limit,
                    index: Offset,
                    gameVersion: this.MinecraftVersion
                }
            })).data, true)
        }
        catch (error) {
            logger.error(`Error trying to search for mods with query: ${SearchQuery}`, error)
        }
        finally {
            logger.debug(`CurseForge Mods: ${out.toString()}`)
        }

        return out
    }

    searchForMods(SearchQuery: string = "", Limit = 10, Offset = 0) {
        // search for mods from both providers
        let out: Mods = new Mods()

        Promise.all([this.searchForModrinthMods(SearchQuery, Limit, Offset), this.searchForCurseForgeMods(SearchQuery, Limit, Offset)])
            .then((values) => {
                out.addMods(values[0])
                out.addMods(values[1])
            })
            .finally(() => logger.debug(`All Mods: ${out.toString()}`))

        return out
    }
}