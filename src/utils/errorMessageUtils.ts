/**
 * @file errorMessageUtils.ts
 * @module utils
 * @description Canonical error message extraction - single source of truth for "error instanceof Error ? error.message : fallback"
 * @version 1.0.0
 *
 * Consolidates 50+ duplicate inline patterns across the codebase.
 */

const DEFAULT_FALLBACK = 'An unknown error occurred';

/**
 * Extract a human-readable error message from various error types.
 * Use this instead of inline `error instanceof Error ? error.message : 'fallback'`.
 *
 * @param error - Error object (Error, string, object with message, or unknown)
 * @param fallback - Optional fallback when message cannot be extracted (default: 'An unknown error occurred')
 * @returns Human-readable error message
 */
export function getErrorMessage(error: unknown, fallback: string = DEFAULT_FALLBACK): string {
	if (error instanceof Error) {
		return error.message;
	}

	if (typeof error === 'string') {
		return error;
	}

	if (error && typeof error === 'object') {
		const obj = error as Record<string, unknown>;
		if (obj.message && typeof obj.message === 'string') {
			return obj.message;
		}
		if (obj.error && typeof obj.error === 'string') {
			return obj.error;
		}
		if (obj.error_description && typeof obj.error_description === 'string') {
			return obj.error_description;
		}
	}

	return fallback;
}
