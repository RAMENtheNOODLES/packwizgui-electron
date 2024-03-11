import fs from 'node:fs'
import {ConfigFile, getConfigFile, writeToConfigFile} from "./config-parser";
import toml from 'toml'
import {WebUtils} from "./web-utils";

const INDEX_FILE_NAME = "index.json"

export function getAllModIndexFiles(folder: string) {
    const logger = require('./logger').createNewLogger('getAllModIndexFiles', 'packwiz-utils')
    let out: string[] = []
    try {
        let files: string[] = fs.readdirSync(folder)
        for (let i = 0; i < files.length; i++) {
            logger.debug(`Index file (${i}): ${files[i]}`)
            out.push(files[i])
        }
    } catch (e: any) {
        logger.error(e)
    }

    return out
}

export function isNumeric(str: string): boolean {
    return !Number.isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        !Number.isNaN(parseFloat(str)) // ...and ensure strings of whitespace fail
}

export function getTotalIndexedMods(): number {
    return Mods.fromString(JSON.parse(fs.readFileSync(INDEX_FILE_NAME).toString())).getTotalMods()
}

export class Mod {
    static logger = require('./logger').createNewLogger('Mod', 'packwiz-utils')
    ModID?: string
    Slug?: string
    Title?: string
    Author?: string
    Description?: string

    constructor(modID?: string, slug?: string, title?: string, author?: string, description?: string) {
        this.ModID = modID
        this.Slug = slug
        this.Title = title
        this.Author = author
        this.Description = description
    }

    toString() {
        return JSON.stringify(this, null, 4)
    }

    static toHTML(mod: Mod, installMod: boolean = false): string {
        const MOD_ID_BTN = `${installMod ? "ADD" : "REMOVE"}-MOD-${mod.ModID}`
        const MOD_LABEL = `${installMod ? "<i class=\"far fa-plus-square\"></i>" : "<i class=\"far fa-minus-square\"></i>"}`
        return  `<tr id="MOD:${mod.ModID}"><td>${mod.ModID}</td>` +
                `<td>${mod.Slug}</td>` +
                `<td>${mod.Title}</td>` +
                `<td>${mod.Author}</td>` +
                `<td>${mod.Description}</td>` +
                `<td>N/A</td>` +
                `<td><button class="btn btn-primary" id="${MOD_ID_BTN}" type="button" aria-label="${installMod ? "Add Mod" : "Remove Mod"}">${MOD_LABEL}</button></td></tr>`
    }

    public toHTML() {
        return  `<tr id="MOD:${this.ModID}"><td>${this.ModID}</td>` +
                `<td>${this.Slug}</td>` +
                `<td>${this.Title}</td>` +
                `<td>${this.Author}</td>` +
                `<td>${this.Description}</td>` +
                `<td>N/A</td>` +
                `<td><button class="btn btn-primary" id="REMOVE-MOD-${this.ModID}" type="button" aria-label="Remove Mod"><i class="far fa-minus-square"></i></button></td></tr>`
    }

    getMissingInfo(): Mod {
        const WEB_UTILS = new WebUtils()

        if (Number.isInteger(<string>this.ModID)) {
            WEB_UTILS.lookupCurseForgeMod(<string>this.ModID)
                .then((mod) => {
                    Mod.logger.info(`Mod: ${mod.Title}`)
                    this.Slug = mod.Slug
                    this.Author = mod.Author
                    this.Description = mod.Description
                })
                .catch((error) => Mod.logger.error(`Error trying to lookup mod: ${this.ModID}`, error))
            return this
        }

        WEB_UTILS.lookupModrinthMod(<string>this.ModID)
            .then((mod) => {
                this.Slug = mod.Slug
                this.Author = mod.Author
                this.Description = mod.Description
            })
            .catch((error) => Mod.logger.error(`Error trying to lookup mod: ${this.ModID}`, error))

        return this
    }

    static fromJSON(d: Object): Mod {
        return Object.assign(new Mod(), d)
    }

    static fromTOML(t: any): Mod {
        let ModID: string
        let Slug: string = ""
        let Title: string = t.name
        let Author: string = ""
        let Description = ""

        try {
            ModID = t.update.modrinth["mod-id"]
        } catch (e: any) {
            ModID = t.update.curseforge["project-id"]
        }

        return new Mod(ModID, Slug, Title, Author, Description)
    }
}

export module CLI_UTILS {
    const CLI_LOGGER = require('./logger').createNewLogger('CLI-utils', "packwiz-utils")
    const PACKWIZ_EXE = ConfigFile.getPackwizExeFile()
    const PROJECT_DIR = ConfigFile.getProjectDir()

