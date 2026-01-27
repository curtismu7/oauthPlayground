/**
 * @file unifiedFlowLoggerServiceV8U.ts
 * @module v8u/services
 * @description Structured logging service for Unified Flow
 * @version 8.0.0
 * @since 2025-11-23
 *
 * Provides centralized, structured logging for Unified Flow with:
 * - Consistent log format with emoji tags
 * - Context-aware logging (flow type, spec version, step)
 * - Log levels (debug, info, warn, error, success)
 * - Performance metrics
 * - Error tracking
 */

import type { FlowType, SpecVersion } from '@/v8/services/specVersionServiceV8';
import type { UnifiedFlowCredentials } from './unifiedFlowIntegrationV8U';

const MODULE_TAG = '[📊 UNIFIED-FLOW-LOGGER-V8U]';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

// Log level priority (higher number = higher priority)
const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	success: 1,
	warn: 2,
	error: 3,
};

// Determine minimum log level based on environment
const getMinimumLogLevel = (): LogLevel => {
	// In production, only show errors
	if (import.meta.env.PROD) {
		return 'error';
	}
	// In development, show warnings and errors only (reduce chatter)
	return 'warn';
};

export interface LogContext {
	flowType?: FlowType;
	specVersion?: SpecVersion;
	step?: number;
	operation?: string;
	credentials?: Partial<UnifiedFlowCredentials>; // Sanitized (no secrets)
	[key: string]: unknown;
}

export interface PerformanceMetric {
	operation: string;
	duration: number;
	flowType?: FlowType;
	timestamp: number;
}

/**
 * UnifiedFlowLoggerService
 *
 * Centralized logging service for Unified Flow with structured logging,
 * performance tracking, and error monitoring.
 */
export class UnifiedFlowLoggerService {
	private static performanceMetrics: PerformanceMetric[] = [];
	private static maxMetrics = 100;
	private static logHistory: Array<{
		level: LogLevel;
		message: string;
		context: LogContext;
		timestamp: number;
	}> = [];
	private static maxHistory = 200;
	private static minimumLogLevel: LogLevel = getMinimumLogLevel();

	/**
	 * Set minimum log level (useful for debugging)
	 */
	static setMinimumLogLevel(level: LogLevel): void {
		UnifiedFlowLoggerService.minimumLogLevel = level;
	}

	/**
	 * Check if a log level should be output
	 */
	private static shouldLog(level: LogLevel): boolean {
		return (
			LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[UnifiedFlowLoggerService.minimumLogLevel]
		);
	}

	/**
	 * Sanitize credentials for logging (remove secrets)
	 */
	private static sanitizeCredentials(
		credentials?: Partial<UnifiedFlowCredentials>
	): Partial<UnifiedFlowCredentials> | undefined {
		if (!credentials) return undefined;

		const sanitized = { ...credentials };
		if (sanitized.clientSecret) {
			sanitized.clientSecret = '[REDACTED]';
		}
		if ((sanitized as { privateKey?: string }).privateKey) {
			(sanitized as { privateKey?: string }).privateKey = '[REDACTED]';
		}
		return sanitized;
	}

	/**
	 * Format log message with context
	 */
	private static formatMessage(level: LogLevel, message: string, context: LogContext): string {
		const parts: string[] = [MODULE_TAG];

		// Add level indicator
		const levelEmoji: Record<LogLevel, string> = {
			debug: '🔍',
			info: 'ℹ️',
			warn: '⚠️',
			error: '❌',
			success: '✅',
		};
		parts.push(levelEmoji[level]);

		// Add flow context
		if (context.flowType) {
			parts.push(`[${context.flowType}]`);
		}
		if (context.specVersion) {
			parts.push(`[${context.specVersion}]`);
		}
		if (context.step !== undefined) {
			parts.push(`[Step ${context.step}]`);
		}
		if (context.operation) {
			parts.push(`[${context.operation}]`);
		}

		parts.push(message);

		return parts.join(' ');
	}

