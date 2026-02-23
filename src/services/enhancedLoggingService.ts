/**
 * @file enhancedLoggingService.ts
 * @module services
 * @description Enhanced logging service with colors, icons, and better formatting
 * @version 1.0.0
 * @since 2026-02-22
 *
 * Features:
 * - Color-coded log levels with ANSI escape codes
 * - Rich icons and emojis for different log types
 * - Professional banners and separators
 * - Entry separation and clear visual hierarchy
 * - Multiple output formats (console, file, structured)
 */

// ANSI color codes for terminal output
export const Colors = {
	// Bright colors
	BLACK: '\x1b[30m',
	RED: '\x1b[31m',
	GREEN: '\x1b[32m',
	YELLOW: '\x1b[33m',
	BLUE: '\x1b[34m',
	MAGENTA: '\x1b[35m',
	CYAN: '\x1b[36m',
	WHITE: '\x1b[37m',

	// Bright variants
	BRIGHT_BLACK: '\x1b[90m',
	BRIGHT_RED: '\x1b[91m',
	BRIGHT_GREEN: '\x1b[92m',
	BRIGHT_YELLOW: '\x1b[93m',
	BRIGHT_BLUE: '\x1b[94m',
	BRIGHT_MAGENTA: '\x1b[95m',
	BRIGHT_CYAN: '\x1b[96m',
	BRIGHT_WHITE: '\x1b[97m',

	// Background colors
	BG_BLACK: '\x1b[40m',
	BG_RED: '\x1b[41m',
	BG_GREEN: '\x1b[42m',
	BG_YELLOW: '\x1b[43m',
	BG_BLUE: '\x1b[44m',
	BG_MAGENTA: '\x1b[45m',
	BG_CYAN: '\x1b[46m',
	BG_WHITE: '\x1b[47m',

	// Styles
	RESET: '\x1b[0m',
	BOLD: '\x1b[1m',
	DIM: '\x1b[2m',
	UNDERLINE: '\x1b[4m',
	BLINK: '\x1b[5m',
	REVERSE: '\x1b[7m',
	HIDDEN: '\x1b[8m',
};

export enum LogLevel {
	ERROR = 0,
	WARN = 1,
	INFO = 2,
	DEBUG = 3,
	SUCCESS = 4,
	FLOW = 5,
	SECURITY = 6,
	AUTH = 7,
	CONFIG = 8,
	API = 9,
	STORAGE = 10,
	UI = 11,
	DISCOVERY = 12,
}

export interface LogEntry {
	timestamp: string;
	level: LogLevel;
	module: string;
	message: string;
	data?: unknown;
	duration?: number;
	stackTrace?: string;
}

export interface LogConfig {
	maxMemoryLogs: number;
	enableConsoleOutput: boolean;
	enableFileOutput: boolean;
	minLogLevel: LogLevel;
	enableColors: boolean;
	enableIcons: boolean;
	enableBanners: boolean;
}

export class EnhancedLoggingService {
	private logs: LogEntry[] = [];
	private config: LogConfig = {
		maxMemoryLogs: 10000,
		enableConsoleOutput: true,
		enableFileOutput: true,
		minLogLevel: LogLevel.INFO,
		enableColors: true,
		enableIcons: true,
		enableBanners: true,
	};

