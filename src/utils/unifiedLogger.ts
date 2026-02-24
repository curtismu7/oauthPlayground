// src/utils/unifiedLogger.ts
/**
 * Unified Logging System - Consistent logging across all components
 *
 * Provides standardized logging with:
 * - Consistent banners and footers
 * - Color-coded log levels with icons
 * - Structured context information
 * - File and console output
 * - Performance metrics
 * - Error tracking
 */

import fs from 'fs';
import path from 'path';

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
export type LogCategory =
	| 'SERVER'
	| 'CLIENT'
	| 'API'
	| 'SMS'
	| 'EMAIL'
	| 'FIDO'
	| 'AUTHZ'
	| 'STARTUP'
	| 'PINGONE'
	| 'CLIENT_CODE'
	| 'FLOW'
	| 'SYSTEM';

export interface LogContext {
	category?: LogCategory;
	flowType?: string;
	step?: string;
	operation?: string;
	environmentId?: string;
	clientId?: string;
	userId?: string;
	requestId?: string;
	duration?: number;
	[key: string]: unknown;
}

// Log level configuration with colors and icons
const LOG_CONFIG: Record<
	LogLevel,
	{
		icon: string;
		emoji: string;
		color: string;
		bgColor: string;
		priority: number;
	}
> = {
	DEBUG: {
		icon: '🐛',
		emoji: '🔍',
		color: '#8b5cf6', // Purple
		bgColor: '#f3f4f6',
		priority: 0,
	},
	INFO: {
		icon: 'ℹ️',
		emoji: '🔵',
		color: '#3b82f6', // Blue
		bgColor: '#eff6ff',
		priority: 1,
	},
	SUCCESS: {
		icon: '✅',
		emoji: '🟢',
		color: '#10b981', // Green
		bgColor: '#f0fdf4',
		priority: 1,
	},
	WARN: {
		icon: '⚠️',
		emoji: '🟡',
		color: '#f59e0b', // Yellow
		bgColor: '#fffbeb',
		priority: 2,
	},
	ERROR: {
		icon: '❌',
		emoji: '🔴',
		color: '#ef4444', // Red
		bgColor: '#fef2f2',
		priority: 3,
	},
};

// Category configuration with icons and colors
const CATEGORY_CONFIG: Record<
	LogCategory,
	{
		icon: string;
		emoji: string;
		color: string;
		description: string;
	}
> = {
	SERVER: {
		icon: '🖥️',
		emoji: '🖥️',
		color: '#6366f1',
		description: 'Backend server operations',
	},
	CLIENT: {
		icon: '💻',
		emoji: '💻',
		color: '#8b5cf6',
		description: 'Frontend client operations',
	},
	API: {
		icon: '🔌',
		emoji: '🔌',
		color: '#3b82f6',
		description: 'API requests and responses',
	},
	SMS: {
		icon: '📱',
		emoji: '📱',
		color: '#10b981',
		description: 'SMS/MFA operations',
	},
	EMAIL: {
		icon: '📧',
		emoji: '📧',
		color: '#06b6d4',
		description: 'Email/MFA operations',
	},
	FIDO: {
		icon: '🔐',
		emoji: '🔐',
		color: '#8b5cf6',
		description: 'FIDO/Passkey operations',
	},
	AUTHZ: {
		icon: '🔄',
		emoji: '🔄',
		color: '#f59e0b',
		description: 'OAuth authorization redirects',
	},
	STARTUP: {
		icon: '🚀',
		emoji: '🚀',
		color: '#10b981',
		description: 'Application startup',
	},
	PINGONE: {
		icon: '🔑',
		emoji: '🔑',
		color: '#3b82f6',
		description: 'PingOne API operations',
	},
	CLIENT_CODE: {
		icon: '💻',
		emoji: '💻',
		color: '#8b5cf6',
		description: 'Code generation operations',
	},
	FLOW: {
		icon: '🌊',
		emoji: '🌊',
		color: '#06b6d4',
		description: 'Flow execution',
	},
	SYSTEM: {
		icon: '⚙️',
		emoji: '⚙️',
		color: '#6b7280',
		description: 'System operations',
	},
};

