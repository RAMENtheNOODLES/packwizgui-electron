import fs from 'node:fs'

const logger = require('./logger').createNewLogger('config-parser')

export const configFileName = "packwiz-gui-config.toml"

export class SemanticVersioning {
    major: number;
    minor: number;
    patch: number;
    prerelease: string;
    build: string;

    constructor(major: number, minor: number, patch: number, prerelease: string = "", build: string = "") {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.prerelease = prerelease;
        this.build = build;
    }

    toString(): string {
        let version: string = `${this.major}.${this.minor}.${this.patch}`

        if (this.prerelease !== "") version += `-${this.prerelease}`
        if (this.build !== "") version += `+${this.build}`

        return version;
    }

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

    constructor();
    constructor(project_dir: string, packwiz_exe_file: string);
    constructor(project_dir: string, packwiz_exe_file:string, project_version: SemanticVersioning)
    constructor(project_dir = "", packwiz_exe_file = "", project_version?: SemanticVersioning) {
        this.project_dir = project_dir;
        this.packwiz_exe_file = packwiz_exe_file;
        this.project_version = project_version ? project_version : new SemanticVersioning(0, 0, 1);
    }

    toString(): string {
        return `project_dir = '${this.project_dir}'\npackwiz_exe_file = '${this.packwiz_exe_file}'`
            + `\nproject_version = '${this.project_version.toString()}'`;
    }

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

export function createConfigFile(config: ConfigFile) {
    fs.writeFile(`./${configFileName}`, config.toString(), { flag: 'w'}, err => {
        if (err) {
            logger.error(err);
            return;
        } else {
            logger.info("Successfully wrote to the config file!")
        }
    })
}

export default function getConfigFile() {
    fs.readFile(`./${configFileName}`, 'utf-8', (err: any, data: any) => {
        if (err) {
            logger.error(err)
            createConfigFile(new ConfigFile())
            return
        }
        logger.debug(data)

        try {
            let config: ConfigFile = ConfigFile.fromString(data);
            logger.debug(`Project Dir: ${config.project_dir}`)
            logger.debug(`Packwiz file: ${config.packwiz_exe_file}`)
            logger.debug(`Project Version: ${config.project_version.toString()}`)
            return config;
        } catch (e: any) {
            logger.error(e)
        }
    })
}