    function runCommand(command: string, cwd?: string): string {
        const { exec } = require('child_process')

        const CWD = cwd ? cwd : PROJECT_DIR

        exec(command, { encoding: 'utf-8', cwd: CWD }, (error: any, stdout: any, stderr: any) => {
            if (error) {
                CLI_LOGGER.error(`Error running command: ${command}`, error)
                return ""
            }

            CLI_LOGGER.debug(`Command: ${command} ran successfully!`)
            CLI_LOGGER.info(`stdout: ${stdout}`)
            CLI_LOGGER.error(`stderr: ${stderr}`)

            return stdout
        })

        return ""
    }

    export function commandBuilder(command: string) {
        return `"${PACKWIZ_EXE}" ${command}`
    }

    export function removeMod(slug: string): string {
        return runCommand(commandBuilder(`remove ${slug} -y`))
    }

    export function refreshPackwiz(): string {
        return runCommand(commandBuilder(`refresh`))
    }

    export function initPackwiz(author: string, modpackName: string, modpackVersion: string,
                                modloader: string, modLoaderVersion = "", minecraftVersion = "",
                                reInit = false) {
        const MOD_ENDING = modLoaderVersion == "" ? "-latest" : `-version ${modLoaderVersion}`
        const MC_ENDING = minecraftVersion == "" ? "-latest" : `--mc-version ${minecraftVersion}`
        const RE_INIT = reInit ? "-r" : ""

        const CMD = `init --author ${author} --name ${modpackName} ` +
            `--version ${modpackVersion} --modloader ${modloader} --${modloader}${MOD_ENDING} ${MC_ENDING} ${RE_INIT}`

        return runCommand(commandBuilder(CMD))
    }

    export function pinMod(slug: string) {
        return runCommand(commandBuilder(`pin ${slug}`))
    }

    export function unpinMod(slug: string) {
        return runCommand(commandBuilder(`unpin ${slug}`))
    }

    export function updateMod(slug: string) {
        return runCommand(commandBuilder(`update ${slug} -y`))
    }

    export function updateAllMods() {
        return runCommand(commandBuilder(`update -a -y`))
    }

    export function addMod(id: string) {
        const fromModrinth = Number.isNaN(id)
        CLI_LOGGER.info(`Installing: ${id} from ${fromModrinth ? "Modrinth" : "CurseForge"}`)
        if (fromModrinth) {
            return runCommand(commandBuilder(`modrinth add ${id} -y`))
        }
        return runCommand(commandBuilder(`curseforge add ${id} -y`))
    }
}

export class Mods {
    static logger = require('./logger').createNewLogger('Mods', 'packwiz-utils')
    Mods: { [id: string] : Mod }
    TotalMods: number = 0
    HTML_TABLE: string = ""
    files: string[] = []

    constructor()
    constructor(Mods: { [id: string] : Mod } = {}, files: string[] = []) {
        this.Mods = Mods
        this.files = files
    }

    private readFromFile(file: string) {
        Mods.logger.debug(`Reading: ${file}`)
        return fs.readFileSync(file).toString()
    }

    toString() {
        return JSON.stringify(this, null, 4)
    }

    static fromString(d: Object): Mods {
        return Object.assign(new Mods(), d)
    }

    addMod(mod: Mod) {
        if (mod.Title) {
            this.TotalMods += 1
            this.Mods[mod.Title] = mod;
        }
    }

    addMods(mods: Mod[]) {
        for (let i = 0; i < mods.length; i++) {
            this.addMod(mods[i])
            this.TotalMods += 1
        }
    }

    async addModsAsync(mods: Mod[]) {
        for (let i = 0; i < mods.length; i++) {
            this.addMod(mods[i])
            this.TotalMods += 1
        }
    }

    removeMod(mod: Mod) {
        if (mod.Title) {
            this.TotalMods -= 1
            // @ts-ignore
            this.Mods[mod.Title] = null
        }
    }

    getTotalMods(): number {
        return this.TotalMods
    }

    getAllModIds(): string[] {
        let out: string[] = []
        for (let i = 0; i < this.TotalMods; i++) {
            try {
                const mod = this.Mods[Object.keys(this.Mods)[i]]
                out.push(<string>mod.ModID)
            }
            catch (error) {
                Mods.logger.error(`Error trying to get the mod: ${this.Mods[Object.keys(this.Mods)[i]]}`, error)
            }
        }

        return out
    }