// Log file paths
const LOG_PATHS = {
	SERVER: 'logs/server.log',
	CLIENT: 'logs/client.log',
	API: 'logs/pingone-api.log',
	SMS: 'logs/sms.log',
	EMAIL: 'logs/email.log',
	FIDO: 'logs/fido.log',
	AUTHZ: 'logs/authz-redirects.log',
	STARTUP: 'logs/startup.log',
	PINGONE: 'logs/pingone-api.log', // Consolidated
	CLIENT_CODE: 'logs/client-code.log',
	FLOW: 'logs/flow.log',
	SYSTEM: 'logs/system.log',
};

/**
 * Format log message with consistent structure
 */
const formatLogMessage = (
	level: LogLevel,
	message: string,
	context?: LogContext,
	category?: LogCategory
): string => {
	const now = new Date();
	const timestamp = now.toISOString();
	const localTime = now.toLocaleString('en-US', {
		timeZone: 'America/Chicago',
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
		hour12: false,
	});

	const levelConfig = LOG_CONFIG[level];
	const categoryConfig = context?.category ? CATEGORY_CONFIG[context.category] : null;

	const width = 120;
	const borderChar = '═';
	const sideChar = '║';
	const reset = '\x1b[0m';

	let formatted = '\n';

	// Top banner with category if available
	if (categoryConfig) {
		const categoryBanner = `${categoryConfig.emoji} ${categoryConfig.description.toUpperCase()}`;
		formatted += `${borderChar.repeat(width)}\n`;
		formatted += `${sideChar} ${categoryConfig.color}${categoryBanner}${reset} ${sideChar}\n`;
		formatted += `${borderChar.repeat(width)}\n`;
	}

	// Main log entry banner
	const mainBanner = `${levelConfig.icon} ${level} ${categoryConfig ? `(${categoryConfig.description})` : ''}`;
	formatted += `${borderChar.repeat(width)}\n`;

	// Header line with level and category
	const header = `${levelConfig.icon} ${level}${categoryConfig ? ` (${categoryConfig.description})` : ''}`;
	const padding = Math.max(0, width - header.length - 4);
	formatted += `${sideChar} ${levelConfig.color}${header}${reset}${' '.repeat(padding)} ${sideChar}\n`;

	// Timestamp
	formatted += `${sideChar} 📅 Timestamp: ${localTime} (${timestamp}) ${sideChar}\n`;

	// Context information if provided
	if (context) {
		const contextLines: string[] = [];

		if (context.flowType) contextLines.push(`🌊 Flow: ${context.flowType}`);
		if (context.step) contextLines.push(`📋 Step: ${context.step}`);
		if (context.operation) contextLines.push(`⚙️ Operation: ${context.operation}`);
		if (context.environmentId) contextLines.push(`🆔 Environment: ${context.environmentId}`);
		if (context.clientId) contextLines.push(`👤 Client: ${context.clientId}`);
		if (context.userId) contextLines.push(`👤 User: ${context.userId}`);
		if (context.requestId) contextLines.push(`🆔 Request: ${context.requestId}`);
		if (context.duration) contextLines.push(`⏱️ Duration: ${context.duration}ms`);

		contextLines.forEach((line, index) => {
			const contextPadding = index === 0 ? '📋 Context:' : '           ';
			formatted += `${sideChar} ${contextPadding} ${levelConfig.color}${line}${reset} ${sideChar}\n`;
		});
	}

	// Message with proper wrapping
	const messageLines = message.split('\n');
	formatted += `${sideChar} 📝 Message: ${levelConfig.color}${messageLines[0]}${reset} ${sideChar}\n`;

	// Additional message lines if any
	for (let i = 1; i < messageLines.length; i++) {
		formatted += `${sideChar}           ${levelConfig.color}${messageLines[i]}${reset} ${sideChar}\n`;
	}

	// Bottom banner
	formatted += `${borderChar.repeat(width)}\n`;
	formatted += `${sideChar} ${levelConfig.icon} END OF ${level} ENTRY${categoryConfig ? ` (${categoryConfig.description})` : ''} ${sideChar}\n`;
	formatted += `${borderChar.repeat(width)}\n\n`;

	return formatted;
};

