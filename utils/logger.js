const { format, transports } = require('winston')
const winston = require('winston')

function createNewLogger(context = "root", parent = "", level = "info") {
    const combinedContext = `${(parent !== "") ? parent + ":" : ""}${context}`

    const logger = winston.loggers.add(context, {
        level: level,
        format: format.combine(
            format.timestamp({
                format: 'HH:mm:ss'
            }),
            format.errors({ stack: true }),
            format.splat(),
            format.label({ label: combinedContext, message: true }),
            format.simple()
        ),
        defaultMeta: { service: 'packwiz-gui' },
        transports: [
            new transports.File({ filename: 'error.log', level: 'error' }),
            new transports.File({ filename: 'combined.log', level: level }),
            new transports.Http({
                level: 'warn',
                format: format.combine(
                    format.label({ label: combinedContext }),
                    format.json()
                )
            }),
        ],
    })

    if (process.env.NODE_ENV !== 'production') {
        logger.add(new transports.Console({
            format: format.combine(
                format.cli()
            ),
        }))
    }

    return logger
}

module.exports = {
    createNewLogger,
}