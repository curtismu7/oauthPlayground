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
import { logger as baseLogger } from '../../utils/logger';
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
	flowType?: FlowType | undefined;
	specVersion?: SpecVersion | undefined;
	step?: number | undefined;
	operation?: string | undefined;
	credentials?: Partial<UnifiedFlowCredentials> | undefined; // Sanitized (no secrets)
	[key: string]: unknown;
}

export interface PerformanceMetric {
	operation: string;
	duration: number;
	flowType?: FlowType | undefined;
	timestamp: number;
}

// Private state for the service
let performanceMetrics: PerformanceMetric[] = [];
const maxMetrics = 100;
let logHistory: Array<{
	level: LogLevel;
	message: string;
	context: LogContext;
	timestamp: number;
}> = [];
const maxHistory = 200;
let minimumLogLevel: LogLevel = getMinimumLogLevel();

/**
 * Centralized logging service for Unified Flow with structured logging,
 * performance tracking, and error monitoring.
 */
export const unifiedFlowLoggerService = {
	/**
	 * Set minimum log level (useful for debugging)
	 */
	setMinimumLogLevel(level: LogLevel): void {
		minimumLogLevel = level;
	},

	/**
	 * Check if a log level should be output
	 */
	shouldLog(level: LogLevel): boolean {
		return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minimumLogLevel];
	},

	/**
	 * Sanitize credentials for logging (remove secrets)
	 */
	sanitizeCredentials(
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
	},

	/**
	 * Format log message with context
	 */
	formatMessage(level: LogLevel, message: string, context: LogContext): string {
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
	},

	/**
	 * Log a message with context
	 */
	log(level: LogLevel, message: string, context: LogContext = {}): void {
		// Check if this log level should be output
		if (!unifiedFlowLoggerService.shouldLog(level)) {
			return;
		}

		// Sanitize credentials in context
		const sanitizedContext: LogContext = {
			...context,
			credentials: unifiedFlowLoggerService.sanitizeCredentials(context.credentials),
		};

		// Format message
		const formattedMessage = unifiedFlowLoggerService.formatMessage(
			level,
			message,
			sanitizedContext
		);

		// Add to history (always track, even if not logged to console)
		logHistory.push({
			level,
			message,
			context: sanitizedContext,
			timestamp: Date.now(),
		});

		// Enforce history limit
		if (logHistory.length > maxHistory) {
			logHistory.shift();
		}

		// Log to console with appropriate method
		const logData = Object.keys(sanitizedContext).length > 0 ? sanitizedContext : undefined;

		switch (level) {
			case 'debug':
				baseLogger.debug('UnifiedFlowLoggerServiceV8U', formattedMessage, logData || '');
				break;
			case 'info':
				baseLogger.info('UnifiedFlowLoggerServiceV8U', formattedMessage, logData || '');
				break;
			case 'warn':
				baseLogger.warn('UnifiedFlowLoggerServiceV8U', formattedMessage, logData || '');
				break;
			case 'error':
				baseLogger.error('UnifiedFlowLoggerServiceV8U', formattedMessage, logData || '');
				break;
			case 'success':
				baseLogger.info('UnifiedFlowLoggerServiceV8U', formattedMessage, logData || '');
				break;
		}
	},

	/**
	 * Log debug message
	 */
	debug(message: string, context: LogContext = {}): void {
		unifiedFlowLoggerService.log('debug', message, context);
	},

	/**
	 * Log info message
	 */
	info(message: string, context: LogContext = {}): void {
		unifiedFlowLoggerService.log('info', message, context);
	},

	/**
	 * Log warning message
	 */
	warn(message: string, context: LogContext = {}): void {
		unifiedFlowLoggerService.log('warn', message, context);
	},

	/**
	 * Log error message
	 */
	error(message: string, context: LogContext = {}, error?: Error): void {
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
		unifiedFlowLoggerService.log('error', message, errorContext);
	},

	/**
	 * Log success message
	 */
	success(message: string, context: LogContext = {}): void {
		unifiedFlowLoggerService.log('success', message, context);
	},

	/**
	 * Start performance tracking
	 */
	startPerformance(operation: string, context: LogContext = {}): () => void {
		const startTime = performance.now();
		const flowType = context.flowType;

		return () => {
			const duration = performance.now() - startTime;
			const metric: PerformanceMetric = {
				operation,
				duration,
				flowType: flowType || undefined,
				timestamp: Date.now(),
			};

			performanceMetrics.push(metric);

			// Enforce metrics limit
			if (performanceMetrics.length > maxMetrics) {
				performanceMetrics.shift();
			}

			// Log performance
			unifiedFlowLoggerService.debug(`Performance: ${operation}`, {
				...context,
				duration: `${duration.toFixed(2)}ms`,
			});
		};
	},

	/**
	 * Get performance metrics
	 */
	getPerformanceMetrics(): PerformanceMetric[] {
		return [...performanceMetrics];
	},

	/**
	 * Get log history
	 */
	getLogHistory(): Array<{
		level: LogLevel;
		message: string;
		context: LogContext;
		timestamp: number;
	}> {
		return [...logHistory];
	},

	/**
	 * Clear log history
	 */
	clearHistory(): void {
		logHistory = [];
		performanceMetrics = [];
	},

	/**
	 * Export logs as JSON
	 */
	exportLogs(): string {
		return JSON.stringify(
			{
				history: logHistory,
				performance: performanceMetrics,
				exportedAt: new Date().toISOString(),
			},
			null,
			2
		);
	},
};

// Export singleton instance for convenience
export const logger = unifiedFlowLoggerService;

// Make available globally for debugging
if (typeof window !== 'undefined') {
	(
		window as { UnifiedFlowLoggerService?: typeof unifiedFlowLoggerService }
	).UnifiedFlowLoggerService = unifiedFlowLoggerService;
}
