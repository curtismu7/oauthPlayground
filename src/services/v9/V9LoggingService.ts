// src/services/v9/V9LoggingService.ts
/**
 * V9 structured logging service for flows and unified UI.
 * Drop-in capable replacement for unifiedFlowLoggerServiceV8U with V9-agnostic context.
 * Use for new V9 flows and when migrating callers from unifiedFlowLoggerServiceV8U.
 */

import { logger as baseLogger } from '@/utils/logger';

const MODULE_TAG = '[📊 V9-LOGGING]';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'success';

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
	debug: 0,
	info: 1,
	success: 1,
	warn: 2,
	error: 3,
};

const getMinimumLogLevel = (): LogLevel => {
	if (import.meta.env.PROD) return 'error';
	return 'warn';
};

export interface LogContext {
	flowType?: string;
	specVersion?: string;
	step?: number;
	operation?: string;
	credentials?: Record<string, unknown>;
	[key: string]: unknown;
}

export interface PerformanceMetric {
	operation: string;
	duration: number;
	flowType?: string;
	timestamp: number;
}

const maxMetrics = 100;
const maxHistory = 200;

let performanceMetrics: PerformanceMetric[] = [];
let logHistory: Array<{
	level: LogLevel;
	message: string;
	context: LogContext;
	timestamp: number;
}> = [];
let minimumLogLevel: LogLevel = getMinimumLogLevel();

function sanitizeContext(ctx: LogContext): LogContext {
	const out = { ...ctx };
	if (out.credentials && typeof out.credentials === 'object') {
		const creds = { ...(out.credentials as Record<string, unknown>) };
		if (creds.clientSecret !== undefined) creds.clientSecret = '[REDACTED]';
		if (creds.privateKey !== undefined) creds.privateKey = '[REDACTED]';
		out.credentials = creds;
	}
	return out;
}

function formatMessage(level: LogLevel, message: string, context: LogContext): string {
	const emoji: Record<LogLevel, string> = {
		debug: '🔍',
		info: 'ℹ️',
		warn: '⚠️',
		error: '❌',
		success: '✅',
	};
	const parts = [MODULE_TAG, emoji[level]];
	if (context.flowType) parts.push(`[${context.flowType}]`);
	if (context.specVersion) parts.push(`[${context.specVersion}]`);
	if (context.step !== undefined) parts.push(`[Step ${context.step}]`);
	if (context.operation) parts.push(`[${context.operation}]`);
	parts.push(message);
	return parts.join(' ');
}

function shouldLog(level: LogLevel): boolean {
	return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[minimumLogLevel];
}

function log(level: LogLevel, message: string, context: LogContext = {}): void {
	if (!shouldLog(level)) return;
	const sanitized = sanitizeContext(context);
	const formatted = formatMessage(level, message, sanitized);

	logHistory.push({ level, message, context: sanitized, timestamp: Date.now() });
	if (logHistory.length > maxHistory) logHistory.shift();

	const logData = Object.keys(sanitized).length > 0 ? sanitized : undefined;
	switch (level) {
		case 'debug':
			baseLogger.debug('V9LoggingService', formatted, logData ?? '');
			break;
		case 'info':
		case 'success':
			baseLogger.info('V9LoggingService', formatted, logData ?? '');
			break;
		case 'warn':
			baseLogger.warn('V9LoggingService', formatted, logData ?? '');
			break;
		case 'error':
			baseLogger.error('V9LoggingService', formatted, logData ?? '');
			break;
	}
}

export const V9LoggingService = {
	setMinimumLogLevel(level: LogLevel): void {
		minimumLogLevel = level;
	},

	shouldLog,

	log(level: LogLevel, message: string, context: LogContext = {}): void {
		log(level, message, context);
	},

	debug(message: string, context: LogContext = {}): void {
		log('debug', message, context);
	},

	info(message: string, context: LogContext = {}): void {
		log('info', message, context);
	},

	warn(message: string, context: LogContext = {}): void {
		log('warn', message, context);
	},

	error(message: string, context: LogContext = {}, err?: Error): void {
		const ctx: LogContext = { ...context };
		if (err) {
			ctx.error = { name: err.name, message: err.message, stack: err.stack };
		}
		log('error', message, ctx);
	},

	success(message: string, context: LogContext = {}): void {
		log('success', message, context);
	},

	startPerformance(operation: string, context: LogContext = {}): () => void {
		const start = performance.now();
		const flowType = context.flowType;
		return () => {
			const duration = performance.now() - start;
			performanceMetrics.push({
				operation,
				duration,
				flowType,
				timestamp: Date.now(),
			});
			if (performanceMetrics.length > maxMetrics) performanceMetrics.shift();
			V9LoggingService.debug(`Performance: ${operation}`, {
				...context,
				duration: `${duration.toFixed(2)}ms`,
			});
		};
	},

	getPerformanceMetrics(): PerformanceMetric[] {
		return [...performanceMetrics];
	},

	getLogHistory() {
		return [...logHistory];
	},

	clearHistory(): void {
		logHistory = [];
		performanceMetrics = [];
	},

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

export default V9LoggingService;
