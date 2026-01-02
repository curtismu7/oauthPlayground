/**
 * @file analyticsLoggerV8.ts
 * @module v8/utils
 * @description Silent analytics logger that doesn't spam console with connection errors
 * @version 8.3.0
 *
 * Uses a circuit breaker pattern to avoid repeated connection attempts when server is unavailable.
 * Since browsers log network errors from sendBeacon, we track failures and skip subsequent calls.
 * The first error may still appear, but subsequent calls will be suppressed.
 */

// Circuit breaker state - track if server is known to be unavailable
let serverUnavailable = false;
let lastCheckTime = 0;
let failureCount = 0;
const CHECK_INTERVAL = 60000; // Re-check after 60 seconds
const MAX_FAILURES = 2; // Mark as unavailable after 2 failures

/**
 * Silently send analytics log to ingest endpoint
 * Uses circuit breaker to avoid console spam when server is unavailable
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
		failureCount = 0;
	}

	// Try to send analytics using sendBeacon
	// Note: Browsers may still log the first error, but we'll suppress subsequent ones
	try {
		const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
		const url = 'http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c';
		const sent = navigator.sendBeacon(url, blob);

		// If sendBeacon returns false, increment failure count
		// After MAX_FAILURES, mark server as unavailable
		if (!sent) {
			failureCount += 1;
			if (failureCount >= MAX_FAILURES) {
				serverUnavailable = true;
				lastCheckTime = Date.now();
			}
		} else {
			// Success - reset failure count
			failureCount = 0;
		}
	} catch {
		// If sendBeacon throws (shouldn't happen, but just in case)
		failureCount += 1;
		if (failureCount >= MAX_FAILURES) {
			serverUnavailable = true;
			lastCheckTime = Date.now();
		}
	}
}
