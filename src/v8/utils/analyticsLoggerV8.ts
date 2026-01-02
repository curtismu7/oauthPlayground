/**
 * @file analyticsLoggerV8.ts
 * @module v8/utils
 * @description Silent analytics logger that doesn't spam console with connection errors
 * @version 8.1.0
 *
 * Uses a circuit breaker pattern to avoid repeated connection attempts when server is unavailable.
 * Since browsers log network errors from sendBeacon, we check server availability first
 * using a lightweight HEAD request with a very short timeout.
 */

// Circuit breaker state - track if server is known to be unavailable
let serverUnavailable = false;
let lastCheckTime = 0;
const CHECK_INTERVAL = 30000; // Check again after 30 seconds
const SERVER_CHECK_TIMEOUT = 50; // Very short timeout for availability check (50ms)

/**
 * Check if analytics server is available
 * Uses a lightweight HEAD request with short timeout
 */
async function checkServerAvailability(): Promise<boolean> {
	const url = 'http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c';
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), SERVER_CHECK_TIMEOUT);

	try {
		const response = await fetch(url, {
			method: 'HEAD',
			signal: controller.signal,
			mode: 'no-cors', // Avoid CORS errors, we just want to know if server responds
		});
		clearTimeout(timeoutId);
		return true; // Server responded (even if with error, it means server is up)
	} catch {
		clearTimeout(timeoutId);
		return false; // Server is not available
	}
}

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
	}

	// Check server availability asynchronously (don't await to avoid blocking)
	// If server is unavailable, mark it and skip this call
	void (async () => {
		const isAvailable = await checkServerAvailability();
		if (!isAvailable) {
			serverUnavailable = true;
			lastCheckTime = Date.now();
			return; // Don't send analytics if server is unavailable
		}

		// Server is available, send the analytics
		try {
			const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
			const url = 'http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c';
			navigator.sendBeacon(url, blob);
		} catch {
			// Silently ignore errors
			serverUnavailable = true;
			lastCheckTime = Date.now();
		}
	})();
}