/**
 * Write log message to file and console
 */
const writeLog = (
	level: LogLevel,
	message: string,
	logPath: string,
	context?: LogContext,
	category?: LogCategory,
	consoleOutput: boolean = true
): void => {
	const formattedMessage = formatLogMessage(level, message, context, category);

	// Console output with colors
	if (consoleOutput) {
		const levelConfig = LOG_CONFIG[level];
		const coloredMessage = `${levelConfig.color}${message}${'\x1b[0m'}`;

		switch (level) {
			case 'ERROR':
				console.error(coloredMessage);
				break;
			case 'WARN':
				console.warn(coloredMessage);
				break;
			case 'SUCCESS':
				console.log(coloredMessage);
				break;
			case 'INFO':
				console.log(coloredMessage);
				break;
			case 'DEBUG':
				console.debug(coloredMessage);
				break;
		}
	}

	// File output
	try {
		// Ensure log directory exists
		const logDir = path.dirname(logPath);
		if (!fs.existsSync(logDir)) {
			fs.mkdirSync(logDir, { recursive: true });
		}

		// Write to file asynchronously
		fs.appendFile(logPath, formattedMessage, 'utf8', (err) => {
			if (err) {
				console.error(`[Logging Error] Failed to write to ${logPath}:`, err);
			}
		});
	} catch (error) {
		console.error('[Logging Error] File system error:', error);
	}
};

/**
 * Unified Logger Class
 */
export class UnifiedLogger {
	private category?: LogCategory;
	private context?: LogContext;
	private consoleOutput: boolean;

	constructor(category?: LogCategory, context?: LogContext, consoleOutput: boolean = true) {
		this.category = category;
		this.context = context;
		this.consoleOutput = consoleOutput;
	}

	/**
	 * Update logging context
	 */
	setContext(context: LogContext): void {
		this.context = { ...this.context, ...context };
	}

	/**
	 * Update logging category
	 */
	setCategory(category: LogCategory): void {
		this.category = category;
	}

	/**
	 * Log debug message
	 */
	debug(message: string, context?: LogContext): void {
		this.log('DEBUG', message, context);
	}

	/**
	 * Log info message
	 */
	info(message: string, context?: LogContext): void {
		this.log('INFO', message, context);
	}

	/**
	 * Log success message
	 */
	success(message: string, context?: LogContext): void {
		this.log('SUCCESS', message, context);
	}

	/**
	 * Log warning message
	 */
	warn(message: string, context?: LogContext): void {
		this.log('WARN', message, context);
	}

	/**
	 * Log error message
	 */
	error(message: string, context?: LogContext): void {
		this.log('ERROR', message, context);
	}

	/**
	 * Generic log method
	 */
	private log(level: LogLevel, message: string, context?: LogContext): void {
		const mergedContext = { ...this.context, ...context };
		const logPath = this.category ? LOG_PATHS[this.category] : LOG_PATHS.SYSTEM;

		writeLog(level, message, logPath, mergedContext, this.category, this.consoleOutput);
	}

	/**
	 * Create child logger with additional context
	 */
	child(additionalContext: LogContext): UnifiedLogger {
		return new UnifiedLogger(
			this.category,
			{ ...this.context, ...additionalContext },
			this.consoleOutput
		);
	}

	/**
	 * Create child logger with different category
	 */
	childWithCategory(category: LogCategory, additionalContext?: LogContext): UnifiedLogger {
		return new UnifiedLogger(
			category,
			{ ...this.context, ...additionalContext },
			this.consoleOutput
		);
	}
}

/**
 * Default logger instances for common categories
 */
export const loggers = {
	server: new UnifiedLogger('SERVER'),
	client: new UnifiedLogger('CLIENT'),
	api: new UnifiedLogger('API'),
	sms: new UnifiedLogger('SMS'),
	email: new UnifiedLogger('EMAIL'),
	fido: new UnifiedLogger('FIDO'),
	authz: new UnifiedLogger('AUTHZ'),
	startup: new UnifiedLogger('STARTUP'),
	pingone: new UnifiedLogger('PINGONE'),
	clientCode: new UnifiedLogger('CLIENT_CODE'),
	flow: new UnifiedLogger('FLOW'),
	system: new UnifiedLogger('SYSTEM'),
};

