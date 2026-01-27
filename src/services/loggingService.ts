/**
 * @file loggingService.ts
 * @module services
 * @description Centralized logging service with file output capability
 * @version 1.0.0
 * @since 2025-01-27
 *
 * Replaces all console.* statements with structured logging
 * Supports in-memory storage and file export
 */

export enum LogLevel {
	ERROR = 0,
	WARN = 1,
	INFO = 2,
	DEBUG = 3,
}

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	module: string;
	message: string;
	data?: any;
}

export interface LoggingConfig {
	maxMemoryLogs: number;
	enableConsoleOutput: boolean;
	minLogLevel: LogLevel;
}

class LoggingService {
	private logs: LogEntry[] = [];
	private config: LoggingConfig = {
		maxMemoryLogs: 10000,
		enableConsoleOutput: false, // Disabled by default to avoid console noise
		minLogLevel: LogLevel.INFO,
	};

	constructor() {
		// Initialize with system info
		this.info('LoggingService', 'Logging system initialized');
	}

	/**
	 * Configure logging behavior
	 */
	configure(config: Partial<LoggingConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Log an error message
	 */
	error(module: string, message: string, data?: any): void {
		this.log(LogLevel.ERROR, module, message, data);
	}

	/**
	 * Log a warning message
	 */
	warn(module: string, message: string, data?: any): void {
		this.log(LogLevel.WARN, module, message, data);
	}

	/**
	 * Log an info message
	 */
	info(module: string, message: string, data?: any): void {
		this.log(LogLevel.INFO, module, message, data);
	}

	/**
	 * Log a debug message
	 */
	debug(module: string, message: string, data?: any): void {
		this.log(LogLevel.DEBUG, module, message, data);
	}

	/**
	 * Internal logging method
	 */
	private log(level: LogLevel, module: string, message: string, data?: any): void {
		// Check if we should log this level
		if (level > this.config.minLogLevel) {
			return;
		}

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			module,
			message,
			data,
		};

		// Add to memory buffer
		this.logs.push(entry);

		// Maintain memory limit
		if (this.logs.length > this.config.maxMemoryLogs) {
			this.logs = this.logs.slice(-this.config.maxMemoryLogs);
		}

		// Optional console output (can be enabled for debugging)
		if (this.config.enableConsoleOutput) {
			this.outputToConsole(entry);
		}
	}

	/**
	 * Output to console (only if enabled)
	 */
	private outputToConsole(entry: LogEntry): void {
		const prefix = `[${entry.timestamp}] [${entry.module}]`;
		const message = `${prefix} ${entry.message}`;
		
		switch (entry.level) {
			case LogLevel.ERROR:
				console.error(message, entry.data);
				break;
			case LogLevel.WARN:
				console.warn(message, entry.data);
				break;
			case LogLevel.INFO:
				console.info(message, entry.data);
				break;
			case LogLevel.DEBUG:
				console.debug(message, entry.data);
				break;
		}
	}

	/**
	 * Get all logs
	 */
	getLogs(): LogEntry[] {
		return [...this.logs];
	}

	/**
	 * Get logs by level
	 */
	getLogsByLevel(level: LogLevel): LogEntry[] {
		return this.logs.filter(log => log.level === level);
	}

	/**
	 * Get logs by module
	 */
	getLogsByModule(module: string): LogEntry[] {
		return this.logs.filter(log => log.module === module);
	}

	/**
	 * Clear all logs
	 */
	clearLogs(): void {
		this.logs = [];
	}

	/**
	 * Export logs to downloadable file
	 */
	exportLogs(): void {
		const logText = this.logs
			.map(entry => {
				const levelName = LogLevel[entry.level];
				const dataStr = entry.data ? `\n  Data: ${JSON.stringify(entry.data, null, 2)}` : '';
				return `[${entry.timestamp}] [${levelName}] [${entry.module}] ${entry.message}${dataStr}`;
			})
			.join('\n');

		const blob = new Blob([logText], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = `oauth-playground-logs-${new Date().toISOString().split('T')[0]}.log`;
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	/**
	 * Get log statistics
	 */
	getStats(): { total: number; byLevel: Record<string, number>; byModule: Record<string, number> } {
		const stats = {
			total: this.logs.length,
			byLevel: {} as Record<string, number>,
			byModule: {} as Record<string, number>,
		};

		for (const log of this.logs) {
			const levelName = LogLevel[log.level];
			stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;
			stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
		}

		return stats;
	}
}

// Singleton instance
export const logger = new LoggingService();

// Export convenience functions
export const logError = (module: string, message: string, data?: any) => logger.error(module, message, data);
export const logWarn = (module: string, message: string, data?: any) => logger.warn(module, message, data);
export const logInfo = (module: string, message: string, data?: any) => logger.info(module, message, data);
export const logDebug = (module: string, message: string, data?: any) => logger.debug(module, message, data);
