import fs from 'node:fs'

const logger = require('./logger').createNewLogger('config-parser')

export const configFileName = "packwiz-gui-config.json"

export class SemanticVersioning {
    major?: number;
    minor?: number;
    patch?: number;
    prerelease: string;
    build: string;

    /**
     * Creates a new SemanticVersioning object
     * @param major The major version (x in x.y.z)
     * @param minor The minor version (y in x.y.z)
     * @param patch The patch version (z in x.y.z)
     * @param prerelease The prerelease version (alpha, beta, etc.)
     * @param build The build version (build number, etc.)
     */
    constructor(major?: number, minor?: number, patch?: number, prerelease: string = "", build: string = "") {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.prerelease = prerelease;
        this.build = build;
    }

    /**
     * Outputs the version as a string
     * @see fromString
     */
    toString(): string {
        let version: string = `${this.major}.${this.minor}.${this.patch}`

        if (this.prerelease !== "") version += `-${this.prerelease}`
        if (this.build !== "") version += `+${this.build}`

        return version;
    }

    toJSONString() {
        return JSON.stringify(this)
    }

    /**
     * Takes in a JSON object and outputs a SemanticVersioning object
     * @param d The JSON object
     */
    static fromJSON(d: Object): SemanticVersioning {
        return Object.assign(new SemanticVersioning(), d)
    }

    /**
     * Takes in a version string and outputs a SemanticVersioning object
     * @param str The version string
     * @returns A SemanticVersioning object
     * @see toString
     */
    static fromString(str: string) {
        const dot = "."
        let major: string = "";
        let minor: string = "";
        let patch: string = "";
        let prerelease: string = "";
        let build: string = "";

        // 0 - major, 1 - minor, 2 - patch, 3 - prerelease, 4 - prerelease2, 5 - prerelease-ver, 6 - build
        let on = 0;

        logger.debug(`Semantic from string: String: ${str}, split: ${[...str].toString()}`)

        for (let i = 0; i < [...str].length; i++) {
            const char = [...str][i]
            logger.debug(`Semantic from string: Character: ${char}|On: ${on}`)
            switch (char) {
                case "'":
                    continue;
                case dot:
                    on += 1;
                    continue;
                case "-":
                    on = 3
                    continue;
                case "+":
                    on = 6
                    continue;
            }

            switch (on) {
                case 0:
                    major += char;
                    break;
                case 1:
                    minor += char;
                    break;
                case 2:
                    patch += char;
                    break;
                case 3:
                case 4:
                case 5:
                    prerelease += char;
                    break;
                case 6:
                    build += char
            }
        }

        logger.debug(
            `Semantic from string: ${major}.${minor}.${patch}${prerelease !== "" ? "-" + prerelease : ""}`)

        return new SemanticVersioning(<number><unknown>major, <number><unknown>minor,
            <number><unknown>patch, prerelease, build)
    }
}

export class ConfigFile {
    project_dir: string;
    packwiz_exe_file: string;
    project_version: SemanticVersioning;
    mods_dir: string;
    project_name: string;

    constructor();
    constructor(project_dir: string, packwiz_exe_file: string);
    constructor(project_dir: string, packwiz_exe_file:string, project_version: SemanticVersioning)
    constructor(project_dir = "", packwiz_exe_file = "", project_version?: SemanticVersioning, project_name = "") {
        this.project_dir = project_dir;
        this.packwiz_exe_file = packwiz_exe_file;
        this.project_version = project_version ? project_version : new SemanticVersioning(0, 0, 1);
        this.mods_dir = project_dir + "\\mods"
        this.project_name = project_name
    }

    /**
     * Writes the config file to the disk
     */
    write() {
        this.mods_dir = this.project_dir + "\\mods"
        writeToConfigFile(this)
    }

    /**
     * Outputs the config file as a string
     */
    toString(): string {
        return JSON.stringify(this, undefined, 4)
    }

    /**
     * Takes in a JSON object and outputs a ConfigFile object
     * @param d The JSON object
     * @see toString
     */
    static fromJSON(d: Object): ConfigFile {
        let o = Object.assign(new ConfigFile(), d)
        o.project_version = SemanticVersioning.fromJSON(o['project_version'])
        o.mods_dir = o.project_dir + "\\mods"
        return o
    }

    static getPackwizExeFile(): string {
        return getConfigFile().packwiz_exe_file
    }

    static getProjectDir(): string {
        return getConfigFile().project_dir
    }

    /**
     * Takes in a string and outputs a ConfigFile object
     * @param str The string
     * @returns A ConfigFile object
     * @see toString
     */
    static fromString(str: string): ConfigFile {
        const sep = ' = '
        let project_dir: string;
        let packwiz_exe_file: string;
        let project_version: SemanticVersioning;

        let lines = str.split('\n')

        const repl: RegExp = /'/gi

        project_dir = lines[0].split(sep)[1].replace(repl, '')
        packwiz_exe_file = lines[1].split(sep)[1].replace(repl, '')
        project_version = SemanticVersioning.fromString(lines[2].split(sep)[1])

        return new ConfigFile(project_dir, packwiz_exe_file, project_version)
    }
}

/**
 * @overload
 */
/**
 * @overload
 * @param config The config file
 */
/**
 * Writes the config file to the disk
 * @returns The config file
 */
export function writeToConfigFile(): ConfigFile;
export function writeToConfigFile(config: ConfigFile): ConfigFile;
export function writeToConfigFile(config: ConfigFile = new ConfigFile()): ConfigFile {
    try {
        fs.writeFileSync(`./${configFileName}`,
            config.toString(),
            {flag: 'w+'})
        logger.info("Successfully wrote to the config file!")
    } catch (e) {
        logger.error(e);
        return new ConfigFile();
    }
    return config;
}

/**
 * Reads the config file from the disk
 * @returns The config file
 */
export function getConfigFile(): ConfigFile {
    try {
        const data = fs.readFileSync(`./${configFileName}`, 'utf-8')

        let config: ConfigFile = ConfigFile.fromJSON(JSON.parse(data));
        logger.debug(`Project Dir: ${config.project_dir}`)
        logger.debug(`Packwiz file: ${config.packwiz_exe_file}`)
        logger.debug(`Project Version: ${config.project_version.toString()}`)

        logger.info('Successfully loaded the config!')
        return config;
    } catch (e) {
        logger.error(e)
        return writeToConfigFile()
    }
}