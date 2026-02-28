/**
 * @file V8ToV9WorkerTokenStatusAdapter.ts
 * @module services/v9
 * @description Migration adapter for V8 workerTokenStatusService to V9
 * @version 9.0.0
 * @since 2026-02-28
 *
 * This adapter provides backward compatibility for V8 code using workerTokenStatusServiceV8
 * while internally using the new V9WorkerTokenStatusService.
 *
 * Usage:
 * // Replace V8 import:
 * // import { checkWorkerTokenStatus, formatTimeRemaining } from '@/v8/services/workerTokenStatusServiceV8';
 *
 * // With V9 adapter:
 * // import { checkWorkerTokenStatus, formatTimeRemaining } from '@/services/v9/V8ToV9WorkerTokenStatusAdapter';
 */

import {
	V9checkWorkerTokenStatus,
	V9checkWorkerTokenStatusSync,
	V9formatTimeRemaining,
	V9getExpirationWarning,
	V9getStatusBadgeStyle,
	V9getStatusColor,
	V9getStatusIcon,
	V9TokenStatus,
	V9TokenStatusInfo,
	V9validateWorkerToken,
} from './V9WorkerTokenStatusService';

// Re-export V9 types with V8 names for compatibility
export type TokenStatus = V9TokenStatus;
export type TokenStatusInfo = V9TokenStatusInfo;

// Re-export V9 functions with V8 names for drop-in replacement
export const checkWorkerTokenStatus = V9checkWorkerTokenStatus;
export const checkWorkerTokenStatusSync = V9checkWorkerTokenStatusSync;
export const formatTimeRemaining = V9formatTimeRemaining;
export const getStatusColor = V9getStatusColor;
export const getStatusIcon = V9getStatusIcon;
export const getExpirationWarning = V9getExpirationWarning;
export const validateWorkerToken = V9validateWorkerToken;

// Enhanced V9 functions not available in V8 (optional)
export const getStatusBadgeStyle = V9getStatusBadgeStyle;

/**
 * Migration helper to check if code is using V8 or V9 patterns
 * Returns recommendations for migration
 */
export const analyzeV8Usage = (
	_filePath: string
): {
	v8Patterns: string[];
	v9Recommendations: string[];
	migrationComplexity: 'low' | 'medium' | 'high';
} => {
	// This would be used by migration tools to analyze usage patterns
	// For now, return basic structure
	return {
		v8Patterns: [
			'workerTokenStatusServiceV8 imports',
			'localStorage direct access',
			'V8-specific error handling',
		],
		v9Recommendations: [
			'Use V9WorkerTokenStatusService directly',
			'Leverage unifiedWorkerTokenService',
			'Use enhanced V9 error handling',
		],
		migrationComplexity: 'low',
	};
};

/**
 * Batch migration helper for multiple components
 * Helps migrate multiple files from V8 to V9 patterns
 */
export const migrateMultipleComponents = async (
	_componentPaths: string[]
): Promise<{
	migrated: string[];
	failed: string[];
	errors: string[];
}> => {
	const results = {
		migrated: [] as string[],
		failed: [] as string[],
		errors: [] as string[],
	};

	// This would implement actual migration logic
	// For now, return structure
	return results;
};

// Default export for easy importing
export default {
	checkWorkerTokenStatus,
	checkWorkerTokenStatusSync,
	formatTimeRemaining,
	getStatusColor,
	getStatusIcon,
	getExpirationWarning,
	validateWorkerToken,
	getStatusBadgeStyle,
	analyzeV8Usage,
	migrateMultipleComponents,
};
