"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNewLogger = void 0;
const winston_1 = require("winston");
const winston_2 = __importDefault(require("winston"));
function createNewLogger(context = "root", parent = "", level = "info") {
    const combinedContext = `${(parent !== "") ? parent + ":" : ""}${context}`;
    const logger = winston_2.default.loggers.add(context, {
        level: level,
        format: winston_1.format.combine(winston_1.format.timestamp({
            format: 'HH:mm:ss'
        }), winston_1.format.errors({ stack: true }), winston_1.format.splat(), winston_1.format.label({ label: combinedContext, message: true }), winston_1.format.simple()),
        defaultMeta: { service: 'packwiz-gui' },
        transports: [
            new winston_1.transports.File({ filename: 'error.log', level: 'error' }),
            new winston_1.transports.File({ filename: 'combined.log', level: level }),
            new winston_1.transports.Http({
                level: 'warn',
                format: winston_1.format.combine(winston_1.format.label({ label: combinedContext }), winston_1.format.json())
            }),
        ],
    });
    if (process.env.NODE_ENV !== 'production') {
        logger.add(new winston_1.transports.Console({
            format: winston_1.format.combine(winston_1.format.cli()),
        }));
    }
    return logger;
}
exports.createNewLogger = createNewLogger;
