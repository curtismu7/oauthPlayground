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
 * Check if analytics server is available (silent during development)
 */
export async function isAnalyticsServerAvailable(): Promise<boolean> {
	const now = Date.now();
	
	// If we've never succeeded, check less frequently to avoid console spam
	const checkInterval = hasEverSucceeded ? CACHE_DURATION : FAILED_CACHE_DURATION;
	
	// Return cached result if still valid
	if (serverAvailable !== null && now - lastCheckTime < checkInterval) {
		return serverAvailable;
	}

	// In development, always assume server is not available unless explicitly enabled
	if (process.env.NODE_ENV === 'development' && !hasEverSucceeded) {
		serverAvailable = false;
		lastCheckTime = now;
		return false;
	}

	try {
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), CHECK_TIMEOUT);

		// Perform a silent check by sending a minimal test payload
		// Use no-cors mode to prevent console errors, but this means we can't check response status
		const checkPromise = fetch(ANALYTICS_SERVER_ENDPOINT, {
			method: 'POST',
			mode: 'no-cors', // This prevents console errors for cross-origin/cors issues
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ test: true }),
			signal: controller.signal,
			// Add keepalive to prevent connection pooling issues
			keepalive: false,
		});

		// Wait for the promise with timeout
		await Promise.race([
			checkPromise,
			new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), CHECK_TIMEOUT))
		]);
		
		clearTimeout(timeoutId);
		
		// If we get here without throwing, assume server is available
		// Note: With no-cors mode, we can't check response status, but if the request completes without error, server is up
		serverAvailable = true;
		hasEverSucceeded = true;
		lastCheckTime = now;
		return true;
	} catch {
		// Server is not available - suppress error completely
		// Don't log anything - this is expected behavior when analytics server is not running
		// Common errors: network errors, CORS errors, timeout, abort
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
		// Use the same error suppression techniques as the availability check
		const controller = new AbortController();
		const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout for actual analytics

		await fetch(ANALYTICS_SERVER_ENDPOINT, {
			method: 'POST',
			mode: 'no-cors', // Prevent console errors
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(data),
			signal: controller.signal,
			keepalive: false,
		}).catch(() => {
			// Silently ignore fetch errors
		});
		
		clearTimeout(timeoutId);
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