    index() {
        fs.writeFileSync(INDEX_FILE_NAME, this.toString(), {flag: "w+"})
    }

    static resetIndexFile() {
        fs.writeFileSync(INDEX_FILE_NAME, "{}", {flag: "w+"})
    }

    getModFromID(modID: string): Mod {
        for (let i = 0; i < this.TotalMods; i++) {
            try {
                const mod = this.Mods[Object.keys(this.Mods)[i]]
                if (mod.ModID == modID)
                    return mod
            }
            catch (error) {
                Mods.logger.error(`Error trying to get the mod: ${this.Mods[Object.keys(this.Mods)[i]]}`, error)
            }
        }

        return new Mod()
    }

    getSlugFromID(modID: string): string {
        Mods.logger.debug(`Getting slug from ID: ${modID}`)
        for (let i = 0; i < this.TotalMods; i++) {
            try {
                const mod = this.Mods[Object.keys(this.Mods)[i]]
                if (mod.ModID == modID)
                    return <string>mod.Slug
            }
            catch (error) {
                Mods.logger.error(`Error trying to get the mod: ${this.Mods[Object.keys(this.Mods)[i]]}`, error)
            }
        }

        return ""
    }

    getModTitleFromID(modID: string): string {
        for (let i = 0; i < this.TotalMods; i++) {
            try {
                const mod = this.Mods[Object.keys(this.Mods)[i]]
                if (mod.ModID == modID)
                    return <string>mod.Title
            }
            catch (error) {
                Mods.logger.error(`Error trying to get the mod: ${this.Mods[Object.keys(this.Mods)[i]].ModID}`, error)
            }
        }

        return ""
    }

    static getFromIndex(): Mods {
        let out = new Mods()
        try {
            out = Mods.fromString(JSON.parse(fs.readFileSync(INDEX_FILE_NAME).toString()))
        }
        catch (error) {
            Mods.logger.error("Error trying to get mods from index!", error)

            out.index()
            out.fillFromModsFolder()
        }

        return out

    }

    refreshModHTMLTable(installMods: boolean = false) {
        this.HTML_TABLE = ""
        for (let i = 0; i < this.TotalMods; i++) {
            try {
                let mod = this.Mods[Object.keys(this.Mods)[i]]

                if (mod == null) {
                    Mods.logger.warn(`Skipping: ${this.Mods[Object.keys(this.Mods)[i]]}`)
                    continue
                }

                Mods.logger.debug(`Mod: ${mod.ModID}`)
                const MOD_HTML = Mod.toHTML(mod, installMods)
                this.HTML_TABLE = this.HTML_TABLE + MOD_HTML
                Mods.logger.debug(`Adding Mod HTML: ${MOD_HTML}`)
            }
            catch (error) {
                Mods.logger.error(`Error trying to get the mod: ${this.Mods[Object.keys(this.Mods)[i]].ModID}`, error)
            }
        }

        Mods.logger.info(`HTML Table: ${this.HTML_TABLE}`)
    }

    fillFromModsFolder() {
        const CONFIG_FILE = getConfigFile()
        const MODS_DIR = CONFIG_FILE?.mods_dir
        const mods = getAllModIndexFiles(<string>MODS_DIR)

        Mods.logger.debug(`Mods length: ${mods.length}`)
        this.TotalMods = mods.length

        if (mods.length == 0) {
            // @ts-ignore
            if (CONFIG_FILE) {
                CONFIG_FILE.mods_dir = CONFIG_FILE.project_dir + "\\mods"
                writeToConfigFile(CONFIG_FILE)
            }
        }

        Mods.logger.debug(`Mods: ${mods}`)
        for (const mod in mods) {
            if (this.files.includes(mods[mod])) {
                Mods.logger.debug(`Skipping: ${mod}`)
                continue
            }
            else if (mods[mod].includes(".jar")) {
                //this.TotalMods += 1
                continue
            }
            Mods.logger.debug(`Adding: ${mods[mod]}`)
            //this.TotalMods += 1

            try {
                let newMod = Mod.fromTOML(toml.parse(this.readFromFile(`${MODS_DIR}\\${mods[mod]}`)));
                newMod.getMissingInfo()

                this.Mods[<string>newMod.Title] = newMod
                this.files.push(mods[mod])
                this.HTML_TABLE += newMod.toHTML()
            } catch (e: any) {
                Mods.logger.error("Parsing error on line " + e.line + ", column " + e.column +
                    ": " + e.message);
            }
        }

        this.index()
    }

    toHTMLTable(): string {
        return this.HTML_TABLE
    }
}