	/**
	 * Log a message with context
	 */
	static log(level: LogLevel, message: string, context: LogContext = {}): void {
		// Check if this log level should be output
		if (!UnifiedFlowLoggerService.shouldLog(level)) {
			return;
		}

		// Sanitize credentials in context
		const sanitizedContext = {
			...context,
			credentials: UnifiedFlowLoggerService.sanitizeCredentials(context.credentials),
		};

		// Format message
		const formattedMessage = UnifiedFlowLoggerService.formatMessage(
			level,
			message,
			sanitizedContext
		);

		// Add to history (always track, even if not logged to console)
		UnifiedFlowLoggerService.logHistory.push({
			level,
			message,
			context: sanitizedContext,
			timestamp: Date.now(),
		});

		// Enforce history limit
		if (UnifiedFlowLoggerService.logHistory.length > UnifiedFlowLoggerService.maxHistory) {
			UnifiedFlowLoggerService.logHistory.shift();
		}

		// Log to console with appropriate method
		const logData = Object.keys(sanitizedContext).length > 0 ? sanitizedContext : undefined;

		switch (level) {
			case 'debug':
				console.debug(formattedMessage, logData || '');
				break;
			case 'info':
				console.log(formattedMessage, logData || '');
				break;
			case 'warn':
				console.warn(formattedMessage, logData || '');
				break;
			case 'error':
				console.error(formattedMessage, logData || '');
				break;
			case 'success':
				console.log(formattedMessage, logData || '');
				break;
		}
	}

	/**
	 * Log debug message
	 */
	static debug(message: string, context: LogContext = {}): void {
		UnifiedFlowLoggerService.log('debug', message, context);
	}

	/**
	 * Log info message
	 */
	static info(message: string, context: LogContext = {}): void {
		UnifiedFlowLoggerService.log('info', message, context);
	}

	/**
	 * Log warning message
	 */
	static warn(message: string, context: LogContext = {}): void {
		UnifiedFlowLoggerService.log('warn', message, context);
	}

	/**
	 * Log error message
	 */
	static error(message: string, context: LogContext = {}, error?: Error): void {
		const errorContext: LogContext = {
			...context,
			...(error && {
				error: {
					name: error.name,
					message: error.message,
					stack: error.stack,
				},
			}),
		};
		UnifiedFlowLoggerService.log('error', message, errorContext);
	}

	/**
	 * Log success message
	 */
	static success(message: string, context: LogContext = {}): void {
		UnifiedFlowLoggerService.log('success', message, context);
	}

	/**
	 * Start performance tracking
	 */
	static startPerformance(operation: string, context: LogContext = {}): () => void {
		const startTime = performance.now();
		const flowType = context.flowType;

		return () => {
			const duration = performance.now() - startTime;
			const metric: PerformanceMetric = {
				operation,
				duration,
				flowType,
				timestamp: Date.now(),
			};

			UnifiedFlowLoggerService.performanceMetrics.push(metric);

			// Enforce metrics limit
			if (
				UnifiedFlowLoggerService.performanceMetrics.length > UnifiedFlowLoggerService.maxMetrics
			) {
				UnifiedFlowLoggerService.performanceMetrics.shift();
			}

			// Log performance
			UnifiedFlowLoggerService.debug(`Performance: ${operation}`, {
				...context,
				duration: `${duration.toFixed(2)}ms`,
			});
		};
	}

	/**
	 * Get performance metrics
	 */
	static getPerformanceMetrics(): PerformanceMetric[] {
		return [...UnifiedFlowLoggerService.performanceMetrics];
	}

	/**
	 * Get log history
	 */
	static getLogHistory(): Array<{
		level: LogLevel;
		message: string;
		context: LogContext;
		timestamp: number;
	}> {
		return [...UnifiedFlowLoggerService.logHistory];
	}

	/**
	 * Clear log history
	 */
	static clearHistory(): void {
		UnifiedFlowLoggerService.logHistory = [];
		UnifiedFlowLoggerService.performanceMetrics = [];
	}

	/**
	 * Export logs as JSON
	 */
	static exportLogs(): string {
		return JSON.stringify(
			{
				history: UnifiedFlowLoggerService.logHistory,
				performance: UnifiedFlowLoggerService.performanceMetrics,
				exportedAt: new Date().toISOString(),
			},
			null,
			2
		);
	}
}

// Export singleton instance for convenience
export const logger = UnifiedFlowLoggerService;

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(window as { UnifiedFlowLoggerService?: typeof UnifiedFlowLoggerService }).UnifiedFlowLoggerService = UnifiedFlowLoggerService;
}