	// Log level configurations
	private readonly levelConfigs = {
		[LogLevel.ERROR]: {
			name: 'ERROR',
			color: Colors.BRIGHT_RED,
			bgColor: Colors.BG_RED,
			icon: '❌',
			emoji: '🔴',
			prefix: 'ERROR',
		},
		[LogLevel.WARN]: {
			name: 'WARN',
			color: Colors.BRIGHT_YELLOW,
			bgColor: Colors.BG_YELLOW,
			icon: '⚠️',
			emoji: '🟡',
			prefix: 'WARN',
		},
		[LogLevel.INFO]: {
			name: 'INFO',
			color: Colors.BRIGHT_BLUE,
			bgColor: Colors.BG_BLUE,
			icon: 'ℹ️',
			emoji: '🔵',
			prefix: 'INFO',
		},
		[LogLevel.DEBUG]: {
			name: 'DEBUG',
			color: Colors.BRIGHT_MAGENTA,
			bgColor: Colors.BG_MAGENTA,
			icon: '🔍',
			emoji: '🟣',
			prefix: 'DEBUG',
		},
		[LogLevel.SUCCESS]: {
			name: 'SUCCESS',
			color: Colors.BRIGHT_GREEN,
			bgColor: Colors.BG_GREEN,
			icon: '✅',
			emoji: '🟢',
			prefix: 'SUCCESS',
		},
		[LogLevel.FLOW]: {
			name: 'FLOW',
			color: Colors.CYAN,
			bgColor: Colors.BG_CYAN,
			icon: '🔄',
			emoji: '🔄',
			prefix: 'FLOW',
		},
		[LogLevel.SECURITY]: {
			name: 'SECURITY',
			color: Colors.BRIGHT_RED,
			bgColor: Colors.BG_RED,
			icon: '🔒',
			emoji: '🔐',
			prefix: 'SECURITY',
		},
		[LogLevel.AUTH]: {
			name: 'AUTH',
			color: Colors.YELLOW,
			bgColor: Colors.BG_YELLOW,
			icon: '🔑',
			emoji: '🔑',
			prefix: 'AUTH',
		},
		[LogLevel.CONFIG]: {
			name: 'CONFIG',
			color: Colors.BLUE,
			bgColor: Colors.BG_BLUE,
			icon: '⚙️',
			emoji: '⚙️',
			prefix: 'CONFIG',
		},
		[LogLevel.API]: {
			name: 'API',
			color: Colors.GREEN,
			bgColor: Colors.BG_GREEN,
			icon: '🌐',
			emoji: '🌐',
			prefix: 'API',
		},
		[LogLevel.STORAGE]: {
			name: 'STORAGE',
			color: Colors.MAGENTA,
			bgColor: Colors.BG_MAGENTA,
			icon: '💾',
			emoji: '💾',
			prefix: 'STORAGE',
		},
		[LogLevel.UI]: {
			name: 'UI',
			color: Colors.CYAN,
			bgColor: Colors.BG_CYAN,
			icon: '🎨',
			emoji: '🎨',
			prefix: 'UI',
		},
		[LogLevel.DISCOVERY]: {
			name: 'DISCOVERY',
			color: Colors.YELLOW,
			bgColor: Colors.BG_YELLOW,
			icon: '🔍',
			emoji: '🔍',
			prefix: 'DISCOVERY',
		},
	};

	constructor() {
		this.info('EnhancedLoggingService', 'Enhanced logging system initialized');
	}

	/**
	 * Configure logging behavior
	 */
	configure(config: Partial<LogConfig>): void {
		this.config = { ...this.config, ...config };
	}

	/**
	 * Get current configuration
	 */
	getConfig(): LogConfig {
		return { ...this.config };
	}

	/**
	 * Create a banner for log entries
	 */
	private createBanner(level: LogLevel, module: string): string {
		if (!this.config.enableBanners) return '';

		const config = this.levelConfigs[level];
		const width = 120;
		const borderChar = '═';
		const sideChar = '║';

		let banner = '\n';
		banner += this.colorize(borderChar.repeat(width), config.color);
		banner += '\n';

		// Header line
		const header = `${config.icon} ${config.name} - ${module}`;
		const padding = Math.max(0, width - header.length - 4);
		banner += this.colorize(
			`${sideChar} ${header}${' '.repeat(padding)} ${sideChar}`,
			config.color
		);
		banner += '\n';

		banner += this.colorize(borderChar.repeat(width), config.color);
		banner += '\n';

		return banner;
	}

	/**
	 * Create a footer for log entries
	 */
	private createFooter(level: LogLevel): string {
		if (!this.config.enableBanners) return '';

		const config = this.levelConfigs[level];
		const width = 120;
		const borderChar = '═';

		let footer = this.colorize(borderChar.repeat(width), config.color);
		footer += '\n';
		footer += this.colorize(`${config.icon} END OF ${config.name} ENTRY`, config.color);
		footer += '\n';
		footer += this.colorize(borderChar.repeat(width), config.color);
		footer += '\n\n';

		return footer;
	}

	/**
	 * Apply colors to text
	 */
	private colorize(text: string, color: string): string {
		if (!this.config.enableColors) return text;
		return `${color}${text}${Colors.RESET}`;
	}

	/**
	 * Format timestamp
	 */
	private formatTimestamp(): string {
		const now = new Date();
		const iso = now.toISOString();
		const local = now.toLocaleString('en-US', {
			timeZone: 'America/Chicago',
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false,
		});
		return `${local} (${iso})`;
	}

	/**
	 * Format log entry with enhanced styling
	 */
	private formatLogEntry(entry: LogEntry): string {
		const config = this.levelConfigs[entry.level];
		let formatted = '';

		// Add banner
		formatted += this.createBanner(entry.level, entry.module);

		// Timestamp
		const timestamp = this.formatTimestamp();
		formatted += this.colorize(`📅 Timestamp: ${timestamp}\n`, Colors.CYAN);

		// Level and module
		const levelText = `${config.icon} ${config.name}`;
		formatted += this.colorize(`🏷️  Level: ${levelText}\n`, config.color);
		formatted += this.colorize(`📦 Module: ${entry.module}\n`, Colors.BLUE);

		// Message
		formatted += this.colorize(`📝 Message: ${entry.message}\n`, Colors.WHITE);

		// Duration if available
		if (entry.duration) {
			const durationColor = entry.duration > 1000 ? Colors.YELLOW : Colors.GREEN;
			formatted += this.colorize(`⏱️  Duration: ${entry.duration}ms\n`, durationColor);
		}

		// Data if available
		if (entry.data && Object.keys(entry.data).length > 0) {
			formatted += this.colorize(`📊 Data:\n`, Colors.MAGENTA);
			const dataStr = JSON.stringify(entry.data, null, 2);
			const dataLines = dataStr.split('\n');
			dataLines.forEach((line) => {
				formatted += this.colorize(`   ${line}\n`, Colors.DIM);
			});
		}

		// Stack trace if available
		if (entry.stackTrace) {
			formatted += this.colorize(`📚 Stack Trace:\n`, Colors.RED);
			const stackLines = entry.stackTrace.split('\n');
			stackLines.forEach((line) => {
				formatted += this.colorize(`   ${line}\n`, Colors.DIM);
			});
		}

		// Add footer
		formatted += this.createFooter(entry.level);

		return formatted;
	}