/**
 * Convenience functions for direct logging
 */
export const log = {
	debug: (message: string, context?: LogContext) => loggers.system.debug(message, context),
	info: (message: string, context?: LogContext) => loggers.system.info(message, context),
	success: (message: string, context?: LogContext) => loggers.system.success(message, context),
	warn: (message: string, context?: LogContext) => loggers.system.warn(message, context),
	error: (message: string, context?: LogContext) => loggers.system.error(message, context),
};

/**
 * Create a new logger instance
 */
export function createLogger(
	category?: LogCategory,
	context?: LogContext,
	consoleOutput?: boolean
): UnifiedLogger {
	return new UnifiedLogger(category, context, consoleOutput);
}

/**
 * Initialize log files with headers
 */
export function initializeLogFiles(): void {
	const headers = {
		sms: {
			icon: '📱',
			title: 'SMS Flow API Call Log',
			description: 'SMS OTP device authentication and registration API calls',
			includes: [
				'Device registration for SMS devices',
				'Device activation for SMS devices',
				'Device authentication/verification for SMS devices',
				'Policy lookups and configuration',
				'Any other API calls detected as part of the SMS flow',
			],
		},
		email: {
			icon: '📧',
			title: 'Email Flow API Call Log',
			description: 'Email OTP device authentication and registration API calls',
			includes: [
				'Device registration for Email devices',
				'Device activation for Email devices',
				'Device authentication/verification for Email devices',
				'Policy lookups and configuration',
				'Any other API calls detected as part of the Email flow',
			],
		},
		fido: {
			icon: '🔐',
			title: 'FIDO2 Flow API Call Log',
			description: 'FIDO2/Passkey device authentication and registration API calls',
			includes: [
				'Device registration for FIDO2 devices',
				'Device activation for FIDO2 devices',
				'Device authentication/verification for FIDO2 devices',
				'Policy lookups and configuration',
				'Any other API calls detected as part of the FIDO2 flow',
			],
		},
		authz: {
			icon: '🔄',
			title: 'Authorization Code Flow Redirects Log',
			description: 'OAuth 2.0 Authorization Code Flow redirects and navigation events',
			includes: [
				'Authorization URL generation (REDIRECT 1: Frontend → PingOne)',
				'Callback redirects (REDIRECT 2: PingOne → Frontend)',
				'Token exchange API calls (NOT redirects)',
				'Post-token-exchange navigation',
				'URL parameter cleanup events',
				'State parameter validation',
				'PKCE code verifier/challenge details',
			],
		},
	};

	// Initialize each log file with header
	Object.entries(headers).forEach(([category, config]) => {
		const logPath = LOG_PATHS[category as LogCategory];
		if (logPath) {
			const headerContent = `
${'═'.repeat(120)}
${config.icon} ${config.title}
${'═'.repeat(120)}

This log file contains all PingOne API calls related to ${config.description.toLowerCase()}.

${config.includes.map((item) => `  • ${item}`).join('\n')}

Flow detection is based on:
  • deviceType metadata in API call
  • URL patterns (e.g., /fido2, /sms, /email, etc.)
  • Operation names and context

Log File Information:
  • Created: ${new Date().toLocaleString()}
  • Version: 9.3.6
  • Format: Unified Logging System V9

${'═'.repeat(120)}
${'║'} ${config.icon} START OF LOG FILE ${'║'}
${'═'.repeat(120)}

`;

			try {
				const logDir = path.dirname(logPath);
				if (!fs.existsSync(logDir)) {
					fs.mkdirSync(logDir, { recursive: true });
				}
				fs.writeFileSync(logPath, headerContent, 'utf8');
			} catch (error) {
				console.error(`[Logging Error] Failed to initialize ${logPath}:`, error);
			}
		}
	});
}

export default UnifiedLogger;
