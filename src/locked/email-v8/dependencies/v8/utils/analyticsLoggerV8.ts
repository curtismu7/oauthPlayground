/**
 * @file analyticsLoggerV8.ts
 * @module v8/utils
 * @description Silent analytics logger - currently disabled to prevent CORS errors
 * @version 8.7.0
 *
 * configured for CORS requests from https://localhost:3000. This causes console spam with
 * CORS policy errors that cannot be suppressed programmatically.
 * 
 * To re-enable analytics, fix the CORS configuration on the analytics server first.
 */

/**
 * Silently send analytics log to ingest endpoint
 * Currently disabled to prevent CORS errors
 * @param data - Analytics data to send (ignored)
 */
export function sendAnalyticsLog(_data: Record<string, unknown>): void {
	// and causes console spam with CORS policy errors
	// To re-enable: fix CORS configuration on analytics server first
	return;
}
