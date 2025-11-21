// Create logs directory if it doesn't exist
import fs from 'fs';
import path from 'path';
import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';

const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
	fs.mkdirSync(logsDir, { recursive: true });
}

// Define log format
const logFormat = winston.format.combine(
	winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
	winston.format.errors({ stack: true }),
	winston.format.json(),
	winston.format.printf(({ timestamp, level, message, ...meta }) => {
		let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
		if (Object.keys(meta).length > 0) {
			log += ` ${JSON.stringify(meta)}`;
		}
		return log;
	})
);

// Create Winston logger
const logger = winston.createLogger({
	level: process.env.LOG_LEVEL || 'info',
	format: logFormat,
	transports: [
		// Console transport for development
		new winston.transports.Console({
			format: winston.format.combine(
				winston.format.colorize(),
				winston.format.simple(),
				winston.format.printf(({ level, message, timestamp }) => {
					return `${timestamp} ${level}: ${message}`;
				})
			),
		}),

		// Server log file - rotates daily
		new DailyRotateFile({
			filename: path.join(logsDir, 'server-%DATE%.log'),
			datePattern: 'YYYY-MM-DD',
			maxSize: '20m',
			maxFiles: '14d',
			format: logFormat,
		}),

		// Error log file - separate file for errors only
		new DailyRotateFile({
			filename: path.join(logsDir, 'server-error-%DATE%.log'),
			datePattern: 'YYYY-MM-DD',
			level: 'error',
			maxSize: '20m',
			maxFiles: '30d',
			format: logFormat,
		}),
	],
});

// Handle uncaught exceptions and unhandled rejections
logger.exceptions.handle(
	new DailyRotateFile({
		filename: path.join(logsDir, 'exceptions-%DATE%.log'),
		datePattern: 'YYYY-MM-DD',
		maxSize: '20m',
		maxFiles: '30d',
	})
);

logger.rejections.handle(
	new DailyRotateFile({
		filename: path.join(logsDir, 'rejections-%DATE%.log'),
		datePattern: 'YYYY-MM-DD',
		maxSize: '20m',
		maxFiles: '30d',
	})
);

// Export logger
export default logger;

// Helper functions for different log levels
export const logStartup = (message, meta = {}) => {
	logger.info(`🚀 STARTUP: ${message}`, meta);
};

export const logError = (message, error = null, meta = {}) => {
	logger.error(`❌ ERROR: ${message}`, {
		error: error?.message || error,
		stack: error?.stack,
		...meta,
	});
};

export const logWarning = (message, meta = {}) => {
	logger.warn(`⚠️  WARNING: ${message}`, meta);
};

export const logSuccess = (message, meta = {}) => {
	logger.info(`✅ SUCCESS: ${message}`, meta);
};

export const logInfo = (message, meta = {}) => {
	logger.info(`ℹ️  INFO: ${message}`, meta);
};

export const logDebug = (message, meta = {}) => {
	logger.debug(`🔍 DEBUG: ${message}`, meta);
};
