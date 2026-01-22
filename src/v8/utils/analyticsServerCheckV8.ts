/**
 * @file analyticsServerCheckV8.ts
 * @module v8/utils
 * @description Check if analytics server is available before making calls
 * @version 1.0.0
 * 
 * This utility checks if the analytics server at 127.0.0.1:7242 is available
 * to prevent console spam from connection refused errors.
 * 
 * NOTE: Analytics completely disabled to prevent connection errors
 */

// Analytics completely disabled to prevent connection errors
const ANALYTICS_SERVER_ENDPOINT = null;
const CHECK_TIMEOUT = 100; // 100ms timeout for availability check
const CACHE_DURATION = 300000; // Cache result for 5 minutes (reduce check frequency)
const FAILED_CACHE_DURATION = 600000; // Cache failure for 10 minutes (once it fails, don't check often)

let serverAvailable: boolean | null = null;
let lastCheckTime: number = 0;
let hasEverSucceeded = false; // Track if server has ever been available

/**
 * Check if analytics server is available (always returns false - disabled)
 */
export async function isAnalyticsServerAvailable(): Promise<boolean> {
	// Analytics is completely disabled
	return false;
}

/**
 * Safely send analytics data only if server is available (always disabled)
 */
export async function safeAnalyticsFetch(data: Record<string, unknown>): Promise<void> {
	// Analytics is completely disabled - no fetch calls made
	return;
}

/**
 * Reset cache (useful for testing or manual refresh)
 */
export function resetAnalyticsServerCache(): void {
	serverAvailable = null;
	lastCheckTime = 0;
}
