import fs from 'node:fs'
import {getConfigFile, writeToConfigFile} from "./config-parser";
import toml from 'toml'
import {WebUtils} from "./web-utils";
const logger = require('./logger').createNewLogger('packwiz-utils')

const INDEX_FILE_NAME = "index.json"

export function getAllModIndexFiles(folder: string) {
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

export function getTotalIndexedMods(): number {
    return Mods.fromString(JSON.parse(fs.readFileSync(INDEX_FILE_NAME).toString())).getTotalMods()
}

export class Mod {
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

    toHTML() {
        return  `<tr><td>${this.ModID}</td>` +
                `<td>${this.Slug}</td>` +
                `<td>${this.Title}</td>` +
                `<td>${this.Author}</td>` +
                `<td>${this.Description}</td>` +
                `<td>N/A</td>` +
                `<td>Button</td></tr>`
    }

    getMissingInfo(): Mod {
        const WEB_UTILS = new WebUtils()
        WEB_UTILS.lookupModrinthMod(<string>this.ModID)
            .then((mod) => {
                this.Slug = mod.Slug
                this.Author = mod.Author
                this.Description = mod.Description
            })
            .catch((error) => logger.error(`Error trying to lookup mod: ${this.ModID}`, error))

        return this
    }

    static fromJSON(d: Object): Mod {
        return Object.assign(new Mod(), d)
    }

    mergeMissingInfo(mod: Mod) {
        if (!this.Slug)
            this.Slug = mod.Slug
        if (!this.Author)
            this.Author = mod.Author
        if (!this.Description)
            this.Description = mod.Description
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
            ModID = t.update.curseforge["file-id"]
        }

        return new Mod(ModID, Slug, Title, Author, Description)
    }
}

export class Mods {
    Mods: { [id: string] : Mod }
    private TotalMods: number = 0
    private HTML_TABLE: string = ""
    files: string[] = []

    constructor()
    constructor(Mods: { [id: string] : Mod } = {}, files: string[] = []) {
        this.Mods = Mods
        this.files = files
    }

    private readFromFile(file: string) {
        logger.debug(`Reading: ${file}`)
        return fs.readFileSync(file).toString()
    }

    toString() {
        return JSON.stringify(this, null, 4)
    }

    static fromString(d: Object): Mods {
        return Object.assign(new Mods(), d)
    }

    addMod(mod: Mod) {
        if (mod.Title)
            this.Mods[mod.Title] = mod;
    }

    addMods(mods: Mod[]) {
        for (let i = 0; i < mods.length; i++) {
            this.addMod(mods[i])
        }
    }

    removeMod(mod: Mod) {
        if (mod.Title) {
            // @ts-ignore
            this.Mods[mod.Title] = null
        }
    }

    getTotalMods(): number {
        return this.TotalMods
    }

    index() {
        fs.writeFileSync(INDEX_FILE_NAME, this.toString())
    }

    static getFromIndex(): Mods {
        let out = new Mods()
        try {
            out = Mods.fromString(JSON.parse(fs.readFileSync(INDEX_FILE_NAME).toString()))
        }
        catch (error) {
            logger.error("Error trying to get mods from index!", error)

            out.index()
            out.fillFromModsFolder()
        }

        return out

    }

    fillFromModsFolder() {
        const CONFIG_FILE = getConfigFile()
        const MODS_DIR = CONFIG_FILE?.mods_dir
        const mods = getAllModIndexFiles(<string>MODS_DIR)

        logger.debug(`Mods length: ${mods.length}`)
        this.TotalMods = mods.length

        if (mods.length == 0) {
            // @ts-ignore
            if (CONFIG_FILE) {
                CONFIG_FILE.mods_dir = CONFIG_FILE.project_dir + "\\mods"
                writeToConfigFile(CONFIG_FILE)
            }
        }

        logger.debug(`Mods: ${mods}`)
        for (const mod in mods) {
            if (this.files.includes(mods[mod])) {
                logger.debug(`Skipping: ${mod}`)
                continue
            }
            else if (mods[mod].includes(".jar")) {
                //this.TotalMods += 1
                continue
            }
            logger.debug(`Adding: ${mods[mod]}`)
            //this.TotalMods += 1

            try {
                let newMod = Mod.fromTOML(toml.parse(this.readFromFile(`${MODS_DIR}\\${mods[mod]}`)));
                newMod.getMissingInfo()

                this.Mods[<string>newMod.Title] = newMod
                this.files.push(mods[mod])
                this.HTML_TABLE += newMod.toHTML()
            } catch (e: any) {
                logger.error("Parsing error on line " + e.line + ", column " + e.column +
                    ": " + e.message);
            }
        }

        this.index()
    }

    toHTMLTable(): string {
        return this.HTML_TABLE
    }
}