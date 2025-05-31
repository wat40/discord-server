const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

class Logger {
    constructor() {
        this.logFile = path.join(logsDir, `modubot-${new Date().toISOString().split('T')[0]}.log`);
    }

    formatMessage(level, message, ...args) {
        const timestamp = new Date().toISOString();
        const formattedArgs = args.length > 0 ? ' ' + args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' ') : '';
        
        return `[${timestamp}] [${level.toUpperCase()}] ${message}${formattedArgs}`;
    }

    writeToFile(formattedMessage) {
        fs.appendFileSync(this.logFile, formattedMessage + '\n');
    }

    info(message, ...args) {
        const formatted = this.formatMessage('info', message, ...args);
        console.log(`\x1b[36m${formatted}\x1b[0m`); // Cyan
        this.writeToFile(formatted);
    }

    warn(message, ...args) {
        const formatted = this.formatMessage('warn', message, ...args);
        console.warn(`\x1b[33m${formatted}\x1b[0m`); // Yellow
        this.writeToFile(formatted);
    }

    error(message, ...args) {
        const formatted = this.formatMessage('error', message, ...args);
        console.error(`\x1b[31m${formatted}\x1b[0m`); // Red
        this.writeToFile(formatted);
    }

    debug(message, ...args) {
        if (process.env.LOG_LEVEL === 'debug') {
            const formatted = this.formatMessage('debug', message, ...args);
            console.log(`\x1b[90m${formatted}\x1b[0m`); // Gray
            this.writeToFile(formatted);
        }
    }

    success(message, ...args) {
        const formatted = this.formatMessage('success', message, ...args);
        console.log(`\x1b[32m${formatted}\x1b[0m`); // Green
        this.writeToFile(formatted);
    }
}

const logger = new Logger();

module.exports = { logger };
