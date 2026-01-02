/**
 * @file analyticsLoggerV8.ts
 * @module v8/utils
 * @description Silent analytics logger that doesn't spam console with connection errors
 * @version 8.2.0
 *
 * Uses a circuit breaker pattern to avoid repeated connection attempts when server is unavailable.
 * Since browsers log network errors from sendBeacon, we use a cached availability check
 * and skip calls when server is known to be unavailable.
 */

// Circuit breaker state - track if server is known to be unavailable
let serverUnavailable = false;
let lastCheckTime = 0;
let availabilityCheckPromise: Promise<boolean> | null = null;
const CHECK_INTERVAL = 30000; // Check again after 30 seconds
const SERVER_CHECK_TIMEOUT = 100; // Short timeout for availability check (100ms)

/**
 * Check if analytics server is available
 * Uses a lightweight OPTIONS request with short timeout
 * Caches the result to avoid repeated checks
 */
async function checkServerAvailability(): Promise<boolean> {
	// If we already have a check in progress, return that promise
	if (availabilityCheckPromise) {
		return availabilityCheckPromise;
	}

	const url = 'http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c';
	const controller = new AbortController();
	const timeoutId = setTimeout(() => controller.abort(), SERVER_CHECK_TIMEOUT);

	availabilityCheckPromise = (async () => {
		try {
			// Use OPTIONS request which is lightweight and doesn't require CORS preflight
			// Use no-cors mode to avoid CORS errors - we just want to know if server responds
			await fetch(url, {
				method: 'OPTIONS',
				signal: controller.signal,
				mode: 'no-cors',
			});
			clearTimeout(timeoutId);
			return true; // Request was sent (server might be available)
		} catch {
			clearTimeout(timeoutId);
			return false; // Server is not available
		} finally {
			// Clear the promise after a short delay to allow reuse
			setTimeout(() => {
				availabilityCheckPromise = null;
			}, 1000);
		}
	})();

	return availabilityCheckPromise;
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
		availabilityCheckPromise = null; // Clear cached check
	}

	// Check server availability and send analytics if available
	// Use fire-and-forget pattern to avoid blocking
	void (async () => {
		try {
			const isAvailable = await checkServerAvailability();
			if (!isAvailable) {
				serverUnavailable = true;
				lastCheckTime = Date.now();
				return; // Don't send analytics if server is unavailable
			}

			// Server appears to be available, send the analytics
			const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
			const url = 'http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c';
			const sent = navigator.sendBeacon(url, blob);

			// If sendBeacon returns false, mark server as unavailable
			if (!sent) {
				serverUnavailable = true;
				lastCheckTime = Date.now();
			}
		} catch {
			// Silently ignore errors and mark server as unavailable
			serverUnavailable = true;
			lastCheckTime = Date.now();
		}
	})();
}
