/**
 * @file consoleMigrationHelper.ts
 * @module utils
 * @description Helper utilities for migrating console statements to logging service
 * @version 1.0.0
 * @since 2025-01-27
 */

import { LogLevel } from '@/services/loggingService';

import { logger } from '../utils/logger';

/**
 * Mapping of console methods to logging service methods
 */
const _consoleMapping = {
	log: { level: LogLevel.INFO, method: logger.info.bind(logger) },
	info: { level: LogLevel.INFO, method: logger.info.bind(logger) },
	warn: { level: LogLevel.WARN, method: logger.warn.bind(logger) },
	error: { level: LogLevel.ERROR, method: logger.error.bind(logger) },
	debug: { level: LogLevel.DEBUG, method: logger.debug.bind(logger) },
};

/**
 * Extract module name from file path
 */
function extractModuleName(filePath: string): string {
	// Extract the relevant part of the file path
	const parts = filePath.split('/');
	const fileName = parts[parts.length - 1];
	const moduleName = fileName.replace(/\.(ts|tsx)$/, '');
	return moduleName;
}

/**
 * Create a module-specific logger
 */
export function createModuleLogger(filePath: string) {
	const moduleName = extractModuleName(filePath);

	return {
		error: (message: string, data?: any) => logger.error(moduleName, message, data),
		warn: (message: string, data?: any) => logger.warn(moduleName, message, data),
		info: (message: string, data?: any) => logger.info(moduleName, message, data),
		debug: (message: string, data?: any) => logger.debug(moduleName, message, data),
	};
}

/**
 * Common patterns for console statement replacement
 */
export const consoleReplacements = {
	// Error logging
	'logger.error(': 'logger.error(',
	'logger.error(`': 'logger.error(',
	'logger.warn(': 'logger.warn(',
	'logger.warn(`': 'logger.warn(',

	// Info logging
	'logger.info(': 'logger.info(',
	'logger.info(`': 'logger.info(',

	// Debug logging
	'logger.debug(': 'logger.debug(',
	'logger.debug(`': 'logger.debug(',
};

/**
 * Generate replacement patterns for a specific module
 */
export function generateReplacements(moduleName: string) {
	return {
		// Error patterns
		'logger.error(': `logger.error('${moduleName}', `,
		'logger.error(`': `logger.error('${moduleName}', `,
		'logger.warn(': `logger.warn('${moduleName}', `,
		'logger.warn(`': `logger.warn('${moduleName}', `,

		// Info patterns
		'logger.info(': `logger.info('${moduleName}', `,
		'logger.info(`': `logger.info('${moduleName}', `,

		// Debug patterns
		'logger.debug(': `logger.debug('${moduleName}', `,
		'logger.debug(`': `logger.debug('${moduleName}', `,
	};
}

/**
 * Batch replacement for common console patterns
 */
export function replaceConsoleStatements(code: string, moduleName: string): string {
	const replacements = generateReplacements(moduleName);
	let result = code;

	// Apply replacements
	for (const [oldPattern, newPattern] of Object.entries(replacements)) {
		result = result.replace(new RegExp(oldPattern, 'g'), newPattern);
	}

	return result;
}

/**
 * Example usage:
 *
 * Before:
 * logger.info('User logged in', { userId: 123 });
 *
 * After:
 * logger.info('AuthContext', 'User logged in', { userId: 123 });
 *
 * Or with module logger:
 * const log = createModuleLogger('src/contexts/AuthContext.tsx');
 * logger.info('User logged in', { userId: 123 });
 */