	/**
	 * Internal logging method
	 */
	private log(
		level: LogLevel,
		module: string,
		message: string,
		data?: unknown,
		duration?: number,
		stackTrace?: string
	): void {
		// Check if we should log this level
		if (level > this.config.minLogLevel) {
			return;
		}

		const entry: LogEntry = {
			timestamp: new Date().toISOString(),
			level,
			module,
			message,
		};

		if (data !== undefined) entry.data = data;
		if (duration !== undefined) entry.duration = duration;
		if (stackTrace !== undefined) entry.stackTrace = stackTrace;

		// Add to memory buffer
		this.logs.push(entry);

		// Maintain memory limit
		if (this.logs.length > this.config.maxMemoryLogs) {
			this.logs = this.logs.slice(-this.config.maxMemoryLogs);
		}

		// Output to console
		if (this.config.enableConsoleOutput) {
			const formatted = this.formatLogEntry(entry);
			console.log(formatted);
		}

		// Output to file (send to server endpoint)
		if (this.config.enableFileOutput) {
			this.sendToServer(entry);
		}
	}

	/**
	 * Send log entry to server for file writing
	 */
	private async sendToServer(entry: LogEntry): Promise<void> {
		const config = this.levelConfigs[entry.level];
		try {
			await fetch('/__client-log', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					level: config.name.toLowerCase(),
					message: entry.message,
					meta: {
						module: entry.module,
						data: entry.data,
						duration: entry.duration,
						timestamp: entry.timestamp,
					},
				}),
			});
		} catch (error) {
			// Silent fail to avoid infinite loops
			console.error('Failed to send log to server:', error);
		}
	}

	// Public logging methods
	error(module: string, message: string, data?: unknown, stackTrace?: string): void {
		this.log(LogLevel.ERROR, module, message, data, undefined, stackTrace);
	}

	warn(module: string, message: string, data?: unknown): void {
		this.log(LogLevel.WARN, module, message, data);
	}

	info(module: string, message: string, data?: unknown): void {
		this.log(LogLevel.INFO, module, message, data);
	}

	debug(module: string, message: string, data?: unknown): void {
		this.log(LogLevel.DEBUG, module, message, data);
	}

	success(module: string, message: string, data?: unknown, duration?: number): void {
		this.log(LogLevel.SUCCESS, module, message, data, duration);
	}

	flow(module: string, message: string, data?: unknown, duration?: number): void {
		this.log(LogLevel.FLOW, module, message, data, duration);
	}

	security(module: string, message: string, data?: unknown): void {
		this.log(LogLevel.SECURITY, module, message, data);
	}

	auth(module: string, message: string, data?: unknown): void {
		this.log(LogLevel.AUTH, module, message, data);
	}

	logConfig(module: string, message: string, data?: unknown): void {
		this.log(LogLevel.CONFIG, module, message, data);
	}

	api(module: string, message: string, data?: unknown, duration?: number): void {
		this.log(LogLevel.API, module, message, data, duration);
	}

	storage(module: string, message: string, data?: unknown): void {
		this.log(LogLevel.STORAGE, module, message, data);
	}

	ui(module: string, message: string, data?: unknown): void {
		this.log(LogLevel.UI, module, message, data);
	}

	discovery(module: string, message: string, data?: unknown): void {
		this.log(LogLevel.DISCOVERY, module, message, data);
	}

	/**
	 * Get all logs
	 */
	getLogs(): LogEntry[] {
		return [...this.logs];
	}

	/**
	 * Clear all logs
	 */
	clearLogs(): void {
		this.logs = [];
	}

	/**
	 * Export logs with enhanced formatting
	 */
	exportLogs(): string {
		return this.logs.map((entry) => this.formatLogEntry(entry)).join('\n');
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
			const levelName = this.levelConfigs[log.level].name;
			stats.byLevel[levelName] = (stats.byLevel[levelName] || 0) + 1;
			stats.byModule[log.module] = (stats.byModule[log.module] || 0) + 1;
		}

		return stats;
	}
}

// Export singleton instance
export const enhancedLogger = new EnhancedLoggingService();
export default enhancedLogger;
