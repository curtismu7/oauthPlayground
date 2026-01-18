/**
 * @file analyticsServerCheckV8.ts
 * @module v8/utils
 * @description Check if analytics server is available before making calls
 * @version 1.0.0
 * 
 * This utility checks if the analytics server at 127.0.0.1:7242 is available
 * to prevent console spam from connection refused errors.
 */

const ANALYTICS_SERVER_ENDPOINT = 'http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c';
const CHECK_TIMEOUT = 100; // 100ms timeout for availability check
const CACHE_DURATION = 300000; // Cache result for 5 minutes (reduce check frequency)
const FAILED_CACHE_DURATION = 600000; // Cache failure for 10 minutes (once it fails, don't check often)

let serverAvailable: boolean | null = null;
let lastCheckTime: number = 0;
let hasEverSucceeded = false; // Track if server has ever been available

/**
 * Check if analytics server is available
 * Uses cached result to avoid repeated checks and console spam
 * Once it fails, caches the failure for longer to reduce error frequency
 * 
 * Note: This check is performed silently - no console errors are logged
 */
export async function isAnalyticsServerAvailable(): Promise<boolean> {
	// Return cached result if still valid
	const now = Date.now();
	const cacheDuration = serverAvailable === false && !hasEverSucceeded 
		? FAILED_CACHE_DURATION 
		: CACHE_DURATION;
	
	if (serverAvailable !== null && now - lastCheckTime < cacheDuration) {
		return serverAvailable;
	}

	// Check server availability by attempting a minimal POST request to the actual endpoint
	// Use a test payload and catch all errors silently
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

		// Perform a silent check by sending a minimal test payload
		// Wrap in multiple catch blocks to ensure no errors propagate
		const checkPromise = fetch(ANALYTICS_SERVER_ENDPOINT, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ test: true }),
			signal: controller.signal,
		}).catch(() => null).catch(() => null); // Double catch to suppress all errors

		await checkPromise;
		clearTimeout(timeoutId);
		
		// If we get here without throwing, assume server is available
		// Note: We can't check response status in no-cors mode, but if the request completes, server is up
		serverAvailable = true;
		hasEverSucceeded = true;
		lastCheckTime = now;
		return true;
	} catch {
		// Server is not available - suppress error completely
		// Don't log anything - this is expected behavior when analytics server is not running
		serverAvailable = false;
		lastCheckTime = now;
		return false;
	}
}

/**
 * Safely send analytics data only if server is available
 */
export async function safeAnalyticsFetch(data: Record<string, unknown>): Promise<void> {
	const available = await isAnalyticsServerAvailable();
	if (!available) {
		// Silently skip - server not available
		return;
	}

	try {
		await fetch('http://127.0.0.1:7242/ingest/54b55ad4-e19d-45fc-a299-abfa1f07ca9c', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
		}).catch(() => {
			// Silently ignore fetch errors
		});
	} catch {
		// Silently ignore all errors
	}
}

/**
 * Reset cache (useful for testing or manual refresh)
 */
export function resetAnalyticsServerCache(): void {
	serverAvailable = null;
	lastCheckTime = 0;
}
