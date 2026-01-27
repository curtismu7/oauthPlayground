/**
 * @file consoleMigrationHelper.ts
 * @module utils
 * @description Helper utilities for migrating console statements to logging service
 * @version 1.0.0
 * @since 2025-01-27
 */

import { logger, LogLevel } from '@/services/loggingService';

/**
 * Mapping of console methods to logging service methods
 */
const consoleMapping = {
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
	'console.error(': 'logger.error(',
	'console.error(`': 'logger.error(',
	'console.warn(': 'logger.warn(',
	'console.warn(`': 'logger.warn(',
	
	// Info logging
	'console.log(': 'logger.info(',
	'console.log(`': 'logger.info(',
	'console.info(': 'logger.info(',
	'console.info(`': 'logger.info(',
	
	// Debug logging
	'console.debug(': 'logger.debug(',
	'console.debug(`': 'logger.debug(',
};

/**
 * Generate replacement patterns for a specific module
 */
export function generateReplacements(moduleName: string) {
	return {
		// Error patterns
		'console.error(': `logger.error('${moduleName}', `,
		'console.error(`': `logger.error('${moduleName}', `,
		'console.warn(': `logger.warn('${moduleName}', `,
		'console.warn(`': `logger.warn('${moduleName}', `,
		
		// Info patterns
		'console.log(': `logger.info('${moduleName}', `,
		'console.log(`': `logger.info('${moduleName}', `,
		'console.info(': `logger.info('${moduleName}', `,
		'console.info(`': `logger.info('${moduleName}', `,
		
		// Debug patterns
		'console.debug(': `logger.debug('${moduleName}', `,
		'console.debug(`': `logger.debug('${moduleName}', `,
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
 * console.log('User logged in', { userId: 123 });
 * 
 * After:
 * logger.info('AuthContext', 'User logged in', { userId: 123 });
 * 
 * Or with module logger:
 * const log = createModuleLogger('src/contexts/AuthContext.tsx');
 * log.info('User logged in', { userId: 123 });
 */
