import chalk from 'chalk';

/**
 * Log levels with their corresponding numerical values
 */
export const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4
};

/**
 * A flexible logging utility for the Multi-Modal Agent system
 */
export class Logger {
    /**
     * Creates a new Logger instance
     * @param {string} context - The context/module name for this logger
     * @param {Object} options - Logger configuration options
     */
    constructor(context, options = {}) {
        this.context = context;
        this.options = {
            level: process.env.LOG_LEVEL || 'INFO',
            enableColors: true,
            timestamp: true,
            ...options
        };
    }

    /**
     * Formats the log message with timestamp and context
     * @private
     */
    formatMessage(level, message, error = null) {
        const timestamp = this.options.timestamp ? 
            `[${new Date().toISOString()}]` : '';
        const contextStr = `[${this.context}]`;
        const levelStr = `[${level}]`;
        
        let formattedMessage = `${timestamp} ${levelStr} ${contextStr} ${message}`;
        
        if (error) {
            formattedMessage += `\n${error.stack || error.message || error}`;
        }
        
        return formattedMessage;
    }

    /**
     * Applies color to the log message based on level
     * @private
     */
    colorize(level, message) {
        if (!this.options.enableColors) return message;

        const colors = {
            DEBUG: chalk.gray,
            INFO: chalk.blue,
            WARN: chalk.yellow,
            ERROR: chalk.red,
            FATAL: chalk.bgRed.white
        };

        return colors[level]?.(message) || message;
    }

    /**
     * Checks if the given log level should be logged
     * @private
     */
    shouldLog(level) {
        return LogLevel[level] >= LogLevel[this.options.level];
    }

    /**
     * Generic logging method
     * @private
     */
    log(level, message, error = null) {
        if (!this.shouldLog(level)) return;

        const formattedMessage = this.formatMessage(level, message, error);
        const colorizedMessage = this.colorize(level, formattedMessage);

        switch (level) {
            case 'ERROR':
            case 'FATAL':
                console.error(colorizedMessage);
                break;
            case 'WARN':
                console.warn(colorizedMessage);
                break;
            default:
                console.log(colorizedMessage);
        }
    }

    /**
     * Logs a debug message
     * @param {string} message - The message to log
     * @param {Error} [error] - Optional error object
     */
    debug(message, error = null) {
        this.log('DEBUG', message, error);
    }

    /**
     * Logs an info message
     * @param {string} message - The message to log
     * @param {Error} [error] - Optional error object
     */
    info(message, error = null) {
        this.log('INFO', message, error);
    }

    /**
     * Logs a warning message
     * @param {string} message - The message to log
     * @param {Error} [error] - Optional error object
     */
    warn(message, error = null) {
        this.log('WARN', message, error);
    }

    /**
     * Logs an error message
     * @param {string} message - The message to log
     * @param {Error} [error] - Optional error object
     */
    error(message, error = null) {
        this.log('ERROR', message, error);
    }

    /**
     * Logs a fatal error message
     * @param {string} message - The message to log
     * @param {Error} [error] - Optional error object
     */
    fatal(message, error = null) {
        this.log('FATAL', message, error);
    }
}
