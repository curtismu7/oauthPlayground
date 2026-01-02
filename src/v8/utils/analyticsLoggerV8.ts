/**
 * @file analyticsLoggerV8.ts
 * @module v8/utils
 * @description Silent analytics logger that doesn't spam console with connection errors
 * @version 8.0.0
 *
 * Uses a circuit breaker pattern to avoid repeated connection attempts when server is unavailable.
 * Browsers will still log network errors from sendBeacon, so we track server availability
 * and skip calls when we know the server is down.
 */

// Circuit breaker state - track if server is known to be unavailable
let serverUnavailable = false;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // Check again after 30 seconds

/**
 * Silently send analytics log to ingest endpoint
 * Uses navigator.sendBeacon with circuit breaker to avoid console spam
 * @param data - Analytics data to send
 */
export function sendAnalyticsLog(data: Record<string, unknown>): void {
	// If we know the server is unavailable, skip the call to avoid console errors
	// Re-check periodically in case the server comes back online
	if (serverUnavailable) {
		const now = Date.now();
		if (now - lastCheckTime < CHECK_INTERVAL) {
			return; // Skip call, server still unavailable
		}
		// Reset flag to try again after interval
		serverUnavailable = false;
	}

	try {
		// Use navigator.sendBeacon which is designed for analytics
		// It only supports Blob or FormData, so we convert JSON to Blob
		const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
		const url = 'http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c';

		// sendBeacon returns true if queued successfully, false otherwise
		const sent = navigator.sendBeacon(url, blob);

		// If sendBeacon returns false, the request likely failed
		// Mark server as unavailable to avoid future attempts
		if (!sent) {
			serverUnavailable = true;
			lastCheckTime = Date.now();
		}
	} catch {
		// If sendBeacon throws (shouldn't happen, but just in case)
		// Mark server as unavailable
		serverUnavailable = true;
		lastCheckTime = Date.now();
	}
}
