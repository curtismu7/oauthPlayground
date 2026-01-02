/**
 * @file analyticsLoggerV8.ts
 * @module v8/utils
 * @description Silent analytics logger that doesn't spam console with connection errors
 * @version 8.0.0
 *
 * Uses navigator.sendBeacon which is designed for analytics and doesn't throw errors
 * or log to console when the server is unavailable.
 */

/**
 * Silently send analytics log to ingest endpoint
 * Uses navigator.sendBeacon which is designed for analytics and fails silently
 * @param data - Analytics data to send
 */
export function sendAnalyticsLog(data: Record<string, unknown>): void {
	try {
		// Use navigator.sendBeacon which is designed for analytics and doesn't log errors
		// It only supports Blob or FormData, so we convert JSON to Blob
		const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
		const url = 'http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c';

		// sendBeacon returns true if queued successfully, false otherwise
		// It doesn't throw errors or log to console
		navigator.sendBeacon(url, blob);
	} catch {
		// Silently ignore any errors (shouldn't happen with sendBeacon, but just in case)
	}
}
