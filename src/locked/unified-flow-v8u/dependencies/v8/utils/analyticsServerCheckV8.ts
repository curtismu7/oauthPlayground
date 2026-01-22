/**
 * @file analyticsServerCheckV8.ts
 * @module v8/utils
 * @description Check if analytics server is available before making calls
 * @version 1.0.0
 * 
 * to prevent console spam from connection refused errors.
 */

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

	// Check server availability with a quick HEAD request
	// Suppress console errors by catching and ignoring
	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

		// Use a promise that never rejects to avoid console errors
		const checkPromise = fetch(ANALYTICS_SERVER_URL, {
			method: 'HEAD',
			signal: controller.signal,
			mode: 'no-cors', // Avoid CORS errors
		}).catch(() => {
			// Suppress errors - just return null
			return null;
		});

		const response = await checkPromise;
		clearTimeout(timeoutId);
		
		if (response !== null) {
			// If we get here, server is reachable (even if CORS blocks it)
			serverAvailable = true;
			hasEverSucceeded = true;
			lastCheckTime = now;
			return true;
		} else {
			// Request failed - server not available
			serverAvailable = false;
			lastCheckTime = now;
			return false;
		}
	} catch (error) {
		// Server is not available - suppress error
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
