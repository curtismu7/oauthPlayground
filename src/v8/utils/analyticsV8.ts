/**
 * @file analyticsV8.ts
 * @module v8/utils
 * @description Professional analytics utility - fire-and-forget, completely silent
 * @version 2.0.0
 *
 * This is a clean, professional analytics implementation that:
 * - Never logs errors to console
 * - Never checks availability (just tries and fails silently)
 * - Uses fire-and-forget pattern (non-blocking)
 * - Can be easily disabled via environment/config
 * - Centralizes all analytics logic
 *
 * Usage:
 *   import { analytics } from '@/v8/utils/analyticsV8';
 *   analytics.log({ location: 'MyComponent.tsx:42', message: 'User clicked button' });
 */

// Analytics completely disabled to prevent connection errors
const ANALYTICS_ENDPOINT = null;
const _REQUEST_TIMEOUT = 2000; // 2 seconds max wait

// Global flag to disable analytics (useful for testing or production)
let analyticsEnabled = false; // Disabled by default

/**
 * Check if analytics should be sent
 * Can be disabled via environment variable or manual override
 */
function shouldSendAnalytics(): boolean {
	if (!analyticsEnabled) {
		return false;
	}

	// Optionally check for environment variable
	if (
		typeof window !== 'undefined' &&
		(window as unknown as { __DISABLE_ANALYTICS__?: boolean }).__DISABLE_ANALYTICS__
	) {
		return false;
	}

	return true;
}

/**
 * Fire-and-forget analytics logging
 * Completely silent - never throws, never logs errors
 */
function sendAnalytics(_data: Record<string, unknown>): void {
	if (!shouldSendAnalytics() || !ANALYTICS_ENDPOINT) {
		return;
	}

	// Analytics is disabled - no fetch calls made
	return;
}

/**
 * Professional Analytics API
 *
 * All methods are fire-and-forget and completely silent.
 * They never throw errors or log to console.
 */
export const analytics = {
	/**
	 * Log analytics event
	 * @param data - Analytics data (location, message, data, etc.)
	 */
	log(data: {
		location?: string;
		message?: string;
		data?: Record<string, unknown>;
		sessionId?: string;
		runId?: string;
		hypothesisId?: string;
		[key: string]: unknown;
	}): void {
		sendAnalytics(data);
	},

	/**
	 * Disable analytics (useful for testing or production)
	 */
	disable(): void {
		analyticsEnabled = false;
	},

	/**
	 * Enable analytics
	 */
	enable(): void {
		analyticsEnabled = true;
	},

	/**
	 * Check if analytics is enabled
	 */
	isEnabled(): boolean {
		return analyticsEnabled;
	},
};

/**
 * Default export for convenience
 */
export default analytics;
