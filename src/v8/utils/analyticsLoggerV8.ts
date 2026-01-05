/**
 * @file analyticsLoggerV8.ts
 * @module v8/utils
 * @description Silent analytics logger that doesn't spam console with connection errors
 * @version 8.4.0
 *
 * Uses an aggressive circuit breaker pattern to avoid repeated connection attempts when server is unavailable.
 * Since browsers log network errors from sendBeacon even when we can't catch them, we track rapid calls
 * and immediately suppress subsequent calls if multiple occur within a short time window.
 */

// Circuit breaker state - track if server is known to be unavailable
let serverUnavailable = false;
let lastCheckTime = 0;
let lastCallTime = 0;
let rapidCallCount = 0;
const CHECK_INTERVAL = 60000; // Re-check after 60 seconds
const RAPID_CALL_WINDOW = 2000; // 2 seconds - if multiple calls within this window, server is likely down
const RAPID_CALL_THRESHOLD = 2; // If 2+ calls within window, mark as unavailable

/**
 * Silently send analytics log to ingest endpoint
 * Uses aggressive circuit breaker to avoid console spam when server is unavailable
 * @param data - Analytics data to send
 */
export function sendAnalyticsLog(data: Record<string, unknown>): void {
	const now = Date.now();

	// If we know the server is unavailable, skip the call to avoid console errors
	// Re-check periodically in case the server comes back online
	if (serverUnavailable) {
		if (now - lastCheckTime < CHECK_INTERVAL) {
			return; // Skip call, server still unavailable
		}
		// Reset flag to try again after interval
		serverUnavailable = false;
		rapidCallCount = 0;
		lastCallTime = 0;
	}

	// Track rapid calls - if multiple calls occur within a short window, server is likely unavailable
	// This helps us detect connection failures even though sendBeacon doesn't throw errors
	if (now - lastCallTime < RAPID_CALL_WINDOW) {
		rapidCallCount += 1;
		if (rapidCallCount >= RAPID_CALL_THRESHOLD) {
			// Multiple rapid calls detected - server is likely unavailable
			// Suppress subsequent calls immediately to avoid console spam
			serverUnavailable = true;
			lastCheckTime = now;
			return; // Skip this call
		}
	} else {
		// Reset rapid call counter if enough time has passed
		rapidCallCount = 1;
	}
	lastCallTime = now;

	// Try to send analytics using sendBeacon
	// Note: Browsers will log ERR_CONNECTION_REFUSED errors, but we suppress subsequent calls
	// The first 1-2 errors may appear, but then all subsequent calls are suppressed
	try {
		const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
		const url = 'http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c';
		navigator.sendBeacon(url, blob);
		// Note: sendBeacon returns true even when server is unavailable (it just queues the request)
		// We rely on rapid call detection instead to suppress subsequent calls
	} catch {
		// If sendBeacon throws (shouldn't happen, but just in case)
		serverUnavailable = true;
		lastCheckTime = now;
	}
}
