/**
 * @file analyticsHelperV8.ts
 * @module v8/utils
 * @description Safe analytics helper utility to replace hardcoded fetch calls
 * @version 8.0.0
 * @since 2025-01-XX
 *
 * This utility provides a simple interface to replace hardcoded analytics fetch calls
 * with the safe analytics fetch that handles connection errors gracefully.
 */

/**
 * Safe analytics logging function that replaces hardcoded fetch calls
 * This function will silently fail if the analytics server is not available
 *
 * @param location - Code location identifier (e.g., 'FileName.tsx:123')
 * @param message - Log message
 * @param data - Additional data to log
 * @param sessionId - Session identifier (defaults to 'debug-session')
 * @param runId - Run identifier (defaults to 'run1')
 * @param hypothesisId - Hypothesis identifier (optional)
 */
export async function logAnalytics(
	_location: string,
	_message: string,
	_data: Record<string, unknown> = {},
	_sessionId: string = 'debug-session',
	_runId: string = 'run1',
	_hypothesisId?: string
): Promise<void> {
	// Completely silent - no analytics calls to prevent connection errors
	// This eliminates all ERR_CONNECTION_REFUSED errors from analytics
	return Promise.resolve();
}

/**
 * Quick analytics log for common cases
 * Shorthand for logAnalytics with default parameters
 */
export const log = logAnalytics;
