"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfigFile = exports.writeToConfigFile = exports.ConfigFile = exports.SemanticVersioning = exports.configFileName = void 0;
const node_fs_1 = __importDefault(require("node:fs"));
const logger = require('./logger').createNewLogger('config-parser');
exports.configFileName = "packwiz-gui-config.toml";
class SemanticVersioning {
    constructor(major, minor, patch, prerelease = "", build = "") {
        this.major = major;
        this.minor = minor;
        this.patch = patch;
        this.prerelease = prerelease;
        this.build = build;
    }
    toString() {
        let version = `${this.major}.${this.minor}.${this.patch}`;
        if (this.prerelease !== "")
            version += `-${this.prerelease}`;
        if (this.build !== "")
            version += `+${this.build}`;
        return version;
    }
    static fromString(str) {
        const dot = ".";
        let major = "";
        let minor = "";
        let patch = "";
        let prerelease = "";
        let build = "";
        // 0 - major, 1 - minor, 2 - patch, 3 - prerelease, 4 - prerelease2, 5 - prerelease-ver, 6 - build
        let on = 0;
        logger.debug(`Semantic from string: String: ${str}, split: ${[...str].toString()}`);
        for (let i = 0; i < [...str].length; i++) {
            const char = [...str][i];
            logger.debug(`Semantic from string: Character: ${char}|On: ${on}`);
            switch (char) {
                case "'":
                    continue;
                case dot:
                    on += 1;
                    continue;
                case "-":
                    on = 3;
                    continue;
                case "+":
                    on = 6;
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
                    build += char;
            }
        }
        logger.debug(`Semantic from string: ${major}.${minor}.${patch}${prerelease !== "" ? "-" + prerelease : ""}`);
        return new SemanticVersioning(major, minor, patch, prerelease, build);
    }
}
exports.SemanticVersioning = SemanticVersioning;
class ConfigFile {
    constructor(project_dir = "", packwiz_exe_file = "", project_version) {
        this.project_dir = project_dir;
        this.packwiz_exe_file = packwiz_exe_file;
        this.project_version = project_version ? project_version : new SemanticVersioning(0, 0, 1);
    }
    toString() {
        return `project_dir = '${this.project_dir}'\npackwiz_exe_file = '${this.packwiz_exe_file}'`
            + `\nproject_version = '${this.project_version.toString()}'`;
    }
    static fromString(str) {
        const sep = ' = ';
        let project_dir;
        let packwiz_exe_file;
        let project_version;
        let lines = str.split('\n');
        const repl = /'/gi;
        project_dir = lines[0].split(sep)[1].replace(repl, '');
        packwiz_exe_file = lines[1].split(sep)[1].replace(repl, '');
        project_version = SemanticVersioning.fromString(lines[2].split(sep)[1]);
        return new ConfigFile(project_dir, packwiz_exe_file, project_version);
    }
}
exports.ConfigFile = ConfigFile;
function writeToConfigFile(config = new ConfigFile()) {
    node_fs_1.default.writeFile(`./${exports.configFileName}`, config.toString(), { flag: 'w' }, err => {
        if (err) {
            logger.error(err);
            return new ConfigFile();
        }
        else {
            logger.info("Successfully wrote to the config file!");
        }
    });
    return config;
}
exports.writeToConfigFile = writeToConfigFile;
function getConfigFile() {
    node_fs_1.default.readFile(`./${exports.configFileName}`, 'utf-8', (err, data) => {
        if (err) {
            logger.error(err);
            return writeToConfigFile();
        }
        logger.debug(data);
        try {
            let config = ConfigFile.fromString(data);
            logger.info(`Project Dir: ${config.project_dir}`);
            logger.info(`Packwiz file: ${config.packwiz_exe_file}`);
            logger.info(`Project Version: ${config.project_version.toString()}`);
            return config;
        }
        catch (e) {
            logger.error(e);
            return writeToConfigFile();
        }
    });
    return new ConfigFile();
}
exports.getConfigFile = getConfigFile;
